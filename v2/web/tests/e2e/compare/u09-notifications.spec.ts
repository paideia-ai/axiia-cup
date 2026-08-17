// 站内通知 — u09-notifications.feature 的可执行对应（BDD：每个 test.step
// 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：B5 全部 · #43（站内-only / 离线持久 / 铃铛含未读数）· #53
// （八种通知与优先级）。条款锚 U09-Cxx ↔ findings/u09-notifications.json。
//
// 账号：全新账号在 beforeAll 注册一次（空态面共用）；出借账号经
// AXIIA_LENT_EMAIL / AXIIA_LENT_PASSWORD 登录（U06 遗产：4 场完局 +
// 商鞅场景门槛解锁）——只读，例外仅「标已读」（其本身即 B5 条款行为）。
import { expect, type Page, test } from '@playwright/test'

import { signup } from '../helpers'

const lentEmail = process.env.AXIIA_LENT_EMAIL ?? ''
const lentPassword = process.env.AXIIA_LENT_PASSWORD ?? ''

test.beforeEach(() => {
  // 远程 dev（或 5173 vite 代理远程后端）单次往返常达十几秒——默认 30s 的
  // **测试**预算（非 expect 预算）会在登录一步就烧完。放宽到 120s。
  test.setTimeout(120_000)
})

// 单账号纪律（审计规约：本单元至多自建 1 只账号）：优先经 AXIIA_U09_EMAIL /
// AXIIA_U09_PASSWORD 复用旅程已建的号；缺席时本次运行只注册一次，之后的
// 空态场景一律登录复用（workers=1，模块级状态在同一 worker 内存活）。
let freshCreds: { email: string; password: string } | null =
  process.env.AXIIA_U09_EMAIL
    ? {
      email: process.env.AXIIA_U09_EMAIL,
      password: process.env.AXIIA_U09_PASSWORD ?? 'playwrightpw-123456',
    }
    : null

async function freshAccount(page: Page) {
  if (freshCreds) {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(freshCreds.email)
    await page.getByLabel('密码').fill(freshCreds.password)
    await page.getByRole('button', { name: /登录/ }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
    return
  }
  const email = await signup(page, 'u09')
  freshCreds = { email, password: 'playwrightpw-123456' }
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

async function loginLent(page: Page) {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(lentEmail)
  await page.getByLabel('密码').fill(lentPassword)
  await page.getByRole('button', { name: /登录/ }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

async function openNotificationsPage(page: Page) {
  await page.goto('/notifications')
  // 列表或空态之一渲染完成即算加载完。
  await expect(
    page.getByText('暂无通知。').or(page.locator('p.uppercase').first()),
  ).toBeVisible({ timeout: 30_000 })
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

// ── 出借账号（存量通知面） ──────────────────────────────────────────────────

test.describe('出借账号：持久 / 未读数 / 已读 / 分组 / 深链', () => {
  test.skip(
    lentEmail === '' || lentPassword === '',
    'AXIIA_LENT_EMAIL / AXIIA_LENT_PASSWORD 未提供——出借账号场景整组跳过',
  )

  test('重新登录后，历史通知仍在列', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号（其对局完成于此前的会话）', async () => {
      await loginLent(page)
    })
    let rows: NotificationRowDTO[] = []
    await test.step('当 我打开通知页', async () => {
      await openNotificationsPage(page)
      rows = (await fetchNotifications(page)).notifications
    })
    await test.step('那么 通知列表非空——离线期间产生的通知被服务端持久保存', async () => {
      expect(rows.length).toBeGreaterThan(0)
    })
    await test.step('并且 其中包含对局完成类通知', async () => {
      expect(rows.some((row) => row.kind === 'battle_finished')).toBe(true)
    })
  })

  test('铃铛未读标记携带未读数，且与服务端未读计数一致', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginLent(page)
    })
    let unreadCount = 0
    await test.step('当 存在未读通知', async () => {
      unreadCount = (await fetchNotifications(page)).unreadCount
      test.skip(unreadCount === 0, '此刻无未读通知——未读标记场景无从展开')
    })
    await test.step('那么 顶栏铃铛出现未读标记，其无障碍文案为「N 条未读」', async () => {
      // bell SSE 首帧在慢链路上要好一阵——与兄弟断言看齐给 30s。
      await expect(unreadDotOf(page)).toBeVisible({ timeout: 30_000 })
    })
    await test.step('并且 N 与 /v1/notifications 返回的 unreadCount 相等', async () => {
      await expect(unreadDotOf(page)).toHaveAttribute(
        'aria-label',
        `${unreadCount} 条未读`,
      )
    })
  })

  test('逐条标已读令未读数减一', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号且存在未读通知', async () => {
      await loginLent(page)
      const { unreadCount } = await fetchNotifications(page)
      test.skip(unreadCount === 0, '此刻无未读通知——标已读场景无从展开')
      await openNotificationsPage(page)
    })
    let before = 0
    await test.step('当 我在一条未读通知上点「标为已读」', async () => {
      const badge = page.getByText(/^\d+ 条未读$/)
      before = Number(/(\d+)/.exec(await badge.innerText())![1])
      await page.getByRole('button', { name: '标为已读' }).first().click()
    })
    await test.step('那么 通知页的未读徽章数值减一（0 时徽章消失）', async () => {
      if (before === 1) {
        await expect(page.getByText(/^\d+ 条未读$/)).toHaveCount(0)
      } else {
        // exact:true——子串匹配会把「11 条未读」也当「1 条未读」。
        await expect(page.getByText(`${before - 1} 条未读`, { exact: true }))
          .toBeVisible()
      }
    })
  })

  test('全部已读令未读归零、铃铛未读标记消失', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginLent(page)
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
    await test.step('那么 服务端 unreadCount 归零', async () => {
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
      await loginLent(page)
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

  test('通知页按组渲染，PVP/锦标赛组恒在 PVE/系统组之前', async ({ page }) => {
    await test.step('假如 我登录有存量战绩的账号', async () => {
      await loginLent(page)
    })
    let heads: string[] = []
    await test.step('当 我打开通知页', async () => {
      await openNotificationsPage(page)
      heads = await page.locator('p.uppercase').allInnerTexts()
    })
    await test.step('那么 出现分组组头（「PVP / 锦标赛」与「PVE / 系统」中至少一个，空组隐藏）', async () => {
      expect(heads.length).toBeGreaterThan(0)
      for (const head of heads) {
        expect(['PVP / 锦标赛', 'PVE / 系统']).toContain(head)
      }
    })
    await test.step('并且 若两组同现，「PVP / 锦标赛」在前（#53 优先级 PVP/锦标赛 > PVE）', async () => {
      // 报告里注明本次实际走的分支：出借账号存量全为非 PVP kind 时只有单组，
      // 组序断言即空转（组序另有静态结构证据，见 findings U09-C15）。
      test.info().annotations.push({
        type: 'note',
        description: heads.length === 2
          ? '两组同现——组序断言实跑'
          : `单组（${heads.join('、')}）——组序断言未触发`,
      })
      if (heads.length === 2) {
        expect(heads).toEqual(['PVP / 锦标赛', 'PVE / 系统'])
      }
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
      await loginLent(page)
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
    await test.step('假如 我登录有存量战绩的账号（其商鞅场景门槛已于此前解锁）', async () => {
      await loginLent(page)
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
})

// ── 派发时 ETA（U09-C05）——战斗预算 0，可执行侧显式跳过 ────────────────────

test.describe('派发时的 ETA 与「完成后通知你」', () => {
  test('异步派发时给出 ETA 并承诺「完成后通知你」', async () => {
    await test.step('假如 我登录有存量战绩的账号并在已解锁场景发起一场对战', async () => {
      test.skip(
        true,
        '战斗预算 0：取证由人工旅程一次性 hotseat 完成——实测派发后直接跳转 ' +
          '/matches/:id 实况页，无 ETA、无「完成后通知你」（见 findings U09-C05，spec-gap）',
      )
    })
    await test.step('当 派发成功', async () => {})
    await test.step('那么 界面给出 ETA 并写明「完成后通知你」', async () => {})
  })
})
