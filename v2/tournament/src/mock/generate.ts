// Mock roster generator: Q 海选 entrants plus K ladder-direct players, with
// latent truth registered as agent versions on the mock server. The roster
// itself is then built through the same buildRoster path as a real event
// (versions endpoint → validation → tiktoken counts).

import type { MockBackend } from '../backend/mock.ts'
import { random, shuffle } from '../rng.ts'
import { buildRoster, type Entry } from '../roster.ts'
import type { Roster, ScenarioID } from '../types.ts'
import { drawLatent, drawTokens, ladderScore, mockName } from './model.ts'

export interface MockRosterOptions {
  scenarioID: ScenarioID
  tournament: string
  seed: string
  Q: number
  K: number
  E: number
  R: number
  koSize?: number
  // Share of all entrants with a ladder rank (at least K are ranked).
  rankedShare?: number
}

export async function generateMockRoster(
  backend: MockBackend,
  opts: MockRosterOptions,
): Promise<{ entries: Entry[]; roster: Roster }> {
  const total = opts.Q + opts.K
  const r = random(`${opts.seed}/${opts.scenarioID}/population`)
  const people = Array.from({ length: total }, (_, i) => {
    const latent = drawLatent(r)
    return {
      id: `p${String(i + 1).padStart(4, '0')}`,
      name: mockName(`${opts.seed}/${opts.scenarioID}/name/${i}`),
      latent,
      tokensA: drawTokens(r, latent.talent),
      tokensB: drawTokens(r, latent.talent),
      ladder: ladderScore(r, latent.talent),
    }
  })
  const rankedCount = Math.min(
    total,
    Math.max(opts.K, Math.round((opts.rankedShare ?? 0.35) * total)),
  )
  const ranked = shuffle(people, `${opts.seed}/${opts.scenarioID}/ranked`)
    .slice(0, rankedCount)
    .sort((x, y) => y.ladder - x.ladder)
  const rankOf = new Map(ranked.map((p, i) => [p.id, i + 1]))

  const entries: Entry[] = people.map((p) => {
    const accountID = backend.newAccountID()
    const truth = { player: p.id, name: p.name, talent: p.latent.talent, w: p.latent.w }
    const a = backend.addVersion({
      agentID: accountID * 10 + 1,
      accountID,
      scenarioID: opts.scenarioID,
      side: 'a',
      tokens: p.tokensA,
      truth: { ...truth, skill: p.latent.a },
    })
    const b = backend.addVersion({
      agentID: accountID * 10 + 2,
      accountID,
      scenarioID: opts.scenarioID,
      side: 'b',
      tokens: p.tokensB,
      truth: { ...truth, skill: p.latent.b },
    })
    return {
      player: p.id,
      name: p.name,
      a: a.versionID,
      b: b.versionID,
      ladderRank: rankOf.get(p.id) ?? null,
    }
  })

  const roster = await buildRoster({
    entries,
    scenarioID: opts.scenarioID,
    tournament: opts.tournament,
    seed: `${opts.seed}/${opts.scenarioID}`,
    config: { K: opts.K, E: opts.E, R: opts.R, koSize: opts.koSize ?? 64 },
    backend,
  })
  return { entries, roster }
}
