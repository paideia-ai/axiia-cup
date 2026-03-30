# CLAUDE.md — axiia-cup

## Authoritative Design Document

**`docs/competition/DESIGN_SPEC.md`** is the single source of truth for all Axiia Cup design decisions, rules, and specifications (Chinese).

- Any new decision or design update **must** be reflected in this document.
- Historical docs (PRD_v1.md, SPEC_v2.md, judge-design-discussion.md, tournament-format.md) are **reference only**.
- This document serves as the final sync point across the entire team.

## Project Structure

- `docs/competition/` — Competition design: authoritative spec, problem scenarios, event materials
- `docs/tech/` — Tech specs: design system, infrastructure notes, API mocks
- `server/` — Python backend (FastAPI + SQLite)
- `index.html` — Frontend demo

## Commands

```bash
uv run python -m server.seed        # seed database
uv run uvicorn server.api:app       # start server at localhost:8000
```

## Deployment

- Fly.io: `fly deploy`
- Static demo: Vercel (axiia-cup.vercel.app)

## Team Communication

- Feishu group: "axiia cup 智能体 大赛 筹备"
- GitHub: github.com/paideia-ai/axiia-cup
