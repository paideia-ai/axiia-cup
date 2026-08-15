import { describe, expect, it } from 'vitest'

import type { TurnDTO } from '../api/types'
import {
  deriveScoreBreakdown,
  formatScoringReasoning,
} from './scoring-reasoning'

function event(seq: number, payload: TurnDTO['event']): TurnDTO {
  return {
    seq,
    channel: '*',
    kind: 'event',
    speaker: 'game',
    finalText: '',
    event: payload,
  }
}

describe('v3.4 #69 scoring derivation', () => {
  it('combines the latest score event with request rulings', () => {
    const result = deriveScoreBreakdown([
      event(0, {
        type: 'score',
        trueRequests: { a: '赔偿' },
        guesses: { a: 2, b: '和解' },
        scoreA: 7,
        scoreB: 4,
      }),
      event(1, { type: 'verdict', requests: { a: '成立', b: '驳回' } }),
    ])

    expect(result).toEqual({
      trueRequests: { a: '赔偿' },
      guesses: { a: '2', b: '和解' },
      rulings: { a: '成立', b: '驳回' },
      scoreA: 7,
      scoreB: 4,
    })
  })

  it('returns null without structured scoring evidence', () => {
    expect(deriveScoreBreakdown([event(0, { type: 'phase', title: '开场' })]))
      .toBeNull()
  })

  it('removes only the legacy programmatic heading', () => {
    expect(formatScoringReasoning(' 程序化计分明细：\nA +2\nB +1'))
      .toBe('A +2\nB +1')
    expect(formatScoringReasoning('裁判说明：A +2')).toBe('裁判说明：A +2')
  })
})
