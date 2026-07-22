## JudgeBiasBenchmark

Measures the bias of a given model on scenarios

- [honnoji-judge-bias.vercel.app](https://honnoji-judge-bias.vercel.app) - 本能寺不同裁判模型的胜率与偏向结果。
- [trolley-problem-judge-bias.vercel.app](https://trolley-problem-judge-bias.vercel.app) - 电车难题各案例的裁判胜率与偏向结果。

## JudgeSensitivityBenchmark

Measures the sensitivity of models

- [shangyang-judge-sensitivity.vercel.app](https://shangyang-judge-sensitivity.vercel.app) - 商鞅变法裁判敏感度
- [honnoji-judge-sensitivity.vercel.app](https://honnoji-judge-sensitivity.vercel.app) - 本能寺裁判敏感度完整结果。
- [shangyang-judge-sensitivity-ms-fable5-patch.vercel.app](https://shangyang-judge-sensitivity-ms-fable5-patch.vercel.app) - little benchmark to verify ms' tuned judge prompt for shangyang

## Judge Prompt WinRateBalancer

Tries to balance the bias of a given judge model on a scenario by iteratively
testing judge-prompt candidates against frozen debate histories.

- [trolley-judge-prompt-winrate-balanc.vercel.app](https://trolley-judge-prompt-winrate-balanc.vercel.app) - 电车难题 GLM-5.2 裁判提示词胜率平衡实验；展示方法、候选提示词结果、成本与当前进度。
