import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import type { ReplayMachineState, ReplayStep } from '../lib/replay'
import {
  advanceReplay,
  pauseReplay,
  REPLAY_END_HOLD_MS,
  REPLAY_IDLE,
  REPLAY_STEP_MS,
  resumeReplay,
  startReplay,
  toggleReplaySpeed,
} from '../lib/replay'
import { cn } from '../lib/cn'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

// 回放（#24）的计时器壳：纯状态转移在 lib/replay.ts，这里只负责 React 状态、
// 自动推进的 setTimeout 与终局停留后的自动恢复。

export interface ReplayHandle {
  state: ReplayMachineState
  start: () => void
  exit: () => void
  togglePlay: () => void
  stepOnce: () => void
  toggleSpeed: () => void
}

export function useReplay(steps: ReplayStep[]): ReplayHandle {
  const [state, setState] = useState<ReplayMachineState>(REPLAY_IDLE)

  useEffect(() => {
    if (!state.active || !state.playing || state.ended) return
    const timer = setTimeout(
      () => setState((current) => advanceReplay(current, steps)),
      REPLAY_STEP_MS / state.speed,
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

  // 回放结束：短暂停留后自动恢复完整战报。
  useEffect(() => {
    if (!state.ended) return
    const timer = setTimeout(() => setState(REPLAY_IDLE), REPLAY_END_HOLD_MS)
    return () => clearTimeout(timer)
  }, [state.ended])

  return {
    state,
    start: () => setState(startReplay()),
    exit: () => setState(REPLAY_IDLE),
    togglePlay: () =>
      setState((current) =>
        current.playing ? pauseReplay(current) : resumeReplay(current)
      ),
    stepOnce: () => setState((current) => advanceReplay(current, steps, true)),
    toggleSpeed: () => setState(toggleReplaySpeed),
  }
}

const PILL =
  'inline-flex cursor-pointer items-center rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-45'

// 回放控制条：播放/暂停（锚点停留时读作「继续」）、步进、倍速、退出。
// children 是进度感的载体——裁判倾向轨迹小图随揭示逐点生长。
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
              <span className='text-sm font-semibold text-(--foreground)'>
                回放结束，正在恢复完整战报…
              </span>
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
                  onClick={handle.stepOnce}
                  className={PILL}
                >
                  步进
                </button>
                <button
                  type='button'
                  onClick={handle.toggleSpeed}
                  aria-label='倍速'
                  className={PILL}
                >
                  {state.speed}x
                </button>
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
