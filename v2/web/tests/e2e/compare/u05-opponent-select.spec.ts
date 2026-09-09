// U05 · OS 选择对手（A5）— u05-opponent-select.feature 的可执行对应。
// test.step 覆盖 feature 的同名场景；连续动作与断言可合并在一个步骤中，
// feature 仍是行为叙述源。
//
// 移植（2026-08-25，#137/#138 合并后）：
//   · #138 修 #72——对战条按 initiatorIsMe === true 过滤：C09 口径同步、C09b
//     由预期红转绿；F6 修约战成功流——新增 C15 以桩拦截 POST /v1/challenges
//     断言「成功即关面板、直达第 ① 场实况」（真服全链路断言归 v34-pending）。
//   · 仍未修的审计缺口（版本下拉、#34 NPC 胜率、切侧、顶尖玩家/
//     自动匹配 tabs、侧抽屉观战、P1 阵容展示名）标 test.fixme 保留断言体，
//     台账见 fixme-u05.json——不为凑绿改断言。
//
// 账号纪律：一次 beforeAll 登录/注册，整档共用一个会话（AXIIA_U05_EMAIL 复用
// 方法一账号）；「另一玩家」优先取 AXIIA_U05_RIVAL_VERSION_ID，缺席才 API
// 注册唯一副账号（双侧齐备——#66① 对手玩家行按对侧 agent 圈定）。战斗预算：
// 仅「#78 自打」1 场（复核时用 `--grep-invert "消耗 1 场"` 跳过）。
import {
  type APIRequestContext,
  type BrowserContext,
  expect,
  type Page,
  request,
  test,
} from '@playwright/test'

import {
  baseURL,
  openBattlePanel,
  registrationCode,
  sameOrigin,
  signup,
} from '../helpers'

const SHANGYANG = 'shangyang-court'
const SCENARIO_TITLE = '商鞅变法·朝堂辩法'
const PASSWORD = 'playwrightpw-123456'

let ctx: BrowserContext
let page: Page
let agentA = 0
let agentB1 = 0
let agentB2 = 0
let versionV1 = 0
let versionV2 = 0
let entryVersionID = 0
let rivalVersionID = 0
let rivalName = ''

const dialog = () =>
  page.getByRole('dialog', {
    name: `出战 · ${SCENARIO_TITLE}`,
    exact: true,
  })

async function api<T>(
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await page.request.fetch(path, {
    method,
    headers: sameOrigin,
    data: data as Record<string, unknown> | undefined,
  })
  expect(response.ok(), `${method} ${path} -> ${response.status()}`).toBe(true)
  return await response.json() as T
}

interface MyAgentRow {
  agentID: number
  versionCount: number
}
interface VersionsPayload {
  versions: Array<{ id: number }>
  entryVersionID: number
}

// 故事线状态（幂等）：商鞅 A（2 版）、甘龙 B1、B2（各 1 版）。复用账号时
// 直接认领既有 agent，全新账号时经公开 API 补齐——UI 建构路径归 U01/U02，
// 本档只审 OS 面板。
async function ensureStoryline() {
  const models = await api<{ models: Array<{ id: string }> }>(
    'GET',
    '/v1/models',
  )
  const modelID = models.models.find((m) => m.id.includes('flash'))?.id ??
    models.models[0].id
  const save = (agentID: number, prompt: string) =>
    api('POST', `/v1/agents/${agentID}/save`, {
      prompt,
      modelID,
      parentVersionID: null,
    })

  const ensured = await api<{ agentID: number }>('POST', '/v1/agents/ensure', {
    scenarioID: SHANGYANG,
    side: 'a',
  })
  agentA = ensured.agentID
  let versions = await api<VersionsPayload>(
    'GET',
    `/v1/agents/${agentA}/versions`,
  )
  if (versions.versions.length < 1) {
    await save(agentA, '徙木立信：先立可验证的小承诺，再谈变法大义。')
  }
  if (versions.versions.length < 2) {
    await save(agentA, '第二版：把每条祖制引用都逼回可验证性上。')
    versions = await api<VersionsPayload>(
      'GET',
      `/v1/agents/${agentA}/versions`,
    )
  }
  versionV1 = versions.versions[0].id
  versionV2 = versions.versions[versions.versions.length - 1].id
  entryVersionID = versions.entryVersionID
  // The narrative fixes ★ on v1. Reused audit accounts may have moved it in a
  // previous exploratory run, so converge the fixture before asserting that a
  // v2 card is the explicitly requested (non-entry) version.
  if (entryVersionID !== versionV1) {
    await api('POST', `/v1/agents/${agentA}/entry/${versionV1}`)
    entryVersionID = versionV1
  }

  const ensuredB = await api<{ agentID: number }>('POST', '/v1/agents/ensure', {
    scenarioID: SHANGYANG,
    side: 'b',
  })
  agentB1 = ensuredB.agentID
  const b1Versions = await api<VersionsPayload>(
    'GET',
    `/v1/agents/${agentB1}/versions`,
  )
  if (b1Versions.versions.length === 0) {
    await save(agentB1, '甘龙 B1：以祖制不可轻变为纲，逐条要求过渡成本核算。')
  }

  const inventory = await api<{
    scenarios: Array<{ scenarioID: string; sides: { b: MyAgentRow[] } }>
  }>('GET', '/v1/my/agents')
  const bRows =
    inventory.scenarios.find((s) => s.scenarioID === SHANGYANG)?.sides.b ?? []
  const second = bRows.find((row) => row.agentID !== agentB1)
  if (second) {
    agentB2 = second.agentID
    if (second.versionCount === 0) {
      await save(agentB2, '甘龙 B2「激进」：直接攻击变法者的动机与授权来源。')
    }
  } else {
    const created = await api<{ agentID: number }>('POST', '/v1/agents', {
      scenarioID: SHANGYANG,
      side: 'b',
      name: null,
    })
    agentB2 = created.agentID
    await save(agentB2, '甘龙 B2「激进」：直接攻击变法者的动机与授权来源。')
  }
}

// 「另一玩家的版本 id」：优先环境注入（复用方法一的副账号），缺席才注册
// 唯一副账号 playwright-u05-b-<ts>（审计上限内的第二个账号）。
async function ensureRival() {
  rivalVersionID = Number(process.env.AXIIA_U05_RIVAL_VERSION_ID ?? 0)
  if (rivalVersionID > 0) {
    const ref = await api<{ ownerDisplayName: string }>(
      'GET',
      `/v1/versions/${rivalVersionID}/ref`,
    )
    rivalName = ref.ownerDisplayName
    return
  }
  const rival: APIRequestContext = await request.newContext({ baseURL })
  rivalName = '测试玩家 u05-b'
  const signupResponse = await rival.post('/v1/auth/signup', {
    headers: sameOrigin,
    data: {
      code: registrationCode,
      email: `playwright-u05-b-${Date.now()}@axiia.test`,
      phone: null,
      password: PASSWORD,
      displayName: rivalName,
    },
  })
  expect(signupResponse.ok(), 'rival signup succeeds').toBe(true)
  const models = await (await rival.get('/v1/models')).json() as {
    models: Array<{ id: string }>
  }
  const modelID = models.models.find((m) => m.id.includes('flash'))?.id ??
    models.models[0].id
  const ensure = await rival.post('/v1/agents/ensure', {
    headers: sameOrigin,
    data: { scenarioID: SHANGYANG, side: 'a' },
  })
  expect(ensure.ok()).toBe(true)
  const { agentID } = await ensure.json() as { agentID: number }
  const save = await rival.post(`/v1/agents/${agentID}/save`, {
    headers: sameOrigin,
    data: {
      prompt: 'U05 审计副账号版本（仅供按 id 查验，不参战）。',
      modelID,
      parentVersionID: null,
    },
  })
  expect(save.ok()).toBe(true)
  rivalVersionID = (await save.json() as { id: number }).id
  // #66①：「对手玩家」行按对侧可对战 agent 圈定——副账号乙侧也存一版
  // （双侧齐备），C11 的玩家行才会稳定出现。
  const ensureB = await rival.post('/v1/agents/ensure', {
    headers: sameOrigin,
    data: { scenarioID: SHANGYANG, side: 'b' },
  })
  expect(ensureB.ok()).toBe(true)
  const ensuredB = await ensureB.json() as { agentID: number }
  const saveB = await rival.post(`/v1/agents/${ensuredB.agentID}/save`, {
    headers: sameOrigin,
    data: {
      prompt: 'U05 审计副账号乙侧版本（凑双侧齐备，不参战）。',
      modelID,
      parentVersionID: null,
    },
  })
  expect(saveB.ok()).toBe(true)
  await rival.dispose()
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(300_000)
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
  ctx = await browser.newContext({ baseURL })
  page = await ctx.newPage()
  const reuseEmail = process.env.AXIIA_U05_EMAIL ?? ''
  if (reuseEmail) {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(reuseEmail)
    await page.getByLabel('密码').fill(PASSWORD)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForURL(/\/(express|scenarios|my-agents)/, {
      timeout: 60_000,
    })
  } else {
    await signup(page, 'u05')
  }
  await ensureStoryline()
  await ensureRival()
})

test.afterAll(async () => {
  await ctx?.close()
})

// Kept as a local alias to avoid obscuring the OS-focused scenarios below.
// Since the 2026-09-09 three-page amendment, the default panel opens from the
// selected entry version's card on Agent Home; the removed page-header button
// is never queried.
async function openFromHeader(agentID: number = agentA) {
  await openBattlePanel(page, agentID)
  await expect(dialog().getByText(`出战 · ${SCENARIO_TITLE}`)).toBeVisible()
}

// gate 桩（【桩】场景专用）：只改场景详情的 gateProgress/gateUnlocked，
// 让部署前端渲染解锁态表单；服务器状态与真实门槛不受影响。
async function mockGateMet() {
  await page.route(/\/scenarios\/shangyang-court\?side=/, async (route) => {
    const response = await route.fetch()
    const json = await response.json() as {
      summary: { gateUnlocked: boolean; gateProgress: unknown }
    }
    json.summary.gateUnlocked = true
    json.summary.gateProgress = {
      a: { beaten: 1, needed: 1 },
      b: { beaten: 1, needed: 1 },
    }
    await route.fulfill({ response, json })
  })
}

async function unmockAll() {
  await page.unroute(/\/scenarios\/shangyang-court\?side=/).catch(() => {})
  await page.unroute(/\/my\/agents/).catch(() => {})
  await page.unroute(/\/v1\/challenges$/).catch(() => {})
}

test('U05-C01：从主页版本卡呼出面板，桌面居中呈现', async () => {
  test.setTimeout(180_000)
  const v2Field = page.getByRole('button', { name: '用 v2 出战' })
  await test.step('当 我在商鞅 A 的主页 v2 版本卡点「出战」', async () => {
    await page.goto(`/agents/${agentA}`)
    await expect(v2Field).toBeVisible({ timeout: 30_000 })
    await v2Field.click()
  })
  await test.step('那么 弹出紧凑面板「出战 · 商鞅变法·朝堂辩法」（role=dialog，桌面居中）', async () => {
    await expect(dialog().getByText(`出战 · ${SCENARIO_TITLE}`)).toBeVisible()
    const box = await dialog().boundingBox()
    const viewport = page.viewportSize()!
    expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2))
      .toBeLessThan(80)
  })
  await test.step('并且 副标题标明出战版本（钉住点击的那一版，#88）', async () => {
    await expect(dialog().getByText(/出战版本：.*v2/)).toBeVisible()
  })
  await test.step('并且 左右方向键、Home 与 End 可在三个页签间移动并激活', async () => {
    const pve = dialog().getByRole('tab', { name: 'NPC 练习' })
    const hotseat = dialog().getByRole('tab', { name: '左右手互搏' })
    const pvp = dialog().getByRole('tab', { name: /玩家约战/ })
    await pve.focus()
    await page.keyboard.press('ArrowRight')
    await expect(hotseat).toBeFocused()
    await expect(hotseat).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(pve).toBeFocused()
    await expect(pve).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('End')
    await expect(pvp).toBeFocused()
    await expect(pvp).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Home')
    await expect(pve).toBeFocused()
    await expect(pve).toHaveAttribute('aria-selected', 'true')
  })
  await test.step('并且 焦点进入并困在面板内，Escape 关闭后回到 v2 出战按钮', async () => {
    const panel = dialog()
    await expect.poll(async () =>
      await panel.evaluate((node) => node.contains(document.activeElement))
    ).toBe(true)
    const focusable = panel.locator(
      ':is(button, a[href], input, select, textarea, [tabindex]):not(:disabled):not([tabindex="-1"]):not([aria-hidden="true"]):visible',
    )
    expect(await focusable.count()).toBeGreaterThan(1)
    await focusable.first().focus()
    await page.keyboard.press('Shift+Tab')
    await expect(focusable.last()).toBeFocused()
    await focusable.last().focus()
    await page.keyboard.press('Tab')
    await expect(focusable.first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(v2Field).toBeFocused()
  })
  await test.step('当 我改从主页的 ★参赛版本卡点「出战」；那么 同一面板弹出并钉住该版', async () => {
    await openFromHeader()
    await expect(dialog().getByText(/出战版本：★参赛版本 v1/)).toBeVisible()
  })
})

test('U05-C02：主页版本卡选择出战版本，面板不重复放己方版本下拉', async () => {
  test.setTimeout(180_000)
  await test.step('当 我从主页 v2 版本卡呼出面板', async () => {
    await openBattlePanel(page, agentA, 2)
  })
  await test.step('那么 副标题钉住 v2，面板不重复提供“选择出战版本”控件', async () => {
    await expect(dialog().getByText(/出战版本：.*v2/)).toBeVisible()
    await expect(
      dialog().getByRole('combobox', {
        name: /选择出战版本|己方版本/,
      }),
    ).toHaveCount(0)
  })
})

test('U05-C02b：钉住非 ★ 版本时副标题明确标为指定版本', async () => {
  test.setTimeout(180_000)
  await test.step('假如 A 的 ★ 在 v1', () => {
    expect(entryVersionID).toBe(versionV1)
    expect(versionV2).not.toBe(versionV1)
  })
  await test.step('当 我从 v2 卡「出战」呼出面板', async () => {
    await openBattlePanel(page, agentA, 2)
  })
  await test.step('那么 副标题明确写「出战版本：指定版本 v2」', async () => {
    await expect(dialog().getByText('出战版本：指定版本 v2', { exact: true }))
      .toBeVisible()
  })
})

test('U05-C03：执方由所选 agent 隐含，PVE 只列对手侧 NPC', async () => {
  test.setTimeout(180_000)
  const presetsOf = async (side: 'a' | 'b') => {
    const detail = await api<{
      presets: Array<{ key: string; side: string; label: string }>
    }>('GET', `/v1/scenarios/${SHANGYANG}?side=${side}`)
    return detail.presets
  }
  const optionLabels = async () => {
    await dialog().getByText('选择预设对手').click()
    const labels = await page.locator('[role="option"]').allTextContents()
    await page.keyboard.press('Escape')
    return labels
  }
  await test.step('当 面板从商鞅 A 呼出并停在「NPC 练习」；那么 面板内没有执方选择控件', async () => {
    await openFromHeader(agentA)
    await expect(dialog().getByText(/^(执方|切换执方)/)).toHaveCount(0)
  })
  await test.step('并且 预设对手下拉只列甘龙侧 NPC', async () => {
    const labels = await optionLabels()
    const presets = await presetsOf('a')
    const bLabels = presets.filter((p) => p.side === 'b').map((p) => p.label)
    expect(labels.length).toBe(bLabels.length)
    for (const label of bLabels) {
      expect(labels.some((text) => text.startsWith(label))).toBe(true)
    }
    await page.keyboard.press('Escape')
  })
  await test.step('当 面板改从甘龙 B1 呼出；那么 预设对手下拉只列商鞅侧 NPC', async () => {
    await openFromHeader(agentB1)
    const labels = await optionLabels()
    const presets = await presetsOf('b')
    const aLabels = presets.filter((p) => p.side === 'a').map((p) => p.label)
    expect(labels.length).toBe(aLabels.length)
    for (const label of aLabels) {
      expect(labels.some((text) => text.startsWith(label))).toBe(true)
    }
  })
})

// fixme(#34 NPC 胜率缺席): 按规格 A5/#34 应 每个 NPC 展示其两侧胜率战绩；待
// 服务端聚合 NPC 两侧胜率并在 PVE 预设行展示 修复后摘除。
test.fixme('U05-C03b：PVE 的 NPC 列表含两侧胜率（A5/#34——缺口未修）', async () => {
  test.setTimeout(180_000)
  await test.step('当 面板停在「NPC 练习」；那么 每个 NPC 展示其两侧胜率战绩', async () => {
    await openFromHeader(agentA)
    await expect(dialog().getByText(/胜率/)).not.toHaveCount(0)
  })
})

// fixme(A5 tabs 2/3 整体缺席): 按规格 U05-C05 / A5 应 tab 列表含「顶尖玩家」
// 与「自动匹配」；待 W11 评审通过并在 OS 面板落两 tab（或裁定砍掉并更新规格）
// 修复后摘除。
test.fixme('U05-C05：tabs 含「顶尖玩家」与「自动匹配」（A5——缺口未修，W11 未评审）', async () => {
  test.setTimeout(180_000)
  await test.step('当 面板呼出；那么 tab 列表含「顶尖玩家」与「自动匹配」', async () => {
    await openFromHeader()
    await expect(dialog().getByRole('tab', { name: 'NPC 练习' })).toBeVisible()
    await expect(dialog().getByRole('tab', { name: /顶尖玩家/ })).toBeVisible()
    await expect(dialog().getByRole('tab', { name: /自动匹配/ })).toBeVisible()
  })
})

test('U05-C06：PVP tab 锁定可见 + 按侧进度徽章', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我从未赢过 PVE（门槛未解锁）；那么 「玩家约战」tab 可见且带锁形图标', async () => {
    await openFromHeader()
    const pvpTab = dialog().getByRole('tab', { name: /玩家约战/ })
    await expect(pvpTab).toBeVisible()
    await expect(pvpTab.locator('svg.lucide-lock')).toHaveCount(1)
  })
  await test.step('当 我点开「玩家约战」；那么 内容区给出解锁口径文案与按侧进度徽章（商鞅 0/1 · 甘龙 0/1）', async () => {
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
    await expect(dialog().getByText(/解锁玩家约战/)).toBeVisible()
    await expect(dialog().getByText(/商鞅 0\/\d/)).toBeVisible()
    await expect(dialog().getByText(/甘龙 0\/\d/)).toBeVisible()
  })
})

// fixme(A5 切侧控件缺席): 按规格 U05-C04 / #62/#64 应 面板内有「切侧」控件可
// 切到我的对侧 agent；待 面板落「切侧」控件（或产品确认锁定态引导 + 我的
// 智能体为替代并更新规格） 修复后摘除。
test.fixme('U05-C04：面板提供「切侧」（A5——缺口未修，现行替代是锁定态引导与我的智能体）', async () => {
  test.setTimeout(180_000)
  await test.step('当 面板从商鞅 A 呼出；那么 面板内存在「切侧」控件可切到我的甘龙侧 agent', async () => {
    await openFromHeader()
    await expect(dialog().getByText('切侧')).toBeVisible()
  })
})

test('U05-C07：hotseat 对侧多 agent 时需选择打哪个', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我的甘龙侧有 B1、B2 两个智能体；当 我打开「左右手互搏」', async () => {
    await openFromHeader()
    await dialog().getByRole('tab', { name: '左右手互搏' }).click()
  })
  await test.step('那么 出现「选择你的对侧智能体」下拉，候选恰为 B1 与 B2', async () => {
    // Select 触发钮的可及名恒为 placeholder（ui/select aria-label）——按名取，
    // 不按 last()：对手列表在载入完成前 hotseat 里还没有这个下拉，last() 会
    // 抓到隐藏 tab 的 PVE 下拉（前次运行的 test-bug，修复后重跑一次）。
    const picker = dialog().getByRole('combobox', {
      name: '选择你的对侧智能体',
    })
    await picker.click()
    // portal 里的候选异步挂载：先等第一项出现再读全量（allTextContents 不
    // 自带等待——前次重跑读到空数组即此因）。
    await page.locator('[role="option"]').first().waitFor()
    const options = await page.locator('[role="option"]').allTextContents()
    await page.keyboard.press('Escape')
    expect(options).toHaveLength(2)
    expect(options.some((o) => o.includes(`#${agentB1}`))).toBe(true)
    expect(options.some((o) => o.includes(`#${agentB2}`))).toBe(true)
  })
  await test.step('并且 有一句对侧取版说明（对侧以其 ★参赛版本否则最新版出战）', async () => {
    await expect(dialog().getByText(/对侧将以其★参赛版本（否则最新版）出战/))
      .toBeVisible()
  })
})

test('U05-C08：未过 PVP 门槛也能自打（#78；消耗 1 场战斗预算）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 玩家约战门槛未解锁', async () => {
    const detail = await api<{ summary: { gateUnlocked: boolean } }>(
      'GET',
      `/v1/scenarios/${SHANGYANG}?side=a`,
    )
    expect(detail.summary.gateUnlocked).toBe(false)
  })
  await test.step('当 我在「左右手互搏」点「自打一场」；那么 派发成功并进入 /matches/:id 战报', async () => {
    await openFromHeader()
    await dialog().getByRole('tab', { name: '左右手互搏' }).click()
    await dialog().getByRole('button', { name: '自打一场' }).click()
    await page.waitForURL(/\/matches\/\d+/, { timeout: 60_000 })
    const matchID = /\/matches\/(\d+)/.exec(page.url())![1]
    console.log(`[U05-C08] hotseat matchID=${matchID}（战斗预算 1 场）`)
  })
  await test.step('并且 config 用量总场次 +1 而 PVP 场次不计（#78：占总配额、不占 PVP 配额）', async () => {
    const cfg = await api<{
      usage: { battlesToday: number; pvpBattlesToday: number }
    }>('GET', '/v1/config')
    expect(cfg.usage.battlesToday).toBeGreaterThanOrEqual(1)
    expect(cfg.usage.pvpBattlesToday).toBe(0)
  })
})

test('U05-C09：对战条当且仅当我发起的对局有进行中/刚完成时出现，且仅在派发处；可折叠', async () => {
  test.setTimeout(240_000)
  const strip = () => page.locator('section[aria-label="进行中的对战"]')
  let expected = false
  await test.step('那么 E 页、我的智能体、DA 三处的对战条可见性 ＝（我发起的对局中有进行中/15 分钟内完局）', async () => {
    const { matches } = await api<{
      matches: Array<{
        dispatched: boolean
        finished: boolean
        createdAt?: number | null
        finishedAt?: number | null
        initiatorIsMe?: boolean
      }>
    }>('GET', '/v1/matches')
    const now = Date.now()
    // #138：battle-strip 对归属失败关闭——只有 initiatorIsMe === true 才进条，
    // 可见性口径同步只看我发起的对局。
    expected = matches.some((m) =>
      m.initiatorIsMe === true &&
      ((m.dispatched && !m.finished && m.createdAt != null) ||
        (m.finished && m.finishedAt != null &&
          now - m.finishedAt * 1000 < 15 * 60_000))
    )
    for (
      const path of [
        `/agents/${agentA}/build`,
        '/my-agents',
        `/scenarios/${SHANGYANG}`,
      ]
    ) {
      await page.goto(path)
      if (expected) await expect(strip()).toBeVisible({ timeout: 40_000 })
      else {
        await page.waitForLoadState('networkidle').catch(() => {})
        await expect(strip()).toHaveCount(0)
      }
    }
  })
  await test.step('并且 场景目录与对战历史页从不出现对战条', async () => {
    for (const path of ['/scenarios', '/matches']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle').catch(() => {})
      await expect(strip()).toHaveCount(0)
    }
  })
  await test.step('当 条可见时我点它的折叠钮；那么 对局小卡收起（可再展开）', async () => {
    test.skip(!expected, '当前没有进行中/刚完成对局，折叠行为留待有卡时验证')
    await page.goto(`/agents/${agentA}/build`)
    await expect(strip()).toBeVisible({ timeout: 40_000 })
    await strip().locator('button').first().click()
    await expect(strip().locator('a[href^="/matches/"]')).toHaveCount(0)
    await strip().locator('button').first().click()
    await expect(strip().locator('a[href^="/matches/"]')).not.toHaveCount(0)
  })
})

// #138（对战条泄漏）已修：battle-strip 只收 initiatorIsMe === true——本场景由
// 预期红转绿；无他人对局可当样本时跳过（断言语义不变）。
test('U05-C09b：条上只装「你已发起」的对局（#72/A5——#138 已修）', async () => {
  test.setTimeout(180_000)
  let foreignIDs: number[] = []
  await test.step('假如 存在他人发起、仍在进行或刚完成的对局（initiatorIsMe=false）', async () => {
    const { matches } = await api<{
      matches: Array<{
        id: number
        finished: boolean
        dispatched: boolean
        createdAt?: number | null
        finishedAt?: number | null
        initiatorIsMe?: boolean
      }>
    }>('GET', '/v1/matches')
    const now = Date.now()
    foreignIDs = matches
      .filter((m) =>
        m.initiatorIsMe === false &&
        ((m.dispatched && !m.finished && m.createdAt != null) ||
          (m.finished && m.finishedAt != null &&
            now - m.finishedAt * 1000 < 15 * 60_000))
      )
      .map((m) => m.id)
    test.skip(
      foreignIDs.length === 0,
      '此刻没有他人发起的进行中/刚完成对局（或服务器无 initiatorIsMe）',
    )
  })
  await test.step('那么 我的对战条上不出现那张对局卡', async () => {
    await page.goto(`/agents/${agentA}/build`)
    const strip = page.locator('section[aria-label="进行中的对战"]')
    await strip.waitFor({ timeout: 40_000 }).catch(() => {})
    for (const id of foreignIDs) {
      await expect(strip.locator(`a[href="/matches/${id}"]`)).toHaveCount(0)
    }
  })
})

// fixme(A5 侧抽屉观战缺席): 按规格 U05-C10 / A5「侧抽屉可观战」应 点条上对局
// 卡以侧抽屉打开观战视图（留在派发处）；待 对战条对局卡改侧抽屉观战（或产品
// 裁定整页战报为替代并更新规格） 修复后摘除。
test.fixme('U05-C10：条上对局经侧抽屉观战（A5——缺口未修，现行整页跳转战报）', async () => {
  test.setTimeout(180_000)
  await test.step('当 我点条上的对局小卡；那么 以侧抽屉打开观战视图（留在派发处）', async () => {
    await page.goto(`/agents/${agentA}/build`)
    const strip = page.locator('section[aria-label="进行中的对战"]')
    await strip.waitFor({ timeout: 40_000 }).catch(() => {})
    test.skip(
      !(await strip.isVisible().catch(() => false)),
      '当前没有对局卡可点',
    )
    await strip.locator('a[href^="/matches/"]').first().click()
    // A5 字面：侧抽屉观战＝留在派发处；整页跳转 /matches/:id 即为偏差。
    await expect(page).toHaveURL(new RegExp(`/agents/${agentA}/build`))
  })
})

test('U05-C11：【桩】解锁态呈现双侧成对约战表单（#66；不派发）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 场景详情被桩改写为门槛已达标；当 我点开「玩家约战」', async () => {
    await mockGateMet()
    await openFromHeader()
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
  })
  await test.step('那么 头部「玩家约战已解锁」+ 双侧 ✓ 徽章', async () => {
    await expect(dialog().getByText('玩家约战已解锁')).toBeVisible()
    await expect(dialog().getByText(/商鞅 1\/1 ✓/)).toBeVisible()
    await expect(dialog().getByText(/甘龙 1\/1 ✓/)).toBeVisible()
  })
  await test.step('并且 「我的双侧出战阵容」注明 ① 我商鞅 vs 他甘龙 · ② 他商鞅 vs 我甘龙', async () => {
    await expect(
      dialog().getByText(
        /我的双侧出战阵容——① 我商鞅 vs 他甘龙 · ② 他商鞅 vs 我甘龙/,
      ),
    ).toBeVisible()
  })
  await test.step('并且 各侧下拉默认 ★参赛版本（未标记则最新版）（#91）', async () => {
    await expect(dialog().getByText('默认各侧 ★参赛版本（未标记则最新版）。'))
      .toBeVisible()
    // ★ 在 v1：执A 选择器默认应停在 v1（含 ★ 记号）。
    await expect(
      dialog().locator('[role="combobox"]').filter({ hasText: '★' }),
    ).not.toHaveCount(0)
  })
  await test.step('并且 子模式为「对手玩家」与「按 id 约战」', async () => {
    await expect(dialog().getByRole('button', { name: '对手玩家' }))
      .toBeVisible()
    await expect(dialog().getByRole('button', { name: '按 id 约战' }))
      .toBeVisible()
  })
  await test.step('并且 「对手玩家」列出可约战的对手玩家行与「发起双侧约战」按钮（不点击）', async () => {
    // 副账号 B 双侧齐备后应以「玩家」行出现（#66①，按 ownerAccountID 去重）。
    await expect(dialog().getByText(rivalName).first()).toBeVisible()
    await expect(
      dialog().getByRole('button', { name: '发起双侧约战' }).first(),
    ).toBeVisible()
  })
  await test.step('并且 脚注含「一次约战＝成对两场（①正/②反），每次成对约战计 2 场配额」（Q7）', async () => {
    await expect(
      dialog().getByText(
        /一次约战＝成对两场（①正\/②反），每次成对约战计 2\s*场配额/,
      ),
    )
      .toBeVisible()
  })
  await test.step('并且 脚注含「对方会收到通知，无需同意、不能拒绝」（#29）', async () => {
    await expect(dialog().getByText(/对方会收到通知，无需同意、不能拒绝/))
      .toBeVisible()
  })
})

// fixme(P1 阵容下拉仍是「#id · vN · 模型」): 按规格 P1 的 OS 落点应 阵容下拉
// 以策略展示名标示主标、id 降为小字；待 os-panel LineupOption.label 改为
// 策略展示名主标 + id 小字 修复后摘除。
test.fixme('U05-C11c：【桩】阵容下拉以策略展示名标示、id 降为小字（P1——缺口未修）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 场景详情被桩改写为门槛已达标；当 我点开「玩家约战」', async () => {
    await mockGateMet()
    await openFromHeader()
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
    await expect(dialog().getByText('玩家约战已解锁')).toBeVisible()
  })
  await test.step('那么 阵容下拉以策略展示名标示、id 降为小字（P1 的 OS 落点）', async () => {
    await expect(
      dialog().locator('[role="combobox"]').filter({ hasText: /商鞅|甘龙/ }),
    ).not.toHaveCount(0)
    await unmockAll()
  })
})

test('U05-C11b：【桩】发起方缺一侧时表单换成补侧引导（#66 双侧齐备）', async () => {
  test.setTimeout(180_000)
  await test.step('假如 我的甘龙侧被桩抹空（模拟单侧玩家）；当 我点开「玩家约战」', async () => {
    await mockGateMet()
    await page.route(/\/my\/agents/, async (route) => {
      const response = await route.fetch()
      const json = await response.json() as {
        scenarios: Array<{ scenarioID: string; sides: { b: unknown[] } }>
      }
      for (const s of json.scenarios) {
        if (s.scenarioID === SHANGYANG) s.sides.b = []
      }
      await route.fulfill({ response, json })
    })
    await openFromHeader()
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
  })
  await test.step('那么 出现「PVP 约战需双方双侧齐备」与成对语义解释', async () => {
    await expect(dialog().getByText('PVP 约战需双方双侧齐备')).toBeVisible()
    await expect(
      dialog().getByText(
        /一次约战＝两场（你的商鞅打他的甘龙，他的商鞅打你的甘龙）/,
      ),
    )
      .toBeVisible()
  })
  await test.step('并且 给出「去创建甘龙」引导按钮', async () => {
    await expect(dialog().getByRole('button', { name: /去创建甘龙/ }))
      .toBeVisible()
    await unmockAll()
  })
})

test('U05-C12：【桩】按 id 约战：校验、解析卡与钉版语义（真实查询；绝不点「发起双侧约战」）', async () => {
  test.setTimeout(180_000)
  const input = () => dialog().getByPlaceholder(/输入对方任一版本 id/)
  const lookup = async (value: string) => {
    await input().fill(value)
    await dialog().getByRole('button', { name: /^查询/ }).click()
  }
  await test.step('假如 存在另一玩家在本场景的版本 id；当 我切到「按 id 约战」', async () => {
    expect(rivalVersionID).toBeGreaterThan(0)
    await mockGateMet()
    await openFromHeader()
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
    await dialog().getByRole('button', { name: '按 id 约战' }).click()
  })
  await test.step('那么 输入框占位注明「输入对方任一版本 id（战报页可复制）」（#25 发现路径）', async () => {
    await expect(input()).toBeVisible()
  })
  await test.step('当 我查询非数字；那么 得到「请输入数字版本 id」', async () => {
    await lookup('abc')
    await expect(dialog().getByText(/请输入数字版本 id/)).toBeVisible()
  })
  await test.step('当 我查询不存在的 id；那么 得到「未找到该版本 id」', async () => {
    await lookup('99999999')
    await expect(dialog().getByText('未找到该版本 id')).toBeVisible()
  })
  await test.step('当 我查询对方真实版本 id；那么 解析卡展示 对方昵称 · 场景 · 执方 · 模型 · v#id', async () => {
    await lookup(String(rivalVersionID))
    await expect(dialog().getByText(rivalName).first()).toBeVisible()
    await expect(
      dialog().getByText(
        new RegExp(`执[AB]（(商鞅|甘龙)）.*v#${rivalVersionID}`),
      ),
    )
      .toBeVisible()
  })
  await test.step('并且 注明按 id 钉住该侧版本、另一侧取对方 ★参赛版（否则最新版）', async () => {
    await expect(dialog().getByText(/按 id 钉住其/)).toBeVisible()
    await expect(dialog().getByText(/另一侧取对方★参赛版（否则最新版）/))
      .toBeVisible()
  })
  await test.step('并且 存在「发起双侧约战」按钮（本审计不点击）', async () => {
    await expect(dialog().getByRole('button', { name: '发起双侧约战' }))
      .toBeVisible()
    await unmockAll()
  })
})

test('U05-C12b：【桩】按 id 查询结果只属于当前输入，旧响应不能替换付费对手', async () => {
  test.setTimeout(180_000)
  const input = () => dialog().getByPlaceholder(/输入对方任一版本 id/)
  let releaseOld!: () => void
  const oldGate = new Promise<void>((resolve) => {
    releaseOld = resolve
  })
  let sawOld!: () => void
  const oldSeen = new Promise<void>((resolve) => {
    sawOld = resolve
  })
  let finishOld!: () => void
  const oldFinished = new Promise<void>((resolve) => {
    finishOld = resolve
  })
  await test.step('假如 对方真实版本 id 的查询响应被延迟', async () => {
    await mockGateMet()
    await page.route(
      new RegExp(`/v1/versions/${rivalVersionID}/ref$`),
      async (route) => {
        sawOld()
        await oldGate
        const response = await route.fetch()
        await route.fulfill({ response })
        finishOld()
      },
    )
    await openFromHeader()
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
    await dialog().getByRole('button', { name: '按 id 约战' }).click()
    await input().fill(String(rivalVersionID))
    await dialog().getByRole('button', { name: /^查询/ }).click()
    await oldSeen
  })

  await test.step('当 我在旧响应返回前改填不存在的 id 并查询', async () => {
    await input().fill('99999999')
    await dialog().getByRole('button', { name: /^查询/ }).click()
  })

  await test.step('那么 当前输入得到“未找到”，且没有旧版本解析卡', async () => {
    await expect(dialog().getByText('未找到该版本 id')).toBeVisible()
    await expect(dialog().getByText(rivalName)).toHaveCount(0)
  })

  await test.step('当 旧查询最终返回', async () => {
    const oldResponse = page.waitForResponse(
      new RegExp(`/v1/versions/${rivalVersionID}/ref$`),
    )
    releaseOld()
    const [response] = await Promise.all([oldResponse, oldFinished])
    await response.finished()
    // Let the response promise and any resulting React render fully settle before
    // asserting that the stale payload was ignored.
    await page.evaluate(() =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    )
  })

  await test.step('那么 旧玩家卡仍不出现，也不能向旧 id 发起约战', async () => {
    await expect(dialog().getByText('未找到该版本 id')).toBeVisible()
    await expect(dialog().getByText(rivalName)).toHaveCount(0)
    await expect(dialog().getByRole('button', { name: '发起双侧约战' }))
      .toHaveCount(0)
    await page.unroute(
      new RegExp(`/v1/versions/${rivalVersionID}/ref$`),
    )
    await unmockAll()
  })
})

// F6（#137）：约战成功流与 PVE/互搏一致——成功即关面板、站内直达第 ① 场
// 实况；面板内成功块只作服务器缺 matchIDs 的回退。真派发消耗 2 场配额且需
// 真解锁，这里以桩拦截 POST /v1/challenges 只断言前端成功流（真服全链路
// 断言见 tests/e2e/v34-pending.spec.ts）。
test('U05-C15：【桩】发起双侧约战成功后直达第 ① 场实况（F6；桩拦截派发）', async () => {
  test.setTimeout(180_000)
  const stubLegs = [990101, 990102] as const
  await test.step('假如 门槛桩达标且约战派发被桩拦截（不真正入队）', async () => {
    await mockGateMet()
    await page.route(/\/v1\/challenges$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challengeID: stubLegs[0],
          matchIDs: [...stubLegs],
        }),
      })
    })
  })
  await test.step('当 我按 id 解析对方版本并点「发起双侧约战」', async () => {
    await openFromHeader()
    await dialog().getByRole('tab', { name: /玩家约战/ }).click()
    // 等阵容载入完（默认取版脚注出现）——picks 未就位时按钮 disabled。
    await expect(dialog().getByText('默认各侧 ★参赛版本（未标记则最新版）。'))
      .toBeVisible()
    await dialog().getByRole('button', { name: '按 id 约战' }).click()
    await dialog().getByPlaceholder(/输入对方任一版本 id/).fill(
      String(rivalVersionID),
    )
    await dialog().getByRole('button', { name: /^查询/ }).click()
    await expect(dialog().getByText(rivalName).first()).toBeVisible()
    await dialog().getByRole('button', { name: '发起双侧约战' }).click()
  })
  await test.step('那么 面板关闭并直达第 ① 场实况 /matches/<leg1>（与 PVE/互搏一致）', async () => {
    await expect(page).toHaveURL(new RegExp(`/matches/${stubLegs[0]}$`))
    await expect(dialog()).toHaveCount(0)
    await unmockAll()
  })
})

test('U05-C14：移动视口下面板为底部弹层', async () => {
  test.setTimeout(180_000)
  await test.step('当 视口为 390×844 且面板呼出；那么 面板贴屏幕底部（底部弹层），而非居中', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openFromHeader()
    const box = await dialog().boundingBox()
    expect(Math.abs(box!.y + box!.height - 844)).toBeLessThan(4)
    await page.setViewportSize({ width: 1280, height: 800 })
  })
})
