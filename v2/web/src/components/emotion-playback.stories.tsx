import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, userEvent, waitFor } from 'storybook/test'
import type { MatchDetail, TurnDTO } from '../api/types'
import type { EmotionCategory, EmotionOutput } from '../lib/emotion-playback'
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
  waitMs: 350,
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
function Run(
  { delay, category }: { delay: number; category: EmotionCategory },
) {
  const [output, setOutput] = useState<EmotionOutput | null>(null)
  useEffect(() => {
    const committed = setTimeout(() => setOutput(pending), 700)
    const result = delay >= 0
      ? setTimeout(
        () =>
          setOutput({
            ...pending,
            status: 'ready',
            categoryId: category,
            waitMs: Math.max(0, 350 - delay),
            updateMs: Math.max(0, 1000 - delay),
          }),
        700 + delay,
      )
      : undefined
    return () => {
      clearTimeout(committed)
      clearTimeout(result)
    }
  }, [delay, category])
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
  const [category, setCategory] = useState<EmotionCategory>('E05')
  const [run, setRun] = useState(0)
  return (
    <main className='mx-auto max-w-2xl space-y-5 p-6'>
      <h1 className='text-xl font-semibold'>情感头像与正文播放预览</h1>
      <p className='text-sm text-(--foreground-subtle)'>
        使用正式对话组件及完整十类表情素材。先显示中性头像与斟酌提示，
        再根据模拟 JEV 结果切换头像，按记录的模型片段时间重放正文。
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
        <label>
          判定情绪{' '}
          <select
            aria-label='判定情绪'
            className='rounded border p-1'
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as EmotionCategory)
              setRun((value) => value + 1)
            }}
          >
            {[
              ['E01', '中性'],
              ['E02', '笃定'],
              ['E03', '疑虑'],
              ['E04', '困惑'],
              ['E05', '忧惧'],
              ['E06', '愤怒'],
              ['E07', '轻蔑'],
              ['E08', '悲伤'],
              ['E09', '关爱'],
              ['E10', '欣慰'],
            ].map(([id, label]) => <option key={id} value={id}>{label}
            </option>)}
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
      <Run key={run} delay={delay} category={category} />
    </main>
  )
}
const meta = {
  title: 'Transcript/Emotion playback',
  component: Demo,
} satisfies Meta<typeof Demo>
export default meta
type Story = StoryObj<typeof meta>
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const image = canvasElement.querySelector<HTMLImageElement>(
        '.role-portrait',
      )!
      expect(image.src).toContain('ashigaru-anxious')
      expect(image.naturalWidth).toBeGreaterThan(0)
    }, { timeout: 5000 })
  },
}
export const Unresponsive: Story = {
  args: { initialDelay: -1 },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByText('这段正文尚未公开')).toBeNull()
    await waitFor(() => expect(canvas.getByText(text)).toBeVisible(), {
      timeout: 5000,
    })
    await expect(canvas.getByTestId('emotion-status')).toHaveTextContent('E01')
    await expect(
      canvasElement.querySelector<HTMLImageElement>('.role-portrait')!.src,
    ).toContain('ashigaru-neutral')
  },
}
export const LateIgnored: Story = {
  args: { initialDelay: 1400 },
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvas.getByText(text)).toBeVisible(), {
      timeout: 5000,
    })
    await expect(canvas.getByTestId('emotion-status')).toHaveTextContent('E01')
    await expect(
      canvasElement.querySelector<HTMLImageElement>('.role-portrait')!.src,
    ).toContain('ashigaru-neutral')
  },
}
export const LateAccepted: Story = {
  args: { initialDelay: 650 },
  play: async ({ canvas, canvasElement }) => {
    await waitFor(
      () =>
        expect(canvas.getByTestId('emotion-status')).toHaveTextContent('E05'),
      { timeout: 4000 },
    )
    await expect(
      canvasElement.querySelector<HTMLImageElement>('.role-portrait')!.src,
    ).toContain('ashigaru-anxious')
    await waitFor(() => expect(canvas.getByText(text)).toBeVisible(), {
      timeout: 5000,
    })
  },
}

export const EveryExpression: Story = {
  play: async ({ canvas, canvasElement }) => {
    for (
      const [id, slug] of [
        ['E01', 'neutral'],
        ['E02', 'resolute'],
        ['E03', 'wary'],
        ['E04', 'hesitant'],
        ['E05', 'anxious'],
        ['E06', 'angry'],
        ['E07', 'scornful'],
        ['E08', 'sad'],
        ['E09', 'caring'],
        ['E10', 'moved'],
      ]
    ) {
      await userEvent.selectOptions(
        canvas.getByRole('combobox', { name: '判定情绪' }),
        id,
      )
      await waitFor(() => {
        expect(canvas.getByTestId('emotion-status')).toHaveTextContent(
          `${id} · 播放中`,
        )
        const image = canvasElement.querySelector<HTMLImageElement>(
          '.role-portrait',
        )!
        expect(image.src).toContain(`ashigaru-${slug}`)
        expect(image.naturalWidth).toBe(1254)
        expect(image.naturalHeight).toBe(1254)
      }, { timeout: 4000 })
    }
  },
}

export const ImageFailure: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        canvasElement.querySelector<HTMLImageElement>('.role-portrait')!.src,
      )
        .toContain('ashigaru-anxious')
    }, { timeout: 5000 })
    canvasElement.querySelector('.role-portrait')!.dispatchEvent(
      new Event('error'),
    )
    await waitFor(() => {
      expect(
        canvasElement.querySelector<HTMLImageElement>('.role-portrait')!.src,
      )
        .toContain('ashigaru-neutral')
    })
  },
}
