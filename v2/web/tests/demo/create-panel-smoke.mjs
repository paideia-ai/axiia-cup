import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${base}#/agents/163`)
    const trigger = page.getByRole('button', {
      name: '新建商鞅智能体',
      exact: true,
    })
    const button = await trigger.boundingBox()
    await trigger.click()
    const dialog = page.getByRole('dialog', {
      name: '新建商鞅智能体',
      exact: true,
    })
    await dialog.waitFor()
    const input = page.getByLabel('智能体名称（可选）', { exact: true })
    await page.waitForFunction(() =>
      document.activeElement?.tagName === 'INPUT'
    )
    assert.equal(
      await dialog.getByRole('button', { name: '取消', exact: true }).count(),
      0,
    )
    assert.equal(
      await dialog.getByText('商鞅变法·朝堂辩法', { exact: true }).count(),
      0,
    )
    assert.equal(await dialog.locator('input').count(), 1)
    assert.equal(
      await dialog.getByRole('button', { name: '创建智能体', exact: true })
        .innerText(),
      '创建',
    )
    const panel = await dialog.boundingBox()
    if (width === 390) {
      assert.equal(panel.x, 0)
      assert.equal(panel.width, 390)
      assert.ok(Math.abs(panel.y + panel.height - 900) < 2)
    } else {
      assert.equal(panel.width, 320)
      assert.ok(Math.abs(panel.y - (button.y + button.height + 8)) < 2)
    }
    await input.fill('谨慎推进')
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/create-panel-${width}.png`,
    })
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
    )
    await trigger.click()
    assert.equal(await input.inputValue(), '')
    if (width === 1440) {
      await page.locator('h1')
        .click()
      await dialog.waitFor({ state: 'hidden' })
      await trigger.click()
    }
    await input.fill('谨慎推进')
    if (width === 390) {
      await page.setViewportSize({ width: 390, height: 540 })
      const submit = dialog.getByRole('button', {
        name: '创建智能体',
        exact: true,
      })
      await submit.waitFor()
      const box = await submit.boundingBox()
      assert.ok(box.y >= 0 && box.y + box.height <= 540)
    }
    await input.press('Enter')
    await page.getByRole('heading', { name: '商鞅「谨慎推进」', exact: true })
      .waitFor()
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('button', { name: '新建商鞅智能体', exact: true })
      .click()
    await input.press('Enter')
    await page.waitForURL((url) => url.hash === '#/agents/238')
    await page.getByRole('heading', { name: '商鞅 #238', exact: true })
      .waitFor()
    await page.getByRole('button', { name: '新建商鞅智能体', exact: true })
      .click()
    await page.getByRole('button', { name: '关闭弹窗', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.deepEqual(errors, [])
    console.log(
      `PASS ${width}px: anchored/sheet layout, autofocus, Escape/X/outside dismissal, name optional, Enter creation, short viewport`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
