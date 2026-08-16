// U02-C03 的 5173 侧证：同一后端 agent（码头疑云侧 A），分支前端下三选一
// 初始化是否同样缺席（deck 注册表没有该场景 → 应同样缺席 ⇒ spec-gap）。
import { chromium } from 'playwright'

const TARGET = 'http://127.0.0.1:5173'
const EMAIL = process.env.EMAIL

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
  const agents = await (await page.request.get(`${TARGET}/v1/my/agents`))
    .json()
  const legal = agents.scenarios.find((s) =>
    s.scenarioID === 'legal-harbor-murder-jury'
  )
  const agentID = legal.sides.a[0].agentID
  await page.goto(`${TARGET}/agents/${agentID}/build`)
  const workspace = page.getByLabel('策略提示词')
  await workspace.waitFor()
  await page.waitForTimeout(4000)
  const initCard = await page.getByText('初始化方式 · 三选一生成首稿')
    .isVisible().catch(() => false)
  const tabs = await page.getByRole('tab').count()
  console.log(JSON.stringify({ agentID, initCardVisible: initCard, tabs }))
} finally {
  await ctx.close()
}
