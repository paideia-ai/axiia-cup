// U02 builder-core 旅程驱动（方法一）：真浏览器（CDP 共享实例）沿
// compare-v34/journeys/u02-builder-core.md 走一遍，逐条款截图并输出 JSON。
// 用法：
//   TARGET=https://axiia-cup-2-web.isofucius.cn REG_CODE=... node tests/e2e/compare/u02-journey.mjs
// 可选：EMAIL/PASSWORD 复用既有账号（最多 1 个新账号的硬规则）。
import { chromium } from 'playwright'

const TARGET = process.env.TARGET ?? 'https://axiia-cup-2-web.isofucius.cn'
const REG_CODE = process.env.REG_CODE ?? ''
const SHOTS = '/home/ubuntu/axiia-cup-uiux/compare-v34/shots/u02'
const SCENARIO = 'shangyang-court'
const PASSWORD = 'playwrightpw-123456'

// 前端 deck 注册表（src/scenarios/decks/index.ts，main 与分支一致）——#15
// 「MCQ 全场景」核查的对照面。
const DECK_SLOTS = [
  'shangyang-court',
  'honnoji-decision',
  'fengyiting-real',
  'sanguo-chain',
  'trolley-problem',
]

const MCQ_FIRST_OPTIONS_SIDE_A = [
  '你真心想达成让秦国变强的目的',
  '旧制没能让秦国变强，为了秦国的未来必须主动改变',
  '追问旧制到底有什么成果，以指出其不值得保留',
  '先赢下变法最重要，再顺带争取目标',
]

const results = []
const record = (id, status, note) => {
  results.push({ id, status, note })
  console.log(`[${id}] ${status} — ${note}`)
}

const b = await chromium.connectOverCDP('http://127.0.0.1:18800')
const ctx = await b.newContext({
  baseURL: TARGET,
  viewport: { width: 1280, height: 900 },
})
const page = await ctx.newPage()
page.setDefaultTimeout(30000)

const shot = (name) =>
  page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
const api = async (path) => {
  const r = await page.request.get(`${TARGET}/v1${path}`)
  return r.ok() ? await r.json() : { __status: r.status() }
}

let email = process.env.EMAIL ?? ''
let agentID = 0
let chosenModel = null

try {
  // ── S0 账号 ──
  if (email) {
    await page.goto(`${TARGET}/login`)
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(process.env.PASSWORD ?? PASSWORD)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForURL(/\/(scenarios|express)/)
  } else {
    email = `playwright-u02-${Date.now()}@axiia.test`
    await page.goto(`${TARGET}/register`)
    await page.getByLabel('注册码').fill(REG_CODE)
    await page.getByLabel('昵称').fill('测试玩家 u02')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(PASSWORD)
    await page.getByRole('button', { name: '创建账户' }).click()
    await page.waitForURL(/\/(express|scenarios)$/)
  }
  console.log(`account: ${email}`)

  // ── S1/C01 场景页入口 → 构建器 → 初始化卡 ──
  await page.goto(`${TARGET}/scenarios/${SCENARIO}`)
  await page.getByRole('heading', { level: 1 }).waitFor()
  // 首建路径：甲方「去构建」（main 与分支都有 build-agent testid）
  const mine = await api('/my/agents')
  const existing = mine?.scenarios
    ?.find((s) => s.scenarioID === SCENARIO)?.sides?.a?.[0]
  if (existing) {
    agentID = existing.agentID
    await page.goto(`${TARGET}/agents/${agentID}/build`)
  } else {
    await page.getByTestId('build-agent').click()
    await page.waitForURL(/\/agents\/\d+\/build/)
    agentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())[1])
  }
  const initCard = page.getByText('初始化方式 · 三选一生成首稿')
  const initVisible = await initCard.isVisible().catch(() => false)
  await shot('U02-C01')
  record(
    'U02-C01',
    initVisible ? 'pass' : 'diff',
    initVisible
      ? `去构建即建即进 /agents/${agentID}/build，空工作区出现三选一初始化卡`
      : '未见「初始化方式 · 三选一生成首稿」卡',
  )

  // ── S2/C02a 三 tab、MCQ 默认 ──
  const tabs = await page.getByRole('tab').allInnerTexts()
  const mcqSelected = await page.getByRole('tab', { name: 'MCQ 拼装' })
    .getAttribute('aria-selected')
  record(
    'U02-C02',
    tabs.join('/') === 'MCQ 拼装/Basic 直写/元提示词' && mcqSelected === 'true'
      ? 'pass'
      : 'diff',
    `tabs=${tabs.join('/')}, MCQ selected=${mcqSelected}`,
  )

  // ── S3/C18 初始化卡副标题不应引用已废止的「复制为新智能体」（#90） ──
  const subtitle = await page.getByText('保存即成为').innerText().catch(() =>
    ''
  )
  const stale = subtitle.includes('复制为新智能体')
  await shot('U02-C18')
  record('U02-C18', stale ? 'diff' : 'pass', `副标题＝「${subtitle}」`)

  // ── S4/C04 元提示词 tab ──
  await page.getByRole('tab', { name: '元提示词' }).click()
  const copyMetaBtn = page.getByRole('button', { name: '复制元提示词' })
  const pasteBox = page.getByPlaceholder('把 AI 生成的策略提示词粘贴到这里…')
  const metaOK = await copyMetaBtn.isVisible() && await pasteBox.isVisible()
  const hasChat = await page.getByRole('button', { name: /发送|对话/ }).count()
  await shot('U02-C04')
  record(
    'U02-C04',
    metaOK && hasChat === 0 ? 'pass' : 'diff',
    `复制元提示词/粘贴框=${metaOK}，聊天控件数=${hasChat}（应为 0）`,
  )

  // ── S5/C02b MCQ 拼装 → 填入工作区 ──
  await page.getByRole('tab', { name: 'MCQ 拼装' }).click()
  for (const label of MCQ_FIRST_OPTIONS_SIDE_A) {
    await page.getByRole('button', { name: label }).click()
  }
  const preview = await page.locator('pre').first().innerText()
  const fill = page.getByRole('button', { name: '填入工作区' })
  await fill.click()
  const workspace = page.getByLabel('策略提示词')
  const wsValue = await workspace.inputValue()
  const cardGone = !(await initCard.isVisible().catch(() => false))
  await shot('U02-C02')
  record(
    'U02-C02b',
    preview.length > 0 && wsValue.length > 0 && cardGone ? 'pass' : 'diff',
    `预览 ${preview.length} 字，填入后工作区 ${wsValue.length} 字，初始化卡收起=${cardGone}`,
  )

  // ── S6/C03 #15 MCQ 全场景：目录 vs deck 注册表 ──
  const cat = await api('/scenarios')
  const ids = (cat?.scenarios ?? []).map((s) => s.id ?? s.slotID)
  const uncovered = ids.filter((id) => !DECK_SLOTS.includes(id))
  record(
    'U02-C03',
    uncovered.length === 0 ? 'pass' : 'diff',
    `目录场景=${JSON.stringify(ids)}；无 deck（无 MCQ）的场景=${
      JSON.stringify(uncovered)
    }`,
  )

  // ── S7/C06 模型选择器 ──
  const modelsResp = await api('/models')
  const models = modelsResp?.models ?? []
  const combo = page.getByRole('combobox')
  const initialDisplay = await combo.innerText()
  await combo.click()
  const options = await page.getByRole('option').allInnerTexts()
  await shot('U02-C06')
  // 选第二个模型（若有），供 C07 快照与 C17 继承核查
  const pick = models[1] ?? models[0]
  chosenModel = pick?.id ?? null
  if (pick) await page.getByRole('option', { name: pick.label }).click()
  const afterDisplay = await combo.innerText()
  record(
    'U02-C06',
    models.length > 0 && options.length === models.length ? 'pass' : 'diff',
    `/v1/models=${models.length} 项，下拉=${options.length} 项；初始显示=「${initialDisplay}」（分支修复前 main 恒显示占位符），选后显示=「${afterDisplay}」`,
  )

  // ── S8/C12 pre-save：保存后将成为 v1 常驻按钮旁 ──
  const p12pre = await page.getByText('保存后将成为 v1').isVisible().catch(() =>
    false
  )
  await shot('U02-C12-pre')
  record(
    'U02-C12-pre',
    p12pre ? 'pass' : 'diff',
    `保存前按钮旁「保存后将成为 v1」可见=${p12pre}`,
  )

  // ── S9/C10 保存 v1：留在 E 页？ ──
  await page.getByTestId('save-version').click()
  await Promise.race([
    page.waitForURL(new RegExp(`/agents/${agentID}$`)).catch(() => {}),
    page.getByTestId('save-notice').waitFor().catch(() => {}),
  ])
  await page.waitForTimeout(1500)
  const stayed = new RegExp(`/agents/${agentID}/build`).test(page.url())
  await shot('U02-C10')
  record(
    'U02-C10',
    stayed ? 'pass' : 'diff',
    `保存后 URL=${page.url()}（#88 要求留在 /build）`,
  )

  // ── S10/C05+C07 版本记录 method 与模型 ──
  const v1list = await api(`/agents/${agentID}/versions`)
  const v1 = v1list?.versions?.[0]
  record(
    'U02-C05',
    v1?.method === 'mcq' ? 'pass' : 'diff',
    `v1.method=${v1?.method}（经 MCQ 填入后保存，应记 mcq）`,
  )
  record(
    'U02-C07',
    v1?.modelID === chosenModel ? 'pass' : 'diff',
    `v1.modelID=${v1?.modelID}，保存时所选=${chosenModel}`,
  )

  // ── S11/C09 保存不派发 ──
  const matches = await api('/matches')
  const matchCount = (matches?.matches ?? []).length
  record(
    'U02-C09',
    matchCount === 0 ? 'pass' : 'diff',
    `保存后 /v1/matches 数量=${matchCount}（应为 0，预算 0 未消耗）`,
  )

  // ── S12/#21 模型公开可见（版本 UI 上） ──
  if (!stayed) {
    // main：已在 EA；分支：版本卡就在 E 页
  } else {
    await page.goto(`${TARGET}/agents/${agentID}`)
  }
  await page.getByText('v1').first().waitFor().catch(() => {})
  const modelShown = chosenModel
    ? await page.getByText(chosenModel).first().isVisible().catch(() => false)
    : false
  await shot('U02-C07')
  record(
    'U02-C07-ui',
    modelShown ? 'pass' : 'diff',
    `版本 UI 上模型标识「${chosenModel}」可见=${modelShown}`,
  )

  // ── S13/C08 1000 上限 ──
  await page.goto(`${TARGET}/agents/${agentID}/build`)
  await page.getByLabel('策略提示词').waitFor()
  await page.getByLabel('策略提示词').fill('法'.repeat(1001))
  const counter = await page.getByText('1001 / 1000').isVisible().catch(() =>
    false
  )
  await shot('U02-C08')
  await page.getByTestId('save-version').click()
  await page.waitForTimeout(4000)
  const afterOver = await api(`/agents/${agentID}/versions`)
  const overCount = afterOver?.versions?.length ?? -1
  const errText = await page.locator('p.text-\\(--accent\\)').first()
    .innerText().catch(() => '')
  record(
    'U02-C08',
    counter && overCount === 1 ? 'pass' : 'diff',
    `计数器 1001/1000 可见=${counter}；超限保存后版本数=${overCount}（应仍为 1）；错误文案=「${errText}」；当前 URL=${page.url()}`,
  )

  // ── S14/C11 保存 v2 → E10 提示 ──
  if (!new RegExp(`/agents/${agentID}/build`).test(page.url())) {
    await page.goto(`${TARGET}/agents/${agentID}/build`)
  }
  await page.getByLabel('策略提示词').waitFor()
  await page.getByLabel('策略提示词').fill(
    '第二稿：先立木取信，再以军功授爵定人心。',
  )
  await page.getByTestId('save-version').click()
  await Promise.race([
    page.waitForURL(new RegExp(`/agents/${agentID}$`)).catch(() => {}),
    page.getByTestId('save-notice').waitFor().catch(() => {}),
  ])
  await page.waitForTimeout(1500)
  const e10 = await page.getByText(/参赛版本仍是 v1/).first().isVisible().catch(
    () => false,
  )
  const oneClick = await page.getByText('一键改标').count()
  await shot('U02-C11')
  record(
    'U02-C11',
    e10 ? 'pass' : 'diff',
    `保存 v2 后「参赛版本仍是 v1」提示可见=${e10}（页面=${page.url()}）`,
  )
  record(
    'U02-C11-oneclick',
    oneClick > 0 ? 'pass' : 'diff',
    `提示中「一键改标」出现次数=${oneClick}（规格 E10 要求带此入口）`,
  )

  // ── S15/C12 post-save：保存后将成为 v3 ──
  await page.goto(`${TARGET}/agents/${agentID}/build`)
  await page.getByLabel('策略提示词').waitFor()
  const p12post = await page.getByText('保存后将成为 v3').isVisible().catch(
    () => false,
  )
  await shot('U02-C12')
  record(
    'U02-C12',
    p12post ? 'pass' : 'diff',
    `保存两版后按钮旁「保存后将成为 v3」可见=${p12post}`,
  )

  // ── S16/C17 P5 模型继承 ──
  const comboNow = await page.getByRole('combobox').innerText()
  const inheritNote = await page.getByText(/沿用 v2 的模型/).isVisible().catch(
    () => false,
  )
  const pickLabel = (models.find((m) => m.id === chosenModel) ?? {}).label ??
    chosenModel
  await shot('U02-C17')
  record(
    'U02-C17',
    comboNow.includes(pickLabel) && inheritNote ? 'pass' : 'diff',
    `重进构建页选择器显示=「${comboNow}」（最新版模型=${pickLabel}）；「沿用 v2 的模型」可见=${inheritNote}`,
  )

  // ── S17/C13 #68 三层 prompt 说明 ──
  const fixedNote = await page.getByText(/你只需编写策略提示词/).isVisible()
    .catch(() => false)
  const acc = page.getByText('查看场景角色模板（仅供查看，无需重复编写）')
  const accVisible = await acc.isVisible().catch(() => false)
  let templateText = ''
  if (accVisible) {
    await acc.click()
    await page.waitForTimeout(500)
    templateText = await page.locator('p.whitespace-pre-wrap').first()
      .innerText().catch(() => '')
  }
  await shot('U02-C13')
  record(
    'U02-C13',
    fixedNote && accVisible && templateText.length > 0 ? 'pass' : 'diff',
    `固定说明=${fixedNote}；只读模板可展开=${accVisible}；模板 ${templateText.length} 字`,
  )

  // ── S18/C14+C16+C15 负向核查 ──
  const body = await page.locator('body').innerText()
  const forbidden = [
    '快测',
    '试运行',
    '卡牌',
    'Focus mode',
    '专注模式',
    '敬请期待',
    '即将上线',
  ]
    .filter((word) => body.includes(word))
  const hasPreviewControl = await page.getByRole('button', {
    name: /预览|快测|试运行/,
  }).count()
  await shot('U02-C14')
  record(
    'U02-C14',
    hasPreviewControl === 0 ? 'pass' : 'diff',
    `构建内预览/快测按钮数=${hasPreviewControl}`,
  )
  record(
    'U02-C16',
    forbidden.length === 0 ? 'pass' : 'diff',
    `C3 future/半成品词命中=${JSON.stringify(forbidden)}`,
  )
  record(
    'U02-C15',
    forbidden.length === 0 && hasPreviewControl === 0 ? 'pass' : 'diff',
    '未见「敬请期待/即将上线」类未完成占位控件（观察项）',
  )

  // ── S19/C19 保存 v1 后不再有模式概念？（清空工作区回头路实测） ──
  await page.getByText('清空工作区（重新选择初始化方式）').click()
  await page.getByRole('button', { name: '确认清空' }).click()
  await page.waitForTimeout(1000)
  const initBack = await initCard.isVisible().catch(() => false)
  await shot('U02-C19')
  record(
    'U02-C19',
    initBack ? 'diff' : 'pass',
    `清空工作区后三选一初始化卡重新出现=${initBack}（正文：此后的版本不再有模式概念；E7 回头路应为「再建一个」）`,
  )
  // 收尾：把 v2 文本填回工作区，别让草稿留空
  await page.getByRole('tab', { name: 'Basic 直写' }).click().catch(() => {})
  await page.getByLabel('策略提示词').fill(
    '第二稿：先立木取信，再以军功授爵定人心。',
  )
  await page.waitForTimeout(1200)

  console.log('\n=== RESULTS ===')
  console.log(JSON.stringify({ email, agentID, results }, null, 2))
} finally {
  await ctx.close()
}
