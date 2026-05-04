# How We Built the AI Agent

A development narrative — not a usage guide. The usage guide is `app/AI_INTEGRATION_COMPLETE.md`. This file is about **how the AI system came to look the way it does**: what we tried, what we threw out, and the design rules that survived.

If you're reading this as a portfolio reviewer, the short version is:

> **MUDlands runs a local LLaMA 3.1 model (via Ollama) behind a circuit-breaker-protected service that generates NPCs, quests, monsters, and items on demand, with deterministic template fallback so the game never blocks on the LLM. A separate scheduled "AI character" subsystem drives in-world NPC behavior on a cron loop, giving the world a sense of life independent of player presence.**

The longer version is below.

---

## 1. Goal — What "AI agent" means in MUDlands

We use "AI agent" in two distinct senses, and it matters for the architecture:

### a) **AI as a content generator**
On-demand creation of game artifacts. A merchant in the marketplace, a quest in the forest, a monster in a ruined keep. The LLM is called with a structured prompt, returns JSON, the game ingests it. Stateless.

### b) **AI-driven NPCs ("AI characters")**
Long-lived, scheduled NPCs that take actions in the world on their own. Elder Thaddeus walks the town hall in the morning. The Veiled Scholar runs Shadowblight rituals at night. These are stateful agents with goals, schedules, and persistent story arcs.

These are different problems. Bundling them under one "AI" subsystem early on was a mistake we corrected — they now share the LLM client and nothing else.

---

## 2. Stage 1 — Picking the model and the host

**Options considered:**

| Option | Why we passed |
|---|---|
| OpenAI / Anthropic API | Per-request cost across millions of NPC interactions over a project's lifetime. Network dependency. |
| LLaMA 7B on CPU | Generation time too slow (>60s for a simple NPC). |
| LLaMA 13B on GPU | No GPU on the deployment host. |
| **LLaMA 3.1 8B via Ollama** | ✅ Right size for the host's 16 GB RAM, ~2–10 s generation, free, fully local. |

`llama3.1:8b` won on price (zero) and acceptable latency. It's noticeably worse than GPT-4-class output, but the structured-prompt + template-fallback strategy in §3 compensates.

**Lesson:** model choice is a host-specific decision. Don't pick the best model — pick the best model **the deployment can run**.

---

## 3. Stage 2 — Three-tier reliability

Earliest version: client calls `AIContentService.generateNPC()` → Ollama → JSON.parse → return.

Worked great until Ollama:
- OOMed during a quest-burst,
- Returned `{...} Sure! Here is the NPC: {...}` (chat-mode pollution wrapping the JSON),
- Hung for 4 minutes on a complex quest prompt.

Each of those is a player-facing dead-end. We rebuilt around three layers:

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1 — AI generation (Ollama / LLaMA 3.1 8B)              │
│   Best content, slowest, can fail                           │
└─────────────────────────────────────────────────────────────┘
                         │ on failure / circuit open
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 2 — Template fallback (deterministic JS)               │
│   Lore-consistent, fast (<1ms), worse content               │
└─────────────────────────────────────────────────────────────┘
                         │ on template misconfiguration
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 3 — Static canned content                              │
│   Hard-coded "generic merchant" — never crashes             │
└─────────────────────────────────────────────────────────────┘
```

### Circuit breaker

Wraps tier 1. States: `CLOSED` (normal) → `OPEN` (after 5 consecutive failures) → `HALF_OPEN` (one trial request after 60 s) → back to `CLOSED` on success.

While `OPEN`, every request short-circuits straight to tier 2. The breaker is process-local, which is fine because we run a single Node process behind PM2.

**Code:** `app/src/services/AIContentService.js` (look for `circuitBreaker` state machine and `_callOllama` retry path).

### Template fallback

For each content type we maintain a deterministic generator that produces lore-valid output without calling the LLM:

- `NPCFactory` has hand-written archetypes per (location, role) combination.
- `QuestManager` has a Mad-Libs-style template engine seeded with location + faction + difficulty.
- `MonsterFactory` rolls stats from the level + environment + type using D&D 5e-aligned tables.

Template output is always valid. It's just less surprising than what the LLM produces.

---

## 4. Stage 3 — Caching

`Generation time per NPC` × `NPCs per session` × `sessions per day` made it obvious that we'd be regenerating identical content constantly. Two players walking into the same tavern get the same merchant — same prompt, same output.

**Cache key:** SHA-256 of `(content_type, sorted-JSON of parameters)`.
**Store:** Redis on port 6380, separate from session Redis.
**TTL:** 1 hour for "ambient" content (room descriptions, generic NPCs), 24 hours for "anchor" content (named NPCs, quest givers).

**Why not just write to the DB?** We do — the `ai_content` Postgres table is the durable record (see schema in `app/AI_INTEGRATION_COMPLETE.md`). Redis is the hot cache on top for the latency win.

**Result:** ~80% cache hit rate in load tests. Of the 20% that miss, only 1–2% reach tier 1 because the rest are served from the DB record.

---

## 5. Stage 4 — Prompt design

The single biggest quality lever. Two prompt patterns we converged on:

### Structured-output prompt
For content types that get parsed back as JSON:

```
You are a worldbuilder for MUDlands. Output ONLY a JSON object matching
this exact schema:
  { "name": string, "race": string, "role": string, "personality": string,
    "knowledge": [string], "dialogue_samples": [string] }

Constraints:
- name must be culturally consistent with: {location.culture}
- role must be: {role}
- personality should be 2–3 sentences in active voice
- knowledge entries must reference the location: {location.name}

Now generate the NPC.
```

We learned the hard way to put "Output ONLY JSON" both at the top and bottom — small models drift between the constraint and the request.

### Story-driven prompt
For tier-2 AI characters (the scheduled NPCs):

The full system prompt lives at `app/mudlands_ai_analysis/AI_STORYTELLER_SYSTEM_PROMPT.md` — it primes the model with world state (Aethermoor, Year 1000 AU, post-Sundering), faction relationships, and the "what kind of character is needed" framing before any specific generation request.

Pattern: **load world context once per session, then issue cheap follow-up prompts within the same context window.** Drops the per-action prompt cost from ~2k to ~200 tokens.

---

## 6. Stage 5 — The scheduled "AI character" subsystem

This is the bit that makes the world feel alive: NPCs that don't wait for a player to walk in.

### Architecture

```
[cron, every hour]
        │
        ▼
auto_character_scheduler.js   ─── reads ──▶ activation_config.json
        │
        │ picks 1–N eligible characters (cooldown, time-of-day window)
        ▼
spawns a session per character (15–45 minutes wallclock)
        │
        │ inside each session:
        │   - load character_profiles/{name}.json
        │   - load world_data/story_state.json
        │   - prompt LLM in the persona of that character
        │   - apply effects to story_state.json
        │   - log to implementation_logs/
        ▼
session ends → state saved → next cron tick
```

### Why cron, not in-process

A scheduler living inside the game process tied character lifecycle to game-server uptime. Worse, a runaway character session (LLM hangs, infinite-loop in story logic) could tank the live game.

Moving it to cron gave us:
- **Crash isolation** — scheduler failure doesn't touch the game.
- **Independent deploy** — we can iterate on character prompts without bouncing the game.
- **Separate logs** — `implementation_logs/auto_character.log` is the single read-everything file for character-system debugging.
- **Trivial pause** — `crontab -e` and comment the line out.

### Activity windows

Characters don't run 24/7. The scheduler maps wallclock to in-world time-of-day:

| Wallclock | In-world | Intensity | Examples |
|---|---|---|---|
| 06:00–10:00 | Morning | Moderate | Council meetings, work routines |
| 11:00–14:00 | Midday | Low | Quiet, personal tasks |
| 18:00–22:00 | Evening | High | Social events, plot progression |
| 23:00–02:00 | Night | Mysterious | Cult rituals, spy meetings |

This shapes pacing — the world isn't dramatic at 6 AM, it's mundane. Drama clusters in the evening, mystery clusters at night. Players who log in at different times see different vibes from the same world.

### Character roster (5 anchor NPCs at decommission)

1. **Elder Thaddeus** — town leader, redemption arc
2. **Sister Morwyn** — prophetic healer, spiritual subplot
3. **Razorclaw** — Beast-kin outcast, social-conflict subplot
4. **Veiled Scholar** — secret cultist, the slow-burn antagonist
5. **Grizelda Ironfoot** — dwarf explorer, lost-tech subplot

Each lives as a JSON profile in `mudlands_ai_analysis/character_profiles/auto_players/active/`. The profile is the **persona contract** — backstory, motivations, speech patterns, schedule. The LLM is told to act in-character within those bounds.

---

## 7. Lessons that ended up as design rules

These are the rules we'd carry to the next AI-driven project:

1. **Never let the LLM be on the critical path.** Always have a deterministic fallback. Players forgive a generic NPC; they don't forgive a frozen tavern.
2. **Cache aggressively, key on content not request.** Identical prompts must hit the same key.
3. **Validate model output as if it's user input.** Schema-check, length-clamp, sanitize. The LLM is a stranger.
4. **Separate stateless generation from stateful agents.** They share the LLM client and nothing else.
5. **Cron beats in-process schedulers** for any agent that should outlive a single request.
6. **Prompt engineering is product engineering.** Treat prompts like code: version-controlled, reviewed, regression-tested.
7. **Pick the model your hardware runs, not the model you want.** A working 8B beats a fantasy 70B.

---

## 8. What's not built (and why)

Honest list:

- **Voice generation** — scoped out, no audio pipeline.
- **Multi-model routing** — would help (use a small model for room descriptions, a bigger one for quest plotting), never built.
- **Player-preference learning** — would require an analytics loop we never instrumented.
- **Real-time generation during combat** — latency window is too small for tier 1; we lean on pre-generated content.
- **Quest-chain coherence across sessions** — `story_state.json` tracks faction state but not narrative threading. Quest 2 doesn't currently know that Quest 1 happened to the same player.

These are the things you'd find first if you tried to revive and extend the project.

---

## File index

| Path | Role |
|---|---|
| `app/src/services/AIContentService.js` | Tier 1 LLM client, breaker, cache |
| `app/src/services/NPCFactory.js` | Tier 2 template path for NPCs |
| `app/src/services/AICharacterController.js` | Runtime control surface for AI characters |
| `app/src/services/DailyStoryEvolution.js` | Daily world-state mutation pass |
| `app/src/routes/ai.js` | Health/status/test endpoints |
| `app/mudlands_ai_analysis/auto_character_scheduler.js` | Cron-driven scheduler |
| `app/mudlands_ai_analysis/AI_STORYTELLER_SYSTEM_PROMPT.md` | Master system prompt for AI characters |
| `app/mudlands_ai_analysis/character_profiles/` | Per-character persona JSON |
| `app/mudlands_ai_analysis/world_data/story_state.json` | Persistent world state |
| `docker/docker-compose.ai.yml` | Ollama + Redis-AI service definitions |
