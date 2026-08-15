# Direct Prompt Builder API Evaluation

This run tests the eight checked-in role Prompt Builders directly. It does not invoke a Meta Prompt Builder and does not test a newly generated Prompt Builder.

## Files

- [`histories.json`](./histories.json): complete system, user, and assistant messages; source hashes and offsets; provider metadata; token use; durations; and final response lengths.
- [`analysis.md`](./analysis.md): cross-run findings plus an observation for every one of the 16 conversations.

## Test matrix

Each direct builder was run once with DeepSeek and once with OpenAI. Every conversation used three user turns: initial strategy, adversarial refinement, and explicit final-delivery confirmation.

| Scenario | Direct builders | Providers |
| --- | --- | --- |
| Honnoji | Chosokabe, Hosokawa, Ashigaru, Yoshiaki envoy | DeepSeek V4 Pro, GPT-5.4 |
| Shangyang | Shangyang, Ganlong | DeepSeek V4 Pro, GPT-5.4 |
| Trolley | Yiren, Wuren | DeepSeek V4 Pro, GPT-5.4 |

There are 16 complete conversations and 48 successful assistant calls. Each conversation started with a fresh message array containing exactly one checked-in direct builder as its system message. The user turns were identical across providers for the same builder.

## Provider settings

- DeepSeek: `deepseek-v4-pro`, temperature `0`, thinking disabled, `max_tokens: 2600`.
- OpenAI: `gpt-5.4` (responses identify the snapshot as `gpt-5.4-2026-03-05`), low reasoning effort. The four completed Honnoji first turns used `max_completion_tokens: 2600`; subsequent calls used `8000` after the smaller allowance sometimes produced an empty, length-limited response by spending the full allowance on reasoning.

Empty OpenAI harness attempts are not recorded as assistant messages or successful calls. The setting history is preserved in `histories.json`.

## Data-source boundary

The run attempted the live production scenario endpoint, received `401` because the available admin token was expired, and did not substitute a local database. Therefore this run evaluates the checked-in builders' behavior, not whether their scenario facts match the current live rows.
