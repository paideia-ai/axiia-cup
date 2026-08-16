// U11 · 锦标赛/排名中心 + 管理路由拒绝 + §C4 — u11-tournaments-admin.feature
// 的可执行对应（BDD：每个 test.step 的文案与 feature 的 Given/When/Then 一一
// 对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：B4 GT/GP · #64 排名按玩家 · #58 报名双侧校验 · #47 赛事阻挡
// 试炼 · #32 天梯资格 · C4 邀请码 alpha 门。深层锦标赛行为（建赛/报名/阻挡
// 开关）需要管理员——远程 dev 0 锦标赛，按 untestable 归类（requires local
// harness: deno task test:e2e:real + AXIIA_BIN）；本套件只断言空态与拒绝。
//
// 预算纪律：整套只注册 1 个账号（beforeAll；设 AXIIA_U11_EMAIL 时改为登录
// 复用既有账号）；对战预算 0——出战面板只打开观察，绝不点派发；管理路由
// 每条只导航一次、观察拒绝即止，不提权、不重试。
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import { registrationCode, sameOrigin, signup } from '../helpers'

const SHANGYANG = 'shangyang-court'
const BLOCKED_COPY = '赛事进行中，试炼暂时关闭'

test.describe.configure({ mode: 'serial' })

let ctx: BrowserContext
let page: Page

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
  ctx = await browser.newContext({
    baseURL: process.env.AXIIA_BASE_URL ?? 'http://127.0.0.1:5173',
  })
  page = await ctx.newPage()
  // 背景: 假如 我用注册码注册了一个全新账号（或复用本单元既有账号登录）
  const reuseEmail = process.env.AXIIA_U11_EMAIL ?? ''
  if (reuseEmail) {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(reuseEmail)
    await page.getByLabel('密码').fill('playwrightpw-123456')
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/(express|scenarios)$/)
  } else {
    await signup(page, 'u11')
  }
})

test.afterAll(async () => {
  await ctx?.close()
})

test('U11-C01/C03：排名一级入口与锦标赛空态；天梯待 W11', async () => {
  test.setTimeout(120_000)
  await test.step('那么 顶部导航存在「排名」入口', async () => {
    await page.goto('/scenarios')
    await expect(page.getByRole('link', { name: '排名' }).first())
      .toBeVisible()
  })
  await test.step('当 我进入 /tournaments；那么 页面标题为「排名」', async () => {
    await page.goto('/tournaments')
    await expect(page.getByRole('heading', { name: '排名' })).toBeVisible()
  })
  await test.step('并且 没有任何锦标赛时显示空态「暂无锦标赛。」', async () => {
    await expect(page.getByText('暂无锦标赛。')).toBeVisible()
  })
  await test.step('并且 页面没有「天梯」tab，只有说明「玩家天梯待后续版本」', async () => {
    await expect(page.getByRole('tab', { name: /天梯/ })).toHaveCount(0)
    await expect(page.getByText('玩家天梯待后续版本')).toBeVisible()
  })
})

test('U11-C02（可测边缘）：积分榜深链在无锦标赛时优雅降级', async () => {
  test.setTimeout(120_000)
  await test.step('当 我直接访问 /tournaments/1；那么 看到「锦标赛 #1 积分榜」骨架', async () => {
    await page.goto('/tournaments/1')
    await expect(page.getByRole('heading', { name: /锦标赛 #1 积分榜/ }))
      .toBeVisible()
  })
  await test.step('并且 正文是空态或错误提示，而不是崩溃白屏', async () => {
    await expect(page.getByText(/暂无积分数据|失败|错误/).first())
      .toBeVisible()
  })
})

test('U11-C06：无赛事运行时试炼不被阻挡（#47 未阻挡态）', async () => {
  test.setTimeout(180_000)
  let agentID = 0
  await test.step('假如 我建了一个商鞅智能体并保存了 1 个版本（不发起任何对战）', async () => {
    // get-or-create（幂等）：账号复用时场景页「去构建」会变成「再建一个」
    // （P13）且触发引导门，改走 ensure 直达既有/新建的智能体。
    const ensure = await page.request.post('/v1/agents/ensure', {
      headers: sameOrigin,
      data: { scenarioID: SHANGYANG, side: 'a' },
    })
    expect(ensure.ok(), 'ensure agent a succeeds').toBe(true)
    agentID = (await ensure.json() as { agentID: number }).agentID
    await page.goto(`/agents/${agentID}/build`)
    const input = page.getByLabel('策略提示词')
    await expect(input).toBeEnabled({ timeout: 30_000 })
    if (await page.getByTestId('version-card').count() === 0) {
      await input.fill('U11 巡检用：徙木立信，先立小信再谈大义。不发起对战。')
      await page.getByTestId('save-version').click()
    }
    await expect(page.getByTestId('version-card').first()).toBeVisible()
  })
  await test.step('当 我从版本卡「出战」呼出选择对手面板', async () => {
    await page.getByRole('button', { name: /出战/ }).first().click()
    await expect(page.getByRole('tab', { name: 'NPC 练习' })).toBeVisible()
  })
  await test.step('那么 面板里没有「赛事进行中，试炼暂时关闭」横幅', async () => {
    await expect(page.getByText(BLOCKED_COPY)).toHaveCount(0)
  })
  await test.step('并且 /v1/config 的 trialsBlocked 为 false', async () => {
    const config = await page.request.get('/v1/config')
    expect(config.ok(), 'GET /v1/config succeeds').toBe(true)
    const body = await config.json() as { trialsBlocked?: boolean }
    expect(body.trialsBlocked).toBe(false)
    // 对战预算 0：面板只看不点，Escape 关闭。
    await page.keyboard.press('Escape')
  })
})

test('U11-C08：非管理员访问 /admin 被拒', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我是普通玩家（非管理员）；当 我直接访问 /admin；那么 我被重定向离开管理面（落在 /scenarios）', async () => {
    // 单次导航 + 观察拒绝即全部测试——不提权、不重试。
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/scenarios$/)
  })
  await test.step('并且 顶部导航没有「管理面板」入口', async () => {
    await expect(page.getByRole('link', { name: '管理面板' })).toHaveCount(0)
  })
})

test('U11-C09：非管理员访问 /admin/slots/:id 被拒', async () => {
  test.setTimeout(120_000)
  await test.step('当 我直接访问 /admin/slots/shangyang-court；那么 我被重定向离开管理面（落在 /scenarios）', async () => {
    await page.goto(`/admin/slots/${SHANGYANG}`)
    await expect(page).toHaveURL(/\/scenarios$/)
  })
})

test('U11-C10：注册需要注册码（C4 邀请码 alpha 门）', async () => {
  test.setTimeout(120_000)
  await test.step('那么 注册页有必填的「注册码」字段', async () => {
    // 已登录会话会被 /register 的 GuestOnly 弹开——用无 cookie 的访客
    // 上下文观察表单（只看字段，不提交、不建号）。
    const guestCtx = await ctx.browser()!.newContext({
      baseURL: process.env.AXIIA_BASE_URL ?? 'http://127.0.0.1:5173',
    })
    try {
      const guest = await guestCtx.newPage()
      await guest.goto('/register')
      await expect(guest.getByLabel('注册码')).toBeVisible()
    } finally {
      await guestCtx.close()
    }
  })
})
