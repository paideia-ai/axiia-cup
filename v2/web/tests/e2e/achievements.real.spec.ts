import { expect, test } from '@playwright/test'

const enabled = process.env.AXIIA_ACHIEVEMENT_PREVIEW === '1'
const baseURL = process.env.AXIIA_BASE_URL ?? 'http://127.0.0.1:5184'

test.use({ baseURL })

test('real server persists an earned collection and a claimed bounty with one new-tab toast', async ({ page, context }) => {
  test.skip(!enabled, 'Requires the isolated achievement preview seed.')
  expect(['127.0.0.1', 'localhost', '[::1]']).toContain(
    new URL(baseURL).hostname,
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/login')
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill(
    'tieyan@axiia.test',
  )
  await page.getByLabel('密码', { exact: true }).fill('seedpw-123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL(/\/scenarios/)
  await page.goto('/settings')
  const tabs = context.pages().length
  await page.getByRole('link').filter({
    has: page.getByRole('heading', { name: '成就中心', exact: true }),
  }).click()
  await expect(page).toHaveURL(/\/settings\/achievements/)
  expect(context.pages().length).toBe(tabs)
  await expect(page.getByRole('heading', { name: '金级成就' })).toBeVisible()
  await expect(page.locator('.achievement-item')).toHaveCount(31)
  await expect(page.getByRole('img', { name: '未解锁成就' }).first())
    .toBeVisible()
  await expect(
    page.getByText('在一场电车难题 PvP 中，赢下全部三个案件。', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByRole('complementary', { name: '成就达成' }))
    .toHaveCount(0)

  const initial =
    await (await context.request.get(`${baseURL}/v1/achievements`)).json()
  expect(initial.achievements).toHaveLength(31)
  for (
    const item of initial.achievements.filter((row: { unlocked: boolean }) =>
      !row.unlocked
    )
  ) {
    expect(Object.keys(item).sort()).toEqual(['id', 'tier', 'unlocked'])
  }
  expect(
    initial.achievements.some((row: { id: string }) =>
      row.id === 'first-bounty'
    ),
  ).toBe(false)
  await page.goto('/notifications')
  const readAll = page.getByRole('button', { name: '全部已读' })
  if (await readAll.isEnabled().catch(() => false)) await readAll.click()

  const observer = await context.newPage()
  await observer.goto('/settings/achievements')
  await expect(observer.locator('.achievement-item')).toHaveCount(31)
  // Playwright emulates every page as focused by default. Disable that browser
  // emulation so bringToFront exercises the real foreground-tab delivery rule.
  for (const tab of [page, observer]) {
    const session = await context.newCDPSession(tab)
    await session.send('Emulation.setFocusEmulationEnabled', { enabled: false })
  }
  await page.bringToFront()

  await page.goto('/rewards')
  await page.getByRole('link', { name: '查看战报并领取' }).first().click()
  await expect(page.getByRole('button', { name: '领取奖励', exact: true }))
    .toBeVisible()
  await expect.poll(() => page.evaluate(() => document.hasFocus())).toBe(true)
  await expect.poll(() => observer.evaluate(() => document.hasFocus()))
    .toBe(false)
  await page.getByRole('button', { name: '领取奖励', exact: true }).click()
  const toast = page.getByRole('complementary', { name: '成就达成' })
  await expect(toast).toBeVisible({ timeout: 10_000 })
  await expect(toast).toContainText('凭本事领的')
  await expect(toast).toContainText('把胜利带回家。')
  await expect(toast).not.toContainText('积分返还')
  await expect(observer.getByRole('complementary', { name: '成就达成' }))
    .toHaveCount(0)
  const popupReady = context.waitForEvent('page')
  await toast.getByRole('link').click()
  const popup = await popupReady
  await expect(popup).toHaveURL(/\/settings\/achievements#first-bounty$/)
  await expect(
    popup.getByText('领取你的第一笔发起对局获胜后的积分返还。', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/matches\/\d+$/)
  await popup.close()
  await page.bringToFront()
  await toast.getByRole('button', { name: '关闭成就提示' }).click()
  const resumed = page.waitForResponse((response) =>
    response.url().includes('/v1/achievements/events?') && response.ok()
  )
  await page.reload()
  await resumed
  await expect(page.getByRole('complementary', { name: '成就达成' }))
    .toHaveCount(0)
  const earned = await (await context.request.get(`${baseURL}/v1/achievements`))
    .json()
  expect(
    earned.achievements.filter((row: { id: string }) =>
      row.id === 'first-bounty'
    ),
  ).toHaveLength(1)
  const notices =
    await (await context.request.get(`${baseURL}/v1/notifications`)).json()
  const bounty = notices.notifications.filter((
    row: { kind: string; title?: string },
  ) => row.kind === 'achievement_unlocked' && row.title?.includes('凭本事领的'))
  expect(bounty).toHaveLength(1)
  expect(bounty[0].read).toBe(false)
  await page.goto('/notifications')
  await expect(page.getByText('凭本事领的', { exact: false })).toBeVisible()
  const observerResumed = observer.waitForResponse((response) =>
    response.url().includes('/v1/achievements/events?') && response.ok()
  )
  await observer.bringToFront()
  await observerResumed
  await expect(observer.getByRole('complementary', { name: '成就达成' }))
    .toHaveCount(0)
  await observer.close()
  expect(errors).toEqual([])
})
