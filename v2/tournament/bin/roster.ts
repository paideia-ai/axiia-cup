// Build or validate a locked roster.
//
//   deno task roster build --entries entries.json --scenario <id> \
//     --tournament <T> --seed <public seed> --out <dir> [--K 100 --E 256 --R 9]
//   deno task roster validate <dir> [--online]
//
// build fetches both versions of every entry from the versions endpoint,
// checks scenario, side and account, counts prompt tokens with tiktoken
// cl100k_base (encode_ordinary) and writes <dir>/roster.json.
// validate checks the roster's structure; --online also re-fetches every
// version and checks the prompts still match the locked counts and hashes.
// Either takes --mock <file> instead of AXIIA_BASE_URL.

import { parseArgs } from '@std/cli/parse-args'
import { die, openBackend, readJSON, writeJSON } from '../src/cli.ts'
import {
  buildRoster,
  type Entry,
  loadTournamentDir,
  RosterError,
  verifyRosterAgainst,
} from '../src/roster.ts'
import { isScenarioID } from '../src/types.ts'

const flags = parseArgs(Deno.args, {
  string: ['mock', 'entries', 'scenario', 'tournament', 'seed', 'out', 'K', 'E', 'R', 'ko-size'],
  boolean: ['online'],
})
const [command, dir] = flags._.map(String)

const int = (v: string | undefined) => (v === undefined ? undefined : Number.parseInt(v, 10))

if (command === 'build') {
  if (!flags.entries || !flags.tournament || !flags.seed || !flags.out) {
    die('build needs --entries, --scenario, --tournament, --seed and --out')
  }
  if (!isScenarioID(flags.scenario)) die(`unknown --scenario ${flags.scenario}`)
  const backend = await openBackend(flags.mock, { tick: false })
  try {
    const entries = await readJSON<Entry[]>(flags.entries)
    const config = Object.fromEntries(
      Object.entries({
        K: int(flags.K),
        E: int(flags.E),
        R: int(flags.R),
        koSize: int(flags['ko-size']),
      }).filter(([, v]) => v !== undefined),
    )
    const roster = await buildRoster({
      entries,
      scenarioID: flags.scenario,
      tournament: flags.tournament,
      seed: flags.seed,
      config,
      backend,
    })
    await Deno.mkdir(flags.out, { recursive: true })
    await writeJSON(`${flags.out}/roster.json`, roster)
    const direct = roster.players.filter((p) => p.direct).length
    console.log(
      `${flags.out}/roster.json: ${roster.players.length} players, ${direct} direct, ` +
        `${roster.players.length - direct} in 海选`,
    )
  } catch (error) {
    if (error instanceof RosterError) die(error.message)
    throw error
  }
} else if (command === 'validate') {
  if (!dir) die('validate <dir>')
  try {
    const t = await loadTournamentDir(dir)
    if (flags.online) {
      const backend = await openBackend(flags.mock)
      const problems = await verifyRosterAgainst(t.roster, backend)
      if (problems.length) die(`roster drifted from the server:\n  ${problems.join('\n  ')}`)
    }
    console.log(`${dir}/roster.json: valid (${t.roster.players.length} players)`)
  } catch (error) {
    if (error instanceof RosterError) die(error.message)
    throw error
  }
} else {
  die('usage: roster build … | roster validate <dir> [--online]')
}
