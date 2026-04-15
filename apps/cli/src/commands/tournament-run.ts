import type {
  AdminPlayer,
  LeaderboardEntry,
  Tournament,
  TournamentDetail,
  TournamentMatchSummary,
  TournamentRound,
} from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch } from '../lib/http'
import { writeJsonOutput } from '../lib/io'
import {
  computeRoundCount,
  pairKey,
  roundRobinSchedule,
  swissPair,
  type TournamentFormat,
} from '../lib/pairing'
import { pollRoundCompletion } from '../lib/polling'

type StartCustomResponse = {
  players: AdminPlayer[]
  tournament: Tournament
}

type CreateRoundResponse = {
  byeSubmissions: number[]
  matches: TournamentMatchSummary[]
  round: TournamentRound
  tournament: Tournament
}

function log(message: string) {
  process.stderr.write(`${message}\n`)
}

function parseIdList(value: string): number[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => {
      const n = Number(s)

      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid submission ID: ${s}`)
      }

      return n
    })
}

export function registerTournamentRunCommand(program: Command) {
  program
    .command('tournament:run')
    .description(
      'Run a tournament with configurable format and player selection',
    )
    .requiredOption('-s, --scenario <id>', 'scenario ID')
    .requiredOption(
      '--format <format>',
      'pairing format: swiss or round-robin',
    )
    .option('--include <ids>', 'comma-separated submission IDs to include')
    .option('--exclude <ids>', 'comma-separated submission IDs to exclude')
    .option('--rounds <n>', 'override computed round count', Number)
    .option('--dry-run', 'show computed pairings without executing')
    .option(
      '--retry-limit <n>',
      'max retries per errored match (default: 2)',
      Number,
      2,
    )
    .option(
      '--poll-interval <ms>',
      'polling interval in milliseconds (default: 5000)',
      Number,
      5000,
    )
    .option('-o, --output <path>', 'write result JSON to file')
    .action(async (options: RunOptions) => {
      await runTournament(options)
    })
}

type RunOptions = {
  dryRun?: boolean
  exclude?: string
  format: string
  include?: string
  output?: string
  pollInterval: number
  retryLimit: number
  rounds?: number
  scenario: string
}

async function runTournament(options: RunOptions) {
  const format = parseFormat(options.format)

  // 1. Fetch available players
  log(`Fetching players for scenario ${options.scenario}...`)
  const allPlayers = await apiFetch<AdminPlayer[]>(
    `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(options.scenario)}`,
    { method: 'GET' },
    true,
  )

  // 2. Apply include/exclude filters
  let players = allPlayers

  if (options.include) {
    const includeIds = new Set(parseIdList(options.include))
    players = players.filter((p) => includeIds.has(p.submissionId))
  }

  if (options.exclude) {
    const excludeIds = new Set(parseIdList(options.exclude))
    players = players.filter((p) => !excludeIds.has(p.submissionId))
  }

  if (players.length < 2) {
    throw new Error(
      `Need at least 2 players, got ${players.length} after filtering`,
    )
  }

  const playerIds = players.map((p) => p.submissionId)
  const totalRounds = computeRoundCount(format, players.length, options.rounds)

  log(`Format: ${format}`)
  log(`Players: ${players.length}`)
  log(
    `  ${players.map((p) => `${p.displayName} (sub:${p.submissionId})`).join(', ')}`,
  )
  log(`Rounds: ${totalRounds}`)

  // 3. Pre-compute round-robin schedule if needed
  const rrSchedule =
    format === 'round-robin' ? roundRobinSchedule(playerIds) : null

  // 4. Dry run: show pairings and exit
  if (options.dryRun) {
    const dryRunResult = buildDryRunResult(
      format,
      playerIds,
      totalRounds,
      rrSchedule,
    )
    writeJsonOutput(dryRunResult, options.output)
    return
  }

  // 5. Create tournament on server
  log('Creating tournament...')
  const { tournament } = await apiFetch<StartCustomResponse>(
    '/api/admin/tournaments/start-custom',
    {
      method: 'POST',
      body: JSON.stringify({
        scenarioId: options.scenario,
        submissionIds: playerIds,
        totalRounds,
      }),
    },
    true,
  )
  log(`Tournament #${tournament.id} created`)

  // 6. Run rounds
  const roundResults: RoundResult[] = []
  const previousPairings = new Set<string>()
  const standings = new Map<number, number>()

  for (const id of playerIds) {
    standings.set(id, 0)
  }

  for (let roundNum = 1; roundNum <= totalRounds; roundNum += 1) {
    log(`\n── Round ${roundNum}/${totalRounds} ──`)

    // Compute pairs
    const pairs = computePairs(
      format,
      roundNum,
      playerIds,
      standings,
      previousPairings,
      rrSchedule,
    )

    const byeIds = playerIds.filter(
      (id) => !pairs.some(([a, b]) => a === id || b === id),
    )

    if (byeIds.length > 0) {
      log(`Byes: ${byeIds.join(', ')}`)
    }

    log(
      `Pairs: ${pairs.map(([a, b]) => `${a} vs ${b}`).join(', ')}`,
    )

    // Send pairs to server
    const roundResponse = await apiFetch<CreateRoundResponse>(
      `/api/admin/tournaments/${tournament.id}/create-round`,
      {
        method: 'POST',
        body: JSON.stringify({ pairs }),
      },
      true,
    )

    log(
      `Round ${roundNum} created: ${roundResponse.matches.length} matches queued`,
    )

    // Record pairings
    for (const [a, b] of pairs) {
      previousPairings.add(pairKey(a, b))
    }

    // Poll for completion
    let retriesRemaining = options.retryLimit

    const result = await pollWithRetry(
      tournament.id,
      roundNum,
      options.pollInterval,
      retriesRemaining,
    )

    roundResults.push({
      byeSubmissionIds: byeIds,
      erroredMatchIds: result.erroredMatchIds,
      matchCount: result.matches.length,
      pairs,
      roundNumber: roundNum,
    })

    // Update standings from leaderboard
    const leaderboard = await apiFetch<LeaderboardEntry[]>(
      `/api/tournaments/${tournament.id}/leaderboard`,
      undefined,
      true,
    )

    for (const entry of leaderboard) {
      standings.set(entry.submissionId, entry.wins)
    }

    const roundSummary = result.matches
      .filter((m) => m.status === 'scored')
      .map((m) => {
        const winner =
          m.winner === 'a'
            ? `sub:${m.subAId} wins`
            : m.winner === 'b'
              ? `sub:${m.subBId} wins`
              : 'draw'
        return `  match:${m.id} ${m.subAId} vs ${m.subBId} → ${winner} (${m.scoreA}-${m.scoreB})`
      })

    for (const line of roundSummary) {
      log(line)
    }
  }

  // 7. Fetch final leaderboard
  log('\n── Final Leaderboard ──')
  const finalLeaderboard = await apiFetch<LeaderboardEntry[]>(
    `/api/tournaments/${tournament.id}/leaderboard`,
    undefined,
    true,
  )

  for (const entry of finalLeaderboard) {
    log(
      `  #${entry.rank} ${entry.playerName} — ${entry.wins}W/${entry.losses}L (${entry.winRate.toFixed(1)}%)`,
    )
  }

  // 8. Output result
  const hasErrors = roundResults.some((r) => r.erroredMatchIds.length > 0)

  const output = {
    kind: 'tournament.run',
    tournamentId: tournament.id,
    scenarioId: options.scenario,
    format,
    totalRounds,
    playerCount: players.length,
    rounds: roundResults,
    leaderboard: finalLeaderboard,
    status: hasErrors ? 'completed_with_errors' : 'finished',
  }

  writeJsonOutput(output, options.output)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type RoundResult = {
  byeSubmissionIds: number[]
  erroredMatchIds: number[]
  matchCount: number
  pairs: Array<[number, number]>
  roundNumber: number
}

function parseFormat(value: string): TournamentFormat {
  if (value === 'swiss' || value === 'round-robin') {
    return value
  }

  throw new Error(`Invalid format: ${value}. Must be "swiss" or "round-robin"`)
}

function computePairs(
  format: TournamentFormat,
  roundNum: number,
  playerIds: number[],
  standings: Map<number, number>,
  previousPairings: Set<string>,
  rrSchedule: Array<Array<[number, number]>> | null,
): Array<[number, number]> {
  if (format === 'round-robin' && rrSchedule) {
    const roundIndex = roundNum - 1

    if (roundIndex >= rrSchedule.length) {
      throw new Error(
        `Round ${roundNum} exceeds round-robin schedule (${rrSchedule.length} rounds)`,
      )
    }

    return rrSchedule[roundIndex]
  }

  return swissPair({ playerIds, previousPairings, standings })
}

function buildDryRunResult(
  format: TournamentFormat,
  playerIds: number[],
  totalRounds: number,
  rrSchedule: Array<Array<[number, number]>> | null,
) {
  const rounds: Array<{
    byeSubmissionIds: number[]
    pairs: Array<[number, number]>
    roundNumber: number
  }> = []

  if (format === 'round-robin' && rrSchedule) {
    for (let i = 0; i < Math.min(totalRounds, rrSchedule.length); i += 1) {
      const pairs = rrSchedule[i]
      const byeIds = playerIds.filter(
        (id) => !pairs.some(([a, b]) => a === id || b === id),
      )
      rounds.push({ roundNumber: i + 1, pairs, byeSubmissionIds: byeIds })
    }
  } else {
    // Swiss: can only show round 1 (empty standings)
    const pairs = swissPair({
      playerIds,
      previousPairings: new Set(),
      standings: new Map(playerIds.map((id) => [id, 0])),
    })
    const byeIds = playerIds.filter(
      (id) => !pairs.some(([a, b]) => a === id || b === id),
    )
    rounds.push({ roundNumber: 1, pairs, byeSubmissionIds: byeIds })
    log(
      'Note: Swiss rounds after round 1 depend on results and cannot be previewed.',
    )
  }

  return {
    kind: 'tournament.dry-run',
    format,
    playerCount: playerIds.length,
    playerIds,
    totalRounds,
    rounds,
  }
}

async function pollWithRetry(
  tournamentId: number,
  roundNumber: number,
  pollInterval: number,
  retryLimit: number,
): Promise<{ erroredMatchIds: number[]; matches: TournamentMatchSummary[] }> {
  let retriesLeft = retryLimit

  while (true) {
    const result = await pollRoundCompletion({
      tournamentId,
      roundNumber,
      intervalMs: pollInterval,
      onProgress: (status) => {
        const parts = [
          `${status.scored}/${status.total} scored`,
          status.running > 0 ? `${status.running} running` : null,
          status.queued > 0 ? `${status.queued} queued` : null,
          status.errored > 0 ? `${status.errored} errored` : null,
        ].filter(Boolean)
        process.stderr.write(`\r  Progress: ${parts.join(', ')}`)
      },
    })

    process.stderr.write('\n')

    if (result.allScored || retriesLeft <= 0) {
      if (result.erroredMatchIds.length > 0) {
        log(
          `Warning: ${result.erroredMatchIds.length} errored matches: ${result.erroredMatchIds.join(', ')}`,
        )
      }

      return {
        erroredMatchIds: result.erroredMatchIds,
        matches: result.matches,
      }
    }

    // Retry errored matches
    log(
      `Retrying ${result.erroredMatchIds.length} errored matches (${retriesLeft} retries left)...`,
    )

    for (const matchId of result.erroredMatchIds) {
      try {
        await apiFetch(
          `/api/admin/matches/${matchId}/retry`,
          { method: 'POST' },
          true,
        )
      } catch (error) {
        log(
          `  Failed to retry match ${matchId}: ${error instanceof Error ? error.message : 'unknown'}`,
        )
      }
    }

    retriesLeft -= 1
  }
}
