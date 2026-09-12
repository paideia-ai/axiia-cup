# 积分奖励与交互音效 · v4 扩展规格

玩家定期获得一份可跨场景使用的积分，派发时消费，获胜后主动领取部分返还。连续使用同一角色会提高下一局费用，换一个角色恢复基础价格，鼓励玩家探索不同立场。编辑提示词、关键按钮、成功操作和对局完成都有可关闭的短音效；本次不上全局背景音乐。

本规格对应 Keso 在产品群的两项设计及 **2026-09-11 产品会议的完整讨论**，作用于 `v2/web` 和配套 Swift API。新增单元为 `U18`（积分奖励）与 `U19`（交互音效）；本次核对的 v4 已使用 U01–U17。本目录不覆盖这些历史单元，也不自动同步私有 UIUX 看板。

## 阅读与真相源

| 文件 | 用途 |
| --- | --- |
| [requirements.json](./requirements.json) | **规范真相源**。一条可检查行为对应一个稳定 `U##-C##` ID，记录规范句、背景、后果、合规/违规例子及五个独立状态。修改过的条款保留上一版本快照。 |
| [acceptance.md](./acceptance.md) | Given/When/Then 例子、玩家旅程、Gherkin/浏览器测试入口与实际验证记录。 |
| [decisions.md](./decisions.md) | 当前决策及其来源；明确区分会议接受的方向、举例和本次数值默认。 |

写法沿用 `axiia-cup-uiux/spec-v4/README.md` 的 JSON、稳定 ID 与五维状态，并采用其 `docs/SPEC_WRITING_REVIEW.md` 建议的概览、规范账本、验收与决策分层。规范以“状态/触发 → 系统必须产生的结果”表达；解释、实现观察和验证证据分开记录。`spec_status` 不能代替实现或测试结论。

## 来源与优先级

- [2026-09-11 产品会议完整逐字稿](https://stoooges.feishu.cn/docx/BKZJdRj5boTWZsxCKGncpT0rnEc)，19:32:34 CST，24 分 17 秒，记录标识 `obcnyowo5qn9a3yc3638ybc2`。12:02–13:22 讨论全局约 20 局的周期额度、12 或 24 小时刷新，金额和周期没有定死；13:47–17:12 接受通过重复角色加价鼓励多角色，明确 PvE 也适用，“前 5 次、第 6 次双倍”是例子；17:27–19:48 要求输入、删除、关键按钮悬停/点击、完成通知与领取音；23:03 推迟全局音乐，23:41 确认先实施上述音效。
- [Keso：原积分讨论](https://applink.feishu.cn/client/thread/open?open_chat_id=oc_1ceb1f489fbff0ac9579b836f0087cfc&open_thread_id=omt_19c7f688a2ce1b86)：积分消费、PvE 25%–50%/PvP 75% 胜利返还、100 积分/元核算、主动领取。原先“每场景约 5 局”的分配方向由会议中的**全局周期额度**更新。
- [Keso：原音效讨论](https://applink.feishu.cn/client/thread/open?open_chat_id=oc_1ceb1f489fbff0ac9579b836f0087cfc&open_thread_id=omt_19c4691b340f1b94)：保存、派发、可选输出音和运行完成；《杀戮尖塔》《Balatro》作为反馈感参考。
- [音效原型计划，固定版本 c28c9a8](https://github.com/paideia-ai/axiia-cup/blob/c28c9a87d8519415809a26b5dc0cc378722a5238/docs/competition/SOUND_EFFECTS_PLAN.md)：提供默认主音量/输出偏好及听感方向；其第三方游戏样本不随本次代码分发。

会议对后续方向的明确意见优先于较早的群内设想；**20 局、24 小时、基础费用 100、连续 5 次后 2 倍和 PvE 50% 均是当前实现默认，不能标记为会议最终定值**。角色首胜奖励在会议中被提出，没有确定规则，本次不创建额外首胜积分。

## 玩家体验

1. 登录后通过页头余额进入积分页。当前周期额度在首次读取钱包或进行积分操作时到账；额度全局共享，不随场景数增减。
2. 选择场景和执方，派发前读取服务端报价。默认基础费用 100 积分；当天连续 5 次使用同一场景的同一执方后，第 6 次起默认 200 分。换场景或换执方恢复基础价。
3. 两局挑战分别按发起人的甲、乙角色计价，一次显示并原子预留两局总费用。余额不足不能派发。系统故障退款按本局实际扣款全额退回；并发数、PvE 解锁和对手保护仍适用。
4. 胜利终局展示可领取返还，按本局实际费用快照计算。点击领取成功后更新余额、显示已领取并播放奖励音；没有自动到账，也没有重复领取。
5. 编辑提示词时，输入与删除有轻提示；保存、出战等关键按钮的悬停和点击给出轻反馈，服务端确认成功后再播放对应成功音。设置页可调节音量或关闭全部音效；模型输出音默认关闭。

## 术语与默认

| 名称 | 定义 / 本次默认 |
| --- | --- |
| 积分 | 服务端持久保存的非负整数游戏额度，无购买、转账、提现或现金兑换功能。 |
| 周期额度 | `dailyRuns = 20` 个基础价格局，即默认 2000 积分；所有场景共享。 |
| 周期边界 | 本次选择 `Asia/Shanghai` 自然日，午夜切换，相当于 24 小时周期；会议也讨论过 12 小时，没有敲定周期。 |
| 结余 | 余额保留，新周期额度叠加；错过的日期不补发。 |
| 角色 | 发起人的 `scenarioID + side`，不是具体智能体、版本、模型或对手。 |
| 连续记录 | 当前周期内同一付费用户按派发顺序的未退款付费预留/对局；胜负均计，正在运行也计。 |
| 重复角色加价 | 默认连续前 5 次基础价，第 6 次及以后同角色 2 倍；换场景、换侧或新周期重置。 |
| 胜利返还 | 付费发起人获胜后可主动领取该局实际扣款的 PvE 50% / PvP 75%，向下取整。 |
| 失败退款 | 系统失败或已扣款但未成功入队的任务全额退款；已退款记录不再影响后续连续角色报价。 |
| 主音效 | 默认开启，音量 25%；涵盖编辑、按钮交互及成功事件。 |
| 输出音效 | 独立开关，默认关闭；主静音仍覆盖它。 |

原每日总场数与每日 PvP 场数硬上限由积分代替，配置中的 `dailyBattleLimit = 0`、`pvpDailyLimit = 0` 表示不再按这些场数限制派发。并发上限、PvE 解锁、暂停对战和被挑战方每日保护上限继续有效。

报价是当前状态的预览，不预留价格；服务端在真正派发的事务中按最新付费预留重新计算，并原子校验总费用。前端不能用 `基础价格 × 局数` 猜测角色加价后的实际费用，也不能用本地余额决定服务端权益。

所有声音都受主开关、音量、前台焦点及浏览器手势许可约束。高频编辑、悬停与输出声需限频，并让位于关键成功反馈；被抑制的提示不补播。点击声只说明按钮被激活，不说明服务器已成功保存或接受开局。自动暂存、程序填入、历史战报、重连补帧不产生虚假的成功反馈；本次没有循环背景音乐。

“100 积分 = 1 元”仅作成本核算。历史未扣款对局、锦标赛自动局、自我对战没有胜利返还；旁观者和未支付本局的被挑战方不能领取。自我对战仍付费并参与角色连续计数。

## API 契约

所有端点沿用已登录的同源 `/v1` 会话。服务端负责余额、角色历史、报价、资格和领取结果。

```ts
GET /v1/rewards
{
  balance: number;
  dailyAllowance: number;
  battleCost: number; // 基础单局价格
  dailyRuns: number; // 全局基础局数，取代旧 dailyRunsPerScenario
  pveWinRefundPercent: number;
  pvpWinRefundPercent: number;
  pointsPerYuan: 100;
  nextGrantAt: number; // Unix 时间戳，秒
  claimableRewards: { matchID: number; points: number; kind: "pve" | "pvp" }[];
}

GET /v1/rewards/quote?scenarioID=<id>&side=a|b&kind=pve|pvp|hotseat|challenge
{
  cost: number; // 本次总费用
  perBattleCost: number; // 基础价格；不是加价后的平均单局费用
  repeatRoleSurcharge: boolean;
  battleCosts: number[]; // 各局实际费用，顺序与预留/创建一致
}

GET /v1/rewards/matches/:id
{
  matchID: number;
  points: number;
  status: "pending" | "claimable" | "claimed" | "ineligible";
  kind?: "pve" | "pvp" | "hotseat" | null;
}

POST /v1/rewards/matches/:id/claim
{
  matchID: number;
  creditedPoints: number;
  alreadyClaimed: boolean;
  balance: number;
}
```

前端双侧 PvP 面板使用 `kind=challenge`；单局端点的 `pvp` 与双局挑战不可混淆。挑战按发起人的 `a`、`b` 次序报价，第二局因换角色回到基础价；例如已连续玩 `a` 五次时为 `[200, 100]`、总计 300。未知场景报价返回 404；无效执方或模式返回 400。

`pending` 表示付费对局尚未达到可领取终态；`claimable` 为当前用户可领取；`claimed` 为已领取；`ineligible` 为无资格。重复领取返回 `alreadyClaimed: true`、`creditedPoints: 0`，不再次记账。余额不足派发返回 HTTP 402 / `insufficient_points`。

## 实现与验收入口

- [服务端配套 PR #54](https://github.com/paideia-ai/axiia-cup-v2/pull/54)：实际积分、角色报价及事务规则。
- [积分 Gherkin](../../web/tests/e2e/reward-points.feature) 与 [浏览器 BDD](../../web/tests/e2e/reward-points.spec.ts)。
- [音效 Gherkin](../../web/tests/e2e/sound-feedback.feature) 与 [浏览器 BDD](../../web/tests/e2e/sound-feedback.spec.ts)。

浏览器 BDD 使用有状态 HTTP 替身，属于界面集成测试；真实 HTTP + SQLite 的服务端测试在配套仓库，两者不可互相替代。旧版本通过记录只证明当时版本，不能覆盖这次会议补充的角色加价与编辑/按钮音。具体状态见 [验收记录](./acceptance.md)；没有实际执行的新增条款保持待验证，真人听感与产品数值审核单独记录。部署、产品群通知与看板发布以实际 PR/发布记录为准，不能从规格已写好推导。

最终自动验证：后端 `1c0d205` 的 38 个 CI 测试目标通过；前端格式/lint/两类类型检查/构建通过，196 项单元通过，56 项 Storybook 均有通过记录（含超时文件顺序重跑），13 项浏览器 BDD 最终全过。具体运行历史及部分覆盖见 [acceptance.md](./acceptance.md)。规格默认仍待产品确认，没有真人或生产验证结论。
