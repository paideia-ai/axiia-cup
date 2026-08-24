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
  // 该行台词的字数（finalText.length）——回放按台词长短缩放停留时长（F5）。
  chars: number
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
    steps.push({ kind: 'row', seq: row.seq, chars: row.finalText.length })
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

export type ReplaySpeed = 0.5 | 1 | 2

// 倍速档（F5）：0.5× 给「再慢一些」的诉求，1×/2× 维持既有节奏；控制条的
// 分段控件按此渲染。
export const REPLAY_SPEEDS: readonly ReplaySpeed[] = [0.5, 1, 2]

export interface ReplayMachineState {
  active: boolean
  // 已揭示的步骤数（0..steps.length）。
  cursor: number
  playing: boolean
  speed: ReplaySpeed
  // 已到终局：结束态常驻（F5）——由「重新播放 / 退出回放」收尾，不再定时
  // 拉回完整战报。
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

// 节奏（F5；规格 A7 对每步毫秒未规定）：行步 = clamp(1600 + 字数×20ms,
// 1600, 5000)——300 字的长台词不再和一句短语同价；节拍步恒 2200ms，够读完
// 一段心声。REPLAY_STEP_MS 即 1× 的每步下限（1200 → 1600）；倍速在 useReplay
// 里除到延时上。
export const REPLAY_STEP_MS = 1600
export const REPLAY_BEAT_MS = 2200
export const REPLAY_MAX_STEP_MS = 5000
export const REPLAY_CHAR_MS = 20

// 单步停留时长（纯函数，计时器在 useReplay）：行按台词长度加时并夹取，
// 节拍恒定。
export function replayStepDelayMs(step: ReplayStep): number {
  if (step.kind === 'beat') return REPLAY_BEAT_MS
  return Math.min(
    REPLAY_MAX_STEP_MS,
    Math.max(REPLAY_STEP_MS, REPLAY_STEP_MS + step.chars * REPLAY_CHAR_MS),
  )
}

// 自动推进的停留时长（round4 评审 #1）：停留属于「刚揭示的那一步」——
// steps[cursor - 1]，长台词出现后多停在它自己身上，而不是提前替下一步
// 买单；尚未揭示任何内容（cursor === 0）时用基础节拍起步。
export function replayDwellMs(steps: ReplayStep[], cursor: number): number {
  const step = cursor > 0 ? steps[cursor - 1] : undefined
  return step ? replayStepDelayMs(step) : REPLAY_STEP_MS
}

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

// 直接设档（F5）：0.5×/1×/2× 分段控件用。二元 toggleReplaySpeed 保留不动
// ——1→2→1 的语义有既有单测钉着。
export function setReplaySpeed(
  state: ReplayMachineState,
  speed: ReplaySpeed,
): ReplayMachineState {
  return { ...state, speed }
}

// 上一步（F5）：回退一格并暂停。reveal 是从 0 起的严格前缀，回退只会少看
// 不会多看，不可能剧透；锚点与说明一并清掉，别把上次的停留态带回来。
export function rewindReplay(state: ReplayMachineState): ReplayMachineState {
  if (!state.active || state.cursor <= 0) return state
  return {
    ...state,
    cursor: state.cursor - 1,
    playing: false,
    ended: false,
    anchorKey: null,
    showNote: false,
  }
}
