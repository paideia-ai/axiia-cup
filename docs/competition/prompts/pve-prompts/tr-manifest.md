# Trolley PVE Preset Prompt Map

Scenario ID: `trolley-problem`

Use this file as the copy/import map for the trolley preset opponents. The prompt body is in the linked file.

These prompts are not full agent system prompts. The runtime first renders the embedded default `agentPromptTemplate` from `apps/api/src/db/trolley-scenario.ts`, including the selected cases and the fixed side assignment, then appends the preset prompt body as the strategy section.

| Camp role | Role option ID | Side | Difficulty | Label | File |
|-----------|----------------|------|------------|-------|------|
| `a` | `null` | 一人侧 | Easy | 一人侧初级 | `tr-one-dummy.md` |
| `a` | `null` | 一人侧 | Hard | 一人侧高级 | `tr-one-master.md` |
| `b` | `null` | 五人侧 | Easy | 五人侧初级 | `tr-five-dummy.md` |
| `b` | `null` | 五人侧 | Hard | 五人侧高级 | `tr-five-master.md` |

Role `a` is the one-person side, meaning the side that protects the one person. Role `b` is the five-people side, meaning the side that protects the five people.
