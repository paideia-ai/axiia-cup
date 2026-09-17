import { expect, type Page, test } from '@playwright/test'

import {
  finishedMatch,
  inventory,
  scenario,
  versions,
} from '../../src/testing/v34-fixtures'

const baseline = process.env.NAVIGATION_BASELINE === '1'

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

async function world(page: Page) {
  const requests: Record<string, number> = {}
  const delays: Record<string, number> = {
    '/v1/scenarios': 650,
    '/v1/my/agents': 350,
    '/v1/matches': 350,
  }
  const holds: Record<string, Promise<void>> = {}
  let account = 'navigation-player'
  let failCatalog = false
  await page.route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    requests[path] = (requests[path] ?? 0) + 1
    const delay = delays[path] ?? 50
    await new Promise((resolve) => setTimeout(resolve, delay))
    await holds[path]
    let payload: unknown = {}
    let status = 200
    if (path === '/v1/auth/me' || path === '/v1/auth/login') {
      payload = {
        account: { id: account, displayName: account, isAdmin: false },
        elevated: false,
        firstBattleDone: true,
      }
    } else if (path === '/v1/scenarios') {
      payload = failCatalog
        ? { error: 'unavailable', message: '场景暂不可用' }
        : { scenarios: [scenario.summary] }
      status = failCatalog ? 503 : 200
    } else if (path === `/v1/scenarios/${scenario.summary.id}`) {
      payload = scenario
    } else if (path === '/v1/my/agents') payload = inventory
    else if (path === '/v1/matches') {
      payload = { matches: [finishedMatch.summary], open: true }
    } else if (path === '/v1/matches/9001') payload = finishedMatch
    else if (path === '/v1/agents/101/draft') {
      payload = {
        fields: { prompt: '测试策略' },
        scenarioID: scenario.summary.id,
        side: 'a',
      }
    } else if (path === '/v1/agents/101/versions') {
      payload = { versions, entryVersionID: 1002 }
    } else if (path === '/v1/tournaments') payload = { tournaments: [] }
    else if (path === '/v1/notifications') {
      payload = { notifications: [], unreadCount: 0 }
    } else if (path.includes('/rewards')) {
      status = 404
      payload = { error: 'unavailable', message: '积分功能暂未开放' }
    } else if (path.endsWith('/events')) {
      return route.fulfill({
        contentType: 'text/event-stream',
        body: ': fixture\n\n',
      })
    }
    await route.fulfill({ status, json: payload })
  })
  return {
    requests,
    delays,
    holds,
    setAccount: (id: string) => account = id,
    failCatalog: () => failCatalog = true,
  }
}

function nav(page: Page, path: string) {
  return page.locator(`header nav a[href="${path}"]`)
}

test(
  'measure first visit, history, revisit and detail with fixed API latency',
  async ({ page }, info) => {
    const state = await world(page)
    const metrics: Record<string, number> = {}
    let started = Date.now()
    await page.goto('/scenarios')
    await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
    metrics.firstVisitMs = Date.now() - started
    await page.evaluate(() => {
      ;(window as unknown as { savedHeader: Element | null }).savedHeader =
        document.querySelector('header')
    })
    started = Date.now()
    await nav(page, '/matches').click()
    await expect(page.locator('[data-tm="L.match-card"]')).toBeVisible()
    metrics.historyMs = Date.now() - started
    started = Date.now()
    await nav(page, '/scenarios').click()
    await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
    metrics.revisitMs = Date.now() - started
    const headerPreserved = await page.evaluate(() =>
      (window as unknown as { savedHeader: Element | null }).savedHeader ===
        document.querySelector('header')
    )
    started = Date.now()
    await page.locator('[data-tm="D.scenario-card"]').click()
    await expect(page.locator('[data-tm="DA.loading"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    metrics.detailMs = Date.now() - started
    const result = {
      baseline,
      metrics,
      headerPreserved,
      requests: state.requests,
    }
    console.log(JSON.stringify(result))
    await info.attach('navigation-measurements', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    })
    await page.screenshot({
      path: info.outputPath('detail.png'),
      fullPage: true,
    })
    if (!baseline) {
      expect(headerPreserved).toBe(true)
      expect(metrics.revisitMs).toBeLessThan(300)
      expect(state.requests['/v1/scenarios']).toBe(1)
    }
  },
)

test('history renders without waiting for optional scenario names', async ({ page }) => {
  const state = await world(page)
  const catalogGate = gate()
  state.holds['/v1/scenarios'] = catalogGate.promise
  let catalogFinished = false
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/v1/scenarios') {
      catalogFinished = true
    }
  })
  await page.goto('/matches')
  await expect(page.locator('[data-tm="L.match-card"]')).toBeVisible()
  expect(catalogFinished).toBe(false)
  catalogGate.release()
})

test('keyboard focus prefetches a destination without navigating or writing', async ({ page }) => {
  await world(page)
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url())
  })
  await page.goto('/scenarios')
  await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
  const response = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/v1/tournaments'
  )
  await nav(page, '/tournaments').focus()
  await response
  await expect(page).toHaveURL(/\/scenarios$/)
  await nav(page, '/tournaments').click()
  await expect(page.locator('[data-tm="G.empty"]')).toBeVisible()
  await expect(page.locator('[data-tm="G.loading"]')).toHaveCount(0)
  expect(writes).toEqual([])
})

test('a failed background refresh keeps cached content and offers retry', async ({ page }) => {
  const state = await world(page)
  await page.clock.install()
  await page.goto('/scenarios')
  await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
  await nav(page, '/tournaments').click()
  await expect(page.locator('[data-tm="G.empty"]')).toBeVisible()
  state.failCatalog()
  await page.clock.fastForward(31_000)
  await nav(page, '/scenarios').click()
  await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
  await expect(page.locator('[data-tm="D.loading"]')).toHaveCount(0)
  await expect(page.getByText('更新暂时失败，当前显示上次内容。')).toBeVisible()
  await expect(page.getByRole('button', { name: '重试', exact: true }))
    .toBeVisible()
  await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
})

test(
  'mobile skeleton preserves layout and respects reduced motion',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const state = await world(page)
    const catalogGate = gate()
    state.holds['/v1/scenarios'] = catalogGate.promise
    await page.goto('/scenarios')
    const skeleton = page.locator('[data-tm="D.loading"]')
    await expect(skeleton).toBeVisible()
    await expect(skeleton).toHaveAttribute('role', 'status')
    await expect(skeleton).toHaveAttribute('data-visible', 'true')
    expect(
      await skeleton.locator('.page-loading-shapes').evaluate((element) =>
        getComputedStyle(element).animationName
      ),
    ).toBe('none')
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth <= innerWidth
      ),
    ).toBe(true)
    await page.screenshot({
      path: info.outputPath('mobile-skeleton.png'),
      fullPage: true,
    })
    catalogGate.release()
    await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
    await page.screenshot({
      path: info.outputPath('mobile-loaded.png'),
      fullPage: true,
    })
  },
)

test('a first-load failure stays an error, not an empty list or endless skeleton', async ({ page }) => {
  const state = await world(page)
  state.failCatalog()
  await page.goto('/scenarios')
  await expect(page.locator('[data-tm="D.error"]')).toHaveText('场景暂不可用')
  await expect(page.locator('[data-tm="D.loading"]')).toHaveCount(0)
  await expect(page.locator('[data-tm="D.empty"]')).toHaveCount(0)
})

test('a late response from the previous agent cannot replace the current detail', async ({ page }) => {
  const state = await world(page)
  const draftGate = gate()
  state.holds['/v1/agents/101/draft'] = draftGate.promise
  await page.route('**/v1/agents/102/**', (route) => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({
      json: path.endsWith('/draft')
        ? {
          fields: { prompt: '乙方策略' },
          scenarioID: scenario.summary.id,
          side: 'b',
        }
        : { versions: [], entryVersionID: null },
    })
  })
  await page.goto('/agents/101')
  await expect(page.locator('[data-tm="EA.loading"]')).toBeVisible()
  const oldResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/v1/agents/101/draft'
  )
  await page.evaluate(() => {
    history.pushState({}, '', '/agents/102')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('甘龙')
  draftGate.release()
  await oldResponse
  await expect(page.getByRole('heading', { level: 1 })).toContainText('甘龙')
  await expect(page.getByRole('heading', { level: 1 })).not.toContainText(
    '商鞅',
  )
})

test('a fast destination never reveals a loading skeleton', async ({ page }) => {
  await world(page)
  await page.goto('/scenarios')
  await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
  await page.evaluate(() => {
    const scope = globalThis as typeof globalThis & { revealedLoading: boolean }
    scope.revealedLoading = false
    new MutationObserver(() => {
      if (document.querySelector('.page-loading[data-visible]')) {
        scope.revealedLoading = true
      }
    }).observe(document.querySelector('main')!, {
      subtree: true,
      attributes: true,
      childList: true,
    })
  })
  await nav(page, '/tournaments').click()
  await expect(page.locator('[data-tm="G.empty"]')).toBeVisible()
  expect(
    await page.evaluate(() =>
      (globalThis as typeof globalThis & { revealedLoading: boolean })
        .revealedLoading
    ),
  ).toBe(false)
})

test('a server denial removes a cached page instead of retaining its actions', async ({ page }) => {
  await world(page)
  await page.clock.install()
  await page.goto('/scenarios')
  await expect(page.locator('[data-tm="D.scenario-card"]')).toBeVisible()
  await nav(page, '/tournaments').click()
  await expect(page.locator('[data-tm="G.empty"]')).toBeVisible()
  await page.route(
    '**/v1/scenarios',
    (route) =>
      route.fulfill({
        status: 403,
        json: { error: 'forbidden', message: '无权访问' },
      }),
  )
  await page.clock.fastForward(31_000)
  await nav(page, '/scenarios').click()
  await expect(page.locator('[data-tm="D.error"]')).toHaveText('无权访问')
  await expect(page.locator('[data-tm="D.scenario-card"]')).toHaveCount(0)
  await expect(page.getByText('更新暂时失败，当前显示上次内容。')).toHaveCount(
    0,
  )
})
