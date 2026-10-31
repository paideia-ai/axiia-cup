import type { MatchParticipantsDTO, ScenarioSummary } from '../api/types'
import { roleIdentity } from './role-identity'

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
  scenarioID?: string
  winner?: string | null
  participants?: MatchParticipantsDTO | null
}

export function outcomeCopy(
  match: OutcomeInput,
  roles?: RoleNames | null,
): string | null {
  const winner = match.winner
  if (winner === 'draw') return '平局'
  if (winner !== 'a' && winner !== 'b') return null
  const identity = roleIdentity({
    scenarioID: match.scenarioID,
    side: winner,
    role: match.participants?.[winner]?.role,
    agentID: match.participants?.[winner]?.agentID,
    fallback: roles?.[winner],
  })
  const name = identity.name
  // 防御（round4 评审 #7）：participants 形态不全（{} 或缺一侧）时不抛错，
  // 按旁观处理——两处都全程可选链。
  const participants = match.participants ?? null
  const mineA = participants?.a?.isMine === true
  const mineB = participants?.b?.isMine === true
  if (!identity.resolved) {
    if (mineA !== mineB) {
      return (winner === 'a' ? mineA : mineB) ? '我方获胜' : '对手获胜'
    }
    const result = match.participants?.[winner]?.agentID != null
      ? `${name}胜`
      : '胜方角色待确认'
    return mineA && mineB ? `左右手互搏 · ${result}` : result
  }
  // 左右手互搏（#65）：两侧都是我，「我方/对方」失义——标互搏、报胜侧角色。
  if (mineA && mineB) return `左右手互搏 · ${name}胜`
  // 旁观 / open 历史 / 老服务器：只报胜侧角色。
  if (!mineA && !mineB) return `胜方 ${name}`
  const winnerIsMine = winner === 'a' ? mineA : mineB
  return winnerIsMine ? `我方（${name}）胜` : `对方（${name}）胜`
}

// 角色名映射（round4 评审 #10）：catalog 场景清单 → {场景 id: 双侧角色名}，
// battle-strip 与历史页共用同一构建；缺席场景由 outcomeCopy 按归属显示结果。
export function scenarioRoles(
  scenarios: ScenarioSummary[],
): Record<string, RoleNames> {
  const map: Record<string, RoleNames> = {}
  for (const scenario of scenarios) {
    map[scenario.id] = {
      a: roleIdentity({
        scenarioID: scenario.id,
        side: 'a',
        fallback: scenario.sideAName,
      }).name,
      b: roleIdentity({
        scenarioID: scenario.id,
        side: 'b',
        fallback: scenario.sideBName,
      }).name,
    }
  }
  return map
}
