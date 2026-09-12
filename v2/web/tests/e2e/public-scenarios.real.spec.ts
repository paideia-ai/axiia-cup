import { expect, type Request, test } from '@playwright/test'

import type { ScenarioDetail, ScenarioListResponse } from '../../src/api/types'

for (const width of [1280, 390]) {
  test(`A4 guest reads catalog and details before login (${width}px)`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 })
    expect(await context.cookies()).toEqual([])
    const catalogResponse = await page.request.get('/v1/scenarios')
    expect(catalogResponse.status()).toBe(200)
    const { scenarios } = await catalogResponse.json() as ScenarioListResponse
    const selected = scenarios.find((item) => item.id === 'shangyang-court')
    expect(selected, 'the real fixture must include shangyang-court')
      .toBeDefined()
    for (const scenario of scenarios) {
      expect(scenario.gateUnlocked).toBe(false)
      expect(scenario.gateProgress).toBeUndefined()
    }
    const detailResponse = await page.request.get(
      '/v1/scenarios/shangyang-court?side=b',
    )
    expect(detailResponse.status()).toBe(200)
    const detail = await detailResponse.json() as ScenarioDetail
    expect(detail.summary.gateProgress).toBeUndefined()

    const restrictedRequests: string[] = []
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (
        /^\/v1\/(my\/agents|matches|notifications)(\/|$)/.test(url.pathname) ||
        (url.pathname.startsWith('/v1/') && request.method() !== 'GET')
      ) {
        restrictedRequests.push(`${request.method()} ${url.pathname}`)
      }
    })

    await page.goto('/scenarios')
    await expect(page).toHaveURL(/\/scenarios$/)
    await expect(page.getByRole('heading', { name: '场景', exact: true }))
      .toBeVisible()
    const card = page.getByTestId('scenario-shangyang-court')
    await expect(card).toBeVisible()
    if (selected?.stats == null) {
      await expect(card.getByText('数据积累中', { exact: true })).toBeVisible()
    }
    await expect(page.getByText(/对局数不足/)).toHaveCount(0)
    await expect(page.getByRole('link', { name: '通知' })).toHaveCount(0)
    await expect(page.getByTestId('logout')).toHaveCount(0)
    await card.click()
    await expect(page).toHaveURL(/\/scenarios\/shangyang-court$/)
    await expect(page.getByRole('heading', { name: '商鞅变法 · 朝堂辩法' }))
      .toBeVisible()
    if (detail.summary.stats == null) {
      await expect(page.getByText('数据积累中', { exact: true })).toBeVisible()
    }
    await expect(page.getByText(/对局数不足/)).toHaveCount(0)
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth <= innerWidth
      ),
    ).toBe(true)
    await page.getByTestId('build-agent-b').click()
    await expect(page).toHaveURL((url) =>
      url.pathname === '/login' &&
      url.searchParams.get('next') === '/scenarios/shangyang-court/build?side=b'
    )
    await expect(page.getByRole('heading', { name: '登录', exact: true }))
      .toBeVisible()
    expect(restrictedRequests).toEqual([])
    expect(
      (await context.cookies()).filter(({ name }) => name === 'axiia_session'),
    ).toEqual([])
  })
}

test('A4 guest browsing recovers from a stale session cookie', async ({ page, context, baseURL }) => {
  await context.addCookies([{
    name: 'axiia_session',
    value: 'expired-public-browsing-test',
    url: baseURL ?? 'http://127.0.0.1:5173',
    httpOnly: true,
    sameSite: 'Lax',
  }])
  expect((await page.request.get('/v1/auth/me')).status()).toBe(401)
  const publicRequests: Request[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/v1/scenarios')) {
      publicRequests.push(request)
    }
  })
  const catalog = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/v1/scenarios'
  )
  await page.goto('/scenarios')
  expect((await catalog).status()).toBe(200)
  await page.getByTestId('scenario-shangyang-court').click()
  await expect(page.getByRole('heading', { name: '商鞅变法 · 朝堂辩法' }))
    .toBeVisible()
  await expect(page.getByTestId('build-agent-b')).toBeEnabled()
  expect(publicRequests.length).toBeGreaterThanOrEqual(2)
  const headers = await Promise.all(
    publicRequests.map((request) => request.allHeaders()),
  )
  expect(headers.every((header) => !header.cookie)).toBe(true)
})
