# Tournament ops

Runs an axiia tournament end to end with no human admin in the loop: the
`Tournament Ops` workflow (`.github/workflows/tournament-ops.yml`) exchanges a
GitHub OIDC assertion for a ten-minute `federated-tournament` token and drives
the server's tournament admin routes with it. `run.ts` is the operator; the
workflow is just its harness.

## Preconditions (one-time, server side)

Inert until both are true:

1. The server runs a build with the tournament machine-admin gate (axiia-cup-v2
   branch `tournament-machine-admin`): a `federated-tournament` client kind
   whose grant reaches every `/v1/admin/tournaments*` verb plus
   `PATCH /v1/admin/rounds/:id`, and nothing else — no minting, no revocation,
   no scenario delivery.
2. The host federation policy (`AXIIA_FEDERATION_POLICIES` /
   `AXIIA_FEDERATION_POLICY_FILE`) carries a rule pinning THIS workflow and
   granting that kind — see "Tournament operations grant" in the server repo's
   `docs/deployment.md`. Pin `workflow_ref` to
   `paideia-ai/axiia-cup/.github/workflows/tournament-ops.yml@refs/heads/main`
   and put the rule before any broader rule for the same repository.

## Running it

One verb per dispatch, or the whole lifecycle with `auto`:

```sh
# The full loop: create → enroll → seed → pair/watch/close each round → finish
gh workflow run tournament-ops.yml \
  -f op=auto -f scenarioID=court -f totalRounds=3 \
  -f versionIDs=101,102,203,204

# Individual verbs against an existing tournament
gh workflow run tournament-ops.yml -f op=status -f tournamentID=1
gh workflow run tournament-ops.yml -f op=pair -f tournamentID=1 -f phase=main
gh workflow run tournament-ops.yml -f op=advance -f tournamentID=1
gh workflow run tournament-ops.yml -f op=finish -f tournamentID=1
```

Ops: `create`, `enroll`, `seed`, `pair`, `advance` (wait for the running round,
then close it), `promote` (海选 → 正赛, needs `slots`), `finish`, `status`,
`auto`.

What `auto` does, all state read back from the server so re-running resumes:

1. `create` unless `tournamentID` is given.
2. `enroll` every id in `versionIDs` not already enrolled. **Enrollment needs
   explicit version ids** — no API lists other players' versions, deliberately
   (prompts are private). Collect the entry version ids from the players or the
   host database and pass them as CSV.
3. `seed` — with no `qualifierCutoff` and `phase=main` everyone is seeded
   straight into 正赛 (cutoff 0); pass a cutoff to split the field, then run
   qualifier rounds and `promote` yourself.
4. Per round: `pair` (skipped if that round number already exists — pairing is
   the one verb the server re-dispatches on every call, so the guard is here),
   watch until every match of the round is scored, close the round.
5. `finish`, and print the final standings.

Watching uses the open battle list when the server runs `AXIIA_OPEN_BATTLES`,
otherwise the standings sum (a scored match adds one `matchesPlayed` to each
side). A match that **fails** never scores: the run times out loudly
(`TIMEOUT_MINUTES`, default 240) without closing the round — inspect, then
re-run `advance`.

## Local fallback (no GitHub Actions)

`run.ts` needs nothing but Deno and one credential:

```sh
# Either: any bearer that passes the tournament gate
AXIIA_BASE_URL=https://… AXIIA_TOKEN=kat_… \
  OP=status TOURNAMENT_ID=1 deno task run

# Or: an elevated admin session — log in + TOTP-elevate in the browser, copy
# the Cookie header from devtools
AXIIA_BASE_URL=https://… AXIIA_COOKIE='axiia_session=…; …' \
  OP=status TOURNAMENT_ID=1 deno task run
```

Note the static `ci` token from scenario delivery does NOT pass the tournament
gate — the grants are deliberately disjoint. Extra knobs: `POLL_SECONDS`
(default 30), `TIMEOUT_MINUTES` (default 240).
