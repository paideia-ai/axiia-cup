# 《码头疑云：七号仓命案》V2 代码实现计划

> 状态：已在 `/home/kesou/axiia-cup-v2` 的 `feature/legal-harbor-murder-jury` 分支实现，待评审、benchmark 与部署
>
> 产品规格：../../problems/legal-scenarios/02-harbor-murder-jury.md
>
> 实现基线：V2 `main` 提交 `e631fe9`
>
> 更新日期：2026-08-12

## 1. 结论

本场景只需要新增：

```text
packages/axiia/Scenarios/legal-harbor-murder-jury/script.js
```

不需要修改后端、AxiiaScripting、AxiiaActors、数据库或前端。现有能力已经足够：

- 无 `channel` 的 `agent.act` 做单值行动选择和私密生成。
- `agent.say({ channel: 'public' })` 做独立公开发言。
- `push` / `hear` 决定每个场内 Agent 实际知道什么。
- `game.emit` 写真人可见的持久化 timeline，但不会自动进入 Agent session。
- `seq = -1` chunk 让真人网页实时看到无 channel 的幕后生成。
- `game.random()` 提供可重放的 NPC 抽签。

脚本同时内置九个当前模型目录中的不同国产 NPC 模型。这样新 slot 使用默认空 params 也能直接运行；`jurorModels` 仍可在受控部署或 benchmark 中覆盖。

`turn` affordance 不适合本场景：它的 handler 是同步函数，不能直接执行九人投票、六次私聊生成或十张程序票。行动窗口改用现有 `act(enum)`，同样只需脚本代码。

## 2. 信息边界

“私密”只描述场内 Agent 之间的信息隔离，不是对真人网页使用者保密。

- 私聊只有发起玩家 Agent 与目标 NPC Agent 知道；其他 Agent 不知道发生、对象或内容。
- 秘密意向投票的发生与发起者向全场 Agent 公开。发起玩家 Agent 与九名 NPC Agent 收到匿名合计；对方玩家 Agent 不收到合计；各 NPC 只知道自己的个人票。
- 每次行动窗口选择不发送给其他 Agent。
- 真人实时观战和赛后回放采用全知视角，可查看行动选择、逐人秘密票、私聊和 reasoning。
- 原始随机值、作者真相和平台级私人策略 prompt 不属于普通观战内容。

Agent 隔离完全由脚本对 session 的 `system`、`push` 和 `hear` 路由保证。

## 3. 每轮流程

```text
第 r 轮
  玩家 1 发言前窗口：
    反复单选「发动一个行动 / SPEAK」
    每个行动立即执行；选择 SPEAK 后另行生成公开发言
  玩家 2 以相同方式处理
  随机抽出本轮三名 NPC 及顺序
  第 1 名 NPC 发言（全轮第 3 名发言者）
  中场窗口：苏单选「一个行动 / PASS」
  中场窗口：林单选「一个行动 / PASS」
  若未提前终局，第 2、3 名 NPC 依次发言
```

玩家公开顺序仍交替：第 1、3、5 轮林先，第 2、4 轮苏先。中场固定苏先、林后。

发言前循环允许连续使用多个行动；每次选择后，行动结果会先进入有权 Agent 的上下文，再进行下一次选择。中场每人只选择一次，最多使用一个行动，而且不追加公开发言。

## 4. 行动选择

每次窗口调用一次没有 `channel` 和 `key` 的结构化 `act`：

```js
const choice = await player.agent.act({
  fields: {
    actionId: {
      enum: [...availableActionIds, exitId],
    },
  },
  prompt,
})
```

发言前的 `exitId` 是 `SPEAK`，中场是 `PASS`。`availableActionIds` 每次按轮次和整局剩余额度重新生成：

- `SECRET_POLL`：每方 2 次，只在第 1—4 轮出现。
- `PRIVATE_CHAT_J01`—`PRIVATE_CHAT_J09`：每方 1 次。
- 五个证据复核 ID：每方共享 2 次。
- `EARLY_FINAL_MOTION`：每方 1 次，只从第 2 轮出现。

V2 现有 enum 校验已经能拒绝非法 ID 并走结构化 repair；不需要数组字段、行动列表解析或后端校验扩展。

每次选择后产生：

```js
game.emit('observer', {
  type: 'observer_action_decision',
  round,
  window: 'before-speech' | 'mid-round',
  player,
  actionId,
  rawText,
  reasoning,
})
```

该事件只供真人 timeline；脚本不会把它 `push` 或 `hear` 给其他 Agent。

## 5. 四类行动

### 5.1 秘密意向投票

1. 公开投票发生与发起者。
2. 九名 NPC 依次用无 channel 的 enum act 投 `GUILTY` / `NOT_GUILTY` 并给出理由。
3. 加入林、苏的固定票。
4. 产生 `observer_secret_poll`，供真人查看十一张票、理由、reasoning 和合计。
5. 只向发起玩家与九名 NPC `push` 匿名合计；不向对方玩家 `push`。

### 5.2 一对一私聊

- 目标编码在 action ID 中。
- 三个完整往返，共六次无 channel 的结构化 act。
- 每句话只 `hear` 给聊天另一方。
- 完成后产生 `observer_private_chat`，供真人查看双方、六句话和 reasoning。

### 5.3 证据复核

- 每个 ID 对应 E1—E5 的一张固定卡。
- 选择后立即 `emit` 固定证据事件并 `push` 给十一名 Agent。
- 不调用模型，不产生新事实。

### 5.4 提前终局

- 发起者自动投 `END_NOW`。
- 另一名玩家与九名 NPC 依次投记名程序票。
- 十一票、理由和 reasoning 收齐后一次性公开。
- 六票通过；通过时立即跳过本轮所有后续窗口和发言，进入最终判决。

## 6. NPC 发言与终局

- 每轮用 journal 化的 `game.random()` 无放回抽三名不同 NPC，并洗牌顺序。
- 覆盖约束保证完整五轮的 15 个发言席位覆盖九名 NPC。
- 第一名 NPC 发言后打开中场窗口；若未终局，余下两名继续按顺序发言。
- 每名 NPC 发言后才把正文 `hear` 给其他 Agent，后发言者能听到前文。
- 最终九名 NPC 的票先私下收齐，再一次性 `final_vote_reveal`。
- 林固定有罪，苏固定无罪；有罪达到 6/11 时林获胜，否则苏获胜。

## 7. 真人观战与回放

现有网页无需修改：

- `seq = -1` 的无 channel 生成会在真人“幕后”区域实时显示。
- `observer_action_decision`、`observer_secret_poll` 和 `observer_private_chat` 作为普通脚本事件进入持久化回放；即使没有场景专用组件，通用事件卡仍能展开完整 payload。
- 公开 NPC 发言的 reasoning 由现有 dialogue row 展示。
- 原始随机值、作者真相和平台级私人策略 prompt 不进入这些 observer 事件。

## 8. 测试与成本

必须 smoke 两条主路径：

1. 五轮全部 `SPEAK` / `PASS`：10 次发言前选择、10 次玩家公开发言、10 次中场选择、15 次 NPC 发言、9 次最终票，共 54 个模型生成。
2. 工具路径：覆盖两次秘密票、一次私聊、两次复核、提前终局通过与失败，并确认结果能影响下一次选择和发言。

若双方把所有行动都放在发言前，且两次提前终局都失败，名义成功生成单元上限为 134；provider retry 和结构化 repair 可能增加实际请求数。

另外验证：

- 每轮三名 NPC 不重复，完整五轮覆盖九人。
- 中场确实位于第三与第四名发言者之间，且顺序固定苏、林。
- 无权 Agent session 不含私聊、他人个人票或对方才应知道的匿名合计。
- 真人 timeline 含全部 `observer_*` 记录。
- 5/11 动议失败、6/11 通过；最终判决同样为 6/11。
- 固定 journal 重放不改行动、票型、私聊、抽签或发言顺序。
- `axiia scenario validate`、本地 fake-model 完整局和真实模型 benchmark 通过。

## 9. 发布

1. 只提交新增的 `script.js`。
2. rebase 到最新 `origin/main` 后推送 feature branch 并创建 PR。
3. 在非生产环境上传脚本；使用内置九模型默认值或显式设置 `jurorModels` params，然后创建 fresh match。
4. 检查真人直播幕后区、持久化回放、Agent session 隔离和成本。
5. benchmark 通过后上传最终 source、切换 slot 的 script SHA，再创建 fresh match 验证。

已有 match 固定旧 script SHA，不会因 slot 更新自动采用新脚本。
