# Judge Sensitivity Benchmark

Generated: 2026-07-13T04:51:26.826Z
Run ID: 6e87f6c9-e6f5-4564-af4d-06812e03bee2
Scenarios: honnoji-decision
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained
Player model: glm-5.2
Judge models: DeepSeek R1 (thinking explicitly on), DeepSeek R1 (thinking explicitly off)
Judge repeats: 10
History concurrency: 10
Judge concurrency: 5
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 32/32 completed, 0 errored, 4 physically reused
Executable history jobs: 28

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| honnoji-decision | 32 | 32 | 0 | 32 |

## Judge Replay

Planned judge calls: 640
Completed judge calls: 80
Errored judge calls: 60
Parse failures: 0
Reasoning-off verifications: 40
Reasoning-on verifications: 40

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| DeepSeek R1 (thinking explicitly off) | 66.7% | 100.0% | 0.0% | 0.0% |
| DeepSeek R1 (thinking explicitly on) | 33.3% | 50.0% | 0.0% | 12.5% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| DeepSeek R1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek R1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 50.0% | 0.000 | 10 |
| DeepSeek R1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek R1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 50.0% | 0.000 | 10 |

