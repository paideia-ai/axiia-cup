# Account achievements implementation — 2026-10-03

## Accepted scope

31 achievements: remove blank-prompt; enable the other four former candidates. Bounty means the initiating winner's claimed point refund. No historical backfill. Only matches created after durable activation qualify, including both owners of real PvP; self-play, overrides and failures do not. Unlocked achievements are permanent and carry evidence. All locked achievements display a question mark. Gold/silver/bronze groups. Toast text is title plus optional flavor only; clicking opens the center in a new tab. Settings navigation follows archived agents. Notifications persist independently from toast delivery.

## Delivery plan

1. Freeze catalog and API, persist activation boundary and participant snapshots.
2. Implement deterministic rules, transactional awards/notifications and resumable account events. Record accepted inference intervals for thinker.
3. Implement production achievement center, global toast queue, sound and settings card.
4. Verify rule coverage, no backfill, transaction retries, account isolation, browser reconnect and tab coordination. Run repository checks.
5. Launch isolated real Swift backend + production frontend preview; commit and push both repositories and create linked PRs.

## Implementation decisions

Use the existing SQLite finishing transaction for evidence, deterministic evaluation and award creation. This keeps notifications and awards atomic without a second recovery worker. Evaluation reads compact per-account facts, not complete transcripts. Completion order is transaction settlement order. Bounty awards are evaluated inside the successful credit transaction.

The catalog is authoritative on the server. Locked response rows expose only opaque slot and tier; unlocked rows include title, description, flavor, ID used as image key, earned time and match. Event IDs are durable unlock IDs and independent of deletable notifications. Initial connection starts at a snapshot cursor; reconnect catches up. Historical and offline inventories do not autoplay toasts.

Preview uses an isolated database and the exact production routes/components; no mock API or alternate achievement UI. Credentials and generated preview state stay outside Git.

Rollout order: deploy the backend first so activation and event routes exist, then deploy the frontend. A frontend reaching an older backend displays an unavailable state in the center. No production deployment or database operation is part of this change.
