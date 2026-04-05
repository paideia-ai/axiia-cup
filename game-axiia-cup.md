1. Why So Game-Related

  The core insight is that this is a language-model-native game, not a traditional AI competition. Yihan explicitly rejects the "serious
  competition" format (e.g., Baidu/Huawei-style "use AI to cut costs" challenges) because:

  - Scoring is hard and boring in those formats — who judges whether your enterprise AI solution is "better"?
  - Emotional value matters — B-end assessments are strict exams that nobody enjoys. C-end needs to be fun.
  - The game metaphor is "bilateral auto-chess" (双边自走棋): you craft both an attack prompt (商鞅) and a defense prompt (甘龙), then
  asynchronously match against everyone else. You never play real-time — you submit, the system cross-matches, and you get win rates.
  - Language models ARE the interface — Yihan considered having AI play existing games (2048, Paradox strategy games, ARC benchmark), but
  realized: why build complex infra when AI already speaks? A language game removes all that overhead. The game is native to what LLMs do.
  - Game design DNA is borrowed from: 剧本杀 (scripted murder mystery), social deduction games, and anti-meta mechanics — all adapted for
  AI-vs-AI play.

  2. Judge Design

  The judge is not an external rubric scorer — it's a diegetic character within the game world.

  - In the 商鞅变法 scenario, 秦孝公 (King of Qin) is the judge. After 商鞅 and 甘龙 debate for 20 rounds, 秦孝公 talks to each briefly, then
   decides: 变法 or not?
  - All evaluation happens inside the narrative logic, never outside it. There is no "your argumentation skill = 10/20" rubric. 秦孝公 judges
   as 秦孝公 would.
  - The judge enforces world-consistency: if a player writes 商鞅 as a time-traveler saying "I'm from 2000 years later, trust me, you unified
   China" — 秦孝公 will call him a lunatic and have him executed. Score: 0. No external rule bans this strategy; the world itself punishes
  it.
  - Open question: some scenarios may not need a third-party judge at all. E.g., in the Van Gogh gallery scenario, the collector simply
  decides whether to buy — no referee needed. Whether to abstract ALL scenarios into a 3-role structure (two players + one judge) is still an
   unresolved design decision.

  3. Asymmetric / Hidden Information Design

  This is the layer that turns a flat debate into a strategic game with incomplete information:

  - Each side has 2 hidden secrets (隐藏目标). 商鞅 has two; 甘龙 has two. During debate, you must protect your own secrets while extracting
  the opponent's.
  - The problem: since one player writes BOTH prompts, they can read both sides' scripts — like playing 剧本杀 with both character sheets
  visible.
  - The solution: hidden objectives are randomized at runtime. Even though you know the possible secrets, you don't know which one the system
   assigned this match. You still need to infer from dialogue which hidden goal the opponent actually has.
  - This prevents hard-coding: you can't just write "甘龙: I know 商鞅's secret is X" into your prompt, because it might be Y this time. Your
   agent must dynamically detect and adapt.

  The net effect: it's not just "who argues better" — it's a game of information extraction, concealment, and adaptive strategy under
  uncertainty, all conducted through natural language.

✻ Cooked for 52s

❯ and what ever you think is both related to the competition and game

⏺ 4. Scenario Abstraction — One Framework, Many Skins

  Yihan's design ambition isn't one game but a reusable template: two adversarial roles + optional third-party judge + hidden objectives. The
   scenarios are skins:

  - 商鞅 vs 甘龙 before 秦孝公 — historical debate
  - Gallery manager selling Van Gogh to a collector — art/commerce negotiation
  - Future scenarios across history, art history, business negotiation, law — 10-20 problems spanning 5-6 domains

  The key design constraint: every scenario must be internally self-consistent in its world logic. The judge doesn't evaluate "debate
  quality" — the world evaluates whether your behavior makes sense within it. This is what makes it a game and not a rubric.

  5. Domain Knowledge as Strategic Advantage

  This isn't a pure prompt-engineering contest. Subject expertise genuinely helps:

  - To sell Van Gogh's paintings well, you'd actually benefit from art history research
  - To argue for 变法 persuasively, historical knowledge of the Warring States period matters
  - This is deliberate — it makes the competition accessible to 文科生 (humanities students) who have domain depth but no coding skills.
  Their entry point is just a prompt, comparable to writing an essay.

  6. AI Persuadability as an Emergent Research Question

  Yihan frames the competition as also being a natural experiment: when an AI has a firm system prompt in one direction, under what
  conditions can the opposing agent steer it the other way? Can 商鞅 actually persuade 甘龙 to support reform?

  - This isn't expected to happen often (historically, 甘龙 never agreed)
  - But LLMs aren't bound by history — given enough opposing context, they can be persuaded against their system prompt
  - The competition generates real data on this, making it an implicit prompt-robustness benchmark

  7. Dual Data Flywheel — Benchmark + Prompt Corpus

  The competition produces two valuable byproducts:

  - Model benchmark: since players choose which domestic model (Kimi, Qwen, Doubao) to run their agents on, the leaderboard doubles as a
  model evaluation arena — similar to Chatbot Arena but adversarial, not just preference-based
  - High-quality character prompts: competitive pressure means players will craft far better character prompts than what exists on
  Character.AI, because there's an adversarial objective and ranking pressure. If the competition scales, this corpus becomes genuinely
  valuable.

  Yihan explicitly says this isn't the North Star goal — the North Star is building an influential, repeatable competition — but these are
  natural outputs that could become their own moat.
