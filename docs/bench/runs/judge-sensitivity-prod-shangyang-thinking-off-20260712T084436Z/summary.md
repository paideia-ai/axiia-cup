# Judge Sensitivity Benchmark

Generated: 2026-07-12T08:50:40.335Z
Run ID: 57251724-3b5d-46f0-925c-f19810ab766c
Run label: Shangyang judge sensitivity: thinking explicitly off; reuses 8 histories from judge-sensitivity-prod-20260708T200403Z
Scenarios: shangyang-court
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained; Debate histories reused verbatim from docs/bench/runs/judge-sensitivity-prod-20260708T200403Z
Player model: glm-5.2
Judge models: GLM 5.1 (thinking explicitly off), GLM 5.2 (thinking explicitly off), Kimi K2.6 (thinking explicitly off)
Judge repeats: 10
History concurrency: 10
Judge concurrency: 30
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 8/8 completed, 0 errored, 1 physically reused
Executable history jobs: 8

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| shangyang-court | 8 | 8 | 0 | 8 |

## Judge Replay

Planned judge calls: 240
Completed judge calls: 240
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 240

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| GLM 5.1 (thinking explicitly off) | 33.3% | 50.0% | 0.0% | 0.0% |
| GLM 5.2 (thinking explicitly off) | 31.7% | 47.5% | 0.0% | 1.1% |
| Kimi K2.6 (thinking explicitly off) | 36.7% | 25.0% | 20.0% | 6.0% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | a | 2 | 10.0% | -0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | a | 3 | 60.0% | 0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | b | 1 | 60.0% | -0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |

