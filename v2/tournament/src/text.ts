// Plain-text report for the terminal.

import type { PairRow, ScenarioReport } from './report.ts'

const BY_LABEL: Record<string, string> = {
  games: '2-0',
  primary: 'primary',
  secondary: 'secondary (tokens)',
  ruling: '组委会 ruling',
  draw: 'drawn (primary even)',
  walkover: 'walkover',
  bye: 'bye',
}

export function describePair(p: PairRow): string {
  const w = p.winner === 'p' ? p.p : p.winner === 'q' ? p.q : p.winner ?? '—'
  const games = p.games.map((g) => {
    const [slot, , status, winner, a, b, scheme] = g
    if (status !== 'finished') return `${slot}:${status}`
    return `${slot}:${winner}${a !== null ? ` ${a}:${b}` : ''}${scheme ? ` ${scheme}` : ''}`
  }).join(' ')
  const prim = p.primaryP !== undefined &&
      (p.by === 'primary' || p.by === 'draw' || p.by === 'secondary' || p.by === 'ruling')
    ? ` primary ${p.primaryP}:${p.primaryQ}`
    : ''
  const tok = p.by === 'secondary' || p.by === 'ruling' ? ` tokens ${p.tokensP}:${p.tokensQ}` : ''
  return `${p.id.padEnd(22)} ${p.p} vs ${p.q}  ${
    p.status === 'decided' ? `→ ${w} by ${BY_LABEL[p.by!] ?? p.by}` : p.status
  }` +
    `  [${p.winsP}-${p.winsQ}${prim}${tok}] ${games}${p.note ? `  (${p.note})` : ''}`
}

export function printReport(r: ScenarioReport, opts: { pairs?: boolean; top?: number } = {}) {
  const log = console.log
  log(`\n=== ${r.tournament}/${r.scenarioID} (${r.mode}) ===`)
  log(
    `entrants ${r.counts.entrants}: 海选 ${r.counts.Q} → ${r.counts.E} advance; ` +
      `direct ${r.counts.K}; Swiss ${r.counts.N}; knockout ${r.counts.ko}`,
  )
  log(
    r.done
      ? `complete — champion ${r.ko.champion}`
      : `at ${r.frontier?.stage} round ${r.frontier?.round}`,
  )
  if (r.blocked) log(`blocked: ${r.blocked}`)
  for (const stage of ['prelim', 'swiss', 'ko'] as const) {
    const counts = Object.entries(r.decided[stage]).filter(([, n]) => n)
      .map(([k, n]) => `${BY_LABEL[k] ?? k} ${n}`).join(', ')
    if (counts) log(`  ${stage}: ${counts}`)
  }
  const last = r.swiss.rounds.findLast((x) => x.standings.length)
  if (last) {
    const names = new Map(r.players.map((p) => [p.id, p]))
    log(`\nSwiss standings after round ${last.round} (top ${opts.top ?? 70}):`)
    log('  rank  player            pts   BH    SB   wins tokens  W-D-L')
    for (const s of last.standings.slice(0, opts.top ?? 70)) {
      const [id, score, bh, sb, wins, rank, tie, record] = s
      const p = names.get(id)!
      log(
        `  ${String(rank).padStart(4)}  ${`${id} ${p.name ?? ''}`.padEnd(16)} ${
          String(score).padStart(4)
        } ${String(bh).padStart(5)} ${String(sb).padStart(5)} ${String(wins).padStart(4)} ${
          String(p.tokensA + p.tokensB).padStart(6)
        }  ${record}${tie ? ` (${tie} tie)` : ''}`,
      )
    }
  }
  if (r.ko.rounds.length) {
    log('\nKnockout:')
    r.ko.rounds.forEach((round, i) => {
      log(
        `  round ${i + 1}: ` +
          round.map(([p, q, , w]) => `${p ?? 'bye'}-${q ?? 'bye'}${w ? `→${w}` : ''}`).join('  '),
      )
    })
  }
  if (opts.pairs) {
    log('\nPairs:')
    for (const p of r.pairs) log('  ' + describePair(p))
  }
}
