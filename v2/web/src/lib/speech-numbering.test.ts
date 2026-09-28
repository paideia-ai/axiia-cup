import { describe, expect, it } from 'vitest'
import type { LiveBubble } from '../api/sse'
import type { MatchDetail, TurnDTO } from '../api/types'
import shangyang from '../testing/reference-match-144.json'
import honnoji from '../testing/reference-match-120.json'
import trolley from '../testing/reference-match-122.json'
import fengyiting from '../testing/reference-match-123.json'
import harbor from '../testing/reference-match-145.json'
import { buildSpeechNumbers, speechNumberBefore } from './speech-numbering'

describe('speech numbering independent of the event timeline', () => {
  for (
    const [fixture, count] of [
      [shangyang, 10],
      [honnoji, 20],
      [trolley, 30],
      [fengyiting, 46],
      [harbor, 25],
    ] as const
  ) {
    const match = fixture as MatchDetail
    it(`${match.summary.scenarioID}: numbers only conversation, continuously`, () => {
      const before = structuredClone(match)
      const numbers = buildSpeechNumbers(match.summary.scenarioID, match.turns)
      expect([...numbers.values()]).toEqual(
        Array.from({ length: count }, (_, index) => index + 1),
      )
      for (const turn of match.turns) {
        if (
          [
            '*',
            'judge-aside',
            'inquiry-a',
            'inquiry-b',
            'verdict',
            'order',
            'observer',
            'procedure',
            'evidence',
            'leak-a',
            'leak-b',
          ].includes(
            turn.channel,
          )
        ) expect(numbers.has(turn.seq)).toBe(false)
      }
      expect(match).toEqual(before)
      expect(
        buildSpeechNumbers(
          match.summary.scenarioID,
          [...match.turns].reverse(),
        ),
      )
        .toEqual(numbers)
    })

    it(`${match.summary.scenarioID}: preserves numbers as live speeches commit and replay advances`, () => {
      const final = buildSpeechNumbers(match.summary.scenarioID, match.turns)
      for (let index = 0; index < match.turns.length; index++) {
        const turn = match.turns[index]
        const prefix = match.turns.slice(0, index)
        if (turn.kind === 'dialogue' && final.has(turn.seq)) {
          const bubble: LiveBubble = {
            seq: turn.seq,
            channel: turn.channel,
            speaker: turn.speaker,
            text: '',
            reasoning: 'thinking',
            call: 'say',
          }
          const streaming = buildSpeechNumbers(
            match.summary.scenarioID,
            prefix,
            [bubble],
          )
          expect(streaming.get(turn.seq)).toBe(final.get(turn.seq))
          const committed = buildSpeechNumbers(match.summary.scenarioID, [
            ...prefix,
            turn,
          ], [bubble])
          expect(committed).toEqual(streaming)
        }
        const revealed = buildSpeechNumbers(match.summary.scenarioID, [
          ...prefix,
          turn,
        ])
        for (const [seq, number] of revealed) {
          expect(number).toBe(final.get(seq))
        }
      }
    })
  }

  it('counts Diaochan replies and NPC jury speeches as conversation', () => {
    const romantic = buildSpeechNumbers(
      'fengyiting-real',
      fengyiting.turns as TurnDTO[],
    )
    const replies = fengyiting.turns.filter((row) =>
      row.speaker === 'diaochan' && /^[ab]-[12]$/.test(row.channel)
    )
    expect(replies).toHaveLength(20)
    expect(replies.every((row) => romantic.has(row.seq))).toBe(true)
    const jury = buildSpeechNumbers(
      'legal-harbor-murder-jury',
      (harbor as unknown as MatchDetail).turns,
    )
    const npcSpeeches = (harbor as unknown as MatchDetail).turns.filter(
      (row) => {
        const event = row.event as { type?: string; actor?: string } | null
        return event?.type === 'jury_speech' && event.actor?.startsWith('j')
      },
    )
    expect(npcSpeeches).toHaveLength(15)
    expect(npcSpeeches.every((row) => jury.has(row.seq))).toBe(true)
  })

  it('OS captions reference the last speech, excluding the OS and preceding events', () => {
    for (const fixture of [shangyang, honnoji, trolley]) {
      const match = fixture as MatchDetail
      const numbers = buildSpeechNumbers(match.summary.scenarioID, match.turns)
      const beats = match.verdicts.filter((verdict) => /^os-/.test(verdict.key))
      expect(beats.length).toBeGreaterThan(0)
      for (const beat of beats) {
        const round = Number(beat.key.slice(3))
        expect(speechNumberBefore(numbers, beat.afterSeq)).toBe(round * 2)
      }
      expect(speechNumberBefore(numbers, 0)).toBeUndefined()
      const firstSeq = numbers.keys().next().value!
      expect(speechNumberBefore(numbers, firstSeq)).toBeUndefined()
      expect(speechNumberBefore(numbers, firstSeq + 1)).toBe(1)
    }
  })

  it('does not number live OS, inquiries, private generations, or act repairs', () => {
    const bubble: LiveBubble = {
      seq: 2,
      channel: 'court',
      speaker: 'a',
      text: '',
      reasoning: '',
      call: null,
    }
    expect(buildSpeechNumbers('shangyang-court', [], [bubble]).get(2)).toBe(1)
    for (
      const update of [
        { channel: 'judge-aside' },
        { channel: 'inquiry-a' },
        { seq: -1 },
        { call: 'act' },
        { call: 'act_repair' },
      ]
    ) {
      expect(
        buildSpeechNumbers('shangyang-court', [], [{ ...bubble, ...update }])
          .size,
      ).toBe(0)
    }
    expect(
      buildSpeechNumbers('legal-harbor-murder-jury', [], [{
        ...bubble,
        channel: 'public',
      }]).size,
    ).toBe(0)
    expect(
      buildSpeechNumbers('unknown-scenario', shangyang.turns as TurnDTO[]).size,
    ).toBe(0)
  })
})
