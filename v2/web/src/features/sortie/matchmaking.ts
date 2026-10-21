// Proposed win-rate matching, exercised locally. Production must select and
// validate opponents on the server; this is not an Elo/Glicko rating.
export interface RecordStats {
  wins: number
  losses: number
  draws: number
  streak: number
  bestStreak: number
}

// Statistics belong to the agent across all of its ladder versions.
// versionID only identifies the snapshot used to execute this match.
export interface Entry extends RecordStats {
  agentID: number
  versionID: number
  ownerID: string
  scenarioID: string
  side: 'a' | 'b'
  active: boolean
  eligible: boolean
}

export const gamesPlayed = (s: RecordStats) => s.wins + s.losses + s.draws
export const winRate = (s: RecordStats) =>
  gamesPlayed(s) ? s.wins / gamesPlayed(s) : null
// Ten virtual games at 50% temper tiny samples; draws count as half a point
// for matching, but the displayed win rate remains wins / completed games.
export const matchingScore = (s: RecordStats) =>
  (s.wins + s.draws * 0.5 + 5) / (gamesPlayed(s) + 10)

export function candidatePool(
  me: Entry,
  entries: readonly Entry[],
) {
  if (!me.active || !me.eligible) return []
  const eligible = entries.filter((other) =>
    other.active && other.eligible && other.ownerID !== me.ownerID &&
    other.scenarioID === me.scenarioID && other.side !== me.side
  )
  // Query the existing entry pool once. Use the narrowest nonempty band
  // immediately; availability never depends on another player being online.
  // Rating distance and placement status must never block an available opponent.
  for (const window of [0.05, 0.1, 0.2]) {
    const nearby = eligible.filter((other) =>
      Math.abs(matchingScore(me) - matchingScore(other)) <= window + 1e-9
    )
    if (nearby.length) return nearby
  }
  return eligible
}

export function pickOpponent(
  pool: readonly Entry[],
  random = Math.random,
): Entry | null {
  // One ticket per player, so creating multiple agents cannot bias selection.
  const owners = [...new Set(pool.map((entry) => entry.ownerID))]
  if (!owners.length) return null
  const owner =
    owners[Math.min(Math.floor(random() * owners.length), owners.length - 1)]
  const entries = pool.filter((entry) => entry.ownerID === owner)
  return entries[
    Math.min(Math.floor(random() * entries.length), entries.length - 1)
  ]
}

export function settle(
  stats: RecordStats,
  outcome: 'win' | 'loss' | 'draw',
): RecordStats {
  const streak = outcome === 'win' ? stats.streak + 1 : 0
  return {
    wins: stats.wins + Number(outcome === 'win'),
    losses: stats.losses + Number(outcome === 'loss'),
    draws: stats.draws + Number(outcome === 'draw'),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  }
}
