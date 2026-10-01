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

function lifecycleStory(match: MatchDetail): Story {
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
      const canvas = within(canvasElement)
      const sidebar = await canvas.findByRole('complementary', {
        name: '裁判 OS 侧栏',
      })
      await expect(within(sidebar).getByText('等待裁判点评…')).toBeVisible()
      const column = canvasElement.querySelector(
        '.judge-transcript-dialogue-column',
      )!
      const width = column.getBoundingClientRect().width
      const sidebarLeft = sidebar.getBoundingClientRect().left
      const sameColumns = () => {
        const current = canvas.getByRole('complementary', {
          name: '裁判 OS 侧栏',
        })
        expect(
          Math.abs(
            current.getBoundingClientRect().left -
              sidebarLeft,
          ),
        ).toBeLessThan(1)
        expect(
          Math.abs(
            canvasElement.querySelector('.judge-transcript-dialogue-column')!
              .getBoundingClientRect().width - width,
          ),
        ).toBeLessThan(1)
      }
      await waitFor(() => expect(controller).not.toBeNull())
      advance(6)
      await waitFor(() =>
        expect(sidebar.querySelectorAll('[data-tm="FA.aside-card"]'))
          .toHaveLength(1)
      )
      sameColumns()
      // A token in the next public speech must remain visible inside the dialogue column.
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
      await expect(
        await within(column as HTMLElement).findByText('本地流式发言验证'),
      ).toBeVisible()
      advance(12)
      await waitFor(() =>
        expect(sidebar.querySelectorAll('[data-tm="FA.aside-card"]'))
          .toHaveLength(2)
      )
      sameColumns()
      snapshot = match
      send({ matchFinished: { matchID: 9001, winner: match.summary.winner! } })
      await canvas.findByRole('region', { name: '简要对局结果' })
      sameColumns()
      const completedSidebar = canvas.getByRole('complementary', {
        name: '裁判 OS 侧栏',
      })
      await expect(
        completedSidebar.querySelectorAll('[data-tm="FA.aside-card"]'),
      ).toHaveLength(
        match.verdicts.filter((verdict) => verdict.key.startsWith('os-'))
          .length,
      )
      await userEvent.click(canvas.getByRole('button', { name: '回放' }))
      const replaySidebar = canvas.getByRole('complementary', {
        name: '裁判 OS 侧栏',
      })
      await expect(replaySidebar.querySelectorAll('[data-tm="FA.aside-card"]'))
        .toHaveLength(0)
      await expect(canvas.queryByRole('region', { name: '简要对局结果' }))
        .toBeNull()
      await expect(canvas.queryByRole('heading', { name: '终局裁决' }))
        .toBeNull()
      sameColumns()
      await userEvent.click(canvas.getByRole('button', { name: '退出回放' }))
      await canvas.findByRole('region', { name: '简要对局结果' })
      sameColumns()
    },
  }
}

export const ShangyangLifecycle = lifecycleStory(
  referenceMatch144 as MatchDetail,
)
export const HonnojiLifecycle = lifecycleStory(referenceMatch120 as MatchDetail)
