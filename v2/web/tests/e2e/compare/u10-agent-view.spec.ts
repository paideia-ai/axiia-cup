// U10 — EA 智能体视图（B3）owner vs public 对照审计（compare-v34）。
// 行为叙述源：tests/e2e/compare/u10-agent-view.feature（U10-C01…C14 锚定
// #25/#34/#35/#63/#64/#75/#87/#88/#89/#90 与 P1/P9/P15）；每个 test.step 的
// 文案与 feature 的 Given/When/Then 一一对应。
//
// 2026-08-25 移植注（PR #122 → main，含 #137/#138 后的行为）：
// · U10-C12 转绿——#138 落地公开视图：探针打开别人的 EA，前端在 draft 403
//   后改取 /v1/agents/:id/public 投影，渲染展示名 + 逐版本战绩（无提示词、
//   无 diff、无所有者动作）。原「预期红」断言改为验收新行为。
// · U10-C13 增补：/public 投影本身也不含提示词（#20 契约面）。
// · U10-C02（EA 双侧徽章，#64）与 U10-C14 后半（NPC 可点开视图，#34）缺口
//   未修——test.fixme 保留原断言体，见 fixme-u10.json。
// · 探针账号登录失败即用注册码自建（本地 e2e 栈是全新库，无预置探针）。
//
// 对战预算 0：不派发任何对局；OS 面板只开不派；战绩断言只验结构文案。
// 账号：AXIIA_U10_EMAIL 指定则复用（远端跑法）；缺省时新建（本地栈独立库）。
import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  request,
  test,
} from '@playwright/test'

import { baseURL, registrationCode, sameOrigin } from '../helpers'

const SHANGYANG = 'shangyang-court'
const SCENARIO_TITLE = '商鞅变法·朝堂辩法'
const PASSWORD = 'playwrightpw-123456'
const PROBE_EMAIL = 'coordinator-probe-0816@axiia.test'
// 提示词带独特暗记，公开视角用它检测泄露（#20）。
const PROMPT_V1 = 'U10 商鞅 v1：奖励耕战，立木为信。'
const PROMPT_V2 = 'U10 商鞅 v2：奖励耕战，立木为信；徙木立信之外再加连坐之法。'
const PROMPT_G = 'U10 甘龙 v1：祖宗之法不可轻变，循礼而治。'
const PROMPT_B = 'U10 商鞅 B v1：不法古，不循今，法后王。'
const LEAK_TOKENS = ['立木为信', '连坐之法', '不法古']

let ownerEmail = ''
let agentA = 0
let agentG = 0
let agentB = 0

async function api(
  ctx: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  data?: unknown,
) {
  const response = await ctx.fetch(`${baseURL}/v1${path}`, {
    method,
    headers: { ...sameOrigin, 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { data }),
  })
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = await response.text().catch(() => null)
  }
  return { status: response.status(), body }
}

// 背景：我的账号已就位——商鞅 A「贪婪」（2 版）、甘龙 G（1 版）、
// 商鞅 B「激进」（1 版）。幂等：已有则复用，不重复铺设。
test.beforeAll(async () => {
  expect(baseURL, 'AXIIA_BASE_URL must be set').not.toBe('')
  const ctx = await request.newContext({ baseURL })
  ownerEmail = process.env.AXIIA_U10_EMAIL ?? ''
  if (ownerEmail) {
    const login = await api(ctx, 'POST', '/auth/login', {
      email: ownerEmail,
      password: PASSWORD,
    })
    expect(login.status, `login ${ownerEmail}`).toBe(200)
  } else {
    expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
    ownerEmail = `playwright-u10-${Date.now()}@axiia.test`
    const signup = await api(ctx, 'POST', '/auth/signup', {
      code: registrationCode,
      email: ownerEmail,
      phone: null,
      password: PASSWORD,
      displayName: '测试玩家 u10',
    })
    expect(signup.status, `signup ${ownerEmail}`).toBe(200)
  }

  const models = await api(ctx, 'GET', '/models') as {
    status: number
    body: { models: { id: string }[] }
  }
  const modelID = models.body.models[0].id
  const save = async (agentID: number, prompt: string) => {
    const saved = await api(ctx, 'POST', `/agents/${agentID}/save`, {
      prompt,
      modelID,
      parentVersionID: null,
    })
    expect(saved.status, `save on agent ${agentID}`).toBe(200)
  }

  const inventory = await api(ctx, 'GET', '/my/agents') as {
    status: number
    body: {
      scenarios: Array<{
        scenarioID: string
        sides: { a: Array<{ agentID: number }>; b: Array<{ agentID: number }> }
      }>
    }
  }
  const sides = inventory.body.scenarios
    .find((item) => item.scenarioID === SHANGYANG)?.sides ?? { a: [], b: [] }

  agentA = sides.a[0]?.agentID ?? 0
  if (!agentA) {
    const ensured = await api(ctx, 'POST', '/agents/ensure', {
      scenarioID: SHANGYANG,
      side: 'a',
    }) as { status: number; body: { agentID: number } }
    agentA = ensured.body.agentID
  }
  const versionsA = await api(ctx, 'GET', `/agents/${agentA}/versions`) as {
    status: number
    body: { versions: unknown[] }
  }
  if (versionsA.body.versions.length < 2) {
    await save(agentA, PROMPT_V1)
    await save(agentA, PROMPT_V2)
  }
  await api(ctx, 'PATCH', `/agents/${agentA}`, { name: '贪婪' })

  agentG = sides.b[0]?.agentID ?? 0
  if (!agentG) {
    const ensured = await api(ctx, 'POST', '/agents/ensure', {
      scenarioID: SHANGYANG,
      side: 'b',
    }) as { status: number; body: { agentID: number } }
    agentG = ensured.body.agentID
  }
  const versionsG = await api(ctx, 'GET', `/agents/${agentG}/versions`) as {
    status: number
    body: { versions: unknown[] }
  }
  if (versionsG.body.versions.length < 1) await save(agentG, PROMPT_G)

  agentB = sides.a[1]?.agentID ?? 0
  if (!agentB) {
    const created = await api(ctx, 'POST', '/agents', {
      scenarioID: SHANGYANG,
      side: 'a',
      name: '激进',
    }) as { status: number; body: { agentID: number } }
    expect(created.status, 'sibling create (#56/#90 再建一个)').toBe(200)
    agentB = created.body.agentID
    await save(agentB, PROMPT_B)
  }
  await ctx.dispose()
})

async function loginOwner(page: Page) {
  const login = await page.request.post(`${baseURL}/v1/auth/login`, {
    headers: sameOrigin,
    data: { email: ownerEmail, password: PASSWORD },
  })
  expect(login.ok(), 'owner login').toBe(true)
}

async function openAgentPage(page: Page, agentID: number) {
  await page.goto(`${baseURL}/agents/${agentID}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('version-card').first()).toBeVisible()
}

// 探针（非所有者视角）：远端跑法复用既有只读探针；本地 e2e 栈是全新库，
// 登录失败即用注册码自建同名账号（幂等：第二次进来走登录分支）。
async function probeContext(browser: Browser) {
  const context = await browser.newContext({ baseURL })
  const login = await context.request.post(`${baseURL}/v1/auth/login`, {
    headers: sameOrigin,
    data: { email: PROBE_EMAIL, password: PASSWORD },
  })
  if (!login.ok()) {
    const signup = await context.request.post(`${baseURL}/v1/auth/signup`, {
      headers: sameOrigin,
      data: {
        code: registrationCode,
        email: PROBE_EMAIL,
        phone: null,
        password: PASSWORD,
        displayName: '探针玩家 u10',
      },
    })
    expect(signup.ok(), 'probe signup (fresh local stack)').toBe(true)
  }
  return context
}

test('U10-C01/C07：EA 页头展示名与双编号；无名策略回落「侧名 #id」', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)

  await test.step('当 我打开 A 的智能体主页', async () => {
    await openAgentPage(page, agentA)
  })
  await test.step('那么 页头标题是「商鞅「贪婪」」（侧角色名「自起名」）', async () => {
    await expect(page.getByRole('heading', { level: 1 }))
      .toHaveText('商鞅「贪婪」')
  })
  await test.step('并且 副行含场景名「商鞅变法·朝堂辩法」与小字「#<agentID>」', async () => {
    const subtitle = page.locator('h1 + p')
    await expect(subtitle).toContainText(SCENARIO_TITLE)
    await expect(subtitle).toContainText(`#${agentA}`)
  })
  await test.step('并且 界面不出现「策略」「版本线」等内部词（#87 不进 UI）', async () => {
    const body = (await page.locator('body').innerText())
      .replaceAll('策略提示词', '')
    expect(body).not.toContain('版本线')
    expect(body).not.toContain('策略')
  })
  await test.step('并且 每张版本卡并排展示 vN 与 #全局id 两套编号（#25）', async () => {
    const card = page.getByTestId('version-card').first()
    await expect(card.getByText(/^v\d+$/)).toBeVisible()
    await expect(card.getByText(/^#\d+$/)).toBeVisible()
  })
  await test.step('当 我打开甘龙 G 的智能体主页（未起名）；那么 页头标题是「甘龙 #<agentID>」', async () => {
    await openAgentPage(page, agentG)
    await expect(page.getByRole('heading', { level: 1 }))
      .toHaveText(`甘龙 #${agentG}`)
  })
})

// fixme(#64 EA 双侧徽章缺失): 按规格 #64「EA 与『我的智能体』处显示 商鞅 ✓ /
// 甘龙 ✗」，EA 页应出现双侧完成度徽章；agent-view.tsx 至今没有任何双侧徽章
// （#137/#138 均未触及，仅 my-agents 一侧达标）；待 EA 页补该徽章后摘除。
test.fixme('U10-C02：双侧完成度徽章在 EA 页（#64——缺口未修）', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开 A 的智能体主页', async () => {
    await openAgentPage(page, agentA)
  })
  await test.step('那么 页面出现 商鞅/甘龙 双侧完成度徽章（如 商鞅 ✓ / 甘龙 ✗）', async () => {
    await expect(page.getByText(/(商鞅|甘龙)\s*(✓|✗|未标参赛|未建)/).first())
      .toBeVisible()
  })
})

test('U10-C02：双侧完成度徽章在「我的智能体」页', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开「我的智能体」页', async () => {
    await page.goto(`${baseURL}/my-agents`)
    await expect(page.getByTestId('agent-row').first()).toBeVisible()
  })
  await test.step('那么 商鞅变法卡上有 商鞅 与 甘龙 两枚完成度徽章（✓/未标参赛/未建）', async () => {
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/商鞅\s*(✓|未标参赛|未建)/)
    expect(body).toMatch(/甘龙\s*(✓|未标参赛|未建)/)
  })
})

test('U10-C03：页头「编辑」在「出战」旁，点击进入工作区', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开 A 的智能体主页', async () => {
    await openAgentPage(page, agentA)
  })
  await test.step('那么 页头有「编辑」按钮与「出战」按钮相邻（#75）', async () => {
    await expect(page.getByRole('button', { name: '编辑', exact: true }))
      .toBeVisible()
    await expect(page.getByTestId('open-os-panel')).toBeVisible()
  })
  await test.step('当 我点「编辑」；那么 落到 /agents/<A>/build 工作区（#81 语义重释）', async () => {
    await page.getByRole('button', { name: '编辑', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentA}/build`))
    await expect(page.getByLabel('策略提示词')).toBeVisible()
  })
})

test('U10-C04：版本 diff 所有者可见且可用（#20）', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我在 A 的智能体主页选基准 v1、对比 v2 并点「对比」', async () => {
    await openAgentPage(page, agentA)
    await expect(page.getByRole('heading', { name: '版本对比' })).toBeVisible()
    // 默认已选 基准=次新、对比=最新——直接跑对比。
    await page.getByRole('button', { name: '对比', exact: true }).click()
  })
  await test.step('那么 出现双栏提示词全文对照（owner 允许看提示词与 diff，#20）', async () => {
    await expect(page.getByText('基准 v1', { exact: false })).toBeVisible()
    await expect(page.getByText('对比 v2', { exact: false })).toBeVisible()
    await expect(page.locator('pre').filter({ hasText: PROMPT_V1 }))
      .toBeVisible()
    await expect(page.locator('pre').filter({ hasText: PROMPT_V2 }))
      .toBeVisible()
  })
})

test('U10-C05/C06：逐版本胜负槽与 ★参赛版本', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开 A 的智能体主页', async () => {
    await openAgentPage(page, agentA)
  })
  await test.step('那么 每张版本卡有战绩槽：「还没有出战过」或「N 战 M 胜」（#35/P15）', async () => {
    const records = page.getByTestId('version-record')
    await expect(records).toHaveCount(2)
    for (const text of await records.allTextContents()) {
      expect(text).toMatch(/^(还没有出战过|\d+ 战 \d+ 胜)$/)
    }
  })
  await test.step('并且 恰有一张版本卡带「★参赛版本」徽章（#33/#91）', async () => {
    await expect(page.getByText('★参赛版本', { exact: true })).toHaveCount(1)
  })
})

test('U10-C08：版本卡动作集合按 #89/#90 定稿', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我查看 A 的任意一张版本卡', async () => {
    await openAgentPage(page, agentA)
  })
  await test.step('那么 动作为：展开全文 / 设为参赛版本（★卡除外）/ 基于该版本迭代 / 出战', async () => {
    const cards = page.getByTestId('version-card')
    for (const card of await cards.all()) {
      await expect(card.getByRole('button', { name: /展开.*全文/ }))
        .toBeVisible()
      await expect(card.getByRole('button', { name: /^基于.*迭代$/ }))
        .toBeVisible()
      await expect(card.getByRole('button', { name: /^用.*出战$/ }))
        .toBeVisible()
      const isEntry = (await card.getByText('★参赛版本').count()) > 0
      const setEntry = card.getByRole('button', { name: /设为.*参赛版本/ })
      if (isEntry) await expect(setEntry).toHaveCount(0)
      else await expect(setEntry).toBeVisible()
    }
  })
  await test.step('并且 没有「复制为新智能体」（#90 废止）也没有「恢复到工作区」（#89 改名）', async () => {
    await expect(page.getByText('复制为新智能体')).toHaveCount(0)
    await expect(page.getByText('恢复到工作区')).toHaveCount(0)
  })
})

test('U10-C09：EA 与 E 页版本卡动作集合逐字一致（#88）', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  let eaActions: string[] = []
  let eActions: string[] = []
  await test.step('当 我分别打开 A 的智能体主页与其构建器页', async () => {
    await openAgentPage(page, agentA)
    eaActions = await page.getByTestId('version-card').first()
      .locator('button').allTextContents()
    await page.goto(`${baseURL}/agents/${agentA}/build`)
    await expect(page.getByLabel('策略提示词')).toBeVisible()
    await expect(page.getByTestId('version-card').first()).toBeVisible()
    // 场景数据未回前 E 页按钮短暂显示「设为甲方参赛版本」占位（builder 的
    // side 回落文案）——等它落定为角色名口径后再取，不把加载态计为差异。
    await expect(
      page.getByRole('button', { name: '设为商鞅参赛版本' }).first(),
    ).toBeVisible()
    eActions = await page.getByTestId('version-card').first()
      .locator('button').allTextContents()
  })
  await test.step('那么 两页版本卡的动作按钮集合逐字一致（#88 同构）', () => {
    expect(eaActions.length).toBeGreaterThan(0)
    expect([...eActions].sort()).toEqual([...eaActions].sort())
  })
})

test('U10-C10：兄弟策略胶囊（P9）', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开 A 的智能体主页', async () => {
    await openAgentPage(page, agentA)
  })
  await test.step('那么 出现「商鞅「激进」」胶囊，点击切到 B 的主页（P9）', async () => {
    const capsule = page.getByRole('button', { name: '商鞅「激进」' })
    await expect(capsule).toBeVisible()
    await capsule.click()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentB}$`))
  })
  await test.step('当 我打开甘龙 G 的主页（同侧仅 1 个策略）；那么 兄弟胶囊整排不出现', async () => {
    await openAgentPage(page, agentG)
    await expect(page.locator('button[aria-current="page"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: `甘龙 #${agentG}` }))
      .toHaveCount(0)
  })
})

test('U10-C11：EA 入口——DA「查看我的」/「我的智能体」行 / OS 阵容', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开场景页（DA）；那么 侧卡有「查看我的商鞅（N）」入口', async () => {
    await page.goto(`${baseURL}/scenarios/${SHANGYANG}`)
    await expect(page.getByText(/查看我的商鞅（\d+）/)).toBeVisible()
  })
  await test.step('当 我在「我的智能体」页点 A 行的「查看智能体」；那么 落到 A 的智能体主页', async () => {
    await page.goto(`${baseURL}/my-agents`)
    await expect(page.getByTestId('agent-row').first()).toBeVisible()
    await page.getByRole('button', { name: new RegExp(`查看.*#${agentA}$`) })
      .click()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentA}$`))
  })
  await test.step('当 我在 A 的主页点「出战」打开 OS 面板（只开不派）；那么 面板文案使用策略展示名口径（P1，含「贪婪」）', async () => {
    await expect(page.getByTestId('version-card').first()).toBeVisible()
    await page.getByTestId('open-os-panel').click()
    await expect(page.getByText('贪婪').first()).toBeVisible()
    // 只开不派：Escape 关闭，不触任何派发按钮。
    await page.keyboard.press('Escape')
  })
})

test('U10-C12：公开视图——逐版本胜负有意公开（#35，#138 已实现）', async ({ browser }) => {
  test.setTimeout(180_000)
  const context = await probeContext(browser)
  try {
    const page = await context.newPage()
    await test.step('当 探针账号打开 A 的智能体主页 URL', async () => {
      await page.goto(`${baseURL}/agents/${agentA}`)
    })
    await test.step('那么 页面渲染公开视图：展示名「商鞅「贪婪」」与场景名可见（#35/#138 已实现）', async () => {
      // #138：draft 403 后前端改取 /public 投影——身份 + 逐版本战绩。
      await expect(page.getByRole('heading', { level: 1 }))
        .toHaveText('商鞅「贪婪」')
      await expect(page.locator('h1 + p')).toContainText(SCENARIO_TITLE)
      await expect(page.getByText('不是你的智能体')).toHaveCount(0)
    })
    await test.step('并且 「逐版本战绩」区逐版本列出战绩槽（v1/v2 各一行）与唯一的 ★ 参赛版本', async () => {
      await expect(page.getByRole('heading', { name: '逐版本战绩' }))
        .toBeVisible()
      const rows = page.locator('li').filter({
        hasText: /还没有出战过|\d+ 战 \d+ 胜/,
      })
      await expect(rows).toHaveCount(2)
      for (const tag of ['v1', 'v2']) {
        await expect(rows.filter({ hasText: tag })).toHaveCount(1)
      }
      await expect(page.getByText('★ 参赛版本')).toHaveCount(1)
    })
    await test.step('并且 公开视图没有所有者动作（无「编辑」「出战」），并注明提示词只有主人可见', async () => {
      await expect(page.getByRole('button', { name: '编辑', exact: true }))
        .toHaveCount(0)
      await expect(page.getByTestId('open-os-panel')).toHaveCount(0)
      await expect(page.getByText('提示词与版本对比只有主人可见。'))
        .toBeVisible()
    })
  } finally {
    await context.close()
  }
})

test('U10-C13：提示词与 diff 对非所有者永不可见（#20）', async ({ browser }) => {
  test.setTimeout(180_000)
  const context = await probeContext(browser)
  try {
    const page = await context.newPage()
    await test.step('当 探针账号打开 A 的智能体主页 URL', async () => {
      await page.goto(`${baseURL}/agents/${agentA}`)
      // SPA 数据请求落定（公开视图渲染）后再扫正文。
      await page.waitForTimeout(3000)
    })
    await test.step('那么 页面上不出现 A 的任何提示词文本', async () => {
      const body = await page.locator('body').innerText()
      for (const token of LEAK_TOKENS) expect(body).not.toContain(token)
    })
    let responses: { path: string; status: number; text: string }[] = []
    await test.step('并且 以探针身份请求 draft/versions/diff 接口均被拒绝（非 200）', async () => {
      responses = []
      for (
        const path of [
          `/agents/${agentA}/draft`,
          `/agents/${agentA}/versions`,
          `/agents/${agentA}/diff?base=1&head=2`,
        ]
      ) {
        const response = await context.request.get(`${baseURL}/v1${path}`)
        responses.push({
          path,
          status: response.status(),
          text: await response.text(),
        })
      }
      for (const item of responses) {
        expect(item.status, `${item.path} must be denied`).not.toBe(200)
      }
    })
    await test.step('并且 拒绝响应体中不含提示词内容（#20）', () => {
      for (const item of responses) {
        for (const token of LEAK_TOKENS) expect(item.text).not.toContain(token)
      }
    })
    await test.step('并且 公开投影 /public 返回 200 且响应体不含提示词（#138/#20）', async () => {
      const response = await context.request.get(
        `${baseURL}/v1/agents/${agentA}/public`,
      )
      expect(response.status(), '/public projection exists (#138)').toBe(200)
      const text = await response.text()
      for (const token of LEAK_TOKENS) expect(text).not.toContain(token)
    })
  } finally {
    await context.close()
  }
})

// fixme(#34 NPC 无可点开视图页): 按规格 B3「PVE-NPC 的视图＝聚合数据」，NPC
// 预设应提供可点开的智能体视图入口；scenario-detail 的「预设对手」仍是纯徽章
// （无 /agents/ 链接或独立页，#137/#138 均未触及；「侧方胜率」聚合条本身
// 达标）；待 NPC 聚合视图落地后摘除。
test.fixme('U10-C14：PVE-NPC 视图＝聚合数据（#34——后半缺口未修）', async ({ page }) => {
  test.setTimeout(180_000)
  await loginOwner(page)
  await test.step('当 我打开场景页（DA）', async () => {
    await page.goto(`${baseURL}/scenarios/${SHANGYANG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
  await test.step('那么 有「侧方胜率」聚合条（含空态「对局数不足」，语义＝两侧 agent 胜率）', async () => {
    await expect(page.getByText('侧方胜率').first()).toBeVisible()
  })
  await test.step('并且 NPC 预设提供可点开的智能体视图入口', async () => {
    await expect(page.getByRole('heading', { name: '预设对手' })).toBeVisible()
    const npcSection = page.locator('div').filter({
      has: page.getByRole('heading', { name: '预设对手' }),
    }).last()
    await expect(npcSection.locator('a[href*="/agents/"]').first())
      .toBeVisible()
  })
})
