# Judge Sensitivity Benchmark

Generated: 2026-07-12T09:37:44.723Z
Run ID: 074e7818-ff4f-4ae4-9bd3-fa475e1e9ee4
Run label: Shangyang judge sensitivity: DeepSeek and Qwen thinking explicitly on; reuses 8 histories from judge-sensitivity-prod-20260708T200403Z
Scenarios: shangyang-court
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained; Debate histories reused verbatim from docs/bench/runs/judge-sensitivity-prod-20260708T200403Z; Seven Level-3 repeat-1 judge rows imported from verified thinking-on preflight
Player model: glm-5.2
Judge models: DeepSeek V4 Pro (thinking explicitly on), DeepSeek V4 Flash (thinking explicitly on), DeepSeek V3.2 (thinking explicitly on), DeepSeek R1 (thinking explicitly on), Qwen3.6 35B A3B (thinking explicitly on), Qwen3.6 27B (thinking explicitly on), Qwen3.5 397B (thinking explicitly on)
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

Planned judge calls: 560
Completed judge calls: 560
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 0
Reasoning-on verifications: 560

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| DeepSeek R1 (thinking explicitly on) | 43.3% | 60.0% | 25.0% | 11.3% |
| DeepSeek V3.2 (thinking explicitly on) | 36.7% | 55.0% | 45.0% | 4.3% |
| DeepSeek V4 Flash (thinking explicitly on) | 36.7% | 55.0% | 10.0% | 2.0% |
| DeepSeek V4 Pro (thinking explicitly on) | 45.0% | 57.5% | 35.0% | 6.1% |
| Qwen3.5 397B (thinking explicitly on) | 35.0% | 52.5% | 15.0% | 7.1% |
| Qwen3.6 27B (thinking explicitly on) | 36.7% | 45.0% | 35.0% | 7.8% |
| Qwen3.6 35B A3B (thinking explicitly on) | 38.3% | 22.5% | 65.0% | 7.9% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | a | 1 | 10.0% | -0.800 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 40.0% | -0.200 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 40.0% | -0.200 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 20.0% | -0.600 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 90.0% | 0.800 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 30.0% | -0.400 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | a | 3 | 0.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 30.0% | 0.400 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 90.0% | -0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 20.0% | 0.600 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 100.0% | -1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | b | 1 | 100.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 10.0% | 0.800 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | b | 2 | 10.0% | 0.800 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 70.0% | -0.400 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 90.0% | -0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 10.0% | 0.800 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 80.0% | -0.600 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | b | 3 | 40.0% | 0.200 | 10 |
| DeepSeek R1 (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 60.0% | -0.200 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 100.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 20.0% | 0.600 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 60.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 40.0% | 0.200 | 10 |
| Qwen3.6 27B (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 80.0% | -0.600 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | shangyang-court | shangyang-court | b | 4 | 70.0% | -0.400 | 10 |

