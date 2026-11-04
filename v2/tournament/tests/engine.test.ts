import { assert, assertEquals, assertThrows } from '@std/assert'
import { MockBackend } from '../src/backend/mock.ts'
import { writeJSON } from '../src/cli.ts'
import { derive, DriftError, scenarioTag } from '../src/engine.ts'
import { generateMockRoster } from '../src/mock/generate.ts'
import { loadTournamentDir } from '../src/roster.ts'
import { simulateToEnd } from '../src/simulate.ts'
import type { ScenarioID, Withdrawal } from '../src/types.ts'

async function setup(
  tournament: string,
  scenarioID: ScenarioID,
  withdrawals: Withdrawal[] = [],
) {
  const tmp = await Deno.makeTempDir()
  const backend = await MockBackend.open(`${tmp}/server.json`, { create: true })
  backend.data.failRate = 0.05
  const { roster } = await generateMockRoster(backend, {
    scenarioID,
    tournament,
    seed: 'test',
    Q: 40,
    K: 6,
    E: 8,
    R: 4,
    koSize: 8,
  })
  const dir = `${tmp}/${scenarioID}`
  await Deno.mkdir(dir)
  await writeJSON(`${dir}/roster.json`, roster)
  if (withdrawals.length) await writeJSON(`${dir}/withdrawals.json`, withdrawals)
  return { tmp, dir, backend }
}

async function stateOf(dir: string, backend: MockBackend) {
  const t = await loadTournamentDir(dir)
  const matches = await backend.query([scenarioTag(t.roster)])
  return { t, matches, state: derive({ ...t, matches }) }
}

for (const scenarioID of ['shangyang-court', 'fengyiting-real'] as const) {
  Deno.test(`${scenarioID}: a small mock tournament plays to a champion`, async () => {
    const { tmp, dir, backend } = await setup('t1', scenarioID)
    const { champion } = await simulateToEnd(dir, backend)
    assert(champion)
    const { state } = await stateOf(dir, backend)
    assert(state.done)
    assertEquals(state.prelim.groups.length, 8)
    assertEquals(state.prelim.advancers?.length, 8)
    assertEquals(state.swiss.seeds?.length, 14)
    assertEquals(state.swiss.rounds.length, 4)
    assertEquals(state.ko.rounds.length, 3)
    assertEquals(state.ko.champion, champion)
    // No Swiss pairing repeats.
    const met = new Set<string>()
    for (const pair of state.pairs.values()) {
      if (pair.stage !== 'swiss') continue
      const k = [pair.p, pair.q].sort().join('|')
      assert(!met.has(k), `repeat ${k}`)
      met.add(k)
    }
    // The 8 KO seeds are the top 8 of the final Swiss table.
    assertEquals(state.ko.seeds, state.swiss.final!.slice(0, 8).map((s) => s.id))
    await Deno.remove(tmp, { recursive: true })
  })
}

Deno.test('derive is deterministic, and a changed input after submission is drift', async () => {
  const { tmp, dir, backend } = await setup('t2', 'trolley-problem')
  await simulateToEnd(dir, backend)
  const { t, matches, state } = await stateOf(dir, backend)
  const again = derive({ ...t, matches })
  assertEquals([...again.pairs.keys()], [...state.pairs.keys()])
  assertEquals(again.ko.champion, state.ko.champion)
  // Withdrawing a Swiss player from round 1 after the fact changes every
  // Swiss pairing the server already holds.
  const swissPlayer = state.swiss.seeds![0]
  assertThrows(
    () =>
      derive({
        ...t,
        matches,
        withdrawals: [{ player: swissPlayer, stage: 'swiss', round: 1, reason: 'test' }],
      }),
    DriftError,
  )
  await Deno.remove(tmp, { recursive: true })
})

Deno.test('a withdrawal before the 海选 is a walkover, and the player never plays', async () => {
  const probe = await setup('t3', 'honnoji-decision')
  const { state: fresh } = await stateOf(probe.dir, probe.backend)
  // Group seed 4 of 5 plays round 1 (seeds 1–3 have byes).
  const victim = fresh.prelim.groups[0].players[3]
  await Deno.remove(probe.tmp, { recursive: true })

  const { tmp, dir, backend } = await setup('t3', 'honnoji-decision', [
    { player: victim, stage: 'prelim', round: 1, reason: 'test' },
  ])
  await simulateToEnd(dir, backend)
  const { state } = await stateOf(dir, backend)
  const theirs = [...state.pairs.values()].filter((p) => p.p === victim || p.q === victim)
  assertEquals(theirs.length, 1)
  assertEquals(theirs[0].decidedBy, 'walkover')
  assertEquals(theirs[0].games.length, 0)
  assert(!state.swiss.seeds!.includes(victim))
  await Deno.remove(tmp, { recursive: true })
})
