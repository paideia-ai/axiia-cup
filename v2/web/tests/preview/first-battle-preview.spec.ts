import { expect, type Page, test } from '@playwright/test'
// Kept outside tests/e2e: real-backend acceptance must not collect local-demo tests.
import { deckFor } from '../../src/scenarios/decks'
import type { MatchDetail } from '../../src/api/types'

function audit(page: Page) {
  const failures: string[] = []
  const errors: string[] = []
  let dispatches = 0
  const streams: string[] = []
  const requests: { method: string; path: string; status: number }[] = []
  page.on('response', (response) => {
    const request = response.request()
    const path = new URL(response.url()).pathname
    if (!path.startsWith('/v1/')) return
    requests.push({ method: request.method(), path, status: response.status() })
    // A fresh visitor has no account until they submit the registration form.
    if (response.status() === 401 && path === '/v1/auth/me') return
    if (response.status() >= 400) {
      failures.push(`${request.method()} ${path}: ${response.status()}`)
    }
    if (path === '/v1/matches/pve' && request.method() === 'POST') dispatches++
    if (/\/matches\/\d+\/stream$/.test(path)) streams.push(response.url())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return { failures, errors, streams, requests, dispatches: () => dispatches }
}

async function register(page: Page, phone = false) {
  await page.goto('/register')
  if (phone) {
    await page.getByRole('tab', { name: '手机号', exact: true }).click()
    await page.locator('input[name=inviteCode]').fill('LOCAL-PREVIEW')
    await page.locator('input[name=phone]').fill('13800138000')
    await page.getByRole('button', { name: '发送验证码' }).click()
    await page.locator('input[name=code]:visible').fill('123456')
  } else {
    await page.locator('input[name=code]').fill('LOCAL-PREVIEW')
    await page.locator('input[name=email]').fill('preview@example.test')
    await page.locator('input[name=password]').fill('local-preview-123')
  }
  await page.locator('input[name=displayName]:visible').fill('首战检查')
  await page.getByRole('button', { name: '创建账户', exact: true }).click()
  await expect(page).toHaveURL(/\/express$/)
}

async function openBuilder(page: Page) {
  await page.getByTestId('express-build').click()
  await expect(page).toHaveURL(/\/agents\/106\?express=1$/)
  await page.getByLabel('智能体名称', { exact: true }).fill('我的首战策略')
  await page.getByRole('button', { name: '保存名称', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '我的首战策略',
  )
  await page.getByRole('link', { name: '新建版本', exact: true }).click()
  await expect(page).toHaveURL(/\/agents\/106\/build\?.*express=1/)
}

async function fillPreset(page: Page) {
  const dialog = page.getByRole('dialog', { name: '选择预设策略' })
  await expect(dialog).toBeVisible()
  for (const question of deckFor('shangyang-court', 'a')!.questions) {
    await dialog.getByRole('button', {
      name: question.options[0].label,
      exact: true,
    }).click()
  }
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: '更多构建方式' })).toBeVisible()
  await expect(page.getByLabel('策略提示词')).not.toHaveValue('')
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route(
    /https:\/\/(fonts\.googleapis\.com|api\.fontshare\.com)\//,
    (route) => route.abort(),
  )
})

test.beforeAll(async ({ request }) => {
  const response = await request.get('/preview')
  expect(await response.text(), 'Port 5237 must run preview:first-battle')
    .toContain('首战完整流程 · 本地模拟')
})

for (const [width, phone] of [[1440, false], [390, true]] as const) {
  test(`complete first battle on ${width}px with ${phone ? 'phone' : 'email'} registration`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    const network = audit(page)
    await test.step('注册、查看朝堂介绍并创建自己的智能体', async () => {
      await register(page, phone)
      await expect(page.getByRole('img', { name: '商鞅头像' })).toBeVisible()
      await expect(page.getByTestId('express-build')).toBeInViewport()
      await page.screenshot({ path: test.info().outputPath('court.png') })
      const disclosures = page.locator('.express-disclosure > summary')
      await disclosures.nth(0).click()
      await disclosures.nth(1).click()
      await expect(page.locator('.express-disclosure[open]')).toHaveCount(2)
      await openBuilder(page)
    })
    let savedPrompt = ''
    await test.step('选预设、保存后刷新，版本与使用记录保持一致且不扣积分', async () => {
      await fillPreset(page)
      savedPrompt = await page.getByLabel('策略提示词').inputValue()
      await page.getByRole('button', { name: '保存版本', exact: true }).click()
      await expect(page.getByTestId('first-battle-start')).toContainText(
        '出战 v1（#10601）',
      )
      expect((await (await page.request.get('/v1/rewards')).json()).balance)
        .toBe(1000)
      await page.reload()
      const dialog = page.getByRole('dialog', { name: '选择预设策略' })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: '关闭弹窗' }).click()
      await expect(page.getByLabel('策略提示词')).toHaveValue(savedPrompt)
      await expect(page.getByRole('button', { name: '更多构建方式' }))
        .toBeVisible()
      await expect(page.getByTestId('first-battle-start')).toContainText(
        '出战 v1（#10601）',
      )
      await expect(page.getByTestId('first-battle-start')).not.toContainText(
        '本次对战消耗',
      )
      await page.getByTestId('first-battle-start').screenshot({
        path: test.info().outputPath('saved-version.png'),
      })
    })
    await test.step('未保存编辑不改变出战版本，实况刷新后继续且只派发一次', async () => {
      await page.getByLabel('策略提示词').fill('这段尚未保存，只留在草稿中。')
      const panel = page.getByTestId('first-battle-start')
      await expect(panel).toContainText(
        '有未保存的修改，出战将使用已保存版本。',
      )
      await panel.getByRole('button', { name: '出战', exact: true }).click()
      await expect(page).toHaveURL(/\/matches\/9001$/)
      const live = await (await page.request.get('/v1/matches/9001'))
        .json() as MatchDetail
      expect(live.summary.finished).toBe(false)
      expect(live.summary.participants?.a.versionID).toBe(10601)
      expect((await (await page.request.get('/v1/rewards')).json()).balance)
        .toBe(900)
      await expect(
        page.getByText('法令公开，奖惩一致，百姓才知道如何安身。', {
          exact: true,
        }),
      ).toBeVisible()
      await page.reload()
      await expect(page.getByRole('button', { name: '领取奖励', exact: true }))
        .toBeVisible({ timeout: 20_000 })
      expect(network.streams.length).toBeGreaterThanOrEqual(2)
      expect(network.dispatches()).toBe(1)
    })
    await test.step('领奖、刷新与重复领取都不会重复返还，完局状态和历史一致', async () => {
      await page.getByRole('button', { name: '领取奖励', exact: true }).click()
      await expect(page.getByText('已领取 · +50 积分', { exact: true }))
        .toBeVisible()
      await page.screenshot({
        path: test.info().outputPath('first-battle-report.png'),
        fullPage: true,
      })
      const repeated =
        await (await page.request.post('/v1/rewards/matches/9001/claim')).json()
      expect(repeated).toMatchObject({
        creditedPoints: 0,
        alreadyClaimed: true,
        balance: 950,
      })
      await page.reload()
      await expect(page.getByText('已领取 · +50 积分', { exact: true }))
        .toBeVisible()
      const me = await (await page.request.get('/v1/auth/me')).json()
      expect(me.firstBattleDone).toBe(true)
      const list = await (await page.request.get('/v1/matches')).json()
      expect(list.matches).toHaveLength(1)
      expect(list.matches[0]).toMatchObject({
        id: 9001,
        finished: true,
        viewed: true,
      })
    })
    await test.step('战后引导、智能体战绩、对侧创建及辅助页面都可打开', async () => {
      // A refreshed URL intentionally has no express flag; the continuation link
      // restores it just as reopening a first-battle result in another tab does.
      await page.goto('/matches/9001?express=1#first-battle-journey')
      await page.locator('a[href^="/scenarios/shangyang-court/npcs/"]').first()
        .click()
      await expect(
        page.getByTestId('npc-identity').getByRole('heading', { level: 1 }),
      ).toContainText('甘龙')
      await page.getByTestId('npc-identity').locator('a[href^="/matches?"]')
        .click()
      await expect(page).toHaveURL(/\/matches\?.*npc=ganlong-steady/)
      await expect(page.locator('main')).toContainText('我的首战策略')
      await page.goto('/matches/9001?express=1#first-battle-journey')
      const journey = page.locator('#first-battle-journey')
      await expect(journey).toBeVisible()
      await journey.getByRole('link', { name: '再战一场', exact: true }).click()
      await expect(page).toHaveURL(/\/agents\/106$/)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        '我的首战策略',
      )
      const versions = await (await page.request.get('/v1/agents/106/versions'))
        .json()
      expect(versions.versions[0]).toMatchObject({
        prompt: savedPrompt,
        matchCount: 1,
        winCount: 1,
      })
      await page.getByRole('button', { name: '用 v1 出战', exact: true })
        .click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await page.goto('/matches/9001?express=1#first-battle-journey')
      await page.locator('#first-battle-journey').getByRole('link', {
        name: '去创建对侧',
        exact: true,
      }).click()
      await expect(page).toHaveURL(/\/agents\/107$/)
      await expect(page.getByRole('link', { name: '新建版本', exact: true }))
        .toBeVisible()
      for (
        const path of [
          '/matches',
          '/rewards',
          '/notifications',
          '/achievements',
          '/my-agents',
        ]
      ) {
        const endpoint = path === '/my-agents' ? '/v1/my/agents' : `/v1${path}`
        const [response] = await Promise.all([
          page.waitForResponse((response) =>
            new URL(response.url()).pathname === endpoint &&
            response.request().method() === 'GET'
          ),
          page.goto(path),
        ])
        expect(response.status()).toBe(200)
        await expect(page.locator('main')).not.toContainText(
          '此预览未提供这项数据。',
        )
        await expect(page.locator('main')).not.toContainText('加载失败')
      }
      await page.goto('/express')
      await expect(page).toHaveURL(/\/scenarios$/)
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth <= innerWidth
        ),
      ).toBe(true)
    })
    expect(network.failures).toEqual([])
    expect(network.errors).toEqual([])
    await test.info().attach('api-requests.json', {
      body: JSON.stringify(network.requests, null, 2),
      contentType: 'application/json',
    })
  })
}

test('quote retry uses the real preview route and reset starts a clean first battle', async ({ page }) => {
  await register(page)
  await page.route(
    '**/v1/rewards/quote?*',
    (route) =>
      route.fulfill({ status: 503, json: { error: 'temporary_unavailable' } }),
  )
  await openBuilder(page)
  await fillPreset(page)
  await page.getByRole('button', { name: '保存版本', exact: true }).click()
  await expect(page.getByText('暂时无法开始对战，请重试。', { exact: true }))
    .toBeVisible()
  await expect(
    page.getByTestId('first-battle-start').getByRole('button', {
      name: '出战',
      exact: true,
    }),
  ).toBeDisabled()
  expect((await (await page.request.get('/v1/matches')).json()).matches)
    .toEqual([])
  await page.unroute('**/v1/rewards/quote?*')
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(
    page.getByTestId('first-battle-start').getByRole('button', {
      name: '出战',
      exact: true,
    }),
  ).toBeEnabled()
  await page.goto('/preview')
  await page.getByRole('button', { name: '清空本次模拟，从注册重新体验' })
    .click()
  await expect(page).toHaveURL(/\/register$/)
  await register(page)
  const inventory = await (await page.request.get('/v1/my/agents')).json()
  expect(inventory.scenarios[0].sides).toEqual({ a: [], b: [] })
  expect((await (await page.request.get('/v1/rewards')).json()).balance).toBe(
    1000,
  )
  expect(
    (await (await page.request.get('/v1/account/preset-usage')).json())
      .scenarioIDs,
  ).toEqual([])
})
