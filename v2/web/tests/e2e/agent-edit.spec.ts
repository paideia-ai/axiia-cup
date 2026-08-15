// 智能体编辑与版本 — agent-edit.feature 的可执行对应（BDD：每个 test.step
// 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：#81/E1 草稿 · #82/E2/E3 线性版本与恢复 · #84/E4 复制为新智能体 ·
// #25 双编号 · #33 设为参赛版本 · #56 同侧多槽 · #59/#79 引导门。
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
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: '去构建' }).nth(side === 'a' ? 0 : 1)
    .click()
  await expect(page).toHaveURL(/\/agents\/\d+\/build/)
  return Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
}

// 工作区里保存一个版本。noise 是保存前的额外草稿暂存轮数（每轮改一次文本并
// 等 debounce 落库）——「恒 +1」规则用它证明版本号与暂存次数无关。
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
  await expect(input).toBeEnabled()
  for (let round = 0; round < noise; round++) {
    await input.fill(`${prompt} ——草稿噪声第 ${round + 1} 轮，不该影响版本号`)
    await page.waitForTimeout(900)
  }
  await input.fill(prompt)
  const save = page.getByTestId('save-version')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
}

async function versionsOf(page: Page, agentID: number) {
  const response = await page.request.get(`/v1/agents/${agentID}/versions`)
  expect(response.ok()).toBe(true)
  return await response.json() as {
    versions: Array<
      { id: number; ordinal?: number; prompt: string }
    >
    entryVersionID: number
  }
}

test('agent-edit：迭代 A 从 v1 到 v2，选择 v2 出战；草稿不产生版本', async ({ page }) => {
  test.setTimeout(240_000)
  await signup(page, 'edit-iterate')

  let agentA = 0
  await test.step('假如 我在场景页点甲方「去构建」——首个商鞅智能体 A 即建即进工作区', async () => {
    agentA = await createViaScenarioPage(page, 'a')
  })

  const v1Prompt = '徙木立信：先立可验证的小承诺，再谈变法大义。'
  await test.step('当 我输入首稿并点「保存」；那么 A 产生 v1 并回到主页，v1 自动为 ★参赛版本', async () => {
    await saveVersion(page, agentA, v1Prompt)
    await expect(page.getByText('版本（1）')).toBeVisible()
    await expect(page.getByText('参赛版本').first()).toBeVisible()
    const { versions, entryVersionID } = await versionsOf(page, agentA)
    expect(versions).toHaveLength(1)
    expect(entryVersionID).toBe(versions[0].id)
  })

  const v2Prompt = '第二版：把甘龙的每条祖制引用都逼回「可否验于当下」。'
  await test.step('当 我再次进入工作区、改写文本并点「保存」；那么 主页为「版本（2）」，列表最新在前，卡片带 vN 与 #id 双编号与四个动作', async () => {
    await saveVersion(page, agentA, v2Prompt)
    await expect(page.getByText('版本（2）')).toBeVisible()
    const { versions } = await versionsOf(page, agentA)
    expect(versions).toHaveLength(2)
    // 双编号（#25）：vN 与 #全局id 并排。
    await expect(page.getByText('v2', { exact: true })).toBeVisible()
    await expect(page.getByText('v1', { exact: true })).toBeVisible()
    for (const version of versions) {
      await expect(page.getByText(`#${version.id}`, { exact: true }))
        .toBeVisible()
    }
    // 最新在前：版本卡标签按 DOM 顺序为 v2、v1（页头「参赛版本仍是 v1」
    // 横幅等散文里的 vN 不算——只看独立的卡片标签节点）。
    const cardLabels = await page.getByText(/^v\d+$/).allTextContents()
    expect(cardLabels).toEqual(['v2', 'v1'])
    // 版本卡动作齐全（按钮的可访问名带版本号，如「展开 v2 全文」——按
    // aria-label 匹配，不按可见文本）。
    await expect(page.getByRole('button', { name: /展开 v\d+ 全文/ }).first())
      .toBeVisible()
    await expect(page.getByRole('button', { name: /设为参赛版本/ }))
      .toBeVisible()
    await expect(
      page.getByRole('button', { name: /恢复 v\d+ 到工作区/ }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /复制为新智能体/ }).first(),
    ).toBeVisible()
  })

  await test.step('当 我在 v2 卡点「设为参赛版本」；那么 ★ 从 v1 移到 v2，且提示「保存后将成为 v3」', async () => {
    await page.getByRole('button', { name: /设为参赛版本/ }).click()
    const { versions } = await versionsOf(page, agentA)
    const v2 = versions.reduce((a, b) => (a.id > b.id ? a : b))
    await expect.poll(async () =>
      (await versionsOf(page, agentA)).entryVersionID
    ).toBe(v2.id)
    await expect(page.getByText('保存后将成为 v3').first()).toBeVisible()
  })

  await test.step('当 我在工作区打字但不保存、离开再回来；那么 草稿仍在而版本数仍是 2', async () => {
    const draft = '这段只是草稿：三年不改一字者，非慎也，怠也。'
    await page.goto(`/agents/${agentA}/build`)
    await page.getByLabel('策略提示词').fill(draft)
    await page.waitForTimeout(1600)
    await page.goto('/my-agents')
    await page.goto(`/agents/${agentA}/build`)
    await expect(page.getByLabel('策略提示词')).toHaveValue(draft)
    expect((await versionsOf(page, agentA)).versions).toHaveLength(2)
  })
})

test('agent-edit：复制为新智能体——引导门先挡后放，B 从 v1 重新计数', async ({ page }) => {
  test.setTimeout(240_000)
  await signup(page, 'edit-fork')

  let agentA = 0
  const forkSource = 'A 的 v2 全文（复制源）：以「验于当下」为唯一裁准。'
  await test.step('假如 我只有商鞅侧智能体 A，且已迭代到 v2', async () => {
    agentA = await createViaScenarioPage(page, 'a')
    await saveVersion(page, agentA, 'A 的 v1：先徙木，后论法。')
    await saveVersion(page, agentA, forkSource)
    await expect(page.getByText('版本（2）')).toBeVisible()
  })

  await test.step('当 我在 v2 卡点「复制为新智能体」；那么 引导门文案出现，且没有新建智能体', async () => {
    await page.getByRole('button', { name: /复制为新智能体/ }).first().click()
    await expect(
      page.getByText('需先拥有对侧智能体才能在同侧再建（引导门 #59）'),
    ).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentA}$`))
  })

  await test.step('假如 我创建了甘龙侧智能体（引导门放行）', async () => {
    await createViaScenarioPage(page, 'b')
  })

  let agentB = 0
  await test.step('当 我再次复制 A 的 v2；那么 新建同侧智能体 B、进入其工作区，草稿＝A v2 全文', async () => {
    await page.goto(`/agents/${agentA}`)
    await page.getByRole('button', { name: /复制为新智能体/ }).first().click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    agentB = Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
    expect(agentB).not.toBe(agentA)
    await expect(page.getByLabel('策略提示词')).toHaveValue(forkSource)
    expect((await versionsOf(page, agentB)).versions).toHaveLength(0)
  })

  await test.step('当 我点「保存」；那么 B 计数「版本（1）」、唯一版本 v1 内容＝A v2 文本，且商鞅侧出现两行', async () => {
    await saveVersion(page, agentB, forkSource)
    await expect(page.getByText('版本（1）')).toBeVisible()
    await expect(page.getByText('v1', { exact: true })).toBeVisible()
    const { versions } = await versionsOf(page, agentB)
    expect(versions).toHaveLength(1)
    expect(versions[0].ordinal ?? 1).toBe(1)
    expect(versions[0].prompt).toBe(forkSource)
    // #56 同侧多槽：我的智能体页商鞅侧同时列出 A、B。
    await page.goto('/my-agents')
    await expect(page.getByText(`#${agentA}`, { exact: true })).toBeVisible()
    await expect(page.getByText(`#${agentB}`, { exact: true })).toBeVisible()
  })

  await test.step('当 我改写 B 的文本再保存；那么 B 显示 v2、v1——版本线独立于 A', async () => {
    await saveVersion(page, agentB, 'B 的 v2：另起一路，先破「利不百不变法」。')
    await expect(page.getByText('版本（2）')).toBeVisible()
    const { versions } = await versionsOf(page, agentB)
    expect(versions.map((v) => v.ordinal ?? 0)).toEqual([1, 2])
  })
})

test('agent-edit：A/B/C 迭代到 v3/v4/v5——版本号恒 +1，与暂存噪声无关；恢复到工作区不产版本', async ({ page }) => {
  // 12 次带草稿噪声的保存打在远程 dev 上，420s 会被吃满——预算放到 10 分钟。
  test.setTimeout(600_000)
  await signup(page, 'edit-linear')

  await test.step('假如 引导门已放行（对侧甘龙已存在）', async () => {
    await createViaScenarioPage(page, 'b')
  })

  let agentA = 0
  const siblings: number[] = []
  await test.step('并且 我拥有同侧智能体 A、B、C（后两个经「再建一个」创建）', async () => {
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
        // 每次保存前 1–2 轮草稿噪声：若版本号误用暂存水位（08-14 缺陷），
        // 这里会立刻跳号。
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
      await expect(page.getByText(`v${plan.target}`, { exact: true }))
        .toBeVisible()
    })
  }

  await test.step('当 我在 A 的 v1 卡点「恢复到工作区」；那么 载入 v1 全文且版本数不变；再保存产生 v4', async () => {
    await page.goto(`/agents/${agentA}`)
    const { versions } = await versionsOf(page, agentA)
    const v1 = versions.reduce((a, b) => (a.id < b.id ? a : b))
    await page.getByRole('button', { name: '恢复 v1 到工作区' }).click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build\?from=/)
    await expect(page.getByText(/已恢复 v1 到工作区/)).toBeVisible()
    await expect(page.getByLabel('策略提示词')).toHaveValue(v1.prompt)
    expect((await versionsOf(page, agentA)).versions).toHaveLength(3)
    await saveVersion(page, agentA, 'A 的第 4 版：从 v1 出发另走一条线。')
    const after = await versionsOf(page, agentA)
    expect(after.versions.map((v) => v.ordinal ?? 0)).toEqual([1, 2, 3, 4])
  })
})
