# Portfolio Management

How the MUDlands portfolio surface is structured, what lives where, and how to update it.

The portfolio is **part of the application**, not a separate site — a deliberate choice (see `docs/DECISIONS.md → D-009`). This doc covers the why, the layout, and the maintenance workflow.

---

## What is the "portfolio"?

Three artifacts that together tell the story of the project:

| Artifact | Location | Purpose |
|---|---|---|
| Public landing page | `app/public/portfolio/` | Visual showcase aimed at recruiters, peers, future-self |
| Top-level README | `README.md` | First impression for anyone landing on the GitHub repo |
| Technical docs | `docs/`, plus the `*_BREAKDOWN.md` and `AI_*.md` files at repo root | Depth for engineers who want to read past the summary |

The portfolio page is the **front door**. The READMEs and breakdowns are the **rooms behind it**.

---

## Landing page — `app/public/portfolio/`

```
public/portfolio/
├── index.html          single-page HTML with all sections
└── style.css           retro terminal theme, scoped to the page
```

Served at `/portfolio` via the route declared in `app/server.js`. Static — no server-side rendering, no JS framework.

### Sections (in order)

1. **Hero** — ASCII title, one-line pitch, headline stats (~15k LOC, 13 services, 50+ endpoints, 7 data models).
2. **Tech stack banner** — scrolling marquee of stack components.
3. **Overview** — what the project is, framed as a `cat README.md` shell prompt.
4. **Stack detail** — broken down by layer (runtime, data, AI, frontend, ops).
5. **Code highlights** — links to interesting files with a one-line description.
6. **AI system** — how the LLaMA pipeline works, with the NPC roster.
7. **Security** — what we audited, what we hardened, what we knowingly left as debt.

### Visual identity

Locked to the same retro terminal aesthetic as the game itself:

- **Font:** Courier Prime (Google Fonts)
- **Palette:** Phosphor green `#00ff41` on near-black `#0a0a0a`
- **Effects:** Scanline overlay, monospace everywhere, `>` prompt characters as bullets

Why match the game: the portfolio is meant to feel like a **playable artifact**, not a marketing page. A visitor's first impression should be "this person ships things with a point of view," not "this person uses a Bootstrap template."

---

## Maintenance workflow

### When to update

| Trigger | What to update |
|---|---|
| New service or major feature added | Stats counters in hero, code-highlights section, breakdown docs |
| Security audit completed | Security section + `MEMORY.md → Security Audit` |
| AI capability added (e.g., new content type) | AI system section + `docs/AI_AGENT_DEVELOPMENT.md` |
| Tech stack change | Stack banner + stack detail |
| Decommission / sunset event | Add a banner to hero, update `docs/DECISIONS.md` |

### How to update

1. Edit `app/public/portfolio/index.html` — pure HTML, no compilation step.
2. Edit `app/public/portfolio/style.css` if introducing a new section type.
3. Test locally: `npm start`, hit `http://localhost:3000/portfolio`.
4. Cross-update the linked docs so the portfolio's claims match the docs' claims (the worst portfolio bug is "hero says 50+ endpoints, README says 38").

### Numbers to keep honest

The hero stats are the most-read part of the page and the most likely to drift. Re-derive them when you touch them:

```bash
# Lines of code (excluding deps and lockfiles)
find app/src app/public -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' \) \
  | grep -v node_modules | xargs wc -l | tail -1

# Backend services
ls app/src/services | wc -l

# API endpoints (rough count — Express route definitions)
grep -rE "^(router|app)\.(get|post|put|delete|patch)\(" app/src/routes/ | wc -l

# Data models
ls app/src/models 2>/dev/null | wc -l
```

If a number changed, update both the page and any breakdown doc that cites it.

---

## Hosting decisions

### Media (videos, screenshots)

The repo originally contained `mudlands-walkthrough.mp4` (~1.4 MB), `mudlands-ai-features.mp4` (~427 KB), and a couple of full-page screenshots. These were pushed to GitHub.

**Decision:** Going forward, video and large screenshots are excluded by `.gitignore` (`*.mp4`, `*.mov`, `Screenshot*.png`). Media lives in a release asset, an external CDN, or embedded directly in the portfolio page via an `<iframe>` from a video host.

**Why:**
- Repo bloat: every clone pays for the binaries.
- Diff/blame churn: binaries don't merge.
- Portfolio load time: lazy-loaded videos > inline `<video>` for first paint.

### The portfolio page itself

Stays in-repo and is served by the app at `/portfolio`. If the app is ever turned off again, the portfolio page can be lifted to GitHub Pages with zero code changes — it's pure HTML/CSS.

---

## Post-decommission status (2026-05)

The live host is gone. The portfolio surface now lives entirely on GitHub:

- Repo: https://github.com/tedrubin80/mudlands
- The portfolio page can be reactivated as static GitHub Pages content.
- README and `docs/` are the canonical entry point until/unless GitHub Pages is configured.

If you (future-me or a reviewer) want to revive the visual portfolio without standing the game back up:

```bash
# In the GitHub repo settings:
# Settings → Pages → Source: deploy from branch
# Branch: main /app/public/portfolio
# Done — site available at https://tedrubin80.github.io/mudlands/
```
