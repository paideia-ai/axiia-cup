# Trolley Judge Prompt Balance Calibration

**Current status:** Paused because the direct Zhipu account returned HTTP 429,
code `1113` (`余额不足或无可用资源包，请充值`). P0 and P1 are complete. P2
has 196 of 240 required judgments, with 44 still pending.

This report is a snapshot of run
`judge-prompt-balance-trolley-20260721T225005Z`. It does not claim that a
balanced prompt has been found.

## What This Benchmark Measures

The benchmark searches for a trolley-problem judge prompt that does not impose
a strong policy preference before considering the debate. When both sides use
the same player model and the same near-empty Level 3 prompt (`-`), the target
one-person-side win probability is 50%. A prompt is accepted when **every**
mini-case independently falls within the inclusive 30%-70% range.

The canonical outcome reported below is always the **one-person side**. A low
percentage therefore means the judge favors the five-person side; a high
percentage means it favors the one-person side.

## Methodology

- Mini-cases: A 原始电车, B 器官移植, C 地下室婴儿, D 自动驾驶车, and E 缸中之脑.
- Player-model strata: DeepSeek V4 Pro, Kimi K2.6, MiniMax M3, and GLM-5.2.
- Both players use the same model within a history and both receive the Level 3
  prompt `-`.
- Two independently generated histories are used for each case/model
  combination: `5 cases x 4 models x 2 histories = 40 histories`.
- Histories are generated once and reused unchanged for every candidate judge
  prompt.
- Each history is judged six times: `40 histories x 6 repeats = 240 normal
judgments per candidate`, or 48 judgments per mini-case.
- Each mini-case is sent to the judge separately. The one-case output contract
  returns only that case's policy judgment and speech.
- Judge: GLM-5.2 through the direct Zhipu route, with thinking explicitly
  enabled and verified in a candidate-specific preflight.
- Initial replay concurrency was 100. After Zhipu rate-limited P0, replay used
  concurrency 20 and preserved successful checkpoints.
- Fixed-history instability is reported diagnostically but does not veto a
  candidate.

For case `u`, model stratum `m`, history `h`, and six judge repeats, the
one-history rate is:

```text
q(u,m,h) = one-person-side judgments / 6
```

The benchmark averages the two history rates inside each model stratum, then
averages the four model-stratum rates equally:

```text
W(u) = average across the four equally weighted player-model strata
```

The candidate passes only when `0.30 <= W(u) <= 0.70` for all five cases and
all required calls are complete and valid.

## Results

| Mini-case     |    P0 complete |    P1 complete |      P2 provisional | Required range |
| ------------- | -------------: | -------------: | ------------------: | -------------: |
| A. 原始电车   |   16.7% (8/48) |   14.6% (7/48) | 18.3% (46/48 valid) |        30%-70% |
| B. 器官移植   | 100.0% (48/48) | 100.0% (48/48) | 91.7% (48/48 valid) |        30%-70% |
| C. 地下室婴儿 |  87.5% (42/48) |  79.2% (38/48) | 58.7% (44/48 valid) |        30%-70% |
| D. 自动驾驶车 |  25.0% (12/48) |   14.6% (7/48) | 27.1% (47/48 valid) |        30%-70% |
| E. 缸中之脑   | 100.0% (48/48) |  97.9% (47/48) | 95.0% (11/48 valid) |        30%-70% |

P2 percentages are provisional equal-model-weighted estimates. Missing calls
are not treated as losses, but the candidate is not eligible to pass until all
240 judgments complete. In particular, case E has only 11 of 48 judgments and
must not be interpreted as a final rate.

### Candidate Status

| Candidate | Prompt mechanism                                                        | Completion | Cases in range | Decision |
| --------- | ----------------------------------------------------------------------- | ---------: | -------------: | -------- |
| TR-P0     | Exact frozen one-mini-case Judge Sensitivity baseline                   |    240/240 |            0/5 | Rejected |
| TR-P1     | Prevent a familiar case fact from acting as an unargued automatic trump |    240/240 |            0/5 | Rejected |
| TR-P2     | Compare persuasive gain relative to each position's inherent difficulty |    196/240 |  Not evaluated | Paused   |

### Interpretation So Far

P0 shows strong case-dependent policy priors rather than one global side-label
bias. It heavily favors the five-person side in A and D, but heavily favors the
one-person side in B, C, and E.

P1 did not solve this. It changed only 18 of the 240 paired P0 judgments. Case
B did not change at all, case E changed once, and A and D moved farther from
the target band. Only C moved materially toward balance, from 87.5% to 79.2%.

P2 is testing a different mechanism and its partial data shows more movement,
especially in C, but no conclusion is valid until the remaining 44 calls are
completed. The current run has not found an acceptable judge prompt.

## Cost

| Phase                       | Known token-based cost | Conservative estimate |
| --------------------------- | ---------------------: | --------------------: |
| One-time history generation |                  ¥5.43 |                 ¥7.95 |
| TR-P0 judge calls           |                 ¥18.56 |                ¥20.89 |
| TR-P1 judge calls           |                 ¥21.08 |                ¥22.97 |
| TR-P2 judge calls so far    |                 ¥17.11 |                ¥29.39 |
| Three candidate preflights  |                  ¥0.17 |                 ¥0.17 |
| **Total**                   |             **¥62.34** |            **¥81.36** |

The self-imposed run cap is ¥300. The conservative remaining allowance is
¥218.64. This is separate from the provider account balance that stopped P2.
The conservative estimate charges calls without returned usage at an observed
or static fallback rate; some failed provider attempts may not actually be
billed.

## Next Step

Recharge the Zhipu account or replace `ZHIPU_API_KEY`, then resume TR-P2. The
runner will reuse all 40 histories and 196 successful P2 judgments, issuing
only the 44 incomplete jobs. After P2 reaches 240/240, diagnose its final
five-case result before deciding whether to retain it or create TR-P3.

## Source Artifacts

- [Manifest](manifest.md)
- [Frozen histories](histories.md)
- [Prompt results summary](prompt-results-summary.md)
- [Cost monitor](cost-monitor.md)
- [TR-P0 result](candidates/TR-P0/summary.md)
- [TR-P1 result](candidates/TR-P1/summary.md)
- [TR-P2 provisional result](candidates/TR-P2/summary.md)
