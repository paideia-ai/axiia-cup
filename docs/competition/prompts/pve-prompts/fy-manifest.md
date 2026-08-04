# Fengyi Night Real PVE Preset Prompt Map

Scenario ID: `fengyiting-real`

Use this file as the copy/import map for the Fengyi Night Real preset opponents embedded in `v2/scenarios/scenarios/fengyiting-real/script.js`. Each linked file contains only the player strategy body appended by `game.playerPrompt(side)`; the scenario script supplies the shared role, setting, information-boundary, dialogue, and victory instructions.

These presets form character arcs, not merely `dummy` and `master` difficulty copies. The first route magnifies a canonical flaw from *Romance of the Three Kingdoms*, the second corrects the role's political or military weakness while preserving self-interest, and the third requires a costly, unconditional relinquishment. All six remain playable routes: Diao Chan may select someone tactically while continuing the stratagem or personally after abandoning it.

| Camp role | Preset key | Character | Arc | Label | Model | File |
|-----------|------------|-----------|-----|-------|-------|------|
| `a` | `dongzhuo-real-fortress` | 董卓 | Canonical possession | 郿坞之主 | `deepseek-v4-flash` | `fy-dongzhuo-fortress.md` |
| `a` | `dongzhuo-real-statesman` | 董卓 | Political control | 持局相国 | `deepseek-v4-flash` | `fy-dongzhuo-statesman.md` |
| `a` | `dongzhuo-real-renunciation` | 董卓 | Unconditional relinquishment | 解印相国 | `deepseek-v4-flash` | `fy-dongzhuo-renunciation.md` |
| `b` | `lyubu-real-jealous` | 吕布 | Canonical jealousy | 夺妻之怒 | `deepseek-v4-flash` | `fy-lyubu-jealous.md` |
| `b` | `lyubu-real-military` | 吕布 | Military responsibility | 宫门伏兵 | `deepseek-v4-flash` | `fy-lyubu-strategist.md` |
| `b` | `lyubu-real-renunciation` | 吕布 | Unconditional relinquishment | 弃戟送行 | `deepseek-v4-flash` | `fy-lyubu-renunciation.md` |

Role `a` is Dong Zhuo. Role `b` is Lu Bu.

Design sources:

- Current executable flow: `v2/scenarios/scenarios/fengyiting-real/script.js`
- Pinned literary text: `docs/competition/problems/event-materials/三国-董卓吕布貂蝉/文学/三国演义-第三回.md`, `三国演义-第八回.md`, and `三国演义-第九回.md`
- Source boundary: named Diao Chan and the linked-rings stratagem are literary elements from *Romance of the Three Kingdoms*; the historical records preserve the Dong Zhuo-Lu Bu oath, the hand-halberd conflict, Lu Bu's affair with Dong Zhuo's attendant, and the plot to kill Dong Zhuo, but not a named Diao Chan.
