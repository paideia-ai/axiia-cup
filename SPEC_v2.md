# Spec v2: Fix Match Execution + Judge Rationale

## Problem Statement

Three bugs prevent matches from completing, plus one missing feature:

### Bug 1: OOM Kill (CRITICAL)
The Fly VM has 256MB RAM. When `run_match` runs litellm API calls, Python memory exceeds this limit and the process is OOM-killed. Match stops at turn 0-1.

**Fix:** Increase VM to 512MB in `fly.toml`. Also consider: litellm is heavy (pulls in many dependencies). We could use `openai` SDK directly since all models go through Qwen's OpenAI-compatible endpoint anyway. This would cut memory usage significantly.

### Bug 2: Two Machines, Two DBs (CRITICAL)
Fly auto-started a second machine. Each machine has its own copy of `axiia_cup.db` baked into the Docker image. Match created on machine A returns 404 on machine B.

**Fix:** Set `max_machines_running = 1` and `min_machines_running = 1` in `fly.toml` (or scale to exactly 1 machine). For MVP with SQLite, we must have exactly 1 machine. Long-term: use Fly Volumes for persistent storage or switch to Postgres.

### Bug 3: DB Reset on Deploy
The SQLite DB is baked into the Docker image via `COPY axiia_cup.db .`. Every deploy wipes all data.

**Fix:** Use a Fly Volume to persist the DB. Mount at `/data`, change `DB_PATH` to `/data/axiia_cup.db`. On first boot, seed if DB doesn't exist.

### Feature: Judge Rationale
Currently the judge returns only "A", "B", or "draw". Users cannot see WHY a side won. This makes the result feel arbitrary and reduces the learning value.

## Changes

### 1. fly.toml - Memory + Single Machine

```toml
[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1

[mounts]
  source = "axiia_data"
  destination = "/data"
```

Scale to 1 machine: `fly scale count 1`

### 2. server/db.py - Persistent DB Path

Change `DB_PATH` to use `/data/axiia_cup.db` when running on Fly (detect via `FLY_APP_NAME` env var), fallback to local path for dev.

```python
import os
if os.environ.get("FLY_APP_NAME"):
    DB_PATH = Path("/data/axiia_cup.db")
else:
    DB_PATH = Path(__file__).parent.parent / "axiia_cup.db"
```

### 3. server/engine.py - Replace litellm with openai SDK

Since all models route through Qwen's OpenAI-compatible endpoint, we don't need litellm's multi-provider abstraction. Use the lightweight `openai` SDK directly:

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("QWEN_API_KEY", ""),
    base_url=os.environ.get("QWEN_API_BASE", ""),
)

def _completion(model, messages, temperature=0, max_tokens=500):
    resp = client.chat.completions.create(
        model=model, messages=messages,
        temperature=temperature, max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()
```

This eliminates litellm entirely (100+ MB of dependencies).

### 4. server/engine.py - Judge Rationale

Change the judge prompt to return structured output: verdict + rationale.

**Current judge output:** Just "A", "B", or "draw"

**New judge output format:**
```
胜者：A
理由：哥伦布在第7-9回合提出了令人信服的经济论据，包括香料贸易的潜在收益和葡萄牙竞争的紧迫性。王室顾问虽然提出了风险，但未能有效反驳这些经济论点。哥伦布在第15回合做出的让步（分享航海权）也显示了灵活的谈判策略。
```

The judge prompt changes:
```
请判断胜负并给出理由。格式如下：
胜者：A 或 B 或 draw
理由：（100-200字，分析双方表现，指出关键转折点和决定性论据）
```

Store the rationale in the match record:
- Add `judge_rationales` field (list of strings, one per vote)
- Parse the structured response in `run_judge()`

### 5. server/db.py - Schema Update

Add `judge_rationales` column to matches table:
```sql
ALTER TABLE matches ADD COLUMN judge_rationales TEXT DEFAULT '[]';
```

Handle via `init_db()` with try/except for the ALTER (idempotent).

### 6. index.html - Display Judge Rationale

In the match result page and playground completion:

**Match result page:** After the turns list, show a "裁判分析" section:
```html
<div class="judge-section">
  <div class="judge-header">裁判分析</div>
  <div class="judge-rationale">
    <div class="judge-vote">
      <span class="badge b-ok">投票 1: A</span>
      <p>哥伦布在第7-9回合提出了令人信服的经济论据...</p>
    </div>
    <!-- repeat for votes 2, 3 -->
  </div>
</div>
```

**Playground:** On match completion, show the winning rationale below the transcript.

### 7. index.html - Live Turn-by-Turn Display

The current polling code already renders transcript live. The bug is that matches die before producing turns (OOM). Once the OOM fix is deployed, the existing `pollPlayground()` function should work. However, improve the UX:

- Show a progress bar (turn X / 20) with animation
- Auto-scroll to latest turn as they appear
- Show "裁判评分中…" state after turn 20 while waiting for judge votes

### 8. Dockerfile - Remove litellm, add openai

```dockerfile
RUN pip install --no-cache-dir openai fastapi 'uvicorn[standard]'
```

Remove `COPY axiia_cup.db .` (DB lives on volume now).

### 9. server/api.py - Auto-seed on Empty DB

In the lifespan startup, after `init_db()`, check if scenarios table is empty. If so, run `seed.py` logic to create the Columbus scenario and test users.

## Execution Order

1. Replace litellm with openai SDK in engine.py + Dockerfile
2. Add judge rationale to engine.py + db.py
3. Fix DB persistence (volume mount, DB_PATH)
4. Fix fly.toml (memory, single machine, mount)
5. Update index.html (judge rationale display, progress UX)
6. Auto-seed logic in api.py
7. Deploy: create volume, deploy, verify
8. Test a real match end-to-end

## Success Criteria

- A match runs all 20 turns without OOM
- Each turn appears live in the playground as it completes
- Judge rationale is visible after match ends
- Data persists across deploys
