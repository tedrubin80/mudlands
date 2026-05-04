# Security Incident — Credentials in Public Repo (May 2026)

**Status:** Closed — site decommissioned, credentials no longer live.
**Date discovered:** 2026-05-04
**Date of original exposure:** Unknown — files predate the security audit on 2026-03-01.
**Severity at discovery:** Would be Critical on a live system. Mitigated by decommission.

---

## What happened

A pre-decommission audit of the public GitHub repository `tedrubin80/mudlands` found four files containing live database and admin credentials in plaintext, committed and pushed to the public main branch.

### Exposed files and contents

| File | Exposed value |
|---|---|
| `app/fix-db-password.sql` | Postgres `mudlands_user` password: `[REDACTED]` |
| `app/scripts/update-db-password.sql` | Postgres `mudlands_user` password: `[REDACTED]` |
| `app/scripts/secure-database.sh` | Same password as above + `sed` replacement of `.env` |
| `app/scripts/setup-admin.sh` | Admin user password: `[REDACTED]` (also `[REDACTED]` baseline DB pwd) |

Additionally, **19 shell scripts** were committed to the repo. They didn't all contain credentials, but they encoded server paths, sudo operations, and deployment topology that have no business in a public source tree.

### What was NOT exposed (good)

- No `.env` file pushed (correctly excluded by the existing `.gitignore`).
- No SSL/SSH private keys (`*.pem`, `*.key`, `*.crt`, `id_rsa*`) — `.gitignore` covered them.
- No JWT signing secrets pushed (lived only in `.env`).
- No player password hashes (lived in DB, never in repo).

---

## How it happened

A few independent failures overlapped:

1. **Operational scripts written into the source tree.** `update-db-password.sql` and `secure-database.sh` were one-shot ops scripts. They got committed because they sat next to the application code and `git add .` swept them in.
2. **Plaintext credentials embedded in those scripts.** Whoever wrote `secure-database.sh` chose the readable approach (`COMPLEX_PASSWORD="..."`) over reading from an env var. Convenient at the moment, terrible at rest.
3. **`.gitignore` covered file types but not file roles.** `.env` was excluded. `*.sql` was not. The pattern that mattered (a script that touches credentials) wasn't expressible as a glob in the original `.gitignore`.
4. **No pre-commit hook.** Nothing scanned outgoing commits for secrets.

---

## Impact assessment

**At time of discovery, none.** The site was already in the decommissioning process. Specifically:

- The Postgres database referenced by these credentials had been wiped.
- The `mudlands_user` Postgres role was deleted.
- The admin account using `[REDACTED]` was deleted.
- The host running the application was being torn down.

**If the site had been live**, these would have been:

- **Database password** → full read/write to the game's Postgres database. Player accounts (hashed passwords + emails), characters, NPCs, audit logs, AI-generated content. Likely a regulatory disclosure obligation depending on jurisdiction (PII).
- **Admin password** → admin dashboard access, content moderation override, AI service control plane.

The window of exposure is unknown but at least months. Search-engine and credential-scraper indexing of GitHub is automated and fast — assume any plaintext credential in a public repo is harvested within 24 hours.

---

## Remediation

### Done at discovery (2026-05-04)

1. ✅ Confirmed the live database and admin account no longer exist.
2. ✅ Documented findings in this file.
3. ✅ Updated `.gitignore` (project root) to exclude `*.sh`, `*password*.sql`, `*-creds*.sql`, `fix-db-*.sql` going forward.
4. ✅ Documented the `.gitignore` rule and its rationale in `docs/DECISIONS.md → D-010`.

### Not done (intentional, project decommissioned)

The following would be required if the project were live; they are deliberately skipped because the system is no longer operating:

- ❌ Rotate the exposed credentials. Not applicable — accounts no longer exist.
- ❌ Rewrite git history with `git filter-repo` to purge the secret blobs.
- ❌ Force-push the rewritten history to GitHub.
- ❌ Notify any third parties or users.

The compromised credentials are retained in the public history of `tedrubin80/mudlands` as part of the historical record. This is intentional — anyone reviewing this repo as portfolio work should be able to see the incident and the fix together.

### What we'd do on a live system

Documented here for "next time," and for any reviewer evaluating the security thinking on this project:

1. **Rotate first, investigate second.** Generate new credentials, update them in the running app, restart, before doing anything else.
2. **Assume compromise.** Audit the database for unauthorized writes/reads in the suspected exposure window. Check Postgres logs.
3. **Rewrite history.**
   ```bash
   git filter-repo --invert-paths \
     --path app/fix-db-password.sql \
     --path app/scripts/update-db-password.sql \
     --path app/scripts/secure-database.sh \
     --path app/scripts/setup-admin.sh
   git push --force-with-lease origin main
   ```
   Note: this only purges from the default-branch reachable history. GitHub forks and cached views (Wayback, etc.) cannot be retracted.
4. **Add a pre-commit hook** (e.g., `gitleaks`) to block future secret commits.
5. **Notify users** if PII could have been accessed during the exposure window.

---

## Lessons / preventive controls

These are now project rules:

- **Operational scripts don't live in the application repo.** They live in a separate, private location. The application repo holds code, schema, and content — nothing that runs against a live host. (`docs/DECISIONS.md → D-010`)
- **Credentials never appear in source files at all**, even in scripts that need them. Read from env vars, a secrets manager, or stdin.
- **`.gitignore` rules out roles, not just types.** `*.sh` and `*password*.sql` are now excluded — not because every shell script is dangerous, but because the *category* of "ops scripts" doesn't belong in this repo.
- **Pre-commit secret scanning** would have caught this. It's not configured here because the project is shut down, but it's the first thing to add on revival or on the next project.

---

## Timeline

| Date | Event |
|---|---|
| Pre-2026-03 | Ops scripts committed with plaintext credentials. Exact date unknown. |
| 2026-03-01 | Security audit completed (see `MEMORY.md → Security Audit`). Caught CSRF, XSS, JWT-blacklist, and several other issues — did **not** catch the exposed credential files. Notable miss. |
| 2026-05-04 | Decommissioning audit found the exposed files. Site already shut down. |
| 2026-05-04 | This document and remediation `.gitignore` written. |

The 2026-03 audit missing this is itself a lesson: code-level security review (route hardening, header config, auth flow) does not substitute for **artifact-level review** (what is actually in the repo). Both are required.
