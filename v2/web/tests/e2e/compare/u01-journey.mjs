// U01 编辑与版本 — 人工旅程的脚本化执行（方法一）。
// 与 BDD 套件共用同一个测试账号（先跑 agent-edit + compare 两个 spec）。
// 用外部 CDP 浏览器（127.0.0.1:18800），自己开 context、只关 context。
// 战斗预算 0：任何步骤都不派发对局。
//
// 用法：node tests/e2e/compare/u01-journey.mjs [baseURL]
// 结果：console 摘要 + /home/ubuntu/axiia-cup-uiux/compare-v34/… 截图与 JSON。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'https://axiia-cup-2-web.isofucius.cn'
const SHOTS = '/home/ubuntu/axiia-cup-uiux/compare-v34/shots/u01'
const OUT =
  '/home/ubuntu/axiia-cup-uiux/compare-v34/findings/u01-journey-results.json'
const ALT = 'sanguo-chain'
const MAIN = 'shangyang-court'

mkdirSync(SHOTS, { recursive: true })

const creds = JSON.parse(
  readFileSync(
    join(process.cwd(), '.e2e-shared-account/creds.json'),
    'utf8',
  ),
)

const results = []
function record(id, clause, status, note) {
  results.push({ id, clause, status, note })
  console.log(`[${status}] ${id} ${clause} — ${note}`)
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:18800')
const ctx = await browser.newContext({
  baseURL: BASE,
  viewport: { width: 1280, height: 900 },
})
const page = await ctx.newPage()
page.setDefaultTimeout(30000)

const shot = async (name) => {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true })
    .catch(() => {})
}

async function step(id, clause, fn) {
  try {
    await fn()
  } catch (cause) {
    record(id, clause, 'blocked', `步骤异常：${String(cause).slice(0, 300)}`)
    await shot(`${id}-error`)
  }
}

async function api(path) {
  const response = await page.request.get(path)
  if (!response.ok()) throw new Error(`${path} -> ${response.status()}`)
  return await response.json()
}

async function inventoryOf(scenarioID) {
  const inventory = await api('/v1/my/agents')
  return inventory.scenarios.find((s) => s.scenarioID === scenarioID)?.sides ??
    { a: [], b: [] }
}

async function openBuild(agentID) {
  await page.goto(`${BASE}/agents/${agentID}/build`)
  const input = page.getByLabel('策略提示词')
  await input.waitFor({ state: 'visible' })
  // disabled ＝ 草稿还没回来
  await page.waitForFunction(
    () => !document.getElementById('prompt-input')?.disabled,
    { timeout: 30000 },
  )
  return input
}

try {
  // ── 登录（复用 BDD 注册的唯一账号）───────────────────────────────────
  await step('J00', 'login', async () => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('邮箱').fill(creds.email)
    await page.getByLabel('密码').fill(creds.password)
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'))
    record('J00', 'login', 'pass', `以 ${creds.email} 登录`)
  })

  // ── 第一段 · sanguo-chain：重演早期状态 ────────────────────────────
  const catalog = await api('/v1/scenarios')
  const alt = catalog.scenarios.find((s) => s.id === ALT)
  let altAgentA = 0

  if (alt == null) {
    record(
      'J01',
      'A2 lazy-create',
      'blocked',
      `服务器无 ${ALT} 场景，第一段整体跳过`,
    )
  } else {
    await step('J01', 'A2/#54 去构建即建即进', async () => {
      await page.goto(`${BASE}/scenarios/${ALT}`)
      await page.getByTestId('build-agent').click()
      await page.waitForURL(/\/agents\/\d+\/build/)
      altAgentA = Number(/\/agents\/(\d+)\/build/.exec(page.url())[1])
      record('J01', 'A2/#54', 'pass', `sanguo 甲侧懒创建 agent #${altAgentA}`)
    })

    await step('J02', 'A2.E E6/E7 + #90 残留', async () => {
      await page.getByText('初始化方式 · 三选一生成首稿').waitFor()
      const mcq = await page.getByText('MCQ 拼装').count()
      const residue = await page.getByText(/复制为新智能体/).count()
      await shot('U01-C09-initmodes')
      record(
        'J02',
        'E6/E7 三选一',
        mcq > 0 ? 'pass' : 'diff',
        `空工作区三选一${mcq > 0 ? '可见' : '缺席'}`,
      )
      record(
        'J02b',
        '#90 残留文案',
        residue > 0 ? 'diff' : 'pass',
        residue > 0
          ? `InitModes 说明句仍出现「复制为新智能体」${residue} 处（#90 要求删除全部降级分支文案）`
          : '无残留',
      )
    })

    await step('J03', 'E5 MCQ 选项随版本存档', async () => {
      await page.evaluate(() => {
        const groups = new Map()
        for (const b of document.querySelectorAll('button[aria-pressed]')) {
          const p = b.parentElement
          if (!groups.has(p)) groups.set(p, b)
        }
        for (const b of groups.values()) b.click()
      })
      const fill = page.getByRole('button', { name: '填入工作区' }).first()
      await fill.click()
      await page.getByTestId('save-version').click()
      await page.getByTestId('version-card').first().waitFor()
      const { versions } = await api(`/v1/agents/${altAgentA}/versions`)
      const v1 = versions[0]
      const options = v1.options ?? null
      const hasMcqSelections = options != null &&
        /q|question|deck|mcq|option/i.test(
          typeof options === 'string' ? options : JSON.stringify(options),
        )
      await shot('U01-C08-mcq-save')
      record(
        'J03',
        'E5 MCQ 选项存档',
        hasMcqSelections ? 'pass' : 'diff',
        `v1.options = ${JSON.stringify(options)?.slice(0, 200)} —— ${
          hasMcqSelections
            ? '包含选卡记录'
            : '未包含 MCQ 选卡记录（仅角色/为空）'
        }`,
      )
    })

    await step('J04', 'E7 迭代只有文本工作台', async () => {
      const mcqAfter = await page.getByText('MCQ 拼装').count()
      const clearEntry = await page
        .getByRole('button', { name: '清空工作区（重新选择初始化方式）' })
        .count()
      await shot('U01-C09-after-v1')
      record(
        'J04',
        'E7',
        mcqAfter === 0 ? 'pass' : 'diff',
        `保存 v1 后 MCQ 页签 ${mcqAfter} 个；就地引导=「清空工作区（重新选择初始化方式）」${clearEntry} 个（规格出口应指向「再建一个」）`,
      )
    })

    await step('J05', 'E7 清空工作区后选卡复活', async () => {
      await page.getByRole('button', {
        name: '清空工作区（重新选择初始化方式）',
      }).click()
      await page.getByRole('button', { name: '确认清空' }).click()
      await page.getByText('初始化方式 · 三选一生成首稿').waitFor({
        timeout: 10000,
      }).catch(() => {})
      const revived = await page.getByText('MCQ 拼装').count()
      await shot('U01-C09-clear-revive')
      record(
        'J05',
        'E7 初始化-only',
        revived > 0 ? 'diff' : 'pass',
        revived > 0
          ? '清空工作区后三选一在同一策略复活——规格要求想重选须「再建一个」新策略'
          : '清空后未复活',
      )
      const input = page.getByLabel('策略提示词')
      await input.fill('旅程复原草稿：sanguo 甲侧暂存一句。')
      await page.getByText('已自动暂存').waitFor()
    })

    const altName = (side) => (side === 'a' ? alt.sideAName : alt.sideBName)

    await step('J06', 'P6a 引导门文案', async () => {
      await page.goto(`${BASE}/my-agents`)
      await page
        .getByLabel(`再建一个${alt.title}·${altName('a')}侧智能体`)
        .click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: '创建并进入构建' }).click()
      await dialog.getByText(/需先有一个对侧智能体/).waitFor()
      const clauseRefs = (await dialog.getByText(/#59|#79/).count()) > 0
      const sideCTA = await dialog
        .getByRole('button', { name: `先创建${altName('b')}` })
        .count()
      await shot('U01-C25-gate-copy')
      record(
        'J06',
        'P6a',
        clauseRefs ? 'diff' : 'pass',
        `主句=「需先有一个对侧智能体…」（通称；UI-Doc P6a 原句用角色名——cosmetic diff 另记）；条文号${
          clauseRefs ? '出现' : '未出现'
        }；切侧 CTA「先创建${altName('b')}」${sideCTA} 个`,
      )
      await page.keyboard.press('Escape')
    })

    let shellID = 0
    await step('J07', 'P8a 空壳不放行', async () => {
      await page.goto(`${BASE}/scenarios/${ALT}`)
      await page.getByTestId('build-agent-b').click()
      await page.waitForURL(/\/agents\/\d+\/build/)
      shellID = Number(/\/agents\/(\d+)\/build/.exec(page.url())[1])
      // 不保存任何版本，直接回去再试
      await page.goto(`${BASE}/my-agents`)
      await page
        .getByLabel(`再建一个${alt.title}·${altName('a')}侧智能体`)
        .click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: '创建并进入构建' }).click()
      const blocked = await dialog
        .getByText(/需先有一个对侧智能体/)
        .count()
      await shot('U01-C26-shell-gate')
      record(
        'J07',
        'P8a',
        blocked > 0 ? 'pass' : 'diff',
        blocked > 0 ? '空壳对侧不算数，引导门仍挡下' : '空壳竟放行了',
      )
      await page.keyboard.press('Escape')
    })

    await step('J08', 'P8b 空策略可删', async () => {
      await page.goto(`${BASE}/my-agents`)
      const delVersioned = await page
        .getByRole('button', { name: `删除智能体 #${altAgentA}` })
        .count()
      const delShell = await page
        .getByRole('button', { name: `删除智能体 #${shellID}` })
        .count()
      await shot('U01-C27-delete-before')
      await page.getByRole('button', { name: `删除智能体 #${shellID}` }).click()
      await page.getByRole('button', { name: `确认删除智能体 #${shellID}` })
        .click()
      await page
        .getByRole('button', { name: `删除智能体 #${shellID}` })
        .waitFor({ state: 'detached' })
      await shot('U01-C27-delete-after')
      record(
        'J08',
        'P8b',
        delVersioned === 0 && delShell === 1 ? 'pass' : 'diff',
        `有版本行删除按钮 ${delVersioned} 个（应 0）；空壳行 ${delShell} 个（应 1）；删除后行消失`,
      )
    })
  }

  // ── 第二段 · shangyang：BDD 建成的故事线 ───────────────────────────
  const sides = await inventoryOf(MAIN)
  const sortedA = [...sides.a].sort((x, y) => x.agentID - y.agentID)
  const A = sortedA[0]
  const B = sides.a.find((x) => x.name === '激进')
  const C = sortedA.filter((x) => x !== A && x.name !== '激进').at(-1)
  const gan = sides.b[0]

  if (A == null || B == null || gan == null) {
    record('J10', 'story', 'blocked', 'shangyang 故事线不完整（BDD 未跑完？）')
  } else {
    await step('J10', 'E11/#88/#25/P12 E 页版本线', async () => {
      await openBuild(A.agentID)
      const { versions } = await api(`/v1/agents/${A.agentID}/versions`)
      const cards = await page.getByTestId('version-card').count()
      const dualID = await page.getByText(`#${versions.at(-1).id}`, {
        exact: true,
      }).count()
      const actions = {
        expand: await page.getByRole('button', { name: /展开 v\d+ 全文/ })
          .count(),
        entry: await page.getByRole('button', { name: /设为.*参赛版本/ })
          .count(),
        iterate: await page.getByRole('button', { name: /基于 v\d+ 迭代/ })
          .count(),
        field: await page.getByRole('button', { name: /用 v\d+ 出战/ }).count(),
      }
      const p12 = await page.getByText(/保存后将成为 v\d+/).count()
      await shot('U01-C13-e-versionline')
      const ok = cards === versions.length && dualID > 0 &&
        actions.expand > 0 &&
        actions.iterate > 0 && actions.field > 0 && p12 === 1
      record(
        'J10',
        'E11/#88/#25/P12',
        ok ? 'pass' : 'diff',
        `卡片 ${cards}/${versions.length}；双编号 ${dualID > 0}；动作 ${
          JSON.stringify(actions)
        }；P12 句 ${p12} 处`,
      )
    })

    await step('J11', '#90 无复制按钮', async () => {
      const onBuild = await page.getByRole('button', { name: /复制为新智能体/ })
        .count()
      await page.goto(`${BASE}/agents/${A.agentID}`)
      await page.getByTestId('version-card').first().waitFor()
      const onEA = await page.getByRole('button', { name: /复制为新智能体/ })
        .count()
      await shot('U01-C05-ea')
      record(
        'J11',
        '#90 按钮负检',
        onBuild === 0 && onEA === 0 ? 'pass' : 'diff',
        `E 页 ${onBuild} 个 / EA 页 ${onEA} 个（应全 0）`,
      )
    })

    await step('J12', 'E1 草稿自动暂存', async () => {
      const input = await openBuild(A.agentID)
      const marker = `旅程草稿标记 ${Date.now()}`
      await input.fill(marker)
      await page.getByText('已自动暂存').waitFor()
      await page.goto(`${BASE}/my-agents`)
      const back = await openBuild(A.agentID)
      const value = await back.inputValue()
      const { versions } = await api(`/v1/agents/${A.agentID}/versions`)
      record(
        'J12',
        'E1',
        value === marker ? 'pass' : 'diff',
        `离开再回草稿${
          value === marker ? '仍在' : '丢了'
        }；版本数 ${versions.length} 未因打字增加`,
      )
    })

    await step('J13', 'P11 覆盖确认（草稿≠最新版）', async () => {
      await page.getByRole('button', { name: '基于 v1 迭代' }).click()
      await page.getByText(/工作区里有未保存的改动/).waitFor()
      await shot('U01-C04-p11-confirm')
      await page.getByRole('button', { name: '取消' }).click()
      const kept = (await page.getByLabel('策略提示词').inputValue())
        .startsWith('旅程草稿标记')
      record(
        'J13',
        'P11',
        kept ? 'pass' : 'diff',
        `两步确认出现；取消后草稿${kept ? '原样' : '被改'}`,
      )
    })

    await step('J14', 'E3/#89 一致时直载 + 提示', async () => {
      const { versions } = await api(`/v1/agents/${A.agentID}/versions`)
      const latest = versions.reduce((a, b) => (a.id > b.id ? a : b))
      const v1 = versions.reduce((a, b) => (a.id < b.id ? a : b))
      const input = page.getByLabel('策略提示词')
      await input.fill(latest.prompt)
      await page.getByText('已自动暂存').waitFor()
      await page.getByRole('button', { name: '基于 v1 迭代' }).click()
      const confirm = await page.getByText(/工作区里有未保存的改动/).count()
      await page.getByText(/已载入 v1/).waitFor()
      const loaded = (await input.inputValue()) === v1.prompt
      const after = await api(`/v1/agents/${A.agentID}/versions`)
      await shot('U01-C03-iterate-loaded')
      record(
        'J14',
        'E3/#89',
        confirm === 0 && loaded && after.versions.length === versions.length
          ? 'pass'
          : 'diff',
        `一致时确认条 ${confirm} 个（应 0）；载入 v1 全文=${loaded}；版本数不变=${
          after.versions.length === versions.length
        }；提示「已载入 v1 · 保存后将成为 v${versions.length + 1}」`,
      )
    })

    await step('J15', 'E10 保存提示（★不动 + 一键改标缺席）', async () => {
      const input = await openBuild(B.agentID)
      await input.fill(`旅程 E10 版 ${Date.now()}：保存后 ★ 应原地不动。`)
      await page.getByTestId('save-version').click()
      const notice = page.getByTestId('save-notice')
      await notice.waitFor()
      const text = await notice.innerText()
      await shot('U01-C12-e10-notice')
      const stays = text.includes('★参赛版本仍是')
      const oneClick = text.includes('一键改标')
      record(
        'J15',
        'E10',
        stays && !oneClick ? 'diff' : stays ? 'pass' : 'diff',
        `提示=「${text}」；含「仍是 vK」=${stays}；含规格要求的「一键改标」=${oneClick}（缺席＝cosmetic diff）`,
      )
    })

    await step('J16', 'P1 展示名（E/EA 页头）', async () => {
      // E 页头的展示名与侧名都是异步渲染（/my/agents 与场景详情各一趟）——
      // 必须显式等待，裸 count() 会在数据回来前取到 0（08-16 J16 实测踩坑）。
      await openBuild(B.agentID)
      await page.getByText('商鞅「激进」').first().waitFor({ timeout: 20000 })
        .catch(() => {})
      const bName = await page.getByText('商鞅「激进」').count()
      await openBuild(A.agentID)
      await page.getByText(`商鞅 #${A.agentID}`).first().waitFor({
        timeout: 20000,
      }).catch(() => {})
      const aFallback = await page.getByText(`商鞅 #${A.agentID}`).count()
      await page.goto(`${BASE}/agents/${B.agentID}`)
      await page.getByRole('heading', { name: '商鞅「激进」' }).waitFor()
      const idSmall = await page.getByText(`#${B.agentID}`, { exact: true })
        .count()
      await shot('U01-C20-ea-header')
      record(
        'J16',
        'P1',
        bName > 0 && aFallback > 0 && idSmall > 0 ? 'pass' : 'diff',
        `E 页头：B=商鞅「激进」(${bName})、A=商鞅 #id(${aFallback})；EA 页头名+小字 #id(${idSmall})`,
      )
    })

    await step('J17', 'P9 兄弟策略胶囊', async () => {
      await page.goto(`${BASE}/agents/${A.agentID}`)
      await page.getByRole('heading', { level: 1 }).first().waitFor()
      const current = await page.locator('button[aria-current="page"]').count()
      const pills = await page.getByRole('button', { name: /^商鞅/ }).count()
      await shot('U01-C28-capsules')
      await page.goto(`${BASE}/agents/${gan.agentID}`)
      await page.getByRole('heading', { level: 1 }).first().waitFor()
      const ganPills = await page.locator('button[aria-current="page"]').count()
      await shot('U01-C28-gan-no-capsules')
      record(
        'J17',
        'P9',
        current === 1 && pills >= 3 && ganPills === 0 ? 'pass' : 'diff',
        `A 的 EA：胶囊 ${pills} 枚、当前高亮 ${current}；甘龙 EA：${ganPills}（应 0）`,
      )
    })

    await step('J18', 'E11 EA 同构 + P2/P3 EA 补名缺席', async () => {
      await page.goto(`${BASE}/agents/${A.agentID}`)
      await page.getByTestId('version-card').first().waitFor()
      const actions = {
        expand: await page.getByRole('button', { name: /展开 v\d+ 全文/ })
          .count(),
        entry: await page.getByRole('button', { name: /设为.*参赛版本/ })
          .count(),
        iterate: await page.getByRole('button', { name: /基于 v\d+ 迭代/ })
          .count(),
        field: await page.getByRole('button', { name: /用 v\d+ 出战/ }).count(),
      }
      const diffSection = await page.getByText('版本对比').count()
      const rename = await page.getByRole('button', { name: /重命名|改名/ })
        .count()
      await shot('U01-C14-ea-cards')
      record(
        'J18',
        'E11 同构',
        actions.expand > 0 && actions.iterate > 0 && actions.field > 0 &&
          diffSection > 0
          ? 'pass'
          : 'diff',
        `EA 动作 ${JSON.stringify(actions)}；版本对比段 ${diffSection}`,
      )
      record(
        'J18b',
        'P2/P3 EA 补名',
        rename === 0 ? 'diff' : 'pass',
        `EA 页改名入口 ${rename} 个——P2 落点表写「我的智能体·EA」，EA 缺席（P3 连带）`,
      )
    })

    await step('J19', 'P10/P15 备注·时间·战绩', async () => {
      const target = C ?? A
      await page.goto(`${BASE}/agents/${target.agentID}`)
      await page.getByTestId('version-card').first().waitFor()
      const note = await page.getByText('备注：加了退让条款').count()
      const time = await page.getByTestId('version-time').count()
      const rec = await page.getByText('还没有出战过').count()
      await shot('U01-C29-note-time-record')
      record(
        'J19',
        'P10/P15',
        (C == null || note > 0) && time > 0 && rec > 0 ? 'pass' : 'diff',
        `备注 ${note}；时间 ${time}；「还没有出战过」${rec}（0 战预算下 N 战 M 胜形态未验，blocked-partial）`,
      )
    })

    await step('J20', 'P1a 最近编辑倒序', async () => {
      const input = await openBuild(A.agentID)
      await input.fill(`P1a 旅程触发 ${Date.now()}`)
      await page.getByText('已自动暂存').waitFor()
      await page.goto(`${BASE}/my-agents`)
      await page.getByTestId('agent-row').first().waitFor()
      const rowIDs = await page
        .getByTestId('agent-row')
        .evaluateAll((rows) => rows.map((r) => r.getAttribute('data-agent-id')))
      const shangyangRows = rowIDs.map(Number).filter((id) =>
        sides.a.some((x) => x.agentID === id)
      )
      const edited = await page.getByTestId('agent-edited').count()
      const rename = await page.getByRole('button', {
        name: `重命名智能体 #${A.agentID}`,
      }).count()
      await shot('U01-C21-recency')
      record(
        'J20',
        'P1a',
        shangyangRows[0] === A.agentID && edited > 0 ? 'pass' : 'diff',
        `商鞅侧行序 ${
          JSON.stringify(shangyangRows)
        }（A=#${A.agentID} 应第一）；相对时间 ${edited} 处`,
      )
      record(
        'J21',
        'P2 我的智能体改名入口',
        rename > 0 ? 'pass' : 'diff',
        `重命名按钮 ${rename} 个（往返已由 BDD 验证）`,
      )
    })

    await step('J22', 'P13 DA 侧卡', async () => {
      await page.goto(`${BASE}/scenarios/${MAIN}`)
      await page.getByRole('heading', { level: 1 }).first().waitFor()
      const has = await page.getByText(`你已有 ${sides.a.length} 个商鞅`)
        .count()
      const again = await page.getByRole('button', { name: '再建一个商鞅' })
        .count()
      const view = await page
        .getByRole('button', { name: `查看我的商鞅（${sides.a.length}）` })
        .count()
      const ganAgain = await page.getByRole('button', { name: '再建一个甘龙' })
        .count()
      await shot('U01-C31-da-p13')
      record(
        'J22',
        'P13',
        has > 0 && again > 0 && view > 0 && ganAgain > 0 ? 'pass' : 'diff',
        `你已有 N 个商鞅 ${has}；再建一个 ${again}；查看我的（N）${view}；甘龙侧同构 ${ganAgain}`,
      )
    })

    await step('J23', 'P5 模型继承提示', async () => {
      await openBuild(gan.agentID)
      const inherit = await page.getByText(/沿用 v\d+ 的模型/).count()
      await shot('U01-C24-model-inherit')
      record(
        'J23',
        'P5',
        inherit > 0 ? 'pass' : 'diff',
        `「沿用 vN 的模型」${inherit} 处（甘龙最新版为非默认模型，BDD 已验保存不换模型）`,
      )
    })

    await step('J24', 'E8/P14 复制当前文本', async () => {
      await openBuild(A.agentID)
      const btn = await page.getByRole('button', { name: /复制当前文本/ })
        .count()
      const aiRewrite = await page.getByText(/AI 改写|自动改写/).count()
      await shot('U01-C10-copy-button')
      record(
        'J24',
        'E8/P14',
        btn > 0 && aiRewrite === 0 ? 'pass' : 'diff',
        `复制按钮 ${btn} 个；产品内 AI 改写入口 ${aiRewrite} 个（应 0）`,
      )
    })

    await step('J25', 'P1-OS 出战面板（不派发）', async () => {
      await page.getByRole('button', { name: /用 v\d+ 出战/ }).first().click()
      await page.getByText(/出战 · /).waitFor()
      await shot('U01-C20-os-panel')
      const bodyText = await page.evaluate(() => document.body.innerText)
      const pvpLocked = /解锁|PVE/.test(bodyText)
      record(
        'J25',
        'P1-OS 阵容命名',
        'blocked',
        `OS 面板可开（0 预算不派发）；PVP 双侧阵容选择器需解锁（${
          pvpLocked ? '当前未解锁' : '状态未知'
        }）——源码显示 lineup 候选 label 用「#agentID · vN · model」而非策略展示名，记 spec-gap（代码证据）`,
      )
      await page.keyboard.press('Escape')
    })

    await step('J26', 'E9/#87 用词巡检', async () => {
      const texts = []
      for (
        const path of [
          '/my-agents',
          `/agents/${A.agentID}`,
          `/agents/${A.agentID}/build`,
        ]
      ) {
        await page.goto(`${BASE}${path}`)
        await page.waitForLoadState('networkidle').catch(() => {})
        texts.push(await page.evaluate(() => document.body.innerText))
      }
      const joined = texts.join('\n')
      const versionLine = joined.includes('版本线')
      const strategyHits = (joined.match(/策略/g) ?? []).length
      record(
        'J26',
        'E9/#87',
        versionLine ? 'diff' : 'pass',
        `「版本线」字样=${versionLine}；「策略」出现 ${strategyHits} 次（均为「策略提示词/策略」写作义，非槽位义——记观察）；无说明书式文档`,
      )
    })
  }
} finally {
  writeFileSync(
    OUT,
    JSON.stringify(
      { base: BASE, at: new Date().toISOString(), results },
      null,
      2,
    ),
  )
  await ctx.close()
}

console.log(`\n共 ${results.length} 步；结果已写 ${OUT}`)
