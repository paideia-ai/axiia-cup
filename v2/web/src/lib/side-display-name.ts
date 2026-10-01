import type { Side } from '../api/types'

// UI copy only: keep script metadata, prompts and historical transcripts intact.
export function sideDisplayName(
  scenarioID: string,
  side: Side,
  fallback: string,
): string {
  return scenarioID === 'honnoji-decision'
    ? side === 'a' ? '袭击本能寺' : '西进毛利'
    : fallback
}
