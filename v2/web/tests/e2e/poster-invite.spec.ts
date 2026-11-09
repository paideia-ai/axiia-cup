import { expect, type Page, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Every API request stays local; this journey never creates a real account.
  await page.route('**/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    return path === '/v1/landing'
      ? route.fulfill({
        json: { demoMatches: [], topPlayers: [], totalBattles: 0 },
      })
      : route.fulfill({
        status: 401,
        json: { error: 'unauthorized', message: '未登录' },
      })
  })
})

async function expectInvite(page: Page, invite = 'axiia_cup') {
  await expect(page.getByRole('heading', { name: '注册', exact: true }))
    .toBeVisible()
  await expect(page.getByRole('tabpanel').getByLabel(/注册码/)).toHaveValue(
    invite,
  )
  await page.getByRole('tab', { name: '手机号' }).click()
  await expect(page.getByRole('tabpanel').getByLabel(/注册码/)).toHaveValue(
    invite,
  )
  await page.getByRole('tab', { name: '邮箱' }).click()
}

for (const name of ['注册', '立即注册']) {
  test(`poster landing → ${name} preserves invite`, async ({ page }) => {
    await page.goto('/?invite=axiia_cup')
    const link = page.getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('href', '/register?invite=axiia_cup')
    await expect(page.getByRole('link', { name: '浏览场景', exact: true }))
      .toHaveAttribute('href', '/scenarios')
    await link.click()
    await expect(page).toHaveURL('/register?invite=axiia_cup')
    await expectInvite(page)
  })
}

for (const mobile of [false, true]) {
  test(`direct entry and refresh prefill both forms (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/register?invite=axiia_cup')
    await expectInvite(page)
    await page.reload()
    await expectInvite(page)
  })
}

test('poster → login → registration round-trip retains next', async ({ page }) => {
  const params = new URLSearchParams({
    invite: 'axiia_cup',
    next: '/scenarios/scene-a/build?side=b#strategy',
  })
  await page.goto(`/?${params}`)
  await page.getByRole('link', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL(`/login?${params}`)
  await page.getByRole('link', { name: '去注册' }).click()
  await expect(page).toHaveURL(`/register?${params}`)
  await expectInvite(page)
  await page.getByRole('link', { name: '去登录' }).click()
  await expect(page).toHaveURL(`/login?${params}`)
  await page.getByRole('link', { name: '去注册' }).click()
  await expect(page).toHaveURL(`/register?${params}`)
  await expectInvite(page)
})

for (const search of ['', '?invite=', '?invite=%20%20']) {
  test(`ordinary landing keeps manual invite entry: ${search || '(no query)'}`, async ({ page }) => {
    await page.goto(`/${search}`)
    await expect(page.getByRole('link', { name: '注册', exact: true }))
      .toHaveAttribute('href', '/register')
    await expect(page.getByRole('link', { name: '登录', exact: true }))
      .toHaveAttribute('href', '/login')
    await page.getByRole('link', { name: '立即注册' }).click()
    await expectInvite(page, '')
  })
}
