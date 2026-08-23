---
name: kesou-preflight-review
description: Review Axiia Cup MCQs, option-to-prompt mappings, Prompt Builders, and related handoff materials using Kesou's recorded feedback to Vivian and Melody. Use before sending a draft to Kesou, when asked to review as Kesou, or when checking prompt-context visibility, short-choice UX, question-dimension overlap, option-space overlap, scenario and role accuracy, version regression, and whether short MCQ choices expand into usable final prompts. Do not use for unrelated generic proofreading.
---

# Kesou Preflight Review

## Goal

Apply Kesou's recurring review method before Melody, Vivian, or another contributor sends work to him. Find the feedback he is likely to repeat, help resolve it at the correct structural level, and decide whether the material is ready for his review.

Do not impersonate Kesou or claim that he approved unseen work. Say **ready to send to Kesou**, not **approved by Kesou**.

## Load the review standard

Read [`references/review-rubric.md`](references/review-rubric.md) for every review.

When working in the Axiia Cup repository:

1. Read applicable `AGENTS.md` instructions.
2. Read the complete artifact bundle, not only the file named by the author.
3. Verify product claims against current authoritative documentation and live implementation when relevant.
4. Read earlier versions and prior comments when available.

Treat `docs/prompt-builders/skills/skill-materials.md` as the raw feedback source. Do not import conclusions from older skill versions.

When current files conflict with the recorded feedback, identify whether the task is reviewing the current implementation or proposing a new design. Report the conflict instead of silently choosing one.

## Identify the artifact bundle

Before reviewing, determine which of these artifacts exist:

- the player-visible MCQ questions and short choices;
- the mapping from each short choice to its expanded prompt instruction;
- the final prompt assembly or copy flow;
- the Agent prompt template;
- the Judge prompt;
- case, scenario, and role descriptions;
- the Prompt Builder or Meta Prompt Builder;
- the current and previous draft versions.

An MCQ review is incomplete when only the visible choices are supplied but the associated expanded prompts are part of the intended design. Continue with a provisional review, but list the missing artifacts.

## Run the review

### 1. Build the knowledge-boundary table

For each relevant fact, record whether it is known to:

- the Prompt Builder model;
- the player using the builder or MCQ;
- the debate Agent at runtime;
- the Judge;
- the product code assembling the final prompt.

Check Agent templates, Judge prompts, full case descriptions, selected runtime cases, current-case markers, hidden requests, opponents, and scoring rules.

Flag these failures as blockers:

- an instruction relies on context the receiving model never gets;
- a Prompt Builder says not to repeat an Agent template but does not receive that template;
- a builder needs Judge logic but cannot see the Judge prompt;
- a Trolley builder discusses a case family without receiving usable case descriptions;
- the builder asks the player for selected cases or other facts the player cannot know before runtime.

Prefer explicit variables or supplied reference blocks for stable context. Keep runtime-selected facts out of the player's required input. Verify the actual assembly path instead of inferring it from ambiguous names.

### 2. Check MCQ interaction cost

Treat MCQs as the fast path for users who do not want to write or read a long prompt.

Check that:

- each visible choice is extremely short and quickly scannable;
- a Chinese choice is ideally no more than about 10 characters when meaning can be preserved;
- the question stem is concrete, natural, and grammatically fluent;
- labels do not force the player to decode internal prompt-engineering terminology;
- the number of questions and choices does not defeat the low-friction purpose.

Do not shorten by making a choice vague. Keep the visible choice short and place necessary detail in the associated expanded prompt.

### 3. Map question dimensions

Write one sentence naming the decision made by each question. Compare all questions in the set.

Use these tests:

- **Same-letter test:** If selecting A in several questions repeats one position, the questions may be asking the same thing.
- **Permutation test:** If Q2 contains the same three meanings as Q1 in a different order, one question is redundant.
- **Progression test:** Check that the set moves through genuinely different work, such as first principle, application, response to the opponent, and overall debate strategy.
- **Case-coverage test:** Check that the questions account for every current case type and do not assume every case has the same mechanism.

Do not require one fixed progression for every scenario. Require each question to earn its place by asking a different strategic or philosophical question.

### 4. Check the option space inside each question

For every question, define the plausible answer space, then check whether the choices cover relatively distinct regions of it.

Allow small overlap. Reject large overlap, cosmetic rewording, or choices that are merely two halves of one complete position.

Check that:

- choices are comparable in abstraction and scope;
- no two choices would naturally be selected for exactly the same reason;
- one option does not contain another;
- an option does not depend on a premise unsupported by the Judge prompt;
- every choice maps to a different downstream instruction.

Report overlap using exact pairs such as `Q1A ≈ Q2C` or `Q3B + Q3C form one position`.

### 5. Verify scenario, role, and case accuracy

Read the current scenario and role materials before judging wording.

Check that:

- every referenced case is current and retired cases are not treated as active;
- the wording matches who the debater actually is;
- the debater is not described as the moral actor when the role only argues what should be done;
- an option does not assume every case has an identifiable actor, lever, track, or identical harm mechanism;
- the claimed Judge preference is actually present in the Judge prompt;
- each role's choices use that role's particular leverage, constraints, and relationship to the decision-maker;
- role choices are not generic text copied across characters.

For historical roles, ask: **What is the strongest thing this person can credibly offer, threaten, reveal, or embody in front of the decision-maker?** Make that particularity visible.

### 6. Review short-choice expansion

Review the visible choice and its expanded prompt together.

Require the mapping to:

- preserve the player's chosen meaning;
- expand it into concrete, executable debate behavior;
- add useful detail without introducing a new preference;
- remain distinct from the expansions of sibling choices;
- combine cleanly with expansions from other questions;
- fit the current final-prompt length limit after assembly;
- avoid duplicating or contradicting the Agent prompt template.

Do not assume the visible choice itself must be the final prompt. Kesou's feedback explicitly allows a very short choice to expand into a much longer instruction.

If the current proposal directly concatenates visible answers, identify that as a contract conflict when it prevents the intended short-choice/expanded-prompt design.

### 7. Verify the product handoff

Trace the material through the actual user flow:

```text
short MCQ choice
→ expanded strategy instruction
→ assembled output or copy action
→ player strategy input
→ runtime Agent prompt plus player input
```

Check button labels, field names, preview text, and documentation for ambiguity. Confirm that contributors are not calling the player strategy, Agent template, builder output, and final runtime prompt by the same misleading name.

### 8. Check revision quality

When multiple versions exist:

1. Compare the new draft with the strongest earlier version, not only the immediately previous one.
2. Verify that a rewrite did not improve fluency while regressing structure or case coverage.
3. Resolve scope, dimensions, and option overlap before polishing sentences.
4. For a difficult scenario, discuss each case separately with Codex to identify better dimensions before drafting the next version.
5. Review the MCQ stems and associated expanded prompts together.

Do not respond to a structural issue with another unconstrained wording rewrite.

## Classify findings

Use these labels:

- **Context blocker** — required information is unavailable to the actor expected to use it.
- **Design blocker** — questions repeat dimensions, choices substantially overlap, or the downstream mapping is missing.
- **Accuracy blocker** — a role, case, Judge rule, or runtime fact is wrong.
- **Regression** — the new version is worse than an earlier version on a previously working dimension.
- **Wording** — scope is correct and only clarity or fluency remains.
- **Suggestion** — useful but not grounded in a repeated Kesou concern or current contract.

Cite the exact file, question, option pair, or feedback rule. Do not disguise a preference as a requirement.

## Apply the readiness gate

Use one verdict:

- **NOT READY** — any context, design, or accuracy blocker remains.
- **READY FOR WORDING PASS** — the question scope, dimensions, option space, mappings, and facts are sound; sentence-level refinement remains.
- **READY TO SEND** — the artifact bundle is complete, the major feedback patterns are resolved, and no known blocker remains.

A polished sentence cannot compensate for a repeated dimension or incorrect case assumption.

## Report the review

Lead with the verdict. Match the author's language.

```markdown
Verdict: NOT READY | READY FOR WORDING PASS | READY TO SEND

Scope reviewed
- ...

Most likely Kesou feedback
1. [severity] [classification] Finding
   - Evidence: file, question, option pair, or feedback rule
   - Why it matters: user or runtime consequence
   - Scope: every artifact that shares the cause
   - Required change: testable completion condition

Question-dimension check
| Question | Actual dimension | Overlap |

Context and product-flow check
- Builder knows: ...
- Player knows: ...
- Runtime Agent receives: ...
- Missing or ambiguous: ...

Short choice → expanded prompt check
- Complete mappings: ...
- Missing or conflicting mappings: ...

Before sending to Kesou
1. ...
```

Omit empty sections. When asked to revise, preserve the author's substantive choices, fix the systemic cause everywhere it occurs, then rerun the full readiness gate.

## Invocation examples

- `Use $kesou-preflight-review to review these MCQs and their expanded prompts before I send them to Kesou.`
- `用 $kesou-preflight-review 检查这版电车难题 MCQ：每道题是不是问不同维度，每个选项有没有大范围重合。`
- `Use $kesou-preflight-review to compare V1 and V2 and identify regressions before doing a wording pass.`
