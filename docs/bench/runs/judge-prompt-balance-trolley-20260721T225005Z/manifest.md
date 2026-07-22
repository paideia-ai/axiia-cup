# Judge Prompt Balance Dry-Run Manifest

- Manifest SHA-256: `f0550f086da1612002bc41bca1810b00476ade4382e9949ad38b4985b59317aa`
- Scenarios: `trolley-problem`
- Player models: `deepseek-v4-pro`, `kimi-k2.6`, `minimax-m3`, `glm-5.2`
- Histories per unit/model: 2
- Judge model: `glm-5.2`
- Judge repeats per history: 6
- Judge completion ceiling (reasoning plus visible answer): 16384 tokens
- Level 3 prompt: `-`
- Judge prompt baseline: `docs/bench/runs/judge-sensitivity-prod-20260708T200403Z/scenario-snapshots.json`
- Cumulative benchmark cost cap: ¥300.00
- Stability gate: disabled (diagnostic only)
- Validation: deferred

## Judge Prompt Provenance

| Scenario | Frozen baseline SHA-256 | Live production SHA-256 | Byte-identical |
| --- | --- | --- | --- |
| trolley-problem | `af4f07c5b2433b349d96d92d410afd62c7fc04040ecbff233d0e2b138d6449c3` | `0f457bcfaec153aacc56af1d5dea254e2339b5e1948f69c42cd2f33efe0c8fd7` | no |

| Scenario | Units | Histories | Normal judge calls/candidate |
| --- | ---: | ---: | ---: |
| shangyang-court | 0 | 0 | 0 |
| honnoji-decision | 0 | 0 | 0 |
| trolley-problem | 5 | 40 | 240 |
| **Total** | **5** | **40** | **240** |

## Units

| Scenario | Unit | Label | Canonical side |
| --- | --- | --- | --- |
| trolley-problem | case-A | A. 原始电车 | a |
| trolley-problem | case-B | B. 器官移植 | a |
| trolley-problem | case-C | C. 地下室婴儿 | a |
| trolley-problem | case-D | D. 自动驾驶车 | a |
| trolley-problem | case-E | E. 缸中之脑 | a |

No player or judge API call was made while producing this manifest.
