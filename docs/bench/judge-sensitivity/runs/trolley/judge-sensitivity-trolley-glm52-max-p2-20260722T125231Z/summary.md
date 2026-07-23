# Judge Sensitivity Benchmark

Generated: 2026-07-22T13:50:36.736Z
Run ID: abe3345e-a77e-4e89-87f2-b6a684a8b9a3
Run label: Trolley A-E GLM-5.2 reasoning max with TR-P2
Scenarios: trolley-problem
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained
Player model: glm-5.2
Judge models: GLM-5.2 (reasoning max)
Judge repeats: 10
Judge thinking mode: enabled
Trolley judge prompt candidate: TR-P2
Trolley judge prompt source: docs/bench/judge-prompt-winrate-balancer/runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P2/prompt.txt
Trolley baseline judge prompt SHA-256: af4f07c5b2433b349d96d92d410afd62c7fc04040ecbff233d0e2b138d6449c3
Trolley active judge prompt SHA-256: ee0dbb07a3560a0202b45e29f70ab7d21a15e6c74751ce8ff2fc597afbd05763
Judge cache strategy: warm-first-per-model-history
History concurrency: 10
Judge concurrency: 30 (main pass), 6 (seven-call repair pass), 1 (final one-call repair)
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 40/40 completed, 0 errored, 5 physically reused
Executable history jobs: 35

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| trolley-problem | 40 | 40 | 0 | 40 |

## Judge Replay

Planned judge calls: 400
Completed judge calls: 400
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 0
Reasoning-on verifications: 400
Prompt-cache usage reports: 400
Prompt-cache hit calls / tokens: 126 / 58944
Prompt-cache miss calls / tokens: 0 / 0
Provider response IDs / duplicates: 400 / 0

## Judge Request / Reasoning Provenance

| Judge model | Provider | API model | Thinking mode | Request control | Configured effort | Calls with reasoning | Reasoning tokens reported | Calls |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| GLM-5.2 (reasoning max) | zhipu | glm-5.2 | enabled | `{"reasoning_effort":"max","thinking":{"type":"enabled"}}` | max | 400 | 400 | 400 |

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| GLM-5.2 (reasoning max) | 37.7% | 56.5% | 16.0% | 4.1% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | a | 3 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | b | 3 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-A | b | 4 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | a | 1 | 40.0% | -0.200 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | a | 2 | 30.0% | -0.400 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | a | 3 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | b | 3 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-B | b | 4 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | a | 3 | 70.0% | 0.400 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | b | 3 | 30.0% | 0.400 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-C | b | 4 | 50.0% | 0.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | a | 3 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | a | 4 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | b | 3 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-D | b | 4 | 100.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | a | 1 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | a | 2 | 0.0% | -1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | a | 3 | 90.0% | 0.800 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | a | 4 | 100.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | b | 1 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | b | 2 | 0.0% | 1.000 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | b | 3 | 30.0% | 0.400 | 10 |
| GLM-5.2 (reasoning max) | trolley-problem | case-E | b | 4 | 30.0% | 0.400 | 10 |
