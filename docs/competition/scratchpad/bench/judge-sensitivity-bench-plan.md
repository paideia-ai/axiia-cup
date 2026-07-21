# Judge Sensitivity Benchmark Plan

Source prompt: `docs/competition/scratchpad/bench/judge-sensitivity-bench-prompt.md`

## 1. What The Benchmark Measures

The benchmark should measure whether a judge model's main decision changes when the debate history quality changes.

For a two-side game with side A and side B:

- `policyWinRateA = A policy wins / total judgments`
- `policyWinRateB = B policy wins / total judgments`
- `rawMargin = policyWinRateA - policyWinRateB`
- `sensitivity(level X vs baseline level 3) = rawMargin(level X) - rawMargin(level 3)`

Because the varied side can be either A or B, the report should also include a direction-normalized metric:

- if side A is varied: `variedSideMargin = A - B`
- if side B is varied: `variedSideMargin = B - A`

That makes "better prompt quality helped the varied side" positive in both orientations. The raw `A-B` margin should still be saved because it is the simplest cross-scenario comparison.

The headline metric should use the main policy judgment only:

- Shangyang: `变法` vs `维持现状`
- Honnoji: `袭击本能寺` vs `西进毛利`
- Trolley: per-mini-case `一人侧` vs `五人侧`

Request approvals and full programmatic scores should be saved as diagnostics, not the headline metric, because the prompt explicitly says this benchmark cares about the main verdict and omits 问询.

## 2. Current Repo State

`trolley-bench` has been caught up with `origin/master`, which contains GLM-5.2. The focused catalog test passes after the merge:

```bash
bun test apps/api/src/engine/model-catalog.test.ts
```

The current catalog shape is:

- keep `glm-5.1` valid for historical records
- add `glm-5.2` as a submission/evaluation model
- expose `glm-5.2`, not `glm-5.1`, as the player-selectable GLM model
- map it to SiliconFlow API model `zai-org/GLM-5.2`

The current judge set should stay within the repo/catalog models already used for the benchmark comparison. Do not add `gpt-5.5` or `claude-opus-4-8` for this run.

The current engine already supports benchmark trace metadata:

- `benchmarkRunId`
- `benchmarkName`
- `benchmarkCaseId`

It also skips `llm_calls` persistence for benchmark-only traces, while still allowing Langfuse tracing. That is the right boundary for this benchmark: artifacts in `docs/bench/runs/...` are authoritative; Langfuse is trace/debug support.

## 3. Prompt Quality Levels

Use the same four levels for every role:

| Level | Meaning | Strategy prompt body |
|---|---|---|
| 1 | Random meaningless garble | `only talk in 乱码; talk in different 乱码 each turn. The 乱码 you speak is entirely meaningless, random, impossible to decode.` |
| 2 | Barely grammatical but bad Chinese reasoning | `你智力低下，说话自相矛盾` |
| 3 | Near-empty baseline | `-` |
| 4 | Sophisticated user prompt | role-specific strong prompt |

Important interpretation: these are appended after the normal scenario `agentPromptTemplate`. Level 3 is therefore not truly blank; it is "Agent 提示词模板 only, with no useful user strategy." That matches the scratchpad.

## 4. Fixed Randomness And Hidden Goals

For request-based scenarios, do not use random true requests. Fix the first request for each active side.

Shangyang:

- side A true request: `SR1`
- side B true request: `GR1`

Honnoji:

- `chosokabe`: `CM1`
- `yoshiaki_envoy`: `YA1`
- `hosokawa_fujitaka`: `HF1`
- `akechi_ashigaru`: `AS1`

Set `judgeTranscriptA = []` and `judgeTranscriptB = []` for this benchmark, because 问询 is intentionally omitted. If programmatic score is computed as a diagnostic, it must be labeled `no-examination score`; otherwise people will compare it incorrectly with normal gameplay score.

Trolley has no hidden goals, no request approvals, and no examination phase.

## 5. Judge Models

Use these judge models:

- `deepseek-v4-pro`
- `kimi-k2.6`
- `qwen3.6-27b`
- `glm-5.2`

Do not include:

- MiniMax
- `gpt-5.5`
- `claude-opus-4-8`

Each prepared debate history should be fed to every judge model. Default judge repeats should be `10`, but this should be configurable.

## 6. Player Model

All debate histories should use `glm-5.2` for both player sides, regardless of the saved model in historical submissions.

This differs from the previous win-rate benches, where representative prompt samples retained or upgraded saved submission models. Here the model variable is intentionally held fixed so the debate-history quality variable is cleaner.

## 7. Scenario Designs

### 7.1 Shangyang Court

Scenario ID: `shangyang-court`

Side A: `商鞅`, supports `变法`

Side B: `甘龙`, supports `维持现状`

Generate 8 debate histories:

| Varied side | Baseline side | Histories |
|---|---|---|
| 商鞅 | 甘龙 level 3 | 商鞅 levels 1, 2, 3, 4 |
| 甘龙 | 商鞅 level 3 | 甘龙 levels 1, 2, 3, 4 |

The level-4 prompts for Shangyang should come from the scratchpad prompt itself:

- Kurt 商鞅 prompt
- Kurt 甘龙 prompt

The level-3 vs level-3 history appears in both orientations. Keep both job records for symmetric reporting, but deduplicate execution if desired by storing one canonical generated history and linking both analysis rows to it.

### 7.2 Honnoji

Scenario ID: `honnoji-decision`

Side A camp: wants to assassinate 信长, policy win is `袭击本能寺`.

Side B camp: wants to avoid assassination, policy win is `西进毛利`.

There are four role pair matchups:

- `chosokabe` vs `hosokawa_fujitaka`
- `chosokabe` vs `akechi_ashigaru`
- `yoshiaki_envoy` vs `hosokawa_fujitaka`
- `yoshiaki_envoy` vs `akechi_ashigaru`

For each role pair, generate 8 debate histories:

| Varied side | Baseline side | Histories |
|---|---|---|
| attack-side character | defense-side character level 3 | attack levels 1, 2, 3, 4 |
| defense-side character | attack-side character level 3 | defense levels 1, 2, 3, 4 |

Total Honnoji debate histories: `4 role pairs * 8 = 32`.

Use the existing representative prompts for level 4 from:

- `docs/competition/prompts/honnoji-user-samples/selected-samples.json`

The run artifact should preserve the selected sample metadata:

- author/display name
- email/user id if already present in selected sample
- submission id/version
- sample id
- prompt hash
- prompt body

### 7.3 Trolley Problem

Scenario ID: `trolley-problem`

Side A: `一人侧`, policy win per case is `一人侧`.

Side B: `五人侧`, policy win per case is `五人侧`.

Trolley is not a single-policy scenario in the same way as Shangyang/Honnoji. The report should headline sensitivity per mini-case.

For this sensitivity benchmark, do not run the normal 3-case Trolley match bundles. We only need 8 debate histories per mini-case:

For each mini-case `A-E`, use the same 8 prompt-level orientations:

| Varied side | Baseline side | Histories |
|---|---|---|
| 一人侧 | 五人侧 level 3 | 一人侧 levels 1, 2, 3, 4 |
| 五人侧 | 一人侧 level 3 | 五人侧 levels 1, 2, 3, 4 |

Total Trolley debate histories: `5 mini-cases * 8 = 40`.

Implementation note: the production Trolley scenario is shaped around 3-case matches. The benchmark should use a one-mini-case Trolley history generator/judge prompt, or a benchmark-specific scenario snapshot, so the unit being varied is exactly one mini-case. Do not expand to all 3-case combinations.

The report denominator is then uniform: each mini-case has the same number of histories and judge repeats.

Use existing representative prompts for level 4 from:

- `docs/competition/prompts/trolley-user-samples/selected-samples.json`

Use only the strongest representative prompt pair for Trolley level 4: yisiliu v49. Do not include Vivian v2 in this sensitivity benchmark, because that would mix prompt-author variance into the prompt-quality variable.

## 8. Expected Workload

If using one level-4 prompt per role/side:

| Scenario | Debate histories |
|---|---:|
| Shangyang | 8 |
| Honnoji | 32 |
| Trolley | 40 |
| Total | 80 |

Judge calls with default settings:

`80 histories * 4 judge models * 10 repeats = 3200 judge calls`

History generation jobs are not multiplied by judge repeats:

- Shangyang: 8 debate histories
- Honnoji: 32 debate histories
- Trolley: 40 debate histories
- total: 80 debate histories, all generated once with `glm-5.2`

At the raw player-call level, each generated debate history still contains multiple dialogue completions. The judge repeat count means the same fixed debate history is fed to the same judge model 10 times; it does not generate another debate history with the same prompts.

Expected player dialogue calls:

- Shangyang: `8 histories * 10 rounds = 80` player calls
- Honnoji: `32 histories * 20 rounds = 640` player calls
- Trolley: `40 histories * 10 rounds = 400` player calls, assuming one mini-case history uses the same 10-round setting
- total: about `1120` player calls

The production DB snapshot should remain the source of truth for the exact scenario turn counts captured in `scenario-snapshots.json`.

This is a real benchmark, not a tiny replay. I would implement smoke modes before the full run:

- `--scenario shangyang-court --levels 3,4 --judge-repeats 1`
- `--scenario honnoji-decision --pair chosokabe:hosokawa_fujitaka --levels 3,4 --judge-repeats 1`
- `--scenario trolley-problem --case A --levels 3,4 --judge-repeats 1`

## 9. Artifact Design

Create one scenario-agnostic script:

```text
scripts/bench-judge-sensitivity.ts
```

Suggested commands:

```bash
bun scripts/bench-judge-sensitivity.ts plan [options]
bun scripts/bench-judge-sensitivity.ts run-histories [options]
bun scripts/bench-judge-sensitivity.ts judge [options]
bun scripts/bench-judge-sensitivity.ts report [options]
```

One run directory:

```text
docs/bench/runs/judge-sensitivity-<timestamp>/
  config.json
  scenario-snapshots.json
  prompt-levels.json
  histories.json
  judge-results.json
  summary.json
  summary.md
  index.html
```

`config.json` should include:

- run id
- git branch and commit
- dirty worktree flag
- CLI options
- player model id and catalog definition
- judge model ids and catalog definitions
- temperature settings
- concurrency settings
- repeat count
- source scenario path or DB snapshot path

`scenario-snapshots.json` should include, for each scenario:

- scenario id/title
- role names
- role options used
- request lists used
- fixed true request assignment
- `agentPromptTemplate`
- `agentPromptTemplateSha256`
- `judgePrompt`
- `judgePromptSha256`
- `scorerPrompt`
- `scorerPromptSha256`
- turn count
- source row timestamp if from DB

`prompt-levels.json` should include:

- level definitions
- exact prompt body per role/side/level
- prompt hash
- level-4 sample metadata

`histories.json` should include:

- scenario id
- job id
- pair id / mini-case id
- varied side
- varied level
- baseline level
- model A/B
- fixed assignment
- transcript
- langfuse metadata/links if available
- status/error/retry count

`judge-results.json` should include:

- source history id
- judge model
- repeat index
- rendered judge prompt hash and length
- raw judge output
- parsed policy judgment
- parsed requests/judgments
- policy winner
- no-examination programmatic score if computed
- parse errors
- langfuse metadata/links if available

## 10. Implementation Notes

The existing `executeMatchSession()` always runs examination when the scenario has an `examinationQuestionTemplate`. For this benchmark, either:

1. add an optional `skipExamination?: boolean` parameter to `executeMatchSession`, or
2. implement a benchmark-local dialogue generator using the exported prompt helpers and `chatCompletion`.

I prefer option 1 if we can keep it narrow:

- add `skipExamination?: boolean`
- condition changes from `hasExamination` to `hasExamination && !params.skipExamination`
- keep existing behavior unchanged for normal gameplay
- add a focused test or script-level smoke to prove omission works

For judge replay, do not call the full session runner. Use the existing exported helpers:

- `formatDebateTranscriptForJudge`
- `buildJudgePrompt`
- `computeProgrammaticScore`
- `chatCompletion`

If `buildJudgePrompt` does not expose enough for role options or one-mini-case Trolley judging, add a small shared helper rather than copying scenario interpolation logic.

## 11. Reporting

The report should have three levels:

1. model-level sensitivity summary
2. scenario/pair/case sensitivity details
3. raw run table for debugging

For each judge model, show:

- average absolute sensitivity from level 3 to levels 1/2/4
- sensitivity from bad to good: level `1/2 -> 3/4`
- sensitivity from near-empty to sophisticated: level `3 -> 4`
- parse failure rate
- judge instability at fixed history: variance across 10 repeats

For Shangyang/Honnoji:

- x-axis: varied prompt level
- y-axis: policy win rate of varied side
- split by varied side and pair
- show raw A/B margin as secondary table

For Trolley:

- split by mini-case `A-E`
- show per-case varied-side win rate
- show denominator; after the one-mini-case design, all mini-cases should have uniform history counts

## 12. Concurrency And Resume Policy

Use bounded parallelism.

Recommended defaults:

- history generation concurrency: `2`
- judge replay concurrency: `4`
- per-job timeout: configurable, default `900000ms`
- retries: 3 with backoff
- checkpoint after every job
- `--resume` skips only completed `status: "ok"` jobs

Because all history-generation dialogue turns use SiliconFlow `glm-5.2`, do not push history generation too hard. Judge replay is lighter but still uses paid model calls, so keep global judge replay concurrency conservative.

## 13. Confirmed Implementation Choices

1. Use the production DB snapshot as the scenario source.
   - Reason: the benchmark must save the actual prompt-template versions used.

2. Use GLM-5.2 from the updated catalog.
   - This branch has now caught up with `origin/master`, which contains the GLM-5.2 catalog change.

3. Do not include `gpt-5.5` or `claude-opus-4-8` as judge models.
   - Keep the run to the four selected catalog judge models.

4. Use only yisiliu v49 as the Trolley level-4 prompt source.
   - Do not include the other selected Trolley prompt pair.

5. Deduplicate duplicate `3-vs-3` histories physically.
   - Execute once per scenario/pair/mini-case and reference it from both orientation rows.

6. Default judge repeats: `10`.
   - Still run smoke tests with `1` repeat first.

7. Headline scoring uses main policy only.
   - Request/programmatic score is diagnostic only and should be labeled `diagnostic, no examination`.

## 14. Proposed Execution Order

1. Keep the merged GLM-5.2 catalog state verified with `bun test apps/api/src/engine/model-catalog.test.ts`.
2. Verify the four selected judge models resolve through the existing catalog/provider routing.
3. Add the benchmark script skeleton and config planner.
4. Add scenario snapshot loading from the production DB snapshot.
5. Add prompt-level construction and selected sample loading.
6. Add history generation with fixed assignments and skipped examination.
7. Generate the first staged history batch for `shangyang-court` only.
   - Expected output: 8 debate histories.
   - Stop after this batch so the histories can be inspected before Honnoji/Trolley generation.
8. After approval, generate Honnoji and Trolley histories.
9. Add judge replay across the full judge model set.
10. Add summary aggregation and HTML report.
11. Run judge replay.
12. Verify artifact invariants:
    - expected history count
    - expected judge-result count
    - all prompt/template hashes present
    - all judge outputs parse or parse failures are explicit
    - no accidental gameplay `llm_calls` persistence for benchmark-only traces
