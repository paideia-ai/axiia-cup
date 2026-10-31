import type { MatchSummary, Side } from '../api/types'
import type { RoleNames } from './outcome'

export interface HistoryResult {
  label: string
  tone: 'pending' | 'running' | 'neutral' | 'win' | 'loss' | 'error'
  winner?: Side
  role?: string
  personal?: boolean
}

export function historyResult(
  m: MatchSummary,
  names: RoleNames,
): HistoryResult {
  if (!m.finished) {
    return m.dispatched
      ? { label: '进行中', tone: 'running' }
      : { label: '排队中', tone: 'pending' }
  }
  if (!m.scored) return { label: '未计分', tone: 'pending' }
  if (m.winner !== 'a' && m.winner !== 'b' && m.winner !== 'draw') {
    return { label: '对局异常', tone: 'error' }
  }
  const winner = m.winner === 'draw' ? undefined : m.winner
  const mine = (['a', 'b'] as const).filter((s) => m.participants?.[s]?.isMine)
  if (mine.length === 2) return { label: '左右互搏', tone: 'neutral', winner }
  if (!winner) return { label: '平局', tone: 'neutral' }
  if (!mine.length) {
    return {
      label: `${names[winner]} 胜`,
      tone: 'neutral',
      winner,
      role: names[winner],
    }
  }
  const won = winner === mine[0]
  const role = names[mine[0]]
  return {
    label: `你（${role}） ${won ? '胜' : '负'}`,
    tone: won ? 'win' : 'loss',
    winner,
    role,
    personal: true,
  }
}
