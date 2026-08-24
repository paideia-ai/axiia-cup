import type { Side, TurnDTO } from '../api/types'
import { scenarioModule } from '../scenarios'
import type { ScriptEvent } from './event'
import {
  eventArray,
  eventNumber,
  eventRecord,
  eventType,
  scriptEvent,
} from './event'

const PROGRAMMATIC_SCORING_DETAIL_PREFIX = '程序化计分明细：'

export function formatScoringReasoning(reasoning: string | null | undefined) {
  if (!reasoning) {
    return ''
  }

  return reasoning
    .replace(
      new RegExp(`^\\s*${PROGRAMMATIC_SCORING_DETAIL_PREFIX}\\s*\\n?`),
      '',
    )
    .trimStart()
}

// The structured half of the 计分推导 section (#69): a scenario that emits a
// `score` event carries true targets, guesses and totals; the request rulings
// ride on its `verdict` event. A scenario that emits neither returns null and the
// page falls back to the prose ledger or a guided empty line.
export interface ScoreBreakdown {
  trueRequests: Record<string, string> | null
  guesses: Record<string, string> | null
  rulings: Record<string, string> | null
  scoreA: number | null
  scoreB: number | null
  // F2 · #69 五步区块的两问：achieved＝本侧真目标是否获准（拿真请求 id 查
  // rulings），identified＝本侧真目标是否被对方猜中。键随 trueRequests/guesses
  // 的侧别键走；证据不足（无 rulings / 侧别键不成对）时为 null，由解析出的
  // 得分账条目回补。
  achieved: Record<string, boolean> | null
  identified: Record<string, boolean> | null
}

// round4 评审 #9：两侧对猜的「猜中/被识破」派生只此一处——本侧真目标对上
// 另一侧的猜测，只在恰好两键对猜时有定义（商鞅/本能寺形态），其余形态两表
// 皆空。identified[side]＝该侧真目标被对面猜中（被识破）；guessedRight[side]
// ＝该侧的猜测命中对面真目标（猜中）。
export interface CrossGuessOutcome {
  identified: Record<string, boolean>
  guessedRight: Record<string, boolean>
}

export function crossIdentified(
  trueRequests: Record<string, string> | null,
  guesses: Record<string, string> | null,
): CrossGuessOutcome {
  const identified: Record<string, boolean> = {}
  const guessedRight: Record<string, boolean> = {}
  const sides = [
    ...new Set([
      ...Object.keys(trueRequests ?? {}),
      ...Object.keys(guesses ?? {}),
    ]),
  ]
  if (trueRequests && guesses && sides.length === 2) {
    for (const side of sides) {
      const other = sides.find((key) => key !== side)!
      const truth = trueRequests[side]
      const guess = guesses[other]
      if (truth == null || guess == null) continue
      identified[side] = guess === truth
      guessedRight[other] = guess === truth
    }
  }
  return { identified, guessedRight }
}

export function deriveScoreBreakdown(turns: TurnDTO[]): ScoreBreakdown | null {
  let score: ReturnType<typeof scriptEvent> = null
  let rulings: Record<string, string> | null = null
  for (const turn of turns) {
    if (turn.kind !== 'event') continue
    const event = scriptEvent(turn)
    if (event == null) continue
    const type = eventType(event)
    if (type === 'score') score = event
    else if (type === 'verdict') {
      rulings = eventRecord(event, 'requests') ?? rulings
    }
  }
  if (score == null && rulings == null) return null

  const trueRequests = score ? eventRecord(score, 'trueRequests') : null
  const guesses = score ? eventRecord(score, 'guesses') : null

  let achieved: Record<string, boolean> | null = null
  if (trueRequests && rulings) {
    for (const [side, id] of Object.entries(trueRequests)) {
      const ruling = rulings[id]
      if (ruling == null) continue
      ;(achieved ??= {})[side] = ruling === '同意'
    }
  }

  // 「被识破」口径统一走 crossIdentified（round4 评审 #9）——时间线
  // ScoreRow 的就地标注与这里同一出处。
  const cross = crossIdentified(trueRequests, guesses)
  const identified = Object.keys(cross.identified).length > 0
    ? cross.identified
    : null

  return {
    trueRequests,
    guesses,
    rulings,
    scoreA: score ? eventNumber(score, 'scoreA') : null,
    scoreB: score ? eventNumber(score, 'scoreB') : null,
    achieved,
    identified,
  }
}

// F2（#69/#26）：把 reasoning 散文里的「名字 ±delta：理由」行（shangyang/
// honnoji 脚本 add() 的输出形态）解析成结构化账目。解析不产出任何新数字：
// 合计一律由调用方用服务端 scoreA/scoreB 渲染。
export type LedgerKind =
  | 'main'
  | 'trueApproved'
  | 'fakeApproved'
  | 'identified'
  | 'other'

export interface LedgerItem {
  name: string
  side: Side | null
  delta: number
  why: string
  kind: LedgerKind
}

export interface ParsedLedger {
  items: LedgerItem[]
  // 解析不出的行原样保留（LLM 散文计分的场景整段落在这里）。
  leftover: string[]
  // 分侧小计：仅当每一条都能归侧时给出；否则 null，调用方回落 scoreA/scoreB。
  subtotals: Record<Side, number> | null
}

// 名字→侧别所需的最小上下文：场景 id（查内置 ScenarioModule 的角色/lane
// 名）+ 对局自带的 speakerLabels。
export interface LedgerContext {
  slotID?: string | null
  lanes?: Record<string, string> | null
}

// 「名字 ±delta：理由」——注意冒号是全角，与脚本输出一致。
const LEDGER_LINE = /^(.+?) ([+-]?\d+(?:\.\d+)?)：(.+)$/
// 与结构化区块重复的行（真目标/问询已由 score 事件呈现）和开发者收尾行
// （scoreA = …），整行丢弃，不进 leftover。
const DROPPED_LINE = /^(真目标：|问询：|scoreA\s*=)/

function classifyLedgerWhy(why: string): LedgerKind {
  if (why.includes('大政方针')) return 'main'
  if (why.includes('识破')) return 'identified'
  if (why.includes('真请求')) return 'trueApproved'
  if (why.includes('假请求')) return 'fakeApproved'
  return 'other'
}

export function parseLedger(
  reasoning: string | null | undefined,
  context: LedgerContext,
): ParsedLedger {
  // 名字→侧别：module 的角色/lane 标签优先（与 components/timeline/labels.ts
  // 的解析次序一致），再落到对局自带的 lanes；键是 'a'/'b' 或角色 key 时可
  // 直接定侧，judge 等 NPC lane 无侧别。未命中的名字保留原名（side: null）。
  const module = scenarioModule(context.slotID)
  const sideOfKey = (key: string): Side | null => {
    const role = module?.roles.find((candidate) => candidate.key === key)
    if (role) return role.side
    if (key === 'a' || key === 'b') return key
    return null
  }
  const sides = new Map<string, Side>()
  const claim = (name: string | null | undefined, side: Side | null) => {
    if (!name || side == null || sides.has(name)) return
    sides.set(name, side)
  }
  for (const role of module?.roles ?? []) claim(role.name, role.side)
  for (const [key, name] of Object.entries(module?.laneLabels ?? {})) {
    claim(name, sideOfKey(key))
  }
  for (const [key, name] of Object.entries(context.lanes ?? {})) {
    claim(name, sideOfKey(key))
  }

  const items: LedgerItem[] = []
  const leftover: string[] = []
  for (const raw of formatScoringReasoning(reasoning).split('\n')) {
    const line = raw.trim()
    if (line === '') continue
    if (DROPPED_LINE.test(line)) continue
    const matched = LEDGER_LINE.exec(line)
    if (matched == null) {
      leftover.push(line)
      continue
    }
    const [, name, delta, why] = matched
    items.push({
      name,
      side: sides.get(name) ?? null,
      delta: Number(delta),
      why,
      kind: classifyLedgerWhy(why),
    })
  }

  let subtotals: Record<Side, number> | null = null
  // 小计只在解析吃下整段计分散文时公布（round4 评审 #2）：任何 leftover 行
  // 都可能藏着未入账的加减分（真目标/问询/scoreA 的丢弃行不算），残缺小计
  // 会与服务端合计打架——宁缺，由调用方回落 scoreA/scoreB。
  if (
    items.length > 0 && leftover.length === 0 &&
    items.every((item) => item.side != null)
  ) {
    subtotals = { a: 0, b: 0 }
    for (const item of items) subtotals[item.side!] += item.delta
  }
  return { items, leftover, subtotals }
}

// round4 评审 #8：score 事件的结构化 ledger 通道——脚本 add() 的
// (side, delta, why) 元组随事件原样下发（shangyang/honnoji 的 emit 已带），
// 正则解析 reasoning 散文只作老对局的回退。任何一条不成形即整体放弃
// （返回 null），由调用方回落 parseLedger，绝不发布半本账。
export function ledgerFromScore(
  turns: TurnDTO[],
  context: LedgerContext,
): ParsedLedger | null {
  let score: ScriptEvent | null = null
  for (const turn of turns) {
    if (turn.kind !== 'event') continue
    const event = scriptEvent(turn)
    if (event != null && eventType(event) === 'score') score = event
  }
  const entries = score ? eventArray(score, 'ledger') : null
  if (entries == null || entries.length === 0) return null

  // 侧别→显示名：对局自带的 lanes 优先（与 labels.ts 的 sideName 次序
  // 一致），其次 module 的 lane 标签，最后回落通用侧名。
  const module = scenarioModule(context.slotID)
  const nameOf = (side: Side): string =>
    context.lanes?.[side] ?? module?.laneLabels[side] ??
      (side === 'a' ? '甲方' : '乙方')

  const items: LedgerItem[] = []
  const subtotals: Record<Side, number> = { a: 0, b: 0 }
  for (const entry of entries) {
    if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
      return null
    }
    const { side, delta, why } = entry
    if (
      (side !== 'a' && side !== 'b') || typeof delta !== 'number' ||
      typeof why !== 'string'
    ) {
      return null
    }
    items.push({
      name: nameOf(side),
      side,
      delta,
      why,
      kind: classifyLedgerWhy(why),
    })
    subtotals[side] += delta
  }
  // 事件账目按构造完整（add() 是分数的唯一出口），小计恒可发布；散文里的
  // 真目标/问询等重复行走结构化区块，这里没有 leftover。
  return { items, leftover: [], subtotals }
}

// 带符号的分值文案：正数补「+」，负数自带「-」，零原样。
export function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

// 结果卡签名明细（F2）用的短标签：按条目类别压缩理由。
export function ledgerShortLabel(item: LedgerItem): string {
  switch (item.kind) {
    case 'main':
      return '大政方针'
    case 'trueApproved':
      return '真请求获准'
    case 'fakeApproved':
      return '假请求获准'
    case 'identified':
      return '被识破'
    default:
      return item.why
  }
}
