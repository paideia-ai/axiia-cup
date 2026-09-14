# 网页使用的 Prompt Builders

这里是“让你的 AI 帮你想策略”交付给玩家的正式模板。每个角色一份 Markdown；
`manifest.json` 明确指定场景 ID、角色 key、所属侧和文件路径。文件标题、顺序不参与角色匹配。

初始正文从 `docs/prompt-builders` 的角色章节迁入，并将长度限制参数化，加入准备阶段的说明。
之后两处分别维护：`docs` 用于研究、评测和设计讨论，这个目录用于产品发布。
文档改动不会自动进入产品；需要发布时，在这里明确修改并审核最终复制文本。

## 模板与玩家复制文本

网页只选择模板并填变量。开场要求、策略构建过程和收尾要求均写在模板里，
代码不额外添加对话要求。未知场景或尚未选定角色时，使用 `shared/fallback.md`。

生成脚本读取这个目录和场景脚本，生成 `v2/web/src/scenarios/prompt-builders.json`。
网页随构建加载该内容包，不读取 `docs`，也不在运行时读取游戏脚本。
角色模板、裁判提示词来自本地场景脚本的公开参考材料，不包括真实对局状态或裁判内心独白指令。
本能寺给出所选角色的两种可能对阵，不提前选择对手或分配真假请求。
港口案包含 E1–E5、九名陪审员的设定和最终判决要求。

## `other_rules` 的来源

`{{ other_rules }}` 使用 [shared/other-rules.md](shared/other-rules.md) 作为模板。
其中“策略由系统合并”“不要询问运行时信息”等固定说明都可在该文件直接审核。
其余数据来源如下：

| 变量 | 来源 |
| --- | --- |
| `strategy_prompt_limit` | `/v1/config` 的 `promptUnitLimit`，按汉字和英文词计数；尚未加载时不编造上限 |
| `format_label` | 当前前端场景模块的 `education.formatLabel` |
| `hidden_goal_rules` | 当前前端场景模块的 `education.hiddenGoalHowTo` |
| `scoring_rules` | `/v1/scenarios/:id` 的 `scoring.summary`、`items`、`notes`，保留分值和备注；缺失时使用 `education.scoring` |

港口案的 `player_visible_rules` 是游戏脚本中的人员名单、程序说明，再附上这份 `other_rules`。
其他变量如 `agent_prompt_template`、`judge_prompt`、`public_case_packet` 来自生成的场景参考材料。
`scenario_title` 来自场景 API；角色名、场景简介和胜利条件使用当前场景信息。

因此，模板原文和最终复制文本不会逐字相同：变量会替换为具体资料。
本地参考材料使用脚本默认值，线上计分和长度使用已加载的 API 数据；修改游戏规则时仍需核对发布版本。

## 修改与预览

在仓库根目录执行：

```sh
cd v2/web
deno task prompt-builders
deno task prompt-builders:preview
deno task test:unit src/scenarios/prompt-builders.test.ts src/lib/meta-prompt.test.ts
```

预览在 `v2/web/prompt-builder-previews/README.md`，包含 12 份纯文本。
使用与网页相同的渲染函数，但输入是本地脚本的计分数据和示例 1000 单位上限，
不是线上快照；具体输入记在 `inputs.json`。每份 `.txt` 只包含这些输入对应的最终复制文本。
线上用户可以在复制弹窗中查看实际加载数据对应的完整文本。

提交正式模板和重新生成的 JSON；预览目录不会提交。CI 检查正式模板与内容包是否一致，
并验证角色映射、变量替换和复制行为。`docs` 里的研究稿不参与这些生成或同步检查。
