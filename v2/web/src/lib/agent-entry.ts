import type { Side } from '../api/types'

export function agentEntryUrl(
  scenarioID: string,
  side: Side,
  target: 'view' | 'build' = 'view',
  express = false,
): string {
  const params = new URLSearchParams({ scenario: scenarioID, side, target })
  if (express) params.set('express', '1')
  return `/agents/entry?${params}`
}
