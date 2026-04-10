import {
  type AdminAnalyticsAgentDetail,
  type AdminAnalyticsAgentSummary,
  type AdminAnalyticsBattle,
} from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch } from '../lib/http'
import { parseId } from '../lib/ids'
import { writeCollectionOutput, writeJsonOutput } from '../lib/io'
import {
  normalizeAgentDetail,
  normalizeAgentSummary,
  normalizeBattle,
} from '../lib/normalizers'

export function registerAnalyticsCommands(program: Command) {
  program
    .command('battles')
    .description('List the unified battle view (structured JSON by default)')
    .option('--user <id>', 'filter by user id')
    .option('--submission <id>', 'filter by submission id')
    .option('--side <side>', 'filter by agent side (a or b)')
    .option('--source <source>', 'filter by source (tournament or playground)')
    .option('--mode <mode>', 'filter by playground mode (pvp or pve)')
    .option('--status <status>', 'filter by status')
    .option('--limit <n>', 'max rows to return', '50')
    .option('--jsonl', 'emit one normalized battle JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        options: {
          jsonl?: boolean
          limit?: string
          mode?: string
          output?: string
          side?: string
          source?: string
          status?: string
          submission?: string
          user?: string
        },
      ) => {
        const params = new URLSearchParams()

        if (options.user) params.set('userId', options.user)
        if (options.submission) params.set('submissionId', options.submission)
        if (options.side) params.set('side', options.side)
        if (options.source) params.set('source', options.source)
        if (options.mode) params.set('mode', options.mode)
        if (options.status) params.set('status', options.status)
        if (options.limit) params.set('limit', options.limit)

        const path = `/api/admin/analytics/battles${
          params.size > 0 ? `?${params.toString()}` : ''
        }`
        const battles = await apiFetch<AdminAnalyticsBattle[]>(
          path,
          { method: 'GET' },
          true,
        )

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items: battles.map(normalizeBattle),
          kind: 'analytics.battles',
          meta: {
            query: {
              userId: options.user ? Number(options.user) : null,
              submissionId: options.submission ? Number(options.submission) : null,
              side: options.side ?? null,
              source: options.source ?? null,
              mode: options.mode ?? null,
              status: options.status ?? null,
              limit: options.limit ? Number(options.limit) : null,
            },
          },
          outputPath: options.output,
        })
      },
    )

  program
    .command('user:agents')
    .description('List all agents for a user (structured JSON by default)')
    .argument('<userId>', 'user id')
    .option('--jsonl', 'emit one normalized agent JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        userIdArg: string,
        options: { jsonl?: boolean; output?: string },
      ) => {
        const userId = parseId(userIdArg)

        if (!userId) {
          throw new Error('Invalid user id')
        }

        const agents = await apiFetch<AdminAnalyticsAgentSummary[]>(
          `/api/admin/analytics/users/${userId}/agents`,
          { method: 'GET' },
          true,
        )

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items: agents.map(normalizeAgentSummary),
          kind: 'analytics.user_agents',
          meta: { userId },
          outputPath: options.output,
        })
      },
    )

  program
    .command('agent:summary')
    .description('Show an agent summary and recent battles (structured JSON by default)')
    .argument('<submissionId>', 'submission id')
    .argument('<side>', 'agent side (a or b)')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        submissionIdArg: string,
        side: string,
        options: { output?: string },
      ) => {
        const submissionId = parseId(submissionIdArg)

        if (!submissionId) {
          throw new Error('Invalid submission id')
        }

        if (side !== 'a' && side !== 'b') {
          throw new Error('side must be "a" or "b"')
        }

        const detail = await apiFetch<AdminAnalyticsAgentDetail>(
          `/api/admin/analytics/agents/${submissionId}/${side}/summary`,
          { method: 'GET' },
          true,
        )

        writeJsonOutput(
          {
            kind: 'analytics.agent_summary',
            ...normalizeAgentDetail(detail),
          },
          options.output,
        )
      },
    )

  program
    .command('battle:export')
    .description('Export one battle and its llm_calls through the API')
    .argument('<source>', 'battle source (tournament or playground)')
    .argument('<id>', 'battle id')
    .option('-o, --output <path>', 'write JSON to file instead of stdout')
    .action(
      async (
        source: string,
        idArg: string,
        options: { output?: string },
      ) => {
        if (source !== 'tournament' && source !== 'playground') {
          throw new Error('source must be "tournament" or "playground"')
        }

        const id = parseId(idArg)

        if (!id) {
          throw new Error('Invalid battle id')
        }

        const payload = await apiFetch<unknown>(
          `/api/admin/analytics/battles/${source}/${id}/export`,
          { method: 'GET' },
          true,
        )

        writeJsonOutput(payload, options.output)
      },
    )
}
