// Executable Gherkin mirror. Stateful HTTP fixtures test browser integration;
// backend RewardHTTPTests/StoreTests independently verify durable accounting.
import { expect, type Page, test } from '@playwright/test'
import { config, finishedMatch, scenario } from '../../src/testing/v34-fixtures'

async function rewardWorld(page: Page, options: {
  balance?: number
  loseResponse?: boolean
  failRefresh?: boolean
  surcharge?: boolean
  failQuote?: boolean
  failWallet?: boolean
} = {}) {
  const world = {
    claimed: false,
    claims: 0,
    saves: 0,
    dispatches: 0,
    quotes: 0,
    wallets: 0,
    walletUnavailable: options.failWallet === true,
  }
  const balance = options.balance ?? 1900
  await page.route('**/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const json = (body: unknown, status = 200) =>
      route.fulfill({ json: body, status })
    if (path === '/v1/auth/me') {
      return json({
        account: {
          id: 'reward-player',
          displayName: '积分玩家',
          email: 'rewards@example.test',
          isAdmin: false,
        },
        elevated: false,
        firstBattleDone: true,
      })
    }
    if (path === '/v1/rewards') {
      world.wallets++
      if (world.walletUnavailable) {
        return json({ error: 'unavailable' }, 503)
      }
      if (world.claimed && options.failRefresh) {
        return json({ error: 'unavailable' }, 503)
      }
      return json({
        balance: balance + (world.claimed ? 50 : 0),
        dailyAllowance: 2000,
        battleCost: 100,
        dailyRuns: 20,
        pveWinRefundPercent: 50,
        pvpWinRefundPercent: 75,
        pointsPerYuan: 100,
        nextGrantAt: 1789228800,
        claimableRewards: world.claimed
          ? []
          : [{ matchID: 9001, points: 50, kind: 'pve' }],
      })
    }
    if (path === '/v1/rewards/quote') {
      world.quotes++
      if (options.failQuote && world.quotes === 1) {
        return json({ error: 'unavailable' }, 503)
      }
      const surcharge = options.surcharge &&
        url.searchParams.get('side') === 'a'
      const cost = surcharge ? 200 : 100
      return json({
        cost,
        perBattleCost: 100,
        repeatRoleSurcharge: !!surcharge,
        battleCosts: [cost],
      })
    }
    if (path === '/v1/rewards/matches/9001/claim') {
      world.claims++
      const alreadyClaimed = world.claimed
      world.claimed = true
      if (options.loseResponse && world.claims === 1) {
        return route.abort('failed')
      }
      return json({
        matchID: 9001,
        creditedPoints: alreadyClaimed ? 0 : 50,
        alreadyClaimed,
        balance: balance + 50,
      })
    }
    if (path === '/v1/rewards/matches/9001') {
      return json({
        matchID: 9001,
        points: 50,
        kind: 'pve',
        status: world.claimed ? 'claimed' : 'claimable',
      })
    }
    if (path === '/v1/matches/9001') return json(finishedMatch)
    if (path === '/v1/matches') return json({ matches: [] })
    if (path === '/v1/notifications') {
      return json({ notifications: [], unreadCount: 0 })
    }
    if (path === '/v1/config') {
      return json({ ...config, dailyBattleLimit: 0, pvpDailyLimit: 0 })
    }
    if (path === '/v1/models') return json({ models: config.models })
    if (path === '/v1/my/agents') return json({ scenarios: [] })
    if (path === '/v1/scenarios/shangyang-court') return json(scenario)
    if (/\/agents\/\d+\/draft$/.test(path)) {
      return json({
        fields: { prompt: '用可验证的小承诺说服君上。' },
        scenarioID: scenario.summary.id,
        side: path.includes('/102/') ? 'b' : 'a',
      })
    }
    if (/\/agents\/\d+\/versions$/.test(path)) return json({ versions: [] })
    if (/\/agents\/\d+\/mutate$/.test(path)) return json({ ok: true })
    if (/\/agents\/\d+\/save$/.test(path)) {
      world.saves++
      return json({
        id: 1002,
        agentID: 102,
        ordinal: 1,
        isEntry: true,
        prompt: '用可验证的小承诺说服君上。',
        modelID: 'fixture-model',
      })
    }
    if (path === '/v1/matches/pve' && request.method() === 'POST') {
      world.dispatches++
      return json({ matchID: 9001 })
    }
    if (path.endsWith('/stream')) {
      return route.fulfill({ contentType: 'text/event-stream', body: '' })
    }
    return json({ error: 'not_found' }, 404)
  })
  return world
}

test('积分入口在桌面和移动端都可用', async ({ page }) => {
  await test.step('假如 服务端返回每日 2000 积分与当前余额 1900', async () => {
    await rewardWorld(page)
  })
  await test.step('当 我在 320、390、768、1280 像素宽度打开积分页', async () => {
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/rewards')
      await test.step(`那么 我能看到余额、每日额度与待领取战报且顶栏没有横向溢出 (${width}px)`, async () => {
        await expect(
          page.getByRole('link', { name: '1900 积分，查看积分与奖励' }),
        ).toBeVisible()
        await expect(page.getByText('2000 积分', { exact: true })).toBeVisible()
        await expect(page.getByRole('link', { name: '查看战报并领取' }))
          .toBeVisible()
        await expect(page.getByRole('button', { name: '退出', exact: true }))
          .toBeVisible()
        expect(
          await page.evaluate(() =>
            document.documentElement.scrollWidth <= innerWidth
          ),
        ).toBe(true)
      })
    }
  })
})

test('钱包暂时不可用时不跳过计费确认', async ({ page }) => {
  let world: Awaited<ReturnType<typeof rewardWorld>>
  await test.step('假如 首次钱包请求暂时失败', async () => {
    world = await rewardWorld(page, { failWallet: true })
  })
  await test.step('当 我打开首战构建器', async () => {
    await page.goto('/agents/101/build?express=1')
  })
  await test.step('那么 我不能保存出战也没有创建版本或派发请求', async () => {
    await expect(page.getByText('暂时无法确认本次消耗，请重试。')).toBeVisible()
    await expect(page.getByRole('button', { name: '保存并开始首战' }))
      .toBeDisabled()
    expect(world.saves).toBe(0)
    expect(world.dispatches).toBe(0)
  })
  await test.step('当 我重试并拿到钱包与角色报价', async () => {
    world.walletUnavailable = false
    await page.getByRole('button', { name: '重新确认积分' }).click()
  })
  await test.step('那么 显示实际消耗并允许出战', async () => {
    await expect(page.getByText('100 积分', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '保存并开始首战' }))
      .toBeEnabled()
    expect(world.quotes).toBeGreaterThan(0)
  })
})

test('领取后刷新与回放不会再次领取', async ({ page }) => {
  let world: Awaited<ReturnType<typeof rewardWorld>>
  await test.step('假如 服务端确认我的已结束战报有 50 积分待领取', async () => {
    world = await rewardWorld(page)
    await page.goto('/matches/9001')
    await expect(page.getByRole('button', { name: '领取奖励' })).toBeVisible()
    expect(world.claims).toBe(0)
  })
  await test.step('当 我点击领取奖励', async () => {
    await page.getByRole('button', { name: '领取奖励' }).click()
  })
  await test.step('那么 已领取状态与 1950 余额立即出现且只发出一次领取请求', async () => {
    await expect(page.getByText('已领取 · +50 积分')).toBeVisible()
    await expect(page.getByRole('link', { name: '1950 积分，查看积分与奖励' }))
      .toBeVisible()
    expect(world.claims).toBe(1)
  })
  await test.step('当 我刷新战报并进入回放', async () => {
    await page.reload()
    await expect(page.getByText('已领取 · +50 积分')).toBeVisible()
    await page.getByRole('button', { name: '回放', exact: true }).click()
  })
  await test.step('那么 刷新保留已领取状态而回放隐藏奖励并且不发出领取请求', async () => {
    await expect(page.getByRole('region', { name: '胜利奖励' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '对话重演' })).toBeVisible()
    expect(world.claims).toBe(1)
  })
})

test('领取已入账但响应丢失后安全重试', async ({ page }) => {
  let world: Awaited<ReturnType<typeof rewardWorld>>
  await test.step('假如 首次领取在服务端入账后丢失响应', async () => {
    world = await rewardWorld(page, { loseResponse: true })
    await page.goto('/matches/9001')
  })
  await test.step('当 我看到未确认提示并重试领取', async () => {
    await page.getByRole('button', { name: '领取奖励' }).click()
    await expect(page.getByRole('alert')).toContainText('领取未确认')
    await page.getByRole('button', { name: '领取奖励' }).click()
  })
  await test.step('那么 重试确认已领取且余额只增加一次', async () => {
    await expect(page.getByText('已领取 · +50 积分')).toBeVisible()
    await expect(page.getByRole('link', { name: '1950 积分，查看积分与奖励' }))
      .toBeVisible()
    expect(world.claims).toBe(2)
  })
})

test('领取回执不被后续余额刷新失败覆盖', async ({ page }) => {
  await test.step('假如 领取成功后余额刷新接口暂时失败', async () => {
    await rewardWorld(page, { failRefresh: true })
    await page.goto('/matches/9001')
  })
  await test.step('当 我点击领取奖励', async () => {
    await page.getByRole('button', { name: '领取奖励' }).click()
  })
  await test.step('那么 我仍看到已领取与回执中的 1950 余额', async () => {
    await expect(page.getByText('已领取 · +50 积分')).toBeVisible()
    await expect(page.getByRole('link', { name: '1950 积分，查看积分与奖励' }))
      .toBeVisible()
    await expect(page.getByRole('link', { name: '1950 积分，查看积分与奖励' }))
      .toHaveAttribute('title', '上次确认余额，刷新失败')
  })
})

test('连续同角色报价不足时换角色再出战', async ({ page }) => {
  let world: Awaited<ReturnType<typeof rewardWorld>>
  await test.step('假如 我有 150 积分且商鞅报价 200 而甘龙报价 100', async () => {
    world = await rewardWorld(page, { balance: 150, surcharge: true })
  })
  await test.step('当 我打开商鞅首战构建器', async () => {
    await page.goto('/agents/101/build?express=1')
  })
  await test.step('那么 我看到本次 200 积分和换角色提示且保存出战不可用', async () => {
    await expect(page.getByText('200 积分', { exact: true })).toBeVisible()
    await expect(page.getByText('试试其他角色，让下一场消耗更少。'))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '保存并开始首战' }))
      .toBeDisabled()
    expect(world.saves).toBe(0)
    expect(world.dispatches).toBe(0)
  })
  await test.step('当 我切换到甘龙首战构建器', async () => {
    await page.goto('/agents/102/build?express=1')
  })
  await test.step('那么 本次消耗变成 100 积分并能保存出战', async () => {
    await expect(page.getByText('100 积分', { exact: true })).toBeVisible()
    await expect(page.getByText('试试其他角色，让下一场消耗更少。'))
      .toHaveCount(0)
    await page.getByRole('button', { name: '保存并开始首战' }).click()
    await expect(page).toHaveURL(/\/matches\/9001$/)
    expect(world.saves).toBe(1)
    expect(world.dispatches).toBe(1)
  })
  await test.step('而且 没有每天零场的旧配额提示', async () => {
    await expect(page.getByText(/今日已用.*\/0/)).toHaveCount(0)
  })
})

test('报价失败时先重试再允许出战', async ({ page }) => {
  await test.step('假如 当前角色报价暂时不可用', async () => {
    await rewardWorld(page, { failQuote: true })
  })
  await test.step('当 我打开首战构建器', async () => {
    await page.goto('/agents/101/build?express=1')
  })
  await test.step('那么 我看到重试提示且不能保存出战', async () => {
    await expect(page.getByText('暂时无法确认本次消耗，请重试。')).toBeVisible()
    await expect(page.getByRole('button', { name: '保存并开始首战' }))
      .toBeDisabled()
  })
  await test.step('当 我重新确认积分', async () => {
    await page.getByRole('button', { name: '重新确认积分' }).click()
  })
  await test.step('那么 正确报价显示后才允许保存出战', async () => {
    await expect(page.getByText('100 积分', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '保存并开始首战' }))
      .toBeEnabled()
  })
})
