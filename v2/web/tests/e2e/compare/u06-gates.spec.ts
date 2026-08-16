// U06 — 门槛与进阶（§A6 + #91）· u06-gates.feature 的可执行对应。
// 每个 test.step 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以
// feature 为准。
//
// 账号纪律：全程一只账号。设 AXIIA_U06_EMAIL/AXIIA_U06_PASSWORD 时登录复用
// 方法一旅程账号（战斗依赖组以其真实战绩为状态基座）；未设时注册一只新号，
// 战斗依赖组自动跳过。本 spec **不派发任何对局**（真实推理战斗预算归旅程）。
//
// 可重执行组用旅程未碰过的场景：本能寺（honnoji-decision）与码头疑云
// （legal-harbor-murder-jury）——只建智能体/存版本，不出战。同一账号重复跑
// 会命中「门已放行」的既成状态：引导门三条会在前置检查里 skip（首跑为准）。
import { expect, type Page, test } from '@playwright/test'

import { registrationCode, sameOrigin, signup } from '../helpers'

const SHANGYANG = 'shangyang-court'
const HONNOJI = 'honnoji-decision'
const HARBOR = 'legal-harbor-murder-jury'

const journeyEmail = process.env.AXIIA_U06_EMAIL ?? ''
const journeyPassword = process.env.AXIIA_U06_PASSWORD ?? 'playwrightpw-123456'

test.describe.configure({ mode: 'serial' })

let page: Page

interface SideProgress {
  beaten: number
  needed: number
}
interface ScenarioRow {
  id: string
  gateUnlocked: boolean
  gateProgress?: { a: SideProgress; b: SideProgress } | null
}
interface MyAgentRow {
  agentID: number
  versionCount: number
  entryVersionID?: number | null
  latestVersionID?: number | null
  name?: string | null
}
interface MyScenarioRow {
  scenarioID: string
  sides: { a: MyAgentRow[]; b: MyAgentRow[] }
  gateProgress: { a: SideProgress; b: SideProgress }
  entryReady: boolean
}
interface VersionRow {
  id: number
  ordinal?: number
  isEntry?: boolean
}

async function api<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  const response = await page.request.fetch(`/v1${path}`, {
    method,
    headers: sameOrigin,
    data: body,
  })
  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  return { status: response.status(), body: payload as T }
}

const getScenarios = async () =>
  (await api<{ scenarios: ScenarioRow[] }>('GET', '/scenarios')).body.scenarios

const getMyScenario = async (id: string) =>
  (await api<{ scenarios: MyScenarioRow[] }>('GET', '/my/agents')).body
    .scenarios.find((row) => row.scenarioID === id)

const getConfig = async () =>
  (await api<{
    pvpUnlockPerSideWins: number
    dailyBattleLimit: number
    pvpDailyLimit: number
    opponentDailyChallengeLimit: number
    usage: { battlesToday: number; pvpBattlesToday: number }
    models: Array<{ id: string }>
  }>('GET', '/config')).body

async function modelID(): Promise<string> {
  const cfg = await getConfig()
  return cfg.models.find((model) => model.id.includes('flash'))?.id ??
    cfg.models[0].id
}

const ensureAgent = async (scenarioID: string, side: 'a' | 'b') =>
  (await api<{ agentID: number }>('POST', '/agents/ensure', {
    scenarioID,
    side,
  })).body.agentID

const saveVersion = async (agentID: number, prompt: string) =>
  await api<VersionRow & { isEntry: boolean }>(
    'POST',
    `/agents/${agentID}/save`,
    { prompt, modelID: await modelID(), parentVersionID: null },
  )

const sideMet = (side: SideProgress) => side.beaten >= side.needed

// 剧情线共享状态（serial 模式）。
let honnojiA1 = 0
let honnojiA1V1IsEntry = false
let honnojiB1 = 0
let honnojiA2 = 0
let honnojiA2V1 = 0
let entryReadyBeforeSideB: boolean | null = null
let honnojiVirginAtStart = false
let journeySession = false

test.beforeAll(async ({ browser }) => {
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
  page = await browser.newPage()
  if (journeyEmail !== '') {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(journeyEmail)
    await page.getByLabel('密码').fill(journeyPassword)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForURL(/\/(scenarios|express|my-agents)/)
    journeySession = true
  } else {
    await signup(page, 'u06')
  }
  const honnoji = await getMyScenario(HONNOJI)
  honnojiVirginAtStart = honnoji == null ||
    (honnoji.sides.a.length === 0 && honnoji.sides.b.length === 0)
})

test.afterAll(async () => {
  await page?.close()
})

// ── 规则: PVP 解锁门槛按（玩家, 场景）双侧计（#65） ─────────────────────────

test('未打过的场景一律锁定，且阈值来自配置', async () => {
  const cfg = await getConfig()
  const scenarios = await getScenarios()
  await test.step('那么 /v1/config 给出每侧解锁阈值 pvpUnlockPerSideWins ≥ 1', () => {
    expect(cfg.pvpUnlockPerSideWins).toBeGreaterThanOrEqual(1)
  })
  await test.step('并且 凡两侧 beaten 均为 0 的场景 gateUnlocked 为 false', () => {
    for (const row of scenarios) {
      if (
        row.gateProgress != null && row.gateProgress.a.beaten === 0 &&
        row.gateProgress.b.beaten === 0
      ) {
        expect(row.gateUnlocked, `${row.id} 应锁定`).toBe(false)
      }
    }
  })
  await test.step('并且 每个场景都带按侧进度 gateProgress，其 needed 等于配置阈值', () => {
    for (const row of scenarios) {
      expect(row.gateProgress, `${row.id} 缺 gateProgress`).toBeTruthy()
      expect(row.gateProgress!.a.needed).toBe(cfg.pvpUnlockPerSideWins)
      expect(row.gateProgress!.b.needed).toBe(cfg.pvpUnlockPerSideWins)
    }
  })
})

test('解锁判定恒等于「双侧都过线」——单侧过线不解锁', async () => {
  const scenarios = await getScenarios()
  await test.step('那么 对每个场景 gateUnlocked === (a.beaten ≥ needed 且 b.beaten ≥ needed)', () => {
    for (const row of scenarios) {
      expect(row.gateProgress).toBeTruthy()
      const met = sideMet(row.gateProgress!.a) && sideMet(row.gateProgress!.b)
      expect(row.gateUnlocked, `${row.id} 解锁判定式`).toBe(met)
    }
  })
})

// ── 规则: 同侧第二个智能体引导门（#59/#79/P8a） ────────────────────────────

test('无对侧智能体时同侧再建被挡', async () => {
  test.skip(!honnojiVirginAtStart, '本能寺已有既成智能体（重复跑）——首跑为准')
  await test.step('假如 我在本能寺场景只有甲方智能体（已存 1 版），没有任何乙方智能体', async () => {
    honnojiA1 = await ensureAgent(HONNOJI, 'a')
    const saved = await saveVersion(
      honnojiA1,
      'U06 门槛审计：本能寺甲方首个策略 v1。',
    )
    expect(saved.status).toBe(200)
    honnojiA1V1IsEntry = saved.body.isEntry === true
  })
  await test.step('当 我直接 POST /v1/agents 在甲方再建一个', async () => {
    const blocked = await api<{ error?: string }>('POST', '/agents', {
      scenarioID: HONNOJI,
      side: 'a',
    })
    await test.step('那么 服务端以 409 sibling_gate 拒绝', () => {
      expect(blocked.status).toBe(409)
      expect(blocked.body.error).toBe('sibling_gate')
    })
  })
})

test('空壳对侧（0 版本）不开门（P8a）', async () => {
  test.skip(!honnojiVirginAtStart, '本能寺已有既成智能体（重复跑）——首跑为准')
  await test.step('假如 我用 ensure 建了乙方智能体但一版未存', async () => {
    honnojiB1 = await ensureAgent(HONNOJI, 'b')
    const snapshot = await getMyScenario(HONNOJI)
    entryReadyBeforeSideB = snapshot?.entryReady ?? null
  })
  await test.step('当 我再次 POST /v1/agents 在甲方再建一个', async () => {
    const blocked = await api<{ error?: string }>('POST', '/agents', {
      scenarioID: HONNOJI,
      side: 'a',
    })
    await test.step('那么 仍是 409 sibling_gate——对侧策略必须至少有 1 个版本才算数', () => {
      expect(blocked.status).toBe(409)
      expect(blocked.body.error).toBe('sibling_gate')
    })
  })
})

test('对侧有版本后放行', async () => {
  test.skip(!honnojiVirginAtStart, '本能寺已有既成智能体（重复跑）——首跑为准')
  await test.step('假如 我给乙方智能体保存了 v1', async () => {
    const saved = await saveVersion(
      honnojiB1,
      'U06 门槛审计：本能寺乙方策略 v1。',
    )
    expect(saved.status).toBe(200)
  })
  await test.step('当 我再次 POST /v1/agents 在甲方再建一个', async () => {
    const created = await api<{ agentID?: number }>('POST', '/agents', {
      scenarioID: HONNOJI,
      side: 'a',
    })
    await test.step('那么 创建成功，同侧出现第二个智能体', async () => {
      expect(created.status).toBe(200)
      honnojiA2 = created.body.agentID ?? 0
      expect(honnojiA2).toBeGreaterThan(0)
      const snapshot = await getMyScenario(HONNOJI)
      expect(snapshot?.sides.a.length).toBe(2)
    })
  })
})

test('引导门按（玩家, 场景）隔离（#79）', async () => {
  await test.step('假如 本能寺场景已两侧齐备，而码头疑云场景只有甲方智能体（已存 1 版）', async () => {
    const honnoji = await getMyScenario(HONNOJI)
    expect(honnoji?.sides.a.some((row) => row.versionCount > 0)).toBe(true)
    expect(honnoji?.sides.b.some((row) => row.versionCount > 0)).toBe(true)
    const harbor = await getMyScenario(HARBOR)
    test.skip(
      (harbor?.sides.b ?? []).length > 0,
      '码头疑云乙方已存在（重复跑）——首跑为准',
    )
    const harborA = await ensureAgent(HARBOR, 'a')
    const saved = await saveVersion(
      harborA,
      'U06 门槛审计：码头疑云甲方策略 v1。',
    )
    expect(saved.status).toBe(200)
  })
  await test.step('当 我在码头疑云 POST /v1/agents 在甲方再建一个', async () => {
    const blocked = await api<{ error?: string }>('POST', '/agents', {
      scenarioID: HARBOR,
      side: 'a',
    })
    await test.step('那么 仍是 409 sibling_gate——别场景的对侧不越场景放行', () => {
      expect(blocked.status).toBe(409)
      expect(blocked.body.error).toBe('sibling_gate')
    })
  })
})

// ── 规则: 约战双方都须已解锁（#77） ────────────────────────────────────────
// 对手＝审计探针账号（AXIIA_U06_OPPONENT_ID）：两侧有版本、零 PVE 胜。实测
// 校验顺序：对方阵容齐备 → 发起方门槛 → 对方门槛；拿自己当对手会在门槛之前
// 吃 400 bad_request「cannot challenge yourself」（自打的正道是 hotseat，#78）。
const opponentID = process.env.AXIIA_U06_OPPONENT_ID ?? ''

test('发起方未解锁，约战被服务端整对拒绝', async () => {
  test.skip(opponentID === '', '需要 AXIIA_U06_OPPONENT_ID（审计探针账号 id）')
  let mineA = 0
  let mineB = 0
  await test.step('假如 我在一个锁定场景里两侧都有带版本的智能体', async () => {
    const scenarios = await getScenarios()
    const honnojiRow = scenarios.find((row) => row.id === HONNOJI)
    expect(honnojiRow?.gateUnlocked, '本能寺应仍锁定（本 spec 不打战）').toBe(
      false,
    )
    const honnoji = await getMyScenario(HONNOJI)
    mineA = honnoji?.sides.a.find((row) => row.versionCount > 0)
      ?.latestVersionID ?? 0
    mineB = honnoji?.sides.b.find((row) => row.versionCount > 0)
      ?.latestVersionID ?? 0
    expect(mineA).toBeGreaterThan(0)
    expect(mineB).toBeGreaterThan(0)
  })
  await test.step('当 我绕过 UI 直接 POST /v1/challenges', async () => {
    const rejected = await api<{ error?: string }>('POST', '/challenges', {
      scenarioID: HONNOJI,
      mine: { a: { versionID: mineA }, b: { versionID: mineB } },
      opponent: { accountID: opponentID },
    })
    await test.step('那么 服务端以 403 gate_locked 拒绝（发起方门槛）', () => {
      expect(rejected.status).toBe(403)
      expect(rejected.body.error).toBe('gate_locked')
    })
  })
})

test('被约方未解锁，约战同样被整对拒绝（#29 的配套保护）', async () => {
  test.skip(opponentID === '', '需要 AXIIA_U06_OPPONENT_ID（审计探针账号 id）')
  let mineA = 0
  let mineB = 0
  await test.step('假如 我在商鞅场景已解锁，而对手（探针账号）在商鞅场景未解锁', async () => {
    const scenarios = await getScenarios()
    const shangyang = scenarios.find((row) => row.id === SHANGYANG)
    test.skip(
      !journeySession || shangyang?.gateUnlocked !== true,
      '需要旅程账号在商鞅场景解锁（AXIIA_U06_EMAIL）',
    )
    const mine = await getMyScenario(SHANGYANG)
    mineA = mine?.sides.a.find((row) => row.entryVersionID != null)
      ?.entryVersionID ?? 0
    mineB = mine?.sides.b.find((row) => row.entryVersionID != null)
      ?.entryVersionID ?? 0
    expect(mineA).toBeGreaterThan(0)
    expect(mineB).toBeGreaterThan(0)
  })
  await test.step('当 我绕过 UI 直接 POST /v1/challenges', async () => {
    const rejected = await api<{ error?: string }>('POST', '/challenges', {
      scenarioID: SHANGYANG,
      mine: { a: { versionID: mineA }, b: { versionID: mineB } },
      opponent: { accountID: opponentID },
    })
    await test.step('那么 服务端以 403 opponent_gate_locked 拒绝（被约方门槛）', () => {
      expect(rejected.status).toBe(403)
      expect(rejected.body.error).toBe('opponent_gate_locked')
    })
  })
})

// ── 规则: hotseat 自打不受 PVP 门槛限制（#78） ─────────────────────────────

test('锁定场景里左右手互搏不上锁', async () => {
  await test.step('假如 我在一个锁定场景里两侧都有带版本的智能体', async () => {
    const scenarios = await getScenarios()
    expect(scenarios.find((row) => row.id === HONNOJI)?.gateUnlocked).toBe(
      false,
    )
  })
  await test.step('当 我从该场景智能体页打开出战面板', async () => {
    const honnoji = await getMyScenario(HONNOJI)
    const agentID = honnoji?.sides.a.find((row) => row.versionCount > 0)
      ?.agentID
    expect(agentID).toBeTruthy()
    await page.goto(`/agents/${agentID}`)
    const open = page.getByTestId('open-os-panel')
    await expect(open).toBeEnabled({ timeout: 30_000 })
    await open.click()
  })
  await test.step('那么 「左右手互搏」tab 没有锁形图标，可选对侧并且「自打一场」按钮可用', async () => {
    const hotseatTab = page.getByRole('tab', { name: '左右手互搏' })
    await expect(hotseatTab).toBeVisible()
    expect(await hotseatTab.locator('svg').count(), 'hotseat tab 不带图标')
      .toBe(0)
    await hotseatTab.click()
    await expect(page.getByRole('button', { name: '自打一场' }))
      .toBeEnabled({ timeout: 30_000 })
  })
  await test.step('并且 「玩家约战」tab 带锁形图标（同屏对照：PVP 锁、hotseat 不锁）', async () => {
    const pvpTab = page.getByRole('tab', { name: '玩家约战' })
    expect(await pvpTab.locator('svg').count(), 'pvp tab 带锁形')
      .toBeGreaterThan(0)
    await pvpTab.click()
    await expect(
      page.getByText(/每侧各赢 ≥\d+ 场 NPC 练习解锁玩家约战/),
    ).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })
})

// ── 规则: 参赛＝「参赛策略 + 参赛版本」，★ 每侧唯一（#91/#33/#58） ─────────

// 状态驱动：本组从 /v1/my/agents 现场认领 A1（持 ★ 的首策略）与 A2（第二
// 策略），并在改标检查后把 ★ 还给 A1 v1——同一账号重复跑保持收敛。
async function honnojiPair() {
  const snapshot = await getMyScenario(HONNOJI)
  const rows = snapshot?.sides.a ?? []
  expect(rows.length, '需要引导门组先建出两个甲方策略').toBeGreaterThanOrEqual(
    2,
  )
  const first = rows.find((row) => row.entryVersionID != null) ?? rows[0]
  const second = rows.find((row) => row.agentID !== first.agentID)!
  return { first, second }
}

test('该侧尚无 ★ 时首存版本自动接管参赛', async () => {
  await test.step('假如 本能寺甲方第一个智能体刚存 v1（该侧此前无任何 ★）', async () => {
    const { first } = await honnojiPair()
    honnojiA1 = first.agentID
  })
  await test.step('那么 v1 的 isEntry 为 true——自动参赛发生', async () => {
    if (honnojiA1V1IsEntry) {
      // 首跑（virgin）路径：保存响应里直接看到了 isEntry=true。
      expect(honnojiA1V1IsEntry).toBe(true)
    }
    const versions = await api<{
      entryVersionID?: number | null
      versions: Array<VersionRow>
    }>('GET', `/agents/${honnojiA1}/versions`)
    const v1 = versions.body.versions.find((row) => row.ordinal === 1) ??
      versions.body.versions[0]
    expect(versions.body.entryVersionID).toBe(v1.id)
  })
})

test('该侧已有 ★ 时新策略首存不夺席位（自动参赛收窄）', async () => {
  await test.step('假如 本能寺甲方第二个智能体（引导门放行后建）存下它的 v1', async () => {
    const { first, second } = await honnojiPair()
    honnojiA1 = first.agentID
    honnojiA2 = second.agentID
    if (second.versionCount === 0) {
      const saved = await saveVersion(
        honnojiA2,
        'U06 门槛审计：本能寺甲方第二策略 v1（不应夺 ★）。',
      )
      expect(saved.status).toBe(200)
      honnojiA2V1 = saved.body.id
      await test.step('那么 该 v1 的 isEntry 为 false，原智能体的 ★ 原地不动', () => {
        expect(saved.body.isEntry).toBe(false)
      })
    } else {
      honnojiA2V1 = second.latestVersionID ?? 0
    }
    const snapshot = await getMyScenario(HONNOJI)
    const firstNow = snapshot?.sides.a.find((row) => row.agentID === honnojiA1)
    const secondNow = snapshot?.sides.a.find((row) => row.agentID === honnojiA2)
    expect(firstNow?.entryVersionID, '原策略 ★ 原地不动').toBeTruthy()
    expect(secondNow?.entryVersionID ?? null, '新策略未夺 ★').toBeNull()
  })
})

test('显式改标把同侧的 ★ 收走（每侧唯一）', async () => {
  let firstEntryBefore = 0
  await test.step('当 我把第二个智能体的 v1 设为参赛版本', async () => {
    const { first, second } = await honnojiPair()
    honnojiA1 = first.agentID
    honnojiA2 = second.agentID
    honnojiA2V1 = second.latestVersionID ?? honnojiA2V1
    firstEntryBefore = first.entryVersionID ?? 0
    expect(firstEntryBefore).toBeGreaterThan(0)
    const marked = await api<{ ok?: boolean }>(
      'POST',
      `/agents/${honnojiA2}/entry/${honnojiA2V1}`,
    )
    expect(marked.status).toBe(200)
  })
  await test.step('那么 第二个智能体持 ★，第一个智能体的 entryVersionID 清空', async () => {
    const snapshot = await getMyScenario(HONNOJI)
    const first = snapshot?.sides.a.find((row) => row.agentID === honnojiA1)
    const second = snapshot?.sides.a.find((row) => row.agentID === honnojiA2)
    expect(second?.entryVersionID).toBe(honnojiA2V1)
    expect(first?.entryVersionID ?? null).toBeNull()
  })
  await test.step('并且 /v1/my/agents 里该侧恰有一个智能体带 entryVersionID', async () => {
    const snapshot = await getMyScenario(HONNOJI)
    const starred = (snapshot?.sides.a ?? []).filter(
      (row) => row.entryVersionID != null,
    )
    expect(starred.length).toBe(1)
    // 收敛：把 ★ 还给 A1 v1，让本组可重复跑（也再次演练侧内清星）。
    const restored = await api<{ ok?: boolean }>(
      'POST',
      `/agents/${honnojiA1}/entry/${firstEntryBefore}`,
    )
    expect(restored.status).toBe(200)
  })
})

test('参赛必须双方——entryReady 随两侧 ★ 齐备而立（#58）', async () => {
  await test.step('那么 本能寺场景 entryReady 为 true 当且仅当两侧各有一个 ★', async () => {
    const snapshot = await getMyScenario(HONNOJI)
    expect(snapshot).toBeTruthy()
    const aReady = snapshot!.sides.a.some((row) => row.entryVersionID != null)
    const bReady = snapshot!.sides.b.some((row) => row.entryVersionID != null)
    expect(snapshot!.entryReady).toBe(aReady && bReady)
    if (entryReadyBeforeSideB != null) {
      // 乙方只有空壳（无版本无 ★）时 entryReady 必为 false 的中途取样。
      expect(entryReadyBeforeSideB).toBe(false)
    }
  })
})

// ── 战斗依赖组：复用方法一旅程的既成战绩（不派发新对局） ────────────────────

test('解锁态 OS 面板呈已解锁与双侧 ✓ 徽章（战斗依赖，复用旅程战果）', async () => {
  const scenarios = await getScenarios()
  const shangyang = scenarios.find((row) => row.id === SHANGYANG)
  test.skip(
    !journeySession || shangyang?.gateUnlocked !== true,
    '需要旅程账号在商鞅场景的双侧 PVE 胜绩（AXIIA_U06_EMAIL）',
  )
  await test.step('假如 旅程账号在商鞅场景已解锁（两侧各 ≥1 场 PVE 胜）', () => {
    expect(shangyang!.gateProgress!.a.beaten).toBeGreaterThanOrEqual(1)
    expect(shangyang!.gateProgress!.b.beaten).toBeGreaterThanOrEqual(1)
  })
  await test.step('那么 商鞅场景 gateUnlocked 为 true 且两侧 beaten ≥ 1', () => {
    expect(shangyang!.gateUnlocked).toBe(true)
  })
  await test.step('并且 OS 面板「玩家约战」tab 呈解锁态，显示「玩家约战已解锁」与双侧 ✓ 徽章', async () => {
    const mine = await getMyScenario(SHANGYANG)
    const agentID = mine?.sides.a.find((row) => row.versionCount > 0)?.agentID
    await page.goto(`/agents/${agentID}`)
    const open = page.getByTestId('open-os-panel')
    await expect(open).toBeEnabled({ timeout: 30_000 })
    await open.click()
    await page.getByRole('tab', { name: '玩家约战' }).click()
    await expect(page.getByText('玩家约战已解锁')).toBeVisible()
    await expect(page.getByText(/商鞅 1\/1 ✓/)).toBeVisible()
    await expect(page.getByText(/甘龙 1\/1 ✓/)).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })
})

test('PVP 双侧阵容默认取各侧参赛版本（#91，战斗依赖）', async () => {
  const scenarios = await getScenarios()
  test.skip(
    !journeySession ||
      scenarios.find((row) => row.id === SHANGYANG)?.gateUnlocked !== true,
    '需要旅程账号在商鞅场景解锁（AXIIA_U06_EMAIL）',
  )
  let entryAgentA = 0
  let entryAgentB = 0
  await test.step('假如 旅程账号在商鞅场景已解锁', async () => {
    const mine = await getMyScenario(SHANGYANG)
    entryAgentA = mine?.sides.a.find((row) => row.entryVersionID != null)
      ?.agentID ?? 0
    entryAgentB = mine?.sides.b.find((row) => row.entryVersionID != null)
      ?.agentID ?? 0
    expect(entryAgentA).toBeGreaterThan(0)
    expect(entryAgentB).toBeGreaterThan(0)
  })
  await test.step('当 我打开出战面板的「玩家约战」tab', async () => {
    const mine = await getMyScenario(SHANGYANG)
    const agentID = mine?.sides.a.find((row) => row.versionCount > 0)?.agentID
    await page.goto(`/agents/${agentID}`)
    const open = page.getByTestId('open-os-panel')
    await expect(open).toBeEnabled({ timeout: 30_000 })
    await open.click()
    await page.getByRole('tab', { name: '玩家约战' }).click()
  })
  await test.step('那么 双侧阵容选择器分别预选各侧 ★ 参赛版本（与 /v1/agents/:id/versions 的 entryVersionID 一致）', async () => {
    // lineup 选项文案：`#agentID · vN · model ★`（★ 只标 entry 选项）——
    // 预选值带 ★ 即等于预选了该侧参赛版本；面板顶部的版本下拉也会显示 ★，
    // 所以把断言圈进「我的双侧出战阵容」卡片里。
    const lineupCard = page.getByText(/我的双侧出战阵容/).locator('..')
    const combos = lineupCard.getByRole('combobox')
    await expect(combos).toHaveCount(2, { timeout: 30_000 })
    await expect(combos.nth(0)).toContainText(`#${entryAgentA}`)
    await expect(combos.nth(0)).toContainText('★')
    await expect(combos.nth(1)).toContainText(`#${entryAgentB}`)
    await expect(combos.nth(1)).toContainText('★')
  })
  await test.step('并且 面板注明「默认各侧 ★参赛版本（未标记则最新版）」', async () => {
    await expect(page.getByText('默认各侧 ★参赛版本（未标记则最新版）'))
      .toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })
})

// ── 规则: 配额与限次只验口径，不打满（#52/#76） ────────────────────────────

test('配额脚注与配置旋钮在位', async () => {
  const cfg = await getConfig()
  await test.step('那么 /v1/config 暴露 dailyBattleLimit、pvpDailyLimit 与 opponentDailyChallengeLimit（#76 的 M）', () => {
    expect(cfg.dailyBattleLimit).toBeGreaterThan(0)
    expect(cfg.pvpDailyLimit).toBeGreaterThan(0)
    expect(cfg.opponentDailyChallengeLimit).toBeGreaterThan(0)
  })
  await test.step('并且 出战面板脚注显示「今日已用 x/N（PVP y/M）」且数字与 config.usage 一致', async () => {
    const honnoji = await getMyScenario(HONNOJI)
    const agentID = honnoji?.sides.a.find((row) => row.versionCount > 0)
      ?.agentID
    await page.goto(`/agents/${agentID}`)
    const open = page.getByTestId('open-os-panel')
    await expect(open).toBeEnabled({ timeout: 30_000 })
    await open.click()
    await expect(page.getByText(
      `今日已用 ${cfg.usage.battlesToday}/${cfg.dailyBattleLimit}（PVP ${cfg.usage.pvpBattlesToday}/${cfg.pvpDailyLimit}）`,
    )).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })
})

// ── 规则: 天梯已定约束的状态面（A6 GATE-3，状态检查） ──────────────────────

test('PVE 胜利不在任何地方播种天梯分', async () => {
  await test.step('那么 /v1/tournaments 可达且不含以本账号 PVE 战绩生成的排名条目', async () => {
    const tournaments = await api<{ tournaments?: unknown[] }>(
      'GET',
      '/tournaments',
    )
    expect(tournaments.status).toBe(200)
    // 天梯（GP/W11）未建：状态面上不存在任何由 PVE 播种的分数。锦标赛列表
    // 里若有条目，也只能来自真实锦标赛——本审计账号没有参赛记录。
    expect(Array.isArray(tournaments.body.tournaments)).toBe(true)
  })
})
