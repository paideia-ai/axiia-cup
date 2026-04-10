import { type AdminMonitorUser } from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch } from '../lib/http'
import { parseId } from '../lib/ids'
import { writeCollectionOutput, writeJsonOutput } from '../lib/io'
import { normalizeMonitorUser } from '../lib/normalizers'

export function registerMonitorCommands(program: Command) {
  program
    .command('monitor')
    .description('List overall user activity (JSON by default)')
    .option('--jsonl', 'emit one normalized monitor JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (options: { jsonl?: boolean; output?: string }) => {
      const users = await apiFetch<AdminMonitorUser[]>(
        '/api/admin/monitor/users',
        { method: 'GET' },
        true,
      )

      writeCollectionOutput({
        format: options.jsonl ? 'jsonl' : 'json',
        items: users.map(normalizeMonitorUser),
        kind: 'admin.monitor_users',
        outputPath: options.output,
      })
    })

  program
    .command('monitor:player')
    .description('Show one user activity detail (JSON by default)')
    .argument('<userId>', 'user id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (userIdArg: string, options: { output?: string }) => {
      const userId = parseId(userIdArg)

      if (!userId) {
        throw new Error('Invalid user id')
      }

      const [monitorData, stats, submissions, recentMatches] = await Promise.all([
        apiFetch<AdminMonitorUser[]>(
          '/api/admin/monitor/users',
          { method: 'GET' },
          true,
        ),
        apiFetch<Record<string, unknown>>(
          `/api/stats/me?asUserId=${userId}`,
          { method: 'GET' },
          true,
        ),
        apiFetch<Array<Record<string, unknown>>>(
          `/api/submissions/my?asUserId=${userId}`,
          { method: 'GET' },
          true,
        ),
        apiFetch<Array<Record<string, unknown>>>(
          `/api/matches/my?asUserId=${userId}`,
          { method: 'GET' },
          true,
        ),
      ])

      const userMonitor = monitorData.find((user) => user.userId === userId) ?? null

      writeJsonOutput(
        {
          kind: 'admin.monitor_player',
          userId,
          monitor: userMonitor ? normalizeMonitorUser(userMonitor) : null,
          stats,
          submissions,
          recentMatches,
        },
        options.output,
      )
    })
}
