# Archives

This folder previously held a 24 MB `tar.gz` snapshot of the live server tree
(`mudlands_final_archive_20250926_173034.tar.gz`).

The tarball was removed from HEAD and purged from history during the 2026-05-11
credential scrub. It contained:

- A nested `.git/` directory with the same plaintext credentials that lived in
  the top-level repo's history (the whole point of the scrub).
- `node_modules/` (regenerable from `package.json`).
- `.claude/settings.local.json` (machine-local tool permissions).
- Nginx configuration files referencing the production host.

Everything portfolio-relevant in the tarball — application source, AI character
profiles, world data, docs — already lives in this repository at the top level.
The tarball was a redundant copy with extra leakage, so removing it cost
nothing.

See `docs/SECURITY_INCIDENT_2026-05.md` for the full incident and scrub record.
