# Judge Sensitivity Benchmark

This family measures whether a judge model's verdict changes when debate
quality moves through controlled prompt levels. Repeated judging of one saved
history measures replay instability; it does not create independent debate
histories.

## Runner And Plans

- Runner: `scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts`
- Honnoji renderer:
  `scripts/bench/judge-sensitivity/render-honnoji-judge-sensitivity.ts`
- Trolley renderer:
  `scripts/bench/judge-sensitivity/render-trolley-judge-sensitivity.ts`
- [Original benchmark request](plans/original-request.md)
- [Implemented benchmark plan](plans/benchmark-plan.md)

The runner places a one-scenario run under `runs/<scenario>` and a combined run
under `runs/multi-scenario` unless `--output-dir` is supplied.

## Trolley Subsets And GLM Effort

Use `--cases` to select one or more Trolley mini-cases. The same option applies
while generating histories and while replaying an existing history bundle;
`--case E` remains available as a single-case compatibility alias.

GLM-5.2 reasoning-effort comparisons use one base model plus explicit effort
lanes. This comparison uses `TR-P2`, the second prompt-balancer iteration, as
an explicit judge-prompt override. `TR-P0` is byte-for-byte identical to the
Trolley prompt in the original sensitivity snapshot; recording the override
keeps the changed prompt and its lineage visible in the run artifacts.

For cases A, D, and E:

```bash
bun scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts judge \
  --output-dir <run-dir-with-trolley-histories> \
  --scenario trolley-problem \
  --cases A,D,E \
  --trolley-judge-prompt docs/bench/judge-prompt-winrate-balancer/runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/candidates/TR-P2/prompt.txt \
  --judge-models glm-5.2 \
  --glm-reasoning-efforts high,max \
  --judge-thinking enabled \
  --judge-repeats 10
```

This reuses 24 logical histories: eight for each selected case. The two effort
lanes produce 480 judge calls at ten repeats. Results are labeled separately as
`GLM-5.2 (reasoning high)` and `GLM-5.2 (reasoning max)`.

The run config records `TR-P2`, parent `TR-P1`, the source path, the baseline
prompt hash (`af4f07c5...d6449c3`), and the active prompt hash
(`ee0dbb07...d05763`). Resume rejects a changed source or a scenario snapshot
whose active prompt hash no longer matches. Existing results are reused only
when their fully rendered judge-prompt hash matches the active prompt.

When the override comes from a prompt-balancer candidate directory, judge
replays also record its identity in Langfuse. The command above records
`judgePromptCandidateId=TR-P2` and the derived `judgePromptVersion=P2` on every
judge generation; it does not label dialogue-history calls because those calls
do not use the judge prompt.

Zhipu documents GLM-5.2 thinking as dynamic: an enabled request can decide that
a particular response does not need an emitted reasoning trace. The benchmark
therefore verifies and records `thinking.type`, `reasoning_effort`, and observed
reasoning tokens separately. It does not retry a valid response merely because
the model skipped reasoning; doing so would bias the effort comparison.

## Saved Runs

- [Multi-scenario runs](runs/multi-scenario) contain the original production
  snapshot and broad run.
- [Honnoji runs](runs/honnoji) contain repair lanes and the thinking-mode
  matrix. The published report source is
  [honnoji-judge-sensitivity.html](runs/honnoji/judge-sensitivity-prod-honnoji-thinking-matrix-20260713T040900Z/honnoji-judge-sensitivity.html).
- [Shangyang runs](runs/shangyang) contain the original lanes and explicit
  thinking variants. The main published report source is
  [shangyang-judge-sensitivity.html](runs/multi-scenario/judge-sensitivity-prod-20260708T200403Z/shangyang-judge-sensitivity.html).
- [Trolley runs](runs/trolley) contain the case-E Level-1 repair lane and the
  GLM-5.2 high-versus-max P2 comparison. The published report source is
  [trolley-judge-sensitivity.html](runs/trolley/judge-sensitivity-trolley-glm52-high-vs-max-p2-20260722T125231Z/trolley-judge-sensitivity.html).
