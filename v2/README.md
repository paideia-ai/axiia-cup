# v2 — the frontend for the Swift axiia server

`v2/web` is the SPA that talks to the new Swift server behind
`axiia-cup-2.isofucius.cn`. It is independent of the bun API and web app in
`apps/`: different toolchain (deno + vite), different CI job, different image,
different host. A commit that touches only `v2/` never builds or deploys the
legacy stack, and vice versa.

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
deno task build
```

## Why the API is same-origin

The server refuses cross-origin mutations that carry a session cookie: it
requires `Sec-Fetch-Site: same-origin`. A sibling subdomain sends `same-site`,
which is refused, and adding CORS headers alone would not change that. So the
SPA is never served from a different origin than the API. In production the
`axiia-cup-2-web.isofucius.cn` vhost serves these files at `/` and proxies `/v1`
to the same Swift server the beta uses; in development the vite proxy plays that
role. Web code therefore builds no auth headers and no absolute API URLs — every
request is a relative `/v1/...`.

## v2/web is a mirror

`v2/web` is a byte-for-byte copy of `packages/axiia-web` in the private axiia
monorepo, including files this repo does not use (`BUILD.bazel`, `e2e/`). Keeping
it identical is what makes syncing safe in both directions via `git subtree`.

Do not restructure it, and put anything this repo needs — the Dockerfile, the
nginx config — in `v2/deploy` instead.

`vite.config.ts` currently carries one change made here first (the remote-target
dev proxy above); it owes a copy back upstream.

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
