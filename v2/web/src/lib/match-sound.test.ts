import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MatchEventDTO, MatchSummary } from '../api/types'
import {
  clearSoundMatches,
  LiveMatchSounds,
  MatchCompletionTracker,
  trackSoundMatch,
} from './match-sound'
import { playSound } from './sound'

vi.mock('./sound', () => ({ playSound: vi.fn() }))

const chunk = (
  seq: number,
  extra: Partial<Extract<MatchEventDTO, { chunk: object }>['chunk']> = {},
): MatchEventDTO => ({
  chunk: {
    matchID: 9,
    seq,
    channel: 'debate',
    speaker: 'a',
    phase: 'text',
    delta: '你好',
    call: 'say',
    ...extra,
  },
})
const turn = (seq: number, kind = 'dialogue'): MatchEventDTO => ({
  turnCompleted: { matchID: 9, seq, channel: 'debate', kind },
})
const row = (id: number, extra: Partial<MatchSummary> = {}): MatchSummary => ({
  id,
  scenarioID: 'test',
  scenarioTitle: 'Test',
  kind: 'pve',
  dispatched: true,
  finished: false,
  scored: false,
  winner: null,
  initiatorIsMe: true,
  ...extra,
})

beforeEach(() => {
  vi.clearAllMocks()
  clearSoundMatches()
})

describe('live output sounds', () => {
  it('rings once per fresh completed visible model response, never per token', () => {
    const observer = new LiveMatchSounds(9, 3)
    observer.observe(turn(1))
    observer.observe(chunk(4))
    observer.observe(chunk(4))
    expect(playSound).not.toHaveBeenCalled()
    observer.observe(turn(4))
    observer.observe(turn(4))
    expect(playSound).toHaveBeenCalledExactlyOnceWith('output', '9:4')
  })

  it('excludes old rows, hidden reasoning, repair calls, generic events and replayed backlog', () => {
    const observer = new LiveMatchSounds(9, 3)
    observer.observe(chunk(2))
    observer.observe(turn(2))
    observer.observe(chunk(4, { phase: 'thinking' }))
    observer.observe(turn(4))
    observer.observe(chunk(5, { call: 'act_repair' }))
    observer.observe(turn(5))
    observer.observe(chunk(-1))
    observer.observe(turn(-1))
    observer.observe(chunk(6))
    observer.observe(turn(6, 'event'))
    observer.observe(chunk(7))
    observer.reconnect()
    observer.observe(turn(7))
    observer.observe(turn(8))
    expect(playSound).not.toHaveBeenCalled()
  })

  it('plays successful termination even in the fetch/connect race, but never failure', () => {
    const observer = new LiveMatchSounds(9, 3)
    observer.observe({ matchFailed: { matchID: 9 } })
    expect(playSound).not.toHaveBeenCalled()
    observer.observe({ matchFinished: { matchID: 9, winner: 'b' } })
    expect(playSound).toHaveBeenCalledExactlyOnceWith('finish', '9')
  })
})

describe('cross-route completion tracking', () => {
  it('tracks owned running matches and ignores initial historical and failed rows', () => {
    const tracker = new MatchCompletionTracker()
    tracker.observe([
      row(1),
      row(2),
      row(3, { initiatorIsMe: false }),
      row(4, { finished: true, scored: true }),
    ])
    expect(playSound).not.toHaveBeenCalled()
    tracker.observe([
      row(1, { finished: true, scored: true }),
      row(2, { finished: true }),
      row(3, { initiatorIsMe: false, finished: true, scored: true }),
    ])
    expect(playSound).toHaveBeenCalledExactlyOnceWith('finish', '1')
    tracker.observe([row(1, { finished: true, scored: true })])
    expect(playSound).toHaveBeenCalledTimes(1)
  })

  it('observes locally dispatched matches that finish between polls', () => {
    const tracker = new MatchCompletionTracker()
    tracker.observe([])
    trackSoundMatch(7)
    tracker.observe([row(7, { finished: true, scored: true })])
    expect(playSound).toHaveBeenCalledExactlyOnceWith('finish', '7')
  })

  it('consumes background completions silently when returning to the foreground', () => {
    const tracker = new MatchCompletionTracker()
    tracker.observe([row(1)])
    tracker.observe([row(1, { finished: true, scored: true })], false)
    tracker.observe([row(1, { finished: true, scored: true })])
    expect(playSound).not.toHaveBeenCalled()
  })
})
