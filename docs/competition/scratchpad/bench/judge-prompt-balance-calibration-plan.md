# Judge Prompt Balance Calibration Plan

## Objective

Design a judge prompt that does not strongly favor one policy before considering
the debate itself.

For the neutral baseline:

- Within each debate history, both players use the same player model.
- The player model varies across the test panel and is not limited to DeepSeek.
- Both players use the Level 3 prompt.
- Level 3 currently means the near-empty prompt `-`, not an empty string.
- A 50%-50% aggregate win rate is ideal.
- Any result between 30%-70% is acceptable for every tested unit.

Identical player models and Level 3 prompts do not make a match perfectly
symmetric. The roles, goals, character identities, and speaking order still
differ. Therefore, 50%-50% is a product calibration target, not proof of
objective fairness.

Balance alone is also insufficient. A judge that chooses randomly can produce
50%-50% while ignoring debate quality. The calibration must therefore test
balance, discrimination, consistency, and output validity together.

The implementation must support Shangyang Court, Honnoji, and trolley. Execution
is staged separately: tonight, run only the trolley benchmark. Shangyang's
current judge prompt is considered fine and is not run tonight, but its adapter
and benchmark path must still be implemented. Honnoji must also be implemented,
but its history generation and judge replay are deferred. Holdout, sensitivity,
presentation-swap, and production-bundle validations are also deferred until
they are explicitly requested.

## Baseline Provenance And Production Safety

There are three independent calibration tracks:

| Track     | Production scenario ID | P0 prompt being calibrated                            |
| --------- | ---------------------- | ----------------------------------------------------- |
| Shangyang | `shangyang-court`      | Judge Sensitivity copy of the production prompt       |
| Honnoji   | `honnoji-decision`     | Judge Sensitivity copy of the production prompt       |
| Trolley   | `trolley-problem`      | Judge Sensitivity one-mini-case production adaptation |

These prompts must not be collapsed into one shared cross-scenario prompt. Each
scenario keeps its own template variables, reasoning instructions, output
contract, and scenario-specific requirements.

The authoritative P0 baseline for each track is the prompt frozen in
`docs/bench/runs/judge-sensitivity-prod-20260708T200403Z/scenario-snapshots.json`.
Do not use a repo seed or local SQLite database as P0. The Shangyang and Honnoji
prompts in that snapshot are byte-for-byte equal to the current production
prompts. The trolley prompt is the recent Judge Sensitivity adaptation of the
production prompt for one-mini-case-at-a-time judging.

Retrieve the scenario rows through the authenticated, read-only production API:

```text
GET /api/admin/scenarios
```

The calibration workflow must not send `POST`, `PUT`, `PATCH`, or `DELETE`
requests to production. It must not run a production migration, deployment, or
direct database write. Passing the benchmark also does not authorize writing a
candidate prompt back to production; that requires a separate explicit action.

Still retrieve the current scenario rows at the beginning of a calibration run.
Use the production row for all non-judge-prompt scenario fields and compare its
judge prompt with the frozen Judge Sensitivity baseline. Save the following
locally:

- Exact Judge Sensitivity P0 and current production judge prompt for each
  scenario.
- SHA-256 hash and character count of both prompts, plus whether they are
  byte-identical.
- Production scenario ID and judge model.
- Retrieval time and production API origin.
- The full read-only scenario snapshot needed to render the judge input.

P0 must be byte-for-byte identical to the saved Judge Sensitivity prompt.
Candidate prompts are local copies or in-memory overrides used only by the
benchmark. For trolley, the runner must reject a P0 that references
`{{caseId2}}`, `{{caseId3}}`, asks for three judgments, or requires an aggregate
`winner` field.

The trolley adaptation keeps the production reasoning criteria but makes these
three contract changes:

1. Judge only the one case supplied in the current benchmark input.
2. Return only `judgments[{{caseId1}}]` and `speech`.
3. Do not infer, supplement, or judge the other two production cases, and do not
   return a three-case majority `winner`.

Use distinct version names such as:

```text
SY-P0, SY-P1, SY-P2, ...
HN-P0, HN-P1, HN-P2, ...
TR-P0, TR-P1, TR-P2, ...
```

Store the complete candidate text, hash, and unified diff from its immediate
predecessor. If the production prompt or selected Judge Sensitivity snapshot
changes during calibration, do not silently mix versions. Finish against the
pinned inputs or begin a new run.

## Implementation Scope And Execution Stage

Implement one shared prompt-balance runner plus scenario adapters for all three
scenarios. Each adapter must define its units, canonical policy side, neutral
Level-3 history jobs, production judge-input rendering, and verdict parser.
Scenario-specific validation is deferred. The CLI must support an explicit scenario filter
and emit a dry-run manifest before any player or judge API call.

Implementation requirements:

- Shangyang adapter: one reform-versus-status-quo unit.
- Honnoji adapter: all four attacker/defender character matchups.
- Trolley adapter: mini-cases A through E judged and reported independently;
  add final production-style three-case-bundle validation when it is requested.
- Shared support for frozen-history reuse, six judge repeats, explicit
  thinking-on verification, bounded concurrency, resume, raw artifacts, and
  the 30%-70% stop rule.

Tonight's execution stage is **trolley only**. Before starting it, inspect the
dry-run manifest and require:

```text
scenario IDs: trolley-problem only
active units: A, B, C, D, E
development histories: 40 with the four-model panel
normal-presentation judge calls per prompt candidate: 240
Shangyang jobs: 0
Honnoji jobs: 0
```

Do not generate Shangyang or Honnoji histories and do not send their judge
calls tonight. Their implemented adapters remain available for later runs.

## Calibration Units

Do not pool all scenario results into one win rate. The implemented benchmark
supports these ten units:

| Scenario                   | Unit                                      | Number of units |
| -------------------------- | ----------------------------------------- | --------------: |
| Shangyang Court            | The full Shangyang-versus-Ganlong matchup |               1 |
| Honnoji                    | Each attacker/defender character matchup  |               4 |
| Trolley                    | Each individual mini-case, A through E    |               5 |
| **Total implemented**      |                                           |          **10** |
| **Tonight's active scope** | Trolley mini-cases only                   |           **5** |

An acceptable prompt must satisfy the 30%-70% requirement for every scenario
unit. Player models are represented equally inside each unit's pooled rate. A
favorable result in one Honnoji matchup or trolley mini-case must not cancel an
extreme result in another.

## Balance-Search Stop Condition

For candidate prompt `Pk`, mark a scenario unit **PASS** as soon as its pooled
canonical-side win rate is within the inclusive range:

$$
0.30 \leq W_u(P_k) \leq 0.70
$$

The balance-search decision for a scenario is:

| Scenario  | Stop condition for candidate `Pk`                                 |
| --------- | ----------------------------------------------------------------- |
| Shangyang | Its one matchup is in the 30%-70% range                           |
| Honnoji   | All four character matchups are individually in the 30%-70% range |
| Trolley   | All five mini-cases are individually in the 30%-70% range         |

Run P0 first. If P0 satisfies the scenario stop condition, do not invent or
test P1 for balance; retain the exact frozen baseline prompt. If only some units
pass, record them as passing regression constraints and make the next minimal
change specifically to address the failing units.

One prompt is shared by all units within a scenario, so a passing unit cannot
be removed from later candidate evaluation. Every candidate must be replayed
over all of that scenario's frozen units to confirm that fixing one unit did
not push another outside 30%-70%.

This is the stopping rule for the current development-stage balance search.
Stop at the first candidate that passes every active unit. Later validation is
tracked separately and must not run automatically as part of this stage.

## Player-Model Strata

"Same model" is a constraint within one debate history. It does not mean that
all histories must use one model.

For every neutral history in player-model stratum `m`, require:

```text
modelA = modelB = m
promptA = promptB = Level 3
reasoning/thinking settings are the same on both sides
```

Do not use mixed-player-model matches such as DeepSeek versus GLM in this neutral
calibration, because player-model differences would become an additional
confound.

The credentialed player-model strata selected for this benchmark are:

- DeepSeek V4 Pro
- Kimi K2.6
- MiniMax M3
- GLM-5.2

The exact model set must be fixed in the run manifest before generating
histories. Qwen3.6 27B is excluded because no DashScope API key is available.
DeepSeek V4 Flash remains outside the panel because DeepSeek V4 Pro is the
selected DeepSeek stratum.

Report every scenario unit separately for every player model. The primary gate
uses the pooled per-unit rate with equal player-model representation. The
per-model rates remain required diagnostics: if one model is extreme while the
pooled unit passes, report the disagreement rather than automatically expanding
that model's histories. Never pool different Honnoji matchups or different
trolley mini-cases together.

The player model and judge model are independent experimental axes. For
example, GLM-5.2 may judge Kimi-vs-Kimi histories, GLM-vs-GLM histories, and
DeepSeek-vs-DeepSeek histories.

## Judge Thinking Mode And Replay Concurrency

Every judge model **must** run with thinking/reasoning explicitly enabled. This
is a hard inclusion requirement, not an optional optimization. Do not rely on a
provider default. Before including a judge model in the benchmark, make a
preflight call through its direct API route and verify both that the request
contains the provider-specific thinking-on control and that the response
contains the provider's available evidence of reasoning, such as reasoning
content or a nonzero reasoning-token count. A model whose thinking-on setting
cannot be enabled or verified must not be silently included; record the
preflight failure and stop for a decision.

Run a candidate-specific preflight for P0, P1, and every later prompt before
its normal replay calls. It must use one actual frozen history, verify thinking,
and successfully parse that candidate's policy verdict. A preflight from P0
cannot authorize P1. These one-call preflights are additional to the normal
judge-call counts in the manifest and do not regenerate debate histories.

For every judge result, record:

- the requested thinking mode;
- the exact provider-specific request control;
- the provider and resolved model identifier;
- the returned reasoning-token count and/or presence of reasoning content;
- whether the thinking-on preflight and call-level verification passed.

This requirement applies to judge calls. Player-model thinking settings remain
a separate, fixed history-generation dimension and must not be inferred from
the judge configuration.

Use an initial target concurrency of **100** during the judging/replay phase;
concurrency greater than 50 is explicitly allowed and preferred when provider
limits permit it. This means up to 100 judge calls may replay already-frozen
debate histories concurrently; it does not authorize regenerating debate
histories or changing which history is assigned to a repeat. Use configurable
bounded concurrency, normal retry/backoff for transient provider errors, and
record configured and achieved concurrency, throttling, and retry counts. If
provider limits prevent a reliable run above 50, treat sustained rate-limit
failures as an execution issue and record the required fallback explicitly;
do not silently lower the concurrency.

## Existing Benchmark Evidence (Screening Only)

A read-only production check refreshed on 2026-07-22 found these current judge-prompt
template hashes:

| Scenario  | Production judge model | Characters | SHA-256                                                            |
| --------- | ---------------------- | ---------: | ------------------------------------------------------------------ |
| Shangyang | `glm-5.1`              |      1,442 | `34d855678ba23aaeabd4d21946783b867e752b22a9c61f27352835bd68e8759a` |
| Honnoji   | `deepseek-v3.2`        |      2,527 | `780aa199af835a1703238091bdea3e4547516b31d419fcb70e4a8398d0fb95bd` |
| Trolley   | `deepseek-v3.2`        |      1,307 | `0f457bcfaec153aacc56af1d5dea254e2339b5e1948f69c42cd2f33efe0c8fd7` |

GLM-5.1 is the current production judge recorded for Shangyang. The selected
prompt-balance target is GLM-5.2; for Honnoji and trolley, this calibration
applies GLM-5.2 experimentally to the selected P0 text and is not describing
their currently deployed judge model. Honnoji P0 equals production; trolley P0
is the one-case adaptation described below.

The selected Judge Sensitivity snapshot uses those exact Shangyang and Honnoji
prompts. Its trolley one-case P0 is 1,119 characters with SHA-256
`af4f07c5b2433b349d96d92d410afd62c7fc04040ecbff233d0e2b138d6449c3`.
It intentionally differs from the 1,307-character, three-case production prompt
shown above.

### Level-3 sensitivity evidence

The Level-3 rows use GLM-5.2 on both player sides with the same near-empty `-`
prompt. Each matchup contains only one physically generated history. The two
logical varied-side orientations reuse that exact history and have the same
rendered judge-prompt hash, so the combined percentage below pools 20 judge
replays of one history; it is not 20 independent debates.

| Scenario/unit                               | GLM-5.1 canonical-side rate | Screening status             |
| ------------------------------------------- | --------------------------: | ---------------------------- |
| Shangyang: reform side                      |                         65% | In range; execution deferred |
| Honnoji: 长宗我部元亲阵营 vs 明智军中的足轻 |           70% assassination | In range                     |
| Honnoji: 长宗我部元亲阵营 vs 细川藤孝       |           35% assassination | In range                     |
| Honnoji: 足利义昭的使者 vs 明智军中的足轻   |           95% assassination | Out of range                 |
| Honnoji: 足利义昭的使者 vs 细川藤孝         |           30% assassination | In range                     |

These percentages are literally inside or outside the screening range, but an
intermediate percentage from only one physical history means GLM-5.1 changed
its decision across identical-input replays. That is fixed-history
nondeterminism rather than balance across independent debates, so it must be
reported as a diagnostic even though stability is not a veto in the current
balance search.

The Honnoji results used GLM-5.1 with thinking explicitly on. The Shangyang
result came from the older unsuffixed GLM-5.1 route, whose thinking mode was not
explicitly set or verified; the decision not to run it tonight is a scope
decision, not a new benchmark pass. There is no completed GLM-5.1 trolley
Level-3 sensitivity result in the saved artifact.

### Judge-bias replay evidence

The older judge-bias runs used the current Honnoji and trolley prompt text, but
they did not use this calibration's neutral panel. They replayed strong selected
user prompts, sometimes used different player models across sides, judged each
history once, and did not explicitly verify GLM-5.1 thinking mode.

| Scenario/unit                               | GLM-5.1 canonical-side rate | Screening status |
| ------------------------------------------- | --------------------------: | ---------------- |
| Honnoji: 长宗我部元亲阵营 vs 明智军中的足轻 |         77.8% assassination | Out of range     |
| Honnoji: 长宗我部元亲阵营 vs 细川藤孝       |         22.2% assassination | Out of range     |
| Honnoji: 足利义昭的使者 vs 明智军中的足轻   |         77.8% assassination | Out of range     |
| Honnoji: 足利义昭的使者 vs 细川藤孝         |         11.1% assassination | Out of range     |
| Trolley A: 原始电车                         |       29.2% one-person side | Out of range     |
| Trolley B: 器官移植                         |        100% one-person side | Out of range     |
| Trolley C: 地下室婴儿                       |       91.7% one-person side | Out of range     |
| Trolley D: 自动驾驶车                       |       33.3% one-person side | In range         |
| Trolley E: 缸中之脑                         |        100% one-person side | Out of range     |

The Honnoji judge-bias aggregate is 17 assassination decisions out of 36
(47.2%), but that global number is not a pass because it hides four
out-of-range matchup rates. The older Shangyang Judge Bias Spectrum did not
include GLM-5.1.

These results make it plausible that the selected P0 already passes some units,
especially three of four Honnoji matchups in the thinking-on Level-3 screening
and trolley case D in the judge-bias panel. They do not satisfy the new stop
condition by themselves because none uses the complete neutral, cross-model,
multi-history design. They are GLM-5.1 priors for P0, not substitutes for
running P0 with the selected GLM-5.2 judge.

## Neutral History Panel

### Development panel

Start with two independent neutral debate histories for each combination of
unit and selected player model. Let `M` be the number of selected player-model
strata:

```text
10 implemented units x M player models x 2 histories
```

For example:

```text
4 credentialed player models: 10 x 4 x 2 = 80 histories
```

Generate each history only once. Reuse the exact same histories when testing
every candidate judge prompt. This isolates the effect of changing the judge
prompt from variation in player generation.

Use exactly two histories per unit and player model in the planned development
panel. Do not automatically expand through a `2 -> 4 -> 6 -> 8` sequence. With
four equally represented player models, each unit already contains eight
independent histories:

```text
4 player models x 2 histories = 8 independent histories per unit
8 histories x 6 judge repeats = 48 judge calls per unit and candidate
```

For the four-model panel, the implemented and active scopes are:

| Scenario                      |  Units | Independent histories | Normal-presentation judge calls |
| ----------------------------- | -----: | --------------------: | ------------------------------: |
| Shangyang                     |      1 |                     8 |                              48 |
| Honnoji                       |      4 |                    32 |                             192 |
| Trolley                       |      5 |                    40 |                             240 |
| **All implemented scenarios** | **10** |                **80** |                         **480** |
| **Active trolley scope**      |  **5** |                **40** |                         **240** |

Those 48 normal-presentation verdicts are sufficient to calculate the observed
win rate on the fixed panel. The six repeats improve measurement of judge
nondeterminism on each history; they do not turn eight debate histories into
48 independent debates or prove how the prompt would behave over every
possible history.

Additional histories are outside the normal search loop. Add them only after
an explicit decision that broader debate coverage is required, not merely
because one per-model diagnostic is 0% or 100%. Any approved additions must
supplement the frozen panel; never regenerate or replace earlier histories.

### Holdout panel

After selecting a candidate, generate a separate holdout with two histories per
unit and player model and six judge repeats per history:

```text
10 implemented units x M player models x 2 holdout histories
```

Do not tune the prompt after inspecting the holdout results and do not expand
the holdout merely to turn a failure into a pass. If the candidate fails, begin
a new versioned calibration round with a new holdout panel rather than tuning
directly against the old holdout.

### Scenario-specific coverage

- **Shangyang:** use one policy-win-rate gate. Also inspect hidden-request
  assignments separately when its execution stage is scheduled.
- **Honnoji:** require a separate gate for all four character matchups. In the
  final validation, distribute histories across the 3 x 3 true-request matrix
  instead of allowing one request assignment to dominate the result.
- **Trolley:** calibrate mini-cases A, B, C, D, and E independently. After
  isolated calibration passes, validate the prompt on production-style
  three-case bundles to detect context and case-order effects.

## Diagnose The Existing Bias

Run the normal presentation first and apply the 30%-70% stop condition. Before
changing the prompt to address a failing unit, evaluate that unit's frozen
neutral histories with the two additional diagnostic presentations below. Do
not automatically triple every passing candidate's calls.

The three available judge-input presentations are:

1. **Normal presentation:** the frozen baseline's native presentation, including
   one-case input for trolley.
2. **Reversed presentation order:** present the two sides in the opposite order
   while preserving their semantic identities and goals.
3. **Identity-masked presentation:** replace character and camp names with
   neutral labels while preserving goals, claims, and debate content.

Interpretation:

- If the verdict follows the first or second displayed side, the main problem
  is position or presentation-order bias.
- If masking names changes the verdict, the judge is relying on character or
  historical identity.
- If the same policy remains favored under all presentations, the judge likely
  has a policy or moral prior that is not coming from the debate.

The masked presentation is primarily a diagnostic. It need not become the
production format if character identity is legitimately relevant to the game.
Reversed presentation and identity masking are deferred diagnostics. Run them
only when the later validation stage is explicitly requested.

## Empirical Prompt Search Protocol

Do not preselect any wording to insert into a judge prompt. No proposed clause
is assumed to improve balance before an experiment demonstrates that it does.

The first experiment in every scenario track must use P0, the exact frozen
Judge Sensitivity baseline prompt. Candidate P1 may be designed only after inspecting P0's per-unit
estimated win probabilities, presentation controls, parse failures, and raw
judge outputs.

Every candidate must be recorded with:

| Field            | Required content                                                   |
| ---------------- | ------------------------------------------------------------------ |
| Observed failure | The specific P0 or previous-candidate result being addressed       |
| Evidence         | Relevant unit-level rates and representative raw judge outputs     |
| Hypothesis       | Why one particular wording change may alter that observed behavior |
| Exact diff       | One small localized change from the immediate predecessor          |
| Prediction       | Which unit and metric should move, and in which direction          |
| Result           | The measured result on the same frozen histories                   |
| Decision         | Keep, reject, or revise the candidate                              |

Maintain a separate run-level `prompt-results-summary.md` and
`prompt-results-summary.json`. These files must collect P0, P1, and every later
candidate in one place. For each candidate they preserve the exact prompt,
prompt hash, parent and exact diff, experiment rationale, evaluation status,
per-unit empirical win-probability estimates with their win and judgment
counts, model-stratum diagnostics, and pass result. The estimate is the
observed probability of a categorical canonical-side judgment over the frozen
history panel; it is not a confidence score emitted by the judge model.

Preserve the scenario's existing template variables, input structure, output
contract, and JSON schema. Change only one prompt mechanism at a time so the
result can be attributed to that change.

Use this candidate sequence:

| Candidate | Definition                                          |
| --------- | --------------------------------------------------- |
| P0        | Exact frozen Judge Sensitivity baseline; no changes |
| P1        | First minimal change justified by P0 evidence       |
| P2        | Next minimal change justified by P1 evidence        |
| Pn        | Continue the same evidence-change-test loop         |

Run each candidate over exactly the same frozen histories and judge-repeat
settings as its predecessor. Retain a change only when the measured result
improves the diagnosed balance failure. Reject or revert changes that have no
effect or worsen balance. Record random instability and prompt-strength
sensitivity for later validation rather than using them as current-stage vetoes.

Do not assume that all three scenarios require the same modification. Do not
reuse a clause across scenarios unless each scenario's own experiment supports
it. Also avoid directly ordering the judge to make half of all matches go to
each side; that could manufacture random 50%-50% results instead of improving
evidence-based judgment.

## Win-Rate Calculation

### Notation

- `u` is one calibration unit, such as Honnoji matchup 2 or trolley case C.
- `m` is one player-model stratum, such as Kimi-vs-Kimi or GLM-vs-GLM.
- `h` is one independently generated debate history in that unit.
- `r` is one repeated judge call over that same history.
- `R` is the number of judge repeats, set to 6.
- `H_m` is the number of independent histories for player model `m`, set to 2
  in the planned development and holdout panels.
- `M` is the number of equally weighted player-model strata.
- The canonical side is one consistently selected policy side used for
  counting, such as the reform side, assassination side, or one-person side.

### Step 1: Win probability for one history

For a particular history in unit `u` and player-model stratum `m`, calculate the
proportion of repeated judge calls won by the canonical side:

$$
q_{u,m,h} = \frac{1}{R}\sum_{r=1}^{R}
\mathbf{1}(\text{canonical side wins in repeat }r)
$$

Plain-language version:

```text
one-history win rate = canonical-side wins / judge repeats
```

If the canonical side wins 4 of 6 repeated judgments, then:

$$
q_{u,m,h} = \frac{4}{6} \approx 0.667
$$

### Step 2: Diagnostic rate for one unit and player model

Give every independently generated history equal weight:

$$
W_{u,m} = \frac{1}{H_m}\sum_{h=1}^{H_m} q_{u,m,h}
$$

Plain-language version:

```text
unit-model win rate = average of the per-history win rates
```

Within one unit-model stratum, do not treat 12 repeated judge calls over two
histories as 12 independent debates. There are only two independent histories;
the repeats measure judge instability on each frozen history.

`W_{u,m}` is a required diagnostic, not the primary stop gate. An extreme
per-model result is reported as a generalization warning; it does not trigger
automatic history expansion or erase the equal-weight pooled result by itself.

### Step 3: Pooled rate and per-unit acceptance gate

Give every selected player model equal weight:

$$
W_u = \frac{1}{M}\sum_{m=1}^{M} W_{u,m}
$$

Plain-language version:

```text
unit win rate = average of the equally weighted player-model win rates
```

Every scenario unit must satisfy:

$$
0.30 \leq W_u \leq 0.70
$$

With two histories for each of four player models and six judge repeats, one
unit contains eight independent histories and 48 judge verdicts. The observed
pooled rate therefore has 1/48, or about 2.08-point, granularity. If the judge is
stable on every history, outcomes effectively move in 12.5-point increments;
for example, four canonical-side histories out of eight produce a 50% pooled
rate.
Within any single model stratum, two stable histories can still produce only
0%, 50%, or 100%. That per-model diagnostic is intentionally coarse and does
not replace the ten-history pooled stop metric.

### Step 4: Compare already-tested passing candidates

Calculate the largest distance from 50% among the scenario's pooled unit rates:

$$
D = \max_u \left|W_u - 0.50\right|
$$

Plain-language version:

```text
worst-unit deviation = the largest absolute distance from 50% among all scenario units
```

Lower is better:

| Worst unit's win rate | Worst-unit deviation |
| --------------------: | -------------------: |
|                   50% |                 0.00 |
|                   60% |                 0.10 |
|                   70% |                 0.20 |
|                   80% |                 0.30 |
|                  100% |                 0.50 |

The 30%-70% acceptance rule is equivalent to requiring `D <= 0.20`.
This metric may compare candidates that have already been tested, but it must
not extend the search after the first candidate satisfies the stop condition.
Do not spend additional calls merely to move an acceptable result closer to
50%.

## Distinguish Balance From Randomness

Within one unit-model stratum, these two judges both have an aggregate 50% win
rate, but only the first is useful.

### Stable and balanced

Two histories receive the following canonical-side wins over six repeats:

```text
6, 0
```

Each history receives a stable verdict, while the panel divides one-one.

### Random and balanced

Two histories receive:

```text
3, 3
```

The aggregate is still 50%, but every fixed history is unstable. Report this
clearly so the result is not mistaken for balance across independent debates.
Per the current decision, this observation does not veto a prompt that passes
the unit-level 30%-70% stop condition.

## Deferred Validation Conditions

The following checks remain useful for a later validation stage, but they are
not run automatically and do not block the current balance-search stop rule:

1. **Strong-versus-garble discrimination:** when one side uses a strong Level 4
   prompt and the other uses Level 1, the stronger side should win at least
   roughly 80% of the time in both orientations.
2. **Prompt-strength sensitivity:** the existing prompt-strength trend should
   remain positive for both varied-side orientations.
3. **Presentation-swap consistency:** reversing presentation order should not
   reverse the semantic decision unless the content itself changes.
4. **Fixed-history stability:** repeated judgments of the same history should
   be reported as a diagnostic only; it is not a veto condition.
5. **Output validity:** invalid JSON and unresolved policy outputs should be
   near zero.
6. **Thinking-mode validity:** every included judge call must have passed the
   model-specific thinking-on verification described above.

Run these only after an explicit instruction to begin validation.

## Selection Process

1. Retrieve all three current production scenarios through the read-only API,
   load P0 prompts from the pinned Judge Sensitivity snapshot, and freeze both
   prompt hashes plus their byte-equality result locally.
2. Freeze the selected player-model strata, neutral histories, assignments, and
   output parser.
3. Preflight every judge model through its direct API route and verify that
   thinking is explicitly enabled and observable in the response.
4. Run each scenario's exact frozen P0 prompt over its relevant development histories,
   replaying the frozen histories with initial target judge concurrency 100.
5. Apply the stop condition. If all of that scenario's pooled unit rates are
   between 30% and 70%, stop the balance search and retain that candidate.
6. If any unit fails, diagnose that failure from unit-level results and raw
   judge outputs, then record a falsifiable hypothesis and make one small local
   modification that directly tests it.
7. Run the new candidate over the same frozen histories and compare it with its
   immediate predecessor.
8. Keep the planned two histories per unit and player model fixed. Add histories
   only after an explicit decision that broader debate coverage is required.
9. Keep only empirically supported changes, then repeat steps 5-8 until every
   relevant pooled scenario-unit rate is between 30% and 70%, then stop the
   development-stage balance search.
10. If multiple already-tested candidates pass, prefer the smallest justified
    diff from frozen P0; use worst-unit deviation `D` only as a tie-breaker.
11. When explicitly requested later, confirm the selected candidate on untouched holdout histories. Every pooled
    scenario-unit rate must again be between 30% and 70%, and model-specific
    diagnostics must be reported and investigated when extreme.
12. When explicitly requested later, run the existing prompt-sensitivity benchmark to confirm that balance was
    not obtained by ignoring debate quality.
13. When explicitly requested later, run the final trolley candidate on production-style three-case bundles.
14. Preserve prompt text, prompt hash, histories, raw outputs, parsed results,
    and repeat indices in an immutable run directory.

Tune against GLM-5.2 first as the selected production target. When the
later validation stage is requested, validate each scenario's selected prompt
unchanged across every prospective production judge model. "Unchanged" here
means one prompt per scenario across judge models, not one shared prompt across
the three scenarios. Use model-specific prompt variants only if a model
repeatedly fails the gates and the additional operational complexity is
accepted.
