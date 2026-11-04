// Play a mock tournament to the end: `next --retry` against the mock server,
// let the mock play the queued games, repeat. Whenever a pair or a full
// Swiss tie waits for the 组委会, a mock ruling (a seeded coin flip, marked
// as such) goes into the directory's rulings.json, the way an operator would
// add one.

import type { MockBackend } from './backend/mock.ts'
import { writeJSON } from './cli.ts'
import { runNext } from './next.ts'
import { random, shuffle } from './rng.ts'
import { loadTournamentDir } from './roster.ts'

export async function simulateToEnd(
  dir: string,
  backend: MockBackend,
  log: (line: string) => void = () => {},
): Promise<{ champion: string | null | undefined; steps: number }> {
  for (let step = 1;; step++) {
    const t = await loadTournamentDir(dir)
    const { state, submitted } = await runNext(t, backend, { retry: true, log })
    if (state.done) return { champion: state.ko.champion, steps: step }
    let ruled = false
    const at = new Date().toISOString()
    for (const id of state.awaitingRuling) {
      const pair = state.pairs.get(id)!
      const r = random(`${t.roster.seed}/mock-ruling/${id}`)
      t.rulings.pairs ??= {}
      t.rulings.pairs[id] = {
        winner: r() < 0.5 ? pair.p : pair.q,
        reason: `mock 组委会: coin flip (${pair.note ?? 'tied'})`,
        by: 'mock',
        at,
      }
      ruled = true
    }
    if (state.blocked && state.swiss.final) {
      const groups = new Map<number, string[]>()
      for (const s of state.swiss.final) {
        if (s.tie === 'unresolved') groups.set(s.rank, [...(groups.get(s.rank) ?? []), s.id])
      }
      t.rulings.standings ??= []
      for (const [rank, ids] of groups) {
        t.rulings.standings.push({
          players: shuffle(ids, `${t.roster.seed}/mock-standings/${rank}`),
          reason: `mock 组委会: lottery for the full tie at rank ${rank}`,
          by: 'mock',
          at,
        })
      }
      ruled = groups.size > 0
    }
    if (ruled) {
      await writeJSON(`${dir}/rulings.json`, t.rulings)
      continue
    }
    if (submitted.length === 0 && state.pendingGames === 0) {
      throw new Error(`${dir}: stuck at ${state.frontier?.stage} r${state.frontier?.round}`)
    }
    backend.tick()
  }
}
