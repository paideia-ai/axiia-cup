# Ladder demo

Build the isolated browser demo with `deno task build:sortie-demo`. This
produces `build/vercel-demo`, including `vercel.json`. Deploy only that
directory:

```sh
vercel deploy build/vercel-demo --project axiia-ladder-demo --yes --prod
```

`/sortie` is the ladder and `/demo/mobile.html` is the phone preview. The worker
intercepts same-origin `/v1` requests using fictional fixtures. It never
connects to the Swift backend, spends account points, or invokes models. Each
tab has its own simulated matches; reloading resets the demonstration. Only a
build with both demo flags enables this worker. Ordinary builds use the
authenticated Swift ladder API and do not load demo fixtures.

The public comparison pages live at `/demo/nav-options-v2.html`; option 08 is
applied to the app. Desktop tabs use the regular navigation style.
