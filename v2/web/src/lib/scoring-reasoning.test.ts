import { describe, expect, it } from 'vitest'

import type { TurnDTO } from '../api/types'
import {
  deriveScoreBreakdown,
  formatScoringReasoning,
  parseLedger,
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
      // 合成夹具：rulings 里查不到真请求 id → achieved 无证据；两侧键成
      // 对，b 的猜测没有命中 a 的真目标。
      achieved: null,
      identified: { a: false },
    })
  })

  it('derives 达成/被识破 from a shangyang-shaped match', () => {
    const result = deriveScoreBreakdown([
      event(0, {
        type: 'verdict',
        requests: { SR1: '不同意', SR2: '同意', GR1: '同意', GR2: '不同意' },
      }),
      event(1, {
        type: 'score',
        trueRequests: { a: 'SR2', b: 'GR2' },
        guesses: { a: 'GR1', b: 'SR2' },
        scoreA: 0.5,
        scoreB: -0.25,
      }),
    ])

    expect(result?.achieved).toEqual({ a: true, b: false })
    expect(result?.identified).toEqual({ a: true, b: false })
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

describe('F2 #69 得分账解析（parseLedger）', () => {
  const shangyang = {
    slotID: 'shangyang-court',
    lanes: { a: '商鞅', b: '甘龙', judge: '裁判', game: '系统' },
  }

  it('parses the real shangyang ledger lines into sided items', () => {
    const parsed = parseLedger(
      [
        '程序化计分明细：',
        '真目标：商鞅 = SR2，甘龙 = GR2',
        '问询：商鞅猜 GR1，甘龙猜 SR2',
        '商鞅 +1：秦孝公决意推行变法，大政方针达成',
        '商鞅 +0.5：真请求 SR2 获准',
        '甘龙 -0.25：假请求 GR1 获准',
        '商鞅 -1：真目标 SR2 被甘龙识破',
        'scoreA = 0.5, scoreB = -0.25',
      ].join('\n'),
      shangyang,
    )

    expect(parsed.items).toEqual([
      {
        name: '商鞅',
        side: 'a',
        delta: 1,
        why: '秦孝公决意推行变法，大政方针达成',
        kind: 'main',
      },
      {
        name: '商鞅',
        side: 'a',
        delta: 0.5,
        why: '真请求 SR2 获准',
        kind: 'trueApproved',
      },
      {
        name: '甘龙',
        side: 'b',
        delta: -0.25,
        why: '假请求 GR1 获准',
        kind: 'fakeApproved',
      },
      {
        name: '商鞅',
        side: 'a',
        delta: -1,
        why: '真目标 SR2 被甘龙识破',
        kind: 'identified',
      },
    ])
    // 真目标：/问询： 与 scoreA 开发者行整行丢弃，不进 leftover。
    expect(parsed.leftover).toEqual([])
    expect(parsed.subtotals).toEqual({ a: 0.5, b: -0.25 })
  })

  it('maps role names through the scenario module (honnoji)', () => {
    const parsed = parseLedger(
      '细川藤孝 +1：光秀决意西进毛利，大政方针达成',
      { slotID: 'honnoji-decision', lanes: {} },
    )

    expect(parsed.items).toEqual([
      {
        name: '细川藤孝',
        side: 'b',
        delta: 1,
        why: '光秀决意西进毛利，大政方针达成',
        kind: 'main',
      },
    ])
    expect(parsed.subtotals).toEqual({ a: 0, b: 1 })
  })

  it('keeps unmapped names and unparsed lines without inventing subtotals', () => {
    const parsed = parseLedger(
      ['路人 +2：不知名加分', '裁判附注：以上为程序计分'].join('\n'),
      { slotID: null, lanes: {} },
    )

    expect(parsed.items).toEqual([
      { name: '路人', side: null, delta: 2, why: '不知名加分', kind: 'other' },
    ])
    expect(parsed.leftover).toEqual(['裁判附注：以上为程序计分'])
    expect(parsed.subtotals).toBeNull()
  })

  it('parses nothing from LLM prose and hands the text back as leftover', () => {
    const parsed = parseLedger('裁判认为双方论证均不充分，判为平局。', {
      slotID: null,
      lanes: {},
    })

    expect(parsed.items).toEqual([])
    expect(parsed.leftover).toEqual(['裁判认为双方论证均不充分，判为平局。'])
    expect(parsed.subtotals).toBeNull()
  })

  it('returns an empty ledger for empty reasoning', () => {
    expect(parseLedger(null, { slotID: null, lanes: {} }))
      .toEqual({ items: [], leftover: [], subtotals: null })
  })
})
