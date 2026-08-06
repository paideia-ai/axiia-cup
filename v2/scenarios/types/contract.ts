// Compiled into every per-scenario program by tools/validate.ts, next to exactly
// one script.js. Scripts are not modules, so their top-level `meta` and `main`
// land in the global scope, where these two assertions can reach them.

meta satisfies ScenarioMeta

main satisfies ScenarioMain
