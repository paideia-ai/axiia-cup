# v2 — the frontend and scenarios for the Swift axiia server

`v2/web` is the SPA that talks to the Swift server behind
`axiia-cup-2.isofucius.cn`. It is the only frontend this repository ships: the
legacy v1 bun API and web app were deleted on 2026-09-06, after production cut
over to the Swift server on 2026-09-02.

`v2/scenarios` is where prompt engineers author the game scripts the server
runs. It is its own stack again: `v2_scenarios_changed` and `v2_web_changed` are
separate classifier flags, so a prompt edit never rebuilds the SPA and an SPA
edit never runs the scenario checks. See `v2/scenarios/SKILL.md` for the
authoring guide; the whole toolchain is deno 2.9.1.

```sh
cd v2/scenarios
deno task validate   # typecheck + meta extraction over every scenario
deno task fmt
deno task lint
```

`deploy_v2_scenarios` in `.github/workflows/build.yml` ships them on push to
`main`: it exchanges a GitHub OIDC assertion for a short-lived token at
`/v1/auth/federated` and runs `deno task push`. No token is stored here.

Current PvP behavior is specified in
[Single-match PvP (2026-09-17)](../docs/competition/2026-09-17-single-match-pvp.md).

## Working on it

You need deno 2.9.1 and nothing else — no Swift toolchain, no docker, no
database.

```sh
cd v2/web
deno install --frozen
AXIIA_PROXY_TARGET=https://axiia-cup-2.isofucius.cn deno task dev
```

Open http://localhost:5173 and sign in with your account on the beta. The vite
dev server proxies `/v1` to the deployed server, so the browser sees a single
origin and the session cookie works; the proxy also strips the cookie's `Secure`
flag, which a browser would otherwise refuse to store over plain http.

Point `AXIIA_PROXY_TARGET` at `http://127.0.0.1:8080` instead if you are running
`axiia serve` locally. That is the default.

Before pushing:

```sh
deno task fmt        # --check; run `deno fmt .` to fix
deno task lint
deno task typecheck
deno task typecheck:tests
deno task test       # pure rules + Chromium Storybook/MSW/axe contracts
deno task build
```

The v3.4 acceptance stack has three layers:

- `deno task test:unit` runs deterministic Vitest contracts for gates, prompt
  counting, replay, transcript grouping, rejection copy, and score derivation.
- `deno task test:storybook` runs stateful stories in real Chromium with MSW;
  the accessibility addon makes axe violations fail the command.
- `deno task test:e2e:real` builds and boots the sibling Swift server in an
  isolated workspace, seeds it through public APIs, then runs Playwright UI
  journeys with API read-back assertions. Set `AXIIA_BIN` to reuse a built
  server or `AXIIA_SERVER_REPO` when its checkout is elsewhere. A Swift 6.3
  toolchain, Clang, rsync, and the SQLite development headers are required only
  when the command must build the server itself. The build uses an isolated
  source copy and does not modify the sibling backend checkout.

Navigation controls use React Router `Link`/`NavLink`, or `ButtonLink` for
button styling. Do not nest buttons inside links or implement page shortcuts
with button click handlers: native anchors preserve middle-click, Ctrl/Cmd-click,
Shift-click, keyboard activation, and the browser's link context menu. Dialogs,
disclosures, and form submissions remain buttons. Get-or-create shortcuts link
to `/agents/entry` (or the public scene's `/scenarios/:id/build` entry); the
destination tab resolves the agent and replaces the entry with the agent home
or builder, with a retry on failure. Continuing an accepted first battle uses
`?express=1` to preserve its guidance in new tabs, without dispatching again.

`deno task test:e2e:navigation` builds and serves the SPA locally, then verifies navigation
using intercepted API fixtures, including new tabs and entry error/retry behavior.
It needs Chromium but no backend or live account, and also runs in CI.

For a manual navigation preview, run `deno task preview:navigation` and open
`http://127.0.0.1:5177/agents/101` or
`http://127.0.0.1:5177/scenarios/shangyang-court`. This serves the built frontend
with local fixture responses, requires no login, and never contacts the live
backend. Agent lookup returns simulated IDs; saving, deleting, and dispatching
battles are disabled. Stop it with Ctrl+C. On a remote development machine,
forward port 5177 to your browser's machine first.

For the scenario-to-agent flow, run `deno task preview:scenario-agents` and open
`http://127.0.0.1:5178/scenarios/fengyiting-real`. This preview includes all five
scenarios: Dong Zhuo has 13 agents and the second holds the entry version; each
side B has two agents with no entry version. Check direct home navigation,
same-role switching, refresh, and returning to the full inventory. It uses the
same local-only fixture server and does not save changes or run battles.

Confirmed P3/P5/P6 behaviors that do not exist yet remain visible as named
Playwright `fixme` contracts. They are not counted as passing functionality.

## Why the API is same-origin

The server refuses cross-origin mutations that carry a session cookie: it
requires `Sec-Fetch-Site: same-origin`. A sibling subdomain sends `same-site`,
which is refused, and adding CORS headers alone would not change that. So the
SPA is never served from a different origin than the API. In production the
`axiia-cup-2-web.isofucius.cn` vhost serves these files at `/` and proxies `/v1`
to the same Swift server the beta uses; in development the vite proxy plays that
role. Web code therefore builds no auth headers and no absolute API URLs — every
request is a relative `/v1/...`.

## Frontend source of truth

`v2/web` is the current source of truth for the v3.4 frontend deployed at
`axiia-cup-2-web.isofucius.cn`. The build and deployment workflow in this
repository packages this directory directly.

The private `axiia-cup-v2` repository still contains an older embedded copy at
`packages/axiia-web`, used when building the SPA into the Swift server binary.
The two directories are not currently byte-for-byte identical and there is no
automatic synchronization between them. Do not assume that a change made in
one tree exists in the other, and do not use the embedded copy as the acceptance
target for current v3.4 frontend work.

Until the duplicate is removed or a one-way synchronization process is
established, make v3.4 frontend changes and run frontend acceptance tests here
in `v2/web`. Keep repository-specific deployment files such as the Dockerfile
and nginx configuration in `v2/deploy`.

## Deployment

Push to `main` with anything under `v2/` changed and it ships automatically:

1. `build_v2_web` builds `v2/deploy/Dockerfile.web` — deno build, then the static
   files in an nginx image — and pushes it to ACR as
   `apps/axiia-web2:<commit-sha>`.
2. `deploy_v2_web` calls the deploy webhook with `target: "web2"`, which pulls
   that image, restarts the container on `127.0.0.1:8203`, and waits for it to
   answer.

The image is tagged by commit sha, never by a git tag. Nothing here holds a
secret: the SPA is static and every credential lives on the server side.
