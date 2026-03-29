# Axiia Cup — Agent Competition Platform PRD v1

> Source: Meeting transcript 2026-03-25 + Yihan's design decisions 2026-03-29
> Status: MVP specification (show full UX; backend can be incomplete)
> Engineers will rebuild post-MVP; this spec is for the demo only.

---

## 1. Product Overview

**Product Name:** Axiia Cup (AA Cup)

**One-liner:** A web platform where participants write system prompts for AI agents that compete in adversarial, goal-oriented dialogues across humanities subjects.

**MVP Goal:** Demonstrate the full user experience end-to-end. Backend completeness is secondary; the frontend must show every step of the flow.

---

## 2. Core User Flow

```
Register (phone + WeChat) → Choose Subject → Write System Prompt (both roles)
→ Select Model → Test in Playground → Submit → Matches Run Async
→ View Leaderboard
```

---

## 3. Functional Requirements

### F1. User Management

| Field | Required | Notes |
|---|---|---|
| Mobile phone number | Yes | Primary identifier |
| WeChat ID | Yes | Communication channel |
| Display name | Yes | Shown on leaderboard (anonymous option available) |
| Affiliation | Optional | School / organization |

- Self-service registration and login
- Dashboard: submitted agents (with version history), match history, current ranking

### F2. Subject & Scenario System

Each **subject** is a discipline (history, law, drama, negotiation, etc.). History is one subject among many.

Each subject contains one or more **scenarios**. A scenario defines:

| Element | Description |
|---|---|
| Subject | The discipline (history, law, drama, sales, philosophy, etc.) |
| Context | Background materials, setting, constraints |
| Role A | Name, public objective, hidden objective (optional) |
| Role B | Name, public objective, hidden objective (optional) |
| Boundary constraints | What is out-of-bounds (e.g., anachronisms, breaking character) |
| Win condition | Binary/quantifiable outcome — see [Judging](#f5-judging--scoring) |

- **MVP scope:** 1 scenario minimum (Simon/咳嗽 is designing the first one)
- Win conditions are scenario-specific. Simon defines them as part of scenario authoring.

### F3. Agent Builder

- **Input:** A single system prompt per role (plain text)
- **Prompt length limit:** 300 words (MVP)
- **No tool calling.** Strictly a single system prompt — no RAG, no multi-turn chains, no function calls.
- **Model selection:** Participant chooses from available domestic Chinese models. This is a strategic decision — part of the competition.
  - Available models (MVP): Kimi, DeepSeek, Qianwen, MiniMax (list may expand)
  - No overseas models (no Claude, GPT, Gemini)
  - No parameter tuning — temperature, top-k, etc. are locked by the platform (temperature = 0)
- **Both roles required:** Each participant must submit a prompt for Role A AND Role B.
- **Version management:** Participants can submit multiple versions. (Which version is used in competition TBD — for MVP, latest submitted version.)

### F4. Playground

The playground lets participants test their prompts before formal submission.

**MVP requirement:** The frontend UI must exist and be interactive. The backend does not need to be fully wired — it is acceptable if playground runs are simulated or limited.

**Playground capabilities (target):**
- Run your Role A prompt against your own Role B prompt
- Run your prompt against a baseline/default opponent
- View the full conversation transcript
- See preliminary judge evaluation of the test run

**Open design questions for playground:**
- Can participants run unlimited playground tests, or is there a quota?
- Does playground consume the same model API as competition, or a lighter model?
- Can participants share playground results with teammates?

### F5. Judging & Scoring

**Primary mechanism:** A single LLM call acts as judge.

- After each match (20-turn dialogue), the judge LLM receives the full conversation transcript plus the scenario's win condition specification.
- The judge outputs a binary win/loss determination per the scenario's win condition.
- Simon (咳嗽) designs the judge prompt alongside each scenario's win condition.

**Deferred decisions:**
- Post-conversation agent interrogation (asking agents "were you persuaded?") — will experiment later
- Historical accuracy penalties — deferred
- Multi-dimensional rubric scoring — deferred
- Relative win rate computation method (Elo, Glicko, raw %) — deferred

### F6. Match Engine

- **Execution model:** Fully asynchronous. Matches run in background; participants check results later.
- **Pacing:** No real-time pressure. Even at scale, matches can run slowly to generate results.
- **Turn count:** 20 turns per match (fixed for MVP).
- **Temperature:** 0 (deterministic output).
- **API failure handling:** Retry from the point of failure (resume mid-conversation, don't restart).
- **Opponent prompt visibility:** Participants cannot see their opponent's prompt.

### F7. Tournament System

**MVP:** Use a placeholder tournament format. The system must show rounds and results, but the exact format will iterate.

**Competition window:** Option A — open window. Anyone can submit at any time within the competition period. No synchronized sessions.

**Round structure (starting design):**
- Preliminary rounds: single match per pairing
- Final round: best of 3
- Exact bracket/group format: TBD (placeholder for MVP)

**Leaderboard displays:**
- Rank
- Participant name (or anonymous)
- Model used
- Win rate
- Scenario

### F8. Internal Competition (MVP Validation)

- Target: ~15 internal participants from the Axiia/30度 team
- Purpose: validate the full flow, find gaps, generate demo material
- Output: a working demo + results to show to advisors and sponsors

---

## 4. Technical Specification (MVP Only)

> **Important:** This is throwaway architecture for the MVP demo. The engineering team (Anna/米正) will redesign the production system. Do not over-invest in backend robustness.

### Proposed Stack

| Layer | MVP Approach |
|---|---|
| Frontend | Web app — full UX flow (registration through leaderboard) |
| Backend API | Minimal: user CRUD, prompt submission, match results |
| Match Engine | Async job runner: pair agents → run dialogue via model API → store transcript |
| Model Gateway | Adapter pattern for domestic model APIs (Kimi, DeepSeek, Qianwen, MiniMax) |
| Judge | Single LLM call per match with judge prompt |
| Database | Users, submissions (versioned), match transcripts, results |
| Playground | Frontend-functional; backend can be stubbed |

### API Flow

```
1. Participant submits prompt (Role A + Role B) + model choice
2. System pairs agents according to tournament bracket
3. Match engine runs 20-turn dialogue:
   - Turn 1: Role A agent generates response
   - Turn 2: Role B agent generates response
   - ... alternating for 20 turns
   - On API failure: retry from last successful turn
4. Judge LLM evaluates transcript → binary win/loss
5. Results written to leaderboard
```

---

## 5. Decision Log

All decisions made by Yihan on 2026-03-29, resolving ambiguities from the 2026-03-25 meeting.

### Resolved

| # | Question | Decision | Rationale |
|---|---|---|---|
| A1 | Win condition format | Simon designs per-scenario; LLM judge for now | Win conditions are scenario-specific, not platform-level |
| A2 | Submit one role or both? | Both roles required | Enables fair relative win rate comparison |
| A3 | Tournament format | Placeholder for MVP, iterate later | Not worth locking in before testing |
| A4 | Turns per match | 20 | Fixed for MVP |
| A5 | Playground scope | Frontend UI required; backend can be incomplete | MVP is about showing the UX |
| A6 | Judge: single call or pipeline? | Single LLM call | Simplicity for MVP |
| A7 | Submission window | Option A: open window, anyone anytime | No synchronized sessions needed |
| B1 | Can participants see opponent prompts? | No | Prompts are hidden |
| B3 | Prompt length limit? | 300 words | MVP constraint |
| B4 | Tool calling / RAG / multi-turn chains? | No — strictly single system prompt | Keeps competition about prompt craft |
| B6 | API failure handling? | Retry from point of failure | Don't restart entire match |
| B7 | Match determinism? | Temperature = 0 | Ensures reproducibility |
| B8 | Scoring method for rounds? | Single match in prelims; best-of-3 in finals | Balance token cost vs fairness |

### Deferred (Post-MVP)

| # | Question | Status |
|---|---|---|
| D1 | Post-conversation interrogation ("were you persuaded?") | Will experiment later to see how it performs |
| D2 | Historical accuracy penalties | Deferred |
| D3 | Relative win rate computation (Elo / Glicko / raw %) | Deferred |
| D4 | Multi-dimensional rubric scoring | Deferred |
| D5 | Prize structure (internships, cash, titles) | Deferred |
| D6 | Offline finals format | Deferred |
| D7 | International expansion | Deferred |
| D8 | Ambassador/organizer program | Deferred |
| D9 | Revenue model and sponsorship tiers | Deferred |
| D10 | Model-normalized scoring (fairness across models) | Model choice is part of strategy; no normalization planned |
| D11 | Version selection policy (which version counts in competition) | TBD |
| D12 | Playground backend functionality | Frontend-first; backend can be stubbed |
| D13 | Playground usage quotas | TBD |

### Not Discussing Now

- Judging products (rubric details beyond binary win/loss)
- Timeline risks
- Post-conversation interrogation design (experiment first)

---

## 6. Competitive Differentiation (from Meeting)

vs. **Werewolf AI competitions:**
1. Simpler (1v1 not multi-agent) — cheaper on tokens
2. Emphasizes the human builder's skill, not the model's raw capability
3. Humanities/academic focus — marketable to education (初高中, university)
4. Not a model benchmark; a human skill competition

vs. **OpenClaw / workflow agent competitions:**
- Those test "what can your agent do" (tool use, automation)
- Axiia Cup tests "how well can you craft adversarial dialogue strategy"
- Different skill being evaluated entirely

---

## Appendix: Meeting Participants & Roles

| Person | Role in Project |
|---|---|
| 周弋涵 (Yihan) | Overall lead, spec, frontend demo, sponsor/advisor outreach |
| 周一 (Zhou Yi) | Rule book, milestones, competitive landscape monitoring |
| 咳嗽 (Simon/Kesou) | Scenario design, judge rubric, win condition authoring |
| 杨斐 (Yang Fei) | Prompt expertise, consultation, demo prototyping |
| 金晓彤 (Liberty) | Tournament rules drafting |
| 安娜 (Anna) | Engineering (not in meeting) |
| 米正 (Mizheng) | Engineering (not in meeting) |
