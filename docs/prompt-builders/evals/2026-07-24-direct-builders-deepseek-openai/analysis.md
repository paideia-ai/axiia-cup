# Direct Prompt Builder Evaluation


Below are verdicts by sol 5.6 max. Some are reasonable, some are not. Do not take all at face value.

## Verdict

The builders are promising, but not reliable enough to ship unchanged.

They consistently produce useful strategic pressure tests, and all 16 final deliverables passed the mechanical checks: complete conversation, no Markdown fence, no trailing question, and fewer than 1,000 JavaScript string characters. The remaining problems are semantic: several outputs leak the true request through emphasis, fail to branch on the actual request, turn a potentially false request into the core argument, or invent facts not present in the builder or user messages.

This is an exploratory behavior test, not a provider benchmark. The providers used different inference controls, and four OpenAI first turns used a smaller completion budget than the remaining OpenAI calls.

## Mechanical results

| Direct builder | DeepSeek final chars | OpenAI final chars |
| --- | ---: | ---: |
| Honnoji: Chosokabe | 743 | 660 |
| Honnoji: Hosokawa | 642 | 970 |
| Honnoji: Ashigaru | 878 | 913 |
| Honnoji: Yoshiaki envoy | 871 | 762 |
| Shangyang: Shangyang | 706 | 619 |
| Shangyang: Ganlong | 785 | 632 |
| Trolley: Yiren | 974 | 601 |
| Trolley: Wuren | 876 | 655 |

## Most important findings

### P0 — Runtime branches are often generic rather than executable

The user deliberately withheld which request would be true until match runtime. A reusable final prompt therefore needs a distinct branch for every request. All four Shangyang finals instead say only some version of “if true, frame it as a system need; if false, weaken it.” None names `SR1`–`SR3` or `GR1`–`GR3`, even though their political risks differ radically.

DeepSeek's Shangyang final is internally inconsistent: its generic branch says to read the runtime marker, but its prepared answer always argues for `SR1`:

> 正因如此，才需督察宗室之权归于君授之臣

If `SR1` is false, this can secure approval for a false request. The fix is an explicit three-way branch matrix, not a generic true/false paragraph.

### P0 — Emphasis schedules leak the true request

Three DeepSeek Honnoji finals create an easily observed frequency channel:

> 真请求出现频率略高但不独占。

> 真请求……出现三次。假请求A……出现两次。假请求B……出现一次。

> 真请求……每三至四轮自然提及一次。

The builders simultaneously tell the agent to infer the opponent's true request from emphasis frequency. A fixed `3/2/1` or “true appears more” schedule defeats the concealment objective. Request salience should vary by argumentative opportunity, and the final prompt should explicitly forbid count-based truth encoding.

### P0 — Some core arguments semantically approve a possibly false request

Both Yoshiaki-envoy finals make Yoshiaki's name central before applying the `YA1`/`YA2`/`YA3` branch. DeepSeek says:

> 以“奉公方讨逆”为旗号

and then says that if `YA2` is false it should be made threatening enough to reject. Those instructions conflict: the core strategy has already made “act under Yoshiaki's name” strategically necessary. The same structural risk appears with Ashigaru `AS1`: merely avoiding an explicit request sentence does not stop the judge from approving a repeatedly advocated “clear, repeatable order.”

The final schema needs to separate ordinary debate arguments from request-approval arguments and run a semantic collision check between them.

### P0 — The five-person trolley plan can fail the stated two-case objective by construction

Both providers rank original trolley and autonomous vehicle as the two favorable cases, while treating organ transplant and basement baby as concessions or near-concessions. In the possible draw `original trolley + organ transplant + basement baby`, that leaves only one planned favorable case even though the builder's stated goal is to win at least two.

DeepSeek writes:

> 器官移植与地下室婴儿为劣势案件，应承认工具化约束的强度

OpenAI similarly calls the baby case “high risk” and organ transplant “most dangerous.” Honest ranking is good, but the builder must also force a concrete second-win contingency for every possible draw. A six-combination draw matrix is a better validation target than a global case ranking.

### P1 — Unsupported details enter as facts

These are not claims that the details are historically false; they are facts or capabilities absent from the direct builder and user turns, so the model had no supplied evidence for asserting them.

- DeepSeek Chosokabe promises `牵制毛利水军、开放四国港口为明智退路`.
- DeepSeek Ashigaru concludes `今夜三项皆缺`, although no live state established that all three were missing.
- DeepSeek Ganlong says `他求贤令已发三年`, while the direct builder only says the edict was issued after the ruler took office.

The builders need a hard rule: distinguish supplied fact, strategic inference, hypothetical proposal, and unknown. Unknown resources, commitments, troop state, letters, alliances, and biographies must not be upgraded into facts.

### P1 — The final-output instructions contradict themselves

The builders say the strategy must not repeat Agent-owned round counts or sentence limits, but their recommended headings are `【二十轮路径】` and `【十轮路径】`. Fifteen of 16 finals consequently repeat a round-count heading; DeepSeek Yiren also repeats `每轮三句话`.

Rename this section `【阶段路径】` and explicitly ban numbers or execution rules already owned by the Agent template.

### P1 — Interaction pacing is model-dependent and insufficiently constrained

Across the first two assistant turns, DeepSeek averaged 719 characters and OpenAI averaged 2,930. OpenAI's maximum was 4,804 characters. Several OpenAI turns present multiple taxonomies and two or three choice sets at once, despite the Honnoji builders asking each turn to focus on one key crack. In the Ashigaru conversation this also makes a common soldier sound like a senior prompt strategist.

Add a Builder-side interaction budget, such as one pressure target, at most two questions, and roughly 600 Chinese characters per turn. This limit applies to the Builder conversation, not the eventual debate agent.

## Per-history review

| Conversation | What worked | What was wrong or off |
| --- | --- | --- |
| Chosokabe / DeepSeek | Concise framing around post-attack survival; conditional final under the limit. | Invented concrete naval/port capabilities; tells the true request to appear more often. |
| Chosokabe / OpenAI | Strongest `CM1`/`CM2`/`CM3` branch mapping; excellent opponent steelman. | Second turn is 4,804 characters and violates one-crack pacing; reducing true `CM2` to “directional recognition” may not obtain the request's actual approval. |
| Hosokawa / DeepSeek | Clear “can kill vs can succeed” frame and useful minimum-support test. | Fixed `3/2/1` request frequency leaks truth; final has no request-specific `HF1`/`HF2`/`HF3` branches. |
| Hosokawa / OpenAI | Strongest treatment of the opponent's “unique opportunity” argument. | Final is 970 characters with little slack, repeats Agent-owned structure, and still has no `HF1`/`HF2`/`HF3` branch mapping. |
| Ashigaru / DeepSeek | Best role voice: concrete orders, flags, identification, and formation. | Asserts all three execution prerequisites are missing; frequency schedule leaks truth; repeats Agent-owned rules. |
| Ashigaru / OpenAI | Excellent separation of immediately fixable internal orders from unverified external support; detailed `AS1`–`AS3` handling. | Builder turns are 2,952 and 3,953 characters and sound like a senior strategist; false `AS1` remains the semantic center even when not phrased as a request. |
| Yoshiaki / DeepSeek | Directly answers the soldier's strongest objection and maps all request branches. | Makes action under Yoshiaki's name core even when `YA2` may be false; predicts that controlling Kyoto will cause observers to choose sides without supplied evidence. |
| Yoshiaki / OpenAI | Strong division between internal orders, external responses, and later political coordination; clear branches. | The main argument still leans on Yoshiaki's legitimating name before branching; first two turns are overlong. |
| Shangyang / DeepSeek | Concise focus on ruler control and reform risk. | Prepared answer hardcodes `SR1`; no `SR1`–`SR3` branch matrix; “the true request must be the one defended most” is too deterministic because a false request may be a decoy. |
| Shangyang / OpenAI | Strongest general treatment of revocable authority, monitoring, and reform implementation. | No request-specific branch survives into the final; first two turns are 1,594 and 3,060 characters. |
| Ganlong / DeepSeek | Produces a constructive alternative rather than merely invoking tradition. | Adds unsupported historical specificity and theatrical stage direction; no `GR1`–`GR3` branches. |
| Ganlong / OpenAI | Strong steelman of “the old system already failed” and a credible gradual alternative. | Generic safeguards do not explain how each inherently power-seeking request can be won without undermining the stated frame; no `GR1`–`GR3` branches; overlong interaction. |
| Yiren / DeepSeek | Serious cross-case testing; explicitly admits the original trolley is difficult. | Final is 974 characters with little runtime slack and repeats Agent-owned round/sentence rules. |
| Yiren / OpenAI | Best concise trolley final; stable “reason versus permission” distinction. | The second turn is 4,293 characters; final carries all five case modules without explicitly instructing the agent to select only the three present at runtime. |
| Wuren / DeepSeek | Strong steelman of non-disposability and honest case differentiation. | The worst-draw plan cannot reach two wins; final repeats Agent-owned round structure. |
| Wuren / OpenAI | Philosophically careful and publicly explainable; strongest autonomous-vehicle rule analysis. | Same worst-draw failure; final largely concedes organ transplant and basement baby instead of building a second-win contingency. |

## Recommended changes

1. Define the runtime envelope. Pass opponent, selected trolley cases, and explicit truth markers in a structured block. If a value is intentionally unavailable, label it `unknown`; never ask the player for information the product does not reveal.
2. Require a complete request branch matrix. Each request gets separate `true` and `false` behavior, including framing, timing, approval boundary, and collision with the main argument. Reject a final that only says “promote the true request.”
3. Add semantic safety checks: no main argument may entail approval of a request whose marker can be false; no truth signal may be encoded by fixed frequency or intensity.
4. Add grounding labels: supplied fact, inference, proposal, unknown. Forbid invented resources, commitments, correspondence, troop state, biography, or judge preference.
5. Validate trolley strategies against every possible three-case draw. Each draw must identify two plausible winning paths, including `original + organ + baby` for Wuren.
6. Remove Agent-owned material from final prompts. Replace count-specific headings with `【阶段路径】`; do not repeat identity, history, round count, or sentence limits.
7. Constrain the interactive Builder: one pressure target, no more than two questions, and a short response budget per turn.
8. Add automated evals for final length, branch coverage, unsupported proper nouns/capabilities, request-frequency leakage, semantic request collision, current-case selection, and clean-context cross-scenario vocabulary.

## Live-state limitation

The production scenario endpoint returned `401` because the available admin token was expired. No local database was used. Consequently, this analysis does not validate live turn counts, judge wording, request rows, or scenario configuration; it evaluates only the checked-in direct builders and the conversations they produced.
