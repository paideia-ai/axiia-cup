# Programmatic Scorer Verification Cases

This document explains the synthetic cases in
`apps/api/src/engine/programmatic-scorer-verification-cases.ts`.

The cases are not live matches. They are hand-written scoring examples designed
to verify that the programmatic scorer applies the rules exactly. Each case has
fixed inputs and a hand-calculated expected result.

The prepared verifier is:

```bash
bun scripts/verify-programmatic-scorer.ts
```

As of this document, the verifier is prepared but has not been run as part of
this explanation.

## Terms

**Golden case**

A normal, valid scoring example. The point is to check ordinary arithmetic:
major goal points, approved true requests, approved fake requests, examination
penalties, and final winner.

**Edge case**

A deliberately awkward input. The point is to check whether the scorer behaves
correctly when the judge output has wrappers, missing fields, invalid labels, or
wording that could be misread.

Edge cases split into two different kinds:

- **Recoverable judge-output problems**: the judge output is imperfect, but the
  scoring facts are still clear. The scorer should not fail the match. Examples:
  fenced JSON, broken `speech`, extra unknown request IDs, and approval/rejection
  wording variants.
- **Fatal scoring problems**: the scorer cannot safely know what score to give.
  The scorer should fail instead of guessing. Examples: no parseable structure,
  an illegal main judgment such as `再议`, an illegal Trolley case judgment such
  as `平局`, or a missing judgment for a selected Trolley case.

This distinction matters operationally. A successful score does not always mean
the judge output was perfectly formatted. It only means the scorer found enough
reliable scoring facts to compute the result. If we want to monitor judge-output
quality separately, we should add a warning channel such as `judgeOutputWarnings`
or `parseWarnings` instead of treating every recoverable formatting issue as a
match error.

**Fenced JSON**

Sometimes a model outputs JSON inside a Markdown code block:

````markdown
```json
{
  "judgment": "西进毛利",
  "requests": {
    "HF3": "同意"
  }
}
```
````

The three backticks are the "fence". They make the text look like a code block
in Markdown. They are not part of JSON itself. The scorer should strip this
wrapper and read the JSON object inside.

**Malformed speech**

The judge output has useful structured fields such as `judgment` and `requests`,
but the `speech` field contains broken JSON syntax. For example, the text may
include an unescaped quote:

```json
"speech": "寡人说"变法"可行。"
```

Strict JSON parsers reject this whole object. The programmatic scorer has a
fallback parser so a broken `speech` field does not block scoring when the
important scoring fields are still recoverable.

**Approval and rejection wording**

The scorer treats clear approval words such as `同意`, `准许`, and `批准` as
approved requests. It treats clear rejection phrases such as `不同意`,
`不予同意`, `未同意`, `拒绝`, and `否决` as not approved.

This matters because some rejection phrases contain the characters `同意`. The
scorer must not read `未同意` or `不同意` as approval just because they contain
`同意`.

## Scoring Rules Covered

### Shangyang

- Major goal: `变法` gives role A +1.
- Major goal: `维持现状` gives role B +1.
- Approved true request: request owner +0.5.
- Approved fake request: request owner -0.25.
- If a side identifies the opponent's true request in examination: opponent -1.

### Honnoji

- Major goal: `袭击本能寺` gives role A +1.
- Major goal: `西进毛利` gives role B +1.
- Approved true request: request owner +0.5.
- Approved fake request: request owner -0.25.
- If a side identifies the opponent's true request in examination: opponent
  -0.75.

### Trolley

- Each selected case is worth 1 point.
- If the judge supports `一人侧` in a case, role A gets +1.
- If the judge supports `五人侧` in a case, role B gets +1.
- The scorer counts the selected case IDs for the match.

## Golden Cases

### SY-G01: Shangyang A Clean Win

This is the simplest Shangyang win for role A.

Setup:

- Role A's true request is `SR1`.
- Role B's true request is `GR2`.
- The judge chooses `变法`.
- The judge approves `SR1`.
- No examination penalty happens.

Calculation:

- `变法` means role A wins the major goal: role A +1.
- `SR1` is role A's true request and is approved: role A +0.5.
- Role B gets no points.

Expected result:

- scoreA = 1.5
- scoreB = 0
- winner = A

### SY-G02: Shangyang B Strong Win

This case checks role B's full positive path and role A's penalties.

Setup:

- Role A's true request is `SR1`.
- Role B's true request is `GR2`.
- The judge chooses `维持现状`.
- The judge approves `GR2`.
- The judge also approves `SR2`, which is a fake request for role A.
- During examination, role B correctly identifies role A's true request `SR1`.

Calculation:

- `维持现状` means role B wins the major goal: role B +1.
- `GR2` is role B's true request and is approved: role B +0.5.
- `SR2` is role A's fake request and is approved: role A -0.25.
- Role B identifies role A's true request `SR1`: role A -1.

Expected result:

- scoreA = -1.25
- scoreB = 1.5
- winner = B

### SY-G03: Shangyang A Wins Despite Request Damage

This case checks that major-goal success can overcome fake-request penalties.
It also checks that role B can gain a true-request point and still lose points
when that true request is discovered.

Setup:

- Role A's true request is `SR3`.
- Role B's true request is `GR1`.
- The judge chooses `变法`.
- The judge approves `GR1`, role B's true request.
- The judge approves `GR3`, role B's fake request.
- The judge approves `SR1` and `SR2`, both fake requests for role A.
- Role A correctly identifies role B's true request `GR1`.

Calculation:

- `变法` gives role A +1.
- `SR1` and `SR2` are fake requests for role A and are approved: role A -0.5.
- Role A's true request `SR3` is not approved: role A gets no true-request
  point.
- `GR1` is role B's true request and is approved: role B +0.5.
- `GR3` is role B's fake request and is approved: role B -0.25.
- Role A identifies `GR1`: role B -1.

Expected result:

- scoreA = 0.5
- scoreB = -0.75
- winner = A

### SY-G04: Shangyang Draw

This case proves that the scorer can return a draw when the arithmetic is tied.

Setup:

- Role A's true request is `SR1`.
- Role B's true request is `GR2`.
- The judge chooses `变法`.
- The judge does not approve role A's true request.
- The judge approves `SR2` and `SR3`, both fake requests for role A.
- The judge approves role B's true request `GR2`.
- No examination penalty happens.

Calculation:

- `变法` gives role A +1.
- `SR2` and `SR3` are approved fake requests: role A -0.5.
- `GR2` is approved as role B's true request: role B +0.5.

Expected result:

- scoreA = 0.5
- scoreB = 0.5
- winner = draw

### HN-G01: Honnoji A Clean Win

This is the simplest Honnoji win for role A.

Setup:

- Role A's true request is `CM2`.
- Role B's true request is `HF3`.
- The judge chooses `袭击本能寺`.
- The judge approves `CM2`.
- No examination penalty happens.

Calculation:

- `袭击本能寺` means role A wins the major goal: role A +1.
- `CM2` is role A's true request and is approved: role A +0.5.
- Role B gets no points.

Expected result:

- scoreA = 1.5
- scoreB = 0
- winner = A

### HN-G02: Honnoji B Strong Win

This case checks role B's full positive path and role A's Honnoji discovery
penalty.

Setup:

- Role A's true request is `CM2`.
- Role B's true request is `HF3`.
- The judge chooses `西进毛利`.
- The judge approves `HF3`.
- The judge approves `CM1`, which is a fake request for role A.
- During examination, role B correctly identifies role A's true request `CM2`.

Calculation:

- `西进毛利` means role B wins the major goal: role B +1.
- `HF3` is role B's true request and is approved: role B +0.5.
- `CM1` is role A's fake request and is approved: role A -0.25.
- Role B identifies role A's true request `CM2`: role A -0.75.

Expected result:

- scoreA = -1
- scoreB = 1.5
- winner = B

### HN-G03: Honnoji A Wins While B's True Request Is Exposed

This case checks that an approved true request can be outweighed by being
identified in examination.

Setup:

- Role A's true request is `CM2`.
- Role B's true request is `HF3`.
- The judge chooses `袭击本能寺`.
- The judge approves role B's true request `HF3`.
- Role A correctly identifies `HF3`.

Calculation:

- `袭击本能寺` gives role A +1.
- `HF3` is role B's true request and is approved: role B +0.5.
- Role A identifies `HF3`: role B -0.75.

Expected result:

- scoreA = 1
- scoreB = -0.25
- winner = A

### HN-G04: Honnoji Draw

This case combines major goal, true requests, fake requests, and examination
into a tie.

Setup:

- Role A's true request is `CM2`.
- Role B's true request is `HF3`.
- The judge chooses `袭击本能寺`.
- The judge approves role A's true request `CM2`.
- The judge approves role A's fake requests `CM1` and `CM3`.
- The judge approves role B's true request `HF3`.
- The judge approves role B's fake request `HF1`.
- Role B correctly identifies role A's true request `CM2`.

Calculation:

- `袭击本能寺` gives role A +1.
- `CM2` gives role A +0.5.
- `CM1` and `CM3` are role A fake requests and are approved: role A -0.5.
- Role B identifies `CM2`: role A -0.75.
- `HF3` gives role B +0.5.
- `HF1` is a role B fake request and is approved: role B -0.25.

Expected result:

- scoreA = 0.25
- scoreB = 0.25
- winner = draw

### TR-G01: Trolley A Wins All Cases

This is the simplest Trolley win for role A.

Setup:

- Selected cases are `A`, `B`, and `E`.
- The judge supports `一人侧` in all three cases.

Calculation:

- Case A supports role A: role A +1.
- Case B supports role A: role A +1.
- Case E supports role A: role A +1.

Expected result:

- scoreA = 3
- scoreB = 0
- winner = A

### TR-G02: Trolley B Wins Two to One

This checks ordinary majority scoring for role B.

Setup:

- Selected cases are `A`, `C`, and `D`.
- Case A supports `一人侧`.
- Cases C and D support `五人侧`.

Calculation:

- Case A gives role A +1.
- Cases C and D give role B +2 total.

Expected result:

- scoreA = 1
- scoreB = 2
- winner = B

### TR-G03: Trolley A Wins Two to One

This checks the same majority scoring with a different selected case set.

Setup:

- Selected cases are `A`, `D`, and `E`.
- Case A supports `五人侧`.
- Cases D and E support `一人侧`.

Calculation:

- Case A gives role B +1.
- Cases D and E give role A +2 total.

Expected result:

- scoreA = 2
- scoreB = 1
- winner = A

### TR-G04: Trolley Counts Only Selected Cases

This case checks that the scorer ignores extra case judgments that are not part
of the current match.

Setup:

- Selected cases are `E`, `A`, and `B`.
- The judge output includes judgments for `A`, `B`, `C`, and `E`.
- Case C is extra and should not be counted.

Calculation:

- Case E supports `五人侧`: role B +1.
- Case A supports `五人侧`: role B +1.
- Case B supports `一人侧`: role A +1.
- Case C is ignored because it was not selected for this match.

Expected result:

- scoreA = 1
- scoreB = 2
- winner = B

## Edge Cases

### SY-E01: Shangyang Broken Speech Field

This case simulates the kind of output where the judge gives usable scoring
fields, but the final `speech` field breaks strict JSON parsing.

Setup:

- The output says `judgment` is `变法`.
- The output says role A's true request `SR1` is approved.
- The output says role B's true request `GR2` is not approved.
- The `speech` field contains unescaped quotation marks, so the full text is
  not valid JSON.

Why this matters:

- The scorer should still recover `judgment` and `requests`.
- A broken narrative speech should not prevent scoring if the scoring fields
  are available.

Expected result:

- scoreA = 1.5
- scoreB = 0
- winner = A

### SY-E02: Shangyang Rejection Phrases Must Stay Rejections

This case checks that the scorer does not accidentally treat rejection phrases
as approval.

Setup:

- The judge chooses `维持现状`, so role B gets the major goal.
- `GR1` is approved, but `GR1` is a fake request for role B.
- `GR2`, role B's true request, is written as `未同意`.
- Role A's requests are written with rejection phrases such as `不予同意`,
  `拒绝`, and `不同意`.

Why this matters:

- `未同意` contains the characters `同意`, but it means "not approved".
- `不同意` also contains `同意`, but it means "disagree".
- The scorer must check rejection wording before checking approval wording.

Calculation:

- `维持现状` gives role B +1.
- `GR1` is a fake request for role B and is approved: role B -0.25.
- `GR2` is not approved because `未同意` is a rejection.
- Role A's rejected requests do not affect score.

Expected result:

- scoreA = 0
- scoreB = 0.75
- winner = B

### SY-E03: Shangyang Invalid Main Judgment

This case checks that the scorer fails loudly when the judge does not choose one
of the legal main outcomes.

Setup:

- The judge output uses `再议` as the main `judgment`.

Why this matters:

- Shangyang only has two legal main outcomes: `变法` and `维持现状`.
- If the judge says something else, the scorer should not guess.

Expected result:

- The scorer should throw an error containing `裁判 judgment 无法识别`.

### HN-E01: Honnoji Markdown Code Block and Unknown Request ID

This case checks two things at once.

First, the judge output is wrapped in a Markdown code block:

````markdown
```json
{
  "judgment": "西进毛利",
  "requests": {
    "AS1": "同意",
    "CM2": "不同意",
    "HF3": "同意"
  }
}
```
````

The scorer should remove the backtick wrapper and parse the JSON inside.

Second, the output includes `AS1`, which is not one of the current role request
IDs in this fixture.

Why this matters:

- Models often wrap JSON in Markdown code blocks even when asked for JSON.
- Honnoji has selectable role options, so old or non-selected request IDs may
  appear in some outputs. The scorer should ignore request IDs that are not in
  the current match's resolved role requests.

Calculation:

- `西进毛利` gives role B +1.
- `HF3` is role B's true request and is approved: role B +0.5.
- `CM2` is not approved.
- `AS1` is ignored.

Expected result:

- scoreA = 0
- scoreB = 1.5
- winner = B

### HN-E02: Honnoji Approval Can Be Written as 准许 or 批准

This case checks that approval does not have to be exactly the word `同意`.

Setup:

- The judge chooses `袭击本能寺`.
- Role A's true request `CM2` is marked `准许`.
- Role B's fake request `HF1` is marked `批准`.
- Role B's true request `HF3` is not approved.
- Role A correctly identifies role B's true request `HF3`.

Why this matters:

- In Chinese judge prose, `准许` and `批准` are approval words.
- The scorer should count them as approved.

Calculation:

- `袭击本能寺` gives role A +1.
- `CM2` is role A's true request and `准许` means approved: role A +0.5.
- `HF1` is role B's fake request and `批准` means approved: role B -0.25.
- Role A identifies `HF3`: role B -0.75.

Expected result:

- scoreA = 1.5
- scoreB = -1
- winner = A

### HN-E03: Honnoji Completely Unstructured Output

This case checks that the scorer refuses to score text with no usable structure.

Setup:

- The judge output is plain prose: `此事不可以数字衡量。`
- There is no JSON object, no `judgment`, and no `requests`.

Why this matters:

- The scorer should not invent a result when the judge output contains no
  parseable scoring data.

Expected result:

- The scorer should throw an error containing `裁判输出不是可解析的结构化 JSON`.

### TR-E01: Trolley Markdown Code Block

This is the Trolley version of fenced JSON handling.

Setup:

- Selected cases are `A`, `B`, and `E`.
- The judge output is wrapped in a Markdown code block.
- Case A supports `一人侧`.
- Case B supports `五人侧`.
- Case E supports `一人侧`.

Why this matters:

- Even if the judge wraps the JSON in backticks, the scorer should still read
  the `judgments` object.

Calculation:

- A and E give role A 2 points.
- B gives role B 1 point.

Expected result:

- scoreA = 2
- scoreB = 1
- winner = A

### TR-E02: Trolley No Selected Case List

This case checks the defensive fallback path.

Setup:

- The assignment does not include `selectedCaseIds`.
- The judge output includes judgments for cases `A`, `C`, and `D`.
- A supports `五人侧`.
- C supports `一人侧`.
- D supports `五人侧`.

Why this matters:

- Normal Trolley matches should have selected case IDs.
- If that list is absent, the scorer can still count the keys present in the
  judge output instead of crashing immediately.

Calculation:

- Case A gives role B +1.
- Case C gives role A +1.
- Case D gives role B +1.

Expected result:

- scoreA = 1
- scoreB = 2
- winner = B

### TR-E03: Trolley Invalid Case Judgment

This case checks that the scorer rejects illegal per-case outcomes.

Setup:

- Selected cases are `A`, `B`, and `E`.
- Case B is judged as `平局`.

Why this matters:

- Trolley cases must be judged as either `一人侧` or `五人侧`.
- The prompt explicitly says no ties.
- If the judge outputs `平局`, the scorer should not guess which side should
  receive the point.

Expected result:

- The scorer should throw an error containing `裁判 judgments.B 无法识别`.

### TR-E04: Trolley Missing Selected Case Judgment

This case checks that every selected case must be scored.

Setup:

- Selected cases are `A`, `B`, and `E`.
- The judge output only includes judgments for `A` and `B`.
- Case E is missing.

Why this matters:

- The scorer should not silently ignore a selected case.
- If the match had three selected cases, all three need a judgment.

Expected result:

- The scorer should throw an error containing `裁判 judgments.E 无法识别`.
