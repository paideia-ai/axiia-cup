# Benchmark Workspace

This directory is the canonical entry point for benchmark plans, shared inputs,
saved runs, result summaries, and published reports.

Start with [STRUCTURE.md](STRUCTURE.md) for the directory contract, historical
path map, and instructions for adding a run. Published Vercel pages are listed
in [vercel-html-pages.md](vercel-html-pages.md).

## Benchmark Families

- [Judge Bias](judge-bias/README.md) measures side propensity across frozen
  debate histories while varying judge models.
- [Judge Sensitivity](judge-sensitivity/README.md) measures whether verdicts
  respond to controlled changes in debate quality and judge settings.
- [Judge Prompt WinRateBalancer](judge-prompt-winrate-balancer/README.md)
  iteratively calibrates one judge prompt so every scenario unit falls within
  its accepted win-rate range.
- [Scoring](scoring/README.md) checks scorer correctness and provider behavior.
  It is a separate technical family because it does not evaluate judge
  verdicts.

## Shared Inputs

Reusable benchmark inputs live under [inputs](inputs/README.md). A run must copy
the exact inputs it used into its own manifest or snapshot artifacts so the run
remains reproducible if shared inputs later change.

## Source Of Truth

Each directory under a family's `runs/` tree is one atomic evidence bundle.
Keep its configuration, snapshots, histories, raw results, summaries, logs,
and HTML together. Do not create repository-wide folders for all logs, all
JSON, or all reports.

Saved run JSON is authoritative for what happened. Markdown and HTML are
derived views. A partial or repair run must be labeled as such in the family
README instead of being silently treated as the canonical result.

Benchmark runners live under [scripts/bench](../../scripts/bench/README.md).
