# Vivian human-test fixture preparation — 2026-09-12

Run these commands from `v2/web`. A3 and A6 require an explicitly supplied admin
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

`deno task prepare:human:a5 --apply` prepares the **existing A5 quota invitee**
through real model-backed duels. It spends real model usage and the invitee's
daily allowance. It requires player credentials, not admin access. Keep both
dedicated accounts idle while it runs; do not run concurrent preparations.

Supply these environment variables privately:

```text
AXIIA_BASE_URL=https://axiia-cup-2-web.isofucius.cn
AXIIA_A5_SCENARIO_ID=shangyang-court
AXIIA_A5_INITIATOR_EMAIL=<existing hv-a5-quota-invitee-...@axiia.test>
AXIIA_A5_INITIATOR_PASSWORD=<existing password>
AXIIA_A5_RIVAL_EMAIL=<existing hv-a5-rich-challenger-...@axiia.test>
AXIIA_A5_RIVAL_PASSWORD=<existing password>
AXIIA_A5_MAX_MATCHES=5
AXIIA_PRIVATE_OUT=<new absolute private .jsonl path>
AXIIA_PUBLIC_OUT=<new absolute redacted .json path>
```

The explicit bound permits 0–10 preparation duels; the tool calculates the
remaining daily PVP deficit before dispatch. `AXIIA_A5_MATCH_TIMEOUT_SECONDS`
defaults to 600 and may be 1–1800 per match. Each HTTP request times out after
30 seconds, with no redirect or automatic retry. Both accounts must already have
unlocked gates and entry versions on both sides of the selected live scenario.
Entry versions are used even when a newer draft exists.

Only the quota invitee initiates preparation duels; the rich challenger retains
at least two total and two PVP slots for the later positive paired challenge.
Direct duels do not consume the receiver's paired-challenge cap. Both roles'
existing received-challenge counts are checked before preparation. Accepted
duels are charged at dispatch, including terminal failures. The tool waits for
each duel before starting another and leaves at least two total slots on the
invitee, so the A5 negative check reaches PVP quota rather than total quota.

The final verification submits the actual paired challenge from the exhausted
invitee. `ready` requires HTTP 429 `pvp_daily_limit`, unchanged initiated match
IDs, unchanged counters on both accounts, and current gate/entry checks. A
different rejection leaves `partial`; unexpected acceptance records both match
IDs and stops. The tool has no cancellation, refund, or quota override. The
public manifest records the verification and its expiry at midnight UTC+8 (16:00
UTC). It refuses to begin new work or declare readiness within two minutes of
reset and stops if a run crosses reset. Readiness is a point-in-time
observation; later account use can invalidate it before expiry.

The private mode-0600 JSONL journal contains credentials followed by synced,
append-only checkpoint records. The public JSON contains only IDs, usage,
expiry, and status. Both paths must be new; retain them outside the repository.
After interruption, timeout, or ambiguous dispatch, inspect the journal and
account before retrying. Resume with the same dedicated credentials and **new
output paths**: the tool first waits for every unfinished match initiated by the
invitee, then uses current counters to dispatch only the remaining deficit. It
never retries a POST automatically or refills across reset. A failed match
leaves partial evidence so its provider/scenario failure can be inspected before
any more real matches. No new accounts or stable Test Mode manifest edits are
required by this preparation.

`deno task test:human-fixtures` checks preparation contracts without creating
accounts or allowing network access. A5's offline contracts cover bounded
dispatch, role isolation, resumption, UTC+8 expiry, exact paired rejection,
unexpected acceptance, and private output durability. The local real-server test
`tests/e2e/human-fixture-preparation.real.spec.ts` verifies a prepared A3 signup
through the browser and the three A6 roles through the real API. It is
restricted to loopback servers created by `e2e/run-playwright.sh`, which sets
`AXIIA_E2E_ISOLATED=1` after starting its own database and server. Do not set
this flag for a development proxy to the shared beta. The test disables
screenshots, traces, and videos containing test credentials.
