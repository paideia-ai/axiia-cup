# Kesou Review Rubric

## Contents

1. Source and scope
2. Context visibility
3. MCQ interaction model
4. Question dimensions
5. Option-space coverage
6. Scenario and role particularity
7. Version workflow
8. Regression examples

## 1. Source and scope

This rubric distills the replacement source at `docs/prompt-builders/skills/skill-materials.md`. It covers Kesou's feedback to Vivian and Melody on Prompt Builders and MCQs from July 24 through August 2.

Use the source as recorded feedback, but verify time-sensitive facts such as the current case pool, Judge prompt, runtime assembly, and active product proposal against live repository sources.

The primary review question is not "Does this sound polished?" It is "Does each user choice represent a precise, distinct, scenario-correct decision that can become a useful Agent instruction with the right context?"

## 2. Context visibility

Recorded feedback:

- Players cannot provide runtime-selected cases they do not know.
- A Prompt Builder that says not to repeat the Agent template should receive the Agent template in its context, preferably through a code-level variable.
- Consider whether the role-playing model needs the Judge prompt, then provide it if the instructions rely on Judge logic.
- A Trolley Prompt Builder needs descriptions of the relevant cases.
- Runtime play combines the player's strategy input with the Agent prompt template.
- Ambiguous naming can hide how builder output, player input, and the Agent template are assembled.

Generalize this into a knowledge-boundary audit. Check who knows each fact at author time, builder time, player time, and match time.

## 3. MCQ interaction model

MCQs are for players who want a quick path and do not want to write a serious prompt themselves.

Kesou's preferred design separates two layers:

1. **Visible choice:** very short and easy to scan; aim for fewer than about 10 Chinese characters when possible.
2. **Expanded prompt:** a longer paragraph that turns the selected meaning into useful Agent behavior.

A short visible choice does not require a short final prompt. The author should provide and review the associated expanded prompts together with the MCQ stems.

The output can be copied into the player's strategy input, which is then combined with the Agent template at runtime. Verify the actual product design rather than assuming a specific button or renderer has already been implemented.

## 4. Question dimensions

Every question must ask something different.

One progression Kesou considered roughly sound was:

1. first principle;
2. application of the player's principle;
3. response to the opponent's principle;
4. overall debate strategy.

This is an example, not a mandatory schema. The requirement is distinct dimensions.

Diagnostic tests from the feedback:

- If a user selects A in Q1, Q2, and Q3 and each answer repeats moral absolutism, asking three times added no value.
- If V4 Q1 and Q2 contain the same A/B/C meanings in a different order, they are duplicate questions.
- A case set must reflect all current cases and their differences; do not write every question as though every problem is literally about switching a trolley track.

## 5. Option-space coverage

Within a question, choices should cover relatively non-overlapping parts of the plausible answer space.

Small overlap is acceptable. Large overlap is not.

Reject these patterns:

- two labels that express the same reason;
- one option that subsumes another;
- B and C that are the upper and lower halves of one complete position;
- an option based on a philosophical virtue the Judge does not actually reward;
- the same choice repeated in another question with slightly different words.

Use precise pairwise findings. Kesou's examples included `Q1A = Q2A`, `Q1B = Q2C`, `Q1C = Q2B`, and a Honnoji set where `1C`, `2A`, and `3B` were effectively the same.

## 6. Scenario and role particularity

Do not let generic debate advice replace role-specific leverage.

Recorded Honnoji examples:

- A Yoshiaki option was out of context because Mitsuhide was unlikely to fear the limited shogun controlling the Akechi house.
- Yoshiaki's `1A` and `1B` were too similar.
- Motochika needed choices such as being an ally after Nobunaga's assassination or presenting the Chosokabe experience as the Akechi house's possible future.
- The foot soldier set was weakest because it treated him as merely a soldier. His substantive identity was a person opposed to killing Nobunaga; being a foot soldier was the position from which he had to make that case.
- Each role should emphasize its strongest credible leverage in front of Mitsuhide.

Recorded Trolley examples:

- Questions should be concrete and readable rather than awkward labels such as repeated "我的什么" phrasing.
- The set must reflect the current case pool, including cases that do not involve pulling a lever.
- A debater arguing what ought to be done is not necessarily the actor inside the case and should not promise to personally bear responsibility.
- Not every case has the same kind of moral actor.
- Claims about consistency should not be treated as Judge requirements unless the Judge prompt supports them.

Use these as reasoning patterns, not permanent facts. Recheck the current characters, cases, and Judge prompt.

## 7. Version workflow

Kesou explicitly compared V2 with V1 and judged V2 worse despite later wording. Preserve the best structural behavior across versions.

Use this order:

1. Confirm the current cases, role, Judge criteria, and product flow.
2. Define the dimension of every question.
3. Define the plausible answer space for each question.
4. Draft short, distinct visible choices.
5. Draft each choice's associated expanded prompt.
6. Test pairwise overlap and cross-question redundancy.
7. Only then polish grammar and sentence flow.

For hard philosophical cases, discuss the cases one by one with Codex before producing another version. Use that discussion to discover better dimensions; do not ask Codex for an unconstrained rewrite of the entire set.

## 8. Regression examples

Use these as targeted tests during review:

- **Invisible context:** The builder says to avoid repeating a template it cannot see.
- **Unknown runtime state:** The builder asks the player which three cases were selected.
- **Long fast-path choice:** The displayed option is a paragraph even though MCQ is intended as the quick path.
- **Missing expansion:** The choice is short only because the downstream prompt mapping was omitted.
- **Duplicate dimensions:** Q1–Q3 restate the same philosophical camps.
- **Permuted duplicates:** Q2 is Q1 with A/B/C reordered.
- **Split position:** Two options are complementary halves of one answer.
- **Role erasure:** Every character receives generic strategy choices and none uses distinctive leverage.
- **Actor confusion:** The debater is written as though physically acting in the hypothetical.
- **Stale case model:** Retired cases remain, or all cases are treated as track-switching variants.
- **Unsupported Judge preference:** A philosophically attractive principle is presented as scoring logic without evidence.
- **Wording-first rewrite:** Grammar improves while dimensions, mappings, or scenario accuracy regress.
