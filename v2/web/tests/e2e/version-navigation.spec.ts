import { expect, type Page, test } from '@playwright/test'

const railOf = (page: Page) =>
  page.getByRole('navigation', { name: '版本快速导航' })
const currentOf = (page: Page) =>
  railOf(page).locator('[aria-current="location"]')

async function swipeRail(page: Page) {
  const bounds = (await railOf(page).boundingBox())!
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height * 0.75
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  })
  for (let step = 1; step <= 12; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - step * 10 }],
    })
    await page.waitForTimeout(25)
  }
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await session.detach()
}

for (const [id, count] of [[108, 2], [103, 40]]) {
  test(`${count} versions: directory scroll moves the page, then yields to normal scrolling`, async ({ page, isMobile }) => {
    await page.goto(`/agents/${id}`)
    await expect(page.getByTestId('version-card')).toHaveCount(count)
    await page.getByTestId('version-card').first().scrollIntoViewIfNeeded()
    const rail = railOf(page)
    await expect(rail).toBeVisible()
    await expect(rail).toHaveCSS('flex-direction', 'column')
    await expect(rail).toHaveCSS('opacity', '0.2')
    const before = await page.evaluate(() => scrollY)
    const selected = await currentOf(page).getAttribute('href')
    if (isMobile) await swipeRail(page)
    else {
      const bounds = (await rail.boundingBox())!
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      )
      await page.mouse.wheel(0, 120)
    }
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(
      before + 20,
    )
    await expect(currentOf(page)).not.toHaveAttribute('href', selected!)
    await expect(rail).toHaveCSS('opacity', '1')
    // Native momentum/snap may outlive pointerup; only fade after it settles.
    await expect(rail).toHaveAttribute('data-driving', 'false')
    if (!isMobile) await page.mouse.move(300, 100)
    await expect(rail).toHaveCSS('opacity', '0.2')
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await expect(currentOf(page)).toHaveAttribute(
      'aria-label',
      new RegExp(`v${count}，最新版本`),
    )
    await expect.poll(() => rail.evaluate((n) => n.scrollTop)).toBe(0)
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).toBe(true)
  })
}

test('click, keyboard, reduced motion and single-version behavior', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/agents/108')
  await page.getByTestId('version-card').first().scrollIntoViewIfNeeded()
  const rail = railOf(page)
  const first = rail.getByRole('link', { name: /v2，最新版本/ })
  await first.focus()
  await expect(rail).toHaveCSS('opacity', '1')
  await page.keyboard.press('End')
  await expect(currentOf(page)).toHaveAttribute('aria-label', '跳转到 v1')
  await expect(rail.getByRole('link', { name: '跳转到 v1' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(rail.getByRole('link', { name: '跳转到 v1' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('version-card').last()).toBeFocused()
  await first.click()
  await expect(currentOf(page)).toHaveAttribute('aria-label', /v2，最新版本/)
  await expect(page.getByTestId('version-card').first()).toBeFocused()
  await page.goto('/agents/107')
  await expect(page.getByTestId('version-card')).toHaveCount(1)
  await expect(railOf(page)).toHaveCount(0)
})
