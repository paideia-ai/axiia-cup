import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'
import { expect } from '@playwright/test'
const require = createRequire(import.meta.url)
const base = process.env.DEMO_URL ?? 'http://localhost:5199/demo.html'
const output = '/tmp/axiia-main-aligned-demo'
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const results = []
const surfaces = [
  ['/scenarios', 'D.scenario-card', 'catalog'],
  ['/tournaments', 'G.tournament-list', 'rankings'],
  ['/tournaments/1', 'G.standings-table', 'standings'],
  ['/matches', 'L.match-list', 'history'],
  ['/matches/145', 'FA.result-card', 'report'],
  ['/my-agents', 'MA.scenario-list', 'agents'],
  ['/agents/163', 'EA.page-title', 'agent-home'],
  ['/agents/163/build', 'E.prompt-input', 'builder'],
  ['/scenarios/shangyang-court', 'DA.side-actions', 'scenario'],
]
try {
  for (const width of [1440, 768, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: 'reduce',
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    const page = await context.newPage()
    const errors = [], network = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('request', (r) => {
      if (new URL(r.url()).pathname.startsWith('/v1')) network.push(r.url())
    })
    await page.route(
      /fonts.googleapis.com|api.fontshare.com/,
      (r) => r.fulfill({ body: '', contentType: 'text/css' }),
    )
    async function visit(route, marker, original = false) {
      await page.goto(`${base}${original ? '?style=original' : ''}#${route}`, {
        waitUntil: 'domcontentloaded',
      })
      await page.locator(`[data-tm='${marker}']`).first().waitFor()
      if (route.endsWith('/build')) {
        await expect(page.getByLabel('策略提示词', { exact: true }))
          .toBeEnabled()
      }
      await page.waitForTimeout(300)
    }
    const snapshot = () =>
      page.locator('main').evaluate((el) => ({
        text: el.textContent.replace(/\s+/g, ' ').trim(),
        elements: [...el.querySelectorAll('*')].map(
          (n) => [
            n.tagName,
            n.getAttribute('data-tm'),
            n.getAttribute('href'),
            n.getAttribute('aria-label'),
            n.getAttribute('role'),
          ],
        ),
      }))
    async function audit() {
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
      return page.evaluate(async () =>
        (await window.axe.run(document.querySelector('main'), {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        })).violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        }))
      )
    }
    for (const [route, marker, name] of surfaces) {
      await visit(route, marker)
      assert.ok(
        await page.evaluate(() =>
          document.documentElement.scrollWidth <= innerWidth
        ),
        `overflow ${name} ${width}`,
      )
      const polished = await snapshot()
      const violations = await audit()
      await page.screenshot({
        path: `${output}/${name}-${width}.png`,
        fullPage: true,
      })
      if (name === 'catalog') {
        const edges = await page.locator('[data-tm="D.scenario-card"] > div')
          .evaluateAll((nodes) =>
            nodes.map((n) => {
              const s = getComputedStyle(n)
              return [
                s.borderTopColor,
                s.borderBottomColor,
                s.borderTopWidth,
                s.borderBottomWidth,
              ]
            })
          )
        for (const e of edges) {
          assert.equal(e[0], e[1])
          assert.equal(e[2], e[3])
        }
      }
      await visit(route, marker, true)
      assert.deepEqual(
        await snapshot(),
        polished,
        `main content parity ${name} ${width}`,
      )
      const baselineViolations = await audit()
      const baseline = new Set(baselineViolations.map((v) => v.id))
      assert.ok(
        violations.every((v) => baseline.has(v.id)),
        `new a11y category ${name}`,
      )
      results.push({ width, name, violations, baselineViolations })
    }
    await visit('/agents/163', 'EA.page-title')
    await expect(
      page.getByRole('button', { name: '智能体更多操作', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: '新建版本', exact: true }).click()
    const editor = page.getByLabel('策略提示词', { exact: true })
    await expect(editor).toBeEnabled()
    await expect(
      page.getByRole('button', { name: '选择预设策略', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: '让你的AI帮你想策略', exact: true })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await editor.fill('先确认事实，再逐项回应。不要把推测说成证据。')
    await page.getByRole('button', { name: '保存并返回主页', exact: true })
      .click()
    await expect(page.locator('[data-tm="EA.page-title"]')).toBeVisible()
    await expect(page.getByText('版本（3）', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /将 v3 设为商鞅参赛版本/ }).click()
    await expect(page.getByRole('button', { name: /将 v3 设为商鞅参赛版本/ }))
      .toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: '新建商鞅智能体', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('名称（可选）').fill('克制示例')
    await dialog.getByRole('button', { name: '创建智能体', exact: true })
      .click()
    await expect(page.locator('[data-tm="EA.page-title"]')).toContainText(
      '克制示例',
    )
    await visit('/matches/145', 'FA.result-card')
    await page.getByRole('button', { name: '回放', exact: true }).click()
    await expect(page.getByRole('heading', { name: '对话重演', exact: true }))
      .toBeVisible()
    await expect(page.getByRole('heading', { name: '结果', exact: true }))
      .toHaveCount(0)
    assert.deepEqual(errors, [])
    assert.deepEqual(network, [])
    console.log(
      `PASS ${width}: main parity, neutral card edges, save/entry/create and replay`,
    )
    await context.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
  console.log(`PASS ${results.length} page-size comparisons`)
} finally {
  await browser.close()
}
