import type { Side } from '../../api/types'
import type { Deck, ScenarioDeckSet } from '../../lib/deck'
import { fengyitingRealDecks } from './fengyiting-real'
import { honnojiDecisionDecks } from './honnoji-decision'
import { shangyangCourtDecks } from './shangyang-court'
import { trolleyProblemDecks } from './trolley-problem'

// 场景 deck 注册表（与 ../index.ts 的 MODULES 同一习惯）：deck 缺席的场景
// 不是坏场景——构建器退回 Basic 直写，初始化三选一整个不出现。
const DECK_SETS: ScenarioDeckSet[] = [
  shangyangCourtDecks,
  honnojiDecisionDecks,
  fengyitingRealDecks,
  trolleyProblemDecks,
]

// deck 查找：优先按入场角色 key（本能寺一角色一套），否则按侧别。roleKey
// 与 side 都对不上 → null（按无 deck 降级）。
export function deckFor(
  slotID: string | null | undefined,
  side: Side,
  roleKey?: string | null,
): Deck | null {
  if (!slotID) return null
  const set = DECK_SETS.find((item) => item.slotID === slotID)
  if (!set) return null
  if (roleKey != null && set.decks[roleKey] != null) return set.decks[roleKey]
  return set.decks[side] ?? null
}

// 全量枚举（内容完整性测试用）。
export function allDeckSets(): ScenarioDeckSet[] {
  return DECK_SETS
}
