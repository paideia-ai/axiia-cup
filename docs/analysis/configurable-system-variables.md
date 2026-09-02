# Axiia Cup 可配置系统变量清单

> 整理日期：2026-09-02
>
> 状态：产品规格盘点；不是当前实现完成度清单
>
> 配置管理原则：文件 + CLI + 只读接口；不建设后台配置 UI

## 1. 调研范围

本清单合并、去重了以下资料：

- Supabase `axiia-decisions.public.comments` 中可辨识为 Yihan 的
  `yihan`、`yihan2`、`yihan3` 评论，共 58 条；
- `axiia-cup-uiux` 中 `UI-Doc.md`、`UI-Doc-v2.md`、`UI-Doc-v3.md`、
  `UI-Doc-v3.1.md`、`UI-Doc-v3.2.md`、`UI-Doc-v3.3.md`、
  `UI-Doc-v3.4.md` 及当前 JSON 形态的 spec v4；
- Yihan 对 59 项规格困惑的逐条回应；
- `axiia-cup` 中 PRD、SPEC_v2、DESIGN_SPEC、Anna baseline 及其 Git 历史；
- 当前 API 场景 schema，用于核对已有字段名，不用于反推产品决定。

Supabase 评论里直接新增或澄清配置要求的记录：

- `comments.id=130`：当前站内通知默认全部开启；未来支持通知偏好配置；
- `comments.id=140`：模型选择清单必须由配置文件提供；
- `comments.id=180`：计分“权重”的含义仍需澄清，不能直接当成统一全局参数。

大量更早的 configurable 标注并不在 Supabase 评论正文中，而集中在
`v3-confusions-answers-yihan.md` 的 L1–L18、X8/X9、I7/I10 等回应里，随后被整理进
v3.3/v3.4 的 C2 配置注册表。

## 2. 明确需要可配置的系统旋钮

| 建议变量名 | 作用域 | 当前规格口径 | 默认值 / 状态 | 来源 |
|---|---|---|---|---|
| `stats.min_battles_per_agent` | 全局 | 场景统计达到门槛后才展示；只按该场景的对局数、按 agent 计，不按胜率 | 数值未定；前端不得写死 | L1、#39、C2 |
| `limits.daily_battles_per_player` | 每玩家 | 每日总对战次数；只扣发起方；触顶后提示并拒绝入队 | 数值未定 | L2、I9、#45/#52、C2 |
| `limits.concurrent_battles_per_player` | 每玩家 | 同时排队或运行的对局上限 | 数值未定 | L15、#46、C2 |
| `limits.pvp_daily_battles_per_player` | 每玩家 | PVP 每日次数上限，独立于每日总对战次数 | 数值未定 | L15、#46、C2 |
| `gates.pvp_distinct_wins_per_side` | 玩家 × 场景 × 侧 | 每一侧分别击败至少 N 个不同 PVE-NPC；发起方和被约方均须达标 | 默认 `N=1`；N 不得大于 NPC 数 | L3、X8、I10、#65/#77、C2 |
| `pve.default_npc_count` | 全局默认 | 每场景的 PVE-NPC 数量 | 默认 `2` | L3、#28、C2 |
| `onboarding.scenario_id` | 全局 | 新人首战默认场景 | 曾建议商鞅；未最终确认 | L4、#10、C2 |
| `onboarding.side` | 全局 | 新人首战默认执方 | 未定 | L4、#10、C2 |
| `onboarding.opponent_npc_id` | 全局 | 新人首战自动派发的“最容易”NPC | 未定 | L4、#10、C2 |
| `models.allowed_player_models` | 全局 | 构建器可选模型清单；由配置文件/只读接口下发；选择结果随版本快照 | 清单可变 | L6、#13、C2、Supabase #140 |
| `visibility.matrix` | 全局 | 按“资源 × 观众身份”决定可见性 | 当前仅提示词、diff、玩家自己的 thinking trace 受限；其余公开 | L7、#20、C2 |
| `scenario.difficulty` | 每场景 | 场景难度档位 | `easy / medium / hard` | L18、#40、C2 |
| `scenario.beginner_friendly` | 每场景 | 独立的新手友好标记；不得从 difficulty 自动推导 | Boolean | L18、#40、C2 |
| `notifications.preferences` | 每玩家 | 通知总开关、逐类偏好、不可关闭的强制通知、默认值和持久化 | Future；当前站内通知全部默认开启 | Supabase #130、B6/U12-C08 |
| `ops.block_trials_during_tournament` | 运营开关 | 赛事运行期间是否阻挡全部试炼 | 行为已进入规格 | I13、#47 |

## 3. 场景配置 schema 必须支持的变量

这些变量属于“场景内容/场景执行配置”，不一定是 C2 中的全局运营旋钮，但系统必须
支持通过场景文件和 CLI 配置。

### 3.1 基础信息

- `scenario.id`
- `scenario.title`
- `scenario.subject`
- `scenario.summary`
- `scenario.background`
- `scenario.difficulty`
- `scenario.beginner_friendly`
- `scenario.estimated_duration`
- `scenario.published_at`

### 3.2 角色与构建内容

- `roles.a.name`、`roles.b.name`
- `roles.*.card`
- `roles.*.public_requirements`
- `roles.*.action_focus`
- `roles.*.win_conditions`
- `roles.*.boundaries`
- `roles.*.stance_options`
- `roles.*.request_options`
- `opening_line`
- `agent_prompt_template`
- `mcq_decks.a`、`mcq_decks.b`

### 3.3 对局流程

- `turn_count`：历史规格为场景可配置 10–20，默认 20；
- `stage_structure`：场景是否有多个阶段以及各阶段顺序；
- `examination_mode`：是否进行赛后问询以及问询方式；
- `examination_questions`：场景专属问询内容；
- `judge_rounds`：历史规格明确为场景可配置、默认 3，但当前 schema 没有独立字段，
  需要决定恢复还是废止。

### 3.4 隐藏信息与随机化

- `roles.a.hidden_info_pool`、`roles.b.hidden_info_pool`
- `false_info_count`
- `true_request_count`
- 每局真假信息的抽取和分配规则

真假信息的具体数量与内容属于场景配置，不能把 mock 中的“3 真 2 假”等示例写死为
全局产品规则。

### 3.5 裁判、计分与模型

- `judge_model`
- `scorer_model`
- `judge_prompt`
- `judge_prompt_summary`
- `judge_os_prompt`：管理员维护，不向玩家下发；
- `scorer_prompt`
- `scoring_mode`：结构化程序计分或 LLM 计分；
- `scoring_dimensions`
- `scoring_weights`
- `scoring_penalties`
- `scoring_script` / `scoring_schema`

系统层必须支持结构化计分，但每个场景采用哪种计分方式、权重和惩罚值由场景作者
决定。Supabase #180 说明“权重”的产品语义仍需进一步澄清。

### 3.6 PVE-NPC

- `pve_npcs[]`
- 每个 NPC 的所属侧、名称、提示词、模型、难度与排序；
- 哪个 NPC 被定义为新人首战的“最容易”对手；
- NPC 数量采用全局默认值，但列表和具体内容属于每场景配置。

## 4. 需要先裁决的历史冲突

### 4.1 重复约战限次

历史规格存在三种互相冲突的口径：

1. v3.3 #52：不设额外重复对局限制，由每日总量兜底；
2. v3.4 #76：同一对手玩家每日最多 M 次约战，M 参考 3；
3. 后续 DESIGN_SPEC：只有双方四个单侧 agent-version 完全相同时才累计，每日最多 X 次。

在裁决前，不应同时创建多个相互重叠的配置键。最终应三选一：

- 不设置重复约战旋钮；
- `limits.same_opponent_challenges_per_day`；
- `limits.exact_lineup_repeats_per_day`。

### 4.2 `turn_count` 默认值

- 历史产品规格：10–20，默认 20；
- 当前数据库 schema：默认 10。

需要统一默认值，同时保证前端从场景数据读取。

### 4.3 `judge_rounds`

- 历史产品规格：场景可配置，默认 3；
- 当前实现：没有独立 `judge_rounds`，`examinationQuestionTemplate` 为空即跳过问询。

需要决定是否恢复明确轮数，或在新规格中正式以问询 schema 取代它。

### 4.4 统计展示门槛

口径已经确定为“按 agent 的对局数”，但具体门槛没有确定。该值可以不展示给普通
玩家，但必须存在于配置源和审核证据中。

## 5. 明确不是配置变量的项目

- 提示词上限目前是固定规格：每侧 1000 个汉字或英文词，不按 token；
- 玩家在构建器中选择的模型是版本数据，真正的系统配置是可选模型清单；
- 新场景固定第 2 位和“新上线”徽章当前是规格行为，不是可调数值；
- 模型信息永远公开，不进入可见性矩阵；
- PVE 不设独立重复次数限制，但仍消耗每日总对战次数；
- Hotseat 不受 PVP 解锁门槛限制，但消耗每日总对战次数；
- 配置管理不做后台 UI，统一通过文件 + CLI 管理，前端只读取必要值。

## 6. 当前实现提示

当前 API 场景 schema 已有：

- `turnCount`
- `judgeModel`
- `scorerModel`
- `openingLine`
- `agentPromptTemplate`
- `examinationQuestionTemplate`
- `judgePrompt`
- `judgeOsPrompt`
- `scorerPrompt`
- 两侧角色、隐藏信息、选项与请求
- `falseInfoCount`
- `trueRequestCount`

当前 `appSettings` 只有 `registrationCode`、`writeLock`、`tokenSoftCap`，因此本文列出的
C2 运营旋钮并不等于已经全部实现。

## 7. 主要来源

- [Yihan 对 59 项规格困惑的回应](https://github.com/paideia-ai/axiia-cup-uiux/blob/main/v3-confusions-answers-yihan.md)
- [UI-Doc-v3.4](https://github.com/paideia-ai/axiia-cup-uiux/blob/main/UI-Doc-v3.4.md)
- [spec v4 README](https://github.com/paideia-ai/axiia-cup-uiux/blob/main/spec-v4/README.md)
- [历史 DESIGN_SPEC 配置注册表](https://github.com/paideia-ai/axiia-cup/blob/d2cf1076/docs/competition/DESIGN_SPEC.md#L430-L445)
- `docs/competition/DESIGN_SPEC.md`
- `apps/api/src/db/schema.ts`
- Supabase `axiia-decisions.public.comments`（只读查询，2026-09-02）
