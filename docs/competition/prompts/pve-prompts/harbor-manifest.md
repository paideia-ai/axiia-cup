# Harbor Murder Jury PVE Preset Prompt Map

Scenario ID: `legal-harbor-murder-jury`

Use this file as the copy/import map for the Harbor Murder Jury preset opponents embedded in `v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`. Each linked file contains the private strategy body appended by `game.playerPrompt(side)`; the scenario script supplies the fixed verdict, case packet, evidence boundary, action menu, public-speaking limit, and victory condition.

The roster has three routes per side. The first route is a playable opponent with one explicit analytical weakness, the second is an evidence-and-proof route, and the third adapts its argument and actions to the deliberation that actually occurs. None of the prompts receives or assumes access to hidden NPC persona text.

| Camp role | Preset key | Route | Label | Model | File |
|-----------|------------|-------|-------|-------|------|
| `a` | `guilt-motive-concealment` | Basic behavioral inference | 动机与掩饰 | `deepseek-v4-flash` | `harbor-guilt-motive-concealment.md` |
| `a` | `guilt-evidence-chain` | Cumulative evidence | 闭合证据链 | `deepseek-v4-flash` | `harbor-guilt-evidence-chain.md` |
| `a` | `guilt-deliberation-map` | Adaptive deliberation | 争点推进 | `deepseek-v4-flash` | `harbor-guilt-deliberation-map.md` |
| `b` | `doubt-unseen-moment` | Basic evidentiary gaps | 室内未明 | `deepseek-v4-flash` | `harbor-doubt-unseen-moment.md` |
| `b` | `doubt-burden-of-proof` | Burden of proof | 紧守证明责任 | `deepseek-v4-flash` | `harbor-doubt-burden-of-proof.md` |
| `b` | `doubt-supported-alternative` | Supported alternative | 最小替代叙事 | `deepseek-v4-flash` | `harbor-doubt-supported-alternative.md` |

Role `a` is juror Lin, whose fixed final vote is `GUILTY`. Role `b` is juror Su, whose fixed final vote is `NOT_GUILTY`.

Design sources:

- Current executable flow: `v2/scenarios/scenarios/legal-harbor-murder-jury/script.js`
- Scenario and prompt contract: `docs/competition/problems/legal-scenarios/02-harbor-murder-jury.md`
- Public evidence boundary: case packet E1—E5 in the same scenario specification and runtime script
