// 智能体编辑与版本 — agent-edit.feature 的可执行对应（BDD：每个 test.step
// 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：#81/E1 草稿 · #82/E2/E3 线性版本与迭代 · #88/E11 E 页内嵌版本线
// 与「保存不跳转」· #89「基于该版本迭代」文案 · #90 废止「复制为新智能体」·
// #25 双编号 · #33 设为参赛版本 · #56 同侧多槽 · #59/#79 引导门 ·
// P5 模型继承 · P11 覆盖确认 · P12 提示常驻 · P14 复制当前文本 ·
// P4/#91 ★ 每侧唯一 · P15 逐版本胜负 · P10 备注与时间 · P2 改名 ·
// P8a/P8b 空策略 · P1a 最近编辑。
//
// 账号模型：整个文件共用**一个**测试账号（注册码名额稀缺），在 beforeAll 里
// 注册/登录一次（ensureSharedAccount），此后所有测试按文件顺序在同一账号上
// 推进同一条故事线；引导门等只在早期状态成立的前置，用 test.skip 显式跳过
// 而不是伪造第二个账号。固定用内置场景「商鞅变法·朝堂辩法」（甲＝商鞅，
// 乙＝甘龙），不依赖 AXIIA_SCENARIO_ID 的夹具场景。
import { expect, type Page, test } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ensureSharedAccount, sharedStatePath } from './helpers'

const SHANGYANG = 'shangyang-court'
const SCENARIO_TITLE = '商鞅变法·朝堂辩法'

test.use({ storageState: sharedStatePath() })

test.beforeAll(async ({ browser }) => {
  // 远程 dev 上注册/登录一趟可能超过默认 30s 钩子预算。
  test.setTimeout(120_000)
  await ensureSharedAccount(browser)
})

// ── 故事线登记：跨测试记住 A/B/C/甘龙 的 agent id ─────────────────────────
// 同一账号的多测试推进同一条故事线；id 落盘（.e2e-shared-account，绝不能放
// playwright 会清空的 test-results），worker 重启或复跑时仍能对上号。缺席时
// 从 /v1/my/agents 兜底推断。
const storyPath = join(
  process.cwd(),
  '.e2e-shared-account',
  'story.json',
)

interface Story {
  agentA?: number
  agentB?: number
  agentC?: number
  gan?: number
}

function story(): Story {
  if (!existsSync(storyPath)) return {}
  return JSON.parse(readFileSync(storyPath, 'utf8')) as Story
}

function remember(patch: Partial<Story>) {
  mkdirSync(join(process.cwd(), '.e2e-shared-account'), {
    recursive: true,
  })
  writeFileSync(storyPath, JSON.stringify({ ...story(), ...patch }))
}

interface InventoryAgent {
  agentID: number
  name?: string | null
  versionCount: number
  entryVersionID?: number | null
  lastEditedAt?: number
}

async function shangyangSides(
  page: Page,
): Promise<{ a: InventoryAgent[]; b: InventoryAgent[] }> {
  const response = await page.request.get('/v1/my/agents')
  expect(response.ok()).toBe(true)
  const inventory = await response.json() as {
    scenarios: Array<{
      scenarioID: string
      sides: { a: InventoryAgent[]; b: InventoryAgent[] }
    }>
  }
  const entry = inventory.scenarios.find((s) => s.scenarioID === SHANGYANG)
  return entry?.sides ?? { a: [], b: [] }
}

// 故事线里的商鞅 A ＝最早创建的那个（id 最小）；B/C 按创建序随后。
async function agentAId(page: Page): Promise<number> {
  const known = story().agentA
  if (known != null) return known
  const sides = await shangyangSides(page)
  const first = [...sides.a].sort((x, y) => x.agentID - y.agentID)[0]
  expect(first, '商鞅侧应已有智能体 A').toBeTruthy()
  return first.agentID
}

// 场景页「去构建」＝懒创建（get-or-create，#54）：仅用于该侧还没有策略的
// 首建路径（P13：已有策略时按钮组换成「再建一个」，逐侧 testid 会消失）。
async function createViaScenarioPage(
  page: Page,
  side: 'a' | 'b',
): Promise<number> {
  await page.goto(`/scenarios/${SHANGYANG}`)
  // 远程 dev 后端的场景详情偶尔要十几秒才回——默认 5s 会在「加载中…」上超时。
  await expect(page.getByRole('heading', { level: 1 }))
    .toBeVisible({ timeout: 30_000 })
  await page.getByTestId(side === 'a' ? 'build-agent' : 'build-agent-b')
    .click()
  await expect(page).toHaveURL(/\/agents\/\d+\/build/)
  return Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
}

// 「再建一个」弹窗新建一个同侧策略并进入其工作区（引导门须已放行）。
async function createSibling(
  page: Page,
  sideName: string,
  name?: string,
): Promise<number> {
  await page.goto('/my-agents')
  await page.getByLabel(`再建一个${SCENARIO_TITLE}·${sideName}侧智能体`).click()
  const dialog = page.getByRole('dialog')
  if (name != null) await dialog.getByLabel(/自起名/).fill(name)
  await dialog.getByRole('button', { name: '创建并进入构建' }).click()
  await expect(page).toHaveURL(/\/agents\/\d+\/build/)
  return Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
}

// 工作区里保存一个版本。noise 是保存前的额外草稿暂存轮数（每轮改一次文本并
// 等 debounce 落库）——「恒 +1」规则用它证明版本号与暂存次数无关。
// #88：保存后**不再跳转**——断言留在 /build，并等版本线里出现新卡。
async function saveVersion(
  page: Page,
  agentID: number,
  prompt: string,
  noise = 0,
) {
  if (!new RegExp(`/agents/${agentID}/build`).test(page.url())) {
    await page.goto(`/agents/${agentID}/build`)
  }
  const input = page.getByLabel('策略提示词')
  // 草稿未回来之前编辑框是 disabled（aria-busy）——远程 dev 下 5s 不够。
  await expect(input).toBeEnabled({ timeout: 30_000 })
  for (let round = 0; round < noise; round++) {
    await input.fill(`${prompt} ——草稿噪声第 ${round + 1} 轮，不该影响版本号`)
    await page.waitForTimeout(900)
  }
  await input.fill(prompt)
  const before = await page.getByTestId('version-card').count()
  const save = page.getByTestId('save-version')
  await expect(save).toBeEnabled()
  await save.click()
  // #88：留在 E 页，版本线就地长出一张新卡。
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build`))
  await expect(page.getByTestId('version-card')).toHaveCount(before + 1)
}

async function versionsOf(page: Page, agentID: number) {
  const response = await page.request.get(`/v1/agents/${agentID}/versions`)
  expect(response.ok()).toBe(true)
  return await response.json() as {
    versions: Array<
      {
        id: number
        ordinal?: number
        prompt: string
        modelID: string
        isEntry?: boolean
        note?: string | null
        createdAt?: number
        matchCount?: number
        winCount?: number
      }
    >
    entryVersionID?: number
  }
}

test('agent-edit：E 页内嵌版本线——保存不跳转，v1→v2，改标参赛版本', async ({ page }) => {
  test.setTimeout(240_000)

  let agentA = 0
  await test.step('假如 我在场景页点甲方「去构建」——首个商鞅智能体 A 即建即进工作区', async () => {
    const sides = await shangyangSides(page)
    test.skip(
      sides.a.length > 0,
      '共享账号已过「首建商鞅」状态——本场景只在全新故事线上有效',
    )
    agentA = await createViaScenarioPage(page, 'a')
    remember({ agentA })
  })

  const v1Prompt = '徙木立信：先立可验证的小承诺，再谈变法大义。'
  await test.step('当 我输入首稿并点「保存版本」；那么 产生 v1、仍停留在 E 页、版本线出现 v1、v1 自动为 ★参赛版本', async () => {
    await saveVersion(page, agentA, v1Prompt)
    await expect(page).toHaveURL(new RegExp(`/agents/${agentA}/build`))
    await expect(page.getByText('版本（1）')).toBeVisible()
    await expect(page.getByText('★参赛版本')).toBeVisible()
    const { versions, entryVersionID } = await versionsOf(page, agentA)
    expect(versions).toHaveLength(1)
    expect(entryVersionID).toBe(versions[0].id)
  })

  const v2Prompt = '第二版：把甘龙的每条祖制引用都逼回「可否验于当下」。'
  await test.step('当 我在同一页改写文本并再次保存；那么 版本线为 v2、v1（最新在前），双编号与四个动作齐全，且没有「复制为新智能体」', async () => {
    await saveVersion(page, agentA, v2Prompt)
    await expect(page).toHaveURL(new RegExp(`/agents/${agentA}/build`))
    await expect(page.getByText('版本（2）')).toBeVisible()
    const { versions } = await versionsOf(page, agentA)
    expect(versions).toHaveLength(2)
    const cardLabels = await page.getByText(/^v\d+$/).allTextContents()
    expect(cardLabels).toEqual(['v2', 'v1'])
    for (const version of versions) {
      await expect(page.getByText(`#${version.id}`, { exact: true }))
        .toBeVisible()
    }
    await expect(page.getByRole('button', { name: /展开 v\d+ 全文/ }).first())
      .toBeVisible()
    await expect(page.getByRole('button', { name: /设为.*参赛版本/ }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: /基于 v\d+ 迭代/ }).first())
      .toBeVisible()
    await expect(page.getByRole('button', { name: /用 v\d+ 出战/ }).first())
      .toBeVisible()
    // #90：这个动作已废止，页面上不该再有它。
    await expect(page.getByRole('button', { name: /复制为新智能体/ }))
      .toHaveCount(0)
  })

  await test.step('当 我在 v2 卡点「设为参赛版本」；那么 ★ 从 v1 移到 v2，保存按钮旁常驻「保存后将成为 v3」', async () => {
    await page.getByRole('button', { name: /设为.*参赛版本/ }).click()
    const { versions } = await versionsOf(page, agentA)
    const v2 = versions.reduce((a, b) => (a.id > b.id ? a : b))
    // 远程 dev 后端：改标往返偶尔超过默认 5s，给足预算再判定。
    await expect.poll(
      async () => (await versionsOf(page, agentA)).entryVersionID,
      { timeout: 20_000 },
    ).toBe(v2.id)
    await expect(page.getByText('保存后将成为 v3').first()).toBeVisible()
  })

  await test.step('当 我在工作区打字但不保存、离开再回来；那么 草稿仍在而版本数仍是 2', async () => {
    const draft = '这段只是草稿：三年不改一字者，非慎也，怠也。'
    await page.getByLabel('策略提示词').fill(draft)
    // 等服务端把这次暂存确认回来（SSE → 状态字），再离开。固定 sleep 会在
    // 远程 dev 上把还在飞的 mutate 请求随导航一起掐掉，草稿就丢了。
    await expect(page.getByText('已自动暂存')).toBeVisible()
    await page.goto('/my-agents')
    await page.goto(`/agents/${agentA}/build`)
    await expect(page.getByLabel('策略提示词')).toHaveValue(draft)
    expect((await versionsOf(page, agentA)).versions).toHaveLength(2)
  })
})

test('agent-edit：无对侧时「再建一个」被引导门挡下（P6a 文案不含条文号）', async ({ page }) => {
  test.setTimeout(120_000)

  await test.step('假如 我只有商鞅侧智能体 A（尚无任何甘龙侧智能体）', async () => {
    const sides = await shangyangSides(page)
    test.skip(
      sides.b.length > 0,
      '共享账号已有甘龙侧智能体——引导门拦截只在此前状态成立',
    )
    expect(sides.a.length).toBeGreaterThan(0)
  })

  await test.step('当 我在「我的智能体」页点「再建一个商鞅」并提交；那么 引导门挡下且文案不含条文号', async () => {
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: '创建并进入构建' }).click()
    await expect(
      dialog.getByText(
        '需先有一个对侧智能体，才能在同侧再建第二个——两边都会写才是真本事',
      ),
    ).toBeVisible()
    // 弹窗内的切侧引导带角色名（P6a 的精神：说人话、指对路）。
    await expect(dialog.getByRole('button', { name: '先创建甘龙' }))
      .toBeVisible()
    await expect(dialog.getByText('#59')).toHaveCount(0)
    await expect(dialog.getByText('#79')).toHaveCount(0)
  })

  await test.step('并且 没有新建任何智能体（商鞅侧数量不变）', async () => {
    const sides = await shangyangSides(page)
    expect(sides.b).toHaveLength(0)
  })
})

test('agent-edit：空壳对侧不放行引导门；空策略可删、有版本的不可删（P8a/P8b）', async ({ page }) => {
  test.setTimeout(300_000)

  await test.step('假如 我有一个有版本的商鞅策略，并建了一个一版没存的甘龙空壳', async () => {
    const sides = await shangyangSides(page)
    test.skip(
      sides.b.some((agent) => agent.versionCount > 0),
      '共享账号的甘龙侧已有版本——空壳判定只在此前状态成立',
    )
    expect(sides.a.some((agent) => agent.versionCount > 0)).toBe(true)
    if (sides.b.length === 0) {
      await createViaScenarioPage(page, 'b') // 只建号，不保存版本
    }
  })

  await test.step('当 我尝试「再建一个商鞅」；那么 引导门仍然挡下——对侧策略必须至少有 1 个版本才算数（P8a）', async () => {
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: '创建并进入构建' }).click()
    await expect(dialog.getByText(/需先有一个对侧智能体/)).toBeVisible()
    await dialog.getByRole('button', { name: '取消' }).click()
  })

  await test.step('那么 有版本的策略那一行没有「删除」，空壳那一行有（P8b）', async () => {
    const agentA = await agentAId(page)
    await expect(page.getByRole('button', { name: `删除智能体 #${agentA}` }))
      .toHaveCount(0)
    await expect(page.getByRole('button', { name: /删除智能体 #\d+/ }))
      .toHaveCount(1)
  })

  await test.step('当 我删除那个空壳；那么 该行消失，商鞅侧只剩有版本的那些策略', async () => {
    const del = page.getByRole('button', { name: /删除智能体 #\d+/ })
    const label = await del.getAttribute('aria-label')
    const emptyID = Number(/#(\d+)/.exec(label!)![1])
    await del.click()
    await page.getByRole('button', { name: `确认删除智能体 #${emptyID}` })
      .click()
    await expect(page.getByRole('button', { name: /删除智能体 #\d+/ }))
      .toHaveCount(0)
    const sides = await shangyangSides(page)
    expect(sides.b).toHaveLength(0)
  })
})

test('agent-edit：有对侧后「再建一个」放行，B 从 v1 重新计数（#56/#59/#79）', async ({ page }) => {
  test.setTimeout(300_000)

  await test.step('假如 我创建了甘龙侧智能体并保存一版（引导门放行，P8a 要求对侧有版本）', async () => {
    const sides = await shangyangSides(page)
    test.skip(
      sides.a.length > 1,
      '共享账号商鞅侧已有第二个策略——放行剧本已发生过',
    )
    let gan = sides.b[0]?.agentID
    if (gan == null) {
      gan = await createViaScenarioPage(page, 'b')
    }
    remember({ gan })
    if (!sides.b.some((agent) => agent.versionCount > 0)) {
      await saveVersion(page, gan, '甘龙首稿：不轻掷民力。')
    }
  })

  let agentB = 0
  await test.step('当 我「再建一个商鞅」并起名「激进」；那么 新建策略 B、工作区为空——初始化三选一（含 MCQ）重新可用（E6）', async () => {
    agentB = await createSibling(page, '商鞅', '激进')
    remember({ agentB })
    expect(agentB).not.toBe(await agentAId(page))
    await expect(page.getByLabel('策略提示词')).toHaveValue('')
    // E6：新策略的空工作区可以重走三选一——MCQ 页签就在眼前。
    await expect(page.getByText('MCQ 拼装')).toBeVisible()
    expect((await versionsOf(page, agentB)).versions).toHaveLength(0)
  })

  await test.step('当 我保存 B 的首稿；那么 B 是「版本（1）」，商鞅侧并列 A、B（#56），版本线独立于 A、从 v1 重新计数（E2）', async () => {
    await saveVersion(page, agentB, 'B 的 v1：另起一路，先破「利不百不变法」。')
    await expect(page.getByText('版本（1）')).toBeVisible()
    const { versions } = await versionsOf(page, agentB)
    expect(versions).toHaveLength(1)
    expect(versions[0].ordinal ?? 1).toBe(1)
    await page.goto('/my-agents')
    await expect(page.getByText('商鞅「激进」')).toBeVisible()
    const sides = await shangyangSides(page)
    expect(sides.a.length).toBe(2)
  })
})

test('agent-edit：版本号恒 +1；基于该版本迭代不产版本；模型继承；复制当前文本', async ({ page }) => {
  test.setTimeout(600_000)

  let agentA = 0
  let agentB = 0
  await test.step('假如 引导门已放行，我拥有同侧策略 A、B、C（C 经「再建一个」创建）', async () => {
    const sides = await shangyangSides(page)
    expect(
      sides.b.some((agent) => agent.versionCount > 0),
      '引导门应已放行（甘龙已有版本）',
    ).toBe(true)
    agentA = await agentAId(page)
    agentB = story().agentB ??
      sides.a.map((x) => x.agentID).filter((id) => id !== agentA).sort(
        (x, y) => x - y,
      )[0]
    let agentC = story().agentC ?? null
    if (agentC == null) {
      agentC = await createSibling(page, '商鞅')
      remember({ agentC })
    }
  })

  const agentC = () => story().agentC!

  for (
    const plan of [
      { label: 'A', id: () => agentA, target: 3 },
      { label: 'B', id: () => agentB, target: 4 },
      { label: 'C', id: agentC, target: 5 },
    ]
  ) {
    await test.step(`当 我把 ${plan.label} 迭代到 ${plan.target} 个版本（保存间随意暂存）；那么 序号恰为 v1..v${plan.target}，相邻差恒为 1`, async () => {
      const existing = (await versionsOf(page, plan.id())).versions.length
      for (let n = existing + 1; n <= plan.target; n++) {
        await saveVersion(
          page,
          plan.id(),
          `${plan.label} 的第 ${n} 版正文。`,
          (n % 2) + 1,
        )
      }
      await expect(page.getByText(`版本（${plan.target}）`)).toBeVisible()
      const { versions } = await versionsOf(page, plan.id())
      const ordinals = versions.map((v) => v.ordinal ?? 0)
      expect(ordinals).toEqual(
        Array.from({ length: plan.target }, (_, i) => i + 1),
      )
      for (let i = 1; i < ordinals.length; i++) {
        expect(ordinals[i] - ordinals[i - 1]).toBe(1)
      }
    })
  }

  await test.step('当 我在 A 的 v1 卡点「基于该版本迭代」；那么 载入 v1 全文、提示「已载入 v1」、版本数不变；再保存产生 v4', async () => {
    await page.goto(`/agents/${agentA}/build`)
    await expect(page.getByLabel('策略提示词')).toBeEnabled({
      timeout: 30_000,
    })
    const { versions } = await versionsOf(page, agentA)
    const v1 = versions.reduce((a, b) => (a.id < b.id ? a : b))
    await page.getByRole('button', { name: '基于 v1 迭代' }).click()
    await expect(page.getByText(/已载入 v1/)).toBeVisible()
    await expect(page.getByLabel('策略提示词')).toHaveValue(v1.prompt)
    expect((await versionsOf(page, agentA)).versions).toHaveLength(3)
    await saveVersion(page, agentA, 'A 的第 4 版：从 v1 出发另走一条线。')
    const after = await versionsOf(page, agentA)
    expect(after.versions.map((v) => v.ordinal ?? 0)).toEqual([1, 2, 3, 4])
  })

  await test.step('当 草稿与最新版本不一致时点「基于该版本迭代」；那么 先确认再覆盖（P11）', async () => {
    await page.getByLabel('策略提示词').fill(
      '这是一段没保存的改动，不该被静默吞掉。',
    )
    await page.waitForTimeout(900)
    await page.getByRole('button', { name: '基于 v1 迭代' }).click()
    await expect(page.getByText(/工作区里有未保存的改动/)).toBeVisible()
    await page.getByRole('button', { name: '取消' }).click()
    await expect(page.getByLabel('策略提示词'))
      .toHaveValue('这是一段没保存的改动，不该被静默吞掉。')
  })

  await test.step('假如 甘龙策略的最新版本改用了一个非默认模型保存；当 我重新进入其工作区；那么 模型选择器显示那个模型（不是清单第一项）并提示「沿用 vN 的模型」（P5）', async () => {
    const gan = story().gan ?? (await shangyangSides(page)).b[0].agentID
    const models = await (await page.request.get('/v1/models')).json() as {
      models: Array<{ id: string }>
    }
    test.skip(models.models.length < 2, '模型清单只有一项，无法验证「非默认」')
    const nonDefault = models.models[models.models.length - 1].id
    expect(nonDefault).not.toBe(models.models[0].id)
    const save = await page.request.post(`/v1/agents/${gan}/save`, {
      headers: { 'Sec-Fetch-Site': 'same-origin' },
      data: {
        prompt: '甘龙改用另一个模型的版本：稳守祖制，逐条拆新法成本。',
        modelID: nonDefault,
        parentVersionID: null,
      },
    })
    expect(save.ok()).toBe(true)
    await page.goto(`/agents/${gan}/build`)
    await expect(page.getByLabel('策略提示词')).toBeEnabled({
      timeout: 30_000,
    })
    await expect(page.getByText(/沿用 v\d+ 的模型/)).toBeVisible()
  })

  await test.step('当 我不动模型直接保存；那么 新版本的模型与上一版相同——模型不会被静默换掉（P5/#13）', async () => {
    const gan = story().gan ?? (await shangyangSides(page)).b[0].agentID
    const before = await versionsOf(page, gan)
    const latest = before.versions.reduce((a, b) => (a.id > b.id ? a : b))
    await saveVersion(page, gan, '甘龙再迭代一版：模型不该被静默换掉。')
    const after = await versionsOf(page, gan)
    const newest = after.versions.reduce((a, b) => (a.id > b.id ? a : b))
    expect(newest.modelID).toBe(latest.modelID)
  })

  await test.step('那么 「复制当前文本」可用，点击后按钮变为「已复制」（E8/P14）', async () => {
    await page.goto(`/agents/${agentA}/build`)
    await expect(page.getByLabel('策略提示词')).toBeEnabled({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: /复制当前文本/ }).click()
    await expect(page.getByRole('button', { name: /已复制/ })).toBeVisible()
  })
})

// ── P4/#91 · P15 · P10 · P2 · P1a ──────────────────────────────────────────

test('agent-edit：★ 每侧唯一——在另一个策略上改标会收走同侧原有的 ★（P4/#91）', async ({ page }) => {
  test.setTimeout(300_000)

  let agentA = 0
  let agentB = 0
  await test.step('假如 商鞅侧有多个策略，且 A 的 v2 是当前的 ★参赛版本', async () => {
    const sides = await shangyangSides(page)
    expect(sides.a.length).toBeGreaterThan(1)
    agentA = await agentAId(page)
    agentB = story().agentB ??
      sides.a.map((x) => x.agentID).filter((id) => id !== agentA).sort(
        (x, y) => x - y,
      )[0]
    const { versions, entryVersionID } = await versionsOf(page, agentA)
    const v2 = versions.find((v) => (v.ordinal ?? 0) === 2)
    expect(entryVersionID, 'A 的 ★ 应还在（此前测试标到了 v2）')
      .toBe(v2?.id)
  })

  await test.step('当 我在 B 的 v1 卡点「设为商鞅参赛版本」；那么 B 的 v1 成为 ★，且 A 上不再有任何 ★——同侧同时只有一个参赛版本', async () => {
    await page.goto(`/agents/${agentB}/build`)
    await expect(page.getByLabel('策略提示词')).toBeEnabled({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: '将 v1 设为商鞅参赛版本' }).click()
    const { versions } = await versionsOf(page, agentB)
    const v1 = versions.reduce((a, b) => (a.id < b.id ? a : b))
    await expect.poll(
      async () => (await versionsOf(page, agentB)).entryVersionID,
      { timeout: 30_000 },
    ).toBe(v1.id)
    // 核心断言：同侧另一个策略的 ★ 必须被收走。契约用 optionals-absent 编码，
    // 没有参赛版本时这个键是缺席的（undefined），不是 null。
    await expect.poll(
      async () => (await versionsOf(page, agentA)).entryVersionID ?? null,
      { timeout: 30_000 },
    ).toBeNull()
    const { versions: aVersions } = await versionsOf(page, agentA)
    expect(aVersions.every((v) => !v.isEntry)).toBe(true)
  })

  await test.step('并且 出现提示「★ 已交给 v1——商鞅这一侧由它出战」（跨策略改标时说清席位去向）', async () => {
    await expect(page.getByTestId('save-notice')).toContainText('★ 已交给')
    await expect(page.getByTestId('save-notice')).toContainText('商鞅')
  })

  await test.step('并且 「我的智能体」页商鞅侧完成度徽章为 ✓（恰有一个 ★）', async () => {
    await page.goto('/my-agents')
    await expect(page.getByText('商鞅 ✓')).toBeVisible()
  })
})

test('agent-edit：逐版本胜负 + 版本备注与时间（P15/P10）', async ({ page }) => {
  test.setTimeout(300_000)

  let agentC = 0
  let before = 0
  await test.step('假如 我在 C 的工作区写好了文本并填入备注「加了退让条款」保存', async () => {
    agentC = story().agentC ?? (await shangyangSides(page)).a
      .sort((x, y) => y.agentID - x.agentID)[0].agentID
    before = (await versionsOf(page, agentC)).versions.length
    await page.goto(`/agents/${agentC}/build`)
    const input = page.getByLabel('策略提示词')
    await expect(input).toBeEnabled({ timeout: 30_000 })
    await input.fill('退让版：先许以旧贵族三年缓冲，再图变法全局。')
    await page.getByLabel('版本备注（可选）').fill('加了退让条款')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('version-card')).toHaveCount(before + 1)
  })

  await test.step('那么 新版本卡显示备注「加了退让条款」、保存时间，以及「还没有出战过」', async () => {
    await expect(page.getByText('加了退让条款')).toBeVisible()
    await expect(page.getByTestId('version-time').first()).toBeVisible()
    await expect(page.getByText('还没有出战过').first()).toBeVisible()
    const { versions } = await versionsOf(page, agentC)
    const newest = versions.reduce((a, b) => (a.id > b.id ? a : b))
    expect(newest.note).toBe('加了退让条款')
    expect(newest.createdAt).toBeGreaterThan(0)
    expect(newest.matchCount).toBe(0)
    expect(newest.winCount).toBe(0)
  })

  await test.step('当 我不填备注再保存一版；那么 那一版没有备注但仍显示时间', async () => {
    const input = page.getByLabel('策略提示词')
    await input.fill('再一版：缓冲期改为一年，换取即刻推行。')
    await expect(page.getByLabel('版本备注（可选）')).toHaveValue('')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('version-card')).toHaveCount(before + 2)
    const { versions } = await versionsOf(page, agentC)
    const newest = versions.reduce((a, b) => (a.id > b.id ? a : b))
    expect(newest.note ?? '').toBe('')
    expect(newest.createdAt).toBeGreaterThan(0)
    await expect(page.getByTestId('version-time')).toHaveCount(before + 2)
  })
})

test('agent-edit：策略改名（P2）', async ({ page }) => {
  test.setTimeout(300_000)

  let agentA = 0
  await test.step('假如 我有一个未起名的商鞅策略，展示为「商鞅 #id」', async () => {
    agentA = await agentAId(page)
    const sides = await shangyangSides(page)
    const self = sides.a.find((agent) => agent.agentID === agentA)
    expect(self?.name ?? '', 'A 从未被起名').toBe('')
    await page.goto('/my-agents')
    await expect(page.getByText(`#${agentA}`, { exact: true })).toBeVisible()
  })

  await test.step('当 我点「重命名」并输入「贪婪」；那么 展示名变为「商鞅「贪婪」」且刷新后仍在', async () => {
    await page.getByRole('button', { name: `重命名智能体 #${agentA}` }).click()
    const field = page.getByLabel(`智能体 #${agentA} 的名字`)
    await field.fill('贪婪')
    await field.press('Enter')
    await expect(page.getByText('商鞅「贪婪」')).toBeVisible()
    await page.reload()
    await expect(page.getByText('商鞅「贪婪」')).toBeVisible()
  })

  await test.step('当 我把名字清空并保存；那么 展示名回落为「商鞅 #id」', async () => {
    await page.getByRole('button', { name: `重命名智能体 #${agentA}` }).click()
    const field = page.getByLabel(`智能体 #${agentA} 的名字`)
    await field.fill('')
    await field.press('Enter')
    await expect(page.getByText(`#${agentA}`, { exact: true })).toBeVisible()
  })
})

test('agent-edit：最近编辑时间与排序（P1a）', async ({ page }) => {
  test.setTimeout(300_000)

  let agentA = 0
  await test.step('假如 商鞅侧已有多个策略，且 A 是其中最早创建的', async () => {
    agentA = await agentAId(page)
    const sides = await shangyangSides(page)
    expect(sides.a.length).toBeGreaterThan(1)
  })

  await test.step('并且 我最后编辑的是 A（在 A 的工作区打了字）', async () => {
    await page.goto(`/agents/${agentA}/build`)
    await expect(page.getByLabel('策略提示词')).toBeEnabled({ timeout: 30_000 })
    await page.getByLabel('策略提示词').fill(
      'A 又改了一句，于是 A 最近被编辑。',
    )
    await expect(page.getByText('已自动暂存')).toBeVisible()
  })

  await test.step('那么 商鞅侧第一行是 A，且每行都显示一句相对时间', async () => {
    await page.goto('/my-agents')
    const rows = page.getByTestId('agent-row')
    await expect(rows.first()).toBeVisible()
    // 商鞅侧多行；最近编辑的 A 必须排在最前（旧实现是 id 升序——A 最老，
    // 两种排序结论相反，恰好构成判别）。
    const first = await rows.first().getAttribute('data-agent-id')
    expect(Number(first)).toBe(agentA)
    await expect(page.getByTestId('agent-edited').first()).toBeVisible()
    const inventory = await (await page.request.get('/v1/my/agents'))
      .json() as {
        scenarios: Array<
          { sides: { a: Array<{ agentID: number; lastEditedAt?: number }> } }
        >
      }
    const side = inventory.scenarios.flatMap((s) => s.sides.a)
    const a = side.find((x) => x.agentID === agentA)
    expect(a?.lastEditedAt ?? 0).toBeGreaterThan(0)
    for (const other of side) {
      expect(a!.lastEditedAt!).toBeGreaterThanOrEqual(other.lastEditedAt ?? 0)
    }
  })
})
