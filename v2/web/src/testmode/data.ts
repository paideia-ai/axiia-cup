/* 测试模式的数据面：spec v4 条款索引 + 历史两轮旅程 + 当前固定版本交接旅程，加几个查询小工具。
   只在 overlay 分块里被引用（index.tsx 不 import 这里），关掉测试模式时零成本。 */
import {
  REVIEWED_JOURNEYS,
  REVIEWED_MANUAL_PATH,
} from './data/reviewed-journeys'
import journeysJson from './data/journeys.json'
import specJson from './data/spec-index.json'
import { TM } from './registry/index'
import { PAGE_LABELS, type PageCode, ROUTE_PAGES } from './types'

export type Impl =
  | 'match'
  | 'gap_open'
  | 'gap_known'
  | 'pending_ruling'
  | 'lack'
  | 'fixed_unverified'
  | 'untestable'

export interface Clause {
  id: string
  page: string
  chapter: string
  unit: string
  q: string
  s: string
  anchors: string[]
  impl: Impl
  owner: string
}

export type JourneyRound = 'r1' | 'r2' | 'handoff'
export type ReviewedChapter = 'A3' | 'A4' | 'A5' | 'A6' | 'B3'
export type CaptureKind = 'agentId' | 'matchId'

/** 一套 fixture 里的非敏感引用。账号密码由项目同学私下交付，不进入 Test Mode。 */
export interface FixtureField {
  name: string
  label: string
  help: string
  kind?: 'runtime'
  extract?: CaptureKind
}

/** 同一旅程可能需要多种互斥账号状态；每个 profile 对应一个登录角色。 */
export interface FixtureProfile {
  id: string
  label: string
  /** 可公开的角色别名；不是邮箱或登录凭据。 */
  accountAlias?: string
  kind?: 'known-gap'
  readiness?: 'ready' | 'refresh-required' | 'known-gap'
  description: string
  fields: FixtureField[]
}

export interface StepTestLink {
  label: string
  url: string
}

export interface StepCapture {
  variable: string
  label: string
  placeholder: string
  hint: string
  extract?: CaptureKind
}

export interface KnownGap {
  title: string
  detail: string
  instruction: string
}

export interface Step {
  id: string
  round: JourneyRound
  journey: string
  index: number
  action: string
  expected: string
  specLine: string
  anchors: string[]
  clauseIds: string[]
  primary: string[]
  known: string | null
  humanOnly: string | null
  manualUrl: string
  route: string | null
  marker: string | null
  /** 可交接旅程固定的现行条款版本；历史两轮步骤没有这个字段。 */
  versionPins?: Record<string, string>
  /** 手册里的完整起始 URL 模板，保留 fixture 占位符。 */
  testUrl?: string
  /** 操作文字提到的其他页面也必须能直接打开，不能只留下不可点的路径。 */
  links?: StepTestLink[]
  /** 本步骤执行后才会产生的变量；Test Mode 可从当前 /matches/:id 捕获。 */
  captures?: StepCapture[]
  /** 本步骤实际使用的登录角色 / 数据状态；引用 Journey.fixtureProfiles.id。 */
  fixtureRefs?: string[]
  /** 当前产品没有可执行路径时明确呈现，不要求测试者猜 ID 或伪造 URL。 */
  knownGap?: KnownGap
  /** 本步骤在详细手册里要求提交的截图文件名。 */
  screenshotEvidence?: string[]
}

export interface Journey {
  id: string
  round: JourneyRound
  n: string
  title: string
  manual: string
  steps: Step[]
  chapter?: ReviewedChapter
  manualAnchor?: string
  prerequisites?: string[]
  evidenceRequirements?: string[]
  completion?: string
  fixtureProfiles?: FixtureProfile[]
  /** 可公开的稳定 ID 默认值；密码、cookie、token 永远不能放这里。 */
  fixtureDefaults?: Record<string, string>
}

export const DASHBOARD = 'https://deploy-v2-ebon-beta.vercel.app'
export { REVIEWED_MANUAL_PATH }
export { B3_A5_MANUAL_PATH } from './data/b3-a5-journeys'
export const B3_A5_MANUAL_URL = `${DASHBOARD}${REVIEWED_MANUAL_PATH}`
export const REVIEWED_MANUAL_URL = `${DASHBOARD}${REVIEWED_MANUAL_PATH}`

const rawClauses = (specJson as { clauses: Record<string, Omit<Clause, 'id'>> })
  .clauses
export const CLAUSES: Record<string, Clause> = Object.fromEntries(
  Object.entries(rawClauses).map(([id, c]) => [id, { id, ...c }]),
)
export const CLAUSE_IDS = Object.keys(CLAUSES)

const LEGACY_JOURNEYS = (journeysJson as { journeys: Journey[] }).journeys
export const JOURNEYS: Journey[] = [...LEGACY_JOURNEYS, ...REVIEWED_JOURNEYS]
export const STEPS: Record<string, Step> = Object.fromEntries(
  JOURNEYS.flatMap((j) => j.steps.map((s) => [s.id, s])),
)
export function journeyOf(step: Step): Journey {
  return JOURNEYS.find((j) => j.round === step.round && j.n === step.journey) ??
    JOURNEYS[0]
}

export const IMPL_LABEL: Record<Impl, string> = {
  match: '已实现',
  gap_open: '缺口',
  gap_known: '已知缺口',
  pending_ruling: '待裁决',
  lack: '规格缺条',
  fixed_unverified: '已修未验',
  untestable: '不可测',
}

export const ROUND_LABEL: Record<JourneyRound, string> = {
  r1: '历史归档 · 第一轮（非当前验收）',
  r2: '历史归档 · 第二轮（非当前验收）',
  handoff: 'Spec V4 · 固定版本可交接',
}

/** 条款 page 字段为空或不是页面代号时，按章节把它归到最可能出现的页面（清单里才列得出来） */
const CHAPTER_PAGES: Record<string, PageCode[]> = {
  A3: ['X', 'E', 'FA'],
  A6: ['OS', 'DA', 'D'],
  B8: ['NAV'],
  C2: ['ADM', 'NAV'],
  C3: ['ADM', 'NAV'],
  C4: ['ADM', 'NAV'],
}
const WORD_PAGES: Record<string, PageCode[]> = {
  全局: ['NAV'],
  运营: ['ADM'],
  配置: ['ADM'],
  场景内容: ['FA'],
  规格: ['NAV'],
}

/** 条款 → 页面代号集合（'B+C' / 'D/DA' / '全局' 这类写法都拆开；page 为空按章节回落） */
export function pagesOfClause(c: Pick<Clause, 'page' | 'chapter'>): PageCode[] {
  const codes = c.page.split(/[+/]/).map((p) => p.trim()).filter((
    p,
  ): p is PageCode => p in PAGE_LABELS)
  if (codes.length) return codes
  if (c.page in WORD_PAGES) return WORD_PAGES[c.page]
  return CHAPTER_PAGES[c.chapter] ?? ['NAV']
}

/** 当前路径对应的页面代号（无匹配 = 空数组；受保护区之外的路径也在表里） */
export function pagesOfPath(pathname: string): PageCode[] {
  return ROUTE_PAGES.find((r) => r.pattern.test(pathname))?.pages ?? []
}

/** 清单要列的页面：登录态的每一页都带上 NAV（顶栏 / 底栏 / 铃铛 / 页脚 + 「全局」条款） */
export function panelPages(pathname: string): PageCode[] {
  const pages = pagesOfPath(pathname)
  if (!pages.length) return pages
  if (/^\/(login|register)?$/.test(pathname)) return pages
  return pages.includes('NAV') ? pages : [...pages, 'NAV']
}

/** 步骤提示的路由（/agents/:id/build）是否匹配当前路径 */
export function routeMatches(route: string, pathname: string): boolean {
  const re = new RegExp(
    '^' + route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(
      /:[A-Za-z]+/g,
      '[^/]+',
    ) + '/?$',
  )
  return re.test(pathname)
}
export function routeHasParams(route: string): boolean {
  return /:[A-Za-z]+/.test(route)
}
export function pageNameOfRoute(route: string): string {
  const pages = pagesOfPath(route.replace(/:[A-Za-z]+/g, '1'))
  return pages.map((p) => PAGE_LABELS[p]).join(' / ') || route
}

export function clauseUrl(id: string): string {
  return `${DASHBOARD}/spec-v4#${id}`
}
export function anchorUrl(anchor: string): string {
  return `${DASHBOARD}/v3-4-spec#${anchor}`
}
export function manualUrl(step: Step): string {
  return `${DASHBOARD}${step.manualUrl}`
}
export function journeyUrl(j: Journey): string {
  return `${DASHBOARD}${j.manual}#${j.manualAnchor ?? j.steps[0]?.id ?? ''}`
}

/** 条款 → 挂了它的标记（全站） */
export const MAPPED_BY: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>()
  for (const [id, e] of Object.entries(TM)) {
    for (const c of e.clauses ?? []) m.set(c, [...(m.get(c) ?? []), id])
  }
  return m
})()

/** 这些页面的条款：索引里归到这页的 ∪ 这页的标记挂上的（U06 门槛规则借 OS 面板出现、LACK-01 借战报出现…） */
export function clausesForPages(pages: PageCode[]): Clause[] {
  const ids = new Set<string>()
  for (const c of Object.values(CLAUSES)) {
    if (pagesOfClause(c).some((p) => pages.includes(p))) ids.add(c.id)
  }
  for (const [id, e] of Object.entries(TM)) {
    const prefix = id.slice(0, id.indexOf('.')) as PageCode
    if (!pages.includes(prefix)) continue
    for (const c of e.clauses ?? []) if (c in CLAUSES) ids.add(c)
  }
  return [...ids].map((id) => CLAUSES[id]).sort((a, b) =>
    a.id.localeCompare(b.id, 'en', { numeric: true })
  )
}

/** 哪些标记的 journeys 里含这一步（导测里列成「相关部件」） */
export function markersOfStep(stepId: string): string[] {
  return Object.entries(TM).filter(([, e]) => e.journeys?.includes(stepId))
    .map(([id]) => id)
}
