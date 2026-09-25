import { describe, expect, it } from 'vitest'
import type { MatchDetail, TurnDTO } from '../api/types'
import { groupTranscript } from './transcript'
import { sliceTranscriptGroup, transcriptTabPlan } from './transcript-tabs'
import trolley from '../testing/reference-match-122.json'
import pavilion from '../testing/reference-match-123.json'
import harbor from '../testing/reference-match-145.json'
import { harborMatch } from '../testing/harbor-fixtures'

describe('scenario transcript tabs', () => {
  for (const raw of [trolley, pavilion, harbor]) {
    const match = raw as unknown as MatchDetail
    it(`keeps every rendered row and phase exactly once for ${match.summary.scenarioID}`, () => {
      const plan = transcriptTabPlan(match.summary.scenarioID, match.turns)!
      const groups = groupTranscript(
        match.turns,
        match.stages,
        [],
        match.verdicts,
      )
      const partitions = [...plan.labels.map((_, index) => index), null]
        .flatMap((tab) =>
          groups.map((group) => sliceTranscriptGroup(group, plan, tab))
        )
      const rows = (items: typeof groups) =>
        items.flatMap((group) =>
          group.channels.flatMap((channel) =>
            channel.items.map((item) => item.seq)
          )
        ).sort((a, b) => a - b)
      const phases = (items: typeof groups) =>
        items.flatMap((group) => group.phases.map((phase) => phase.seq)).sort((
          a,
          b,
        ) => a - b)
      expect(rows(partitions)).toEqual(rows(groups))
      expect(phases(partitions)).toEqual(phases(groups))
      expect(
        plan.bySeq.get(
          match.verdicts.find((verdict) => verdict.key === 'final')?.afterSeq ??
            match.turns.find((turn) => turn.channel === 'verdict')!.seq,
        ),
      ).toBeNull()
    })
  }
  it('keeps harbor speeches, evidence, private chats and polls in their actual round', () => {
    const plan = transcriptTabPlan(
      'legal-harbor-murder-jury',
      harbor.turns as unknown as TurnDTO[],
    )!
    expect(plan.labels).toEqual(['第1轮', '第2轮', '第3轮', '第4轮', '第5轮'])
    let expected = 0
    for (const turn of harbor.turns) {
      const phase = turn.event.type === 'phase'
        ? /^第 (\d) 轮/.exec(turn.event.title ?? '')
        : null
      if (phase) expected = Number(phase[1]) - 1
      expect(plan.bySeq.get(turn.seq)).toBe(turn.seq >= 79 ? null : expected)
    }
  })
  it('handles early finishes and old round events without inventing later rounds', () => {
    const plan = transcriptTabPlan(
      'legal-harbor-murder-jury',
      harborMatch.turns,
    )!
    expect(plan.labels).toEqual(['第1轮', '第2轮'])
    expect([...plan.bySeq.values()]).toEqual([0, 0, 1, null, null])
  })
  it('advances harbor as soon as a new phase arrives and includes its streaming speech', () => {
    const turns = harbor.turns.filter((turn) =>
      turn.seq <= 18
    ) as unknown as TurnDTO[]
    const plan = transcriptTabPlan('legal-harbor-murder-jury', turns, [{
      seq: 19,
      channel: 'public',
      speaker: 'a',
      text: '进言',
      reasoning: '',
      call: 'say',
    }])!
    expect(plan.labels).toEqual(['第1轮', '第2轮'])
    expect(plan.bySeq.get(18)).toBe(1)
    expect(plan.bySeq.get(19)).toBe(1)
  })
  it('keeps each trolley case and its judge thoughts together', () => {
    const plan = transcriptTabPlan(
      'trolley-problem',
      trolley.turns as TurnDTO[],
    )!
    expect(plan.labels).toEqual(['原始电车', '自动驾驶车', '缸中之脑'])
    expect([0, 6, 14, 18, 28, 29, 35, 43, 44].map((seq) => plan.bySeq.get(seq)))
      .toEqual([0, 0, 1, 1, 1, 2, 2, null, null])
  })
  it('opens the next case when its phase arrives before any dialogue', () => {
    const plan = transcriptTabPlan(
      'trolley-problem',
      trolley.turns.filter((turn) => turn.seq <= 14) as TurnDTO[],
    )!
    expect(plan.bySeq.get(14)).toBe(1)
  })
  it('keeps leaks and second meetings in chronological order, whichever side meets first', () => {
    for (
      const channels of [
        [
          'public',
          'order',
          'a-1',
          'b-1',
          'leak-a',
          'a-2',
          'leak-b',
          'b-2',
          'verdict',
        ],
        [
          'public',
          'order',
          'b-1',
          'a-1',
          'leak-b',
          'b-2',
          'leak-a',
          'a-2',
          'verdict',
        ],
      ]
    ) {
      const turns: TurnDTO[] = channels.map((channel, seq) => ({
        seq,
        channel,
        kind: 'dialogue',
        speaker: 'a',
        finalText: 'test',
      }))
      const plan = transcriptTabPlan('fengyiting-real', turns)!
      expect(plan.labels).toEqual(['交锋', '私会', '暗流'])
      expect([...plan.bySeq.values()]).toEqual([0, 0, 1, 1, 2, 2, 2, 2, null])
    }
  })
})
