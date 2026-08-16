// U10 方法一：EA 智能体视图（B3）owner vs public 的脚本化旅程（CDP + 截图）。
// 旅程叙述：compare-v34/journeys/u10-agent-view-public.md（U10-C01…C14）。
// 对战预算 0：全程不点任何派发按钮；OS 面板只开不派。
// 用法：node tests/e2e/compare/u10-journey.mjs
//   AXIIA_BASE_URL（默认远端 dev）· AXIIA_U10_EMAIL（复用已建账号，缺省新建一个）
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.AXIIA_BASE_URL ??
  'https://axiia-cup-2-web.isofucius.cn'
const SHOTS = '/home/ubuntu/axiia-cup-uiux/compare-v34/shots/u10'
const LOG =
  '/home/ubuntu/axiia-cup-uiux/compare-v34/journeys/u10-journey-log.json'
const SCENARIO = 'shangyang-court'
const REG_CODE = process.env.AXIIA_REGISTRATION_CODE ?? 'axiia_cup'
const PASSWORD = 'playwrightpw-123456'
const PROBE = {
  email: 'coordinator-probe-0816@axiia.test',
  password: PASSWORD,
}
const SO = { 'Sec-Fetch-Site': 'same-origin' }

mkdirSync(SHOTS, { recursive: true })
const log = { base: BASE, startedAt: new Date().toISOString(), checks: [] }
function check(id, ok, note) {
  log.checks.push({ id, ok, note })
  console.log(`${ok ? 'PASS' : 'DIFF'} ${id} — ${note}`)
}

async function apiJSON(ctx, method, path, data) {
  const res = await ctx.request.fetch(`${BASE}/v1${path}`, {
    method,
    headers: { ...SO, 'Content-Type': 'application/json' },
    data,
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    body = await res.text().catch(() => null)
  }
  return { status: res.status(), body }
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:18800')
const owner = await browser.newContext({ baseURL: BASE })
const pub = await browser.newContext({ baseURL: BASE })
try {
  const page = await owner.newPage()

  // ── 账号（owner 视角）──────────────────────────────────────────────
  let email = process.env.AXIIA_U10_EMAIL ?? ''
  if (email) {
    const r = await apiJSON(owner, 'POST', '/auth/login', {
      email,
      password: PASSWORD,
    })
    if (r.status !== 200) throw new Error(`login ${email} failed: ${r.status}`)
    await page.goto(`${BASE}/scenarios`)
  } else {
    email = `playwright-u10-${Date.now()}@axiia.test`
    await page.goto(`${BASE}/register`)
    await page.getByLabel('注册码').fill(REG_CODE)
    await page.getByLabel('昵称').fill('测试玩家 u10')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(PASSWORD)
    await page.getByRole('button', { name: '创建账户' }).click()
    await page.waitForURL(/\/(express|scenarios)$/, { timeout: 20000 })
  }
  log.ownerEmail = email
  console.log('owner account:', email)

  // ── 数据铺设（API，全部只动自己账号）────────────────────────────────
  const models = await apiJSON(owner, 'GET', '/models')
  const modelID = models.body.models[0].id
  const save = async (agentID, prompt, note) =>
    (await apiJSON(owner, 'POST', `/agents/${agentID}/save`, {
      prompt,
      modelID,
      parentVersionID: null,
      ...(note ? { note } : {}),
    })).body

  const inv0 = await apiJSON(owner, 'GET', '/my/agents')
  const sides = inv0.body.scenarios?.find((s) =>
    s.scenarioID === SCENARIO
  )?.sides ??
    { a: [], b: [] }

  let A = sides.a[0]?.agentID
  if (!A) {
    A = (await apiJSON(owner, 'POST', '/agents/ensure', {
      scenarioID: SCENARIO,
      side: 'a',
    }))
      .body.agentID
  }
  const versA = await apiJSON(owner, 'GET', `/agents/${A}/versions`)
  if ((versA.body.versions?.length ?? 0) < 2) {
    await save(A, 'U10 商鞅 v1：奖励耕战，立木为信。', '首稿')
    await save(A, 'U10 商鞅 v2：奖励耕战，立木为信；徙木立信之外再加连坐之法。')
  }
  await apiJSON(owner, 'PATCH', `/agents/${A}`, { name: '贪婪' })

  let G = sides.b[0]?.agentID
  if (!G) {
    G = (await apiJSON(owner, 'POST', '/agents/ensure', {
      scenarioID: SCENARIO,
      side: 'b',
    }))
      .body.agentID
  }
  const versG = await apiJSON(owner, 'GET', `/agents/${G}/versions`)
  if ((versG.body.versions?.length ?? 0) < 1) {
    await save(G, 'U10 甘龙 v1：祖宗之法不可轻变，循礼而治。')
  }

  let B = sides.a[1]?.agentID
  if (!B) {
    const created = await apiJSON(owner, 'POST', '/agents', {
      scenarioID: SCENARIO,
      side: 'a',
      name: '激进',
    })
    B = created.body.agentID
    if (!B) throw new Error(`sibling create failed: ${JSON.stringify(created)}`)
    await save(B, 'U10 商鞅 B v1：不法古，不循今，法后王。')
  }
  log.agents = { A, G, B }
  console.log('agents:', log.agents)

  const shot = (name) =>
    page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })

  // ── Owner 视角 · EA（/agents/A）────────────────────────────────────
  await page.goto(`${BASE}/agents/${A}`)
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 20000 })
  await page.waitForTimeout(500)

  // C01 展示名（#63/#87/P1）
  const h1 = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
  const sub = (await page.locator('h1 + p').textContent()) ?? ''
  check(
    'U10-C01',
    h1.includes('商鞅「贪婪」'),
    `h1=「${h1.trim()}」 副行=「${sub.trim()}」`,
  )
  check(
    'U10-C01-scenario',
    sub.includes('商鞅变法·朝堂辩法'),
    `副行含场景名？ ${sub.includes('商鞅变法·朝堂辩法')}`,
  )
  const bodyText = (await page.locator('body').innerText()) ?? ''
  check(
    'U10-C01-no-internal-words',
    !bodyText.includes('策略展示名') && !/版本线/.test(bodyText) &&
      !/策略[^提]/.test(bodyText.replace(/策略提示词/g, '')),
    '#87 内部词「策略」「版本线」不进 UI（正文扫描）',
  )
  await shot('owner-C01')

  // C02 双侧完成度徽章（#64）——EA 页
  const eaHasBadge = /商鞅\s*[✓✗]|甘龙\s*[✓✗]/.test(bodyText)
  check(
    'U10-C02-ea',
    eaHasBadge,
    `EA 页正文是否出现 商鞅 ✓/甘龙 ✗ 徽章：${eaHasBadge}`,
  )

  // C03 页头「编辑」在「出战」旁（#75/#81）
  const editBtn = page.getByRole('button', { name: '编辑', exact: true })
  const fieldBtn = page.getByRole('button', { name: '出战', exact: true })
    .first()
  const editVisible = await editBtn.isVisible().catch(() => false)
  check(
    'U10-C03',
    editVisible,
    `页头「编辑」按钮存在（出战旁）：${editVisible}`,
  )
  await shot('owner-C03')
  if (editVisible) {
    await editBtn.click()
    await page.waitForURL(/\/build/, { timeout: 10000 })
    check('U10-C03-target', true, `编辑落点 ${page.url()}（工作区）`)
    // SPA 换页竞态：先等构建器自己的锚点（工作区编辑框），再等版本线数据到位。
    await page.getByLabel('策略提示词').waitFor({ timeout: 15000 })
    await page.getByText(/^版本（[1-9]\d*）$/).waitFor({ timeout: 15000 })
    await shot('owner-C09-e') // C09 同构对照用：E 页版本线
    const eActions = await page.getByTestId('version-card').first().locator(
      'button',
    )
      .allTextContents().catch(() => [])
    log.eCardActions = eActions
    await page.goBack()
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.getByTestId('version-card').first().waitFor({ timeout: 15000 })
  }

  // C05/C06/C07/C08 版本卡结构
  await page.waitForTimeout(300)
  const cards = page.getByTestId('version-card')
  const cardCount = await cards.count()
  const firstCard = cards.first()
  const recText = await firstCard.getByTestId('version-record').textContent()
    .catch(() => null)
  check(
    'U10-C05',
    recText != null && /还没有出战过|战.*胜/.test(recText),
    `逐版本胜负槽（P15/#35）：「${recText}」（${cardCount} 张卡）`,
  )
  const starCount = await page.getByText('★参赛版本', { exact: true }).count()
  check('U10-C06', starCount >= 1, `★参赛版本徽章出现 ${starCount} 次`)
  const cardText = (await firstCard.innerText()) ?? ''
  check(
    'U10-C07',
    /v\d+/.test(cardText) && /#\d+/.test(cardText) && sub.includes(`#${A}`),
    `版本卡含 vN+#id 双编号；页头副行含 agent #${A}`,
  )
  const actions = await firstCard.locator('button').allTextContents()
  log.eaCardActions = actions
  const hasSet = actions.some((t) =>
    t.includes('设为') && t.includes('参赛版本')
  )
  const wanted = ['展开全文', '基于该版本迭代', '出战']
  const hasAll = wanted.every((w) => actions.some((t) => t.includes(w))) &&
    (hasSet || (await firstCard.getByText('★参赛版本').count()) > 0)
  const noCopy = !actions.some((t) => t.includes('复制为新智能体')) &&
    !actions.some((t) => t.includes('恢复到工作区'))
  check(
    'U10-C08',
    hasAll && noCopy,
    `EA 版本卡动作＝${JSON.stringify(actions)}`,
  )
  await shot('owner-C05')

  // C09 EA↔E 同构：动作集合逐字比对（对非 entry 卡取并集口径即可）
  const eActs = (log.eCardActions ?? []).map((t) => t.trim()).sort()
  const eaActs = actions.map((t) => t.trim()).sort()
  check(
    'U10-C09',
    JSON.stringify(eActs) === JSON.stringify(eaActs),
    `E=${JSON.stringify(eActs)} EA=${JSON.stringify(eaActs)}`,
  )
  await shot('owner-C09-ea')

  // C04 版本 diff（owner 可见，#20 允许）
  const diffHeading = page.getByRole('heading', { name: '版本对比' })
  const diffThere = await diffHeading.isVisible().catch(() => false)
  if (diffThere) {
    await page.getByRole('button', { name: '对比', exact: true }).click().catch(
      () => {},
    )
    await page.waitForTimeout(1500)
  }
  const diffShown = await page.locator('pre').count()
  check(
    'U10-C04',
    diffThere && diffShown >= 2,
    `版本对比区存在=${diffThere}，diff 双栏 pre=${diffShown}`,
  )
  await shot('owner-C04')

  // C10 兄弟策略胶囊（P9）
  const capsule = page.getByRole('button', { name: /商鞅「激进」|商鞅 #\d+/ })
  const capsuleCount = await capsule.count()
  check('U10-C10', capsuleCount >= 1, `EA(A) 兄弟胶囊数=${capsuleCount}`)
  await shot('owner-C10')
  if (capsuleCount >= 1) {
    await capsule.first().click()
    await page.waitForURL(new RegExp(`/agents/${B}$`), { timeout: 10000 })
      .catch(() => {})
    check(
      'U10-C10-switch',
      page.url().endsWith(`/agents/${B}`),
      `胶囊点击落点 ${page.url()}`,
    )
  }
  await page.goto(`${BASE}/agents/${G}`)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.waitForTimeout(400)
  const soloText = (await page.locator('body').innerText()) ?? ''
  const soloCapsules = await page.locator(
    'button[aria-current], button:has-text("甘龙 #")',
  ).count()
  check(
    'U10-C10-solo',
    soloCapsules === 0,
    `甘龙（同侧仅 1 策略）页胶囊排不出现：count=${soloCapsules}`,
  )
  await shot('owner-C10-solo')
  log.soloHasBadge = /商鞅\s*[✓✗]/.test(soloText)

  // C02 —「我的智能体」侧的双侧徽章
  await page.goto(`${BASE}/my-agents`)
  await page.getByTestId('agent-row').first().waitFor({ timeout: 20000 })
  const maText = (await page.locator('body').innerText()) ?? ''
  const maBadge = /商鞅\s*(✓|未标参赛|未建)/.test(maText) &&
    /甘龙\s*(✓|未标参赛|未建)/.test(maText)
  check('U10-C02-myagents', maBadge, `我的智能体页 双侧完成度徽章：${maBadge}`)
  await shot('owner-C02-myagents')

  // C11 入口 ① DA「查看我的商鞅」
  await page.goto(`${BASE}/scenarios/${SCENARIO}`)
  await page.waitForTimeout(800)
  const daLink = page.getByText(/查看我的商鞅（\d+）/)
  const daThere = await daLink.count()
  check(
    'U10-C11-da',
    daThere >= 1,
    `DA 侧卡「查看我的商鞅（N）」入口：count=${daThere}`,
  )
  await shot('owner-C11-da')
  // C14 NPC 预设在 DA 的呈现（#34）：是否可点开 NPC 的 EA 页
  const daBody = (await page.locator('body').innerText()) ?? ''
  const npcLinks = await page.locator('a[href*="/agents/"]').allTextContents()
  log.daAgentLinks = npcLinks
  check(
    'U10-C14',
    false === /NPC.*胜率|陪练.*胜率/.test(daBody)
      ? daBody.includes('侧方胜率')
      : true,
    `DA 有「侧方胜率」聚合条（${
      daBody.includes('侧方胜率')
    }）；NPC 预设无独立页入口（agent 链接＝${JSON.stringify(npcLinks)}）`,
  )
  await shot('owner-C14-npc')

  // C11 入口 ②「我的智能体」行的「查看智能体」按钮
  await page.goto(`${BASE}/my-agents`)
  await page.getByTestId('agent-row').first().waitFor({ timeout: 20000 })
  // aria-label＝「查看<场景>·<侧>智能体 #<id>」——比 data-agent-id 组合器稳。
  await page.getByRole('button', { name: new RegExp(`查看.*#${A}$`) }).click()
  await page.waitForURL(new RegExp(`/agents/${A}$`), { timeout: 10000 }).catch(
    () => {},
  )
  check(
    'U10-C11-myagents',
    page.url().endsWith(`/agents/${A}`),
    `行入口落点 ${page.url()}`,
  )

  // C11 入口 ③ OS 面板阵容用策略展示名（P1）——只开不派
  await page.goto(`${BASE}/agents/${A}`)
  await page.getByTestId('open-os-panel').waitFor({ timeout: 20000 })
  await page.getByTestId('open-os-panel').click()
  await page.waitForTimeout(800)
  const osText = (await page.locator('body').innerText()) ?? ''
  check(
    'U10-C11-os',
    osText.includes('贪婪') || osText.includes('商鞅「贪婪」'),
    `OS 面板文案含策略展示名：${osText.includes('贪婪')}`,
  )
  await shot('owner-C11-os')
  await page.keyboard.press('Escape')

  // C11 入口 ⑤ 排行榜/锦标赛：玩家对局列表 → EA？
  await page.goto(`${BASE}/tournaments`)
  await page.waitForTimeout(800)
  const gLinks = await page.locator('a[href*="/agents/"]').count()
  check(
    'U10-C11-g',
    true,
    `锦标赛/排名页 agent 链接数=${gLinks}（无赛事数据，仅记录）`,
  )
  await shot('owner-C11-g')

  // ── Public 视角（探针，只读）────────────────────────────────────────
  const ppage = await pub.newPage()
  const login = await apiJSON(pub, 'POST', '/auth/login', PROBE)
  if (login.status !== 200) {
    throw new Error(`probe login failed ${login.status}`)
  }
  await ppage.goto(`${BASE}/agents/${A}`)
  await ppage.waitForTimeout(2500)
  const pubText = (await ppage.locator('body').innerText()) ?? ''
  log.publicPageText = pubText.slice(0, 600)
  const pubHasRecord = /还没有出战过|\d+ 战 \d+ 胜/.test(pubText)
  const pubHasName = pubText.includes('商鞅「贪婪」')
  check(
    'U10-C12',
    pubHasRecord && pubHasName,
    `公开视图渲染：展示名=${pubHasName} 逐版本胜负=${pubHasRecord}；正文首行＝「${
      pubText.split('\n').filter(Boolean)[0] ?? ''
    }…」`,
  )
  await ppage.screenshot({ path: `${SHOTS}/public-C12.png`, fullPage: true })

  // C13 提示词/diff 永不公开（页面 + API 双证）
  const leaked = pubText.includes('立木为信') || pubText.includes('连坐之法')
  const dr = await apiJSON(pub, 'GET', `/agents/${A}/draft`)
  const vr = await apiJSON(pub, 'GET', `/agents/${A}/versions`)
  const dfr = await apiJSON(pub, 'GET', `/agents/${A}/diff?base=1&head=2`)
  const apiLeak = JSON.stringify([dr.body, vr.body, dfr.body]).includes(
    '立木为信',
  )
  log.publicAPI = {
    draft: dr.status,
    versions: vr.status,
    diff: dfr.status,
  }
  check(
    'U10-C13',
    !leaked && !apiLeak && dr.status !== 200 && vr.status !== 200 &&
      dfr.status !== 200,
    `提示词泄露：页面=${leaked} API=${apiLeak}；draft/versions/diff 状态=${dr.status}/${vr.status}/${dfr.status}`,
  )
  await ppage.close()
  await page.close()
} finally {
  await owner.close()
  await pub.close()
  // 共享浏览器：绝不 browser.close()
}
log.finishedAt = new Date().toISOString()
writeFileSync(LOG, JSON.stringify(log, null, 2))
console.log('log written to', LOG)
