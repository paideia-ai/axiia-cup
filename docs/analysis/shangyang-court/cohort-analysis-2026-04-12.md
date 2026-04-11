# When you let 17 Chinese AI builders design an LLM agent for an adversarial court debate, what do they actually write?

*An analysis of agent prompts from the first Axiia Cup tournament, read through Habermas's four validity claims and Searle's felicity conditions.*

---

## The setup

Axiia Cup is a persuasion tournament where participants write prompts (max 1000 characters per side) that tell an LLM agent how to play a character in an adversarial debate. The first scenario is **商鞅变法·朝堂辩法**: 商鞅 (the reformer) argues for legal reform in front of 秦孝公 (the King of Qin, played by a judge LLM); 甘龙 (the conservative 太师) argues against. Each match is a 10-turn debate with a hard constraint of 3 sentences per turn. Participants write both sides — their promptA controls 商鞅 in matches where they play A, their promptB controls 甘龙 in matches where they play B.

The judge has a specific, readable personality baked into his own prompt. He is *leaning toward 甘龙 by default*. He wants "实据、利害、可行性" — evidence, interests, feasibility. He explicitly distrusts "慷慨激昂的空言" (stirring empty rhetoric). His power base is 宗室 (the royal clan), and his biggest fear is aristocratic backlash against reform.

So the prompts are not just instructions to an LLM — they are *strategies for speech acts in a contest against a specific, biased, readable judge*. To analyze them, we used two frames from the philosophy of language:

1. **Habermas's four validity claims.** Every serious utterance implicitly claims (1) *truth* — my facts are correct, (2) *rightness* — my act is normatively appropriate, (3) *sincerity* — I actually mean what I say, (4) *comprehensibility* — I'm intelligible and specific. Adversarial arguments proceed by attacking one of these claims. Which one is attacked matters.
2. **Searle's felicity conditions.** For a speech act to actually *work*, background conditions must hold. A subject cannot felicitously command a king. A newcomer cannot felicitously accuse a high minister without grounds. If the conditions fail, the act *misfires* — it loses before it speaks.

We ran the analysis in parallel through two LLM analysts (Gemini 2.5 Pro and gpt-5.3-codex), then reconciled their disagreements manually.

---

## Finding 1: the cohort implicitly learned Habermas

Across 34 prompts (17 participants × 2 sides), here's the distribution of primary validity-claim attacks:

| Validity claim | Primary attack | Hit rate on this judge |
|---|---|---|
| **Truth** (feasibility, evidence) | ~15 prompts | High — judge explicitly asks for this |
| **Sincerity** (motive impugnment) | ~13 prompts | High — judge is politically paranoid |
| **Comprehensibility** (demand for specifics) | ~5 prompts | Medium — defensive weapon |
| **Rightness** (祖制 / 礼) | ~3 prompts | Low — judge explicitly rejects this |

The striking finding: **no one in the top tier attacks *rightness*.** Rightness attacks are the *historically authentic* move for 甘龙 — in 《史记·商君列传》, the real 甘龙 argues precisely from 祖制 and 礼乐. But the cohort refused to play the historically authentic move. They played the move that fits *this specific judge*.

The three participants who did attack rightness are all in the lowest strategic tier. They LARPed the historical character instead of reading the judge.

**What this says about the cohort:** they are not writing "what 甘龙 would say." They are writing "what would win *this judge*." That's a different skill, and it's the skill the game actually tests.

## Finding 2: the dominant structural force is the 3-sentence constraint

The hard constraint "≤3 sentences per turn" is the single most discriminating feature of the cohort. Top-tier prompts *explicitly reference* it and structure their strategies around compression. Bottom-tier prompts write prose the model cannot fit into a turn and then wonder why the agent "doesn't do what they told it to."

One top-tier participant opens their prompt with "你只有5次发言，每句必须推进胜局" ("you only have 5 turns — every sentence must advance the win"). That single line is the difference between someone who has internalized the constraint and someone who hasn't.

**This points at a more general design principle for LLM-based games:** if you want the game to select for *strategic thinkers* rather than *verbose writers*, give players a hard compression constraint. Compression forces every utterance to do strategic work and exposes players who have no strategy.

## Finding 3: there's a "hidden sub-game" most players don't notice

Each side in the debate has three "requests" to the king. Exactly one is their *true* goal (scoring +0.5 if approved by the judge). The other two are decoys (−0.25 each if approved). After the debate, each side is also interviewed and asked to guess which of the opponent's requests was real; a correct guess docks the opponent −0.75.

This is a complete misdirection sub-game on top of the big debate. Only about 5 of 17 participants wrote any meaningful strategy for it. Everyone else optimized for the +1 point headline position and ignored the ±1.75 range of points that move on the request game.

The participants who *did* engage with the sub-game wrote things like: "steer the judge toward my true request by burying it inside my big argument rather than highlighting it; make a theatrical defense of a *false* request to draw the opponent's guess to the wrong one; read the opponent's tell patterns during the debate to detect which of their requests they defend most quickly, that's the true one."

**This is a general pattern in game design:** a visible headline objective plus a hidden sub-game creates a skill gap between casual and serious players. The casual players optimize the visible objective. The serious players discover the sub-game and permanently out-score them. The game reads as approachable but has depth.

## Finding 4: two-sided coherence is the meta-game

The sharpest single discriminator between top-tier and everyone else was not *quality of promptA* or *quality of promptB* — it was **whether promptA and promptB encode the same theory of the judge**.

One example: a participant wrote two creative, fluent, individually-impressive prompts. The promptA had 商鞅 speaking in 墨家 (Mohist) empiricist language — concrete examples, evidentiary demands. The promptB had 甘龙 speaking in 道家 (Daoist) paradox and 玄言. Both are aesthetically strong. But they assume *different judges*: one empiricist, one contemplative. Since both prompts will be evaluated by the *same* 秦孝公 across all matches, the participant has committed to two contradictory theories of how to win. They will lose on one side regardless of which theory is right.

Compare this with a top-tier participant who wrote two prompts that are *mirror images* of the same theory: both assume 秦孝公 is a risk-averse power-maximizing politician who wants concrete evidence about feasibility. Their promptA attacks by offering concrete pilot commitments ("let me run this in one county for one year — fail and you kill me"). Their promptB attacks by listing concrete risks in three columns ("time cost / manpower cost / treasury cost"). Same theory of judge, mirrored application.

**Forcing players to write both sides is a brilliant structural choice** — it exposes their implicit model of the judge. Individual prompts can be bluffed; a coherent pair cannot.

## Finding 5: felicity misfires cluster in one direction

The most common structural error is telling 商鞅 (a 客卿, a visiting scholar) to *openly insult or command* 甘龙 (a 太师, the highest-ranked minister). For example, prompts that instruct 商鞅 to call 甘龙 "痴愚" ("senile and stupid") or to demand that 甘龙 "stop playing dumb."

In the 朝堂 power structure of 359 BCE, this is *structurally impossible*. A 客卿 does not have the standing to command a 太师 in the king's presence without committing a protocol violation the king would penalize. These speech acts *misfire* — they lose before they speak, because the speaker lacks the authority for the act they're performing.

What's interesting is that this misfire is *one-directional*. Participants don't make the opposite mistake (having 甘龙 insult 商鞅 — that's fine, 太师 outranks 客卿). They also don't make the mistake of having 商鞅 be deferential to the king — that's also fine. The specific failure mode is *overestimating the speaker's license to attack upward*.

This is a general failure mode in agent-prompt writing: people think about *what the character wants to say* and not *what the character has standing to say*. Austin and Searle would say: you need both a *locution* (what's said) and *felicity conditions* (who has the right to say it). Agent prompt writers who only think about the first half build agents that misfire.

---

## Methodology notes

- **Input:** 17 participants' latest submissions, pulled from production via an admin CLI; prompts ranged from 2 characters to 1000 characters per side.
- **Analysis prompt:** a single ~12KB instruction doc explaining the game rules, the judge's biases, the scoring mechanics, and the Habermas/Searle framework, followed by all 17 participants' prompt pairs inlined. We avoided feeding the full runtime scenario template to the analysts to prevent them from over-indexing on the template itself.
- **Analysts:** Gemini 2.5 Pro and gpt-5.3-codex, both run non-interactively on the same input. Output schema was a hybrid JSON (for aggregation) + Chinese paragraphs (for human reading).
- **Reconciliation:** the two analysts agreed on 13/17 overall sophistication ratings (mean |Δ| = 0.24) and 14/17 coherence flags. Disagreements were broken manually by reading the original prompts; in 3/4 disagreement cases, the second analyst (codex) was closer to the human read, usually because it caught cross-prompt mirroring the first missed.
- **What we did not measure:** actual tournament results. The prompts are *necessary but not sufficient* — LLM execution variance on 10-turn debates is high, and the final leaderboard will reflect both prompt quality and matchup luck.

## The four findings in one paragraph

Good LLM agent prompts for adversarial dialogue look nothing like good essays. They look like *short strategic compilations* that: (1) attack the validity claims a specific judge actually rewards; (2) compress under hard per-turn sentence limits instead of fighting them; (3) engage with hidden sub-games instead of only optimizing the visible objective; (4) maintain a coherent theory of the judge across every side of the debate they're written for. The best submissions in the first Axiia Cup cohort do all four. The worst submissions do none. What separates them is not writing ability but *modeling ability* — specifically, the ability to read the judge's stated preferences and build a strategy that fits those preferences, rather than writing what the historical character "would have said."

---

*Axiia Cup is a persuasion tournament for LLM agents, launched spring 2026 by the Paideia team. Scenarios, rules, and leaderboards at <https://axiia-cup.isofucius.cn>. This analysis was produced collaboratively with Gemini and Codex CLIs and reconciled by a human. If you want to try it, sign up and submit a prompt for 商鞅变法·朝堂辩法.*
