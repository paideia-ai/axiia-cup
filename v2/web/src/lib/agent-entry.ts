import type { MyAgentDTO, Side } from '../api/types'

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

// Prefer a playable entry, then the most recently edited active agent. Keep
// inventory order as the fallback when older servers omit edit timestamps.
export function preferredAgent(
  agents: readonly MyAgentDTO[],
): MyAgentDTO | undefined {
  return agents.filter((agent) => !agent.isArchived).sort((a, b) =>
    Number(b.entryVersionID != null) - Number(a.entryVersionID != null) ||
    (b.lastEditedAt ?? 0) - (a.lastEditedAt ?? 0)
  )[0]
}
