/* D 场景选择（/scenarios）· DA 场景介绍（/scenarios/:id）· OS 出战面板（从 EA 页头 /
   E 版本卡「出战」呼出；A5）与「进行中的对战」条（battle-strip，#72，在 DA / EA / E /
   我的智能体页出现）。条款以 spec-index 里 page ∈ {D, DA, D+DA, OS} 的 34 行为准，
   另把 U06 门槛章（page 空）里在这些部件上直接体现的条款也挂上。 */
import type { StepHints, TmRegistry } from '../types'

export const TM_DISCOVERY: TmRegistry = {
  // ======================= D 场景选择 =======================
  'D.page-header': {
    label: '页面标题与导语',
    anchors: ['spec-a4'],
    note: '「场景 · 选择一个场景，为甲乙双方构建你的对话智能体。」',
  },
  'D.loading': {
    label: '加载中',
    clauses: ['LACK-10'],
    when: '列表请求未返回时',
  },
  'D.error': {
    label: '加载失败提示',
    clauses: ['LACK-10'],
    when: 'GET /v1/scenarios 失败时',
  },
  'D.scenario-list': {
    label: '场景卡列表',
    clauses: ['U04-C03', 'U04-C05'],
    anchors: ['spec-change-54', 'spec-change-37'],
    journeys: ['j2s1'],
    note:
      'onlineAt 最新的场景固定插在第 2 位（#54）；「最热门」精选是 Future（#37），列表里不该出现',
  },
  'D.scenario-card': {
    label: '场景卡',
    clauses: ['U04-C01', 'U04-C06'],
    anchors: ['spec-a4'],
    journeys: ['j2s1', 'j2s2'],
    note: '整卡可点 → DA；卡上没有「去构建」（只在 DA）',
  },
  'D.card-title': {
    label: '场景标题',
    clauses: ['U04-C01'],
  },
  'D.card-badges': {
    label: '徽章区',
    clauses: ['U04-C03'],
    note: '装「新上线」与门槛徽章',
  },
  'D.new-badge': {
    label: '新上线徽章',
    clauses: ['U04-C03'],
    anchors: ['spec-change-54'],
    journeys: ['j2s1'],
    when: '只有 onlineAt 最新的那张卡才有',
  },
  'D.gate-badge': {
    label: '门槛徽章',
    clauses: ['U06-C01', 'U06-C02', 'U06-C03'],
    anchors: ['spec-change-65', 'spec-change-54'],
    note:
      '有 gateProgress 时按侧进度「PVP 解锁 1/1·0/1」/「PVP 已解锁」；老服务器回落静态 PvE/PvP 徽章',
  },
  'D.card-subject': {
    label: '一句话介绍',
    clauses: ['U04-C01'],
  },
  'D.card-education': {
    label: '难度·时长行',
    clauses: ['U04-C02'],
    anchors: ['spec-change-40'],
    journeys: ['j2s1'],
    note: '来自前端场景模块；「码头疑云」缺（已知）',
  },
  'D.novice-badge': {
    label: '适合新手徽章',
    clauses: ['U04-C02'],
    anchors: ['spec-change-40'],
    when: '场景模块标 noviceFriendly 时',
  },
  'D.card-sides': {
    label: '双方与轮数',
    clauses: ['U04-C14'],
    note: '甲/乙侧名 + 标签 + 轮数/形式',
  },
  'D.card-stats': {
    label: '侧方胜率统计',
    clauses: ['U04-C01', 'U04-C02'],
    anchors: ['spec-change-38', 'spec-change-39'],
    journeys: ['j2s1'],
    when: '服务端 stats 到手（过展示门槛）时点亮',
  },
  'D.card-stats-empty': {
    label: '统计空态轮廓',
    clauses: ['U04-C04', 'U04-C01', 'LACK-10'],
    anchors: ['spec-change-54'],
    journeys: ['j2s1'],
    when: '未过统计门槛/老服务器时；绝不摆零',
  },
  'D.empty': {
    label: '暂无场景',
    clauses: ['LACK-10'],
    when: '服务端返回空列表时',
  },

  // ======================= DA 场景介绍 =======================
  'DA.page': {
    label: '场景介绍页',
    clauses: ['U04-C07', 'U04-C08'],
    anchors: ['spec-change-42'],
    journeys: ['j2s2'],
    note:
      '独立教育页，无编辑框（#42）；四层渐进：一眼看懂 → 双方 → 裁判计分 → 深读',
  },
  'DA.loading': {
    label: '加载中',
    clauses: ['LACK-10'],
    when: '场景详情请求未返回时',
  },
  'DA.error': {
    label: '加载失败提示',
    clauses: ['LACK-10'],
    when: 'GET /v1/scenarios/:id 失败时',
  },
  'DA.page-header': {
    label: '页头',
    clauses: ['U04-C08'],
    note: '分类 · 标题 · 学科 · 对阵与轮数 + 右侧门槛状态',
  },
  'DA.header-matchup': {
    label: '对阵与轮数',
    clauses: ['U04-C14', 'U04-C10'],
    note: '「商鞅 对 甘龙 · N 轮」；对话轮数在 EXPAND-2 项目里',
  },
  'DA.gate-status': {
    label: '门槛状态',
    clauses: ['U06-C01', 'U06-C02', 'U06-C03'],
    anchors: ['spec-change-65'],
    note:
      '按侧进度 + 口径文案「每侧各赢 ≥N 场 PVE 练习解锁 PVP」；老服务器回落 PvE 阶段/PvP 已解锁',
  },
  'DA.gate-side-badge': {
    label: '按侧进度徽章',
    clauses: ['U06-C01', 'U06-C02'],
    anchors: ['spec-change-65'],
    when: '门槛未过且服务端返回 gateProgress 时',
  },
  'DA.overview-card': {
    label: '背景故事卡',
    clauses: ['U04-C08', 'U04-C10', 'U04-C09'],
    journeys: ['j2s2'],
    note: 'GLANCE 层：导读 + 事实卡 + 流程 + 难度/时长 + 侧方胜率',
  },
  'DA.overview-story': {
    label: '导读正文',
    clauses: ['U04-C10'],
    note: '逐字来自 scenario-intro.html，不改写',
  },
  'DA.overview-empty': {
    label: '导读整理中',
    clauses: ['LACK-10'],
    when: '场景模块没有 intro 时',
  },
  'DA.overview-facts': {
    label: '背景事实卡组',
    clauses: ['U04-C10'],
    when: '场景有 facts 时',
  },
  'DA.timeline': {
    label: '游戏流程',
    clauses: ['U04-C14'],
    anchors: ['spec-change-51'],
    note: 'EXPAND-2 的阶段结构；个别场景把它移到页尾独立成卡（同一标记）',
    when: '场景有 timeline 时',
  },
  'DA.actions-list': {
    label: '行动简介清单',
    clauses: ['U04-C10', 'U04-C14'],
    note: '背景卡里的「行动简介」：玩家智能体在对局里能做的动作',
    when: '场景有 actions 时',
  },
  'DA.supporting-list': {
    label: '配角清单',
    clauses: ['U04-C10'],
    note:
      '裁判卡里的「九名普通陪审员」等配角/NPC 列表（与行动简介共用组件，id 各自一个）',
    when: '场景有 participants.supporting 时',
  },
  'DA.participants-note': {
    label: '双方提示框',
    clauses: ['U04-C10'],
    when: '场景有 participants.note 时',
  },
  'DA.education-row': {
    label: '难度·时长·形式',
    clauses: ['U04-C02', 'U04-C10'],
    anchors: ['spec-change-40'],
    note: '预计时长属 A4 内容基线八项之一',
  },
  'DA.stats-line': {
    label: '侧方胜率',
    clauses: ['U04-C09', 'U04-C01'],
    anchors: ['spec-change-38'],
    when: '服务端 stats 到手时点亮',
  },
  'DA.stats-empty': {
    label: '侧方胜率空态',
    clauses: ['U04-C09', 'U04-C04', 'LACK-10'],
    anchors: ['spec-change-38', 'spec-change-54'],
    when: '未过统计门槛时（当前线上多为此态）',
  },
  'DA.participants-section': {
    label: '双方与胜利条件',
    clauses: ['U04-C08', 'U04-C10', 'U04-C13'],
    journeys: ['j2s2', 'j2s3'],
    note: 'EXPAND-1 层：开场白 + 甲乙两张侧卡',
  },
  'DA.opening-line': {
    label: '开场白',
    clauses: ['U04-C13'],
    anchors: ['spec-change-51'],
    journeys: ['j2s2'],
    note:
      '与运行时 OPENING_LINE 同源（runtime-quotes.json）；手册的「缺开场白」已知问题已修',
    when: '场景有统一开场首句时',
  },
  'DA.side-card': {
    label: '一方角色卡',
    clauses: ['U04-C10', 'U04-C13', 'U04-C17'],
    anchors: ['spec-p13'],
    journeys: ['j2s3'],
    note:
      '02 甲方 / 03 乙方：是谁 · 胜利条件 · 立场/请求项 · 隐藏目标 · 构建入口',
  },
  'DA.side-goal': {
    label: '胜利条件',
    clauses: ['U04-C10'],
    journeys: ['j2s3'],
  },
  'DA.side-choices': {
    label: '可选立场/请求项',
    clauses: ['U04-C13'],
    anchors: ['spec-change-51'],
    when: '场景为该侧配置了 choices 时（角色卡）',
  },
  'DA.hidden-goals': {
    label: '隐藏目标列表',
    clauses: ['U04-C12', 'U04-C14', 'U04-C10'],
    journeys: ['j2s3'],
    note:
      '对人公开、对对手 agent 隐藏；折叠项，展开看 SR1/GR1 等候选与真假配置说明',
    when: '场景有 hiddenGoals 时；默认收起',
  },
  'DA.side-owned-note': {
    label: '你已有 N 个',
    clauses: ['U04-C17', 'U01-C31'],
    anchors: ['spec-p13'],
    when: '该侧已有策略时',
  },
  'DA.side-actions': {
    label: '侧卡按钮组',
    clauses: ['U04-C17', 'U04-C06', 'U01-C31'],
    anchors: ['spec-p13', 'spec-a2e'],
    note: '0 策略 →「去构建」；已有 →「再建一个 / 查看我的（N）」',
  },
  'DA.build-button': {
    label: '去构建按钮',
    clauses: ['U04-C06', 'U04-C17', 'U04-C07'],
    anchors: ['spec-a2e'],
    journeys: ['j3s1'],
    note: '懒 ensure（get-or-create）后进构建器；导测里 j3s1 的落点登记在 E 组',
    when: '该侧还没有策略时',
  },
  'DA.build-more-button': {
    label: '再建一个按钮',
    clauses: ['U04-C17', 'U06-C07', 'U01-C31'],
    anchors: ['spec-p13', 'spec-change-79'],
    note: '去 /my-agents?new=<side>，在那里过 #59/#79 引导门',
    when: '该侧已有策略时',
  },
  'DA.view-mine-button': {
    label: '查看我的按钮',
    clauses: ['U04-C17', 'U01-C31'],
    anchors: ['spec-p13'],
    when: '该侧已有策略时',
  },
  'DA.build-error': {
    label: '创建失败提示',
    clauses: ['LACK-10'],
    when: 'builder.ensure 失败时',
  },
  'DA.judge-card': {
    label: '裁判与计分卡',
    clauses: ['U04-C08', 'U04-C10', 'U04-C15', 'U04-C11'],
    journeys: ['j2s3'],
    note: 'EXPAND-2 层：裁判是谁 + 提示词原文 + 计分规则',
  },
  'DA.judge-intro': {
    label: '裁判介绍',
    clauses: ['U04-C10', 'U04-C15'],
    note: '裁判摘要与模型经散文交代',
  },
  'DA.judge-prompt': {
    label: '裁判提示词原文',
    clauses: ['U04-C10', 'U04-C15'],
    anchors: ['spec-change-51'],
    note:
      '默认收起；judgeOsPrompt 依 #51 不公开；手册的「裁判 prompt 原文缺席」已修',
    when: '场景模块有 judgePrompt 时',
  },
  'DA.scoring-rules': {
    label: '计分规则',
    clauses: ['U04-C11', 'U04-C10'],
    anchors: ['spec-change-42', 'spec-change-26'],
    journeys: ['j2s3'],
    note: '从场景数据读取，精确权重公开；个别场景默认折叠',
  },
  'DA.score-rule-row': {
    label: '计分条目',
    clauses: ['U04-C11'],
    when: '商鞅类有结构化 requestScoring 的场景',
  },

  // ======================= OS 出战面板 =======================
  'OS.panel': {
    label: '出战面板',
    clauses: ['U05-C01', 'U05-C14', 'U05-C05', 'LACK-06'],
    anchors: ['spec-a5'],
    journeys: ['j5s1', 'jR6s4'],
    note:
      '桌面居中 Modal、移动端底部弹层；Esc/点遮罩关闭；agent/场景/执侧随呼出处预选；A5 的 7 条「待裁决」缺口汇总在 LACK-06',
    when: '在 EA 页头或 E 版本卡点「出战」',
  },
  'OS.panel-title': {
    label: '面板标题',
    clauses: ['U05-C01'],
    note: '「出战 · <场景>」',
  },
  'OS.fielded-version': {
    label: '出战版本副标题',
    clauses: ['U05-C02', 'U05-C02b', 'U06-C13'],
    anchors: ['spec-change-88', 'spec-change-91'],
    note:
      '钉住版 > ★参赛版 > 最新版；面板内无版本下拉（待裁决）；从非 ★ 版本卡呼出时会谎标「★参赛版本」（C02b 已知）',
  },
  'OS.close-button': {
    label: '关闭按钮',
    clauses: ['U05-C01'],
  },
  'OS.trials-blocked-notice': {
    label: '试炼关闭提示',
    journeys: ['j9s4'],
    clauses: ['U11-C06', 'U13-C05'],
    anchors: ['spec-change-47'],
    when: 'config.trialsBlocked 为真（赛事运行期间）',
    note: 'U13-C05：赛事 running 时试炼阻挡（启动期 env 开关）',
  },
  'OS.error-notice': {
    label: '派发拒绝提示',
    clauses: ['U06-C15', 'U03-C11', 'U06-C06', 'U06-C04'],
    anchors: ['spec-change-52', 'spec-change-76', 'spec-change-77'],
    journeys: ['j5s4', 'j6s5'],
    note:
      '触顶「今日次数已用完（N/N），明天再来」/ 同人限次 / 对方未解锁等，数字来自 config',
    when: '任一派发/约战被拒后',
  },
  'OS.tabs': {
    label: '对战方式页签',
    clauses: ['U05-C05'],
    anchors: ['spec-a5'],
    journeys: ['j5s1', 'jR6s4'],
    note:
      '现为 NPC 练习 / 左右手互搏 / 玩家约战；「顶尖玩家」「自动匹配」缺席（待裁决）',
  },
  'OS.tab-pve': {
    label: 'NPC 练习页签',
    clauses: ['U05-C05', 'U05-C03'],
  },
  'OS.tab-hotseat': {
    label: '左右手互搏页签',
    clauses: ['U05-C05', 'U05-C07'],
    anchors: ['spec-change-61'],
  },
  'OS.tab-pvp': {
    label: '玩家约战页签',
    clauses: ['U05-C06', 'U05-C05'],
    journeys: ['j5s1', 'j5s3'],
    note: '恒可见；锁形/解锁图标随门槛切换',
  },
  'OS.pve-empty': {
    label: 'NPC 空态',
    clauses: ['LACK-10'],
    when: '场景没有对手侧预设时',
  },
  'OS.preset-select': {
    label: 'NPC 对手下拉',
    clauses: ['U05-C03', 'U05-C03b'],
    anchors: ['spec-change-62', 'spec-change-34'],
    journeys: ['j5s2'],
    note: '只列对手侧 NPC（执方由 agent 隐含）；NPC 两侧胜率缺席（待裁决）',
  },
  'OS.pve-dispatch-button': {
    label: '发起对战按钮',
    clauses: ['U05-C03', 'U06-C15'],
    anchors: ['spec-change-52'],
    journeys: ['j5s2', 'jR6s4'],
    note: '成功直接进 /matches/:id 实况；触顶仍可点、点后被拒',
  },
  'OS.hotseat-loading': {
    label: '互搏加载中',
    clauses: ['LACK-10'],
    when: '对手列表未返回时',
  },
  'OS.hotseat-empty': {
    label: '没有对侧智能体',
    clauses: ['U05-C04', 'U05-C07', 'LACK-10'],
    anchors: ['spec-change-64'],
    when: '本场景没有自己的对侧 agent 时',
  },
  'OS.hotseat-go-my-agents': {
    label: '去我的智能体按钮',
    clauses: ['U05-C04'],
    anchors: ['spec-change-64'],
    when: '互搏空态里',
  },
  'OS.hotseat-opponent-select': {
    label: '对侧智能体下拉',
    clauses: ['U05-C07', 'U05-C11p1', 'U01-C20b'],
    anchors: ['spec-change-61'],
    when: '对侧有 ≥2 个自己的 agent 时',
  },
  'OS.hotseat-opponent-label': {
    label: '对侧身份',
    clauses: ['U05-C07'],
    when: '对侧只有 1 个自己的 agent 时直陈',
  },
  'OS.hotseat-version-note': {
    label: '对侧取版说明',
    clauses: ['U06-C13', 'U06-C12'],
    anchors: ['spec-change-18'],
    note: '对侧以其 ★参赛版本（否则最新版）出战；指定版本待后端（#18）',
  },
  'OS.hotseat-dispatch-button': {
    label: '自打一场按钮',
    clauses: ['U05-C07', 'U05-C08', 'U06-C05'],
    anchors: ['spec-change-78', 'spec-change-61'],
    journeys: ['j6s1', 'jR6s4'],
    note: '不受 PVP 门槛限制；占每日总配额不占 PVP 配额；成功直接进实况',
  },
  'OS.pvp-unlocked-header': {
    label: '已解锁标头',
    clauses: ['U05-C06', 'U06-C03'],
    anchors: ['spec-change-65'],
    journeys: ['j5s3'],
    note: '「玩家约战已解锁」+ 双侧 ✓ 徽章',
    when: '两侧各赢 ≥1 场 PVE 后',
  },
  'OS.challenge-success': {
    label: '约战成功块',
    clauses: ['U05-C11', 'U05-C13'],
    anchors: ['spec-change-66', 'spec-change-29'],
    note:
      '仅在服务器没回 matchIDs 时的回退形态；正常成功直接跳第 ① 场实况（F6）',
    when: '回退态，正常路径看不到',
  },
  'OS.challenge-unavailable': {
    label: '约战未启用提示',
    clauses: ['LACK-10'],
    when: 'POST /v1/challenges 404/405（老服务器）',
  },
  'OS.lineup-failed': {
    label: '阵容加载失败',
    clauses: ['LACK-10'],
    when: 'my/agents 或版本列表接口失败时',
  },
  'OS.lineup-loading': {
    label: '阵容加载中',
    clauses: ['LACK-10'],
    when: '解锁态刚打开面板时',
  },
  'OS.missing-side-guide': {
    label: '缺侧引导',
    clauses: ['U05-C11', 'U05-C04'],
    anchors: ['spec-change-66', 'spec-change-64'],
    note: '「PVP 约战需双方双侧齐备」+ 去创建缺的那侧',
    when: '解锁但某侧没有带版本的智能体时',
  },
  'OS.create-side-button': {
    label: '去创建某侧按钮',
    clauses: ['U05-C04'],
    anchors: ['spec-change-64'],
    when: '缺侧引导里',
  },
  'OS.lineup': {
    label: '我的双侧出战阵容',
    clauses: ['U05-C11', 'U06-C12', 'U06-C13', 'U05-C11p1'],
    anchors: ['spec-change-66', 'spec-change-91', 'spec-p1'],
    journeys: ['j6s2'],
    note:
      '① 我甲 vs 他乙 · ② 他甲 vs 我乙；候选标签是「#agentID · vN · 模型 ★」而非策略展示名（待裁决）',
  },
  'OS.lineup-select': {
    label: '一侧出战版本下拉',
    clauses: ['U06-C12', 'U05-C11p1', 'U01-C20b'],
    anchors: ['spec-change-91'],
    note:
      '默认预选 ★（参赛优先于最新）；U01-C20b：候选标签仍是裸 #id（待裁决）',
  },
  'OS.lineup-default-note': {
    label: '默认取版说明',
    clauses: ['U06-C12', 'U05-C11'],
    anchors: ['spec-change-91'],
  },
  'OS.pvp-mode-switch': {
    label: '约战子模式切换',
    clauses: ['U05-C05', 'U05-C12'],
    anchors: ['spec-change-25'],
    note: '① 对手玩家 · ② 按 id 约战',
  },
  'OS.pvp-mode-button': {
    label: '子模式按钮',
    clauses: ['U05-C12', 'U05-C05'],
  },
  'OS.rivals-loading': {
    label: '对手玩家加载中',
    clauses: ['LACK-10'],
    when: '对手列表未返回时',
  },
  'OS.rivals-empty': {
    label: '暂无对手玩家',
    clauses: ['U05-C11', 'LACK-10'],
    when: '本场景没有别的玩家出战过，或老服务器缺 ownerAccountID',
  },
  'OS.rival-row': {
    label: '对手玩家行',
    clauses: ['U05-C11'],
    anchors: ['spec-change-66'],
    journeys: ['j6s2'],
    note: '按玩家去重（ownerAccountID），显示昵称 + 其 agent',
  },
  'OS.challenge-button': {
    label: '发起双侧约战按钮',
    clauses: ['U05-C11', 'U05-C13', 'U06-C04', 'U06-C06'],
    anchors: [
      'spec-change-66',
      'spec-change-29',
      'spec-change-77',
      'spec-change-76',
    ],
    journeys: ['j6s2', 'j6s5', 'jR6s1'],
    note:
      '对手玩家行与按 id 解析卡共用；一次约战＝成对两场；成功关面板直达第 ① 场实况；双方都须解锁、同人每日限 M 次',
  },
  'OS.byid-input': {
    label: '版本 id 框',
    clauses: ['U05-C12'],
    anchors: ['spec-change-25'],
    journeys: ['j6s4'],
    note: '占位「输入对方任一版本 id（战报页可复制）」',
  },
  'OS.byid-lookup-button': {
    label: '查询按钮',
    clauses: ['U05-C12'],
    journeys: ['j6s4'],
  },
  'OS.byid-error': {
    label: '按 id 报错',
    clauses: ['U05-C12', 'LACK-10'],
    when: '非数字 / 未找到 / 跨场景 / 老服务器',
  },
  'OS.byid-ref-card': {
    label: '版本身份卡',
    clauses: ['U05-C12', 'U06-C12'],
    anchors: ['spec-change-25', 'spec-change-66'],
    journeys: ['j6s4'],
    note:
      '昵称 · 场景 · 执方 · 模型 · v#id；钉住该侧版本，另一侧取对方 ★（否则最新版）',
    when: '查询到本场景的真实版本 id 后',
  },
  'OS.pvp-footnotes': {
    label: '约战脚注',
    clauses: ['U05-C13', 'U06-C06', 'U06-C15'],
    anchors: ['spec-change-29', 'spec-change-76', 'spec-change-52'],
    note:
      '「一次约战＝成对两场，计 2 场配额」「友谊赛不计分；对方会收到通知，无需同意、不能拒绝」',
  },
  'OS.gate-locked': {
    label: '约战锁定态',
    clauses: ['U05-C06', 'U06-C01', 'U06-C02', 'U06-C03'],
    anchors: ['spec-change-65'],
    journeys: ['j5s1', 'j5s3'],
    note: '锁形 + 口径文案 + 按侧进度徽章 + 差侧引导按钮',
    when: '两侧未各赢 ≥1 场 PVE 时',
  },
  'OS.gate-rule-text': {
    label: '解锁口径文案',
    clauses: ['U06-C01', 'U05-C06'],
    anchors: ['spec-change-65'],
    note: '「每侧各赢 ≥N 场 NPC 练习解锁玩家约战」，N 来自服务端（可配置）',
  },
  'OS.gate-side-badge': {
    label: '按侧进度徽章',
    clauses: ['U06-C01', 'U06-C02', 'U05-C06'],
    anchors: ['spec-change-65'],
    journeys: ['j5s2'],
    note: '如「商鞅 1/1 ✓ · 甘龙 0/1」；只赢一侧仍锁定',
  },
  'OS.gate-practice-this-side': {
    label: '去练习该侧按钮',
    clauses: ['U05-C04'],
    anchors: ['spec-change-62'],
    note: '切回 NPC 练习页签',
    when: '本侧未达标时',
  },
  'OS.gate-practice-opposite': {
    label: '去练习对侧按钮',
    clauses: ['U05-C04'],
    anchors: ['spec-change-62', 'spec-change-64'],
    note: '「切侧」的现行替代：去我的智能体换执侧',
    when: '对侧未达标且已有对侧 agent 时',
  },
  'OS.gate-create-opposite': {
    label: '去创建对侧按钮',
    clauses: ['U05-C04'],
    anchors: ['spec-change-64'],
    note: '懒 ensure 后进构建器',
    when: '对侧未达标且没有对侧 agent 时',
  },
  'OS.gate-locked-legacy': {
    label: '锁定占位',
    clauses: ['U05-C06'],
    when: '服务端不返回 gateProgress 时；不摆假进度',
  },
  'OS.quota-footer': {
    label: '今日配额脚注',
    clauses: ['U06-C15', 'U03-C11'],
    anchors: ['spec-change-52', 'spec-change-46'],
    journeys: ['j5s4'],
    note:
      '「今日已用 n/N（PVP m/M）」，数字来自 GET /v1/config；接口失败时不显示',
  },

  // ======================= 进行中的对战条（#72） =======================
  'OS.battle-strip': {
    label: '进行中的对战条',
    clauses: ['U05-C09', 'U05-C09b', 'U08-C11'],
    anchors: ['spec-change-72'],
    journeys: ['j11s3', 'jR7s4'],
    note:
      '只在派发处（DA / EA / E / 我的智能体）出现；只装你已发起的对局；空态自动隐藏；30 秒轮询',
    when: '你有进行中或 15 分钟内刚完成的对局时',
  },
  'OS.battle-strip-toggle': {
    label: '折叠开关',
    clauses: ['U05-C09'],
    anchors: ['spec-change-72'],
    note: '条头计数「N 进行 · M 刚完成」；折叠状态存 sessionStorage',
  },
  'OS.battle-strip-cards': {
    label: '对局小卡容器',
    clauses: ['U05-C14', 'U05-C09'],
    note: '单行横向滚动（移动端）',
    when: '未折叠时',
  },
  'OS.battle-card': {
    label: '对局小卡',
    clauses: ['U05-C10', 'U05-C09b'],
    journeys: ['jR7s4'],
    note:
      '点击整页跳 /matches/:id（无侧抽屉观战，待裁决）；刚完成卡带我方/对方视角结果',
  },
  'OS.battle-card-leg': {
    label: '约战①/② 徽记',
    clauses: ['U05-C11'],
    anchors: ['spec-change-66'],
    when: '该对局属于一次成对约战时',
  },
}

export const STEPS_DISCOVERY: StepHints = {
  // 第一轮旅程 2 逛场景
  j2s1: { route: '/scenarios', marker: 'D.scenario-card' },
  j2s2: { route: '/scenarios/:id', marker: 'DA.overview-card' },
  j2s3: { route: '/scenarios/:id', marker: 'DA.judge-card' },
  // 第一轮旅程 3 第 1 步：起点是场景页的「去构建」（构建器里的三选一见 E.init-card）
  j3s1: { route: '/scenarios/:id', marker: 'DA.build-button' },
  // 第一轮旅程 5 打 NPC、解锁（面板从智能体页呼出）
  j5s1: { route: '/agents/:id', marker: 'OS.tabs' },
  j5s2: { route: '/agents/:id', marker: 'OS.pve-dispatch-button' },
  j5s3: { route: '/agents/:id', marker: 'OS.tab-pvp' },
  j5s4: { route: '/agents/:id', marker: 'OS.quota-footer' },
  // 第一轮旅程 9 第 4 步：赛事进行中试炼关闭——面板 NPC 练习页签里的提示
  j9s4: { route: '/agents/:id', marker: 'OS.trials-blocked-notice' },
  // 第一轮旅程 6 约战 / 互搏（j6s3 在通知页，归 I 组）
  j6s1: { route: '/agents/:id', marker: 'OS.hotseat-dispatch-button' },
  j6s2: { route: '/agents/:id', marker: 'OS.challenge-button' },
  j6s4: { route: '/agents/:id', marker: 'OS.byid-input' },
  j6s5: { route: '/agents/:id', marker: 'OS.challenge-button' },
  // 第一轮旅程 11 / 第二轮 R7：对战条（/my-agents 无需猜 id）
  j11s3: { route: '/my-agents', marker: 'OS.battle-strip' },
  jR7s4: { route: '/my-agents', marker: 'OS.battle-strip' },
  // 第二轮 R6 发起约战直达实况（jR6s2/jR6s3 在实况页，归 FA 组）
  jR6s1: { route: '/agents/:id', marker: 'OS.challenge-button' },
  jR6s4: { route: '/agents/:id', marker: 'OS.tabs' },
}
