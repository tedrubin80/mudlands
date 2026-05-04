# MUDlands — Architecture & Project Decisions

Living record of the non-obvious choices made while building MUDlands. Each entry captures **what we decided**, **why**, and **what we'd do differently** in hindsight. The point is to make the trade-offs legible to future maintainers (and to anyone reviewing this as portfolio work).

Format borrows from ADR (Architecture Decision Records) but kept lightweight.

---

## D-001 — Local LLM (Ollama + LLaMA 3.1 8B) over hosted APIs

**Status:** Adopted
**Context:** Game needs cheap, high-volume content generation (NPCs, quests, room descriptions). Hosted APIs (OpenAI/Anthropic) would add ~$0.001–0.01 per generation × thousands per day.

**Decision:** Run Ollama with `llama3.1:8b` locally, expose at `http://localhost:11434`.

**Why:**
- Zero per-request cost — critical for a hobby/portfolio project.
- Generation latency is acceptable for non-real-time content (quest pre-gen, daily story evolution).
- No data leaves the box — players' interaction logs stay private.
- Forces us to build proper caching, fallback, and rate-limiting (good engineering hygiene).

**Trade-offs:**
- 8B model quality is noticeably weaker than GPT-4-class. We compensate with structured prompts and template fallback.
- ~12 GB RAM resident. Required us to size the host accordingly.
- Cold starts are slow (~10s).

**What we'd do differently:** Add an env-flag escape hatch (`AI_PROVIDER=ollama|openai`) so a hosted model can be swapped in for narrative-critical content without code changes.

---

## D-002 — Circuit breaker + template fallback for AI

**Status:** Adopted
**Context:** Ollama can hang, OOM, or return malformed JSON. Game tick must never block on AI.

**Decision:** Wrap every AI call in a circuit breaker (5 failures → open for 60s) backed by a deterministic template-based generator (`NPCFactory` template path).

**Why:** A live MUD that can't spawn a merchant because the LLM is sulky is worse than a merchant with a generic name. Three-tier reliability:
1. **AI** — best content
2. **Template** — instant, structured, lore-consistent
3. **Static** — last-resort canned text

**See:** `app/src/services/AIContentService.js` (breaker logic), `app/src/services/NPCFactory.js` (fallback path).

---

## D-003 — Redis-backed AI content cache

**Status:** Adopted
**Context:** ~80% of NPC requests are repeats (same location + same type → same NPC archetype). Re-generating wastes 30–120 seconds.

**Decision:** Hash the `(content_type, parameters)` tuple → Redis key, TTL 1 hour, separate Redis instance on port 6380 from the session Redis.

**Why split Redis instances?** Session Redis and AI cache have different durability/eviction needs. Conflating them risks evicting active player sessions during a content-gen burst.

---

## D-004 — JWT in `localStorage` (with eyes open)

**Status:** Adopted, flagged as known weakness
**Context:** Auth needs to survive page reloads and work for the WebSocket handshake.

**Decision:** Issue JWT after login, store client-side in `localStorage`, send via `Authorization: Bearer` header and as a Socket.IO auth payload.

**Why we know this is suboptimal:** XSS would lift the token. We accepted this because:
- The site is single-purpose (no third-party scripts in the auth context).
- CSP + escape-on-render covers our XSS surface.
- httpOnly cookies + CSRF tokens were considered but added complexity for the WebSocket path that we didn't want before launch.

**See:** `MEMORY.md → Security Audit (2026-03-01)`.

---

## D-005 — CSP allows `unsafe-inline` for now

**Status:** Adopted with debt note
**Context:** Several admin and game-client pages use inline `onclick` attributes and inline `<script>` blocks for the Phaser/Socket.IO bootstrap.

**Decision:** Keep `unsafe-inline` on `script-src` and `style-src` rather than refactor the pages.

**Why:** Pure technical debt — refactoring every inline handler to addEventListener costs ~2 days for a marginal hardening win on a decommissioned project.

**Exit path:** When/if the project is revived, replace inline handlers with delegated listeners and switch CSP to `script-src 'self' 'nonce-...'`.

---

## D-006 — Vanilla JS + Phaser instead of a SPA framework

**Status:** Adopted
**Context:** Two clients: text terminal (`index.html`) and graphical mode (`graphical.html`).

**Decision:** Plain HTML/JS. Phaser only for the graphical canvas. No React/Vue/build pipeline.

**Why:**
- Game state lives on the server. The client is mostly a render+input shell — a framework is overkill.
- Zero build step, zero dependency churn.
- Easier for visitors to "view source" and grok the code (portfolio value).

**Trade-off:** Some duplicated DOM logic between the two clients. Acceptable at this scale.

---

## D-007 — Trust proxy = 1 (not `true`)

**Status:** Adopted (post-audit fix)
**Context:** Originally `app.set('trust proxy', true)`. With `true`, Express trusts the full `X-Forwarded-For` chain, which means a malicious client could spoof their IP and bypass `express-rate-limit`.

**Decision:** Set `trust proxy = 1` (one hop — our nginx).

**Why:** We sit behind exactly one reverse proxy. Trusting more hops is a foot-gun.

**See:** `MEMORY.md → Security Audit`.

---

## D-008 — AI character scheduler runs as cron, not in-process

**Status:** Adopted
**Context:** "Living world" requires NPCs to act independently of player presence — Elder Thaddeus walking the town hall in the morning whether or not anyone's logged in.

**Decision:** External cron job invokes `mudlands_ai_analysis/auto_character_scheduler.js` hourly. Each run picks eligible characters (cooldown-aware), spawns a session, writes to story state.

**Why not an in-process scheduler?**
- Crash isolation — a runaway character session can't take down the game server.
- Easier observability — each run leaves a log line and a state-file mutation.
- Lets us run the scheduler against staging story state without touching prod.

**See:** `docs/AI_AGENT_DEVELOPMENT.md → Scheduler`.

---

## D-009 — Portfolio page lives inside the app, served at `/portfolio`

**Status:** Adopted
**Context:** Need a visible artifact for hiring/portfolio review without standing up a separate site.

**Decision:** `app/public/portfolio/{index.html,style.css}`, route added in `server.js`. Same retro terminal theme as the game.

**Why:**
- Shared visual identity reinforces the project's character.
- One deploy artifact.
- No SSL/DNS overhead.

**Trade-off:** Couples the portfolio's availability to the game's. Mitigated by the page being static — even if the game backend is down, nginx serves the portfolio.

**See:** `docs/PORTFOLIO_MANAGEMENT.md`.

---

## D-010 — Shell scripts and operational SQL stay out of the repo

**Status:** Adopted (after May 2026 incident)
**Context:** Pre-decommission audit found 19 `.sh` files and two `*-password*.sql` files in the public GitHub repo. Two of those files contained plaintext database passwords.

**Decision:**
1. `.gitignore` excludes `*.sh`, `*password*.sql`, `*-creds*.sql`, `fix-db-*.sql`.
2. Operational scripts (deploy, backup, db-rotation) live in a separate, private location.
3. The repo holds application code, schemas, and content — nothing that runs against a live host.

**Why:**
- Scripts encode environment-specific paths, sudo operations, and (historically) plaintext credentials.
- Public-repo readers don't benefit from seeing them, and they create incident risk.
- See `docs/SECURITY_INCIDENT_2026-05.md` for the post-mortem.

**What we'd do differently:** Set this rule on day 1, not after a leak.

---

## D-011 — Content authoring lives in `content/` JSON, not a CMS

**Status:** Adopted
**Context:** NPCs, rooms, quests need to be authored, version-controlled, and round-tripped with AI generation.

**Decision:** Plain JSON files in `app/content/{npcs,rooms,quests,...}`. AI-generated content is also written as JSON next to authored content.

**Why:**
- Diff-able in git.
- Trivial for a non-developer (e.g., a writer) to edit with any text editor.
- AI output and human authoring share the same schema — no impedance mismatch.

---

## Decommissioning (May 2026)

Project formally shut down on **2026-05-04**. Live database wiped, domain not renewed, GitHub repo retained for portfolio purposes only.

Post-decommission documentation effort produced:
- This file
- `docs/PORTFOLIO_MANAGEMENT.md`
- `docs/AI_AGENT_DEVELOPMENT.md`
- `docs/SECURITY_INCIDENT_2026-05.md`
