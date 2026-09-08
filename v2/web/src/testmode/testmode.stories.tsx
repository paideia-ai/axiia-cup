import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import type { AgentVersionDTO, MeResponse } from '../api/types'
import { AuthProvider } from '../context/auth'
import { BuilderPage } from '../pages/builder'
import { config, scenario } from '../testing/v34-fixtures'
import { B3_A5_MANUAL_URL, STEPS } from './data'
import { FIXTURE_SESSION_STORAGE_KEY, FIXTURE_STORAGE_KEY } from './fixtures'
import { TestModeRoot } from './index'
import { STEP_HINTS } from './registry/index'
import { BOARD_URL } from './supabase'

// 测试模式压在真实的构建器（E 页）上：徽标 → 弹层 → 清单 → 导测（j3s5 聚光）→ 确认写看板。
// 断言只依赖「页面上有标记」，不钉具体 id，登记表增删不必改这里。

function Surface() {
  return (
    <MemoryRouter initialEntries={['/agents/101/build?tm=1']}>
      <Routes>
        <Route path='/agents/:agentId/build' element={<BuilderPage />} />
      </Routes>
      <TestModeRoot />
    </MemoryRouter>
  )
}

const v1: AgentVersionDTO = {
  id: 9001,
  agentID: 101,
  prompt: '首稿：先立可验证的小承诺，再谈变法大义。',
  modelID: 'fixture-model',
  isEntry: true,
  ordinal: 1,
  snapshotSeq: 0,
}

interface RpcCall {
  fn: string
  body: Record<string, unknown>
}
const calls: RpcCall[] = []

const handlers = [
  http.get('/v1/config', () => HttpResponse.json(config)),
  http.get('/v1/models', () =>
    HttpResponse.json({
      models: [{ id: 'fixture-model', label: 'Fixture Model' }],
    })),
  http.get('/v1/my/agents', () => HttpResponse.json({ scenarios: [] })),
  http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
  http.get('/v1/agents/101/draft', () =>
    HttpResponse.json({
      fields: { prompt: v1.prompt },
      scenarioID: scenario.summary.id,
      side: 'a',
    })),
  http.post('/v1/agents/101/mutate', () => HttpResponse.json({ ok: true })),
  http.get(
    '/v1/agents/101/stream',
    () =>
      new HttpResponse('', {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
  ),
  http.get(
    '/v1/agents/101/versions',
    () => HttpResponse.json({ versions: [v1], entryVersionID: v1.id }),
  ),
  http.post(`${BOARD_URL}/rest/v1/rpc/:fn`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    calls.push({ fn: String(params.fn), body })
    return HttpResponse.json(null)
  }),
]

const HANDOFF_ENTRY =
  '/agents/224?tm=1&tmJourney=HV-B3-OWNER-EA&tmStep=HV-B3-OWNER-EA-S03'
const B3_OWNER_NAME = 'B3 人测·完整所有者'

function RouteProbe() {
  const location = useLocation()
  return <output aria-label='当前产品网址'>{location.pathname}</output>
}

function AccountAwareSurface() {
  return (
    <MemoryRouter initialEntries={[HANDOFF_ENTRY]}>
      <AuthProvider>
        <Routes>
          <Route path='*' element={<RouteProbe />} />
        </Routes>
        <TestModeRoot />
      </AuthProvider>
    </MemoryRouter>
  )
}

function accountHandler(displayName: string) {
  const me: MeResponse = {
    account: {
      id: 'account-test-mode',
      email: 'tester@example.test',
      displayName,
      isAdmin: false,
      hasTOTP: false,
    },
    elevated: false,
    firstBattleDone: false,
  }
  return http.get('/v1/auth/me', () => HttpResponse.json(me))
}

const meta = {
  title: 'v3.4/Test mode',
  component: Surface,
  parameters: { msw: handlers },
  loaders: [
    () => {
      calls.length = 0
      localStorage.setItem('axiia:tm', '1')
      localStorage.setItem('axiia:tm:badges', '1')
      localStorage.removeItem('axiia-decisions:me')
      localStorage.removeItem('axiia-decisions:pw')
      localStorage.removeItem('axiia:tm:guided:r1:3')
      localStorage.removeItem(FIXTURE_STORAGE_KEY)
      sessionStorage.removeItem(FIXTURE_SESSION_STORAGE_KEY)
      for (
        const journey of [
          'HV-B3-OWNER-EA',
          'HV-B3-PUBLIC-NPC',
          'HV-A5-OS-CORE',
          'HV-A5-HOTSEAT-LIFECYCLE',
          'HV-A5-PVP-BOUNDARIES',
        ]
      ) {
        localStorage.removeItem(`axiia:tm:guided:${journey}`)
      }
      return {}
    },
  ],
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

const badgeSel = '[data-tm-root] .tm-badge'

export const AccountAwareHandoffEntry: Story = {
  render: AccountAwareSurface,
  parameters: { msw: [accountHandler(B3_OWNER_NAME)] },
  play: async () => {
    const body = within(document.body)
    const guide = await body.findByRole('dialog', { name: '导测' })
    await expect(within(guide).getByText('HV-B3-OWNER-EA-S03')).toBeVisible()

    const account = await body.findByTestId('tm-fixture-account-status')
    await waitFor(() =>
      expect(account).toHaveAttribute('data-nickname-state', 'match')
    )
    await expect(within(account).getByText(B3_OWNER_NAME)).toBeVisible()
    await expect(
      within(account).getByText('tester@example.test'),
    ).toBeVisible()
    await expect(
      body.getByTestId('tm-current-profile-b3-owner-rich'),
    ).toHaveTextContent('昵称相同')

    const start = within(guide).getByRole('link', {
      name: '打开网页：本步起始页',
    })
    await expect(start).not.toHaveAttribute('target')
    await userEvent.click(start)
    await expect(body.getByLabelText('当前产品网址')).toHaveTextContent(
      '/agents/224',
    )
    await expect(body.getByRole('dialog', { name: '导测' })).toBeVisible()

    const pill = body.getByRole('navigation', { name: '测试模式' })
    await userEvent.click(
      within(pill).getByRole('button', { name: '设置身份' }),
    )
    const identity = await body.findByRole('dialog', { name: '身份' })
    await expect(within(identity).getByLabelText('名字')).toHaveValue('')
    const boardPasscode = within(identity).getByLabelText(
      '看板口令（不是产品账号密码）',
    )
    await expect(boardPasscode).toHaveValue('')
    await expect(boardPasscode).toHaveAttribute('autocomplete', 'off')
    await userEvent.click(
      within(identity).getByRole('button', { name: '取消' }),
    )
  },
}

export const WrongProductAccountWarning: Story = {
  render: AccountAwareSurface,
  parameters: { msw: [accountHandler('普通玩家')] },
  play: async () => {
    const body = within(document.body)
    const guide = await body.findByRole(
      'dialog',
      { name: '导测' },
      { timeout: 8000 },
    )
    const account = await within(guide).findByTestId(
      'tm-fixture-account-status',
      {},
      { timeout: 8000 },
    )
    await waitFor(() =>
      expect(account).toHaveAttribute('data-nickname-state', 'mismatch')
    )
    await expect(account).toHaveAttribute('role', 'alert')
    await expect(within(account).getByText('普通玩家')).toBeVisible()
    await expect(account).toHaveTextContent('并切换到')
    await expect(account).toHaveTextContent(B3_OWNER_NAME)
  },
}

export const BuilderUnderTestMode: Story = {
  play: async () => {
    const body = within(document.body)
    await expect(await body.findByText('版本（1）')).toBeVisible()
    const pill = await body.findByRole('navigation', { name: '测试模式' })

    // ① 徽标层：页面上每个 [data-tm] 一个徽标
    await waitFor(
      () =>
        expect(document.querySelectorAll(badgeSel).length).toBeGreaterThan(0),
      { timeout: 8000 },
    )
    const mappedBadge = document.querySelector<HTMLButtonElement>(
      `${badgeSel}:not(.tm-badge--gap):not(.tm-badge--unknown)`,
    )
    const badge = mappedBadge ??
      document.querySelector<HTMLButtonElement>(badgeSel)!

    // ② 弹层：标题带 id，映射过的带看板链接
    await userEvent.click(badge)
    const pop = await body.findByRole('dialog', { name: /^标记 / })
    await expect(pop).toBeVisible()
    if (mappedBadge) {
      const links = within(pop).getAllByRole('link') as HTMLAnchorElement[]
      expect(links.some((a) => a.href.includes('/spec-v4#'))).toBe(true)
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: /^标记 / })).toBeNull()
    )

    // ③ 清单：E 页 56 行条款，带 ✓ / ○
    await userEvent.click(within(pill).getByRole('button', { name: '清单' }))
    const panel = await body.findByRole('dialog', { name: '清单' })
    await expect(within(panel).getByText('本页规格行')).toBeVisible()
    // 有缺口时默认只看「无部件对应」；切到全部再数条款行
    if (within(panel).queryAllByText('无部件').length > 0) {
      expect(
        within(panel).getByRole('button', { name: /^无部件对应/ }),
      ).toHaveAttribute('aria-pressed', 'true')
    }
    await userEvent.click(within(panel).getByRole('button', { name: /^全部/ }))
    expect(within(panel).getAllByRole('link', { name: /^U\d\d-C\d\d/ }).length)
      .toBeGreaterThan(10)
    await userEvent.click(
      within(panel).getByRole('button', { name: '关闭清单' }),
    )

    // ④ 导测：旅程 3 第 5 步（j3s5）
    await userEvent.click(within(pill).getByRole('button', { name: '导测' }))
    const runner = await body.findByRole('dialog', { name: '导测' })
    await userEvent.click(
      within(runner).getByRole('button', { name: /^旅程 3：/ }),
    )
    // 卡片挡住部件又推不动时会自动收起正文（只留头尾）：点步骤前先展开
    const gotoStep = async (n: number) => {
      const expand = body.queryByRole('button', { name: '展开' })
      if (expand) await userEvent.click(expand)
      await userEvent.click(
        await body.findByRole('button', { name: new RegExp(`^第 ${n} 步`) }),
      )
    }
    await gotoStep(5)
    await expect(await body.findByText('j3s5')).toBeVisible()
    const marker = STEP_HINTS.j3s5?.marker
    if (marker && document.querySelector(`[data-tm="${marker}"]`)) {
      await waitFor(() =>
        expect(
          document.querySelector(
            `[data-tm-root] .tm-spot[data-tm-spot="${marker}"]`,
          ),
        )
          .not.toBeNull()
      )
    }

    // ⑤a 没身份点「看到了」→ 问身份 → 取消 → 换一步 → 从药丸设身份：什么都不能写
    await userEvent.click(body.getByRole('button', { name: '看到了 ✓' }))
    const ask = await body.findByRole('dialog', { name: '先署个名' })
    await userEvent.click(within(ask).getByRole('button', { name: '取消' }))
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: '先署个名' })).toBeNull()
    )
    await gotoStep(4)
    await expect(await body.findByText('j3s4')).toBeVisible()
    await userEvent.click(
      within(pill).getByRole('button', { name: '设置身份' }),
    )
    const who0 = await body.findByRole('dialog', { name: '身份' })
    await userEvent.type(within(who0).getByLabelText('名字'), 'story-tester')
    await userEvent.type(
      within(who0).getByLabelText('看板口令（不是产品账号密码）'),
      'story-pwd',
    )
    await userEvent.click(
      within(who0).getByRole('button', { name: '保存身份' }),
    )
    await waitFor(() =>
      expect(body.queryByRole('dialog', { name: '身份' })).toBeNull()
    )
    await new Promise((r) => setTimeout(r, 300))
    expect(calls).toEqual([])
    // ⑤ 身份已有：回到第 5 步点「看到了」直接扇出到看板（身份对话框那条路在 ⑤a 走过了）
    await gotoStep(5)
    await expect(await body.findByText('j3s5')).toBeVisible()
    await userEvent.click(body.getByRole('button', { name: '看到了 ✓' }))

    const step = STEPS.j3s5
    await waitFor(
      () =>
        expect(calls.filter((c) => c.fn === 'set_pick').length).toBe(
          step.clauseIds.length + 1,
        ),
      { timeout: 8000 },
    )
    const picks = calls.filter((c) => c.fn === 'set_pick')
    for (const c of step.clauseIds) {
      expect(picks.map((p) => p.body.p_card)).toContain(`ss:${c}`)
    }
    expect(picks.map((p) => p.body.p_card)).toContain('pjg:j3s5')
    for (const p of picks) {
      expect(p.body.p_author).toBe('story-tester')
      expect(p.body.p_pwd).toBe('story-pwd')
      expect(p.body.p_choice).toBe('pass')
      const note = JSON.parse(String(p.body.p_note)) as Record<string, unknown>
      expect(note.via).toBe('guided:j3s5')
      expect(note.step).toBe('j3s5')
      expect(note.role).toBe('tester')
      expect(note.build).toEqual({ web: expect.any(String) })
    }
    // 没写备注就不留评论
    expect(calls.filter((c) => c.fn === 'post_comment')).toEqual([])
    await expect(await body.findByText(/已记录 \d+ 条到看板/)).toBeVisible()
    // 走到下一步（旅程 3 只有 5 步：落到小结卡）
    await expect(await body.findByText(/第 6 步|走完了|已确认 \d+ \/ \d+/))
      .toBeVisible()
  },
}

export const ConfirmedB3A5Handoff: Story = {
  play: async () => {
    const body = within(document.body)
    const pill = await body.findByRole('navigation', { name: '测试模式' })
    await userEvent.click(within(pill).getByRole('button', { name: '导测' }))
    const runner = await body.findByRole('dialog', { name: '导测' })

    await expect(within(runner).getByText('B3 / A5 · 固定版本可交接'))
      .toBeVisible()
    const handoffManual = within(runner).getByRole('link', {
      name: '详细手册 · 截图提交',
    }) as HTMLAnchorElement
    expect(handoffManual.href).toBe(B3_A5_MANUAL_URL)

    await userEvent.click(
      within(runner).getByRole('button', { name: /^旅程 B3\.1：/ }),
    )
    await expect(await body.findByText('HV-B3-OWNER-EA-S01')).toBeVisible()
    await expect(body.getByText('测试角色 A · B3 完整所有者')).toBeVisible()
    await expect(body.getByText('B3 人测·完整所有者')).toBeVisible()
    const tournamentInput = body.getByLabelText(/锦标赛 ID/)
    await userEvent.clear(tournamentInput)
    await expect(
      body.getByText(
        `${globalThis.location.origin}/tournaments/{{b3OwnerTournamentId}}`,
      ),
    ).toBeVisible()
    await expect(
      body.getByRole('button', { name: '先填写：含主智能体的锦标赛 ID' }),
    ).toBeDisabled()
    await userEvent.type(
      tournamentInput,
      'tm-tournament',
    )
    const testPage = body.getByRole('link', {
      name: '打开网页：本步起始页',
    }) as HTMLAnchorElement
    expect(testPage.href).toBe(
      `${globalThis.location.origin}/tournaments/tm-tournament`,
    )
    await expect(testPage).not.toHaveAttribute('target')
    expect(
      body.getByRole('link', { name: '打开网页：玩家对局列表' }),
    ).toHaveAttribute('href', `${globalThis.location.origin}/matches`)
    await expect(
      body.getByText(/以下就是必须使用的准确文件名/),
    ).toBeVisible()
    await expect(
      body.getByText('HV-B3-OWNER-EA-S01-leaderboard.png'),
    ).toBeVisible()
    const b3Upload = body.getByRole('link', {
      name: '在详细手册提交这些文件',
    }) as HTMLAnchorElement
    expect(b3Upload.href).toBe(
      `${B3_A5_MANUAL_URL}#HV-B3-OWNER-EA-S01`,
    )

    await userEvent.click(body.getByRole('button', { name: /^第 9 步/ }))
    await userEvent.click(body.getByRole('button', { name: '看小结 →' }))
    const delivery = body.getByRole('region', { name: '交接完成标准' })
    await expect(delivery).toBeVisible()
    await expect(within(delivery).getByText('必须提交的证据')).toBeVisible()

    await userEvent.click(body.getByRole('button', { name: '换一条旅程' }))
    const refreshedRunner = await body.findByRole('dialog', { name: '导测' })
    await userEvent.click(
      within(refreshedRunner).getByRole('button', { name: /^旅程 A5\.1：/ }),
    )
    await userEvent.click(
      body.getByRole('button', { name: /^第 5 步/ }),
    )
    await expect(await body.findByText('HV-A5-OS-CORE-S05')).toBeVisible()
    await expect(
      body.getByText('HV-A5-OS-CORE-S05-mobile-sheet.png'),
    ).toBeVisible()
    expect(body.queryByText('HV-A5-OS-CORE-S06')).toBeNull()
  },
}
