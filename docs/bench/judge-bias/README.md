# Judge Bias Benchmark

This family measures the policy-side propensity of judge models on a frozen
panel of debate histories. Its strongest comparisons replay the same evidence
against different judge models; it should not be read as a universal estimate
of model bias outside the saved panel.

## Workflow

1. A scenario-specific win-rate runner selects representative prompts and
   generates debate histories.
2. A judge-model runner reuses those histories without regenerating players.
3. Reports compare policy-side win rates by case or character matchup.

## Runners

- `scripts/bench/judge-bias/bench-honnoji-win-rate.ts`
- `scripts/bench/judge-bias/bench-honnoji-judge-models.ts`
- `scripts/bench/judge-bias/bench-trolley-win-rate.ts`
- `scripts/bench/judge-bias/bench-trolley-judge-models.ts`

Run each script with no arguments to print its command help.

## Inputs And Plans

- [Shared user-prompt samples](../inputs/README.md)
- [Initial Trolley design notes](plans/trolley-initial-design.md)

## Saved Runs

Honnoji history generation, extensions, and judge replay live under
[runs/honnoji](runs/honnoji). The local source for the published aggregate
viewer is
[case-win-rate-viewer.html](runs/honnoji/honnoji-win-rate-20260702T154153Z/case-win-rate-viewer.html).

Trolley smoke, history generation, and judge replay live under
[runs/trolley](runs/trolley). The local source for the published aggregate
viewer is
[case-win-rate-viewer.html](runs/trolley/trolley-judge-models-20260702T145707Z/case-win-rate-viewer.html).
