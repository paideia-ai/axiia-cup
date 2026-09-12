# 积分奖励与交互音效 · v4 扩展规格

玩家每天获得足够体验各个场景的积分，派发对局时消耗积分，获胜后主动领取部分返还。保存版本、成功派发、对局完成和领取奖励都有短促、可关闭的声音反馈；逐条模型输出音效由玩家单独开启。

本规格对应 Keso 在 Axiia 产品群提出的两项设计，作用于 `v2/web` 和配套 Swift API。它是 v4 的新增单元：`U18`（积分奖励）与 `U19`（交互音效）。本次核对的 v4 已使用 U01–U17；本目录不覆盖这些历史条款，也不修改私有 UIUX 仓库的看板数据。

## 阅读与真相源

| 文件 | 用途 |
| --- | --- |
| [requirements.json](./requirements.json) | **规范真相源**。一行一条可检查行为，稳定 `U##-C##` ID；包含规范句、背景、后果、合规/违规例子和五个独立状态维度。 |
| [acceptance.md](./acceptance.md) | Given/When/Then 验收例子及完整玩家旅程；计划不等于执行证据。 |
| [decisions.md](./decisions.md) | 数值默认、边界和技术取舍；区分 Keso 的明确要求与本次实现决定。 |

写法沿用 `axiia-cup-uiux/spec-v4/README.md` 的结构化条款与五维状态，并采用其 `docs/SPEC_WRITING_REVIEW.md` 建议的“概览 → 规范账本 → 验收例子 → 决策记录”。规范句采用“状态/触发 → 系统必须产生的可观察结果”，解释、实现观察与测试状态分栏保存。`spec_status` 表示规格成熟度，不能代替实现或验证结果。

## 来源

- [Keso：积分奖励讨论](https://applink.feishu.cn/client/thread/open?open_chat_id=oc_1ceb1f489fbff0ac9579b836f0087cfc&open_thread_id=omt_19c7f688a2ce1b86)：每日积分约支持每场景 5 次游戏；游戏消耗积分；PvE 胜利返还 25%–50%、PvP 约 75%；100 积分对应 1 元核算；点击领取按钮时增加积分并播放音效。
- [Keso：音效讨论](https://applink.feishu.cn/client/thread/open?open_chat_id=oc_1ceb1f489fbff0ac9579b836f0087cfc&open_thread_id=omt_19c4691b340f1b94)：保存新版本、派发游戏、每段输出、运行完成；输出音可选/静音；参考《杀戮尖塔》《Balatro》的反馈感。
- 音效原型参考：[SOUND_EFFECTS_PLAN.md，固定版本 c28c9a8](https://github.com/paideia-ai/axiia-cup/blob/c28c9a87d8519415809a26b5dc0cc378722a5238/docs/competition/SOUND_EFFECTS_PLAN.md)。该分支的设计偏好是输入；原型中引用第三方游戏的音频不作为本次交付素材。

详细消息 ID 保存在规范账本的 `sources` 中。以下数值与边界是本次实现选择，尚不代表 Keso 对未明确部分的产品确认。

## 玩家体验

1. 登录后，页头显示积分余额，点击进入“积分”页；当天额度在首次读取钱包或进行积分操作时到账。
2. 派发前看见本次费用和当前余额。正常单局默认 100 积分；两局挑战在开始前显示并预留两局总费用。
3. 服务端接受派发后扣除对应积分。余额不足时不能开局；失败任务全额退回本局实际扣款。
4. 胜利战报显示可领取返还：默认 PvE 50 积分、PvP 75 积分。点击“领取”成功后更新余额、显示已领取并播放奖励音效。
5. 设置页可关闭全部音效或调节音量。模型输出音默认关闭，开启后只为正在观看的实时完整输出提供一次轻提示。

## 术语与默认

| 名称 | 定义 / 本次默认 |
| --- | --- |
| 积分 | 服务端保存的整数游戏额度；不可为负，无现金购买、提现或兑换功能。 |
| 每日额度 | 当天首次发放时，当前可用场景数 × 每场景 5 局 × 100 积分。 |
| 一天 | `Asia/Shanghai` 自然日，午夜切换。 |
| 结余 | 既有余额继续保留；当天额度可叠加，离线错过的日期不补发。 |
| 已扣费用 | 派发时记录到具体对局的实际整数扣款；之后的返还以它为依据。 |
| 胜利返还 | 发起并支付本局的玩家获胜后可领取的部分扣款；PvE 50%，PvP 75%，向下取整。 |
| 失败退款 | 任务失败或已扣款的派发取消后，自动全额退回本局扣款。 |
| 主音效 | 默认开启、音量 25%；涵盖保存、派发、完成、领取。 |
| 输出音效 | 独立开关，默认关闭；主音效关闭时也必须静音。 |

声音事件条款统一受主开关、音量、前台焦点及浏览器手势许可约束；满足业务触发不代表绕过这些条件。输出提示至少间隔 300 毫秒，并让位于正在播放或排队的保存、派发、完成及奖励音，避免多个事件重叠。

“100 积分 = 1 元”只作成本核算常量，不将游戏积分变成可兑换余额。历史未扣款对局、锦标赛自动对局不产生本机制的返还；自我对战消耗积分但不产生胜利返还。旁观者或未支付本局的被挑战方不能领取该局返还。

## API 契约

所有端点沿用已登录的同源 `/v1` 会话。余额、费用、资格与领取结果都以服务端为准，客户端不能通过本地存储创造积分。

```ts
GET /v1/rewards
{
  balance: number;
  dailyAllowance: number;
  battleCost: number;
  dailyRunsPerScenario: number;
  pveWinRefundPercent: number;
  pvpWinRefundPercent: number;
  pointsPerYuan: 100;
  nextGrantAt: number; // Unix 时间戳，秒
  claimableRewards: { matchID: number; points: number; kind: "pve" | "pvp" }[];
}

GET /v1/rewards/matches/:id
{
  matchID: number;
  points: number;
  status: "pending" | "claimable" | "claimed" | "ineligible";
  kind?: "pve" | "pvp" | "hotseat";
}

POST /v1/rewards/matches/:id/claim
{
  matchID: number;
  creditedPoints: number;
  alreadyClaimed: boolean;
  balance: number;
}
```

`pending` 表示付费对局尚未达到可领取的终态，`claimable` 表示当前用户可领取，`claimed` 表示已领取，`ineligible` 表示没有该用户的返还资格。重复成功领取返回 `alreadyClaimed: true`、`creditedPoints: 0`，不重复记账。派发余额不足使用 HTTP 402 与 `insufficient_points` 错误码。

## 交付与验证范围

此目录跟随代码 PR 评审。它没有向产品群发消息、没有自动批准产品数值、没有同步或发布私有 v4 看板。需求中的测试引用必须对应实际测试文件/测试名；未执行的验收仍为 `untested`，没有 CI 记录时 `last_green` 为 `null`。真人听感和产品默认值需要单独确认，不能从自动测试通过推导。
