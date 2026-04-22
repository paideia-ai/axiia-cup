# Axiia Cup: LLM Sponsorship Pitch

**Why the smartest move for your model isn't another benchmark — it's a game people can't stop playing.**

---

## The One-Liner

Axiia Cup is a competitive prompt-engineering tournament where players write strategies that control AI agents in adversarial historical debates. No code. Pure language. Players choose which model powers their agent — and your model's name sits on the leaderboard next to the winner.

---

## 1. Players Are Hooked

This is not a hackathon people attend once and forget. This is a game with a compulsion loop.

### The Numbers (17-player closed alpha, April 2026)

| Metric | Value |
|---|---|
| Submission rate | **17/17 (100%)** — every invited player submitted |
| Highest prompt iteration | **v27** — one player revised their strategy 27 times |
| Average iterations per player | **5.6 versions** — unprompted, self-driven refinement |
| Zero-dropout rate | **0 players abandoned** during iteration window |
| Time from invite to first submission | **< 48 hours** |

One player iterated 27 times. Nobody asked her to. Nobody gamified it with badges. She did it because the feedback loop — *write prompt → watch debate → see score → revise* — is genuinely addictive.

### Why It's Addictive

The game mechanic is deceptively simple: write two 1000-character prompts (one per role), pick a model, submit. But underneath:

- **Asymmetric information**: Each match randomly assigns true/false hidden goals. Your prompt must handle any assignment.
- **Compression constraint**: 3 sentences per turn, 10 turns total. Every word must work.
- **Double deception**: You must advocate for all 3 requests to hide your true goal — while reading your opponent's bluff.
- **Judge is a character**: 秦孝公 (the historical king) decides your fate based on his publicly stated criteria. Reading the judge is the real game.

Players describe the experience as: *"I wrote a text and it actually changed how the AI debates."* The appeal isn't watching AI be smart — it's feeling strategic agency through writing.

### Engagement Pattern: Iterate Until Plateau

PMF interviews reveal: players iterate aggressively until their win rate plateaus, then seek new strategies or scenarios. This is the retention signature of chess, poker, and competitive card games — not hackathons.

---

## 2. A Talent Signal You Can't Get From Resumes

### What Axiia Cup Actually Measures

The leaderboard doesn't measure who has the best GPU or the cleverest Python script. It measures:

1. **Prompt engineering under constraint** — 1000 chars, must work for both roles, must handle random info assignments
2. **Strategic reading** — Top players target the judge's stated preferences (evidence > rhetoric > feasibility), not historical accuracy
3. **Theory of mind** — Writing for both Role A and Role B forces players to model the judge from two opposing perspectives. Inconsistency between sides is the clearest signal of shallow thinking.
4. **Compression mastery** — The hard constraint (3 sentences/turn) is the single biggest discriminator between top and bottom players

### Cohort Analysis Finding: Habermas Selection

We analyzed all 34 prompts (17 players x 2 sides) through a Habermas validity-claims framework:

- **Top-tier players** (80%) attack the judge's *truth* and *sincerity* preferences — they read the judge prompt and optimized against it
- **Bottom-tier players** attack *rightness* (historical authenticity) — historically accurate but strategically illiterate

This is not a test of historical knowledge. It's a test of *reading a system and optimizing within it* — exactly the skill LLM companies need in their prompt engineers, developer advocates, and product teams.

### The Hire Pipeline

- **For your developer ecosystem**: Top players have demonstrated they can write prompts that extract maximum performance from language models under adversarial pressure. That's your ideal developer advocate, prompt engineer, or power user.
- **For your research team**: Players who reach v15+ iterations have developed implicit models of how your model behaves — they're essentially doing behavioral probing without calling it that.
- **For campus recruiting**: The demographic is Chinese university and high-school students in AI/tech — the exact pipeline every LLM company is fighting over.

---

## 3. Your Model Name on the Leaderboard

### Model Selection Is a Strategic Choice

Every submission in Axiia Cup includes an explicit model selection — players choose which LLM powers their agent for each role. The leaderboard displays this publicly:

```
#1  Meryl马      DeepSeek V3.2 / DeepSeek V3.2    W: 12  L: 2   Win Rate: 85.7%
#2  m2rtin       Kimi K2.5 / DeepSeek V3.2         W: 11  L: 3   Win Rate: 78.6%
#3  yisiliu      Qwen3.5 / Qwen3.5                 W: 10  L: 4   Win Rate: 71.4%
```

**This is native model brand placement.** Not a banner ad. Not a sponsored post. It's a player choosing your model because they believe it gives them a competitive edge — and the entire community seeing that choice tied to their rank.

### The Meta-Game Is Model Selection

Players actively test different models during the playground phase. From our PMF interviews:

> *"I tried DeepSeek first for consistency, then switched Role B to Kimi because it handles nuance better in the examination phase."*

When a player discovers that your model wins more debates, they tell other players. The leaderboard becomes organic proof. This is word-of-mouth marketing driven by competitive incentive — the most credible form of endorsement.

### Co-Branding Opportunity

- Model name appears on every leaderboard entry
- Model name appears on every match result page
- Model name appears in match transcripts (visible to all players studying opponents)
- Tournament recaps can highlight "Most Winning Model" alongside "Most Winning Player"

---

## 4. Data That Doesn't Exist Anywhere Else

### What We Capture Per Match

Every match generates a complete, structured record:

- **Full dialogue transcript** (10 turns, both agents)
- **Judge examination** Q&A (post-debate interrogation of both sides)
- **Judge decision** with reasoning (structured JSON: verdict + per-request rulings + narrative)
- **Scorer output** with point-by-point calculation
- **LLM call telemetry**: model, provider, tokens (prompt + completion), latency, full request/response JSON
- **Info assignment**: which hidden goals were randomized per match

### What This Means for Your Research

**Adversarial Dialogue Pairs with Ground Truth**

Unlike RLHF preference data (binary A>B), Axiia Cup produces *multi-dimensional scored outcomes* under adversarial pressure:
- Main objective achieved (+1)
- Hidden goal success (+0.5 per true request granted)
- Deception penalty (-0.75 if opponent reads your bluff)
- Score range: -1.5 to +2.0

This is a richer signal than any static benchmark. The scores come from *competitive optimization* by human prompt engineers, not random sampling.

**Prompt Strategies That Win**

We have versioned prompt histories (v1 through v27) for every player. This is an observable learning trajectory: how humans iteratively improve their instructions to your model under competitive pressure. No benchmark dataset captures this.

Concrete research questions this data answers:
- Which instruction patterns produce the most persuasive agent dialogue?
- How do players exploit model-specific behaviors (e.g., DeepSeek's consistency vs Kimi's nuance)?
- What is the convergent "meta-strategy" that top players discover?
- How many iterations does it take for a human to hit diminishing returns on prompt quality?

---

## 5. The Judge Bias Phenomenon: A Live Benchmark

### Discovery: Different Models Judge Differently

During alpha testing, we observed that swapping the judge model (holding all other variables constant) produces **materially different outcomes**. The same debate transcript, scored by DeepSeek vs GPT-5.4 vs Claude Opus, yields different winners.

This is not a bug. This is a research finding.

### Why LLM Companies Should Care

**Model personality under adversarial conditions is unmeasured.** Standard benchmarks test knowledge retrieval, reasoning, and instruction-following. They don't test:

- Does your model favor eloquence over evidence when judging arguments?
- Does your model have systematic bias toward the reformer (progressive) or the conservative position?
- Does your model's judgment correlate with its dialogue behavior?
- How consistent is your model's judging across repeated identical inputs?

Axiia Cup generates this data *naturally* — every tournament round is a controlled experiment. Run the same matches with a different judge model, and you have a head-to-head evaluation of judicial reasoning quality.

### Value Benchmark Potential

We propose a structured "Judge Consistency Index": run N identical match transcripts through M judge models and measure:
- **Intra-model consistency**: Does your model judge the same transcript the same way twice?
- **Inter-model agreement**: Do different models converge on the same verdict?
- **Positional bias**: Does verdict change when you swap Role A / Role B labels?
- **Reasoning quality**: Does the judge's stated reasoning support its numerical score?

This is a *value alignment benchmark* — not testing what a model knows, but testing how it evaluates competing arguments. No existing benchmark does this at scale with adversarial, human-optimized inputs.

---

## 6. Beyond These Five: Additional Value for LLM Labs

### Community Access to Chinese AI-Native Users

Axiia Cup's demographic is Chinese university students and young professionals in AI/tech — the exact user base building on your APIs. Sponsorship puts your model in their hands during a high-engagement experience, not a dry tutorial.

- **Xiaohongshu distribution planned** for public launch (May 2026)
- **Campus ambassador program** in development
- **Feishu group community** already active with strategic discussion

### Scenario Expansion = Vertical Model Testing

Post-MVP scenarios include:
- Science debates (Bruno vs Church, Newton vs Leibniz, Darwin vs Owen)
- Economic policy disputes (interest rate, trade war)
- Legal case judgment
- Model UN / APEC simulation
- Japanese historical (関ヶ原の戦い)

Each scenario tests different model capabilities: scientific reasoning, economic logic, legal argumentation, diplomatic nuance. Your sponsorship can co-brand specific scenarios that align with your model's strengths.

### Token Sponsorship ROI

The math is simple:

| Item | Estimate |
|---|---|
| Tokens per match (dialogue + judge + scorer) | ~15,000-25,000 |
| Matches per tournament block (20 players) | ~80 |
| Blocks per season | 3 |
| Total tokens per season | ~4.5M-6M |
| Cost at typical API pricing | **< $50/season** |

For less than the cost of a single sponsored blog post, you get:
- Your model name on every leaderboard entry
- Adversarial evaluation data no benchmark provides
- Access to a pipeline of elite prompt engineers
- Community organic endorsement when your model wins

### Data Flywheel

More players produce more matches. More matches produce richer model comparison data. Richer data attracts more LLM companies. More LLM companies fund more models on the platform. More models attract more players who want to test and compete.

This is the flywheel. Token sponsorship is the cheapest way to enter it early.

---

## The Ask

We're inviting LLM labs to sponsor Axiia Cup token usage for the upcoming public season (May 2026 launch). In return:

1. **Model placement**: Your models available as player-selectable agents
2. **Leaderboard branding**: Model name displayed alongside player rankings
3. **Data access**: Aggregated match data, model comparison reports, prompt strategy analysis
4. **Talent pipeline**: First look at top-ranked players for recruiting
5. **Judge benchmark participation**: Your model included in the Judge Consistency Index
6. **Co-branded scenarios**: Sponsor specific debate topics that showcase your model's strengths

**The investment is tokens. The return is data, talent, and the most authentic model endorsement possible — a leaderboard where real users chose your model to win.**

---

*Axiia Cup is built by Paideia. For partnership inquiries, contact the team directly.*

*Last updated: 2026-04-21*
