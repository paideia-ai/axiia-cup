// 智能体编辑与版本 — agent-edit.feature 的可执行对应（BDD：每个 test.step
// 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：#81/E1 草稿 · #82/E2/E3 线性版本与迭代 · #88/E11 E 页内嵌版本线
// 与「保存不跳转」· #89「基于该版本迭代」文案 · #90 废止「复制为新智能体」·
// #25 双编号 · #33 设为参赛版本 · #56 同侧多槽 · #59/#79 引导门 ·
// P5 模型继承 · P11 覆盖确认 · P12 提示常驻 · P14 复制当前文本。
// 固定用内置场景「商鞅变法·朝堂辩法」（甲＝商鞅，乙＝甘龙），不依赖
// AXIIA_SCENARIO_ID 的夹具场景。
import { expect, type Page, test } from '@playwright/test'

import { registrationCode, signup } from './helpers'

const SHANGYANG = 'shangyang-court'
const SCENARIO_TITLE = '商鞅变法·朝堂辩法'

test.beforeEach(() => {
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
})

// 场景页「去构建」＝懒创建（get-or-create，#54）：nth(0)＝甲方商鞅，
// nth(1)＝乙方甘龙。返回新（或既有）agent id。
async function createViaScenarioPage(
  page: Page,
  side: 'a' | 'b',
): Promise<number> {
  await page.goto(`/scenarios/${SHANGYANG}`)
  // 远程 dev 后端的场景详情偶尔要十几秒才回——默认 5s 会在「加载中…」上超时。
  await expect(page.getByRole('heading', { level: 1 }))
    .toBeVisible({ timeout: 30_000 })
  // P13：该侧已有策略时「去构建」会换成「再建一个」，按序号取按钮不再可靠——
  // 用逐侧稳定 testid 定位（本函数只用于该侧还没有策略的首建路径）。
  await page.getByTestId(side === 'a' ? 'build-agent' : 'build-agent-b')
    .click()
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
        isEntry?: boolean
        note?: string | null
        createdAt?: number
        matchCount?: number
        winCount?: number
      }
    >
    entryVersionID: number
  }
}

test('agent-edit：E 页内嵌版本线——保存不跳转，v1→v2，改标参赛版本', async ({ page }) => {
  test.setTimeout(240_000)
  await signup(page, 'edit-iterate')

  let agentA = 0
  await test.step('假如 我在场景页点甲方「去构建」——首个商鞅智能体 A 即建即进工作区', async () => {
    agentA = await createViaScenarioPage(page, 'a')
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

test('agent-edit：同侧再建只走「再建一个」——引导门先挡后放，B 从 v1 重新计数', async ({ page }) => {
  test.setTimeout(240_000)
  await signup(page, 'edit-sibling')

  let agentA = 0
  await test.step('假如 我只有商鞅侧智能体 A，且已迭代到 v2', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, 'A 的 v1：先徙木，后论法。')
    await saveVersion(page, agentA, 'A 的 v2：以「验于当下」为唯一裁准。')
    await expect(page.getByText('版本（2）')).toBeVisible()
  })

  await test.step('那么 版本卡上没有「复制为新智能体」（#90 已废止）', async () => {
    await expect(page.getByRole('button', { name: /复制为新智能体/ }))
      .toHaveCount(0)
    await page.goto(`/agents/${agentA}`)
    await expect(page.getByRole('button', { name: /复制为新智能体/ }))
      .toHaveCount(0)
  })

  await test.step('当 我在「我的智能体」点「再建一个商鞅」并提交；那么 引导门挡下且文案不含条文号', async () => {
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: '创建并进入构建' }).click()
    await expect(
      dialog.getByText(
        '需先有一个对侧智能体，才能在同侧再建第二个——两边都会写才是真本事',
      ),
    ).toBeVisible()
    await expect(dialog.getByText('#59')).toHaveCount(0)
  })

  await test.step('假如 我创建了甘龙侧智能体并保存一版（引导门放行，P8a 要求对侧有版本）', async () => {
    const gan = await createViaScenarioPage(page, 'b')
    await saveVersion(page, gan, '甘龙首稿：不轻掷民力。')
  })

  let agentB = 0
  await test.step('当 我「再建一个商鞅」并起名「激进」；那么 新建策略 B、工作区为空（可重走 MCQ）', async () => {
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/自起名/).fill('激进')
    await dialog.getByRole('button', { name: '创建并进入构建' }).click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    agentB = Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
    expect(agentB).not.toBe(agentA)
    await expect(page.getByLabel('策略提示词')).toHaveValue('')
    expect((await versionsOf(page, agentB)).versions).toHaveLength(0)
  })

  await test.step('当 我保存 B 的首稿；那么 B 是「版本（1）」，商鞅侧并列 A、B（#56）', async () => {
    await saveVersion(page, agentB, 'B 的 v1：另起一路，先破「利不百不变法」。')
    await expect(page.getByText('版本（1）')).toBeVisible()
    const { versions } = await versionsOf(page, agentB)
    expect(versions).toHaveLength(1)
    expect(versions[0].ordinal ?? 1).toBe(1)
    await page.goto('/my-agents')
    await expect(page.getByText('商鞅「激进」')).toBeVisible()
  })
})

test('agent-edit：版本号恒 +1；基于该版本迭代不产版本；模型继承；复制当前文本', async ({ page }) => {
  test.setTimeout(600_000)
  await signup(page, 'edit-linear')

  await test.step('假如 引导门已放行（对侧甘龙已存在且有版本，P8a）', async () => {
    const gan = await createViaScenarioPage(page, 'b')
    await saveVersion(page, gan, '甘龙首稿：不轻掷民力。')
  })

  let agentA = 0
  const siblings: number[] = []
  await test.step('并且 我拥有同侧策略 A、B、C（后两个经「再建一个」创建）', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, 'A v1：定基调。')
    for (let i = 0; i < 2; i++) {
      await page.goto('/my-agents')
      await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
      await page.getByRole('dialog').getByRole('button', {
        name: '创建并进入构建',
      }).click()
      await expect(page).toHaveURL(/\/agents\/\d+\/build/)
      siblings.push(Number(/\/agents\/(\d+)\/build/.exec(page.url())![1]))
    }
  })

  const plans: Array<{ label: string; agentID: number; target: number }> = [
    { label: 'A', agentID: agentA, target: 3 },
    { label: 'B', agentID: siblings[0], target: 4 },
    { label: 'C', agentID: siblings[1], target: 5 },
  ]

  for (const plan of plans) {
    await test.step(`当 我把 ${plan.label} 迭代到 ${plan.target} 个版本（保存间随意暂存）；那么 序号恰为 v1..v${plan.target}，相邻差恒为 1`, async () => {
      const existing = (await versionsOf(page, plan.agentID)).versions.length
      for (let n = existing + 1; n <= plan.target; n++) {
        await saveVersion(
          page,
          plan.agentID,
          `${plan.label} 的第 ${n} 版正文。`,
          (n % 2) + 1,
        )
      }
      await expect(page.getByText(`版本（${plan.target}）`)).toBeVisible()
      const { versions } = await versionsOf(page, plan.agentID)
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
    // P11：确认行必须「就地」长在被点击的 v1 卡内（agent-edit.feature:102），
    // 页面顶部横幅那种「可见但不同屏」的形态要被这里抓住。
    const v1Card = page.getByTestId('version-card').filter({
      has: page.getByRole('button', { name: '基于 v1 迭代' }),
    })
    await v1Card.getByRole('button', { name: '基于 v1 迭代' }).click()
    await expect(v1Card.getByText(/工作区里有未保存的改动/)).toBeVisible()
    await v1Card.getByRole('button', { name: '取消' }).click()
    await expect(page.getByLabel('策略提示词'))
      .toHaveValue('这是一段没保存的改动，不该被静默吞掉。')
  })

  await test.step('那么 模型选择器沿用最新版本的模型（P5），且「复制当前文本」可用（P14）', async () => {
    await page.goto(`/agents/${agentA}/build`)
    await expect(page.getByText(/沿用 v\d+ 的模型/)).toBeVisible()
    await page.getByRole('button', { name: /复制当前文本/ }).click()
    await expect(page.getByRole('button', { name: /已复制/ })).toBeVisible()
  })
})

// ── P4/#91 · P15 · P10 · P2 · P8 ──────────────────────────────────────────
// 这五项都要后端配合（清同侧星 / 战绩字段 / 备注与时间 / 改名 / 删空策略与门
// 的判定口径）。它们与上面三条同属 agent-edit.feature 的叙述。

test('agent-edit：★ 每侧唯一——在另一个策略上改标会收走同侧原有的 ★（P4/#91）', async ({ page }) => {
  test.setTimeout(300_000)
  await signup(page, 'edit-entry-side')

  await test.step('假如 引导门已放行（对侧甘龙已存在且有版本）', async () => {
    const gan = await createViaScenarioPage(page, 'b')
    await saveVersion(page, gan, '甘龙：祖制非为守旧，是为不轻掷民力。')
  })

  let agentA = 0
  let agentB = 0
  await test.step('并且 我在商鞅侧有两个策略 A（2 个版本）与 B（1 个版本），A 的 v2 是当前 ★', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, 'A v1：先徙木，后论法。')
    await saveVersion(page, agentA, 'A v2：以「验于当下」为唯一裁准。')
    await page.getByRole('button', { name: /设为.*参赛版本/ }).click()
    await expect.poll(async () => {
      const { versions, entryVersionID } = await versionsOf(page, agentA)
      const newest = versions.reduce((a, b) => (a.id > b.id ? a : b))
      return entryVersionID === newest.id
    }, { timeout: 30_000 }).toBe(true)

    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    await page.getByRole('dialog').getByRole('button', {
      name: '创建并进入构建',
    }).click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    agentB = Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
    await saveVersion(page, agentB, 'B v1：另起一路。')
  })

  await test.step('当 我在 B 的 v1 卡点「设为商鞅侧参赛版本」；那么 B v1 成为 ★，且 A 上不再有任何 ★', async () => {
    // B 的 v1 是 B 内部的首版，保存时会自动成为本策略的 ★——所以这里先确认
    // 按钮存在与否取决于它当前是不是本侧唯一的 ★。统一从 A 侧验证结果。
    const bEntry = (await versionsOf(page, agentB)).entryVersionID
    if (bEntry == null) {
      await page.getByRole('button', { name: /设为.*参赛版本/ }).first().click()
    }
    await expect.poll(
      async () => (await versionsOf(page, agentB)).entryVersionID != null,
      { timeout: 30_000 },
    ).toBe(true)
    // 核心断言：同侧另一个策略的 ★ 必须被收走。契约用 optionals-absent 编码，
    // 没有参赛版本时这个键是缺席的（undefined），不是 null。
    await expect.poll(
      async () => (await versionsOf(page, agentA)).entryVersionID ?? null,
      { timeout: 30_000 },
    ).toBeNull()
    const { versions } = await versionsOf(page, agentA)
    expect(versions.every((v) => !v.isEntry)).toBe(true)
  })

  await test.step('并且 「我的智能体」页商鞅侧完成度徽章为 ✓（恰有一个 ★）', async () => {
    await page.goto('/my-agents')
    await expect(page.getByText('商鞅 ✓')).toBeVisible()
  })
})

test('agent-edit：逐版本胜负 + 版本备注与时间（P15/P10）', async ({ page }) => {
  test.setTimeout(300_000)
  await signup(page, 'edit-record-note')

  let agentA = 0
  await test.step('假如 我保存了一版并填了备注「加了退让条款」', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    const input = page.getByLabel('策略提示词')
    await expect(input).toBeEnabled({ timeout: 30_000 })
    await input.fill('先立可验证的小承诺，再谈变法大义。')
    await page.getByLabel('版本备注（可选）').fill('加了退让条款')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('version-card')).toHaveCount(1)
  })

  await test.step('那么 版本卡显示备注、保存时间，以及「还没有出战过」', async () => {
    await expect(page.getByText('加了退让条款')).toBeVisible()
    await expect(page.getByTestId('version-time').first()).toBeVisible()
    await expect(page.getByText('还没有出战过').first()).toBeVisible()
    const { versions } = await versionsOf(page, agentA)
    expect(versions[0].note).toBe('加了退让条款')
    expect(versions[0].createdAt).toBeGreaterThan(0)
    expect(versions[0].matchCount).toBe(0)
    expect(versions[0].winCount).toBe(0)
  })

  await test.step('当 我不填备注再保存一版；那么 那一版没有备注但仍显示时间', async () => {
    const input = page.getByLabel('策略提示词')
    await input.fill('第二版：把祖制引用逼回「可否验于当下」。')
    await expect(page.getByLabel('版本备注（可选）')).toHaveValue('')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('version-card')).toHaveCount(2)
    const { versions } = await versionsOf(page, agentA)
    const newest = versions.reduce((a, b) => (a.id > b.id ? a : b))
    expect(newest.note ?? '').toBe('')
    expect(newest.createdAt).toBeGreaterThan(0)
    await expect(page.getByTestId('version-time')).toHaveCount(2)
  })
})

test('agent-edit：策略改名（P2）', async ({ page }) => {
  test.setTimeout(300_000)
  await signup(page, 'edit-rename')

  let agentA = 0
  await test.step('假如 我有一个未起名的商鞅策略，展示为「商鞅 #id」', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, '未起名策略的首稿。')
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

test('agent-edit：空策略可删、有版本的不可删、空壳不开引导门（P8a/P8b）', async ({ page }) => {
  test.setTimeout(300_000)
  await signup(page, 'edit-empty-strategy')

  let agentA = 0
  await test.step('假如 我有一个有版本的商鞅策略，并建了一个一版没存的甘龙空壳', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, '商鞅首稿：徙木立信。')
    await createViaScenarioPage(page, 'b') // 只建号，不保存版本
  })

  await test.step('当 我尝试「再建一个商鞅」；那么 引导门仍然挡下（空壳对侧不算数，P8a）', async () => {
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: '创建并进入构建' }).click()
    await expect(dialog.getByText(/需先有一个对侧智能体/)).toBeVisible()
    await dialog.getByRole('button', { name: '取消' }).click()
  })

  await test.step('那么 有版本的策略那一行没有「删除」，空壳那一行有（P8b）', async () => {
    await expect(page.getByRole('button', { name: `删除智能体 #${agentA}` }))
      .toHaveCount(0)
    await expect(page.getByRole('button', { name: /删除智能体 #\d+/ }))
      .toHaveCount(1)
  })

  await test.step('当 我删除那个空壳；那么 该行消失', async () => {
    const del = page.getByRole('button', { name: /删除智能体 #\d+/ })
    const label = await del.getAttribute('aria-label')
    const emptyID = Number(/#(\d+)/.exec(label!)![1])
    await del.click()
    await page.getByRole('button', { name: `确认删除智能体 #${emptyID}` })
      .click()
    await expect(page.getByRole('button', { name: /删除智能体 #\d+/ }))
      .toHaveCount(0)
  })

  await test.step('当 我给甘龙保存一个版本后再试；那么 引导门放行', async () => {
    const gan = await createViaScenarioPage(page, 'b')
    await saveVersion(page, gan, '甘龙首稿：不轻掷民力。')
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    await page.getByRole('dialog').getByRole('button', {
      name: '创建并进入构建',
    }).click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
  })
})

test('agent-edit：最近编辑时间与排序（P1a）', async ({ page }) => {
  test.setTimeout(300_000)
  await signup(page, 'edit-recency')

  let agentA = 0
  let agentB = 0
  await test.step('假如 我在商鞅侧先后有两个策略 A、B（引导门已放行）', async () => {
    const gan = await createViaScenarioPage(page, 'b')
    await saveVersion(page, gan, '甘龙首稿：不轻掷民力。')
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, 'A 的首稿。')
    await page.goto('/my-agents')
    await page.getByLabel(`再建一个${SCENARIO_TITLE}·商鞅侧智能体`).click()
    await page.getByRole('dialog').getByRole('button', {
      name: '创建并进入构建',
    }).click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    agentB = Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
    await saveVersion(page, agentB, 'B 的首稿。')
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
    // 商鞅侧两行；最近编辑的 A 必须排在 B 前面（旧实现是 id 升序＝A、B 恰好
    // 同序，所以这里特意让 B 更晚创建、A 更晚编辑，两种排序结论相反）。
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
    const b = side.find((x) => x.agentID === agentB)
    expect(a?.lastEditedAt ?? 0).toBeGreaterThan(0)
    expect(a!.lastEditedAt!).toBeGreaterThanOrEqual(b!.lastEditedAt!)
  })
})
