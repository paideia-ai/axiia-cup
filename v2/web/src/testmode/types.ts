/* 测试模式（test mode）——给产品里每个 UI/UX 部件一个稳定的标记（data-tm），并把它和 spec v4 的条款 / 两轮旅程手册的步骤连起来。
   约定：
   - 标记 id = `<页面代号>.<部件 slug>`，页面代号用 v3.4 的：A 首页 · B 登录 · C 注册 · D 场景选择 · DA 场景介绍 · E 构建器 · EA 智能体视图 · OS 选择对手 · FA 战报 · G 锦标赛 · I 通知 · K 设置 · L 对战历史；
     不在 v3.4 页面表里的：X 首战快速通道（A3 /express）· MA 我的智能体（/my-agents）· ADM 管理面 · NAV 顶栏/底栏/铃铛/进行中的对战条（全局）。
     slug 用 kebab-case 英文，描述部件是什么（save-button / version-list / mcq-deck / verdict-card），不要描述它长什么样。
   - 每个标记在 registry/ 里必有一条 TmEntry；每条 clauses 里的 id 必须存在于 data/spec-index.json；journeys 用旅程步骤 id（j3s5 / jR2s1，见 data/journeys.json）。
   - 组件上用 `{...tm('E.save-button')}`（见 mark.ts），只能用 registry 里已登记的 id（类型会检查）。 */

export type PageCode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'DA'
  | 'E'
  | 'EA'
  | 'OS'
  | 'FA'
  | 'G'
  | 'I'
  | 'K'
  | 'L'
  | 'X'
  | 'MA'
  | 'ADM'
  | 'NAV'

export const PAGE_LABELS: Record<PageCode, string> = {
  A: '首页',
  B: '登录',
  C: '注册',
  D: '场景选择',
  DA: '场景介绍',
  E: '构建器',
  EA: '智能体视图',
  OS: '选择对手',
  FA: '战报',
  G: '锦标赛',
  I: '通知',
  K: '设置',
  L: '对战历史',
  X: '首战快速通道',
  MA: '我的智能体',
  ADM: '管理面',
  NAV: '全局导航',
}

/** 路由 → 页面代号（一个路由可能同时承载两个代号，如 /scenarios/:id = DA + OS 面板） */
export const ROUTE_PAGES: { pattern: RegExp; pages: PageCode[] }[] = [
  { pattern: /^\/$/, pages: ['A'] },
  { pattern: /^\/login$/, pages: ['B'] },
  { pattern: /^\/register$/, pages: ['C'] },
  { pattern: /^\/express$/, pages: ['X'] },
  { pattern: /^\/scenarios$/, pages: ['D'] },
  { pattern: /^\/scenarios\/[^/]+$/, pages: ['DA', 'OS'] },
  { pattern: /^\/my-agents$/, pages: ['MA'] },
  { pattern: /^\/agents\/[^/]+$/, pages: ['EA', 'OS'] },
  { pattern: /^\/agents\/[^/]+\/build$/, pages: ['E'] },
  { pattern: /^\/matches$/, pages: ['L'] },
  { pattern: /^\/matches\/[^/]+$/, pages: ['FA'] },
  { pattern: /^\/tournaments$/, pages: ['G'] },
  { pattern: /^\/tournaments\/[^/]+$/, pages: ['G'] },
  { pattern: /^\/notifications$/, pages: ['I'] },
  { pattern: /^\/settings$/, pages: ['K'] },
  { pattern: /^\/admin/, pages: ['ADM'] },
]

export interface TmEntry {
  /** 人话名字（中文，2–8 字），弹层标题用 */
  label: string
  /** 这个部件对应的 spec v4 条款 id（U##-C##[a-z] / LACK-nn）。按相关度排序，最相关的放前面 */
  clauses?: string[]
  /** 规格锚（spec-change-N / spec-e10 / spec-p11 / spec-a5…），只在没有条款能对上、或条款之外还有直接锚时填 */
  anchors?: string[]
  /** 旅程步骤 id（j3s5 = 第一轮旅程 3 第 5 步；jR2s1 = 第二轮 R2 第 1 步） */
  journeys?: string[]
  /** 一句说明：这个部件为什么对应这些条款 / 有什么已知差异（可空） */
  note?: string
  /** 只在某些状态下出现的部件（空态 / 错误态 / 弹窗），弹层里提示怎么让它出现 */
  when?: string
}

/** 旅程步骤在产品里的落点：发生在哪个路由（带参数用通配 :id），聚光哪个标记 */
export interface StepHint {
  route?: string
  marker?: string
}

export type TmRegistry = Record<string, TmEntry>
export type StepHints = Record<string, StepHint>
