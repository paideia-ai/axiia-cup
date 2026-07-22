# Benchmark Runners

Run benchmark commands from the repository root. Plans, shared inputs, saved
runs, and published-report links live under `docs/bench`.

## Judge Bias

- `bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts`
- `bun scripts/bench/judge-bias/bench-honnoji-judge-models.ts`
- `bun scripts/bench/judge-bias/bench-trolley-win-rate.ts`
- `bun scripts/bench/judge-bias/bench-trolley-judge-models.ts`

The win-rate runners generate history panels. The judge-model runners replay
those frozen histories.

## Judge Sensitivity

- `bun scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts`
- `bun scripts/bench/judge-sensitivity/render-honnoji-judge-sensitivity.ts`

## Judge Prompt WinRateBalancer

- `bun scripts/bench/judge-prompt-winrate-balancer/bench-judge-prompt-balance.ts`
- Test with
  `bun test scripts/bench/judge-prompt-winrate-balancer/bench-judge-prompt-balance.test.ts`.

## Scoring

- `bun scripts/bench/scoring/bench-scoring.ts`
- `bun scripts/bench/scoring/verify-scoring-correctness.ts`

## Path Convention

Each runner defaults to the matching `docs/bench/<family>/runs` tree. Use
`--output-dir` only when an experiment needs an explicit location, and keep
that location inside the same family unless the run is intentionally
temporary.
