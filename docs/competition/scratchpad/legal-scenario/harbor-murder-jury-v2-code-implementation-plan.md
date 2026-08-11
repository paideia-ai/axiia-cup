# 《码头疑云：七号仓命案》V2 代码实现计划

> 状态：实现计划草案，尚未写入 axiia-cup-v2
>
> 产品规格：../../problems/legal-scenarios/02-harbor-murder-jury.md
>
> V2 检查基线：/home/kesou/axiia-cup-v2，分支 ks，提交 84bcef9
>
> 检查日期：2026-08-12

## 1. 结论

这个场景可以在现有 V2 的 QuickJS 场景体系上实现，但不能只增加一个 script.js。正式写场景前，应先补四项通用运行时能力：

1. 无公开 channel 的私密生成不得进入玩家 SSE。
2. 公开发言应能隐藏模型 reasoning，只流式展示和保存最终台词。
3. game.emit 后应能显式 checkpoint，使玩家发言先落盘、先展示，再开始私密行动。
4. act 字段应原生支持受约束的 JSON 字符串数组，使 actionIds 能在同一个结构化生成单元内完成校验和修复。

其中第 1 项是安全阻塞项。当前实现虽然不会把无 channel 的 act 写成 timeline row，却仍会把它的实时文本和 reasoning 作为 seq = -1 的 chunk 发到 BattleHub；现有网页还会把这些 chunk 显示在“幕后”区域。直接写场景会泄露行动列表、秘密票或私聊内容。

建议按“规格对齐 → 运行时契约 → 场景脚本 → 前端呈现 → benchmark 与发布”五个阶段实施。不要先写一个依赖前端隐藏秘密的临时版本。

## 2. 已核实的 V2 现状

### 2.1 场景脚本

- 正式场景位于 packages/axiia/Scenarios/<scenario-id>/script.js。
- 脚本只声明 meta 和 main；运行时提供 game.agent、push、hear、say、act、random、phase 和 emit。
- game.random 已写入 journal，可用于确定性无放回抽签。
- act 没有 channel 时不生成公开 timeline row，适合秘密投票、私聊和玩家的合并输出。
- 现有 act 只校验标签是否存在、是否重复、是否为空，以及单值 enum；它不能校验 JSON 数组、分类额度或“提前终局必须放在最后”。
- game.emit 本身不形成 suspension。它产生的事件要等到下一次模型生成、random 或 main 结束时才提交。
- replay 每次只执行第一个尚未写入 journal 的 effect，适合本场景的顺序生成，不应假设 Promise.all 能让 provider 真正并行。

### 2.2 私密性与 reasoning

- AxiiaActors/ScriptUnits.swift 当前对所有生成调用都发布 BattleChunk。
- 无 channel 的 act 使用 timelineSeq = nil，但实时 chunk 会以 seq = -1 发布。
- packages/axiia-web/src/pages/match-detail.tsx 会把 seq < 0 的实时内容显示为“幕后”。
- 公开 dialogue 目前把模型 reasoning 写入 turns，并由网页 ReasoningFold 展示。
- 普通 match detail API 不返回 journal；因此持久化后的私密 act 不在普通回放中，但实时 SSE 仍会泄露。
- LLMExportRecord、Langfuse/export sink 和原始 envelope 已保存模型、prompt、消息、输出、reasoning、token、耗时和费用。journal 则保存随机值和结构化私密结果。二者可以作为组织者审计来源，但应增加 effectSeq，便于按 matchID、lane、effectSeq 精确关联。

### 2.3 服务端与发布

- AxiiaServer 会把 Scenarios 目录下的 script.js 编译进二进制。
- boot seeding 只创建不存在的 slot。已有 slot 不会因为重新部署而更新。
- 已有场景必须通过管理员脚本上传接口写入新 script SHA，再 patch slot 指向新 SHA。
- match 在 dispatch 时固定 scriptSHA 和 params；更新 slot 后必须创建新 match 才能验证新版本。
- scenario validate 只抽取和校验 meta，不会执行 main，也不会调用模型。

### 2.4 前端

- 场景详情页目前只显示标题、双方、流程和预设对手。
- ScenarioModule 目前只为本能寺场景保存角色和 lane label；它适合扩展为场景专属公开资料。
- EventRow 只专门识别 scene、order、gesture、verdict 和 score；新陪审团事件目前都会落入通用原始数据卡片。
- 前端没有独立单元测试任务；现有主要检查是 fmt、lint、typecheck、build 和浏览器 e2e。

### 2.5 测试边界

- packages/axiia/CLAUDE.md 明确把 Scenarios 视为产品内容，不允许把正式脚本当作引擎行为 fixture。
- ShippedScenarioTests 只检查所有正式脚本能提取出合法 meta。
- 引擎行为测试应使用 ProbeScripts.swift 或测试文件中的内联脚本。
- 因此，本场景的通用隐私、checkpoint、结构化列表和 replay 约束要用内联“陪审团工作流 fixture”测试；正式 script.js 只进入 shipped meta sweep，并另做本地完整对局和真实模型 smoke test。

## 3. 实现前先修正规格中的四处表达

这些修正不改变已经决定的玩法，只让产品规格与真实运行时一致。

1. 在 docs/competition/DESIGN_SPEC.md 登记“九名 NPC 陪审员共同裁决，程序多数票直接判胜”这一场景级 Judge 扩展。
2. 把“102 次真实硬上限”改为“102 个名义成功生成单元上限”。provider retry、act repair 和 act re-generation 都可能产生额外 provider 请求，因此 102 不是物理 API 调用硬上限。
3. 把第 16 节“正式脚本 fake-model 行为测试”调整为：通用行为由内联 fixture 自动测试；正式脚本做 meta validation、全流程本地 smoke 和真实模型 benchmark。这样遵守 V2 当前测试边界。
4. 统一公共事件契约：
   - 补入 npc_speaker_draw。
   - player_speech 的正文键固定为 text，不再同时出现 speechContent 和 text 两种说法。
   - speaker、mover 和 juror 一律使用 lane ID；前端通过 speakerLabels 显示林、苏和九名 NPC 姓名。

## 4. 阶段一：补通用运行时契约

### 4.1 私密生成不发布 SSE chunk

目标：timelineSeq 为 nil 的生成对普通直播订阅者完全不可见。

改动位置：

- packages/axiia/Targets/AxiiaActors/Sources/ScriptUnits.swift
- packages/axiia/Targets/AxiiaActors/Tests/StreamingTests.swift
- packages/axiia/Targets/AxiiaServer/Tests/SSETests.swift
- packages/axiia-web/src/pages/match-detail.tsx

实现：

- runPhase 仍完整收集私密生成，写 journal、envelope 和组织者 export。
- ScriptUnits.generate 的 onChunk 只有在 effect.timelineSeq 非 nil 时才向 BattleHub 发布。
- 删除普通玩家页面的“幕后”实时卡片。私密性由服务端保证，前端删除只是防御性清理。
- 已有公开 say 和有 channel 的 act 保持现有流式行为。

验收：

- 无 channel act 的 thinking 和 text 均不出现在 BattleHub。
- HTTP SSE 中不存在 seq = -1 chunk。
- 普通赛后 MatchDetail 中不存在私聊、秘密票、actionIds 或私密 reasoning。
- journal、LLM export 和 envelope 仍完整保留，供有权限的组织者审计。

### 4.2 公开台词可隐藏 reasoning

新增脚本 API：

~~~js
await juror.say({
  channel: 'public',
  showReasoning: false,
})
~~~

语义：

- showReasoning 默认 true，现有场景不变。
- false 时仍实时发布 text chunk。
- false 时不发布 thinking chunk。
- false 时公开 turn 的 reasoning 存 nil。
- journal、LLMExportRecord 和 envelope 仍保存 reasoning。
- replay 必须推导出同样的公开 timeline，不能因重启重新暴露 reasoning。

改动位置：

- packages/axiia/Targets/AxiiaScripting/Sources/Prelude.swift
- packages/axiia/Targets/AxiiaScripting/Sources/Hosts.swift
- packages/axiia/Targets/AxiiaScripting/Sources/Types.swift
- packages/axiia/Targets/AxiiaActors/Sources/ScriptUnits.swift
- packages/axiia/Targets/AxiiaScripting/SPEC.md
- packages/axiia/Targets/AxiiaActors/SPEC.md
- 对应 Replay、Streaming 和 SSE 测试

本场景中，九名 NPC 的公开 say 全部设置 showReasoning: false。玩家公开发言来自私有 act 后的固定 event，本来就不应带 reasoning。

### 4.3 新增 game.checkpoint

新增脚本 API：

~~~js
game.emit('public', event)
await game.checkpoint()
~~~

语义：

- checkpoint 不调用模型，不产生随机值。
- 它把此前的 phase 和 event 作为一个 journal 化、可重放的原子步骤提交。
- replay 命中 checkpoint journal 后继续执行，不重复发布此前事件。

建议实现：

- Prelude 增加 game.checkpoint，向 $game lane 请求 checkpoint effect。
- LiveEffect 增加 checkpoint(lane, seq)。
- Hosts 在 journal 未命中时 park checkpoint；命中时返回 null。
- BattleActor 执行 checkpoint 时，用 kind = checkpoint 的 journal row 和 pending turns 调用 commitStep，然后发布 turnCompleted。

本场景使用 checkpoint 的位置：

1. 每次 player_speech 发布并 hear 给其余十人后。
2. secret_poll_opened 发布后、收第一张秘密票前。
3. npc_speaker_draw 发布后、第一名 NPC 发言前。
4. 每张 evidence_review 固定卡发布后。
5. early_motion_opened 发布后，以及 early_motion_result 发布后。

最终 final_vote_reveal 和 match_result 后紧接 main 返回，finish 会提交它们，不必额外 checkpoint。

### 4.4 act 原生支持受约束的 JSON 字符串数组

保留 act 返回 fields: Record<String, String> 的现有 ABI；新增 list 约束，校验后把规范化 JSON 数组仍作为字符串返回。

建议脚本形状：

~~~js
actionIds: {
  hint: '按执行顺序选择行动；不行动时提交空数组',
  list: {
    enum: availableActionIds,
    minItems: 0,
    maxItems: remainingActionCount,
    groups: [
      { enum: ['SECRET_POLL'], maxItems: pollsLeft },
      { enum: privateChatActionIds, maxItems: privateLeft },
      { enum: evidenceReviewActionIds, maxItems: reviewsLeft },
      { enum: ['EARLY_FINAL_MOTION'], maxItems: motionLeft },
    ],
    terminal: ['EARLY_FINAL_MOTION'],
  },
}
~~~

需要支持的错误：

- 不是合法 JSON。
- 顶层不是字符串数组。
- 项目不在 enum 中。
- 少于 minItems 或超过 maxItems。
- 某一 group 超过额度。
- terminal 项目不在最后。

错误继续走现有 ActFailure → 一次 repair → 有界 re-generation 路径。脚本收到的 actionIds 已经通过结构校验，只再做防御性断言，不另发起场景级重问。

改动位置：

- packages/axiia/Targets/AxiiaScripting/Sources/ActFormat.swift
- packages/axiia/Targets/AxiiaScripting/Sources/Prelude.swift
- packages/axiia/Targets/AxiiaScripting/Sources/Hosts.swift
- packages/axiia/Targets/AxiiaScripting/SPEC.md
- packages/axiia/Targets/AxiiaActors/Tests/ScriptEngineTests.swift
- 内联 jury workflow fixture

### 4.5 组织者审计关联

不新增玩家可访问的审计 API。沿用现有两层：

- journal：随机值、结构化字段、秘密票和私聊文本。
- LLMExportRecord/Langfuse 与 envelope：模型、prompt、上下文、最终输出、reasoning、token、耗时和费用。

为 LLMEnvelope 和 LLMExportRecord 增加 effectSeq 与 effectKind，使每个私密生成可以用 matchID、lane、effectSeq 精确关联到 journal。普通 MatchDetail、SSE 和赛后回放不得返回这些字段。

## 5. 阶段二：实现正式场景脚本

新增：

- packages/axiia/Scenarios/legal-harbor-murder-jury/script.js

不手改生成的 BUILD.bazel 或 Package.swift。场景目录会由现有 Scenarios embedded resource 收入服务端二进制。

### 5.1 常量与参数

脚本内固定：

- 五轮、九名 NPC、每轮三名 NPC。
- 六票形成判决，六票通过提前终局。
- 每方两次秘密意向投票、一次私聊、两次证据复核、一次提前终局动议。
- 五项公开证据、法律指示、地图、九名 persona、公开和私密 prompt 模板。
- 林固定投 GUILTY，苏固定投 NOT_GUILTY。

启动时校验：

- jurorModels 必须为长度 9 的字符串数组。
- 正式配置要求九个 ID 不重复。
- benchmarkOnly 为 true 时才允许重复模型。
- jurorEfforts 缺省时使用模型默认；存在时必须为长度 9 的字符串数组。
- 每个模型在创建对应 Agent 时由现有 resolver 验证是否可用；不可用应明确失败，不能静默换模型。

### 5.2 Agent 与上下文

建立十一条独立 lane：

- a：林，side a。
- b：苏，side b。
- j01 至 j09：九名 NPC，模型和 effort 来自 params。

开局把同一份公开案件包注入所有 Agent system prompt。作者真相绝不进入脚本中的任何模型 prompt；若实现需要保留作者真相，只能留在设计仓库，不能复制到 shipped script。

公共发言采用显式 hear 路由到其余十人。私聊只在发起玩家和目标 NPC 之间 push/hear。秘密意向投票合计只 push 给发起玩家和九名 NPC。

### 5.3 玩家时段

每个玩家时段：

1. 根据轮次和剩余额度构造 availableActionIds 与 list groups。
2. 进行一次无 channel、无 key 的 act，字段为 actionIds 和 speechContent。
3. 解析规范化 actionIds，做防御性断言。
4. 发布 player_speech，speaker 使用 a 或 b，正文键使用 text。
5. hear 给其余十人。
6. checkpoint，确保公开发言先展示。
7. 按列表从左到右执行行动。
8. 若提前终局通过，立即停止本轮剩余流程。

奇数轮林先、苏后；偶数轮苏先、林后。

### 5.4 秘密意向投票

执行顺序：

1. 发布 secret_poll_opened，公开 round 和 mover。
2. checkpoint。
3. J01 至 J09 依次做无 channel、无 key 的 enum act。
4. 林和苏按固定终局立场计入两张票，不调用模型。
5. 十一票全部收齐后计算匿名合计。
6. 把合计 push 给发起玩家和九名 NPC；不发给另一玩家。
7. 不产生包含合计或个人票的公共 event。

第 5 轮从 availableActionIds 中移除 SECRET_POLL。

### 5.5 一对一私聊

执行顺序：

- 目标编码在 PRIVATE_CHAT_J01 至 PRIVATE_CHAT_J09。
- 三个完整往返，共六次无 channel、无 key 的 act。
- 每次只把生成文本送给对话另一方。
- 不调用 emit，不给其他九人发送占位信息。
- 私聊开始前的公开发言和行动列表不能读取私聊结果；同一列表中位于私聊之后的其他私密行动可以读取已经写入 session 的内容。

### 5.6 证据复核

- 五个 action ID 对应五张固定卡。
- 每次发布 evidence_review，字段包含 round、mover、evidenceId、title 和 text。
- 把同一固定文本 hear 给十一人。
- 每张卡后 checkpoint。
- 不调用模型，不补充任何新证据。

### 5.7 提前终局动议

执行顺序：

1. 只从第 2 轮起提供，且必须是 actionIds 最后一项。
2. 发布 early_motion_opened 并 checkpoint。
3. 发起者自动投 END_NOW。
4. 另一玩家和九名 NPC 依次做无 channel、无 key 的程序票 act。
5. 全部收齐后一次性发布 early_motion_votes；每票公开 juror、procedureVote 和 reason。
6. 发布 early_motion_result，包含 endNowVotes、threshold = 6 和 passed。
7. checkpoint。
8. 六票及以上立即进入最终判决；否则继续当前轮。

程序票与最终有罪/无罪票完全分开。

### 5.8 NPC 随机发言

每个未提前结束的 NPC 阶段：

1. 计算尚未发言者和未来剩余席位。
2. 按规格中的 mustPickNew 公式先保证全员覆盖。
3. 用 game.random 无放回补足三人。
4. 再用 game.random 洗牌三人的发言顺序。
5. 发布 npc_speaker_draw 并 checkpoint。
6. 三人按顺序 say，全部设置 showReasoning: false。
7. 每人说完立即 hear 给其余十人，再调用下一人。

完整五轮应产生 15 次 NPC 公开发言，并保证 J01 至 J09 都至少发言一次。

### 5.9 最终判决

1. 林的固定票为 GUILTY，苏的固定票为 NOT_GUILTY。
2. 九名 NPC 依次做无 channel、无 key 的最终投票 act。
3. 收票期间不 emit 单张结果。
4. 重复的 keyEvidence2 确定性规范化为 NONE，不增加模型调用。
5. 九票全部收齐后一次性发布 final_vote_reveal。
6. 发布 match_result，公开总票、六票门槛、winner 和 endReason。
7. 有罪票不少于六票时 side a 获胜，否则 side b 获胜；比分固定 1:0。

## 6. 公共事件契约

| 类型 | channel | 最小字段 | 公开性 |
|---|---|---|---|
| phase | * | title | 公开 |
| player_speech | public | speaker, round, text | 公开，按普通发言渲染 |
| secret_poll_opened | procedure | round, mover | 公开；无合计、无个人票 |
| npc_speaker_draw | public | round, speakers | 公开；数组顺序即发言顺序 |
| evidence_review | evidence | round, mover, evidenceId, title, text | 公开固定卡 |
| early_motion_opened | procedure | round, mover, threshold | 公开 |
| early_motion_votes | procedure | round, mover, votes | 十一票及理由一次性记名公开 |
| early_motion_result | procedure | round, passed, endNowVotes, threshold | 公开 |
| final_vote_reveal | verdict | votes, guiltyVotes, notGuiltyVotes | 全部收齐后一次性公开 |
| match_result | verdict | winner, guiltyVotes, notGuiltyVotes, threshold, endReason | 公开 |

不定义 private_chat、secret_poll_result 或单张 final_vote 公共事件。

## 7. 阶段三：前端实现

### 7.1 场景公开资料

扩展 packages/axiia-web/src/scenarios/types.ts：

- ScenarioModule 增加可选 publicProfile。
- publicProfile 使用结构化字段，不把整页 HTML 塞入字符串。
- 建议字段：caseSummary、lawInstructions、map、evidence、jurors、actions 和 rules。

新增：

- packages/axiia-web/src/scenarios/legal-harbor-murder-jury.ts
- packages/axiia-web/src/components/scenario/public-case-profile.tsx

修改：

- packages/axiia-web/src/scenarios/index.ts
- packages/axiia-web/src/pages/scenario-detail.tsx

场景详情页重点显示：

- 案件摘要与中文俯视地图。
- E1 至 E5 五张证据卡。
- 林、苏和 J01 至 J09 的座位、姓名、公开 persona 短标签。
- 四类预设行动、每方额度和秘密边界。
- 五轮、交替先手、每轮随机三名 NPC、六票终局。

当前 ScenarioModule 本来就承担“服务器不理解的场景展示知识”，所以首版沿用静态前端模块，不扩展公共 API。前端资料和 script.js 中的公开案件包必须在同一个实现变更中同步复核。

### 7.2 时间线事件

新增陪审团专用事件组件，并由 EventRow 按 type 分派：

- player_speech：复用普通 speech card 外观，不显示原始 event JSON。
- npc_speaker_draw：显示本轮三名入选者和先后顺序。
- secret_poll_opened：只显示谁发起了匿名投票。
- evidence_review：显示“重看既有证据”的固定证据卡。
- early_motion_*：显示动议、十一张记名程序票、6/11 门槛和结果。
- final_vote_reveal：一次性翻开十一张票及 NPC 简短理由。
- match_result：显示最终总票和胜方。

座位状态和公开行动使用次数只从公共事件推导。不得从 journal、私密 action 或 Langfuse 数据推导玩家页面状态。

### 7.3 reasoning 与秘密防线

- Harbor 的 NPC turn 应由服务端返回 reasoning = null。
- 私密生成不应产生任何浏览器可收到的 chunk。
- 前端不保留“幕后”兜底 UI。
- 即使组件误写，API payload 中也不存在私聊、匿名票合计和个人票。

## 8. 阶段四：自动测试

### 8.1 AxiiaScripting

使用内联 fixture 覆盖：

- list 接受空数组和合法有序数组。
- 非 JSON、非数组、非法 ID、分类超额和 terminal 非末尾触发明确 ActFailure。
- repair 后只形成一个 journal act row。
- checkpoint 提交此前 event，固定 journal 重放不重复事件。
- 同一 random journal 重放得到相同 NPC 名单和顺序。
- 多组随机 journal 均满足每轮三人不同、完整五轮覆盖九人。

### 8.2 AxiiaActors

- 私密 act 的 thinking/text 均不发布。
- showReasoning: false 的公开 say 只发布 text，turn.reasoning 为 nil。
- 同一调用的 journal、LLM export 和 envelope 仍保留完整 reasoning。
- checkpoint 在 crash/respawn 后不重复 commit。
- 玩家发言 event 在第一项私密行动开始前已提交。

### 8.3 AxiiaServer

- 普通 owner 和 admin spectator 的 SSE 都不收到私密 chunk；管理员审计走独立 export，不复用玩家直播通道。
- MatchDetail 不返回 journal、私聊、匿名票合计、个人秘密票或原始随机值。
- 公开 secret_poll_opened、npc_speaker_draw 和最终 reveal 可以正常 catch-up，且没有重复。
- slot patch 后旧 match 继续使用原 scriptSHA，新 match 使用新 scriptSHA。

### 8.4 正式场景与前端

- ShippedScenarioTests 自动发现 legal-harbor-murder-jury，并验证 meta.id 与目录一致。
- axiia scenario validate 对整个 Scenarios 目录通过。
- web fmt、lint、typecheck 和 build 通过。
- 浏览器 e2e 增加可指定 scenario ID 的入口，验证案件页出现 E1—E5、十一席和四类行动。
- 本地完整 smoke 必须实际完成一局，检查 10 个玩家时段、15 个 NPC 发言上限、最终十一票以及 replay。

不要让自动测试直接固定正式 script.js 的具体剧情行为；剧情和 persona 仍是可平衡更新的产品内容。

## 9. 阶段五：benchmark 与发布

### 9.1 配置与成本

1. 从发布时可用的模型目录选择九个不同 jurorModels。
2. 至少轮换九种模型—persona—席位映射。
3. 覆盖双方先手、不同 NPC 随机日程、工具开启/关闭和提前终局通过/失败。
4. 分别记录名义生成单元、实际 provider attempts、token、人民币成本、wall time 和失败率。
5. 最坏名义路径为 102 个成功生成单元；真实 provider 请求数还受 retry 和 repair 影响，必须从 LLM export 实测。

### 9.2 内容与公平性

- 检查虚构证据率、错误引用、私密信息口头泄漏和“替全场宣布共识”。
- 检查模型偏置、persona 偏置、席位偏置、先手偏置和随机发言顺序偏置。
- 检查有罪方和合理怀疑方是否都能提出证据支持的可胜路线。
- 检查某一个 NPC 是否对结果形成异常支配。
- 若平衡需要改 prompt、persona、证据或规则，先改产品规格，再改 script。

### 9.3 发布顺序

1. 在 V2 合并运行时与测试。
2. 合并场景脚本和前端。
3. 运行 deno task check。
4. 构建 axiia 二进制并运行 scenario validate。
5. 在非生产环境以 draft slot 上传 script、设置 params 并跑 fresh match。
6. 完成真实模型 benchmark 和浏览器回放检查。
7. 通过管理员 API 上传最终 source，patch slot 的 scriptSHA、params 和 status。
8. 再创建一局 fresh match，确认它固定到新 SHA。
9. 只有 fresh match、公共页面、SSE 保密和 Langfuse 审计全部通过后才设为 live。

## 10. 建议的提交拆分

以下只是未来实施边界，不代表现在提交：

1. runtime: private streaming、hidden reasoning、checkpoint、list field 与规格测试。
2. scenario: legal-harbor-murder-jury script、meta validation 和内联 workflow fixture。
3. web: public profile、十一席与 jury event renderers。
4. docs: DESIGN_SPEC 例外、正式场景规格的运行时措辞修正和发布记录。

## 11. 完成定义

只有同时满足以下条件才算可以上线：

- 林和苏的名称在 meta、speakerLabels、prompt 和前端一致。
- 五项证据与作者一致性层没有交叉泄露。
- 玩家每个时段只产生一个名义合并 act effect，先公开 speech，再执行有序 actionIds。
- 私聊、匿名票合计、匿名个人票、行动列表和原始随机值不进入普通 SSE/API/回放。
- 所有玩家可见 NPC 发言均不含模型 reasoning payload。
- 完整五轮随机调度覆盖九名 NPC；提前终局不会补发言。
- 5/11 动议失败、6/11 动议通过；最终判决同样以 6/11 决定。
- replay、crash resume 和 slot repoint 都不重复事件、不改票、不改随机顺序。
- 前端能独立看懂案件、十一席、行动额度、公开投票和最终结果。
- 自动检查、本地完整 smoke、真实模型 benchmark 和 fresh production-like match 全部通过。
