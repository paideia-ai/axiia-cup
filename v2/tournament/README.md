# v2/tournament — the three-stage cup, run from scripts

Operator scripts for the Axiia Cup three-stage tournament
([rules](../../docs/competition/tournament-three-stage-rules.md)): 海选 (seeded single-elimination
groups) → 瑞士轮 (R rounds, 3/1/0) → 64 强 (fixed seeded bracket), one tournament per scenario.
Nothing here deploys; the server runs the games.

The server holds every game. The scripts keep no state of their own besides three files per
scenario: the locked `roster.json`, the operator's `rulings.json` and `withdrawals.json`. Every run
reads the scenario's matches by tag and derives the whole tournament again (pairings, results,
standings, bracket), so rerunning is always safe, and a pairing that no longer matches what the
server already played is reported as drift instead of being silently replayed.

## Run the mock

```sh
cd v2/tournament
deno task demo                    # all four scenarios at Q 2048, K 100, E 256, R 9
open demo/report.html
deno task demo --Q 300 --K 20 --E 32 --R 6 --out-dir /tmp/small
```

The mock server is one JSON file. It plays queued games with a latent strength model (talent, A/B
skill, scenario-specific matchup terms, token counts drawn against talent) and fails 1% of games so
retries are exercised. Ties that need the 组委会 get a seeded coin flip marked `mock 组委会`. The
report gains a truth panel: true rank vs final placement, how many of the true top 64 reached the
knockout, Spearman ρ.

Step by step, the way an operator would:

```sh
deno task mock-roster --mock /tmp/m/server.json --scenario shangyang-court --out /tmp/m/sy
deno task next /tmp/m/sy --mock /tmp/m/server.json --watch --retry
deno task report /tmp/m/sy --mock /tmp/m/server.json --out /tmp/m/report.html
```

## Run a real cup

Environment: `AXIIA_BASE_URL`, and `AXIIA_TOKEN` (operator bearer token) or a GitHub Actions job
with `id-token: write` (exchanged at `/v1/auth/federated`).

1. `entries.json`: `[{player, name?, a: <versionID>, b: <versionID>, ladderRank: <n>|null}]`, the
   registrations and the ladder snapshot at the deadline.
2. `deno task roster build --entries entries.json --scenario <id> --tournament <T> --seed <public seed> --out <dir>`
   fetches both versions, checks scenario/side/account, counts prompt tokens (tiktoken cl100k_base
   `encode_ordinary`, pinned in `deno.json`) and picks the top K ranked as direct entries. Problems
   are listed, nothing is written. `deno task roster validate <dir> --online` re-checks the locked
   prompts later.
3. `deno task next <dir> --watch --retry` submits each round's games the moment the previous round
   settles and stops when the champion is known or the operator is needed: a pair waiting for a
   ruling, a full Swiss tie at the knockout cut, or a game that failed `--max-attempts` times
   (default 3).
4. Add the ruling to `<dir>/rulings.json` and run `next` again:

   ```json
   {
     "pairs": { "<pairID>": { "winner": "<player>", "reason": "…", "by": "…", "at": "…" } },
     "forfeits": { "<pairID>": { "winner": "<player>|null", "reason": "…" } },
     "standings": [{ "players": ["<first>", "<second>"], "reason": "…" }]
   }
   ```

   Withdrawals go in `<dir>/withdrawals.json`:
   `[{ "player": "…", "stage": "prelim|swiss|ko", "round": n, "reason": "…" }]`. Both must be added
   before the round they affect is submitted, or `next` stops with a drift error.
5. `deno task report <dir>... --out report.html` prints standings and writes a standalone HTML
   report (works from `file://`).

### Server contract (all in `src/backend/http.ts`)

- `POST /v1/federation/matches/batch` `{items}` (1–1000 per batch, all or nothing). Game key
  `T/<scenario>/<pairID>/g1|g2[#retryN]`; tags `T`, `T/<scenario>`, `T/<scenario>/<stage>/r<k>`,
  `T/<scenario>/pair/<pairID>`; seed `<roster seed>/<pairID>` (same seed on a retry). Keys, tags and
  seeds are checked against the 1–256 byte limit before sending. 409 `key_conflict` means a key
  exists with another payload (drift or a reused T).
- `GET /v1/federation/matches?tag=…&limit=1000&after=…`, ascending matchID, followed until `next` is
  null.
- `GET /v1/federation/versions?id=…`; unknown ids are omitted and treated as errors.
- The server has no concurrency cap. `next` keeps at most `--max-in-flight` (`AXIIA_MAX_IN_FLIGHT`,
  default 50) of this scenario's games queued or running and tops up on the next step; `--watch`
  polls every `--interval` seconds (default 30). The mock ignores the cap.
- 凤仪亭's primary metric needs `facts.scheme` on each finished match; the scenario script returns
  `facts: {scheme}` and the server stores it verbatim. A finished 1:1 pair without it waits for a
  ruling.

## Files

| Path                                                            | What                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/engine.ts`                                                 | `derive`: roster + matches + rulings + withdrawals → the whole tournament |
| `src/outcome.ts`                                                | one pair from its two games: wins, primary per scenario, tokens, ruling   |
| `src/prelim.ts`, `src/bracket.ts`                               | 海选 groups (snake), fixed seeded brackets                                |
| `src/swiss.ts`                                                  | Swiss seeds, pairing, standings and tiebreaks                             |
| `src/roster.ts`, `src/tokens.ts`                                | roster build/validate, token counts                                       |
| `src/next.ts`, `src/simulate.ts`                                | one `next` step; mock play-to-end                                         |
| `src/backend/`                                                  | `Backend` interface, HTTP adapter, mock server                            |
| `src/mock/`                                                     | strength model and roster generator                                       |
| `src/report.ts`, `src/text.ts`, `src/html.ts`, `viz/index.html` | report data, text output, HTML view                                       |
| `bin/`                                                          | the `deno task` entry points                                              |

## Where the rules are silent: defaults chosen

- **海选 group sizes** — when Q is not a multiple of E, the last Q mod E groups (headed by the
  lowest first-pass seeds) get the extra player.
- **Unranked lottery** — drawn from the public seed; the drawn order continues the same snake after
  the ranked players.
- **Swiss pairing** — within a score group, the top unpaired player meets the member m/2 places
  below (S1 vs S2); an odd group floats its lowest member to meet the top of the next group; a
  repeat opponent is skipped (below the ideal, then above, then lower groups) with depth-first
  backtracking.
- **Swiss bye** — lowest score among players without a bye or forfeit win, then lowest seed.
- **Forfeits in the Swiss** count as having met for repeat avoidance; both sides of a forfeit use
  the virtual opponent.
- **Intermediate standings** apply the final-table formula as if the event ended after that round (V
  with R = rounds played).
- **Full Swiss tie** within the top 64 (seeding or the cut) blocks the knockout until a standings
  ruling; full ties lower down are shown as shared.
- **Withdrawal** — effective from the given stage/round: a walkover in the 海选 or knockout, not
  paired in the Swiss, never eligible for the knockout.
- **A game without a winner** (draw/null) counts for nobody. 凤仪亭 without a scheme fact → awaiting
  ruling.
- **Round-synchronous** in every stage: a round's games go out once the whole previous round has
  settled.
- **Retries** — the lowest-numbered finished attempt counts; a retry keeps the same seed.
- **No third-place match** in the knockout.
- **Mock model** — its write-up says "θ beats θ−90°", the formula gives θ beats θ+90°; the code
  follows the formula.

## Checks

```sh
deno task fmt && deno task lint && deno task check && deno task test
```

CI runs the same four as the `v2 tournament` job when `v2_tournament_changed`.
