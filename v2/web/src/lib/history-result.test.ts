import { describe, expect, it } from 'vitest'
import type { MatchSummary } from '../api/types'
import { historyResult } from './history-result'

const names = { a: '商鞅', b: '甘龙' }
const base: MatchSummary = {
  id: 1,
  scenarioID: 'shangyang-court',
  scenarioTitle: '商鞅庭辩',
  kind: 'pvp',
  dispatched: true,
  finished: true,
  scored: true,
  winner: 'a',
}
const owned = (a: boolean, b: boolean) => ({
  a: { isMine: a },
  b: { isMine: b },
})

describe('history result', () => {
  it.each(
    [
      [true, false, 'a', '你（商鞅） 胜', 'win'],
      [true, false, 'b', '你（商鞅） 负', 'loss'],
      [false, true, 'a', '你（甘龙） 负', 'loss'],
      [false, true, 'b', '你（甘龙） 胜', 'win'],
      [false, false, 'a', '商鞅 胜', 'neutral'],
      [false, false, 'b', '甘龙 胜', 'neutral'],
      [true, true, 'a', '左右互搏', 'neutral'],
      [true, true, 'draw', '左右互搏', 'neutral'],
      [true, false, 'draw', '平局', 'neutral'],
      [false, false, 'draw', '平局', 'neutral'],
    ] as const,
  )('uses viewer ownership (%s, %s) with %s', (a, b, winner, label, tone) => {
    expect(historyResult({ ...base, winner, participants: owned(a, b) }, names))
      .toMatchObject({ label, tone, ...(winner === 'draw' ? {} : { winner }) })
  })
  it.each([undefined, null, '', 'unknown', 'A', 'tie'])(
    'rejects missing or unknown winner %s even for self-play',
    (winner) => {
      for (
        const participants of [undefined, owned(true, false), owned(true, true)]
      ) {
        expect(historyResult({ ...base, winner, participants }, names))
          .toEqual({ label: '对局异常', tone: 'error' })
      }
    },
  )
  it.each(
    [
      [false, false, false, '排队中'],
      [true, false, false, '进行中'],
      [true, true, false, '未计分'],
    ] as const,
  )(
    'does not interpret unfinished/unscored results',
    (dispatched, finished, scored, label) => {
      for (const winner of [null, 'a', 'unknown']) {
        expect(
          historyResult(
            { ...base, dispatched, finished, scored, winner },
            names,
          ),
        )
          .toEqual({ label, tone: 'pending' })
      }
    },
  )
  it('does not infer ownership from initiator or fabricate missing participants', () => {
    expect(historyResult({ ...base, initiatorIsMe: true }, names))
      .toMatchObject({ label: '商鞅 胜', tone: 'neutral' })
    expect(
      historyResult({
        ...base,
        participants: {} as MatchSummary['participants'],
      }, names),
    )
      .toMatchObject({ label: '商鞅 胜', tone: 'neutral' })
  })
})
