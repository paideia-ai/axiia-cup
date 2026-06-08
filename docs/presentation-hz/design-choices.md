# Axiia Cup: Interesting Design Choices

这份文档整理 Axiia Cup 里一些适合在杭州国美 Vibe Coding 课程中讲的设计选择。重点不是介绍功能清单，而是说明：为什么这个项目在复杂度变高之后，需要多种操作界面、多 LLM 角色、CLI、Git、结构化数据和可追踪的工程流程。

## 1. CLI 作为 AI-friendly control surface

Axiia Cup 不只有网页 UI，也有一个 admin / operations CLI。CLI 可以登录、查看玩家、导出 prompt、启动比赛、查看排行榜、运行 playground、导出 battle、获取和更新 scenario。

这个设计很重要，因为 CLI 比网页更适合 AI coding agent 操作。一个大模型可以直接读取 JSON、修改文件、运行命令、检查输出，而不需要像人一样在网页上点击。

例如，scenario 可以通过这样的流程编辑：

1. `scenario:get <id>` 导出 JSON。
2. 在本地编辑 JSON。
3. `scenario:update <id> --file <path|->` 写回。

如果没有 CLI，AI agent 要改一个场景就会困难很多；有了 CLI，场景 prompt、judge prompt、scorer prompt、角色请求等都可以被结构化地读取和修改。

## 2. Scenario as data, not hardcoded logic

Axiia Cup 的场景不是完全写死在代码里的。数据库里的 scenario 会存：

- 角色名称
- 角色请求
- 隐藏信息
- 随机化配置
- agent prompt template
- judge prompt
- scorer prompt
- judge model
- scorer model
- 对话轮数

这意味着一个新场景不一定要从头写一套新程序。很多时候，新增或修改场景就是修改结构化数据。

这个设计让“场景设计”和“程序开发”之间有一个清楚的接口：场景作者可以调整规则、prompt 和角色信息；工程系统负责按同一套流程运行它们。

## 3. Scenario edits are locked during tournaments

场景可以通过 admin API / CLI 修改，但比赛进行中会锁定，不能编辑。

这是一个很实际的公平性设计。因为 scenario prompt、judge prompt 和 scoring prompt 本质上就是比赛规则。如果比赛中途改了，前后对局就不再可比。

所以这里的设计逻辑是：平时允许快速迭代；比赛期间冻结规则。

## 4. Shared schema validation

Scenario 不是随便存 JSON。系统会验证很多规则，例如：

- 隐藏信息 ID 不能重复。
- 请求 ID 不能重复。
- A/B 双方不能复用同一个请求 ID。
- hidden info 和 request 不能复用同一个 ID。
- `trueRequestCount` 不能超过请求数量。
- 如果一方启用可选角色，另一方也必须有可选角色。

这对 AI-assisted development 很重要。因为大模型修改 JSON 时可能会犯结构错误；schema validation 可以在写入系统前拦住这些错误。

## 5. Context assembly is the real engine

Axiia Cup 最关键的工程问题不是“怎么调用 LLM”，而是“每个 LLM 在每个阶段应该看到什么”。

系统里至少有几类 LLM 角色：

- player agent A
- player agent B
- judge
- scorer

它们看到的上下文不同：

- Player agent 看到自己的角色、自己的真实目标、对手公开信息、对话历史和玩家 prompt。
- 对手不能看到哪条请求是真的。
- Judge 看到完整对话、问询结果和 judge prompt。
- Scorer 看到 judge output、真实分配和计分规则。

这就是 context assembly：哪些信息给哪个模型看，什么时候给，以什么顺序给，哪些信息不能给。

这个设计可以很好地连接到“多智能体”主题：多智能体不是简单地多开几个 chat，而是要为每个 agent 设计不同的身份、权限、上下文和任务边界。

## 6. Incremental persistence of long LLM jobs

LLM 对战不是瞬间完成的。一局比赛可能包含多轮 agent 对话、赛后问询、judge 裁决和 scorer 评分。

系统不是等整局跑完才保存，而是在运行过程中逐步保存：

- actual prompt A / B
- info assignment
- transcript
- judge transcript
- judge decision
- score
- winner
- error state

这样做的好处是：

- 中途失败时可以看到已经发生了什么。
- 长任务更容易 debug。
- 分析工具可以复盘一局比赛的完整过程。
- 用户或管理员不必只看到一个黑箱状态。

## 7. Queue, lease, worker recovery

比赛和 playground run 都不是同步请求直接跑完，而是进入队列，由 worker 异步执行。

Worker 会 claim queued job，并给 job 一个 lease token。系统还会处理 interrupted / stale jobs，把中断的任务恢复回 queued 或标记 error。

这个设计适合 LLM 应用，因为 LLM 调用慢、容易超时、可能失败，也可能被用户中断。

它也适合课程里的“复杂项目怎么管理”：当任务变长、状态变多、失败路径变多时，简单 request-response 已经不够，需要 job queue 和状态机。

## 8. LLM call telemetry

系统会记录每次 LLM call 的信息，包括：

- phase
- side
- model
- provider
- request JSON
- response JSON
- response content
- prompt tokens
- completion tokens
- duration
- error

这让系统可以回答很多问题：

- 哪个模型慢？
- 哪个阶段最贵？
- 哪次 judge output 格式错了？
- 为什么某一局算分失败？
- 某个玩家 prompt 实际触发了怎样的模型行为？

没有 telemetry，多智能体系统很快会变成黑箱。有 telemetry，系统才可调试、可分析、可复盘。

## 9. Rejudge endpoint

Axiia Cup 有一个很有意思的 admin endpoint：可以把已经完成的 match 拿出来，只重跑 judge，不重跑玩家对话。

也就是说，同一段 transcript 可以交给不同 judge model 重新裁决。

这个设计直接产生了 Judge Bias Spectrum：同一批对战记录，如果换不同大模型当裁判，判决会发生变化。

这说明 Axiia Cup 不只是一个游戏，也可以变成研究工具：它能观察不同模型如何评价同一场人类设计的 agent 对抗。

## 10. Preset opponents for fast iteration

Playground 不一定要真人对真人，也可以使用 preset opponent。

这是一种很实用的迭代设计：

- 玩家可以快速测试自己的 prompt。
- 开发者可以用固定 baseline 检查系统变化。
- 新玩家不需要等另一个人参赛，也能先体验机制。

Preset opponent 相当于把复杂 PvP 系统拆出一个可控的练习环境。

## 11. Role options make scenarios extensible

有些场景不是固定的 A 角色 vs B 角色。例如本能寺之变里，杀信长阵营和不杀信长阵营都可以有多个可选角色。

系统的设计是：scenario 可以定义 role options；玩家选择之后，engine 会把选中的角色名称和请求解析成当前这一局实际使用的 role A / role B。

这样，底层 engine 仍然可以维持统一结构，但场景设计上可以更丰富。

这是一个很好的抽象：不要为每个角色组合写一套引擎，而是让 scenario data 决定本局角色。

## 12. Tournament CLI supports dry-run and model override

`tournament:run` 不是只会“直接开赛”。它支持：

- include / exclude players
- swiss / round-robin format
- rounds override
- dry-run
- retry limit
- poll interval
- model override

其中 dry-run 很重要。它允许操作人在真正开始昂贵的 LLM 比赛之前，先检查 pairings 和运行计划。

Model override 也很有意思。它让同一批 prompt 可以在统一模型条件下跑，便于比较模型差异或做实验。

## 13. Analytics and battle export

CLI 和 admin API 提供 unified battle view，可以把 tournament match 和 playground run 统一成 battle 来查看、过滤和导出。

这对复杂项目很有价值：

- 运营可以看比赛结果。
- 开发者可以 debug 某一局。
- 研究者可以导出 transcript 和 LLM calls 做分析。
- AI agent 可以读取结构化 battle export，然后辅助总结问题或生成报告。

## 14. Product multi-agent and development multi-agent

Axiia Cup 的多智能体有两层。

第一层是产品内部的多智能体：

- player agent A
- player agent B
- judge
- scorer

第二层是开发过程中的多智能体：

- 人类负责产品判断、场景设计和验收。
- Codex / Claude Code / Kimi Code 等工具可以分别帮助写代码、查 repo、改文档、跑命令、分析输出。
- CLI、JSON、Git 和文档让这些工具更容易协作。

所以 Axiia Cup 很适合连接本周课程主题：当项目变复杂，一个 AI 对话不够了。真正的做法不是让一个 chat 记住全部事情，而是把项目拆成清晰的边界：文档、数据、代码、命令、日志、测试和版本管理。
