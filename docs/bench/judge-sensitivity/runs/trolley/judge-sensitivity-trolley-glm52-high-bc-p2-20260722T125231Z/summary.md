# Judge Sensitivity Benchmark

Generated: 2026-07-22T13:02:30.248Z
Run ID: a8237da6-e3fe-4e52-9c37-3bf26ed87210
Run label: Trolley B/C GLM-5.2 reasoning high with TR-P2
Scenarios: trolley-problem
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained
Player model: glm-5.2
Judge models: GLM-5.2 (reasoning high)
Judge repeats: 10
Judge thinking mode: enabled
Trolley judge prompt candidate: TR-P2
Trolley judge prompt source: docs/bench/judge-prompt-winrate-balancer/runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P2/prompt.txt
Trolley baseline judge prompt SHA-256: af4f07c5b2433b349d96d92d410afd62c7fc04040ecbff233d0e2b138d6449c3
Trolley active judge prompt SHA-256: ee0dbb07a3560a0202b45e29f70ab7d21a15e6c74751ce8ff2fc597afbd05763
Judge cache strategy: warm-first-per-model-history
History concurrency: 10
Judge concurrency: 30 (main pass), 3 (three-call repair pass)
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 16/16 completed, 0 errored, 2 physically reused
Executable history jobs: 14

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| trolley-problem | 16 | 16 | 0 | 16 |

## Judge Replay

Planned judge calls: 160
Completed judge calls: 160
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 0
Reasoning-on verifications: 160
Prompt-cache usage reports: 160
Prompt-cache hit calls / tokens: 67 / 29632
Prompt-cache miss calls / tokens: 0 / 0
Provider response IDs / duplicates: 160 / 0

## Judge Request / Reasoning Provenance

| Judge model | Provider | API model | Thinking mode | Request control | Configured effort | Calls with reasoning | Reasoning tokens reported | Calls |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| GLM-5.2 (reasoning high) | zhipu | glm-5.2 | enabled | `{"reasoning_effort":"high","thinking":{"type":"enabled"}}` | high | 160 | 160 | 160 |

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| GLM-5.2 (reasoning high) | 34.2% | 51.2% | 20.0% | 4.7% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | a | 2 | 40.0% | -0.200 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | a | 3 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | b | 3 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-B | b | 4 | 10.0% | 0.800 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | a | 2 | 10.0% | -0.800 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | a | 3 | 90.0% | 0.800 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | b | 3 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-C | b | 4 | 60.0% | -0.200 | 10 |
