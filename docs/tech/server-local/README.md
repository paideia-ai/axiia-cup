# Server-local operational snapshots

These files are **manual snapshots** of live server-local operational components.

They are intentionally kept in `docs/` because they are:
- not authoritative application source code
- not automatically deployed from the repository
- maintained by hand as backup/reference copies

Current intended components:
- `deploy-webhook.server.py` — server-local webhook implementation snapshot
- `nginx.origin.split-stack.conf` — host nginx config snapshot for prod + dev split stacks

Operational rule:
- if you edit the live server-local component manually, update the matching snapshot here in the same commit when practical.
- if the snapshot and live server drift temporarily, treat the live server as authoritative until the snapshot is refreshed.
