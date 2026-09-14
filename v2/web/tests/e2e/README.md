# v3.4 real-server journeys

`deno task test:e2e:rewards` runs the reward and sound Gherkin mirrors in
`reward-points.spec.ts` and `sound-feedback.spec.ts`. It starts the real Vite
SPA on port 5189 and intercepts `/v1` with stateful, isolated HTTP fixtures. The
Chinese `test.step` descriptions mirror the neighboring `.feature` scenarios;
the sound journeys observe native Web Audio playback. This suite runs in web CI
without a backend, credentials, or model calls. Durable accounting,
authorization, atomic pricing and refunds are independently covered by the
companion backend's real HTTP/SQLite tests. Run the real-server suite below for
the existing full-stack journeys.

`deno task test:e2e:real` builds and boots the local Swift server with an
isolated SQLite database, seeds users through public HTTP APIs, starts this Vite
app, and runs Playwright in Chromium. Every mutation is checked again through a
real API read; the completed-match report uses a deterministic response fixture
because model inference is intentionally not part of the browser gate.

The shipped P1/P2/P4 journeys run normally. Confirmed P3/P5/P6 contracts stay as
named `fixme` tests until their routes and DTOs exist, so rollout cannot
silently forget #66/#76, #9–#12, #59/#79, or #39/#54.

Set `AXIIA_BIN` to reuse a built binary, `AXIIA_SERVER_REPO` if the backend is
not the sibling `axiia-cup-v2` checkout, and `PLAYWRIGHT_CHROMIUM_PATH` to
override the browser executable.

Building the binary requires Swift 6.3, Clang, rsync, and `libsqlite3-dev`. The
harness copies the backend into its disposable workspace before generating
manifests. In that copy only, it drops the retired `tca26` lockfile pin and
normalizes public GitHub SSH URLs to HTTPS, so neither the backend checkout nor
global Git configuration is changed.

## B3/A5 handoff-account smoke journey

`deno task test:e2e:handoff` is an opt-in, read-only smoke journey against the
deployed product and its prepared B3/A5 accounts. It starts with a fresh browser
profile. The B3 path starts on the published human-test manual and clicks its
actual `打开网页` link; the A5 path starts with a direct protected
`?tm=1&tmJourney=…&tmStep=…` URL. Both continue through product login, check the
restored route and exact guide step, verify the current nickname hint, and then
independently check ownership through both `/v1/my/agents` and the rendered
owner UI. It opens but does not submit the A5 opponent panel. It also opens and
cancels the separate board-identity prompt; no Test Mode result is written.

The B3 standings-entry clause runs as a distinct `test.fail` probe for
`U10-C11b`: the current standings row has no `/agents/:id` link. Its login,
fixture, and ownership checks run before the expected-failure annotation, so
infrastructure breakage still fails normally. When the product entry is added,
the exact `/agents/224` assertion becomes an unexpected pass and requires
removing that annotation.

The dedicated task enables its opt-in guard itself. Set `AXIIA_BASE_URL` and
inject these secrets through the runtime environment before invoking it:

- `AXIIA_B3_RICH_OWNER_EMAIL`
- `AXIIA_B3_RICH_OWNER_PASSWORD`
- `AXIIA_A5_RICH_CHALLENGER_EMAIL`
- `AXIIA_A5_RICH_CHALLENGER_PASSWORD`

`AXIIA_HANDOFF_MANUAL_URL` can override the published manual URL when verifying
a preview deployment. Leave it unset for the production handoff page. Real
account credentials are only accepted when `AXIIA_BASE_URL` is exactly
`https://axiia-cup-2-web.isofucius.cn`. A local product verification must point
to `localhost` or `127.0.0.1` and additionally set
`AXIIA_HANDOFF_ALLOW_LOCAL=1`; arbitrary remote origins are rejected before the
browser opens them.

Do not put account values in this repository, a command line, Playwright config,
or test output. This spec forcibly disables traces, videos, screenshots, and
automatic page snapshots even on failure. Without the opt-in flag it is
collected as three skipped tests, so the ordinary local real-server suite never
reaches the prepared deployment.
