import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}#/agents/211/build`)
    const copy = page.getByRole('button', { name: '复制当前草稿', exact: true })
    assert.equal(await copy.isDisabled(), true)
    const model = page.getByRole('combobox', { name: '模型', exact: true })
    await model.click()
    await page.getByRole('option', { name: 'Kimi K2.6', exact: true }).click()
    const role = page.getByRole('combobox', { name: '出场角色', exact: true })
    await role.click()
    assert.equal(
      await page.getByRole('option', { name: '细川藤孝', exact: true }).count(),
      0,
    )
    await page.getByRole('option', { name: '足利义昭的使者', exact: true })
      .click()
    const editor = page.getByLabel('策略提示词', { exact: true })
    const draft = '  先说明名分，再讨论行动。\n让对方把代价说清楚。  '
    await editor.fill(draft)
    assert.equal(
      await page.getByLabel('版本备注（可选）', { exact: true }).count(),
      0,
    )
    await page.getByRole('button', { name: '版本备注', exact: true }).click()
    await page.getByLabel('版本备注（可选）', { exact: true }).fill(
      '强调行动代价',
    )
    await copy.click()
    await copy.and(page.locator('[title="已复制"]')).waitFor()
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      draft,
    )
    await page.reload()
    assert.equal(await editor.inputValue(), draft)
    assert.match(await model.innerText(), /Kimi K2.6/)
    assert.match(await role.innerText(), /足利义昭的使者/)
    await page.getByRole('button', { name: '版本备注', exact: true })
      .click()
    assert.equal(
      await page.getByLabel('版本备注（可选）', { exact: true }).inputValue(),
      '强调行动代价',
    )
    await page.getByRole('button', { name: '版本备注', exact: true })
      .click()
    await page.getByRole('button', { name: '角色系统提示词', exact: true })
      .click()
    const template = page.getByLabel('角色系统提示词内容', { exact: true })
    await template.waitFor()
    const originalTemplate = await page.evaluate(async () => {
      const { scenarioModule } = await import('/src/scenarios/index.ts')
      return scenarioModule('honnoji-decision').roleTemplates.a
    })
    assert.equal(await template.innerText(), originalTemplate)
    assert.equal(await editor.inputValue(), draft)
    await page.getByRole('button', { name: '让你的AI帮你想策略', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    assert.equal(await dialog.locator('textarea, input').count(), 0)
    assert.match(await dialog.innerText(), /DeepSeek、ChatGPT/)
    assert.notEqual(
      await dialog.getByLabel('元提示词内容', { exact: true }).innerText(),
      originalTemplate,
    )
    await page.keyboard.press('Escape')
    assert.equal(await editor.inputValue(), draft)
    await page.getByRole('button', { name: '角色系统提示词', exact: true })
      .click()
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/builder-settings-${width}.png`,
      fullPage: true,
    })
    const before = Math.floor(Date.now() / 1000)
    await page.getByRole('button', { name: '保存并返回主页', exact: true })
      .click()
    await page.getByTestId('version-card').waitFor()
    await page.getByText('备注：强调行动代价', { exact: true }).waitFor()
    await page.getByTestId('version-time').getByText('刚刚保存', {
      exact: true,
    }).waitFor()
    const readAgent = () =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1'))
          .find((agent) => agent.id === 211)
      )
    const first = (await readAgent()).versions[0]
    assert.equal(first.modelID, 'kimi-k2.6')
    assert.equal(JSON.parse(first.options).role, 'yoshiaki')
    assert.equal(first.note, '强调行动代价')
    assert.ok(
      first.createdAt >= before &&
        first.createdAt <= Math.floor(Date.now() / 1000),
    )
    await page.getByRole('button', { name: '新建版本', exact: true }).click()
    assert.match(await model.innerText(), /Kimi K2.6/)
    await page.getByRole('button', { name: '版本备注', exact: true }).click()
    assert.equal(
      await page.getByLabel('版本备注（可选）', { exact: true }).inputValue(),
      '',
    )
    await page.getByRole('button', { name: '关闭备注', exact: true }).click()
    await model.click()
    await page.getByRole('option', { name: 'GLM-5.3', exact: true }).click()
    await editor.fill('先说清筹码，要求一个明确的答复。')
    await page.getByRole('button', { name: '保存并返回主页', exact: true })
      .click()
    await page.getByRole('button', { name: '新建版本', exact: true }).waitFor()
    const saved = await readAgent()
    assert.deepEqual(saved.versions[0], first)
    assert.equal(saved.versions[1].modelID, 'glm-5.3')
    assert.equal(saved.versions[1].note, undefined)
    await page.evaluate(() => {
      const key = 'axiia-agent-ux-kesou-20260909-v1'
      const data = JSON.parse(localStorage.getItem(key))
      delete data.find((agent) => agent.id === 211).draftModelID
      localStorage.setItem(key, JSON.stringify(data))
    })
    await page.goto(`${base}#/agents/211/build`)
    await page.reload()
    assert.match(await model.innerText(), /GLM-5.3/)
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('denied')) },
      })
    )
    await copy.click()
    await page.getByText('无法自动复制，请在主输入框中选择文本并复制。', {
      exact: true,
    }).waitFor()
    assert.equal(await editor.inputValue(), '先说清筹码，要求一个明确的答复。')
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.deepEqual(errors, [])
    console.log(
      `PASS ${width}px: model inheritance, independent role, draft copy/persistence, notes/timestamps, immutable old versions, clipboard failure`,
    )
    await context.close()
  }
} finally {
  await browser.close()
}
