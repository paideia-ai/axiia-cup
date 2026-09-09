import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 960 } })
    await page.goto(`${base}#/my-agents`)
    await page.getByTestId('agent-row').first().waitFor()
    assert.equal(await page.getByTestId('agent-row').count(), 21)
    assert.equal(
      await page.getByTitle('当前参赛智能体', { exact: true }).count(),
      10,
    )
    assert.equal(
      await page.getByText('✓ 参赛资格已就绪', { exact: true }).count(),
      5,
    )
    const records = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1'))
    )
    for (
      const [scenario, agents, versions] of [
        ['fengyiting-real', 9, 7],
        ['honnoji-decision', 4, 4],
        ['legal-harbor-murder-jury', 2, 3],
        ['shangyang-court', 2, 3],
        ['trolley-problem', 4, 5],
      ]
    ) {
      const group = records.filter((agent) => agent.scenario === scenario)
      assert.equal(group.length, agents)
      assert.equal(
        group.reduce((sum, agent) => sum + agent.versions.length, 0),
        versions,
      )
    }
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/kesou-list-${width}.png`,
      fullPage: true,
    })
    await page.getByTestId('agent-row').filter({ hasText: '董卓「123」' })
      .click()
    await page.getByRole('heading', { name: '董卓「123」', exact: true })
      .waitFor()
    assert.equal(await page.getByTestId('version-card').count(), 2)
    assert.equal(
      await page.getByTestId('version-card').getByRole('button', {
        pressed: true,
      }).count(),
      0,
    )
    assert.equal(
      await page.getByRole('button', { name: '复制 v1 提示词', exact: true })
        .isDisabled(),
      false,
    )
    assert.equal(await page.getByTestId('version-comparison').count(), 0)
    await page.getByRole('button', { name: '版本对比', exact: true }).click()
    const sourcePrompts = await page.getByTestId('version-comparison').locator(
      'pre',
    ).allTextContents()
    assert.equal(sourcePrompts.length, 2)
    assert.ok(
      sourcePrompts.every((prompt) =>
        prompt.length > 0 && !prompt.includes('未提供')
      ),
    )
    assert.notEqual(sourcePrompts[0], sourcePrompts[1])
    await page.getByRole('link', { name: '董卓 #236', exact: true }).click()
    await page.getByRole('heading', { name: '董卓 #236', exact: true })
      .waitFor()
    assert.equal(
      await page.getByRole('heading', { name: '版本对比', exact: true })
        .count(),
      0,
    )
    for (
      const text of [
        '先听对方说明，再提出条件。',
        '先确认利益，再提出具体条件。',
        '把条件分成两步，先交换承诺，再核对行动。',
      ]
    ) {
      await page.getByRole('button', { name: '新建版本', exact: true }).click()
      await page.getByLabel('策略提示词', { exact: true }).fill(text)
      await page.getByRole('button', { name: '保存并返回主页', exact: true })
        .click()
      await page.getByRole('button', { name: '新建版本', exact: true })
        .waitFor()
    }
    await page.getByRole('combobox', { name: '基准版本', exact: true }).click()
    await page.getByRole('option', { name: /v1/ }).click()
    const comparison = page.getByTestId('version-comparison')
    assert.deepEqual(await comparison.locator('pre').allTextContents(), [
      '先听对方说明，再提出条件。',
      '把条件分成两步，先交换承诺，再核对行动。',
    ])
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/version-compare-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('combobox', { name: '对比版本', exact: true }).click()
    await page.getByRole('option', { name: /^v2/ }).waitFor()
    assert.equal(await page.getByRole('option', { name: /^v1/ }).count(), 0)
    await page.keyboard.press('Escape')
    await page.getByRole('option', { name: /^v2/ }).waitFor({ state: 'hidden' })
    assert.ok(await comparison.locator('del').count() > 0)
    assert.ok(await comparison.locator('ins').count() > 0)
    await page.getByRole('button', { name: '版本对比', exact: true }).click()
    assert.equal(await comparison.count(), 0)
    await page.getByRole('button', {
      name: '将 v2 设为董卓参赛版本',
      exact: true,
    }).click()
    await page.getByRole('link', { name: '← 我的智能体', exact: true }).click()
    await page.getByTestId('agent-row').first().waitFor()
    assert.equal(
      await page.getByTestId('agent-row').filter({ hasText: '董卓 #236' })
        .getAttribute('title'),
      '当前参赛智能体',
    )
    assert.equal(
      await page.getByTestId('agent-row').filter({ hasText: '董卓「123」' })
        .getAttribute('title'),
      null,
    )
    assert.equal(
      await page.getByTitle('当前参赛智能体', { exact: true }).count(),
      10,
    )
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    console.log(
      `PASS ${width}px: pasted inventory counts, example strategy text, arbitrary pair comparison, automatic highlighted comparison, same-version exclusion, entry transfer`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
