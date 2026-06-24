# Scoring Model Benchmark Plan

Date: 2026-06-22

Branch: `scoring-bench`

## Goal

Benchmark scorer-phase model choices after adding a short JSON-format instruction to the scorer prompt. The benchmark should answer:

- Which model reliably returns JSON that passes `JSON.parse`.
- Which model returns the expected scorer schema: `reasoning`, `scoreA`, `scoreB`.
- Which model is fast enough for the scoring phase.
- Which model is cheap enough to use as the default scorer.
- Which failures remain prompt-only problems versus API/structured-output problems.

## Prompt Change

Append this sentence to the scorer prompt:

```text
输出必须是可被 JSON.parse 直接解析的合法 JSON；reasoning 内引用内容请用「」或单引号，禁止未转义英文双引号。
```

This sentence targets the observed scorer failure where Claude returns a JSON-like object, but the `reasoning` string contains unescaped ASCII double quotes around phrases such as judgment labels. That closes the JSON string early and causes errors like `JSON Parse error: Unrecognized token '袭'`.

## Candidate Models

The requested benchmark set is:

| Label | Repo model id | Provider API model | Provider |
| --- | --- | --- | --- |
| Qwen3.6 27B | `qwen3.6-27b` | `Qwen/Qwen3.6-27B` | SiliconFlow |
| GLM-5.1 | `glm-5.1` | `Pro/zai-org/GLM-5.1` | SiliconFlow |
| DeepSeek V4 Flash | `deepseek-v4-flash` | `deepseek-v4-flash` | DeepSeek official API |
| DeepSeek V4 Pro | `deepseek-v4-pro` | `deepseek-v4-pro` | DeepSeek official API |
| GPT-5.4 mini | `gpt-5.4-mini` | `gpt-5.4-mini` | OpenAI |
| GPT-4.1 | `gpt-4.1` | `gpt-4.1` | OpenAI |
| Claude Sonnet 4.5 | `claude-sonnet-4-5` | `claude-sonnet-4-5` | Anthropic |
| Claude Opus 4.8 | benchmark-only | `claude-opus-4-8` | Anthropic |
| Claude Opus 4.7 | benchmark-only | `claude-opus-4-7` | Anthropic |

Note: `claude-opus-4-7` and `claude-opus-4-8` are not currently in `packages/shared/src/constants.ts`. The benchmark runner should call them as benchmark-only models unless we explicitly decide to expose them in the website model catalog.

## Price Snapshot

Prices below are current planning inputs and should be copied into the final HTML report with source links and the date checked.

| Model | Input price | Output price | Source |
| --- | ---: | ---: | --- |
| Qwen3.6 27B | CNY 0.60 / 1M tokens | CNY 4.80 / 1M tokens | SiliconFlow pricing, under 128k context |
| GLM-5.1 | CNY 6.00 / 1M tokens | CNY 24.00 / 1M tokens | SiliconFlow pricing, under 32k context |
| DeepSeek V4 Flash | USD 0.14 / 1M input tokens, cache miss | USD 0.28 / 1M output tokens | DeepSeek pricing |
| DeepSeek V4 Pro | USD 0.435 / 1M input tokens, cache miss | USD 0.87 / 1M output tokens | DeepSeek pricing |
| GPT-5.4 mini | USD 0.75 / 1M tokens | USD 4.50 / 1M tokens | OpenAI pricing |
| GPT-4.1 | USD 2.00 / 1M tokens | USD 8.00 / 1M tokens | OpenAI GPT-4.1 pricing |
| Claude Sonnet 4.5 | USD 3.00 / 1M tokens | USD 15.00 / 1M tokens | Anthropic pricing |
| Claude Opus 4.8 | USD 5.00 / 1M tokens | USD 25.00 / 1M tokens | Anthropic pricing |
| Claude Opus 4.7 | USD 5.00 / 1M tokens | USD 25.00 / 1M tokens | Anthropic pricing |

Source links to preserve in the HTML:

- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
- OpenAI GPT-4.1 pricing announcement: https://openai.com/index/gpt-4-1/
- OpenAI reasoning settings: https://developers.openai.com/api/docs/guides/reasoning
- OpenAI Chat Completions create reference: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create/
- Anthropic pricing: https://docs.anthropic.com/en/docs/about-claude/pricing
- Anthropic Opus 4.8 migration/model details: https://platform.claude.com/docs/en/about-claude/models/migration-guide
- Anthropic effort settings: https://platform.claude.com/docs/en/build-with-claude/effort
- Anthropic adaptive thinking: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- DeepSeek pricing: https://api-docs.deepseek.com/quick_start/pricing
- DeepSeek Chat Completions API: https://api-docs.deepseek.com/api/create-chat-completion
- SiliconFlow pricing: https://siliconflow.cn/pricing
- SiliconFlow JSON mode: https://docs.siliconflow.com/en/userguide/guides/json-mode
- SiliconFlow Chat Completions API: https://docs.siliconflow.com/en/api-reference/chat-completions/chat-completions

## Cost Estimate

Use this conservative average scorer call size unless the benchmark runner records better live data:

- Input: 2,500 tokens per scorer call.
- Output: 700 tokens per scorer call.

Pilot run: 10 cases per model.

| Model | Pilot cost estimate |
| --- | ---: |
| Qwen3.6 27B | ~CNY 0.05 |
| GLM-5.1 | ~CNY 0.32 |
| DeepSeek V4 Flash | ~USD 0.005 |
| DeepSeek V4 Pro | ~USD 0.017 |
| GPT-5.4 mini | ~USD 0.05 |
| GPT-4.1 | ~USD 0.11 |
| Claude Sonnet 4.5 | ~USD 0.18 |
| Claude Opus 4.8 | ~USD 0.30 |
| Claude Opus 4.7 | ~USD 0.30 |

Full run: 30 cases per model.

| Model | Full cost estimate |
| --- | ---: |
| Qwen3.6 27B | ~CNY 0.15 |
| GLM-5.1 | ~CNY 0.95 |
| DeepSeek V4 Flash | ~USD 0.016 |
| DeepSeek V4 Pro | ~USD 0.051 |
| GPT-5.4 mini | ~USD 0.15 |
| GPT-4.1 | ~USD 0.32 |
| Claude Sonnet 4.5 | ~USD 0.54 |
| Claude Opus 4.8 | ~USD 0.90 |
| Claude Opus 4.7 | ~USD 0.90 |

Budget note: even with retries and token variance, the full run should be safely below USD 10 equivalent.

## Model Settings To Test

Use one standard scorer prompt and one standard user payload across all models. Record the exact request payload in the raw benchmark artifact.

### Common Settings

- Run one scorer completion per case per model.
- Use the production scorer prompt plus the JSON-format sentence above.
- Validate with `sanitizeJsonResponse`, `JSON.parse`, and `scorerOutputSchema`.
- Record wall-clock `durationMs` for every scorer completion.
- Record token usage from provider response when available.
- Use no tools.
- Use max output around the production `ANTHROPIC_MAX_TOKENS` default, currently 4096, unless a provider requires a different name.

### SiliconFlow Models

Applicable models: `qwen3.6-27b`, `glm-5.1`.

Current repo behavior for SiliconFlow:

- Uses OpenAI-compatible Chat Completions.
- Sends `response_format: { type: "json_object" }` when `jsonMode: true`.
- Sends `temperature: 0`.
- Sends `enable_thinking: false` only for catalog models marked with `thinking: "disabled"`.

Recommended benchmark settings:

| Model | JSON mode | Temperature | Thinking/reasoning setting |
| --- | --- | ---: | --- |
| Qwen3.6 27B | `response_format: { type: "json_object" }` | `0` | `enable_thinking: false` |
| GLM-5.1 | `response_format: { type: "json_object" }` | `0` | Do not send a thinking flag unless SiliconFlow confirms support for this exact model |

### OpenAI Models

Applicable models: `gpt-5.4-mini`, `gpt-4.1`.

Current repo behavior for OpenAI:

- Uses OpenAI Chat Completions.
- Sends `response_format: { type: "json_object" }` when `jsonMode: true`.
- Sends `temperature: 0`.
- Does not currently send reasoning controls.

Recommended benchmark settings:

| Model | JSON mode | Temperature | Reasoning setting |
| --- | --- | ---: | --- |
| GPT-5.4 mini | `response_format: { type: "json_object" }` on Chat Completions, or schema output if using Responses | Omit temperature if the API rejects non-default values | Prefer low reasoning for the pilot. If using Responses API, send `reasoning: { effort: "low" }`; if using Chat Completions, verify the accepted `reasoning_effort` value before sending it |
| GPT-4.1 | `response_format: { type: "json_object" }` | `0` | No reasoning-effort setting |

Implementation note: the current app code uses Chat Completions and does not send reasoning controls. The benchmark runner should either keep that path for apples-to-apples production comparison, or use a separate Responses API track when testing OpenAI reasoning effort directly.

### DeepSeek Official API Models

Applicable models: `deepseek-v4-flash`, `deepseek-v4-pro`.

Current benchmark behavior for DeepSeek official API:

- Uses OpenAI-compatible Chat Completions at `https://api.deepseek.com`.
- Sends `response_format: { type: "json_object" }`.
- Sends `temperature: 0`.
- Sends `thinking: { type: "disabled" }` for a lower-latency scorer comparison.
- Uses cache-miss input pricing in the report cost estimate; real billing can be lower when DeepSeek reports cache-hit input tokens.

Recommended benchmark settings:

| Model | JSON mode | Temperature | Thinking/reasoning setting |
| --- | --- | ---: | --- |
| DeepSeek V4 Flash | `response_format: { type: "json_object" }` | `0` | `thinking: { type: "disabled" }` |
| DeepSeek V4 Pro | `response_format: { type: "json_object" }` | `0` | `thinking: { type: "disabled" }` |

### Anthropic Models

Applicable models: `claude-sonnet-4-5`, `claude-opus-4-8`, `claude-opus-4-7`.

Current repo behavior for Anthropic:

- Uses raw Anthropic Messages API.
- Sends `temperature: 0`.
- Does not currently enforce JSON with `output_config.format`.
- Ignores `jsonMode: true` for Anthropic calls.

Recommended benchmark settings:

| Model | JSON mode | Sampling | Thinking/reasoning setting |
| --- | --- | --- | --- |
| Claude Sonnet 4.5 | Prompt-only JSON instruction for the first comparison; optionally add structured output in a separate track | `temperature: 0` | No reasoning-effort setting in the current repo path |
| Claude Opus 4.8 | Prompt-only JSON instruction for the first comparison; optionally add structured output in a separate track | Do not send `temperature`, `top_p`, or `top_k` | Use low effort: `thinking: { type: "adaptive" }` plus `output_config: { effort: "low" }` |
| Claude Opus 4.7 | Prompt-only JSON instruction for the first comparison; optionally add structured output in a separate track | Do not send `temperature`, `top_p`, or `top_k` | Use low effort: `thinking: { type: "adaptive" }` plus `output_config: { effort: "low" }` |

Implementation note: Opus 4.7/4.8 reject non-default sampling parameters. The benchmark runner must omit `temperature`, otherwise the benchmark would measure request failure rather than scorer quality.

Anthropic effort options to consider for Opus 4.7/4.8:

- `low`: recommended pilot setting for scorer latency and token cost.
- `medium`: possible rerun if low effort has arithmetic or instruction-following errors.
- `high`, `xhigh`, `max`: not recommended for the first scorer benchmark because scoring should be short, deterministic, and latency-sensitive.
- Disabled reasoning: omit `thinking`; useful as an additional latency baseline, but it is not the requested Opus low-effort setting.

Structured-output note: Anthropic structured output via `output_config.format` should be treated as a separate benchmark track. It answers "can the provider enforce JSON" rather than "can this scorer prompt make the model produce valid JSON".

## Dataset

Pilot:

- 10 existing scorer inputs.
- Include Honnoji failures where the unescaped token starts around `袭击本能寺`.
- Include Honnoji failures around other quoted labels such as `西进毛利` and `维持现状`.
- Include at least one Shangyang scorer failure.
- Include a small successful-control subset only if it does not dilute the failure-focused sample.

Full benchmark:

- 30 existing scorer inputs.
- Keep the same failure distribution where possible.
- Prefer exact scorer request payloads from `llm_calls.request_json` so every model receives the same scoring task.

## Metrics For HTML Report

The final HTML report should include:

- Model list and exact request settings.
- Price snapshot and checked date.
- Cost estimate versus actual recorded token cost.
- JSON parse success rate.
- Scorer schema success rate.
- Score correctness rate against a deterministic scoring oracle.
- Invalid-output examples by model.
- Common failure class: unescaped quote, Markdown fence, prose outside JSON, missing field, numeric type issue, provider request error.
- Latency per model: mean, median, p90, min, max.
- Token usage per model: mean input, mean output.
- Recommended scorer model and reasoning for that recommendation.

## Score Correctness Oracle

The format benchmark is not sufficient by itself. A scorer response can be valid JSON and still compute the wrong score, such as treating `1 + 0.25` as `1` or subtracting a discovery penalty from the wrong side.

The correctness verifier lives at:

```bash
bun scripts/verify-scoring-correctness.ts \
  --input docs/bench/runs/scoring-pilot-combined-2026-06-23/results.json \
  --output-dir docs/bench/runs/scoring-correctness-2026-06-23
```

The verifier does not call any model. It:

- Reads an existing benchmark `results.json`.
- Fetches the original scorer prompt for each battle from the admin export API.
- Parses the judge JSON, accepted requests, true/false request labels, and examination selections.
- Parses the live prompt's discovery penalty value, instead of hardcoding old scenario defaults.
- Computes expected `scoreA` and `scoreB` in code.
- Compares every model output against the expected score.

The final model recommendation should prioritize this order:

1. JSON parse/schema reliability.
2. Score correctness.
3. Latency.
4. Cost.

## Approval Gate

Do not start the paid benchmark until the user approves:

1. Pilot size: 10 cases per model.
2. Model set, including benchmark-only Opus 4.7/4.8.
3. Opus low-effort settings.
4. Whether to run prompt-only JSON first, or add a second structured-output track.

## Runner

The pilot runner lives at:

```bash
bun scripts/bench-scoring.ts --case-limit 10
```

It requires these local environment variables for case collection:

```bash
AXIIA_API_URL=...
AXIIA_AUTH_TOKEN=...
```

It also requires provider keys for the selected model providers:

```bash
DEEPSEEK_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
SILICONFLOW_API_KEY=...
```

Useful DeepSeek-only run:

```bash
bun scripts/bench-scoring.ts \
  --case-limit 10 \
  --models deepseek-v4-flash,deepseek-v4-pro
```

Useful dry run:

```bash
bun scripts/bench-scoring.ts --dry-run --case-limit 10 --output-dir /tmp/axiia-scoring-bench-dry
```

The dry run fetches and selects scorer cases but does not call any provider model. A real run writes:

- `docs/bench/runs/scoring-<timestamp>/results.json`
- `docs/bench/runs/scoring-<timestamp>/index.html`

The runner intentionally does not write full system prompts or full request bodies to the report files.
