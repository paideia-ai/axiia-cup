import { describe, expect, it } from 'vitest'

import type { TurnDTO, VerdictDTO } from '../api/types'
import {
  advanceReplay,
  buildReplaySteps,
  pauseReplay,
  replayBeats,
  replayReveal,
  resumeReplay,
  startReplay,
  toggleReplaySpeed,
} from './replay'

function turn(seq: number): TurnDTO {
  return {
    seq,
    channel: 'main',
    kind: 'dialogue',
    speaker: 'a',
    finalText: `turn-${seq}`,
  }
}

function beat(key: string, afterSeq: number, favor: string): VerdictDTO {
  return {
    key,
    afterSeq,
    output: JSON.stringify({ os: key, favor, strength: '中' }),
    model: 'judge',
  }
}

describe('v3.4 #20/#22/#24 deterministic replay', () => {
  const steps = buildReplaySteps(
    [turn(2), turn(0), turn(1)],
    [beat('os-2', 2, 'B'), beat('os-1', 1, 'A')],
  )

  it('sorts rows, anchors beats after committed rows, and marks favor changes', () => {
    expect(
      steps.map((step) =>
        step.kind === 'row' ? `row-${step.seq}` : step.verdict.key
      ),
    ).toEqual(['row-0', 'os-1', 'row-1', 'os-2', 'row-2'])
    expect(replayBeats(steps).map(({ changed }) => changed)).toEqual([
      false,
      true,
    ])
  })

  it('reveals exactly the committed rows and beats before the cursor', () => {
    const reveal = replayReveal(steps, 4)

    expect([...reveal.seqs]).toEqual([0, 1])
    expect([...reveal.beatKeys]).toEqual(['os-1', 'os-2'])
    expect(reveal.rows).toBe(2)
  })

  it('pauses once at a changed-favor teaching anchor and resumes cleanly', () => {
    let state = startReplay()
    state = advanceReplay(state, steps)
    state = advanceReplay(state, steps)
    state = advanceReplay(state, steps)
    state = advanceReplay(state, steps)

    expect(state).toMatchObject({
      cursor: 4,
      playing: false,
      anchorKey: 'os-2',
      showNote: true,
      noteSeen: true,
    })

    state = resumeReplay(state)
    expect(state).toMatchObject({
      playing: true,
      anchorKey: null,
      showNote: false,
    })
    state = advanceReplay(state, steps)
    expect(state).toMatchObject({ ended: true, playing: false })
  })

  it('supports manual pause and a stable 1x/2x speed toggle', () => {
    const started = startReplay()
    const manual = advanceReplay(started, steps, true)

    expect(manual.playing).toBe(false)
    expect(pauseReplay(started).playing).toBe(false)
    expect(toggleReplaySpeed(started).speed).toBe(2)
    expect(toggleReplaySpeed(toggleReplaySpeed(started)).speed).toBe(1)
  })
})
