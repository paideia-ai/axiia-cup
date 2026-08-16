// U02 · 构建器核心 — u02-builder-core.feature 的可执行对应（BDD：每个
// test.step 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature
// 为准）。红色结果是审计数据（dev 与规格的分歧），不是要修的测试。
//
// 锚定 v3.4：#83/#15/#12 三初始化 · #13/#21 模型选择器与模型公开 · P5 模型
// 继承 · #14 逐方 1000 · #17/#88 保存语义与不跳转 · E10「参赛版本仍是 vK ·
// 一键改标」· P12 提示常驻 · #68 三层 prompt · #18 无未完成控件 · C3 缺席 ·
// #90 废止文案连带。场景固定「商鞅变法·朝堂辩法」，本套用乙方＝甘龙侧。
//
// 账号硬规则：最多 1 个新账号、两法共用——AXIIA_U02_EMAIL/AXIIA_U02_PASSWORD
// 传入旅程法创建的账号则登录复用；缺席时才注册（helpers.signup）。
// 对战预算 0：本套从不派发对局。
//
// 健壮性：预期为红的断言会吃满 expect 预算，若测试超时会拖垮整个 worker
// （beforeAll 重跑、模块态清零）——因此每条测试自给自足（自行导航、自行从
// API 重建状态），并把单测超时抬到远大于 expect 预算。
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import { baseURL, registrationCode, signup } from '../helpers'

const SHANGYANG = 'shangyang-court'
const AUDIT_EMAIL = process.env.AXIIA_U02_EMAIL ?? ''
const AUDIT_PASSWORD = process.env.AXIIA_U02_PASSWORD ?? 'playwrightpw-123456'

test.describe.configure({ timeout: 180_000 })

// 甘龙侧 deck（src/scenarios/decks/shangyang-court.ts）逐题第一个选项——
// deck 内容是稳定选择器。
const MCQ_FIRST_OPTIONS_SIDE_B = [
  '商鞅只懂新法，你更了解秦国实情',
  '新法一旦失败，秦国会先乱起来',
  '谁来执行？地方官不听怎么办？',
  '先阻止变法，再顺带争取目标',
]

let ctx: BrowserContext
let page: Page
let agentID = 0

async function versionsOf() {
  const response = await page.request.get(`/v1/agents/${agentID}/versions`)
  expect(response.ok(), 'versions endpoint answers').toBe(true)
  return await response.json() as {
    versions: Array<{
      id: number
      ordinal?: number
      prompt: string
      modelID: string
      isEntry?: boolean
    }>
    entryVersionID?: number | null
  }
}

function ordinalOf(
  version: { id: number; ordinal?: number },
  siblings: Array<{ id: number }>,
): number {
  return version.ordinal ??
    siblings.filter((other) => other.id <= version.id).length
}

// 审计选定的模型＝清单第二项（只有一项时取第一项）——两法共用同一确定性
// 选择，worker 重启后也能从 API 重建。
async function auditModel() {
  const response = await page.request.get('/v1/models')
  expect(response.ok()).toBe(true)
  const { models } = await response.json() as {
    models: Array<{ id: string; label: string }>
  }
  return { models, chosen: models[1] ?? models[0] }
}

async function gotoBuild() {
  if (!new RegExp(`/agents/${agentID}/build`).test(page.url())) {
    await page.goto(`/agents/${agentID}/build`)
  }
  await expect(page.getByLabel('策略提示词')).toBeEnabled({ timeout: 30_000 })
}

// 让工作区回到空态（init 三选一挂载的前提）。清空链路本身是 U02-C19 的
// 审计对象；这里只把它当作复位手段。
async function ensureEmptyWorkspace() {
  await gotoBuild()
  const workspace = page.getByLabel('策略提示词')
  if ((await workspace.inputValue()) !== '') {
    await page.getByText('清空工作区（重新选择初始化方式）').click()
    await page.getByRole('button', { name: '确认清空' }).click()
    await expect(workspace).toHaveValue('')
  }
}

// 保证工作区有可保存的文本（不经 MCQ 也行——method 佐证走 API 探针）。
async function ensureDraftText(text: string) {
  await gotoBuild()
  const workspace = page.getByLabel('策略提示词')
  if ((await workspace.inputValue()) === '') {
    await workspace.fill(text)
    await page.waitForTimeout(900)
  }
}

test.beforeAll(async ({ browser }) => {
  expect(registrationCode || AUDIT_EMAIL, 'code or audit account must be set')
    .toBeTruthy()
  ctx = await browser.newContext({
    baseURL: baseURL || 'http://127.0.0.1:5173',
  })
  page = await ctx.newPage()
  if (AUDIT_EMAIL) {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(AUDIT_EMAIL)
    await page.getByLabel('密码').fill(AUDIT_PASSWORD)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/(scenarios|express)/, { timeout: 30_000 })
  } else {
    await signup(page, 'u02')
  }
  // 甘龙侧 agent：已有（复跑/worker 重启/5173 侧证）则复用；否则走场景页
  // 「去构建」创建。
  const mine = await page.request.get('/v1/my/agents')
  if (mine.ok()) {
    const inventory = await mine.json() as {
      scenarios: Array<{
        scenarioID: string
        sides: { a: Array<{ agentID: number }>; b: Array<{ agentID: number }> }
      }>
    }
    const hit = inventory.scenarios
      .find((s) => s.scenarioID === SHANGYANG)?.sides.b[0]
    if (hit) agentID = hit.agentID
  }
  if (agentID === 0) {
    await page.goto(`/scenarios/${SHANGYANG}`)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 30_000 })
    // 分支有逐侧 testid build-agent-b；老前端的乙方按钮没有 testid——退回
    // 「去构建」的最后一枚（乙方侧卡在后）。
    const byID = page.getByTestId('build-agent-b')
    if (await byID.count() > 0) {
      await byID.click()
    } else {
      await page.getByRole('button', { name: '去构建' }).last().click()
    }
    await expect(page).toHaveURL(/\/agents\/\d+\/build/, { timeout: 30_000 })
    agentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
  }
  expect(agentID).toBeGreaterThan(0)
})

test.afterAll(async () => {
  await ctx?.close()
})

test('空工作区出现三选一初始化卡，MCQ 默认（U02-C01/C02）', async () => {
  await test.step('假如 工作区为空（必要时先走「清空工作区」回到空态）', async () => {
    await ensureEmptyWorkspace()
  })
  await test.step('那么 页面出现「初始化方式 · 三选一生成首稿」卡', async () => {
    await expect(page.getByText('初始化方式 · 三选一生成首稿')).toBeVisible()
  })
  await test.step('并且 三个 tab 依次为「MCQ 拼装 / Basic 直写 / 元提示词」', async () => {
    await expect(page.getByRole('tab')).toHaveText([
      'MCQ 拼装',
      'Basic 直写',
      '元提示词',
    ])
  })
  await test.step('并且 「MCQ 拼装」默认选中', async () => {
    await expect(page.getByRole('tab', { name: 'MCQ 拼装' }))
      .toHaveAttribute('aria-selected', 'true')
  })
})

test('初始化卡副标题不引用已废止的「复制为新智能体」（U02-C18，#90）', async () => {
  await test.step('那么 初始化卡副标题里不出现「复制为新智能体」（#90 已废止该动作）', async () => {
    await ensureEmptyWorkspace()
    const subtitle = page.getByText('保存即成为')
    await expect(subtitle).toBeVisible()
    // 预期为红的负向断言给小预算，别吃满 expect 预算拖慢全套。
    await expect(subtitle).not.toContainText('复制为新智能体', {
      timeout: 3000,
    })
  })
})

test('元提示词初始化＝复制出去、粘贴回来，产品内不提供聊天（U02-C04）', async () => {
  await test.step('当 我切到「元提示词」tab', async () => {
    await ensureEmptyWorkspace()
    await page.getByRole('tab', { name: '元提示词' }).click()
  })
  await test.step('那么 我能看到元提示词正文与「复制元提示词」按钮', async () => {
    await expect(page.getByRole('button', { name: '复制元提示词' }))
      .toBeVisible()
    await expect(page.locator('pre').first()).toContainText('策略提示词')
  })
  await test.step('并且 有一个粘贴框，且「填入工作区」在粘贴前不可用', async () => {
    await expect(page.getByPlaceholder('把 AI 生成的策略提示词粘贴到这里…'))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '填入工作区' }))
      .toBeDisabled()
  })
  await test.step('并且 页面上没有任何聊天或发送控件', async () => {
    await expect(page.getByRole('button', { name: /发送|开始对话/ }))
      .toHaveCount(0)
  })
})

test('MCQ 拼装生成首稿并填入工作区（U02-C02）', async () => {
  await test.step('当 我切回「MCQ 拼装」tab 并逐题各选一个选项', async () => {
    await ensureEmptyWorkspace()
    await page.getByRole('tab', { name: 'MCQ 拼装' }).click()
    for (const label of MCQ_FIRST_OPTIONS_SIDE_B) {
      await page.getByRole('button', { name: label }).click()
    }
  })
  await test.step('那么 拼装预览逐节长出，并按「x / 1000」计数', async () => {
    await expect(page.locator('pre').first()).toContainText('你的身份')
    await expect(page.getByText(/\d+ \/ 1000/).first()).toBeVisible()
  })
  await test.step('当 我点「填入工作区」', async () => {
    await page.getByRole('button', { name: '填入工作区' }).click()
  })
  await test.step('那么 工作区载入拼装文本，初始化卡收起', async () => {
    await expect(page.getByLabel('策略提示词')).not.toHaveValue('')
    await expect(page.getByText('初始化方式 · 三选一生成首稿'))
      .toBeHidden()
  })
})

test('模型选择器清单来自可配置的 /v1/models（U02-C06，#13）', async () => {
  await gotoBuild()
  const { models, chosen } = await auditModel()
  await test.step('那么 构建页有明确的「模型」选择器', async () => {
    await expect(page.getByText('模型', { exact: true })).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })
  await test.step('并且 下拉清单与 /v1/models 返回的模型一一对应', async () => {
    await page.getByRole('combobox').click()
    await expect(page.getByRole('option')).toHaveText(
      models.map((model) => model.label),
    )
  })
  await test.step('当 我选择清单中的第二个模型（只有一个时选第一个）', async () => {
    await page.getByRole('option', { name: chosen.label, exact: true })
      .click()
    await expect(page.getByRole('combobox')).toContainText(chosen.label)
  })
})

test('保存后留在 E 页（U02-C10，#88 保存按钮侧）', async () => {
  let before = 0
  await test.step('当 我点「保存版本」', async () => {
    await ensureDraftText('守成首稿：先问执行成本，再问失败退路。')
    const { chosen } = await auditModel()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: chosen.label, exact: true }).click()
    before = (await versionsOf()).versions.length
    await page.getByTestId('save-version').click()
  })
  await test.step('那么 我仍停留在 /agents/:id/build（不跳转到智能体主页）', async () => {
    // 先等保存真正落库（新版行为留在 E 页，老行为跳 EA），再断言 URL。
    await expect
      .poll(async () => (await versionsOf()).versions.length, {
        timeout: 30_000,
      })
      .toBe(before + 1)
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build`))
  })
})

test('保存的版本记录初始化方式与所选模型（U02-C05/C07，#83/#13）', async () => {
  const list = await versionsOf()
  const latest = [...list.versions].sort((a, b) => b.id - a.id)[0]
  const { chosen } = await auditModel()
  await test.step('当 我点「保存版本」产生新版本', async () => {
    expect(list.versions.length).toBeGreaterThan(0)
  })
  await test.step('那么 服务端校验并记录初始化方式（未知 method 值被拒绝）', async () => {
    // 版本接口不回显 method（服务端落库、DTO 缺席）——以校验管道佐证：
    // 未知 method 被 400 拒绝，且不产生版本。
    const bad = await page.request.post(`/v1/agents/${agentID}/save`, {
      headers: { 'Sec-Fetch-Site': 'same-origin' },
      data: {
        prompt: '仅用于校验管道，不应入库。',
        modelID: chosen.id,
        method: 'bogus-method',
      },
    })
    expect(bad.status()).toBe(400)
    expect((await versionsOf()).versions.length).toBe(list.versions.length)
  })
  await test.step('并且 新版本快照我保存时所选的模型', async () => {
    expect(latest.modelID).toBe(chosen.id)
  })
})

test('保存＝存版本，从不派发对局（U02-C09，#17）', async () => {
  await test.step('那么 对局列表中没有任何一场属于我（保存不派发，预算 0 未消耗）', async () => {
    // dev 后端开着 openBattles：/v1/matches 是全站对局流——判据是 isMine。
    const response = await page.request.get('/v1/matches')
    expect(response.ok()).toBe(true)
    const { matches } = await response.json() as {
      matches: Array<{
        participants?: { a?: { isMine?: boolean }; b?: { isMine?: boolean } }
      }>
    }
    const mine = matches.filter((match) =>
      match.participants?.a?.isMine || match.participants?.b?.isMine
    )
    expect(mine.length).toBe(0)
  })
})

test('版本的模型信息公开可见（U02-C07-ui，#21）', async () => {
  const list = await versionsOf()
  const latest = [...list.versions].sort((a, b) => b.id - a.id)[0]
  await test.step('当 我打开智能体主页', async () => {
    await page.goto(`/agents/${agentID}`)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 30_000 })
  })
  await test.step('那么 版本条目上能看到该版本的模型标识', async () => {
    await expect(page.getByText(latest.modelID).first()).toBeVisible()
  })
})

test('保存按钮旁常驻「保存后将成为 v(N+1)」（U02-C12，P12）', async () => {
  await gotoBuild()
  const count = (await versionsOf()).versions.length
  await test.step('那么 保存按钮旁常驻「保存后将成为 v(N+1)」提示（P12）', async () => {
    await expect(page.getByText(`保存后将成为 v${count + 1}`)).toBeVisible()
  })
})

test('保存成功提示带「参赛版本仍是 vK」（U02-C11，E10）', async () => {
  // 前提整备：至少已有一个版本（首个版本自动 ★），此后的保存才可能触发
  // 「参赛版本仍是 vK」提示。
  if ((await versionsOf()).versions.length === 0) {
    await ensureDraftText('守成首稿：先问执行成本，再问失败退路。')
    await page.getByTestId('save-version').click()
    await expect
      .poll(async () => (await versionsOf()).versions.length, {
        timeout: 30_000,
      })
      .toBeGreaterThan(0)
  }
  const before = await versionsOf()
  const entry = before.versions
    .find((v) => v.id === (before.entryVersionID ?? -1))
  const entryTag = entry ? `v${ordinalOf(entry, before.versions)}` : 'v1'
  await test.step('当 我修改文本并再次点「保存版本」（★ 仍在旧版本上）', async () => {
    await gotoBuild()
    await page.getByLabel('策略提示词')
      .fill(`守成之策第 ${before.versions.length + 1} 稿：先问执行，再问退路。`)
    await page.getByTestId('save-version').click()
    await expect
      .poll(async () => (await versionsOf()).versions.length, {
        timeout: 30_000,
      })
      .toBe(before.versions.length + 1)
  })
  await test.step('那么 出现「参赛版本仍是 vK」的保存提示（E10：保存不移动参赛标记）', async () => {
    await expect(page.getByText(`参赛版本仍是 ${entryTag}`).first())
      .toBeVisible()
  })
})

test('保存成功提示带「一键改标」入口（U02-C11b，E10 原文）', async () => {
  await test.step('那么 该提示带「一键改标」入口（E10 原文：「参赛版本仍是 vK · 一键改标」）', async () => {
    // 预期为红（前端任何地方都没有「一键改标」字样）——给小预算。
    await expect(page.getByText('一键改标').first()).toBeVisible({
      timeout: 3000,
    })
  })
})

test('超限有计数反馈且保存被拒绝（U02-C08，#14）', async () => {
  const before = (await versionsOf()).versions.length
  await test.step('当 我在工作区填入 1001 个汉字', async () => {
    await gotoBuild()
    await page.getByLabel('策略提示词').fill('法'.repeat(1001))
  })
  await test.step('那么 计数器显示「1001 / 1000」', async () => {
    await expect(page.getByText('1001 / 1000')).toBeVisible()
  })
  await test.step('当 我点「保存版本」', async () => {
    await page.getByTestId('save-version').click()
  })
  await test.step('那么 保存被拒绝，版本数不变', async () => {
    // 拒绝没有专属 testid：以「版本数在观察窗内保持不变」为准（若被接受，
    // 会看到 +1 而失败）。
    await page.waitForTimeout(4000)
    expect((await versionsOf()).versions.length).toBe(before)
  })
})

test('重进构建器继承最新版本的模型（U02-C17，P5）', async () => {
  const list = await versionsOf()
  const latest = [...list.versions].sort((a, b) => b.id - a.id)[0]
  const { models } = await auditModel()
  const latestLabel = models.find((m) => m.id === latest.modelID)?.label ??
    latest.modelID
  await test.step('当 我重新进入构建页', async () => {
    await page.goto(`/agents/${agentID}/build`)
    await expect(page.getByLabel('策略提示词'))
      .toBeEnabled({ timeout: 30_000 })
  })
  await test.step('那么 模型选择器默认显示最新版本的模型（而非清单首项）', async () => {
    await expect(page.getByRole('combobox')).toContainText(latestLabel)
  })
  await test.step('并且 页面注明「沿用 vN 的模型」', async () => {
    await expect(page.getByText(/沿用 v\d+ 的模型/)).toBeVisible()
  })
})

test('三层 prompt 说明与只读角色模板（U02-C13，#68）', async () => {
  await gotoBuild()
  await test.step('那么 编辑框旁有固定说明「你只需编写策略提示词；比赛时系统会自动将它与场景的角色模板合并」', async () => {
    await expect(
      page.getByText(
        '你只需编写策略提示词；比赛时系统会自动将它与场景的角色模板合并',
      ),
    ).toBeVisible()
  })
  await test.step('当 我展开「查看场景角色模板（仅供查看，无需重复编写）」', async () => {
    await page.getByText('查看场景角色模板（仅供查看，无需重复编写）').click()
  })
  await test.step('那么 能看到非空的只读角色模板正文', async () => {
    await expect(page.locator('p.whitespace-pre-wrap').first())
      .not.toBeEmpty()
  })
})

test('无构建内预览，无 C3 future 控件，无未完成占位（U02-C14/C15/C16）', async () => {
  await gotoBuild()
  await test.step('那么 构建页没有预览、快测或试运行控件', async () => {
    await expect(page.getByRole('button', { name: /预览|快测|试运行/ }))
      .toHaveCount(0)
  })
  await test.step('并且 页面上没有卡牌构建、Focus mode/专注模式等 future 功能', async () => {
    await expect(page.getByText(/卡牌|Focus mode|专注模式/)).toHaveCount(0)
  })
  await test.step('并且 页面上没有「敬请期待 / 即将上线」类未完成占位', async () => {
    await expect(page.getByText(/敬请期待|即将上线/)).toHaveCount(0)
  })
})

test('保存 v1 之后不再有初始化模式概念（U02-C19，#83 正文）', async () => {
  await test.step('假如 该智能体已有至少一个版本', async () => {
    expect((await versionsOf()).versions.length).toBeGreaterThan(0)
  })
  await test.step('当 我清空工作区', async () => {
    await ensureDraftText('临时一稿，用来走清空回头路。')
    await page.getByText('清空工作区（重新选择初始化方式）').click()
    await page.getByRole('button', { name: '确认清空' }).click()
    await expect(page.getByLabel('策略提示词')).toHaveValue('')
  })
  await test.step('那么 三选一初始化卡不再出现（重选初始化只能走「再建一个」新智能体）', async () => {
    // 预期为红（清空后三选一重新挂载）——给小预算。
    await expect(page.getByText('初始化方式 · 三选一生成首稿'))
      .toBeHidden({ timeout: 3000 })
  })
})
