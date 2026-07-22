# Scoring Benchmarks

This family checks scorer-output correctness, provider compatibility, and
scoring-model behavior. It is kept separate from judge behavior because its
output is a numeric game score rather than a policy verdict.

- [Benchmark plan](plan.md)
- Runner: `scripts/bench/scoring/bench-scoring.ts`
- Correctness verifier: `scripts/bench/scoring/verify-scoring-correctness.ts`
- [Saved runs](runs)

The retained runs include the combined pilot, the correctness oracle output,
and the DeepSeek provider comparison.
