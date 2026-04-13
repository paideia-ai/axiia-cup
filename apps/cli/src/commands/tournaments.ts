import {
  type AdminPlayer,
  type AdminPlayerPromptExport,
  type LeaderboardEntry,
  type TournamentDetail,
} from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch, resolveTournamentId } from '../lib/http'
import { writeCollectionOutput, writeJsonOutput } from '../lib/io'
import {
  normalizeLeaderboardEntry,
  normalizePlayer,
  normalizePlayerPromptExport,
  normalizeStartRoundResponse,
  normalizeTournamentStatus,
} from '../lib/normalizers'
import type { StartRoundResponse } from '../lib/types'

export function registerTournamentCommands(program: Command) {
  program
    .command('players')
    .description('List tournament players (JSON by default)')
    .requiredOption('-s, --scenario <id>', 'scenario id')
    .option('--jsonl', 'emit one normalized player JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (options: {
        jsonl?: boolean
        output?: string
        scenario: string
      }) => {
        const players = await apiFetch<AdminPlayer[]>(
          `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(options.scenario)}`,
          { method: 'GET' },
          true,
        )

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items: players.map(normalizePlayer),
          kind: 'tournament.players',
          meta: { scenarioId: options.scenario },
          outputPath: options.output,
        })
      },
    )

  program
    .command('players:prompts')
    .description(
      'Export latest player prompts for a scenario (JSON by default)',
    )
    .requiredOption('-s, --scenario <id>', 'scenario id')
    .option('--jsonl', 'emit one normalized player prompt JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (options: {
        jsonl?: boolean
        output?: string
        scenario: string
      }) => {
        const players = await apiFetch<AdminPlayerPromptExport[]>(
          `/api/admin/tournaments/players/prompts?scenarioId=${encodeURIComponent(options.scenario)}`,
          { method: 'GET' },
          true,
        )

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items: players.map(normalizePlayerPromptExport),
          kind: 'tournament.player_prompts',
          meta: { scenarioId: options.scenario },
          outputPath: options.output,
        })
      },
    )

  program
    .command('start')
    .description(
      'Lock entries and create the first round pairings (JSON by default)',
    )
    .argument('<scenarioId>', 'scenario id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (scenarioId: string, options: { output?: string }) => {
      const result = await apiFetch<StartRoundResponse>(
        '/api/admin/tournaments/start',
        {
          body: JSON.stringify({ scenarioId }),
          method: 'POST',
        },
        true,
      )

      writeJsonOutput(
        {
          kind: 'tournament.start',
          scenarioId,
          ...normalizeStartRoundResponse(result),
        },
        options.output,
      )
    })

  program
    .command('status')
    .description('Show tournament status (JSON by default)')
    .argument('[tournamentId]', 'tournament id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        tournamentIdArg: string | undefined,
        options: { output?: string },
      ) => {
        const tournamentId = await resolveTournamentId(tournamentIdArg)
        const tournament = await apiFetch<TournamentDetail>(
          `/api/tournaments/${tournamentId}`,
          undefined,
          true,
        )

        writeJsonOutput(
          {
            kind: 'tournament.status',
            ...normalizeTournamentStatus(tournament),
          },
          options.output,
        )
      },
    )

  program
    .command('next-round')
    .description('Create the next Swiss round pairings (JSON by default)')
    .argument('<tournamentId>', 'tournament id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (tournamentId: string, options: { output?: string }) => {
      const result = await apiFetch<StartRoundResponse>(
        `/api/admin/tournaments/${tournamentId}/next-round`,
        {
          method: 'POST',
        },
        true,
      )

      writeJsonOutput(
        {
          kind: 'tournament.next_round',
          ...normalizeStartRoundResponse(result),
        },
        options.output,
      )
    })

  program
    .command('terminate')
    .description('Terminate a running tournament (JSON by default)')
    .argument('<tournamentId>', 'tournament id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (tournamentId: string, options: { output?: string }) => {
      const result = await apiFetch<{ ok: true }>(
        `/api/admin/tournaments/${tournamentId}/terminate`,
        {
          method: 'POST',
        },
        true,
      )

      writeJsonOutput(
        {
          kind: 'tournament.terminate',
          ok: result.ok,
          tournamentId: Number(tournamentId),
        },
        options.output,
      )
    })

  program
    .command('leaderboard')
    .description('Show the leaderboard (JSON by default)')
    .argument('<tournamentId>', 'tournament id')
    .option(
      '--jsonl',
      'emit one normalized leaderboard entry JSON object per line',
    )
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        tournamentId: string,
        options: { jsonl?: boolean; output?: string },
      ) => {
        const leaderboard = await apiFetch<LeaderboardEntry[]>(
          `/api/tournaments/${tournamentId}/leaderboard`,
          undefined,
          true,
        )

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items: leaderboard.map(normalizeLeaderboardEntry),
          kind: 'tournament.leaderboard',
          meta: { tournamentId: Number(tournamentId) },
          outputPath: options.output,
        })
      },
    )

  program
    .command('match:export')
    .description('Export a local match and its llm_calls from SQLite')
    .argument('<matchId>', 'match id')
    .option('-d, --db <path>', 'SQLite database path')
    .option('-o, --output <path>', 'write JSON to file instead of stdout')
    .action(
      async (matchIdArg: string, options: { db?: string; output?: string }) => {
        const matchId = Number.parseInt(matchIdArg, 10)

        if (!Number.isInteger(matchId) || matchId <= 0) {
          throw new Error('matchId must be a positive integer')
        }

        const { exportMatch } = await import('../lib/local-export')
        exportMatch({
          dbPath: options.db,
          matchId,
          outputPath: options.output,
        })
      },
    )
}
