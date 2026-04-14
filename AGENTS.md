# AGENTS.md

## Authoritative docs

- Product/design decisions: `docs/competition/DESIGN_SPEC.md`
- Current CI/CD and production operations: `docs/tech/CI_CD_OPERATIONS.md`
- Server bootstrap and manual Docker Compose fallback: `docs/tech/DEPLOYMENT_SERVER.md`
- LLM gateway topology and provider routing: `docs/tech/LLM_GATEWAY_OPERATIONS.md`

## Notes for agents

- Treat `docs/tech/CI_CD_OPERATIONS.md` as the canonical reference for the **current** production deploy path.
- Treat `docs/tech/DEPLOYMENT_SERVER.md` as bootstrap/manual-fallback guidance, not the standard release path.
- Historical docs may describe older infrastructure choices; prefer the current ops doc when they conflict.
