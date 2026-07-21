# Honnoji Judge Sensitivity Run Notes

Run ID: `d389bf7b-15b9-4556-9a8e-22caf00ef0ef`

## Matrix

- 32 existing Honnoji debate histories; no player histories were regenerated.
- 10 repeated judgments per history and judge configuration.
- 19 final judge configurations: eight model families with explicit thinking on/off, plus DeepSeek V4 Pro, Kimi K2.7 Code, and MiniMax M2.5 as thinking-on/always-on only.
- GPT models and GLM-4.5 Air are excluded.
- DeepSeek R1 thinking-on/off was excluded during execution after persistent provider 503 errors.
- Planned final judge rows: 6,080.
- Judge concurrency: 30.

## Preflight Findings

- All 21 candidate configurations were tested on the same saved Level-4 Honnoji history before the full run.
- MiniMax M2.5 does not expose a working thinking-off control through this API. `enable_thinking: false`, `thinking: { type: "disabled" }`, and both together still returned reasoning. Per the user decision, MiniMax is included once as thinking-on.
- Qwen3.6 27B and Qwen3.6 35B A3B omit `usage.completion_tokens_details.reasoning_tokens` in both modes. Their thinking-on responses contained more than 10,000 reasoning characters, while their explicit-off responses contained no reasoning text. The verifier therefore permits the missing token counter only for these two explicit-off definitions and records `reasoningTokensOmittedAllowed: true`.
- DeepSeek R1 explicit-off took 325.5 seconds in preflight and succeeded after the five-minute per-attempt timeout/retry path.
- The 19 retained successful preflight rows were seeded into the final run and are reused as repeat 1 for that history.

## DeepSeek R1 Exclusion

- The initial concurrency-30 run issued 20 R1 calls together; all 20 failed after retries with SiliconFlow `503 Service Unavailable`, code `50508`, "System is too busy now. Please try again later."
- R1 was isolated into a separate lane at concurrency 5. Another 30 rows failed with the same provider response, showing that this was a current model-availability problem rather than only the original concurrency.
- The user chose to exclude R1. Its 80 earlier successful rows and 50 failed rows remain isolated in `docs/bench/runs/judge-sensitivity-prod-honnoji-r1-lane-20260713T044912Z/` and are not included in final metrics or HTML.

## Report Verification

- The custom Honnoji report generator is `scripts/render-honnoji-judge-sensitivity.ts`.
- Chromium dependencies unavailable system-wide were extracted without sudo to `~/.local/share/playwright-deps`.
- Partial-report desktop and mobile checks passed at 1440x1000 and 390x844 with no page errors or body overflow.
- Pair switching, model sorting, win-rate sorting, and combined spectrum filters passed interaction checks.

## Full Run

The full run was still in progress when this note was created. Final completion counts, errors, parse failures, mode-verification totals, and latency outliers will be taken from `judge-results.json` and the final HTML.
