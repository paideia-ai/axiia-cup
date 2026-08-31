/* EA 智能体视图（/agents/:id，B3）+ MA 我的智能体（/my-agents，#73/#64）+ X 首战快速通道（/express，A3）。
   EA 的版本卡是 E 页同一套 VersionList（E.version-card…，#88），出战面板是 OS.*，
   「再建一个」弹窗是 E.new-agent-*——这里只登记三页自己的部件。
   条款以 spec-index 里 page=EA 的 16 行 + unit=U03 的 13 行 + U01 里落在我的智能体页的 P 系列为准。 */
import type { StepHints, TmRegistry } from '../types'

export const TM_AGENTS: TmRegistry = {
  // ======================= EA 智能体视图 · 公开视图（别人的智能体，#35） =======================
  'EA.public-view': {
    label: '公开视图',
    clauses: ['U10-C12', 'U10-C13'],
    anchors: ['spec-change-35', 'spec-change-20'],
    journeys: ['j8s1'],
    note:
      '打开别人的智能体：主人路径 403 后退到 /public 投影——只有身份 + 逐版本战绩，没有提示词也没有对比',
    when: '打开不属于自己的 /agents/:id',
  },
  'EA.public-back-link': {
    label: '返回场景',
    when: '公开视图',
  },
  'EA.public-title': {
    label: '公开视图标题',
    clauses: ['U10-C12', 'U10-C01'],
    anchors: ['spec-change-63'],
    journeys: ['j8s1'],
    note:
      '展示名口径与主人视图一致：侧角色名「自起名」，无名回落「侧角色名 #id」',
    when: '公开视图',
  },
  'EA.public-owner-line': {
    label: '主人与场景副行',
    clauses: ['U10-C12'],
    journeys: ['j8s1'],
    note: '「属于谁 · 哪个场景」；执哪一方由标题里的侧角色名带出',
    when: '公开视图',
  },
  'EA.public-record-card': {
    label: '逐版本战绩卡',
    clauses: ['U10-C12', 'U10-C05', 'U01-C32'],
    anchors: ['spec-change-35', 'spec-p15'],
    journeys: ['j8s1'],
    note: '#35 战绩有意公开（按侧）',
    when: '公开视图',
  },
  'EA.public-record-empty': {
    label: '公开战绩空态',
    clauses: ['U10-C12', 'LACK-10'],
    when: '公开视图且对方还没保存过版本',
  },
  'EA.public-version-list': {
    label: '公开版本列表',
    clauses: ['U10-C12', 'U10-C05'],
    journeys: ['j8s1'],
    when: '公开视图且对方有版本',
  },
  'EA.public-version-item': {
    label: '公开版本行',
    clauses: ['U10-C05', 'U10-C12', 'U01-C32'],
    journeys: ['j8s1'],
    note: '只有 vN、★ 与战绩——没有提示词、没有动作按钮',
    when: '公开视图且对方有版本',
  },
  'EA.public-entry-badge': {
    label: '公开视图参赛标记',
    clauses: ['U10-C06', 'U10-C12'],
    anchors: ['spec-change-33'],
    when: '公开视图，对方标了 ★ 的那一版',
  },
  'EA.public-record': {
    label: '公开版本战绩',
    clauses: ['U10-C05', 'U01-C32', 'U10-C12'],
    anchors: ['spec-p15', 'spec-change-35'],
    journeys: ['j8s1'],
    note: '0 战「还没有出战过」；有战「N 战 M 胜」（按已计分对局）',
    when: '公开视图且对方有版本',
  },
  'EA.public-owner-only-hint': {
    label: '仅主人可见提示',
    clauses: ['U10-C13', 'U10-C12', 'U10-C04'],
    anchors: ['spec-change-20'],
    journeys: ['j8s2'],
    note: '「提示词与版本对比只有主人可见。」——#20 提示词与 diff 永不公开',
    when: '公开视图',
  },

  // ======================= EA 智能体视图 · 主人视图 =======================
  'EA.back-link': {
    label: '返回我的智能体',
    clauses: ['U10-C11'],
    note: 'EA ⇄ 我的智能体行「查看智能体」互通',
  },
  'EA.error': {
    label: '页面错误',
    clauses: ['LACK-10'],
    note:
      '老服务器无 /public 时打开别人的智能体只会看到「不是你的智能体」（U10-C12 旧形态）',
    when: '草稿/版本接口失败，或老服务器上打开别人的智能体',
  },
  'EA.loading': {
    label: '加载中',
    clauses: ['LACK-10'],
    when: '数据未回时',
  },
  'EA.page-header': {
    label: '页头',
    clauses: ['U10-C01', 'U10-C03'],
    anchors: ['spec-b3'],
    journeys: ['j8s3'],
    note: '标题 + 副行在左，「编辑」「出战」并排在右',
  },
  'EA.page-title': {
    label: '策略展示名标题',
    clauses: ['U10-C01', 'U01-C20', 'U01-C22', 'U01-C20b'],
    anchors: ['spec-p1', 'spec-change-63'],
    journeys: ['j8s3'],
    note:
      '「商鞅「贪婪」」，无名回落「商鞅 #id」；改名后这里要跟着变（改名入口只在我的智能体页，U01-C22b）',
  },
  'EA.subtitle': {
    label: '页头副行',
    clauses: ['U10-C01', 'U10-C07'],
    anchors: ['spec-p1'],
    note:
      '「场景 · 甲方/乙方 · N 个版本 · #id」；正文不得出现「策略」「版本线」内部词',
  },
  'EA.agent-id': {
    label: '内部 id 小字',
    clauses: ['U10-C07', 'U01-C20'],
    anchors: ['spec-change-25', 'spec-p1'],
    note: 'P1：id 降为 mono 小字，#25 仍要 id 可见',
  },
  'EA.edit-button': {
    label: '编辑按钮',
    clauses: ['U10-C03', 'U01-C14'],
    anchors: ['spec-change-75', 'spec-change-81'],
    journeys: ['j8s3'],
    note:
      '在「出战」旁；点击进入 /agents/:id/build 工作区，内容以服务端常驻草稿为准',
  },
  'EA.field-button': {
    label: '出战按钮',
    clauses: ['U05-C01', 'U10-C03'],
    journeys: ['j5s1'],
    note:
      '呼出选择对手面板（OS.*），agent/场景/执侧随呼出处预选；0 版本时禁用并提示「先保存一个版本才能出战」',
  },
  'EA.action-error': {
    label: '改标失败提示',
    clauses: ['LACK-10'],
    when: '版本卡「设为参赛版本」请求失败时',
  },
  'EA.express-error': {
    label: '首战派发失败提示',
    clauses: ['U03-C05', 'LACK-10'],
    anchors: ['spec-a3', 'spec-change-9'],
    note:
      'A3 降级路径：express 保存后自动派发失败，构建器落回这里并带错误文案——版本已保存，可用「出战」手动发起',
    when: '首战快速通道保存后自动派发失败',
  },
  'EA.entry-notice': {
    label: '★未移动提示',
    clauses: ['U06-C11', 'U01-C33', 'U10-C06'],
    anchors: ['spec-e10', 'spec-change-84', 'spec-change-33'],
    note:
      'E10：保存不移动 ★——「★参赛版本仍是 vN——新版本不会自动参赛，可在下方版本卡改标」；只消费一次导航 state，刷新不复现',
    when: '从构建器保存回来，且新版本不是参赛版本时',
  },
  'EA.sibling-pills': {
    label: '同侧策略胶囊排',
    clauses: ['U10-C10', 'U01-C28'],
    anchors: ['spec-p9'],
    journeys: ['j8s3'],
    note: '同侧横向切换；同侧只有 1 个策略时整排不出现',
    when: '同一场景同一侧有 ≥2 个智能体',
  },
  'EA.sibling-pill': {
    label: '同侧策略胶囊',
    clauses: ['U10-C10', 'U01-C28', 'U10-C01'],
    anchors: ['spec-p9', 'spec-p1'],
    journeys: ['j8s3'],
    note:
      '当前项高亮（aria-current=page）；文案用策略展示名；点击切到 /agents/:id',
    when: '同侧有 ≥2 个智能体',
  },
  'EA.version-empty': {
    label: '版本线空态',
    clauses: ['U01-C13', 'U01-C15', 'LACK-10'],
    note:
      'EA 自己的空态文案「还没有保存过版本 / 去构建你的第一版策略」（VersionList 的默认空态归 E.version-empty）',
    when: '还没保存过版本时',
  },
  'EA.version-empty-build-button': {
    label: '空态进入构建器',
    clauses: ['U10-C03'],
    when: '还没保存过版本时',
  },
  'EA.diff-section': {
    label: '版本对比区',
    clauses: ['U10-C04', 'U10-C13', 'U01-C14'],
    anchors: ['spec-change-20'],
    journeys: ['j8s3'],
    note: 'EA 独有（E 页没有）；所有者受限项——公开视图里整段不存在',
  },
  'EA.diff-hint': {
    label: '对比引导',
    clauses: ['U10-C04'],
    anchors: ['spec-change-54'],
    note: '#54 引导式空态：「再保存一个版本即可逐字对比」，不留空白',
    when: '恰好只有 1 个版本时',
  },
  'EA.diff-base-select': {
    label: '基准版本下拉',
    clauses: ['U10-C04', 'U01-C20'],
    note: '默认基准=次新版；选项口径「vN ★ · 模型」',
    when: '≥2 个版本时',
  },
  'EA.diff-head-select': {
    label: '对比版本下拉',
    clauses: ['U10-C04'],
    note: '默认对比=最新版；基准与对比相同时「对比」禁用',
    when: '≥2 个版本时',
  },
  'EA.diff-button': {
    label: '对比按钮',
    clauses: ['U10-C04'],
    when: '≥2 个版本时',
  },
  'EA.diff-error': {
    label: '对比失败提示',
    clauses: ['LACK-10'],
    when: 'diff 请求失败时',
  },
  'EA.diff-result': {
    label: '双栏对照结果',
    clauses: ['U10-C04', 'U10-C13'],
    anchors: ['spec-change-20'],
    note: '基准 / 对比两栏全文，只有主人能看到',
    when: '点过「对比」后',
  },
  'EA.diff-column': {
    label: '对照栏',
    clauses: ['U10-C04'],
    when: '点过「对比」后',
  },
  'EA.diff-column-title': {
    label: '对照栏标题',
    clauses: ['U10-C04', 'U10-C07'],
    note: '「基准 vN · 模型」/「对比 vN · 模型」',
    when: '点过「对比」后',
  },
  'EA.diff-prompt': {
    label: '对照栏提示词全文',
    clauses: ['U10-C04', 'U10-C13'],
    anchors: ['spec-change-20'],
    when: '点过「对比」后',
  },

  // ======================= MA 我的智能体 =======================
  'MA.page-header': {
    label: '页头',
    anchors: ['spec-change-73'],
  },
  'MA.page-title': {
    label: '页面标题',
    anchors: ['spec-change-73'],
    note: '顶栏「我的智能体」入口落到这里',
  },
  'MA.page-intro': {
    label: '页面一句话说明',
    clauses: ['U06-C14', 'U11-C05'],
    anchors: ['spec-change-58'],
    note: '「按场景分组；每个智能体执一侧，参赛需两侧各标一个参赛版本」',
  },
  'MA.action-error': {
    label: '进入失败提示',
    clauses: ['LACK-10'],
    when: '懒 ensure（创建/进入）请求失败时',
  },
  'MA.loading': {
    label: '加载中',
    clauses: ['LACK-10'],
    when: '数据未回时',
  },
  'MA.error': {
    label: '页面错误',
    clauses: ['LACK-10'],
    when: '场景目录接口失败时（清单接口失败只降级不报错）',
  },
  'MA.scenario-list': {
    label: '场景分组列表',
    anchors: ['spec-change-73'],
    note: '按场景分组；每组一张卡',
  },
  'MA.no-scenarios': {
    label: '暂无场景',
    when: '场景目录为空时',
  },
  'MA.scenario-group': {
    label: '场景分组卡',
    clauses: ['U10-C02', 'U06-C13'],
    anchors: ['spec-change-73', 'spec-change-64'],
    note: '数据化分组（/v1/my/agents）：双侧徽章 + 参赛资格行 + 逐侧智能体行',
    when: '/v1/my/agents 可用时（否则降级为骨架卡）',
  },
  'MA.group-header': {
    label: '分组卡头',
    clauses: ['U10-C02'],
    anchors: ['spec-change-64'],
  },
  'MA.scenario-link': {
    label: '场景标题链接',
    note: '回到该场景介绍页（DA）',
  },
  'MA.scenario-subject': {
    label: '场景一句话主题',
  },
  'MA.side-badge': {
    label: '双侧完成度徽章',
    clauses: ['U10-C02', 'U01-C33', 'U06-C13'],
    anchors: ['spec-change-64', 'spec-change-33'],
    note:
      '三态：「商鞅 ✓」（有 agent 且已标 ★）/「未标参赛」/「未建」；跨该侧全部智能体聚合。#64 点名的两处只落了这一处（EA 页没有）',
  },
  'MA.entry-ready': {
    label: '参赛资格行',
    clauses: ['U06-C14', 'U11-C05', 'U10-C02'],
    anchors: ['spec-change-58', 'spec-change-64'],
    note:
      'entryReady 由服务端判定；未就绪时点名「还差 商鞅（未创建）/ 甘龙（未标参赛版本）」',
  },
  'MA.side-section': {
    label: '一侧的智能体段',
    clauses: ['U01-C21'],
    anchors: ['spec-p1a'],
    note: '该侧全部智能体按最近编辑倒序，下接「再建一个」',
    when: '该侧已有 ≥1 个智能体',
  },
  'MA.agent-row': {
    label: '智能体行',
    clauses: ['U10-C11', 'U01-C21', 'U10-C02'],
    anchors: ['spec-change-63'],
    note: '#56 每侧可多个，逐个成行（data-testid=agent-row）',
  },
  'MA.agent-name': {
    label: '智能体展示名',
    clauses: ['U10-C01', 'U01-C22'],
    anchors: ['spec-change-63', 'spec-p1'],
    journeys: ['j4s5'],
    note:
      '#63：有自起名=「侧角色名「自起名」」，没有=「侧角色名 #id」；改名后即时变',
  },
  'MA.agent-id': {
    label: '内部 id 小字',
    clauses: ['U01-C20'],
    anchors: ['spec-change-25', 'spec-p1'],
    when: '没起名时（有名则不显示 id）',
  },
  'MA.agent-meta': {
    label: '版本参赛摘要',
    clauses: ['U06-C13', 'U01-C21', 'U01-C33'],
    anchors: ['spec-change-33', 'spec-p1a'],
    note: '「N 个版本 · 已标 ★参赛版本/未标参赛版本 · 最近编辑 · 侧标签」',
  },
  'MA.agent-edited': {
    label: '最近编辑时间',
    clauses: ['U01-C21'],
    anchors: ['spec-p1a'],
    note: 'lastEditedAt＝保存与草稿暂存取较晚者；行序按它倒序',
    when: '有过保存或暂存时',
  },
  'MA.agent-actions': {
    label: '行动作组',
    note: '查看智能体 / 进入构建 / 重命名 / 删除（仅空壳）',
  },
  'MA.view-button': {
    label: '查看智能体',
    clauses: ['U10-C11'],
    note: '→ /agents/:id（EA）',
  },
  'MA.build-button': {
    label: '进入构建',
    clauses: ['U01-C01', 'U01-C16'],
    journeys: ['jR1s1'],
    note: '→ /agents/:id/build 工作区；已有 agentID 直接导航，不再 ensure',
  },
  'MA.rename-button': {
    label: '重命名按钮',
    clauses: ['U01-C22', 'U01-C22b', 'U01-C23'],
    anchors: ['spec-p2', 'spec-p3'],
    journeys: ['j4s5'],
    note:
      'P2 就地改名不弹窗；P3 首个（ensure 建的）策略事后补名只能在这里（EA 无改名入口，C22b 缺口）',
  },
  'MA.rename-form': {
    label: '改名表单',
    clauses: ['U01-C22'],
    anchors: ['spec-p2'],
    journeys: ['j4s5'],
    when: '点「重命名」后就地出现',
  },
  'MA.rename-input': {
    label: '改名输入框',
    clauses: ['U01-C22'],
    anchors: ['spec-p2'],
    journeys: ['j4s5'],
    note:
      '1–30 字，留空则不起名（回落「商鞅 #id」）；Enter 保存 / Esc 取消——中文输入法组字中按回车是重点观察项',
    when: '点「重命名」后',
  },
  'MA.rename-save-button': {
    label: '改名保存',
    clauses: ['U01-C22'],
    anchors: ['spec-p2'],
    journeys: ['j4s5'],
    when: '点「重命名」后',
  },
  'MA.rename-cancel-button': {
    label: '改名取消',
    clauses: ['U01-C22'],
    when: '点「重命名」后',
  },
  'MA.delete-button': {
    label: '删除按钮',
    clauses: ['U01-C27'],
    anchors: ['spec-p8b'],
    note: 'P8b：只有 0 版本的空壳才有「删除」；有版本的永不可删',
    when: '该智能体一版都没存时',
  },
  'MA.delete-confirm-button': {
    label: '确认删除',
    clauses: ['U01-C27'],
    anchors: ['spec-p8b'],
    note: '两步删除不弹窗（E9 界面自解释）',
    when: '点过「删除」后',
  },
  'MA.row-error': {
    label: '改名删除失败',
    clauses: ['LACK-10'],
    when: '改名或删除请求失败时',
  },
  'MA.new-agent-button': {
    label: '再建一个',
    clauses: ['U01-C17', 'U01-C26', 'U06-C08', 'U02-C19', 'U01-C09'],
    anchors: ['spec-change-59', 'spec-change-79', 'spec-p8a', 'spec-p6a'],
    note:
      '同侧再建唯一入口（#90 废止「复制为新智能体」后）；开 E.new-agent-dialog，#59/#79 引导门在弹窗里拦：需先有 ≥1 个对侧策略且版本数 ≥1',
    when: '该侧已有 ≥1 个智能体',
  },
  'MA.empty-side': {
    label: '缺侧空态行',
    clauses: ['U10-C02'],
    anchors: ['spec-change-64'],
    note: '「还没有商鞅智能体」+ 创建 CTA',
    when: '该侧还没有智能体',
  },
  'MA.create-side-button': {
    label: '创建该侧智能体',
    clauses: ['U10-C02', 'U01-C23', 'U05-C04', 'U02-C01'],
    anchors: ['spec-change-64', 'spec-p3'],
    note:
      '文案：对侧已建时「去创建对侧（甘龙）」，否则「创建甘龙智能体」；懒 ensure 直进构建器，不弹命名弹窗',
    when: '该侧还没有智能体',
  },
  'MA.fallback-group': {
    label: '降级分组卡',
    anchors: ['spec-change-54'],
    note: 'P1 降级：/v1/my/agents 不可用时按目录骨架渲染，绝不白屏',
    when: '/v1/my/agents 接口失败或老服务器',
  },
  'MA.fallback-row': {
    label: '降级侧行',
    when: '降级骨架时',
  },
  'MA.fallback-view-button': {
    label: '降级·查看',
    clauses: ['U10-C11'],
    note: '懒 ensure 后 → /agents/:id',
    when: '降级骨架时',
  },
  'MA.fallback-build-button': {
    label: '降级·进入构建',
    note: '懒 ensure 后 → /agents/:id/build',
    when: '降级骨架时',
  },
  'MA.fallback-hint': {
    label: '降级空态提示',
    anchors: ['spec-change-54'],
    note:
      '#54：数据化槽位不摆假数字——「完成度与参赛资格徽章将在数据接入后点亮」',
    when: '降级骨架时',
  },

  // ======================= X 首战快速通道（A3） =======================
  'X.page': {
    label: '首战快速通道页',
    clauses: ['U03-C02', 'U03-C01', 'U03-C10'],
    anchors: ['spec-a3', 'spec-change-11'],
    journeys: ['j1s3'],
    note:
      '简化版 DA：徽章 + 标题 + 钩子 + 只有我方角色卡 + 一句规则 + 去构建 + 逃生链接；打过首战再访会被重定向到 /scenarios',
  },
  'X.page-header': {
    label: '页头',
    clauses: ['U03-C02'],
    journeys: ['j1s3'],
  },
  'X.badge': {
    label: '首战快速通道徽章',
    clauses: ['U03-C01', 'U08-C04', 'U03-C02'],
    anchors: ['spec-a3', 'spec-b2'],
    journeys: ['j1s2', 'j1s3'],
    note:
      '注册成功自动登录后落到这里——徽章是「进入了首战快速通道」的第一眼证据',
  },
  'X.page-title': {
    label: '场景标题',
    clauses: ['U03-C02', 'U03-C12'],
    journeys: ['j1s3'],
    note: '场景由新手预设三元组决定（缺席回落商鞅场景）',
  },
  'X.hook': {
    label: '场景钩子',
    clauses: ['U03-C02'],
    journeys: ['j1s3'],
  },
  'X.role-card': {
    label: '我方角色卡',
    clauses: ['U03-C02', 'U03-C12', 'U03-C03'],
    anchors: ['spec-change-11', 'spec-change-57'],
    journeys: ['j1s3'],
    note:
      'S4 简化版只保留己方这一张；执方由预设决定（#57 首战＝单侧 agent，执哪方可配置），无切侧控件',
  },
  'X.role-name': {
    label: '我方角色名',
    clauses: ['U03-C02', 'U03-C12'],
    journeys: ['j1s3'],
  },
  'X.win-condition': {
    label: '一句话目标',
    clauses: ['U03-C02'],
    journeys: ['j1s3'],
    note: '来自场景模块 education.winConditions[我方]',
    when: '场景有教育模块时',
  },
  'X.rule-line': {
    label: '一句规则',
    clauses: ['U03-C02'],
    anchors: ['spec-change-11'],
    journeys: ['j1s3'],
    note: '不展开四层教育，一行讲完「N 轮后裁判判定——写好提示词，AI 替你上场」',
  },
  'X.enter-error': {
    label: '创建失败提示',
    clauses: ['LACK-10'],
    when: '「去构建」的懒 ensure 失败时',
  },
  'X.actions': {
    label: '动作行',
    clauses: ['U03-C02'],
  },
  'X.build-button': {
    label: '去构建按钮',
    clauses: ['U03-C03', 'U03-C02', 'U03-C12'],
    anchors: ['spec-a3', 'spec-change-57'],
    journeys: ['j1s3', 'j1s4'],
    note:
      '懒 ensure 单侧 agent → /agents/:id/build?express=1（构建器里保存即自动开战，U03-C05）',
  },
  'X.escape-link': {
    label: '逃生链接',
    clauses: ['U03-C02'],
    note: '「先逛逛全部场景」→ /scenarios',
  },
  'X.loading': {
    label: '加载中',
    clauses: ['LACK-10'],
    when: '配置/场景未回时',
  },
  'X.error-card': {
    label: '首战场景不可用',
    note:
      '场景接口失败：「首战场景暂不可用 / 可以先从场景列表任选一个开始」（config 失败不挡首战，只按默认三元组渲染）',
    when: '场景接口失败时',
  },
  'X.error-browse-button': {
    label: '浏览全部场景',
    when: '首战场景不可用时',
  },
}

export const STEPS_AGENTS: StepHints = {
  // 第一轮旅程 1（第 4 步保存在 E，第 5–6 步在 FA，归各自组）
  j1s3: { route: '/express', marker: 'X.role-card' },
  // 第一轮旅程 4 第 5 步：改名只能在我的智能体页
  j4s5: { route: '/my-agents', marker: 'MA.rename-button' },
  // 第一轮旅程 5 第 1 步：从 EA 页头「出战」呼出面板（面板本体归 OS）
  j5s1: { route: '/agents/:id', marker: 'EA.field-button' },
  // 第一轮旅程 8 别人的智能体主页
  j8s1: { route: '/agents/:id', marker: 'EA.public-record-card' },
  j8s2: { route: '/agents/:id', marker: 'EA.public-owner-only-hint' },
  j8s3: { route: '/agents/:id', marker: 'EA.sibling-pills' },
}
