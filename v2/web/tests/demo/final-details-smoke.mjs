import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}#/agents/211/build`)
    const editor = page.getByLabel('策略提示词', { exact: true })
    const save = page.getByRole('button', {
      name: '保存并返回主页',
      exact: true,
    })
    await editor.fill('策'.repeat(1001))
    assert.equal(await save.isDisabled(), true)
    await page.getByRole('alert').filter({ hasText: '已超出 1 个单位' })
      .waitFor()
    await page.reload()
    assert.equal((await editor.inputValue()).length, 1001)
    assert.equal(await save.isDisabled(), true)
    await save.evaluate((el) => el.click())
    assert.ok(page.url().endsWith('/build'))
    const model = page.getByRole('combobox', { name: '模型', exact: true })
    const role = page.getByRole('combobox', { name: '出场角色', exact: true })
    const m = await model.boundingBox(),
      r = await role.boundingBox(),
      s = await save.boundingBox()
    if (width === 390) {
      assert.equal(m.width, r.width)
      assert.equal(m.width, 358)
      assert.ok(r.y > m.y)
    } else {
      assert.equal(m.y, r.y)
      assert.equal(m.y, s.y)
    }
    await save.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/final-settings-${width}.png`,
    })
    await editor.fill('策'.repeat(1000))
    assert.equal(await save.isEnabled(), true)
    await save.click()
    await page.waitForURL((url) => url.hash.startsWith('#/agents/211?'))
    const record = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1')).find(
        (a) => a.id === 211,
      )
    )
    assert.equal(record.versions.length, 1)
    assert.equal(record.versions[0].prompt.length, 1000)

    await page.goto(`${base}#/agents/163`)
    await page.getByRole('button', { name: '展开 v2 全文', exact: true })
      .waitFor()
    assert.equal(
      await page.getByRole('button', { name: '展开 v1 全文', exact: true })
        .count(),
      0,
    )
    const bounds = async (name) =>
      page.getByRole('button', { name, exact: true }).boundingBox()
    const copy1 = await bounds('复制 v1 提示词'),
      copy2 = await bounds('复制 v2 提示词')
    const field1 = await bounds('用 v1 出战'),
      field2 = await bounds('用 v2 出战')
    const expand = await bounds('展开 v2 全文')
    assert.equal(copy1.x, copy2.x)
    assert.equal(field1.x, field2.x)
    assert.ok(expand.x > field2.x + field2.width)
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/fixed-version-actions-${width}.png`,
    })
    await page.getByRole('button', { name: '展开 v2 全文', exact: true })
      .click()
    await page.getByRole('button', { name: '收起 v2 全文', exact: true })
      .click()

    async function remove() {
      await page.getByRole('button', { name: '智能体更多操作', exact: true })
        .click()
      await page.getByRole('menuitem', { name: '删除智能体', exact: true })
        .click()
      await page.getByRole('button', { name: '确认删除', exact: true }).click()
    }
    await page.goto(`${base}#/agents/236`)
    await page.getByText('还没有保存过版本', { exact: true }).waitFor()
    assert.equal(
      await page.getByText('写下策略并保存，这里就会长出 v1。', { exact: true })
        .count(),
      0,
    )
    await remove()
    await page.waitForURL((url) => url.hash === '#/agents/235')
    await page.getByRole('heading', { name: '董卓 #235', exact: true })
      .waitFor()

    await page.evaluate(() => {
      const key = 'axiia-agent-ux-kesou-20260909-v1'
      const data = JSON.parse(localStorage.getItem(key)).filter((a) =>
        !(a.scenario === 'shangyang-court' && a.side === 0)
      )
      for (const id of [300, 301]) {
        data.push({
          id,
          scenario: 'shangyang-court',
          side: 0,
          name: '',
          draft: '',
          versions: [],
        })
      }
      localStorage.setItem(key, JSON.stringify(data))
    })
    await page.goto(`${base}#/agents/300`)
    await page.reload()
    await remove()
    await page.waitForURL((url) => url.hash === '#/agents/301')
    await remove()
    await page.waitForURL((url) =>
      url.hash === '#/agents/empty/shangyang-court/0'
    )
    await page.getByText('还没有商鞅智能体', { exact: true }).waitFor()
    await page.reload()
    await page.getByRole('heading', { name: '商鞅', exact: true }).waitFor()
    await page.screenshot({
      path: `/tmp/axiia-agent-visual-polish/empty-role-home-${width}.png`,
    })
    await page.getByRole('button', { name: '新建商鞅智能体', exact: true })
      .click()
    await page.getByLabel('智能体名称（可选）').fill('重新开始')
    await page.getByRole('button', { name: '创建智能体', exact: true }).click()
    await page.getByRole('heading', { name: '商鞅「重新开始」', exact: true })
      .waitFor()
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    assert.deepEqual(errors, [])
    console.log(
      `PASS ${width}px: 1000/1001 boundary with draft preservation, aligned settings/actions, empty copy removal, sibling deletion, last-agent empty home and recreation`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
