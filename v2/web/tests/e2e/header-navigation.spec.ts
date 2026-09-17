import { expect, type Page, test } from '@playwright/test'
import { config, scenario } from '../../src/testing/v34-fixtures'

// Delayed HTTP fixtures make a remounted wallet/bell observable. Navigation,
// React lifetimes and EventSource delivery run in the real browser.
async function installWorld(page: Page, walletGate = Promise.resolve()) {
  // External font availability must not delay navigation assertions.
  await page.route(
    /^https:\/\/(?:fonts\.googleapis\.com|api\.fontshare\.com)\//,
    (route) => route.fulfill({ contentType: 'text/css', body: '' }),
  )
  const world = {
    wallets: 0,
    bells: 0,
    balance: 1900,
    walletStatus: 200,
    unreadCount: 3,
    accountID: 'navigation-player',
    authenticated: true,
    unhandled: [] as string[],
  }
  await page.route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body: unknown) => route.fulfill({ json: body })
    if (path === '/v1/auth/logout') {
      world.authenticated = false
      return json({ ok: true })
    }
    if (path === '/v1/auth/me' || path === '/v1/auth/login') {
      if (path === '/v1/auth/login') world.authenticated = true
      if (!world.authenticated) {
        return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
      }
      return json({
        account: {
          id: world.accountID,
          displayName: '切页玩家',
          email: 'navigation@example.test',
          isAdmin: false,
        },
        elevated: false,
        firstBattleDone: true,
      })
    }
    if (path === '/v1/rewards') {
      world.wallets++
      await walletGate
      await new Promise((resolve) => setTimeout(resolve, 250))
      if (world.walletStatus !== 200) {
        return route.fulfill({
          status: world.walletStatus,
          json: { error: 'unavailable' },
        })
      }
      return json({
        balance: world.balance,
        dailyAllowance: 2000,
        battleCost: 100,
        dailyRuns: 20,
        pveWinRefundPercent: 50,
        pvpWinRefundPercent: 75,
        pointsPerYuan: 100,
        nextGrantAt: 1789704000,
        claimableRewards: [],
      })
    }
    if (path === '/v1/notifications/bell') {
      world.bells++
      await new Promise((resolve) => setTimeout(resolve, 250))
      return route.fulfill({
        contentType: 'text/event-stream',
        body: `retry: 600000\ndata: ${
          JSON.stringify({ unreadCount: world.unreadCount })
        }\n\n`,
      })
    }
    if (path === '/v1/config') return json(config)
    if (path === '/v1/landing') {
      return json({ totalBattles: 0, topPlayers: [], demoMatches: [] })
    }
    if (path === '/v1/scenarios') return json({ scenarios: [scenario.summary] })
    if (path === '/v1/scenarios/shangyang-court') return json(scenario)
    if (path === '/v1/my/agents') return json({ scenarios: [] })
    if (path === '/v1/matches') return json({ matches: [] })
    if (path === '/v1/tournaments') return json({ tournaments: [] })
    if (path === '/v1/notifications') {
      return json({ notifications: [], unreadCount: 3 })
    }
    world.unhandled.push(path)
    return route.fulfill({ status: 404, json: { error: 'not_found' } })
  })
  return world
}

for (const width of [320, 390, 768, 1280]) {
  test(`首次加载积分时保留入口与位置 (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let releaseWallet!: () => void
    const gate = new Promise<void>((resolve) => {
      releaseWallet = resolve
    })
    const world = await installWorld(page, gate)
    try {
      await page.goto('/scenarios')
      const indicator = page.locator('header a[href="/rewards"]')
      const bell = page.getByRole('link', { name: '通知', exact: true })
      await expect(indicator).toHaveAccessibleName('积分加载中，查看积分与奖励')
      await expect(indicator).toHaveAttribute('aria-busy', 'true')
      await expect(indicator).toHaveText('—')
      await expect(indicator.locator('svg')).toBeVisible()
      await expect(bell).toBeVisible()
      const initial = {
        indicator: await indicator.boundingBox(),
        bell: await bell.boundingBox(),
      }
      releaseWallet()
      await expect(indicator).toHaveAccessibleName('1900 积分，查看积分与奖励')
      await expect(indicator).toHaveText('1,900')
      await expect(indicator).not.toHaveAttribute('aria-busy', 'true')
      expect({
        indicator: await indicator.boundingBox(),
        bell: await bell.boundingBox(),
      }).toEqual(initial)
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth <= innerWidth
        ),
      ).toBe(true)
      expect(world.unhandled).toEqual([])
    } finally {
      releaseWallet()
    }
  })
}

test('首次积分加载失败保留入口，可重试并正确显示零余额', async ({ page }) => {
  const world = await installWorld(page)
  world.walletStatus = 503
  await page.goto('/scenarios')
  const indicator = page.locator('header a[href="/rewards"]')
  await expect(indicator).toHaveAccessibleName(
    '积分暂时无法加载，查看积分与奖励',
  )
  await expect(indicator).toHaveText('—')
  await expect(indicator).not.toHaveAttribute('aria-busy', 'true')
  await indicator.click()
  await expect(page.getByRole('alert')).toHaveText('积分更新失败，请重试')
  world.walletStatus = 200
  world.balance = 0
  await page.getByRole('button', { name: '刷新积分' }).click()
  await expect(indicator).toHaveAccessibleName('0 积分，查看积分与奖励')
  await expect(indicator).toHaveText('0')
  expect(world.unhandled).toEqual([])
})

for (const status of [404, 405]) {
  test(`服务端未开放积分时仍隐藏入口 (${status})`, async ({ page }) => {
    const world = await installWorld(page)
    world.walletStatus = status
    const response = page.waitForResponse((response) =>
      new URL(response.url()).pathname === '/v1/rewards' &&
      response.status() === status
    )
    await page.goto('/scenarios')
    await response
    await expect(page.locator('header a[href="/rewards"]')).toHaveCount(0)
    expect(world.unhandled).toEqual([])
  })
}

test('回到标签页刷新积分时保留已有顶栏，随后显示新余额', async ({ page }) => {
  const world = await installWorld(page)
  await page.goto('/scenarios')
  await expect(page.getByRole('link', { name: '1900 积分，查看积分与奖励' }))
    .toBeVisible()
  await expect(page.locator('header [aria-label="3 条未读"]')).toBeVisible()
  const wallets = world.wallets
  const bells = world.bells
  await watchHeader(page)
  world.balance = 1850
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('link', { name: '1850 积分，查看积分与奖励' }))
    .toBeVisible()
  expect(
    await page.evaluate(() =>
      (window as unknown as { stopHeaderWatch: () => string[] })
        .stopHeaderWatch()
    ),
  ).toEqual([])
  expect(world.wallets).toBe(wallets + 1)
  expect(world.bells).toBe(bells)
  expect(world.unhandled).toEqual([])
})

test('退出后访客不显示积分与通知，新账号不沿用旧账号状态', async ({ page }) => {
  const world = await installWorld(page)
  await page.goto('/scenarios')
  await expect(page.getByRole('link', { name: '1900 积分，查看积分与奖励' }))
    .toBeVisible()
  await expect(page.locator('header [aria-label="3 条未读"]')).toBeVisible()
  await page.getByTestId('logout').click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/scenarios')
  await expect(page.locator('main h1')).toBeVisible()
  expect(world.authenticated).toBe(false)
  const wallets = world.wallets
  const bells = world.bells
  await page.getByTestId('scenario-shangyang-court').click()
  await expect(page).toHaveURL(/\/scenarios\/shangyang-court$/)
  await expect(page.locator('main h1')).toBeVisible()
  await expect(page.locator('header a[href="/rewards"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '通知', exact: true }))
    .toHaveCount(0)
  expect(world.wallets).toBe(wallets)
  expect(world.bells).toBe(bells)
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/)
  world.accountID = 'another-player'
  world.balance = 800
  world.unreadCount = 0
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill(
    'another@example.test',
  )
  await page.getByLabel('密码', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('link', { name: '800 积分，查看积分与奖励' }))
    .toBeVisible()
  await expect(page.locator('header [aria-label="3 条未读"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'AXIIA CUP' }).click()
  await expect(page.getByRole('link', { name: '800 积分，查看积分与奖励' }))
    .toBeVisible()
  expect(world.unhandled).toEqual([])
})

async function watchHeader(page: Page) {
  await page.evaluate(() => {
    const header = document.querySelector('header')!
    const gaps = new Set<string>()
    const check = () => {
      if (!header.isConnected) gaps.add('header remounted')
      if (!document.querySelector('header a[href="/rewards"]')) {
        gaps.add('points disappeared')
      }
      if (!document.querySelector('header [aria-label="3 条未读"]')) {
        gaps.add('unread dot disappeared')
      }
    }
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    Object.assign(window, {
      stopHeaderWatch: () => {
        check()
        observer.disconnect()
        return [...gaps]
      },
    })
  })
}

for (const width of [1280, 390]) {
  test(
    `顶栏积分与未读红点在页面切换期间持续显示 (${width}px)`,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      const world = await installWorld(page)
      await page.goto('/scenarios')
      const points = page.getByRole('link', {
        name: '1900 积分，查看积分与奖励',
      })
      const dot = page.locator('header [aria-label="3 条未读"]')
      await expect(points).toBeVisible()
      await expect(dot).toBeVisible()
      const initial = { wallets: world.wallets, bells: world.bells }
      const results: { from: string; to: string; gaps: string[] }[] = []
      let from = '/scenarios'
      // All twelve directed transitions between the four tabs, plus secondary
      // pages, public detail, and browser Back/Forward across the same boundary.
      const paths = [
        '/my-agents',
        '/tournaments',
        '/matches',
        '/my-agents',
        '/matches',
        '/tournaments',
        '/my-agents',
        '/scenarios',
        '/tournaments',
        '/scenarios',
        '/matches',
        '/scenarios',
        '/scenarios/shangyang-court',
        '/settings',
        '/notifications',
        '/rewards',
        '/scenarios',
      ]
      for (const to of [...paths, 'back', 'forward']) {
        await watchHeader(page)
        if (to === 'back') await page.goBack()
        else if (to === 'forward') await page.goForward()
        else await page.locator(`a[href="${to}"]:visible`).first().click()
        const destination = to === 'back'
          ? '/rewards'
          : to === 'forward'
          ? '/scenarios'
          : to
        await expect(page).toHaveURL(new RegExp(`${destination}$`))
        await expect(page.locator('main h1')).toBeVisible()
        await expect(points).toBeVisible()
        await expect(dot).toBeVisible()
        const gaps = await page.evaluate(() =>
          (window as unknown as { stopHeaderWatch: () => string[] })
            .stopHeaderWatch()
        )
        results.push({ from, to, gaps })
        from = destination
      }
      await testInfo.attach('navigation-observations', {
        body: JSON.stringify({ initial, world, results }, null, 2),
        contentType: 'application/json',
      })
      expect(world.unhandled).toEqual([])
      expect(results.filter((result) => result.gaps.length > 0)).toEqual([])
      expect({ wallets: world.wallets, bells: world.bells }).toEqual(initial)
    },
  )
}
