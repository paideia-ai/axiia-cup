// 站内通知 — u09-notifications.feature 的可执行对应（BDD：每个 test.step
// 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：B5 全部 · #43（站内-only / 离线持久 / 铃铛含未读数）· #53
// （八种通知与优先级）。条款锚 U09-Cxx ↔ findings/u09-notifications.json。
//
// 2026-08-25 移植注（audit-suites-c-port，PR #127 → main，含 #137/#138）：
// · F3（PR #137）重做通知页交互——已读/清除断言对齐乐观更新（不闪
//   「加载中…」、列表不卸载、成功路径不重取），新增「操作条吸顶」与
//   「确认清除乐观清空」两测。
// · 素材改造：本地栈（run-playwright.sh）全新库、零模型推理——不复用远端
//   专用变量（AXIIA_U09_EMAIL / AXIIA_LENT_EMAIL…）。「有存量战绩的账号」
//   由本文件经 API 现场装配：管理员装载无模型固定局场景，该账号双侧各胜
//   1 场 PVE（battle_finished ×2 + 门槛翻转 gate_unlocked），对手账号同样
//   解锁后发起一次双侧约战（合并 challenged ×1，两条腿完局再 +2
//   battle_finished）。②被挑战（U09-C08）由此转为可执行场景，PVP 组真实
//   出现，组序断言不再空转。
// · 执行顺序＝文件顺序（workers=1）：破坏性动作（全部已读/清除）靠后，
//   确认清除最后。
// · U09-C05（派发 ETA）仍未修——test.fixme，台账见 fixme-u09.json。
import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from '@playwright/test'

import {
  apiSignup,
  FIXTURE_WIN_TOKEN,
  installFixtureScenario,
  sameOrigin,
  saveEntryVersion,
  signup,
  winFixturePVE,
} from '../helpers'

const PASSWORD = 'playwrightpw-123456'

test.beforeEach(() => {
  // 首个存量场景要付一次性装配成本（固定局装载 + TOTP 提权 + 4 场零推理
  // PVE + 双侧约战两条腿完局）——给足预算，后续场景远用不满。
  test.setTimeout(120_000)
})

// 把浏览器上下文登录成指定账号（u07/u13 idiom）：page.request 与页面共用
// cookie 罐，POST 落会话 cookie 后 SPA 首次加载即已登录。
// 集成注（真服）：/v1/auth/login 按邮箱固定窗限流 10 次/分钟（成功也计数，
// AttemptThrottle）且 KDF 昂贵——逐场景重登同一存量账号会在套件末尾触顶
// 429。像真浏览器一样复用会话：首登后缓存 cookie，其后注入而非重打接口。
type SessionCookies = Awaited<
  ReturnType<ReturnType<Page['context']>['cookies']>
>
const sessionCookies = new Map<string, SessionCookies>()

async function uiLogin(page: Page, email: string) {
  const cached = sessionCookies.get(email)
  if (cached) {
    await page.context().addCookies(cached)
    const me = await page.request.get('/v1/auth/me')
    if (me.ok()) return
    await page.context().clearCookies()
    sessionCookies.delete(email)
  }
  const login = await page.request.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email, password: PASSWORD },
  })
  expect(login.ok(), `browser login ${email} succeeds`).toBe(true)
  sessionCookies.set(email, await page.context().cookies())
}

// 单账号纪律（审计规约：本单元至多自建 1 只浏览器注册账号）：首个空态
// 场景经 UI 注册，之后一律登录复用（workers=1，模块级状态同 worker 存活）。
let freshEmail: string | null = null

async function freshAccount(page: Page) {
  if (freshEmail != null) {
    await uiLogin(page, freshEmail)
    return
  }
  freshEmail = await signup(page, 'u09')
}

// 顶栏铃铛（#43；位置与可见性归 U08，本单元只断未读「数」与增减行为）。
function bellOf(page: Page) {
  return page.locator('a[aria-label="通知"]')
}
function unreadDotOf(page: Page) {
  return bellOf(page).locator('span[aria-label*="条未读"]')
}

interface NotificationRowDTO {
  id: number
  kind: string
  matchID?: number | null
  read: boolean
  link?: string | null
}

async function fetchNotifications(page: Page) {
  const response = await page.request.get('/v1/notifications')
  expect(response.ok(), 'GET /v1/notifications succeeds').toBe(true)
  return await response.json() as {
    notifications: NotificationRowDTO[]
    unreadCount: number
  }
}

async function openNotificationsPage(page: Page) {
  await page.goto('/notifications')
  // 列表或空态之一渲染完成即算加载完。
  await expect(
    page.getByText('暂无通知。').or(page.locator('p.uppercase').first()),
  ).toBeVisible({ timeout: 30_000 })
}

// 固定局对局完局轮询：无模型脚本首次重放即完局，超时即真异常。
async function pollMatchDone(context: APIRequestContext, matchID: number) {
  await expect
    .poll(async () => {
      const detail = await context.get(`/v1/matches/${matchID}`)
      if (!detail.ok()) return false
      const body = await detail.json() as {
        summary: { finished: boolean; scored: boolean }
      }
      return body.summary.finished && body.summary.scored
    }, { message: `match ${matchID} finishes scored`, timeout: 30_000 })
    .toBe(true)
}

// ── 存量通知面：惰性一次性装配（workers=1，首个存量场景付装配成本）──────
//
// 通知全部产自真实服务端行为：battle_finished 出自完局事务（REST 轮询不算
// 在场，行生而未读）、gate_unlocked 出自门槛翻转（AXIIA_PVE_REQUIRED_WINS=1，
// 双侧各胜 1 场即翻）、challenged 出自约战创建事务（合并一条、指向第 ① 腿）。

interface StockState {
  email: string
  rivalName: string
  scenarioID: string
  challengeLegIDs: number[]
}

let stock: Promise<StockState> | null = null

function ensureStock(): Promise<StockState> {
  stock ??= provisionStock()
  return stock
}

async function provisionStock(): Promise<StockState> {
  const fixtureID = `u09-fixture-${Date.now()}`
  await installFixtureScenario(fixtureID, 'U09 通知固定局')
  const owner = await apiSignup('u09-stock')
  const ownerA = await saveEntryVersion(
    owner.context,
    fixtureID,
    'a',
    `${FIXTURE_WIN_TOKEN} 正方按固定局暗记出战，为 U09 攒对局完成通知。`,
  )
  const ownerB = await saveEntryVersion(
    owner.context,
    fixtureID,
    'b',
    `${FIXTURE_WIN_TOKEN} 反方同样带暗记，第二胜触发门槛翻转通知。`,
  )
  await winFixturePVE(owner.context, ownerA.versionID, 'a')
  await winFixturePVE(owner.context, ownerB.versionID, 'b')

  const rival = await apiSignup('u09-rival')
  const rivalA = await saveEntryVersion(
    rival.context,
    fixtureID,
    'a',
    `${FIXTURE_WIN_TOKEN} 对手正方：解锁后向存量账号发起双侧约战。`,
  )
  const rivalB = await saveEntryVersion(
    rival.context,
    fixtureID,
    'b',
    `${FIXTURE_WIN_TOKEN} 对手反方：凑齐 #77 双向门槛的另一半。`,
  )
  await winFixturePVE(rival.context, rivalA.versionID, 'a')
  await winFixturePVE(rival.context, rivalB.versionID, 'b')

  const challenge = await rival.context.post('/v1/challenges', {
    headers: sameOrigin,
    data: {
      scenarioID: fixtureID,
      mine: {
        a: { versionID: rivalA.versionID },
        b: { versionID: rivalB.versionID },
      },
      opponent: { accountID: owner.accountID },
    },
  })
  expect(challenge.ok(), 'challenge dispatch succeeds').toBe(true)
  const { matchIDs } = await challenge.json() as { matchIDs: number[] }
  expect(matchIDs.length, 'challenge returns both leg ids').toBe(2)
  for (const matchID of matchIDs) await pollMatchDone(rival.context, matchID)

  const state: StockState = {
    email: owner.email,
    rivalName: rival.displayName,
    scenarioID: fixtureID,
    challengeLegIDs: matchIDs,
  }
  await owner.context.dispose()
  await rival.context.dispose()
  return state
}

async function loginStock(page: Page): Promise<StockState> {
  const state = await ensureStock()
  await uiLogin(page, state.email)
  return state
}

// ── 新账号空态（U09-C16 · U09-C01） ─────────────────────────────────────────

test.describe('新账号从零开始——空态与零未读', () => {
  test('新账号的通知页是空态，铃铛没有未读标记', async ({ page }) => {
    await test.step('假如 我用注册码注册了一个全新账号', async () => {
      await freshAccount(page)
      // 复用账号可能漂移（别的流程给它产生过通知）——那样空态无从断言，
      // 带因跳过而不是假红。
      const { notifications } = await fetchNotifications(page)
      test.skip(
        notifications.length > 0,
        '复用的全新账号已存在通知——空态场景无从展开',
      )
    })
    await test.step('当 我打开通知页', async () => {
      await page.goto('/notifications')
    })
    await test.step('那么 页面显示「暂无通知。」', async () => {
      await expect(page.getByText('暂无通知。')).toBeVisible()
    })
    await test.step('并且 页面没有「全部已读」和「清除」按钮（空态不给动作）', async () => {
      await expect(page.getByRole('button', { name: '全部已读' }))
        .toHaveCount(0)
      await expect(page.getByRole('button', { name: '清除' })).toHaveCount(0)
    })
    await test.step('并且 顶栏铃铛上没有未读标记（不存在「条未读」的角标）', async () => {
      await expect(bellOf(page)).toBeVisible()
      // useBell 初值就是 0——SSE 首帧未到时「无角标」是平凡真。等一拍首帧
      // 再断言，让「零未读」来自服务端而非初值。
      await page.waitForTimeout(3000)
      await expect(unreadDotOf(page)).toHaveCount(0)
    })
  })

  test('通知渠道只有站内——设置页不存在邮件或推送开关', async ({ page }) => {
    await test.step('假如 我用注册码注册了一个全新账号', async () => {
      await freshAccount(page)
    })
    await test.step('当 我打开设置页', async () => {
      await page.goto('/settings')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
    await test.step('那么 页面上不出现「邮件通知」或「推送通知」这类站外渠道开关', async () => {
      await expect(page.getByText('邮件通知')).toHaveCount(0)
      await expect(page.getByText('推送通知')).toHaveCount(0)
    })
  })
})

// ── 存量通知面（本地装配）：持久 / 未读数 / 分组 / 深链 / 已读 / 清除 ───────

test.describe('存量账号：持久 / 未读数 / 分组 / 深链 / 已读 / 清除', () => {
  test('重新登录后，历史通知仍在列', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号（其对局完成于此前的会话）', async () => {
      await loginStock(page)
    })
    let rows: NotificationRowDTO[] = []
    await test.step('当 我打开通知页', async () => {
      await openNotificationsPage(page)
      rows = (await fetchNotifications(page)).notifications
    })
    await test.step('那么 通知列表非空——离线期间产生的通知被服务端持久保存', () => {
      expect(rows.length).toBeGreaterThan(0)
    })
    await test.step('并且 其中包含对局完成类通知', () => {
      expect(rows.some((row) => row.kind === 'battle_finished')).toBe(true)
    })
  })

  test('铃铛未读标记携带未读数，且与服务端未读计数一致', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginStock(page)
      await page.goto('/scenarios')
    })
    let unreadCount = 0
    await test.step('当 存在未读通知', async () => {
      unreadCount = (await fetchNotifications(page)).unreadCount
      test.skip(unreadCount === 0, '此刻无未读通知——未读标记场景无从展开')
    })
    await test.step('那么 顶栏铃铛出现未读标记，其无障碍文案为「N 条未读」', async () => {
      // bell SSE 首帧要一拍——放宽预算等它。
      await expect(unreadDotOf(page)).toBeVisible({ timeout: 30_000 })
    })
    await test.step('并且 N 与 /v1/notifications 返回的 unreadCount 相等', async () => {
      await expect(unreadDotOf(page)).toHaveAttribute(
        'aria-label',
        `${unreadCount} 条未读`,
      )
    })
  })

  test('通知页按组渲染，PVP/锦标赛组恒在 PVE/系统组之前', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginStock(page)
    })
    let heads: string[] = []
    await test.step('当 我打开通知页', async () => {
      await openNotificationsPage(page)
      heads = await page.locator('p.uppercase').allInnerTexts()
    })
    await test.step('那么 出现分组组头（「PVP / 锦标赛」与「PVE / 系统」，空组隐藏——存量素材两组都非空）', () => {
      // 存量素材带 challenged（PVP 组）与 battle_finished/gate_unlocked
      // （PVE 组）——两组必同现，组序断言（U09-C15）真实触发。
      expect(heads).toEqual(['PVP / 锦标赛', 'PVE / 系统'])
    })
    await test.step('并且 「PVP / 锦标赛」在前（#53 优先级 PVP/锦标赛 > PVE）', () => {
      expect(heads[0]).toBe('PVP / 锦标赛')
    })
    await test.step('并且 被约战通知落在「PVP / 锦标赛」组下', async () => {
      const pvpGroup = page
        .locator('div.space-y-2', {
          has: page.locator('p.uppercase', { hasText: 'PVP / 锦标赛' }),
        })
        .first()
      await expect(pvpGroup.getByText('被约战').first()).toBeVisible()
    })
    await test.step('并且 对局完成与门槛达成通知落在「PVE / 系统」组下', async () => {
      const pveGroup = page
        .locator('div.space-y-2', {
          has: page.locator('p.uppercase', { hasText: 'PVE / 系统' }),
        })
        .first()
      await expect(pveGroup.getByText('对战结束').first()).toBeVisible()
      await expect(pveGroup.getByText('门槛达成').first()).toBeVisible()
    })
  })

  test('① 对局完成通知带战报深链（U09-C07 · U09-C04）', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginStock(page)
    })
    let target = ''
    await test.step('当 我打开通知页并点一条对局完成通知的深链', async () => {
      const rows = (await fetchNotifications(page)).notifications
      const finished = rows.find((row) => row.kind === 'battle_finished')
      expect(finished, '存在对局完成通知').toBeTruthy()
      // 锚定这条通知自己的深链（服务端 link；老服务器回落 matchID 拼链）——
      // 不许「页面上随便哪条链接」冒充。
      target = finished!.link ?? `/matches/${finished!.matchID}`
      await openNotificationsPage(page)
      await page.locator(`a[href="${target}"]`).first().click()
    })
    await test.step('那么 我落在该对局的战报页（/matches/N）', async () => {
      expect(target).toMatch(/^\/matches\/\d+$/)
      await expect(page).toHaveURL(new RegExp(`${target}$`))
      await expect(page.getByRole('heading', { level: 1 }))
        .toBeVisible({ timeout: 30_000 })
    })
  })

  test('⑥ 门槛达成通知在列（U09-C12）', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号（其固定局场景门槛已于装配时解锁）', async () => {
      await loginStock(page)
    })
    let rows: NotificationRowDTO[] = []
    await test.step('当 我打开通知页', async () => {
      await openNotificationsPage(page)
      rows = (await fetchNotifications(page)).notifications
    })
    await test.step('那么 列表里有一条门槛达成（PVP 解锁）通知', async () => {
      expect(rows.some((row) => row.kind === 'gate_unlocked')).toBe(true)
      await expect(page.getByText('门槛达成').first()).toBeVisible()
    })
  })

  test('② 被约战通知合并成一条，深链落在约战第 ① 场（U09-C08 · U09-C04）', async ({ page }) => {
    let state: StockState | null = null
    await test.step('假如 我登录有存量战绩的账号（对手账号已向它发起一次双侧约战）', async () => {
      state = await loginStock(page)
    })
    let challengedRows: NotificationRowDTO[] = []
    await test.step('当 我打开通知页', async () => {
      await openNotificationsPage(page)
      challengedRows = (await fetchNotifications(page)).notifications
        .filter((row) => row.kind === 'challenged')
    })
    await test.step('那么 列表里有一条被约战通知——标题带对手昵称与「向你发起双侧约战」，两条腿只合并成这一条（#66 成对语义）', async () => {
      // 一次约战两条腿，只许合并成 1 条通知（服务端在创建事务里合并）。
      expect(challengedRows.length).toBe(1)
      await expect(page.getByText('被约战').first()).toBeVisible()
      await expect(
        page.getByText(
          new RegExp(`${state!.rivalName}.*向你发起双侧约战`),
        ),
      ).toBeVisible()
    })
    await test.step('并且 其深链指向约战第 ① 场（/matches/leg1）', () => {
      expect(challengedRows[0].link).toBe(
        `/matches/${state!.challengeLegIDs[0]}`,
      )
    })
    await test.step('当 我点这条被约战通知的深链', async () => {
      await page
        .locator(`a[href="/matches/${state!.challengeLegIDs[0]}"]`)
        .first()
        .click()
    })
    await test.step('那么 我落在第 ① 场战报页，页内带「约战①」徽记（F6/F7 的成对标注）', async () => {
      await expect(page).toHaveURL(
        new RegExp(`/matches/${state!.challengeLegIDs[0]}$`),
      )
      await expect(page.getByText('约战①').first())
        .toBeVisible({ timeout: 30_000 })
    })
  })

  test('批量操作条吸顶——滚到哪都能看到「全部已读 / 清除」', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginStock(page)
    })
    await test.step('当 我打开通知页并滚到页面底部', async () => {
      await openNotificationsPage(page)
      await page.evaluate(() => {
        globalThis.scrollTo(0, document.body.scrollHeight)
      })
    })
    await test.step('那么 批量操作条以粘性定位吸附在顶栏下沿（sticky top-12）', async () => {
      const bar = page.locator('div.sticky').filter({
        has: page.getByRole('heading', { name: '通知' }),
      })
      await expect(bar).toBeVisible()
      expect(await bar.evaluate((el) => getComputedStyle(el).position))
        .toBe('sticky')
    })
    await test.step('并且 「全部已读」与「清除」按钮仍在视口内可见', async () => {
      await expect(page.getByRole('button', { name: '全部已读' }))
        .toBeInViewport()
      await expect(page.getByRole('button', { name: '清除' })).toBeInViewport()
    })
  })

  test('逐条标已读是乐观更新——未读数立即减一，列表不卸载不闪加载', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号且存在未读通知', async () => {
      await loginStock(page)
      const { unreadCount } = await fetchNotifications(page)
      test.skip(unreadCount === 0, '此刻无未读通知——标已读场景无从展开')
      await openNotificationsPage(page)
    })
    let before = 0
    let rowCount = 0
    let markButtons = 0
    let refetches = 0
    await test.step('当 我在一条未读通知上点「标为已读」', async () => {
      const badge = page.getByText(/^\d+ 条未读$/)
      before = Number(/(\d+)/.exec(await badge.innerText())![1])
      rowCount = await page.locator('div.space-y-2 > div').count()
      markButtons = await page.getByRole('button', { name: '标为已读' })
        .count()
      // F3：成功路径不再 reload()——从此刻起页面不许再发 GET
      // /v1/notifications（page.request 的 API 轮询不经过页面网络栈）。
      page.on('request', (request) => {
        if (
          request.method() === 'GET' &&
          new URL(request.url()).pathname === '/v1/notifications'
        ) {
          refetches += 1
        }
      })
      await page.getByRole('button', { name: '标为已读' }).first().click()
    })
    await test.step('那么 通知页的未读徽章数值立即减一（0 时徽章消失）', async () => {
      if (before === 1) {
        await expect(page.getByText(/^\d+ 条未读$/)).toHaveCount(0)
      } else {
        // exact:true——子串匹配会把「11 条未读」也当「1 条未读」。
        await expect(page.getByText(`${before - 1} 条未读`, { exact: true }))
          .toBeVisible()
      }
    })
    await test.step('并且 全程不出现「加载中…」——列表保持挂载，行数不变（F3）', async () => {
      await expect(page.getByText('加载中…')).toHaveCount(0)
      await expect(page.locator('div.space-y-2 > div')).toHaveCount(rowCount)
      await expect(page.getByRole('button', { name: '标为已读' }))
        .toHaveCount(markButtons - 1)
    })
    await test.step('并且 成功路径不重取整页——没有新的 GET /v1/notifications（F3）', async () => {
      await page.waitForTimeout(800)
      expect(refetches).toBe(0)
    })
  })

  test('全部已读乐观归零、铃铛未读标记消失', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginStock(page)
      await openNotificationsPage(page)
      test.skip(
        (await fetchNotifications(page)).notifications.length === 0,
        '通知列表为空——全部已读场景无从展开',
      )
    })
    await test.step('当 我点「全部已读」', async () => {
      const readAll = page.getByRole('button', { name: '全部已读' })
      // 全部已读在未读为 0 时是 disabled——那也是「归零」的合法起点。
      if (await readAll.isEnabled()) await readAll.click()
    })
    await test.step('那么 未读徽章立即消失且不出现「加载中…」（F3 乐观置读）', async () => {
      await expect(page.getByText(/^\d+ 条未读$/)).toHaveCount(0)
      await expect(page.getByText('加载中…')).toHaveCount(0)
    })
    await test.step('并且 服务端 unreadCount 归零', async () => {
      await expect
        .poll(async () => (await fetchNotifications(page)).unreadCount)
        .toBe(0)
    })
    await test.step('并且 刷新后顶栏铃铛不再有未读标记', async () => {
      await page.reload()
      await expect(bellOf(page)).toBeVisible()
      // bell SSE 首帧要一拍——等页面安定后断言角标恒缺席。
      await page.waitForTimeout(2000)
      await expect(unreadDotOf(page)).toHaveCount(0)
    })
  })

  test('清除有确认守卫，取消则一条不少', async ({ page }) => {
    let before = 0
    await test.step('假如 我登录有存量战绩的账号且通知列表非空', async () => {
      await loginStock(page)
      before = (await fetchNotifications(page)).notifications.length
      test.skip(before === 0, '通知列表为空——清除守卫场景无从展开')
      await openNotificationsPage(page)
    })
    await test.step('当 我点「清除」但在确认框里选择取消', async () => {
      // 基数在点击前的最后一刻取——杀掉「登录到点击之间新通知到达」的
      // 计数竞态。
      before = (await fetchNotifications(page)).notifications.length
      let confirmSeen = false
      page.once('dialog', (dialog) => {
        confirmSeen = true
        void dialog.dismiss()
      })
      await page.getByRole('button', { name: '清除' }).click()
      await page.waitForTimeout(1000)
      expect(confirmSeen, '出现确认对话框').toBe(true)
    })
    await test.step('那么 通知列表条数不变', async () => {
      expect((await fetchNotifications(page)).notifications.length).toBe(before)
    })
  })

  test('确认清除后列表乐观清空，空态与动作按钮一并落位', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号且通知列表非空', async () => {
      await loginStock(page)
      const { notifications } = await fetchNotifications(page)
      test.skip(
        notifications.length === 0,
        '通知列表为空——确认清除场景无从展开',
      )
      await openNotificationsPage(page)
    })
    await test.step('当 我点「清除」并在确认框里确认', async () => {
      page.once('dialog', (dialog) => void dialog.accept())
      await page.getByRole('button', { name: '清除' }).click()
    })
    await test.step('那么 页面立即显示「暂无通知。」且不出现「加载中…」（F3 乐观清空）', async () => {
      await expect(page.getByText('暂无通知。')).toBeVisible()
      await expect(page.getByText('加载中…')).toHaveCount(0)
    })
    await test.step('并且 「全部已读」和「清除」按钮随空态一并消失', async () => {
      await expect(page.getByRole('button', { name: '全部已读' }))
        .toHaveCount(0)
      await expect(page.getByRole('button', { name: '清除' })).toHaveCount(0)
    })
    await test.step('并且 服务端通知列表已清空', async () => {
      await expect
        .poll(async () => (await fetchNotifications(page)).notifications.length)
        .toBe(0)
    })
  })
})

// ── 派发时 ETA（U09-C05）——缺口未修，test.fixme ────────────────────────────

test.describe('派发时的 ETA 与「完成后通知你」', () => {
  // fixme(U09-C05 派发 ETA 文案缺席): 按规格 B5 应 异步派发成功后给出 ETA
  // 并写明「完成后通知你」；待 派发流程补 ETA 与通知承诺文案（#137 F6 反而
  // 把约战也改成直跳 /matches/:id 实况页，全站唯一「完成后通知你」仍只在
  // 落地页营销卡）修复后摘除。
  test.fixme('异步派发时给出 ETA 并承诺「完成后通知你」', async ({ page }) => {
    let state: StockState | null = null
    await test.step('假如 我登录有存量战绩的账号并在已解锁场景发起一场对战', async () => {
      state = await loginStock(page)
      await page.goto(`/scenarios/${state.scenarioID}`)
    })
    await test.step('当 派发成功', () => {
      // 实测三条派发路径（PVE / 互搏 / 约战）都直跳实况页——缺口修复后
      // 此处应停在派发面板并给出闭环文案。
    })
    await test.step('那么 界面给出 ETA 并写明「完成后通知你」', async () => {
      await expect(page.getByText('完成后通知你')).toBeVisible()
      await expect(page.getByText(/预计/)).toBeVisible()
    })
  })
})
