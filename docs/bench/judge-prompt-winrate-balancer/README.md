# Judge Prompt WinRateBalancer

This family iteratively adjusts a scenario's judge prompt to reduce the policy
bias of one selected judge model. Histories are generated once and then reused
for every candidate prompt.

A candidate passes only when every calibration unit is complete and its
canonical-side win probability falls inside the configured inclusive range.
For Trolley, each of the five mini-cases is a separate gate.

## Runner And Plan

- Runner:
  `scripts/bench/judge-prompt-winrate-balancer/bench-judge-prompt-balance.ts`
- Tests:
  `scripts/bench/judge-prompt-winrate-balancer/bench-judge-prompt-balance.test.ts`
- [Calibration plan](plans/calibration-plan.md)

The runner places a one-scenario run under `runs/<scenario>` and a combined run
under `runs/multi-scenario` unless `--output-dir` is supplied.

Judge and thinking-preflight calls send the exact candidate identity to
Langfuse. For example, candidate `TR-P2` produces generation and trace metadata
`judgePromptCandidateId=TR-P2` and `judgePromptVersion=P2`, plus corresponding
`judgePromptCandidate:TR-P2` and `judgePromptVersion:P2` tags. Historical traces
are not rewritten.

## Current Trolley Run

[judge-prompt-balance-trolley-20260721T225005Z](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z)
contains the 40 frozen histories and candidates P0-P2. P0 and P1 are complete
and rejected. P2 is paused at 196 of 240 judgments because the direct provider
account ran out of balance.

- [HTML report](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/index.html)
- [Markdown report](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/report.md)
- [Machine-readable prompt summary](runs/trolley/judge-prompt-balance-trolley-20260721T225005Z/prompt-results-summary.json)
