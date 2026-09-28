import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import type { MatchDetail, TurnDTO } from '../api/types'
import type { EmotionOutput } from '../lib/emotion-playback'
import {
  EmotionPlaybackProvider,
  OutputBoundary,
  useOutputPresentation,
} from './emotion-playback'
import { DialogueRow, LiveDialogueRow } from './timeline/dialogue-row'
import { speakerLabels } from './timeline/labels'

const labels = speakerLabels('honnoji-decision', {}, ['ashigaru'])
const text = '主公，请三思。军中的弟兄仍在等待您的决定。'
const turn: TurnDTO = {
  seq: 0,
  outputRef: 'preview',
  kind: 'dialogue',
  channel: 'main',
  speaker: 'ashigaru',
  finalText: text,
  reasoning: null,
}
const pending: EmotionOutput = {
  outputRef: 'preview',
  status: 'pending',
  waitMs: 200,
  updateMs: 1000,
  playback: {
    text,
    frames: [{ atMs: 0, end: 3 }, { atMs: 500, end: 7 }, {
      atMs: 1100,
      end: 12,
    }, { atMs: 2000, end: text.length }],
  },
}
function data(output: EmotionOutput | null): MatchDetail {
  return {
    summary: { id: -1 },
    turns: output ? [turn] : [],
    verdicts: [],
    emotions: { enabled: true, settled: true, outputs: output ? [output] : [] },
  } as unknown as MatchDetail
}
function Diagnostic() {
  const view = useOutputPresentation()
  return (
    <p
      className='mt-3 text-xs text-(--foreground-muted)'
      data-testid='emotion-status'
    >
      预览状态：{view?.category ?? 'E01'} ·{' '}
      {view?.waiting ? '等待判定' : view?.complete ? '播放完成' : '播放中'}
    </p>
  )
}
function Run({ delay }: { delay: number }) {
  const [output, setOutput] = useState<EmotionOutput | null>(null)
  useEffect(() => {
    const committed = setTimeout(() => setOutput(pending), 700)
    const result = delay >= 0
      ? setTimeout(
        () =>
          setOutput({
            ...pending,
            status: 'ready',
            categoryId: 'E05',
            waitMs: Math.max(0, 200 - delay),
            updateMs: Math.max(0, 1000 - delay),
          }),
        700 + delay,
      )
      : undefined
    return () => {
      clearTimeout(committed)
      clearTimeout(result)
    }
  }, [delay])
  return (
    <EmotionPlaybackProvider data={data(output)}>
      {output
        ? <DialogueRow turn={turn} labels={labels} showReasoning={false} />
        : (
          <LiveDialogueRow
            bubble={{
              seq: 0,
              channel: 'main',
              speaker: 'ashigaru',
              text: '这段正文尚未公开',
              reasoning: '斟酌',
              call: 'say',
            }}
            labels={labels}
            showReasoning={false}
          />
        )}
      <OutputBoundary outputRef='preview' speaker='ashigaru' labels={labels}>
        <Diagnostic />
      </OutputBoundary>
    </EmotionPlaybackProvider>
  )
}
function Demo({ initialDelay = 80 }: { initialDelay?: number }) {
  const [delay, setDelay] = useState(initialDelay)
  const [run, setRun] = useState(0)
  return (
    <main className='mx-auto max-w-2xl space-y-5 p-6'>
      <h1 className='text-xl font-semibold'>情感头像与正文播放预览</h1>
      <p className='text-sm text-(--foreground-subtle)'>
        使用正式对话组件及原图。完整表情素材尚未到齐，因此图片保持
        neutral；下方状态显示已选类别。示例按固定的模型片段时间重放。
      </p>
      <div className='flex flex-wrap gap-3'>
        <label>
          JEV 返回时间{' '}
          <select
            aria-label='JEV 返回时间'
            className='rounded border p-1'
            value={delay}
            onChange={(event) => {
              setDelay(Number(event.target.value))
              setRun((value) => value + 1)
            }}
          >
            <option value={80}>80 ms：同步开始</option>
            <option value={650}>650 ms：播放中更新</option>
            <option value={1400}>1400 ms：保持 neutral</option>
            <option value={-1}>无响应：保持 neutral</option>
          </select>
        </label>
        <button
          type='button'
          className='rounded border px-3'
          onClick={() => setRun((value) => value + 1)}
        >
          重新演示
        </button>
      </div>
      <Run key={run} delay={delay} />
    </main>
  )
}
const meta = {
  title: 'Transcript/Emotion playback',
  component: Demo,
} satisfies Meta<typeof Demo>
export default meta
type Story = StoryObj<typeof meta>
export const Interactive: Story = {}
export const Unresponsive: Story = {
  args: { initialDelay: -1 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('这段正文尚未公开')).toBeNull()
    await waitFor(() => expect(canvas.getByText(text)).toBeVisible(), {
      timeout: 5000,
    })
    await expect(canvas.getByTestId('emotion-status')).toHaveTextContent('E01')
  },
}
export const LateIgnored: Story = {
  args: { initialDelay: 1400 },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText(text)).toBeVisible(), {
      timeout: 5000,
    })
    await expect(canvas.getByTestId('emotion-status')).toHaveTextContent('E01')
  },
}
export const LateAccepted: Story = {
  args: { initialDelay: 650 },
  play: async ({ canvas }) => {
    await waitFor(
      () =>
        expect(canvas.getByTestId('emotion-status')).toHaveTextContent('E05'),
      { timeout: 4000 },
    )
    await waitFor(() => expect(canvas.getByText(text)).toBeVisible(), {
      timeout: 5000,
    })
  },
}
