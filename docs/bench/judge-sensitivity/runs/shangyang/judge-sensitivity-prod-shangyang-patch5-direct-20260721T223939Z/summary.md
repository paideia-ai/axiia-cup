# Judge Sensitivity Benchmark

Generated: 2026-07-21T23:23:23.552Z
Run ID: dc153013-e9b2-47f9-b00c-c26cfbe78d06
Run label: Shangyang patch5 direct-API judge sensitivity: GLM-5.2 + DeepSeek V4 Pro, thinking on/high effort; frozen 20260708 histories
Scenarios: shangyang-court
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained; Debate histories reused verbatim from docs/bench/runs/judge-sensitivity-prod-20260708T200403Z
Player model: glm-5.2
Judge models: GLM-5.2, DeepSeek V4 Pro
Judge repeats: 10
Judge thinking mode: enabled
Judge prompt patch: docs/competition/scratchpad/shangyang-court-judge-prompt-sensitivity-patch-ms.md
Judge prompt patch source SHA-256: a303169eaa3a47c254c791134f7b8dfdcf43f3b28a4d2fd11c0845531ebd9331
Patched judge prompt SHA-256: 05a7153477a0184c21a7bd046c94de0ad7e347105e0ce21d965f104b94bdcb19
Judge cache strategy: warm-first-per-model-history
History concurrency: 10
Judge concurrency: 8
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 8/8 completed, 0 errored, 1 physically reused
Executable history jobs: 8

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| shangyang-court | 8 | 8 | 0 | 8 |

## Judge Replay

Planned judge calls: 160
Completed judge calls: 160
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 0
Reasoning-on verifications: 160
Prompt-cache usage reports: 160
Prompt-cache hit calls / tokens: 78 / 178688
Prompt-cache miss calls / tokens: 0 / 0
Provider response IDs / duplicates: 160 / 0

## Judge Request / Reasoning Provenance

| Judge model | Provider | API model | Thinking mode | Request control | Configured effort | Calls with reasoning | Reasoning tokens reported | Calls |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| DeepSeek V4 Pro | deepseek | deepseek-v4-pro | provider-default | `{"output_config":{"effort":"high"}}` | high | 80 | 0 | 80 |
| GLM-5.2 | zhipu | glm-5.2 | enabled | `{"thinking":{"type":"enabled"}}` | n/a | 80 | 80 | 80 |

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| DeepSeek V4 Pro | 46.7% | 70.0% | 60.0% | 5.8% |
| GLM-5.2 | 46.7% | 70.0% | 50.0% | 2.3% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | a | 3 | 50.0% | 0.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | a | 3 | 90.0% | 0.800 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | b | 3 | 30.0% | 0.400 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro | shangyang-court | shangyang-court | b | 4 | 100.0% | -1.000 | 10 |
| GLM-5.2 | shangyang-court | shangyang-court | b | 4 | 90.0% | -0.800 | 10 |
