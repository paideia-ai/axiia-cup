import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}#/my-agents`)
    const rows = page.getByTestId('agent-row')
    await rows.first().waitFor()
    assert.equal(await rows.count(), 21)
    assert.equal(
      await page.getByText('相国之尊，朝廷、财货与甲兵尽在手中', {
        exact: true,
      }).count(),
      1,
    )
    assert.equal(
      await page.getByText('✓ 参赛资格已就绪', { exact: true }).count(),
      5,
    )
    assert.equal(
      await page.getByTitle('当前参赛智能体', { exact: true }).count(),
      10,
    )
    assert.ok((await rows.first().boundingBox()).height < 60)
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/polished-list-${width}.png`,
    })
    const last = rows.filter({ hasText: '武仁 #168' })
    await last.scrollIntoViewIfNeeded()
    await page.waitForTimeout(50)
    const inventoryY = await page.evaluate(() => scrollY)
    assert.ok(inventoryY > 500)
    await last.click()
    await page.waitForURL((url) => url.hash === '#/agents/168')
    await page.getByRole('link', { name: '← 我的智能体', exact: true }).click()
    await page.waitForURL((url) => url.hash === '#/my-agents')
    await page.waitForFunction((y) => Math.abs(scrollY - y) <= 2, inventoryY)
    await last.click()
    await page.waitForURL((url) => url.hash === '#/agents/168')
    await page.goBack()
    await page.waitForURL((url) => url.hash === '#/my-agents')
    await page.waitForFunction((y) => Math.abs(scrollY - y) <= 2, inventoryY)
    await page.goForward()
    await page.waitForURL((url) => url.hash === '#/agents/168')

    await page.goto(`${base}#/agents/-1`)
    const active = page.getByRole('navigation', { name: '同角色智能体' })
      .locator('[aria-current="page"]')
    await active.waitFor()
    await page.waitForFunction(() => {
      const active = document.querySelector(
        'nav[aria-label="同角色智能体"] [aria-current="page"]',
      )
      const item = active.getBoundingClientRect()
      const rail = active.parentElement.getBoundingClientRect()
      return item.left >= rail.left - 1 && item.right <= rail.right + 1
    })
    assert.equal(await page.evaluate(() => scrollY), 0)
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/polished-home-${width}.png`,
    })
    if (width === 390) {
      const sizes = await page.locator('button[aria-label]').evaluateAll(
        (buttons) =>
          buttons.filter((button) => button.getClientRects().length).map(
            (button) => ({
              name: button.getAttribute('aria-label'),
              width: button.getBoundingClientRect().width,
              height: button.getBoundingClientRect().height,
            }),
          ),
      )
      assert.deepEqual(
        sizes.filter((size) => size.width < 44 || size.height < 44),
        [],
      )
    }
    await page.getByRole('button', { name: '新建版本', exact: true }).click()
    await page.getByRole('heading', { name: '智能体构建器', exact: true })
      .waitFor()
    for (const name of ['选择预设策略', '让你的AI帮你想策略']) {
      const box = await page.getByRole('button', { name, exact: true })
        .boundingBox()
      assert.ok(box.y > 48 && box.y + box.height < 800)
      assert.ok(
        box.y <
          (await page.getByLabel('策略提示词', { exact: true }).boundingBox())
            .y,
      )
    }
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/polished-builder-${width}.png`,
    })
    await page.getByRole('button', { name: '让你的AI帮你想策略', exact: true })
      .click()
    await page.getByRole('dialog').waitFor()
    if (width === 390) {
      const close = await page.getByRole('button', { name: '关闭弹窗' })
        .boundingBox()
      assert.ok(close.width >= 44 && close.height >= 44)
    }
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '版本备注', exact: true }).click()
    await page.getByLabel('版本备注（可选）').fill('新布局备注')
    if (width === 390) {
      const close = await page.getByRole('button', { name: '关闭备注' })
        .boundingBox()
      assert.ok(close.width >= 44 && close.height >= 44)
    }
    await page.keyboard.press('Escape')
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.deepEqual(errors, [])
    console.log(
      `PASS ${width}px: compact inventory, restored list scroll via link/back, active agent visibility, above-editor help, mobile touch targets including portals`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
