import { AppShell } from '../components/layout/app-shell'
import { AuthProvider, useAuth } from '../context/auth'
import type { PropsWithChildren } from 'react'
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
      HttpResponse.json({
        account: {
          id: 'identity-preview',
          displayName: '预览用户',
          email: 'preview@example.test',
          isAdmin: false,
          hasTOTP: false,
        },
        elevated: false,
        firstBattleDone: true,
      }),
  ),
  http.get('/v1/notifications/bell', () =>
    new HttpResponse(': preview\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    })),
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

function AuthenticatedPreview({ children }: PropsWithChildren) {
  const { isLoading } = useAuth()
  return isLoading ? <p>正在加载预览…</p> : <AppShell>{children}</AppShell>
}

function Page({ entry }: { entry: string }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <NavigationMemoryProvider scope='identity-preview'>
          <AuthenticatedPreview>
            <div className='mb-8 flex flex-wrap items-center gap-4 border-b border-(--border-soft) pb-4 text-sm'>
              <span className='text-(--foreground-muted)'>
                本地预览 · 示例数据
              </span>
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
              <Route
                path='/versions/:versionId'
                element={<VersionAgentPage />}
              />
            </Routes>
          </AuthenticatedPreview>
        </NavigationMemoryProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}
const meta = {
  title: 'Agents/Identity review',
  component: Page,
  parameters: { msw: handlers, fullApp: true },
} satisfies Meta<typeof Page>
export default meta
type Story = StoryObj<typeof meta>

export const MatchCards: Story = {
  args: { entry: '/matches/9001' },
}

export const OwnerFromTranscript: Story = {
  args: { entry: '/matches/9001' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const entry = await c.findByRole('link', {
      name: /商鞅.*打开我的智能体主页/,
    })
    await expect(entry).toHaveAttribute('href', '/agents/101?version=1002')
    await userEvent.click(c.getByRole('button', { name: '复制 id' }))
    await expect(entry).toBeVisible()
    await userEvent.click(entry)
    await expect(await c.findByRole('button', { name: '版本对比' }))
      .toBeVisible()
  },
}

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
    const entry = await c.findByRole('link', {
      name: /甘龙.*打开智能体资料/,
    })
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
export const HistoryReturnKeepsPage: Story = {
  args: { entry: '/matches?agent=202&version=466' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(await c.findByRole('button', { name: '下一页' }))
    await userEvent.click(await c.findByRole('link', { name: /对战 #8900/ }))
    await userEvent.click(await c.findByRole('link', { name: '← 对战列表' }))
    await expect(await c.findByRole('link', { name: /对战 #8900/ }))
      .toBeVisible()
    await expect(c.queryByRole('link', { name: /对战 #9002/ })).toBeNull()
    await expect(c.getByRole('button', { name: '上一页' })).toBeEnabled()
  },
}

export const HistoryRestoresCursor: Story = {
  args: { entry: '/matches?agent=202&version=466&cursor=8983' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(await c.findByRole('link', { name: /对战 #8900/ }))
      .toBeVisible()
    await userEvent.click(c.getByRole('button', { name: '上一页' }))
    await expect(await c.findByRole('link', { name: /对战 #9002/ }))
      .toBeVisible()
  },
}

const mixedHistory = Array.from({ length: 25 }, (_, index) => ({
  ...playerMatch.summary,
  id: 9002 - index,
  initiatorIsMe: false,
  participants: {
    a: { ...playerMatch.summary.participants.a, isMine: index >= 20 },
    b: playerMatch.summary.participants.b,
  },
}))
const filteredHistory = ({ request }: { request: Request }) => {
  const params = new URL(request.url).searchParams
  const before = Number(params.get('before') ?? Infinity)
  return HttpResponse.json({
    open: true,
    matches: mixedHistory.filter((match) =>
      match.id < before &&
      (params.get('mine') !== '1' || match.participants.a.isMine)
    ).slice(0, 20),
  })
}

export const OnlyMineBeforePagination: Story = {
  args: { entry: '/matches?agent=202&version=466&cursor=8983' },
  parameters: {
    msw: [http.get('/v1/agents/202/matches', filteredHistory), ...handlers],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await c.findByRole('link', { name: /对战 #8982/ })
    await userEvent.click(c.getByRole('checkbox', { name: '仅自己对局' }))
    await expect(await c.findByRole('link', { name: /对战 #8982/ }))
      .toBeVisible()
    await expect(c.queryByRole('button', { name: '上一页' })).toBeNull()
    await userEvent.click(c.getByRole('checkbox', { name: '仅自己对局' }))
    await expect(await c.findByRole('link', { name: /对战 #9002/ }))
      .toBeVisible()
    await userEvent.click(c.getByRole('checkbox', { name: '仅自己对局' }))
    await expect(await c.findByRole('link', { name: /对战 #8982/ }))
      .toBeVisible()
    await expect(c.queryByRole('link', { name: /对战 #9002/ })).toBeNull()
  },
}

export const NPCOnlyMineBeforePagination: Story = {
  args: {
    entry: '/matches?scenario=shangyang-court&npc=ganlong-steady&match=9001',
  },
  parameters: {
    msw: [
      http.get('/v1/scenarios/:id/npcs/:key/matches', filteredHistory),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await c.findByRole('link', { name: /对战 #9002/ })
    await userEvent.click(c.getByRole('checkbox', { name: '仅自己对局' }))
    await expect(await c.findByRole('link', { name: /对战 #8982/ }))
      .toBeVisible()
    await expect(c.queryByRole('link', { name: /对战 #9002/ })).toBeNull()
  },
}

export const NPCFromTranscript: Story = {
  args: { entry: '/matches/9001' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(
      await c.findByRole('link', { name: /甘龙.*打开智能体资料/ }),
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
async function expectShellWidth(canvasElement: HTMLElement, testID: string) {
  const content = await within(canvasElement).findByTestId(testID)
  const main = content.closest('main')!
  const box = main.getBoundingClientRect()
  const style = getComputedStyle(main)
  const left = box.left + parseFloat(style.paddingLeft)
  const width = box.width - parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  await expect(Math.abs(content.getBoundingClientRect().left - left))
    .toBeLessThan(1)
  await expect(Math.abs(content.getBoundingClientRect().width - width))
    .toBeLessThan(1)
}

export const PlayerIdentity: Story = {
  args: { entry: '/agents/202/identity?version=466&match=9002' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByTestId('identity-version')
    await expectShellWidth(canvasElement, 'agent-identity')
  },
}
export const NPCIdentity: Story = {
  args: { entry: '/scenarios/shangyang-court/npcs/ganlong-steady?match=9001' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(npc.prompt)
    await expectShellWidth(canvasElement, 'npc-identity')
  },
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
    await expectShellWidth(canvasElement, 'npc-identity')
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
    await expectShellWidth(canvasElement, 'agent-identity')
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

// Role identity comes from the selected version/preset, never its faction.
const honnojiScenario = {
  ...scenario,
  summary: {
    ...scenario.summary,
    id: 'honnoji-decision',
    title: '本能寺之变·敌在何处',
    sideAName: '主张杀信长',
    sideBName: '主张不杀信长',
  },
  presets: [{
    key: 'envoy',
    side: 'a',
    label: '空旗',
    modelID: 'fixture-model',
    options: { role: 'yoshiaki' },
  }],
}
export const HonnojiOwnerRoles: Story = {
  args: { entry: '/agents/101' },
  parameters: {
    msw: [
      http.get(
        '/v1/agents/101/draft',
        () =>
          HttpResponse.json({
            fields: {},
            scenarioID: 'honnoji-decision',
            side: 'a',
          }),
      ),
      http.get(
        '/v1/agents/101/versions',
        () =>
          HttpResponse.json({
            versions: versions.map((v, index) => ({
              ...v,
              options: JSON.stringify({
                role: index === 1 ? 'yoshiaki' : 'chosokabe',
              }),
            })),
            entryVersionID: 1001,
          }),
      ),
      http.get('/v1/scenarios/:id', () => HttpResponse.json(honnojiScenario)),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1 }))
      .toHaveTextContent('足利义昭的使者')
    await expect(
      canvas.getByRole('button', {
        name: '将 v1 设为长宗我部元亲的密使参赛版本',
      }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '将 v2 设为足利义昭的使者参赛版本' }),
    ).toBeVisible()
  },
}
export const HonnojiNpcRole: Story = {
  args: { entry: '/scenarios/honnoji-decision/npcs/envoy?match=9001' },
  parameters: {
    msw: [
      http.get(
        '/v1/scenarios/:id/npcs/:key',
        () =>
          HttpResponse.json({
            ...npc,
            sourceMatchID: 9001,
            scenarioID: 'honnoji-decision',
            scenarioTitle: honnojiScenario.summary.title,
            side: 'a',
            sideName: '主张杀信长',
            role: { key: 'yoshiaki', name: '足利义昭的使者', side: 'a' },
            key: 'envoy',
            label: '空旗',
          }),
      ),
      http.get('/v1/scenarios/:id', () => HttpResponse.json(honnojiScenario)),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '足利义昭的使者「空旗」' }),
    ).toBeVisible()
  },
}

export const HonnojiPublicVersionRoles: Story = {
  args: { entry: '/agents/202' },
  parameters: {
    msw: [
      http.get('/v1/agents/202/public', () =>
        HttpResponse.json({
          agentID: 202,
          scenarioID: 'honnoji-decision',
          scenarioTitle: honnojiScenario.summary.title,
          side: 'a',
          sideName: '主张杀信长',
          ownerName: '另一位玩家',
          name: '公开策略',
          versions: versions.map((v, i) => ({
            id: v.id,
            ordinal: v.ordinal,
            isEntry: v.isEntry,
            createdAt: 0,
            matchCount: v.matchCount,
            winCount: v.winCount,
            role: {
              key: i ? 'yoshiaki' : 'chosokabe',
              name: i ? '足利义昭的使者' : '长宗我部元亲的密使',
              side: 'a',
            },
          })),
        })),
      http.get('/v1/scenarios/:id', () => HttpResponse.json(honnojiScenario)),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1 }))
      .toHaveTextContent('足利义昭的使者')
    const cards = canvas.getAllByTestId('identity-version')
    await expect(cards[0]).toHaveTextContent('足利义昭的使者')
    await expect(cards[1]).toHaveTextContent('长宗我部元亲的密使')
    await expect(cards[1]).toHaveAttribute(
      'href',
      '/matches?agent=202&version=1001',
    )
  },
}

export const HonnojiPublicHistoricalRole: Story = {
  ...HonnojiPublicVersionRoles,
  args: { entry: '/agents/202/identity?version=1001&match=9002' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { level: 1 }))
      .toHaveTextContent('长宗我部元亲的密使')
    await expect(canvas.getAllByTestId('identity-version')[0])
      .toHaveTextContent('本场对局版本')
  },
}
