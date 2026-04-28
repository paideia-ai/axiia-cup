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

# Extension (2026-04-28): Seven-Judge Comparison — Reform-Decision Bias

Same 8 T8 top-5 matches re-judged through 7 additional models to characterize **reform-decision bias** directly from the judge's `judgment` field (变法 vs 维持现状), bypassing the scoring engine.

> **Methodology fix from earlier table:** the previous extension inferred winner from SR/GR approval counts, which conflates the scoring engine with the judge's actual reform decision. The judge's `judgment` field is the cleaner binary signal: "变法" (reform) vs "维持现状" (status quo). All numbers below use that field directly.

## Models

| Model | ID | apiModel | Provider |
|-------|----|---------|----------|
| Qwen3.5 397B | `qwen3.5-397b` | `Qwen/Qwen3.5-397B-A17B` | SiliconFlow |
| Qwen3.6 27B | `qwen3.6-27b` | `Qwen/Qwen3.6-27B` | SiliconFlow |
| MiniMax M2.5 | `minimax-m2.5` | `MiniMaxAI/MiniMax-M2.5` | SiliconFlow |
| GLM-4.6 | `glm-4.6` | `zai-org/GLM-4.6` | SiliconFlow |
| GPT-5.4 | `gpt-5.4` | `gpt-5.4` | OpenAI |
| Claude Opus 4.5 | `claude-opus-4-5` | `claude-opus-4-5-20251101` | Anthropic |
| Claude Opus 4.6 | `claude-opus-4-6` | `claude-opus-4-6` | Anthropic |

All called with `temperature=0`. Qwen3.5/3.6 sent with `enable_thinking: false`.

## Per-match reform decision

`r` = 变法 (reform), `n` = 维持现状 (status quo). ✓ = agrees with DeepSeek's reform decision on that match.

| Match | DS | qwen3.5-397b | qwen3.6-27b | minimax-m2.5 | glm-4.6 | gpt-5.4 | claude-opus-4-5 | claude-opus-4-6 |
|------:|:--:|:------------:|:-----------:|:------------:|:-------:|:-------:|:---------------:|:---------------:|
| 295 | n | n ✓ | r ✗ | r ✗ | r ✗ | r ✗ | n ✓ | r ✗ |
| 296 | r | n ✗ | r ✓ | r ✓ | r ✓ | r ✓ | n ✗ | r ✓ |
| 311 | n | n ✓ | n ✓ | r ✗ | n ✓ | n ✓ | n ✓ | r ✗ |
| 312 | r | n ✗ | r ✓ | r ✓ | r ✓ | r ✓ | n ✗ | r ✓ |
| 329 | r | n ✗ | r ✓ | r ✓ | r ✓ | r ✓ | n ✗ | r ✓ |
| 330 | n | n ✓ | r ✗ | n ✓ | n ✓ | r ✗ | n ✓ | r ✗ |
| 349 | n | r ✗ | n ✓ | r ✗ | r ✗ | r ✗ | n ✓ | r ✗ |
| 350 | n | n ✓ | r ✗ | r ✗ | r ✗ | r ✗ | n ✓ | r ✗ |

## Reform-decision bias spectrum (sorted by reform rate)

| Judge | Reform | % Reform | Agree with DS |
|-------|-------:|---------:|--------------:|
| **Claude Opus 4.5** | 0/8 | **0%** | 5/8 |
| Qwen3.5 397B | 1/8 | 12.5% | 4/8 |
| _Reference: DS_ | _3/8_ | _37.5%_ | _8/8_ |
| Qwen3.6 27B | 6/8 | 75% | 5/8 |
| GLM-4.6 | 6/8 | 75% | 5/8 |
| MiniMax M2.5 | 7/8 | 87.5% | 4/8 |
| GPT-5.4 | 7/8 | 87.5% | 4/8 |
| **Claude Opus 4.6** | 8/8 | **100%** | 3/8 |

Interactive viewer with full speech text: [`judge-bias-spectrum.html`](./judge-bias-spectrum.html). Raw data: [`judge-bias-spectrum.json`](./judge-bias-spectrum.json).

## Findings

1. **The two Claude Opus versions are perfect opposites.** Opus 4.5 votes 维持现状 in 8/8 matches (extreme 甘龙 bias); Opus 4.6 votes 变法 in 8/8 matches (extreme 商鞅 bias). Same Anthropic model family, one minor version apart, polar opposite verdicts on identical transcripts. This is the single largest version-flip we've measured.

2. **Two-tail bias structure.** The seven new judges cluster into a "conservative" tail (Claude 4.5, Qwen3.5-397B at 0% / 12.5% reform) and a "reformist" tail (MiniMax, GPT-5.4, Claude 4.6 at 87–100% reform), with GLM-4.6 and Qwen3.6-27B in the middle. DeepSeek (37.5%) sits closer to the conservative side.

3. **Agreement-with-DS is misleading on its own.** Claude Opus 4.5 hits 5/8 agreement just by always picking 维持现状 — DS happens to also pick 维持现状 5 times. High agreement here reflects shared base-rate, not shared reasoning. The reform-rate column is the better discriminator.

4. **No judge tracks DS's per-match decision well.** The best agreement is 5/8 (62.5%), achieved by three different judges through three different mechanisms (GLM-4.6 = balanced reasoning, Qwen3.6-27B = mostly-reform with occasional dissent, Opus 4.5 = always-status-quo). None of these is replicating DS's discrimination.

5. **Match 311 is the most stable status-quo verdict** — 4 of 7 new judges agree with DS (n). Only the three extreme reformists (MiniMax, GPT-5.4, Opus 4.6) flip.

6. **Match 349 is the contested one** — DS, Qwen3.6, and Opus 4.5 say 维持现状; the other 4 judges say 变法. The transcript probably has genuinely ambiguous evidence.

## Implications

- **Judge model is a first-order experimental variable.** A 0% → 100% reform-rate spread across credible frontier judges means "swap the judge" can swap nearly every verdict. Tournament rankings under the current single-judge regime carry an implicit "DeepSeek interpretation" tag.
- **Anthropic Opus 4.5 → 4.6 is not a safe drop-in.** The complete reversal between minor versions makes Anthropic an unstable choice for any judge role unless the version is pinned and re-validated each release.
- **Ensemble or split-judging is worth piloting.** A vote-of-3 across DS + GLM-4.6 + (one reformist like GPT-5.4) would smooth the worst polarization. Or: report "% of judges who chose reform" as a new column on the leaderboard, exposing the uncertainty rather than collapsing it.
- **Don't anchor on agreement-with-DS alone.** The reform-rate distribution is the thing actually being measured — a judge that always says n will agree with DS often, but is useless for differentiating between matches.

## Reproducibility

- Local script: `.local/rejudge-multi.py` (fires N async jobs, polls, consolidates)
- Raw judgments + speech text: [`judge-bias-spectrum.json`](./judge-bias-spectrum.json)
- Interactive viewer: [`judge-bias-spectrum.html`](./judge-bias-spectrum.html) (open in browser; no build needed)
- Production async rejudge endpoint: `POST /api/admin/rejudge`, `GET /api/admin/rejudge/:jobId` (job store is in-memory; retrieve before next prod deploy)
