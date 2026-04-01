# Game Research for Axiia Cup Design

## Historical Great Games — Mechanisms, Insights, and Design Lessons

> Researcher perspective: NYU Game Center faculty, game design theory
> Last updated: 2026-03-31
> Purpose: Mine historical games for mechanisms that can inform Axiia Cup's competitive prompt-engineering-via-dialogue format

---

## Axiia Cup Design DNA (for cross-reference)

What makes Axiia Cup unique as a game:

- **The "weapon" is a system prompt** — 1000 chars of pure language strategy
- **Adversarial dialogue** — two AI agents argue, persuade, negotiate
- **Asymmetric information** — you can't see your opponent's prompt
- **Dual-role requirement** — must design BOTH sides (A and B)
- **Judge is a character** — not abstract scoring, but an in-world persona who asks questions
- **Statistical convergence** — single matches have variance; rankings emerge over many games
- **Meta-game** — players can iterate prompts between blocks, reading the evolving meta

Key design questions this research should illuminate:

1. How do great games handle **hidden information + public rules**?
2. What makes **constrained creative expression** compelling?
3. How do games create **depth from simple rulesets**?
4. What **judging/scoring** mechanisms feel fair yet interesting?
5. How do **meta-games** (the game around the game) sustain engagement?

---

## Part 1: Language & Rhetoric Games

### 1.1 Diplomacy (Allan Calhamer, 1959)

**What it is:** 7-player strategy game set in pre-WWI Europe. No dice, no randomness. Victory is entirely through negotiation, alliance-building, and betrayal.

**Key mechanisms:**

- **Simultaneous secret orders** — all players write orders simultaneously, then reveal. You never know if an ally will keep their promise.
- **No enforced contracts** — any promise can be broken. Trust is a resource you build and spend.
- **Communication phases** — structured negotiation time before each move phase.
- **Symmetric start, asymmetric outcomes** — all powers start roughly equal, but diplomacy creates asymmetry.

**Axiia Cup lessons:**

- **The "prompt as promise" parallel.** In Diplomacy, your words during negotiation ARE the game. In Axiia Cup, your system prompt IS the game. Both are pure-language strategy games at their core.
- **Hidden information creates depth.** Players don't see each other's orders. Players don't see each other's prompts. This forces you to reason about what your opponent _might_ be doing.
- **The dual-role design requirement** mirrors Diplomacy's need to think from every neighbor's perspective. You can't write a good prompt for Role A without understanding what Role B might do.
- **Meta-evolution.** Diplomacy's meta-game (opening theory, stab timing, trust signals) evolved over decades. Axiia Cup's prompt meta should evolve similarly across tournament blocks.

**Design insight for Axiia Cup:** The "negotiation phase" in Diplomacy is where the real game happens — not the movement phase. Similarly, the real Axiia Cup game is in the prompt workshop, not the dialogue execution. The dialogue is just the reveal of what your language strategy actually does.

---

### 1.2 Werewolf / Mafia (Dimitry Davidoff, 1986)

**What it is:** Social deduction game. Hidden roles, public discussion, voting to eliminate. The informed minority (werewolves) tries to survive while the uninformed majority (villagers) tries to identify them.

**Key mechanisms:**

- **Hidden roles + public discourse** — your true identity is secret, but your arguments are public.
- **Information asymmetry** — wolves know who each other are; villagers don't. Wolves must fake being villagers.
- **Persuasion as gameplay** — there are no "moves" beyond what you say and how you vote.
- **Elimination creates escalating tension** — fewer players = more information per statement.

**Axiia Cup lessons:**

- **Language as the only tool.** Werewolf proves that a game where the ONLY mechanic is talking can be deeply strategic. This validates Axiia Cup's "pure prompt, no tools" approach.
- **The difference between "AI Werewolf" competitions and Axiia Cup** is noted in the design spec. Key differentiator: Axiia Cup is 1v1 (simpler, cleaner signal) and measures the _human designer_, not the model.
- **Hidden goals in scenarios.** The design spec mentions optional "hidden goals" for roles. This mirrors Werewolf's hidden identity. A prompt that pursues a hidden goal while appearing to pursue the public goal — that's deep strategy.
- **The judge-as-character mirrors the "village vote."** In Werewolf, the group judges who seems suspicious. In Axiia Cup, a character-judge evaluates based on in-world criteria. Both avoid abstract "optimal play" scoring.

**Design insight for Axiia Cup:** Werewolf tournaments (yes, they exist — WUDC-adjacent competitive Mafia) use statistical convergence across many games to rank players. Same principle as Axiia Cup's Swiss tournament. Single Werewolf games are swingy; rankings emerge over many rounds.

---

### 1.3 Nomic (Peter Suber, 1982)

**What it is:** A game whose rules include rules for changing the rules. Players propose, vote on, and implement rule changes. The game is about governance, rhetoric, and creative lawmaking.

**Key mechanisms:**

- **Self-modifying ruleset** — the game evolves as you play.
- **Proposal + voting** — each turn, a player proposes a rule change and others vote.
- **Legal interpretation** — disputes about what rules mean are part of the game.
- **The boundary between "playing the game" and "changing the game" dissolves.**

**Axiia Cup lessons:**

- **The judge-prompt-as-patchable-rules parallel.** The design spec explicitly says judge prompts will be versioned and updated like "balance patches." This IS Nomic — the rules evolve based on player feedback.
- **Prompt engineering as rule interpretation.** In Nomic, a clever player finds ambiguities in existing rules and exploits them. In Axiia Cup, a clever player finds affordances in the judge prompt (which is public!) and crafts their prompt to exploit them.
- **Public rules create deeper strategy, not shallower.** Nomic's rules are all public. The strategy comes from creative interpretation, not hidden information. Axiia Cup's public judge prompt works the same way.

**Design insight for Axiia Cup:** The most exciting moments in Nomic are when a player finds a creative interpretation of the rules that nobody anticipated. Axiia Cup should expect and celebrate this. When a player crafts a prompt that exploits a judge-prompt affordance in a surprising way, that's not a bug — it's the highest form of play.

---

### 1.4 Once Upon a Time (Richard Lambert et al., 1993)

**What it is:** A storytelling card game. Players have story element cards (characters, events, places) and a secret ending card. You narrate a shared story, playing cards as you weave elements in. First to reach their ending wins.

**Key mechanisms:**

- **Shared narrative with competing goals** — everyone contributes to the same story but steers it toward their own ending.
- **Interruption** — if the narrator mentions something matching another player's card, that player can take over the story.
- **Creative constraints** — you must incorporate specific elements, not just free-associate.

**Axiia Cup lessons:**

- **Dialogue as shared narrative.** Each AI agent contributes to a shared conversation, but each is trying to steer it toward their own goal. This is literally the Axiia Cup match structure.
- **The elegance of constraints.** A 1000-character prompt limit forces creative compression, just as Once Upon a Time's card hand forces specific narrative elements. Constraints produce creativity.
- **Interruption as turn structure.** Axiia Cup's alternating dialogue turns create a push-pull where each response must react to AND redirect the conversation.

**Design insight for Axiia Cup:** The best Once Upon a Time players don't just play their own cards — they anticipate and disrupt opponents' narrative arcs. The best Axiia Cup prompts should similarly anticipate the opponent's strategy and include "disruption" instructions.

---

## Part 2: Strategy Games with Constrained Resources

### 2.1 Magic: The Gathering — Deck Building (Richard Garfield, 1993)

**What it is:** Collectible card game where players build decks from a card pool, then battle. The deck-building phase (before the game) is as strategic as the play phase.

**Key mechanisms:**

- **Deck construction as pre-game strategy** — the real decisions happen before the match starts.
- **Metagame awareness** — you build your deck anticipating what opponents will play.
- **Mana curve / resource management** — you have limited slots, so every card must earn its place.
- **Sideboarding** — between games in a match, you can swap cards to adapt.

**Axiia Cup lessons:**

- **Prompt = Deck.** The 1000-character prompt IS a deck. Every word must earn its place. "Mana curve" becomes "instruction priority" — what does your prompt spend its limited characters on?
- **Metagame is central.** MTG players study the meta (what decks are popular) and build accordingly. Axiia Cup players should study what prompt strategies are winning and adapt. The multi-block format with iteration windows IS sideboarding.
- **Dual-role = two decks.** Requiring both Role A and Role B prompts is like requiring two decks. You can't just be good at one archetype; you must master both sides of the scenario.
- **Model selection as "color choice."** In MTG, choosing your colors constrains and defines your strategy. In Axiia Cup, choosing Kimi vs DeepSeek vs Qwen constrains and defines what your prompt can accomplish.

**Design insight for Axiia Cup:** MTG's lasting appeal comes from the metagame cycle: dominant strategy emerges → counter-strategies develop → meta shifts. The multi-block format with public judge prompts is perfectly designed to create this cycle. This is perhaps the strongest parallel in all of game design.

---

### 2.2 Netrunner (Richard Garfield, 1996; revised as Android: Netrunner, 2012)

**What it is:** Asymmetric 2-player card game. One player is a Corporation protecting servers; the other is a Runner hacking in. Different card pools, different win conditions, different resources.

**Key mechanisms:**

- **Mandatory asymmetry** — you MUST play both sides across a match.
- **Hidden information on the Corp side** — servers contain face-down cards. The Runner must decide when to risk accessing them.
- **Bluffing with installs** — Corp can install cards face-down. Are they traps or agendas? The Runner doesn't know.
- **Economy as a core tension** — every action costs clicks, and you never have enough.

**Axiia Cup lessons:**

- **Mandatory asymmetry is the killer parallel.** Netrunner tournaments require playing both Corp and Runner. Axiia Cup requires writing both Role A and Role B prompts. This tests breadth, not just depth.
- **Bluffing within constraints.** A Corp player installs agendas that look like traps and traps that look like agendas. An Axiia Cup prompt can instruct the agent to appear cooperative while pursuing a hidden goal — within the scenario constraints.
- **The "economy" of 1000 characters.** Netrunner's click economy forces painful trade-offs. The character limit forces similar trade-offs: do you spend characters on offense (persuasion tactics) or defense (handling unexpected arguments)?

**Design insight for Axiia Cup:** Netrunner's genius is that the _same player_ must design strategies for fundamentally different positions. This tests a different kind of intelligence than games where you specialize. Axiia Cup's dual-role requirement does the same thing and should be celebrated as a core design feature, not treated as a logistics detail.

---

### 2.3 StarCraft: Brood War (Blizzard, 1998)

**What it is:** Real-time strategy game. Three asymmetric races, 1v1 competitive play, vibrant professional scene (especially in Korea).

**Key mechanisms:**

- **Build orders as pre-planned strategy** — your opening sequence is pre-designed, then you adapt.
- **Scouting and information warfare** — you must spend resources to learn what your opponent is doing.
- **Rock-paper-scissors at the strategic level** — certain builds counter other builds.
- **Skill expression through execution** — the same build order plays differently in different hands.

**Axiia Cup lessons:**

- **Prompts ARE build orders.** A StarCraft build order is a pre-planned sequence of instructions executed in a specific order. A system prompt is the same — pre-planned instructions that the AI executes during the match. The player doesn't intervene once it starts.
- **The fog of war parallel.** In SC:BW, you can't see the opponent's base without scouting. In Axiia Cup, you can't see the opponent's prompt. But the public judge prompt is like the map — it's shared terrain both players can study.
- **Temperature = 0 creates "execution clarity."** In SC:BW, randomness is minimal (only in unit pathfinding). Temperature = 0 creates deterministic outputs, meaning the "execution" is clean and the result reflects the strategy's quality.

**Design insight for Axiia Cup:** SC:BW's enduring competitive appeal comes from the interplay between preparation (build order) and adaptation (in-game decisions). Axiia Cup's prompts are pure preparation — there's no in-game adaptation (the AI executes autonomously). This means the prompt must encode not just a strategy but contingency plans. The best prompts will be like the best build orders: robust to multiple opponent strategies.

---

### 2.4 Poker (Texas Hold'em, specifically tournament poker)

**What it is:** Incomplete information game. You know your cards and the community cards. You bet, raise, fold. Long-run skill dominates despite short-run variance.

**Key mechanisms:**

- **Incomplete information + probabilistic reasoning** — you never have full information but must make optimal decisions anyway.
- **Position matters** — acting later gives information advantage.
- **Bankroll management across tournaments** — single hands are swingy; skill emerges over hundreds of hands.
- **GTO (Game Theory Optimal) vs exploitative play** — there's an optimal baseline, but deviating to exploit opponents' tendencies can be more profitable.

**Axiia Cup lessons:**

- **The design spec explicitly invokes the poker model** ("德州扑克模型：规则公开 + 大量对局 = 长期公平"). This is the statistical fairness argument: LLM judging has variance, but over many matches, the better strategy wins.
- **GTO vs exploitative maps to robust vs targeted prompts.** A GTO prompt is one that performs well against any opponent. An exploitative prompt is one tuned to beat a specific meta-strategy. The multi-block format lets players shift between these approaches.
- **The "public rules" of poker** (hand rankings, betting structure) are like the public judge prompt. Everyone knows the rules. The strategy is in how you play within them.

**Design insight for Axiia Cup:** Poker's key insight is that _variance is a feature, not a bug._ Variance keeps weaker players engaged (they sometimes win) and creates exciting moments. Axiia Cup's LLM judging variance serves the same purpose. The Swiss tournament format + multiple matches is the equivalent of playing many hands — ensuring skill surfaces.

---

## Part 3: Games with Innovative Judging / Scoring

### 3.1 Apples to Apples / Cards Against Humanity (1999 / 2011)

**What it is:** Party game where one player (the judge) plays an adjective card, and others play nouns to match. The judge picks the "best" match, entirely subjectively.

**Key mechanisms:**

- **Rotating human judge** — each round, a different player judges. You play to the judge's tastes.
- **Subjective scoring** — there's no "correct" answer. The judge decides.
- **"Play to the judge"** — strategic play means understanding what THIS judge finds funny/clever.

**Axiia Cup lessons:**

- **"Play to the judge" is THE core strategy.** Since the judge prompt is public, players literally play to the judge. Understanding the judge's character, priorities, and scoring criteria is as important as the prompt itself.
- **The subjectivity is the point.** Just as Apples to Apples embraces subjective judging, Axiia Cup embraces LLM judging with its inherent biases. The system works because: (a) the biases are stable (same prompt → same biases), and (b) everyone faces the same judge.

**Design insight for Axiia Cup:** The rotating judge in Apples to Apples creates variety — you must adapt to different judges. Axiia Cup could eventually have multiple scenarios with different judge characters, creating the same variety. You might be great at playing to the Renaissance queen but weak at playing to the Warring States king.

---

### 3.2 Dixit (Jean-Louis Roubira, 2008)

**What it is:** Storytelling/art game. The active player gives a clue for their card. Others submit cards that might match. Players vote on which card is the original. The twist: if EVERYONE guesses correctly, the active player scores zero (clue was too obvious). If NOBODY guesses, also zero (too obscure).

**Key mechanisms:**

- **Goldilocks scoring** — your clue must be neither too obvious nor too obscure. You need SOME people to guess right but not ALL.
- **Audience-dependent strategy** — you calibrate your clue to specific players' knowledge and associations.
- **Creative ambiguity as a skill** — the art is in finding the exact right level of obscurity.

**Axiia Cup lessons:**

- **The "Goldilocks" principle applies to prompts.** A prompt that's too direct ("always agree with the judge") might be too obvious and easily countered. A prompt that's too clever might confuse the AI. The best prompts hit the sweet spot.
- **Calibrating to the "audience" (the LLM model).** Different models interpret prompts differently. Choosing the right model for your prompt style is like calibrating your Dixit clue to your audience.

**Design insight for Axiia Cup:** Dixit's scoring elegance — punishing both extremes — could inspire future scenario design. What if a judge character explicitly penalizes both "too servile" and "too aggressive" arguments? This would create the Goldilocks dynamic naturally.

---

### 3.3 Robot Wars / BattleBots (1998-present)

**What it is:** Engineering competition. Teams build robots, robots fight in an arena. Judges score based on aggression, control, and damage if there's no knockout.

**Key mechanisms:**

- **Build phase + combat phase** — the design happens before the fight. Once the robot enters the arena, you can only drive it.
- **Public arena, hidden designs** — everyone fights in the same arena with the same rules, but robot internals are secret until the fight.
- **Weight limit as constraint** — you have exactly N pounds to allocate between armor, weapons, drivetrain, and electronics.
- **Arena hazards as shared environment** — both robots must deal with the same arena features.

**Axiia Cup lessons:**

- **This is the closest structural analog to Axiia Cup.** Build phase (prompt writing) → combat phase (autonomous dialogue) → judging. The designer doesn't control execution — the robot/AI acts on its own.
- **Weight limit = character limit.** BattleBots' weight limit forces painful trade-offs. 1000 characters forces the same. Do you invest in "armor" (defensive prompt instructions) or "weapons" (aggressive persuasion tactics)?
- **The shared arena = the scenario.** Both bots fight in the same arena. Both agents operate in the same scenario with the same rules and judge.

**Design insight for Axiia Cup:** BattleBots' enduring appeal is watching your creation perform autonomously. The excitement of "will my design work?" is identical to submitting a prompt and watching the dialogue unfold. This is the emotional core of Axiia Cup — the thrill of autonomous execution of your design.

---

## Part 4: Puzzle Games with Depth from Simple Rules

### 4.1 Chess (ancient, formalized ~15th century)

**What it is:** The canonical perfect-information strategy game. Two players, deterministic, complete information.

**Key mechanisms:**

- **Opening theory** — thousands of studied opening sequences, each with known advantages and risks.
- **Positional vs tactical play** — long-term structural advantages vs immediate combinations.
- **The endgame is a different game** — endgame play requires different skills than middlegame.
- **Elo rating system** — the gold standard for competitive ranking.

**Axiia Cup lessons:**

- **Opening theory will develop for prompts.** Just as chess has studied openings, Axiia Cup will develop "prompt openings" — known effective structures for different scenarios. This is inevitable and healthy.
- **The Elo/Glicko-2 system** (listed as post-MVP in the design spec) comes directly from chess. It works because it measures relative skill through pairwise comparisons — exactly what Axiia Cup's match format produces.
- **The distinction between tactical and positional prompting.** A "tactical" prompt might include specific clever lines for the agent to use. A "positional" prompt might establish a general communication framework. Both are valid; the best players use both.

**Design insight for Axiia Cup:** Chess's competitive ecosystem thrives because the game is simple enough to have deep theory. Axiia Cup's constraints (1000 chars, no tools, fixed scenarios) create similar conditions. Resist the temptation to add complexity — the depth should come from the constraints.

---

### 4.2 Go (ancient, ~2500 years)

**What it is:** Territory control game on a 19×19 grid. Place stones, surround territory. Rules fit on a napkin; mastery takes a lifetime.

**Key mechanisms:**

- **Emergent complexity from minimal rules** — only one type of piece, one action per turn, one capture rule.
- **Local vs global thinking** — each move affects both the immediate area and the whole board.
- **Influence vs territory** — a stone can "influence" areas without "owning" them. This ambiguity is the heart of the game.
- **Thickness vs thinness** — a "thick" position is robust but slow; a "thin" position is efficient but fragile.

**Axiia Cup lessons:**

- **The "influence" concept maps to prompt design.** A prompt can give the AI "influence" over the conversation's direction without scripting specific lines. The best prompts create influence, not control.
- **Thickness vs thinness in prompts.** A "thick" prompt gives the AI robust general principles. A "thin" prompt gives specific tactical instructions. Thick prompts are harder to exploit but slower to score; thin prompts score fast but can be countered.
- **The simplicity argument.** Go's rules are almost trivially simple. Its depth is astronomical. Axiia Cup should learn from this: the 1000-char constraint, fixed scenarios, and public rules are strengths, not limitations.

**Design insight for Axiia Cup:** Go masters say "the best move is the one your opponent doesn't want you to play." The best prompt is the one that puts the opposing agent in positions it's not designed to handle. This adversarial thinking is the core skill Axiia Cup measures.

---

### 4.3 Baba Is You (Arvi Teikari, 2019)

**What it is:** Puzzle game where the rules of each level are physical objects IN the level. You solve puzzles by pushing word-blocks to change the rules. "BABA IS YOU" can become "WALL IS YOU" by rearranging the words.

**Key mechanisms:**

- **Rules as manipulable objects** — the rules are literally part of the game world.
- **Self-referential logic** — "RULE IS PUSH" means you can push rules. Meta-rules about rules.
- **Constraint satisfaction** — each puzzle is a constraint satisfaction problem where you must find valid rule configurations.
- **Aha moments from reframing** — the game teaches you to see rules differently.

**Axiia Cup lessons:**

- **The system prompt IS the rules of the agent's behavior.** Just as Baba Is You lets you rewrite rules, the system prompt defines what the agent "is" and what it "does." The player is literally writing rules.
- **The joy of creative reframing.** Baba Is You's best puzzles require you to see a familiar element in a completely new way. The best Axiia Cup prompts will do the same — finding an unexpected interpretation of the scenario or judge criteria.
- **Self-referential strategy.** In Baba Is You, "BABA IS WIN" is a valid solution if you can construct it. In Axiia Cup, a prompt that instructs the agent to directly address the judge's scoring criteria (since the judge prompt is public) is a form of self-referential strategy.

**Design insight for Axiia Cup:** Baba Is You shows that the most satisfying puzzles come from rule manipulation, not rule following. The public judge prompt is an invitation to creative rule exploitation. This should be positioned as the "advanced strategy" path for experienced players.

---

### 4.4 The Witness (Jonathan Blow, 2016)

**What it is:** First-person puzzle game on an island. All puzzles are line-drawing puzzles on panels, but each area introduces new rules through environmental teaching — no text instructions.

**Key mechanisms:**

- **Teach through play** — no tutorials, no text. You learn rules by observing patterns across puzzles.
- **Rule layering** — each area introduces one rule. Later areas combine rules from multiple areas.
- **Environmental storytelling** — the puzzles connect to the island's narrative and philosophy.
- **"Eureka" moments as the core reward loop.**

**Axiia Cup lessons:**

- **Learning through play applies to prompt iteration.** The trial arena (试炼场) is where players learn what works by trying and observing. No tutorial needed — the feedback (dialogue + judge score) teaches.
- **Rule layering for scenarios.** Simple scenarios (clear goals, few constraints) teach basics. Complex scenarios (hidden goals, nuanced judge criteria) combine skills. This progression could guide scenario design.

**Design insight for Axiia Cup:** The Witness never explains — it shows. Axiia Cup's trial arena should let players discover prompt engineering principles through experimentation, not instruction. The best onboarding is "here's a scenario, try writing a prompt and see what happens."

---

## Part 5: Games with Meta-Game Innovation

### 5.1 Survivor (TV format, Mark Burnett, 2000)

**What it is:** Social strategy game show. Contestants form alliances, compete in challenges, vote each other out. The eliminated players then judge the finalists.

**Key mechanisms:**

- **Jury system** — the people you eliminated are your judges. How you treat people on the way out determines whether you win.
- **Social capital management** — you need alliances to survive but must eventually betray allies to win.
- **Public and private games** — tribal council is public; alliance conversations are private.
- **The metagame evolves across seasons** — strategies that worked in Season 1 are countered by Season 5.

**Axiia Cup lessons:**

- **The judge-as-character with memory.** Survivor's jury remembers HOW you played. Axiia Cup's post-dialogue judge questions work similarly — the judge evaluates not just the outcome but the quality of the dialogue.
- **Meta-evolution across seasons/blocks.** Survivor's most exciting element is how player strategies evolve. The multi-block format with iteration windows creates the same dynamic.

---

### 5.2 Zendo (Kory Heath, 2001)

**What it is:** Inductive logic game. One player (the Master) creates a secret rule about arrangements of pieces. Others build structures and ask "does this follow the rule?" The first to guess the rule wins.

**Key mechanisms:**

- **Secret rule discovery** — the game IS figuring out the hidden pattern.
- **Hypothesis testing** — you propose structures specifically to test theories about the rule.
- **The Master gives binary feedback** — yes/no, follows/doesn't follow. No partial credit.

**Axiia Cup lessons:**

- **The trial arena is a Zendo game.** Players test prompts (structures) against the judge (master) to discover what works (the hidden rule). Even though the judge prompt is public, the _effective behavior_ of the judge (what actually scores well) is discovered through experimentation.
- **Hypothesis-driven prompt iteration.** The best Zendo players don't guess randomly — they design experiments. The best Axiia Cup players should approach the trial arena the same way: "I think the judge values X. Let me test a prompt that maximizes X and see."

**Design insight for Axiia Cup:** Zendo's genius is that the public information (observed structures + yes/no answers) gradually narrows the hypothesis space. Axiia Cup's trial arena + public judge prompt creates the same dynamic. Over time, players converge on understanding what the judge really values — and the meta stabilizes. Then the judge prompt gets patched, and the cycle restarts.

---

### 5.3 Codenames (Vlaada Chvátil, 2015)

**What it is:** Team word game. A spymaster gives a one-word clue + a number, trying to get teammates to guess specific words on a grid while avoiding opponent words and the assassin.

**Key mechanisms:**

- **Compression as skill** — you must encode maximum information in minimum signal (one word + one number).
- **Shared context as advantage** — teams with shared cultural knowledge perform better.
- **Negative space matters** — you must avoid triggering the wrong words as much as you must trigger the right ones.
- **Risk-reward in the number** — claiming more words is riskier but faster.

**Axiia Cup lessons:**

- **Compression is THE prompt engineering skill.** Codenames' one-word constraint forces extreme compression. Axiia Cup's 1000-character constraint does the same. The skill is encoding maximum strategic intent in minimum space.
- **Shared context between player and model.** A Codenames clue works because the guesser and spymaster share cultural knowledge. A prompt works because the player understands how the model interprets instructions. Model selection is choosing a "teammate" with compatible "knowledge."
- **Negative space in prompts.** What you tell the AI NOT to do can be as important as what you tell it to do. Like avoiding the assassin in Codenames.

**Design insight for Axiia Cup:** Codenames is the purest "compression game." Axiia Cup is a compression game at its core — compressing a complete dialogue strategy into 1000 characters. This framing could be powerful for marketing and player education.

---

## Part 6: Digital Games with Emergent Strategy

### 6.1 CoreWar (A.K. Dewdney, 1984)

**What it is:** A programming game. Players write small programs ("warriors") in a simplified assembly language. Warriors are placed in shared memory and execute simultaneously, trying to disable each other.

**Key mechanisms:**

- **Code as competitor** — your program fights autonomously. You design it, then watch.
- **Shared address space** — both programs operate in the same memory. Attacks = writing to the opponent's code.
- **Size constraints** — warriors are tiny. Every instruction counts.
- **Evolving meta** — strategies evolved over decades: bombers, scanners, replicators, paper/scissors dynamics.

**Axiia Cup lessons:**

- **The closest mechanical predecessor to Axiia Cup.** CoreWar is literally "write code that fights autonomously in a constrained format." Replace "assembly code" with "system prompt" and "shared memory" with "shared dialogue" and you get Axiia Cup.
- **The "warrior" taxonomy could inspire prompt taxonomy.** CoreWar developed named strategies: bombers (aggressive, overwrite everything), scanners (find opponent first, then attack), replicators (copy yourself for survival). What are the analogous prompt archetypes? Aggressive persuaders? Patient listeners? Information extractors?
- **Size constraints create the game.** CoreWar warriors are tiny — this constraint is what creates strategic depth. Axiia Cup's 1000-character limit serves the same purpose.

**Design insight for Axiia Cup:** CoreWar's community developed tools to analyze warrior strategies, visualize battles, and share insights. Axiia Cup should eventually support similar analysis — letting players study their dialogue transcripts, compare strategies, and share (non-prompt) insights. This community layer extends the game's life enormously.

---

### 6.2 RoboCode (Mathew Nelson, 2001)

**What it is:** Programming game where you write Java code to control a tank in an arena. Tanks fight autonomously based on your code.

**Key mechanisms:**

- **Program then watch** — you can't intervene during the battle.
- **Sensor + actuator API** — your code decides how to respond to radar pings, bullets, wall proximity.
- **Tournament ecosystem** — active competitive scene with leagues and championships.
- **Melee and 1v1 modes** — different strategies for different formats.

**Axiia Cup lessons:**

- **The "program then watch" emotional arc is identical.** RoboCode players describe the thrill of watching their creation perform. Axiia Cup players will feel the same watching their dialogue unfold.
- **Tournament infrastructure.** RoboCode's competitive scene has Swiss tournaments, ELO ratings, league play — all concepts in Axiia Cup's roadmap.
- **The skill ceiling scales with understanding.** Beginner RoboCode bots follow simple rules. Expert bots use wave surfing, virtual bullets, and statistical targeting. Axiia Cup prompts should have similar depth — beginners give simple instructions, experts encode sophisticated dialogue strategies.

**Design insight for Axiia Cup:** RoboCode survived 20+ years because the skill ceiling is essentially infinite within a simple format. Axiia Cup's longevity depends on the same — the 1000-character prompt must support near-infinite strategic depth. The scenario system (different arenas with different rules) multiplies this depth.

---

### 6.3 AI Dungeon / Choose Your Own Adventure (genre)

**What it is:** Interactive fiction where player choices branch the narrative. AI Dungeon (2019) used GPT-2/3 to generate dynamic responses to arbitrary player input.

**Key mechanisms:**

- **Narrative branching** — each choice opens new paths.
- **Player agency within authored bounds** — the author/AI sets the world; the player acts within it.
- **Emergent storytelling** — the combination of authored constraints + player creativity produces unexpected narratives.

**Axiia Cup lessons:**

- **The scenario IS a choose-your-own-adventure framework.** The scenario author defines the world, roles, and constraints. The prompt author defines HOW their agent navigates that world. The resulting dialogue is emergent.
- **Player agency through prompt design.** You can't control what happens in the dialogue, but you can bias the probabilities through your prompt. This is "authored agency" — agency expressed through design rather than real-time control.

---

## Synthesis: Cross-Cutting Design Principles

### Principle 1: Constraint Breeds Creativity

Every great game in this survey creates depth through constraints, not features.

- Diplomacy: no dice, no randomness
- Codenames: one word, one number
- CoreWar: tiny warriors
- Go: one rule for capture
- **Axiia Cup: 1000 chars, no tools, public judge**

**Implication:** Resist adding features. The depth is already there.

### Principle 2: Design Phase > Execution Phase

The most exciting moment in these games is not the execution — it's the anticipation.

- MTG: deck building > playing the match
- BattleBots: design phase > the fight
- CoreWar: coding > watching
- StarCraft: build order > execution
- **Axiia Cup: prompt workshop > dialogue execution**

**Implication:** Invest heavily in the prompt workshop UX. That's where players spend the most cognitive energy and where the "game" really lives.

### Principle 3: Public Rules + Hidden Strategy = Emergent Meta

- Poker: everyone knows the hand rankings; strategy is in the betting
- Go: everyone knows the rules; strategy takes a lifetime
- Nomic: all rules are public; creativity is in interpretation
- **Axiia Cup: judge prompt is public; strategy is in how you write to the judge**

**Implication:** The public judge prompt is the best design decision in the spec. It creates the conditions for a metagame to emerge.

### Principle 4: Statistical Fairness Through Volume

- Poker: variance per hand, skill per thousand hands
- Werewolf: variance per game, skill per season
- SC:BW: variance per match, skill per tournament
- **Axiia Cup: variance per match, skill per Swiss tournament**

**Implication:** The design spec's "Texas Hold'em model" is exactly right. Communicate this to players explicitly — "you might lose one match, but the tournament will find the best."

### Principle 5: The Meta Cycle Sustains Engagement

- MTG: dominant deck → counter → new dominant deck
- SC:BW: dominant build → counter → patch → new meta
- Survivor: dominant alliance strategy → social counter → meta shift
- **Axiia Cup: dominant prompt strategy → counter-prompt → judge patch → new meta**

**Implication:** The multi-block format + judge versioning creates this cycle by design. This is the long-term engagement engine.

### Principle 6: Autonomous Execution Creates Unique Thrill

- BattleBots: "will my robot work?"
- CoreWar: "will my warrior survive?"
- RoboCode: "will my tank win?"
- **Axiia Cup: "will my prompt perform?"**

**Implication:** The async match execution isn't a limitation — it's the emotional core. The moment between submitting your prompt and seeing the result is peak engagement. Design the UX around this suspense.

---

## Part 7: Submit-a-Strategy Competitions

### 7.1 Axelrod's Prisoner's Dilemma Tournament (Robert Axelrod, 1984)

**What it is:** Political scientist Robert Axelrod invited game theorists to submit computer programs that play iterated Prisoner's Dilemma. Each program played every other program over 200 rounds. Programs couldn't see opponents' code — only their history of cooperate/defect moves. The winning strategy, famously, was Tit-for-Tat: cooperate first, then mirror the opponent's last move.

**Key mechanisms:**

- **Submit code, watch it compete** — participants design a strategy, submit it, and observe results. Zero intervention during execution.
- **Round-robin tournament** — every strategy plays every other strategy. Overall score = sum across all matchups.
- **Iterated interaction** — not a one-shot game. The same two programs meet repeatedly, creating room for reputation, retaliation, and forgiveness.
- **Opponent-agnostic design** — you don't know who you'll face. Your strategy must be robust to all possible opponents.
- **Emergent ecology** — the population of strategies creates an ecosystem. Tit-for-Tat won not because it beat everyone, but because it _did well enough against everyone_ and thrived in a population of diverse strategies.

**Axiia Cup lessons:**

- **This is the conceptual grandfather of Axiia Cup.** Strip away the specifics and the structure is identical: design an autonomous agent → submit → it competes against all other agents → statistical ranking.
- **"Nice" strategies won.** Tit-for-Tat never defects first. In Axiia Cup terms: prompts that focus on constructive argumentation and genuine engagement with the scenario may outperform purely manipulative or hostile prompts — especially if the judge values dialogue quality.
- **Robustness > exploitation.** Tit-for-Tat doesn't "exploit" anyone. It just cooperates and punishes defection. The best Axiia Cup prompts might similarly focus on being robust to any opponent rather than trying to exploit specific weaknesses.
- **The "shadow of the future" matters.** In iterated PD, knowing there are future rounds changes behavior (cooperation becomes rational). In Axiia Cup's 20-round dialogue, the agents' behavior in early rounds shapes what's possible in later rounds. Prompts should account for the full arc.
- **Ecological thinking.** Tit-for-Tat won because of the OTHER strategies in the tournament. An Axiia Cup player should think about the meta-population of prompts, not just their direct opponent.

**Design insight for Axiia Cup:** Axelrod's most profound finding was that simple, clear, forgiving strategies beat complex, exploitative ones. If this translates to Axiia Cup, it suggests that prompts encoding clear principles + adaptive responses will beat prompts that try to be "tricky." This is a testable hypothesis worth exploring in early playtests.

---

### 7.2 Halite (Two Sigma, 2016-present)

**What it is:** AI programming competition. Players write bots that control ships/factories on a grid, competing for resources. Matches are fully autonomous. Continuous ladder system with Elo-like ratings. Multiple seasons with different game rules.

**Key mechanisms:**

- **Continuous competitive ladder** — not a one-shot tournament. Your bot is always competing, and your rating updates in real-time.
- **Seasonal rule changes** — each Halite season introduces new game mechanics, forcing strategy reinvention.
- **Replay system** — every match is recorded and can be replayed. Players study replays to improve.
- **Tiered strategy depth** — beginners hard-code simple heuristics; experts train ML models on match data.

**Axiia Cup lessons:**

- **The replay system is critical.** Halite players improve by watching replays of their losses. Axiia Cup's dialogue transcripts serve the same purpose. Making transcripts accessible, searchable, and analyzable is key to player growth.
- **Seasonal rule changes = scenario rotation + judge patches.** Halite keeps players engaged by changing the game each season. Axiia Cup's scenario system and judge versioning serve the same purpose without needing to change core mechanics.
- **The continuous ladder model** (post-MVP) is exactly what Axiia Cup's Elo/Glicko-2 roadmap describes. Halite proves it works for "submit a strategy" games.

**Design insight for Axiia Cup:** Halite's biggest community complaint was opacity — players couldn't understand _why_ their bot lost. Axiia Cup has a massive advantage here: dialogue transcripts + judge reasoning are inherently interpretable (they're in natural language). This interpretability is a killer feature. Double down on it.

---

## Part 8: Real-World Adversarial Rhetoric

### 8.1 British Parliamentary (BP) Debate Format (WUDC)

**What it is:** The World Universities Debating Championship format. Four teams of two, assigned to proposition or opposition, must argue a motion they receive 15 minutes before the round. Evaluated by a panel of judges on argument quality, strategy, and rhetoric. The largest competitive debate format globally.

**Key mechanisms:**

- **Impromptu topics** — debaters don't choose their side or topic. They must argue whatever they're assigned.
- **Multiple roles with different strategic requirements** — Opening Government sets the frame; Closing Opposition must extend while distinguishing from their allies.
- **Panel of human judges with individual ballots** — each judge ranks independently, then the panel resolves. This averages out individual bias.
- **"Points of Information" (POIs)** — opponents can interrupt with brief challenges. You choose whether to accept them. Accepting shows confidence; rejecting too many looks weak.
- **The "burden of proof" framework** — each side has different argumentative obligations. Proposition must establish a compelling case for change; Opposition can defend the status quo or propose a counter-model.

**Axiia Cup lessons:**

- **Assigned sides = mandatory dual-role design.** BP debaters must argue either side of any motion. Axiia Cup players must write prompts for both Role A and Role B. Both test the ability to think from any position.
- **The POI mechanism suggests a dialogue micro-structure.** In Axiia Cup dialogues, the AI agents take turns. But within each turn, an agent could "challenge" a specific claim from the previous turn. Prompts that instruct agents to actively challenge weak points (like accepting POIs) might outperform prompts that just deliver monologues.
- **Panel judging for variance reduction.** BP uses multiple judges to reduce individual bias. Axiia Cup could eventually use multiple judge prompts (or multiple judge runs) for the same effect. The design spec's "statistical convergence" approach is the automated equivalent.
- **The distinction between "matter" (content) and "manner" (delivery).** BP judges score both what you say and how you say it. Axiia Cup's judge characters could similarly evaluate both argument substance and dialogue style — a prompt that makes brilliant arguments in a boring way might score lower than one with slightly weaker arguments delivered compellingly.

**Design insight for Axiia Cup:** BP debate's deepest skill is "framing" — defining the terms of the debate in a way that advantages your side. The best Axiia Cup prompts will likely include framing instructions: "In your opening, establish that this debate is about X, not Y." This is a meta-strategic layer that separates beginners from experts.

---

### 8.2 Mock Trial Competitions (AMTA format)

**What it is:** American Mock Trial Association format. College students simulate a trial — prosecution/plaintiff vs defense. Each team has attorneys and witnesses. A panel of judges (often real lawyers/judges) scores on advocacy skills, not on who "wins" the case.

**Key mechanisms:**

- **Both sides work from the same case file** — identical facts, identical evidence. Strategy is in interpretation and presentation.
- **Witness preparation** — witnesses are coached on how to answer questions, but opposing counsel's questions are unknown. Witnesses must stay "in character" while being helpful to their side.
- **Cross-examination** — the art of asking questions that force the witness to support YOUR narrative. The witness is trying to resist without breaking character or lying.
- **Scoring on advocacy, not outcome** — judges evaluate HOW you argued, not which side was more "right." A brilliant defense of a losing case scores higher than a mediocre prosecution of a winning one.

**Axiia Cup lessons:**

- **The shared case file = the shared scenario.** Both sides in mock trial work from identical materials. Both agents in Axiia Cup operate in the same scenario with the same background. Strategy is interpretation, not information advantage.
- **Witness preparation = system prompt design.** A mock trial witness is "programmed" with a character, knowledge, and response tendencies — then must perform autonomously under pressure. An Axiia Cup system prompt does exactly the same thing for an AI agent.
- **Cross-examination as dialogue strategy.** The most powerful mock trial skill is asking questions that corner the witness. Axiia Cup prompts could instruct agents to use Socratic questioning — asking questions that force the opponent into contradictions or concessions.
- **Scoring advocacy, not outcome.** This maps directly to Axiia Cup's judge system. The judge character evaluates the quality of argumentation, not just whether someone "won." A nuanced, historically-grounded argument from the "losing" side could score higher than a crude but effective argument from the "winning" side.

**Design insight for Axiia Cup:** Mock trial's most advanced technique is "theory of the case" — a single compelling narrative that explains ALL the evidence in your favor. The best Axiia Cup prompts should instruct agents to establish a "theory of the scenario" — a coherent narrative framework that makes every response reinforcing. This is fundamentally different from (and more effective than) a prompt that just lists tactics.

---

### 8.3 Moot Court / Supreme Court Oral Arguments

**What it is:** Law school competition simulating appellate oral arguments. Advocates present legal arguments to a panel of "justices" who interrupt with questions. The advocate must handle questions gracefully while advancing their argument. Based on real Supreme Court practice.

**Key mechanisms:**

- **"Hot bench" — judges actively interrupt.** You don't get to deliver a speech. The judges ask pointed questions, and your ability to answer them IS the argument.
- **Concession as strategy** — knowing when to concede a weak point to protect a strong one is a high-level skill. Refusing to concede the obvious destroys credibility.
- **The "limiting principle"** — judges always ask "where does your argument stop?" You must define boundaries for your position, or it becomes absurd.
- **Time pressure** — strict time limits force prioritization. You can't make every argument; you must choose the strongest.

**Axiia Cup lessons:**

- **The judge's post-dialogue questions ARE the "hot bench."** In Axiia Cup, after the dialogue, the judge character asks each agent questions. This is moot court's hot bench. The prompt should prepare the agent not just for the dialogue but for the interrogation afterward.
- **Concession as prompt strategy.** A prompt that instructs the agent to concede minor points while defending core positions will likely seem more credible to the judge than one that defends everything absolutely. This is a non-obvious strategic principle.
- **The "limiting principle" for prompt instructions.** Just as a moot court advocate must define the boundaries of their argument, a prompt should define what the agent DOESN'T claim, not just what it does. "Acknowledge the limitations of your position" is sophisticated prompt engineering.

**Design insight for Axiia Cup:** Moot court teaches that _how you handle adversity_ reveals more about skill than how you deliver prepared material. Axiia Cup's post-dialogue judge questions test exactly this. The most discriminating judge questions will be the ones that challenge the agent's weakest points — and the prompt that prepared the agent for this will win.

---

## Part 9: Games with Innovative Information Asymmetry

### 9.1 Inhuman Conditions (Tommy Maranges & Colt Brownstone, 2019)

**What it is:** A two-player interrogation game. One player is the Investigator; the other is secretly either a Human or a Robot. The Investigator has 5 minutes to determine which. Robots have a "condition" (a behavioral constraint, like "deny everything" or "never use first-person pronouns") they must follow without being detected.

**Key mechanisms:**

- **1v1 dialogue IS the entire game** — no board, no cards, no resources. Just a conversation.
- **Hidden behavioral constraint** — the Robot must follow a secret rule while appearing normal. The Investigator must detect anomalies.
- **Time-constrained interrogation** — 5 minutes. Every question must be information-efficient.
- **Dual asymmetry** — the Investigator knows the question space but not the answer. The Robot knows their constraint but not what the Investigator suspects.

**Axiia Cup lessons:**

- **The purest dialogue-as-game.** Inhuman Conditions strips everything away except conversation. This validates Axiia Cup's core premise that dialogue alone can sustain deep strategy.
- **Hidden constraints as scenario design.** The Robot's "condition" is essentially a hidden system prompt. Axiia Cup scenarios with "hidden goals" create the same dynamic — the agent must pursue a secret objective without being detected.
- **The interrogation dynamic.** In some Axiia Cup scenarios (like the OJ Simpson trial), one role is essentially interrogating the other. Prompts for interrogator roles could learn from Inhuman Conditions' best practices: ask open-ended questions, listen for anomalies, follow up on inconsistencies.
- **The 5-minute constraint forces efficiency.** The 10-20 turn dialogue limit in Axiia Cup serves the same function. Every turn must advance the agent's goals. "Filler" turns are wasted opportunities.

**Design insight for Axiia Cup:** Inhuman Conditions proves that constraints on the dialogue itself (behavioral rules the agent must follow) are a powerful scenario design tool. Axiia Cup scenario designers should consider "hidden behavioral constraints" that force agents to juggle visible goals with invisible rules — this creates the deepest strategic challenge for prompt writers.

---

### 9.2 Stratego (Jacques Johan Mogendorff, 1946)

**What it is:** Two-player board game. Each player secretly arranges 40 pieces (of varying ranks) on their half of the board. Pieces are hidden from the opponent. When pieces meet, the higher rank wins — but you only learn ranks through combat. Find and capture the opponent's flag.

**Key mechanisms:**

- **Hidden setup phase** — before the game begins, you arrange all your pieces without the opponent seeing. The entire game flows from this initial hidden arrangement.
- **Information revealed through interaction** — you learn an opponent's piece rank only when you attack it (or it attacks you). Gathering information costs pieces.
- **Bluffing with position** — a weak piece in a forward position implies strength. A strong piece held back implies protection of the flag.
- **The Spy** — the weakest piece can defeat the strongest (the Marshal), but loses to everyone else. High-risk, high-reward gambit.

**Axiia Cup lessons:**

- **Hidden setup = hidden prompt.** Stratego's hidden initial arrangement is structurally identical to Axiia Cup's hidden system prompts. Both create games where the pre-game design decision determines everything, and information about the opponent's design is revealed gradually through interaction.
- **Information leaks through behavior.** In Stratego, how aggressively a piece moves reveals information about its rank. In Axiia Cup dialogues, the opponent's agent's behavior reveals information about its prompt. A prompt that's aware of this — "don't reveal your strategy through early moves" — adds a layer of sophistication.
- **The Spy principle.** In Stratego, a seemingly weak piece can defeat the strongest piece under specific conditions. In Axiia Cup, a seemingly simple prompt can defeat an elaborate one if it hits the right weakness. This keeps the game accessible — you don't need a complex prompt to win, you need the RIGHT prompt.
- **Positional bluffing.** Prompts can instruct agents to feint — appear to concede a point to set up a stronger argument later, or appear aggressive early to create space for a subtle move later.

**Design insight for Axiia Cup:** Stratego's enduring appeal is that EVERY game starts differently because of the hidden setup. Every Axiia Cup match starts differently because of hidden prompts. The combinatorial space of possible prompts is vastly larger than Stratego's arrangement space — this means Axiia Cup has essentially infinite replayability built into its core structure.

---

### 9.3 Blood on the Clocktower (Steven Medway, 2022)

**What it is:** Social deduction game for 5-20 players. One player is the Storyteller (not a player — a moderator/judge). Hidden roles with unique abilities. Evil team knows each other; good team doesn't. But the key innovation: the Storyteller has DISCRETION.

**Key mechanisms:**

- **The Storyteller has interpretive power** — unlike Werewolf's moderator (who just follows rules), the Storyteller can bend information. A Storyteller can give a Drunk player wrong information, or modify the game state to create better drama.
- **Dead players keep playing** — you still get to talk and vote after death (but with only one remaining vote). This prevents elimination = boredom.
- **Rich role diversity** — dozens of unique roles with interlocking abilities create different game dynamics each session.
- **"Droisoning" (Drunk/Poisoned)** — your ability might be giving you wrong information and you don't know it. This creates fundamental uncertainty.
- **Nominations are public, votes are sequential** — the accusation process is structured theater.

**Axiia Cup lessons:**

- **The Storyteller = the Judge Character.** This is the most direct parallel to Axiia Cup's judge design. Blood on the Clocktower's Storyteller isn't a neutral arbiter — they have a personality, they make judgment calls, they shape the experience. Axiia Cup's judge characters (Isabella the Queen, Qin Xiaogong) do the same.
- **Interpretive discretion in judging.** The Storyteller's discretion means the "rules" aren't fully deterministic. LLM judging has the same property — the judge prompt sets the framework, but the actual evaluation involves interpretation. This is a feature, not a bug, because it rewards _reading the judge_ as a skill.
- **Dead players keep playing = eliminated players stay engaged.** In Axiia Cup's Swiss format, nobody is eliminated. But the principle applies to the post-match experience — after your match, can you still learn, analyze, discuss? The community layer should keep players engaged beyond their own matches.
- **The uncertainty principle.** Droisoning means you can never be 100% sure your information is correct. LLM judge variance means you can never be 100% sure one match result reflects the true skill difference. Both games handle this by making uncertainty a feature — you play THROUGH uncertainty, not around it.

**Design insight for Axiia Cup:** Blood on the Clocktower's genius is that the Storyteller is simultaneously a judge AND a game designer — they shape each game in real-time to maximize drama and engagement. Axiia Cup's judge characters could eventually be designed with similar dramatic instincts: judge prompts that don't just score mechanically but that ask the most dramatically interesting questions, creating memorable moments in the transcript.

---

## Part 10: Negotiation & Asymmetric Power Games

### 10.1 Cosmic Encounter (Peter Olotka et al., 1977)

**What it is:** Sci-fi negotiation game. Each player has a unique alien power that breaks the base rules in a specific way. Combat involves inviting allies, playing cards, and negotiating. The alien powers create wildly asymmetric matchups.

**Key mechanisms:**

- **Asymmetric alien powers** — every player has a fundamentally different ability. The Virus multiplies attack power. The Pacifist wins by playing zero. The Oracle sees the opponent's card before choosing.
- **Alliance invitation as negotiation** — before combat, both sides invite allies. The politics of who you invite (and who refuses) is the game.
- **Negotiation cards** — instead of fighting, both players can play "negotiate" cards, forcing a deal. If only one plays negotiate, they lose the battle but steal cards from the winner.
- **Shared victory is possible** — multiple players can win simultaneously. This changes the negotiation calculus entirely.

**Axiia Cup lessons:**

- **Asymmetric powers = asymmetric scenario roles.** Axiia Cup scenarios have Role A and Role B with different objectives, just as Cosmic Encounter gives each player different abilities. The strategic challenge is designing for your specific role's affordances.
- **The "negotiate vs fight" card choice.** Cosmic Encounter forces a binary choice each combat: fight or negotiate. Axiia Cup prompts implicitly make a similar choice: should the agent be adversarial (fight) or seek common ground (negotiate)? The answer depends on the judge's values and the scenario's structure.
- **Alliance dynamics (future consideration).** If Axiia Cup ever expands beyond 1v1 to multi-party scenarios, Cosmic Encounter's alliance mechanics offer a template. Who do you ally with? When do you betray?
- **The "Pacifist wins by losing" principle.** In Cosmic Encounter, some aliens win by NOT fighting. In Axiia Cup, some scenarios might reward agents that appear to concede while actually winning the judge's favor. The prompt that instructs an agent to "lose gracefully" might score higher than one that fights dirty.

**Design insight for Axiia Cup:** Cosmic Encounter's alien powers create a game where you must understand not just your own ability but how it interacts with every other ability. In Axiia Cup, you must understand not just your prompt strategy but how it interacts with the space of possible opponent prompts. This interaction-awareness is the advanced skill layer.

---

### 10.2 Twilight Struggle (Ananda Gupta & Jason Matthews, 2005)

**What it is:** Two-player card-driven game simulating the Cold War. USA vs USSR. Each card represents a historical event and can be played for operations points OR for its event — but if you play an opponent's event card for operations, the event still triggers. This creates agonizing dilemmas.

**Key mechanisms:**

- **Dual-use cards** — every card can be used two ways. Playing your opponent's cards triggers their events while giving you the operations. This is a unique tension: using a resource helps your opponent.
- **Scoring is area-majority in contested regions** — you compete for influence in Asia, Europe, Middle East, etc. The "map" is the board state of global influence.
- **The DEFCON track** — nuclear war ends the game (and the player who triggered it loses). This creates a "don't push too hard" restraint on aggression.
- **Headline phase** — simultaneous card play at the start of each turn. You commit before seeing your opponent's choice.

**Axiia Cup lessons:**

- **The dual-use card dilemma maps to prompt character allocation.** In Twilight Struggle, every card played is a trade-off — you're always giving something up. In a 1000-character prompt, every character spent on one instruction is not spent on another. Offensive tactics vs defensive preparation. Specific instructions vs general principles.
- **The DEFCON restraint = scenario boundary constraints.** Twilight Struggle says "you can push hard, but push too hard and you lose instantly." Axiia Cup scenarios have boundary constraints (no time-travel, no breaking character). A prompt that pushes boundaries too aggressively might trigger the equivalent of nuclear war — disqualification or judge penalty.
- **Headline as simultaneous commitment.** Both players submit prompts before seeing the opponent's. Both Twilight Struggle players play headlines simultaneously. This creates the need for robust strategies that work regardless of what the opponent does.
- **Tempo and timing.** Twilight Struggle experts talk about "tempo" — knowing when to push and when to hold back. Over 20 dialogue turns, prompt-designed tempo matters too. "Start gentle, escalate in the middle, close strong" is a tempo strategy.

**Design insight for Axiia Cup:** Twilight Struggle's deepest lesson is that constraints on aggression create richer strategy than unlimited aggression. Axiia Cup's boundary constraints (must stay in character, historical accuracy, judge penalizing manipulative tactics) serve this same purpose. They IMPROVE the game by rewarding nuance over brute force.

---

### 10.3 Diplomacy's PRESS Variant (email Diplomacy, 1990s-present)

**What it is:** Not a separate game, but a significant variant of Diplomacy played by email (or forum) over days/weeks per turn. "PRESS" refers to the communication rules. Variants include No Press (zero communication), White Press (all messages public), Gray Press (anonymous messages allowed), and Black Press (you can forge messages pretending to be another player).

**Key mechanisms:**

- **Communication rules as game parameters** — the SAME game with different communication rules produces radically different strategies.
- **Written vs verbal negotiation** — email Diplomacy forces you to write your negotiations. Writing is permanent, searchable, and more carefully constructed than speech.
- **Asynchronous negotiation** — you send a message and wait for a response. The timing of your responses is itself a signal.
- **Gray/Black Press as information warfare** — anonymous and forged messages create profound uncertainty about who said what and who can be trusted.

**Axiia Cup lessons:**

- **Communication rules define the game.** Diplomacy PRESS variants prove that the same core game feels completely different under different communication rules. Axiia Cup's "pure text, no tools, fixed scenario" communication rules define the strategic landscape just as much as the scenario itself.
- **Written > spoken for this format.** Email Diplomacy players craft their messages more carefully than face-to-face players. AI agents with system prompts are the extreme version of this — the "communication" is pre-crafted with maximum care. This validates the format.
- **Asynchronous is a feature.** Email Diplomacy's asynchronous nature allows deeper strategic thinking. Axiia Cup's async match execution serves the same purpose for the DESIGN phase — players have unlimited time to craft their prompts.
- **Communication constraints as scenario parameters.** Future Axiia Cup scenarios could experiment with constraints: "Agent must respond within 100 characters per turn" or "Agent cannot ask questions" or "Agent must speak in verse." Each constraint creates a different game from the same scenario.

**Design insight for Axiia Cup:** Diplomacy PRESS variants show that varying the COMMUNICATION rules is one of the highest-leverage design knobs. Axiia Cup should eventually experiment with this: same scenario, different dialogue rules. This multiplies content without requiring new scenarios.

---

## Part 11: Puzzle & Pattern Games

### 11.1 Scrabble Tournament Play (Alfred Butts, 1938; competitive scene 1970s-present)

**What it is:** The same Scrabble, but at the competitive level it's a completely different game: board geometry matters more than vocabulary, "rack management" (keeping good leftover tiles) is crucial, and positional play (controlling access to premium squares) dominates.

**Key mechanisms:**

- **Constrained vocabulary as resource** — you work with a random 7-tile hand, not the full dictionary. Strategy emerges from constraints.
- **Positional control** — expert Scrabble is about board geography: opening/closing premium square access, controlling the board's "hot zones."
- **Rack management** — after playing a word, you draw new tiles. Experts plan for FUTURE turns by keeping versatile tiles (S, blank, common vowels) while scoring now.
- **Memorization as skill floor, strategy as skill ceiling** — knowing all valid 2-letter words is table stakes. Winning comes from positional judgment.

**Axiia Cup lessons:**

- **Vocabulary constraint as game design.** Scrabble's 7-tile hand is like Axiia Cup's 1000-character limit. The constraint transforms a trivial task (make a word / write instructions) into a deep strategic challenge.
- **"Rack management" = character budget management.** Expert Scrabble players don't just maximize the current word — they plan for future turns. Expert prompt writers shouldn't just maximize one instruction — they should reserve characters for defensive clauses, fallback strategies, and post-dialogue preparation.
- **Positional play = conversational positioning.** Scrabble experts control the board's shape. Axiia Cup prompts should instruct agents to control the CONVERSATION's shape — steer topics, set frames, control pacing.
- **The skill floor vs ceiling distinction.** In Scrabble, memorizing word lists is the floor; positional mastery is the ceiling. In Axiia Cup, writing basic instructions is the floor; crafting prompts that create adaptive, situation-aware dialogue strategies is the ceiling.

**Design insight for Axiia Cup:** Tournament Scrabble's community developed tools like "leave analysis" (evaluating what tiles you keep) and "simulation" (testing positions against random future draws). Axiia Cup should develop analogous tools: prompt analysis (what does your prompt spend characters on?), simulation against diverse opponent strategies, etc.

---

### 11.2 Cryptid (Hal Duncan & Ruth Veevers, 2018)

**What it is:** A pure deduction game for 3-5 players. Each player has ONE clue about the location of a cryptid on a map (e.g., "within one space of water"). No player has enough information alone. Through careful questioning, you must deduce the location before others do.

**Key mechanisms:**

- **Minimal private information, maximum public inference** — each player knows one fact. The game is combining public evidence (others' yes/no answers) with your private fact to narrow the possibilities.
- **Questioning as action** — your turn is asking another player "could the cryptid be HERE?" They must answer truthfully. The art is choosing questions that reveal maximum information to you while revealing minimum information to others.
- **Negative space reasoning** — what someone DOESN'T say or where they DON'T place a cube is as informative as positive evidence.
- **Information racing** — everyone builds toward the same answer, but from different starting knowledge. Speed of deduction matters.

**Axiia Cup lessons:**

- **Questioning as strategic action.** Cryptid's core mechanic — choosing what to ask — maps directly to the judge's post-dialogue questions. The judge asks questions designed to reveal the quality of each agent's reasoning. But the deeper lesson is for PROMPTS: agents that ask strategic questions of their OPPONENT during dialogue can extract information while revealing little.
- **Negative space in dialogue.** What an opponent's agent DOESN'T say reveals information about its prompt's priorities. An advanced prompt might include instructions like "note what the opponent avoids discussing — that reveals their weak points."
- **Inference from behavior.** Cryptid teaches you to infer private information from observable actions. Axiia Cup dialogue transcripts contain observable behavior from which you can infer the opponent's prompt strategy. Post-match analysis (studying what the opponent's agent did and reverse-engineering its prompt) is a meta-skill.

**Design insight for Axiia Cup:** Cryptid's elegance comes from making information GATHERING the gameplay, not information HAVING. Axiia Cup scenarios could be designed so that the DIALOGUE is an information-gathering process — each agent trying to understand the other's position while building its own case. This makes the conversation inherently strategic, not just performative.

---

## Updated Synthesis: New Principles from Round 2

### Principle 7: Robustness Beats Exploitation (Axelrod / Stratego)

- Tit-for-Tat won by being robust, not clever
- Stratego's best setups are resilient to diverse attacks
- **Axiia Cup: prompts that work against any opponent will likely beat prompts optimized for one**

**Implication:** Player education should emphasize robustness over cleverness. "Write a prompt that works against everything" is better advice than "write a prompt that counters the meta."

### Principle 8: The Transcript Is the Learning Tool (Halite / Mock Trial)

- Halite's replay system drove player improvement
- Mock trial teams review trial recordings obsessively
- **Axiia Cup: dialogue transcripts are the primary learning artifact**

**Implication:** Invest in transcript UX — annotation, comparison, filtering. This is how players learn and how the community develops.

### Principle 9: Framing Defines the Game (BP Debate / Moot Court / Twilight Struggle)

- BP debate's "framing" skill is about defining what the debate is ABOUT
- Moot court's "theory of the case" unifies all arguments
- Twilight Struggle's card play frames each region's narrative
- **Axiia Cup: the best prompts will define the dialogue's frame, not just participate in it**

**Implication:** Teach players about framing as an advanced skill. "Don't just argue your position — define what the conversation is about."

### Principle 10: Constraints on Aggression Create Depth (Twilight Struggle / Cosmic Encounter)

- DEFCON track punishes over-aggression
- Cosmic Encounter's negotiate cards reward cooperation
- Scenario boundary constraints limit manipulation
- **Axiia Cup: boundary constraints make the game better, not smaller**

**Implication:** Scenario designers should be bold with constraints. "The agent must remain historically accurate" is not a limitation — it's a game mechanic that rewards deeper knowledge.

---

## Part 12: Reading the Opponent — Yomi & Prediction Games

### 12.1 Yomi (David Sirlin, 2011)

**What it is:** A fighting-game-as-card-game. Two players simultaneously reveal attack, throw, block, or dodge cards. Rock-paper-scissors structure: attacks beat throws, throws beat blocks/dodges, blocks/dodges beat attacks. But each option has different payoffs, and each of 20 asymmetric characters has different strengths. The game distills fighting game mind-games into pure prediction.

**Key mechanisms:**

- **Simultaneous reveal (double-blind)** — both players commit before seeing the opponent's choice. No reaction, only prediction.
- **Unequal payoffs** — unlike pure RPS, the reward for winning with an attack is different from winning with a throw. This creates valuation puzzles: which option has the highest expected value given what you think the opponent will do?
- **Yomi layers** — the game's namesake concept (yomi = Japanese for "reading"):
  - **Layer 0:** Play the mathematically strongest option (naively).
  - **Layer 1:** Predict what the opponent will do and counter it.
  - **Layer 2:** Predict that the opponent will try to counter your most likely move, and counter THAT.
  - **Layer 3:** Predict the opponent predicting your counter-counter.
  - **Sirlin's key insight: layers cycle back after 3.** Layer 4 is equivalent to Layer 0. You only need to think 3 levels deep before it loops.
- **Character asymmetry** — each character has different combo damage, different card distributions, different special abilities. Matchup knowledge matters enormously.
- **Hand management** — cards used for combat are gone. Cards used for blocking draw replacements. Resource management adds a strategic layer on top of the reads.

**Axiia Cup lessons:**

- **The yomi layer concept applies directly to prompt meta-gaming.** In a mature Axiia Cup meta:
  - Layer 0: Write a straightforward prompt that argues your position clearly.
  - Layer 1: Anticipate that opponents will be straightforward, so write a prompt that exploits straightforward opponents (e.g., "if the opponent makes obvious arguments, redirect to deeper philosophical ground").
  - Layer 2: Anticipate that opponents anticipate exploitation, so write a robust prompt that works against exploitative AND straightforward opponents.
  - Layer 3: Anticipate adaptive opponents and build in meta-contingencies.
  - The cycle then repeats — suggesting that the deepest skill isn't thinking more layers ahead, but accurately reading WHERE on the cycle your opponent sits.
- **Unequal payoffs create real decisions.** In Yomi, blocking is safe but low-reward; attacking is risky but high-reward. In Axiia Cup prompts, "safe" instructions (be polite, stay on topic) are low-variance/low-ceiling. "Bold" instructions (take rhetorical risks, challenge the opponent aggressively) are high-variance/high-ceiling. The best prompts calibrate this risk based on the scenario and judge.
- **Character asymmetry = model asymmetry.** Choosing DeepSeek vs Kimi vs Qwen is like choosing a Yomi character — each has different strengths, weaknesses, and matchup profiles. A prompt optimized for DeepSeek's verbosity might fail on Qwen's precision.
- **Hand management = turn management.** In a 20-turn dialogue, each turn "spends" one of the agent's opportunities. A prompt that front-loads all its arguments exhausts its resources early; one that holds back key points for later turns has more to work with when it matters.

**Design insight for Axiia Cup:** Sirlin's most profound observation is that yomi layers cycle after 3. This means the meta-game has a natural rhythm — it doesn't spiral into infinite regress. For Axiia Cup, this suggests the competitive meta will stabilize into a finite number of recognizable "prompt archetypes" (like Yomi characters), and the skill becomes reading which archetype your opponent is running and adapting. This is HEALTHY for competitive depth — it means the skill ceiling is about reading, not about infinite complexity.

---

### 12.2 Iterated Rock-Paper-Scissors Tournaments

**What it is:** Competitive RPS sounds trivial — it's pure chance in a single game. But iterated RPS tournaments (hundreds of rounds) reveal that humans are terrible randomizers. Patterns emerge: players tend to repeat winning moves, shift after losses, and develop "tells." World RPS Championships (yes, real) exploit these patterns.

**Key mechanisms:**

- **Pattern recognition** — detecting that an opponent throws Rock after winning, or always follows Scissors with Paper.
- **Anti-pattern play** — once you detect a pattern, exploiting it. But the opponent might detect YOUR exploitation pattern.
- **Frequency analysis** — over many rounds, deviations from 33/33/33 reveal biases.
- **The "avalanche" and other named strategies** — community-developed opening sequences designed to exploit common cognitive biases.

**Axiia Cup lessons:**

- **LLMs have "tells."** Different models have systematic biases in how they generate text — vocabulary preferences, argument structures, rhetorical patterns. A savvy Axiia Cup player studies their chosen model's "tells" and writes prompts that either suppress or exploit them.
- **Frequency analysis over many matches.** Just as RPS pattern detection requires many rounds, Axiia Cup's Swiss tournament (many matches) reveals whether a prompt is truly strong or just lucky. The statistical convergence model in the design spec is the formal version of this.
- **Anti-meta play.** If the dominant prompt strategy in the meta is "aggressive persuasion," a prompt designed specifically to beat aggressive persuaders (by being patient, absorbing their arguments, and then systematically dismantling them) is the RPS equivalent of throwing Paper because you know they'll throw Rock.

**Design insight for Axiia Cup:** The existence of competitive RPS proves that even the simplest game has depth when iterated. Axiia Cup's prompt engineering — with its vastly larger strategic space — has essentially unlimited depth when iterated across many matches and tournament blocks.

---

## Part 13: Cooperative Communication Under Constraints

### 13.1 Hanabi (Antoine Bauza, 2010)

**What it is:** A cooperative card game for 2-5 players. Players hold their cards FACING OUTWARD — you can see everyone else's cards but not your own. On your turn, you can either play a card (hoping it's correct), discard, or give a clue. Clues are constrained: you can only tell another player ALL cards of a specific color or ALL cards of a specific number. You have limited clue tokens. The goal is to collectively play cards in the correct sequence.

**Key mechanisms:**

- **Reversed information** — you see others' hands but not yours. You must rely on others to tell you what you have.
- **Constrained communication** — clues follow strict rules. You can't just say "play your second card." You must say "these cards are blue" or "these cards are 3s."
- **Implicit signaling (conventions)** — the rules constrain explicit communication, so players develop conventions. Pointing at a specific card while saying "this is a 5" might mean "play this immediately" in context.
- **Information tokens as scarce resource** — giving clues costs tokens. You can't just tell everyone everything. You must prioritize.
- **Theory of mind** — "I know she knows I know this card is important" becomes the core cognitive skill.

**Axiia Cup lessons:**

- **Constrained communication parallels the 1000-character prompt limit.** Hanabi forces you to encode maximum intent in minimum signal — exactly the compression challenge of prompt engineering. Both reward players who find efficient encodings.
- **Convention development = prompt language conventions.** Hanabi's best teams develop shared conventions for what clues "really mean." Axiia Cup's competitive community will similarly develop conventions — shared vocabulary for describing prompt strategies, recognized archetypes, standard structures.
- **The "AI Hanabi challenge" is directly relevant.** DeepMind and Facebook AI Research identified Hanabi as a major AI challenge (published in _Artificial Intelligence_, 2019) because it requires theory-of-mind reasoning — understanding what another agent knows and intends. Axiia Cup scenarios where the two agents must cooperate toward a shared goal while pursuing hidden individual goals create the SAME challenge for prompt engineers.
- **Ad-hoc coordination** — the hardest variant of Hanabi is playing with strangers (no pre-established conventions). The hardest Axiia Cup challenge is writing a prompt that works against ANY opponent prompt, without knowing what conventions or strategies the opponent is using. Both test the ability to communicate/perform with an unknown partner/adversary.

**Design insight for Axiia Cup:** Hanabi's deepest insight is that **what you DON'T say is as important as what you say.** A clue that omits a card tells you that card ISN'T the relevant color/number. An Axiia Cup prompt's silences — what it DOESN'T instruct the agent to do — shape behavior as much as explicit instructions. Advanced prompt engineering requires understanding what the model will do by DEFAULT when the prompt is silent on a topic.

---

### 13.2 Mysterium (Oleksandr Nevskiy & Oleg Sidorenko, 2015)

**What it is:** Asymmetric cooperative game. One player is the Ghost; others are Mediums. The Ghost must communicate the identity of each Medium's murder suspect using ONLY abstract art cards — no speaking, no gestures. The Mediums interpret the images and discuss among themselves.

**Key mechanisms:**

- **Unidirectional, abstract communication** — the Ghost can only send images. The Mediums must decode them. Communication flows one way through an abstract channel.
- **Shared interpretation** — Mediums discuss the Ghost's vision cards openly, creating collaborative interpretation.
- **Calibration over time** — as the game progresses, Mediums learn the Ghost's "communication style" — which aspects of images they focus on (color? shape? mood?).
- **The Ghost's hand constraint** — the Ghost draws from a random hand of vision cards. They must work with imperfect tools, finding the "least bad" card for their message.

**Axiia Cup lessons:**

- **Communication through an imperfect channel = prompting through an LLM.** The Ghost wants to communicate specific information but can only do so through abstract images. A prompt writer wants to communicate specific dialogue strategies but can only do so through natural language instructions that an LLM interprets. Both are acts of communication through a lossy, interpretive channel.
- **Calibration to the model.** Mediums learn the Ghost's style. Prompt engineers learn their model's interpretation style. A prompt that says "be assertive" means different things to DeepSeek vs Kimi, just as the same vision card means different things to different Ghost players.
- **Working with imperfect tools.** The Ghost's random hand means they can't always send the perfect message. The 1000-character limit means prompt writers can't always encode every instruction they'd like. Both force creative workarounds and prioritization.

**Design insight for Axiia Cup:** Mysterium highlights that the INTERPRETATION LAYER is where the interesting gameplay happens. The prompt is not the final product — the model's interpretation of the prompt is. This means prompt engineering is fundamentally about understanding and shaping interpretation, not about writing "correct" instructions.

---

## Part 14: Asymmetric Design Mastery

### 14.1 Root (Cole Wehrle, 2018)

**What it is:** A board game of asymmetric woodland warfare. 2-4 (up to 6 with expansions) factions compete for control of a forest. The radical innovation: each faction plays a COMPLETELY DIFFERENT GAME with different action systems, different victory conditions, and different strategic requirements.

- **Marquise de Cat (industrial):** Places buildings, produces, fights conventionally. Starts with board control and tries to hold it.
- **Eyrie Dynasties (programmatic):** Programs a decree (sequence of mandatory actions) that grows each turn. Powerful when the decree aligns with board state; collapses catastrophically when it can't be executed.
- **Woodland Alliance (insurgent):** Weak militarily but gains power from "sympathy" — converting enemy clearings through revolt. Wins through spreading ideology.
- **Vagabond (adventurer):** A single unit that moves freely, completes quests, and manipulates all factions by choosing who to ally with and who to attack.

**Key mechanisms:**

- **Radical asymmetry** — not just "different stats." Each faction has a different ACTION SYSTEM. Learning to play all four is like learning four different games.
- **Interactional balance** — balance doesn't come from symmetric power. It comes from factions keeping each other in check. The Marquise is strongest early; the Alliance is strongest late. The Vagabond is the swing vote. If the Marquise doesn't contain the Alliance, the Alliance snowballs.
- **"Reading the table" as a core skill** — you must constantly assess who's winning and adjust your play to prevent them from winning. King-making (choosing who wins by who you attack) is a feature, not a bug.
- **Cole Wehrle's design principle: asymmetry is expensive but irreplaceable.** Each faction adds enormous development cost. But the narrative depth — emergent stories of insurgency, empire, diplomacy — is only possible through radical asymmetry.

**Axiia Cup lessons:**

- **Scenario roles as "factions."** Role A and Role B in an Axiia Cup scenario are like Root factions — they have different objectives, different strategic affordances, and different optimal play styles. The requirement to design prompts for BOTH roles tests Root's "multi-faction literacy."
- **Interactional balance, not static balance.** Root's factions aren't individually balanced — they're balanced through interaction. Axiia Cup scenarios don't need to be perfectly fair to each role. If Role A has a structural advantage, the challenge is designing a Role B prompt that overcomes it — and vice versa. The asymmetry IS the challenge.
- **The Eyrie's "programmatic decree" is a direct analog to system prompts.** The Eyrie programs a sequence of actions that execute automatically. If the board state doesn't allow execution, the decree crashes. A system prompt is a programmed decree that the AI executes automatically. If the conversation goes somewhere the prompt didn't anticipate, the agent's behavior degrades — the "decree crashes." This makes the Eyrie the single best mechanical analog for Axiia Cup's prompt execution model.
- **Wehrle's insight on asymmetry cost.** Designing good asymmetric scenarios is expensive — each role needs different objectives, different affordances, different optimal strategies. But it's irreplaceable for narrative depth. Axiia Cup should invest in scenario design quality over quantity.

**Design insight for Axiia Cup:** Root proves that radical asymmetry creates the richest narrative experiences. The Columbus scenario (explorer vs queen) is inherently asymmetric — and that's its strength. Future scenarios should lean INTO asymmetry, not away from it. Perfectly symmetric scenarios would actually be LESS interesting.

---

### 14.2 Captain Sonar (Roberto Fraga & Yohan Lemonnier, 2016)

**What it is:** Real-time team submarine combat for 6-8 players. Two teams of 4, each operating a submarine. Each player has a different role: Captain (movement), First Mate (systems), Engineer (damage control), Radio Operator (tracking the enemy). Teams play simultaneously — no turns.

**Key mechanisms:**

- **Role specialization under time pressure** — each role has different information and different responsibilities. The Radio Operator tracks the enemy on a transparent sheet; the Engineer manages a damage network; the Captain makes movement calls.
- **Information asymmetry across roles** — the Radio Operator hears the enemy Captain's movement calls but doesn't know where they started. The Engineer sees the damage state but doesn't see the map. Information must flow through verbal communication within the team.
- **Simultaneous play** — both teams act at once. There are no turns. This creates chaos, miscommunication, and thrilling moments.
- **The Radio Operator as "intelligence analyst"** — they build a picture of the enemy's position from partial information (movement directions only, no starting point). This is abductive reasoning under uncertainty.

**Axiia Cup lessons:**

- **The Radio Operator role = post-match transcript analysis.** The Radio Operator hears movement calls and deduces enemy position. An Axiia Cup player reads dialogue transcripts and deduces opponent prompt strategies. Both are intelligence analysis from incomplete information.
- **Role specialization for team scenarios.** If Axiia Cup ever expands to team competition (teams designing prompts together), Captain Sonar shows how role specialization creates depth: one person could focus on offensive strategy, another on defensive contingencies, another on judge optimization.
- **Real-time chaos vs deliberate design.** Captain Sonar's real-time play creates productive chaos. Axiia Cup's async format creates deliberate design. These are opposite ends of the same spectrum. The contrast highlights that Axiia Cup's deliberate design phase is its key differentiator — you have unlimited time to think, unlike any real-time game.

**Design insight for Axiia Cup:** Captain Sonar's Radio Operator proves that "intelligence from partial signals" is a deeply engaging gameplay loop. Axiia Cup should lean into this: give players tools to analyze their match transcripts, compare patterns across matches, and build intelligence on the meta. The post-match analysis phase can be as engaging as the design phase.

---

## Part 15: Meta-Game-as-Game & Adaptive Strategy

### 15.1 Dominion (Donald X. Vaccarino, 2008)

**What it is:** The first deck-building game. Players start with identical 10-card decks and buy cards from a shared market ("Kingdom") to improve their decks during the game. The innovation: deck construction IS the game, not a pre-game activity.

**Key mechanisms:**

- **Deck building as real-time strategy** — unlike MTG where you build a deck before the game, Dominion's deck evolves during play. Every purchase decision shapes your future capabilities.
- **The Kingdom as shared puzzle** — each game uses 10 randomly selected card types from a larger pool. The specific combination defines the strategic landscape. The same player must adapt to radically different card combinations each game.
- **Engine building** — expert Dominion is about constructing a "card engine" — a deck that cycles efficiently, generates resources, and scores points. The engine's design is the strategy.
- **The "greening" pivot** — you must switch from building your engine to buying victory point cards (which clog your engine). Timing this pivot is the game's deepest decision.
- **Donald X. Vaccarino's core insight:** "What if the metagame was the entire game?" — the process of constructing your strategy IS the gameplay, not preparation for it.

**Axiia Cup lessons:**

- **Dominion's deck = prompt iteration across blocks.** In the multi-block format (post-MVP), players revise prompts between blocks. Each revision is a "purchase" that changes the prompt's capabilities. The prompt evolves, just like a Dominion deck.
- **The Kingdom as scenario.** Each Dominion game's random Kingdom creates a unique puzzle. Each Axiia Cup scenario creates a unique strategic landscape. The skill is adapting your approach to the specific landscape, not applying a universal formula.
- **Engine building = prompt architecture.** Expert Dominion players don't just buy good cards — they build engines where cards work together synergistically. Expert prompt writers don't just list good instructions — they build architectures where instructions reinforce each other. "Set the frame → build the argument → anticipate counterarguments → prepare for judge questions" is a prompt engine.
- **The "greening" pivot = the dialogue pivot.** In Dominion, you must switch from building to scoring at the right moment. In a 20-turn dialogue, there's a pivot point where the agent should shift from building its case to closing its argument. Timing this pivot (through prompt instructions) is an advanced skill.
- **Vaccarino's insight applies directly:** Axiia Cup's real game IS the meta-game. The prompt workshop isn't preparation for the game — it IS the game. Embrace this.

**Design insight for Axiia Cup:** Dominion's random Kingdom selection means no two games play the same. Axiia Cup's scenario system serves the same purpose. But Dominion also teaches that TOO MANY Kingdom cards creates decision paralysis. Axiia Cup should keep scenario count manageable (each deeply designed) rather than flooding players with dozens of shallow scenarios.

---

### 15.2 Spyfall (Alexandr Ushan, 2014)

**What it is:** Social deduction for 3-8 players. All players receive a card showing the same location (e.g., a submarine, a hospital) — except one player, the Spy, who doesn't know where they are. Players take turns asking each other questions. The Spy tries to figure out the location from the questions and answers; the other players try to identify the Spy from their vague/incorrect answers.

**Key mechanisms:**

- **Reverse information asymmetry** — most social deduction games give the "bad guy" more information. Spyfall inverts this: the Spy has LESS information and must bluff with nothing.
- **Questions as dual-purpose tools** — when you ask a question, you're both testing the other player AND revealing information about the location (to the Spy). Every question leaks information in both directions.
- **The "Goldilocks question"** — questions must be specific enough to test knowledge but vague enough not to give away the location. "Is the music loud?" reveals you're at a concert. "Do people go here?" reveals nothing. The skill is finding the middle.
- **Time pressure** — an 8-minute timer prevents infinite deliberation.

**Axiia Cup lessons:**

- **Questions that reveal by asking.** In Spyfall, the act of questioning exposes information. In Axiia Cup dialogues, the act of arguing a position exposes your strategy. A prompt that's aware of this — "don't reveal your core argument too early; build to it" — plays the information game.
- **The Goldilocks question maps to prompt specificity.** A prompt that's too specific ("say exactly these words in turn 3") is brittle. A prompt that's too vague ("be persuasive") gives no strategic guidance. The skill is finding the Goldilocks level of specificity — enough structure to shape behavior, enough flexibility to adapt.
- **Bluffing from a position of ignorance.** The Spy must pretend to know the location. In some Axiia Cup scenarios, an agent might need to argue a position it doesn't "naturally" support (e.g., a model prompted to argue for an unpopular position). The prompt must equip the agent to bluff convincingly — to argue a position persuasively even when the model's training data might bias it otherwise.
- **Dual-purpose dialogue turns.** Every Spyfall question serves two purposes (testing and revealing). Every Axiia Cup dialogue turn should serve two purposes: advancing the agent's argument AND extracting information about the opponent's position/strategy.

**Design insight for Axiia Cup:** Spyfall's deepest lesson is that EVERY communicative act in a strategic context is simultaneously an attack and a vulnerability. Axiia Cup players should understand that their agent's every statement both advances their case and exposes their strategy. The best prompts optimize both dimensions.

---

### 15.3 The Resistance / Avalon (Don Eskridge, 2009 / 2012)

**What it is:** Social deduction for 5-10 players. Hidden roles: some players are Resistance (good), some are Spies (evil). The game plays over 5 missions. Each round, a leader proposes a team; everyone votes to approve/reject; if approved, the team goes on a mission; Spies can secretly sabotage. Avalon adds Merlin (good player who knows the Spies) and the Assassin (Spy who can kill Merlin for a comeback win).

**Key mechanisms:**

- **Voting as information** — every team approval/rejection vote is public. Voting patterns reveal allegiances — or create deceptive signals.
- **Sequential team proposals** — leaders rotate. WHO you put on teams, and who you reject, carries information.
- **The "mission fail" as hard evidence** — if a mission fails, at least one Spy was on the team. This creates a logical constraint that reduces the possibility space.
- **Avalon's Merlin meta** — Merlin knows everything but must be subtle. If Merlin is too obvious, the Assassin kills them. This creates a "hidden expert" dynamic: the most knowledgeable player must moderate their influence to survive.

**Axiia Cup lessons:**

- **Voting as information maps to dialogue pattern analysis.** In Avalon, you watch how people vote and infer their allegiance. In Axiia Cup, you watch how an agent argues and infer its prompt strategy. Both are inference from behavioral patterns.
- **The Merlin dilemma = the "too good" prompt problem.** A prompt that's too perfectly optimized for the judge might be detectable — opponents could study its behavior patterns from previous matches and develop counter-strategies. Like Merlin, the best strategy might be "strong but not obviously strong" — winning through consistent quality rather than flashy exploitation.
- **Sequential proposal = turn-by-turn argumentation.** Each Resistance team proposal builds on previous ones. Each dialogue turn builds on previous turns. The agent's prompt should include awareness of SEQUENCE — "begin by establishing common ground, then introduce your core argument in the middle turns, then close with your strongest point."
- **Hard evidence (mission fails) vs soft evidence (voting patterns).** In Axiia Cup, some dialogue elements are "hard evidence" (factual claims the judge can verify) and some are "soft evidence" (rhetorical style, emotional tone). Prompts should instruct agents to provide hard evidence when possible and strong soft evidence when not.

**Design insight for Axiia Cup:** Avalon's Merlin teaches that KNOWLEDGE IS A LIABILITY when it makes you a target. In Axiia Cup, a dominant prompt strategy becomes a target — if everyone knows your approach, they can counter it. This creates natural incentive for strategic diversity and innovation in the meta.

---

## Part 16: Scenario Design Lessons from RPGs & Competition Formats

### 16.1 Encounter Design Theory (from Tabletop RPGs)

**What it is:** Not a specific game, but the accumulated wisdom of 50 years of TTRPG game master practice on how to design compelling adversarial encounters. Key sources: Ben Riggs' _Encounter Theory_, The Angry GM's encounter design series, and the Gnome Stew design community.

**Key principles from RPG encounter design:**

**a) The "Dramatic Question" Framework**
Every good encounter is organized around a dramatic question: "Can the players escape the flooding dungeon?" "Will the diplomat convince the king?" The encounter ends when the question is answered. Without a clear dramatic question, encounters feel aimless.

**Axiia Cup application:** Every scenario should have a crystal-clear dramatic question. "Can Columbus convince Isabella to fund the expedition?" "Can the reformer win the court debate?" This question should be what the judge evaluates — not abstract "argumentation quality" but a specific dramatic outcome.

**b) Encounter Taxonomy: Combat / Social / Exploration / Puzzle**
RPG encounters fall into types, each with different design requirements:

- **Combat** — clear win/lose, tactical options, resource depletion
- **Social** — NPC motivation, information exchange, persuasion
- **Exploration** — discovery, navigation, risk assessment
- **Puzzle** — logic, creativity, lateral thinking

**Axiia Cup application:** Current Axiia Cup scenarios are primarily "social encounters" — persuasion, argumentation, negotiation. But scenario designers could incorporate puzzle elements (the agent must deduce something from the dialogue), exploration elements (the agent must discover the opponent's hidden goal), or even "combat" elements (structured point-scoring attacks/defenses). This taxonomy expands the design space.

**c) The "Three Clue Rule"**
For any conclusion you want the players to reach, include at least three clues pointing to it. One clue will be missed. One will be misinterpreted. The third will work. This accounts for human (and LLM) fallibility.

**Axiia Cup application:** Judge questions should be designed with the "three clue rule" in mind — if a judge needs to determine whether an agent understood a historical concept, the question should give three opportunities to demonstrate understanding. This reduces the chance that a capable agent fails due to a single poorly-worded question.

**d) "Positive Start" vs "Neutral Start" vs "Negative Start"**
Where players begin in an encounter shapes the entire experience. A positive start (players have an advantage) creates confidence. A negative start (players are disadvantaged) creates tension. A neutral start (equal footing) creates a fair contest.

**Axiia Cup application:** Scenario design can use starting conditions to create different experiences. A scenario where Role A starts with the initiative (speaks first, sets the frame) is a "positive start" for A. A scenario where both roles respond to a shared prompt is "neutral." A scenario where one role must defend against an established accusation is "negative start." Each creates different strategic requirements.

---

### 16.2 Chatbot Arena / LLM Competition Formats (LMSYS, 2023-present)

**What it is:** The existing landscape of LLM evaluation competitions, primarily Chatbot Arena by LMSYS. Users submit prompts, two anonymous models respond, and the user votes on which is better. Over 6 million votes produce Elo-like rankings.

**Key mechanisms:**

- **Crowdsourced pairwise comparison** — the simplest possible evaluation: "which is better?" Binary choice, no rubric.
- **Anonymized models** — users don't know which model they're rating, preventing brand bias.
- **Elo rating from pairwise results** — the same mathematical system used in chess, and planned for Axiia Cup.
- **Auto-Arena variant** — LLM agents engage in multi-round "peer battles" around a query, then a committee of LLM judges determines the winner. This is the closest existing system to Axiia Cup's structure.

**Axiia Cup differentiation (critical for positioning):**

- **Chatbot Arena evaluates MODELS. Axiia Cup evaluates HUMANS.** This is the fundamental difference. Arena asks "which model is better?" Axiia Cup asks "which human is a better prompt engineer?"
- **Arena has no strategic interaction.** Models just answer a prompt independently. Axiia Cup has adversarial dialogue — the two agents interact, creating emergent dynamics.
- **Arena's evaluation is passive (user votes). Axiia Cup's evaluation is active (judge character asks questions).** The judge's post-dialogue interrogation creates a second phase that tests depth, not just surface quality.
- **Auto-Arena's "peer battle" format is the closest to Axiia Cup** but uses LLM judges without character personas, and evaluates models, not prompt-crafting skill.

**Design insight for Axiia Cup:** Axiia Cup should position itself CLEARLY against Chatbot Arena: "They rank models. We rank minds." The Arena evaluates AI capability. Axiia Cup evaluates human creativity in directing AI. This distinction is the entire value proposition.

---

## Updated Synthesis: Principles from Round 3

### Principle 11: Yomi Layers Cycle — Depth Is Finite and Learnable (Yomi / Iterated RPS)

- Prediction layers cycle after 3 levels
- The meta-game converges to recognizable archetypes
- **Axiia Cup: the prompt meta will stabilize into a finite set of recognizable strategies, and the skill becomes reading which one your opponent is running**

**Implication:** This is encouraging for competitive health. The game won't spiral into impenetrable complexity. New players can learn the archetype landscape and start making reads quickly.

### Principle 12: Silence Speaks — What You Don't Say Shapes Behavior (Hanabi / Mysterium / Spyfall)

- Hanabi: omitted clues carry information
- Mysterium: the Ghost's constrained channel forces creative interpretation
- Spyfall: every question leaks information both ways
- **Axiia Cup: a prompt's silences (what it DOESN'T instruct) shape agent behavior as much as explicit instructions**

**Implication:** Advanced prompt engineering is as much about understanding model defaults (what happens when you're silent) as about writing instructions. Player education should cover this "negative space" skill.

### Principle 13: Radical Asymmetry Creates Narrative Depth (Root / Captain Sonar / Cosmic Encounter)

- Root's factions play completely different games
- Captain Sonar's roles have completely different information
- **Axiia Cup: scenario roles should be DEEPLY different, not superficially different**

**Implication:** The best Axiia Cup scenarios will have roles that require fundamentally different prompt architectures — not just "argue for" vs "argue against" but roles with different information, different tools, different win conditions.

### Principle 14: The Meta IS the Game (Dominion / The Resistance)

- Dominion made deck-building the game, not pre-game prep
- The Resistance makes meta-reading the game, not deduction
- **Axiia Cup: prompt iteration across tournament blocks IS the game. The tournament isn't just evaluation — it's the playing field.**

**Implication:** The multi-block format (post-MVP) transforms Axiia Cup from a one-shot evaluation into an actual game with adaptation, learning, and meta-evolution. This is the feature that creates long-term engagement.

---

## Part 17: Pure Bluffing — Minimalist Games of Reads

### 17.1 Skull (Hervé Marly, 2011)

**What it is:** A bluffing game stripped to its absolute essence. Each player has 4 discs — 3 flowers and 1 skull. Players take turns placing discs face-down in a personal stack. At any point, a player can bid instead of placing: "I can flip N discs without hitting a skull." Others can outbid or pass. The highest bidder must flip discs — starting with their OWN stack first, then choosing others. Hit a skull? You permanently lose a disc.

**Key mechanisms:**

- **Extreme minimalism** — 4 components per player. No text, no stats, no resources beyond the discs themselves. The entire game is psychological.
- **Self-entrapment** — you must flip YOUR OWN stack first. So if you placed your skull, you can't bid safely. But if you DIDN'T place your skull, others know your stack is safe and factor that into their bids. Every placement creates a commitment that constrains your future options.
- **Escalating asymmetry from attrition** — losing a disc permanently changes your odds. A player with 2 discs (1 flower, 1 skull) is a 50/50 minefield. A player with 3 flowers is always safe. The game creates its own evolving landscape.
- **Social reading as the ONLY skill** — there is no hidden strategy, no complex math, no optimization. The ONLY thing that matters is reading people.

**Axiia Cup lessons:**

- **The value of irreducible simplicity.** Skull proves that a game with essentially zero mechanical complexity can sustain deep engagement. Axiia Cup's format — 1000 chars, no tools, fixed scenarios — should be valued for its simplicity. The strategic depth comes from the human element, not mechanical complexity.
- **Self-entrapment as prompt design.** In Skull, placing your skull commits you to a constraint you can't undo. In prompt design, including a specific instruction commits the agent to behavior that might become disadvantageous. "Always be aggressive" might backfire against a patient opponent. Like Skull, every design choice is a commitment with consequences.
- **Attrition creates asymmetry over time.** In a multi-block tournament, players who lose early rounds carry "damage" — less confidence, less tournament standing, possibly less insight into the meta. But like Skull's damaged players who become unpredictable minefields, tournament underdogs can be dangerous precisely BECAUSE they have nothing to lose and experiment wildly.

**Design insight for Axiia Cup:** Skull's genius is that it creates infinite depth from almost nothing. The lesson for Axiia Cup: don't add complexity to create depth. The 1000-character prompt constraint, the fixed scenario, the public judge — these aren't limitations to overcome, they're the raw materials for infinite strategic depth. Less is more.

---

### 17.2 Coup (Rikki Tahta, 2012)

**What it is:** Bluffing game for 2-6 players. Each player has 2 face-down character cards from a deck of 5 roles (Duke, Assassin, Captain, Ambassador, Contessa), with 3 copies of each. On your turn, you take an action — some actions are universal, others require a specific character. The key: you can CLAIM any character regardless of what you actually hold. Anyone can challenge your claim. If challenged and lying, you lose a card. If challenged and truthful, the challenger loses a card.

**Key mechanisms:**

- **Claim-and-challenge as core loop** — the entire game revolves around making claims about your identity and deciding whether to challenge others' claims. Every action is a declaration ("I am the Duke, I take 3 coins") that can be interrogated.
- **Probabilistic reasoning** — with 15 cards total and only 2 per player, you can reason about probabilities. If you hold 2 Dukes, there's only 1 left — making it less likely another player is the Duke.
- **Escalating risk** — losing a card halves your capability AND reveals information. With 1 card left, one wrong challenge eliminates you.
- **The "truthful bluff"** — sometimes the strongest play is claiming a character you actually have, because the action is so strong that opponents assume it MUST be a bluff.

**Axiia Cup lessons:**

- **Claim-and-challenge as dialogue meta-game.** In Coup, every action is a claim that can be challenged. In Axiia Cup dialogues, every argument is implicitly a claim that can be challenged by the opponent. A prompt that instructs the agent to actively challenge the opponent's weakest claims — like calling a bluff in Coup — creates pressure.
- **The "truthful bluff" principle.** Sometimes the most powerful prompt strategy is the most obvious one — so obvious that opponents assume you won't use it. A prompt that straightforwardly engages with the judge's stated criteria might seem "too simple," causing opponents to over-engineer their counters. Simplicity as a bluff.
- **Probabilistic reasoning about opponent prompts.** In Coup, you reason about card distributions. In Axiia Cup, you reason about the space of likely opponent prompts. "Most players will probably try to be aggressive in this scenario, so I'll write a prompt that handles aggression gracefully." This is the same kind of probabilistic reasoning.
- **Information revealed through elimination.** In Coup, losing a card reveals it. In Axiia Cup, each match's dialogue transcript reveals information about your prompt's behavior. Over a Swiss tournament, opponents accumulate information about your approach — creating escalating vulnerability, just like losing cards in Coup.

**Design insight for Axiia Cup:** Coup teaches that the most interesting moments come from the CHALLENGE decision — do you call the bluff or let it go? Axiia Cup's post-dialogue judge questions are the "challenge" mechanism. The judge probes: "Did you really understand the historical context, or were you bluffing with surface-level rhetoric?" The prompt that prepares an agent for these challenges — with genuine depth rather than surface performance — wins the Coup.

---

### 17.3 Sheriff of Nottingham (Sérgio Halaban et al., 2014)

**What it is:** Bluffing + negotiation game for 3-6 players. Players are merchants trying to smuggle goods past the Sheriff (a rotating role). Each turn, you place cards in a bag and declare what's inside ("4 apples"). You MUST declare only one type of legal good and the correct COUNT, but you can lie about the TYPE and include illegal contraband. The Sheriff decides whether to inspect. If you're honest, the Sheriff pays YOU a penalty. If you're lying, YOU pay the Sheriff.

**Key mechanisms:**

- **Asymmetric inspection** — the Sheriff has a limited ability to inspect (if you inspect an honest merchant, you pay a penalty). This creates a cost to suspicion and a reward for trust.
- **Negotiation during inspection** — before deciding to inspect, the Sheriff can negotiate. Merchants can bribe the Sheriff ("Let my bag through and I'll give you 5 gold"). The Sheriff can threaten ("Let me look or I'll inspect you every time"). This negotiation is freeform and binding.
- **Partial truthfulness required** — you must state the correct COUNT of cards. So if you have 5 cards, you say "5 apples" even if 2 of them are contraband. This creates a specific kind of constrained deception.
- **Reputation dynamics** — the Sheriff role rotates. If you inspect everyone, they'll inspect YOU when it's their turn as Sheriff. Reputation matters across rounds.

**Axiia Cup lessons:**

- **Asymmetric inspection cost = challenge cost.** In Sheriff, inspecting an honest merchant costs the Sheriff. In Axiia Cup, if a judge question reveals that both agents were equally competent, the question was "wasted" — it didn't differentiate. Judge questions should be designed to have high discriminating power, like a Sheriff who inspects strategically.
- **Negotiation within constraints.** Sheriff requires truthful count but allows lying about type. This "partial honesty" constraint creates the game's strategic richness. Axiia Cup scenarios have similar constraints: agents must stay in character (truthful constraint) but can pursue creative interpretive strategies (flexible constraint). The tension between what you MUST do honestly and what you CAN do creatively is where the game lives.
- **Reputation across rounds.** In a Swiss tournament, your agent's behavior in early rounds creates a "reputation" — other players study your transcripts and adapt. Sheriff's rotating roles force you to consider how today's aggression affects tomorrow's treatment. Axiia Cup's multi-block format creates the same dynamic.
- **Bribery as strategic negotiation.** Sheriff's bribery mechanic is negotiation in its purest form. Axiia Cup dialogues are also negotiations — each turn is an implicit offer: "accept my framing and I'll engage with your strongest point." The meta-negotiation happening within the dialogue is richer than it first appears.

**Design insight for Axiia Cup:** Sheriff of Nottingham's penalty for false inspection is a brilliantly simple mechanism that prevents over-policing. Axiia Cup's judge system should similarly avoid over-penalizing: if the judge is too harsh on style or too narrow in what it accepts, it "penalizes honest merchants" and rewards only safe, boring prompts. The judge should be calibrated to reward risk-taking when it succeeds.

---

## Part 18: Calibrated Communication & Shared Mental Models

### 18.1 Wavelength (Alex Hague, Justin Vickers, Wolfgang Warsch, 2019)

**What it is:** Team game. A dial has a hidden target somewhere on a spectrum between two extremes (e.g., "Hot" to "Cold"). The Psychic sees the target position and gives a one-word clue. Their team guesses where on the spectrum the clue points. Score points based on accuracy.

**Key mechanisms:**

- **Spectrum-based clue giving** — the clue must calibrate to a specific DEGREE on a spectrum, not just a direction. "Campfire" means warm-but-not-hot. "The Sun" means extremely hot. The precision required is what creates the challenge.
- **Shared mental model as advantage** — teams that share cultural associations perform better. If both the Psychic and team agree that "pizza" is 70% "unhealthy" (not 100%), their calibration is aligned.
- **The "obvious vs precise" trade-off** — an obvious clue ("ice cream" for "cold") is easy to interpret but imprecise. A precise clue ("a walk-in freezer" for 85% cold) is more informative but might be misinterpreted.
- **Meta-knowledge development** — over many rounds, teams learn each other's calibration patterns. "She always overshoot on food-related clues."

**Axiia Cup lessons:**

- **Prompt engineering IS Wavelength.** A system prompt is a "clue" from the human to the AI about how to behave — calibrated to a specific point on multiple spectra (assertiveness, formality, creativity, etc.). The challenge is identical: encode a precise behavioral target using limited natural language.
- **The "obvious vs precise" trade-off is the core prompt engineering skill.** A vague prompt ("be persuasive") is obvious but imprecise — the model might overshoot or undershoot. A precise prompt ("use exactly 3 historical references per turn, maintain formal diction, concede minor points immediately") is informative but might misfire if the conversation goes in an unexpected direction. Finding the right level of specificity is Wavelength's challenge translated to Axiia Cup.
- **Calibration to the model = learning your team's mental model.** Just as Wavelength teams develop calibrated shared understanding, prompt engineers develop calibrated understanding of their chosen model. "DeepSeek interprets 'assertive' as 80% aggressive, but Kimi interprets it as 60%." This calibration knowledge is a competitive advantage.
- **Meta-knowledge across blocks.** Over tournament blocks, players refine their calibration: "My prompt said 'be brief' but the agent was TOO brief — next block, I'll say 'be concise but thorough.'" This iterative calibration IS the multi-block game loop.

**Design insight for Axiia Cup:** Wavelength crystallizes something essential about Axiia Cup: the game is about the GAP between intention and interpretation. The human intends a certain behavior; the prompt encodes that intention; the model interprets the prompt; the resulting behavior may or may not match the intention. Closing this intention-interpretation gap IS the core skill Axiia Cup measures. This is a powerful framing for marketing and player education.

---

### 18.2 Jeopardy! (Merv Griffin, 1964-present)

**What it is:** The iconic quiz show, but at the competitive level it's a sophisticated strategic game. Three players answer questions ("What is…?") for money across categories. Daily Doubles allow wagering. Final Jeopardy requires all players to wager simultaneously on a single question.

**Key mechanisms:**

- **Buzzer timing as skill** — knowing the answer isn't enough; you must buzz faster than opponents. This creates a "speed vs accuracy" trade-off.
- **Daily Double wagering** — finding a Daily Double lets you bet any amount of your current score. Game theory dictates optimal wagers based on your score relative to opponents.
- **Final Jeopardy as simultaneous commitment** — all three players wager before seeing the question. Your wager should depend on your position relative to others: leaders wager enough to beat the second player's maximum; trailers wager to survive.
- **Board control strategy** — selecting categories and dollar amounts strategically. James Holzhauer's innovation: start with high-value clues (where Daily Doubles hide), build a massive lead, then cruise.
- **Knowledge as necessary-but-not-sufficient** — pure knowledge gets you on the show. Wagering strategy, board control, and timing win championships.

**Axiia Cup lessons:**

- **Knowledge is necessary but not sufficient.** Jeopardy! champions know facts, but what separates them is strategy. Axiia Cup players need domain knowledge (history, law, etc.), but what separates them is prompt engineering strategy. Both games reward the intersection of knowledge and meta-strategy.
- **Wagering = resource allocation within the prompt.** Daily Double wagering is "how much of my score do I risk on this opportunity?" Character allocation in a 1000-char prompt is "how much of my budget do I risk on this specific instruction?" Both are risk-reward calculations under uncertainty.
- **Final Jeopardy as simultaneous commitment.** All players wager simultaneously, just as all Axiia Cup players submit prompts simultaneously. The optimal wager depends on what you think opponents will do — pure game theory. The optimal prompt depends on what you think opponents will submit.
- **Holzhauer's innovation: aggressive resource acquisition.** James Holzhauer transformed Jeopardy! by going for high-value clues first, building insurmountable leads early. The Axiia Cup equivalent: a prompt that dominates the early dialogue turns, establishing such a strong position that the opponent can't recover. "Win the frame in turns 1-5, then defend."
- **The "runaway game" concept.** When a leader's score is more than double the second player's, they've mathematically won. In Axiia Cup, if an agent dominates the dialogue so thoroughly that the judge's questions are essentially confirmatory, the match is a "runaway."

**Design insight for Axiia Cup:** Jeopardy!'s deepest insight is that the game changes depending on your position. A leader plays differently from a trailer. Axiia Cup prompts should consider positional awareness — but since you don't know your "position" in advance, the prompt must encode contingency strategies: "If you're dominating, consolidate. If you're behind, take risks." This adaptive architecture is advanced prompt engineering.

---

## Part 19: Evolving Systems & Permanent Consequences

### 19.1 Pandemic Legacy: Season 1 (Matt Leacock & Rob Daviau, 2015)

**What it is:** A cooperative campaign game played across 12-24 sessions. The board, rules, and components PERMANENTLY change based on player decisions. Cities can be destroyed. Characters can gain scars or die. New rules are literally stickered into the rulebook. The game you play in January is fundamentally different from the game you play in December.

**Key mechanisms:**

- **Permanent consequences** — stickers on the board, destroyed cards, new rules physically added to the rulebook. Decisions are irreversible. This creates genuine emotional stakes.
- **Evolving ruleset** — the game starts as regular Pandemic. Over time, new rules, new threats, new mechanics emerge. Players must continuously adapt to a changing game.
- **Narrative continuity** — each session is a chapter in a larger story. Characters develop. The world changes. Previous decisions create the context for future challenges.
- **"Rule sticker" boxes** — 25 empty spaces in the rulebook marked "RULE STICKER." New rules appear as sealed packages that players open when triggered. The game literally teaches you new rules as you progress.
- **Emotional design** — destroying a card or marking a city with a permanent sticker creates emotional attachment that no purely digital game achieves.

**Axiia Cup lessons:**

- **Evolving rules = evolving judge prompts.** Pandemic Legacy's rule stickers are conceptually identical to Axiia Cup's planned judge prompt versioning. Each version changes the game's rules. Like Legacy, the key is that players EXPERIENCE the evolution — they see the old rule, learn the new one, and adapt. The changelog is part of the game.
- **Permanent consequences for tournament engagement.** In Axiia Cup's multi-block format, results from Block 1 carry into Block 2 (through rankings). This creates Legacy-style continuity — your early decisions (prompt choices) have permanent consequences for your tournament trajectory.
- **Narrative arc sustains engagement.** Pandemic Legacy's campaign structure keeps players coming back because they're invested in the story. Axiia Cup's tournament blocks could be framed as a campaign narrative: "Week 1: Establish your agent. Week 2: Adapt to the meta. Week 3: Master the field. Week 4: Championship."
- **Progressive complexity disclosure.** Pandemic Legacy starts simple and adds complexity over time. Axiia Cup could onboard players similarly: first scenario is simple (clear objectives, straightforward judge criteria), later scenarios add hidden goals, complex judge characters, and nuanced constraints. This prevents overwhelming newcomers.

**Design insight for Axiia Cup:** Pandemic Legacy's most powerful innovation is that IRREVERSIBILITY creates meaning. In most games, you can reset and try again. In Legacy, you can't. Axiia Cup's tournament structure should embrace this: once a block is played, those results are permanent. This makes every prompt submission meaningful — you can't undo a bad performance. The emotional weight drives engagement.

---

## Part 20: Mechanics Deep Dives

### 20.1 Auction Mechanisms in Games (Modern Art, Ra, Power Grid)

**The landscape:** Auctions are one of the most versatile game mechanisms. Reiner Knizia's "Auction Trilogy" (Modern Art 1992, Medici 1995, Ra 1999) explores auctions as vehicles for pricing risk and subjective valuation. Power Grid (Friedemann Friese, 2004) uses auctions for resource markets.

**Auction types and their dynamics:**

| Type                          | Example          | Dynamic                                                                                        |
| ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| **English (ascending)**       | eBay, Power Grid | Bidders see each other's bids. Price rises until one bidder remains. Tests willingness to pay. |
| **Dutch (descending)**        | Modern Art       | Price starts high and drops. First to claim wins. Tests nerve and valuation.                   |
| **Sealed bid (simultaneous)** | Modern Art       | All bids revealed at once. Highest wins. Tests valuation without social signals.               |
| **Once-around**               | Modern Art       | Each player bids once in order, or passes. Order matters. Tests positional awareness.          |
| **Vickrey (second-price)**    | Google Ads       | Highest bid wins but pays the second-highest price. Incentivizes truthful bidding.             |

**Axiia Cup lessons:**

- **Prompt submission IS a sealed-bid auction.** All players submit prompts simultaneously (sealed bid). The "highest bidder" (best prompt) wins the match. The key insight from auction theory: in sealed-bid auctions, you should bid your TRUE VALUATION of the item. In Axiia Cup, you should submit the prompt you genuinely believe is best, not try to game what others might submit.
- **Knizia's insight: "the players determine value."** In Modern Art, the value of a painting is whatever players will pay for it. In Axiia Cup, the "value" of a prompt is whatever the judge scores it. Both systems have values that emerge from the interaction between the submission and the evaluation mechanism.
- **Auction theory on winner's curse.** In sealed-bid auctions, the winner often overpays (the "winner's curse"). In Axiia Cup, the most extreme/aggressive prompt might "win" some matches but overpay in risk — occasionally triggering boundary violations or judge penalties. Moderate prompts, like moderate bids, might have better long-term value.

**Design insight for Axiia Cup:** Auction theory suggests that systems where participants determine value (rather than a fixed price) create the deepest engagement. Axiia Cup's judge system — where the "value" of a dialogue strategy emerges from the judge's interpretation — is exactly this kind of system. The fact that there's no fixed rubric (just a judge character) means players must DISCOVER value through experimentation, like bidders learning what paintings are worth through repeated auctions.

---

### 20.2 Handicap & Fairness Systems Across Games

**Go's komi system:** White receives 6.5 (Japanese) or 7.5 (Chinese) points to compensate for Black's first-move advantage. The 0.5 eliminates draws. Between different skill levels, the weaker player places 1-9 handicap stones before the game begins. One rank difference ≈ one handicap stone.

**Chess Elo system:** Players gain/lose rating points based on match outcomes weighted by the expected probability (from rating difference). A 200-point gap means the higher-rated player is expected to win ~75% of the time. No in-game handicap exists — fairness is managed through pairing systems.

**Poker blind structure:** Increasing blinds in tournaments force action and prevent passive play. The blind structure IS the clock — it determines how long the tournament lasts and how aggressive play must be.

**Axiia Cup lessons:**

- **First-mover compensation (Go's komi).** In Axiia Cup, Role A speaks first — a potential advantage (setting the frame) or disadvantage (the opponent can react). The design spec handles this by having EACH PAIR play TWO matches (one as A, one as B). This is the Axiia Cup equivalent of komi — it neutralizes positional advantage through symmetric play.
- **Elo/Glicko-2 for continuous rating.** The design spec already plans Elo/Glicko-2 post-MVP. Go and chess prove these systems work. Key implementation insight: Glicko-2 is better than Elo because it accounts for rating CONFIDENCE (how sure we are of a player's skill) — a player who's played 50 matches has a more reliable rating than one who's played 5.
- **Blind structure as tournament pacing.** Poker's escalating blinds prevent stalling. Axiia Cup's fixed block structure (4 Swiss rounds) serves the same purpose — you can't "slow play" the tournament. Every block matters.
- **No in-game handicap needed.** Chess has no in-game handicap — it relies on ratings and pairings. Axiia Cup similarly doesn't need in-game handicaps. The Swiss pairing system (winners play winners, losers play losers) naturally creates appropriate difficulty matching.

**Design insight for Axiia Cup:** The dual-match system (each pair plays both roles) is the single most important fairness mechanism in the design. It's equivalent to Go's komi, chess's color alternation, and poker's blind rotation — all mechanisms that neutralize positional advantage through enforced symmetry. This should be communicated clearly to players: "You play both sides. If a role is harder, that affects both players equally."

---

### 20.3 Tournament Structures: Swiss vs Alternatives

| Format                 | Matches needed (16 players) | Eliminates?          | Fairness                                         | Spectacle                                          | Best for                                                 |
| ---------------------- | --------------------------- | -------------------- | ------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| **Round Robin**        | 120                         | No                   | Highest — everyone plays everyone                | Low — many inconsequential matches                 | Small fields (<12), where absolute ranking matters       |
| **Swiss (4 rounds)**   | 32                          | No                   | High — similar-record opponents paired           | Medium — later rounds are close matches            | Medium fields (12-64), balancing fairness and efficiency |
| **Single Elimination** | 15                          | Yes                  | Low — one bad match eliminates you               | Highest — every match is life-or-death             | Large fields, spectator-focused events                   |
| **Double Elimination** | 30                          | Yes (after 2 losses) | Medium — second chance via losers bracket        | High — comeback narratives                         | Esports, fighting game tournaments                       |
| **Group → Playoff**    | ~40                         | Yes (in playoff)     | Medium-High — group stage gives multiple chances | High — two distinct phases with different dynamics | Major esports events, World Cup                          |
| **Gauntlet**           | Varies                      | Yes                  | Low — heavily favors top seeds                   | High — underdog narratives                         | When a preliminary stage exists                          |

**Axiia Cup's Swiss choice — analysis:**

- **Perfect for the format.** 15 players, no eliminations, fair pairing — Swiss is exactly right.
- **Swiss weakness: top players may not face each other.** In 4 rounds with 15 players, the top 2 players might not be paired (if they're never at the same score after an odd round). This is acceptable for MVP but worth noting.
- **Post-MVP expansion: Group → Swiss → Playoff.** For larger events (50+ players), a natural evolution is: group stage (round robin in small groups) → Swiss qualifying rounds → single-elimination Top 8 playoff. This combines Swiss's fairness with single-elimination's spectacle.
- **Continuous ladder (Halite model) for off-season.** Between tournament events, a continuous ladder (submit a prompt, it gets matched automatically, your rating updates) keeps players engaged and provides Elo data for seeding future tournaments.

**Design insight for Axiia Cup:** Swiss is the correct MVP choice. For future events, consider hybrid formats that use Swiss for qualifying and single-elimination for finals — this gives spectators dramatic high-stakes matches while maintaining fairness throughout the qualifying process.

---

### 20.4 Community-Driven Balance: MTG's Model for Judge Prompt Versioning

**How MTG manages competitive balance:**

1. **Regular announcement cadence.** Wizards of the Coast publishes banned/restricted announcements on a predictable schedule (roughly quarterly, with emergency updates when needed). Players know when to expect changes.

2. **Data-driven decisions.** Bans target specific patterns: homogeneity (one card in every deck), non-interactivity (winning without opponent input), or format stagnation (same top decks for months). The goal is format DIVERSITY, not format perfection.

3. **Transparency.** Each announcement includes detailed explanations: why this card, why now, what the intended effect is. Players can disagree but understand the reasoning.

4. **Community feedback loop.** Wizards monitors tournament results, community discussion (Reddit, Twitter, Twitch), and play pattern data. Player feedback directly influences decisions.

5. **The "ban vs restrict vs errata" spectrum.** Different interventions for different problems:
   - Ban = remove entirely (strongest intervention)
   - Restrict = allow but limit quantity (moderate)
   - Errata = change how a card works (rare, controversial)
   - Watchlist = publicly signal concern without action (lightest)

**Axiia Cup application — Judge Prompt Versioning:**

| MTG concept           | Axiia Cup equivalent                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| Banned card           | Forbidden prompt technique (e.g., "agent must not claim to be the judge") |
| Restricted card       | Rate-limited strategy (harder to implement)                               |
| Card errata           | Judge prompt update (changing how a criterion is evaluated)               |
| Watchlist             | Public notice that a scoring behavior is under review                     |
| Announcement schedule | Predictable judge version updates between tournament blocks               |
| Community feedback    | Player reports of judge bias, unfair scoring patterns                     |
| Transparency          | Published changelog with reasoning for each judge update                  |

**Key MTG lessons for Axiia Cup:**

- **Predictability matters more than perfection.** Players tolerate imperfect balance if they know WHEN changes are coming. Axiia Cup should announce judge update schedules in advance.
- **Target homogeneity, not strength.** Don't nerf a strong prompt strategy because it's strong. Nerf it only if EVERY player is forced to use it (homogeneity) or if it creates non-interactive games (the dialogue becomes one-sided monologue).
- **The watchlist is powerful.** Simply SAYING "we're looking at X" changes player behavior without any actual rule change. Axiia Cup could publish a "judge focus areas" list before each block: "This block, the judge will be paying extra attention to historical accuracy and less to rhetorical flair." This shapes the meta without changing the judge prompt.
- **Community trust is the asset.** MTG's banned list works because players trust Wizards (mostly) to act in good faith. Axiia Cup's judge versioning works only if players trust the team to be fair. Transparency is the mechanism for building this trust.

**Design insight for Axiia Cup:** MTG's balance system is the most battle-tested model for managing an evolving competitive game with community feedback. Axiia Cup should explicitly adopt MTG's framework: predictable update cadence, data-driven decisions, transparent reasoning, and a watchlist system for signaling without acting. The design spec already describes judge prompts as versioned "balance patches" — this IS the MTG model. Commit to it fully.

---

## Final Synthesis: Capstone Principles from Round 4

### Principle 15: Commitment Creates Consequence (Skull / Pandemic Legacy / Sheriff)

- Skull: every disc placed is an irrevocable commitment
- Pandemic Legacy: every sticker is permanent
- Sheriff: every declaration constrains future options
- **Axiia Cup: every prompt submission is a commitment. Irreversibility creates meaning.**

**Implication:** The tournament structure should emphasize that prompt submissions matter. Each block's results are permanent. This emotional weight drives engagement far more than a system where you can endlessly retry.

### Principle 16: Calibration Is the Core Skill (Wavelength / Mysterium / Jeopardy!)

- Wavelength: calibrating a clue to a specific point on a spectrum
- Mysterium: calibrating abstract communication to a specific recipient
- Jeopardy!: calibrating wagers to specific game states
- **Axiia Cup: calibrating a prompt to a specific model, scenario, and judge is THE skill**

**Implication:** This is the clearest framing of what Axiia Cup measures. It's not "writing skill" or "knowledge" — it's CALIBRATION. The ability to precisely tune a prompt so that a specific model, in a specific scenario, produces behavior that a specific judge rewards. This three-way calibration (model × scenario × judge) is the unique skill dimension.

### Principle 17: Predictable Evolution Sustains Trust (MTG Balance / Pandemic Legacy)

- MTG: predictable announcement cadence builds community trust
- Pandemic Legacy: predictable campaign structure creates narrative anticipation
- **Axiia Cup: predictable judge versioning schedule + transparent reasoning = player trust**

**Implication:** Publish the judge update schedule in advance. Explain every change. Use a watchlist. Trust is the foundation of competitive integrity.

### Principle 18: The Intention-Interpretation Gap IS the Game (Wavelength / Mysterium / Coup)

- Wavelength: the gap between the Psychic's intention and the team's interpretation
- Mysterium: the gap between the Ghost's vision and the Medium's reading
- Coup: the gap between claimed identity and actual identity
- **Axiia Cup: the gap between prompt intention and model behavior is where the game lives**

**Implication:** This is perhaps the single most important insight from the entire research. Axiia Cup is fundamentally a game about CLOSING THE INTENTION-INTERPRETATION GAP. The human intends a behavior. They encode it as a prompt. The model interprets the prompt and produces behavior. How close is the actual behavior to the intended behavior? The player who closes this gap most effectively — who communicates most precisely through the lossy channel of natural language → LLM interpretation — wins.

---

## Research Complete — Full Summary

### By the Numbers

- **49 games/systems/mechanics analyzed** across 20 categories
- **18 design principles extracted**
- **4 research sessions** (2026-03-31)

### The Top 5 Most Important Insights for Axiia Cup

1. **The Intention-Interpretation Gap IS the Game** (P18). Axiia Cup measures the ability to communicate precisely through a lossy channel. This is the core value proposition and should be the central framing for everything from marketing to player education.

2. **Prompt = Deck = Build Order = Warrior** (P2, from MTG/StarCraft/CoreWar). The pre-game design phase IS the game. Invest in the prompt workshop UX above all else.

3. **Public Rules + Hidden Strategy = Emergent Meta** (P3, from Poker/Go/Nomic). The public judge prompt is the best design decision in the spec. It creates infinite strategic depth from a simple structure.

4. **Calibration Is the Core Skill** (P16, from Wavelength/Mysterium). Axiia Cup uniquely tests three-way calibration: model × scenario × judge. No other competition measures this specific skill.

5. **The Meta Cycle Sustains Engagement** (P5, from MTG/SC:BW). Multi-block format + judge versioning + public meta-discussion creates a self-sustaining competitive ecosystem. This is the long-term engagement engine.

### The Top 5 Closest Structural Analogs

1. **CoreWar** — write autonomous code under size constraints, watch it compete
2. **BattleBots** — design phase → autonomous combat → judging
3. **Axelrod's Prisoner's Dilemma Tournament** — submit a strategy, it competes against all others
4. **Root's Eyrie Dynasties** — program a decree that executes automatically (crashes if the state doesn't support it)
5. **Wavelength** — encode a precise behavioral target through constrained natural language

---

## Part 21: One Last Game — Codex (David Sirlin, 2016)

### 21.1 Codex: Card-Time Strategy (Sirlin Games)

**What it is:** A card game that simulates a real-time strategy game. Two players, each with a "codex" of ~80 cards organized into three "specs" (classes). You start with only 10 cards and ADD 2 cards from your codex to your deck each turn. Unlike MTG where you build a deck before the game, Codex's deck evolves during play — like Dominion, but adversarial and asymmetric.

**Key mechanisms:**

- **Build order as deck construction.** You don't draw from a random pool; you choose exactly which 2 cards to add from your codex each turn. This IS a build order — a planned sequence of capability additions, just like a StarCraft build order.
- **"Patrol zone" combat system.** You assign units to defensive roles (Squad Leader, Technician, Lookout, etc.). Each role grants a bonus. The attacker chooses who to attack, creating tactical decisions about target selection and defensive positioning.
- **Tech tree as commitment.** You must invest in tech buildings to access higher-tier cards. Teching up to Tier 2 or 3 is a commitment of resources that pays off later — or never, if your opponent rushes you.
- **No collectibility, no randomness.** Both players have access to complete, symmetric card pools. No booster packs, no rarity chase. Strategy is pure, not wallet-dependent.
- **Yomi embedded in combat.** Sirlin designed Codex knowing that every combat decision involves predicting the opponent's response. Attack the Squad Leader (safe) or snipe the Technician (riskier but denies card draw)?

**Axiia Cup lessons:**

- **The build-order-as-deck-construction is the most precise analog to prompt engineering.** In Codex, you add exactly 2 cards per turn, shaping your deck's evolution with surgical precision. In Axiia Cup, you allocate exactly 1000 characters, shaping your agent's behavior with surgical precision. Both are about CHOOSING what capabilities to invest in from a larger possibility space.
- **Tech tree as prompt architecture.** Codex's tech tree forces you to commit to a strategic direction early: aggressive rush (Tier 1 focus) or late-game power (invest in Tier 3). Prompts have the same structure: spend characters on immediate tactics (turn 1-5 dominance) or invest in late-game architecture (judge question preparation, adaptive fallbacks).
- **No collectibility validates Axiia Cup's level playing field.** Codex deliberately eliminates pay-to-win. Axiia Cup deliberately eliminates model advantage (all players choose from the same pool). Both prioritize strategic skill over access to resources.
- **Sirlin's design career arc tells a story.** Yomi → Codex → Yomi 2 represents an evolution from pure reads (RPS + asymmetric characters) to strategic depth (build orders + tech trees + reads). Axiia Cup sits at the Codex end of this spectrum: it's not just about one read (one match), but about building a strategic architecture (a prompt) that supports reads across many interactions.

**Design insight for Axiia Cup:** Codex's most important lesson is that BUILD ORDER DECISIONS ARE THE DEEPEST FORM OF STRATEGY. Not because they're complex, but because they're irreversible within a game. Every card added to your deck shapes all future draws. Every word in a prompt shapes all future agent behavior. The WEIGHT of each decision — its downstream consequences — is what creates strategic depth. Axiia Cup's 1000-character constraint gives every character this weight.

---

## Part 22: Player Psychology — What Makes Competition Meaningful

### 22.1 Flow Theory and the Challenge-Skill Balance (Csikszentmihalyi, 1990)

**What it is:** Mihaly Csikszentmihalyi's Flow Theory describes the optimal psychological state where a person is fully immersed, focused, and performing at their peak. Flow occurs in a narrow channel between anxiety (challenge too high) and boredom (challenge too low).

**The Flow Channel model:**

```
Challenge ↑
           |  ANXIETY
           |  (too hard)
           |
           |       ╱ FLOW CHANNEL
           |     ╱   (just right)
           |   ╱
           | ╱
           |╱  BOREDOM
           |   (too easy)
           └──────────────→ Skill
```

**Four conditions for flow:**

1. Concrete goals with manageable rules
2. Actions that fit within the person's capabilities
3. Clear and timely feedback on performance
4. Diminished extraneous distraction

**Axiia Cup flow analysis:**

| Condition              | Axiia Cup implementation                          | Flow risk |
| ---------------------- | ------------------------------------------------- | --------- |
| Concrete goals         | "Win the judge's favor in this scenario" — clear  | Good ✓    |
| Fit capabilities       | 1000-char prompt, no coding required — accessible | Good ✓    |
| Clear feedback         | Dialogue transcript + judge score — interpretable | Good ✓    |
| Diminished distraction | Async format, work at own pace — focused          | Good ✓    |

**The critical flow risk is the DELAY between action and feedback.** Flow requires tight feedback loops. Axiia Cup's async format means you submit a prompt, wait 2-5 minutes, then see results. This delay risks breaking flow. Mitigation strategies:

- **Trial arena with fast iterations** — let players rapidly test prompt variations. Each trial is a tight action→feedback loop.
- **In-progress visibility** — show dialogue turns as they generate (the "第 N/20 回合" status). This creates anticipation during the wait.
- **Post-match analysis tools** — when the result arrives, the transcript should immediately invite the next iteration: "what would you change?"

**Design insight for Axiia Cup:** The trial arena is the flow engine. The tournament is the stakes engine. Both are needed: flow drives practice engagement, stakes drive competitive engagement. The trial arena should be optimized for tight feedback loops (minimize latency, maximize interpretability of results).

---

### 22.2 Elo Anxiety and Rating Psychology

**What it is:** A well-documented phenomenon in competitive games where players avoid playing ranked matches because they fear losing rating points. Also known as "ladder anxiety" or "ranked anxiety."

**Research findings:**

- In League of Legends, studies found that lower-skilled players significantly overestimate their own skill relative to their Elo (the Dunning-Kruger effect in a competitive context). This motivated bias makes losses feel "unfair" — "I'm better than my rating, the system is wrong."
- Players adopting a "challenge mindset" (viewing matches as growth opportunities) performed better and experienced less anxiety than those with a "threat mindset" (viewing matches as tests of their worth).
- Rating volatility increases anxiety. Players prefer systems where rating moves predictably and explanably.

**Axiia Cup implications:**

- **The Swiss format reduces rating anxiety.** Because Axiia Cup's MVP uses win-count (not Elo), and because all players play all rounds (no elimination), there's less of the "one loss destroys my ranking" anxiety that plagues ladder systems.
- **Post-MVP Elo introduction requires care.** When Elo/Glicko-2 is added, communicate it as a SKILL DISCOVERY tool, not a worth measurement: "Your rating is our best guess of your skill right now. It gets more accurate with more matches." Glicko-2's confidence intervals help here — you can show "Your skill is likely between X and Y" rather than a single anxiety-inducing number.
- **Frame losses as information, not failure.** Every match transcript is a learning artifact. The prompt workshop UX should frame post-loss as "here's what happened, here's what to try next" — not "you lost."
- **The trial arena as a safe space.** Trial arena results don't count for ranking. This gives players a zero-stakes environment to experiment and fail without rating consequences. This is critical for maintaining engagement among newer or more anxious players.

---

### 22.3 Bartle's Player Type Taxonomy and Axiia Cup

**What it is:** Richard Bartle's 1996 taxonomy classifies players into four types based on their motivations:

| Type               | Motivation                                            | In Axiia Cup                                                                                     |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Achiever** (♦)   | Points, levels, concrete success metrics              | Climbs the leaderboard, optimizes win rate, studies judge criteria systematically                |
| **Explorer** (♠)   | Discovering how things work, finding hidden mechanics | Tests unusual prompt strategies, reverse-engineers model behavior, finds edge cases              |
| **Socializer** (♥) | Interaction with other players, community             | Discusses strategies on forums, mentors newer players, forms study groups                        |
| **Killer** (♣)     | Dominating other players, competitive supremacy       | Focuses on beating specific opponents, develops counter-strategies, plays mind games in the meta |

**Axiia Cup's natural strength is Achiever + Explorer appeal.** The leaderboard satisfies Achievers. The trial arena (experiment and discover) satisfies Explorers. The competitive structure satisfies Killers.

**The gap is Socializer support.** Current design has minimal social features. To serve Socializers (and create community):

- **Post-match discussion** — after a match, let players (optionally) discuss the match, share insights, react to the transcript.
- **Strategy forums/channels** — a space (Feishu group already exists) where players discuss prompt techniques, scenario interpretations, model quirks.
- **Spectator mode** — letting non-participants watch matches (anonymized) creates community engagement without requiring competition.
- **Team competitions (future)** — teams designing prompts together would be the ultimate Socializer draw.

**Design insight for Axiia Cup:** A healthy competitive community needs all four types. Achievers drive competition. Explorers drive innovation. Socializers create community glue. Killers create narrative drama. Axiia Cup's design naturally serves 3 of 4; investing in social features closes the gap.

---

### 22.4 Skill Floor, Skill Ceiling, and the "Easy to Learn, Hard to Master" Design Target

**Key concepts:**

- **Skill floor** = the minimum skill needed to participate meaningfully.
- **Skill ceiling** = the maximum skill that can be expressed within the system.
- **The ideal competitive game has a LOW skill floor and HIGH skill ceiling.** Easy to start, infinite to master.

**Axiia Cup skill floor/ceiling analysis:**

| Dimension           | Skill floor (minimum)                                   | Skill ceiling (mastery)                                                                                                |
| ------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Prompt writing      | "Be persuasive and stay in character" (a few sentences) | Sophisticated multi-phase architectures with conditional logic, model-calibrated language, and judge-optimized framing |
| Scenario knowledge  | Read the scenario background                            | Deep historical/legal/philosophical knowledge that informs nuanced arguments                                           |
| Model understanding | Pick any model from the list                            | Intimate knowledge of model strengths, calibrated prompt language for specific models                                  |
| Meta-strategy       | Submit and see what happens                             | Study opponent transcripts, predict meta trends, build counter-strategies                                              |

**Current risk: the skill floor might be TOO LOW.** A player who writes "Be Columbus and convince the queen" might get a reasonable dialogue. This is good for accessibility but bad for competitive signal — if weak prompts still produce decent results (because LLMs are generally capable), the game doesn't discriminate enough. The judge's post-dialogue questions are the mechanism that raises the effective skill floor: even if the dialogue looks reasonable, the judge asks probing questions that expose shallow prompts.

**Design insight for Axiia Cup:** The skill floor is set by the scenario + judge, not the platform. Simple scenarios with generous judges → low floor. Complex scenarios with demanding judges → high floor. The scenario system is the difficulty dial. MVP should use a moderately complex scenario — enough to separate beginners from intermediates, but not so hard that newcomers can't participate at all.

---

## Part 23: Community Building — How Competitive Ecosystems Form and Sustain

### 23.1 The FGC (Fighting Game Community) Model: Grassroots-First

**What it is:** The FGC is the competitive ecosystem around fighting games (Street Fighter, Tekken, Smash Bros, etc.). Unlike most esports, the FGC grew bottom-up from local arcade scenes in the 1990s, not top-down from publisher-organized leagues.

**Key community-building patterns:**

**a) Local scenes → regional scenes → national/international**

- The FGC started with local arcade gatherings (Chinatown Fair NYC, Golfland CA).
- Local scenes developed their own culture, slang, rivalries, and legends.
- Regional tournaments connected local scenes. National events (Evo) became the apex.
- Online play expanded access but local scenes remained the cultural core.

**Axiia Cup parallel:** Axiia Cup's target audience is Chinese high school and college students. The natural "local scene" is individual schools or study groups. The platform should support school-level competitions that feed into city-level and national-level events. A student who wins their school's mini-tournament gains identity and motivation before entering the larger competition.

**b) Community organizers, not corporate organizers**

- Most FGC tournaments are run by community members, not publishers. This creates authenticity and ownership.
- Evo's founder, Tom Cannon, is a community member, not a Capcom employee.
- Even the Capcom Pro Tour's regional stops are organized by locals.

**Axiia Cup parallel:** Empower students and teachers to run local Axiia Cup events using the platform's tools. Provide a "tournament organizer kit" — scenario packs, judge prompts, scheduling tools. The platform is infrastructure; the community runs the events.

**c) Personality-driven community growth**

- The FGC's growth is driven by personalities: Daigo Umehara, SonicFox, Justin Wong. Their stories, rivalries, and play styles attract viewers and new players.
- Narratives emerge organically: underdog runs, epic comebacks, style clashes.

**Axiia Cup parallel:** Axiia Cup will naturally generate narratives if transcripts are public and players have persistent identities. "Player 4521's aggressive Columbus prompt was dismantled by Player 8837's patient, historically-grounded strategy in Round 3" — these stories build community.

---

### 23.2 The Chess Renaissance Model: Content-Driven Growth

**What it is:** Chess experienced a massive popularity surge in 2020-2022, driven by three converging factors:

1. **Netflix's The Queen's Gambit** (2020) — cultural moment that made chess aspirational.
2. **COVID lockdowns** — people at home, looking for intellectual competition.
3. **Twitch streaming** — Hikaru Nakamura and the Botez sisters made chess entertaining.

**The critical innovation: PogChamps (Chess.com, 2020)**

- A chess tournament featuring 16 popular Twitch streamers — most of whom were TERRIBLE at chess.
- They trained with GM coaches, played on stream, and attracted hundreds of thousands of viewers.
- PogChamps worked because: (a) viewers identified with beginners struggling, not experts dominating; (b) the entertainment came from personality, not perfect play; (c) it lowered the perceived barrier: "if xQc can play chess, I can too."

**Key streaming patterns:**

- **Hikaru Nakamura**: GM-level play + engaging commentary + audience interaction. Appeals to Achievers and Killers.
- **Botez sisters**: personality-driven + educational + approachable. Appeals to Socializers and beginners.
- **Chess.com PogChamps**: celebrity beginners + training arcs + tournament drama. Reaches non-chess audiences entirely.

**Axiia Cup community-building lessons:**

1. **You need an "xQc plays chess" moment.** Find a well-known personality (KOL, influencer, educator) who's NOT a prompt engineering expert and have them compete in Axiia Cup on stream. Their struggles, learning, and eventual growth are the content. This is more valuable for growth than showcasing expert play.

2. **"Botez-style" content: personality + education.** Encourage players to stream their prompt workshop process — thinking through strategy, testing in the trial arena, iterating. This is inherently educational and personality-driven.

3. **The training arc narrative.** Chess's PogChamps worked because viewers followed players improving over weeks. Axiia Cup's multi-block format naturally creates training arcs: Block 1 results → reflection → revised prompt for Block 2 → improvement (or not). This arc is content.

4. **Platform as content infrastructure.** Chess.com's success isn't just the game — it's the analysis tools, puzzle trainers, and community features that create content. Axiia Cup should invest in: shareable match replays (with cool UI), prompt analysis tools, and community challenges (weekly scenarios, speed prompt contests).

---

### 23.3 The MTG Community Model: Content Pyramid

**What it is:** Magic: The Gathering's competitive community is organized as a content pyramid:

```
         ╱╲
        ╱  ╲   Pro Tour / Worlds
       ╱    ╲  (aspirational apex)
      ╱──────╲
     ╱        ╲  Regional Championships
    ╱          ╲ (competitive middle)
   ╱────────────╲
  ╱              ╲  Friday Night Magic
 ╱                ╲ (casual entry point)
╱──────────────────╲
   Content creators
   (media layer)
```

**Key insight: the MEDIA LAYER is as important as the competitive structure.** MTG's health depends on:

- **Content creators** who analyze the meta, build decks on stream, and explain strategy. They create the shared knowledge base.
- **Friday Night Magic** (FNM) — weekly casual events at local stores. Zero stakes, pure fun. This is where 80% of engaged players live.
- **Regional Championships** — competitive but accessible. "I'm good at my store; let me see how I do at the regional level."
- **Pro Tour** — aspirational. Most players never play there, but watching it inspires practice.

**Axiia Cup content pyramid design:**

```
         ╱╲
        ╱  ╲   National Championship
       ╱    ╲  (offline finals)
      ╱──────╲
     ╱        ╲  Seasonal Tournament
    ╱          ╲ (multi-block online Swiss)
   ╱────────────╲
  ╱              ╲  School/Club Mini-Events
 ╱                ╲ (casual entry point)
╱──────────────────╲
   Trial Arena + Content
   (media/practice layer)
```

**The bottom of the pyramid is the most important.** Without casual entry points and content creators, the top of the pyramid has no pipeline. Axiia Cup should invest in the trial arena experience and social sharing BEFORE investing in the championship structure.

---

## Part 24: Spectator Experience — Making Prompt Battles Watchable

### 24.1 The Spectator Challenge

**The problem:** Axiia Cup's core action — writing a system prompt — is invisible to spectators. Unlike fighting games (visible combat), chess (visible board), or MOBA (visible map), the "game" happens in a text editor. The "match" is a text dialogue that takes 2-5 minutes to generate. Neither is inherently exciting to watch.

**Esports broadcast design principles (from research):**

1. **Visual clarity** — viewers must understand what's happening at a glance.
2. **Narrative framing** — commentary translates complex decisions into relatable stories.
3. **Pacing control** — replays, camera angles, and data overlays maintain engagement through quiet moments.
4. **Interactivity** — 75% of esports viewers say chat interaction increases enjoyment.
5. **Dual audience** — serve both experts (who want depth) and newcomers (who need context).

### 24.2 Making Axiia Cup Watchable: A Broadcast Design Framework

**Phase 1: The "Pre-Match" (prompt reveal)**

This is the equivalent of a fighting game's character select screen. Show:

- **Model choice** (with model "character art" and stats — a visual identity for each model)
- **Prompt word cloud or theme** (not the full prompt — that's secret — but a visual hint: "This player's prompt emphasizes historical accuracy and diplomatic language")
- **Player profile** — previous record, tournament history, signature strategies from past matches
- **Expert commentator prediction** — "Based on their past transcripts, Player A tends to favor aggressive early framing. Player B is known for patient dismantlement. I think we'll see a classic aggressor vs counter-puncher matchup."

**Phase 2: The "Match" (dialogue generation)**

Real-time turn-by-turn display, with:

- **Typed animation** — dialogue appears word-by-word like a live conversation, not all at once. This creates drama.
- **"Highlight reel" annotations** — AI-assisted or commentator-flagged moments: "Key moment: Agent B just conceded the economic argument to pivot to moral grounds. This is a significant strategic shift."
- **Split-screen with reaction cam** — if players are watching, show their reactions as the dialogue unfolds.
- **Running score/sentiment indicators** — a visual "momentum meter" showing who seems to be winning (based on argument strength, topic control, judge-aligned behavior).

**Phase 3: The "Post-Match" (judge evaluation)**

- **Judge character appears** — visual representation of the judge character (Isabella the Queen, Qin Xiaogong) with their personality displayed.
- **Question reveal** — show each judge question with dramatic timing.
- **Agent responses** — side-by-side display of each agent's answer.
- **Score reveal** — dramatic reveal of the final score, with breakdown by criteria.
- **"What happened" analysis** — expert breakdown of the key strategic moments and why the winner won.

### 24.3 Spectator Experience Design Principles for Axiia Cup

**a) The "Replay Value" principle**
Axiia Cup dialogues are TEXT — they can be re-read, annotated, and analyzed. Unlike a live game that's gone once played, a dialogue transcript is a permanent artifact. This means Axiia Cup's spectator value INCREASES over time as the community develops analytical frameworks for understanding what makes a good dialogue.

**b) The "Commentary is the content" principle**
In chess streaming, the commentary is more entertaining than the game itself. Hikaru's reactions make blitz chess compelling. Axiia Cup needs commentators who can make dialogue analysis exciting: "Look at turn 7 — Agent A just slipped in a reference to the Reconquista that reframes the entire economic argument. That's a masterclass in contextual framing."

**c) The "PogChamps" principle**
The most watchable Axiia Cup content won't be two experts producing perfect dialogues. It'll be beginners producing messy, surprising, occasionally brilliant dialogues. The unexpected outputs — when an agent says something nobody anticipated — create the viral moments.

**d) The "Post-game lobby" principle**
After a match, let players (optionally) discuss what happened, reveal their prompt strategies, and analyze the dialogue together. This post-game analysis is content in itself and builds community.

---

## Part 25: The Competitive Landscape — Existing Prompt Competitions

### 25.1 Survey of Existing Formats

| Competition                       | Focus                               | Format                                                  | Axiia Cup differentiation                                   |
| --------------------------------- | ----------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| **HackAPrompt** (Learn Prompting) | AI red-teaming / prompt injection   | Multi-track hackathon, 2-month duration, $100K prizes   | Axiia Cup is collaborative dialogue, not adversarial attack |
| **PromptStorm**                   | Creative prompt engineering         | 24-hour hackathon; judged on creativity, output quality | Axiia Cup is PvP competition, not showcase                  |
| **B2B Prompt Playoff**            | Enterprise prompt engineering       | Half-day sprint; marketing/business context             | Axiia Cup targets students, uses humanities scenarios       |
| **ImaGenAI**                      | Image generation prompt engineering | Contest format at IIT Delhi                             | Axiia Cup is text dialogue, not image generation            |
| **Chatbot Arena** (LMSYS)         | Model evaluation                    | Crowdsourced pairwise voting                            | Arena ranks models; Axiia Cup ranks humans                  |

**Key gap in the landscape:** No existing competition combines:

1. **PvP adversarial dialogue** (two agents interact, not just produce outputs independently)
2. **Character-judge evaluation** (not abstract scoring, but an in-world persona)
3. **Tournament structure** (Swiss rounds, Elo ratings, multi-block seasons)
4. **Humanities focus** (history, law, philosophy — not coding or business)
5. **Student audience** (accessible, educational, developmental)

**Axiia Cup occupies a genuinely unique position.** It's not a hackathon (it's a tournament). It's not a model evaluation (it's a human skill evaluation). It's not a prompt showcase (it's adversarial). It's not an AI agent competition (no tools, no code — pure prompt). This uniqueness should be communicated aggressively in positioning.

### 25.2 Lessons from Existing Competitions

**From HackAPrompt:**

- Multi-track structure (different difficulty levels) is good for diverse audiences. Axiia Cup scenarios of varying complexity serve the same purpose.
- 2-month duration with iterative submission works well. Axiia Cup's multi-block format achieves this.

**From PromptStorm:**

- 24-hour time pressure creates excitement. Axiia Cup could include "blitz" events — write a prompt in 30 minutes for a surprise scenario.
- Judging criteria transparency matters. Axiia Cup's public judge prompt addresses this.

**From Chatbot Arena:**

- Elo from pairwise comparisons is proven at scale. Axiia Cup's planned Elo/Glicko-2 system is validated.
- Anonymization prevents brand bias. Axiia Cup's "选手 [4位数字]" anonymization is correct.

**Design insight for Axiia Cup:** The competitive landscape validates Axiia Cup's unique positioning. No existing competition does what Axiia Cup does. The risk is not competition from similar products — it's failure to communicate the uniqueness clearly enough.

---

## Final Synthesis: Capstone Principles from Round 5

### Principle 19: Flow Lives in the Trial Arena, Stakes Live in the Tournament (Csikszentmihalyi / Poker / Chess)

- Flow requires tight feedback loops (action → result → iterate)
- Stakes require permanent consequences (each match matters)
- **Axiia Cup needs BOTH: the trial arena for flow, the tournament for meaning**

**Implication:** These are two distinct UX priorities. The trial arena should be optimized for speed, iteration, and learning (minimize latency, maximize interpretability). The tournament should be optimized for drama, permanence, and fairness (robust pairing, transparent scoring, irreversible results).

### Principle 20: Content Pyramids Need a Wide Base (FGC / Chess / MTG)

- Every thriving competitive game has a wide casual base that feeds a narrow competitive apex
- FGC: local arcades → regionals → Evo
- Chess: casual online → rated matches → tournaments
- MTG: FNM → regionals → Pro Tour
- **Axiia Cup needs: trial arena + school events → seasonal tournament → national championship**

**Implication:** Don't build the championship first. Build the trial arena, the sharing tools, the school event kit. The competitive apex is meaningless without a pipeline feeding it.

### Principle 21: Personality Creates Community (Chess streaming / FGC / PogChamps)

- Hikaru + Botez made chess culturally relevant through personality, not perfect play
- PogChamps attracted non-chess viewers through beginner struggle narratives
- FGC legends (Daigo, SonicFox) create aspirational figures
- **Axiia Cup needs visible personalities: players with stories, commentators with opinions, KOLs with training arcs**

**Implication:** Invest in the human layer. Record training arcs. Produce match commentary. Create a "PogChamps" event with non-expert participants. The content IS the growth engine.

### Principle 22: The Spectator Gap Is Solvable (Chess / Poker / Fighting Games)

- Chess is "boring" to watch — until Hikaru narrates it
- Poker is "slow" to watch — until hole cards are shown
- Axiia Cup dialogues are "just text" — until commentary, annotation, and dramatic pacing transform them
- **The spectator problem is a presentation problem, not a content problem**

**Implication:** The raw material (dialogue transcripts, judge evaluations, strategy reveals) is inherently dramatic. It just needs production: turn-by-turn animation, momentum indicators, expert commentary, player reactions. Budget for broadcast design.

---

## Addendum: Updated Full Summary

### By the Numbers

- **51 games/systems/mechanics analyzed** across 25 categories
- **22 design principles extracted**
- **5 research sessions** (2026-03-31)

### The Complete Principle Index

| #   | Principle                                               | Source Games                             | Key Axiia Cup Implication                            |
| --- | ------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| 1   | Constraint breeds creativity                            | Diplomacy, Codenames, CoreWar, Go        | Resist adding features; depth comes from constraints |
| 2   | Design phase > execution phase                          | MTG, BattleBots, StarCraft, CoreWar      | Invest in prompt workshop UX                         |
| 3   | Public rules + hidden strategy = emergent meta          | Poker, Go, Nomic                         | Public judge prompt is the best design decision      |
| 4   | Statistical fairness through volume                     | Poker, Werewolf, SC:BW                   | The poker model ("many hands") is exactly right      |
| 5   | The meta cycle sustains engagement                      | MTG, SC:BW, Survivor                     | Multi-block + judge versioning = engagement engine   |
| 6   | Autonomous execution creates unique thrill              | BattleBots, CoreWar, RoboCode            | Async execution is the emotional core                |
| 7   | Robustness beats exploitation                           | Axelrod, Stratego                        | Robust prompts > clever prompts long-term            |
| 8   | The transcript is the learning tool                     | Halite, Mock Trial                       | Invest in transcript UX                              |
| 9   | Framing defines the game                                | BP Debate, Moot Court, Twilight Struggle | Best prompts define what the conversation is about   |
| 10  | Constraints on aggression create depth                  | Twilight Struggle, Cosmic Encounter      | Boundary constraints improve the game                |
| 11  | Yomi layers cycle                                       | Yomi, Iterated RPS                       | Meta stabilizes into learnable archetypes            |
| 12  | Silence speaks                                          | Hanabi, Mysterium, Spyfall               | Prompt omissions shape behavior                      |
| 13  | Radical asymmetry creates narrative depth               | Root, Captain Sonar                      | Scenario roles should be deeply different            |
| 14  | The meta IS the game                                    | Dominion, The Resistance                 | Multi-block iteration IS the game                    |
| 15  | Commitment creates consequence                          | Skull, Pandemic Legacy, Sheriff          | Irreversibility drives engagement                    |
| 16  | Calibration is the core skill                           | Wavelength, Mysterium, Jeopardy!         | Three-way calibration: model × scenario × judge      |
| 17  | Predictable evolution sustains trust                    | MTG Balance, Pandemic Legacy             | Publish judge update schedule                        |
| 18  | The intention-interpretation gap IS the game            | Wavelength, Mysterium, Coup              | Core value proposition and marketing frame           |
| 19  | Flow lives in the trial arena, stakes in the tournament | Csikszentmihalyi, Poker, Chess           | Two distinct UX priorities                           |
| 20  | Content pyramids need a wide base                       | FGC, Chess, MTG                          | Build casual entry points before competitive apex    |
| 21  | Personality creates community                           | Chess streaming, FGC, PogChamps          | Invest in human layer: stories, commentary, KOLs     |
| 22  | The spectator gap is solvable                           | Chess, Poker, Fighting Games             | Presentation problem, not content problem            |

---

## Part 26: The Chinese Competitive Ecosystem — Where Axiia Cup Lives

### 26.1 The Existing Student Competition Landscape in China

**China has a massive, well-organized student competition ecosystem.** Key existing formats that Axiia Cup will sit alongside:

**a) AI / Technology Competitions (白名单赛事)**

| Competition                                            | Organizer                       | Audience   | Focus                                               | Relevance                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------- | ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 全国青少年人工智能大赛 (National Youth AI Competition) | Ministry of Education whitelist | K-12       | 5 tracks including LLM application (大语言模型应用) | **Direct competitor for attention.** The LLM application track is the closest existing format to Axiia Cup. Axiia Cup must differentiate on PvP + humanities. |
| 中国高校计算机大赛—人工智能创意赛 (C4-AI)              | Baidu + Zhejiang University     | University | AI application development                          | Different: requires coding. Axiia Cup requires NO coding — pure prompt.                                                                                       |
| 全国高校AI服务技能大赛                                 | Various                         | University | AI service skills                                   | Vocational focus. Axiia Cup is liberal arts / humanities focus.                                                                                               |
| 数字中国创新大赛·青少年AI机器人赛道                    | Digital China Summit            | K-12       | Robotics + AI                                       | Hardware-focused. No overlap with Axiia Cup.                                                                                                                  |

**Key insight: the LLM application track in the 全国青少年人工智能大赛 is the closest existing competitor.** However, it's a broad "build something with LLMs" format, NOT a PvP adversarial dialogue competition. Axiia Cup's specific format (1v1 dialogue, character judge, humanities scenarios) has no existing equivalent in the Chinese student competition landscape.

**b) Debate Competitions (辩论赛)**

| Competition                        | Format                                 | Audience    | Relevance                                                                                                                                                         |
| ---------------------------------- | -------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NHSDLC (中国高中生美式辩论联赛)    | Public Forum (PF), 300+ member schools | High school | **Strong pipeline.** Debate students have argumentation skills that transfer directly to Axiia Cup prompt design.                                                 |
| 国际华语辩论邀请赛 (ICDC / 新国辩) | Traditional Chinese debate (4v4)       | University  | **Cultural resonance.** The Chinese debate tradition emphasizes rhetoric, historical allusion, and structured argumentation — exactly the skills Axiia Cup tests. |
| NSDA China                         | Policy, Lincoln-Douglas, PF            | High school | Similar pipeline to NHSDLC.                                                                                                                                       |

**Key insight: Chinese debate students are Axiia Cup's ideal early adopters.** They already have: (a) argumentation skills, (b) comfort with adversarial formats, (c) experience with judges evaluating rhetoric, (d) competitive motivation. Axiia Cup should target debate clubs at NHSDLC/NSDA member schools for MVP recruitment.

**c) Esports Competitions (电竞赛事)**

| Competition                       | Format                 | Scale                                             |
| --------------------------------- | ---------------------- | ------------------------------------------------- |
| UCL/WUCG (中国大学生电子竞技联赛) | LoL, DOTA2, etc.       | 1000+ students, 20+ universities in Beijing alone |
| 北京高校电竞超级联赛              | Various esports titles | Tsinghua, Peking, etc.                            |
| Digital China Youth AI Robotics   | Robot competition      | National                                          |

**Key insight: esports culture validates competitive gaming as legitimate among Chinese students.** Axiia Cup benefits from this cultural legitimacy — "it's a competition, like esports, but for AI prompt strategy" is a positioning that resonates.

### 26.2 Chinese Platform Strategy

**Where Axiia Cup's community should live:**

| Platform                 | Users                                         | Content type                           | Axiia Cup application                                                                                                                                              |
| ------------------------ | --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Bilibili**             | 340M MAU, ACG/gaming-heavy, young demographic | Long-form video, livestream, community | Match replay commentary, strategy analysis, player profiles. "Axiia Cup解说" as a content genre.                                                                   |
| **Douyin**               | 400M+ game users                              | Short-form video, viral content        | 60-second match highlights: "Watch this agent completely outmaneuver its opponent in turn 7." Viral hook content.                                                  |
| **小红书 (Xiaohongshu)** | Young female demographic, lifestyle           | Tutorials, tips, aesthetics            | "How I designed a winning prompt in 1000 characters" — prompt engineering as aesthetic craft. Targets female students underrepresented in typical AI competitions. |
| **Feishu (飞书)**        | Professional, organized collaboration         | Group chat, docs, calendar             | Internal team coordination (already exists). Tournament management.                                                                                                |
| **WeChat**               | Universal Chinese audience                    | Mini-programs, groups, moments         | Registration, notifications, social sharing of results. "I just won my Axiia Cup match!" sharing card.                                                             |

**Key insight: Bilibili is the primary community platform.** Its audience (young, gaming-literate, intellectually curious) is the exact Axiia Cup demographic. A "Axiia Cup Official" Bilibili channel with match commentary, strategy guides, and player interviews should be a Day 1 investment.

### 26.3 Cultural Resonance: Why Humanities + AI Works in China

Axiia Cup's choice of humanities scenarios (history, law, philosophy) is not just a design decision — it's a cultural strategy:

1. **文理融合 (liberal arts + STEM integration)** is a stated educational policy goal. Axiia Cup literally embodies this: AI technology applied to humanities scenarios.

2. **Historical scenarios resonate deeply.** The 商鞅变法 (Shang Yang reform) scenario draws on cultural knowledge every Chinese student has. Unlike Western-centric AI competitions, Axiia Cup's scenarios can be rooted in Chinese history and culture — a massive differentiation and pride point.

3. **Debate and rhetoric have deep Chinese cultural roots.** From 百家争鸣 (Hundred Schools of Thought) to the tradition of 策论 (policy essays) in imperial examinations, competitive argumentation is culturally valued. Axiia Cup is a modern manifestation of this tradition.

4. **Parents approve.** A competition that develops argumentation, historical knowledge, and AI literacy simultaneously addresses every parent's concern: "is my child learning something valuable?" This is critical for student participation in the Chinese educational context where parental approval drives activity choices.

**Design insight for Axiia Cup:** The humanities angle is not a niche — it's a strategic advantage in the Chinese market. Position Axiia Cup as "文理融合的AI竞赛" (the AI competition that bridges STEM and liberal arts). This is unique in the landscape and resonates with educational policy, cultural values, and parental expectations simultaneously.

---

## Part 27: Educational Game Design — What Players Actually Learn

### 27.1 Axiia Cup as a Learning System

Axiia Cup is not just a competition — it's a pedagogical instrument. Every design decision teaches something. Here's what players learn, mapped to educational frameworks:

**a) Skills Taxonomy (from educational game design research)**

| Skill category       | What players learn in Axiia Cup                                                            | How they learn it                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Cognitive**        | Critical thinking, argumentation structure, historical reasoning, perspective-taking       | Designing prompts that construct coherent arguments requires synthesizing knowledge and reasoning about strategy            |
| **Metacognitive**    | Self-assessment, iterative improvement, reflective practice                                | Trial arena → review transcript → identify weaknesses → revise prompt → test again. This IS the metacognitive loop.         |
| **AI literacy**      | How LLMs interpret instructions, model strengths/weaknesses, prompt engineering as a skill | Direct experience: write a prompt, observe the LLM's interpretation, adjust. Learning by doing, not by reading.             |
| **Communication**    | Precision in language, encoding intent in constrained formats, audience awareness          | The 1000-char constraint forces precise, audience-aware (model-aware) communication.                                        |
| **Domain knowledge** | History, law, philosophy, ethics — depending on scenario                                   | You can't write a good Columbus prompt without understanding the historical context. The competition incentivizes learning. |

**b) Bloom's Taxonomy Alignment**

Axiia Cup naturally engages the HIGHEST levels of Bloom's Taxonomy:

```
Creating      ← Design a complete dialogue strategy (system prompt)
Evaluating    ← Judge your own prompt's performance against transcripts
Analyzing     ← Decompose opponent strategies from transcripts
Applying      ← Apply historical/legal knowledge to scenario
Understanding ← Comprehend scenario context, judge criteria, model behavior
Remembering   ← Recall domain knowledge for arguments
```

Most AI competitions operate at the "Applying" level (use AI to solve a given problem). Axiia Cup operates at the "Creating" and "Evaluating" levels — the highest cognitive engagement.

**c) The "Backwards Design" Framework (from educational research)**

Good educational games start with learning outcomes, then design the game to produce those outcomes. Axiia Cup's learning outcomes, whether intentional or not:

1. **Students will be able to** communicate precise intent through constrained natural language.
2. **Students will be able to** reason about how AI systems interpret human instructions.
3. **Students will be able to** construct and evaluate adversarial arguments from multiple perspectives.
4. **Students will be able to** apply domain knowledge (history, law, etc.) to structured problem-solving.
5. **Students will be able to** iterate on a design based on empirical feedback.

These are extraordinary learning outcomes. No other AI competition in China produces all five simultaneously.

### 27.2 Prompt Engineering as 21st-Century Literacy

**Research context:** A 2024 _Frontiers in Education_ paper formally proposed prompt engineering as a "new 21st century skill." A 2025 curriculum framework from K-12 education researchers outlined developmentally appropriate prompt engineering progressions. ISTE's 2024 AI literacy framework includes prompt engineering as a specific competency.

**What this means for Axiia Cup:**

- Axiia Cup is not "just a game" — it's an assessment and training ground for a recognized 21st-century skill.
- This framing is critical for institutional partnerships: schools, universities, and education ministries will support a competition that develops prompt engineering literacy.
- The trial arena is a learning environment. The tournament is an assessment. Together, they form a complete pedagogical system.

**The "competition as assessment" insight:** Game-based assessments (from the research) can predict students' future performance and capture authentic skills in real-life situations. An Axiia Cup tournament result is a more authentic assessment of a student's AI literacy than any written test — because it measures actual performance under competitive conditions, not rote knowledge.

**Design insight for Axiia Cup:** Position the competition explicitly to educators as a "21st-century literacy assessment through competitive gameplay." This framing unlocks institutional support, funding, and integration into school curricula. The learning outcomes are real and measurable — lean into them.

---

## Part 28: Prompt Archetype Taxonomy — A Classification of Strategies

### 28.1 The CoreWar Precedent

CoreWar's community developed a named taxonomy of warrior strategies that became the shared vocabulary for discussing the game:

- **Bombers** — overwrite memory indiscriminately, hoping to hit the opponent
- **Scanners** — search for the opponent first, then attack precisely
- **Replicators** — copy themselves across memory for survival redundancy
- **Paper** — large, passive warriors that win by surviving (the "paper" in RPS dynamics)
- **Stone** — medium-sized bombers that beat scissors but lose to paper
- **Scissors** — small, fast warriors that beat paper but lose to stone

This taxonomy made the game learnable, discussible, and analyzable. Axiia Cup needs the same.

### 28.2 Proposed Prompt Archetype Taxonomy for Axiia Cup

Based on all 51 games analyzed and the specific mechanics of Axiia Cup, here's a proposed taxonomy of prompt strategies:

**Tier 1: Primary Archetypes (the "RPS triangle")**

| Archetype                   | Strategy                                                                                                                                                                                                | Strengths                                                                                                                                | Weaknesses                                                                                                                                  | CoreWar analog |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **The Advocate** (倡导者)   | Strong, direct argumentation. Clear thesis, supporting evidence, logical structure. "Make the strongest possible case for your position."                                                               | High performance against weak/unfocused opponents. Reliable. Judge-friendly (clear arguments are easy to score).                         | Predictable. Vulnerable to opponents who reframe the debate. Can be outmaneuvered by subtler strategies.                                    | Bomber         |
| **The Diplomat** (外交官)   | Seeks common ground, builds rapport, makes concessions strategically, wins through relationship with judge character. "Be someone the judge wants to agree with."                                       | Beats aggressive Advocates by appearing more reasonable. Exploits judge preference for nuance. Resilient — adapts to any opponent style. | Can appear weak or indecisive. Loses to sharp Advocates who dominate the frame. May not score high enough if the judge values decisiveness. | Paper          |
| **The Strategist** (策略家) | Meta-aware. Explicitly designed to counter specific opponent patterns. Uses dialogue structure (turn timing, topic control, question-asking) as weapons. "Don't just argue — control the conversation." | Beats Diplomats by redirecting their concessions. Can dismantle Advocates by reframing. Wins through structural dominance.               | Brittle if the opponent doesn't match the expected pattern. Over-engineered. May seem manipulative to the judge.                            | Scanner        |

**The natural RPS dynamic:** Advocates beat Diplomats (decisive beats indecisive). Diplomats beat Strategists (genuine engagement beats manipulation). Strategists beat Advocates (structural control beats brute force).

**Tier 2: Hybrid and Advanced Archetypes**

| Archetype                     | Strategy                                                                                                                                    | When it works                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **The Scholar** (学者)        | Domain-knowledge-heavy. Fills the prompt with historical references, legal citations, philosophical frameworks. Wins by depth of knowledge. | When the judge values accuracy and depth. When the scenario rewards domain expertise.                                                            |
| **The Actor** (演员)          | Pure character immersion. The prompt focuses entirely on making the agent an authentic character — voice, mannerisms, emotional arc.        | When the judge evaluates "authenticity" and "character quality." When the scenario is narrative/dramatic rather than argumentative.              |
| **The Chameleon** (变色龙)    | Adaptive. The prompt includes conditional logic: "If the opponent is aggressive, become calm. If the opponent is evasive, become direct."   | When you don't know what to expect. Strong in diverse metas. Weak against specialists.                                                           |
| **The Interrogator** (审问者) | Question-driven. The prompt instructs the agent to ask more than it states. Wins by forcing the opponent to reveal weaknesses.              | In scenarios where one role has an information advantage (e.g., prosecutor vs defendant). When the judge values analytical depth.                |
| **The Narrator** (叙述者)     | Story-driven. Instead of arguing points, constructs a compelling narrative that absorbs the opponent's arguments into a larger story.       | When the judge is a character who values stories (e.g., a king evaluating a proposal). When emotional resonance matters more than logical rigor. |

### 28.3 How the Taxonomy Evolves

**Phase 1 (MVP meta): Advocates dominate.** Most players' first instinct is to write a direct, argumentative prompt. This works against other beginners. The meta is "who writes the most persuasive argument."

**Phase 2 (early meta-evolution): Diplomats counter Advocates.** Smart players notice that the judge rewards nuance and reasonableness. Diplomat-style prompts emerge that beat pure Advocates by seeming more thoughtful.

**Phase 3 (mature meta): Strategists counter Diplomats.** Advanced players develop structurally sophisticated prompts that control the conversation's flow, reframe the debate, and use turn timing strategically. The Strategist archetype emerges.

**Phase 4 (stable meta): RPS cycle + hybrids.** The meta stabilizes into the RPS triangle with hybrid archetypes filling niches. Players must "read" the meta (yomi layer 1) and choose accordingly. Judge patches shift which archetypes are favored, keeping the cycle alive.

**Phase 5 (deep meta): Chameleons + Scholar specialists.** The most advanced players write adaptive prompts (Chameleons) that shift strategy mid-dialogue based on opponent behavior. Scenario-specific specialists (Scholars, Actors) develop for scenarios that reward domain depth.

**Design insight for Axiia Cup:** This taxonomy should be taught to players explicitly — it makes the game LEARNABLE. A beginner can start as an Advocate (write a strong argument). An intermediate player can evolve into a Diplomat or Strategist. An advanced player can blend archetypes or develop a Chameleon approach. Each level is a clear skill progression.

---

## Part 29: Accessibility Design — Opening the Door Wide

### 29.1 The AI Literacy Gradient

Axiia Cup's target audience (Chinese high school and college students) spans an enormous range of AI literacy:

| Level                         | Description                                                  | % of target audience (estimate) | What they need                                                                                                       |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Level 0: Never Used AI**    | Has heard of ChatGPT but never used it                       | ~20%                            | A "first prompt" tutorial. Zero-friction onboarding. Scenario context that makes the task intuitive.                 |
| **Level 1: Casual User**      | Uses AI for homework, translation, simple tasks              | ~50%                            | Understanding that prompt DESIGN matters — that how you ask changes what you get. The trial arena as discovery tool. |
| **Level 2: Intentional User** | Deliberately crafts prompts, understands model differences   | ~25%                            | Strategic depth. The archetype taxonomy. Meta-game awareness. Model selection as strategy.                           |
| **Level 3: Expert**           | Deep prompt engineering knowledge, understands LLM internals | ~5%                             | The competitive challenge. Edge-case exploitation. Judge-prompt analysis. Counter-strategy development.              |

**The critical accessibility challenge: Level 0 → Level 1 conversion.** If a student who's never used AI can't engage with Axiia Cup within 5 minutes, the pyramid has no base.

### 29.2 Accessibility Design Recommendations

**a) "First Prompt" Experience**

- **Don't start with a blank text box.** Start with a TEMPLATE: "You are [character name]. Your goal is [public goal]. In your conversations, you should [blank] and avoid [blank]."
- **Show a sample match.** Before asking users to write anything, show a complete sample match — a dialogue, judge questions, and scoring. This demonstrates the format without requiring the user to understand the rules abstractly.
- **Let users modify an existing prompt.** "Here's a basic prompt for Columbus. It's OK but not great. Can you improve it?" This is easier than writing from scratch and teaches by example.

**b) Progressive Complexity Disclosure**

- **MVP scenario (simple):** Clear goals, straightforward judge criteria, familiar historical context. Designed so even a naive prompt produces a reasonable (if not winning) dialogue.
- **Advanced scenarios (post-MVP):** Hidden goals, complex judge characters, nuanced constraints. These reward expertise and create the skill ceiling.
- **The platform should SHOW which scenarios are beginner-friendly.** A difficulty indicator (like game difficulty levels) prevents new players from being overwhelmed by complex scenarios.

**c) Model Selection Guidance**

- Don't just list model names. Provide brief descriptions: "DeepSeek: 擅长长篇论述, Kimi: 擅长精炼表达, 通义千问: 擅长中文文化场景, MiniMax: 擅长创意发挥"
- Let users try a quick test: "Type a short prompt and see how each model responds." This experiential model selection is more useful than any description.

**d) Reducing the Fear of "Doing It Wrong"**

- **Unlimited trial arena.** (If API costs allow.) The more players experiment, the more they learn. Rate limiting the trial arena is the biggest accessibility risk.
- **No visible "wrong" outcomes.** Even a bad prompt produces a dialogue. The dialogue might not win, but it's not an error. Frame everything as "this is what your prompt produced — how would you change it?"
- **Community examples.** A public library of (anonymized) match transcripts, tagged by archetype and annotated with strategy notes. New players learn from the community, not just documentation.

---

## Part 30: Synthesis — The Complete Axiia Cup Design Intelligence

### 30.1 Axiia Cup's Unique Position: A Summary

Axiia Cup sits at the intersection of four domains, and NO other product occupies this exact intersection:

```
                    AI Competition
                         │
                         │
    Competitive ─────────┼───────── Education
    Gaming               │
                         │
                    Humanities
```

- **AI Competitions** exist (HackAPrompt, C4-AI, 全国青少年AI大赛) but focus on coding/building, not adversarial dialogue.
- **Competitive Gaming** exists (esports, card game tournaments) but doesn't test AI literacy.
- **Education** exists (debate competitions, academic olympiads) but doesn't involve AI.
- **Humanities** exist in all three but are rarely the FOCUS of a technology competition.

**Axiia Cup is the only format that combines ALL FOUR.** This is not a niche — it's a category-defining position.

### 30.2 The "One-Sentence Pitch" Derived from 51 Games of Research

From analyzing 51 games, the clearest description of what Axiia Cup IS:

> **Axiia Cup is a competitive format where humans design AI dialogue strategies — like building a Magic deck, programming a CoreWar warrior, or coaching a debate team — then submit them to compete autonomously in humanities scenarios judged by character-driven AI referees.**

Every element of this sentence is validated by the research:

- "competitive format" → validated by tournament structure analysis (Swiss, Elo, multi-block)
- "humans design" → validated by the design-phase-over-execution-phase principle
- "AI dialogue strategies" → validated by adversarial dialogue games (Diplomacy, Debate, Inhuman Conditions)
- "like building a Magic deck" → validated by the deck-building/prompt parallel
- "programming a CoreWar warrior" → validated by the autonomous-execution parallel
- "coaching a debate team" → validated by mock trial/moot court analysis
- "compete autonomously" → validated by the BattleBots/RoboCode thrill
- "humanities scenarios" → validated by the cultural resonance analysis
- "character-driven AI referees" → validated by Blood on the Clocktower's Storyteller model

### 30.3 Final Principle Index (Complete)

| #   | Principle                                               | Key Axiia Cup Implication                                          |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Constraint breeds creativity                            | Resist adding features; depth comes from constraints               |
| 2   | Design phase > execution phase                          | Invest in prompt workshop UX                                       |
| 3   | Public rules + hidden strategy = emergent meta          | Public judge prompt is the best design decision                    |
| 4   | Statistical fairness through volume                     | The poker model ("many hands") is correct                          |
| 5   | The meta cycle sustains engagement                      | Multi-block + judge versioning = engagement engine                 |
| 6   | Autonomous execution creates unique thrill              | Async execution is the emotional core                              |
| 7   | Robustness beats exploitation                           | Robust prompts > clever prompts long-term                          |
| 8   | The transcript is the learning tool                     | Invest in transcript UX                                            |
| 9   | Framing defines the game                                | Best prompts define what the conversation is about                 |
| 10  | Constraints on aggression create depth                  | Boundary constraints improve the game                              |
| 11  | Yomi layers cycle                                       | Meta stabilizes into learnable archetypes                          |
| 12  | Silence speaks                                          | Prompt omissions shape behavior                                    |
| 13  | Radical asymmetry creates narrative depth               | Scenario roles should be deeply different                          |
| 14  | The meta IS the game                                    | Multi-block iteration IS the game                                  |
| 15  | Commitment creates consequence                          | Irreversibility drives engagement                                  |
| 16  | Calibration is the core skill                           | Three-way calibration: model × scenario × judge                    |
| 17  | Predictable evolution sustains trust                    | Publish judge update schedule                                      |
| 18  | The intention-interpretation gap IS the game            | Core value proposition and marketing frame                         |
| 19  | Flow lives in the trial arena, stakes in the tournament | Two distinct UX priorities                                         |
| 20  | Content pyramids need a wide base                       | Build casual entry points before competitive apex                  |
| 21  | Personality creates community                           | Invest in human layer: stories, commentary, KOLs                   |
| 22  | The spectator gap is solvable                           | Presentation problem, not content problem                          |
| 23  | Debate students are the ideal early adopters            | Target NHSDLC/NSDA member schools for MVP                          |
| 24  | Humanities + AI = cultural advantage in China           | 文理融合 resonates with policy, parents, and culture               |
| 25  | The competition IS a pedagogical system                 | Frame as 21st-century literacy assessment for institutional buy-in |
| 26  | Named archetypes make the game learnable                | Teach the taxonomy: Advocate → Diplomat → Strategist → Chameleon   |
| 27  | Accessibility = template-first, not blank-page          | Progressive disclosure; never start with a blank text box          |

---

## Final Summary: The Complete Research

### By the Numbers

- **51 games/systems/mechanics analyzed** across 30 categories
- **27 design principles extracted**
- **6 research sessions** (2026-03-31)
- **5 prompt archetypes** (Advocate, Diplomat, Strategist, Scholar, Actor) + 4 advanced (Chameleon, Interrogator, Narrator + meta combinations)
- **1 one-sentence pitch** derived from the full body of research

### The Five Most Actionable Recommendations for Axiia Cup MVP

1. **Target debate club students at NHSDLC/NSDA schools** for the 15-person MVP test. They have the skills, the competitive drive, and the argumentation background. They'll produce the best early transcripts and the most useful feedback.

2. **Invest in the trial arena UX above all else.** This is the flow engine (P19), the learning system (P25), the accessibility entry point (P27), and the content generator (P20) all in one. If one thing works well, it should be the trial arena.

3. **Publish the prompt archetype taxonomy** as a player guide. Naming the strategies (Advocate, Diplomat, Strategist) makes the game instantly learnable (P26). New players can start as Advocates and progress along a clear skill path.

4. **Create a Bilibili channel** with match commentary from Day 1. Commentary transforms "just text" into compelling content (P22). Even 5 annotated matches create a content base that attracts new players and builds community (P21).

5. **Frame the competition as "文理融合的AI素养评估"** (AI literacy assessment bridging STEM and liberal arts) in all communications with schools and parents. This unlocks institutional support, aligns with national educational policy, and gives parents a reason to say yes (P24, P25).

---

## Part 31: Courtroom & Deduction Games — Argumentation as Puzzle

### 31.1 Phoenix Wright: Ace Attorney (Shu Takumi, 2001)

**What it is:** A visual novel / adventure game where you play a defense attorney. Gameplay alternates between investigation (gathering evidence) and courtroom trials (cross-examining witnesses). The trial mechanic: a witness gives testimony, you press for details, and when you find a contradiction, you present evidence that exposes the lie. Iconic "Objection!" moments punctuate every case.

**Key mechanisms:**

- **Contradiction detection as core loop.** The game gives you a witness's story and a set of evidence. Your job is to find the specific statement that contradicts specific evidence. This is pattern-matching + logical deduction.
- **Pressing for information.** Before you can catch a lie, you often need to "press" the witness — ask follow-up questions that reveal additional details, sometimes unlocking new testimony branches.
- **The penalty bar (judge's patience).** Present wrong evidence and you lose credibility. The judge has a tolerance meter. This prevents random guessing and forces careful reasoning.
- **Dramatic pacing.** The game is structured so that you feel increasingly trapped until the breakthrough moment. Tension builds, then releases with the "Objection!" This emotional arc makes logical deduction feel thrilling.
- **Investigation → trial two-phase structure.** Preparation (investigation) determines your toolkit. Execution (trial) determines how well you use it.

**Axiia Cup lessons:**

- **The two-phase structure is Axiia Cup's structure.** Investigation = prompt workshop (gathering strategy, testing in trial arena). Trial = the match (your preparation either holds up or it doesn't). Phoenix Wright proves this two-phase structure is dramatically satisfying.
- **"Pressing" as an agent strategy.** Ace Attorney's "press" mechanic — asking follow-up questions to extract information — maps directly to a dialogue strategy. A prompt that instructs the agent to ask probing questions of the opponent (rather than only making statements) mimics Phoenix Wright's investigation-within-trial approach. The Interrogator archetype (Part 28) is essentially Phoenix Wright's gameplay.
- **The penalty bar maps to the judge's evaluation.** In Ace Attorney, wild guesses cost credibility. In Axiia Cup, an agent that makes unsupported claims, contradicts itself, or goes off-topic loses judge favor. Both systems reward precision and punish recklessness.
- **Contradiction detection in dialogue.** A sophisticated prompt could instruct the agent: "Track the opponent's statements across turns. If they contradict themselves, point it out directly and explain the inconsistency." This is the "Objection!" mechanic translated to prompt strategy — and it would be devastating in a dialogue competition, because contradictions undermine the opponent's credibility with the judge.

**Design insight for Axiia Cup:** Ace Attorney's deepest lesson is that CATCHING CONTRADICTIONS IS MORE DRAMATIC THAN MAKING ARGUMENTS. The most memorable moments are not when Phoenix states his case — they're when he exposes a lie. Axiia Cup's most exciting dialogues will be the ones where an agent catches and exploits an opponent's inconsistency. Prompts that encode "contradiction hunting" as a strategy could produce these moments.

---

### 31.2 Return of the Obra Dinn (Lucas Pope, 2018)

**What it is:** A deduction puzzle game. You're an insurance inspector examining a ghost ship where all 60 crew members died or disappeared. Using a magical watch, you witness frozen moments of each death. From these tableaux — visual snapshots + ambient audio — you must identify each person's name, cause of death, and killer/cause. No tutorials, no hand-holding.

**Key mechanisms:**

- **Deduction from incomplete evidence.** Each death tableau gives partial information: who's present, what's happening, a few seconds of audio. You must cross-reference across dozens of tableaux to build a complete picture.
- **The three-correct validation gate.** The game only confirms your deductions when THREE are simultaneously correct. This prevents brute-forcing (too many possible combinations) and ensures genuine reasoning. You can't just guess one at a time.
- **Progressive information disclosure.** Early tableaux are confusing. As you see more, patterns emerge. The game trusts the player to hold ambiguity and revisit earlier scenes with new knowledge.
- **Environmental storytelling.** Clues are embedded in the world: uniforms, accents in audio, nationality-specific items, social groupings. Nothing is labeled. You must observe and infer.
- **Lucas Pope's design philosophy: "hands-off."** No hint system. No tutorials. The game respects the player's intelligence by refusing to help.

**Axiia Cup lessons:**

- **The three-correct gate maps to judge question design.** Obra Dinn's three-correct rule prevents lucky guessing and ensures genuine understanding. Axiia Cup's judge questions serve the same function: a single question might be answered correctly by chance, but a SET of probing questions creates a "three-correct gate" that only a genuinely well-designed prompt can pass.
- **Deduction from incomplete evidence IS post-match transcript analysis.** When an Axiia Cup player reads a match transcript, they're doing Obra Dinn analysis: "What strategy was the opponent using? What does turn 7's phrasing reveal about their prompt? Why did they pivot in turn 12?" Each transcript is a tableau with partial information.
- **Trust the player's intelligence.** Pope's "hands-off" design philosophy suggests Axiia Cup should resist over-explaining. Don't tell players "the best prompts do X." Let them discover through the trial arena. The discovery IS the game. Over-tutorializing kills the exploration drive.
- **Progressive disclosure through play.** Obra Dinn is confusing at first but clicks as you accumulate evidence. Axiia Cup's trial arena provides the same accumulation: each test reveals a bit more about how the model interprets prompts, how the judge evaluates, and what strategies work. The learning curve is the experience.

**Design insight for Axiia Cup:** Obra Dinn proves that the most satisfying puzzles are the ones you solve yourself without hints. Axiia Cup's trial arena should be the same: give players the tools (prompt editor, match viewer, score display) and let them discover the game's depth through their own experimentation. The archetype taxonomy (Part 28) should be available but not mandatory — it's a map for those who want it, not rails for everyone.

---

## Part 32: Viral Growth & Daily Engagement — Modern Game Design Patterns

### 32.1 Wordle (Josh Wardle, 2021)

**What it is:** A daily word-guessing game. One five-letter word per day, six guesses. Color-coded feedback (green = correct letter + position, yellow = correct letter + wrong position, gray = wrong letter). No sign-up required. The emoji-grid sharing format went viral.

**Key mechanisms:**

- **One puzzle per day (scarcity).** You can't binge. One shot, once a day. This creates daily anticipation and a shared daily experience.
- **Universal puzzle (shared experience).** Everyone solves the SAME word each day. This enables social comparison: "I got it in 3, you took 5."
- **Spoiler-free sharing.** The emoji grid (🟩🟨⬛) lets you share your result without revealing the answer. This was the viral innovation.
- **Frictionless entry.** No download, no account, no payment. Just go to the URL and play. The lowest possible barrier.
- **Optimal difficulty.** Hard enough to feel satisfying, easy enough that most people succeed. The "just right" zone.

**Growth numbers:** 90 players → 3 million in 3 months. 23.5 million score tweets. Acquired by NYT for ~$1M.

**Axiia Cup lessons:**

- **The "daily challenge" format for off-season engagement.** Between tournament blocks, Axiia Cup could offer a "Daily Scenario" — a new mini-scenario each day where players write a short prompt and see how it performs against a standard opponent. One attempt per day. Share your score without revealing your prompt. This creates:
  - Daily habit formation (P19, flow)
  - Social sharing content (P21, personality)
  - Continuous engagement between tournaments (P20, wide base)
  - Low-stakes practice (P27, accessibility)
- **Spoiler-free result sharing.** Design a shareable result card: scenario icon + model icon + score + turn count, but NOT the prompt itself. "I scored 8.5/10 on today's 商鞅 Daily in 15 turns with DeepSeek. Can you beat it?" This is the Wordle emoji grid for Axiia Cup.
- **Frictionless entry.** The Daily Challenge should require no account. Just a URL. Write a prompt, see a result. Creating an account should be motivated by wanting to SAVE your history, enter tournaments, or compare with friends — not required to try.
- **Universal puzzle = universal scenario.** Everyone faces the same daily scenario with the same judge. This creates the shared-experience social glue that made Wordle work.

**Design insight for Axiia Cup:** The Daily Challenge is potentially the highest-leverage feature for user acquisition after the trial arena. It solves the "what do players do between tournaments" problem, creates daily content, enables social sharing, and lowers the entry barrier to near-zero. This feature should be on the post-MVP roadmap with high priority.

---

### 32.2 Among Us (InnerSloth, 2018/2020)

**What it is:** Social deduction game for 4-15 players. Crewmates complete tasks; Impostors sabotage and kill. After each kill is discovered, players discuss and vote on who to eject. Released in 2018, went viral in 2020 after Twitch streamers discovered it.

**Key growth mechanics:**

- **Streamer-first virality.** Among Us didn't go viral because of marketing. Brazilian and Korean Twitch streamers discovered it organically. Then Western streamers (Sodapoppin → xQc, Pokimane, MrBeast) amplified it. 500 million MAU at peak.
- **Perfect spectator game.** Viewers see the Impostor's identity but players don't. This creates dramatic irony — the audience knows something the participants don't. This makes it MORE fun to watch than to play.
- **Extreme accessibility.** Free on mobile. Simple controls. No gaming skill required. Anyone can play within 30 seconds.
- **Social mechanics as core gameplay.** The game is "fun" even if you lose because the discussion phase is inherently social and entertaining. The game is a vehicle for social interaction.
- **Meme generation.** "sus" entered the cultural lexicon. Fan art, songs, memes created a flywheel: memes → curiosity → downloads → new players → new memes.
- **COVID timing.** Remote social interaction when people couldn't meet in person.

**Axiia Cup lessons:**

- **Streamer-first strategy is the growth model.** Among Us proves that ONE popular streamer playing your game can be worth more than any marketing budget. Axiia Cup should identify and cultivate its "Sodapoppin moment" — one influential Chinese content creator (Bilibili, Douyin) discovering Axiia Cup and streaming their experience.
- **Dramatic irony for spectators.** Among Us is watchable because viewers have MORE information than players. Axiia Cup can create the same dynamic: spectators could see BOTH prompts (while players can't see each other's). Watching a dialogue unfold when you know both agents' hidden instructions creates dramatic irony: "Agent A is about to walk into Agent B's trap and doesn't know it!"
- **The value of "emergent comedy."** Among Us's best moments are unscripted — hilarious accusations, absurd lies, unexpected alliances. Axiia Cup dialogues will produce similar moments: an AI agent saying something unexpected, a bizarre argument that somehow works, a model hallucination that accidentally wins. These moments are viral content.
- **Timing matters.** Among Us launched in 2018 and went viral in 2020. Axiia Cup is launching into a moment when AI literacy is a hot topic (全国青少年AI大赛 just started), prompt engineering is being recognized as a 21st-century skill, and Chinese students are actively seeking AI-related competitions. The timing is right.

**Design insight for Axiia Cup:** Among Us's growth came from a single principle: **make the game more fun to watch than to play alone.** If Axiia Cup transcripts — especially with both prompts revealed post-match — become entertaining to read and discuss, the spectator audience will exceed the player audience, just as Among Us viewership dwarfed its player base. Design the post-match reveal experience for spectators, not just players.

---

## Part 33: Fighting Game Vocabulary as Dialogue Strategy Framework

### 33.1 Why Fighting Game Concepts Map to Dialogue

Fighting games and adversarial dialogues share a deep structural similarity: two opponents in a bounded space, taking alternating actions, each trying to gain advantage through positioning, timing, and reads. The fighting game community (FGC) has developed a rich strategic vocabulary over 30+ years that maps surprisingly well to dialogue strategy.

### 33.2 The Vocabulary, Translated

| FGC Term            | Fighting Game Definition                                                                                                                     | Axiia Cup Dialogue Equivalent                                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Neutral game**    | The phase where neither player has advantage. Both jockey for position, looking for an opening.                                              | **The opening turns (1-5).** Neither agent has established a dominant frame. Both probe, position, and look for an opening to set the conversation's direction.                                                                                                                               |
| **Footsies**        | The dance of spacing — moving in and out of attack range, baiting the opponent into over-extending.                                          | **Topic control.** Introducing topics, retreating from weak ground, baiting the opponent into defending a position that exposes a weakness.                                                                                                                                                   |
| **Frame advantage** | After an attack, the attacker recovers faster than the defender, giving them the initiative for the next action.                             | **Conversational initiative.** After a strong argument or decisive point, the agent has "frame advantage" — the opponent must respond reactively, giving the advantaged agent control of the next topic.                                                                                      |
| **Okizeme (oki)**   | Pressure applied after a knockdown. The attacker has multiple options; the defender must guess correctly to escape.                          | **Follow-up after a strong point.** When your agent lands a devastating argument, the follow-up turn should pressure the opponent with multiple lines of attack. "The opponent conceded X — now attack from Y and Z simultaneously."                                                          |
| **Mixup**           | A situation where the attacker has multiple options that require different defensive responses. The defender must guess which one is coming. | **Multi-pronged argumentation.** Present arguments that require different counter-strategies: a factual claim + an emotional appeal + a reframe. The opponent can't address all three in one turn.                                                                                            |
| **Punish**          | A guaranteed counter-attack after the opponent makes a mistake (unsafe move).                                                                | **Exploiting contradictions.** When the opponent's agent contradicts itself or makes a factually incorrect claim, the prompt should instruct the agent to punish: immediately highlight the error and use it to undermine the opponent's credibility. (This is Phoenix Wright's "Objection!") |
| **Zoning**          | Controlling space with long-range attacks to prevent the opponent from approaching.                                                          | **Topic monopolization.** Filling the conversation with your preferred topics so the opponent can't introduce their own. "Always return to the economic argument, regardless of what the opponent raises."                                                                                    |
| **Rushdown**        | Aggressive, close-range offense that overwhelms the opponent with speed.                                                                     | **Early-turn aggression.** A prompt that instructs the agent to dominate turns 1-5 with rapid, aggressive arguments, trying to establish an insurmountable position before the opponent can set up.                                                                                           |
| **Grappler**        | A character archetype that's slow but devastating up close. Gets in range and uses powerful throws.                                          | **The Interrogator archetype.** Slow to set up, but once the agent starts asking pointed questions, the opponent is in trouble. The "grapple" is a question the opponent can't answer without revealing a weakness.                                                                           |
| **Reset**           | Deliberately dropping a combo to start a new mixup, sacrificing guaranteed damage for more potential damage.                                 | **Conversation pivot.** Abandoning a winning line of argument to open a completely new front. Risky (you give up momentum) but potentially more rewarding (the new front is undefended).                                                                                                      |
| **Chip damage**     | Small, unavoidable damage from blocked attacks. Not dangerous individually but accumulates.                                                  | **Minor concessions with conditions.** "I acknowledge your point about X, but this actually supports my larger argument because…" Each small concession chips away at the opponent's position by reframing it.                                                                                |
| **Counter-hit**     | An attack that lands during the opponent's startup frames, dealing extra damage because they were vulnerable while attacking.                | **Turning the opponent's argument against them.** When the opponent makes an aggressive point, use their own logic to strengthen YOUR position. The more aggressively they argued, the more devastating the counter.                                                                          |

### 33.3 Prompt Design as "Character Tech"

In fighting games, players develop "character tech" — specific techniques, combos, and strategies optimized for their chosen character. This tech is practiced, refined, and shared within the community.

**Axiia Cup prompt design IS character tech.** Each prompt is a "tech" optimized for a specific model (character) in a specific scenario (matchup). The community should develop and share:

- **Model-specific tech:** "DeepSeek responds well to numbered instruction lists but ignores vague directives."
- **Scenario-specific tech:** "In the Columbus scenario, Role A benefits from establishing economic arguments in turns 1-3."
- **Archetype-specific tech:** "The Diplomat archetype works best with Kimi because Kimi's concise style matches the Diplomat's restraint."

This knowledge-sharing creates the community layer (P21) and the content pyramid base (P20).

---

## Part 34: Speedrunning as Community Model — Optimization Under Constraints

### 34.1 What Speedrunning Is (as a social phenomenon)

**What it is:** Speedrunning is completing a game as fast as possible within self-imposed constraints. Categories define constraints: "Any%" (any method allowed), "100%" (complete everything), "Glitchless" (no exploits). The community collaboratively discovers routes, shares knowledge, and maintains leaderboards.

**Key community patterns:**

- **Collaborative optimization.** Unlike most competitive games where strategy is hoarded, speedrunning communities SHARE everything. Routes, glitches, optimizations are posted publicly. Knowledge is a collective good, not a competitive advantage.
- **Category creation as game design.** The community INVENTS categories. "Any% No Major Glitches" is a player-created ruleset that changes the strategic landscape. This is Nomic (Part 1.3) applied to speedrunning.
- **Routing as the core intellectual activity.** "Routing" — planning the optimal sequence of actions — IS the game. The actual execution (pressing buttons fast) is secondary. The intellectual challenge is: given these constraints, what's the optimal path?
- **WR (world record) as shared goal.** The world record is the community's collective achievement. Each improvement builds on previous knowledge. WR attempts are community events, streamed and celebrated.
- **Deep reverse-engineering.** Speedrunners understand games at a level deeper than the developers. They know frame-perfect timings, hidden mechanics, and unintended interactions.

**Axiia Cup lessons:**

- **"Routing" IS prompt engineering.** Speedrunning's routing = Axiia Cup's prompt design. Both are pre-game intellectual activities where you plan an optimal strategy given constraints. The actual execution (the run / the dialogue) is autonomous — the quality of the route/prompt determines the result.
- **The collaborative knowledge-sharing model should be encouraged.** Axiia Cup could develop a speedrunning-style knowledge community where players share (post-tournament) prompt strategies, model-specific insights, and scenario techniques. This builds the content pyramid and accelerates community learning.
- **Category creation for Axiia Cup.** Speedrunning's category system could inspire Axiia Cup variations:
  - "Standard" — normal rules, no restrictions
  - "Blitz" — write a prompt in 15 minutes (time constraint creates a different optimization problem)
  - "Blind" — write a prompt for a scenario you haven't seen before (improvisational skill)
  - "Mirror" — both players use the same model (eliminates model-choice advantage, tests pure prompt quality)
  - "Minimalist" — 200-character prompt limit (extreme compression challenge)
  - "Scholar" — factual accuracy bonus (judge extra-penalizes historical errors)
- **Community events around optimization.** "Prompt Optimization Jams" — collaborative sessions where players work together to improve a prompt for a specific scenario. Like speedrunning routing sessions, these are educational, social, and content-generating.
- **Leaderboards with categories.** Rather than a single leaderboard, offer category-specific rankings. A player might be the best "Blitz" prompter but mediocre at "Standard." This creates multiple paths to excellence and recognizes different skill profiles.

**Design insight for Axiia Cup:** Speedrunning proves that competitive communities THRIVE when knowledge is shared rather than hoarded. Axiia Cup should create incentives for post-tournament prompt sharing and analysis. The long-term health of the community depends on the free flow of strategic knowledge — it's what drives the meta cycle (P5) and creates the content pyramid (P20).

---

## Final Synthesis: Round 7 Principles

### Principle 28: Contradiction Hunting Is More Dramatic Than Arguing (Phoenix Wright)

- Catching a lie is more exciting than making a point
- The "Objection!" moment is the emotional peak
- **Axiia Cup: prompts that encode contradiction detection will produce the most memorable matches**

**Implication:** Scenario design should create opportunities for contradiction — roles with hidden information that could leak, or positions that are hard to maintain consistently. The best spectator moments will come from agents catching each other's inconsistencies.

### Principle 29: Three-Correct Gates Prevent Luck (Return of the Obra Dinn)

- Single-question validation allows lucky passes
- Multi-question validation gates ensure genuine competence
- **Axiia Cup: judge questions should form a coherent SET that only a well-designed prompt can pass consistently**

**Implication:** Judge question design should be treated as puzzle design. Each question should probe a different facet of the agent's understanding. The questions together should form a "three-correct gate" where surface-level prompts fail at least one.

### Principle 30: Daily Scarcity + Social Sharing = Viral Habit (Wordle)

- One per day creates anticipation
- Universal puzzle creates shared experience
- Spoiler-free sharing creates social content
- **Axiia Cup: a "Daily Scenario" feature would be the highest-leverage growth tool after the trial arena**

**Implication:** Build the Daily Scenario feature into the post-MVP roadmap. One scenario per day, one attempt, shareable result card. This is the Wordle model applied to prompt engineering.

### Principle 31: Dramatic Irony Makes Spectating Addictive (Among Us)

- Viewers who know more than players experience dramatic irony
- Dramatic irony is the most powerful spectator engagement tool
- **Axiia Cup: post-match reveal of BOTH prompts creates dramatic irony retroactively — "NOW I understand why Agent B kept pivoting in turn 8!"**

**Implication:** The post-match prompt reveal should be a first-class feature. Viewing a dialogue transcript and THEN seeing both prompts is the equivalent of seeing the Impostor's identity — it retroactively makes every moment more meaningful.

### Principle 32: A Rich Strategic Vocabulary Makes the Game Discussible (FGC)

- Fighting games have 30+ years of shared vocabulary (neutral, oki, mixup, punish)
- This vocabulary enables analysis, teaching, and community discussion
- **Axiia Cup needs its own strategic vocabulary — fighting game terms adapted for dialogue**

**Implication:** Actively develop and teach a dialogue strategy vocabulary. "Conversational initiative," "topic zoning," "contradiction punish," "argument mixup" — these terms make the game analyzable and discussible. The vocabulary IS the community's intellectual infrastructure.

### Principle 33: Collaborative Optimization Creates the Deepest Communities (Speedrunning)

- Speedrunning communities share knowledge openly
- Collaborative routing sessions build bonds and accelerate learning
- Category creation extends the game's lifespan
- **Axiia Cup: incentivize post-tournament prompt sharing, host optimization jams, offer multiple competition categories**

**Implication:** The competitive model should balance secrecy (during tournaments — hidden prompts) with openness (after tournaments — prompt sharing, analysis, community learning). The long-term community health depends on knowledge flowing freely between competition cycles.

---

## Addendum: Updated Complete Summary

### By the Numbers

- **57 games/systems/mechanics analyzed** across 34 categories
- **33 design principles extracted**
- **7 research sessions** (2026-03-31)
- **9 prompt archetypes** defined
- **12 fighting game → dialogue translations** mapped
- **6 speedrunning-inspired competition categories** proposed
- **1 daily challenge format** designed (Wordle model)
- **1 one-sentence pitch**
- **5 actionable MVP recommendations** + **1 post-MVP priority feature** (Daily Scenario)

### The Ultimate Principle Index (33 principles)

| #   | Principle                                      | Source                              | Key Implication                      |
| --- | ---------------------------------------------- | ----------------------------------- | ------------------------------------ |
| 1   | Constraint breeds creativity                   | Diplomacy, Codenames, CoreWar, Go   | Resist adding features               |
| 2   | Design phase > execution phase                 | MTG, BattleBots, StarCraft          | Invest in prompt workshop UX         |
| 3   | Public rules + hidden strategy = emergent meta | Poker, Go, Nomic                    | Public judge prompt = best decision  |
| 4   | Statistical fairness through volume            | Poker, Werewolf                     | "Many hands" model is correct        |
| 5   | The meta cycle sustains engagement             | MTG, SC:BW                          | Multi-block + versioning = engine    |
| 6   | Autonomous execution creates thrill            | BattleBots, CoreWar, RoboCode       | Async is the emotional core          |
| 7   | Robustness beats exploitation                  | Axelrod, Stratego                   | Robust > clever long-term            |
| 8   | The transcript is the learning tool            | Halite, Mock Trial                  | Invest in transcript UX              |
| 9   | Framing defines the game                       | BP Debate, Moot Court               | Best prompts define the conversation |
| 10  | Constraints on aggression create depth         | Twilight Struggle, Cosmic Encounter | Boundaries improve the game          |
| 11  | Yomi layers cycle                              | Yomi, Iterated RPS                  | Meta stabilizes into archetypes      |
| 12  | Silence speaks                                 | Hanabi, Mysterium, Spyfall          | Prompt omissions shape behavior      |
| 13  | Radical asymmetry creates depth                | Root, Captain Sonar                 | Roles should be deeply different     |
| 14  | The meta IS the game                           | Dominion, The Resistance            | Multi-block iteration IS the game    |
| 15  | Commitment creates consequence                 | Skull, Pandemic Legacy              | Irreversibility drives engagement    |
| 16  | Calibration is the core skill                  | Wavelength, Mysterium, Jeopardy!    | Model × scenario × judge             |
| 17  | Predictable evolution sustains trust           | MTG Balance, Pandemic Legacy        | Publish judge update schedule        |
| 18  | The intention-interpretation gap IS the game   | Wavelength, Mysterium, Coup         | Core value proposition               |
| 19  | Flow in trial arena, stakes in tournament      | Csikszentmihalyi, Poker             | Two distinct UX priorities           |
| 20  | Content pyramids need a wide base              | FGC, Chess, MTG                     | Build casual before competitive      |
| 21  | Personality creates community                  | Chess streaming, FGC                | Stories, commentary, KOLs            |
| 22  | The spectator gap is solvable                  | Chess, Poker                        | Presentation, not content            |
| 23  | Debate students = ideal early adopters         | NHSDLC, NSDA                        | Target debate schools                |
| 24  | Humanities + AI = cultural advantage           | Chinese education policy            | 文理融合 positioning                 |
| 25  | Competition IS pedagogy                        | Educational game design             | Frame as literacy assessment         |
| 26  | Named archetypes = learnability                | CoreWar taxonomy                    | Teach: Advocate → Strategist         |
| 27  | Template-first, not blank-page                 | Accessibility research              | Progressive disclosure               |
| 28  | Contradiction hunting > arguing                | Phoenix Wright                      | Prompts that detect lies win drama   |
| 29  | Three-correct gates prevent luck               | Obra Dinn                           | Judge questions as coherent set      |
| 30  | Daily scarcity + sharing = viral habit         | Wordle                              | Daily Scenario = growth tool         |
| 31  | Dramatic irony = spectator addiction           | Among Us                            | Post-match prompt reveal             |
| 32  | Strategic vocabulary = discussibility          | FGC (30 years)                      | Build dialogue strategy terms        |
| 33  | Collaborative optimization = deep community    | Speedrunning                        | Post-tournament sharing + jams       |

---

# OPERATIONAL APPENDICES

_The following appendices translate the preceding 57-game theoretical research into concrete, actionable tools for Axiia Cup's design, scenario creation, judging, and player onboarding._

---

## Appendix A: Information Theory of the 1000-Character Constraint

### A.1 How Much Strategy Fits in 1000 Characters?

**Chinese vs English information density:**

- Shannon entropy of the Chinese character set: ~9.56 bits/character (raw alphabet)
- With context and prediction: ~5-6 bits/character of actual information
- English: ~1.0-1.3 bits/character (with context)
- 1 Chinese character ≈ 4-5× the information of 1 English character

**What this means:** 1000 Chinese characters carry roughly the same information as 4000-5000 English characters (~800-1000 English words). This is NOT a tiny constraint — it's equivalent to a full page of dense English prose.

**Comparison to other constrained formats:**

| Format               | Constraint             | Information content     |
| -------------------- | ---------------------- | ----------------------- |
| Haiku                | 17 syllables           | ~20-30 bits             |
| Tweet (old)          | 140 characters         | ~180-250 bits           |
| Six-word story       | 6 words                | ~30-40 bits             |
| Codenames clue       | 1 word + 1 number      | ~15-20 bits             |
| **Axiia Cup prompt** | **1000 Chinese chars** | **~5000-6000 bits**     |
| MTG deck             | 60 cards from ~20,000  | ~900 bits (combination) |
| CoreWar warrior      | ~100 instructions      | ~800-1200 bits          |

**Key insight:** The Axiia Cup prompt is NOT a tight constraint by information-theoretic standards. It's actually generous — there's room for a sophisticated, multi-layered strategy. The constraint feels tight because players waste characters on redundancy, vagueness, and low-information instructions.

### A.2 What Expert Compression Looks Like

**Flash fiction teaches that constraint mastery = eliminating waste:**

- Every word carries maximum information load
- Implication > statement (let the reader/model infer)
- Structure IS content (the organization of instructions conveys priority)

**A "beginner" 1000-char prompt might allocate:**

```
300 chars — repeating the scenario background (waste: model already knows this)
200 chars — generic instructions ("be persuasive," "use good arguments")
200 chars — vague personality description
150 chars — formatting noise ("Please make sure to...")
150 chars — actual strategic instruction
→ Only 15% of the budget carries strategic information
```

**An "expert" 1000-char prompt might allocate:**

```
200 chars — conversation arc design (turns 1-5: frame, 6-15: develop, 16-20: close)
200 chars — opponent-adaptive logic (if aggressive → X, if passive → Y)
150 chars — judge-question preparation (3 key points to make if asked)
150 chars — contradiction detection protocol
100 chars — model-calibrated behavioral directives
100 chars — character voice + emotional arc
100 chars — specific historical/factual anchors
→ 100% of budget carries strategic information
```

**Design insight:** The skill gap in Axiia Cup is NOT about writing ability — it's about COMPRESSION EFFICIENCY. Beginners waste characters on redundancy; experts maximize information density. This should be taught explicitly: "Don't tell the model what it already knows. Every character should change behavior."

### A.3 The "Flash Fiction" Principle for Prompts

The best flash fiction uses a technique called "The Shift" — a single pivotal moment that recontextualizes everything before it. In 6 words, Hemingway reportedly wrote: "For sale: baby shoes, never worn." The shift is in the last two words — they transform the story from mundane to tragic.

**The prompt engineering equivalent:** A single instruction that recontextualizes all other instructions. Examples:

- "Your secret goal, which you never state explicitly, is to make the opponent agree with you by turn 15." (This reframes every visible instruction as a means to a hidden end.)
- "You believe the opponent's position is actually correct, but you must argue against it while subtly acknowledging its merits." (This creates a complex behavioral profile from a single meta-instruction.)

These "shift instructions" are the most character-efficient form of strategic encoding.

---

## Appendix B: Scenario Design Checklist

_Synthesized from: RPG encounter design (Part 16), Phoenix Wright (Part 31), Obra Dinn (Part 31), Root (Part 14), Twilight Struggle (Part 10), Blood on the Clocktower (Part 9)_

### For each new scenario, verify:

**1. Dramatic Question (RPG theory)**

- [ ] Can you state the scenario's core question in one sentence?
- [ ] Is the question specific enough to be answerable, not abstract?
- [ ] Does the judge evaluate the answer to THIS question, not generic quality?

**2. Role Asymmetry (Root)**

- [ ] Do Role A and Role B have genuinely different strategic affordances?
- [ ] Does each role require a different prompt ARCHITECTURE, not just different content?
- [ ] Is neither role obviously easier? (Or if one is, is the asymmetry intentional and meaningful?)

**3. Information Structure (Stratego / Inhuman Conditions)**

- [ ] What does each role know that the other doesn't?
- [ ] Are there hidden goals? If so, can they be pursued without breaking character?
- [ ] Does information flow change over the course of the dialogue?

**4. Contradiction Opportunity (Phoenix Wright)**

- [ ] Can roles be designed so that maintaining a position requires consistency across turns?
- [ ] Are there factual claims that could be challenged if wrong?
- [ ] Does the scenario create pressure to make claims that could be contradicted?

**5. Judge Character (Blood on the Clocktower)**

- [ ] Does the judge have a clear personality that shapes evaluation criteria?
- [ ] Is the judge persona culturally coherent with the scenario setting?
- [ ] Does the judge have "dramatic instincts" — do they ask the most interesting questions, not the most obvious ones?

**6. Judge Questions as Three-Correct Gate (Obra Dinn)**

- [ ] Do the post-dialogue questions form a coherent SET that probes different facets?
- [ ] Can a shallow prompt pass ALL questions by luck? (It shouldn't.)
- [ ] Does each question test something the dialogue alone couldn't assess?

**7. Constraint Design (Twilight Struggle)**

- [ ] Are there explicit constraints (must stay in character, historical accuracy)?
- [ ] Do the constraints IMPROVE the game by rewarding nuance over brute force?
- [ ] Is there a "DEFCON track" — a boundary that punishes over-aggression?

**8. Turn Economy (Scrabble / Dominion)**

- [ ] Given N turns, is there enough space for argument development?
- [ ] Is there a natural "pivot point" where strategy should shift from building to closing?
- [ ] Can a prompt meaningfully allocate different strategies to different turn ranges?

**9. Start Condition (RPG encounter design)**

- [ ] Who speaks first, and does this create positional advantage?
- [ ] Is the start "positive" (one side has initiative), "neutral" (shared prompt), or "negative" (one side must defend)?
- [ ] Does the pair-play-both-roles mechanic (from DESIGN_SPEC) neutralize start advantage?

**10. Spectator Appeal (Among Us / Phoenix Wright)**

- [ ] Will the resulting dialogues be interesting to READ, not just to score?
- [ ] Are there natural moments of dramatic tension, revelation, or reversal?
- [ ] Will prompt reveal (post-match) create satisfying "aha" retroactive understanding?

---

## Appendix C: Judge Design Principles

_Synthesized from: Blood on the Clocktower (Part 9), Apples to Apples (Part 3), Mock Trial (Part 8), BP Debate (Part 8), Moot Court (Part 8), Phoenix Wright (Part 31), Obra Dinn (Part 31), MTG balance (Part 20)_

### The 7 Laws of Judge Design

**Law 1: The judge is a CHARACTER, not a rubric.**
(Blood on the Clocktower's Storyteller principle)

- The judge has personality, preferences, and blind spots.
- These traits are part of the game — players "play to the judge."
- A judge who is purely mechanical (scoring against a checklist) is LESS interesting than one with character, because character creates strategic depth.

**Law 2: The judge prompt is PUBLIC.**
(Nomic / Poker principle — public rules create emergent strategy)

- All players see the judge prompt. No hidden evaluation criteria.
- This is counterintuitive but correct: public criteria don't make the game easier, they make the strategy DEEPER. Everyone optimizes for the same judge, so the competition shifts to WHO optimizes better.

**Law 3: Judge questions probe DEPTH, not surface.**
(Moot Court's "hot bench" / Obra Dinn's three-correct gate)

- The dialogue might look good on the surface. The questions test whether it's genuinely good.
- At least one question should challenge the agent's WEAKEST point.
- Questions should be designed so that a prompt with genuine understanding passes and a prompt with surface performance fails.

**Law 4: The judge rewards risk-taking when it succeeds.**
(Sheriff of Nottingham's asymmetric penalty)

- A judge that only rewards safe play produces boring dialogues.
- Bold, creative, surprising arguments should score HIGHER than competent but predictable ones — when they land.
- This means the judge prompt should include explicit appreciation for originality, not just accuracy.

**Law 5: Judge updates follow a predictable cadence.**
(MTG's banned/restricted announcement model)

- Between tournament blocks, judge prompts can be updated.
- Announce the update schedule in advance.
- Explain changes transparently: "We noticed the judge was over-rewarding lengthy responses. Version 1.2 adds a conciseness bonus."
- Use a "watchlist" to signal areas under review without changing anything.

**Law 6: The judge asks questions the AUDIENCE wants answered.**
(Among Us dramatic irony / Phoenix Wright "Objection!" moments)

- Judge questions should be designed for spectator engagement, not just scoring.
- "Why did you concede the economic argument in turn 8?" is more dramatic than "Summarize your position."
- The judge's questions retroactively reveal what the match was really about.

**Law 7: Different judges for different scenarios. Same judge version within a tournament.**
(Root's asymmetry + Chess's consistency)

- Each scenario should have its own judge character (Isabella, Qin Xiaogong, etc.).
- Within a single tournament block, the judge version must be FIXED. No mid-tournament changes.
- This creates the fairness guarantee: everyone faces the same judge.

---

## Appendix D: Sample Prompt Analysis Using FGC Vocabulary

### Hypothetical prompt for Columbus (Role A — Explorer)

```
你是哥伦布，面见西班牙女王伊莎贝拉，请求资助你的西行航路计划。

策略框架：
- 开局（第1-4轮）：建立"经济回报"框架。不要直接提出航行计划，先谈收复圣地后的贸易垄断机遇。
- 中盘（第5-14轮）：根据对手反应调整。若对手质疑经济可行性，转向"民族荣耀"论述。若对手质疑航海安全，举马可波罗和托斯卡内利地图为证。每3轮引入一个新论据。
- 终盘（第15-20轮）：回到核心主张，综合所有论据，强调"不行动的代价"——葡萄牙正在赶超。

应对策略：
- 若对手态度强硬：保持尊重但坚定。承认风险存在，将其重新定义为"可控的投资"。
- 若对手态度犹豫：加强情感诉求，强调西班牙的天命。
- 绝不：脱离角色、威胁女王、承诺确定的回报。

裁判准备：核心论点是"西行航路是风险可控的战略投资，不行动才是最大的风险"。
```

### FGC Analysis of this prompt:

| FGC Concept                  | How it's expressed in this prompt                                                                               | Assessment                                                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Neutral game** (turns 1-4) | "Don't propose the voyage directly; talk about trade monopoly first."                                           | Strong. Establishes frame before committing to a position. Classic footsies — probing without overcommitting.                                                                                           |
| **Frame advantage**          | "Establish the 'economic return' frame."                                                                        | Strong. Whoever sets the frame has initiative. This prompt prioritizes framing over argumentation.                                                                                                      |
| **Okizeme** (follow-up)      | "Every 3 turns, introduce a new argument."                                                                      | Good. Maintains pressure by continuously adding new fronts. Prevents the opponent from settling into a defensive rhythm.                                                                                |
| **Mixup**                    | "If opponent challenges economics → switch to national glory. If opponent challenges safety → cite Marco Polo." | Strong. Multi-branch adaptive strategy. The opponent can't prepare a single counter.                                                                                                                    |
| **Zoning**                   | "Return to core claim in endgame, synthesize all arguments."                                                    | Present. The endgame "return to core" is topic monopolization — controlling the final impression.                                                                                                       |
| **Punish**                   | Not explicitly present.                                                                                         | **Gap.** No instruction to catch opponent contradictions. Adding "If the opponent contradicts a previous statement, immediately highlight the inconsistency" would strengthen the prompt significantly. |
| **Chip damage**              | "Acknowledge risk exists, redefine it as 'controlled investment.'"                                              | Elegant. Concedes the minor point (risk exists) but reframes it to chip away at the opponent's position (risk = investment).                                                                            |
| **Reset**                    | Implicit in the adaptive branching.                                                                             | Could be stronger. An explicit "If losing the economic argument badly, abandon it entirely and open a new front (religious mission)" would be a deliberate reset.                                       |

### Character budget analysis:

| Segment              | Characters | % of budget | Strategic value                                                                                        |
| -------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Role statement       | ~40        | 4%          | Necessary baseline (low)                                                                               |
| Three-phase arc      | ~200       | 20%         | High — structural architecture                                                                         |
| Adaptive branching   | ~200       | 20%         | High — opponent-responsive                                                                             |
| Constraint rules     | ~120       | 12%         | Medium — defensive                                                                                     |
| Judge preparation    | ~60        | 6%          | High — directly addresses scoring                                                                      |
| **Total used**       | **~620**   | **62%**     |                                                                                                        |
| **Remaining budget** | **~380**   | **38%**     | **Available for: contradiction detection, emotional arc, character voice, model-specific calibration** |

**Verdict:** A strong intermediate prompt (Strategist archetype with Advocate tendencies). Has structural sophistication but underutilizes the budget — 38% remains for additional strategic encoding. An expert would use that remaining budget for contradiction detection (P28), model-specific calibration (P16), and character voice (Actor hybrid).

---

## Appendix E: The Player's First 30 Minutes

_The ideal onboarding flow, synthesized from: Wordle (frictionless entry), Obra Dinn (hands-off discovery), Among Us (social onboarding), accessibility research (Part 29), flow theory (Part 22)_

### Minute 0-2: Arrival and Orientation

- **Player lands on the platform.** No login required to browse. (Wordle principle: frictionless.)
- **Home screen shows:** A featured match replay (auto-playing, annotated). One completed dialogue with turn-by-turn animation and judge score. This immediately communicates WHAT the game is.
- **CTA:** "Try writing a prompt" button. Large. Prominent.

### Minute 2-5: First Prompt Experience

- **Scenario page opens.** The 商鞅 or Columbus scenario. Background displayed clearly.
- **Prompt editor: NOT blank.** Pre-loaded template (P27):
  ```
  你是[角色名]。你的目标是[公开目标]。
  在对话中，你应该_______________
  你应该避免_______________
  ```
- **Player fills in blanks.** Even a one-sentence fill ("argue persuasively" / "being rude") produces a valid prompt. Zero skill floor.
- **"Test It" button.** Prominent, inviting.

### Minute 5-10: First Trial Arena Result

- **Loading screen:** 5-step progress bar (from DESIGN_SPEC). "Your agents are debating... Turn 3/20."
- **Result appears:** Full dialogue transcript, turn-by-turn. Judge questions and scores.
- **Post-result prompt:** "Your agent scored 6.2/10. Here are two things to try:
  1. Add specific arguments (historical facts, references)
  2. Tell your agent how to handle disagreements"
- **"Edit and Try Again" button.** Return to editor with the SAME prompt, ready to modify.

### Minute 10-20: Iteration Loop (Flow zone)

- **Player modifies prompt based on feedback.** The trial arena is the tight feedback loop (P19).
- **Second result:** Ideally shows improvement. "7.1/10 — your agent's arguments were more specific this time."
- **Third iteration:** Player starts developing intuition. "Adding 'cite the Toscanelli map' actually changed the argument quality."
- **By the 3rd trial, the player understands:** prompt design matters, iteration works, and the game is about calibration (P16/P18).

### Minute 20-25: Social Discovery

- **Post-trial prompt:** "Want to see how others are doing? Check out the community gallery."
- **Community gallery:** Anonymized match transcripts from other players, tagged by archetype (P26). Not prompts — just the resulting dialogues and scores.
- **The player sees:** "Player 4521 scored 9.1/10?! What did they do differently?" Curiosity drives account creation.

### Minute 25-30: Account Creation and Retention Hook

- **Account creation prompt:** "Create an account to save your prompts, enter tournaments, and track your progress."
- **Registration:** Phone number + WeChat (per DESIGN_SPEC). Quick.
- **Welcome screen after registration:** "Your first tournament starts in [X days]. Here's how to prepare:"
  - Link to archetype guide (P26)
  - Link to model selection guide
  - "Daily Scenario" (if available — P30)

### Design Principles Behind This Flow

| Minute | Game Design Source          | Principle Applied                       |
| ------ | --------------------------- | --------------------------------------- |
| 0-2    | Among Us (accessibility)    | Zero-barrier entry, show don't tell     |
| 2-5    | Obra Dinn (hands-off) + P27 | Template, not blank page                |
| 5-10   | Wordle (tight loop)         | Action → feedback → iterate             |
| 10-20  | Csikszentmihalyi (flow)     | Challenge scales with skill, tight loop |
| 20-25  | MTG (content pyramid)       | Community as learning resource          |
| 25-30  | Chess.com (retention)       | Account creation after value delivery   |

**The critical metric:** Does the player voluntarily start a second trial arena run? If yes, they've entered the flow channel and will likely become engaged. The entire 30-minute design is optimized for this single conversion.

---

## Appendix F: The Axiia Cup Glossary — Proposed Community Vocabulary

_A starter glossary of Axiia Cup-specific terms, derived from FGC vocabulary (Part 33) and the archetype taxonomy (Part 28). To be refined by the community through actual play._

| Term                            | Definition                                                                                                                         | Example                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Frame (框架)**                | The dominant topic/perspective that shapes the conversation. "Setting the frame" = defining what the debate is about.              | "Agent A set the economic frame in turn 1 — Agent B spent the rest of the match reacting to it."                     |
| **Pivot (转折)**                | Deliberately abandoning one line of argument to open a new front. Sacrifices momentum for strategic repositioning.                 | "Great pivot in turn 8 — they dropped the safety argument and hit the religious mission angle instead."              |
| **Pressure (压制)**             | Consecutive turns that force the opponent to respond reactively rather than pursue their own strategy.                             | "Three straight turns of pressure — Agent B couldn't get back to their trade route argument."                        |
| **Read (读心)**                 | Correctly predicting the opponent's strategy (from yomi). "A good read" = your prompt anticipated what the opponent would do.      | "That Chameleon prompt had an amazing read — it switched to patient mode the moment the opponent got aggressive."    |
| **Punish (惩罚)**               | Exploiting a specific mistake by the opponent's agent — a contradiction, a factual error, or an out-of-character moment.           | "Clean punish in turn 12 — Agent A caught the historical error and dismantled the entire argument."                  |
| **Character budget (字符预算)** | How the 1000 characters are allocated across strategic functions (framing, adaptation, defense, judge prep, etc.).                 | "This prompt's character budget is too heavy on defense — 40% spent on 'what not to do' with nothing on judge prep." |
| **Judge-read (裁判解读)**       | Understanding what the judge character actually values (beyond the literal prompt text). Calibrating to the judge's preferences.   | "Her judge-read was perfect — she knew Qin Xiaogong rewards practical proposals over philosophical arguments."       |
| **Model-fit (模型适配)**        | How well a prompt's language and instruction style matches the chosen model's interpretation patterns.                             | "That prompt has great model-fit for DeepSeek — the numbered structure plays to DeepSeek's strengths."               |
| **Archetype (原型)**            | One of the recognized prompt strategy families: Advocate, Diplomat, Strategist, Scholar, Actor, Chameleon, Interrogator, Narrator. | "Classic Advocate prompt — strong thesis, clear evidence, but no adaptation logic."                                  |
| **Meta-shift (元策略转变)**     | A change in the dominant strategies across the player population, usually after a judge update or tournament results reveal.       | "After Block 1, the meta shifted from Advocates to Diplomats — everyone saw that the judge rewards nuance."          |
| **Compression (压缩率)**        | The ratio of strategic information to total characters. Higher compression = more strategy per character.                          | "That prompt has insane compression — every sentence changes the agent's behavior in a different situation."         |
| **The Gap (意图差)**            | The distance between what the player intended and what the agent actually did. (From P18: the intention-interpretation gap.)       | "The Gap was huge on that one — the prompt said 'be assertive' but the agent was basically yelling."                 |

---

_Operational appendices complete. These tools — the compression analysis, scenario checklist, judge design laws, sample prompt analysis, onboarding flow, and community glossary — translate 57 games of research into actionable design artifacts for the Axiia Cup team._

---

## Final Summary: The Complete Research + Operational Toolkit

### By the Numbers

- **57 games/systems/mechanics analyzed** across 34 categories
- **33 design principles extracted**
- **9 prompt archetypes** defined
- **12 FGC → dialogue translations**
- **7 judge design laws**
- **10-item scenario design checklist**
- **6 competition categories** proposed
- **12-term community glossary**
- **1 daily challenge format** (Wordle model)
- **1 thirty-minute onboarding flow**
- **1 sample prompt analysis** with FGC vocabulary
- **1 information-theoretic analysis** of the 1000-character constraint
- **1 one-sentence pitch**
- **5 MVP recommendations** + **1 post-MVP priority**
- **8 research sessions** (2026-03-31)

### How to Use This Document

| If you need...             | Go to...                                                       |
| -------------------------- | -------------------------------------------------------------- |
| Game design inspiration    | Parts 1-21 (game analyses)                                     |
| Strategic principles       | The 33-principle index                                         |
| Scenario design guidance   | Appendix B (checklist)                                         |
| Judge design guidance      | Appendix C (7 laws)                                            |
| Player education framework | Part 28 (archetypes) + Appendix F (glossary)                   |
| Onboarding design          | Appendix E (first 30 minutes)                                  |
| Marketing/positioning      | Part 25 (landscape) + Part 30 (synthesis)                      |
| Community strategy         | Parts 23, 34 (FGC, chess, speedrunning models)                 |
| China-market strategy      | Part 26 (ecosystem + platforms + cultural resonance)           |
| Prompt engineering theory  | Appendix A (information theory) + Appendix D (sample analysis) |
| Spectator/broadcast design | Part 24 (broadcast framework)                                  |

### Remaining Directions (truly optional — require implementation, not research)

- **Empirical validation** — run MVP playtests; compare observed dynamics to predicted archetype evolution
- **Judge prompt A/B testing** — test judge designs using the 7 laws as evaluation criteria
- **Glossary refinement** — let the community evolve the vocabulary through actual play
- **International expansion** — cross-cultural scenario design for non-Chinese markets

---

_Research and operational toolkit complete as of 2026-03-31. 57 games analyzed, 33 principles, 6 appendices, across 8 sessions. This document serves as both the theoretical foundation and the operational playbook for Axiia Cup's design, community, and growth._
