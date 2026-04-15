import { computeSwissRounds } from '@axiia/shared'

export function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function swissPair(params: {
  playerIds: number[]
  previousPairings: Set<string>
  standings: Map<number, number>
}): Array<[number, number]> {
  const sortedPlayers = [...params.playerIds].sort((left, right) => {
    const winDiff =
      (params.standings.get(right) ?? 0) - (params.standings.get(left) ?? 0)

    if (winDiff !== 0) {
      return winDiff
    }

    return left - right
  })

  const remaining = [...sortedPlayers]
  const pairs: Array<[number, number]> = []

  while (remaining.length > 1) {
    const player = remaining.shift()

    if (player === undefined) {
      break
    }

    let opponentIndex = remaining.findIndex(
      (candidate) => !params.previousPairings.has(pairKey(player, candidate)),
    )

    if (opponentIndex === -1) {
      opponentIndex = 0
    }

    const [opponent] = remaining.splice(opponentIndex, 1)

    if (opponent !== undefined) {
      pairs.push([player, opponent])
    }
  }

  return pairs
}

/**
 * Circle-method round robin. Returns all rounds upfront.
 * If odd player count, a sentinel -1 is used; pairs containing it are byes.
 */
export function roundRobinSchedule(
  playerIds: number[],
): Array<Array<[number, number]>> {
  const players = [...playerIds]

  if (players.length % 2 !== 0) {
    players.push(-1) // bye sentinel
  }

  const n = players.length
  const totalRounds = n - 1
  const schedule: Array<Array<[number, number]>> = []

  // fixed[0] stays, rotate the rest
  const fixed = players[0]
  const rotating = players.slice(1)

  for (let round = 0; round < totalRounds; round += 1) {
    const roundPairs: Array<[number, number]> = []
    const current = [fixed, ...rotating]

    for (let i = 0; i < n / 2; i += 1) {
      const a = current[i]
      const b = current[n - 1 - i]

      // Skip bye pairs
      if (a === -1 || b === -1) {
        continue
      }

      roundPairs.push([a, b])
    }

    schedule.push(roundPairs)

    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!)
  }

  return schedule
}

export type TournamentFormat = 'swiss' | 'round-robin'

export function computeRoundCount(
  format: TournamentFormat,
  playerCount: number,
  override?: number,
): number {
  if (override !== undefined) {
    return override
  }

  if (format === 'swiss') {
    return computeSwissRounds(playerCount)
  }

  // Round robin: N-1 rounds (N if odd, since we add a bye sentinel)
  return playerCount % 2 === 0 ? playerCount - 1 : playerCount
}
