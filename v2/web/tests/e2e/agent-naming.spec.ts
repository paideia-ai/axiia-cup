import { expect, test } from '@playwright/test'

for (const entry of ['match', 'deep link']) {
  test(`browser Back preserves mobile version browsing after ${entry} entry`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    const agentURL = '/agents/400?version=9001&match=8101'
    if (entry === 'match') {
      await page.goto('/matches/8101')
      await page.locator('[data-tm="FA.participant-card"]').first()
        .getByRole('link').click()
    } else {
      await page.goto(agentURL)
    }
    await expect(page).toHaveURL(agentURL)
    await expect(page.locator('[data-version-id="9001"]')).toBeInViewport()
    const focusedY = await page.evaluate(() => scrollY)
    const history = page.locator('[data-version-id="9002"]')
      .getByTestId('version-record')
    await history.evaluate((node) => {
      scrollTo({
        top: scrollY + node.getBoundingClientRect().top - 200,
        behavior: 'instant',
      })
    })
    await expect(history).toBeInViewport()
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(
      focusedY + 150,
    )
    // Let the browser emit the scroll event before leaving the page.
    await page.evaluate(() =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    )
    const browsedY = await page.evaluate(() => scrollY)
    await history.click()
    await expect(page).toHaveURL('/matches?version=9002')
    await page.goBack()
    await expect(page).toHaveURL(agentURL)
    await expect.poll(async () =>
      Math.abs(await page.evaluate(() => scrollY) - browsedY)
    ).toBeLessThan(3)
    await expect(history).toBeInViewport()
    // Forward and another Back must keep the same saved browsing position.
    await page.goForward()
    await expect(page).toHaveURL('/matches?version=9002')
    await page.goBack()
    await expect(page).toHaveURL(agentURL)
    await expect.poll(async () =>
      Math.abs(await page.evaluate(() => scrollY) - browsedY)
    ).toBeLessThan(3)
  })
}

for (const width of [390, 1440]) {
  test(`names survive rename, links locate the actual version at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/matches?mine=0')
    const old = page.locator('[data-scroll-anchor="match-8101"]')
    const newer = page.locator('[data-scroll-anchor="match-8102"]')
    const unnamed = page.locator('[data-scroll-anchor="match-8103"]')
    const queued = page.locator('[data-scroll-anchor="match-8104"]')
    await expect(old).toContainText('初出茅庐')
    await expect(newer).toContainText('稳健派')
    await expect(unnamed).toContainText('#400')
    await expect(old).toContainText('小舟 · 以退为进')
    await old.locator('[data-tm="L.owned-agent"]').click()
    await expect(page).toHaveURL(/\/agents\/400\?version=9001&match=8101/)
    const selected = page.locator('[data-version-id="9001"]')
    await expect(selected).toContainText('正在查看')
    await expect(selected).toBeInViewport()
    await expect(selected).toContainText('V·9001')
    await expect(page.locator('[data-tm="EA.agent-id"]')).toHaveText('#400')
    await page.getByRole('button', { name: '智能体更多操作' }).click()
    await page.getByRole('menuitem', { name: '重命名', exact: true }).click()
    await page.getByLabel('智能体名称', { exact: true }).fill('改名验证')
    await page.getByRole('button', { name: '保存名称', exact: true }).click()
    await expect(page.locator('[data-tm="EA.page-title"]')).toContainText(
      '改名验证',
    )
    await page.goto('/matches?mine=0')
    await expect(old).toContainText('初出茅庐')
    await expect(newer).toContainText('稳健派')
    await expect(unnamed).toContainText('#400')
    await expect(queued).toContainText('改名验证')
    await old.locator('[data-tm="L.match-card"]').click()
    const participants = page.locator('[data-tm="FA.participant-card"]')
    await expect(participants.first()).toContainText('初出茅庐')
    await expect(participants.last()).toContainText('以退为进')
    await expect(participants).toHaveCount(2)
    await expect(page.locator('[data-tm="FA.version-id"]')).toHaveCount(0)
    await expect(participants.first()).not.toContainText('9001')
    await participants.last().getByRole('link').click()
    await expect(page).toHaveURL(
      /\/agents\/401\/identity\?version=9010&match=8101/,
    )
    await expect(page.locator('[data-version-id="9010"]')).toBeInViewport()
    await expect(page.locator('[data-version-id="9010"]')).toContainText(
      '本场对局版本',
    )
    await page.goto('/matches/8103')
    await expect(page.locator('[data-tm="FA.participant-name"]').last())
      .toHaveText('勇而多疑')
    await expect(page.locator('[data-tm="FA.participant-card"]').last()).not
      .toContainText('lvbu-default')
    const overflow = await page.locator('[data-tm="FA.participant-card"]')
      .evaluateAll((nodes) =>
        nodes.some((node) => node.getBoundingClientRect().right > innerWidth)
      )
    expect(overflow).toBe(false)
    await page.screenshot({
      path: `test-results/agent-names-${width}.png`,
      fullPage: true,
    })
  })
}

test('long custom names fit the participant card on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.route('**/v1/matches/8101', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    body.summary.participants.a.agentName = 'W'.repeat(30)
    await route.fulfill({ json: body })
  })
  await page.goto('/matches/8101')
  const name = page.locator('[data-tm="FA.participant-name"]').first()
  await expect(name).toHaveText('W'.repeat(30))
  const overflow = await name.evaluate((node) =>
    node.getBoundingClientRect().right > innerWidth
  )
  expect(overflow).toBe(false)
})
