import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 960 } })
    await page.goto(`${base}#/agents/211/build`)
    const note = page.getByRole('button', { name: '版本备注', exact: true })
    await note.scrollIntoViewIfNeeded()
    const originalY = await note.evaluate((el) =>
      el.getBoundingClientRect().top + scrollY
    )
    await note.click()
    const input = page.getByLabel('版本备注（可选）', { exact: true })
    await input.waitFor()
    assert.equal(
      await input.evaluate((el) => el === document.activeElement),
      true,
    )
    await input.fill('先明确利益，再提出条件')
    const popup = page.getByRole('dialog', { name: '版本备注', exact: true })
    const rect = await popup.boundingBox()
    assert.ok(rect.x >= 0 && rect.x + rect.width <= width)
    assert.equal(
      await note.evaluate((el) => el.getBoundingClientRect().top + scrollY),
      originalY,
    )
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/note-popover-${width}.png`,
    })
    await page.keyboard.press('Escape')
    await popup.waitFor({ state: 'hidden' })
    assert.equal(
      await note.evaluate((el) => el === document.activeElement),
      true,
    )
    assert.match(await note.getAttribute('title'), /先明确利益/)
    await note.click()
    assert.equal(await input.inputValue(), '先明确利益，再提出条件')
    await page.getByRole('button', { name: '关闭备注' }).click()
    await popup.waitFor({ state: 'hidden' })
    await note.click()
    await input.fill('')
    await page.getByLabel('策略提示词', { exact: true }).click()
    await popup.waitFor({ state: 'hidden' })
    assert.equal(await note.getAttribute('title'), '版本备注（可选）')

    await page.evaluate(() => {
      const key = 'axiia-agent-ux-kesou-20260909-v1'
      const data = JSON.parse(localStorage.getItem(key))
      const agent = data.find((agent) => agent.id === 236)
      const sample = data.flatMap((agent) => agent.versions)[0]
      agent.versions = [
        {
          ...sample,
          id: 1001,
          ordinal: 1,
          detailsMissing: false,
          modelID: 'kimi-k2.6',
          note: '先谈利益',
          prompt: '先谈利益，再提条件。',
        },
        {
          ...sample,
          id: 1002,
          ordinal: 2,
          detailsMissing: false,
          modelID: 'deepseek-v4-flash',
          note: '补充风险',
          prompt: '先谈风险，再提条件。',
        },
        {
          ...sample,
          id: 1003,
          ordinal: 3,
          detailsMissing: false,
          modelID: 'deepseek-v4-flash',
          note: '保持策略，调整模型',
          prompt: '先谈风险，再提条件。',
        },
      ]
      localStorage.setItem(key, JSON.stringify(data))
    })
    await page.goto(`${base}#/agents/236`)
    await page.reload()
    const compare = page.getByRole('region', { name: '版本对比', exact: true })
    const toggle = compare.getByRole('button', {
      name: '版本对比',
      exact: true,
    })
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(
      await compare.getByRole('combobox', { name: '基准版本' }).innerText(),
      'v2',
    )
    assert.equal(
      await compare.getByRole('combobox', { name: '对比版本' }).innerText(),
      'v3',
    )
    await toggle.click()
    await compare.getByText('两版策略正文相同。', { exact: true }).waitFor()
    assert.equal(await compare.locator('ins, del').count(), 0)
    await compare.getByRole('combobox', { name: '基准版本' }).click()
    await page.getByRole('option', { name: /v1.*先谈利益/ }).waitFor()
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/version-picker-${width}.png`,
    })
    await page.getByRole('option', { name: /v1.*先谈利益/ }).click()
    assert.equal(await compare.locator('del').innerText(), '利益')
    assert.equal(await compare.locator('ins').innerText(), '风险')
    await compare.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/compact-compare-${width}.png`,
    })
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.equal(
      await compare.getByRole('button', { name: '对比', exact: true }).count(),
      0,
    )
    console.log(
      `PASS ${width}px: note focus/dismiss/persistence/layout, compact defaults, labels, automatic exact highlights, identical prompts`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
