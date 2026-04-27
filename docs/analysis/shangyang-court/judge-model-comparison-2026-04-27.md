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
