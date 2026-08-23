import { describe, expect, it } from 'vitest'

import type { LiveBubble } from '../api/sse'
import type { StageDTO, TurnDTO, VerdictDTO } from '../api/types'
import {
  absorbedActSeqs,
  groupTranscript,
  isInquiryGroup,
  placeVerdicts,
  UNSTAGED_GROUP_ID,
} from './transcript'

function dialogue(seq: number, channel: string, text?: string): TurnDTO {
  return {
    seq,
    channel,
    kind: 'dialogue',
    speaker: 'a',
    finalText: text ?? `${channel}-${seq}`,
  }
}

function osVerdict(key: string, afterSeq: number): VerdictDTO {
  return {
    key,
    afterSeq,
    output: JSON.stringify({
      os: '他二人一开口',
      favor: 'a',
      strength: '略偏',
    }),
    model: 'judge',
  }
}

function event(
  seq: number,
  channel: string,
  value: Record<string, unknown>,
): TurnDTO {
  return {
    seq,
    channel,
    kind: 'event',
    speaker: 'game',
    finalText: '',
    event: value as TurnDTO['event'],
  }
}

function phase(seq: number, title: string): TurnDTO {
  return event(seq, '*', { type: 'phase', title })
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

const deliberationStages: StageDTO[] = [
  {
    id: 'deliberation',
    title: '审议',
    channels: [
      { id: 'public', label: '公开发言' },
      { id: 'procedure', label: '程序' },
      { id: 'observer', label: '幕后' },
    ],
  },
  {
    id: 'verdict',
    title: '判决',
    channels: [{ id: 'verdict', label: '判决票' }],
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
      call: 'say',
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
    expect(groups[1].phases).toEqual([{ seq: 1, title: '裁判问询' }])
    expect(groups[2].channels[0].items.map(({ kind, seq }) => [kind, seq]))
      .toEqual([['turn', 4], ['live', 5]])
    expect(groups[3].channels[0].items[0].seq).toBe(6)
  })

  it('preserves adjacent channel runs within one stage', () => {
    const groups = groupTranscript([
      phase(0, '第一轮'),
      event(1, 'observer', { type: 'observer_action_decision' }),
      dialogue(2, 'public'),
      event(3, 'procedure', { type: 'secret_poll_opened' }),
      event(4, 'observer', { type: 'observer_secret_poll' }),
      dialogue(5, 'public'),
    ], deliberationStages)

    expect(groups.map(({ id }) => id)).toEqual(['deliberation'])
    expect(
      groups[0].channels.map((channel) => ({
        id: channel.id,
        seqs: channel.items.map((item) => item.seq),
      })),
    ).toEqual([
      { id: 'observer', seqs: [1] },
      { id: 'public', seqs: [2] },
      { id: 'procedure', seqs: [3] },
      { id: 'observer', seqs: [4] },
      { id: 'public', seqs: [5] },
    ])
    expect(groups[0].phases).toEqual([{ seq: 0, title: '第一轮' }])
  })

  it('keeps stage re-entry and unstaged rows in sequence', () => {
    const groups = groupTranscript([
      dialogue(0, 'public'),
      event(1, 'verdict', { type: 'verdict' }),
      dialogue(2, 'public'),
      event(3, 'unknown', { type: 'scene' }),
    ], deliberationStages)

    expect(groups.map(({ id }) => id)).toEqual([
      'deliberation',
      'verdict',
      'deliberation@2',
      UNSTAGED_GROUP_ID,
    ])
    expect(groups.map((group) => group.channels[0].items[0].seq)).toEqual([
      0,
      1,
      2,
      3,
    ])
  })

  it('suppresses a live bubble as soon as its committed row exists', () => {
    const committed = dialogue(3, 'room-a')
    const bubble: LiveBubble = {
      seq: 3,
      channel: 'room-a',
      speaker: 'a',
      text: 'duplicate',
      reasoning: '',
      call: 'say',
    }

    const [group] = groupTranscript([committed], stages, [bubble])
    expect(group.channels[0].items).toHaveLength(1)
    expect(group.channels[0].items[0].kind).toBe('turn')
  })

  it('attaches phase markers at their chronological positions', () => {
    const groups = groupTranscript([
      phase(0, '第一轮'),
      dialogue(1, 'public'),
      phase(2, '第二轮'),
      event(3, 'observer', { type: 'observer_action_decision' }),
    ], deliberationStages)

    expect(groups[0].phases).toEqual([
      { seq: 0, title: '第一轮' },
      { seq: 2, title: '第二轮' },
    ])
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

// act 行与它的裁决卡是同一次生成：卡已经渲染过结构化载荷，行不能再把原始标签
// 复述一遍（#22）。配对判据是 turn.seq === verdict.afterSeq。
describe('v3.4 #22 act 原始标签不进时间线', () => {
  const asideStages: StageDTO[] = [
    ...stages,
    {
      id: 'aside',
      title: '心声',
      channels: [{ id: 'judge-aside', label: '旁白' }],
    },
  ]
  const osRow =
    '<os>他二人一开口</os>\n<favor>a</favor>\n<strength>略偏</strength>'

  it('整行都是结构化载荷的 act 行不渲染，其阶段也不留空标题', () => {
    const turns = [
      dialogue(0, 'room-a'),
      dialogue(1, 'judge-aside', osRow),
    ]
    const verdicts = [osVerdict('os-1', 1)]
    const groups = groupTranscript(turns, asideStages, [], verdicts)

    expect(groups.map(({ id }) => id)).toEqual(['meeting'])
    expect(
      groups.flatMap((group) =>
        group.channels.flatMap((channel) => channel.items.map(({ seq }) => seq))
      ),
    ).toEqual([0])
    expect([...absorbedActSeqs(turns, verdicts)]).toEqual([1])
  })

  it('带叙述的 act 行留下叙述、只剥标签', () => {
    const turns = [
      dialogue(0, 'room-a'),
      dialogue(1, 'judge-aside', `（拱手）以臣所见\n${osRow}`),
    ]
    const verdicts = [osVerdict('os-1', 1)]
    const groups = groupTranscript(turns, asideStages, [], verdicts)
    const item = groups[1].channels[0].items[0]

    expect(item.kind).toBe('turn')
    expect(item.kind === 'turn' ? item.turn.finalText : '')
      .toBe('（拱手）以臣所见')
    expect([...absorbedActSeqs(turns, verdicts)]).toEqual([])
  })

  it('锚点行不含所声明标签时原样保留（配对若失准只退化为不动）', () => {
    const turns = [dialogue(0, 'room-a'), dialogue(1, 'room-a', '照常说话')]
    const groups = groupTranscript(turns, stages, [], [osVerdict('os-1', 1)])
    const item = groups[0].channels[0].items[1]

    expect(item.kind === 'turn' ? item.turn.finalText : '').toBe('照常说话')
  })

  it('问询腿的 act 行带叙述，问询段照旧成段（#69）', () => {
    const inquiryRow = '以臣所见，三事之中当准其二。\n<guess>GR1</guess>'
    const groups = groupTranscript(
      [dialogue(0, 'room-a'), dialogue(1, 'inquiry-judge', inquiryRow)],
      stages,
      [],
      [{
        key: 'inquiry-a',
        afterSeq: 1,
        output: JSON.stringify({ guess: 'GR1' }),
        model: 'judge',
      }],
    )

    expect(isInquiryGroup(groups[1])).toBe(true)
    const item = groups[1].channels[0].items[0]
    expect(item.kind === 'turn' ? item.turn.finalText : '')
      .toBe('以臣所见，三事之中当准其二。')
  })

  it('afterSeq 落在事件行上的裁决不被当作 act 配对', () => {
    const turns = [
      dialogue(0, 'room-a'),
      event(1, 'room-a', { type: 'score', os: '<os>x</os>' }),
    ]
    const groups = groupTranscript(turns, stages, [], [osVerdict('os-1', 1)])

    expect(groups[0].channels[0].items.map(({ seq }) => seq)).toEqual([0, 1])
    expect([...absorbedActSeqs(turns, [osVerdict('os-1', 1)])]).toEqual([])
  })
})
