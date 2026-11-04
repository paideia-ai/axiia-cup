// Report on one or more tournaments (one directory per scenario).
//
//   deno task report <dir>... [--mock <server.json>] [--out report.html]
//     [--json report.json] [--pairs] [--quiet]
//
// Prints standings and the bracket (--pairs: every pair and how it was
// decided), and writes a standalone HTML view (no
// build step, works from file://) with the report data embedded. With
// --mock, the latent truth goes into the report as well.

import { parseArgs } from '@std/cli/parse-args'
import type { MockBackend } from '../src/backend/mock.ts'
import { die, openBackend, writeJSON } from '../src/cli.ts'
import { derive, scenarioTag } from '../src/engine.ts'
import { buildReport, mockTruth, type ScenarioReport } from '../src/report.ts'
import { loadTournamentDir } from '../src/roster.ts'
import { renderHTML } from '../src/html.ts'
import { printReport } from '../src/text.ts'

const flags = parseArgs(Deno.args, { string: ['mock', 'out', 'json'], boolean: ['quiet', 'pairs'] })
const dirs = flags._.map(String)
if (dirs.length === 0) die('usage: report <dir>... [--mock <file>] [--out report.html] [--json f]')

// Reading only: do not play queued mock games.
const backend = await openBackend(flags.mock, { tick: false })
const reports: ScenarioReport[] = []
for (const dir of dirs) {
  const t = await loadTournamentDir(dir)
  const matches = await backend.query([scenarioTag(t.roster)])
  const state = derive({
    roster: t.roster,
    matches,
    rulings: t.rulings,
    withdrawals: t.withdrawals,
  })
  const truth = backend.mode === 'mock'
    ? mockTruth(t, (id) => (backend as MockBackend).version(id))
    : undefined
  const report = buildReport(t, state, backend.mode, truth)
  reports.push(report)
  if (!flags.quiet) printReport(report, { pairs: flags.pairs })
}
await backend.close()
if (flags.json) await writeJSON(flags.json, reports)
if (flags.out) {
  await Deno.writeTextFile(flags.out, await renderHTML(reports))
  console.log(`wrote ${flags.out}`)
}
