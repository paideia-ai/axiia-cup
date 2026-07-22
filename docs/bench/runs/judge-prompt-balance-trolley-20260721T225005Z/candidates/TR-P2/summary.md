# TR-P2 Balance Result

- Candidate pass: **NO**
- All unit rates in inclusive 30%-70%: no
- Run complete and thinking/output valid: no
- Response IDs unique and present: yes
- Worst-unit deviation from 50%: 45.0%
- Fixed-history stability is diagnostic only and does not affect pass/fail.
- Holdout, sensitivity, presentation-swap, and bundle validations were not run.

## Unit Results

| Unit | Label | Canonical-side win rate | Wins/expected | Valid/expected | Gate | Instability diagnostic |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| case-A | A. 原始电车 | 18.3% | 8/48 | 46/48 | FAIL | 2.8% |
| case-B | B. 器官移植 | 91.7% | 44/48 | 48/48 | FAIL | 2.8% |
| case-C | C. 地下室婴儿 | 58.7% | 25/48 | 44/48 | FAIL | 11.3% |
| case-D | D. 自动驾驶车 | 27.1% | 12/48 | 47/48 | FAIL | 1.7% |
| case-E | E. 缸中之脑 | 95.0% | 10/48 | 11/48 | FAIL | 2.3% |

## Player-Model Diagnostics

| Unit | Same model on both sides | Canonical-side win rate | Wins/expected | Valid/expected |
| --- | --- | ---: | ---: | ---: |
| case-A | deepseek-v4-pro | 33.3% | 4/12 | 12/12 |
| case-A | kimi-k2.6 | 0.0% | 0/12 | 12/12 |
| case-A | minimax-m3 | 40.0% | 4/12 | 10/12 |
| case-A | glm-5.2 | 0.0% | 0/12 | 12/12 |
| case-B | deepseek-v4-pro | 100.0% | 12/12 | 12/12 |
| case-B | kimi-k2.6 | 100.0% | 12/12 | 12/12 |
| case-B | minimax-m3 | 66.7% | 8/12 | 12/12 |
| case-B | glm-5.2 | 100.0% | 12/12 | 12/12 |
| case-C | deepseek-v4-pro | 50.0% | 6/12 | 12/12 |
| case-C | kimi-k2.6 | 18.2% | 2/12 | 11/12 |
| case-C | minimax-m3 | 100.0% | 9/12 | 9/12 |
| case-C | glm-5.2 | 66.7% | 8/12 | 12/12 |
| case-D | deepseek-v4-pro | 8.3% | 1/12 | 12/12 |
| case-D | kimi-k2.6 | 0.0% | 0/12 | 12/12 |
| case-D | minimax-m3 | 100.0% | 11/12 | 11/12 |
| case-D | glm-5.2 | 0.0% | 0/12 | 12/12 |
| case-E | deepseek-v4-pro | 80.0% | 4/12 | 5/12 |
| case-E | kimi-k2.6 | 100.0% | 2/12 | 2/12 |
| case-E | minimax-m3 | 100.0% | 2/12 | 2/12 |
| case-E | glm-5.2 | 100.0% | 2/12 | 2/12 |

## Cache And Latency

- Cache usage reported: 196 calls
- Calls reporting cached prompt tokens: 50
- Calls reporting zero cached prompt tokens: 146
- Average reported-uncached latency: 58917 ms
- Warmup-call latency: 59419 ms
- Replay latency (reported but excluded from uncached latency): 59567 ms

Every history was judged six times. Repeats measure fixed-history judge nondeterminism; they are not six independent debates.
