// U01 编辑与版本 — compare/u01-edit-versions.feature 的可执行对应。
//
// 锚定 v3.4：E7/#83 初始化-only · #90 残留文案 · E10/#84 保存提示 ·
// P1/#63 展示名 · P9 胶囊 · E11/#88 EA 同构 · P12 提示句落点 · P13 DA 侧卡 ·
// P2/P3 EA 补名。
//
// ⚠ 审计约定：断言按**规格**写、对**线上**跑——红测试＝dev 与规格的真实
// 差异（审计交付物），不要为了变绿去改断言；feature 里逐条注明了预期红。
// 前置：与 agent-edit.spec.ts 同一账号、同一故事线（先跑 agent-edit）。
import { expect, type Page, test } from '@playwright/test'

import { ensureSharedAccount, sharedStatePath } from '../helpers'

const SHANGYANG = 'shangyang-court'

test.use({ storageState: sharedStatePath() })

test.beforeAll(async ({ browser }) => {
  // 远程 dev 上注册/登录一趟可能超过默认 30s 钩子预算。
  test.setTimeout(120_000)
  await ensureSharedAccount(browser)
})

interface InventoryAgent {
  agentID: number
  name?: string | null
  versionCount: number
  entryVersionID?: number | null
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

// 故事线角色：A＝最早的商鞅（未起名）；B＝名「激进」；C＝其余里最新的；
// gan＝甘龙侧唯一策略。缺谁就地跳过（audit 的前置由 agent-edit 建立）。
async function cast(page: Page) {
  const sides = await shangyangSides(page)
  const a = [...sides.a].sort((x, y) => x.agentID - y.agentID)
  return {
    agentA: a[0] ?? null,
    agentB: a.find((agent) => agent.name === '激进') ?? null,
    agentC:
      a.filter((agent) => agent !== a[0] && agent.name !== '激进').at(-1) ??
        null,
    gan: sides.b[0] ?? null,
  }
}

async function openBuilder(page: Page, agentID: number) {
  await page.goto(`/agents/${agentID}/build`)
  await expect(page.getByLabel('策略提示词')).toBeEnabled({ timeout: 30_000 })
}

// E7 对照要反复用到「清空工作区→观察→复原」——复原发生在断言之前，红
// 测试也不会把故事线的草稿留在被清空的状态。
async function clearWorkspaceAndObserve(page: Page, agentID: number) {
  await openBuilder(page, agentID)
  const input = page.getByLabel('策略提示词')
  const draftBefore = await input.inputValue()
  if (draftBefore.trim() === '') {
    await input.fill('临时草稿：为清空对照准备的一句。')
    await expect(page.getByText('已自动暂存')).toBeVisible()
  }
  const restoreTo = (await input.inputValue()).trim() === ''
    ? '复原草稿。'
    : await input.inputValue()
  await page.getByRole('button', { name: '清空工作区（重新选择初始化方式）' })
    .click()
  await page.getByRole('button', { name: '确认清空' }).click()
  await expect(input).toHaveValue('')
  // 观察窗口：InitModes 是否复活、残留文案是否出现。
  const mcqTabVisible = await page.getByText('MCQ 拼装').isVisible()
  const forkResidueCount = await page.getByText(/复制为新智能体/).count()
  // 复原草稿（断言之前——红测试也不能破坏故事线状态）。
  await input.fill(restoreTo)
  await expect(page.getByText('已自动暂存')).toBeVisible()
  return { mcqTabVisible, forkResidueCount }
}

test('u01：迭代期不提供选卡入口（E7）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentC } = await cast(page)
  test.skip(agentC == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  await test.step('假如 C 已有版本且工作区里有文本；当 我进入 C 的工作区', async () => {
    await openBuilder(page, agentC!.agentID)
    const input = page.getByLabel('策略提示词')
    if ((await input.inputValue()).trim() === '') {
      await input.fill('C 的草稿：为 E7 对照补一句正文。')
      await expect(page.getByText('已自动暂存')).toBeVisible()
    }
  })

  await test.step('那么 页面上没有「MCQ 拼装」页签（迭代只有文本工作台）', async () => {
    await expect(page.getByText('MCQ 拼装')).toHaveCount(0)
  })

  await test.step('并且 有一句就地引导文案（禁止入口处不弹窗）', async () => {
    await expect(
      page.getByRole('button', { name: '清空工作区（重新选择初始化方式）' }),
    ).toBeVisible()
  })
})

test('u01：清空工作区后选卡不应在本策略复活（E7，预期红）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentC } = await cast(page)
  test.skip(agentC == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  let observed = { mcqTabVisible: false, forkResidueCount: 0 }
  await test.step('假如 我在 C 的工作区点「清空工作区」并确认', async () => {
    observed = await clearWorkspaceAndObserve(page, agentC!.agentID)
  })

  await test.step('那么 按 E7，选卡重来只该走「再建一个」新策略——本策略不应重新出现「MCQ 拼装」', async () => {
    expect(
      observed.mcqTabVisible,
      'E7：保存过版本的策略不应重新提供选卡初始化',
    ).toBe(false)
  })
})

test('u01：界面残留「复制为新智能体」字样（#90，预期红）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentC } = await cast(page)
  test.skip(agentC == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  let observed = { mcqTabVisible: false, forkResidueCount: 0 }
  await test.step('假如 C 的工作区为空、初始化三选一可见', async () => {
    observed = await clearWorkspaceAndObserve(page, agentC!.agentID)
  })

  await test.step('那么 页面上不应出现「复制为新智能体」字样（#90：删除该按钮与其全部降级分支）', async () => {
    expect(
      observed.forkResidueCount,
      '#90：残留文案「…或从版本卡『复制为新智能体』」仍在 InitModes 说明句里',
    ).toBe(0)
  })
})

test('u01：保存的新版本不是 ★ 时提示参赛版本未动（E10）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentB } = await cast(page)
  test.skip(agentB == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  await test.step('假如 B 的 ★ 在 v1 而最新版本不止 v1；当 我在 B 的工作区保存一个新版本', async () => {
    const versions = await (await page.request.get(
      `/v1/agents/${agentB!.agentID}/versions`,
    )).json() as {
      versions: Array<{ id: number; ordinal?: number }>
      entryVersionID?: number
    }
    const entry = versions.versions.find((v) =>
      v.id === versions.entryVersionID
    )
    test.skip(
      entry == null || versions.versions.some((v) => v.id > entry.id) === false,
      '前置要求 ★ 不在最新版（agent-edit 的 ★ 剧本把 ★ 标在 B v1）',
    )
    await openBuilder(page, agentB!.agentID)
    const input = page.getByLabel('策略提示词')
    await input.fill('E10 对照版：保存后参赛标记应原地不动。')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('save-notice')).toBeVisible()
  })

  await test.step('那么 提示「已保存 vN · ★参赛版本仍是 v1——新版本不会自动参赛」', async () => {
    await expect(page.getByTestId('save-notice')).toContainText('已保存')
    await expect(page.getByTestId('save-notice')).toContainText(
      '★参赛版本仍是 v1',
    )
    await expect(page.getByTestId('save-notice')).toContainText(
      '新版本不会自动参赛',
    )
  })
})

test('u01：保存提示里带「一键改标」（E10/#84 文案，预期红）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentB } = await cast(page)
  test.skip(agentB == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  await test.step('假如 我刚在 B 保存了一个非 ★ 的新版本', async () => {
    await openBuilder(page, agentB!.agentID)
    const input = page.getByLabel('策略提示词')
    await input.fill('E10 文案对照版：提示应带一键改标。')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('save-notice')).toBeVisible()
  })

  await test.step('那么 按 #84，保存成功提示应带「参赛版本仍是 vK · 一键改标」', async () => {
    await expect(page.getByTestId('save-notice')).toContainText('一键改标')
  })
})

test('u01：E 页与 EA 页页头用策略展示名，id 降为小字（P1）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentA, agentB } = await cast(page)
  test.skip(
    agentA == null || agentB == null,
    '故事线未建立（先跑 agent-edit.spec.ts）',
  )

  await test.step('那么 B 的工作区页头显示「商鞅「激进」」', async () => {
    await openBuilder(page, agentB!.agentID)
    await expect(page.getByText('商鞅「激进」')).toBeVisible()
  })

  await test.step('并且 A 的工作区页头显示「商鞅 #id」（未起名回落）', async () => {
    await openBuilder(page, agentA!.agentID)
    await expect(page.getByText(`商鞅 #${agentA!.agentID}`)).toBeVisible()
  })

  await test.step('并且 B 的智能体主页标题是「商鞅「激进」」，#id 以小字可复制形式出现', async () => {
    await page.goto(`/agents/${agentB!.agentID}`)
    await expect(page.getByRole('heading', { name: '商鞅「激进」' }))
      .toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(`#${agentB!.agentID}`, { exact: true }))
      .toBeVisible()
  })
})

test('u01：同侧多策略时 EA 页头出现切换胶囊，仅 1 个时不出现（P9）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentA, gan } = await cast(page)
  test.skip(
    agentA == null || gan == null,
    '故事线未建立（先跑 agent-edit.spec.ts）',
  )

  await test.step('那么 A 的智能体主页有一排兄弟策略胶囊（当前策略高亮，共 3 枚）', async () => {
    await page.goto(`/agents/${agentA!.agentID}`)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 30_000 })
    await expect(page.locator('button[aria-current="page"]')).toHaveCount(1)
    expect(await page.getByRole('button', { name: /^商鞅/ }).count())
      .toBeGreaterThanOrEqual(3)
  })

  await test.step('并且 甘龙的智能体主页没有胶囊（同侧仅 1 个策略）', async () => {
    await page.goto(`/agents/${gan!.agentID}`)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 30_000 })
    await expect(page.locator('button[aria-current="page"]')).toHaveCount(0)
  })
})

test('u01：EA 版本卡与 E 页同构，页头「编辑」进入工作区（E11/E1）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentA } = await cast(page)
  test.skip(agentA == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  await test.step('那么 A 的智能体主页版本卡动作为：展开全文 / 设为参赛版本 / 基于该版本迭代 / 出战', async () => {
    await page.goto(`/agents/${agentA!.agentID}`)
    await expect(page.getByTestId('version-card').first())
      .toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /展开 v\d+ 全文/ }).first())
      .toBeVisible()
    await expect(
      page.getByRole('button', { name: /设为.*参赛版本/ }).first(),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /基于 v\d+ 迭代/ }).first())
      .toBeVisible()
    await expect(page.getByRole('button', { name: /用 v\d+ 出战/ }).first())
      .toBeVisible()
  })

  await test.step('并且 EA 版本卡上不存在「复制为新智能体」（#90）', async () => {
    await expect(page.getByRole('button', { name: /复制为新智能体/ }))
      .toHaveCount(0)
  })

  await test.step('并且 EA 另有「版本对比」段落（E 页没有）', async () => {
    await expect(page.getByText('版本对比')).toBeVisible()
  })

  await test.step('当 我点页头「编辑」；那么 进入该策略的工作区（E1：编辑＝进入工作区）', async () => {
    await page.getByRole('button', { name: '编辑', exact: true }).click()
    await expect(page).toHaveURL(
      new RegExp(`/agents/${agentA!.agentID}/build`),
    )
  })
})

test('u01：「保存后将成为 v(N+1)」常驻保存按钮旁且不逐卡重复（P12）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentA } = await cast(page)
  test.skip(agentA == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  await test.step('那么 E 页「保存后将成为 v(N+1)」恰出现一次（保存按钮旁），版本卡上不重复', async () => {
    await openBuilder(page, agentA!.agentID)
    await expect(page.getByTestId('version-card').first()).toBeVisible()
    await expect(page.getByText(/保存后将成为 v\d+/)).toHaveCount(1)
  })

  await test.step('并且 EA 页该句在版本段落级恰出现一次', async () => {
    await page.goto(`/agents/${agentA!.agentID}`)
    await expect(page.getByTestId('version-card').first())
      .toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/保存后将成为 v\d+/)).toHaveCount(1)
  })
})

test('u01：DA 侧卡按钮组换成「再建一个 / 查看我的（N）」（P13）', async ({ page }) => {
  test.setTimeout(180_000)
  const sides = await shangyangSides(page)
  test.skip(
    sides.a.length < 3 || sides.b.length < 1,
    '故事线未建立（先跑 agent-edit.spec.ts）',
  )

  await test.step('当 我打开商鞅场景介绍页', async () => {
    await page.goto(`/scenarios/${SHANGYANG}`)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 30_000 })
  })

  await test.step('那么 商鞅侧卡显示「你已有 3 个商鞅：…」', async () => {
    await expect(page.getByText(`你已有 ${sides.a.length} 个商鞅`))
      .toBeVisible()
  })

  await test.step('并且 按钮组为「再建一个商鞅」与「查看我的商鞅（3）」', async () => {
    await expect(page.getByRole('button', { name: '再建一个商鞅' }))
      .toBeVisible()
    await expect(
      page.getByRole('button', { name: `查看我的商鞅（${sides.a.length}）` }),
    ).toBeVisible()
  })

  await test.step('并且 甘龙侧卡显示「你已有 1 个甘龙：…」与对应按钮组', async () => {
    await expect(page.getByText(`你已有 ${sides.b.length} 个甘龙`))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '再建一个甘龙' }))
      .toBeVisible()
    await expect(
      page.getByRole('button', { name: `查看我的甘龙（${sides.b.length}）` }),
    ).toBeVisible()
  })
})

test('u01：EA 页可以就地改名（P2/P3 落点，预期红）', async ({ page }) => {
  test.setTimeout(180_000)
  const { agentA } = await cast(page)
  test.skip(agentA == null, '故事线未建立（先跑 agent-edit.spec.ts）')

  await test.step('那么 按 P2（页面落点：我的智能体·EA），A 的智能体主页应提供改名入口', async () => {
    await page.goto(`/agents/${agentA!.agentID}`)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /重命名|改名/ }))
      .toBeVisible()
  })
})
