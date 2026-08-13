# v3.4 real-server journeys

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
