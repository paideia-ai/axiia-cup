# GLM-5.2 High Cost Audit

- Run ID: `94e076e3-c8ac-4916-8edd-8ef5091dc6d0`
- Langfuse session: `benchmark:94e076e3-c8ac-4916-8edd-8ef5091dc6d0`
- Prompt candidate: `TR-P2` (`P2`)
- Cases: A, D, E
- Retained judgments: 240
- Actual billable generations: 244
- Langfuse-recorded cost: **$1.4946 / approximately ¥10.84**

The main pass ran at concurrency 30. It produced 240 billable generations and cost $1.4577 (approximately ¥10.57). Four malformed JSON responses were rerun at concurrency 4, adding $0.0369 (approximately ¥0.27).

Langfuse also contains two 180-second timeout traces from the main pass. Both have zero usage and zero recorded cost, so they are excluded from the 244 billable-generation count and the cost total.

## Cost By Case

| Case | Traces | Billable | Cost USD | Cost CNY |
| --- | ---: | ---: | ---: | ---: |
| A | 83 | 82 | $0.5179 | ¥3.75 |
| D | 80 | 80 | $0.4472 | ¥3.24 |
| E | 83 | 82 | $0.5295 | ¥3.84 |

## Latency

Following the benchmark convention, cached calls are excluded from the reported average latency. Across the 196 retained calls with no cache-hit tokens, mean latency was 27.38 seconds, median latency was 25.69 seconds, and p90 latency was 41.07 seconds.

The CNY figure uses the repository's observability conversion of 7.25 CNY/USD. Langfuse received per-call cost details from the repository pricing table; this is an application-side billing estimate, not a provider invoice.
