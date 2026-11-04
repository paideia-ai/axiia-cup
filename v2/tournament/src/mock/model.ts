// Mock strength model. Each player has four latent numbers: side skills a, b
// (correlated through one talent, since one person writes both prompts) and
// a 2-D style w. The logit of a game, P's A agent against Q's B agent, is
//
//   ℓ = a_P − b_Q + β_scenario + κ · (w_P × w_Q)
//
// where × is the 2-D cross product (the antisymmetric form [[0,1],[−1,0]]).
// The scalar part makes some players genuinely stronger; the cross term adds
// rock-paper-scissors counters (style θ beats style θ + 90°), small next to
// the skill spread. Talent is heavy-tailed: most entrants are mediocre, a few
// are strong. Calibrated so that adjacent players are a coin flip and the
// strongest of ~2000 beats the median about 85% of games.

import { normal, type Random, random } from '../rng.ts'
import type { ScenarioID } from '../types.ts'
import { SCHEME_ABANDON, SCHEME_CONTINUE } from '../outcome.ts'

export interface Latent {
  talent: number
  a: number
  b: number
  w: [number, number]
}

export const KAPPA = 0.3

export const BETA: Record<ScenarioID, number> = {
  'shangyang-court': 0.15,
  'honnoji-decision': -0.1,
  'trolley-problem': 0.25,
  'fengyiting-real': -0.05,
}

export function drawLatent(r: Random): Latent {
  const expo = -Math.log(1 - r())
  const talent = 0.26 * (expo - 1) + 0.2 * normal(r)
  const theta = 2 * Math.PI * r()
  const rho = 0.6 + 0.4 * r()
  return {
    talent,
    a: talent + 0.15 * normal(r),
    b: talent + 0.15 * normal(r),
    w: [rho * Math.cos(theta), rho * Math.sin(theta)],
  }
}

// Expected side-neutral strength: what the truth panel ranks by.
export function strength(l: Latent): number {
  return (l.a + l.b) / 2
}

// Prompt tokens per side: lognormal (median ~700), weakly correlated with
// talent.
export function drawTokens(r: Random, talent: number): number {
  return Math.max(20, Math.round(Math.exp(6.55 + 0.55 * normal(r) + 0.2 * talent)))
}

// Ladder score: talent seen through a noisy ladder.
export function ladderScore(r: Random, talent: number): number {
  return talent + 0.2 * normal(r)
}

export function logit(
  scenario: ScenarioID,
  aSide: { skill: number; w: [number, number] },
  bSide: { skill: number; w: [number, number] },
): number {
  const cross = aSide.w[0] * bSide.w[1] - aSide.w[1] * bSide.w[0]
  return aSide.skill - bSide.skill + BETA[scenario] + KAPPA * cross
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const quarter = (x: number) => Math.round(x * 4) / 4

const SCORE_SHAPE: Partial<Record<ScenarioID, { mean: number; sd: number }>> = {
  'shangyang-court': { mean: 1.5, sd: 1.1 },
  'honnoji-decision': { mean: 2, sd: 1.5 },
}

export interface MockGame {
  winner: 'a' | 'b'
  scoreA: number
  scoreB: number
  facts?: Record<string, unknown>
}

export function playGame(scenario: ScenarioID, l: number, r: Random): MockGame {
  switch (scenario) {
    case 'shangyang-court':
    case 'honnoji-decision': {
      // Raw scores on the 0.25 grid; the higher score wins, a tie goes to
      // the side the judge backed for its big goal.
      const { mean, sd } = SCORE_SHAPE[scenario]!
      const shift = 0.42 * l * sd
      const scoreA = quarter(mean + shift + sd * normal(r))
      const scoreB = quarter(mean - shift + sd * normal(r))
      const winner = scoreA > scoreB ? 'a' : scoreA < scoreB ? 'b' : r() < sigmoid(l) ? 'a' : 'b'
      return { winner, scoreA, scoreB }
    }
    case 'trolley-problem': {
      let scoreA = 0
      for (let i = 0; i < 3; i++) if (r() < sigmoid(0.65 * l)) scoreA++
      return { winner: scoreA >= 2 ? 'a' : 'b', scoreA, scoreB: 3 - scoreA }
    }
    case 'fengyiting-real': {
      const winner = r() < sigmoid(l) ? 'a' : 'b'
      const margin = winner === 'a' ? l : -l
      const scheme = r() < sigmoid(-0.4 + 1.2 * margin) ? SCHEME_ABANDON : SCHEME_CONTINUE
      return {
        winner,
        scoreA: winner === 'a' ? 1 : 0,
        scoreB: winner === 'b' ? 1 : 0,
        facts: { scheme },
      }
    }
  }
}

const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'
const GIVEN = '子文明华德云飞清远思安宁博雅俊杰嘉怡欣然若溪晨曦天佑浩宇'

export function mockName(seed: string): string {
  const r = random(seed)
  const pick = (s: string) => s[Math.floor(r() * s.length)]
  return pick(SURNAMES) + pick(GIVEN) + (r() < 0.6 ? pick(GIVEN) : '')
}
