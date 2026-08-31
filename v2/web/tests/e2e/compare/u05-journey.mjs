// U05 方法一旅程：OS 选择对手面板（§A5 + #25/#29/#61/#62/#66/#72/#78）。
// 对照文档：compare-v34/journeys/u05-opponent-select.md（步骤与 clause 对应）。
// 运行：node tests/e2e/compare/u05-journey.mjs
//   env AXIIA_BASE_URL（默认部署 dev）· AXIIA_REGISTRATION_CODE（必填）
// 共享 CDP 浏览器（18800）：只关自己的 context，绝不 browser.close()。
// 战斗预算：本脚本恰好派发 1 场 hotseat（C08）。约战一律不点「发起双侧约战」。
//
// 前提：一次性全新账号。SETUP-2/3 走场景页「去构建」（testid build-agent[-b]），
// 该按钮只在该侧还没有策略时渲染（P13 之后有策略会换成「再建一个」）——
// 本脚本每次运行都注册新号，天然满足；不要拿已有智能体的账号重放。
//
// 移植（2026-08-25，#137/#138 后）：#138 令对战条只装 initiatorIsMe=true 的
// 对局——本脚本只看自己派发的 hotseat，C09 断言天然兼容；F6 令约战成功流
// 直达第 ① 场实况——本脚本仍不点「发起双侧约战」，重定向断言归 BDD 的 C15。
import { chromium, request } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.AXIIA_BASE_URL ??
  'https://axiia-cup-2-web.isofucius.cn'
const CODE = process.env.AXIIA_REGISTRATION_CODE ?? ''
const SCENARIO = 'shangyang-court'
const TITLE = '商鞅变法·朝堂辩法'
const SHOTS = '/home/ubuntu/axiia-cup-uiux/compare-v34/shots/u05'
const LOG =
  '/home/ubuntu/axiia-cup-uiux/compare-v34/journeys/u05-journey-log.json'
const sameOrigin = { 'Sec-Fetch-Site': 'same-origin' }

if (!CODE) throw new Error('AXIIA_REGISTRATION_CODE required')
mkdirSync(SHOTS, { recursive: true })

const steps = []
let current = null
const note = (text) => {
  console.log(`    · ${text}`)
  current?.notes.push(text)
}
async function step(id, name, fn) {
  current = { id, name, status: 'pass', notes: [], error: null }
  console.log(`\n== ${id} ${name}`)
  try {
    await fn()
  } catch (error) {
    current.status = 'fail'
    current.error = String(error?.message ?? error).slice(0, 600)
    console.log(`  FAIL: ${current.error}`)
  }
  steps.push(current)
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:18800')
const ctx = await browser.newContext({
  baseURL: BASE,
  viewport: { width: 1280, height: 800 },
})
ctx.setDefaultTimeout(30_000)
const page = await ctx.newPage()
const shot = (name) =>
  page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })

const ts = Date.now()
const mainEmail = `playwright-u05-${ts}@axiia.test`
const bEmail = `playwright-u05-b-${ts}@axiia.test`
let agentA = 0
let agentB1 = 0
let agentB2 = 0
let hotseatMatchID = null
let bVersionID = null
let bOtherScenarioVersionID = null
const bDisplayName = `测试玩家 u05-b`

const dialog = () => page.locator('[role="dialog"][aria-modal="true"]')
const openPanelFromHeader = async (agentID) => {
  await page.goto(`/agents/${agentID}`)
  await page.getByTestId('open-os-panel').click()
  await dialog().getByText(`出战 · ${TITLE}`).waitFor()
}
const closePanel = async () => {
  await page.keyboard.press('Escape')
  await dialog().waitFor({ state: 'detached' }).catch(() => {})
}

async function saveVersion(agentID, prompt) {
  if (!page.url().includes(`/agents/${agentID}/build`)) {
    await page.goto(`/agents/${agentID}/build`)
  }
  const input = page.getByLabel('策略提示词')
  await input.waitFor()
  await input.fill(prompt)
  const before = await page.getByTestId('version-card').count()
  await page.getByTestId('save-version').click()
  await page.getByTestId('version-card').nth(before).waitFor()
}

try {
  await step('SETUP-1', '注册主账号（浏览器 UI）', async () => {
    await page.goto('/register')
    // 注册页是「手机号 / 邮箱」两栏（默认邮箱），两栏都带注册码——锚在
    // 可见面板上（隐藏面板不进无障碍树）。
    const panel = page.getByRole('tabpanel')
    await panel.getByLabel('注册码').fill(CODE)
    await panel.getByLabel('昵称').fill('测试玩家 u05')
    await panel.getByLabel('邮箱').fill(mainEmail)
    await panel.getByLabel('密码').fill('playwrightpw-123456')
    await panel.getByRole('button', { name: '创建账户' }).click()
    await page.waitForURL(/\/(express|scenarios)$/, { timeout: 60_000 })
    note(`注册落点 ${page.url()}`)
  })

  await step('SETUP-2', '建甲方（商鞅）agent 并存 v1/v2', async () => {
    await page.goto(`/scenarios/${SCENARIO}`)
    await page.getByTestId('build-agent').click()
    await page.waitForURL(/\/agents\/\d+\/build/)
    agentA = Number(/\/agents\/(\d+)\/build/.exec(page.url())[1])
    await saveVersion(agentA, '徙木立信：先立可验证的小承诺，再谈变法大义。')
    await saveVersion(agentA, '第二版：把每条祖制引用都逼回可验证性上。')
    note(`agentA=${agentA}，2 版（★ 应仍在 v1——自动参赛只在无 ★ 时）`)
  })

  await step(
    'U05-C09a',
    '#72 空态自动隐藏：派发前各派发处均无对战条',
    async () => {
      for (
        const path of [
          `/agents/${agentA}/build`,
          '/my-agents',
          `/scenarios/${SCENARIO}`,
        ]
      ) {
        await page.goto(path)
        await page.waitForLoadState('networkidle').catch(() => {})
        const visible = await page.locator('section[aria-label="进行中的对战"]')
          .isVisible().catch(() => false)
        if (visible) throw new Error(`${path} 空态仍显示对战条`)
        note(`${path}：空态不显示 ✓`)
      }
    },
  )

  await step(
    'U05-C01',
    'A5 面板解剖：版本卡「出战」与 EA 页头「出战」呼出居中紧凑面板',
    async () => {
      await page.goto(`/agents/${agentA}/build`)
      await page.getByRole('button', { name: /^用 v2 出战$/ }).click()
      await dialog().getByText(`出战 · ${TITLE}`).waitFor()
      const box = await dialog().locator('> div').boundingBox()
      note(
        `E 页版本卡呼出 ✓；面板盒 x=${Math.round(box.x)} w=${
          Math.round(box.width)
        }（1280 视口居中≈${Math.round(box.x + box.width / 2)}）`,
      )
      await shot('c01-panel')
      await closePanel()
      await openPanelFromHeader(agentA)
      note('EA 页头「出战」呼出 ✓')
      await closePanel()
    },
  )

  await step(
    'U05-C02',
    'A5「agent 预选 + 版本下拉」：面板内是否有己方版本下拉',
    async () => {
      await openPanelFromHeader(agentA)
      const subtitle = await dialog().getByText(/出战版本：/).textContent()
      note(`页头呼出副标题：「${subtitle.trim()}」`)
      const combos = await dialog().locator('select, [role="combobox"]').count()
      note(
        `面板内下拉控件数（PVE 预设下拉除外前总数）=${combos}——无己方版本下拉`,
      )
      await shot('c02-no-version-dropdown')
      await closePanel()
      await page.goto(`/agents/${agentA}/build`)
      await page.getByRole('button', { name: /^用 v1 出战$/ }).click()
      const pinned = await dialog().getByText(/出战版本：/).textContent()
      note(`v1 卡呼出（#88 钉住）副标题：「${pinned.trim()}」`)
      await closePanel()
    },
  )

  await step(
    'U05-C03',
    '#62 执方由 agent 隐含：无执方控件；PVE 只列对手侧 NPC',
    async () => {
      await openPanelFromHeader(agentA)
      const sideControls = await dialog().getByText(/^(执方|选择执方|切侧)$/)
        .count()
      note(`执方/切侧字样控件数=${sideControls}`)
      await dialog().getByText('选择预设对手').click()
      const items = await page.locator(
        '[role="option"], [role="listbox"] [role="menuitem"]',
      ).allTextContents()
      note(`甲方（商鞅）面板 PVE 候选：${JSON.stringify(items)}`)
      await page.keyboard.press('Escape')
      await shot('c03-side-implied')
      await closePanel()
    },
  )

  await step('U05-C05', 'A5 tabs 0–3 编制 vs 实际 tab 清单', async () => {
    await openPanelFromHeader(agentA)
    const tabs = await dialog().getByRole('tab').allTextContents()
    note(
      `实际 tabs=${
        JSON.stringify(tabs)
      }（规格：0 PVE·1 PVP按id·2 PVP顶尖玩家·3 自动匹配 + hotseat 另置）`,
    )
    await shot('c05-tabs')
  })

  await step(
    'U05-C06',
    'A5 PVP tab 锁定可见 + 进度徽章（呈现层）',
    async () => {
      const pvpTab = dialog().getByRole('tab', { name: /玩家约战/ })
      const lockCount = await pvpTab.locator('svg.lucide-lock').count()
      note(`锁形图标在 tab 上：${lockCount === 1 ? '✓' : '✗'}`)
      await pvpTab.click()
      const gateText = await dialog().getByText(/解锁玩家约战/).textContent()
        .catch(() => null)
      note(
        `锁定文案：「${gateText?.trim() ?? '（无——可能走了老服务器降级枝）'}」`,
      )
      const badges = await dialog().locator(
        '[data-slot="badge"], .rounded-full',
      ).filter({ hasText: /\d\/\d/ }).allTextContents()
      note(`按侧进度徽章：${JSON.stringify(badges)}`)
      await shot('c06-locked')
    },
  )

  await step(
    'U05-C04',
    '#62/#64「切侧」：面板内切侧控件与替代路径',
    async () => {
      const anySwitch = await dialog().getByText('切侧').count()
      note(`字面「切侧」控件数=${anySwitch}`)
      const practiceSelf = await dialog().getByRole('button', {
        name: /去练习该侧/,
      }).count()
      const createOpp = await dialog().getByRole('button', {
        name: /去创建对侧/,
      }).count()
      const practiceOpp = await dialog().getByRole('button', {
        name: /去练习对侧/,
      }).count()
      note(
        `锁定态替代路径：去练习该侧=${practiceSelf} 去创建对侧=${createOpp} 去练习对侧=${practiceOpp}（对侧尚无 agent → 应为创建引导，#64）`,
      )
      await dialog().getByRole('tab', { name: '左右手互搏' }).click()
      const emptyHotseat = await dialog().getByText('你还没有对侧智能体')
        .isVisible()
      note(`hotseat 无对侧空态（引导先建对侧）：${emptyHotseat ? '✓' : '✗'}`)
      await shot('c04-switch-side')
      await closePanel()
    },
  )

  await step('SETUP-3', '建乙方（甘龙）agent B1 并存 v1', async () => {
    await page.goto(`/scenarios/${SCENARIO}`)
    await page.getByTestId('build-agent-b').click()
    await page.waitForURL(/\/agents\/\d+\/build/)
    agentB1 = Number(/\/agents\/(\d+)\/build/.exec(page.url())[1])
    await saveVersion(
      agentB1,
      '甘龙 B1：以祖制不可轻变为纲，逐条要求过渡成本核算。',
    )
    note(`agentB1=${agentB1}`)
  })

  await step('U05-C07a', '#61 hotseat：对侧仅 1 个时直陈对侧身份', async () => {
    await openPanelFromHeader(agentA)
    await dialog().getByRole('tab', { name: '左右手互搏' }).click()
    const line = await dialog().getByText(/对侧：/).textContent()
    note(`单对侧直陈：「${line.trim()}」（无下拉）`)
    const fallback = await dialog().getByText(/对侧将以其★参赛版本/)
      .textContent()
    note(`对侧取版说明：「${fallback.trim()}」`)
    await closePanel()
  })

  await step('SETUP-4', '经「再建一个」造第二个甘龙 B2 并存 v1', async () => {
    await page.goto('/my-agents')
    await page.getByRole('button', { name: /再建一个.*甘龙侧智能体/ }).click()
    await page.getByRole('button', { name: '创建并进入构建' }).click()
    await page.waitForURL(/\/agents\/\d+\/build/)
    agentB2 = Number(/\/agents\/(\d+)\/build/.exec(page.url())[1])
    await saveVersion(
      agentB2,
      '甘龙 B2「激进」：直接攻击变法者的动机与授权来源。',
    )
    note(`agentB2=${agentB2}`)
  })

  await step(
    'U05-C07b',
    '#61 hotseat：对侧多 agent 时需选择打哪个',
    async () => {
      await openPanelFromHeader(agentA)
      await dialog().getByRole('tab', { name: '左右手互搏' }).click()
      await dialog().getByText('选择你的对侧智能体').waitFor().catch(
        async () => {
          const chosen = await dialog().locator('button').filter({
            hasText: /agent #/,
          }).first().textContent().catch(() => null)
          note(`未见占位符，选择器当前值：「${chosen ?? '?'}」`)
        },
      )
      await dialog().locator('[role="combobox"], select').last().click().catch(
        () => {},
      )
      const options = await page.locator('[role="option"]').allTextContents()
      note(`对侧候选：${JSON.stringify(options)}（应含 B1 与 B2 两项）`)
      await shot('c07-hotseat-select')
      await page.keyboard.press('Escape')
    },
  )

  await step(
    'U05-C08',
    '#78 hotseat 不受 PVP 门槛限制（消耗 1 场）',
    async () => {
      // 门槛未解锁（0 PVE 胜）状态直接自打——按 #78 应放行。
      await dialog().getByRole('button', { name: '自打一场' }).click()
      await page.waitForURL(/\/matches\/\d+/, { timeout: 60_000 })
      hotseatMatchID = Number(/\/matches\/(\d+)/.exec(page.url())[1])
      note(
        `门槛未解锁下派发成功 → /matches/${hotseatMatchID} ✓（matchID=${hotseatMatchID}）`,
      )
      await shot('c08-hotseat-dispatched')
      const cfg = await (await page.request.get('/v1/config')).json().catch(
        () => null,
      )
      if (cfg) {
        note(
          `config 用量：battlesToday=${cfg.usage?.battlesToday} pvpBattlesToday=${cfg.usage?.pvpBattlesToday}（#78：应占总配额、不占 PVP 配额）`,
        )
      }
    },
  )

  await step(
    'U05-C09b',
    '#72 派发后：条在派发处出现，可折叠；非派发处不出现',
    async () => {
      const strip = () => page.locator('section[aria-label="进行中的对战"]')
      for (
        const path of [
          `/agents/${agentA}/build`,
          '/my-agents',
          `/scenarios/${SCENARIO}`,
        ]
      ) {
        await page.goto(path)
        await strip().waitFor({ timeout: 40_000 })
        note(`${path}：对战条出现 ✓`)
      }
      await shot('c09-strip')
      const header = await strip().locator('button').first().textContent()
      note(`条头：「${header.trim()}」`)
      await strip().locator('button').first().click()
      const cardsGone = await strip().locator('a[href^="/matches/"]').count()
      note(`点 chevron 折叠后卡片数=${cardsGone}（应为 0）`)
      await shot('c09-strip-collapsed')
      await strip().locator('button').first().click()
      for (const path of ['/scenarios', '/matches']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle').catch(() => {})
        const visible = await strip().isVisible().catch(() => false)
        note(`${path}（非派发处）：${visible ? '✗ 出现了' : '不出现 ✓'}`)
        if (visible) throw new Error(`${path} 出现对战条`)
      }
      await shot('c09-strip-absent-catalog')
    },
  )

  await step(
    'U05-C10',
    'A5「侧抽屉可观战」：点条上对局卡的实际去向',
    async () => {
      await page.goto(`/agents/${agentA}/build`)
      const strip = page.locator('section[aria-label="进行中的对战"]')
      await strip.waitFor({ timeout: 40_000 })
      await strip.locator('a[href^="/matches/"]').first().click()
      await page.waitForURL(/\/matches\/\d+/)
      const drawers = await page.locator(
        '[role="dialog"], aside[aria-label*="观战"]',
      ).count()
      note(
        `点卡后落全页 /matches/:id（drawer 数=${drawers}）——规格字面是「侧抽屉可观战」`,
      )
    },
  )

  await step(
    'SETUP-5',
    'API 注册副账号 B 并存双侧版本（按 id 查验 + 对手玩家行；不派发）',
    async () => {
      const api = await request.newContext({ baseURL: BASE })
      const signup = await api.post('/v1/auth/signup', {
        headers: sameOrigin,
        data: {
          code: CODE,
          email: bEmail,
          phone: null,
          password: 'playwrightpw-123456',
          displayName: bDisplayName,
        },
      })
      if (!signup.ok()) {
        throw new Error(`B signup ${signup.status()}: ${await signup.text()}`)
      }
      const models = await (await api.get('/v1/models')).json()
      const modelID = models.models.find((m) => m.id.includes('flash'))?.id ??
        models.models[0].id
      const mk = async (scenarioID, side = 'a') => {
        const ensure = await api.post('/v1/agents/ensure', {
          headers: sameOrigin,
          data: { scenarioID, side },
        })
        if (!ensure.ok()) return null
        const { agentID } = await ensure.json()
        const save = await api.post(`/v1/agents/${agentID}/save`, {
          headers: sameOrigin,
          data: {
            prompt: 'U05 审计副账号版本（仅供按 id 查验，不参战）。',
            modelID,
            parentVersionID: null,
          },
        })
        if (!save.ok()) return null
        return (await save.json()).id
      }
      bVersionID = await mk(SCENARIO)
      note(`B 在 ${SCENARIO} 的版本 id=#${bVersionID}`)
      // #66①：对手玩家行按对侧 agent 圈定——副账号乙侧也存一版（双侧齐备），
      // C11 的「对手玩家」列表才会稳定出现玩家行。
      const bSideBVersionID = await mk(SCENARIO, 'b')
      note(`B 在 ${SCENARIO} 的乙侧版本 id=#${bSideBVersionID}（凑双侧齐备）`)
      const list = await (await api.get('/v1/scenarios')).json().catch(() =>
        null
      )
      const other = list?.scenarios?.find((s) => s.id !== SCENARIO)
      if (other) {
        bOtherScenarioVersionID = await mk(other.id)
        note(
          `B 在他场景 ${other.id} 的版本 id=#${bOtherScenarioVersionID}（跨场景报错用）`,
        )
      } else note('目录只有一个场景，跨场景错误分支留给 BDD/源码')
      await api.dispose()
    },
  )

  // ── 解锁态 UI（route-mock gateProgress 达标；只验部署前端的表单/文案层） ──
  await step(
    'MOCK',
    '以 route-mock 令 gateProgress 达标（不碰服务器状态）',
    async () => {
      await page.route(/\/scenarios\/shangyang-court\?side=/, async (route) => {
        const response = await route.fetch()
        const json = await response.json()
        json.summary.gateUnlocked = true
        json.summary.gateProgress = {
          a: { beaten: 1, needed: 1 },
          b: { beaten: 1, needed: 1 },
        }
        await route.fulfill({ response, json })
      })
      note('已挂 scenario-detail 改写（gate 达标）；后续步骤标 via route-mock')
    },
  )

  await step(
    'U05-C11',
    '#66 双侧成对约战表单（UI 层，via route-mock；不派发）',
    async () => {
      await openPanelFromHeader(agentA)
      await dialog().getByRole('tab', { name: /玩家约战/ }).click()
      await dialog().getByText('玩家约战已解锁').waitFor()
      note('解锁头部「玩家约战已解锁」+ 双侧 ✓ 徽章 ✓')
      const lineupTitle = await dialog().getByText(/我的双侧出战阵容/)
        .textContent()
      note(`阵容标题：「${lineupTitle.trim()}」（①正/②反成对语义）`)
      await dialog().getByText(/默认各侧 ★参赛版本/).waitFor()
      note(
        '默认取版文案「默认各侧 ★参赛版本（未标记则最新版）」✓（#91 PVP 默认取参赛版本）',
      )
      const pickers = await dialog().getByText(/^执[AB] · /).allTextContents()
      note(`双侧选择器标签：${JSON.stringify(pickers)}`)
      // 只读选择器触发钮上的当前值（不开下拉——面板对 Escape 全局关闭，开了
      // portal 再按 Esc 会把整个面板关掉，前次运行即栽在这里，见 fix 记录）。
      const triggers = await dialog().locator('[role="combobox"]')
        .allTextContents()
      note(
        `阵容选择器当前值：${
          JSON.stringify(triggers)
        }（P1 要求策略展示名 + id 可复制小字）`,
      )
      const modes = await dialog().getByRole('button', {
        name: /^(对手玩家|按 id 约战)$/,
      }).allTextContents()
      note(`子模式：${JSON.stringify(modes)}`)
      await dialog().getByText(/一次约战＝成对两场/).waitFor()
      note(
        '脚注「一次约战＝成对两场（①正/②反），每次成对约战计 2 场配额」✓（Q7）',
      )
      const rival = await dialog().getByText(bDisplayName).count()
      note(
        `对手玩家列表含副账号 B：${
          rival > 0 ? '✓（按玩家行 + 发起双侧约战按钮，不点）' : '✗/尚未出现'
        }`,
      )
      await shot('c11-paired-form')
    },
  )

  await step('U05-C13', '#29 仅文案：被通知、无需同意、不能拒绝', async () => {
    await dialog().getByText(/无需同意、不能拒绝/).waitFor()
    const line = await dialog().getByText(/无需同意、不能拒绝/).first()
      .textContent()
    note(`脚注：「${line.trim()}」`)
    await shot('c13-notify-copy')
  })

  await step(
    'U05-C12',
    '#25 按 id 约战：占位/校验/解析卡（真实查询；不点约战）',
    async () => {
      await dialog().getByRole('button', { name: '按 id 约战' }).click()
      const input = dialog().getByPlaceholder(/输入对方任一版本 id/)
      await input.waitFor()
      note('占位符「输入对方任一版本 id（战报页可复制）」✓（#25 发现路径）')
      await input.fill('abc')
      await dialog().getByRole('button', { name: /查询/ }).click()
      note(
        `非数字 → 「${
          (await dialog().getByText(/请输入数字版本 id/).textContent()).trim()
        }」`,
      )
      await input.fill('99999999')
      await dialog().getByRole('button', { name: /查询/ }).click()
      await dialog().getByText(/未找到该版本 id|暂不支持/).waitFor()
      note(
        `不存在 id → 「${
          (await dialog().getByText(/未找到该版本 id|暂不支持/).textContent())
            .trim()
        }」`,
      )
      if (bOtherScenarioVersionID) {
        await input.fill(String(bOtherScenarioVersionID))
        await dialog().getByRole('button', { name: /查询/ }).click()
        await dialog().getByText(/属于其他场景/).waitFor()
        note(
          `跨场景 id → 「${
            (await dialog().getByText(/属于其他场景/).textContent()).trim()
          }」`,
        )
      }
      await input.fill(String(bVersionID))
      await dialog().getByRole('button', { name: /查询/ }).click()
      await dialog().getByText(bDisplayName).first().waitFor()
      const card = await dialog().getByText(/执[AB]（/).textContent()
      note(`解析卡身份行：「${card.trim()}」（玩家/场景/侧/模型/v#id）`)
      const pin = await dialog().getByText(/按 id 钉住其/).textContent()
      note(`钉住语义：「${pin.trim()}」（另一侧取对方★参赛版否则最新版）`)
      const btn = await dialog().getByRole('button', { name: '发起双侧约战' })
        .count()
      note(`「发起双侧约战」按钮存在=${btn}（审计约束：不点击）`)
      await shot('c12-byid')
      await closePanel()
    },
  )

  await step(
    'U05-C11b',
    '#66 单侧缺失引导（via route-mock my/agents 抹掉乙侧）',
    async () => {
      await page.route(/\/my\/agents/, async (route) => {
        const response = await route.fetch()
        const json = await response.json()
        for (const s of json.scenarios ?? []) {
          if (s.scenarioID === SCENARIO) s.sides.b = []
        }
        await route.fulfill({ response, json })
      })
      await openPanelFromHeader(agentA)
      await dialog().getByRole('tab', { name: /玩家约战/ }).click()
      await dialog().getByText('PVP 约战需双方双侧齐备').waitFor()
      const body = await dialog().getByText(/一次约战＝两场/).textContent()
      note(`缺侧引导正文：「${body.trim()}」`)
      const cta = await dialog().getByRole('button', { name: /去创建/ })
        .allTextContents()
      note(`CTA：${JSON.stringify(cta)}`)
      await shot('c11b-missing-side')
      await closePanel()
      await page.unroute(/\/my\/agents/)
    },
  )

  await step('U05-C14', 'A5 移动端：底部弹层 + 条横向滚动', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openPanelFromHeader(agentA)
    const box = await dialog().locator('> div').boundingBox()
    note(
      `390×844 下面板盒 y=${Math.round(box.y)} h=${Math.round(box.height)} 底=${
        Math.round(box.y + box.height)
      }（≈844 即贴底弹层）`,
    )
    await shot('c14-mobile-sheet')
    await closePanel()
    await page.goto(`/agents/${agentA}/build`)
    const strip = page.locator('section[aria-label="进行中的对战"]')
    await strip.waitFor({ timeout: 40_000 })
    const overflow = await strip.locator(
      'div.overflow-x-auto, .overflow-x-auto',
    ).count()
    note(`条卡容器 overflow-x-auto=${overflow}（横向滚动容器）`)
    await shot('c14-mobile-strip')
  })
} finally {
  const summary = {
    unit: 'U05-opponent-select',
    base: BASE,
    generatedAt: new Date().toISOString(),
    accounts: [mainEmail, bEmail],
    agentA,
    agentB1,
    agentB2,
    hotseatMatchID,
    bVersionID,
    bOtherScenarioVersionID,
    steps,
  }
  writeFileSync(LOG, JSON.stringify(summary, null, 2))
  console.log(`\nlog → ${LOG}`)
  console.log(JSON.stringify(steps.map((s) => `${s.id}:${s.status}`)))
  await ctx.close()
}
