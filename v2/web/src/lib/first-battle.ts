import type { ConfigResponse, ScenarioDetail, Side } from '../api/types'

export type CreationTool = 'mcq' | 'raw' | 'meta'

export function creationTool(value: string | null): CreationTool | null {
  return value === 'mcq' || value === 'raw' || value === 'meta' ? value : null
}

/** The configured side belongs to the NPC, not the player's saved version. */
export function firstBattlePreset(
  config: ConfigResponse,
  scenario: ScenarioDetail,
  playerSide: Side,
): string {
  const configured = config.expressPreset
  if (configured != null) {
    if (
      configured.scenarioID !== scenario.summary.id ||
      configured.side === playerSide ||
      !scenario.presets.some((preset) =>
        preset.key === configured.presetKey && preset.side === configured.side
      )
    ) {
      throw new Error(
        '首战预设与当前智能体的场景或阵营不一致，请重新加载配置。',
      )
    }
    return configured.presetKey
  }
  // The existing default applies only when §C2 genuinely has no expressPreset.
  if (scenario.summary.id !== 'shangyang-court' || playerSide !== 'a') {
    throw new Error('当前配置未指定此场景的首战预设，请返回首战快速通道。')
  }
  const preset = scenario.presets.find((preset) => preset.side === 'b')
  if (!preset) throw new Error('未找到首战对手预设，请重新加载配置。')
  return preset.key
}

export interface FirstBattleAttempt {
  versionID: number
  presetKey: string
  /** Pending also covers a POST whose response was lost: never blindly retry. */
  status: 'pending' | 'accepted'
  matchID?: number
}

function attemptKey(identity: string): string {
  return `axiia:first-battle-attempt:v1:${identity}`
}

export function readFirstBattleAttempt(
  identity: string,
): FirstBattleAttempt | null {
  const raw = sessionStorage.getItem(attemptKey(identity))
  if (raw == null) return null
  const value = JSON.parse(raw) as FirstBattleAttempt
  if (
    !Number.isSafeInteger(value.versionID) || value.versionID <= 0 ||
    typeof value.presetKey !== 'string' || value.presetKey === '' ||
    !['pending', 'accepted'].includes(value.status) ||
    (value.status === 'accepted' &&
      (!Number.isSafeInteger(value.matchID) || (value.matchID ?? 0) <= 0))
  ) throw new Error('首战派发记录无法读取，请到「历史」核对对局记录。')
  return value
}

export function writeFirstBattleAttempt(
  identity: string,
  attempt: FirstBattleAttempt | null,
): void {
  if (attempt == null) sessionStorage.removeItem(attemptKey(identity))
  else sessionStorage.setItem(attemptKey(identity), JSON.stringify(attempt))
}
