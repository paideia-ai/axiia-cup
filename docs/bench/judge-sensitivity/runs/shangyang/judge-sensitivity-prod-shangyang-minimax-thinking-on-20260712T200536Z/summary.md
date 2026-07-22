# Judge Sensitivity Benchmark

Generated: 2026-07-12T20:11:42.544Z
Run ID: f0a3aacf-3cde-489e-a25a-c0f027245a94
Run label: Shangyang judge sensitivity: MiniMax M2.5 thinking explicitly on; reuses 8 histories from judge-sensitivity-prod-20260708T200403Z
Scenarios: shangyang-court
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained; Debate histories reused verbatim from docs/bench/runs/judge-sensitivity-prod-20260708T200403Z; Seven Level-3 repeat-1 judge rows imported from verified thinking-on preflight
Player model: glm-5.2
Judge models: MiniMax M2.5 (thinking explicitly on)
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

Planned judge calls: 80
Completed judge calls: 80
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 0
Reasoning-on verifications: 80

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| MiniMax M2.5 (thinking explicitly on) | 31.7% | 42.5% | 10.0% | 3.1% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 80.0% | 0.600 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 10.0% | 0.800 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |

