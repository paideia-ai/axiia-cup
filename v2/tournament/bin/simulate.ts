// Play mock tournaments to the end (see src/simulate.ts).
//
//   deno task simulate --mock demo/server.json <dir>... [--verbose]

import { parseArgs } from '@std/cli/parse-args'
import { MockBackend } from '../src/backend/mock.ts'
import { die } from '../src/cli.ts'
import { simulateToEnd } from '../src/simulate.ts'

const flags = parseArgs(Deno.args, { string: ['mock'], boolean: ['verbose'] })
const dirs = flags._.map(String)
if (!flags.mock || dirs.length === 0) die('usage: simulate --mock <server.json> <dir>...')

const backend = await MockBackend.open(flags.mock)
try {
  for (const dir of dirs) {
    const { champion, steps } = await simulateToEnd(
      dir,
      backend,
      flags.verbose ? console.log : undefined,
    )
    console.log(`${dir}: champion ${champion} after ${steps} next steps`)
  }
} finally {
  await backend.close()
}
