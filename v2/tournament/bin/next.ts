// Advance a tournament.
//
//   deno task next <dir> [--mock <server.json>] [--retry] [--dry-run]
//                  [--max-in-flight N] [--watch [--interval S] [--max-attempts N]]
//
// One step reads the scenario's matches by tag, reports pending and failed
// games and pairs waiting for a 组委会 ruling, and submits the games the
// current round still lacks — so the next round's pairs go out as soon as a
// round settles. The server has no concurrency cap: a step keeps at most
// --max-in-flight games (AXIIA_MAX_IN_FLIGHT, default 50; the mock ignores
// it) queued or running and tops up on the next step. --retry resubmits
// failed games under the next #retryN key. Every step is idempotent.
//
// --watch repeats the step every --interval seconds (default 30) until the
// champion is known or nothing can move without the operator: a ruling, a
// withdrawal, or failed games past --max-attempts (default 3) or without
// --retry.

import { parseArgs } from '@std/cli/parse-args'
import { MockBackend } from '../src/backend/mock.ts'
import { die, openBackend } from '../src/cli.ts'
import { DriftError } from '../src/engine.ts'
import { runNext } from '../src/next.ts'
import { loadTournamentDir } from '../src/roster.ts'

const flags = parseArgs(Deno.args, {
  string: ['mock', 'max-in-flight', 'interval', 'max-attempts'],
  boolean: ['retry', 'dry-run', 'watch'],
})
const dir = flags._[0]
if (dir === undefined) {
  die(
    'usage: next <dir> [--mock <file>] [--retry] [--dry-run] [--max-in-flight N] ' +
      '[--watch [--interval S] [--max-attempts N]]',
  )
}
const num = (name: string, value: string | undefined): number | undefined => {
  if (value === undefined) return undefined
  const n = Number(value)
  if (!(n > 0)) die(`--${name} must be a positive number`)
  return n
}
const maxInFlight = num('max-in-flight', flags['max-in-flight'])
if (maxInFlight !== undefined && !Number.isInteger(maxInFlight)) {
  die('--max-in-flight must be an integer')
}
const interval = num('interval', flags.interval) ?? 30
const maxAttempts = num('max-attempts', flags['max-attempts']) ?? (flags.watch ? 3 : Infinity)

const backend = await openBackend(flags.mock, { maxInFlight })
try {
  for (let step = 1;; step++) {
    // Reloaded each step so a ruling or withdrawal added meanwhile counts.
    const t = await loadTournamentDir(String(dir))
    if (flags.watch) console.log(`[${new Date().toISOString()}] step ${step}`)
    const { state, submitted, heldBack } = await runNext(t, backend, {
      retry: flags.retry,
      dryRun: flags['dry-run'],
      maxAttempts,
    })
    if (!flags.watch || flags['dry-run'] || state.done) break
    if (submitted.length === 0 && state.pendingGames === 0 && heldBack === 0) {
      console.log('  nothing in flight and nothing to submit: operator action needed')
      break
    }
    if (backend instanceof MockBackend) {
      backend.tick()
      await backend.close()
    } else {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000))
    }
  }
} catch (error) {
  if (error instanceof DriftError) die(`pairing drift: ${error.message}`)
  throw error
} finally {
  await backend.close()
}
