import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { shangyangCourtDecks } from '../../src/scenarios/decks/shangyang-court.ts'
import { assembleDeck } from '../../src/lib/deck.ts'

const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const output = process.env.DEMO_SCREENSHOTS ?? '/tmp/axiia-agent-visual-polish'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    const page = await context.newPage()
    const errors = []
    const apiRequests = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/v1')) {
        apiRequests.push(request.url())
      }
    })
    await page.goto(`${base}#/my-agents`)
    async function create(role) {
      await page.goto(`${base}#/my-agents`)
      await page.getByRole('button', { name: `新建${role}智能体`, exact: true })
        .click()
      await page.getByRole('button', { name: '创建智能体', exact: true })
        .click()
      await page.getByRole('button', { name: '新建版本', exact: true })
        .click()
      assert.equal(
        await page.getByLabel('策略提示词', { exact: true }).inputValue(),
        '',
      )
    }
    const editor = page.getByLabel('策略提示词', { exact: true })
    await create('商鞅')
    await page.screenshot({
      path: `${output}/initialization-builder-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: '选择预设策略', exact: true })
      .click()
    const modal = page.getByRole('dialog')
    const fill = modal.getByRole('button', { name: '填入工作区', exact: true })
    assert.equal(await fill.isDisabled(), true)
    assert.equal(await modal.getByRole('button', { pressed: true }).count(), 0)
    for (let index = 0; index < 20; index++) {
      await page.keyboard.press('Tab')
      assert.equal(
        await page.evaluate(() => !!document.activeElement?.closest('dialog')),
        true,
      )
    }
    await page.keyboard.press('Escape')
    assert.equal(
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .evaluate((node) => node === document.activeElement),
      true,
    )
    await page.getByRole('button', { name: '选择预设策略', exact: true })
      .click()
    const deck = shangyangCourtDecks.decks.a
    const selections = {}
    for (const [index, question] of deck.questions.entries()) {
      const option = question.options[index % question.options.length]
      await modal.getByRole('button', { name: option.label, exact: true })
        .click()
      selections[question.id] = option.id
      assert.equal(
        await page.getByTestId('mcq-preview').innerText(),
        assembleDeck(deck, selections),
      )
    }
    assert.equal(await fill.isDisabled(), false)
    await page.screenshot({
      path: `${output}/mcq-${width}.png`,
      fullPage: true,
    })
    await fill.click()
    const assembled = assembleDeck(deck, selections)
    assert.equal(await editor.inputValue(), assembled)
    assert.equal(
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .count(),
      1,
    )
    await page.reload()
    assert.equal(await editor.inputValue(), assembled)
    await page.getByRole('button', { name: '保存并返回主页', exact: true })
      .click()
    await page.getByRole('button', { name: '新建版本', exact: true })
      .waitFor()
    assert.match(await page.getByTestId('version-card').innerText(), /你的身份/)
    let saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1'))
    )
    assert.equal(
      saved.find((agent) => agent.id === 237).versions[0].method,
      'mcq',
    )
    await page.getByRole('button', { name: '新建版本', exact: true }).click()
    await page.getByText('不知道怎么指挥智能体？', { exact: true }).waitFor()
    await page.getByRole('button', { name: '选择预设策略', exact: true })
      .click()
    for (const question of deck.questions) {
      await modal.getByRole('button', {
        name: question.options[1].label,
        exact: true,
      }).click()
    }
    const replacement = await page.getByTestId('mcq-preview').innerText()
    await fill.click()
    await modal.getByText('主输入框已有策略，是否用这份预设策略替换？', {
      exact: true,
    }).waitFor()
    await modal.getByRole('button', { name: '取消', exact: true }).click()
    await page.keyboard.press('Escape')
    assert.equal(await editor.inputValue(), assembled)
    await page.getByRole('button', { name: '选择预设策略', exact: true })
      .click()
    for (const question of deck.questions) {
      await modal.getByRole('button', {
        name: question.options[1].label,
        exact: true,
      }).click()
    }
    await fill.click()
    await modal.getByRole('button', { name: '替换当前草稿', exact: true })
      .click()
    assert.equal(await editor.inputValue(), replacement)
    const versionsAfterReplace = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1')).find(
        (
          agent,
        ) => agent.id === 237,
      ).versions
    )
    assert.equal(versionsAfterReplace.length, 1)
    assert.equal(versionsAfterReplace[0].prompt, assembled)
    await editor.fill('')
    assert.equal(
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .count(),
      1,
    )
    await create('甘龙')
    await page.getByRole('button', { name: '选择预设策略', exact: true })
      .click()
    const oppositeDeck = shangyangCourtDecks.decks.b
    await modal.getByRole('group', {
      name: new RegExp(oppositeDeck.questions[0].prompt),
    }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '让你的AI帮你想策略', exact: true })
      .click()
    const source = await page.getByLabel('元提示词内容', { exact: true })
      .innerText()
    assert.match(source, /「商鞅变法·朝堂辩法」中的「甘龙」/)
    for (
      const text of [
        '场景一句话：',
        '我方胜利条件：',
        '计分规则：',
        '角色模板如下',
        '只输出策略提示词正文',
      ]
    ) assert.ok(source.includes(text))
    assert.equal(await modal.locator('input, textarea').count(), 0)
    await modal.getByText(/DeepSeek/).waitFor()
    await modal.getByRole('button', { name: '复制元提示词', exact: true })
      .click()
    await modal.getByRole('button', { name: '已复制', exact: true }).waitFor()
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      source,
    )
    await page.screenshot({
      path: `${output}/meta-${width}.png`,
      fullPage: true,
    })
    await modal.getByRole('button', { name: '关闭弹窗', exact: true })
      .click()
    await editor.waitFor()
    assert.equal(await editor.inputValue(), '')
    const generated =
      '  从政令能否执行出发，逐项追问推行新法的代价。\n保持证据优先。  '
    await page.evaluate(
      (text) => navigator.clipboard.writeText(text),
      generated,
    )
    await editor.press('Control+V')
    await page.waitForFunction(
      (text) => document.getElementById('strategy')?.value === text,
      generated,
    )
    assert.equal(await editor.inputValue(), generated)
    assert.ok(!(await editor.inputValue()).includes('请为「'))
    await page.getByRole('button', { name: '保存并返回主页', exact: true })
      .click()
    await page.getByRole('button', { name: '新建版本', exact: true })
      .waitFor()
    saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1'))
    )
    assert.equal(
      saved.find((agent) => agent.id === 238).versions[0].method,
      'raw',
    )
    await page.goto(`${base}#/agents/205/build`)
    await editor.waitFor()
    assert.equal(
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .count(),
      1,
    )
    assert.equal(
      await page.getByRole('button', {
        name: '让你的AI帮你想策略',
        exact: true,
      }).count(),
      1,
    )
    await page.getByRole('button', { name: '选择预设策略', exact: true })
      .click()
    await modal.getByText(/这个角色暂时没有预设策略/).waitFor()
    await modal.getByRole('button', { name: '让你的AI帮你想策略', exact: true })
      .click()
    assert.match(
      await page.getByLabel('元提示词内容', { exact: true }).innerText(),
      /我方胜利条件/,
    )
    await page.keyboard.press('Escape')
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.deepEqual(errors, [])
    assert.deepEqual(apiRequests, [])
    console.log(
      `PASS ${width}px: original side-specific decks and assembly, persistent tools, replacement protection, clipboard round-trip, saved source method, no API calls`,
    )
    await context.close()
  }
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`${base}#/my-agents`)
  await page.getByRole('button', { name: '新建商鞅智能体', exact: true })
    .click()
  await page.getByRole('button', { name: '创建智能体', exact: true }).click()
  await page.getByRole('button', { name: '新建版本', exact: true }).click()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    })
  })
  await page.getByRole('button', { name: '让你的AI帮你想策略', exact: true })
    .click()
  await page.getByRole('button', { name: '复制元提示词', exact: true }).click()
  await page.getByText('无法自动复制，请手动选择上方元提示词并复制。', {
    exact: true,
  }).waitFor()
  assert.ok(
    (await page.getByLabel('元提示词内容', { exact: true }).innerText())
      .length > 0,
  )
  console.log(
    'PASS clipboard failure: selectable source retained and manual copy guidance shown',
  )
  await context.close()
} finally {
  await browser.close()
}
