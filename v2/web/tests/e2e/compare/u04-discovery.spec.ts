// U04 discovery — u04-discovery.feature 的可执行对应（BDD：每个 test.step 的
// 文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4 §A4：D 页 #37/#38/#39/#40/#54 · DA 内容基线 · #42/#26 计分 ·
// #51 W2 六字段 · P13 侧卡按钮组。
//
// 移植说明（2026-08-25，按 pr-fate 逐条裁定执行）：
//   · #142 把 DA 重写为四张顶层卡——DA 侧全部定位按新结构改写；
//   · C10/C13 按裁定本轮直接实现（裁判提示词原文 + 同源开场白，
//     runtime-quotes.json ⇄ script.js 由 v2/scenarios 的 deno task validate
//     逐字把关）——断言新实现；
//   · C14 的「赛后问询方式」与 C16 的叙事↔原始规则切换是仍开缺口——
//     test.fixme 保留断言体，台账见 fixme-u04.json；不为凑绿改断言。
//
// 安全约束：本单元至多 1 个账号（固定邮箱，先登录后注册）；至多 1 个 0 版本
// 一次性智能体（P13 判定）；不派发任何对局；不触碰管理端点。
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import { activePanel, registrationCode, sameOrigin } from '../helpers'

const SHANGYANG = 'shangyang-court'
// #142 起 DA 页头用 intro 标题（「·」两侧带空格）。
const SCENARIO_TITLE = '商鞅变法 · 朝堂辩法'
// 产品场景槽位（带前端场景模块）：#40 元数据与统计槽位的逐卡断言限于这些卡；
// 其他套件安装的固定局槽位是测试装置，不带 education，不算违约。
const MODULE_SLOTS = [
  'shangyang-court',
  'honnoji-decision',
  'trolley-problem',
  'fengyiting-real',
  'legal-harbor-murder-jury',
]
// 固定邮箱——保证全单元至多注册一次；复跑幂等。
const UNIT_EMAIL = process.env.AXIIA_U04_EMAIL ??
  'playwright-u04-1787000000000@axiia.test'
const UNIT_PASSWORD = process.env.AXIIA_U04_PASSWORD ?? 'playwrightpw-123456'

interface CatalogScenario {
  id: string
  title: string
  onlineAt?: number | null
}

let context: BrowserContext
let page: Page

// 背景：先尝试登录（账号可能已由上次运行注册过），失败再走注册页。
// 注册 403（注册码耗尽）时直接抛错——那是环境阻塞，不是本单元的规格差异。
async function ensureSession(target: Page) {
  const login = await target.request.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email: UNIT_EMAIL, password: UNIT_PASSWORD },
  })
  if (login.ok()) {
    await target.goto('/scenarios')
    await expect(target.getByRole('heading', { name: '场景' })).toBeVisible()
    return
  }
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
  await target.goto('/register')
  const panel = activePanel(target)
  await panel.getByLabel('注册码').fill(registrationCode)
  await panel.getByLabel('昵称').fill('测试玩家 u04')
  await panel.getByLabel('邮箱').fill(UNIT_EMAIL)
  await panel.getByLabel('密码').fill(UNIT_PASSWORD)
  await panel.getByRole('button', { name: '创建账户' }).click()
  await expect(
    target,
    'signup lands on /express or /scenarios (403 here = registration code exhausted, an environment blocker)',
  )
    .toHaveURL(/\/(express|scenarios)$/)
}

async function gotoCatalog() {
  await page.goto('/scenarios')
  await expect(page.locator('[data-testid^="scenario-"]').first())
    .toBeVisible()
}

async function gotoDA(id: string = SHANGYANG) {
  await page.goto(`/scenarios/${id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

async function catalogIDs(): Promise<string[]> {
  const response = await page.request.get('/v1/scenarios')
  expect(response.ok()).toBe(true)
  const { scenarios } = await response.json() as {
    scenarios: CatalogScenario[]
  }
  return scenarios.map((item) => item.id)
}

async function allCardTexts(): Promise<string[]> {
  const cards = page.locator('[data-testid^="scenario-"]')
  const count = await cards.count()
  const texts: string[] = []
  for (let index = 0; index < count; index++) {
    texts.push(await cards.nth(index).innerText())
  }
  return texts
}

// 产品场景卡（MODULE_SLOTS ∩ 目录）的卡面文本。
async function productCardTexts(): Promise<string[]> {
  const ids = (await catalogIDs()).filter((id) => MODULE_SLOTS.includes(id))
  const texts: string[] = []
  for (const id of ids) {
    const card = page.getByTestId(`scenario-${id}`)
    await expect(card).toBeVisible()
    texts.push(await card.innerText())
  }
  return texts
}

// 裁判与计分卡里的「裁判提示词原文」折叠块（u04-c10 新实现）。
async function expandJudgePrompt() {
  const toggle = page.getByRole('button', { name: '裁判提示词原文' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByText('在游戏中扮演秦孝公').first()).toBeVisible()
}

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext()
  page = await context.newPage()
  await test.step('假如 我用本单元唯一账号登录（无则用注册码注册一次）', async () => {
    await ensureSession(page)
  })
})

test.afterAll(async () => {
  await context?.close()
})

test('U04-C01/C02/C04：D 页每张产品卡一句话介绍 + 统计槽位（点亮或空态），难度/时长/适合新手', async () => {
  test.setTimeout(180_000)
  let texts: string[] = []
  let all: string[] = []
  await test.step('假如 我打开场景列表页', async () => {
    await gotoCatalog()
    texts = await productCardTexts()
    all = await allCardTexts()
  })
  await test.step('那么 至少有一张产品场景卡', () => {
    expect(texts.length).toBeGreaterThan(0)
  })
  await test.step('并且 每张产品场景卡都有标题和一句话介绍', () => {
    for (const text of texts) {
      // 标题行 + 至少一行介绍（subject）——空卡视为违约。
      expect(text.trim().split('\n').length).toBeGreaterThanOrEqual(2)
    }
  })
  await test.step('并且 每张产品场景卡的统计槽位：有数据则显示「侧方胜率 · N 场 · 两侧胜率」，未过门槛则显示引导式空态「对局数不足」', () => {
    for (const text of texts) {
      const lit = /侧方胜率/.test(text) && /\d+ 场 ·/.test(text)
      const outline = /侧方胜率/.test(text) && /对局数不足/.test(text)
      expect(
        lit || outline,
        `每张产品卡都要有统计槽位（点亮或空态轮廓），这张两者皆无：${
          text.slice(0, 60)
        }`,
      ).toBe(true)
    }
  })
  await test.step('并且 没有任何卡显示「0 场」这类零数字假统计', () => {
    for (const text of all) {
      expect(text, '未过门槛不摆零数字（#54）').not.toMatch(/(^|[^\d])0 场/)
    }
  })
  await test.step('那么 每张产品场景卡都显示「难度」三档标识', () => {
    // #40「卡片传达：难度…预计一场时长」是逐卡契约，不是「至少一张」。
    for (const text of texts) {
      expect(text, '每张产品卡都要传达难度（#40）').toMatch(/难度/)
    }
  })
  await test.step('并且 每张产品场景卡都显示「约 N 分钟」预计时长', () => {
    for (const text of texts) {
      expect(text, '每张产品卡都要传达预计时长（#40）').toMatch(/约 \d+ 分钟/)
    }
  })
  await test.step('并且 「适合新手」以独立徽章形式出现在部分卡上', () => {
    expect(texts.some((text) => /适合新手/.test(text))).toBe(true)
  })
})

test('U04-C03：最近上线的场景固定第 2 位 + 「新上线」徽章', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我打开场景列表页', async () => {
    await gotoCatalog()
  })
  let newest: CatalogScenario | null = null
  await test.step('那么 目录接口里 onlineAt 最新的那个场景的卡位于列表第 2 位', async () => {
    const response = await page.request.get('/v1/scenarios')
    expect(response.ok()).toBe(true)
    const { scenarios } = await response.json() as {
      scenarios: CatalogScenario[]
    }
    expect(scenarios.length, '#54 需要 ≥2 个场景才有「第 2 位」可言')
      .toBeGreaterThan(1)
    for (const item of scenarios) {
      if (
        item.onlineAt != null &&
        (newest == null || item.onlineAt > (newest.onlineAt ?? 0))
      ) {
        newest = item
      }
    }
    expect(newest, '目录里没有任何 onlineAt——新场景曝光（#54）无从谈起')
      .not.toBeNull()
    const second = page.locator('[data-testid^="scenario-"]').nth(1)
    await expect(second).toHaveAttribute(
      'data-testid',
      `scenario-${newest!.id}`,
    )
  })
  await test.step('并且 那张卡带「新上线」徽章', async () => {
    const second = page.locator('[data-testid^="scenario-"]').nth(1)
    await expect(second.getByText('新上线')).toBeVisible()
  })
  await test.step('并且 其它卡都没有「新上线」徽章', async () => {
    await expect(page.getByText('新上线')).toHaveCount(1)
  })
})

test('U04-C05：「最热门」为 Future，D 页必须缺席', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开场景列表页', async () => {
    await gotoCatalog()
  })
  await test.step('那么 页面上不出现「最热门」字样', async () => {
    await expect(page.getByText('最热门')).toHaveCount(0)
  })
})

test('U04-C06：点卡片进 DA，「去构建」只在 DA', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我打开场景列表页', async () => {
    await gotoCatalog()
  })
  await test.step('那么 场景卡上没有「去构建」按钮', async () => {
    const texts = await allCardTexts()
    for (const text of texts) {
      expect(text).not.toContain('去构建')
    }
  })
  await test.step('当 我点「商鞅变法 · 朝堂辩法」的卡片', async () => {
    await page.getByTestId(`scenario-${SHANGYANG}`).click()
  })
  await test.step('那么 我进入该场景的 DA 页并看到场景标题', async () => {
    await expect(page).toHaveURL(new RegExp(`/scenarios/${SHANGYANG}$`))
    await expect(page.getByRole('heading', { name: SCENARIO_TITLE }))
      .toBeVisible()
  })
})

test('U04-C07：DA 页内没有编辑框（#42 与 E 分开）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  // 审计期还断言「本页只讲规则，不设编辑框」提示文案；#142 后该文案不存在，
  // #42 的行为契约（无编辑框）保持逐字断言——见 feature 移植说明。
  await test.step('那么 页内没有任何文本编辑框', async () => {
    await expect(page.locator('textarea')).toHaveCount(0)
  })
})

test('U04-C08：四张顶层卡依序呈现，隐藏目标渐进披露（#142 结构）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 顶层卡自上而下依次是「01 · 背景故事」「02 · 主张变法」「03 · 反对立即全面变法」与「裁判与计分」', async () => {
    const body = await page.locator('body').innerText()
    const order = [
      '01 · 背景故事',
      '02 · 主张变法',
      '03 · 反对立即全面变法',
      '裁判与计分',
    ]
    let last = -1
    for (const anchor of order) {
      const at = body.indexOf(anchor)
      expect(at, `四卡骨架缺「${anchor}」或顺序错乱`).toBeGreaterThan(last)
      last = at
    }
  })
  await test.step('并且 「隐藏目标列表」默认收起——SR 编号此刻不可见', async () => {
    await expect(page.getByRole('button', { name: '隐藏目标列表' }))
      .toHaveCount(2)
    await expect(page.getByText('SR1')).toHaveCount(0)
  })
  await test.step('当 我点开甲方的「隐藏目标列表」；那么 SR1—SR3 候选清单出现', async () => {
    await page.getByRole('button', { name: '隐藏目标列表' }).first().click()
    for (const id of ['SR1', 'SR2', 'SR3']) {
      await expect(page.getByText(id, { exact: true })).toBeVisible()
    }
  })
})

test('U04-C09：侧方胜率出现在背景故事卡（#38 GLANCE）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 背景故事卡内出现「侧方胜率」——有数据点亮，无数据为空态轮廓', async () => {
    const glance = page.locator('[data-testid="scenario-intro-card"]').first()
    await expect(glance.getByText('侧方胜率')).toBeVisible()
  })
})

test('U04-C10：内容基线八项齐备，裁判 prompt 原文可查（同源）', async () => {
  test.setTimeout(120_000)
  let combined = ''
  await test.step('假如 我打开商鞅场景的 DA 页并展开全部折叠层', async () => {
    await gotoDA()
    combined = await page.locator('body').innerText()
    await expandJudgePrompt()
    const hiddenLists = page.getByRole('button', { name: '隐藏目标列表' })
    await hiddenLists.first().click()
    await hiddenLists.nth(1).click()
    await expect(page.getByText('GR1', { exact: true })).toBeVisible()
    combined += '\n' + await page.locator('body').innerText()
  })
  await test.step('那么 页面包含：背景故事、双方胜利条件、双方是谁（商鞅/甘龙）、裁判摘要、评判什么、隐藏目标玩法、计分规则、预计时长', () => {
    expect(combined).toContain('背景故事')
    expect(combined).toContain('最重要的目标')
    expect(combined).toContain('说服秦孝公立即推行变法。')
    expect(combined).toContain('商鞅')
    expect(combined).toContain('甘龙')
    expect(combined).toContain('NPC 裁判')
    expect(combined).toContain('秦孝公')
    // 评判什么：裁判摘要与提示词原文交代评判尺度（实据、利害、可行性）。
    expect(combined).toMatch(/实据、利害、可行性|必须判断/)
    expect(combined).toContain('国策之外，还有隐藏目标')
    expect(combined).toContain('计分规则')
    expect(combined).toMatch(/一场约 \d+ 分钟/)
  })
  await test.step('并且 「裁判提示词原文」展开后是秦孝公的扮演 system prompt 全文——与 script.js 逐字同源', () => {
    // 同源由 v2/scenarios 的 deno task validate 逐字把关；页面断言认原文
    // 首句与人设段落即可（A4 基线「裁判 prompt + 摘要」）。
    expect(combined).toContain('你正在参与一个策略对话游戏，在游戏中扮演秦孝公')
    expect(combined).toContain('你是秦笑公嬴渠良')
  })
  await test.step('并且 原文块注明依 #51 裁判内心独白（judge OS）的生成提示词不公开', () => {
    expect(combined).toContain('裁判内心独白（judge OS）的生成提示词不公开')
  })
})

test('U04-C11：计分来自场景数据、精确权重公开（#42/#26）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 「计分规则」给出带数字的精确权重（+1／+0.5／−0.25／−1）', async () => {
    await expect(page.getByRole('heading', { name: '计分规则' })).toBeVisible()
    for (const weight of ['+1', '+0.5', '−0.25', '−1']) {
      await expect(
        page.getByText(weight, { exact: true }),
        `精确权重全公开（#26）：缺 ${weight}`,
      ).toBeVisible()
    }
  })
  await test.step('当 我打开另一个产品场景的 DA 页；那么 那里的计分内容与商鞅场景不同——计分不是页面硬编码', async () => {
    // 对照组避开同为真假请求计分的本能寺：电车/凤仪亭/陪审团的计分形态
    // 与商鞅的隐藏请求账目表结构性不同。
    const ids = await catalogIDs()
    const contrast = [
      'trolley-problem',
      'fengyiting-real',
      'legal-harbor-murder-jury',
    ].find((id) => ids.includes(id))
    expect(contrast, '目录里需要第二个产品场景来证明计分非硬编码')
      .toBeTruthy()
    await gotoDA(contrast!)
    const body = await page.locator('body').innerText()
    expect(body).not.toContain('你的真请求被裁判同意')
    expect(body).not.toContain('每局双方独立计分，总分高者胜。')
  })
})

test('U04-C12：隐藏目标机制对人公开', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 双方卡的「隐藏目标列表」点开即公开候选清单与真假机制说明', async () => {
    const hiddenLists = page.getByRole('button', { name: '隐藏目标列表' })
    await expect(hiddenLists).toHaveCount(2)
    await hiddenLists.first().click()
    await expect(page.getByText('SR1', { exact: true })).toBeVisible()
    await expect(
      page.getByText('每局随机一项为真目标，其余两项为假目标。').first(),
    ).toBeVisible()
    await hiddenLists.nth(1).click()
    await expect(page.getByText('GR1', { exact: true })).toBeVisible()
  })
})

test('U04-C13：EXPAND-1 请求项 + 同源开场白（#51）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 双方层给出请求项候选（SR/GR 编号）', async () => {
    const hiddenLists = page.getByRole('button', { name: '隐藏目标列表' })
    await hiddenLists.first().click()
    await expect(page.getByText('SR1', { exact: true })).toBeVisible()
    await hiddenLists.nth(1).click()
    await expect(page.getByText('GR1', { exact: true })).toBeVisible()
  })
  await test.step('并且 「开场白」块只读展示秦孝公的统一首句——文与运行时 OPENING_LINE 同源', async () => {
    // 同源由 deno task validate 对照 script.js 的 OPENING_LINE 把关；这里
    // 断言页面展示的正是那句话（规格锚定的引文）。
    const opening = page.getByTestId('opening-line')
    await expect(opening).toBeVisible()
    await expect(opening).toContainText(
      '卫鞅，寡人今日召你与甘龙太师当堂论辩，就变法一事各陈其辞。你先说。',
    )
    await expect(opening).toContainText('开场白')
  })
  const ids = await catalogIDs()
  await test.step('当 我打开本能寺场景的 DA 页；那么 那里的开场白同样与其脚本同源', async () => {
    if (!ids.includes('honnoji-decision')) {
      test.info().annotations.push({
        type: 'partial',
        description: '目录缺 honnoji-decision，本步未验（集成环境应齐备）',
      })
      return
    }
    await gotoDA('honnoji-decision')
    await expect(page.getByTestId('opening-line')).toContainText(
      '诸位，今夜军势已动，敌在何处，须在此刻决断。先陈杀信长之议。',
    )
  })
  await test.step('当 我打开电车难题的 DA 页；那么 没有开场白块——无统一开场首句的场景不许编造', async () => {
    if (!ids.includes('trolley-problem')) {
      test.info().annotations.push({
        type: 'partial',
        description: '目录缺 trolley-problem，本步未验（集成环境应齐备）',
      })
      return
    }
    await gotoDA('trolley-problem')
    await expect(page.getByTestId('opening-line')).toHaveCount(0)
  })
})

test('U04-C14：EXPAND-2 真假概况与轮数；阶段结构（如有）在流程卡（#51）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 页面交代隐藏信息真假配置概况（一真两假）', async () => {
    await expect(
      page.getByText('一个是真目标，两个是假目标', { exact: false }).first(),
    ).toBeVisible()
  })
  await test.step('并且 页面交代对话轮数', async () => {
    await expect(page.getByText(/5 轮朝堂辩论/).first()).toBeVisible()
  })
  await test.step('当 我打开凤仪亭场景的 DA 页；那么 「游戏流程」卡列出阶段结构', async () => {
    const ids = await catalogIDs()
    if (!ids.includes('fengyiting-real')) {
      test.info().annotations.push({
        type: 'partial',
        description: '目录缺 fengyiting-real，本步未验（集成环境应齐备）',
      })
      return
    }
    await gotoDA('fengyiting-real')
    await expect(page.getByRole('heading', { name: '游戏流程' })).toBeVisible()
    await expect(page.getByText('四场私谈').first()).toBeVisible()
  })
})

// fixme(赛后问询方式缺席): 按规格 #51 W2 应 EXPAND-2 交代赛后问询方式；#142
// 重做后的 DA 不再渲染 education.judgeSummary，页面上没有任何「屏退问询/独问」
// 交代；待 DA 恢复问询方式的公开交代（如在裁判与计分卡渲染问询摘要）修复后
// 摘除。台账见 fixme-u04.json。
test.fixme('U04-C14b：EXPAND-2 交代赛后问询方式（#51——缺口未修）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 裁判与计分层交代赛后问询方式', async () => {
    await expect(page.getByText(/问询|独问/).first()).toBeVisible()
  })
})

test('U04-C15：裁判/计分模型公开；judgeOsPrompt 不公开（#51）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页并展开「裁判提示词原文」', async () => {
    await gotoDA()
    await expandJudgePrompt()
  })
  await test.step('那么 原文块交代裁判／计分模型（默认 deepseek-v4-pro）', async () => {
    await expect(
      page.getByText(/裁判／计分模型：默认 deepseek-v4-pro/),
    ).toBeVisible()
  })
  await test.step('并且 场景详情接口的返回里没有 judgeOsPrompt 字段', async () => {
    const response = await page.request.get(`/v1/scenarios/${SHANGYANG}?side=a`)
    expect(response.ok()).toBe(true)
    expect(await response.text(), '#51：judgeOsPrompt 维持不公开')
      .not.toMatch(/judgeOs/i)
  })
})

// fixme(叙事↔原始规则切换缺席): 按规格 A4 DA 应 保留叙事 ↔ 原始规则切换；当前
// DA 没有 raw rules 内容源与控件；待 补公开 raw rules 数据 + 切换控件 + 原始态
// 断言（未经叙事包装的规则原文）修复后摘除。台账见 fixme-u04.json。
test.fixme('U04-C16：叙事 ↔ 原始规则切换保留', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 存在「叙事 / 原始规则」切换控件', async () => {
    await expect(
      page.getByText(/原始规则/).first(),
      'A4 DA：叙事↔原始规则切换保留——页面上应有切换入口',
    ).toBeVisible()
  })
  await test.step('当 我切到原始规则；那么 我看到未经叙事包装的规则原文', async () => {
    await page.getByText(/原始规则/).first().click()
    await expect(page.getByText(/原文|规则全文|raw/i).first()).toBeVisible()
  })
})

test('U04-C17：P13 侧卡按钮组随「该侧已有策略」切换', async () => {
  test.setTimeout(240_000)
  // 账号状态自适应：先从 /v1/my/agents 读出本账号在商鞅场景两侧的策略数，
  // 再断言 DA 侧卡与之一致——复跑幂等（第二次跑直接落在「已有策略」分支）。
  let countA = 0
  let countB = 0
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    const inventory = await page.request.get('/v1/my/agents')
    expect(inventory.ok()).toBe(true)
    const { scenarios } = await inventory.json() as {
      scenarios: Array<
        { scenarioID: string; sides: { a: unknown[]; b: unknown[] } }
      >
    }
    const mine = scenarios.find((item) => item.scenarioID === SHANGYANG)
    countA = mine?.sides.a.length ?? 0
    countB = mine?.sides.b.length ?? 0
    await gotoDA()
  })
  const buildA = page.getByTestId('build-agent')
  if (countA === 0) {
    await test.step('那么 若我在甲方还没有策略，甲方侧卡显示「去构建」', async () => {
      await expect(buildA).toBeVisible()
    })
    await test.step('当 我点甲方「去构建」（本单元唯一一次性智能体，0 版本，不派发对局）', async () => {
      await buildA.click()
      await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    })
    await test.step('并且 我回到 DA 页', async () => {
      await gotoDA()
    })
    countA = 1
  }
  await test.step('那么 甲方侧卡按钮组换成「再建一个商鞅」与「查看我的商鞅（N）」', async () => {
    await expect(page.getByRole('button', { name: '再建一个商鞅' }))
      .toBeVisible()
    await expect(
      page.getByRole('button', { name: `查看我的商鞅（${countA}）` }),
    ).toBeVisible()
    await expect(buildA).toHaveCount(0)
  })
  await test.step('并且 甲方侧卡显示「你已有 N 个商鞅：…」', async () => {
    await expect(page.getByText(`你已有 ${countA} 个商鞅`)).toBeVisible()
  })
  await test.step('并且 无策略的一侧仍显示「去构建」', async () => {
    if (countB === 0) {
      await expect(page.getByTestId('build-agent-b')).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: '再建一个甘龙' }))
        .toBeVisible()
    }
  })
})
