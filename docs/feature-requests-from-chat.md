# Axiia Cup Feature Requests — Extracted from Feishu Group Chats

> Extracted 2026-04-15 from "axiia cup 内测 pmf operation" (431 msgs) and "axiia cup 智能体 大赛 筹备" (925 msgs).
> Source: all messages from 周弋涵 / zhou yihan, including thread replies.
> Raw JSON: `.local/chat-exports/yihan-feature-requests.json`

---

## Critical

### F26 · JSON 结构化输出 + 高级 Retry 策略
**Category:** engine

LLM 输出 JSON 解析失败率高。需要：
1. 用 pydantic 等 schema 约束输出
2. 从出错位置 retry（不从头），降低成本和时间
3. 自动重试上限（如 3 次）
4. Benchmark 方法：从 Langfuse 拉出错 input，跑不同模型+prompt 组合对比成功率
5. unstructured thinking + structured output 是好的 combo

> - 4/13 pmf: "有没有一些自动重试 比如可以设置个上限三次什么的"
> - 4/13 pmf: "或者用个类似于pydantic之类的东西"
> - 4/13 pmf thread: "就还是benchmark 把出过错的所有input拿过来 跑不同模型不同prompt parse 看看哪个成功率高"
> - 4/13 pmf: "之后至少换成从那个出错的位置retry吧 这样成本低一点 也快一点"

---

## High Priority

### F01 · 工坊首屏重新设计 — 信息过载问题
**Category:** frontend/ux

工坊页面一上来展示信息太多，用户 overloaded。需要重新设计首屏，让用户能快速开始第一次对战。

> - 4/15 pmf thread: "工坊的第一展示要重新设计下"
> - 4/15 pmf thread: "工坊一上来的展示还是有点信息太多"
> - 4/15 pmf thread: "让人快速开始运行第一次对战"
> - 4/15 pmf thread: "目前 上来overload过多信息"

### F02 · 预设提示词折叠 — 太长挡住输入框
**Category:** frontend/ux

预设提示词内容太长，遮挡了输入框。应默认折叠，只显示一小部分。

> - 4/15 pmf thread: "预设提示词太长 挡住了框框"
> - 4/15 pmf thread: "考虑默认折叠 显示一小部分"

### F04 · 保存后跳转到试炼场
**Category:** frontend/ux

用户点完保存后不会跳到试炼场入口，应自动导航。

> - 4/15 pmf thread: "点完保存 不会跳到有试炼场的地方"

### F06 · 登录后直接进工坊，不进控制台
**Category:** frontend/ux

用户登录后默认跳转到工坊/提交页面，而非控制台/dashboard。降低参与门槛。

> - 4/9 prep: "这个能不能 登录直接进工坊 不要进控制台"

### F10 · 两个角色都需要填写的提示 + 预制默认值
**Category:** frontend/ux

很多人意识不到商鞅和甘龙两个角色都需要填写策略。需要明确提示，或放一个预制默认值（"你是商鞅"/"你是甘龙"）。

> - 4/9 prep thread: "note: 很多人意识不到两个角色都要填"
> - 4/9 prep thread: "我们就放个预制进去 预制就是 你是商鞅 你是甘龙"

### F17 · 分角色胜负统计（商鞅榜/甘龙榜）
**Category:** leaderboard

排行榜上分别显示每个玩家作为商鞅和甘龙的胜场和负场数量。长远考虑分开排名。

> - 4/11 pmf: "那话说现在这个胜率是指商鞅的胜率还是甘龙的胜率？能不能分开啊？"
> - 4/11 pmf: "我觉得咱们至少做一点，就是所有人的胜场、负场，把它跟商鞅、甘龙对应起来"
> - 4/11 prep: "现在能否在leaderboard上分别显示商鞅和甘龙的胜负数量"

### F18 · 实时用户行为监控后台（API 优先）
**Category:** observability

实时后台能看到每个玩家的智能体数量、内容、运行状况（PVE/PVP、打了谁、赢没赢）。API/CLI 优先级高于前端面板。用于内部运营分析和 AI 自动化分析。

> - 4/9 prep: "一个实时的后台 看到每个玩家的智能体数量 内容 跑的状况"
> - 4/10 pmf: "API 优先级高于前端面板，只是我们几个人看嘛 能迅速看到 而且能用AI做一下自动化的分析"

### F19 · Telemetry / 用户点击行为追踪
**Category:** observability

追踪用户在前端的点击和页面浏览行为细节。先搜索 typical APP 标准方案再决定实现。

> - 4/9 prep: "我们有telemetry么"
> - 4/11 pmf thread: "然后 telemetry 现在有了不 后台能看大家的点击页面的细节吗"
> - 4/11 pmf thread: "要不你先上网搜索一下 就是typical的标准的APP 这方面都需要加什么"

### F21 · 比赛报错实时推送（Feishu alerts）
**Category:** observability

所有比赛运行中的报错实时推送到飞书群，加上新用户注册提醒。

> - 4/13 pmf: "把所有的比赛报错也都实时的推送过来"
> - 4/12 pmf: "有空搞个claw 后续我们运营起来需要一些自动提醒的联动（比如新用户注册 比如有error"

### F22 · 比赛停止/取消功能
**Category:** tournament

CLI 或后台需要能够停止正在运行中的比赛。目前 CLI 缺少 stop 命令。

> - 4/12 pmf: "这个比赛运行了 目前报错暂停了 是能停止么 我看cli好像没有停止比赛功能"
> - 4/13 pmf: "明早加一下这个功能吧 虽然是mvp但是还是可以全面一点"

### F23 · 瑞士轮赛制重新设计 + ELO 天梯
**Category:** tournament

当前 vanilla 瑞士轮不稳定（第一轮分组影响后续结果、结果波动大）。需要重新设计赛制。考虑引入 ELO 天梯分数让大家可以提前玩起来。

> - 4/11 pmf: "比如瑞士轮第一组怎么分组？" / "非常不稳定"
> - 4/11 prep: "让我重新设计一下赛制 这个vanila的瑞士轮好像是当时没考虑明白"
> - 3/30 prep: "之后可以考虑加elo（一般游戏的天梯分数机制）让大家可以提前玩起来"

### F25 · Judge 模型选择 — GPT 打分 + 海外 proxy
**Category:** engine

当前 judge (DeepSeek) 打分不稳定且偏向商鞅。GPT-5.4 做 score + GPT mini 做 judge 导致都是商鞅赢；Opus 让甘龙都赢。需要更多 benchmark 确保效果。走海外 proxy。

> - 4/11 pmf: "我们能不能换成gpt做 最后的打分 换成比较好的模型"
> - 4/13 pmf thread: "score选的gpt 5.4 judge选的mini 怪不得都是商鞅赢"
> - 4/13 pmf thread: "opus让甘龙都赢了 还是换回ds吧先"

### F30 · 秦孝公 prompt 迭代 — 平衡商鞅/甘龙胜率
**Category:** engine

秦孝公 prompt 有太多 preset 导致偏向商鞅赢。需要调整让甘龙也有赢的机会。考虑架空秦王（不叫秦孝公）。

> - 4/8 prep thread: "目前system prompt里还是有太多preset"
> - 4/8 prep thread: "我觉得要么改下秦孝公的prompt 让他可以稍微弱一点 不要总是判商鞅赢"
> - 4/8 prep thread: "我在想 要不要搞个架空秦王 不要说是秦孝公 是不是可能会让甘龙有机会"

### F33 · Dev / Prod 服务器 + DB 分离
**Category:** infra

开发和生产环境完全分离，包括 DB。Dev server 要方便回滚（如果 agent 搞坏了）。

> - 4/10 pmf: "看来我们之后也要分个dev server是不是好一点"
> - 4/14 pmf: "note: 需要dev/prod server分离 需要db的分离也许"
> - 4/14 pmf: "dev server要方便回滚（如果agent给搞坏了"

### F46 · PVE 晋级制 — 打败全部预设即进入预赛轮
**Category:** tournament

如果玩家的 prompt 能在试炼场打败所有预设对手（preset bots），则自动晋级进入预赛轮（pre-round）。当累计 4 人晋级后，自动触发一轮 round robin 对战。

设计意图：
- 给试炼场一个明确的通关目标，而非无限练习
- 用 PVE 门槛自动筛选出有竞争力的 prompt，降低正式赛的低质量对局
- 4 人 round robin 保证每人都互相交手，结果更公平
- 形成"练习→通关→对战→排名"的完整玩家循环

> - 4/15 yihan (direct): "如果某人的 prompt 能打败所有 preset，则进入 pre-round；当 4 人进入 pre-round 时，进行 round robin"

---

## Medium Priority

### F03 · 角色详情展示优化 — 可能 confuse 用户
**Category:** frontend/ux

当前角色详情的展示方式可能让用户困惑，需要调整。

> - 4/15 pmf thread: "角色详情可能confuse用户"

### F05 · 试炼场内 UX 优化
**Category:** frontend/ux

试炼场内部体验也需要优化。对话开始后应提示用户向下滚动查看新内容。

> - 4/15 pmf thread: "进去试炼场之后 也可以优化"
> - 4/15 pmf thread: "然后一旦开始对话 可以提示 防止用户不知道向下翻"

### F07 · Preset 对手选择（PVE 预设 2-3 个）
**Category:** frontend/ux

工坊界面需要能选择 2-3 个预设的甘龙或商鞅对手进行练习。

> - 4/9 prep: "这里需要能选preset的甘龙或者商鞅 2-3个"

### F08 · 提示词撰写界面展示渲染后的 prompt
**Category:** frontend/ux

提示词撰写界面上方或旁边标注已渲染好的完整 prompt，让用户理解最终效果。

> - 4/9 prep: "提示词撰写界面的上方或者旁边标注已经渲染好的提前准备好的prompt"

### F09 · Hidden request 展示处理
**Category:** frontend/ux

展示 hidden request 其中之一，然后括号说明"实际运行中会随机选择"。

> - 4/9 prep: "关于hidden request处理方式：展示其中之一 然后括号说 实际运行中会随机选择"

### F12 · 对战关键话语高亮标注
**Category:** frontend/ux

在对战回放中标注/高亮关键话语，帮助玩家判断哪些策略起作用了。

> - 4/14 prep: "可能可以做一些关键的话语的标注 高亮"

### F13 · Match 详情页显示 bug
**Category:** frontend/ux

Match 详情页有显示问题（附截图）。

> - 4/12 pmf: "[截图] 这个显示是不是有点问题"

### F16 · Qwen 失败后网页端无法 override 模型
**Category:** frontend/ux

用户选择 qwen 模型失败后，在网页端没有办法 override 换其他模型。

> - 4/11 prep thread: "话说 现在因为用户选择qwen失败之后 在网页端是不是不太能override 模型"

### F20 · LLM Logging (Langfuse) + Langfuse CLI
**Category:** observability

集成 Langfuse 进行 LLM 调用日志记录。搞个 Langfuse CLI 用于从 Langfuse 拉取出错的 input 做 benchmark。

> - 4/8 prep: "anna 你research一下 langfuse 的llm logging 功能"
> - 4/13 pmf thread: "搞个langfuse cli 从langfuse拿 把出过错的所有input拿过来 跑不同模型不同prompt parse"

### F24 · 后台一键跑比赛（GUI 按钮）
**Category:** tournament

不需要 CLI 手动操作，后台直接有按钮可以启动一轮比赛。

> - 4/11 prep thread: "话说现在如果想跑一轮比赛 是不是你要手动操作？没办法在后台直接点个按钮？"

### F27 · Parser + Scorer 分离
**Category:** engine

把打分逻辑从裁判对话中分离出来，用单独的 parser+scorer prompt 或脚本处理。

> - 4/9 prep: "后边打分我们可以有个额外的parser+scorer prompt/script"

### F28 · 模型列表调整
**Category:** engine

去掉 minimax；qwen 换 plus 或去掉（但千问是重要赞助商不能放弃，换千问官方 serving）；glm 加 5.1。

> - 4/9 prep: "去掉minimax qwen换plus or去掉 glm加5.1"
> - 4/11 pmf thread: "他们还是比较重要的一个赞助商 不能放弃 换千问的官方的serving"

### F29 · Persona 进 system prompt
**Category:** engine

角色人设描述应该放入 system prompt 而非 user prompt。

> - 4/9 prep: "persona 进sys prompt"

### F32 · Prompt 拼接逻辑 spec
**Category:** engine

场景 prompt 的拼接逻辑需要一个 spec 文档说明。

> - 4/8 prep thread: "这里的拼接逻辑 还是需要一个spec"

### F34 · Prompt 通过 API 修改（不要表单）
**Category:** infra

Prompt 修改通过 API 进行，方便用 AI 自动修改调试。后台尽量少文本框。不搞表单，完全 prompt 实现。

> - 4/7 prep: "prompt修改 尽量有办法通过api进行 方便我们用ai去做修改和调试"
> - 4/7 prep: "后台最好是尽可能少的文本框"

### F35 · CLI 批量下载所有用户 prompt
**Category:** infra

CLI 需要能批量下载所有用户提交的 prompt 用于分析。目前只能 impersonate。

> - 4/11 prep: "cli是不是没有办法直接下载所有的prompt 我想做点分析"
> - 4/11 prep thread: "只能先impersonate"

### F36 · 海外服务器（代理）
**Category:** infra

找 Minsheng 要一个海外服务器，用于代理海外 API 调用（GPT 等）。

> - 4/12 pmf: "@Minsheng 找ms要个海外的服务器"

### F40 · 新场景/题目设计
**Category:** game_design

多种学科场景：科学辩论（布鲁诺日心说、上帝是否扔骰子、牛顿vs莱布尼兹、达尔文进化论、李森科等大量科学史辩论）、经济（是否加息）、法律（案件判决）、模联/APEC、关原之战。偏古典主题（资料检索更全面）。

> - 4/2 prep: "科学题目 布鲁诺 日心说 上帝是否扔骰子 牛顿vs莱布尼兹"
> - 3/31 prep: "经济：争论是否要加息 模联和apec议题 法官的案件判决"
> - 4/14 pmf thread: "可以稍微古典一点 太当代的可能资料检索不够全面"

### F42 · 公开裁判 prompt — 公平性设计
**Category:** game_design

把 LLM judge 的 prompt 公开出来，让所有人都能看见。虽然主观但公平（每个人都能针对方向优化）。

> - 3/30 prep: "我们把标准公开的越清晰 应该大家都会觉得这事越公平"
> - 3/30 prep thread: "假设我们把language model judge的prompt公开出来 就算主观也就没有关系了"

### F43 · 防 prompt injection — 用选项规避
**Category:** game_design

通过选项/选择题（而非自由文本）来规避 prompt injection 风险和运行时不确定性。

> - 3/30 prep thread: "prompt injection风险 通过选项来规避"

---

## Low Priority

### F11 · 裁判判决 loading 状态展示
**Category:** frontend/ux

裁判判决过程从一开始就展示 loading 状态。

> - 4/9 prep: "裁判判决 刚开始就展现出来 显示loading"

### F14 · 游戏风格 UI 设计方向
**Category:** frontend/ux

整体设计方向应更像游戏界面，而非标准 web app。秦王角色应穿黑衣服。

> - 3/29 prep: "嗯 我在想搞的更像个游戏界面"
> - 4/14 prep: "虽然秦王应该穿黑衣服"

### F15 · 十轮对话 — 可读性长度
**Category:** frontend/ux

十轮是人类可以轻松读完的轮次，保持参与感。轮数应可配置。

> - 4/14 prep: "十轮的好处在于它是一个人类可以轻松读完的轮次"
> - 4/8 prep thread: "嗯 可以config"

### F31 · 对话轮数可配置
**Category:** engine

对话轮数应该可以通过配置修改，不硬编码。

> - 4/8 prep thread: "嗯 可以config"

### F37 · Multi-judge 投票系统
**Category:** game_design

多个裁判（不同 persona、不同标准）同时评判，投票决定结果。类似奇葩说。

> - 3/31 prep: "也可以搞个multi judge design 投票 每个judge的persona和标准都不同"

### F38 · 社区投票奖项
**Category:** game_design

类似 Steam 的社区投票奖，比如 most funniest comment。分两种奖：第一轮（纯直觉）和第二轮（基于数据迭代）。

> - 4/9 prep: "我觉得我们也搞一些什么社区投票奖 就像Steam一样"
> - 4/13 prep: "可以以后评两个奖 第一轮纯主观 第二轮基于数据"

### F39 · Agent 成长机制
**Category:** game_design

Agent 在比赛中逐渐获得更多能力/资源，如完成小任务获得更多算力。具体机制待定。

> - 4/14 prep: "比如一个agent在比赛中会逐渐获得一些更多的？？ 比如什么完成小任务可以获得更多算力"

### F41 · PVE 作为练习/初赛
**Category:** game_design

PVE（单人对战 AI 对手）作为练习模式或更简单的初赛版本。PVP 是核心。

> - 3/30 prep: "先做双人的版本 单人版本可以作为某种练习"
> - 3/30 prep: "pve部分 可以考虑单独存在 作为这个比赛更简单的初赛版本"

### F44 · 注册时填写微信名字
**Category:** auth

注册时增加微信名字字段，方便运营团队 check 用户身份。

> - 4/11 pmf: "之后我们注册还是让大家填一个微信名字吧"

### F45 · 微信关联认证（正式上线）
**Category:** auth

正式上线后认证需要和微信关联，或至少绑定手机号。MVP 阶段固定密码或邮箱验证码。

> - 3/30 prep: "后边正式上线 还是和微信我们想办法关联上 或者至少是有手机的"

---

## Summary

| Priority | Count |
|----------|-------|
| Critical | 1 |
| High | 15 |
| Medium | 18 |
| Low | 12 |
| **Total** | **46** |

| Category | Count |
|----------|-------|
| frontend/ux | 16 |
| engine | 8 |
| game_design | 7 |
| observability | 4 |
| infra | 4 |
| tournament | 4 |
| leaderboard | 1 |
| auth | 2 |
