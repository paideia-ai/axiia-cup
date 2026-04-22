# 商鞅变法 Roguelike / Roguelite 设计提案

状态：提案草稿  
范围：基于当前仓库里实际实现的 `shangyang-court` 场景，而不是历史讨论中的所有分支

## 1. 当前实际游戏形态

先明确现在真正存在的游戏，而不是理想设计：

- 核心场景是 `商鞅变法·朝堂辩法`
- 每局是 `10` 轮交替发言
- 玩家提交两份提示词：`商鞅` 一份、`甘龙` 一份
- 双方各有 `3` 条请求，每局随机抽 `1` 条为真请求，其余为假请求
- 当前没有启用“隐藏事实真假”层；现在的隐藏层只剩“真请求 / 假请求”
- 对话结束后，双方各回答一次“猜对方真请求”的问询
- 裁判输出大政方针和每条请求是否同意
- 之后由独立 scorer 计算最终得分
- 正式 PvP 赛事里每对选手会打两场，交换 A/B 角色
- Playground 已支持 self-play 和 preset opponent 两种模式

这意味着：当前商鞅游戏最强的设计资产，不是数值成长，而是：

- 同一规则下的高重玩性
- 同一提示词面对不同真请求分配时的适应能力
- 从 transcript 中读取对方真实意图
- 围绕公开 judge frame 进行长期 meta 进化

因此，任何 roguelike 化设计都应该增强：

- run variation
- build expression
- failure-forward learning
- replay incentive

而不应该破坏：

- PvP 公平性
- judge 公开性
- prompt 技术本身的可比性

## 2. 从优秀 roguelike / roguelite 中该借什么

不是照搬玩法，而是借它们最强的结构。

### Hades：失败也推进

Hades 最重要的不是随机本身，而是：

- 失败后仍有叙事和系统上的前进感
- 每次 run 都在解锁新的组合空间
- 玩家不是“刷数值”，而是在“扩展表达手段”

对 Axiia Cup 的启发：

- 输掉一局 PvE 也应该获得新的理解、工具、路线，而不是纯浪费 token

### Slay the Spire / Balatro：核心规则稳定，run 构筑变化巨大

这类游戏的强点是：

- 基础规则不复杂
- 每一局通过 draft / relic / joker / event 形成不同 build
- 最有趣的部分是“这次我怎么把同一系统玩出不同组合”

对 Axiia Cup 的启发：

- 商鞅不需要更多底层机制；它需要的是“围绕同一辩论系统形成不同构筑”

### Into the Breach：信息清晰，难度来自求解

Into the Breach 的优秀之处是：

- 威胁是可读的
- 玩家不是被阴，而是在高压下做最优解

对 Axiia Cup 的启发：

- 最好的 roguelike 变体，不是给玩家看不见的暗改，而是给清晰可理解的 run modifier

### FTL：路线选择和事件张力

FTL 的结构价值在于：

- 不是一场战斗，而是一段短旅程
- 路线、事件、资源取舍构成 run identity

对 Axiia Cup 的启发：

- 商鞅的 PvE 完全可以从“单局测试”升级为“短 campaign”

### Against the Storm：横向 meta-progression

Against the Storm 的关键不是让玩家永久变强，而是：

- 每次 expedition 结束带回资源
- 新资源让下一次 run 的选择更丰富

对 Axiia Cup 的启发：

- 最适合这里的是横向 unlock，不是纵向碾压

## 3. 设计原则

如果要给商鞅加 roguelike 层，我建议坚持以下原则：

1. 所有影响正式 PvP 的系统，必须是公开且对称的。
2. PvE progression 应该解锁“新构筑选项”，而不是单纯给数值 buff。
3. run 内奖励优先作用于“信息、路线、构筑、回合结构”，而不是直接改 judge 立场。
4. 玩家的快感来源应该是“我用不同 build 解这个政治博弈题”，而不是“我刷出更强外挂”。
5. 最终目标是服务主 PvP，而不是把 PvE 做成完全割裂的另一款游戏。

## 4. 具体可做的设计方向

下面按优先级列多个方案。

### 方案 A：Court Gauntlet

这是最稳、最像真正 roguelite 的方向。

形式：

- 做一个 `5-7` 节点的 PvE 闯关
- 每个节点是一次朝堂对局，敌人是 preset opponent
- 每赢一局，从 `3` 个 run-only 奖励里选 `1` 个
- 最终打一个 boss court

run-only 奖励示例：

- 下一场额外 `+2` 回合
- 下一场开局公开对手一条“必假请求”
- 下一场你的问询阶段可以得到更明确的问题模板
- 下一场可重投一次“对方真请求猜测”
- 下一场裁判更看重“可行性”，更轻视“修辞”
- 下一场你获得一次“收官陈词”机会

为什么适合当前商鞅：

- 不破坏 PvP
- Playground 和 preset opponent 已经有雏形
- 真请求博弈天然适合 run 内 modifier

这是我最推荐的第一方向。

### 方案 B：Doctrine Cards

把“构筑”显式化。

形式：

- 玩家不只写自由 prompt
- 还可以从一个公共池里为本次 run 装备 `2-3` 个 doctrine cards
- doctrine card 不是技能按钮，而是系统化的策略模块

示例：

- `军功授爵`
- `祖制稳定`
- `君权集中`
- `外患羞耻`
- `渐进试点`
- `宗室反噬`
- `外臣可信`
- `地方治理`

每张 card 的作用：

- 扩展系统 prompt scaffold
- 提供额外 framing angle
- 改变问询阶段的偏好
- 或改变可选事件池

关键点：

- 它们必须是公开、可组合、可比较的
- 它们是“构筑件”，不是黑箱 buff

这会非常像 Slay the Spire / Balatro 的“卡组 + relic / joker”系统，但更贴合你们的 prompt game 本质。

### 方案 C：Daily Seeded Trial

给社区一个每天都能回来的理由。

形式：

- 每日 / 每周一个固定 seed
- 所有人面对同一批 preset 对手、同一批 run modifier、同一真请求分配规则
- 独立 leaderboard

可能的 seed modifier：

- `秦孝公本周偏守`
- `本周只有 8 回合`
- `每局开局公开一条假请求`
- `问询答案必须极短`
- `所有对手更擅长伪装真请求`

价值：

- 社区讨论空间很强
- 非常适合直播、分享、复盘
- 不影响正式 PvP 平衡

这基本对应 Slay the Spire Daily Climb / Balatro seeded challenge 的结构价值。

### 方案 D：Heat / Ascension

如果 Court Gauntlet 证明好玩，下一步就应该上难度梯度。

形式：

- 玩家通关基础 gauntlet 后，可选择更高 heat
- 每个 heat 引入 1 个公开 debuff

示例：

- `回合数 -2`
- `对手更会伪装真请求`
- `秦孝公更厌恶激进方案`
- `猜测错误的代价更大`
- `假请求被批准的惩罚更大`

价值：

- 给高手长期目标
- 不需要新机制，只需系统化 modifier 池
- 非常适合内容扩展

### 方案 E：Qin Campaign Map

这是更野心版的 FTL / Against the Storm 路线。

形式：

- 一次 run 不是一场辩论，而是一段“秦国政治旅程”
- 玩家在地图上选择不同节点

节点类型示例：

- `朝堂辩论`
- `景监密谈`
- `宗室施压`
- `县邑试点`
- `边境军务`
- `流言事件`
- `法令起草`

每种节点不一定都要完整打一场商鞅 PvP 模板；
有些可以是短 event，奖励信息、构筑件或临时效果。

例如：

- 选择“景监密谈”：获得一次对真请求的伪装强化
- 选择“宗室施压”：你知道秦孝公接下来更怕什么，但会减少你下一局的说理空间
- 选择“县邑试点”：下场裁判更重视执行细节

这个方向最能把“辩论 prompt game”升格成“政治 roguelite”。
但实现成本高，适合后期。

### 方案 F：Failure-Forward Court Archive

这是最应该尽快做、成本也最低的 Hades 式设计。

形式：

- 每次 PvE 结束后，给玩家 1 条“档案解锁”
- 不是单纯给分，而是给结构化复盘

例如解锁：

- “你在第 4 回合明显过度强调 SR2，因此被对手高概率锁定”
- “你成功推动了大目标，但把过多篇幅浪费在假请求上”
- “该对手在面对‘渐进试点’时常把真请求藏在轻描淡写的位置”

也可以是更 diegetic 的形式：

- 秦孝公评语
- 景监旁注
- 甘龙批语
- 法家手札

价值：

- 让输局也有内容沉淀
- 强化 transcript 作为内容资产
- 为 prompt iteration 提供真实动力

### 方案 G：Seasonal Public Mutators For PvP

如果想把 roguelike 的“meta 变化”引入正式 PvP，最安全的方式是赛季规则。

形式：

- 每个 season 只改公开规则，不改私有 buff

示例：

- `S1：标准 10 回合`
- `S2：12 回合，裁判更重执行`
- `S3：每局随机公开一条对手假请求`
- `S4：问询阶段变成双问`

优点：

- 玩家会像研究卡牌游戏赛季一样研究新环境
- 仍然是完全对称、公平的
- 可以自然配合 judge/scorer prompt 版本化

## 5. 我不建议做的方向

下面这些看起来像“成长”，但长期看很可能伤害游戏：

### 不建议 1：把 PvE buff 带入正式 PvP

原因：

- 会让主 PvP 失去公平性
- 玩家会把 PvE 视为刷 power 的义务劳动
- 高水平竞争会被“谁刷得多”污染

### 不建议 2：把 judge prompt 私有化成可解锁技能

原因：

- 当前商鞅最重要的公平资产之一就是 judge 公开
- 私有 judge edit 会让对局解释性崩掉

### 不建议 3：给玩家隐蔽的 opponent sabotage

例如：

- 悄悄往对方 prompt 注入混淆
- 给对方隐藏 debuff

问题：

- 太不透明
- 很难复盘
- 很容易让体验像“prompt 注入黑魔法”，而不是策略游戏

### 不建议 4：单纯奖励“多一轮输出”

多一轮可以作为某个 run modifier，但不该是核心 progression。

否则只会鼓励：

- 更长
- 更拖
- 更堆字数

而不会真正增加 build diversity。

## 6. 推荐组合

如果只选一条主线，我建议：

### 推荐主线：`Court Gauntlet + Doctrine Cards + Daily Seeded Trial`

理由：

- `Court Gauntlet` 负责长期 PvE 可玩性
- `Doctrine Cards` 负责 buildcraft
- `Daily Seeded Trial` 负责社区讨论和日常回流

这三个组合起来，已经足够形成一个强的 roguelite 外层。

## 7. 分阶段落地建议

这里再补一个更具体的产品方向：

- `PvE 试炼场` 不只是练手，而应该成为 `modifier lab`
- 玩家在 PvE 中测试公开 buff / debuff 对自己构筑的影响
- 等 PvE 数据足够后，把其中一部分收敛为 `公开 PvP modifier pool`
- 到 PvP 时，每位玩家不是携带私有外挂，而是从公共池中选择一组公开组合

这样做的好处是：

- PvE 有明确目的：测试构筑和 modifier 的配合
- PvP 仍然公平：所有 modifier 都是公开、对称、可研究的
- roguelite 外层不会吞掉 prompt game 本体，而是成为它的训练场和 meta 层

### Phase 1：低成本验证

先做：

- preset opponent 扩展
- gauntlet mode
- run-only modifier 池
- 结构化 post-run archive

目标：

- 验证玩家是否真的喜欢反复打 PvE
- 找出最有趣的 modifier 类型

### Phase 2：显式构筑

再做：

- doctrine cards
- 公共 buff / debuff 池收敛
- 公共 card pool
- 不同 preset opponent 对不同 doctrine 的克制关系

目标：

- 让“构筑”从隐性 prompt 技巧，部分转成显性系统层
- 让 PvE 验证过的 modifier 进入 PvP 公开选配

### Phase 3：高天花板模式

后续可做：

- daily seeded mode
- heat / ascension
- seasonal public mutators
- campaign map

## 8. 最终判断

商鞅变法这个游戏，不适合做成传统“越打越强”的 RPG 式成长。

它更适合的方向是：

- 用 roguelike 的 run 结构增强 replayability
- 用 deckbuilder 的构筑逻辑增强策略表达
- 用 Hades / Against the Storm 式横向解锁增强失败后的推进感

一句话总结：

> 不要把商鞅变法做成“刷 buff 的 PvP 游戏”，而要把它做成“每次 run 都在用不同政治构筑解一道朝堂博弈题”的 roguelite。
