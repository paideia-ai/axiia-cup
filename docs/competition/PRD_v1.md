<!-- /autoplan restore point: /Users/yihan/.gstack/projects/axiia-cup/master-autoplan-restore-20260329-112455.md -->

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

| Field               | Required | Notes                                             |
| ------------------- | -------- | ------------------------------------------------- |
| Mobile phone number | Yes      | Primary identifier                                |
| WeChat ID           | Yes      | Communication channel                             |
| Display name        | Yes      | Shown on leaderboard (anonymous option available) |
| Affiliation         | Optional | School / organization                             |

- Self-service registration and login
- Dashboard: submitted agents (with version history), match history, current ranking

### F2. Subject & Scenario System

Each **subject** is a discipline (history, law, drama, negotiation, etc.). History is one subject among many.

Each subject contains one or more **scenarios**. A scenario defines:

| Element              | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| Subject              | The discipline (history, law, drama, sales, philosophy, etc.)     |
| Context              | Background materials, setting, constraints                        |
| Role A               | Name, public objective, hidden objective (optional)               |
| Role B               | Name, public objective, hidden objective (optional)               |
| Boundary constraints | What is out-of-bounds (e.g., anachronisms, breaking character)    |
| Win condition        | Binary/quantifiable outcome — see [Judging](#f5-judging--scoring) |

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

**Single-player practice mode (TBD):**

- Possibility: player vs fixed NPC (e.g., 商鞅 Game 1 pattern — player controls one role, system controls the other with a fixed prompt)
- Would provide onboarding + separate leaderboard (everyone faces the same "boss")
- Whether to implement, and turn count / format, is up to scenario authors — not a platform-level decision
- Decision deferred to scenario design phase

**Open design questions for playground:**

- Can participants run unlimited playground tests, or is there a quota?
- Does playground consume the same model API as competition, or a lighter model?
- Can participants share playground results with teammates?

### F5. Judging & Scoring

**Primary mechanism:** LLM judge with public persona prompt.

- The **judge prompt is public** — all participants can read it. Since competition is symmetric (both sides can optimize for it), transparency doesn't break fairness. It reduces complaints and lets players reason about the scoring.
- The judge has a **scenario persona** (e.g., Queen Isabella for Columbus, Emperor for 商鞅). After the dialogue ends, the judge persona asks each agent several questions. The final score is determined by key answers.
- Simon (咳嗽) designs the judge persona and questions alongside each scenario.
- **Statistical stability over mechanical precision:** Individual LLM judgments have variance, but over many matches (Swiss-system), skill converges statistically. This is the poker model — variance per hand, skill over volume.
- The judge prompt is **versioned** — updated openly based on player feedback, like competitive game balance patches.

**Resolved (from deferred):**

- ~~Post-conversation agent interrogation~~ → This IS the judge now. The persona asks questions post-conversation. (was D1)
- ~~Multi-dimensional rubric scoring~~ → Judge persona questions naturally create multi-dimensional scoring. (was D4)

**Still deferred:**

- Historical accuracy penalties — deferred
- Relative win rate computation method (Elo, Glicko, raw %) — Swiss standings + Buchholz tiebreaker for MVP; persistent rating system deferred to post-MVP

### F6. Match Engine

- **Execution model:** Fully asynchronous. Matches run in background; participants check results later.
- **Pacing:** No real-time pressure. Even at scale, matches can run slowly to generate results.
- **Turn count:** Customizable per scenario (default 20, scenario authors may set 10–20).
- **Temperature:** 0 (deterministic output).
- **API failure handling:** Retry from the point of failure (resume mid-conversation, don't restart).
- **Opponent prompt visibility:** Participants cannot see their opponent's prompt.

### F7. Tournament System

**Format: Swiss-system.** Each round pairs players with similar records. No one is eliminated — everyone plays all rounds.

- **15 players, 4 rounds ≈ 56 matches** (vs 210 for round-robin). Saves ~73% token cost.
- Each round: same-record players paired; no rematches allowed; odd-count tiers borrow from adjacent tier.
- Final ranking: wins → Buchholz tiebreaker (average opponent strength).

**Competition window:** Option A — open window. Anyone can submit at any time within the competition period. No synchronized sessions.

**Round structure:**

- All rounds: single match per pairing (each pairing plays both role assignments: A's Role-A vs B's Role-B AND A's Role-B vs B's Role-A)
- 4 Swiss rounds for MVP (15 players)

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

| Layer         | MVP Approach                                                                  |
| ------------- | ----------------------------------------------------------------------------- |
| Frontend      | Web app — full UX flow (registration through leaderboard)                     |
| Backend API   | Minimal: user CRUD, prompt submission, match results                          |
| Match Engine  | Async job runner: pair agents → run dialogue via model API → store transcript |
| Model Gateway | Adapter pattern for domestic model APIs (Kimi, DeepSeek, Qianwen, MiniMax)    |
| Judge         | Public persona-based LLM judge; versioned prompt per scenario                 |
| Database      | Users, submissions (versioned), match transcripts, results                    |
| Playground    | Frontend-functional; backend can be stubbed                                   |

### API Flow

```
1. Participant submits prompt (Role A + Role B) + model choice
2. System pairs agents according to tournament bracket
3. Match engine runs 20-turn dialogue:
   - Turn 1: Role A agent generates response
   - Turn 2: Role B agent generates response
   - ... alternating for 20 turns
   - On API failure: retry from last successful turn
4. Judge persona asks each agent post-dialogue questions → scores on key answers
5. Results written to leaderboard
```

---

## 5. Decision Log

All decisions made by Yihan on 2026-03-29, resolving ambiguities from the 2026-03-25 meeting.

### Resolved

| #   | Question                                | Decision                                                                                                                                                                                                                     | Rationale                                                           |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A1  | Win condition format                    | Simon designs per-scenario; LLM judge for now                                                                                                                                                                                | Win conditions are scenario-specific, not platform-level            |
| A2  | Submit one role or both?                | Both roles required                                                                                                                                                                                                          | Enables fair relative win rate comparison                           |
| A3  | Tournament format                       | **Swiss-system**, 4 rounds for 15 players (~56 matches)                                                                                                                                                                      | Saves ~73% token cost vs round-robin; confirmed 2026-03-30          |
| A4  | Turns per match                         | **Customizable per scenario** (default 20, scenario authors may set 10–20)                                                                                                                                                   | 商鞅 designs use 10 turns; updated 2026-03-30                       |
| A5  | Playground scope                        | Frontend UI required; backend can be incomplete                                                                                                                                                                              | MVP is about showing the UX                                         |
| A6  | Judge design                            | **Public persona-based LLM judge**; judge prompt is public + versioned, judge has scenario persona (e.g. Emperor), asks each agent questions post-dialogue, scores on key answers; statistical convergence over many matches | Eliminates subjective black-box judging; confirmed 2026-03-30       |
| A7  | Submission window                       | Option A: open window, anyone anytime                                                                                                                                                                                        | No synchronized sessions needed                                     |
| B1  | Can participants see opponent prompts?  | No                                                                                                                                                                                                                           | Prompts are hidden                                                  |
| B3  | Prompt length limit?                    | 300 words                                                                                                                                                                                                                    | MVP constraint                                                      |
| B4  | Tool calling / RAG / multi-turn chains? | No — strictly single system prompt                                                                                                                                                                                           | Keeps competition about prompt craft                                |
| B6  | API failure handling?                   | Retry from point of failure                                                                                                                                                                                                  | Don't restart entire match                                          |
| B7  | Match determinism?                      | Temperature = 0                                                                                                                                                                                                              | Ensures reproducibility                                             |
| B8  | Scoring method for rounds?              | Single match per pairing per Swiss round (both role assignments)                                                                                                                                                             | Swiss-system handles fairness through volume; best-of-3 unnecessary |

### Deferred (Post-MVP)

| #   | Question                                                       | Status                                                                                      |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| D1  | ~~Post-conversation interrogation~~                            | **Resolved 2026-03-30**: This IS the judge now — persona asks questions post-dialogue       |
| D2  | Historical accuracy penalties                                  | Deferred                                                                                    |
| D3  | Relative win rate computation (Elo / Glicko / raw %)           | Swiss standings + Buchholz for MVP; persistent rating system deferred                       |
| D4  | ~~Multi-dimensional rubric scoring~~                           | **Resolved 2026-03-30**: Judge persona questions create multi-dimensional scoring naturally |
| D5  | Prize structure (internships, cash, titles)                    | Deferred                                                                                    |
| D6  | Offline finals format                                          | Deferred                                                                                    |
| D7  | International expansion                                        | Deferred                                                                                    |
| D8  | Ambassador/organizer program                                   | Deferred                                                                                    |
| D9  | Revenue model and sponsorship tiers                            | Deferred                                                                                    |
| D10 | Model-normalized scoring (fairness across models)              | Model choice is part of strategy; no normalization planned                                  |
| D11 | Version selection policy (which version counts in competition) | TBD                                                                                         |
| D12 | Playground backend functionality                               | Frontend-first; backend can be stubbed                                                      |
| D13 | Playground usage quotas                                        | TBD                                                                                         |

### Not Discussing Now

- Timeline risks
- Specific judge persona question design per scenario (Simon owns)

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

| Person             | Role in Project                                             |
| ------------------ | ----------------------------------------------------------- |
| 周弋涵 (Yihan)     | Overall lead, spec, frontend demo, sponsor/advisor outreach |
| 周一 (Zhou Yi)     | Rule book, milestones, competitive landscape monitoring     |
| 咳嗽 (Simon/Kesou) | Scenario design, judge rubric, win condition authoring      |
| 杨斐 (Yang Fei)    | Prompt expertise, consultation, demo prototyping            |
| 金晓彤 (Liberty)   | Tournament rules drafting                                   |
| 安娜 (Anna)        | Engineering (not in meeting)                                |
| 米正 (Mizheng)     | Engineering (not in meeting)                                |

---

## /autoplan CEO Review (Phase 1)

**Mode:** SELECTIVE EXPANSION | **Expansion accepted:** Judge 3x majority vote

### NOT in Scope (Deferred)

| Item                                            | Rationale                                     |
| ----------------------------------------------- | --------------------------------------------- |
| Live match spectating                           | Streaming complexity, not needed for MVP demo |
| Match replay viewer                             | Raw transcript suffices for internal test     |
| Prompt version diff view                        | Needs usage data first                        |
| Social sharing cards                            | Premature before format validated             |
| Scenario SDK / creation framework               | Important for moat but post-MVP concern       |
| PIPL-compliant data protection                  | Only 15 internal users for MVP                |
| Retention loop / between-competition engagement | Post-MVP product decision                     |
| Model parity testing / normalization            | User decision: model choice is strategy       |
| Intermediate prompt tiers (conditional logic)   | User decided: single system prompt only       |

### What Already Exists

| Sub-problem              | Existing Code/Patterns                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| Prompt playground        | Qijia's coach prompt playground (design reference only, no code reuse) |
| Multi-model API gateway  | Common pattern; LiteLLM or custom adapters                             |
| Tournament bracket logic | Open-source bracket libraries exist                                    |
| LLM-as-judge             | Established pattern in eval frameworks (OpenAI evals, etc.)            |

### Dream State Delta

This plan takes us from 0 → 1 (working demo). The gap from 1 → 12-month ideal requires: production backend rebuild, multiple scenarios across subjects, validated judging methodology, community/retention features, sponsorship deals, and ambassador program. The demo provides proof-of-concept for advisor/sponsor conversations.

### Error & Rescue Registry (Plan Stage)

| Codepath                    | What Can Go Wrong                       | Rescued?                 | User Sees                      |
| --------------------------- | --------------------------------------- | ------------------------ | ------------------------------ |
| Model API call (match turn) | Timeout / rate limit / 5xx              | Yes (retry from failure) | Match continues from last turn |
| Model API call (judge)      | Timeout / malformed / ambiguous verdict | GAP                      | Undefined                      |
| User registration           | Duplicate phone                         | GAP                      | Undefined                      |
| Prompt submission           | Empty / over 300 words                  | GAP                      | Undefined                      |
| Match pairing               | Odd participants / no opponent          | GAP                      | Undefined                      |
| Model content moderation    | Role-play scenario rejected by model    | GAP                      | Undefined                      |

### Failure Modes Registry

| Codepath       | Failure Mode                                     | Rescued?            | Test? | User Sees            | Logged?              |
| -------------- | ------------------------------------------------ | ------------------- | ----- | -------------------- | -------------------- |
| Judge LLM call | Returns neither win nor loss                     | N                   | N     | Silent               | N — **CRITICAL GAP** |
| Judge LLM call | Inconsistent across runs                         | MITIGATED (3x vote) | N     | Majority result      | N                    |
| Match dialogue | Agents loop identical responses                  | N                   | N     | 20 turns of nonsense | N                    |
| Match dialogue | Model refuses role-play (safety filter)          | N                   | N     | Match fails          | N                    |
| Playground     | Backend stubbed, results don't match competition | By design           | N/A   | Misleading feedback  | N/A                  |

### Accepted Scope Expansion

- **Judge 3x majority vote:** Run judge LLM 3 times per match, take majority verdict. Near-zero cost, mitigates single-call unreliability (Premise P3). If all 3 disagree, flag for manual review.

### CEO Completion Summary

```
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                         |
| System Audit         | Greenfield repo, 1 commit, no code          |
| Step 0               | 6 premises evaluated, P3 (judge) weakest    |
| Section 1  (Arch)    | 0 issues — MVP monolith is fine              |
| Section 2  (Errors)  | 5 error paths mapped, 5 GAPS (plan stage)   |
| Section 3  (Security)| 1 issue (PIPL) — deferred, MVP-internal only |
| Section 4  (Data/UX) | 4 edge cases noted, deferred to impl         |
| Section 5  (Quality) | N/A — no code                               |
| Section 6  (Tests)   | Internal competition IS the test             |
| Section 7  (Perf)    | 0 issues — async design handles rate limits  |
| Section 8  (Observ)  | Match logging needed — impl detail           |
| Section 9  (Deploy)  | MVP deploy unspecified, acceptable            |
| Section 10 (Future)  | Retention loop gap flagged by both voices    |
| Section 11 (Design)  | 5 missing interaction states noted            |
+--------------------------------------------------------------------+
| NOT in scope         | written (9 items)                            |
| What already exists  | written (4 references)                       |
| Dream state delta    | written                                      |
| Error/rescue registry| 6 codepaths, 5 GAPS (plan-stage)             |
| Failure modes        | 5 total, 1 CRITICAL GAP (judge no-verdict)   |
| TODOS.md updates     | deferred to Phase 4 (collected across phases)|
| Scope proposals      | 5 proposed, 1 accepted (judge 3x)            |
| CEO plan             | N/A — not persisting for SELECTIVE+MVP       |
| Outside voice        | ran (codex + claude subagent)                |
| Dual voices          | 6/6 confirmed, 0 disagreements               |
| Diagrams produced    | 0 (no code to diagram)                       |
| Unresolved decisions | 0                                            |
+====================================================================+
```

<!-- AUTONOMOUS DECISION LOG -->

## Decision Audit Trail

| #   | Phase  | Decision                                                                      | Principle | Classification        | Rationale                                                            | Rejected                                       |
| --- | ------ | ----------------------------------------------------------------------------- | --------- | --------------------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | CEO    | Mode: SELECTIVE EXPANSION                                                     | P1+P6     | Mechanical            | User said "MVP only" — hold scope, cherry-pick                       | EXPANSION (too ambitious for throwaway MVP)    |
| 2   | CEO    | Approach A: full-stack web app                                                | P1        | Mechanical            | User explicitly wants "full UX demo"                                 | Approach B (script-based), C (playground-only) |
| 3   | CEO    | Accept judge 3x expansion                                                     | P1+P5     | Mechanical            | Near-zero cost, directly mitigates biggest risk                      | Deferring judge reliability                    |
| 4   | CEO    | Defer live spectating                                                         | P3        | Mechanical            | Streaming complexity, not MVP                                        | Adding to scope                                |
| 5   | CEO    | Defer match replay viewer                                                     | P3        | Mechanical            | Raw transcript suffices                                              | Adding to scope                                |
| 6   | CEO    | Defer social sharing                                                          | P6        | Mechanical            | Premature before format validated                                    | Adding to scope                                |
| 7   | CEO    | Defer PIPL compliance                                                         | P6        | Mechanical            | 15 internal users only                                               | Adding to scope                                |
| 8   | CEO    | Section 2 error gaps: log, don't expand                                       | P5        | Mechanical            | Implementation details for eng team                                  | Expanding scope to specify all error handling  |
| 9   | CEO    | Section 4 edge cases: note, don't expand                                      | P3        | Mechanical            | Implementation details                                               | Expanding scope                                |
| 10  | CEO    | Section 11 UI states: note for frontend                                       | P5        | Mechanical            | Useful guidance, not scope expansion                                 | Ignoring                                       |
| 11  | Design | Define 5 named screens                                                        | P1        | Mechanical            | Near-zero cost, prevents implementer guessing                        | Leaving undefined                              |
| 12  | Design | Specify match lifecycle states                                                | P1        | Mechanical            | Core async UX, must be defined                                       | Leaving undefined                              |
| 13  | Design | Post-submission WeChat notification                                           | P1 vs P3  | Taste                 | Adds engagement but adds integration complexity                      | —                                              |
| 14  | Design | Agent Builder UI guidance (scenario context alongside editor)                 | P1        | Mechanical            | Core creative surface needs minimum spec                             | Generic textarea                               |
| 15  | Design | Skip subject selection for MVP, hardcode scenario                             | P5        | Mechanical            | One scenario = no selection needed                                   | Building empty selector                        |
| 16  | Design | Anonymous users show as "Player [4-digit ID]"                                 | P5        | Mechanical            | Simple, trackable, no ambiguity                                      | Undefined anonymous display                    |
| 17  | Design | MVP pairing format: Swiss-system (user override)                              | P3        | Taste — USER OVERRIDE | Swiss reduces 420 matches to ~60, saves 80% API cost                 | Round-robin (too expensive)                    |
| 18  | Design | Defer responsive/a11y specs                                                   | P6        | Mechanical            | Internal test with 15 people                                         | Full a11y spec                                 |
| 19  | Eng    | Define match protocol: A's Role-A vs B's Role-B AND A's Role-B vs B's Role-A  | P5        | Mechanical            | Both-role submission creates 2 matches per pairing, must be explicit | Leaving undefined                              |
| 20  | Eng    | Add combinatorial math to PRD (~60 matches for 15 participants, Swiss-system) | P5        | Mechanical            | Cost/feasibility must be visible to stakeholders                     | Hiding complexity                              |
| 21  | Eng    | Distinguish transient vs permanent model API failures                         | P5        | Mechanical            | Content moderation refusals != timeouts                              | Treating all failures as retryable             |
| 22  | Eng    | Define MatchTranscript schema (scenario_id, turns, metadata)                  | P5        | Mechanical            | Judge + match engine need a contract                                 | Ad-hoc serialization                           |
| 23  | Eng    | Tag matches as playground vs competition                                      | P5        | Mechanical            | Prevent playground data leaking into rankings                        | No separation                                  |
| 24  | Eng    | Prompt injection mitigation: never show raw transcripts                       | P1 vs P5  | Taste                 | Security vs transparency for learning loop                           | —                                              |
| 25  | Eng    | "300 words" → "1000 characters" for Chinese text                              | P5        | Mechanical            | Unambiguous metric                                                   | Language-dependent counting                    |
| 26  | Eng    | Judge prompt validation: 10-20 ground-truth corpus before internal test       | P1        | Mechanical            | Single most impactful action per both voices                         | Skipping validation                            |
| 27  | Eng    | Lock versions at round start, no mid-round submission                         | P5        | Mechanical            | Prevents gaming and zombie version conflicts                         | Open submission during matches                 |
| 28  | Eng    | Judge 3x at temp=0 may be identical — add prompt perturbation                 | P1        | Mechanical            | If same prompt → same output, 3x vote is meaningless                 | Identical 3x calls                             |

## GSTACK REVIEW REPORT

| Review        | Trigger               | Why                     | Runs | Status               | Findings                                                                           |
| ------------- | --------------------- | ----------------------- | ---- | -------------------- | ---------------------------------------------------------------------------------- |
| CEO Review    | `/plan-ceo-review`    | Scope & strategy        | 1    | DONE (via /autoplan) | 6 premises, 1 expansion accepted (judge 3x), 5 error gaps, 1 critical failure mode |
| Design Review | `/plan-design-review` | UI/UX gaps              | 1    | DONE (via /autoplan) | 7 dimensions scored (avg 2.4/10), 4 critical + 9 high findings                     |
| Eng Review    | `/plan-eng-review`    | Architecture & tests    | 1    | DONE (via /autoplan) | 4 critical + 8 high findings, test plan written                                    |
| Codex Review  | `/codex review`       | Independent 2nd opinion | 3    | DONE (via /autoplan) | CEO: 6 blind spots. Design: 7 concerns. Eng: 12 findings                           |

**VERDICT:** REVIEWED — 3 phases complete. 2 taste decisions + cross-phase themes surfaced at gate.
