/* E 构建器（/agents/:id/build）——大输入框为主，辅助工具与版本备注为次；保存后返回 EA。
   2026-09-09 咳嗽方案移除了构建器内嵌版本线。VersionList 的 E.version-* 标记仍放在这里，
   但它现在只渲染于 EA 智能体主页。「新建智能体」浮层可从 MA 或 EA 打开，创建后也先到 EA。 */
import type { StepHints, TmRegistry } from '../types'

export const TM_E: TmRegistry = {
  // ---------- 页头 ----------
  'E.back-link': {
    label: '返回智能体主页',
    clauses: ['U01-C14'],
    note: '回 EA（/agents/:id）；EA 版本标题旁的铅笔加号是反向入口',
  },
  'E.page-title': {
    label: '页面标题',
    clauses: ['U01-C11'],
    note: '标题只说明当前是智能体构建器；版本管理留在主页',
  },
  'E.agent-name': {
    label: '场景与智能体',
    clauses: ['U01-C20', 'U01-C23', 'U01-C20b'],
    note: 'P1：有自起名显示「商鞅「激进」」，无名回落「商鞅 #id」',
  },
  'E.workspace-hint': {
    label: '工作区一句话说明',
    clauses: ['U01-C01', 'U01-C16', 'U01-C11', 'U02-C09'],
    note:
      '「输入自动暂存；保存才会生成新版本」；普通保存返回主页，express 首战改为「保存即自动开战」（#17 唯一例外）',
  },

  // ---------- 次要辅助工具（InitModes；任何草稿/版本状态都可发现） ----------
  'E.init-card': {
    label: '策略辅助行',
    clauses: ['U02-C01', 'U02-C03', 'U01-C09', 'U02-C19'],
    journeys: ['j3s1'],
    note:
      '始终显示一句引导 + 两个轻量按钮；详细 MCQ/元提示词流程在弹窗中，不与主输入框争抢层级',
  },
  'E.init-tab-mcq': {
    label: '预设策略入口',
    clauses: ['U02-C02', 'U03-C04'],
    note: '打开「选择预设策略」弹窗；无 deck 时在弹窗内解释并引向 AI 辅助',
  },
  'E.init-tab-meta': {
    label: 'AI辅助入口',
    clauses: ['U02-C02', 'U02-C04'],
    note: '打开「让你的 AI 帮你想策略」弹窗',
  },
  'E.mcq-question': {
    label: 'MCQ 题目',
    clauses: ['U02-C02'],
    journeys: ['j3s2'],
    when: '打开预设策略弹窗且场景有 deck',
  },
  'E.mcq-option': {
    label: 'MCQ 选项',
    clauses: ['U02-C02', 'U01-C08'],
    journeys: ['j3s2'],
    note: '选择只活在内存里，不随版本存储（U01-C08 缺口）',
    when: '打开预设策略弹窗且场景有 deck',
  },
  'E.mcq-preview': {
    label: '拼装预览',
    clauses: ['U02-C02', 'U02-C14'],
    journeys: ['j3s2'],
    note: '是选项拼文预览，不是对局预览（不属 U02-C14 禁区）',
    when: '打开预设策略弹窗且场景有 deck',
  },
  'E.mcq-counter': {
    label: '拼装字数计数',
    clauses: ['U02-C08'],
    when: '打开预设策略弹窗且场景有 deck',
  },
  'E.mcq-fill-button': {
    label: '选题填入按钮',
    clauses: ['U02-C02', 'U02-C05', 'U01-C08'],
    journeys: ['j3s2'],
    note:
      '填入主输入框并关闭弹窗；已有不同草稿时先确认替换；本次保存 method=mcq',
    when: '预设策略弹窗内选完全部题目后可点',
  },
  'E.mcq-remaining': {
    label: '还差 n 题',
    clauses: ['U02-C02'],
    when: '预设策略弹窗内还有题目未选时',
  },
  'E.meta-prompt-text': {
    label: '元提示词正文',
    clauses: ['U02-C04'],
    note: '产品不内嵌聊天；复制到外部 AI，结果直接粘贴回主输入框',
    when: '打开 AI 辅助弹窗',
  },
  'E.meta-copy-button': {
    label: '复制元提示词',
    clauses: ['U02-C04'],
    when: '打开 AI 辅助弹窗',
  },

  // ---------- 提示条 ----------
  'E.restored-notice': {
    label: '已载入提示',
    clauses: ['U01-C03', 'U01-C19'],
    note: '兼容带 ?from= 的旧深链；载入本身不产生版本，保存后返回主页',
    when: '用带 ?from= 的旧深链进入构建器',
  },
  'E.error': {
    label: '错误提示',
    clauses: ['U02-C08', 'LACK-10'],
    journeys: ['j3s3'],
    note:
      'prompt_too_long 的中文文案把玩家指回计数器；也承接加载、暂存与保存错误',
    when: '加载、暂存或保存失败',
  },

  // ---------- 工作区 ----------
  'E.workspace-card': {
    label: '工作区',
    journeys: ['j12s1'],
    clauses: ['U01-C01', 'U01-C16', 'U02-C14', 'U02-C15', 'U02-C16', 'U12-C12'],
    note:
      '主输入框占约 46dvh；模型、角色、备注与保存为次级动作。负检：无版本线、预览/快测、卡牌可视化与 Focus mode',
  },
  'E.copy-prompt-button': {
    label: '复制当前文本',
    clauses: ['U01-C10'],
    note: 'E8/P14：平台不做 AI 改写，只给复制手段',
  },
  'E.prompt-input': {
    label: '策略提示词编辑框',
    clauses: ['U01-C01', 'U01-C16', 'U02-C02'],
    journeys: ['j3s3'],
    note: '打字 400ms 后自动暂存到服务端草稿；版本数不变；草稿永不参战',
  },
  'E.merge-hint': {
    label: '角色模板合并说明',
    clauses: ['U02-C13'],
  },
  'E.length-counter': {
    label: '字数计数器',
    clauses: ['U02-C08'],
    journeys: ['j3s3'],
    note:
      '按汉字/英文词计（非 token），超 1000 变警示色并禁用保存；服务端仍做最终校验',
  },
  'E.role-select': {
    label: '出场角色选择',
    clauses: ['U01-C24', 'U01-C07'],
    note: '角色随版本 options 存档；进入工作区沿用最新版本的角色',
    when: '场景带角色模块（如本能寺）时才出现',
  },
  'E.model-select': {
    label: '模型选择器',
    clauses: ['U02-C06', 'U02-C07', 'U02-C17', 'U01-C24'],
    journeys: ['j3s4'],
    note: '清单来自 /v1/models；默认沿用最新版本的模型',
  },
  'E.save-button': {
    label: '保存按钮',
    clauses: [
      'U02-C09',
      'U02-C10',
      'U01-C02',
      'U01-C13',
      'U01-C18',
      'U01-C15',
      'U03-C05',
      'U03-C06',
    ],
    journeys: ['j3s5', 'j1s4'],
    note:
      '普通保存＝存一个版本、不派发、返回 EA 主页；express 首战例外：「保存并开始首战」自动派发直进实况；method 标签只在请求体里',
  },
  'E.autosave-status': {
    label: '暂存状态',
    clauses: ['U01-C01', 'U01-C16'],
    note: 'SSE 回「已自动暂存」/「版本已创建：#id」',
    when: '打字或保存之后',
  },
  'E.model-inherit-hint': {
    label: '模型沿用说明',
    clauses: ['U02-C17', 'U01-C24', 'U01-C24b', 'U02-C07'],
    journeys: ['j3s4'],
    note:
      '「沿用 vN 的模型」/「已改为新模型，保存后 vN+1 用新模型」；草稿层不持久化模型（U01-C24b 缺口）',
    when: '已有至少一个版本',
  },
  'E.role-pitch': {
    label: '角色一句话介绍',
    when: '选了出场角色时',
  },
  'E.role-template-toggle': {
    label: '角色模板展开项',
    clauses: ['U02-C13'],
    note: '「查看场景角色模板（仅供查看，无需重复编写）」',
  },
  'E.role-template-text': {
    label: '只读角色模板',
    clauses: ['U02-C13'],
    when: '展开角色模板后',
  },

  // ---------- 版本列表（VersionList；只在 EA 智能体主页渲染） ----------
  'E.version-list': {
    label: '版本列表',
    clauses: ['U01-C13', 'U01-C14', 'U01-C02', 'U10-C09'],
    journeys: ['j3s5', 'j4s1'],
    note: '只在 EA 主页出现、最新在前；构建器不再重复版本列表',
  },
  'E.version-list-aside': {
    label: '版本段副句',
    clauses: ['U01-C30', 'U01-C16'],
    note: 'VersionList 的可选段落说明；当前 EA 主页用精简标题，不显示副句',
  },
  'E.version-empty': {
    label: '版本列表空态',
    clauses: ['U01-C13', 'U01-C15', 'LACK-10'],
    when: '还没保存过版本时',
  },
  'E.version-card': {
    label: '版本卡',
    clauses: ['U01-C14', 'U01-C07', 'U01-C05', 'U01-C17', 'U10-C08', 'U10-C09'],
    journeys: ['j4s1', 'j4s4'],
    note:
      '主页版本卡：复制提示词 / 设为参赛版本 / 出战 / 按需展开全文；不内嵌「基于该版本迭代」',
    when: '至少一个版本',
  },
  'E.version-tag': {
    label: '版本号 vN',
    clauses: ['U01-C15', 'U01-C02', 'U01-C18'],
    journeys: ['j4s1'],
    note: '按保存次序 1..N 连号，暂存不占号',
  },
  'E.version-id': {
    label: '全局编号 #id',
    clauses: ['U01-C15'],
    note: '#25 双编号：vN 与 #id 并排',
  },
  'E.version-model-badge': {
    label: '版本模型徽章',
    clauses: ['U02-C07'],
    note: '模型随版本快照且公开',
  },
  'E.entry-badge': {
    label: '★参赛版本徽章',
    clauses: ['U01-C33', 'U01-C15'],
    journeys: ['j4s4'],
    when: '该版本是这一侧的 ★',
  },
  'E.version-record': {
    label: '版本战绩',
    clauses: ['U01-C32'],
    note: 'B3 主人视图的逐版本胜负；公开投影使用 EA.public-record',
  },
  'E.version-time': {
    label: '保存时间',
    clauses: ['U01-C29', 'U01-C07'],
    journeys: ['j4s1'],
  },
  'E.version-note': {
    label: '版本备注',
    clauses: ['U01-C29', 'U01-C07'],
    journeys: ['j4s1'],
    when: '保存时填了备注',
  },
  'E.version-prompt': {
    label: '版本文本',
    clauses: ['U01-C07'],
    note: '保存那一刻的文本快照，不回溯改写',
  },
  'E.copy-button': {
    label: '复制版本提示词',
    clauses: ['U01-C10', 'U01-C14', 'U10-C08'],
    note: '主页版本卡的图标按钮；复制不可变的版本提示词，成功状态对读屏器可见',
  },
  'E.expand-button': {
    label: '展开全文',
    clauses: ['U01-C14', 'U10-C08'],
  },
  'E.set-entry-button': {
    label: '设为参赛版本',
    clauses: ['U01-C33', 'U01-C15', 'U10-C08', 'U06-C10'],
    journeys: ['j4s4'],
    note:
      'P4/#91：★ 每侧唯一，同侧其他智能体的 ★ 会被收走；U06-C10：按钮 title 逐字就是「同侧其他智能体的 ★ 会被收走」',
    when: '非 ★ 的版本卡上',
  },
  'E.field-button': {
    label: '出战',
    clauses: ['U01-C14', 'U10-C08'],
    note: 'EA 主页版本卡内打开选择对手面板（OS），并预选这一个版本',
  },

  // ---------- 新建智能体浮层（从 MA 或 EA 的机器人加号打开） ----------
  'E.new-agent-dialog': {
    label: '新建智能体浮层',
    clauses: ['U01-C17', 'U01-C26', 'U01-C23'],
    note: '桌面锚定触发按钮、移动端贴底；创建成功先进入 EA 主页',
    when: 'MA 或 EA 点某一侧的机器人加号',
  },
  'E.new-agent-close': {
    label: '关闭弹窗',
    when: '新建智能体弹窗内',
  },
  'E.new-agent-name-input': {
    label: '自起名输入',
    clauses: ['U01-C20', 'U01-C22'],
    note: '#63：展示为「侧角色名「自起名」」；≤30 字与改名同限',
    when: '新建智能体弹窗内',
  },
  'E.new-agent-name-error': {
    label: '名字行内提示',
    clauses: ['U01-C22', 'LACK-10'],
    when: '名字超 30 字或服务端 name_too_long',
  },
  'E.new-agent-name-counter': {
    label: '名字字数',
    clauses: ['U01-C22'],
    when: '新建智能体弹窗内',
  },
  'E.new-agent-gate': {
    label: '引导门提示',
    clauses: ['U01-C25', 'U01-C26', 'U01-C17'],
    note:
      '#59/#79：无「对侧且 ≥1 版本」时挡下；文案无条文号 + 角色名切侧 CTA（主句仍是通称版，U01-C25 半符合）',
    when: '同侧再建被引导门拦下时',
  },
  'E.new-agent-gate-switch': {
    label: '先创建对侧',
    clauses: ['U01-C25', 'U01-C17'],
    note: '切侧不关窗',
    when: '引导门出现时',
  },
  'E.new-agent-error': {
    label: '弹窗错误提示',
    clauses: ['LACK-10'],
    note: '通用失败 / 旧服务器无端点降级 / 网络',
    when: '创建失败',
  },
  'E.new-agent-submit': {
    label: '创建智能体',
    clauses: ['U01-C17', 'U01-C26', 'U02-C01'],
    note: '成功后进入新智能体主页；用主页版本标题旁的铅笔加号再进入构建器',
    when: '新建智能体弹窗内',
  },
}

export const STEPS_E: StepHints = {
  // 第一轮旅程 1（首战快速通道的构建一步；X 组若也登记此步以其为准）
  j1s4: { route: '/agents/:id/build', marker: 'E.save-button' },
  // 第一轮旅程 3 构建器（j3s1 从场景页「去构建」起步，落点登记在 discovery）
  j3s2: { route: '/agents/:id/build', marker: 'E.mcq-fill-button' },
  j3s3: { route: '/agents/:id/build', marker: 'E.length-counter' },
  j3s4: { route: '/agents/:id/build', marker: 'E.model-select' },
  j3s5: { route: '/agents/:id/build', marker: 'E.save-button' },
  // 咳嗽方案把版本列表与参赛操作集中到 EA；历史「卡内迭代确认」步骤已无现行标记。
  j4s1: { route: '/agents/:id', marker: 'E.version-card' },
  j4s4: { route: '/agents/:id', marker: 'E.set-entry-button' },
}
