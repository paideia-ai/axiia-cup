# GLM-5.2 Trolley Judge Sensitivity: High vs Max

Generated: 2026-07-22

## Method

- Scenario: `trolley-problem`, mini-cases A through E.
- Judge prompt: `TR-P2` (`P2`), SHA-256 `ee0dbb07a3560a0202b45e29f70ab7d21a15e6c74751ce8ff2fc597afbd05763`.
- Histories: the same 40 frozen debate histories, eight per mini-case. No player histories were regenerated.
- Replays: each history was judged 10 times, producing 400 retained judgments per reasoning effort.
- Judge: `glm-5.2`, thinking explicitly enabled, with `reasoning_effort=high` or `reasoning_effort=max`.
- Every retained call in both lanes has observed reasoning and a unique provider response ID.

The high result combines the earlier A/D/E run with the B/C extension. The max result is one full A-E run.

## Model-Level Results

| Metric | High | Max | Max - High |
| --- | ---: | ---: | ---: |
| Bad-to-good prompt sensitivity | 54.0% | 56.5% | +2.5 pp |
| Average absolute sensitivity | 36.7% | 37.7% | +1.0 pp |
| Level 3 to 4 sensitivity | 12.0% | 16.0% | +4.0 pp |
| Fixed-history instability | 3.85% | 4.08% | +0.23 pp |

Max is slightly more sensitive, particularly from Level 3 to Level 4, but the difference is modest relative to its latency and cost increase.

## Varied-Side Win Rates

Each cell lists Level 1 / Level 2 / Level 3 / Level 4 varied-side win rates.

| Case and varied side | High | Max |
| --- | --- | --- |
| A, side A varied | 0 / 0 / 0 / 40% | 0 / 0 / 0 / 100% |
| A, side B varied | 0 / 0 / 100 / 100% | 0 / 0 / 100 / 100% |
| B, side A varied | 0 / 40 / 100 / 100% | 40 / 30 / 100 / 100% |
| B, side B varied | 0 / 0 / 0 / 10% | 0 / 0 / 0 / 0% |
| C, side A varied | 0 / 10 / 90 / 100% | 0 / 0 / 70 / 100% |
| C, side B varied | 0 / 0 / 0 / 60% | 0 / 0 / 30 / 50% |
| D, side A varied | 0 / 0 / 0 / 0% | 0 / 0 / 0 / 0% |
| D, side B varied | 0 / 10 / 100 / 100% | 0 / 0 / 100 / 100% |
| E, side A varied | 0 / 0 / 90 / 100% | 0 / 0 / 90 / 100% |
| E, side B varied | 0 / 0 / 30 / 20% | 0 / 0 / 30 / 30% |

## Latency And Cache

Following the benchmark convention, average latency excludes retained calls that report cache-hit tokens.

| Metric | High | Max |
| --- | ---: | ---: |
| Uncached retained calls | 289 | 274 |
| Mean latency | 28.88 s | 53.83 s |
| Median latency | 27.86 s | 39.86 s |
| P90 latency | 42.37 s | 83.19 s |
| Maximum retained latency | 107.21 s | 367.26 s |
| Cache-hit calls | 111 | 126 |
| Cache-hit prompt tokens | 56,896 | 58,944 |

Max's uncached mean latency was 1.86 times high. During the max main pass, some logical calls took more than four minutes and two exhausted three 180-second attempts, finishing as errors after about nine minutes. Both were recovered by the targeted repair pass with a longer transport timeout.

## Cost

| Lane | Billable generations | Zero-cost timeout traces | Cost USD | Cost CNY |
| --- | ---: | ---: | ---: | ---: |
| High A-E | 407 actual, 406 recorded in Langfuse | 2 | approximately $2.60 | approximately ¥18.86 |
| Max A-E | 406 | 24 | $4.2439 | ¥30.77 |

Langfuse recorded $2.5962 / ¥18.82 for high. One successful B/C repair generation is missing from Langfuse; estimating it from the two adjacent repair calls gives the displayed high total of approximately $2.60 / ¥18.86. Max is fully represented in Langfuse and cost about 1.63 times the estimated high total.

These are application-side estimates based on the repository pricing table and Langfuse cost details, not provider invoices.

## Run Notes

- High B/C: 160 main calls and three malformed-JSON repair calls. All 160 retained rows are valid.
- Max A-E: 398 billable main completions, 24 zero-cost timeout-attempt traces, seven first repair calls, and one final repair call. All 400 retained rows are valid.
- All Langfuse traces that were ingested carry `judgePromptCandidateId=TR-P2` and `judgePromptVersion=P2`.
