// The full mock demo: all four scenarios at the defaults (Q 2048, K 100,
// E 256, R 9), played to the end, one HTML report.
//
//   deno task demo [--out-dir demo] [--Q 2048 --K 100 --E 256 --R 9]
//
// Starts from an empty mock server each time.

import { parseArgs } from '@std/cli/parse-args'
import { MockBackend } from '../src/backend/mock.ts'
import { writeJSON } from '../src/cli.ts'
import { derive, scenarioTag } from '../src/engine.ts'
import { renderHTML } from '../src/html.ts'
import { generateMockRoster } from '../src/mock/generate.ts'
import { buildReport, mockTruth } from '../src/report.ts'
import { loadTournamentDir } from '../src/roster.ts'
import { simulateToEnd } from '../src/simulate.ts'
import { printReport } from '../src/text.ts'
import { SCENARIOS } from '../src/types.ts'

const flags = parseArgs(Deno.args, {
  string: ['mock', 'out-dir', 'Q', 'K', 'E', 'R', 'seed', 'fail-rate'],
})
const out = flags['out-dir'] ?? 'demo'
const num = (v: string | undefined, d: number) => (v === undefined ? d : Number(v))
await Deno.mkdir(out, { recursive: true })
const serverPath = `${out}/server.json`
await Deno.remove(serverPath).catch(() => {})
const backend = await MockBackend.open(serverPath, { create: true })
backend.data.failRate = num(flags['fail-rate'], 0.01)

const reports = []
for (const scenarioID of SCENARIOS) {
  const dir = `${out}/${scenarioID}`
  await Deno.mkdir(dir, { recursive: true })
  await Deno.remove(`${dir}/rulings.json`).catch(() => {})
  const { entries, roster } = await generateMockRoster(backend, {
    scenarioID,
    tournament: 'mock-cup',
    seed: flags.seed ?? 'mock-1',
    Q: num(flags.Q, 2048),
    K: num(flags.K, 100),
    E: num(flags.E, 256),
    R: num(flags.R, 9),
  })
  await writeJSON(`${dir}/entries.json`, entries)
  await writeJSON(`${dir}/roster.json`, roster)
  const { champion, steps } = await simulateToEnd(dir, backend)
  console.log(`${scenarioID}: champion ${champion} after ${steps} next steps`)
  const t = await loadTournamentDir(dir)
  const state = derive({
    roster: t.roster,
    matches: await backend.query([scenarioTag(t.roster)]),
    rulings: t.rulings,
    withdrawals: t.withdrawals,
  })
  const report = buildReport(t, state, 'mock', mockTruth(t, (id) => backend.version(id)))
  printReport(report, { top: 10 })
  reports.push(report)
}
await backend.close()
await Deno.writeTextFile(`${out}/report.html`, await renderHTML(reports))
console.log(`wrote ${out}/report.html`)
