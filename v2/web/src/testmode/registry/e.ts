/* E 构建器（/agents/:id/build）——工作区 + 初始化三选一 + 内嵌版本线；
   另含版本卡（EA 页复用同一套，U01-C14）与「再建一个」新建弹窗（从我的智能体页打开，
   走 #59/#79 引导门后进构建器）。条款以 spec-index 里 page=E 的 56 行为准。 */
import type { StepHints, TmRegistry } from '../types'

export const TM_E: TmRegistry = {
  // ---------- 页头 ----------
  'E.back-link': {
    label: '返回智能体主页',
    clauses: ['U01-C14'],
    note: '回 EA（/agents/:id）；EA 页头「编辑」是反向入口',
  },
  'E.page-title': {
    label: '页面标题',
    clauses: ['U01-C11'],
    note: '界面一律说「智能体」与「版本」，不出现「版本线」「策略」槽位义',
  },
  'E.agent-name': {
    label: '场景与策略名',
    clauses: ['U01-C20', 'U01-C23', 'U01-C20b'],
    note: 'P1：有自起名显示「商鞅「激进」」，无名回落「商鞅 #id」',
  },
  'E.workspace-hint': {
    label: '工作区一句话说明',
    clauses: ['U01-C01', 'U01-C16', 'U01-C11', 'U02-C09'],
    note:
      '「输入自动暂存；保存才会生成新版本」；express 首战时改为「保存即自动开战」（#17 唯一例外）',
  },

  // ---------- 初始化三选一（InitModes，只在 0 版本且工作区为空时出现） ----------
  'E.init-card': {
    label: '初始化方式卡',
    clauses: ['U02-C01', 'U02-C03', 'U01-C09', 'U02-C19'],
    journeys: ['j3s1'],
    when:
      '新建后（0 版本、工作区为空）出现；场景无 deck 时不出现（U02-C03 缺口）；保存 v1 后不再复活',
  },
  'E.init-subtitle': {
    label: '初始化卡副标题',
    clauses: ['U02-C18', 'U01-C06', 'U01-C09', 'U03-C13'],
    note:
      '「想重新选卡：再建一个智能体」——不得再引用已废止的「复制为新智能体」',
    when: '同初始化方式卡',
  },
  'E.init-tabs': {
    label: '三种起手方式页签',
    clauses: ['U02-C02', 'U03-C04'],
    journeys: ['j3s1'],
    when: '同初始化方式卡',
  },
  'E.init-tab-mcq': {
    label: 'MCQ 拼装页签',
    clauses: ['U02-C02', 'U03-C04'],
    note: '默认选中（#12）；U03-C04：express 也默认 MCQ、三种可切',
    when: '同初始化方式卡',
  },
  'E.init-tab-basic': {
    label: '直写页签',
    clauses: ['U02-C02'],
    when: '同初始化方式卡',
  },
  'E.init-tab-meta': {
    label: '元提示词页签',
    clauses: ['U02-C02', 'U02-C04'],
    when: '同初始化方式卡',
  },
  'E.mcq-intro': {
    label: 'MCQ 开场说明',
    clauses: ['U02-C02'],
    when: 'MCQ 页签且 deck 有 intro',
  },
  'E.mcq-question': {
    label: 'MCQ 题目',
    clauses: ['U02-C02'],
    journeys: ['j3s2'],
    when: 'MCQ 页签',
  },
  'E.mcq-option': {
    label: 'MCQ 选项',
    clauses: ['U02-C02', 'U01-C08'],
    journeys: ['j3s2'],
    note: '选择只活在内存里，不随版本存储（U01-C08 缺口）',
    when: 'MCQ 页签',
  },
  'E.mcq-preview': {
    label: '拼装预览',
    clauses: ['U02-C02', 'U02-C14'],
    journeys: ['j3s2'],
    note: '是选项拼文预览，不是对局预览（不属 U02-C14 禁区）',
    when: 'MCQ 页签',
  },
  'E.mcq-counter': {
    label: '拼装字数计数',
    clauses: ['U02-C08'],
    when: 'MCQ 页签',
  },
  'E.mcq-fill-button': {
    label: '选题填入按钮',
    clauses: ['U02-C02', 'U02-C05', 'U01-C08'],
    journeys: ['j3s2'],
    note: '填入后初始化卡收起；本次保存 method=mcq',
    when: 'MCQ 页签，选完全部题目后可点',
  },
  'E.mcq-remaining': {
    label: '还差 n 题',
    clauses: ['U02-C02'],
    when: 'MCQ 页签，未选完时',
  },
  'E.basic-hint': {
    label: '直写说明',
    clauses: ['U02-C02'],
    when: 'Basic 直写页签',
  },
  'E.meta-prompt-text': {
    label: '元提示词正文',
    clauses: ['U02-C04'],
    when: '元提示词页签',
  },
  'E.meta-copy-button': {
    label: '复制元提示词',
    clauses: ['U02-C04'],
    when: '元提示词页签',
  },
  'E.meta-paste-input': {
    label: '粘贴框',
    clauses: ['U02-C04'],
    note: '产品内不提供聊天——只有复制出去、粘贴回来',
    when: '元提示词页签',
  },
  'E.meta-fill-button': {
    label: '元提示词填入',
    clauses: ['U02-C04', 'U02-C05'],
    note: '粘贴前禁用；本次保存 method=builder',
    when: '元提示词页签',
  },

  // ---------- 提示条 ----------
  'E.restored-notice': {
    label: '已载入提示',
    clauses: ['U01-C03', 'U01-C19'],
    journeys: ['j4s2', 'jR1s3'],
    note: '「已载入 vN · 保存后将成为 v(N+1)」；载入本身不产生版本',
    when: '点某版本「基于该版本迭代」之后（或带 ?from= 进入）',
  },
  'E.save-notice': {
    label: '保存成功提示',
    clauses: ['U02-C10', 'U02-C11', 'U01-C12', 'U01-C33'],
    journeys: ['j3s5', 'j4s4'],
    note:
      '「已保存 vN · ★参赛版本仍是 vK——新版本不会自动参赛」；改标后同一条显示「★ 已从 vK 移到 vN」',
    when: '保存或改标之后',
  },
  'E.move-entry-button': {
    label: '一键改标',
    clauses: ['U02-C11b', 'U01-C12'],
    journeys: ['j3s5'],
    note: 'E10 后半句：点一下把刚保存的 vN 设为参赛版本（pr-fate 拍板 A）',
    when: '保存了一个不是 ★ 的新版本之后',
  },
  'E.error': {
    label: '错误提示',
    clauses: ['U02-C08', 'LACK-10'],
    journeys: ['j3s3'],
    note: 'prompt_too_long 的中文文案把玩家指回计数器；改标失败也落这里',
    when: '保存/改标失败',
  },

  // ---------- 工作区 ----------
  'E.workspace-card': {
    label: '工作区',
    journeys: ['j12s1'],
    clauses: ['U01-C01', 'U01-C16', 'U02-C14', 'U02-C15', 'U02-C16', 'U12-C12'],
    note: '负检：无预览/快测、无「敬请期待」占位、无卡牌可视化与 Focus mode',
  },
  'E.copy-prompt-button': {
    label: '复制当前文本',
    clauses: ['U01-C10'],
    note: 'E8/P14：平台不做 AI 改写，只给复制手段',
  },
  'E.prompt-input': {
    label: '策略提示词编辑框',
    clauses: ['U01-C01', 'U01-C16', 'U02-C02'],
    journeys: ['j3s3', 'j4s1', 'j4s3', 'jR1s1'],
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
      '按汉字/英文词计（非 token），超 1000 变警示色；仅提示，保存由服务端拒绝',
  },
  'E.clear-button': {
    label: '清空工作区',
    clauses: ['U01-C09', 'U02-C19'],
    note:
      '0 版本时文案「清空工作区（重新选择初始化方式）」；已有版本后只写「清空工作区」',
    when: '场景有 deck 且工作区非空',
  },
  'E.clear-confirm': {
    label: '清空确认行',
    clauses: ['U01-C09', 'U02-C19'],
    note:
      '两步就地确认不弹窗；已有版本时提示「不回到初始化三选一——想重选：再建一个或创建对侧」',
    when: '点「清空工作区」之后',
  },
  'E.clear-confirm-button': {
    label: '确认清空',
    clauses: ['U02-C19'],
    when: '点「清空工作区」之后',
  },
  'E.note-input': {
    label: '版本备注输入',
    clauses: ['U01-C29', 'U01-C07'],
    journeys: ['j4s1'],
    note: 'P10：≤60 字，保存成功后清空',
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
    journeys: ['j3s5', 'j4s1', 'j1s4'],
    note:
      '保存＝存一个版本、不派发、留在本页；express 首战例外：「保存并开始首战」自动派发直进实况；express 分支：自动选最弱 NPC（U03-C06）；U02-C05 的 method 标签在请求体里，按钮上看不见',
  },
  'E.next-version-hint': {
    label: '下个版本号提示',
    clauses: ['U02-C12', 'U01-C30', 'U01-C15'],
    journeys: ['j3s5'],
    note: 'P12：常驻保存按钮旁，E 页恰一处',
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

  // ---------- 版本线（VersionList；EA 页复用） ----------
  'E.version-list': {
    label: '版本线',
    clauses: ['U01-C13', 'U01-C14', 'U01-C02', 'U10-C09'],
    journeys: ['j3s5', 'j4s1'],
    note: '新在前；express 首战不摆版本线；EA 页同一套',
  },
  'E.version-list-aside': {
    label: '版本段副句',
    clauses: ['U01-C30', 'U01-C16'],
    note:
      'E 页放「保存产生新版本；草稿不参战」；EA 页放「保存后将成为 v(N+1)」（P12 段落级）',
  },
  'E.version-empty': {
    label: '版本线空态',
    clauses: ['U01-C13', 'U01-C15', 'LACK-10'],
    when: '还没保存过版本时',
  },
  'E.version-card': {
    label: '版本卡',
    clauses: ['U01-C14', 'U01-C07', 'U01-C05', 'U01-C17', 'U10-C08', 'U10-C09'],
    journeys: ['j4s1', 'j4s2', 'j4s4', 'jR1s1'],
    note:
      '四动作：展开全文 / 设为参赛版本 / 基于该版本迭代 / 出战；负检：无「复制为新智能体」',
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
    note: 'B3 逐版本胜负（条款归 EA 页，卡面两页同显）',
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
  'E.iterate-button': {
    label: '基于该版本迭代',
    clauses: ['U01-C03', 'U01-C19', 'U01-C04', 'U10-C08'],
    journeys: ['j4s2', 'j4s3', 'jR1s1', 'jR1s4'],
    note: '回填工作区，不产生版本；草稿与最新版本不一致且会丢内容时先就地确认',
  },
  'E.field-button': {
    label: '出战',
    clauses: ['U01-C14', 'U10-C08'],
    note: '打开选择对手面板（OS）',
  },
  'E.iterate-confirm': {
    label: '覆盖确认行',
    clauses: ['U01-C04', 'U01-C19'],
    journeys: ['j4s3', 'jR1s1', 'jR1s2', 'jR1s3'],
    note:
      'P11：画在被点的那张版本卡内，自动滚进视口并聚焦本体（不聚焦「仍要继续」）',
    when: '工作区有未保存改动时点「基于该版本迭代」',
  },
  'E.iterate-confirm-continue': {
    label: '仍要继续',
    clauses: ['U01-C04'],
    journeys: ['jR1s2', 'jR1s3'],
    when: '覆盖确认行出现时',
  },
  'E.iterate-confirm-cancel': {
    label: '取消覆盖',
    clauses: ['U01-C04'],
    journeys: ['jR1s3'],
    note: '取消后工作区里的字原样还在',
    when: '覆盖确认行出现时',
  },

  // ---------- 新建智能体弹窗（从我的智能体页「再建一个」打开） ----------
  'E.new-agent-dialog': {
    label: '新建智能体弹窗',
    clauses: ['U01-C17', 'U01-C26', 'U01-C23'],
    note: '同侧再建只走这里；首战路径不弹（懒 ensure 直进构建器）',
    when: '我的智能体页点「再建一个」',
  },
  'E.new-agent-close': {
    label: '关闭弹窗',
    when: '新建智能体弹窗内',
  },
  'E.new-agent-side-toggle': {
    label: '执方二选一',
    clauses: ['U01-C17', 'U01-C25'],
    when: '新建智能体弹窗内',
  },
  'E.new-agent-side-option': {
    label: '执方选项',
    clauses: ['U01-C17'],
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
  'E.new-agent-cancel': {
    label: '取消新建',
    when: '新建智能体弹窗内',
  },
  'E.new-agent-submit': {
    label: '创建并进入构建',
    clauses: ['U01-C17', 'U01-C26', 'U02-C01'],
    note: '成功后直进该智能体的构建器（空工作区出现三选一）',
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
  // 第一轮旅程 4 版本线（j4s5 改名发生在我的智能体页，归 MA）
  j4s1: { route: '/agents/:id/build', marker: 'E.version-card' },
  j4s2: { route: '/agents/:id/build', marker: 'E.iterate-button' },
  j4s3: { route: '/agents/:id/build', marker: 'E.iterate-confirm' },
  j4s4: { route: '/agents/:id/build', marker: 'E.set-entry-button' },
  // 第二轮 R1 就地覆盖确认
  jR1s1: { route: '/agents/:id/build', marker: 'E.iterate-button' },
  jR1s2: { route: '/agents/:id/build', marker: 'E.iterate-confirm' },
  jR1s3: { route: '/agents/:id/build', marker: 'E.iterate-confirm' },
  jR1s4: { route: '/agents/:id/build', marker: 'E.iterate-button' },
}
