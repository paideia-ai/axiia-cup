// U02-C03 补充佐证（#15 MCQ 全场景）：deck 注册表缺席的场景
// legal-harbor-murder-jury 在构建器里是否真的没有三选一初始化（只剩直写）。
import { chromium } from 'playwright'

const TARGET = process.env.TARGET ?? 'https://axiia-cup-2-web.isofucius.cn'
const EMAIL = process.env.EMAIL
const SLOT = 'legal-harbor-murder-jury'

const b = await chromium.connectOverCDP('http://127.0.0.1:18800')
const ctx = await b.newContext({ baseURL: TARGET })
const page = await ctx.newPage()
page.setDefaultTimeout(30000)
try {
  await page.goto(`${TARGET}/login`)
  await page.getByLabel('邮箱').fill(EMAIL)
  await page.getByLabel('密码').fill('playwrightpw-123456')
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL(/\/(scenarios|express)/)
  await page.goto(`${TARGET}/scenarios/${SLOT}`)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.getByTestId('build-agent').click()
  await page.waitForURL(/\/agents\/\d+\/build/)
  await page.getByLabel('策略提示词').waitFor()
  await page.waitForTimeout(3000)
  const initCard = await page.getByText('初始化方式 · 三选一生成首稿')
    .isVisible().catch(() => false)
  const tabs = await page.getByRole('tab').count()
  await page.screenshot({
    path:
      '/home/ubuntu/axiia-cup-uiux/compare-v34/shots/u02/U02-C03-deckless.png',
    fullPage: true,
  })
  console.log(
    JSON.stringify({ slot: SLOT, initCardVisible: initCard, tabCount: tabs }),
  )
} finally {
  await ctx.close()
}
