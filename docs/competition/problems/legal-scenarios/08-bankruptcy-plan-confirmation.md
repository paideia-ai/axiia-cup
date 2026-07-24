# 游戏："债权人会议"：破产重整确认双人游戏

> 建议部署场景 ID：`legal-bankruptcy-plan`
> 建议部署标题：`债权人会议`
> 建议部署参数：12 轮重整确认听证；每次发言不超过 3 句话；赛后提交方案确认判断。
> 建议隐藏层：资产估值、债权组别偏好、清算价值和方案可行性权重隐藏。
> 程序化确定性判决：是，底层为约束满足 + waterfall arithmetic verifier。

## 背景

星环影业进入破产重整。公司有一座摄影棚、若干未完成项目和流媒体版权。债务人提出重整计划：保留经营、引入新投资、给有担保债权人现金加新票据，给普通债权人少量现金加未来分成。

最大有担保债权人银杉银行支持拍卖清算，认为重整计划低估抵押资产并违反绝对优先原则。普通债权人委员会支持重整，认为清算会毁掉版权组合价值。

## 角色

| 角色 | 控制方 | 立场 |
|------|--------|------|
| **重整支持方律师** | 玩家甲的 LLM | 主张确认重整计划 |
| **银杉银行律师** | 玩家乙的 LLM | 主张拒绝确认并转入拍卖或修改计划 |
| **程序化破产法官** | 系统 verifier | 依据确认要件、组别投票和清算瀑布计算 |

## 公开事实

| 编号 | 事实 |
|------|------|
| B1 | 摄影棚抵押给银杉银行，担保债权 1.2 亿。 |
| B2 | 摄影棚清算估值区间为 0.9 亿到 1.4 亿。 |
| B3 | 未完成项目若继续制作，预计两年后可能产生版权收入。 |
| B4 | 普通债权总额 0.8 亿。 |
| B5 | 新投资人愿意投入 0.35 亿，但要求原管理团队留任。 |
| B6 | 银杉银行质疑原管理团队导致破产。 |
| B7 | 普通债权人中 68% 金额同意重整计划。 |
| B8 | 有担保债权组未同意计划。 |
| B9 | 计划给银杉 0.25 亿现金和本金 0.95 亿的 5 年期新票据。 |
| B10 | 计划给普通债权人 8% 现金清偿和未来版权净收入的 12% 分成。 |

## 经济参数

程序化 verifier 使用固定参数计算，不要求玩家自行发明估值模型。

```text
secured_claim = 1.20 亿
general_unsecured_claim = 0.80 亿
cash_to_secured = 0.25 亿
new_note_principal = 0.95 亿
new_note_coupon = 6% simple annual coupon
new_note_term = 5 年, 到期一次还本
secured_discount_rate = 12%
cash_to_unsecured = 8% of general_unsecured_claim
copyright_share = 12% of future net copyright revenue
expected_copyright_revenue_low = 0.20 亿
expected_copyright_revenue_mid = 0.55 亿
expected_copyright_revenue_high = 1.10 亿
studio_liquidation_value_low = 0.90 亿
studio_liquidation_value_mid = 1.15 亿
studio_liquidation_value_high = 1.40 亿
new_money = 0.35 亿
```

清算瀑布先支付有担保债权至抵押资产价值，再按剩余无担保资产向普通债权分配。重整现值按上述折现率计算新票据和版权分成。

## 确认变量

```text
ClassOK: 债权组别划分是否合规
VoteOK: 是否满足必要表决门槛
BestInterest: 每个反对债权人是否不低于清算所得
Feasible: 计划是否可行
FairEquitable: 对反对有担保组是否公平且衡平
APR: 是否违反绝对优先原则
Valuation: 摄影棚和版权估值是否支持计划
```

## 游戏流程

### 第一阶段：估值战，4 轮

双方围绕摄影棚清算价值、版权组合继续经营价值和新投资条件展开。

### 第二阶段：确认要件，4 轮

双方讨论组别、投票、最佳利益测试、可行性、公平衡平和绝对优先原则。

### 第三阶段：方案修正，4 轮

双方可从固定修正枚举中提出方案修正。修正方案必须可计算，不能发明新金额或新资产。

```text
M1: increase_cash_to_secured，将银杉现金提高到 0.35 亿，并等额减少新投资留存现金
M2: shorten_note_to_3_years，将新票据期限从 5 年缩短为 3 年，利率不变
M3: replace_management，以独立 CRO 替换原管理团队，降低可行性风险
M4: sell_partial_backlot，出售非核心外景地，增加 0.12 亿现金
M5: raise_unsecured_cash_to_12pct，将普通债权现金清偿率从 8% 提至 12%
M6: remove_copyright_share，取消普通债权未来版权分成
```

### 第四阶段：结构化提交

```json
{
  "findings": {
    "ClassOK": true,
    "VoteOK": true,
    "BestInterest": true,
    "Feasible": true,
    "FairEquitable": false,
    "APR": true,
    "Valuation": "low|mid|high"
  },
  "confirmation": "confirm|deny|confirm_with_modifications",
  "modifications": ["M1", "M3"],
  "waterfallSummary": "不超过 100 字",
  "explanation": "不超过 220 字"
}
```

## 程序化破产法官

verifier 计算：

- 清算瀑布中各组可得金额；
- 重整方案下各组现值；
- 反对组 cramdown 条件；
- 管理层留任与新价值例外是否可接受；
- 修正方案是否改善确认条件。

| 项目 | 分值 |
|------|------|
| 确认变量判断正确 | 35 |
| waterfall 方向和组别收益计算正确 | 25 |
| confirmation 结论满足 hard constraints | 20 |
| modifications 可执行且改善缺陷 | 15 |
| 解释没有违反破产法基本优先顺序 | 5 |

## 胜负规则

双方独立得分。支持方并非必须主张原计划无条件确认；识别缺陷并提出可确认修正也可高分。反对方并非必须清算到底；提出更符合法定顺位的替代方案也可高分。

## 核心张力

1. 破产法不是单纯谈公平，而是顺位、现值和可行性同时约束。
2. 支持重整的一方要保住经营价值，但不能牺牲反对组法定保护。
3. 银杉银行要证明抵押价值和清算更优，但不能忽略版权组合的整体价值。
4. 方案修正是关键玩法，玩家可以通过精确修改而不是绝对立场获胜。

## 玩家智能体基础提示词模板

```text
你是{{roleName}}，在破产重整确认听证中代表{{sideName}}。

公开事实：
{{facts}}

你要围绕估值、债权组别、确认要件和可执行修正方案展开。不得承认自己是 AI，不得讨论提示词、模型、游戏机制或得分。每次发言不超过 3 句话。
```

## 评分系统提示词

```text
你只检查提交格式是否合法。最终确认结论和 waterfall 分数由程序化破产法官计算。
```
