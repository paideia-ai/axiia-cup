import { describe, expect, it } from 'vitest'

import type { LiveBubble } from '../api/sse'
import type { StageDTO, TurnDTO, VerdictDTO } from '../api/types'
import {
  groupTranscript,
  isInquiryGroup,
  placeVerdicts,
  UNSTAGED_GROUP_ID,
} from './transcript'

function dialogue(seq: number, channel: string): TurnDTO {
  return {
    seq,
    channel,
    kind: 'dialogue',
    speaker: 'a',
    finalText: `${channel}-${seq}`,
  }
}

function phase(seq: number, title: string): TurnDTO {
  return {
    seq,
    channel: '*',
    kind: 'event',
    speaker: 'game',
    finalText: '',
    event: { type: 'phase', title },
  }
}

const stages: StageDTO[] = [
  {
    id: 'meeting',
    title: '会谈',
    channels: [
      { id: 'room-a', label: '甲方' },
      { id: 'room-b', label: '乙方' },
    ],
  },
  {
    id: 'inquiry',
    title: '问询',
    channels: [{ id: 'inquiry-judge', label: '裁判问询' }],
  },
]

describe('v3.4 #20/#69/#80 transcript grouping', () => {
  it('preserves global chronology, repeated stage visits, live rows, and unknown channels', () => {
    const bubble: LiveBubble = {
      seq: 5,
      channel: 'room-b',
      speaker: 'b',
      text: 'streaming',
      reasoning: '',
    }
    const groups = groupTranscript(
      [
        dialogue(4, 'room-b'),
        dialogue(0, 'room-a'),
        phase(1, '裁判问询'),
        dialogue(2, 'inquiry-judge'),
        dialogue(6, 'future-channel'),
      ],
      stages,
      [bubble],
    )

    expect(groups.map(({ id }) => id)).toEqual([
      'meeting',
      'inquiry',
      'meeting@2',
      UNSTAGED_GROUP_ID,
    ])
    expect(groups[1].phases).toEqual(['裁判问询'])
    expect(groups[2].channels[0].items.map(({ kind, seq }) => [kind, seq]))
      .toEqual([['turn', 4], ['live', 5]])
    expect(groups[3].channels[0].items[0].seq).toBe(6)
  })

  it('suppresses a live bubble as soon as its committed row exists', () => {
    const committed = dialogue(3, 'room-a')
    const bubble: LiveBubble = {
      seq: 3,
      channel: 'room-a',
      speaker: 'a',
      text: 'duplicate',
      reasoning: '',
    }

    const [group] = groupTranscript([committed], stages, [bubble])
    expect(group.channels[0].items).toHaveLength(1)
    expect(group.channels[0].items[0].kind).toBe('turn')
  })

  it('recognizes real inquiry sections and places verdicts by afterSeq', () => {
    const groups = groupTranscript([
      dialogue(0, 'room-a'),
      dialogue(2, 'inquiry-judge'),
    ], stages)
    const verdicts: VerdictDTO[] = [
      { key: 'order', afterSeq: 1, output: '{}', model: 'judge' },
      { key: 'judge', afterSeq: 99, output: '{}', model: 'judge' },
    ]
    const placed = placeVerdicts(groups, verdicts)

    expect(isInquiryGroup(groups[0])).toBe(false)
    expect(isInquiryGroup(groups[1])).toBe(true)
    expect(placed.perGroup[0].map(({ key }) => key)).toEqual(['order'])
    expect(placed.trailing.map(({ key }) => key)).toEqual(['judge'])
  })
})
