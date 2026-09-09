// 2026-09-09 咳嗦「低 → 高 → 低」方案的可执行 BDD。
// test.step 文案逐条镜像 keso-agent-flow.feature；真实接口是事实源。
import { expect, test } from '@playwright/test'

import {
  registrationCode,
  sameOrigin,
  signup,
  submissionModelID,
} from './helpers'

const SIDE_A = '商鞅'
const SIDE_B = '甘龙'
const KESO_SCENARIO = 'shangyang-court'

test.describe.configure({ mode: 'serial', timeout: 180_000 })

test.beforeEach(() => {
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
})

test('咳嗦三页主路径：清单创建 → 主页 → 构建器保存 → 主页', async ({ page }) => {
  const prompt =
    '先用可验证的小承诺建立信用，再把每项反对意见转成可检验的问题。'
  let agentID = 0
  let versionID = 0

  await test.step('假如 我注册一个新玩家并打开「我的智能体」', async () => {
    await signup(page, `keso-flow-${Date.now()}`)
    await page.goto('/my-agents')
    await expect(page.getByRole('heading', { name: '我的智能体' }))
      .toBeVisible({ timeout: 30_000 })
  })

  await test.step('那么 每侧只有一个带可访问名称的新建图标', async () => {
    await expect(page.getByRole('button', { name: `新建${SIDE_A}智能体` }))
      .toHaveCount(1)
    await expect(page.getByRole('button', { name: `新建${SIDE_B}智能体` }))
      .toHaveCount(1)
  })

  await test.step('当 我点「新建商鞅智能体」，填写可选名称并创建', async () => {
    await page.getByRole('button', { name: `新建${SIDE_A}智能体` }).click()
    const dialog = page.getByRole('dialog', { name: `新建${SIDE_A}智能体` })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('名称（可选）').fill('低高低')
    await dialog.getByRole('button', { name: '创建智能体' }).click()
    await expect(page).toHaveURL(/\/agents\/\d+$/)
    agentID = Number(/\/agents\/(\d+)$/.exec(page.url())?.[1])
    expect(agentID).toBeGreaterThan(0)
  })

  await test.step('那么 我进入新智能体主页，而不是构建器，且「我的智能体」导航保持选中', async () => {
    await expect(page.getByRole('heading', { name: `${SIDE_A}「低高低」` }))
      .toBeVisible({ timeout: 30_000 })
    await expect(page).not.toHaveURL(/\/build(?:\?|$)/)
    await expect(
      page.getByRole('link', { name: '我的智能体', exact: true }),
    )
      .toHaveAttribute('aria-current', 'page')
  })

  await test.step('并且 同角色智能体栏即使只有当前一个智能体也可见', async () => {
    const rail = page.getByRole('navigation', { name: '同角色智能体' })
    await expect(rail).toBeVisible()
    await expect(rail.getByRole('link', { name: `${SIDE_A}「低高低」` }))
      .toHaveAttribute('aria-current', 'page')
    await expect(rail.getByRole('button', { name: `新建${SIDE_A}智能体` }))
      .toBeVisible()
  })

  await test.step('并且 主页提供「新建版本」铅笔入口与空版本状态', async () => {
    await expect(page.getByRole('button', { name: '新建版本' })).toBeVisible()
    await expect(page.getByText('还没有保存过版本')).toBeVisible()
  })

  await test.step('当 我从主页点「新建版本」', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
  })

  await test.step('那么 我进入构建器，「我的智能体」导航保持选中，并立即看到两个辅助入口', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build$`))
    await expect(
      page.getByRole('link', { name: '我的智能体', exact: true }),
    )
      .toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
  })

  await test.step('并且 构建器没有版本列表、参赛选择、版本对比或出战动作', async () => {
    await expect(page.getByTestId('version-card')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: /设为.*参赛版本|用 v\d+ 出战/ }),
    )
      .toHaveCount(0)
    await expect(page.getByRole('region', { name: '版本对比' }))
      .toHaveCount(0)
  })

  await test.step('当 我写入策略并点「保存并返回主页」', async () => {
    const input = page.getByLabel('策略提示词')
    await expect(input).toBeEnabled()
    await input.fill(prompt)
    const save = page.getByTestId('save-version')
    await expect(save).toHaveText('保存并返回主页')
    await save.click()
  })

  await test.step('那么 我回到同一智能体主页并看到真实服务端版本 v1', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    const card = page.getByTestId('version-card')
    await expect(card).toHaveCount(1)
    await expect(card.getByText('v1', { exact: true })).toBeVisible()
    await expect(card.getByText(prompt, { exact: true })).toBeVisible()
  })

  await test.step('并且 服务端保存的提示词与页面输入完全一致', async () => {
    const response = await page.request.get(`/v1/agents/${agentID}/versions`)
    expect(response.ok()).toBe(true)
    const payload = await response.json() as {
      versions: Array<{ id: number; prompt: string; isEntry: boolean }>
      entryVersionID?: number | null
    }
    expect(payload.versions).toHaveLength(1)
    expect(payload.versions[0].prompt).toBe(prompt)
    versionID = payload.versions[0].id
    expect(versionID).toBeGreaterThan(0)
    expect(payload.entryVersionID).toBe(versionID)
  })

  await test.step('并且 首版成为该侧参赛版本，但没有派发任何对局', async () => {
    await expect(
      page.getByRole('button', { name: `将 v1 设为${SIDE_A}参赛版本` }),
    ).toHaveAttribute('aria-pressed', 'true')
    const response = await page.request.get('/v1/matches')
    expect(response.ok()).toBe(true)
    const { matches } = await response.json() as {
      matches: Array<{
        participants?: { a?: { isMine?: boolean }; b?: { isMine?: boolean } }
      }>
    }
    expect(
      matches.filter((match) =>
        match.participants?.a?.isMine || match.participants?.b?.isMine
      ),
    ).toHaveLength(0)
  })

  await test.step('当 我从主页返回「我的智能体」', async () => {
    await page.getByRole('link', { name: '← 我的智能体' }).click()
    await expect(page).toHaveURL(/\/my-agents$/)
  })

  await test.step('那么 对应智能体是整行链接，且参赛行有轻量强调', async () => {
    const row = page.locator(
      `a[data-testid="agent-row"][data-agent-id="${agentID}"]`,
    )
    await expect(row).toBeVisible()
    await expect(row).toHaveAttribute('href', `/agents/${agentID}`)
    await expect(row).toHaveAttribute('data-entry', 'true')
    await expect(row).toHaveAttribute('title', '当前参赛智能体')
  })

  await test.step('并且 行内没有版本元数据、重命名、删除、编辑或出战按钮', async () => {
    const row = page.locator(
      `a[data-testid="agent-row"][data-agent-id="${agentID}"]`,
    )
    await expect(row.getByRole('button')).toHaveCount(0)
    await expect(row).not.toContainText(/\d+\s*个版本|刚刚|分钟前|小时前/)
    await expect(row).not.toContainText(/重命名|删除|编辑|出战/)
  })

  await test.step('当 我点击整行', async () => {
    await page.locator(
      `a[data-testid="agent-row"][data-agent-id="${agentID}"]`,
    ).click()
  })

  await test.step('那么 我回到高信息主页，并看到复制、参赛选择、出战与更多操作', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    await expect(page.getByRole('button', { name: '复制 v1 提示词' }))
      .toBeVisible()
    await expect(page.getByRole('button', {
      name: `将 v1 设为${SIDE_A}参赛版本`,
    })).toBeVisible()
    await expect(page.getByRole('button', { name: '用 v1 出战' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '智能体更多操作' }))
      .toBeVisible()
  })

  await test.step('当 我再次进入构建器', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build$`))
  })

  await test.step('那么 两个辅助入口仍然可见，版本列表仍然不出现', async () => {
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
    await expect(page.getByTestId('version-card')).toHaveCount(0)
    const versions = await page.request.get(`/v1/agents/${agentID}/versions`)
    expect(versions.ok()).toBe(true)
    expect((await versions.json() as { versions: unknown[] }).versions)
      .toHaveLength(1)
  })
})

test('场景详情保留角色上下文：单个直达主页，多个进入可刷新的聚焦清单', async ({ page }) => {
  let firstAgentID = 0
  let catalogCount = 0
  let browserEnsureCount = 0
  let releaseInventory = () => {}
  let inventorySeen = Promise.resolve()

  await test.step('假如 我注册新玩家，并通过真实 API 在商鞅侧创建唯一一个有名称的智能体', async () => {
    await signup(page, `keso-focus-${Date.now()}`)
    const catalog = await page.request.get('/v1/scenarios')
    expect(catalog.ok()).toBe(true)
    catalogCount = (await catalog.json() as { scenarios: unknown[] }).scenarios
      .length
    expect(catalogCount).toBeGreaterThan(1)

    const ensured = await page.request.post('/v1/agents/ensure', {
      headers: sameOrigin,
      data: { scenarioID: KESO_SCENARIO, side: 'a' },
    })
    expect(ensured.ok()).toBe(true)
    firstAgentID = (await ensured.json() as { agentID: number }).agentID
    const renamed = await page.request.patch(`/v1/agents/${firstAgentID}`, {
      headers: sameOrigin,
      data: { name: '第一方案' },
    })
    expect(renamed.ok()).toBe(true)
  })

  await test.step('并且 我的智能体清单响应被延迟', async () => {
    let markInventorySeen = () => {}
    inventorySeen = new Promise<void>((resolve) => {
      markInventorySeen = resolve
    })
    const inventoryGate = new Promise<void>((resolve) => {
      releaseInventory = resolve
    })
    await page.route('**/v1/my/agents', async (route) => {
      markInventorySeen()
      await inventoryGate
      await route.continue()
    })
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/v1/agents/ensure'
      ) {
        browserEnsureCount += 1
      }
    })
  })

  await test.step('当 我打开场景详情', async () => {
    await page.goto(`/scenarios/${KESO_SCENARIO}`)
    await inventorySeen
  })

  await test.step('那么 页面只显示禁用的确认状态，且不会暴露创建捷径', async () => {
    await expect(
      page.getByRole('button', { name: `正在确认我的${SIDE_A}…` }),
    ).toBeDisabled()
    await expect(page.getByTestId('build-agent')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /查看我的商鞅/ }))
      .toHaveCount(0)
    expect(browserEnsureCount).toBe(0)
  })

  await test.step('当 清单响应完成', () => {
    releaseInventory()
  })

  await test.step('那么 才出现「查看我的商鞅（1）」', async () => {
    await expect(page.getByRole('button', {
      name: `查看我的${SIDE_A}（1）`,
    })).toBeVisible()
    expect(browserEnsureCount).toBe(0)
  })

  await test.step('当 我在场景详情点「查看我的商鞅（1）」', async () => {
    await page.getByRole('button', { name: `查看我的${SIDE_A}（1）` }).click()
  })

  await test.step('那么 我直接进入唯一智能体主页，而不是通用清单', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${firstAgentID}$`))
    await expect(page.getByRole('heading', { name: `${SIDE_A}「第一方案」` }))
      .toBeVisible()
  })

  await test.step('假如 对侧保存一版后，我再通过真实 API 新建第二个商鞅智能体', async () => {
    const ensured = await page.request.post('/v1/agents/ensure', {
      headers: sameOrigin,
      data: { scenarioID: KESO_SCENARIO, side: 'b' },
    })
    expect(ensured.ok()).toBe(true)
    const { agentID: oppositeAgentID } = await ensured.json() as {
      agentID: number
    }
    const modelID = await submissionModelID(page.request)
    const saved = await page.request.post(
      `/v1/agents/${oppositeAgentID}/save`,
      {
        headers: sameOrigin,
        data: {
          prompt: '守住祖制，再逐项质询变法的代价。',
          modelID,
          parentVersionID: null,
        },
      },
    )
    expect(saved.ok()).toBe(true)
    const created = await page.request.post('/v1/agents', {
      headers: sameOrigin,
      data: { scenarioID: KESO_SCENARIO, side: 'a', name: '第二方案' },
    })
    expect(created.ok()).toBe(true)
  })

  await test.step('当 我再次点「查看我的商鞅（2）」', async () => {
    await page.goto(`/scenarios/${KESO_SCENARIO}`)
    await page.getByRole('button', { name: `查看我的${SIDE_A}（2）` }).click()
  })

  await test.step('那么 我进入带场景与侧参数的聚焦清单，只看到该侧的两个智能体', async () => {
    await expect.poll(() => {
      const url = new URL(page.url())
      return {
        path: url.pathname,
        scenario: url.searchParams.get('scenario'),
        side: url.searchParams.get('side'),
      }
    }).toEqual({
      path: '/my-agents',
      scenario: KESO_SCENARIO,
      side: 'a',
    })
    await expect(page.locator('[data-tm="MA.scenario-group"]')).toHaveCount(1)
    const side = page.getByRole('region', { name: `${SIDE_A}智能体` })
    const rows = side.getByTestId('agent-row')
    await expect(rows).toHaveCount(2)
    await expect(side.getByText(`${SIDE_A}智能体`, { exact: true }))
      .toHaveCount(1)
    await expect(rows.nth(0)).not.toContainText(SIDE_A)
    await expect(rows.nth(1)).not.toContainText(SIDE_A)
    await expect(page.getByRole('region', { name: `${SIDE_B}智能体` }))
      .toHaveCount(0)
    await expect(page.getByRole('button', { name: '查看全部智能体' }))
      .toBeVisible()
  })

  await test.step('当 我刷新页面', async () => {
    await page.reload()
  })

  await test.step('那么 场景与侧聚焦仍保留，另一侧和其他场景仍不出现', async () => {
    await expect(page.locator('[data-tm="MA.scenario-group"]')).toHaveCount(1)
    await expect(
      page.getByRole('region', { name: `${SIDE_A}智能体` }).getByTestId(
        'agent-row',
      ),
    ).toHaveCount(2)
    await expect(page.getByRole('region', { name: `${SIDE_B}智能体` }))
      .toHaveCount(0)
  })

  await test.step('当 我点「查看全部智能体」', async () => {
    await page.getByRole('button', { name: '查看全部智能体' }).click()
  })

  await test.step('那么 聚焦参数被清除并恢复完整场景清单', async () => {
    await expect(page).toHaveURL(/\/my-agents$/)
    await expect(page.locator('[data-tm="MA.scenario-group"]')).toHaveCount(
      catalogCount,
    )
  })

  await test.step('并且 无效的场景聚焦参数会安全回落完整清单', async () => {
    await page.goto('/my-agents?scenario=missing-scenario&side=a')
    await expect(page.getByRole('heading', { name: '我的智能体' }))
      .toBeVisible()
    await expect(page.locator('[data-tm="MA.scenario-group"]')).toHaveCount(
      catalogCount,
    )
    await expect(page.getByRole('button', { name: '查看全部智能体' }))
      .toHaveCount(0)
  })
})

test('咳嗦移动端：新建入口为 44px，窄屏弹层可操作', async ({ page }) => {
  await test.step('假如 我把视口切换为 390 × 844', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
  })

  await test.step('并且 我注册一个新玩家并打开「我的智能体」', async () => {
    await signup(page, `keso-mobile-${Date.now()}`)
    await page.goto('/my-agents')
    await expect(page.getByRole('heading', { name: '我的智能体' }))
      .toBeVisible({ timeout: 30_000 })
  })

  await test.step('那么 每侧新建图标的点击目标至少为 44 × 44', async () => {
    for (const role of [SIDE_A, SIDE_B]) {
      const button = page.getByRole('button', { name: `新建${role}智能体` })
      const box = await button.boundingBox()
      expect(box, `${role} create button has a box`).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })

  await test.step('当 我点另一侧的新建图标', async () => {
    await page.getByRole('button', { name: `新建${SIDE_B}智能体` }).click()
  })

  await test.step('那么 名称输入和创建动作在移动端弹层中可见，页面没有水平溢出', async () => {
    const dialog = page.getByRole('dialog', { name: `新建${SIDE_B}智能体` })
    await expect(dialog.getByLabel('名称（可选）')).toBeVisible()
    await expect(dialog.getByRole('button', { name: '创建智能体' }))
      .toBeVisible()
    const box = await dialog.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390)
  })
})
