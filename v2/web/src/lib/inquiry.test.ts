import { describe, expect, it } from 'vitest'
import type { MatchDetail } from '../api/types'
import { speakerLabels } from '../components/timeline/labels'
import court from '../testing/reference-match-144.json'
import honnoji from '../testing/reference-match-120.json'
import { inquiryAnswers } from './inquiry'
import {
  groupTranscript,
  mergeJudgeAsideStage,
  placeVerdicts,
} from './transcript'

function fixture(raw: unknown) {
  const match = structuredClone(raw) as MatchDetail
  const groups = groupTranscript(
    match.turns,
    mergeJudgeAsideStage(match.stages),
    [],
    match.verdicts,
    { preserveVerdictChannels: ['inquiry-a', 'inquiry-b', 'verdict'] },
  )
  const index = groups.findIndex((group) => group.id === 'inquiry')
  return {
    group: groups[index],
    verdicts: placeVerdicts(groups, match.verdicts).perGroup[index],
    labels: speakerLabels(
      match.summary.scenarioID,
      match.speakerLabels,
      match.turns.map((turn) => turn.speaker),
      match.summary.participants,
    ),
  }
}

describe('inquiry card data', () => {
  for (
    const [raw, names, goals] of [
      [court, ['商鞅', '甘龙'], ['GR3', 'SR1']],
      [honnoji, ['足利义昭的使者', '细川藤孝'], ['HF2', 'YA1']],
    ] as const
  ) {
    it(`retains exact answers and actual roles for ${raw.summary.scenarioID}`, () => {
      const { group, verdicts, labels } = fixture(raw)
      const answers = inquiryAnswers(group, verdicts, labels)!
      expect(answers.map((answer) => answer.name)).toEqual(names)
      expect(answers.map((answer) => answer.guess)).toEqual(goals)
      expect(answers.map((answer) => answer.reason)).toEqual(
        verdicts.map((verdict) => JSON.parse(verdict.output).reason),
      )
      expect(answers.every((answer) => answer.goal !== answer.guess)).toBe(true)
    })
  }

  for (
    const output of [
      'not json',
      '[]',
      '{}',
      '{"guess":123,"reason":"x"}',
      '{"guess":"GR3","reason":"x","newField":"retain me"}',
    ]
  ) {
    it(`keeps the generic renderer for ${output}`, () => {
      const { group, verdicts, labels } = fixture(court)
      verdicts[0].output = output
      expect(inquiryAnswers(group, verdicts, labels)).toBeNull()
    })
  }

  it('does not hide extra dialogue alongside an answer', () => {
    const { group, verdicts, labels } = fixture(court)
    const item = group.channels[0].items[0]
    if (item.kind !== 'turn') throw new Error('missing fixture turn')
    item.turn.finalText = '还有一句需要读者看到的话。'
    expect(inquiryAnswers(group, verdicts, labels)).toBeNull()
  })

  it('keeps streaming output in the existing live renderer', () => {
    const { group, verdicts, labels } = fixture(court)
    group.channels[1].items[0] = {
      kind: 'live',
      seq: 16,
      bubble: {
        seq: 16,
        channel: 'inquiry-b',
        speaker: 'b',
        text: '',
        reasoning: '',
        call: 'act',
      },
    }
    expect(inquiryAnswers(group, verdicts, labels)).toBeNull()
  })

  it('allows one completed answer without inventing the other', () => {
    const { group, verdicts, labels } = fixture(court)
    group.channels = group.channels.slice(0, 1)
    expect(inquiryAnswers(group, verdicts.slice(0, 1), labels)).toHaveLength(1)
  })

  it('retains an unfamiliar goal code rather than substituting a known goal', () => {
    const { group, verdicts, labels } = fixture(court)
    verdicts[0].output = JSON.stringify({ guess: 'FUTURE9', reason: '原文' })
    expect(inquiryAnswers(group, verdicts, labels)?.[0].goal).toBe('FUTURE9')
  })

  it('keeps the model trace separate from the public answer', () => {
    const { group, verdicts, labels } = fixture(court)
    const item = group.channels[0].items[0]
    if (item.kind !== 'turn') throw new Error('missing fixture turn')
    item.turn.reasoning = 'private trace fixture'
    const answer = inquiryAnswers(group, verdicts, labels)![0]
    expect(answer.trace).toBe('private trace fixture')
    expect(answer.reason).not.toContain(answer.trace)
  })
})
