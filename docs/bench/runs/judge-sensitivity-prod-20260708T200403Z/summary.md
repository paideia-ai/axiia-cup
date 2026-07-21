# Judge Sensitivity Benchmark

Generated: 2026-07-09T13:42:10.104Z
Run ID: a021c932-766b-45f8-8b40-2d80b40a932b
Scenarios: shangyang-court, honnoji-decision, trolley-problem
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained
Player model: glm-5.2
Judge models: deepseek-v3.2, deepseek-v4-pro, kimi-k2.6, qwen3.6-27b, minimax-m2.5, glm-5.1, glm-5.2, qwen3.5-397b, deepseek-v4-flash, deepseek-r1, qwen3.6-35b-a3b, glm-4.5-air, kimi-k2.7-code, gpt-4.1, gpt-5.4-mini
Judge repeats: 10
History concurrency: 10
Judge concurrency: 20
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 80/80 completed, 0 errored, 10 physically reused
Executable history jobs: 70

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| shangyang-court | 8 | 8 | 0 | 8 |
| honnoji-decision | 32 | 32 | 0 | 32 |
| trolley-problem | 40 | 40 | 0 | 40 |

## Judge Replay

Planned judge calls: 12000
Completed judge calls: 1200
Errored judge calls: 0
Parse failures: 0

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| deepseek-r1 | 45.0% | 57.5% | 25.0% | 10.4% |
| deepseek-v3.2 | 33.3% | 50.0% | 50.0% | 0.0% |
| deepseek-v4-flash | 33.3% | 50.0% | 0.0% | 0.0% |
| deepseek-v4-pro | 35.0% | 42.5% | 5.0% | 3.1% |
| glm-4.5-air | 38.3% | 52.5% | 0.0% | 6.6% |
| glm-5.1 | 46.7% | 70.0% | 50.0% | 6.8% |
| glm-5.2 | 36.7% | 55.0% | 40.0% | 11.0% |
| gpt-4.1 | 50.0% | 25.0% | 0.0% | 0.0% |
| gpt-5.4-mini | 0.0% | 0.0% | 0.0% | 0.0% |
| kimi-k2.6 | 40.0% | 60.0% | 35.0% | 10.0% |
| kimi-k2.7-code | 31.7% | 47.5% | 55.0% | 8.1% |
| minimax-m2.5 | 33.3% | 50.0% | 10.0% | 4.2% |
| qwen3.5-397b | 31.7% | 47.5% | 50.0% | 1.1% |
| qwen3.6-27b | 50.0% | 25.0% | 0.0% | 0.0% |
| qwen3.6-35b-a3b | 46.7% | 40.0% | -5.0% | 10.0% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| deepseek-r1 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | a | 1 | 100.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | a | 2 | 100.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | a | 3 | 30.0% | -0.400 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | a | 3 | 0.0% | -1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | a | 3 | 90.0% | 0.800 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | a | 3 | 60.0% | 0.200 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | a | 3 | 40.0% | -0.200 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | a | 3 | 100.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | a | 3 | 30.0% | -0.400 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | a | 3 | 0.0% | -1.000 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | a | 3 | 80.0% | 0.600 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | a | 3 | 0.0% | -1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | a | 3 | 0.0% | -1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | a | 3 | 90.0% | 0.800 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | a | 4 | 90.0% | 0.800 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | b | 1 | 20.0% | 0.600 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | b | 1 | 100.0% | -1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | b | 1 | 20.0% | 0.600 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | b | 1 | 30.0% | 0.400 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | b | 1 | 20.0% | 0.600 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | b | 1 | 100.0% | -1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | b | 1 | 50.0% | 0.000 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | b | 1 | 60.0% | -0.200 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | b | 1 | 100.0% | -1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | b | 1 | 100.0% | -1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | b | 1 | 90.0% | -0.800 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | b | 2 | 20.0% | 0.600 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | b | 2 | 20.0% | 0.600 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | b | 2 | 10.0% | 0.800 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | b | 2 | 20.0% | 0.600 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | b | 3 | 70.0% | -0.400 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | b | 3 | 100.0% | -1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | b | 3 | 20.0% | 0.600 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | b | 3 | 30.0% | 0.400 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | b | 3 | 40.0% | 0.200 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | b | 3 | 90.0% | -0.800 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | b | 3 | 80.0% | -0.600 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | b | 3 | 10.0% | 0.800 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | b | 3 | 100.0% | -1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | b | 3 | 100.0% | -1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | b | 3 | 50.0% | 0.000 | 10 |
| deepseek-r1 | shangyang-court | shangyang-court | b | 4 | 50.0% | 0.000 | 10 |
| deepseek-v3.2 | shangyang-court | shangyang-court | b | 4 | 100.0% | -1.000 | 10 |
| deepseek-v4-flash | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| deepseek-v4-pro | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| glm-4.5-air | shangyang-court | shangyang-court | b | 4 | 20.0% | 0.600 | 10 |
| glm-5.1 | shangyang-court | shangyang-court | b | 4 | 90.0% | -0.800 | 10 |
| glm-5.2 | shangyang-court | shangyang-court | b | 4 | 60.0% | -0.200 | 10 |
| gpt-4.1 | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| gpt-5.4-mini | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| kimi-k2.6 | shangyang-court | shangyang-court | b | 4 | 90.0% | -0.800 | 10 |
| kimi-k2.7-code | shangyang-court | shangyang-court | b | 4 | 100.0% | -1.000 | 10 |
| minimax-m2.5 | shangyang-court | shangyang-court | b | 4 | 10.0% | 0.800 | 10 |
| qwen3.5-397b | shangyang-court | shangyang-court | b | 4 | 100.0% | -1.000 | 10 |
| qwen3.6-27b | shangyang-court | shangyang-court | b | 4 | 0.0% | 1.000 | 10 |
| qwen3.6-35b-a3b | shangyang-court | shangyang-court | b | 4 | 30.0% | 0.400 | 10 |

