// Generate a mock tournament: entrants with latent truth registered as agent
// versions on a mock server file, then a roster built through the same path
// as a real one.
//
//   deno task mock-roster --mock demo/server.json --scenario shangyang-court \
//     --out demo/shangyang-court [--Q 2048 --K 100 --E 256 --R 9] \
//     [--tournament mock-cup --seed mock-1 --fail-rate 0.01]
//
// The server file is created if missing and can hold several scenarios.

import { parseArgs } from '@std/cli/parse-args'
import { MockBackend } from '../src/backend/mock.ts'
import { die, writeJSON } from '../src/cli.ts'
import { generateMockRoster } from '../src/mock/generate.ts'
import { isScenarioID } from '../src/types.ts'

const flags = parseArgs(Deno.args, {
  string: [
    'mock',
    'scenario',
    'out',
    'Q',
    'K',
    'E',
    'R',
    'ko-size',
    'tournament',
    'seed',
    'fail-rate',
  ],
})
if (!flags.mock || !flags.out) die('needs --mock <server.json> and --out <dir>')
if (!isScenarioID(flags.scenario)) die(`unknown --scenario ${flags.scenario}`)
const num = (v: string | undefined, d: number) => (v === undefined ? d : Number(v))

const backend = await MockBackend.open(flags.mock, { create: true, tick: false })
if (flags['fail-rate'] !== undefined) backend.data.failRate = Number(flags['fail-rate'])
const { entries, roster } = await generateMockRoster(backend, {
  scenarioID: flags.scenario,
  tournament: flags.tournament ?? 'mock-cup',
  seed: flags.seed ?? 'mock-1',
  Q: num(flags.Q, 2048),
  K: num(flags.K, 100),
  E: num(flags.E, 256),
  R: num(flags.R, 9),
  koSize: num(flags['ko-size'], 64),
})
await Deno.mkdir(flags.out, { recursive: true })
await writeJSON(`${flags.out}/entries.json`, entries)
await writeJSON(`${flags.out}/roster.json`, roster)
await backend.close()
console.log(
  `${flags.out}: ${roster.players.length} players (${
    roster.players.filter((p) => p.direct).length
  } direct); truth in ${flags.mock}`,
)
