# Run Notes

## TR-P0 warmup concurrency adjustment

- Initial judge concurrency: 100, as requested by the calibration plan when provider limits permit it.
- Observed problem: Zhipu returned HTTP 429 with code `1302` during the 40-call warmup burst.
- Action: interrupted the run before replay and resumed the same candidate/jobs at concurrency 20.
- Preservation: persisted successful result IDs remain resumable; failed rows are retried. Frozen debate histories were not regenerated.
- Cost accounting: 11 successful warmup responses completed after the last persisted checkpoint and before interruption. They are listed as conservative missing-usage adjustments in `cost-adjustments.json`.

## TR-P0 long-tail generation bound

- Three result IDs exhausted the original 240-second call timeout; one also produced malformed JSON on an earlier attempt.
- A 600-second retry of the remaining warmup still did not terminate and was interrupted before automatic duplicate retries.
- Across 232 successful judgments, the largest completion was 9,713 tokens.
- The benchmark now sends `max_tokens: 16384`, including reasoning and visible output. This is above every successful observed completion and prevents pathological unbounded streams.
- The pending result IDs are resumed with the same prompt, histories, judge model, and explicit thinking mode.
