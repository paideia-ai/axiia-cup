# Vivian human-test fixture preparation — 2026-09-12

Run these commands from `v2/web`. Both require an explicitly supplied admin
email, password, and TOTP secret through `AXIIA_ADMIN_EMAIL`,
`AXIIA_ADMIN_PASSWORD`, and `AXIIA_ADMIN_TOTP_SECRET`. Keep those values outside
the repository and command history. `AXIIA_BASE_URL` must be the reviewed beta
origin or an isolated HTTP loopback server.

`deno task prepare:human:a3 --apply` creates a one-use registration code and
proposed credentials in a new absolute `AXIIA_PRIVATE_OUT` file, mode 0600. It
leaves the account unregistered so the reviewer can verify registration and
automatic login. Do not log in or register that account during handoff checks.

`deno task prepare:human:a6 --apply` needs new absolute `AXIIA_PRIVATE_OUT` and
`AXIIA_PUBLIC_OUT` paths. It creates three separate roles: an untouched gate
actor with both sides in two scenarios, a creation actor with only one saved
side, and an invitee whose PVP gate is locked. It checks the live scenario and
quota configuration before provisioning, then verifies account ownership,
agents, entry versions, zero usage, and zero gate wins through the API.

Each invocation creates a new batch. It does not reset an existing account. This
is how a consumed A6 fixture is replaced without changing another reviewer's
state. The public manifest contains IDs and verification evidence; the private
manifest contains credentials and must never be deployed, committed, or attached
to a public issue. Deliver credentials through the authorized group handoff
before asking the reviewer to start, and enter the new fixture IDs in the
current Test Mode session.

These commands do not prepare every A6 state. Exhausted daily quota, unlocked
NPC progress, retired versions, and deleted/recreated agents need their own
verified preparation. Their Test Mode fields remain `refresh-required`. Daily
quota changes at midnight UTC+8; an exhausted account cannot be treated as a
permanent fixture.

`deno task test:human-fixtures` checks preparation contracts without creating
accounts. The local real-server test
`tests/e2e/human-fixture-preparation.real.spec.ts` verifies a prepared A3 signup
through the browser and the three A6 roles through the real API. It is
restricted to loopback servers created by `e2e/run-playwright.sh`, which sets
`AXIIA_E2E_ISOLATED=1` after starting its own database and server. Do not set
this flag for a development proxy to the shared beta. The test disables
screenshots, traces, and videos containing test credentials.
