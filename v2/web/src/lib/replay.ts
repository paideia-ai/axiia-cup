import type { TurnDTO, VerdictDTO } from '../api/types'
import type { OsBeat } from './verdict'
import { isOsBeatVerdict, parseOsBeat } from './verdict'

// 回放（#24 / A7）：纯前端重演——不发任何网络请求，把已完局的 turns+verdicts
// 编成一条从 0 到终局的揭示步骤序列。committed 行按 seq 逐行出现，os-N 心声
// 节拍按 afterSeq 锚点插在行间；节拍的 changed（倾向较上一拍发生变化）在此由
// favor 序列推导（首拍不算变化），回放走到 changed 节拍时自动暂停（教学锚点）。
//
// 这里只有纯函数：步骤构建、揭示切片、状态转移。计时器与 React 状态在
// components/replay-controls.tsx 的 useReplay 里。

export interface ReplayRowStep {
  kind: 'row'
  seq: number
}

export interface ReplayBeatStep {
  kind: 'beat'
  verdict: VerdictDTO
  beat: OsBeat
  // 节拍序号（os-N 顺序，0 起）——倾向轨迹图的 x 轴。
  index: number
  // 教学锚点（#24 U9）：favor 较上一拍变化；首拍恒为 false。
  changed: boolean
}

export type ReplayStep = ReplayRowStep | ReplayBeatStep

const OS_KEY_INDEX = /^os-(\d+)$/

function osIndex(key: string): number {
  const match = OS_KEY_INDEX.exec(key)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

// afterSeq 是「已提交行数」：afterSeq === k 的节拍在第 k 行之后、第 k+1 行
// 之前揭示；同锚点多拍按 os-N 序各占一步。
export function buildReplaySteps(
  turns: TurnDTO[],
  verdicts: VerdictDTO[],
): ReplayStep[] {
  const rows = [...turns].sort((left, right) => left.seq - right.seq)
  const beats = verdicts
    .filter(isOsBeatVerdict)
    .sort((left, right) =>
      left.afterSeq - right.afterSeq || osIndex(left.key) - osIndex(right.key)
    )

  const steps: ReplayStep[] = []
  let beatAt = 0
  let beatIndex = 0
  let prevFavor: string | null = null
  const flushBeats = (revealedRows: number) => {
    while (beatAt < beats.length && beats[beatAt].afterSeq <= revealedRows) {
      const verdict = beats[beatAt]
      beatAt += 1
      const beat = parseOsBeat(verdict.output)
      const changed = prevFavor != null && beat.favor != null &&
        beat.favor !== prevFavor
      if (beat.favor != null) prevFavor = beat.favor
      steps.push({ kind: 'beat', verdict, beat, index: beatIndex, changed })
      beatIndex += 1
    }
  }

  rows.forEach((row, revealed) => {
    flushBeats(revealed)
    steps.push({ kind: 'row', seq: row.seq })
  })
  flushBeats(Number.MAX_SAFE_INTEGER)
  return steps
}

// 全部节拍（含 changed 元数据），倾向轨迹图的数据序列。
export function replayBeats(steps: ReplayStep[]): ReplayBeatStep[] {
  return steps.filter((step): step is ReplayBeatStep => step.kind === 'beat')
}

export interface ReplayReveal {
  // 已揭示 committed 行的 seq 集合——现有渲染路径直接以此过滤 turns。
  seqs: ReadonlySet<number>
  // 已揭示行数——非节拍的过程裁决（如先后裁定）按 afterSeq <= rows 揭示。
  rows: number
  // 已揭示节拍的 verdict key 集合。
  beatKeys: ReadonlySet<string>
}

export function replayReveal(
  steps: ReplayStep[],
  cursor: number,
): ReplayReveal {
  const seqs = new Set<number>()
  const beatKeys = new Set<string>()
  const upTo = Math.min(cursor, steps.length)
  for (let at = 0; at < upTo; at++) {
    const step = steps[at]
    if (step.kind === 'row') seqs.add(step.seq)
    else beatKeys.add(step.verdict.key)
  }
  return { seqs, rows: seqs.size, beatKeys }
}

// ── 状态机 ──────────────────────────────────────────────────────────────────

export type ReplaySpeed = 1 | 2

export interface ReplayMachineState {
  active: boolean
  // 已揭示的步骤数（0..steps.length）。
  cursor: number
  playing: boolean
  speed: ReplaySpeed
  // 已到终局：短暂展示「回放结束」后恢复完整战报。
  ended: boolean
  // 正停留的教学锚点（changed 节拍的 verdict key），高亮该心声卡。
  anchorKey: string | null
  // 首次锚点停留时的一次性说明（倾向发生变化，值得停留）。
  showNote: boolean
  noteSeen: boolean
}

export const REPLAY_IDLE: ReplayMachineState = {
  active: false,
  cursor: 0,
  playing: false,
  speed: 1,
  ended: false,
  anchorKey: null,
  showNote: false,
  noteSeen: false,
}

// 节奏：每步 1.2s（2x 减半）。行与节拍等权一步——对话行需要几秒读完，
// 1.2s 是「持续推进但赶得上扫读」的折中；终局态停留 1.6s 再恢复完整战报。
export const REPLAY_STEP_MS = 1200
export const REPLAY_END_HOLD_MS = 1600

export function startReplay(): ReplayMachineState {
  return { ...REPLAY_IDLE, active: true, playing: true }
}

// 揭示下一步：自动播放与手动步进共用；手动步进（manual）刻意暂停自动播放
// ——点了「步进」就代表想手动看，要继续自动放请再按「播放」。
// 走到 changed 节拍自动暂停并挂锚点；走完最后一步进入 ended。
export function advanceReplay(
  state: ReplayMachineState,
  steps: ReplayStep[],
  manual = false,
): ReplayMachineState {
  if (!state.active || state.ended) return state
  if (state.cursor >= steps.length) {
    return { ...state, ended: true, playing: false, anchorKey: null }
  }
  const cursor = state.cursor + 1
  const step = steps[cursor - 1]
  const anchored = step.kind === 'beat' && step.changed
  // 末步若正是锚点，先停留；再推进一步才落入 ended。
  const ended = cursor >= steps.length && !anchored
  return {
    ...state,
    cursor,
    ended,
    playing: manual ? false : state.playing && !anchored && !ended,
    anchorKey: anchored ? step.verdict.key : null,
    showNote: anchored && !state.noteSeen,
    noteSeen: state.noteSeen || anchored,
  }
}

export function pauseReplay(state: ReplayMachineState): ReplayMachineState {
  if (!state.active) return state
  return { ...state, playing: false }
}

// 继续：清锚点与说明，恢复自动推进。
export function resumeReplay(state: ReplayMachineState): ReplayMachineState {
  if (!state.active || state.ended) return state
  return { ...state, playing: true, anchorKey: null, showNote: false }
}

export function toggleReplaySpeed(
  state: ReplayMachineState,
): ReplayMachineState {
  return { ...state, speed: state.speed === 1 ? 2 : 1 }
}
