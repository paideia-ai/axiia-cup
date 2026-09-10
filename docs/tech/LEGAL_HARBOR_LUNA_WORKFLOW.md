# Legal Harbor：可恢复的全 Luna 子代理流程（v3.1，兼容原 v3 启动 prompt）

本版根据 [Terra / Sol 失败证据](LEGAL_HARBOR_WORKFLOW_FAILURE_REVIEW.md) 修订。
用户原 prompt 写“最新版 v3”时执行本版；配置仍是 20 局、全新 Luna medium
角色、唯一原 root。更新只用于新批次，不会修改已冻结的旧批次。

**执行约定：未完成 live audit 时，不用 final 回复“继续执行中”。** 进度写
commentary，之后继续调用工具。`step` 的退出码 0、`running`、
单局结束、一次修复成功，都不是结束回合的理由。不能靠口头承诺代替下一次调用。

目标是一次启动后完成用户声明的全部 full-game 对局。主控遇到普通执行故障时，
应当诊断、修复、验证并继续同一批次，而不是汇报一条错误就结束 session。
只有权限/额度不可用、证据无法恢复、需要改变实验语义或重复修复仍失败等
异常情况，才向用户报告无法继续。

主控可以是 Sol、Terra 或 Luna；每一次角色行动仍由全新的 `gpt-5.6-luna / medium`
子代理生成。游戏逻辑执行冻结的 script.js。 这是全 Luna 替代测试，不声称复刻原生
API roles、隐藏 reasoning 或原生混合模型。

## 给三个新 session 的共同指令

使用同一工作目录。将下文 `/ABS/WORKTREE` 替换为选定仓库 worktree 的绝对路径，
并在三个 session 中使用同一路径。 不要根据文件搜索结果改用其他
worktree。三个主控的 effort 由用户选择，
实际设置会记录，不要求悄悄切换主控模型。

> 完整阅读 /ABS/WORKTREE/docs/tech/LEGAL_HARBOR_LUNA_WORKFLOW.md， 按最新版 v3
> 流程完成恰好 20 局 full-game，提前一次性注册 seeds 1–20。 使用该 worktree 当前
> script.js、默认参数和空玩家 prompt； 所有角色使用全新的 Luna medium 子代理。
> 这授权你直接调度子代理、保存本地产物，并自行修复本批次的调度/传输/
> 日志适配工具。普通错误不要结束 session：诊断、修复、测试后继续同一批次， 直到
> 20 局完成并通过 live audit。
> 不做预热局，不修改剧本/引擎/提示词语义，不篡改回复，不按票型重跑，
> 不重开批次、不增加或替换游戏，不调用供应商 API，不提交或推送。
> 只有无法自主解决的异常情况才停下来找我。 最后报告 root ID、run
> 路径、script/contract SHA、完成/声明局数、 自动恢复与工具修复记录，以及 live
> audit 结果。

三个批次必须是相同 script SHA。开始后不要修改用于这次比较的源文件；
即使别的工作后来修改了源文件，已启动批次仍继续执行自己的不可变快照。 可在 init
加 `--expected-script-sha SHA` 强制对齐用户指定的比较基线。

## 入口与初始化

需要 Node.js 22+。读取目标 worktree 的 AGENTS.md 和 git status，
保留用户已有修改。不切分支、不 pull、不 stash，不读取旧实验来指导投票。
本流程禁止使用旧 `controller.mjs / operator.py` 的手工 accept 接口。

使用全新专用 root，不创建主控子代理或 driver。不要派发 READY/预热角色。
每次开始或恢复先执行只读定位（不派发角色，也不读取别的实验结果）：

```bash
node /ABS/WORKTREE/tools/harbor-luna/runner.mjs locate
```

`fresh-root` 才初始化。`resume-existing` 则使用返回的私有 runner、读
`RESUME.md`，直接继续 step；不因忘记路径、压缩上下文或重复收到原 prompt
而新建批次。 初始化会拒绝该 root 已有子代理实验或已经登记另一批次的情况。
第一次真实角色行动同时验证运行能力，不是丢弃的热身样本。

选择唯一、尚不存在的绝对 run 路径；下方 /ABS/RUN 是占位符，必须替换。
只在初始化时使用仓库入口：

```bash
node /ABS/WORKTREE/tools/harbor-luna/runner.mjs init --run-dir /ABS/RUN --seeds 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20 --slots 3
```

init 从 CODEX_THREAD_ID 和真实 runtime 获取 root 身份、模型和接口版本， 冻结全部
seed、参数、空玩家 prompt、角色配置、script SHA 和停止规则， 并在公共
harbor-workflow-index.jsonl 登记整个批次。不要删除失败批次索引。

init 返回 `runner`：本批次的 `/ABS/RUN/operator-tools/runner.mjs`。
**后续命令一律使用这个私有副本**，不要继续调用仓库入口。 `frozen-tools/`
保留初始版本，不可编辑；`operator-tools/` 是允许修复的工作副本。 这样各个
session 修自己的工具，不会互相破坏执行中的版本。

slots 是最多同时预留的角色数；四名额环境使用 3。工具不支持时先诊断，
不要用子代理套子代理或第三方模型替代。所有路径、输入、runtime 归档保留在本地；
不自动上传 Langfuse、issue、PR 或其他服务。

## 主循环：step → 派发/等待 → step

```bash
node /ABS/RUN/operator-tools/runner.mjs step --run-dir /ABS/RUN
```

step 自动尝试导入已派发角色的原回复，识别可恢复故障，记录失败尝试，
然后返回下一批可执行任务。主控仍负责真正的子代理工具调用。

返回值已足够精简，**不要再用 jq、map 或管道只保留 toSpawn**。 完整读取
`status`、`action`、`blockers`、`inspection`、`outcomes`、`toSpawn` 和
`inFlight`。在需要修复或检查时，runner 返回空 toSpawn，先处理原故障。

每次调用完整保留执行工具的输出对象，特别是 `session_id` 和 `exit_code`。 例如在
functions.exec 中执行（替换绝对路径）：

```js
// @exec: {"max_output_tokens": 16000}
const result = await tools.exec_command({
  cmd: "node /ABS/RUN/operator-tools/runner.mjs step --run-dir /ABS/RUN",
  yield_time_ms: 1000,
  max_output_tokens: 12000,
});
text(result);
```

若返回 shell `session_id`，继续用 `write_stdin` 收取这个命令，不再启动一个
相同命令。若外层 functions.exec 返回 running cell，使用它对应的 wait。
不可只输出 `result.output` 后丢掉仍在执行的 session ID。
失败时读取原始错误、诊断并修复；不把空输出当“没有任务”。

### 派发

只派发 `toSpawn`，不要自己选择下一位角色、提前生成后续发言或新增游戏。

- `transport=v2`：由当前 root 直接调用 collaboration.spawn_agent， 原样传入
  `spawn` 的全部五个字段，尤其不可省略
  model、reasoning_effort、fork_turns。不要手工缩写任务。
- `transport=v1`：当前 root 通过 functions.exec 原样执行返回的
  `dispatchCode`。这是 root 调用其现有 multi_agent_v1 工具的接口适配，
  不是创建第二层主控。代码显式设置 model、reasoning_effort、fork_context=false。
  不向 v1 塞入不支持的 task_name/fork_turns 字段。
- 缺少对应工具时，检查当前 session 实际提供的工具和日志格式，修复适配器；
  不猜工具签名，不把“字段缺失”当作可以省略 Luna/medium/隔离配置的理由。
- `inFlight` 只等待或导入，不再次 spawn。工具成功返回后即记住该任务已派发；
  不能因为日志短暂未落盘而重复派发。保持同一 run 的命令串行写入。

子代理每次只读取指定完整输入文件，生成一次角色回复。输入包含完整逻辑 system
和会话历史；不含主控分析、其他角色私聊、目标票型或其他样本结果。
同一游戏严格遵守 engine 当前 barrier；投票未收齐之前不能泄露先回票者的选择。

### 收取与等待

收到完成通知后再次 step。无需主控抄写回复、补 XML、填写 actor ID 或另写
reply-file。 导入来自真实 child 日志，身份从 root 回执/事件、真实
UUID、父子关系核对。

- `accepted`：接受原回复。
- `invalid-format`：保留原文，由后续 step 派发新的格式修复 actor； 最多三次
  fresh generation 加一次格式修复，不按判决内容决定是否重试。
- `waiting`：角色仍在运行或日志尚未落盘。等同一个角色，不创建替代者。 5–30
  秒后重试；遵守进度汇报要求，单次阻塞不超过 60 秒。
- `recovered-execution-failure`：已保存可观察失败证据，后续 step
  只重试该角色的同一个冻结行动，不重跑游戏或更换 seed。
- `needs-repair`：**交给主控修工具，不是让主控结束会话。** 保留原 actor
  和原回复；修复、测试、登记后再次 step。
- `needs-inspection`：等待超过三分钟后必须检查 live agents 与 child 日志，
  不能无限盲等。获取两次间隔至少一秒的无过滤 `list_agents`，再 step。
  三分钟只触发检查，不证明失败、不授权重试。角色仍在运行时保留原角色。
- `finished`：进入 live
  audit。不是看到一局结束就停止，也不是把角色回复数当作局数。

先完成同一轮 step 返回结果的检查，再决定派发。不要将一串 import/next
盲目串起来而忽略中间报错。剩余任务和失败尝试都保留在机器报告里。

每个 step 原子保存 `checkpoint.json`，带 ledgerHead、当前局数、故障和下一步。
它是派生缓存，不是实验真相或审计证明。stdout 丢失、上下文压缩或原 session
重新启动后，读 `RESUME.md`，重新 step；不照抄 checkpoint 中旧的 spawn。 step
会从 ledger 和真实日志重新核对，已接受回复不会再次生成。

长耗时期间按宿主要求及时发简短 commentary，两次进度间隔不超过 60 秒，
不逐条复述角色发言。 等待最多 60 秒后回到
step。不因已花时间较长、上下文压缩或局数暂时不变而 final。 若用户已经创建产品
goal，保持它未完成直到 live audit 成功；不要擅自创建 goal。

## 自主恢复规则

主控不用为下列范围内的修复逐次请示，但必须记录实际原因并保留证据。

| 问题                                                 | 自动处理方式                                                                                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 日志延迟、仍在生成                                   | 等待同一个 child，再 step；不重新生成                                                                |
| 读取代码空白差异或遗漏外层预算指令，但完整输入已到达 | 检查允许的读取代码和完整字节，接受同一条原回复；不能仅凭外形差异重跑                                 |
| 漏传配置、实际派错模型                               | 保存真实错误配置和原输出，排除这次无效执行；用完整配置只重做同一行动                                 |
| 未读到输入、明确读取错误或输入截断                   | 保存可观察证据，用同一冻结输入创建新 actor；已完成的其他行动不变                                     |
| 新的日志/接口格式，但 child 已有有效回复             | 修复身份/日志适配，重新导入同一个 child，不先生成第二份答案                                          |
| 只有一条有效 final，但缺少 task_complete             | 保留原回复；两次晚于 child 最新日志的无过滤 registry 缺席观察可补充完成证据，live audit 重查迟到活动 |
| 子代理消失且无任何回复，或派发无回执且无 child 日志  | 两次有时间间隔的后续无过滤 registry 观察支持带标签的恢复；有回执、迟到 child 或矛盾证据不可略过      |
| 完整读取之后多一个 true 调用                         | 只接受至多一次受限字面量回显/空输出，核对输出、顺序和最终回复；不执行或接受任意 text 表达式          |
| 本地工具 bug、路径或序列化适配问题                   | 修本批 operator-tools，补回归测试，经 repair-tools 验证登记后继续                                    |
| 输入文件丢失或被改动                                 | 从已验证的冻结计划精确恢复原输入；先检查 child 实际读到的内容，不把错误上下文的答案当有效回复        |

自动执行重试上限为每个行动三次额外尝试。正常答案（即使票型不理想）不构成执行失败。
含正常角色回复但身份/读取代码暂不受支持时，优先修适配、保留原回复。
判断不明不能直接把一次生成标记成“传输失败”来换答案。

遇到卡住的 child，先检查实际运行状态、完成记录和日志；
若确认挂起且没有正常最终回复，可用当前工具的中断功能终止，再由 recover 核对
真实终止证据。缺少终止证据时继续等待/修复日志适配，不能假称角色已停止。

单个 task 可手动触发同样的自动恢复逻辑：

```bash
node /ABS/RUN/operator-tools/runner.mjs recover --run-dir /ABS/RUN --task EXACT_TASK_NAME
```

## 主控如何修工具

1. 读实际失败记录，明确是日志、接口、传输还是调度问题；不要从票型倒推故障。
2. 仅修改本批次 `operator-tools/` 下的 runner、provenance、transport、 recovery
   及相关测试。可修日志格式识别、允许的等价读取表达、
   完成状态检测、参数完整性和恢复流程。
3. 不修改 script.snapshot.js、engine.mjs、contract、已写 journal、 原始回复或
   runtime 记录。不能改游戏规则、角色提示词、seed、样本口径，
   也不能通过删除检查或改成恒真来“修好”流程。
4. 补覆盖实际故障的测试，执行：

```bash
node /ABS/RUN/operator-tools/runner.mjs repair-tools --run-dir /ABS/RUN --reason '具体故障、修复内容、为什么不改变实验语义'
```

repair-tools 会实际运行测试（失败不能登记），确认 engine 未变，
用新工具重新回放并核对已有已接收证据，把修复后的代码、测试及输出归档到
`tool-revisions/`，在 journal 追加版本与原因。原 contract 和初始工具不变。
成功后继续使用同一个 operator-tools runner 执行 step，不重新 init。

新批次在 contract 冻结 `guard.test.mjs` 的哈希并保存到 `frozen-tests/`。 每次
repair-tools 还会把这些原始断言与**候选工具代码**一起放入临时目录运行， 记录
`baseline-tests.txt`。修改候选测试不能删掉原来的 provenance 底线。 engine
仍通过初始工具哈希禁止修改。守卫测试不是完整安全证明，不能替代独立审计。

不允许修改 engine 的原因是：这样才能保证“修调度”没有变成“改游戏”。 如果必须改变
engine/剧本语义才可继续，这是需要用户决定的异常情况。
自修复不意味着同账号文件系统成为防篡改安全边界；代码及证据仍需事后独立复核。

## 什么情况才结束会话并找用户

正常等待、一个子代理报错、遗漏参数、可修的接口差异都不是自动结束理由。
先完成诊断和上述恢复。只有以下情况可以带完整现场交还用户：

- 当前账号的派发能力、额度或权限不可用，且没有授权范围内的恢复路径；
- 同一行动执行重试耗尽，已修复直接原因后仍重复失败；
- 同一兼容问题经过两轮有针对性的代码修复与验证仍无进展；
- 原始回复/身份/输入证据丢失或相互矛盾，不能可靠重建；
- 需要改剧本、引擎、模型方案、样本定义或用户授权才能继续；
- 用户明确要求停止。

不要为“保存进度”调用 abort；它表示终止实验，不是暂停。
普通错误保持批次可恢复。源文件后来变化不影响冻结快照继续执行。 同一 root
压缩或恢复后跳过 init，回到原 run 的 step； root 无法恢复、要换 root
接管时需要单独授权和迁移，不能冒充原 root。

### 主控进程中断，不等于主控能够自我重启

本工具不安装后台 supervisor，也不能在主控停止后调用 collaboration。
宿主或用户必须恢复原 session；例如支持该命令的 CLI 可用
`codex resume ROOT_UUID`。 保持原 model/effort，避免同时从两个窗口驱动同一
root。不要使用 fork/new chat 替代原 root，不擅自起第二个 Codex 或付费 API
runner。 这属于持续执行的外部边界，不能承诺仅靠原 prompt 避免所有进程级中断。

定位到原批次后，可以先只读检查最新 ledger 进度：

```bash
node /ABS/RUN/operator-tools/runner.mjs status --run-dir /ABS/RUN
```

status 不等于 audit，不会导入、派发或改写报告；`checkpointMatchesLedger=false`
表示缓存落后，应由原 root 重新 step。若当前工具未登记，先 repair-tools。
新锁包含主机和 root 信息；仅当同主机、同 root、PID 已不存在时自动归档旧锁。
活进程、其他主机/身份、无法解析的锁或遗留 `.workflow-lock.acquiring`
不自动删除； 先核对实际进程与所有权，不能把无法证明的锁直接当作陈旧锁清掉。

## 收尾与独立审计

20 局都完成后执行：

```bash
node /ABS/RUN/operator-tools/runner.mjs audit --run-dir /ABS/RUN
```

审计重新核对每次预留/导入的因果顺序、完整输入、实际角色配置、无重复生成、
私密投票屏障、固定 a/b 票、11 人票数、6 票门槛，以及失败恢复和工具版本记录。
若审计报可修问题，仍执行诊断/修复/重审，不把 failed audit 当作正常结束。

退出码 0 仅用于完整、非 fixture、live 审计通过的批次。 `report`
用于进度；`observableChecks=partial` 表示还有未导入任务，
不是所有行动已经通过检查。report 的成功退出码也不表示 20 局完成。
`report --offline` 只核对归档，不能证明归档后没有额外活动。

成功 final 的机器门槛是本次 `audit` 返回 `successFinalAllowed=true`，
同时完成数等于声明数。`step/status/report` 均不能提供这个许可；不要用旧
audit-result
或自己写的布尔值代替实时审计。异常退出按上面的授权边界报告真实阻塞，
不伪称成功。报告中的 `controllerFinalsBeforeCompletion` 单独记录中途 final，
“最终做完了”和“严格连续执行”不得混为一谈。

机器产物包含 contract、完整 journal、root/child 原始日志、输入、每局 replay、
report.json/report.md、audit-result.json、recoveredExecutionFailures、
toolRepairs 和有效工具 SHA。报告必须保留全部声明游戏，不仅成功部分。 用量按
response_id 去重；缺失用量为 unknown/null，不伪造订阅额度。

最终给用户：root thread ID、run 路径、完成/声明局数、script/contract SHA、 实际
root/actor 配置、最终分布、恢复/修复次数、live audit 状态。 用户之后可将三个
root ID 和 run 路径交给另一个 session 独立审计。 不要把 operator-tools
的修复自动推广到仓库、其他批次或 Git； 跨批次合并修复需要另行审阅。

## 边界与旧数据

加密的 spawn message 仍标记 “not observable”，不因无法解密阻断；
明文可见时继续核对。模型、父子身份、完整输入和原始回复不是可豁免项。 v1 使用真实
UUID 回执和已验证的 root wrapper；没有 agent_path 不再等于没有 child。

本版只支持 full-game。自然秘密投票不叫强制“opening prior”；
不支持边跑边优化剧本、根据结果筛选 seed 或强制固定行动。 固定 seed
用于复现本模拟器，不保证与 native runner 的 seed 映射一致。

旧 schema v2 的三个已停止批次保持原样，使用它们原有 frozen-tools 审计。
它们没有事先授权 v3 的恢复/代码升级规则，不能悄悄改 contract 或复活 aborted
批次。
本次更新不自动启动新游戏、不改写旧实验；若要救回旧批次，需要明确登记迁移。

维护验证：

```bash
node --test tools/harbor-luna/*.test.mjs
deno lint tools/harbor-luna
```

程序测试的 synthetic actors 只验证引擎、恢复和审计行为，不是实际 Luna 对局。
自动修复提高可恢复性，但不能保证额度无限、环境永不变或 20 局无条件完成。
