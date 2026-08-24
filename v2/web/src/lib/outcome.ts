import type { MatchParticipantsDTO } from '../api/types'

// F7（#69 一眼知胜负 / #71 我方与对手区分）：把 winner + participants 译成
// 带视角的结果文案——我方（商鞅）胜 / 对方（甘龙）胜 / 平局；旁观、open
// 历史与老服务器（无 participants）回退「胜方 角色」。战报头、历史行、约战
// 互链、对战条共用同一口径。返回 null 表示没有可判读的胜负（winner 缺席或
// 词汇未知），调用方保留各自原有回退。
export interface RoleNames {
  a: string
  b: string
}

export interface OutcomeInput {
  winner?: string | null
  participants?: MatchParticipantsDTO | null
}

// 场景角色名缺席（catalog 未加载/未知场景）时的兜底叫法。
const FALLBACK_ROLES: RoleNames = { a: '甲方', b: '乙方' }

export function outcomeCopy(
  match: OutcomeInput,
  roles?: RoleNames | null,
): string | null {
  const winner = match.winner
  if (winner === 'draw') return '平局'
  if (winner !== 'a' && winner !== 'b') return null
  const name = (winner === 'a' ? roles?.a : roles?.b) || FALLBACK_ROLES[winner]
  const participants = match.participants ?? null
  const mineA = participants?.a.isMine === true
  const mineB = participants?.b.isMine === true
  // 左右手互搏（#65）：两侧都是我，「我方/对方」失义——标互搏、报胜侧角色。
  if (mineA && mineB) return `左右手互搏 · ${name}胜`
  // 旁观 / open 历史 / 老服务器：只报胜侧角色。
  if (!mineA && !mineB) return `胜方 ${name}`
  const winnerIsMine = winner === 'a' ? mineA : mineB
  return winnerIsMine ? `我方（${name}）胜` : `对方（${name}）胜`
}
