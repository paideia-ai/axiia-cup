import { expect, type Page, type Route, test } from '@playwright/test'
import { config, finishedMatch, scenario } from '../../src/testing/v34-fixtures'

async function installWorld(page: Page) {
  const world = {
    live: false,
    holdStream: false,
    turnCount: 60,
    streams: [] as Route[],
    delay: 0,
    listRequests: 0,
    completedListRequests: 0,
    extraRows: 0,
    empty: false,
    authenticated: true,
    detailDelay: 0,
  }
  await page.context().route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body: unknown, status = 200) =>
      route.fulfill({ json: body, status })
    if (path === '/v1/auth/me') {
      return world.authenticated
        ? json({
          account: {
            id: 'scroll-reader',
            displayName: '阅读位置测试',
            isAdmin: false,
            hasTOTP: false,
          },
          elevated: false,
          firstBattleDone: true,
        })
        : json({ error: 'unauthorized' }, 401)
    }
    if (path === '/v1/auth/logout') {
      world.authenticated = false
      return json({ ok: true })
    }
    if (path === '/v1/config') return json(config)
    if (path === '/v1/scenarios') return json({ scenarios: [scenario.summary] })
    if (path === '/v1/my/agents') return json({ scenarios: [] })
    if (path === '/v1/matches') {
      world.listRequests++
      await new Promise((resolve) => setTimeout(resolve, world.delay))
      world.completedListRequests++
      return json({
        open: true,
        matches: world.empty
          ? []
          : Array.from({ length: 80 + world.extraRows }, (_, index) => ({
            ...finishedMatch.summary,
            id: 1000 + index - world.extraRows,
            challengeID: null,
            challengeLeg: null,
            participants: {
              a: { isMine: index % 2 === 0, agentID: 101, versionID: 1001 },
              b: { isMine: false },
            },
          })),
      })
    }
    if (/^\/v1\/matches\/\d+\/stream$/.test(path)) {
      if (world.holdStream) {
        world.streams.push(route)
        return
      }
      return route.fulfill({
        contentType: 'text/event-stream',
        body: ': idle\n\n',
      })
    }
    if (/^\/v1\/matches\/\d+$/.test(path)) {
      await new Promise((resolve) => setTimeout(resolve, world.detailDelay))
      return json({
        ...finishedMatch,
        summary: {
          ...finishedMatch.summary,
          finished: !world.live,
          scored: !world.live,
          id: Number(path.split('/').at(-1)),
          challengeID: null,
          challengeLeg: null,
        },
        turns: Array.from(
          { length: world.turnCount },
          (_, seq) => ({
            seq,
            channel: 'court',
            kind: 'dialogue',
            speaker: seq % 2 ? 'b' : 'a',
            finalText: `第 ${seq + 1} 段。${
              '这是用来检查浏览位置恢复的对话内容。'.repeat(8)
            }`,
            reasoning: '',
          }),
        ),
        verdicts: [],
      })
    }
    if (path === '/v1/notifications/bell') {
      return route.fulfill({
        contentType: 'text/event-stream',
        body: ': connected\n\n',
      })
    }
    if (path === '/v1/notifications') {
      return json({ notifications: [], unreadCount: 0 })
    }
    if (path === '/v1/rewards') return json({ error: 'not_found' }, 404)
    return json({ error: 'fixture_not_found', path }, 404)
  })
  return world
}

const card = (page: Page) => page.locator('[data-scroll-anchor="match-1040"]')
async function openFromList(page: Page) {
  await page.goto('/matches?mine=1&scenario=shangyang-court')
  await expect(card(page)).toBeVisible()
  await card(page).evaluate((element) => {
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 130,
      behavior: 'instant',
    })
  })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(
    500,
  )
  const y = await page.evaluate(() => window.scrollY)
  await card(page).getByRole('link', { name: /对战 #1040/ }).click()
  await expect(page).toHaveURL(/\/matches\/1040$/)
  await expect(page.getByRole('link', { name: '← 对战列表', exact: true }))
    .toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  return y
}
async function expectRestored(page: Page, y: number) {
  await expect(page).toHaveURL(/\/matches\?mine=1&scenario=shangyang-court$/)
  await expect(page.getByRole('checkbox')).toBeChecked()
  await expect.poll(async () =>
    Math.abs(await page.evaluate(() => window.scrollY) - y)
  ).toBeLessThan(3)
}

test('browser back and page back restore cached content without another request', async ({ page }) => {
  const world = await installWorld(page)
  const y = await openFromList(page)
  world.delay = 1400
  const requests = world.listRequests
  await page.goBack()
  await expectRestored(page, y)
  await card(page).getByRole('link', { name: /对战 #1040/ }).click()
  await page.getByRole('link', { name: '← 对战列表', exact: true }).click()
  await expectRestored(page, y)
  expect(world.listRequests).toBe(requests)
})

test('cold history waits for slow content before restoring the filtered list', async ({ page }) => {
  const world = await installWorld(page)
  const y = await openFromList(page)
  // A document reload discards the in-memory query cache, but retains history.
  await page.reload()
  await expect(page.getByText(/^第 60 段/)).toBeAttached()
  world.delay = 1400
  await page.goBack()
  await expect(page.getByRole('status', { name: '正在加载内容' }))
    .toBeAttached()
  await expectRestored(page, y)
})

test('stale cached content restores before a slow background refresh completes', async ({ page }) => {
  const world = await installWorld(page)
  const y = await openFromList(page)
  await page.clock.install()
  await page.clock.fastForward(11_000)
  world.delay = 1800
  const completed = world.completedListRequests
  await page.goBack()
  await expectRestored(page, y)
  expect(world.completedListRequests).toBe(completed)
  await expect(page.getByRole('status', { name: '正在加载内容' })).toHaveCount(
    0,
  )
  await expect.poll(() => world.completedListRequests).toBeGreaterThan(
    completed,
  )
  await expectRestored(page, y)
})

test('reload, forward, and distinct visits keep their own reading positions', async ({ page }) => {
  const world = await installWorld(page)
  const listY = await openFromList(page)
  await page.evaluate(() => window.scrollTo(0, 1800))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
  world.detailDelay = 1200
  await page.reload()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
  await page.goBack()
  await expectRestored(page, listY)
  await page.goForward()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
  // A fresh link to a visited URL still opens at the top.
  await page.getByRole('link', { name: '历史', exact: true }).click()
  await expect(page).toHaveURL(/\/matches$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
})

test('new rows above the saved card preserve the card position', async ({ page }) => {
  const world = await installWorld(page)
  await openFromList(page)
  world.extraRows = 4
  await page.reload()
  await expect(page.getByText(/^第 60 段/)).toBeAttached()
  await page.goBack()
  await expect.poll(() =>
    card(page).evaluate((element) => element.getBoundingClientRect().top)
  ).toBeCloseTo(130, 0)
})

test('direct entry has a safe fallback and normal link semantics', async ({ page }) => {
  await installWorld(page)
  await page.goto('/matches/1040')
  const back = page.getByRole('link', { name: '← 我的智能体', exact: true })
    .first()
  await expect(back).toHaveAttribute('href', '/my-agents')
  await back.click()
  await expect(page).toHaveURL(/\/my-agents$/)
  await openFromList(page)
  const source = page.getByRole('link', { name: '← 对战列表', exact: true })
  await expect(source).toHaveAttribute(
    'href',
    '/matches?mine=1&scenario=shangyang-court',
  )
  if (test.info().project.name === 'desktop') {
    await source.click({ modifiers: ['Control'] })
    await expect(page).toHaveURL(/\/matches\/1040$/)
    await page.bringToFront()
    await source.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/matches\?mine=1&scenario=shangyang-court$/)
  }
})

test('user scrolling cancels delayed restoration and a shorter list settles safely', async ({ page }) => {
  const world = await installWorld(page)
  await openFromList(page)
  world.delay = 1600
  await page.reload()
  await expect(page.getByText(/^第 60 段/)).toBeAttached()
  await page.goBack()
  await expect(page.getByRole('status', { name: '正在加载内容' }))
    .toBeAttached()
  // A deliberate scroll gesture while the list is loading takes precedence.
  await page.evaluate(() =>
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
  )
  await expect(card(page)).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  world.delay = 0
  await openFromList(page)
  world.empty = true
  await page.reload()
  await expect(page.getByText(/^第 60 段/)).toBeAttached()
  await page.goBack()
  await expect(page.locator('[data-scroll-anchor]')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('logout clears the account browsing session', async ({ page }) => {
  await installWorld(page)
  await openFromList(page)
  await page.getByTestId('logout').click()
  await expect(page).not.toHaveURL(/\/matches\/1040$/)
  await expect.poll(() =>
    page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('axiia.navigation.v1') ?? '{}').scope
    )
  ).toBe('guest')
  const saved = await page.evaluate(() =>
    sessionStorage.getItem('axiia.navigation.v1')
  )
  expect(
    JSON.parse(saved ?? '{}').visits.every((visit: { url: string }) =>
      !visit.url.startsWith('/matches')
    ),
  ).toBe(true)
})

test('returning to a live transcript restores reading position without following new turns', async ({ page }) => {
  const world = await installWorld(page)
  world.live = true
  await openFromList(page)
  await page.evaluate(() => window.scrollTo(0, 1800))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
  await page.getByRole('link', { name: '历史', exact: true }).click()
  await expect(page).toHaveURL(/\/matches$/)
  world.holdStream = true
  await page.goBack()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
  await expect.poll(() => world.streams.length).toBeGreaterThan(0)
  world.turnCount += 1
  await Promise.all(
    world.streams.splice(0).map((route) =>
      route.fulfill({
        contentType: 'text/event-stream',
        body:
          'data: {"turnCompleted":{"matchID":1040,"seq":60,"channel":"court","kind":"dialogue"}}\n\n',
      })
    ),
  )
  await expect(page.getByText(/^第 61 段/)).toBeAttached()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1800)
})
