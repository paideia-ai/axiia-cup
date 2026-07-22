# Benchmark Cost Monitor

- Known token-based cost: **¥62.3383**
- Conservative estimated total: **¥81.3599**
- Estimated cost without token usage: ¥19.0216
- Cost cap: **¥300.0000**
- Estimated remaining budget: **¥218.6401**
- Cap reached: **NO**
- Calls with token usage: 1097
- Recorded calls/attempts without usage: 198
- Calls reporting output but zero prompt tokens: 100
- Calls with token usage but no catalog price: 0

## Cost By Phase

| Phase | Candidate | Model | Usage calls | Missing usage | Missing input | Prompt tokens | Cached prompt tokens | Completion tokens | Known cost | Estimated cost |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| history | - | deepseek-v4-pro | 100 | 0 | 0 | 70,770 | 48,768 | 33,389 | ¥0.2676 | ¥0.2676 |
| history | - | glm-5.2 | 100 | 0 | 0 | 94,261 | 48,256 | 60,992 | ¥1.8026 | ¥1.8026 |
| history | - | kimi-k2.6 | 100 | 0 | 0 | 89,118 | 46,218 | 109,758 | ¥3.2932 | ¥3.2932 |
| history | - | minimax-m3 | 100 | 0 | 100 | 0 | 0 | 7,576 | ¥0.0636 | ¥2.5836 |
| judge | TR-P0 | glm-5.2 | 247 | 31 | 0 | 451,097 | 19,840 | 664,356 | ¥18.5579 | ¥20.8870 |
| judge | TR-P1 | glm-5.2 | 245 | 22 | 0 | 457,353 | 30,528 | 770,016 | ¥21.0810 | ¥22.9740 |
| judge | TR-P2 | glm-5.2 | 202 | 145 | 0 | 385,478 | 16,640 | 619,662 | ¥17.1065 | ¥29.3860 |
| preflight | TR-P0 | glm-5.2 | 1 | 0 | 0 | 1,400 | 0 | 1,357 | ¥0.0410 | ¥0.0410 |
| preflight | TR-P1 | glm-5.2 | 1 | 0 | 0 | 1,442 | 0 | 1,887 | ¥0.0539 | ¥0.0539 |
| preflight | TR-P2 | glm-5.2 | 1 | 0 | 0 | 1,471 | 0 | 2,593 | ¥0.0711 | ¥0.0711 |

## Pricing Assumptions

| Model | Input ¥/1M | Cache-hit input ¥/1M | Output ¥/1M | Large-input threshold |
| --- | ---: | ---: | ---: | ---: |
| deepseek-v4-pro | 3 | 0.025 | 6 | n/a |
| glm-5.2 | 6 | 1.3 | 24 | 32,000 |
| kimi-k2.6 | 6.5 | 1.1 | 27 | n/a |
| minimax-m3 | 2.1 | 0.42 | 8.4 | 512,000 |

- Known cost uses provider token usage and the direct-lab CNY rates in packages/shared/src/pricing.ts.
- Cached prompt tokens are charged at the configured cache-hit rate and remain part of promptTokens.
- Reasoning tokens are already included in completionTokens and are not charged a second time.
- A call without usage is conservatively estimated from its row average; before an average exists, history assumes 12k input/2k output and judging assumes 20k input/4k output.
- When a provider reports completion usage but zero prompt tokens for a nonempty request, known cost includes the output and estimated cost adds the same conservative input assumption.
- Provider failures that never return capture metadata may be unbilled; the monitor still estimates recorded missing attempts conservatively.
