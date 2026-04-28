# Judge Model Comparison: DeepSeek V3.2 vs Kimi K2.5

**Date:** 2026-04-27  
**Scenario:** 商鞅变法·朝堂辩法 (shangyang-court)  
**Tournament:** T8 (top-5 inter-player matches)  
**Question:** Does swapping the judge LLM change match outcomes?

---

## Background

All T8 matches were judged by DeepSeek V3.2 (default). The scenario has two known historical anecdotes suggesting judge model matters:

- GPT-4 as judge → 商鞅 (role A) wins almost every match
- Claude Opus as judge → 甘龙 (role B) wins almost every match
- DeepSeek → mixed results

No controlled experiment existed. This is the first controlled test: same transcripts, same examination Q&A, different judge model.

---

## Method

### What was re-run

Only the **judge's final decision call** — not the player dialogue or examination phase. The existing T8 match data (transcript + judge Q&A + info assignment) was fed verbatim to a different judge model.

### Endpoint built

`POST /api/admin/rejudge` — admin-only endpoint that:
1. Takes `matchIds[]` + `judgeModel`
2. Loads each match's transcript, judgeTranscriptA/B, infoAssignment from DB
3. Rebuilds the exact judge prompt via `buildJudgePrompt()`
4. Calls the new judge model with `temperature=0`
5. Returns the raw decision text

The endpoint is **async** (returns a `jobId` immediately; all 8 judge calls run in parallel). A `GET /api/admin/rejudge/:jobId` poll endpoint retrieves results. This was necessary because Kimi K2.5 thinking traces take 100–120s per call, exceeding the 100s Aliyun ESA proxy timeout for synchronous requests.

### Matches selected

Top-5 T8 players by score, all inter-player matches (each pair plays twice with swapped roles):

| Sub ID | Player |
|--------|--------|
| 165 | Ariana |
| 166 | yisiliu |
| 169 | Kurt |
| 78 | Vivian |
| 103 | kesou |

Match IDs: `295, 296, 311, 312, 329, 330, 349, 350`

### Judge models

| Model | ID in system | Provider |
|-------|-------------|----------|
| DeepSeek V3.2 (original) | `deepseek-v3.2` | SiliconFlow |
| Kimi K2.5 (new) | `kimi-k2.5` | SiliconFlow (`Pro/moonshotai/Kimi-K2.5`) |

Both called at `temperature=0`.

---

## Results

| Match | Role A (商鞅) | Role B (甘龙) | DS winner | Kimi judgment | Kimi winner | Same? |
|-------|------------|------------|-----------|---------------|-------------|-------|
| 295 | Ariana | yisiliu | b → yisiliu | 变法 | a → Ariana | **✗ FLIP** |
| 296 | yisiliu | Ariana | a → yisiliu | 变法 | a → yisiliu | ✓ |
| 311 | yisiliu | Kurt | b → Kurt | 维持现状 | b → Kurt | ✓ |
| 312 | Kurt | yisiliu | a → Kurt | 维持现状 | b → yisiliu | **✗ FLIP** |
| 329 | Kurt | Vivian | a → Kurt | 推行变法 | a → Kurt | ✓ |
| 330 | Vivian | Kurt | b → Kurt | 维持现状 | b → Kurt | ✓ |
| 349 | yisiliu | Vivian | b → Vivian | 维持现状 | b → Vivian | ✓ |
| 350 | Vivian | yisiliu | b → Vivian | 维持现状 | b → Vivian | ✓ |

**Agreement: 6/8 = 75%**  
**Flips: 2/8 = 25%** (matches 295 and 312)

### Kimi's request-level approvals

| Match | SR (商鞅) approvals | GR (甘龙) approvals | Kimi judgment |
|-------|-------------------|-------------------|---------------|
| 295 | 1 | 1 | 变法 (a) |
| 296 | 2 | 3 | 变法 (a) |
| 311 | 0 | 3 | 维持现状 (b) |
| 312 | 0 | 2 | 维持现状 (b) |
| 329 | 1 | 1 | 推行变法 (a) |
| 330 | 0 | 2 | 维持现状 (b) |
| 349 | 1 | 1 | 维持现状 (b) |
| 350 | 1 | 0 | 维持现状 (b) |

> SR = 商鞅's requests marked 同意; GR = 甘龙's requests marked 同意.  
> Note: not all requests are "true" goals (infoAssignment randomizes which are real). Raw counts here don't map cleanly to final score — the scoring engine computes against true request IDs only.

---

## Analysis

### Finding 1: 75% agreement — judge model matters at the margin

DeepSeek and Kimi agreed on 6 of 8 matches. The two flips are both close/contested matches. Clear wins (e.g. Kurt vs Vivian, yisiliu vs Vivian) held across both judges.

### Finding 2: Both flips involve yisiliu

- Match 295: DS gave yisiliu the win playing 甘龙; Kimi flipped to Ariana (商鞅)
- Match 312: DS gave Kurt the win playing 商鞅; Kimi flipped to yisiliu (甘龙)

Effects cancel out for yisiliu (+1 win from Kurt, -1 win to Ariana). Net ranking impact: **Ariana +1, Kurt -1**.

### Finding 3: Match 312 is the sharpest contradiction

DeepSeek judged Kurt(商鞅) as the winner even though Kimi sees **0 SR approvals vs 2 GR approvals**. This suggests DeepSeek was influenced by rhetorical quality / argumentation style in the transcript, while Kimi more strictly scored against the explicit request items.

### Finding 4: No systematic role bias observed

Overall distribution:
- DS: a wins = 3, b wins = 5
- Kimi: a wins = 3, b wins = 5

The overall A/B split is identical. Kimi doesn't systematically favor 商鞅 or 甘龙 compared to DeepSeek at the aggregate level — only at the individual match level.

### Finding 5: Kimi's "维持现状" default in tied cases

In three matches with tied request approvals (295, 329, 349 — all 1 SR vs 1 GR):
- 295: Kimi picks 变法 (a)
- 329: Kimi picks 推行变法 (a)
- 349: Kimi picks 维持现状 (b)

No consistent tiebreaker logic visible from this sample. Narrative content in the debate likely drives the call.

---

## Implications

1. **Judge model is a non-trivial variable** — 25% flip rate in top-tier contested matches is significant for final rankings
2. **Borderline matches are unstable** — using two judges (or a held-out tiebreaker) for high-stakes matches would reduce variance
3. **DeepSeek and Kimi evaluate differently**: DeepSeek appears more sensitive to argumentation style; Kimi appears more aligned with explicit request fulfillment counts
4. **Tournament fairness**: for T8, the 2 flips would shift Ariana up and Kurt down slightly — not enough to change the overall champion but potentially meaningful for seeding in future rounds

---

## Appendix: Raw Kimi decisions (first 300 chars each)

See job `d6a55860-141f-4bc8-9b47-a590843668b4` on production API (`GET /api/admin/rejudge/:jobId`). Job is stored in-memory on the server process — retrieve before next deploy.

---

# Extension (2026-04-28): Six-Judge Comparison

Same 8 T8 top-5 matches re-judged through 6 additional models to characterize bias and inter-model agreement.

## Models

| Model | ID | apiModel | Provider |
|-------|----|---------|----------|
| Qwen3.5 397B | `qwen3.5-397b` | `Qwen/Qwen3.5-397B-A17B` | SiliconFlow |
| Qwen3.6 27B | `qwen3.6-27b` | `Qwen/Qwen3.6-27B` | SiliconFlow |
| MiniMax M2.5 | `minimax-m2.5` | `MiniMaxAI/MiniMax-M2.5` | SiliconFlow |
| GLM-4.6 | `glm-4.6` | `zai-org/GLM-4.6` | SiliconFlow |
| GPT-5.4 | `gpt-5.4` | `gpt-5.4` | OpenAI |
| Claude Opus 4.6 | `claude-opus-4-6` | `claude-opus-4-6` | Anthropic |

All called with `temperature=0`. Qwen3.5/3.6 sent with `enable_thinking: false`.

## Per-match winners

Format: `winner(SR/GR)` where SR = approved 商鞅 requests, GR = approved 甘龙 requests. ✓ = agrees with DeepSeek.

| Match | DS | qwen3.5-397b | qwen3.6-27b | minimax-m2.5 | glm-4.6 | gpt-5.4 | claude-opus-4-6 |
|------:|:--:|:------------:|:-----------:|:------------:|:-------:|:-------:|:---------------:|
| 295 | b | b(0/3) ✓ | a(3/0) ✗ | a(3/0) ✗ | b(1/2) ✓ | a(2/0) ✗ | a(1/0) ✗ |
| 296 | a | b(1/3) ✗ | a(3/0) ✓ | a(3/0) ✓ | a(2/0) ✓ | a(3/0) ✓ | tie(0/0) ✗ |
| 311 | b | b(0/3) ✓ | b(0/3) ✓ | tie(2/2) ✗ | b(0/2) ✓ | b(0/2) ✓ | tie(0/0) ✗ |
| 312 | a | b(0/3) ✗ | a(2/0) ✓ | a(1/0) ✓ | a(1/0) ✓ | a(1/0) ✓ | a(2/0) ✓ |
| 329 | a | b(0/3) ✗ | a(2/0) ✓ | b(1/2) ✗ | b(0/1) ✗ | a(1/0) ✓ | a(1/0) ✓ |
| 330 | b | b(0/3) ✓ | a(2/0) ✗ | b(0/3) ✓ | b(0/2) ✓ | a(2/0) ✗ | tie(0/0) ✗ |
| 349 | b | a(2/0) ✗ | b(1/3) ✓ | a(2/0) ✗ | a(3/2) ✗ | a(3/0) ✗ | a(2/0) ✗ |
| 350 | b | b(0/3) ✓ | a(3/0) ✗ | a(3/0) ✗ | a(3/0) ✗ | a(3/0) ✗ | a(1/0) ✗ |

## Agreement with DeepSeek

| Judge | Agree | Bias (a / b / tie) |
|-------|------:|:------------------:|
| GLM-4.6 | **5/8** | 4 / 4 / 0 |
| Qwen3.6 27B | **5/8** | 6 / 2 / 0 |
| Qwen3.5 397B | 4/8 | 1 / 7 / 0 |
| GPT-5.4 | 4/8 | 7 / 1 / 0 |
| MiniMax M2.5 | 3/8 | 5 / 2 / 1 |
| Claude Opus 4.6 | 2/8 | 5 / 0 / 3 |
| _Reference: DS_ | _8/8_ | 3 / 5 / 0 |

## Findings

1. **Massive cross-model bias spread.** Qwen3.5-397B sides with 甘龙 in 7/8 matches; Claude Opus 4.6 never picks 甘龙 (5 a + 3 ties). The same eight transcripts produce nearly opposite verdicts depending on judge.

2. **GLM-4.6 is the most balanced and the closest to DeepSeek's distribution** (4 a / 4 b vs DS 3 a / 5 b), and ties qwen3.6-27b for highest agreement (5/8). It's a credible alternative judge.

3. **Claude Opus 4.6 collapses to "tie"** on 3/8 matches with zero approvals on either side (0/0). It appears to interpret the rubric extremely conservatively — refusing to grant any specific request — while still narratively favoring 商鞅. This is a failure mode for the current scoring engine, which divides ties poorly.

4. **GPT-5.4 ≈ Qwen3.6-27B in bias** (both ~6/8 favoring 商鞅), suggesting a shared "Western judge bias" toward reformist arguments (GPT-4 → 变法 was the original anecdote).

5. **Match 349 is a stress test** — DS was the only judge picking 甘龙 here (Qwen3.6 also picked b). The other 5 judges all picked 商鞅. This match's "true" outcome is genuinely contested.

6. **Match 311 is the most stable** — 4 of 6 new judges agree with DS (b). Only the two extreme-商鞅 judges (MiniMax, Claude Opus) deviate, and both deviate to "tie" rather than picking a different winner.

## Implications

- **No single judge is "correct."** The 5/8 ceiling for agreement with DS, and the bimodal A-bias / B-bias split across model families, means judge choice is a first-order experimental variable, not a tuning parameter.
- **Ensemble/median-of-judges is worth piloting** for high-stakes ranking decisions. A vote-of-3 across DS + GLM-4.6 + (one A-biased judge like GPT-5.4) would smooth the most polarized verdicts.
- **Claude Opus 4.6 needs prompt adjustment** before being used as a judge — its tie-rate makes it unusable for ranked tournaments as configured.

## Reproducibility

- Local script: `.local/rejudge-multi.py` (fires N async jobs, polls, consolidates)
- Raw results: `/tmp/rejudge-multi-results.json` on dev machine
- Job IDs (in-memory on prod, retrieve before next deploy):
  - qwen3.5-397b: `0623636e-cb0a-49ba-ac0a-d5bf265962a3`
  - qwen3.6-27b: `76da19b5-0869-4c81-b541-cf47e1021f0c`
  - minimax-m2.5: `43ffae94-7402-4ec3-b220-ec97a563ae7b`
  - glm-4.6: `4e84bc0a-790f-4dcf-9fe7-a054f2c16f32`
  - gpt-5.4: `83a7e2c8-34ca-480d-bb9c-6d4b90e7b95e`
  - claude-opus-4-6: `52ce0787-3cc3-428b-a1b4-c69333f4c695`
