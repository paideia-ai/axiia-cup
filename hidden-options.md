No new messages today. I now have the complete picture. Here's the comprehensive analysis:

---

## Hidden Info / Hidden Objective — Complete Design Space

### Sources Synthesized
- Simon's original analysis (Lark, Apr 3) + follow-up threads (Apr 4)
- Simon's math.md scratchpad (game theory analysis)
- Simon's scenario design (商鞅变法-游戏.md, PvE + PvP)
- Yihan + AI discussion (hidden-info-design-discussion.md + transcript)
- Teri's rumor/objection system idea (teri-idea-rumor.md)
- Bot-posted "MVP split" suggestion (Apr 4, Simon agreed)

### The Core Problem (Simon's Framing)

In a 3-item hidden info setup (2 true, 1 false), **silence is the dominant strategy**. If you say nothing about your hidden info, the opponent can only guess at 1/3 probability. There's no incentive to engage. This kills the game.

---

## Design Space: 7 Families of Options

### Option A: "Judge Reacts in Real-Time" (Simon's Original Proposal)

**Mechanism:** 秦孝公 knows true/false for both sides. During dialogue, when a player mentions true info, 秦孝公 reacts positively; when they mention false info, he reacts coldly/negatively.

| Aspect | Detail |
|--------|--------|
| **Forcing** | Utility-driven: mentioning true info earns judge favor, incentivizing players to surface it |
| **Exposure risk** | Opponent observes 秦孝公's differential reaction and can infer which info is true |
| **Skill** | Werewolf-like consistency: mention true info without tipping off opponent via 秦孝公's reactions |

**Pros:**
- Elegant, directly solves silence problem
- Creates Avalon-like "use it but exposure kills you" tension
- Simple to understand

**Cons:**
- Requires 秦孝公 as a **live 3rd participant** in dialogue — current PvP design is 2-player only
- Adds architectural complexity (3-way conversation engine)
- Simon himself noted (Apr 4): "为什么秦孝公要对隐藏信息特别sensitive...有点太刻意"; "秦孝公已经知道了为啥还要商鞅提一遍" — feels narratively forced
- LLM as real-time judge participant creates additional variance

**Sub-variant A1: Interjection model** — 秦孝公 occasionally interjects during PvP dialogue (e.g., every 5 turns) rather than being a full participant.

**Sub-variant A2: Silent feedback model** — 秦孝公 doesn't speak, but a "favorability meter" is visible (or not) to both players, changing based on what's said.

---

### Option B: "Hidden Sub-Goals" (Simon's Revised Proposal, Apr 4)

**Mechanism:** Beyond the major objective (变法 yes/no), each role has 3 hidden sub-goals (小目标). 2 are false, 1 is true. After dialogue, 秦孝公 is asked whether he agrees with each sub-goal. True sub-goal approval = +0.5, opponent detects true sub-goal = -1, false sub-goal approval = -x (penalty).

| Aspect | Detail |
|--------|--------|
| **Forcing** | Cost of silence: if you don't push your true sub-goal, 秦孝公 won't approve it, so you lose +0.5 |
| **Exposure risk** | Pushing it creates signal for opponent to detect which one is true |
| **What changed from A** | 秦孝公 doesn't need to be in the dialogue. Sub-goals are embedded in the dialogue content itself. Evaluation is post-dialogue. |

**Pros:**
- Narratively natural: "商鞅除了变法可能就有些小心思" (Simon's words)
- No 3-way conversation needed
- Compatible with current PvP architecture
- Creates multi-dimensional scoring (major + sub-goals)

**Cons:**
- Simon's math shows the valid penalty range for x is **extremely narrow** (0.243 < x < 0.262 when p=0.7) for silence to not be optimal
- "Twist" problem: pushing ALL 3 sub-goals may be dominant (opponent can't distinguish, 秦孝公 may approve all)
- Dependent vs independent sub-goals create fairness issues (see math.md): dependent goals need r_d = 2× independent to be equivalent, distorting incentives
- Balancing 3 sub-goals per role × 2 roles = 6 sub-goals to design and balance

**Sub-variant B1: Penalty for false approval** — False sub-goal approved = -0.25. Creates narrow math constraint.

**Sub-variant B2: Resource scarcity** — Strict token/turn limits so players can't effectively push all 3. Forcing through scarcity rather than scoring.

**Sub-variant B3: All independent sub-goals** — Avoid dependent/independent mixing. Simpler math but constrains scenario design.

---

### Option C: "Observable Anomaly + Hidden Goals" (Yihan's Theater Model)

**Mechanism:** Each role has hidden goals drawn from a randomized pool. The scenario setup creates observable anomalies that force the player to engage with their hidden info/goal through dialogue. Post-dialogue evaluation by judge + opponent on 3 dimensions.

| Aspect | Detail |
|--------|--------|
| **Forcing** | Scenario author designs an observable anomaly (e.g., 秦孝公 opens with "I heard you've been visiting the palace frequently — why?") that the agent MUST address |
| **Evaluation** | 3D scoring: public goal achieved (judge), hidden goal achieved (judge), hidden goal undetected (opponent) |
| **Randomization** | N possible hidden goals per role, 1 randomly active per match |

**Pros:**
- Forcing is structural, not score-driven — can't be gamed away
- Richer game: "whose behavior is coherent?" rather than "guess the fact"
- Generalizes to any scenario (not just 商鞅)

**Cons:**
- Heavy scenario design burden: author must design anomalies + N hidden goals per role + balance them
- "Was the goal achieved?" is subjective LLM judgment (vs binary fact-matching)
- Anomaly quality depends entirely on scenario author skill
- May be too complex for MVP / high schoolers
- Formal game theory proof that silence isn't NE is still missing

---

### Option D: "Rumor System + Objection System" (Teri's Proposal)

**Mechanism:** 秦孝公 announces "rumors" (传闻) that directly correspond to hidden info. Players must respond. After responding, the opponent can raise formal objections (异议) challenging the response.

| Aspect | Detail |
|--------|--------|
| **Forcing** | 秦孝公 directly asks about each piece of hidden info — cannot stay silent |
| **Exposure risk** | Your response to the rumor reveals information; opponent's objection probes deeper |
| **Two sub-modes** | Interleaved (rumor → response → objection per item) or phased (all rumors first, then all objections) |

**Pros:**
- Maximum forcing: you literally must respond to each hidden info item
- Creates structured multi-round interaction (not just open debate)
- Objection system adds "attack" layer — opponent has active mechanism to probe
- Feels like a courtroom/朝堂 format — thematically strong

**Cons:**
- Requires 秦孝公 as active dialogue participant (announces rumors)
- More complex game flow (rumor phase + objection phase + dialogue)
- Objection "cost" mechanism (e.g., failed objection costs a clue) adds complexity
- May feel too structured/rigid — loses the organic dialogue quality
- "Two phases" variant is more strategic but less natural

**Sub-variant D1: Interleaved** — Each rumor is immediately responded to and challenged. More intense, like live debate.

**Sub-variant D2: Two phases** — All rumors first (brief responses only), then objection phase. More strategic, like written arguments.

---

### Option E: "Pure Debate, No Hidden Info" (MVP Fallback)

**Mechanism:** 商鞅 vs 甘龙, pure persuasion. 秦孝公 judges based on argument quality, historical knowledge, coherence. No hidden info at all.

**Pros:**
- Simplest to implement
- Already sufficient to test core hypothesis: does prompt quality differentiate?
- No balancing headaches
- Simon agreed this is fine for 4/8 MVP

**Cons:**
- Less strategic depth — feels like a debate competition, not a game
- Missing the "information game" that makes it unique vs. existing AI debate formats
- No bluffing/detection skill dimension
- May not differentiate enough between good and great prompts

---

### Option F: "Fixed Hidden Info, Post-Game Guessing Only" (Simon's Existing PvP Design)

**Mechanism:** This is what's already in 商鞅变法-游戏.md Game 2. Each side has 3 hidden info (2T/1F), public demands, and post-dialogue Q&A. No real-time judge interaction. Scoring: public demand +2, each correct guess +1, each info protected +1.

**Pros:**
- Already designed and spec'd out
- Clean binary scoring (correct/incorrect)
- Public demand creates a forcing negotiation element (+2 is biggest single item)
- Information-negotiation linkage: leaked info changes negotiation leverage

**Cons:**
- Simon's own critique: hidden info itself has no forcing — silence is still viable for the 3 hidden items
- Only the public demand has forcing (must be stated explicitly)
- Opponent guessing is essentially random if no signals leak
- No 秦孝公 involvement in dialogue at all

---

### Option G: Hybrid Approaches

**G1: B + D (Sub-goals + Rumors)** — Rumor system provides forcing for hidden info, sub-goals provide the scoring incentive. 秦孝公 announces rumors about hidden info AND evaluates sub-goals post-game.

**G2: C + F (Observable Anomaly + Post-game guessing)** — Scenario creates anomalies that force engagement, but evaluation stays binary (post-game Q&A). Avoids subjective "goal achieved" judgment.

**G3: A + B (Real-time judge + Sub-goals)** — 秦孝公 reacts in real-time to hidden info AND scores sub-goals post-game. Maximum information, maximum complexity.

**G4: E → B (Phased rollout)** — Pure debate for MVP (4/8), add sub-goals for May competition. This is what was proposed and Simon agreed to.

---

## Cross-Cutting Design Dimensions

| Dimension | Options |
|-----------|---------|
| **秦孝公's role** | Post-game judge only (B, E, F) / Live participant (A, D) / Interjection (A1) |
| **What's hidden** | Information/facts (A, D, F) / Goals/objectives (B, C) / Both (G1) |
| **Forcing mechanism** | Utility/scoring (B) / Observable anomaly (C) / Direct question (D) / Public demand (F) / None (E) |
| **Evaluation** | Binary fact-matching (F) / Judge decision (A, B, C) / Both (G2) |
| **Randomization** | 2T/1F among 3 items (F) / 1 active from pool of N (B, C) / Per-rumor (D) |
| **Complexity** | Low (E) / Medium (B, F) / High (A, C, D, G) |
| **Architecture needed** | 2-player dialogue only (B, C, E, F) / 3-way (A, D) |

---

## Simon's Latest Position (Apr 4)

Based on his Lark threads, Simon has **moved from Option A to Option B**:
- He now prefers hidden sub-goals over judge-reactive hidden info
- He self-critiqued A as "too forced" narratively
- He's doing game theory analysis (math.md) on scoring parameters
- Key open problems he's working on: the x penalty range is too narrow, and the "push all 3" twist
- He agreed to E (pure debate) for MVP, with hidden info for May

---

## How to Test

**1. Paper simulation** — Write out 2-3 hidden info/goal assignments. Have humans (or Claude) play both sides with different strategies (silence, selective reveal, full reveal). Score manually. Check if intended incentives hold.

**2. Automated A/B test with LLMs** — Run matches with the same prompts under different hidden info mechanisms (B vs D vs F). Compare:
  - Does the hidden info actually get discussed? (count references)
  - Is opponent guessing better than random? (accuracy > 33%)
  - Does scoring differentiate skill? (variance of scores)

**3. Math validation** — For Option B, sweep the (p, x) parameter space and plot which strategy is dominant. Validate Simon's narrow-range finding. Try different N (number of sub-goals) and scoring schemes.

**4. Playtest with the team (15 people, Apr 8)** — Run Option E first (pure debate) to establish baseline. Then run the same scenario with Option B or F layered on. Compare engagement, score distribution, and qualitative feedback.

**5. "Judge variance" test** — For any option requiring LLM judgment ("was the goal achieved?"), run the same transcript through the judge 10× and measure agreement rate. If <80%, the mechanism is too subjective for competitive play.

**6. Strategy dominance check** — For each option, have one AI play "always silent" and another play "optimally." If silence wins or ties, the mechanism fails. This is the minimum bar.
