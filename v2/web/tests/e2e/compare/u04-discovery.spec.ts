// U04 discovery — u04-discovery.feature 的可执行对应（BDD：每个 test.step 的
// 文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4 §A4：D 页 #37/#38/#39/#40/#54 · DA 四层与内容基线 · #42/#26 计分 ·
// #51 W2 六字段 · P13 侧卡按钮组。红测试若如实反映 dev 与规格的差异，红本身
// 就是交付物——不许为了变绿而放宽断言。
//
// 安全约束：本单元至多 1 个账号（固定邮箱，先登录后注册）；至多 1 个 0 版本
// 一次性智能体（P13 判定）；不派发任何对局；不触碰管理端点。
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import { registrationCode, sameOrigin } from '../helpers'

const SHANGYANG = 'shangyang-court'
const SCENARIO_TITLE = '商鞅变法·朝堂辩法'
// 固定邮箱（与旅程脚本、重试脚本共用）——保证全单元至多注册一次。注册码
// 耗尽期间可经 AXIIA_U04_EMAIL/AXIIA_U04_PASSWORD 借用协调者指定的既有账号，
// 此时必须同时设 AXIIA_U04_READONLY=1：只读浏览，不创建/改动任何东西。
const UNIT_EMAIL = process.env.AXIIA_U04_EMAIL ??
  'playwright-u04-1786860000000@axiia.test'
const UNIT_PASSWORD = process.env.AXIIA_U04_PASSWORD ?? 'playwrightpw-123456'
const READ_ONLY = process.env.AXIIA_U04_READONLY === '1'

interface CatalogScenario {
  id: string
  title: string
  onlineAt?: number | null
}

let context: BrowserContext
let page: Page

// 背景：先尝试登录（账号可能已由旅程/重试脚本注册过），失败再走注册页。
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
  expect(
    READ_ONLY,
    '借来的只读账号登录失败时绝不能转注册（那会盗用其身份注册新号）',
  ).toBe(false)
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
  await target.goto('/register')
  await target.getByLabel('注册码').fill(registrationCode)
  await target.getByLabel('昵称').fill('测试玩家 u04')
  await target.getByLabel('邮箱').fill(UNIT_EMAIL)
  await target.getByLabel('密码').fill(UNIT_PASSWORD)
  await target.getByRole('button', { name: '创建账户' }).click()
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

async function cardTexts(): Promise<string[]> {
  const cards = page.locator('[data-testid^="scenario-"]')
  const count = await cards.count()
  const texts: string[] = []
  for (let index = 0; index < count; index++) {
    texts.push(await cards.nth(index).innerText())
  }
  return texts
}

async function expandDeep() {
  const deep = page.getByText('深读 · 背景故事与隐藏目标玩法')
  await expect(deep).toBeVisible()
  await deep.click()
  await expect(page.getByText('背景故事', { exact: true })).toBeVisible()
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

test('U04-C01/C02/C04：D 页每卡一句话介绍 + 统计钩子（点亮或空态），难度/时长/适合新手', async () => {
  test.setTimeout(180_000)
  let texts: string[] = []
  await test.step('假如 我打开场景列表页', async () => {
    await gotoCatalog()
    texts = await cardTexts()
  })
  await test.step('那么 至少有一张场景卡', () => {
    expect(texts.length).toBeGreaterThan(0)
  })
  await test.step('并且 每张卡都有标题和一句话介绍', () => {
    for (const text of texts) {
      // 标题行 + 至少一行介绍（subject）——空卡视为违约。
      expect(text.trim().split('\n').length).toBeGreaterThanOrEqual(2)
    }
  })
  await test.step('并且 每张卡的统计槽位：有数据则显示「侧方胜率 · N 场 · 两侧胜率」，未过门槛则显示引导式空态「数据积累中」', () => {
    for (const text of texts) {
      const lit = /侧方胜率/.test(text) && /\d+ 场 ·/.test(text)
      const outline = /数据积累中/.test(text)
      expect(
        lit || outline,
        `每张卡都要有统计槽位（点亮或空态轮廓），这张两者皆无：${
          text.slice(0, 60)
        }`,
      ).toBe(true)
    }
  })
  await test.step('并且 没有任何卡显示「0 场」这类零数字假统计', () => {
    for (const text of texts) {
      expect(text, '未过门槛不摆零数字（#54）').not.toMatch(/(^|[^\d])0 场/)
    }
  })
  await test.step('那么 每张卡都显示「难度」三档标识', () => {
    // #40「卡片传达：难度…预计一场时长」是逐卡契约，不是「至少一张」。
    for (const text of texts) {
      expect(text, '每张卡都要传达难度（#40）').toMatch(/难度/)
    }
  })
  await test.step('并且 每张卡都显示「约 N 分钟」预计时长', () => {
    for (const text of texts) {
      expect(text, '每张卡都要传达预计时长（#40）').toMatch(/约 \d+ 分钟/)
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
    const texts = await cardTexts()
    for (const text of texts) {
      expect(text).not.toContain('去构建')
    }
  })
  await test.step('当 我点「商鞅变法·朝堂辩法」的卡片', async () => {
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
  await test.step('那么 页内没有任何文本编辑框', async () => {
    await expect(page.locator('textarea')).toHaveCount(0)
  })
  await test.step('并且 页面写明「本页只讲规则，不设编辑框」', async () => {
    await expect(page.getByText('本页只讲规则，不设编辑框', { exact: false }))
      .toBeVisible()
  })
})

test('U04-C08：四层渐进骨架齐全，深读默认收起', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 自上而下依次是「一眼看懂」「双方与胜利条件」「裁判与计分」「深读」四层', async () => {
    await expect(page.getByText('一眼看懂')).toBeVisible()
    await expect(page.getByText('双方与胜利条件')).toBeVisible()
    await expect(page.getByText('裁判与计分 · 谁来判、怎么算分')).toBeVisible()
    await expect(page.getByText('深读 · 背景故事与隐藏目标玩法')).toBeVisible()
  })
  await test.step('并且 「裁判与计分」层默认展开', async () => {
    await expect(page.getByText('裁判是谁 · 怎么判')).toBeVisible()
  })
  await test.step('并且 「深读」层默认收起——背景故事此刻不可见', async () => {
    await expect(page.getByText('背景故事', { exact: true })).toBeHidden()
  })
  await test.step('当 我点开「深读」层；那么 背景故事与隐藏目标玩法出现', async () => {
    await expandDeep()
    await expect(page.getByText('隐藏目标怎么玩')).toBeVisible()
  })
})

test('U04-C09：侧方胜率上移到 GLANCE 层（#38）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 「一眼看懂」卡内出现「侧方胜率」——有数据点亮，无数据为空态轮廓', async () => {
    const glance = page.locator('div.space-y-3', { hasText: '一眼看懂' })
    await expect(glance.getByText('侧方胜率')).toBeVisible()
  })
})

test('U04-C10：内容基线八项齐备', async () => {
  test.setTimeout(120_000)
  // 手风琴是单开的：点开「深读」会收起「裁判与计分」——所以分两次取可见
  // 文本（默认态 + 深读态）合并断言，谁的内容都不落下。
  let combined = ''
  await test.step('假如 我打开商鞅场景的 DA 页并点开「深读」层', async () => {
    await gotoDA()
    combined = await page.locator('body').innerText()
    await expandDeep()
    combined += '\n' + await page.locator('body').innerText()
  })
  await test.step('那么 页面包含：背景故事、双方胜利条件、双方是谁（甲方/乙方）、裁判摘要、评判什么、隐藏目标玩法、计分规则、预计时长', () => {
    expect(combined).toContain('背景故事')
    expect(combined).toContain('胜利条件')
    expect(combined).toContain('甲方')
    expect(combined).toContain('乙方')
    expect(combined).toContain('裁判是谁 · 怎么判')
    expect(combined).toContain('隐藏目标怎么玩')
    expect(combined).toContain('计分规则')
    expect(combined).toMatch(/一场约 \d+ 分钟/)
  })
  await test.step('并且 裁判 prompt 原文可见（基线「裁判 prompt + 摘要」；#51 只豁免 judgeOsPrompt）', () => {
    expect(combined, '基线要求裁判 prompt 全文 + 摘要，页面只有摘要')
      .toMatch(/裁判提示词|裁判 prompt|prompt 原文/)
  })
})

test('U04-C11：计分来自场景数据、精确权重公开（#42/#26）', async () => {
  test.setTimeout(180_000)
  let shangyangScoring = ''
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 「计分规则」段落给出带数字的精确权重', async () => {
    const scoring = page.locator('p:text-is("计分规则") + p')
    await expect(scoring).toBeVisible()
    shangyangScoring = await scoring.innerText()
    expect(shangyangScoring, '精确权重全公开（#26）：计分文本必须含数值')
      .toMatch(/\d/)
  })
  await test.step('当 我打开目录里另一个场景的 DA 页；那么 那里的计分内容与商鞅场景不同——计分不是页面硬编码', async () => {
    const response = await page.request.get('/v1/scenarios')
    expect(response.ok()).toBe(true)
    const { scenarios } = await response.json() as {
      scenarios: CatalogScenario[]
    }
    const other = scenarios.find((item) => item.id !== SHANGYANG)
    expect(other, '目录里需要第二个场景来证明计分非硬编码').toBeTruthy()
    await gotoDA(other!.id)
    const body = await page.locator('body').innerText()
    expect(body).not.toContain(shangyangScoring.slice(0, 30))
  })
})

test('U04-C12：隐藏目标机制对人公开', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页并点开「深读」层', async () => {
    await gotoDA()
    await expandDeep()
  })
  await test.step('那么 「隐藏目标怎么玩」小节存在并明说机制', async () => {
    await expect(page.getByText('隐藏目标怎么玩')).toBeVisible()
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/真目标|隐藏目标/)
  })
})

test('U04-C13：EXPAND-1 增补可选立场/请求项与开场白（#51）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  await test.step('那么 双方层给出可选立场或请求项', async () => {
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/可选入场角色|可选立场|请求项|请求/)
  })
  await test.step('并且 双方层给出开场白', async () => {
    await expect(
      page.getByText('开场白'),
      'W2/#51：EXPAND-1 应含双方开场白',
    ).toBeVisible()
  })
})

test('U04-C14：EXPAND-2 增补真假概况、问询方式、轮数、阶段结构（#51）', async () => {
  test.setTimeout(120_000)
  await test.step('假如 我打开商鞅场景的 DA 页', async () => {
    await gotoDA()
  })
  // 深读保持收起：以下断言只认 EXPAND-2（裁判与计分层，默认展开）里可见的
  // 文本——放进 DEEP 层的不算数（#51 把这四项分配给 EXPAND-2）。
  await test.step('那么 裁判与计分层交代隐藏信息真假配置概况', async () => {
    await expect(page.getByText(/真假|假请求|真目标/).first()).toBeVisible()
  })
  await test.step('并且 裁判与计分层交代赛后问询方式', async () => {
    await expect(page.getByText(/问询|独问/).first()).toBeVisible()
  })
  await test.step('并且 页面交代对话轮数', async () => {
    await expect(page.getByText(/\d+ 轮/).first()).toBeVisible()
  })
  await test.step('并且 「对局流程」列出阶段结构', async () => {
    await expect(page.getByText('对局流程')).toBeVisible()
  })
})

test('U04-C15：DEEP 增补裁判/计分模型；judgeOsPrompt 不公开（#51）', async () => {
  test.setTimeout(120_000)
  // 单开手风琴：裁判摘要在默认态可见、深读内容在点开后可见——合并两态文本。
  let combined = ''
  await test.step('假如 我打开商鞅场景的 DA 页并点开「深读」层', async () => {
    await gotoDA()
    combined = await page.locator('body').innerText()
    await expandDeep()
    combined += '\n' + await page.locator('body').innerText()
  })
  await test.step('那么 页面交代裁判/计分所用模型', () => {
    expect(combined, 'W2/#51：DA 应交代裁判/计分模型').toMatch(
      /裁判模型|计分模型/,
    )
  })
  await test.step('并且 场景详情接口的返回里没有 judgeOsPrompt 字段', async () => {
    const response = await page.request.get(`/v1/scenarios/${SHANGYANG}?side=a`)
    expect(response.ok()).toBe(true)
    expect(await response.text(), '#51：judgeOsPrompt 维持不公开')
      .not.toMatch(/judgeOs/i)
  })
})

test('U04-C16：叙事 ↔ 原始规则切换保留', async () => {
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
  // 再断言 DA 侧卡与之一致——只读账号（借用）也能验 P13 的两种形态。
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
    if (READ_ONLY) {
      // 借来的账号禁止创建智能体——按钮组切换的后半段只能等注册码复活。
      test.info().annotations.push({
        type: 'partial',
        description:
          'READ_ONLY：不创建智能体，「去构建 → 再建一个/查看我的」切换未验',
      })
    } else {
      await test.step('当 我点甲方「去构建」（本单元唯一一次性智能体，0 版本，不派发对局）', async () => {
        await buildA.click()
        await expect(page).toHaveURL(/\/agents\/\d+\/build/)
      })
      await test.step('并且 我回到 DA 页', async () => {
        await gotoDA()
      })
      countA = 1
    }
  }
  if (countA > 0) {
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
  }
  await test.step('并且 无策略的一侧仍显示「去构建」', async () => {
    if (countB === 0) {
      await expect(page.getByTestId('build-agent-b')).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: '再建一个甘龙' }))
        .toBeVisible()
    }
  })
})
