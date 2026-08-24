import { describe, expect, it } from 'vitest'

import type { TurnDTO, VerdictDTO } from '../api/types'
import type { ReplayStep } from './replay'
import {
  advanceReplay,
  buildReplaySteps,
  pauseReplay,
  REPLAY_BEAT_MS,
  REPLAY_IDLE,
  REPLAY_STEP_MS,
  replayBeats,
  replayReveal,
  replayStepDelayMs,
  resumeReplay,
  rewindReplay,
  setReplaySpeed,
  startReplay,
  toggleReplaySpeed,
} from './replay'
import { absorbedActSeqs } from './transcript'

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

  // 不渲染的行不能占一拍（#22）：整行都是结构化载荷的 act 行被吸收进它自己的
  // 心声卡，回放要跳过它——它的节拍锚在同一个 seq 上，位置因此不变。
  it('an absorbed act row costs no step and its beat still fires in place', () => {
    const act: TurnDTO = {
      seq: 3,
      channel: 'judge-aside',
      kind: 'dialogue',
      speaker: 'judge',
      finalText: '<os>他二人一开口</os>\n<favor>B</favor>',
      reasoning: '真实推演轨迹',
    }
    const turns = [turn(0), turn(1), turn(2), act]
    const verdicts = [beat('os-1', 3, 'B')]
    const absorbed = absorbedActSeqs(turns, verdicts)
    const withoutAbsorbed = buildReplaySteps(
      turns.filter((row) => !absorbed.has(row.seq)),
      verdicts,
    )

    expect([...absorbed]).toEqual([3])
    expect(
      withoutAbsorbed.map((step) =>
        step.kind === 'row' ? `row-${step.seq}` : step.verdict.key
      ),
    ).toEqual(['row-0', 'row-1', 'row-2', 'os-1'])
    expect([...replayReveal(withoutAbsorbed, 4).beatKeys]).toEqual(['os-1'])
  })

  it('supports manual pause and a stable 1x/2x speed toggle', () => {
    const started = startReplay()
    const manual = advanceReplay(started, steps, true)

    expect(manual.playing).toBe(false)
    expect(pauseReplay(started).playing).toBe(false)
    expect(toggleReplaySpeed(started).speed).toBe(2)
    expect(toggleReplaySpeed(toggleReplaySpeed(started)).speed).toBe(1)
  })

  // F5：行步按台词字数加时并夹取在 [1600, 5000]，节拍步恒 2200；
  // buildReplaySteps 把 finalText 长度写进行步（'turn-0' 共 6 字）。
  it('scales row delay with dialogue length inside the clamp band', () => {
    const rowStep = (chars: number): ReplayStep => ({
      kind: 'row',
      seq: 0,
      chars,
    })

    expect(replayStepDelayMs(rowStep(0))).toBe(REPLAY_STEP_MS)
    expect(replayStepDelayMs(rowStep(40))).toBe(REPLAY_STEP_MS + 800)
    expect(replayStepDelayMs(rowStep(10_000))).toBe(5000)
    expect(replayStepDelayMs(replayBeats(steps)[0])).toBe(REPLAY_BEAT_MS)

    const first = steps[0]
    expect(first.kind).toBe('row')
    expect(first.kind === 'row' ? first.chars : -1).toBe(6)
  })

  // F5：上一步——回退一格并暂停、清锚点与说明；0 处与未激活时原样返回。
  it('rewinds one step, pauses, clears the anchor, and floors at zero', () => {
    let state = startReplay()
    for (let at = 0; at < 4; at++) state = advanceReplay(state, steps)
    expect(state.anchorKey).toBe('os-2')

    expect(rewindReplay(state)).toMatchObject({
      cursor: 3,
      playing: false,
      ended: false,
      anchorKey: null,
      showNote: false,
    })
    expect(rewindReplay(startReplay()).cursor).toBe(0)
    expect(rewindReplay(REPLAY_IDLE)).toBe(REPLAY_IDLE)
  })

  // F5：终局态常驻后仍可回退——ended 清掉，最后一步重新可看。
  it('rewinding out of the ended state revives the last step', () => {
    let state = startReplay()
    for (let at = 0; at < 4; at++) state = advanceReplay(state, steps)
    state = resumeReplay(state)
    state = advanceReplay(state, steps)

    expect(state.ended).toBe(true)
    expect(rewindReplay(state)).toMatchObject({
      cursor: 4,
      ended: false,
      playing: false,
    })
  })

  // F5 不剧透不变量：任意 cursor−1 的 reveal 都是 cursor 处 reveal 的前缀
  // ——回退不可能暴露后文。
  it('reveal at cursor-1 is always a prefix of reveal at cursor', () => {
    for (let cursor = 1; cursor <= steps.length; cursor++) {
      const prev = replayReveal(steps, cursor - 1)
      const next = replayReveal(steps, cursor)
      for (const seq of prev.seqs) expect(next.seqs.has(seq)).toBe(true)
      for (const key of prev.beatKeys) {
        expect(next.beatKeys.has(key)).toBe(true)
      }
      expect(prev.seqs.size + prev.beatKeys.size).toBe(cursor - 1)
    }
  })

  // F5：0.5×/1×/2× 直接设档；上面的用例钉住二元 toggle 的 1→2→1 不变。
  it('sets any of the three speeds directly', () => {
    const started = startReplay()

    expect(setReplaySpeed(started, 0.5).speed).toBe(0.5)
    expect(setReplaySpeed(started, 2).speed).toBe(2)
    expect(setReplaySpeed(setReplaySpeed(started, 0.5), 1).speed).toBe(1)
  })
})
