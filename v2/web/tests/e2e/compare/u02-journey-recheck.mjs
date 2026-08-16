// U02 旅程复核：首轮旅程有四步在等待上写坏（未等数据回来就断言）——本脚本
// 用带等待的判据重走 C01/C02（tab 清单）、C06（下拉清单）、C12（保存后按钮旁
// 提示自增）、C17（模型继承），出具修正截图。
import { chromium } from 'playwright'

const TARGET = process.env.TARGET ?? 'https://axiia-cup-2-web.isofucius.cn'
const EMAIL = process.env.EMAIL
const SHOTS = '/home/ubuntu/axiia-cup-uiux/compare-v34/shots/u02'

const b = await chromium.connectOverCDP('http://127.0.0.1:18800')
const ctx = await b.newContext({
  baseURL: TARGET,
  viewport: { width: 1280, height: 900 },
})
const page = await ctx.newPage()
page.setDefaultTimeout(30000)
const out = []

try {
  await page.goto(`${TARGET}/login`)
  await page.getByLabel('邮箱').fill(EMAIL)
  await page.getByLabel('密码').fill('playwrightpw-123456')
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL(/\/(scenarios|express)/)

  const agents = await (await page.request.get(`${TARGET}/v1/my/agents`))
    .json()
  const shangyang = agents.scenarios.find((s) =>
    s.scenarioID === 'shangyang-court'
  )
  const agentA = shangyang.sides.a[0].agentID
  const agentB = shangyang.sides.b[0].agentID

  // C01/C02 复核：乙侧工作区为空（上一轮清空收尾）→ 初始化卡与三 tab
  await page.goto(`${TARGET}/agents/${agentB}/build`)
  await page.getByText('初始化方式 · 三选一生成首稿').waitFor()
  const tabs = await page.getByRole('tab').allInnerTexts()
  await page.screenshot({ path: `${SHOTS}/U02-C01.png`, fullPage: true })
  out.push({ id: 'U02-C01/C02-recheck', tabs })

  // C06 复核：下拉清单与 /v1/models 一致
  const models =
    (await (await page.request.get(`${TARGET}/v1/models`)).json()).models
  await page.getByRole('combobox').click()
  await page.getByRole('option').first().waitFor()
  const options = await page.getByRole('option').allInnerTexts()
  await page.screenshot({ path: `${SHOTS}/U02-C06.png`, fullPage: true })
  await page.keyboard.press('Escape')
  out.push({
    id: 'U02-C06-recheck',
    models: models.map((m) => m.label),
    options,
  })

  // C12/C17 复核：甲侧已有 v2（最新模型＝清单第二项）→ 按钮旁 v3、模型继承。
  // 先等版本线渲染出来（versions 数据落地）再读——P12 的 span 在数据未回时
  // 会先短暂显示 v1（首轮旅程就是栽在这里）。
  await page.goto(`${TARGET}/agents/${agentA}/build`)
  await page.getByTestId('version-card').first().waitFor()
  const p12 = page.getByText(/保存后将成为 v\d+/)
  await p12.waitFor()
  const p12text = await p12.innerText()
  const combo = await page.getByRole('combobox').innerText()
  const inherit = await page.getByText(/沿用 v\d+ 的模型/).innerText()
    .catch(() => '')
  await page.screenshot({ path: `${SHOTS}/U02-C12.png`, fullPage: true })
  await page.screenshot({ path: `${SHOTS}/U02-C17.png`, fullPage: true })
  out.push({ id: 'U02-C12-recheck', p12text })
  out.push({ id: 'U02-C17-recheck', combo, inherit })

  console.log(JSON.stringify(out, null, 2))
} finally {
  await ctx.close()
}
