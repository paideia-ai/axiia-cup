import type { Command } from 'commander'

import { apiFetch } from '../lib/http'
import { shellEscapeSingleQuotes, writeJsonOutput } from '../lib/io'
import type { AuthResponse } from '../lib/types'

export function registerAuthCommands(program: Command) {
  program
    .command('auth:login')
    .description('Log in and return a bearer token (JSON by default)')
    .requiredOption('-e, --email <email>', 'email')
    .requiredOption('-p, --password <password>', 'password')
    .option('--token-only', 'print token only')
    .option('--shell', 'print shell export command')
    .option('-o, --output <path>', 'write JSON output to file instead of stdout')
    .action(
      async (options: {
        email: string
        output?: string
        password: string
        shell?: boolean
        tokenOnly?: boolean
      }) => {
        const auth = await apiFetch<AuthResponse>(
          '/api/auth/login',
          {
            body: JSON.stringify({
              email: options.email,
              password: options.password,
            }),
            method: 'POST',
          },
          false,
        )
        const shellExport = `export AXIIA_AUTH_TOKEN='${shellEscapeSingleQuotes(auth.token)}'`

        if (options.tokenOnly) {
          console.log(auth.token)
          return
        }

        if (options.shell) {
          console.log(shellExport)
          return
        }

        writeJsonOutput(
          {
            kind: 'auth.login',
            token: auth.token,
            shellExport,
            user: auth.user,
          },
          options.output,
        )
      },
    )
}
