# Spec v2: Randomized Secrets Judge + Infrastructure Fixes

## Problem Statement

### Infrastructure Bugs (3)

**Bug 1: OOM Kill (CRITICAL)** - Fly VM has 256MB RAM. litellm is heavy (~100MB deps). Match engine gets OOM-killed at turn 0-1.
- Fix: Replace litellm with lightweight `openai` SDK. Bump VM to 512MB.

**Bug 2: Two Machines, Two DBs** - Fly spawned a second machine with its own baked-in SQLite. Match created on machine A returns 404 on machine B.
- Fix: Single machine + auto-seed on boot (no baked DB).

**Bug 3: DB Reset on Deploy** - `COPY axiia_cup.db .` in Dockerfile wipes data every deploy.
- Fix: Auto-seed on empty DB at startup. Consider Fly Volume for persistence (deferred).

### Judge Redesign

The current judge is a naive LLM that subjectively votes "who persuaded better." Two problems:
1. **Subjectivity** - inconsistent, unverifiable results
2. **Cheat vulnerability** - users write prompts for both roles and know the single hidden goal, so they can hardcode the opponent's secret

**New system: Randomized Secrets + Post-Match Interrogation**

Each role has **4 possible hidden secrets** instead of 1. At match time, one is picked at random for each role. After 20 turns, each agent must guess the opponent's secret from a multiple-choice list and explain their reasoning. Scoring is objective:
- **Protect your secret**: +1 if opponent guessed wrong
- **Discover opponent's secret**: +1 if you guessed right
- Higher score wins. Ties (1-1) are draws. No tiebreaker needed.

This eliminates both subjectivity and the cheat vector (can't hardcode a strategy for one specific secret when you don't know which will be picked).

---

## Design Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tiebreaker | Draws are fine | Only 4 outcomes: A wins 2-0, B wins 0-2, draw 1-1 x2 |
| Interrogation format | Guess + explain reasoning | "选择：A 理由：..." replaces old judge rationale |
| Secret visibility | Show all 4 to prompt writer | They see the pool but not which will be picked |
| Columbus secrets | Approved as proposed | 4 per role, historically plausible, balanced |

---

## Schema Changes

### scenarios table

Replace single hidden_goal with 4-secret arrays:
```sql
-- OLD:
role_a_hidden_goal TEXT DEFAULT ''
role_b_hidden_goal TEXT DEFAULT ''

-- NEW:
role_a_secrets TEXT DEFAULT '[]'   -- JSON array of 4 strings
role_b_secrets TEXT DEFAULT '[]'   -- JSON array of 4 strings
```

### matches table

Add columns for secret selection and interrogation:
```sql
secret_a_index INTEGER DEFAULT NULL,   -- 0-3: which secret was randomly picked
secret_b_index INTEGER DEFAULT NULL,
interrogation TEXT DEFAULT '{}',       -- JSON: guesses, correctness, reasoning
score_a REAL DEFAULT NULL,
score_b REAL DEFAULT NULL,
```

`interrogation` JSON structure:
```json
{
  "a_guess": 2,
  "a_guess_correct": false,
  "a_reasoning": "从对话中王室顾问反复提到北非局势...",
  "a_raw_response": "选择：C\n理由：...",
  "b_guess": 0,
  "b_guess_correct": true,
  "b_reasoning": "哥伦布在第9回合暗示了贸易垄断...",
  "b_raw_response": "选择：A\n理由：..."
}
```

---

## Engine Changes (`server/engine.py`)

### Replace litellm with openai SDK

```python
from openai import OpenAI
client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_API_BASE)
```

All models go through Qwen's OpenAI-compatible endpoint. litellm's multi-provider abstraction is pure overhead.

### New: `select_secrets(scenario)`

Randomly pick one secret index per role. Returns `(idx_a, idx_b, text_a, text_b)`.

### Modified: `build_messages(scenario, system_prompt, role, transcript, active_secret)`

Takes the selected secret as param instead of reading `role_a_hidden_goal` from scenario. Injects only the assigned secret into the agent's system prompt.

### Modified: `run_turn(scenario, system_prompt, model, role, transcript, active_secret)`

Passes `active_secret` through to `build_messages`.

### New: `run_interrogation(scenario, system_prompt, model, role, transcript, own_secret, opponent_secrets)`

After 20 turns, asks the agent to guess opponent's secret. Prompt:
```
对话已结束。请根据对话内容，推测对方的隐藏目标是什么。

对方可能的隐藏目标：
A. {secrets[0]}
B. {secrets[1]}
C. {secrets[2]}
D. {secrets[3]}

请回复格式：
选择：[A/B/C/D]
理由：[1-2句话说明你的判断依据]
```

Options are always in fixed order (same as stored in DB) to prevent information leakage.

### New: `_parse_interrogation(raw)`

Parses response into `(guess_index, reasoning)`. If unparseable, returns `(None, raw)`. None = treated as wrong guess (penalizes non-cooperation).

### New: `compute_winner(a_guessed_b, b_guessed_a)`

```
score_a = (1 if B failed to guess A) + (1 if A guessed B correctly)
score_b = (1 if A failed to guess B) + (1 if B guessed A correctly)
```

All possible outcomes:
| A guesses B | B guesses A | Score A | Score B | Winner |
|---|---|---|---|---|
| Correct | Correct | 1 | 1 | draw |
| Correct | Wrong | 2 | 0 | A |
| Wrong | Correct | 0 | 2 | B |
| Wrong | Wrong | 1 | 1 | draw |

### Removed: `run_judge()`, `JUDGE_VOTES`, `JUDGE_MODEL`

The 3x LLM judge voting is fully replaced by the interrogation system. Net LLM calls per match: -1 (was 20 turns + 3 judge = 23, now 20 turns + 2 interrogation = 22).

### Rewritten: `run_match(match_id)`

New flow:
1. Select random secrets → store indices in DB
2. Run 20 turns (pass selected secret to each agent's system prompt)
3. Run interrogation for agent A (guess B's secret)
4. Run interrogation for agent B (guess A's secret)
5. Compute scores → determine winner → store results

---

## Seed Data (`server/seed.py`)

Columbus scenario with 4 secrets per role:

**Role A (哥伦布):**
- A. 在协议中获取独家贸易权和总督头衔
- B. 确保航线发现后由自己家族世袭管理新领地
- C. 获取新大陆金矿开采权的优先许可
- D. 建立独立于王室的私人船队和贸易公司

**Role B (王室顾问):**
- A. 保护现有地中海贸易航线的利益集团
- B. 将远航资金转投北非军事扩张计划
- C. 为王室与热那亚银行的秘密债务争取还款时间
- D. 阻止航海发现打破教廷对异教地区的管辖权主张

Win condition updated to describe the objective scoring system.

---

## Frontend Changes (`index.html`)

### Builder UI: Show 4 Possible Secrets

In the scenario sidebar, under each role, show:
```
你的智能体可能被分配以下隐藏目标之一（随机选取，你无法控制）：
1. 在协议中获取独家贸易权和总督头衔
2. 确保航线发现后由自己家族世袭管理新领地
3. 获取新大陆金矿开采权的优先许可
4. 建立独立于王室的私人船队和贸易公司
```

### Match Result: Interrogation Results

Replace `renderJudgeRationale()` with `renderInterrogationResult()`:

```
┌──────────────────────────────────────────────┐
│  审讯结果                                     │
│                                               │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ 角色A (哥伦布)    │  │ 角色B (王室顾问) │   │
│  │ 保护秘密: 成功 ✓  │  │ 保护秘密: 失败 ✗ │   │
│  │ 发现秘密: 成功 ✓  │  │ 发现秘密: 失败 ✗ │   │
│  │ 得分: 2           │  │ 得分: 0          │   │
│  └──────────────────┘  └──────────────────┘   │
│                                               │
│  判定: 角色A 胜出 (2:0)                        │
│                                               │
│  ▾ 详细审讯记录                                │
│  A猜测B的秘密: "保护地中海贸易航线..." ✓       │
│  理由: "从对话中顾问反复提到..."               │
│  B猜测A的秘密: "金矿开采权..." ✗              │
│  理由: "哥伦布在第9回合暗示..."                │
│                                               │
│  A的实际秘密: 在协议中获取独家贸易权和总督头衔  │
│  B的实际秘密: 保护现有地中海贸易航线的利益集团  │
└──────────────────────────────────────────────┘
```

### Playground Queue

Rename step 4 from "裁判评分" to "审讯阶段".

### Demo Data

Update `DEMO_RATIONALES` to new interrogation format with guess + reasoning.

---

## Infrastructure Changes

### Dockerfile
```dockerfile
RUN pip install --no-cache-dir openai fastapi 'uvicorn[standard]'
```
Remove `COPY axiia_cup.db .`.

### fly.toml
```toml
[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

### server/api.py
Auto-seed on startup if scenarios table is empty.

### server/db.py
Detect Fly environment via `FLY_APP_NAME` env var → use `/data/axiia_cup.db` path.

---

## Execution Order

1. `server/db.py` - new schema (secrets arrays, interrogation columns, persistent path)
2. `server/engine.py` - replace litellm, new match flow (secret selection, interrogation, scoring)
3. `server/seed.py` - Columbus with 4 secrets per role
4. `server/api.py` - auto-seed logic
5. `Dockerfile` - openai instead of litellm, remove baked DB
6. `fly.toml` - memory bump
7. `index.html` - builder UI (4 secrets), interrogation result display, queue step rename, demo data
8. `SPEC_v2.md` - this file (already done)
9. Deploy to Vercel (static demo) + Fly (live backend)
10. Test end-to-end match

## Success Criteria

- Match runs all 20 turns without OOM
- Random secret selected per match (visible in match data)
- Post-match interrogation produces guess + reasoning for both agents
- Winner determined by objective scoring (not LLM judge opinion)
- Interrogation results visible in match result page
- Builder UI shows all 4 possible secrets per role
- Data persists across Fly deploys

---

## Next Step: CLI Interface

The web UI works for browsing and demos, but the actual competition workflow (15 internal participants submitting prompts, running matches, viewing results) needs a CLI interface for power users and batch operations.

**Planned CLI commands:**
- `axiia submit --scenario columbus --prompt-a @file_a.txt --prompt-b @file_b.txt --model qwen-plus` — submit prompts from files
- `axiia match --scenario columbus --sub-a 1 --sub-b 2` — create a match between two submissions
- `axiia status <match_id>` — check match status and results
- `axiia leaderboard --scenario columbus` — view current rankings
- `axiia run-tournament --scenario columbus --system swiss --rounds 4` — run a full Swiss-system tournament

This is the next implementation milestone after the current judge redesign ships.
