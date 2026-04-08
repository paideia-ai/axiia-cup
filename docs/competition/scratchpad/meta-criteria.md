# Meta-Criteria for Precise Winning Conditions in Strategic Language Games

## The Question

Across the 47 scenarios in `classic-strategic-scenarios.md`, most have clearly defined winning conditions — but some do not. What makes a winning condition "precise"? And when designing a new scenario (e.g., Columbus lobbying Queen Isabella), how do we avoid vague conditions like "his speech was persuasive" and instead produce conditions like the coffee shop example's "he proposes successfully AND she doesn't discover the ring is fake"?

---

## 1. Survey: How the 47 Scenarios Define Winning Conditions

### Group A: Mechanically precise — zero human judgment needed

| Scenario | Winning condition | Structure |
|---|---|---|
| Werewolf (#1) | All wolves dead / wolves ≥ villagers | Population state check |
| Avalon (#2) | 3 quests succeed; Assassin names Merlin | Counter threshold + identification match |
| Spyfall (#3) | Spy identified by vote / spy names location / timer expires | Vote result + match + clock |
| Secret Hitler (#4) | 5 liberal policies / 6 fascist / Hitler elected chancellor | Counter + compound event |
| 谁是卧底 (#5) | Spy eliminated / spy survives to final N / spy guesses word | Elimination + match |
| Blood on the Clocktower (#6) | Demon executed / only 2 players remain | Elimination + state |
| Coup (#8) | Last player with influence cards | Survival |
| Cockroach Poker (#9) | Opponent has 4 of one type face-up | Counter threshold |
| Diplomacy (#11) | Control 18 supply centers | Counter threshold |
| The Resistance (#12, #37) | 3 missions succeed or fail; 5 rejections = spy win | Counter |
| One Night Werewolf (#13) | Werewolf is/isn't the player voted out | Match |
| Two Rooms and a Boom (#30) | Bomber in same room as President at end | Spatial + temporal |
| Prisoner's Dilemma (#22) | Payoff matrix resolves based on choices | Payoff lookup |
| Ultimatum Game (#23) | Accept → both get shares; reject → both get 0 | Binary event → payoff |
| Trust Game (#26) | Amounts sent and returned | Numerical |
| Stag Hunt (#25) | Payoff matrix resolves based on choices | Payoff lookup |
| Chicken (#24) | Payoff matrix resolves based on choices | Payoff lookup |
| Dead of Winter (#15) | Main objective complete AND personal objective met | Compound state check |
| Everyone is John (#42) | Points scored for completed Obsessions | Numerical |
| Deception: MiHK (#7) | Investigators correctly name Means + Evidence | Match |
| Fake Artist (#36) | Identified by vote; if caught, guesses word | Vote + match |
| Minority Rule / Genius (#27) | In the minority = safe | Count check |
| The Mole (#28) | Lowest quiz score = eliminated | Numerical comparison |
| Sheriff of Nottingham (#10) | Most gold/points at game end | Numerical comparison |
| BSG (#14, #44) | Resources > 0 AND reach destination; OR any resource = 0 | Threshold |
| Harborco (#39) | Points from confidential scoring sheet | Numerical |
| Sally Soprano (#20) | Points from confidential scoring sheet | Numerical |
| Ugli Orange (#19) | Got the part of the orange you need | Binary resource check |
| Liar Game (#29) | Survive rounds + avoid debt | Survival + numerical |
| 剧本杀 faction (#38) | Faction's pre-stated objective achieved | Varies but pre-specified |
| 剧本杀 blizzard (#46) | Correctly identify killer | Match |
| Coffee shop (user's example) | Proposal accepted + secret not discovered | Event + information preservation |

### Group B: Procedurally precise — outcome determined by a defined procedure involving human choice

| Scenario | Winning condition | Structure |
|---|---|---|
| Baron Munchausen (#43) | Most votes for "best story" (cannot vote for self) | Voting result (but WHAT voters evaluate is subjective) |
| Arctic Survival (#41) | Ranking closest to expert answer | Numerical distance (precise, but the "expert answer" is external) |
| Texoil (#40) | Deal reached vs. no deal; terms vs. reservation price | Binary event + numerical comparison |

### Group C: Imprecise or absent — require subjective judgment or have no formal win condition

| Scenario | Issue |
|---|---|
| British Parliamentary Debate (#31) | Judges rank teams by quality of argument — expert evaluation |
| Courtroom Cross-Examination (#32) | Jury decides — subjective collective judgment |
| Socratic Elenchus (#35) | No formal win condition; "did the contradiction land?" is a judgment call |
| Hostage Negotiation (#21) | "Peaceful resolution" is somewhat binary but real-world fuzzy |
| Fiasco (#17) | Dice determine ending; no "winner" — the game is about narrative |
| Vampire LARP (#18) | Multiple goals of varying formality; some precise (win an election), some vague (gain influence) |
| Status Game (#33) | Audience guesses your number — actually precise (match), but status communication itself is evaluated impressionistically |
| Improv Hidden Objective (#34) | Did the other person perform the action? — actually fairly precise (event occurrence) |

---

## 2. The Five Properties of a Precise Winning Condition

From the survey, the conditions in Group A all share five properties. Conditions that lack any of these become vague.

### Property 1: Binary Decidability (二值可判定性)

The condition resolves to **TRUE or FALSE**. Not a spectrum, not a degree, not "more or less."

- PRECISE: "All werewolves are dead" — yes or no.
- PRECISE: "She said 'I approve the expedition'" — yes or no.
- IMPRECISE: "He was persuasive" — to what degree?
- IMPRECISE: "The speech was eloquent" — by whose standard?

**Test:** Can the condition be expressed as a proposition `P` such that `P ∈ {true, false}` with no intermediate values?

### Property 2: Observer-Independence (观察者无关性)

Any competent observer, given the same record of what happened in the game, would reach the **same verdict**. No taste, expertise, or interpretation required.

- PRECISE: "3 of 5 quests succeeded" — count them; everyone agrees.
- PRECISE: "The Assassin said 'Player 4 is Merlin' and Player 4's card is Merlin" — match; everyone agrees.
- IMPRECISE: "The best story" — different observers may disagree.
- IMPRECISE: "A compelling argument" — subjective.

**Test:** If two independent observers check the condition, will they *necessarily* reach the same answer? If yes, the condition is observer-independent.

### Property 3: Grounded in Events and States, Not in Quality of Performance (基于事件而非表现质量)

The condition references **what happened** (discrete events, game states, facts) — not **how well** something was done.

- PRECISE: "The Queen said 'I fund the expedition'" — an event that either occurred or didn't.
- IMPRECISE: "Columbus delivered a compelling argument" — a quality assessment of how an event was performed.

This is the **core distinction**. Performance quality is the *means* by which a player achieves their goal; the *condition* must be the outcome of that performance, not a rating of the performance itself.

**Test:** Does the condition contain any adjective or adverb that could reasonably be disputed (persuasive, eloquent, convincing, effective, skillful)? If yes, it is grounded in quality rather than event.

### Property 4: Pre-Defined Before Play (游戏前预设)

The condition is known to the relevant player(s) at the start of the game, not determined retroactively or adjusted during play.

- PRECISE: "Your personal objective: have 3 Fuel cards in your supply at game end" — written on your card before the game starts.
- IMPRECISE: "The GM decides at the end whether your character succeeded" — retroactive and discretionary.

**Test:** Could the condition be written on a sealed card before the game begins and opened afterwards to check?

### Property 5: Clear Evaluation Moment (明确的判定时点)

There is a specific, well-defined point at which the condition is checked.

- PRECISE: "At game end, count supply centers."
- PRECISE: "After the good team wins 3 quests, the Assassin makes their guess."
- IMPRECISE: "At some point during the game, the player gained the upper hand" — when exactly?

**Test:** Can you name the exact game moment (or triggering event) at which the condition is evaluated?

---

## 3. A Necessary Sixth Property for "Hidden Information" Conditions

Properties 1–5 are sufficient for conditions about observable game states (counters, positions, events). But many scenarios — especially the coffee shop example — involve **information preservation**: "keep your secret." This introduces a special problem.

### The Problem: "KNOWS" Is Not Directly Observable

"The woman didn't discover the ring is fake" — how do you check this? You cannot read her mind. Options:

**(a) Formal guess mechanism** — At a defined moment, the opponent gets exactly N guesses about the hidden information. If a guess matches, the secret is "discovered." If not, it is "preserved."

Example: Avalon's Assassin gets one guess at Merlin's identity. Binary, mechanical, observer-independent. This is the **gold standard** for information-preservation conditions.

**(b) Explicit verbal trigger** — The secret is "discovered" if and only if the opponent *explicitly states* the hidden fact during the game. ("Your ring is fake!")

Problem: This incentivizes the opponent to spam guesses mid-game ("Is the ring fake? Is the ring stolen? Is the ring borrowed?"), which breaks naturalistic roleplay.

**(c) Observer/GM judgment** — A third party decides whether the secret was "effectively" revealed through context, implications, and behavior.

Problem: Fails Property 2 (observer-independence). Two GMs might disagree about whether a hint constituted "discovery."

### Property 6: Specified Verification Procedure for Hidden Information (隐藏信息的验证程序)

When a winning condition involves information preservation (keeping a secret) or information extraction (discovering a secret), the **method of checking** must be specified as part of the condition, not left implicit.

- PRECISE: "At the end of the game, the other player writes down one guess about your hidden goal. If they guess correctly, your secret is compromised." (Formal guess mechanism.)
- PRECISE: "The other player must, during the game, explicitly state the sentence 'The ring is fake' for the secret to count as discovered." (Explicit trigger with defined criterion.)
- IMPRECISE: "Keep your secret." (How do we check? Unspecified.)

**Test:** If the condition involves hidden information, is there a defined procedure — with concrete steps — for determining whether the information was preserved or extracted?

---

## 4. The Seven Atomic Building Blocks

Every precise winning condition in the 47 scenarios can be decomposed into combinations of these atomic types:

### Type 1: State-Threshold (状态阈值)
A countable game variable reaches or exceeds a specific value.

> COUNT(X) ≥ N at time T

Examples:
- "18 supply centers" (Diplomacy)
- "5 Liberal policies enacted" (Secret Hitler)
- "4 cockroaches face-up in front of a player" (Cockroach Poker)
- "3 quests succeeded" (Avalon)

### Type 2: Elimination/Survival (淘汰/存活)
A specific entity is or isn't in the game at a specific point.

> ALIVE(X) = true/false at time T

Examples:
- "All werewolves are dead" (Werewolf)
- "Spy survives to the final 3" (谁是卧底)
- "Last player with influence cards" (Coup)
- "Only 2 players remain alive" (Blood on the Clocktower)

### Type 3: Identification/Match (识别/匹配)
A player's guess matches a hidden ground truth.

> GUESS(player, category) = TRUTH(category)

Examples:
- "Assassin correctly names Merlin" (Avalon)
- "Spy correctly names the location" (Spyfall)
- "Investigators identify the correct Means and Evidence" (Deception)
- "Players correctly identify the killer" (剧本杀)

### Type 4: Discrete Event Occurrence (离散事件发生)
A specific, observable event happens or doesn't happen during play.

> EVENT(X) occurred = true/false [before time T]

Examples:
- "She says yes to the proposal" (coffee shop)
- "Hitler is elected Chancellor after 3 Fascist policies" (Secret Hitler)
- "Agreement reached before the deadline" (negotiation exercises)
- "The hostage-taker surrenders" (crisis negotiation)

### Type 5: Spatial/Positional Check (空间/位置检查)
Game elements are in specific positions at evaluation time.

> POSITION(X) = POSITION(Y) at time T

Examples:
- "Bomber is in the same room as the President at game end" (Two Rooms and a Boom)

### Type 6: Information Preservation (信息保全)
A piece of hidden information was NOT successfully extracted by the opposing party, as verified by a specified procedure.

> VERIFIED_KNOWS(opponent, secret, procedure) = false at time T

Examples:
- "The ring's falseness is not discovered" — verified by: opponent gets one guess at end (coffee shop)
- "The affair is not discovered" — verified by: opponent gets one guess at end (coffee shop)
- "Merlin's identity is not discovered" — verified by: Assassin names one player (Avalon)
- "Mutation is not discovered" — verified by: no player files a successful treason report naming the mutation (Paranoia)

**This type REQUIRES a specified verification procedure** (Property 6). Without it, the condition is imprecise.

### Type 7: Numerical Payoff (数值收益)
A measurable quantity is maximized, minimized, or compared against a benchmark.

> SCORE(player) [operator] VALUE

Examples:
- Payoff matrices (Prisoner's Dilemma, Ultimatum Game, Chicken, Stag Hunt)
- Negotiation scoring sheets (Sally Soprano, Harborco)
- Points from completed Obsessions (Everyone is John)
- Final gold count (Sheriff of Nottingham)

### Composition

Complex winning conditions are composed from these atomics using **AND, OR, NOT**:

- Coffee shop man: **Type 4** (she says yes) **AND** **Type 6** (ring secret preserved via formal guess)
- Dead of Winter: **Type 1** (main objective met) **AND** **Type 1** (personal objective met)
- Secret Hitler (Fascist win path 2): **Type 1** (≥ 3 Fascist policies enacted) **AND** **Type 4** (Hitler elected Chancellor)
- Spyfall (Spy): **NOT Type 3** (spy not identified by vote) **OR** **Type 3** (spy correctly names location)

---

## 5. The Precision Spectrum

Not all "winning conditions" are equally precise. There is a spectrum:

### Level 1: Mechanical (最强)
The condition can be checked by counting, matching, or verifying states. Zero human judgment. A computer could adjudicate.

> "All werewolves are dead." "18 supply centers." "Bomber in same room as President."

### Level 2: Procedural (中等)
The condition is checked through a defined procedure that involves human *choice* (not human *judgment*). The human element is a player's strategic decision, not an evaluator's taste.

> "She says yes to the proposal." (Her decision is a player's strategic choice, not a judge's evaluation.) "The Assassin names Merlin." (The Assassin's guess is a strategic choice.)

This is the level of the coffee shop example. The man's success depends on the woman player's *decision* — which is a strategic act within the game, not a subjective assessment.

### Level 3: Vote-Aggregated Subjective (较弱)
The condition is mechanically precise (count votes), but the *criterion* voters use is subjective.

> "Most votes for best story" (Baron Munchausen). "Judges rank teams" (BP Debate).

The outcome is reproducible given the same voters, but not reproducible across different voter panels.

### Level 4: Evaluative (最弱)
The condition requires an arbiter to assess quality, and reasonable arbiters may disagree.

> "Persuasive speech." "Eloquent rhetoric." "Effective negotiation."

**For 剧本杀-style scenario design, aim for Level 1 or Level 2.** Level 2 is usually the sweet spot: it's precise enough to adjudicate unambiguously, while still leaving room for the other player's agency to make the game interesting.

---

## 6. The Core Design Principle: Convert Quality into Decision

The single most important principle for designing precise winning conditions:

> **Never make performance quality the condition. Make the other player's decision the condition.**

"Columbus persuades the Queen" is a quality judgment. "The Queen player says 'I approve'" is a decision by a player with their own goals and information.

The quality of Columbus's performance is already captured — implicitly and perfectly — by whether it succeeds in eliciting the desired response from the other player. If Columbus speaks so well that the Queen approves, he wins. If not, he doesn't. We never need to evaluate "how good" the speech was.

This principle converts every imprecise condition into a precise one:

| Imprecise (quality) | Precise (decision) |
|---|---|
| "Columbus is persuasive" | "The Queen player says 'I approve the expedition'" |
| "The negotiator calms the hostage-taker" | "The hostage-taker player releases at least one hostage" |
| "The defendant makes a convincing case" | "Fewer than N juror-players vote 'guilty'" |
| "The spy blends in well" | "The spy is not identified by majority vote" |

In every case, the other player (or players) serves as the "measuring instrument" for performance quality. Their strategic decision is the condition. The performance is the means.

---

## 7. Application: The Columbus Test

### Bad Design

> Columbus wins if he delivers a persuasive speech to Queen Isabella.

Fails: Property 2 (observer-dependent), Property 3 (quality assessment). Who decides "persuasive"? By what standard?

### Better Design

> **Setting:** Columbus meets Queen Isabella at court. A 30-minute conversation.
>
> **Columbus's public goal:** The Queen verbally approves funding the expedition before the session ends. (Type 4: discrete event.)
>
> **Columbus's hidden goal:** Columbus has been lying about the estimated distance to India (he claims it is 3,000 miles; it is actually 12,000). The Queen must not discover this. Verified by: at game end, the Queen is asked "What, if anything, was Columbus hiding?" If she answers with the distance deception (or substantively equivalent), his hidden goal fails. (Type 6: information preservation via formal guess.)
>
> **Queen Isabella's public goal:** Decide whether to fund the expedition based on the information presented. She must announce her decision before the session ends. (Type 4.)
>
> **Queen Isabella's hidden goal:** She is secretly nearly bankrupt and cannot afford the expedition without seizing Church assets — a politically explosive move she wants to hide. Verified by: at game end, Columbus is asked "What, if anything, was the Queen hiding?" Same procedure. (Type 6.)

Now every condition is:
- Binary (approved or not; secret guessed correctly or not)
- Observer-independent (anyone can check)
- Grounded in events and states, not quality
- Pre-defined before play
- Evaluated at a clear moment (session end)
- Verified by a specified procedure (formal guess)

The quality of Columbus's rhetoric, the beauty of his language, his emotional delivery — none of these appear in the conditions. Yet they are all implicitly captured: if his rhetoric is good enough to make the Queen-player decide to approve, he wins. The other player's agency *is* the measuring instrument.

---

## Summary: The Meta-Criteria Checklist

When designing a winning condition for a strategic language game scenario, verify:

1. **Binary?** Does the condition resolve to true/false? (Not a spectrum or degree.)
2. **Observer-independent?** Would any two observers reach the same verdict? (Not taste-dependent.)
3. **Event/state-grounded?** Does it reference what happened, not how well? (No quality adjectives.)
4. **Pre-defined?** Is the condition known to the player before play starts? (Not retroactive.)
5. **Temporally bounded?** Is there a clear moment when the condition is checked? (Not open-ended.)
6. **Verification-specified?** If the condition involves hidden information, is the check procedure explicit? (Not "keep your secret" without defining how "discovery" is tested.)

And the overarching design principle:

> **If you find yourself writing a condition about performance quality ("persuades," "convinces," "outwits"), replace it with a condition about the other player's decision.** The other player's strategic choice, made under their own goals and constraints, is the only judge you need.
