# Judge Sensitivity Benchmark

This family measures whether a judge model's verdict changes when debate
quality moves through controlled prompt levels. Repeated judging of one saved
history measures replay instability; it does not create independent debate
histories.

## Runner And Plans

- Runner: `scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts`
- Honnoji renderer:
  `scripts/bench/judge-sensitivity/render-honnoji-judge-sensitivity.ts`
- [Original benchmark request](plans/original-request.md)
- [Implemented benchmark plan](plans/benchmark-plan.md)

The runner places a one-scenario run under `runs/<scenario>` and a combined run
under `runs/multi-scenario` unless `--output-dir` is supplied.

## Saved Runs

- [Multi-scenario runs](runs/multi-scenario) contain the original production
  snapshot and broad run.
- [Honnoji runs](runs/honnoji) contain repair lanes and the thinking-mode
  matrix. The published report source is
  [honnoji-judge-sensitivity.html](runs/honnoji/judge-sensitivity-prod-honnoji-thinking-matrix-20260713T040900Z/honnoji-judge-sensitivity.html).
- [Shangyang runs](runs/shangyang) contain the original lanes and explicit
  thinking variants. The main published report source is
  [shangyang-judge-sensitivity.html](runs/multi-scenario/judge-sensitivity-prod-20260708T200403Z/shangyang-judge-sensitivity.html).
- [Trolley runs](runs/trolley) currently contain the case-E Level-1 repair
  lane; there is no separately published Trolley sensitivity page.
