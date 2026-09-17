import { expect, type Page, test } from '@playwright/test'
import {
  agentPreviewInventory,
  agentPreviewScenarios,
} from '../../src/testing/scenario-agent-fixtures'
import { config } from '../../src/testing/v34-fixtures'

async function setup(page: Page, empty = false) {
  const inventory = structuredClone(agentPreviewInventory)
  if (empty) inventory.scenarios[0].sides.a = []
  const created: { scenarioID: string; side: 'a' | 'b'; name?: string }[] = []
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.slice(3)
    const json = (body: unknown) => route.fulfill({ json: body })
    if (path === '/auth/me') {
      return json({
        account: {
          id: 'creation-test',
          displayName: '测试',
          email: 'test@example.test',
          isAdmin: false,
        },
        firstBattleDone: true,
      })
    }
    if (path === '/config') return json(config)
    if (path === '/my/agents') return json(inventory)
    if (path === '/scenarios') {
      return json({ scenarios: agentPreviewScenarios.map((s) => s.summary) })
    }
    const scenario = agentPreviewScenarios.find((s) =>
      path === `/scenarios/${s.summary.id}`
    )
    if (scenario) return json(scenario)
    if (path === '/agents' && request.method() === 'POST') {
      const input = request.postDataJSON()
      created.push(input)
      const agentID = 2000 + created.length
      inventory.scenarios.find((s) => s.scenarioID === input.scenarioID)!
        .sides[input.side as 'a' | 'b'].push({
          agentID,
          name: null,
          versionCount: 0,
        })
      return json({ agentID })
    }
    const match = /^\/agents\/(\d+)(?:\/(draft|versions))?$/.exec(path)
    if (match) {
      for (const scenario of inventory.scenarios) {
        for (const side of ['a', 'b'] as const) {
          const agent = scenario.sides[side].find((a) =>
            a.agentID === Number(match[1])
          )
          if (!agent) continue
          if (request.method() === 'PATCH') {
            agent.name = request.postDataJSON().name
            return json({ ok: true })
          }
          if (match[2] === 'draft') {
            return json({ fields: {}, scenarioID: scenario.scenarioID, side })
          }
          if (match[2] === 'versions') {
            return json({ versions: [], entryVersionID: null })
          }
        }
      }
    }
    if (path === '/notifications/bell') {
      return route.fulfill({
        contentType: 'text/event-stream',
        body: 'retry: 60000\ndata: {"unreadCount":0}\n\n',
      })
    }
    if (path === '/notifications') return json({ notifications: [] })
    if (path === '/rewards') {
      return json({ balance: 1000, claimableRewards: [] })
    }
    return json({})
  })
  return { created, errors }
}

for (const width of [1440, 390]) {
  test.describe(`${width}px direct creation`, () => {
    test.use({ viewport: { width, height: 900 } })
    for (
      const entry of [
        'scenario',
        'empty-scenario',
        'inventory',
        'home',
      ] as const
    ) {
      test(`${entry}: directly opens empty focused rename; default ID survives refresh`, async ({ page }) => {
        const { created, errors } = await setup(
          page,
          entry === 'empty-scenario',
        )
        await page.goto(
          entry.includes('scenario')
            ? '/scenarios/fengyiting-real'
            : entry === 'inventory'
            ? '/my-agents'
            : '/agents/1000',
        )
        const urls: string[] = []
        page.on('framenavigated', (frame) => {
          if (frame === page.mainFrame()) {
            urls.push(new URL(frame.url()).pathname)
          }
        })
        const button = entry === 'scenario'
          ? page.getByRole('button', { name: '再建一个董卓' })
          : entry === 'empty-scenario'
          ? page.getByTestId('build-agent')
          : page.getByRole('button', { name: '新建董卓智能体' })
        await button.click()
        await expect(page).toHaveURL(/\/agents\/2001$/)
        const input = page.getByRole('textbox', { name: '智能体名称' })
        await expect(input).toBeFocused()
        await expect(input).toHaveValue('')
        await expect(page.getByRole('dialog')).toHaveCount(0)
        expect(urls.every((url) => url === '/agents/2001')).toBe(true)
        expect(created).toEqual([{ scenarioID: 'fengyiting-real', side: 'a' }])
        await input.press('Escape')
        await expect(page.getByRole('heading', { name: '董卓 #2001' }))
          .toBeVisible()
        await page.reload()
        await expect(page.getByRole('textbox', { name: '智能体名称' }))
          .toHaveCount(0)
        await expect(page.getByRole('heading', { name: '董卓 #2001' }))
          .toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(width)
        expect(errors).toEqual([])
      })
    }
    test('successive creation resets the name and preserves saved names', async ({ page }) => {
      const { created } = await setup(page)
      await page.goto('/my-agents')
      await page.getByRole('button', { name: '新建吕布智能体' }).click()
      const input = page.getByRole('textbox', { name: '智能体名称' })
      await input.fill('赤兔')
      await input.press('Enter')
      await expect(page.getByRole('heading', { name: '吕布「赤兔」' }))
        .toBeVisible()
      await page.getByRole('button', { name: '新建吕布智能体' }).click()
      await expect(page).toHaveURL(/\/agents\/2002$/)
      await expect(input).toHaveValue('')
      await expect(input).toBeFocused()
      await input.press('Enter')
      await expect(page.getByRole('heading', { name: '吕布 #2002' }))
        .toBeVisible()
      expect(created).toHaveLength(2)
    })
  })
}

test('slow creation prevents double-clicks and cannot redirect after leaving', async ({ page }) => {
  const { created } = await setup(page)
  let release!: () => void
  const waiting = new Promise<void>((resolve) => release = resolve)
  await page.route('**/v1/agents', async (route) => {
    await waiting
    await route.fallback()
  })
  await page.goto('/scenarios/fengyiting-real')
  const button = page.getByRole('button', { name: '再建一个董卓' })
  await expect(button).toBeVisible()
  await button.evaluate((element: HTMLButtonElement) => {
    element.click()
    element.click()
  })
  await expect(button).toBeDisabled()
  await expect(page).toHaveURL(/\/scenarios\/fengyiting-real$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: '我的智能体', exact: true }).click()
  release()
  await expect.poll(() => created.length).toBe(1)
  await expect(page.getByRole('heading', { name: '我的智能体' })).toBeVisible()
  await expect(page).toHaveURL(/\/my-agents$/)
})

test('rejection stays inline and retry creates only once', async ({ page }) => {
  const { created } = await setup(page)
  let attempts = 0
  await page.route('**/v1/agents', async (route) => {
    if (++attempts === 1) {
      return route.fulfill({
        status: 409,
        json: { error: 'sibling_gate', message: '先为对侧保存一个策略' },
      })
    }
    await route.fallback()
  })
  await page.goto('/scenarios/fengyiting-real')
  await page.getByRole('button', { name: '再建一个董卓' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/scenarios\/fengyiting-real$/)
  await expect(page.getByRole('link', { name: /去完善/ })).toBeVisible()
  await page.getByRole('button', { name: '再建一个董卓' }).click()
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

for (const { summary } of agentPreviewScenarios) {
  test(`${summary.title}: both roles create on their own home`, async ({ page }) => {
    const { created } = await setup(page)
    for (
      const [side, role] of [['a', summary.sideAName], [
        'b',
        summary.sideBName,
      ]] as const
    ) {
      await page.goto(`/scenarios/${summary.id}`)
      await page.getByRole('button', { name: `再建一个${role}` }).click()
      await expect(page.getByRole('textbox', { name: '智能体名称' }))
        .toBeFocused()
      expect(created.at(-1)).toEqual({ scenarioID: summary.id, side })
    }
  })
}

test('Chinese composition does not submit a name, and overlong names remain editable', async ({ page }) => {
  await setup(page)
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建董卓智能体' }).click()
  const input = page.getByRole('textbox', { name: '智能体名称' })
  await input.fill('董卓')
  await input.dispatchEvent('keydown', {
    key: 'Enter',
    isComposing: true,
    bubbles: true,
  })
  await expect(input).toBeVisible()
  await input.fill('字'.repeat(31))
  await expect(page.getByRole('button', { name: '保存名称' })).toBeDisabled()
  await input.fill('董卓')
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: '董卓「董卓」' }))
    .toBeVisible()
})

test('a failed destination read never repeats the successful creation', async ({ page }) => {
  const { created } = await setup(page)
  let attempts = 0
  await page.route('**/v1/agents/2001/draft', async (route) => {
    if (++attempts === 1) {
      return route.fulfill({ status: 503, json: { error: 'unavailable' } })
    }
    await route.fallback()
  })
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建董卓智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

test('inventory recovery during creation keeps the pending navigation alive', async ({ page }) => {
  const { created } = await setup(page)
  await page.route('**/v1/my/agents', async (route) => {
    if (created.length === 0) {
      return route.fulfill({ status: 503, json: { error: 'unavailable' } })
    }
    await route.fallback()
  })
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建董卓智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

test('first creation survives the empty-to-populated inventory update before its home loads', async ({ page }) => {
  const { created } = await setup(page, true)
  let release!: () => void
  const waiting = new Promise<void>((resolve) => release = resolve)
  await page.route('**/v1/agents/2001/draft', async (route) => {
    await waiting
    await route.fallback()
  })
  await page.goto('/scenarios/fengyiting-real')
  await page.getByTestId('build-agent').click()
  await expect(page.getByRole('button', { name: '再建一个董卓' }))
    .toBeDisabled()
  release()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})
