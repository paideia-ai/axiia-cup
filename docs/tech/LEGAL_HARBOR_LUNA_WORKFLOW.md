# Legal Harbor：Luna 主控与 Luna 子代理测试流程

这份文件供新 Codex thread 执行一局真实的全 Luna 替代测试。主 session 使用
`gpt-5.6-luna` / `max`，直接调度 `gpt-5.6-luna` / `medium` 子代理。
游戏规则、角色历史、行动额度和裁决由现有 controller
执行；每个子代理只生成一个角色的一次回复。

## 给新 thread 的启动指令

先在 Codex 中新开一个 **Luna / Max** session，工作目录选择
`/home/kesou/axiia-cup-legal-harbor-refine`，然后发送：

> 请按 `docs/tech/LEGAL_HARBOR_LUNA_WORKFLOW.md` 执行一局 Legal Harbor 测试。
> 由当前 Luna Max 主 session 直接调度全新的 Luna medium 子代理。 使用本 worktree
> 当前的 script.js，双方参赛 prompt 为空，seed=1。
> 完成游戏、回放和完整性检查，保存主控与角色用量，输出结果及产物路径。
> 不改剧本，不自动追加第二局，不调用付费供应商推理接口。

引用本文执行测试即包含文中正常的子代理调度和本地文件写入。不要在每次派发前询问用户。
仅阅读或编辑本文不表示要启动测试。默认追踪模式为本地保存；用户同时要求上传
Langfuse 时，执行下文的上传步骤。

## 入口与执行范围

在目标 worktree 根目录运行。确认分支为
`legal-harbor-refine`；保留已有未提交修改，
本局冻结当前文件的字节，不切分支、不拉取、不回退、不提交。

```bash
git branch --show-current
git status --short
```

在后续 shell 调用中使用以下路径。不同工具调用不保证保留 shell
变量；每次需要时重新定义， 或使用已经解析的绝对路径。

```bash
harbor_worktree=/home/kesou/axiia-cup-legal-harbor-refine
harbor_artifacts="$harbor_worktree/.local/scenario-runs/harbor-empty-20260907T051820Z"
harbor_operator="$harbor_artifacts/luna/operator.py"
harbor_source="$harbor_worktree/v2/scenarios/scenarios/legal-harbor-murder-jury/script.js"
```

依赖 `node`、`python3` 和本机已有的 `luna/controller.mjs`、`luna/operator.py`。
这些控制器位于 Git 忽略的 `.local` 中，**不会随分支克隆到另一台机器**。
文件缺失时报告具体路径；不要临时凭本文重写引擎，或转去运行 native runner。
`operator.py` 使用现有 CLI 并压缩正常输出，没有自动派发子代理的能力。

不要再创建一层控制代理。主控只操作本局；不要同时承担剧本修改、原生对照运行、
历史记录审计或平衡性分析。正常循环不需要重读旧 README 和旧 thread。

## 启动检查与配置

1. 从当前 session 的实际模型设置确认主控是 Luna /
   max；不能用全局配置文件代替实际设置。 若当前是 Astra，报告需要用户切换主
   session，不要在 Astra 下开始循环。
2. 确认当前环境确实提供 `collaboration.spawn_agent` 和等待子代理结果的工具。
   以前的一个 Luna **子代理环境**缺少派发工具；不能据此假设新主 session
   一定可用或不可用。
3. 第一次在这个新 session 使用该流程时，派发一个 Luna
   medium、`fork_turns="none"` 的准备检查子代理，仅要求原样回复
   `READY`，不得使用工具。收到实际回复后再建正式局。 此检查单独计量，不写入游戏
   journal。已经通过则不重复；缺少能力时停止，不自动升级到 Astra。
4. 每次角色派发都显式设置 `model="gpt-5.6-luna"`、`reasoning_effort="medium"`、
   `fork_turns="none"`。角色配置与主控 max
   分开。工具不支持这些设置时报告不兼容，不能省略后继续。

可用并发数以当前工具环境为准。在四个名额的环境中，主控占一个，最多同时运行三个角色。
游戏先后关系仍由 controller 的 pending 决定，不能为了填满名额提前生成后续发言。

## 建立一局

生成唯一、尚不存在的目录，例如
`.local/scenario-runs/harbor-luna-root-YYYYMMDDTHHMMSSZ-随机后缀`，
将绝对路径记为 `harbor_run`。不要复用 `game-001`、`game-002`
或其他已存在的目录。

```bash
python3 "$harbor_operator" init --script "$harbor_source" --run-dir "$harbor_run" --seed 1
python3 "$harbor_operator" advance --run-dir "$harbor_run"
```

`init` 默认双方 prompt 都为 `""`；它冻结脚本、seed、参数及 run ID。 从返回的
manifest 记录 SHA 和空 prompt。后续始终使用快照，即使其他 thread 改了源文件。
只有用户明确要求恢复某局时才使用已有目录，恢复时跳过 `init`。

在本局保存 `operator-config.json`：主控实际模型/effort、角色配置、主 thread ID、
开始 UTC 时间、追踪模式，以及 controller/operator 文件
SHA256。这些是新增的执行记录， 不要修改 controller 的 manifest、journal
或既有语义字段。

## 正常循环

### 1. 准备 pending 中的任务

优先使用上一条 `advance` 返回的简短 pending，无需再次运行 `pending`。
对当前可执行的 `effectId` 获取派发参数：

```bash
python3 "$harbor_operator" task --run-dir "$harbor_run" --effect-id EFFECT_ID
```

保留返回的 `task_name`、`message`、`model` 和 `fork_turns` 原值，**只补充**
`reasoning_effort: "medium"`。当前 `task` 不生成 effort，`record-start`
内部保存的 `spawnTask` 也不包含这个补充项。因此在本局的 `dispatch-config.jsonl`
另外保存每次实际 派发参数、effectId、attempt 和返回的实际子 thread
ID/路径，用来核查有效配置。 不要把“记录的配置”说成已经验证的服务端配置。

从主控自己的 canonical task path 与 `task_name` 计算预期子路径。 在真实 spawn
**之前**注册：

```bash
python3 "$harbor_operator" record-start --run-dir "$harbor_run" --effect-id EFFECT_ID --actor-id EXPECTED_CHILD_PATH
```

### 2. 派发并等待真实回复

直接调用 `collaboration.spawn_agent`，传入上述参数。不要把 collaboration
调用塞进 `functions.exec` 或 shell，也不要尝试由 Node/Python
直接调用这些会话工具。 核对返回的实际路径与注册值一致。

每次回复都用新子代理，包括格式修复和失败重试；不使用 `followup_task` 复用角色。
任务中只能有 controller
生成的角色输入。不得添加目标票型、历史实验结果、主控分析、 其他角色私聊或整份
workflow。保持默认文件传输，不将长角色上下文转贴到主控。

子代理按生成的任务只读取指定文件一次，完整读取后仅返回原始标签文本。
不要缩小任务自带的内外两层读取输出预算。若输入截断，按传输失败处理，不能用摘要补齐。

只有 controller 同时返回、且具有相同非空 `batchId` 的 pending 才可并发派发；
不同批次或单个顺序任务按 pending 推进。秘密投票的上下文由 controller 预先冻结，
主控不能向后续投票者透露已返回的票。

等待完成通知。没有通知时使用一次合理长度的等待，单次不超过 60 秒； 不要反复
`pending`、`list_agents`、查日志来轮询。进度汇报只说阶段和计数，遵守当前会话的汇报频率要求。

### 3. 原文提交并推进

用结构化文件写入或 `apply_patch` 将真实最终回复保存到本局的唯一回复文件。
保留标签、Unicode 和实际换行；不要修改判词、补理由或包 Markdown 围栏。
不要将回复拼接成可执行的 shell 命令。

```bash
python3 "$harbor_operator" accept --run-dir "$harbor_run" --effect-id EFFECT_ID --actor-id ACTUAL_CHILD_PATH --reply-file RAW_REPLY_PATH
```

检查实际返回的 `status`：`accepted` / `already-accepted` 才是提交成功；
`invalid-format` 即使进程退出码为零，也需要交给下一次 `advance` 产生修复任务。
不要人工修复标签或重试一个已经合法但票型不合预期的答案。

同一波的回复逐个、串行 accept，收齐后只运行一次：

```bash
python3 "$harbor_operator" advance --run-dir "$harbor_run"
```

把保存回复、accept、advance 中可以确定顺序的工具操作放进一次编排调用，
检查每一步状态后再继续，减少主控往返。不要并发修改同一个 run 目录。
`status="finished"` 时进入收尾，否则继续处理返回的 pending。

## 失败与断点恢复

| 情况                                                   | 操作                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| spawn 失败、角色无回复、明确返回 `CONTEXT_READ_FAILED` | 确认没有仍在运行的该次角色；必要时中断它。用下方 `fail` 记录真实原因，再 `advance`。                           |
| 注册路径与实际路径不一致                               | 暂停本局并保存两个路径及工具结果，不伪造身份、不覆盖 started 记录。                                            |
| `invalid-format`                                       | `advance` 会生成原控制器的 repair/fresh 分支，再派发新角色。                                                   |
| 控制器报告重试耗尽、请求 hash 漂移或 journal 损坏      | 保存诊断并停止，不能放宽校验或继续猜测游戏状态。                                                               |
| 实际观察到角色读取其他文件、联系其他角色等污染         | 将对应回复以 `accept ... --contaminated` 记录为无效局；没有工具历史时不能声称已验证隔离。                      |
| session 中断或压缩                                     | 从 manifest、简短 pending、attempts 和已保存回复恢复。先核对在途角色，再决定等待、提交或记录失败，不重复派发。 |

```bash
python3 "$harbor_operator" fail --run-dir "$harbor_run" --effect-id EFFECT_ID --actor-id REGISTERED_CHILD_PATH --reason '具体观察到的失败原因'
python3 "$harbor_operator" advance --run-dir "$harbor_run"
```

重试上限由 controller 执行。只有确认 `.controller-lock`
记录的进程已死且没有并发操作者， 才删除该残留锁。不要删除其他锁或改写
journal。相同原文的重复 accept 是幂等的。

## 收尾、追踪与额度记录

完成游戏后运行一次；保存输出到本局的 `replay-result.json` 和
`audit-result.json`：

```bash
python3 "$harbor_operator" replay --run-dir "$harbor_run"
python3 "$harbor_operator" audit --run-dir "$harbor_run"
```

要求 replay 返回 `finished`，audit 的 `integrity="passed"` 且 `invalid=false`，
并检查 final、journal 和 attempts 中没有遗留的未完成尝试。
本次是执行测试，不在每步重复旧的 controller 测试、五份 native 回放或历史
Langfuse 审计。

默认 **local** 模式：保留完整 manifest、journal、attempts、原始回复、timeline、
final、配置及用量记录。可离线生成 Langfuse outbox：

```bash
python3 "$harbor_artifacts/luna/export_langfuse.py" --run-dir "$harbor_run"
```

用户要求 **langfuse** 模式时：首批回复、每轮结束及最终收尾/中断时顺序执行
上述命令并加 `--send --verify`。使用现有认证配置，不打印或 shell-source 密钥。
检查 `langfuse-verification.json` 的
`status="passed"`；退出码为零或上传成功都不能代替回读验证。 遇到索引延迟，可等待
10、20、40 秒后各执行一次 `--verify`；失败则保存本地证据，
暂停并报告追踪尚未验证，不让主控陷入无限检查。凭据缺失时说明原因，不能标记上传成功。

在 `usage-report.json` 保存以下信息；只读取本次主 thread 和实际派发的子 thread，
不重新扫描整个账号历史：

- 主控、准备检查子代理、正式角色子代理分别统计模型请求次数和 tokens。
- 若有 `token_usage_record`，按 `response_id` 去重合计单次 `usage`。
  不累加反复出现的累计 `token_count`；reasoning tokens 已包含在 output
  中，不重复相加。
- 若可读到本次 rollout 的 `rate_limits`，保存开始/结束附近的原始时间、窗口、
  `used_percent`、`resets_at`。快照应来自真实记录，不能由 tokens
  倒推出“实测额度”。
- 前后窗口及 reset 一致才计算下降百分点；标记这属于账户整体变化，可能含其他
  thread。 没有足够快照或用量记录时填 `null`
  并说明缺失，不能填零。`providerApiSpendRMB:0` 不代表订阅额度消耗为零。不得将
  $200 月费视为 API 余额来换算。

最终报告保持简短：run 路径、冻结 SHA、实际主控/角色配置、最终票数、结束原因、
有效/失败/修复次数、耗时、replay/audit
状态、追踪模式与验证状态，以及分开的主控/角色用量。
完成一局即停止。原生逻辑上下文被包装为角色任务文本，隐藏 reasoning
和原生多模型配置没有等价复刻； 应称为“全 Luna
替代测试”，一次接近票数不能证明原生模型组已经平衡。
