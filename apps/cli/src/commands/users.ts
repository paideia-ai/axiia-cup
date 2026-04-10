import { type AdminUser } from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch } from '../lib/http'
import { parseId } from '../lib/ids'
import { writeCollectionOutput, writeJsonOutput } from '../lib/io'
import { filterUsersByQuery, normalizeUser } from '../lib/normalizers'

export function registerUserCommands(program: Command) {
  program
    .command('users:list')
    .description('List users (structured JSON by default)')
    .option('--jsonl', 'emit one normalized user JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (options: { jsonl?: boolean; output?: string }) => {
      const users = await apiFetch<AdminUser[]>(
        '/api/admin/users',
        { method: 'GET' },
        true,
      )

      writeCollectionOutput({
        format: options.jsonl ? 'jsonl' : 'json',
        items: users.map(normalizeUser),
        kind: 'admin.users',
        outputPath: options.output,
      })
    })

  program
    .command('users:find')
    .description('Find users by name or email (structured JSON by default)')
    .option('--name <keyword>', 'match display name by substring')
    .option('--email <keyword>', 'match email by substring')
    .option('-q, --query <keyword>', 'match name or email by substring')
    .option('--jsonl', 'emit one normalized user JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (options: {
        email?: string
        jsonl?: boolean
        name?: string
        output?: string
        query?: string
      }) => {
        if (!options.name && !options.email && !options.query) {
          throw new Error('Provide --name, --email, or --query')
        }

        const users = await apiFetch<AdminUser[]>(
          '/api/admin/users',
          { method: 'GET' },
          true,
        )
        const items = filterUsersByQuery(users, options).map(normalizeUser)

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items,
          kind: 'admin.users.search',
          meta: {
            query: {
              name: options.name ?? null,
              email: options.email ?? null,
              any: options.query ?? null,
            },
          },
          outputPath: options.output,
        })
      },
    )

  program
    .command('users:disable')
    .description('Toggle a user disabled state (JSON by default)')
    .argument('<userId>', 'user id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (userIdArg: string, options: { output?: string }) => {
      const userId = parseId(userIdArg)

      if (!userId) {
        throw new Error('Invalid user id')
      }

      const user = await apiFetch<AdminUser>(
        `/api/admin/users/${userId}/disable`,
        { method: 'PATCH' },
        true,
      )

      writeJsonOutput(
        {
          kind: 'admin.user_state_updated',
          user: normalizeUser(user),
        },
        options.output,
      )
    })

  program
    .command('users:reset-password')
    .description('Reset a user password (JSON by default)')
    .argument('<userId>', 'user id')
    .requiredOption('-p, --password <password>', 'new password')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        userIdArg: string,
        options: { output?: string; password: string },
      ) => {
        const userId = parseId(userIdArg)

        if (!userId) {
          throw new Error('Invalid user id')
        }

        await apiFetch<{ ok: true }>(
          `/api/admin/users/${userId}/reset-password`,
          {
            body: JSON.stringify({ password: options.password }),
            method: 'POST',
          },
          true,
        )

        writeJsonOutput(
          {
            kind: 'admin.user_password_reset',
            userId,
            ok: true,
          },
          options.output,
        )
      },
    )
}
