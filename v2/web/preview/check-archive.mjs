import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const base = 'http://localhost:5217'
await page.goto(`${base}/agents/101`)
await page.getByRole('button', { name: '智能体更多操作' }).click()
await page.getByRole('menuitem', { name: '归档智能体' }).waitFor()
await page.screenshot({ path: 'preview/screenshots/01-archive-menu.png' })
await page.getByRole('menuitem', { name: '归档智能体' }).click()
await page.getByRole('heading', { name: '我的智能体' }).waitFor()
assert.equal(await page.getByRole('link', { name: /以民为本/ }).count(), 0)
await page.reload()
await page.getByRole('heading', { name: '我的智能体' }).waitFor()
await page.goto(`${base}/settings`)
await page.getByRole('link', { name: /已归档的智能体/ }).waitFor()
await page.screenshot({ path: 'preview/screenshots/02-settings.png' })
await page.getByRole('link', { name: /已归档的智能体/ }).click()
await page.getByRole('button', { name: '恢复 商鞅「以民为本」' }).waitFor()
await page.screenshot({ path: 'preview/screenshots/03-archived-list.png' })
await page.getByRole('button', { name: '恢复 商鞅「以民为本」' }).click()
await page.getByRole('link', { name: '查看智能体' }).click()
await page.getByRole('button', { name: '复制 v2 提示词' }).waitFor()
await page.goto(`${base}/agents/103`)
await page.getByRole('button', { name: '智能体更多操作' }).click()
await page.getByRole('menuitem', { name: '删除智能体' }).waitFor()
assert.equal(
  await page.getByRole('menuitem', { name: '归档智能体' }).count(),
  0,
)
await page.getByRole('menuitem', { name: '删除智能体' }).click()
await page.getByRole('button', { name: '取消', exact: true }).click()
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(`${base}/settings/archived-agents`)
await page.getByRole('button', { name: '恢复 商鞅「旧日草稿」' }).waitFor()
await page.screenshot({ path: 'preview/screenshots/04-mobile-archived.png' })
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
)
await page.goto(`${base}/agents/101`)
await page.getByRole('button', { name: '智能体更多操作' }).click()
await page.getByRole('menuitem', { name: '归档智能体' }).waitFor()
await page.screenshot({ path: 'preview/screenshots/05-mobile-menu.png' })
assert.deepEqual(errors, [])
console.log(
  'PASS: archive, refresh, settings, restore, preserved versions, empty-agent menu, mobile overflow, no runtime errors',
)
await browser.close()
