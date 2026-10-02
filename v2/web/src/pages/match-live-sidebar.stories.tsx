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

const fromBottom = () =>
  document.documentElement.scrollHeight - innerHeight - scrollY

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
      // Read the layout off the real viewport: outside the runner it is unchanged.
      const compact = matchMedia('(max-width: 899px)').matches
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
      const favours = expectedNotes.map((note) => JSON.parse(note.output).favor)
      const firstAside = match.turns.find((turn) =>
        turn.channel === 'judge-aside'
      )!
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
        // Live shows the trend from the first note; replay keeps a slot for
        // every beat and fills them in as they are revealed.
        const checkNotes = async (count: number, replaying = false) => {
          await waitFor(() => expect(cards()).toHaveLength(count))
          expect(cards().map((card) => card.id)).toEqual(
            expectedNotes.slice(0, count).map((note) => `beat-${note.key}`),
          )
          for (const [index, card] of cards().entries()) {
            expect(card.textContent).toContain(
              JSON.parse(expectedNotes[index].output).os,
            )
          }
          const charted = count > 0 || replaying
          await expect(canvasElement.querySelectorAll('.judge-sidebar-trend'))
            .toHaveLength(charted ? 1 : 0)
          await expect(
            canvasElement.querySelectorAll('[data-tm="FA.trend-beat"]'),
          ).toHaveLength(count)
          if (charted && compact) {
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
        // A reader following the live transcript stays at its bottom.
        const followsBottom = (label: string) =>
          waitFor(() => expect(fromBottom(), label).toBeLessThanOrEqual(1))

        await waitFor(() => expect(controller).not.toBeNull())
        advance(firstAside.seq)
        await checkNotes(0)
        // The judge's aside streams into the sidebar, never as a speech.
        send({
          chunk: {
            matchID: 9001,
            seq: firstAside.seq,
            channel: firstAside.channel,
            speaker: firstAside.speaker,
            phase: 'text',
            delta: '<os>两方各执一词',
            call: 'act',
          },
        })
        const pending = await waitFor(() => {
          const card = region().querySelector<HTMLElement>(
            '[data-tm="FA.aside-pending"]',
          )
          expect(card).not.toBeNull()
          return card!
        })
        await expect(pending.closest('aside')).not.toBeNull()
        await expect(
          canvasElement.querySelectorAll('[data-tm="FA.live-dialogue-row"]'),
        ).toHaveLength(0)
        await expect(within(region()).queryByText('等待裁判点评…')).toBeNull()

        scrollTo(0, document.documentElement.scrollHeight)
        await followsBottom('manual scroll')
        advance(firstAside.seq + 1)
        await checkNotes(1)
        await expect(region().querySelector('[data-tm="FA.aside-pending"]'))
          .toBeNull()
        await followsBottom('first note')
        // Live tokens appear once on both layouts; committed turns replace them.
        const next = match.turns[firstAside.seq + 1]
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
        await followsBottom('streaming speech')
        advance(12)
        await checkNotes(2)
        await expect(canvas.queryByText('本地流式发言验证')).toBeNull()
        await followsBottom('second note')
        await clickTrend()

        // Finishing keeps the same transcript: notes, focus and all.
        const liveRegion = region()
        const focused = document.activeElement
        snapshot = match
        send({
          matchFinished: { matchID: 9001, winner: match.summary.winner! },
        })
        await canvas.findByRole('region', { name: '简要对局结果' })
        await expect(liveRegion.isConnected).toBe(true)
        await expect(document.activeElement).toBe(focused)
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
        await checkNotes(0, true)
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
        for (
          let step = 0;
          step < match.turns.length + 5 && cards().length < 2;
          step++
        ) {
          await userEvent.click(canvas.getByRole('button', { name: '步进' }))
        }
        await checkNotes(2, true)
        await clickTrend()
        // A favour change pauses the replay on its note.
        if (favours[1] !== favours[0]) {
          const resume = within(region()).getByRole('button', { name: '继续' })
          await expect(resume).toBeVisible()
          await expect(within(region()).getAllByText('倾向变化').length)
            .toBeGreaterThan(0)
          await userEvent.click(resume)
          await userEvent.click(canvas.getByRole('button', { name: '暂停' }))
        }
        await userEvent.click(canvas.getByRole('button', { name: '上一步' }))
        await checkNotes(1, true)
        await userEvent.click(canvas.getByRole('button', { name: '步进' }))
        await checkNotes(2, true)
        // The verdict stage stays outside the judge columns, as in the report.
        for (
          let step = 0;
          step < match.turns.length + 10 && !canvas.queryByText('回放结束');
          step++
        ) {
          await userEvent.click(canvas.getByRole('button', { name: '步进' }))
        }
        await expect(canvas.getByText('回放结束')).toBeVisible()
        await expect(
          canvas.getByRole('heading', { name: /（阶段3\/3）/ })
            .closest('.judge-transcript'),
        ).toBeNull()
        await userEvent.click(canvas.getByRole('button', { name: '退出回放' }))
        await canvas.findByRole('region', { name: '简要对局结果' })
        await checkNotes(expectedNotes.length)
        await expect(canvas.getByRole('switch', { name: '调试模式' }))
          .toHaveAttribute('aria-disabled', 'false')
      } finally {
        try {
          localStorage.removeItem('axiia-replay-speed')
        } catch {
          // Storage unavailable: nothing was stored either.
        }
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

// A court/council match that ended without any judge note keeps the
// single-column transcript: nothing is left waiting for a note.
function withoutNotesStory(match: MatchDetail): Story {
  return {
    parameters: {
      msw: [
        http.get('/v1/matches', () => HttpResponse.json({ matches: [] })),
        http.get('/v1/matches/9001', () => HttpResponse.json(match)),
      ],
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement)
      await canvas.findByRole('heading', { name: '对战 #9001' })
      await waitFor(() =>
        expect(
          canvasElement.querySelectorAll('[data-tm="FA.dialogue-row"]').length,
        ).toBeGreaterThan(0)
      )
      await expect(canvas.queryByRole('region', { name: '对话与裁判 OS' }))
        .toBeNull()
      await expect(canvas.queryByText('等待裁判点评…')).toBeNull()
      await expect(canvasElement.querySelector('.judge-mobile-trend'))
        .toBeNull()
    },
  }
}

const court = referenceMatch144 as MatchDetail
export const ScoredWithoutNotesKeepsOneColumn = withoutNotesStory({
  ...court,
  summary: { ...court.summary, id: 9001 },
  verdicts: court.verdicts.filter((verdict) => !verdict.key.startsWith('os-')),
})

const council = liveJudgeMatch(referenceMatch120 as MatchDetail, 5)
export const FailedBeforeFirstNoteKeepsOneColumn = withoutNotesStory({
  ...council,
  summary: { ...council.summary, id: 9001, finished: true },
  error: '裁判模型超时',
})
