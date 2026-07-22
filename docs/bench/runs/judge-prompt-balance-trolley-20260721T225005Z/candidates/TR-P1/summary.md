# TR-P1 Balance Result

- Candidate pass: **NO**
- All unit rates in inclusive 30%-70%: no
- Run complete and thinking/output valid: yes
- Response IDs unique and present: yes
- Worst-unit deviation from 50%: 50.0%
- Fixed-history stability is diagnostic only and does not affect pass/fail.
- Holdout, sensitivity, presentation-swap, and bundle validations were not run.

## Unit Results

| Unit | Label | Canonical-side win rate | Wins/expected | Valid/expected | Gate | Instability diagnostic |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| case-A | A. 原始电车 | 14.6% | 7/48 | 48/48 | FAIL | 1.7% |
| case-B | B. 器官移植 | 100.0% | 48/48 | 48/48 | FAIL | 0.0% |
| case-C | C. 地下室婴儿 | 79.2% | 38/48 | 48/48 | FAIL | 12.5% |
| case-D | D. 自动驾驶车 | 14.6% | 7/48 | 48/48 | FAIL | 4.5% |
| case-E | E. 缸中之脑 | 97.9% | 47/48 | 48/48 | FAIL | 1.7% |

## Player-Model Diagnostics

| Unit | Same model on both sides | Canonical-side win rate | Wins/expected | Valid/expected |
| --- | --- | ---: | ---: | ---: |
| case-A | deepseek-v4-pro | 8.3% | 1/12 | 12/12 |
| case-A | kimi-k2.6 | 0.0% | 0/12 | 12/12 |
| case-A | minimax-m3 | 50.0% | 6/12 | 12/12 |
| case-A | glm-5.2 | 0.0% | 0/12 | 12/12 |
| case-B | deepseek-v4-pro | 100.0% | 12/12 | 12/12 |
| case-B | kimi-k2.6 | 100.0% | 12/12 | 12/12 |
| case-B | minimax-m3 | 100.0% | 12/12 | 12/12 |
| case-B | glm-5.2 | 100.0% | 12/12 | 12/12 |
| case-C | deepseek-v4-pro | 66.7% | 8/12 | 12/12 |
| case-C | kimi-k2.6 | 75.0% | 9/12 | 12/12 |
| case-C | minimax-m3 | 100.0% | 12/12 | 12/12 |
| case-C | glm-5.2 | 75.0% | 9/12 | 12/12 |
| case-D | deepseek-v4-pro | 0.0% | 0/12 | 12/12 |
| case-D | kimi-k2.6 | 0.0% | 0/12 | 12/12 |
| case-D | minimax-m3 | 58.3% | 7/12 | 12/12 |
| case-D | glm-5.2 | 0.0% | 0/12 | 12/12 |
| case-E | deepseek-v4-pro | 100.0% | 12/12 | 12/12 |
| case-E | kimi-k2.6 | 100.0% | 12/12 | 12/12 |
| case-E | minimax-m3 | 100.0% | 12/12 | 12/12 |
| case-E | glm-5.2 | 91.7% | 11/12 | 12/12 |

## Cache And Latency

- Cache usage reported: 240 calls
- Calls reporting cached prompt tokens: 97
- Calls reporting zero cached prompt tokens: 143
- Average reported-uncached latency: 49430 ms
- Warmup-call latency: 51320 ms
- Replay latency (reported but excluded from uncached latency): 51712 ms

Every history was judged six times. Repeats measure fixed-history judge nondeterminism; they are not six independent debates.
