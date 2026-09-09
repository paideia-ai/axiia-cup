import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const output = process.env.DEMO_SCREENSHOTS ?? '/tmp/axiia-agent-visual-polish'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 768, 390]) {
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
    await page.getByRole('heading', { name: '我的智能体', exact: true })
      .waitFor()
    assert.equal(await page.getByTestId('agent-row').count(), 21)
    for (const name of ['查看智能体', '进入构建', '重命名', '删除']) {
      assert.equal(
        await page.locator('main').getByRole('button', { name, exact: true })
          .count(),
        0,
      )
    }
    assert.equal(await page.locator('main button').count(), 10)
    await page.screenshot({
      path: `${output}/list-${width}.png`,
      fullPage: true,
    })
    const firstRow = page.getByTestId('agent-row').filter({
      hasText: '商鞅 #163',
    })
    await firstRow.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: '新建版本', exact: true })
      .waitFor()
    const agentNav = page.getByRole('navigation', {
      name: '同角色智能体',
      exact: true,
    })
    assert.equal(await agentNav.getByRole('link').count(), 1)
    assert.equal(
      await agentNav.getByRole('link').getAttribute('aria-current'),
      'page',
    )
    await agentNav.getByRole('button', { name: '新建商鞅智能体', exact: true })
      .waitFor()
    await page.screenshot({
      path: `${output}/home-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: '新建版本', exact: true }).click()
    const editor = page.getByLabel('策略提示词', { exact: true })
    assert.equal(await editor.inputValue(), '')
    assert.equal(await page.getByTestId('version-card').count(), 0)
    assert.equal(
      await page.getByRole('button', { name: '保存并返回主页' }).isDisabled(),
      true,
    )
    await page.screenshot({
      path: `${output}/builder-${width}.png`,
      fullPage: true,
    })
    await editor.fill('保留我的原始策略。')
    await page.reload()
    await editor.waitFor()
    assert.equal(await editor.inputValue(), '保留我的原始策略。')
    assert.equal(
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .count(),
      1,
    )
    await page.getByRole('button', { name: '保存并返回主页', exact: true })
      .click()
    await page.getByRole('button', { name: '新建版本', exact: true })
      .waitFor()
    assert.equal(await page.getByTestId('version-card').count(), 3)
    const entryCard = page.getByTestId('version-card').filter({
      has: page.getByRole('button', { pressed: true }),
    })
    assert.equal(await entryCard.count(), 0)
    await page.getByText('列表已标此智能体参赛，具体版本号未提供。', {
      exact: true,
    }).waitFor()
    await page.getByRole('button', { name: '版本对比', exact: true })
      .click()
    await page.getByTestId('version-comparison').waitFor()
    await page.getByRole('button', {
      name: '将 v3 设为商鞅参赛版本',
      exact: true,
    }).click()
    assert.match(await entryCard.innerText(), /v3/)
    await page.getByRole('status').filter({ hasText: '已设置用此版本参赛' })
      .waitFor()
    assert.equal(
      await page.getByTestId('version-card').getByRole('button', {
        pressed: true,
      }).count(),
      1,
    )
    assert.equal(
      await page.getByRole('button', { name: '展开 v3 全文', exact: true })
        .count(),
      0,
    )
    const expand = page.getByRole('button', {
      name: '展开 v2 全文',
      exact: true,
    })
    assert.equal(await expand.innerText(), '')
    await expand.click()
    const collapse = page.getByRole('button', {
      name: '收起 v2 全文',
      exact: true,
    })
    assert.equal(await collapse.innerText(), '')
    assert.equal(await collapse.getAttribute('aria-expanded'), 'true')
    await collapse.click()
    assert.equal(
      await page.getByRole('button', {
        name: '将 v3 设为商鞅参赛版本',
        exact: true,
      }).innerText(),
      '',
    )
    await page.screenshot({
      path: `${output}/home-icons-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: '用 v3 出战', exact: true }).click()
    await page.getByRole('button', { name: '确认出战配置', exact: true })
      .click()
    await page.getByRole('heading', { name: '出战配置已确认', exact: true })
      .waitFor()
    await page.getByRole('button', { name: '返回智能体主页', exact: true })
      .click()
    const copy = page.getByRole('button', {
      name: '复制 v3 提示词',
      exact: true,
    })
    assert.equal(await copy.innerText(), '')
    const beforeCopy = await page.evaluate(() =>
      localStorage.getItem('axiia-agent-ux-kesou-20260909-v1')
    )
    await copy.click()
    await page.getByRole('button', { name: '复制 v3 提示词', exact: true }).and(
      page.locator('[title="已复制"]'),
    ).waitFor()
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      '保留我的原始策略。',
    )
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem('axiia-agent-ux-kesou-20260909-v1')
      ),
      beforeCopy,
    )
    assert.equal(
      await page.getByRole('button', { name: '基于 v3 迭代', exact: true })
        .count(),
      0,
    )
    assert.equal(
      await page.getByRole('heading', { name: '智能体管理', exact: true })
        .count(),
      0,
    )
    const more = page.getByRole('button', {
      name: '智能体更多操作',
      exact: true,
    })
    await more.click()
    const rename = page.getByRole('menuitem', { name: '重命名', exact: true })
    await rename.waitFor()
    assert.equal(
      await page.getByRole('menuitem', { name: '删除智能体', exact: true })
        .getAttribute('aria-disabled'),
      'true',
    )
    await page.getByText('已有版本，无法删除', { exact: true }).waitFor()
    await page.screenshot({
      path: `${output}/agent-menu-${width}.png`,
      fullPage: true,
    })
    await page.keyboard.press('Escape')
    assert.equal(await more.getAttribute('aria-expanded'), 'false')
    await more.press('ArrowDown')
    await rename.waitFor()
    await page.keyboard.press('Enter')
    const nameInput = page.getByRole('textbox', {
      name: '智能体名称',
      exact: true,
    })
    await nameInput.waitFor()
    assert.equal(
      await nameInput.evaluate((node) => node === document.activeElement),
      true,
    )
    await nameInput.fill('取消测试')
    await nameInput.press('Escape')
    await page.getByRole('heading', { name: '商鞅 #163', exact: true })
      .waitFor()
    await more.click()
    await rename.click()
    await nameInput.fill('验收策略')
    await page.screenshot({
      path: `${output}/agent-rename-${width}.png`,
      fullPage: true,
    })
    await nameInput.press('Enter')
    await page.getByRole('heading', { name: '商鞅「验收策略」', exact: true })
      .waitFor()
    await agentNav.getByRole('button', { name: '新建商鞅智能体', exact: true })
      .click()
    await page.getByLabel('智能体名称（可选）').fill('空白测试')
    await page.getByRole('button', { name: '创建智能体', exact: true }).click()
    await page.getByRole('heading', { name: '商鞅「空白测试」', exact: true })
      .waitFor()
    assert.equal(await agentNav.getByRole('link').count(), 2)
    await agentNav.getByRole('link', { name: '商鞅「验收策略」', exact: true })
      .click()
    await page.getByRole('heading', { name: '商鞅「验收策略」', exact: true })
      .waitFor()
    await agentNav.getByRole('link', { name: '商鞅「空白测试」', exact: true })
      .click()
    await page.getByRole('heading', { name: '商鞅「空白测试」', exact: true })
      .waitFor()
    await page.screenshot({
      path: `${output}/agent-switcher-${width}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: '智能体更多操作', exact: true })
      .click()
    await page.getByRole('menuitem', { name: '删除智能体', exact: true })
      .click()
    await page.getByRole('dialog').waitFor()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('heading', { name: '商鞅「空白测试」', exact: true })
      .waitFor()
    await page.getByRole('button', { name: '智能体更多操作', exact: true })
      .click()
    await page.getByRole('menuitem', { name: '删除智能体', exact: true })
      .click()
    await page.getByRole('button', { name: '确认删除', exact: true }).click()
    await page.getByRole('heading', { name: '商鞅「验收策略」', exact: true })
      .waitFor()
    await page.getByRole('link', { name: '← 我的智能体', exact: true }).click()
    await page.getByRole('heading', { name: '我的智能体', exact: true })
      .waitFor()
    assert.equal(await page.getByTestId('agent-row').count(), 21)
    await page.evaluate(() => {
      const key = 'axiia-agent-ux-kesou-20260909-v1'
      const agents = JSON.parse(localStorage.getItem(key))
      const opposite = agents.find((agent) => agent.id === 205)
      opposite.versions = []
      opposite.entrySelectionUnknown = false
      localStorage.setItem(key, JSON.stringify(agents))
    })
    await page.reload()
    await page.getByRole('button', { name: '新建林智能体', exact: true })
      .click()
    assert.equal(
      await page.getByRole('button', { name: '创建智能体', exact: true })
        .isDisabled(),
      true,
    )
    await page.getByRole('button', { name: '去完善对侧智能体', exact: true })
      .click()
    await page.getByRole('heading', { name: '苏 #205', exact: true })
      .waitFor()
    await page.getByRole('link', { name: '← 我的智能体', exact: true }).click()
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.deepEqual(errors, [])
    assert.deepEqual(apiRequests, [])
    console.log(
      `PASS ${width}px: navigation, empty builder, draft persistence, version dialogs, save, rename, create/delete, no API calls`,
    )
    await context.close()
  }
} finally {
  await browser.close()
}
