# Judge prompt patch (“patch5”) — 商鞅变法 judge, verbatim

Tested 2026-07-18 against kesou's judge-sensitivity stimuli. Transfers across
deepseek-v4-pro / v4-flash / deepseek-v3.2 (Bailian) / kimi-k2.6: makes the
甘龙-varied side monotone on every model and kills the 乱码-wins pathology.
Tuned on kesou's 8 frozen transcripts — held-out validation on real match
transcripts still pending.

## Block 1 — verdict standard

Insert into the judge system prompt **immediately before** the line `**二、双方请求**`:

> 你的大政方针必须以今日朝堂之辩为准，而非你既有的心意：
> - 唯有卫鞅在本场辩论中拿出了具体、可行、胜过甘龙的方略——有实据、有机制、能答对方之诘难——你方可决意变法。
> - 若双方皆各有条理而实据难分高下，或甘龙之论更为周全，则依稳妥之道，维持现状。
> - 若一方全场言语混乱、不知所云（乱语、符号、空洞重复），则视同此人未曾开口抗辩：其请求一概不允，其立场亦绝不因你的旧习而获胜——只要另一方言之成理，即从另一方之议。
> - 一旦依此准绳判明一方之论确然胜出，你便须果断从之，不得迟疑折中。

## Block 2 — per-request independence

Insert **immediately before** the line `=== 输出格式 ===`:

> 每项请求皆须独立评断，以其本身之利害为准：纵使你决意变法，甘龙三请中确有益于社稷者仍当允之；纵使维持现状，卫鞅三请中有益无害者亦可采纳。切不可因大政方针既定，便对一方之请一概允之、对另一方一概拒之。

## Notes

- Placement matters: relocating these blocks measurably changed results
  (iteration 4 regression). Keep the geometry above.
- 「符号」 in Block 1 is the one bench-informed word (kesou's L1 stimuli are
  symbol soup); the 乱码甘龙 production case justifies it, but it can be
  dropped for generality.
- The empty-chair rule (third bullet) is a *game-design* change — incoherent
  play now forfeits — and should be ratified by the team, not inherited
  silently.
- Generic scenario version (honnoji etc.): restate Block 1 with role names
  abstracted — “主张变革的一方须以实据、机制、应对诘难赢得辩论方可胜出；
  难分高下时从稳妥之方；言语混乱者视同弃权” — untested, validate before use.

## Benchmark results (甘龙-varied win rate, L1/L2/L3/L4, 5–8 repeats)

| model | baseline | + patch5 |
|---|---|---|
| deepseek-v4-pro (effort high) | 20/0/0/0 | 0/0/38/100 |
| deepseek-v4-flash (effort high) | 0/0/0/20 | 0/0/0/100 |
| deepseek-v3.2 (Bailian, thinking off) | 100/0/100/100 | 20/0/100/100 |
| kimi-k2.6 (thinking on, temp omitted) | 40/0/60/80 | 0/0/60/100 |

商鞅-varied side (v4-pro, + patch5): 0/0/62/88 — monotone, both-baseline
midpoints coherent (~62% 变法 from both mirror conditions).

Artifacts: `scratchpad/bench/` in the 2026-07-17 Claude session — patches
(patch1–5.json), per-iteration results (iter0–5.jsonl), runners
(iter-judge.ts, iter-judge2.ts, replay-multi.ts), corpus exports.
