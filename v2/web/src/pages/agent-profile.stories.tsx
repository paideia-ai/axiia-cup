import { AuthProvider } from '../context/auth'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { expect, userEvent, within } from 'storybook/test'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { NavigationMemoryProvider } from '../context/navigation-memory'
import {
  finishedMatch,
  inventory,
  scenario,
  scenarioList,
  versions,
} from '../testing/v34-fixtures'
import { AgentViewPage } from './agent-view'
import { AgentIdentityPage } from './agent-identity'
import { NPCViewPage } from './npc-view'
import { MatchDetailPage } from './match-detail'
import { MatchesPage } from './matches'
import { StandingsPage } from './standings'
import { VersionAgentPage } from './version-agent'
import { ScenarioDetailPage } from './scenario-detail'

const publicVersions = [
  {
    id: 466,
    ordinal: 1,
    isEntry: false,
    createdAt: 1789000000,
    modelID: 'kimi-k2.6',
    matchCount: 10,
    winCount: 4,
    drawCount: 1,
    lossCount: 5,
  },
  {
    id: 477,
    ordinal: 2,
    isEntry: true,
    createdAt: 1789100000,
    modelID: 'kimi-k2.6',
    matchCount: 20,
    winCount: 13,
    drawCount: 1,
    lossCount: 6,
  },
]
const publicAgent = {
  agentID: 202,
  scenarioID: scenario.summary.id,
  scenarioTitle: scenario.summary.title,
  side: 'b',
  sideName: '甘龙',
  name: '稳健派',
  ownerName: '丞双双',
  // Deliberately hostile response: the public view must never render leaked prompts.
  versions: publicVersions.map((v) => ({
    ...v,
    prompt: 'PRIVATE_OTHER_MUST_NOT_RENDER',
  })),
}
const npc = {
  scenarioID: scenario.summary.id,
  scenarioTitle: scenario.summary.title,
  key: 'ganlong-steady',
  side: 'b',
  sideName: '甘龙',
  label: '稳健守旧派',
  modelID: 'kimi-k2.6',
  prompt: '本场旧配置：先询问新制度的实施代价，再提出能检验成效的条件。',
  versionTag: 'old-match-configuration',
  matchCount: 10,
  winCount: 4,
  drawCount: 2,
  lossCount: 4,
  challengeCount: 15,
}
const npcMatch = {
  ...finishedMatch,
  summary: {
    ...finishedMatch.summary,
    id: 9001,
    participants: {
      a: {
        agentID: 101,
        versionID: 1002,
        ownerDisplayName: '我',
        isMine: true,
      },
      b: { presetKey: npc.key, modelID: npc.modelID, isMine: false },
    },
  },
}
const playerMatch = {
  ...finishedMatch,
  summary: {
    ...finishedMatch.summary,
    id: 9002,
    participants: {
      a: {
        agentID: 101,
        versionID: 1002,
        ownerDisplayName: '我',
        isMine: true,
      },
      b: {
        agentID: 202,
        versionID: 466,
        ownerDisplayName: '丞双双',
        modelID: 'kimi-k2.6',
        isMine: false,
      },
    },
  },
}
const handlers = [
  http.get(
    '/v1/auth/me',
    () =>
      HttpResponse.json({ error: 'unauthorized', message: '请登录' }, {
        status: 401,
      }),
  ),
  http.get(
    '/v1/models',
    () =>
      HttpResponse.json({
        models: [{ id: 'fixture-model', label: '策略模型' }, {
          id: 'kimi-k2.6',
          label: 'Kimi K2.6',
        }],
      }),
  ),
  http.get('/v1/my/agents', () => HttpResponse.json(inventory)),
  http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
  http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
  http.get(
    '/v1/agents/101/draft',
    () =>
      HttpResponse.json({
        fields: {},
        scenarioID: scenario.summary.id,
        side: 'a',
      }),
  ),
  http.get(
    '/v1/agents/101/versions',
    () => HttpResponse.json({ versions, entryVersionID: 1002 }),
  ),
  http.get('/v1/agents/101/diff', ({ request }) => {
    const params = new URL(request.url).searchParams
    return HttpResponse.json({
      base: versions.find((v) => v.id === Number(params.get('base'))),
      head: versions.find((v) => v.id === Number(params.get('head'))),
    })
  }),
  http.get(
    '/v1/agents/202/draft',
    () =>
      HttpResponse.json({ error: 'forbidden', message: '仅限主人' }, {
        status: 403,
      }),
  ),
  http.get('/v1/agents/202/public', () => HttpResponse.json(publicAgent)),
  http.get('/v1/agents/202/matches', ({ request }) => {
    const params = new URL(request.url).searchParams
    const versionID = Number(params.get('versionID'))
    return HttpResponse.json({
      open: true,
      matches: params.has('before')
        ? [{ ...playerMatch.summary, id: 8900 }]
        : Array.from(
          { length: 20 },
          (_, i) => ({
            ...playerMatch.summary,
            id: 9002 - i,
            participants: {
              ...playerMatch.summary.participants,
              b: { ...playerMatch.summary.participants.b, versionID },
            },
          }),
        ),
    })
  }),
  http.get(
    '/v1/scenarios/:id/npcs/:key',
    ({ request }) =>
      HttpResponse.json({
        ...npc,
        sourceMatchID: Number(new URL(request.url).searchParams.get('matchID')),
      }),
  ),
  http.get(
    '/v1/scenarios/:id/npcs/:key/matches',
    () => HttpResponse.json({ matches: [npcMatch.summary], open: true }),
  ),
  http.get(
    '/v1/matches',
    () =>
      HttpResponse.json({
        matches: [npcMatch.summary, playerMatch.summary],
        open: true,
      }),
  ),
  http.get(
    '/v1/matches/:id',
    ({ params }) =>
      HttpResponse.json(params.id === '9001' ? npcMatch : playerMatch),
  ),
  http.get(
    '/v1/tournaments/2/standings',
    () =>
      HttpResponse.json({
        entries: [{
          playerID: 'player',
          playerName: '丞双双',
          submissionIDs: [466],
          wins: 4,
          losses: 5,
          buchholz: 12,
          matchesPlayed: 10,
          winRate: 40,
          rank: 1,
        }],
      }),
  ),
  http.get(
    '/v1/versions/466/ref',
    () => HttpResponse.json({ versionID: 466, agentID: 202 }),
  ),
]

function Page({ entry }: { entry: string }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <NavigationMemoryProvider scope='identity-preview'>
        <div className='mb-8 flex flex-wrap items-center gap-4 border-b border-(--border-soft) pb-4 text-sm'>
          <span className='text-(--foreground-muted)'>本地预览 · 示例数据</span>
          <Link to='/agents/101'>我的主页</Link>
          <Link to='/matches/9001'>NPC 对局</Link>
          <Link to='/matches/9002'>玩家对局</Link>
          <Link to='/tournaments/2'>赛事排名</Link>
          <Link to='/scenarios/shangyang-court'>场景介绍</Link>
        </div>
        <Routes>
          <Route path='/agents/:agentId' element={<AgentViewPage />} />
          <Route
            path='/agents/:agentId/identity'
            element={<AgentIdentityPage />}
          />
          <Route
            path='/scenarios/:scenarioId/npcs/:presetKey'
            element={<NPCViewPage />}
          />
          <Route
            path='/scenarios/:scenarioId'
            element={
              <AuthProvider>
                <ScenarioDetailPage />
              </AuthProvider>
            }
          />
          <Route path='/matches/:matchId' element={<MatchDetailPage />} />
          <Route path='/matches' element={<MatchesPage />} />
          <Route
            path='/tournaments/:tournamentId'
            element={<StandingsPage />}
          />
          <Route path='/versions/:versionId' element={<VersionAgentPage />} />
        </Routes>
      </NavigationMemoryProvider>
    </MemoryRouter>
  )
}
const meta = {
  title: 'Agents/Identity review',
  component: Page,
  parameters: { msw: handlers },
} satisfies Meta<typeof Page>
export default meta
type Story = StoryObj<typeof meta>

export const OwnerComparison: Story = {
  args: { entry: '/agents/101' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(await c.findByRole('button', { name: '版本对比' }))
    await expect(await c.findByLabelText('v1 策略正文')).toBeVisible()
    await expect(c.getByLabelText('v2 策略正文')).toBeVisible()
    await expect(c.queryByTestId('identity-version')).toBeNull()
    await expect(c.queryByTestId('profile-record')).toBeNull()
    await expect(c.queryByRole('heading', { name: '对战记录' })).toBeNull()
  },
}
export const PlayerFromTranscript: Story = {
  args: { entry: '/matches/9002' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const entry = await c.findByRole('link', { name: '查看智能体资料' })
    await expect(entry).toHaveAttribute(
      'href',
      '/agents/202/identity?version=466&match=9002',
    )
    await userEvent.click(entry)
    const cards = await c.findAllByTestId('identity-version')
    await expect(cards).toHaveLength(2)
    await expect(cards[0]).toHaveTextContent('#466')
    await expect(cards[0]).toHaveTextContent('本场对局版本')
    await expect(cards[0]).toHaveTextContent('40%')
    await expect(cards[1]).toHaveTextContent('65%')
    await expect(c.queryByRole('combobox')).toBeNull()
    await expect(canvasElement.textContent).not.toContain(
      'PRIVATE_OTHER_MUST_NOT_RENDER',
    )
    await expect(c.queryByRole('button', { name: '版本对比' })).toBeNull()
    await expect(c.queryByRole('heading', { name: '对战记录' })).toBeNull()
    await userEvent.click(cards[0])
    await c.findByRole('heading', { name: '历史' })
    await c.findByRole('link', { name: /对战 #9002/ })
    await userEvent.click(c.getByRole('button', { name: '下一页' }))
    await expect(await c.findByRole('link', { name: /对战 #8900/ }))
      .toBeVisible()
    await userEvent.click(c.getByRole('button', { name: '上一页' }))
    await expect(await c.findByRole('link', { name: /对战 #9002/ }))
      .toBeVisible()
  },
}
export const NPCFromTranscript: Story = {
  args: { entry: '/matches/9001' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(
      await c.findByRole('link', { name: '查看智能体资料' }),
    )
    await expect(await c.findByText(npc.prompt)).toBeVisible()
    await expect(c.getAllByTestId('identity-version')).toHaveLength(1)
    await expect(c.queryByRole('heading', { name: '对战记录' })).toBeNull()
    await userEvent.click(c.getByTestId('identity-version'))
    await expect(await c.findByRole('heading', { name: '历史' })).toBeVisible()
    await expect(await c.findByRole('link', { name: /对战 #9001/ }))
      .toBeVisible()
  },
}
export const TournamentVersion: Story = {
  args: { entry: '/tournaments/2' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(
      await c.findByRole('link', { name: '查看版本 #466 的智能体' }),
    )
    const cards = await c.findAllByTestId('identity-version')
    await expect(cards[0]).toHaveTextContent('#466')
    await expect(cards[0]).toHaveTextContent('赛事提交版本')
  },
}
export const PlayerIdentity: Story = {
  args: { entry: '/agents/202/identity?version=466&match=9002' },
}
export const NPCIdentity: Story = {
  args: { entry: '/scenarios/shangyang-court/npcs/ganlong-steady?match=9001' },
}
export const UnknownHistoricalVersion: Story = {
  args: { entry: '/agents/202/identity?version=999&match=9002' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByText('版本 #999 暂不可用。')).toBeVisible()
    await expect(c.queryByText('本场对局版本')).toBeNull()
  },
}
export const OldBackendCannotSubstituteCurrentNPC: Story = {
  args: NPCIdentity.args,
  parameters: {
    msw: [
      http.get('/v1/scenarios/:id/npcs/:key', () => HttpResponse.json(npc)),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByRole('alert')).toHaveTextContent(
      '暂时无法加载该场对局的 NPC 配置。',
    )
    await expect(c.queryByText(npc.prompt)).toBeNull()
    await expect(c.getByRole('button', { name: '重试' })).toBeVisible()
  },
}
export const OwnerIdentityRedirect: Story = {
  args: { entry: '/agents/101/identity?version=1001' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByRole('button', { name: '版本对比' }))
      .toBeVisible()
    await expect(c.queryByTestId('agent-identity')).toBeNull()
  },
}

export const EmptyPlayerVersions: Story = {
  args: PlayerIdentity.args,
  parameters: {
    msw: [
      http.get(
        '/v1/agents/202/public',
        () => HttpResponse.json({ ...publicAgent, versions: [] }),
      ),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByText('尚未保存版本。')).toBeVisible()
    await expect(c.queryByTestId('identity-version')).toBeNull()
  },
}
export const NoNPCEntryOnScenario: Story = {
  args: { entry: '/scenarios/shangyang-court' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await c.findByRole('heading', { level: 1 })
    await expect(c.queryByRole('region', { name: '官方 NPC' })).toBeNull()
    await expect(canvasElement.querySelector('a[href*="/npcs/"]')).toBeNull()
  },
}
