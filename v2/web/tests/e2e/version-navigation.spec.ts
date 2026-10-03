import { expect, type Page, test } from '@playwright/test'

const railOf = (page: Page) =>
  page.getByRole('navigation', { name: '版本快速导航' })
const currentOf = (page: Page) =>
  railOf(page).locator('[aria-current="location"]')

async function swipeRail(page: Page, outside = false) {
  const bounds = (await railOf(page).boundingBox())!
  const x = outside
    ? page.viewportSize()!.width * 0.7
    : bounds.x + bounds.width / 2
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
    if (step === 10) {
      await expect(railOf(page)).toHaveCSS('opacity', outside ? '0.2' : '1')
    }
  }
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await session.detach()
}

for (const [id, count] of [[108, 2], [103, 40]]) {
  test(`${count} versions: directory scroll moves the page, then yields to normal scrolling`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The scroll-linked wheel is phone-only')
    await page.goto(`/agents/${id}`)
    await expect(page.getByTestId('version-card')).toHaveCount(count)
    await page.getByTestId('version-card').first().scrollIntoViewIfNeeded()
    const rail = railOf(page)
    await expect(rail).toBeVisible()
    await expect(rail).toHaveCSS('flex-direction', 'column')
    await expect(rail).toHaveCSS('opacity', '0.1')
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
    // Native momentum/snap may outlive pointerup; only fade after it settles.
    await expect(rail).toHaveAttribute('data-driving', 'false')
    if (!isMobile) await page.mouse.move(300, 100)
    await expect(rail).toHaveCSS('opacity', '0.1')
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

test('click, keyboard, reduced motion and single-version behavior', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The added arrow navigation is phone-only')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/agents/108')
  await page.getByTestId('version-card').first().scrollIntoViewIfNeeded()
  const rail = railOf(page)
  const first = rail.getByRole('link', { name: /v2，最新版本/ })
  await first.focus()
  await expect(rail).toHaveCSS('opacity', '0.1')
  await page.keyboard.press('End')
  await expect(currentOf(page)).toHaveAttribute('aria-label', '跳转到 v1')
  await expect(rail.getByRole('link', { name: '跳转到 v1', exact: true }))
    .toBeFocused()
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(rail.getByRole('link', { name: '跳转到 v1', exact: true }))
    .toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('version-card').last()).toBeFocused()
  await first.click()
  await expect(currentOf(page)).toHaveAttribute('aria-label', /v2，最新版本/)
  await expect(page.getByTestId('version-card').first()).toBeFocused()
  await page.goto('/agents/107')
  await expect(page.getByTestId('version-card')).toHaveCount(1)
  await expect(railOf(page)).toHaveCount(0)
})

test('desktop retains the original rail and independent directory scrolling', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop regression')
  await page.goto('/agents/103')
  await expect(page.getByTestId('version-card')).toHaveCount(40)
  await page.getByTestId('version-card').first().scrollIntoViewIfNeeded()
  const rail = railOf(page)
  await expect(rail).toHaveCSS('opacity', '1')
  await expect(rail).toHaveCSS('width', '88px')
  await expect(rail).toHaveCSS('padding-top', '2px')
  await expect(rail).toHaveCSS('mask-image', 'none')
  await expect(rail.locator('a').first()).toHaveCSS('min-height', '28px')
  const selected = await currentOf(page).getAttribute('href')
  const before = await page.evaluate(() => scrollY)
  const box = (await rail.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, 180)
  await expect.poll(() => rail.evaluate((n) => n.scrollTop)).toBeGreaterThan(20)
  expect(await page.evaluate(() => scrollY)).toBe(before)
  await expect(currentOf(page)).toHaveAttribute('href', selected!)
  await page.mouse.move(300, 100)
  await page.waitForTimeout(1800)
  await expect(rail).toHaveCSS('opacity', '1')
  await rail.getByRole('link', { name: '跳转到 v1', exact: true }).click()
  await expect(currentOf(page)).toHaveAttribute('aria-label', '跳转到 v1')
  await expect(page.getByTestId('version-card').last()).toBeFocused()
  // Narrowing a desktop window must never activate either phone layout.
  for (const width of [1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(rail).toHaveCSS('width', '88px')
    await expect(rail).toHaveCSS('flex-direction', 'column')
    await expect(rail).toHaveCSS('position', 'fixed')
    await expect(rail).toHaveCSS('opacity', '1')
    await expect(rail.locator('.version-directory-label').first()).toBeHidden()
    expect((await rail.boundingBox())!.x).toBeGreaterThanOrEqual(0)
  }
})

test('phone overlay preserves card width and uses 10/20/100 percent opacity', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone overlay')
  await page.goto('/agents/103')
  const card = page.getByTestId('version-card').first()
  await card.scrollIntoViewIfNeeded()
  const rail = railOf(page)
  const directory = page.locator('.version-directory')
  await expect(directory).toHaveCSS('padding-left', '0px')
  const cardBox = (await card.boundingBox())!
  const directoryBox = (await directory.boundingBox())!
  expect(cardBox.x).toBe(directoryBox.x)
  expect(cardBox.width).toBe(directoryBox.width)
  await expect(rail).toHaveCSS('opacity', '0.1')
  // Hover/focus must not brighten the overlay to 100%.
  await rail.locator('a').first().hover()
  await expect(rail).toHaveCSS('opacity', '0.1')
  await page.mouse.move(page.viewportSize()!.width - 10, 40)
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  const before = await page.evaluate(() => scrollY)
  await swipeRail(page, true)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
  await expect(rail).toHaveCSS('opacity', '0.1')
  await swipeRail(page)
  // Switch straight from rail momentum to a gesture on the page.
  await swipeRail(page, true)
  await expect(rail).toHaveCSS('opacity', '0.1')
})
