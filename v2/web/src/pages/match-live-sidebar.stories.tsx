import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { MatchDetail, MatchEventDTO } from '../api/types'
import { liveJudgeMatch } from '../testing/live-judge-fixtures'
import referenceMatch144 from '../testing/reference-match-144.json'
import referenceMatch120 from '../testing/reference-match-120.json'
import { MatchDetailPage } from './match-detail'

function LiveReport() {
  return (
    <MemoryRouter initialEntries={['/matches/9001']}>
      <Routes>
        <Route path='/matches/:matchId' element={<MatchDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Live judge sidebar',
  component: LiveReport,
} satisfies Meta<typeof LiveReport>
export default meta
type Story = StoryObj<typeof meta>

function lifecycleStory(match: MatchDetail, viewportWidth = 1280): Story {
  let snapshot = liveJudgeMatch(match, 0)
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  const send = (event: MatchEventDTO) => {
    controller!.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
    )
  }
  const advance = (count: number) => {
    snapshot = liveJudgeMatch(match, count)
    const turn = snapshot.turns.at(-1)!
    send({
      turnCompleted: {
        matchID: 9001,
        seq: turn.seq,
        channel: turn.channel,
        kind: turn.kind,
      },
    })
  }
  return {
    beforeEach: () => {
      snapshot = liveJudgeMatch(match, 0)
      controller = null
    },
    parameters: {
      msw: [
        http.get('/v1/matches', () => HttpResponse.json({ matches: [] })),
        http.get('/v1/matches/9001', () => HttpResponse.json(snapshot)),
        http.get('/v1/matches/9001/stream', () =>
          new HttpResponse(
            new ReadableStream<Uint8Array>({
              start(value) {
                controller = value
              },
            }),
            { headers: { 'Content-Type': 'text/event-stream' } },
          )),
      ],
    },
    play: async ({ canvasElement }) => {
      const browserPage = '__vitest_browser_runner__' in globalThis
        ? (await import('vitest/browser')).page
        : null
      if (browserPage) await browserPage.viewport(viewportWidth, 900)
      const compact = viewportWidth < 900
      const canvas = within(canvasElement)
      const region = () => canvas.getByRole('region', { name: '对话与裁判 OS' })
      const cards = () => [
        ...region().querySelectorAll<HTMLElement>(
          '[data-tm="FA.aside-card"]',
        ),
      ]
      const column = () =>
        region().querySelector<HTMLElement>(
          compact
            ? '.judge-transcript-columns'
            : '.judge-transcript-dialogue-column',
        )!
      const expectedNotes = match.verdicts.filter((verdict) =>
        verdict.key.startsWith('os-')
      )
      try {
        await canvas.findByRole('region', { name: '对话与裁判 OS' })
        await expect(within(region()).getByText('等待裁判点评…')).toBeVisible()
        const initial = column().getBoundingClientRect()
        const sameLayout = () => {
          const current = column().getBoundingClientRect()
          expect(Math.abs(current.width - initial.width)).toBeLessThan(1)
          expect(Math.abs(current.left - initial.left)).toBeLessThan(1)
          expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
            innerWidth,
          )
        }
        const checkNotes = async (count: number) => {
          await waitFor(() => expect(cards()).toHaveLength(count))
          expect(cards().map((card) => card.id)).toEqual(
            expectedNotes.slice(0, count).map((note) => `beat-${note.key}`),
          )
          for (const [index, card] of cards().entries()) {
            expect(card.textContent).toContain(
              JSON.parse(expectedNotes[index].output).os,
            )
          }
          const charts = canvasElement.querySelectorAll('.judge-sidebar-trend')
          await expect(charts).toHaveLength(count ? 1 : 0)
          if (count && compact) {
            await waitFor(() =>
              expect(
                canvasElement.querySelector(
                  '.judge-mobile-trend .judge-sidebar-trend',
                ),
              ).not.toBeNull()
            )
          }
          sameLayout()
        }
        const clickTrend = async () => {
          const point = canvasElement.querySelector<HTMLElement>(
            '.judge-sidebar-trend [data-tm="FA.trend-beat"]',
          )!
          await userEvent.click(point)
          await expect(document.activeElement?.id).toBe(
            `beat-${expectedNotes[0].key}`,
          )
        }
        await waitFor(() => expect(controller).not.toBeNull())
        advance(6)
        await checkNotes(1)
        // Live tokens appear once on both layouts; committed turns replace them.
        const next = match.turns[7]
        send({
          chunk: {
            matchID: 9001,
            seq: next.seq,
            channel: next.channel,
            speaker: next.speaker,
            phase: 'text',
            delta: '本地流式发言验证',
            call: 'say',
          },
        })
        await expect(await within(region()).findByText('本地流式发言验证'))
          .toBeVisible()
        await expect(canvas.getAllByText('本地流式发言验证')).toHaveLength(1)
        advance(12)
        await checkNotes(2)
        await expect(canvas.queryByText('本地流式发言验证')).toBeNull()
        await clickTrend()

        snapshot = match
        send({
          matchFinished: { matchID: 9001, winner: match.summary.winner! },
        })
        await canvas.findByRole('region', { name: '简要对局结果' })
        await checkNotes(expectedNotes.length)
        await clickTrend()
        // Resizing an existing report must preserve every speech and judge note.
        if (browserPage) {
          const notes = cards().map((card) => card.textContent)
          const speeches = [
            ...region().querySelectorAll('[data-speech-number]'),
          ].map((node) => node.textContent)
          await browserPage.viewport(compact ? 1280 : 390, 900)
          await waitFor(() =>
            expect(!!region().querySelector('.judge-transcript-aligned-aside'))
              .toBe(compact)
          )
          expect(cards().map((card) => card.textContent)).toEqual(notes)
          expect(
            [...region().querySelectorAll('[data-speech-number]')].map((node) =>
              node.textContent
            ),
          ).toEqual(speeches)
          await browserPage.viewport(viewportWidth, 900)
          await waitFor(() =>
            expect(!!region().querySelector('.judge-transcript-aligned-aside'))
              .toBe(!compact)
          )
        }

        await userEvent.click(canvas.getByRole('button', { name: '回放' }))
        await userEvent.click(canvas.getByRole('button', { name: '暂停' }))
        await checkNotes(0)
        await expect(canvas.queryByRole('region', { name: '简要对局结果' }))
          .toBeNull()
        await expect(canvas.queryByRole('heading', { name: '终局裁决' }))
          .toBeNull()
        await expect(
          canvas.queryByRole('heading', { name: '（阶段2/3）屏退问询' }),
        ).toBeNull()
        await expect(canvas.getByRole('switch', { name: '调试模式' }))
          .toHaveAttribute('aria-disabled', 'true')
        await userEvent.click(canvas.getByRole('button', { name: '2×' }))
        await expect(canvas.getByRole('button', { name: '2×' }))
          .toHaveAttribute('aria-pressed', 'true')
        // Stop on the second OS beat, which changes favour in the Shangyang fixture.
        for (
          let step = 0;
          step < match.turns.length + 5 && cards().length < 2;
          step++
        ) {
          await userEvent.click(canvas.getByRole('button', { name: '步进' }))
        }
        await checkNotes(2)
        await clickTrend()
        if (match.summary.scenarioID === 'shangyang-court') {
          const resume = within(region()).getByRole('button', { name: '继续' })
          await expect(resume).toBeVisible()
          await expect(within(region()).getAllByText('倾向变化').length)
            .toBeGreaterThan(0)
          await userEvent.click(resume)
          await userEvent.click(canvas.getByRole('button', { name: '暂停' }))
        }
        await userEvent.click(canvas.getByRole('button', { name: '上一步' }))
        await checkNotes(1)
        await userEvent.click(canvas.getByRole('button', { name: '步进' }))
        await checkNotes(2)
        await userEvent.click(canvas.getByRole('button', { name: '退出回放' }))
        await canvas.findByRole('region', { name: '简要对局结果' })
        await checkNotes(expectedNotes.length)
        await expect(canvas.getByRole('switch', { name: '调试模式' }))
          .toHaveAttribute('aria-disabled', 'false')
      } finally {
        if (browserPage) await browserPage.viewport(1280, 720)
      }
    },
  }
}

export const ShangyangLifecycle = lifecycleStory(
  referenceMatch144 as MatchDetail,
)
export const HonnojiLifecycle = lifecycleStory(referenceMatch120 as MatchDetail)

export const ShangyangMobileLifecycle = lifecycleStory(
  referenceMatch144 as MatchDetail,
  390,
)
export const HonnojiMobileLifecycle = lifecycleStory(
  referenceMatch120 as MatchDetail,
  390,
)
