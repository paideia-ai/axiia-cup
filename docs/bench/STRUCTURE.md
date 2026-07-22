# Benchmark Directory Structure

This document records the benchmark layout after the family-first migration on
2026-07-22. It is intended for a human or an agent entering the repository
without prior conversation context.

## Organizing Rules

1. Benchmark family comes first.
2. Scenario comes before run ID where a family has scenario-specific runs.
3. A run directory is an atomic evidence bundle and is moved as a whole.
4. Plans belong to the family, not to an individual run.
5. Inputs reused by more than one family belong under `docs/bench/inputs`.
6. Application model routing, observability, and provider code remain under
   `apps/` and `packages/`; they are runtime infrastructure, not benchmark
   artifacts.
7. Historical `outputDir` and source-path values inside saved run artifacts
   describe the execution-time location. They are not rewritten after a move.

## Directory Tree

```text
docs/bench/
|-- README.md
|-- STRUCTURE.md
|-- vercel-html-pages.md
|-- inputs/
|   `-- user-prompt-samples/
|       |-- honnoji/
|       `-- trolley/
|-- judge-bias/
|   |-- README.md
|   |-- plans/
|   `-- runs/
|       |-- honnoji/
|       `-- trolley/
|-- judge-sensitivity/
|   |-- README.md
|   |-- plans/
|   `-- runs/
|       |-- multi-scenario/
|       |-- honnoji/
|       |-- shangyang/
|       `-- trolley/
|-- judge-prompt-winrate-balancer/
|   |-- README.md
|   |-- plans/
|   `-- runs/
|       `-- trolley/
`-- scoring/
    |-- README.md
    |-- plan.md
    `-- runs/
```

```text
scripts/bench/
|-- README.md
|-- judge-bias/
|-- judge-sensitivity/
|-- judge-prompt-winrate-balancer/
`-- scoring/
```

## Run Bundle Contract

Existing runs keep their original contents. New runners should continue using
the established names where applicable:

- `config.json`: resolved invocation and execution settings.
- `manifest.json` or scenario snapshots: frozen provenance and expected work.
- `histories.json`: generated debate evidence.
- `judge-results.json` or `results.json`: raw model outputs and parsed verdicts.
- `summary.json`: machine-readable derived analysis.
- `summary.md` or `report.md`: human-readable analysis.
- `index.html` or a named HTML report: static presentation.
- `run.log` and retry logs: operational evidence for partial or resumed runs.
- `candidates/`: prompt-balancer candidate prompts and their replay results.

Not every legacy run has every file. Family READMEs identify the useful report
entry point and whether a run is canonical, supporting, partial, or a repair.

## Historical Move Map

The migration moved 22 tracked run directories containing 182 files and
71,740,219 bytes. A SHA-256 comparison found no added, removed, or changed
files inside the run bundles.

### Judge Bias

- `docs/bench/runs/honnoji-judge-models-20260706T163228Z` -> `docs/bench/judge-bias/runs/honnoji/honnoji-judge-models-20260706T163228Z`
- `docs/bench/runs/honnoji-win-rate-20260702T154153Z` -> `docs/bench/judge-bias/runs/honnoji/honnoji-win-rate-20260702T154153Z`
- `docs/bench/runs/honnoji-win-rate-20260702T154153Z-akechi-deepseek` -> `docs/bench/judge-bias/runs/honnoji/honnoji-win-rate-20260702T154153Z-akechi-deepseek`
- `docs/bench/runs/trolley-judge-models-20260702T145707Z` -> `docs/bench/judge-bias/runs/trolley/trolley-judge-models-20260702T145707Z`
- `docs/bench/runs/trolley-win-rate-20260702T060024Z` -> `docs/bench/judge-bias/runs/trolley/trolley-win-rate-20260702T060024Z`
- `docs/bench/runs/trolley-win-rate-smoke-20260702T053153Z` -> `docs/bench/judge-bias/runs/trolley/trolley-win-rate-smoke-20260702T053153Z`

### Judge Sensitivity

- `docs/bench/runs/judge-sensitivity-prod-20260708T200403Z` -> `docs/bench/judge-sensitivity/runs/multi-scenario/judge-sensitivity-prod-20260708T200403Z`
- `docs/bench/runs/judge-sensitivity-prod-snapshot-20260709T084029Z` -> `docs/bench/judge-sensitivity/runs/multi-scenario/judge-sensitivity-prod-snapshot-20260709T084029Z`
- `docs/bench/runs/judge-sensitivity-prod-honnoji-chosokabe-akechi-l1-rerun-20260709T161500Z` -> `docs/bench/judge-sensitivity/runs/honnoji/judge-sensitivity-prod-honnoji-chosokabe-akechi-l1-rerun-20260709T161500Z`
- `docs/bench/runs/judge-sensitivity-prod-honnoji-r1-lane-20260713T044912Z` -> `docs/bench/judge-sensitivity/runs/honnoji/judge-sensitivity-prod-honnoji-r1-lane-20260713T044912Z`
- `docs/bench/runs/judge-sensitivity-prod-honnoji-thinking-matrix-20260713T040900Z` -> `docs/bench/judge-sensitivity/runs/honnoji/judge-sensitivity-prod-honnoji-thinking-matrix-20260713T040900Z`
- `docs/bench/runs/judge-sensitivity-prod-case-E-l1-rerun-20260709T160000Z` -> `docs/bench/judge-sensitivity/runs/trolley/judge-sensitivity-prod-case-E-l1-rerun-20260709T160000Z`
- `docs/bench/runs/judge-sensitivity-prod-shangyang-l1-rerun-20260709T161000Z` -> `docs/bench/judge-sensitivity/runs/shangyang/judge-sensitivity-prod-shangyang-l1-rerun-20260709T161000Z`
- `docs/bench/runs/judge-sensitivity-prod-shangyang-minimax-thinking-on-20260712T200536Z` -> `docs/bench/judge-sensitivity/runs/shangyang/judge-sensitivity-prod-shangyang-minimax-thinking-on-20260712T200536Z`
- `docs/bench/runs/judge-sensitivity-prod-shangyang-thinking-off-20260712T084436Z` -> `docs/bench/judge-sensitivity/runs/shangyang/judge-sensitivity-prod-shangyang-thinking-off-20260712T084436Z`
- `docs/bench/runs/judge-sensitivity-prod-shangyang-thinking-on-20260712T091045Z` -> `docs/bench/judge-sensitivity/runs/shangyang/judge-sensitivity-prod-shangyang-thinking-on-20260712T091045Z`
- `docs/bench/runs/judge-sensitivity-shangyang-20260708T184559Z` -> `docs/bench/judge-sensitivity/runs/shangyang/judge-sensitivity-shangyang-20260708T184559Z`
- `docs/bench/runs/judge-sensitivity-shangyang-prod-20260708T194525Z` -> `docs/bench/judge-sensitivity/runs/shangyang/judge-sensitivity-shangyang-prod-20260708T194525Z`

### Judge Prompt WinRateBalancer

- `docs/bench/runs/judge-prompt-balance-trolley-20260721T225005Z` -> `docs/bench/judge-prompt-winrate-balancer/runs/trolley/judge-prompt-balance-trolley-20260721T225005Z`

### Scoring

- `docs/bench/runs/scoring-correctness-2026-06-23` -> `docs/bench/scoring/runs/scoring-correctness-2026-06-23`
- `docs/bench/runs/scoring-deepseek-provider-comparison-2026-06-24` -> `docs/bench/scoring/runs/scoring-deepseek-provider-comparison-2026-06-24`
- `docs/bench/runs/scoring-pilot-combined-2026-06-23` -> `docs/bench/scoring/runs/scoring-pilot-combined-2026-06-23`

## Other Moved Material

- Production-derived user-prompt inventories moved from
  `docs/competition/prompts/*-user-samples` to
  `docs/bench/inputs/user-prompt-samples/<scenario>`.
- Judge Bias design notes moved to `docs/bench/judge-bias/plans`.
- Judge Sensitivity requests, plans, and prompt-patch notes moved to
  `docs/bench/judge-sensitivity/plans`.
- Prompt-balancer planning moved to
  `docs/bench/judge-prompt-winrate-balancer/plans`.
- Scoring planning moved to `docs/bench/scoring/plan.md`.
- Benchmark executables moved from flat `scripts/bench-*.ts` names into the
  matching `scripts/bench/<family>` directory.

The speculative courtroom design remains under
`docs/competition/scratchpad/court-room-bench.md`; it is not wired to any of
these benchmark runners. Product PVE prompt assets remain under
`docs/competition/prompts/pve-prompts`.

## Adding A New Run

1. Start from the relevant family README and runner.
2. Use the runner's default family/scenario output directory or pass an
   explicit path under that directory.
3. Freeze source prompts, scenario data, model settings, thinking mode, and
   expected job counts in the run.
4. Keep raw results append-only while the run is resumable.
5. Generate summaries and HTML from the saved raw artifacts.
6. Add the run to the family README with its status and lineage.
7. If deployed, add the public URL and local source report to
   `vercel-html-pages.md`.
