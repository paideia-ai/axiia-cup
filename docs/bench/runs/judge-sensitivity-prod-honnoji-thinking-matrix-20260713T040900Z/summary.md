# Judge Sensitivity Benchmark

Generated: 2026-07-13T18:23:08.434Z
Run ID: d389bf7b-15b9-4556-9a8e-22caf00ef0ef
Scenarios: honnoji-decision
Source: api
API URL: https://axiia-cup.isofucius.cn
Source note: production API scenario snapshot via admin CLI token; three-sentence constrained
Player model: glm-5.2
Judge models: DeepSeek V4 Pro (thinking explicitly on), DeepSeek V4 Flash (thinking explicitly on), DeepSeek V4 Flash (thinking explicitly off), DeepSeek V3.2 (thinking explicitly on), DeepSeek V3.2 (thinking explicitly off), Kimi K2.7 Code (thinking always on), Kimi K2.6 (thinking explicitly on), Kimi K2.6 (thinking explicitly off), Qwen3.6 35B A3B (thinking explicitly on), Qwen3.6 35B A3B (thinking explicitly off), Qwen3.6 27B (thinking explicitly on), Qwen3.6 27B (thinking explicitly off), Qwen3.5 397B (thinking explicitly on), Qwen3.5 397B (thinking explicitly off), GLM 5.2 (thinking explicitly on), GLM 5.2 (thinking explicitly off), GLM 5.1 (thinking explicitly on), GLM 5.1 (thinking explicitly off), MiniMax M2.5 (thinking explicitly on)
Judge repeats: 10
Judge cache strategy: warm-first-per-model-history
History concurrency: 10
Judge concurrency: 30
Prompt levels: 1, 2, 3, 4

## History Status

Rows: 32/32 completed, 0 errored, 4 physically reused
Executable history jobs: 28

| Scenario | Rows | Completed | Errored | Expected |
| --- | ---: | ---: | ---: | ---: |
| honnoji-decision | 32 | 32 | 0 | 32 |

## Judge Replay

Planned judge calls: 6080
Completed judge calls: 6080
Errored judge calls: 0
Parse failures: 0
Reasoning-off verifications: 2560
Reasoning-on verifications: 3520
Prompt-cache usage reports: 4492
Prompt-cache hit calls / tokens: 3094 / 19999680
Prompt-cache miss calls / tokens: 3535 / 3799596
Provider response IDs / duplicates: 4492 / 0

## Model-Level Sensitivity

| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |
| --- | ---: | ---: | ---: | ---: |
| DeepSeek V3.2 (thinking explicitly off) | 40.4% | 55.6% | 21.3% | 3.2% |
| DeepSeek V3.2 (thinking explicitly on) | 30.0% | 42.5% | 11.2% | 9.6% |
| DeepSeek V4 Flash (thinking explicitly off) | 34.2% | 42.5% | 21.3% | 4.4% |
| DeepSeek V4 Flash (thinking explicitly on) | 35.0% | 48.8% | 20.0% | 13.4% |
| DeepSeek V4 Pro (thinking explicitly on) | 39.6% | 49.4% | 26.2% | 12.2% |
| GLM 5.1 (thinking explicitly off) | 8.3% | 12.5% | 0.0% | 1.5% |
| GLM 5.1 (thinking explicitly on) | 28.8% | 41.9% | 22.5% | 12.2% |
| GLM 5.2 (thinking explicitly off) | 7.9% | 11.9% | 2.5% | 1.3% |
| GLM 5.2 (thinking explicitly on) | 42.5% | 51.2% | 21.3% | 9.6% |
| Kimi K2.6 (thinking explicitly off) | 45.8% | 56.3% | 25.0% | 0.0% |
| Kimi K2.6 (thinking explicitly on) | 35.0% | 40.0% | 30.0% | 7.5% |
| Kimi K2.7 Code (thinking always on) | 44.2% | 51.2% | 8.8% | 6.8% |
| MiniMax M2.5 (thinking explicitly on) | 38.3% | 42.5% | 18.8% | 14.2% |
| Qwen3.5 397B (thinking explicitly off) | 33.7% | 43.1% | 12.5% | 2.9% |
| Qwen3.5 397B (thinking explicitly on) | 8.3% | 12.5% | 0.0% | 3.4% |
| Qwen3.6 27B (thinking explicitly off) | 15.8% | 23.8% | 0.0% | 0.5% |
| Qwen3.6 27B (thinking explicitly on) | 16.7% | 23.8% | 2.5% | 4.4% |
| Qwen3.6 35B A3B (thinking explicitly off) | 2.1% | 3.1% | 0.0% | 1.2% |
| Qwen3.6 35B A3B (thinking explicitly on) | 4.6% | 5.6% | 2.5% | 3.2% |

## Scenario/Pair/Case Details

| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 10.0% | -0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 50.0% | 0.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 10.0% | -0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 20.0% | -0.600 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 60.0% | 0.200 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 40.0% | -0.200 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 40.0% | -0.200 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 30.0% | -0.400 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 10.0% | -0.800 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 80.0% | 0.600 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 2 | 90.0% | 0.800 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 70.0% | 0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 70.0% | 0.400 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 60.0% | 0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 60.0% | 0.200 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 90.0% | 0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 40.0% | -0.200 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 80.0% | 0.600 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 80.0% | 0.600 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 70.0% | 0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 50.0% | 0.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 60.0% | 0.200 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 60.0% | 0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 20.0% | 0.600 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 30.0% | 0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 20.0% | 0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 40.0% | 0.200 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 50.0% | 0.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 10.0% | 0.800 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 50.0% | 0.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 10.0% | 0.800 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 30.0% | 0.400 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 50.0% | 0.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 20.0% | 0.600 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 10.0% | 0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 40.0% | 0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 30.0% | 0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 20.0% | 0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 20.0% | 0.600 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 30.0% | 0.400 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 20.0% | 0.600 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 90.0% | -0.800 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 60.0% | -0.200 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 70.0% | -0.400 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 60.0% | -0.200 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 80.0% | -0.600 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 30.0% | 0.400 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__akechi_ashigaru | b | 4 | 10.0% | 0.800 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 20.0% | -0.600 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 10.0% | -0.800 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 50.0% | 0.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 20.0% | -0.600 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 10.0% | -0.800 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 1 | 70.0% | 0.400 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 30.0% | -0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 10.0% | -0.800 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 50.0% | 0.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 20.0% | -0.600 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 2 | 90.0% | 0.800 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 90.0% | 0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 40.0% | -0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 30.0% | -0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 30.0% | -0.400 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 10.0% | -0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 10.0% | -0.800 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 10.0% | -0.800 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 40.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 90.0% | 0.800 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 90.0% | 0.800 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 3 | 90.0% | 0.800 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 90.0% | 0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 40.0% | -0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 60.0% | 0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 20.0% | -0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 10.0% | -0.800 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 30.0% | -0.400 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 30.0% | -0.400 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 20.0% | 0.600 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 20.0% | 0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 30.0% | 0.400 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 10.0% | 0.800 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 10.0% | 0.800 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 10.0% | 0.800 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 2 | 10.0% | 0.800 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 50.0% | 0.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 80.0% | -0.600 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 60.0% | -0.200 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 100.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 90.0% | -0.800 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 70.0% | -0.400 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 60.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 10.0% | 0.800 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 10.0% | 0.800 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 30.0% | 0.400 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 40.0% | 0.200 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 30.0% | 0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 40.0% | 0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 70.0% | -0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 80.0% | -0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 90.0% | -0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 60.0% | -0.200 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 90.0% | -0.800 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 40.0% | 0.200 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | chosokabe__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 60.0% | 0.200 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 90.0% | 0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 30.0% | -0.400 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 40.0% | -0.200 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 90.0% | 0.800 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 80.0% | 0.600 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 1 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 40.0% | -0.200 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 30.0% | -0.400 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 40.0% | -0.200 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 60.0% | 0.200 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 10.0% | -0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 10.0% | -0.800 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 2 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 80.0% | 0.600 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 70.0% | 0.400 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 80.0% | 0.600 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 90.0% | 0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 20.0% | -0.600 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 20.0% | -0.600 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 90.0% | 0.800 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 90.0% | 0.800 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 90.0% | 0.800 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 20.0% | -0.600 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 10.0% | 0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 70.0% | -0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 30.0% | 0.400 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 100.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 70.0% | -0.400 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 60.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 10.0% | 0.800 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 60.0% | -0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 10.0% | 0.800 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 40.0% | 0.200 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 80.0% | -0.600 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 10.0% | 0.800 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 40.0% | 0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 30.0% | 0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 20.0% | 0.600 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 40.0% | 0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 10.0% | 0.800 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 20.0% | 0.600 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 40.0% | 0.200 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 100.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 20.0% | 0.600 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 30.0% | 0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 50.0% | 0.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 90.0% | -0.800 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 30.0% | 0.400 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 20.0% | 0.600 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 90.0% | -0.800 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 60.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 10.0% | 0.800 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__akechi_ashigaru | b | 4 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 60.0% | 0.200 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 10.0% | -0.800 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 40.0% | -0.200 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 0.0% | -1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 20.0% | -0.600 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 70.0% | 0.400 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 1 | 70.0% | 0.400 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 30.0% | -0.400 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 90.0% | 0.800 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 0.0% | -1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 50.0% | 0.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 80.0% | 0.600 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 2 | 80.0% | 0.600 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 80.0% | 0.600 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 60.0% | 0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 40.0% | -0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 20.0% | -0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 30.0% | -0.400 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 0.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 70.0% | 0.400 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 40.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 3 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 70.0% | 0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 40.0% | -0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 40.0% | -0.200 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 80.0% | 0.600 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 80.0% | 0.600 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 10.0% | -0.800 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 10.0% | -0.800 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 70.0% | 0.400 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | a | 4 | 100.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 40.0% | 0.200 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 70.0% | -0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 10.0% | 0.800 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 30.0% | 0.400 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 10.0% | 0.800 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 50.0% | 0.000 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 40.0% | 0.200 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 60.0% | -0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 1 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 10.0% | 0.800 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 10.0% | 0.800 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 40.0% | 0.200 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 40.0% | 0.200 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 2 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 20.0% | 0.600 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 40.0% | 0.200 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 50.0% | 0.000 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 60.0% | -0.200 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 70.0% | -0.400 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 100.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 50.0% | 0.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 90.0% | -0.800 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 3 | 0.0% | 1.000 | 10 |
| DeepSeek V3.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 50.0% | 0.000 | 10 |
| DeepSeek V3.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 40.0% | 0.200 | 10 |
| DeepSeek V4 Flash (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 30.0% | 0.400 | 10 |
| DeepSeek V4 Flash (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 100.0% | -1.000 | 10 |
| DeepSeek V4 Pro (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 90.0% | -0.800 | 10 |
| GLM 5.1 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.1 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 70.0% | -0.400 | 10 |
| GLM 5.2 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| GLM 5.2 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 80.0% | -0.600 | 10 |
| Kimi K2.6 (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Kimi K2.6 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 100.0% | -1.000 | 10 |
| Kimi K2.7 Code (thinking always on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 100.0% | -1.000 | 10 |
| MiniMax M2.5 (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 100.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 100.0% | -1.000 | 10 |
| Qwen3.5 397B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 27B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 10.0% | 0.800 | 10 |
| Qwen3.6 35B A3B (thinking explicitly off) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |
| Qwen3.6 35B A3B (thinking explicitly on) | honnoji-decision | yoshiaki_envoy__hosokawa_fujitaka | b | 4 | 0.0% | 1.000 | 10 |

