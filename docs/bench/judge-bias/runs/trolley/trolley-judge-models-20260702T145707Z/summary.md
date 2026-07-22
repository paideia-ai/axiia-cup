# Trolley Judge-Model Benchmark

Generated: 2026-07-02T15:23:51.132Z
Run ID: trolley-judge-models-20260702T145707Z
Source run: trolley-win-rate-20260702T060024Z
Source histories: 24
Judge models: deepseek-v4-pro, kimi-k2.6, qwen3.6-27b, glm-5.1, minimax-m2.5, gpt-5.4, claude-opus-4-6
Jobs: 168/168 completed, 0 errored, 0 parse errors

## Model Summary

| Judge model | Jobs | Errors | Parse errors | One-side match wins | Five-side match wins | Draws | Case one-side wins | Case five-side wins | Unknown cases | Baseline agreement | Avg duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DeepSeek V4 Pro (deepseek-v4-pro) | 24/24 | 0 | 0 | 21 | 3 | 0 | 59 | 13 | 0 | 69.4% | 39610ms |
| Kimi K2.6 (kimi-k2.6) | 24/24 | 0 | 0 | 23 | 1 | 0 | 55 | 17 | 0 | 72.2% | 125191ms |
| Qwen3.6 27B (qwen3.6-27b) | 24/24 | 0 | 0 | 23 | 1 | 0 | 47 | 25 | 0 | 86.1% | 23195ms |
| GLM-5.1 (glm-5.1) | 24/24 | 0 | 0 | 17 | 7 | 0 | 46 | 26 | 0 | 73.6% | 73020ms |
| MiniMax M2.5 (minimax-m2.5) | 24/24 | 0 | 0 | 20 | 4 | 0 | 57 | 15 | 0 | 63.9% | 37007ms |
| GPT-5.4 (gpt-5.4) | 24/24 | 0 | 0 | 14 | 10 | 0 | 38 | 34 | 0 | 76.4% | 14115ms |
| Claude Opus 4.6 (claude-opus-4-6) | 24/24 | 0 | 0 | 15 | 9 | 0 | 39 | 33 | 0 | 75.0% | 40207ms |

## Mini-Case Results By Model

| Judge model | Case | One-side wins | Five-side wins | Unknown | Total | One-side rate | Five-side rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| deepseek-v4-pro | A 原始电车 | 17 | 7 | 0 | 24 | 70.8% | 29.2% |
| deepseek-v4-pro | B 器官移植 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| deepseek-v4-pro | C 地下室婴儿 | 11 | 1 | 0 | 12 | 91.7% | 8.3% |
| deepseek-v4-pro | D 自动驾驶车 | 9 | 3 | 0 | 12 | 75.0% | 25.0% |
| deepseek-v4-pro | E 缸中之脑 | 10 | 2 | 0 | 12 | 83.3% | 16.7% |
| kimi-k2.6 | A 原始电车 | 12 | 12 | 0 | 24 | 50.0% | 50.0% |
| kimi-k2.6 | B 器官移植 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| kimi-k2.6 | C 地下室婴儿 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| kimi-k2.6 | D 自动驾驶车 | 7 | 5 | 0 | 12 | 58.3% | 41.7% |
| kimi-k2.6 | E 缸中之脑 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| qwen3.6-27b | A 原始电车 | 0 | 24 | 0 | 24 | 0.0% | 100.0% |
| qwen3.6-27b | B 器官移植 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| qwen3.6-27b | C 地下室婴儿 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| qwen3.6-27b | D 自动驾驶车 | 11 | 1 | 0 | 12 | 91.7% | 8.3% |
| qwen3.6-27b | E 缸中之脑 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| glm-5.1 | A 原始电车 | 7 | 17 | 0 | 24 | 29.2% | 70.8% |
| glm-5.1 | B 器官移植 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| glm-5.1 | C 地下室婴儿 | 11 | 1 | 0 | 12 | 91.7% | 8.3% |
| glm-5.1 | D 自动驾驶车 | 4 | 8 | 0 | 12 | 33.3% | 66.7% |
| glm-5.1 | E 缸中之脑 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| minimax-m2.5 | A 原始电车 | 19 | 5 | 0 | 24 | 79.2% | 20.8% |
| minimax-m2.5 | B 器官移植 | 11 | 1 | 0 | 12 | 91.7% | 8.3% |
| minimax-m2.5 | C 地下室婴儿 | 11 | 1 | 0 | 12 | 91.7% | 8.3% |
| minimax-m2.5 | D 自动驾驶车 | 7 | 5 | 0 | 12 | 58.3% | 41.7% |
| minimax-m2.5 | E 缸中之脑 | 9 | 3 | 0 | 12 | 75.0% | 25.0% |
| gpt-5.4 | A 原始电车 | 0 | 24 | 0 | 24 | 0.0% | 100.0% |
| gpt-5.4 | B 器官移植 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| gpt-5.4 | C 地下室婴儿 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| gpt-5.4 | D 自动驾驶车 | 2 | 10 | 0 | 12 | 16.7% | 83.3% |
| gpt-5.4 | E 缸中之脑 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| claude-opus-4-6 | A 原始电车 | 0 | 24 | 0 | 24 | 0.0% | 100.0% |
| claude-opus-4-6 | B 器官移植 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| claude-opus-4-6 | C 地下室婴儿 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |
| claude-opus-4-6 | D 自动驾驶车 | 3 | 9 | 0 | 12 | 25.0% | 75.0% |
| claude-opus-4-6 | E 缸中之脑 | 12 | 0 | 0 | 12 | 100.0% | 0.0% |

