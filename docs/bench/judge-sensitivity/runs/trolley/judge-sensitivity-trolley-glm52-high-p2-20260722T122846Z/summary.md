# Judge Sensitivity Benchmark

Generated: 2026-07-22T12:41:50.349Z
Run ID: 94e076e3-c8ac-4916-8edd-8ef5091dc6d0
Run label: Trolley A/D/E GLM-5.2 reasoning high with TR-P2
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
Judge concurrency: 30 (main pass), 4 (four-call repair pass)
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 24/24 completed, 0 errored, 3 physically reused
Executable history jobs: 21

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| trolley-problem | 24 | 24 | 0 | 24 |

## Judge Replay

Planned judge calls: 240
Completed judge calls: 240
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 0
Reasoning-on verifications: 240
Prompt-cache usage reports: 240
Prompt-cache hit calls / tokens: 44 / 27264
Prompt-cache miss calls / tokens: 0 / 0
Provider response IDs / duplicates: 240 / 0

## Judge Request / Reasoning Provenance

| Judge model | Provider | API model | Thinking mode | Request control | Configured effort | Calls with reasoning | Reasoning tokens reported | Calls |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| GLM-5.2 (reasoning high) | zhipu | glm-5.2 | enabled | `{"reasoning_effort":"high","thinking":{"type":"enabled"}}` | high | 240 | 240 | 240 |

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| GLM-5.2 (reasoning high) | 38.3% | 55.8% | 6.7% | 3.3% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | a | 3 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | a | 4 | 40.0% | -0.200 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | b | 3 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-A | b | 4 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | a | 3 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | a | 4 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | b | 2 | 10.0% | 0.800 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | b | 3 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-D | b | 4 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | a | 3 | 90.0% | 0.800 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | b | 3 | 30.0% | 0.400 | 10 |
| GLM-5.2 (reasoning high) | trolley-problem | case-E | b | 4 | 20.0% | 0.600 | 10 |
