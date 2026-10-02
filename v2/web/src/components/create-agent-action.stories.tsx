import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import {
  type InitialEntry,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import type { MyAgentDTO } from '../api/types'
import { AuthProvider } from '../context/auth'
import { navigationCache } from '../lib/navigation-cache'
import { inventoryQuery } from '../lib/navigation-queries'
import { ExpressPage } from '../pages/express'
import { MatchDetailPage } from '../pages/match-detail'
import { MyAgentsPage } from '../pages/my-agents'
import referenceMatch120 from '../testing/reference-match-120.json'
import { config, finishedMatch, scenario } from '../testing/v34-fixtures'

// 本能寺每侧两名人物：凡是会新建智能体的入口，都在按钮两侧就地弹出人物签。
const honnoji = {
  ...scenario,
  summary: {
    ...scenario.summary,
    id: 'honnoji-decision',
    title: '本能寺之变·敌在何处',
    sideAName: '主张杀信长',
    sideBName: '主张不杀信长',
    sideALabel: '主张杀信长',
    sideBLabel: '主张不杀信长',
  },
  presets: [],
}
const own: MyAgentDTO = { agentID: 185, name: '我的智能体', versionCount: 1 }
const draft: MyAgentDTO = { agentID: 302, name: '草稿', versionCount: 0 }

let sides: { a: MyAgentDTO[]; b: MyAgentDTO[] } = { a: [], b: [] }
let inventoryFails = false
let inventoryReads = 0
let created: unknown[] = []
let draftReads = 0
let creationResponse = Promise.resolve()
let draftResponse = Promise.resolve()

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function CurrentPath() {
  const location = useLocation()
  return (
    <output aria-label='当前路径'>{location.pathname}{location.search}</output>
  )
}

function Surface({ entry }: { entry: InitialEntry }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path='/my-agents' element={<MyAgentsPage />} />
        <Route path='/matches/:matchId' element={<MatchDetailPage />} />
        <Route
          path='/express'
          element={
            <AuthProvider>
              <ExpressPage />
            </AuthProvider>
          }
        />
        <Route path='*' element={null} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>
  )
}

const handlers = [
  http.get('/v1/auth/me', () =>
    HttpResponse.json({
      account: {
        id: 'entry-test',
        email: 'entry@example.test',
        displayName: '入口测试',
        isAdmin: false,
      },
      elevated: false,
      firstBattleDone: false,
    })),
  http.get('/v1/config', () =>
    HttpResponse.json({
      ...config,
      // 三元组是对手 NPC 的场景/侧/预设：对手执 b，我方执 a。
      expressPreset: {
        scenarioID: 'honnoji-decision',
        side: 'b',
        presetKey: 'hosokawa-steady',
      },
    })),
  http.get(
    '/v1/scenarios',
    () => HttpResponse.json({ scenarios: [honnoji.summary] }),
  ),
  http.get('/v1/scenarios/:id', () => HttpResponse.json(honnoji)),
  http.get('/v1/matches/9001', () => HttpResponse.json(referenceMatch120)),
  http.get('/v1/my/agents', () => {
    inventoryReads++
    return inventoryFails
      ? HttpResponse.json({ error: 'unavailable' }, { status: 503 })
      : HttpResponse.json({
        scenarios: [{
          scenarioID: 'honnoji-decision',
          title: honnoji.summary.title,
          sides,
          gateProgress: honnoji.summary.gateProgress,
          entryReady: false,
        }],
      })
  }),
  http.post('/v1/agents', async ({ request }) => {
    const input = await request.json() as { side: 'a' | 'b' }
    created.push(input)
    await creationResponse
    // 同侧第二个被引导门拦下；对侧的第一个放行。
    if (sides[input.side].length > 0) {
      return HttpResponse.json(
        { error: 'sibling_gate', message: '先为对侧保存一个策略' },
        { status: 409 },
      )
    }
    // 新建会刷新清单：入口此时不能换回链接，否则跳转新主页就丢了。
    sides = { ...sides, [input.side]: [{ agentID: 2001, versionCount: 0 }] }
    return HttpResponse.json({ agentID: 2001 })
  }),
  http.get('/v1/agents/2001/draft', async () => {
    draftReads++
    await draftResponse
    return HttpResponse.json({
      fields: {},
      scenarioID: 'honnoji-decision',
      side: sides.a.some((agent) => agent.agentID === 2001) ? 'a' : 'b',
    })
  }),
  http.get(
    '/v1/agents/2001/versions',
    () => HttpResponse.json({ versions: [], entryVersionID: null }),
  ),
]

const meta = {
  title: 'Agents/Side entry in place',
  component: Surface,
  args: { entry: '/my-agents' },
  beforeEach: () => {
    sides = { a: [own], b: [] }
    inventoryFails = false
    inventoryReads = 0
    created = []
    draftReads = 0
    creationResponse = Promise.resolve()
    draftResponse = Promise.resolve()
  },
  parameters: { msw: handlers },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

const picker = { name: '选择新智能体的角色' }

// 在「我的智能体」再建同侧第二个，被引导门拦下，停在就地提示。
async function blockedSibling(canvasElement: HTMLElement) {
  const canvas = within(canvasElement.ownerDocument.body)
  await userEvent.click(
    await canvas.findByRole('button', { name: '新建 袭击本能寺' }),
  )
  await userEvent.click(
    await canvas.findByRole('button', { name: '创建足利义昭的使者' }),
  )
  await expect(await canvas.findByRole('alert')).toHaveTextContent(
    '需先有一个对侧智能体',
  )
  return canvas
}

// 「我的智能体」同时显示两侧：对侧为空时不另给按钮，直接用那一栏自己的加号。
export const GateLeavesEmptyOppositeToItsColumn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await blockedSibling(canvasElement)
    expect(canvas.queryByRole('button', { name: /^创建主张西进毛利/ }))
      .toBeNull()
    expect(canvas.queryByRole('link', { name: /去完善/ })).toBeNull()
    await userEvent.click(
      canvas.getByRole('button', { name: '新建 西进毛利' }),
    )
    await userEvent.click(
      await canvas.findByRole('button', { name: '创建细川藤孝' }),
    )
    await waitFor(() =>
      expect(created).toEqual([
        { scenarioID: 'honnoji-decision', side: 'a', roleKey: 'yoshiaki' },
        { scenarioID: 'honnoji-decision', side: 'b', roleKey: 'hosokawa' },
      ])
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
        '/agents/2001',
      )
    )
  },
}

// 已归档的对侧智能体不算：同样留给那一栏自己的加号。
export const GateIgnoresArchivedOpposite: Story = {
  beforeEach: () => {
    sides = { a: [own], b: [{ ...draft, isArchived: true }] }
  },
  play: async ({ canvasElement }) => {
    const canvas = await blockedSibling(canvasElement)
    expect(canvas.queryByRole('button', { name: /^创建主张西进毛利/ }))
      .toBeNull()
    expect(canvas.queryByRole('link', { name: /去完善/ })).toBeNull()
  },
}

// 只看一侧时页面上没有对侧：被拦下后就地创建对侧，人物签在按钮两侧弹出。
export const FocusedSideCreatesOppositeRoleInPlace: Story = {
  args: { entry: '/my-agents?scenario=honnoji-decision&side=a' },
  play: async ({ canvasElement }) => {
    const canvas = await blockedSibling(canvasElement)
    expect(canvas.queryByRole('link', { name: /去完善/ })).toBeNull()
    const create = canvas.getByRole('button', {
      name: '创建主张西进毛利智能体',
    })
    await userEvent.click(create)
    await canvas.findByRole('group', picker)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('group', picker)).toBeNull())
    await expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
      '/my-agents',
    )

    await userEvent.click(create)
    await canvas.findByRole('button', { name: '创建明智军中的足轻' })
    await userEvent.click(canvas.getByRole('button', { name: '创建细川藤孝' }))
    await waitFor(() =>
      expect(created).toEqual([
        { scenarioID: 'honnoji-decision', side: 'a', roleKey: 'yoshiaki' },
        { scenarioID: 'honnoji-decision', side: 'b', roleKey: 'hosokawa' },
      ])
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
        '/agents/2001',
      )
    )
  },
}

// 对侧已有未保存版本的草稿：直达它，不重复创建。
export const GateOpensOppositeDraft: Story = {
  beforeEach: () => {
    sides = { a: [own], b: [draft] }
  },
  play: async ({ canvasElement }) => {
    const canvas = await blockedSibling(canvasElement)
    await expect(
      canvas.getByRole('link', { name: '去完善主张西进毛利智能体' }),
    ).toHaveAttribute(
      'href',
      '/agents/entry?scenario=honnoji-decision&side=b&target=view',
    )
    expect(canvas.queryByRole('button', { name: /^创建主张西进毛利/ }))
      .toBeNull()
  },
}

// 清单读不到时不猜：保留原链接，由 /agents/entry 打开或创建。
export const GateKeepsEntryLinkWithoutInventory: Story = {
  beforeEach: () => {
    inventoryFails = true
  },
  play: async ({ canvasElement }) => {
    const canvas = await blockedSibling(canvasElement)
    await expect(
      canvas.getByRole('link', { name: '去完善主张西进毛利智能体' }),
    ).toHaveAttribute(
      'href',
      '/agents/entry?scenario=honnoji-decision&side=b&target=view',
    )
  },
}

const journeyEntry = { pathname: '/matches/9001', state: { express: true } }

export const JourneyCreatesOppositeRoleInPlace: Story = {
  args: { entry: journeyEntry },
  // 这场对局里我方执 b：对侧是 a（义昭使者 / 长宗我部密使）。
  beforeEach: () => {
    sides = { a: [], b: [own] }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    // 战报页先读对局、再读清单，按钮比别处晚出现。
    const create = await canvas.findByRole('button', { name: '去创建对侧' }, {
      timeout: 5000,
    })
    // 与相邻两格的按钮同宽，不因换成就地按钮而缩成文字宽度。
    expect(create.getBoundingClientRect().width).toBeCloseTo(
      canvas.getByRole('link', { name: '再战一场' }).getBoundingClientRect()
        .width,
      0,
    )
    // 程序化聚焦会把页面底部的按钮滚进视口，人物签随锚点移动而收起；真实点击时
    // 按钮已在视口内。
    create.scrollIntoView({ block: 'center' })
    await userEvent.click(create)
    await userEvent.click(
      await canvas.findByRole('button', { name: '创建长宗我部元亲的密使' }),
    )
    await waitFor(() =>
      expect(created).toEqual([
        { scenarioID: 'honnoji-decision', side: 'a', roleKey: 'chosokabe' },
      ])
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
        '/agents/2001',
      )
    )
  },
}

export const JourneyOpensExistingOpposite: Story = {
  args: { entry: journeyEntry },
  beforeEach: () => {
    sides = { a: [draft], b: [own] }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await canvas.findByRole('heading', { name: '首战打完，接下来' }, {
      timeout: 5000,
    })
    await waitFor(() => expect(inventoryReads).toBeGreaterThan(0))
    await expect(canvas.getByRole('link', { name: '去创建对侧' }))
      .toHaveAttribute(
        'href',
        '/agents/entry?scenario=honnoji-decision&side=a&target=view',
      )
    expect(canvas.queryByRole('button', { name: '去创建对侧' })).toBeNull()
  },
}

export const ExpressCreatesRoleInPlace: Story = {
  args: { entry: '/express' },
  beforeEach: () => {
    sides = { a: [], b: [] }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await canvas.findByRole('button', { name: '去构建 →' }),
    )
    await userEvent.click(
      await canvas.findByRole('button', { name: '创建足利义昭的使者' }),
    )
    await waitFor(() =>
      expect(created).toEqual([
        { scenarioID: 'honnoji-decision', side: 'a', roleKey: 'yoshiaki' },
      ])
    )
    // 与中间页一致：新智能体主页保留首战引导。
    await waitFor(() =>
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
        '/agents/2001?express=1',
      )
    )
  },
}

export const ExpressOpensExistingAgent: Story = {
  args: { entry: '/express' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await canvas.findByText('首战快速通道')
    await waitFor(() => expect(inventoryReads).toBeGreaterThan(0))
    await expect(canvas.getByRole('link', { name: '去构建 →' }))
      .toHaveAttribute(
        'href',
        '/agents/entry?scenario=honnoji-decision&side=a&target=build&express=1',
      )
    expect(canvas.queryByRole('button', { name: '去构建 →' })).toBeNull()
  },
}

// 打开再取消人物签不算创建；其他标签页新增草稿后，刷新清单就恢复已有智能体入口。
export const ExpressRefreshOpensNewlyAvailableAgent: Story = {
  args: { entry: '/express' },
  beforeEach: () => {
    sides = { a: [], b: [] }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await canvas.findByRole('button', { name: '去构建 →' }),
    )
    await canvas.findByRole('group', picker)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('group', picker)).toBeNull())

    sides = { a: [draft], b: [] }
    await navigationCache.invalidateQueries({
      queryKey: inventoryQuery().queryKey,
    })

    await expect(await canvas.findByRole('link', { name: '去构建 →' }))
      .toHaveAttribute(
        'href',
        '/agents/entry?scenario=honnoji-decision&side=a&target=build&express=1',
      )
    expect(canvas.queryByRole('button', { name: '去构建 →' })).toBeNull()
    expect(canvas.getByLabelText('当前路径')).toHaveTextContent('/express')
    expect(created).toHaveLength(0)
  },
}

// POST 已成功、清单也已更新，但主页内容还未就绪：保留发起创建的按钮直到跳转完成。
export const ExpressPendingCreationSurvivesInventoryRefresh: Story = {
  args: { entry: '/express' },
  beforeEach: () => {
    sides = { a: [], b: [] }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    const response = deferred()
    draftResponse = response.promise
    try {
      await userEvent.click(
        await canvas.findByRole('button', { name: '去构建 →' }),
      )
      await userEvent.click(
        await canvas.findByRole('button', { name: '创建足利义昭的使者' }),
      )
      await waitFor(() => expect(draftReads).toBe(1))
      await waitFor(() =>
        expect(
          navigationCache.getQueryData(inventoryQuery().queryKey)
            ?.scenarios[0].sides.a[0]?.agentID,
        ).toBe(2001)
      )
      expect(inventoryReads).toBeGreaterThan(1)
      await expect(canvas.getByRole('button', { name: '去构建 →' }))
        .toBeDisabled()
      expect(canvas.queryByRole('link', { name: '去构建 →' })).toBeNull()
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent('/express')

      response.resolve()
      await waitFor(() =>
        expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
          '/agents/2001?express=1',
        )
      )
      expect(created).toEqual([
        { scenarioID: 'honnoji-decision', side: 'a', roleKey: 'yoshiaki' },
      ])
    } finally {
      response.resolve()
    }
  },
}

// 创建请求尚未返回时保留按钮；请求被拒后，立即按刷新的清单打开已有草稿。
export const ExpressRejectedCreationUsesRefreshedInventory: Story = {
  args: { entry: '/express' },
  beforeEach: () => {
    sides = { a: [], b: [] }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    const response = deferred()
    creationResponse = response.promise
    try {
      await userEvent.click(
        await canvas.findByRole('button', { name: '去构建 →' }),
      )
      await userEvent.click(
        await canvas.findByRole('button', { name: '创建足利义昭的使者' }),
      )
      await waitFor(() => expect(created).toHaveLength(1))
      sides = { a: [draft], b: [] }
      await navigationCache.invalidateQueries({
        queryKey: inventoryQuery().queryKey,
      })
      await expect(canvas.getByRole('button', { name: '去构建 →' }))
        .toBeDisabled()
      expect(canvas.queryByRole('link', { name: '去构建 →' })).toBeNull()

      response.resolve()
      await expect(await canvas.findByRole('link', { name: '去构建 →' }))
        .toHaveAttribute(
          'href',
          '/agents/entry?scenario=honnoji-decision&side=a&target=build&express=1',
        )
      expect(canvas.queryByRole('button', { name: '去构建 →' })).toBeNull()
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent('/express')
      expect(created).toHaveLength(1)
    } finally {
      response.resolve()
    }
  },
}

// 单角色侧没有人物可选：入口不变，也不为它多读一次清单。
export const SingleRoleSideKeepsEntryLink: Story = {
  args: { entry: journeyEntry },
  parameters: {
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(finishedMatch)),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await expect(
      await canvas.findByRole('link', { name: '去创建对侧' }, {
        timeout: 5000,
      }),
    ).toHaveAttribute(
      'href',
      '/agents/entry?scenario=shangyang-court&side=b&target=view',
    )
    expect(inventoryReads).toBe(0)
  },
}
