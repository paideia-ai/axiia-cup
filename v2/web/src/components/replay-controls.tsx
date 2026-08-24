import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import type { ReplayMachineState, ReplaySpeed, ReplayStep } from '../lib/replay'
import {
  advanceReplay,
  pauseReplay,
  REPLAY_IDLE,
  REPLAY_SPEEDS,
  replayDwellMs,
  resumeReplay,
  rewindReplay,
  setReplaySpeed,
  startReplay,
  toggleReplaySpeed,
} from '../lib/replay'
import { cn } from '../lib/cn'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

// 回放（#24）的计时器壳：纯状态转移在 lib/replay.ts，这里只负责 React 状态、
// 自动推进的 setTimeout 与倍速的本地持久化。终局态常驻（F5）——不再定时退回
// 完整战报，由「重新播放 / 退出回放」收尾，节奏交还给用户。

// 倍速持久化（F5）：沿用 battle-strip 的 try/catch 模式——存储不可用（私隐
// 模式等）一律静默回退，本次会话内照常生效。
const SPEED_KEY = 'axiia-replay-speed'

function loadSpeed(): ReplaySpeed {
  try {
    const value = Number(localStorage.getItem(SPEED_KEY))
    return REPLAY_SPEEDS.find((speed) => speed === value) ?? 1
  } catch {
    return 1
  }
}

function storeSpeed(speed: ReplaySpeed) {
  try {
    localStorage.setItem(SPEED_KEY, String(speed))
  } catch {
    // 静默：记不住就下次再选。
  }
}

export interface ReplayHandle {
  state: ReplayMachineState
  start: () => void
  exit: () => void
  togglePlay: () => void
  stepOnce: () => void
  // 上一步（F5）：回退一格并暂停。
  stepBack: () => void
  // 结束态的「重新播放」：从 0 重来，保留当前倍速。
  restart: () => void
  toggleSpeed: () => void
  // 直接设档（F5）：分段控件用，并写回 localStorage。
  setSpeed: (speed: ReplaySpeed) => void
}

export function useReplay(steps: ReplayStep[]): ReplayHandle {
  const [state, setState] = useState<ReplayMachineState>(REPLAY_IDLE)

  useEffect(() => {
    if (!state.active || !state.playing || state.ended) return
    // 停留时长按「刚揭示的那一步」算（F5；round4 评审 #1 修正 off-by-one）：
    // 长台词出现后多停在它自己身上、节拍恒定，再按倍速缩放；开场（尚未揭示）
    // 用基础节拍。
    const delay = replayDwellMs(steps, state.cursor) / state.speed
    const timer = setTimeout(
      () => setState((current) => advanceReplay(current, steps)),
      delay,
    )
    return () => clearTimeout(timer)
  }, [
    state.active,
    state.playing,
    state.ended,
    state.cursor,
    state.speed,
    steps,
  ])

  return {
    state,
    // startReplay 展开 REPLAY_IDLE（speed=1）：持久化的倍速必须在这里重新
    // 套用，否则每次点「回放」都被拉回 1×（F5）。
    start: () => setState({ ...startReplay(), speed: loadSpeed() }),
    exit: () => setState(REPLAY_IDLE),
    togglePlay: () =>
      setState((current) =>
        current.playing ? pauseReplay(current) : resumeReplay(current)
      ),
    stepOnce: () => setState((current) => advanceReplay(current, steps, true)),
    stepBack: () => setState(rewindReplay),
    restart: () =>
      setState((current) => ({ ...startReplay(), speed: current.speed })),
    toggleSpeed: () => setState(toggleReplaySpeed),
    setSpeed: (speed) => {
      storeSpeed(speed)
      setState((current) => setReplaySpeed(current, speed))
    },
  }
}

const PILL =
  'inline-flex cursor-pointer items-center rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-45'

// 回放控制条：播放/暂停（锚点停留时读作「继续」）、上一步、步进、0.5×/1×/2×
// 分段倍速、退出；终局给「重新播放 / 退出回放」（F5）。children 是进度感的
// 载体——裁判倾向轨迹小图随揭示逐点生长。
export function ReplayControls({
  handle,
  total,
  children,
}: {
  handle: ReplayHandle
  total: number
  children?: ReactNode
}) {
  const { state } = handle
  const playLabel = state.playing ? '暂停' : state.anchorKey ? '继续' : '播放'
  return (
    <Card>
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge tone='info'>回放</Badge>
          <span className='text-xs tabular-nums text-(--foreground-subtle)'>
            {state.cursor}/{total}
          </span>
          {state.ended
            ? (
              <>
                <span className='text-sm font-semibold text-(--foreground)'>
                  回放结束
                </span>
                <button
                  type='button'
                  onClick={handle.restart}
                  className={PILL}
                >
                  重新播放
                </button>
              </>
            )
            : (
              <>
                <button
                  type='button'
                  onClick={handle.togglePlay}
                  className={cn(
                    PILL,
                    state.anchorKey && !state.playing &&
                      'border-(--accent) text-(--accent)',
                  )}
                >
                  {playLabel}
                </button>
                <button
                  type='button'
                  onClick={handle.stepBack}
                  disabled={state.cursor <= 0}
                  className={PILL}
                >
                  上一步
                </button>
                <button
                  type='button'
                  onClick={handle.stepOnce}
                  className={PILL}
                >
                  步进
                </button>
                <div
                  role='group'
                  aria-label='倍速'
                  className='flex items-center gap-1'
                >
                  {REPLAY_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type='button'
                      aria-pressed={state.speed === speed}
                      onClick={() => handle.setSpeed(speed)}
                      className={cn(
                        PILL,
                        state.speed === speed &&
                          'border-(--accent) text-(--accent)',
                      )}
                    >
                      {speed}×
                    </button>
                  ))}
                </div>
              </>
            )}
          <button
            type='button'
            onClick={handle.exit}
            className={cn(PILL, 'ml-auto')}
          >
            退出回放
          </button>
        </div>
        {state.showNote
          ? (
            <p className='text-xs text-(--warning)'>
              倾向发生变化，值得停留——看看此刻裁判最挂心什么，按「继续」接着重演。
            </p>
          )
          : null}
        {children}
      </CardContent>
    </Card>
  )
}
