import { expect, test } from '@playwright/test'

const headers = { 'Sec-Fetch-Site': 'same-origin' }

test('real settlement unlocks a redacted slot, toasts once, opens a new tab and persists a notification', async ({ page, context }) => {
  const email = `achievement-${Date.now()}@axiia.test`
  const signup = await page.request.post('/v1/auth/signup', {
    headers,
    data: {
      code: 'ACHIEVEMENT-PREVIEW',
      email,
      password: 'achievement-preview-2026',
      displayName: '成就验收',
    },
  })
  expect(signup.ok()).toBe(true)
  await page.goto('/settings')
  await page.getByRole('link', { name: /成就中心/ }).click()
  await expect(page).toHaveURL(/\/settings\/achievements$/)
  await expect(page.getByText('已获得 0 / 31')).toBeVisible()
  const locked = await (await page.request.get('/v1/achievements')).json()
  expect(locked.achievements).toHaveLength(31)
  expect(
    locked.achievements.every((item: Record<string, unknown>) =>
      !item.title && !item.id && !item.image && !item.description
    ),
  ).toBe(true)
  const config = await (await page.request.get('/v1/config')).json()
  const ensured = await page.request.post('/v1/agents/ensure', {
    headers,
    data: { scenarioID: 'shangyang-court', side: 'a' },
  })
  const { agentID } = await ensured.json()
  const saved = await page.request.post(`/v1/agents/${agentID}/save`, {
    headers,
    data: { prompt: '以理服人。', modelID: config.models[0].id },
  })
  const { id: versionID } = await saved.json()
  const scenario =
    await (await page.request.get('/v1/scenarios/shangyang-court?side=a'))
      .json()
  const presets = scenario.presets ?? scenario.opponents ?? []
  const preset =
    presets.find((entry: { side: string }) => entry.side === 'b') ?? presets[0]
  expect(preset).toBeTruthy()
  await page.bringToFront()
  await page.getByRole('heading', { name: '成就中心' }).click()
  const started = await page.request.post('/v1/matches/pve', {
    headers,
    data: { versionID, presetKey: preset.key },
  })
  expect(started.ok()).toBe(true)
  const { matchID } = await started.json()
  const toast = page.getByRole('status').filter({ hasText: '初试锋芒' })
  await expect(toast).toBeVisible({ timeout: 25_000 })
  await expect(toast).toContainText('有人听进去了。')
  await expect(toast).not.toContainText('赢得你的第一场对局。')
  const popupPromise = context.waitForEvent('page')
  await toast.getByRole('link').click()
  const popup = await popupPromise
  await popup.waitForURL('**/settings/achievements#first-word')
  await expect(popup.getByText('赢得你的第一场对局。')).toBeVisible()
  expect(page.url()).toMatch(/\/settings\/achievements$/)
  await popup.close()
  await page.bringToFront()
  await page.goto('/notifications')
  await expect(page.getByText('初试锋芒', { exact: true })).toBeVisible()
  const notifications = await (await page.request.get('/v1/notifications'))
    .json()
  const achievement = notifications.notifications.filter((
    row: { kind: string },
  ) => row.kind === 'achievement_unlocked')
  expect(achievement).toHaveLength(1)
  expect(achievement[0].link).toBe('/settings/achievements#first-word')
  const claim = await page.request.post(
    `/v1/rewards/matches/${matchID}/claim`,
    { headers },
  )
  expect(claim.ok()).toBe(true)
  await expect(page.getByRole('status').filter({ hasText: '凭本事领的' }))
    .toBeVisible({ timeout: 15_000 })
  await page.request.delete('/v1/notifications', { headers })
  await page.reload()
  await page.goto('/settings/achievements')
  await expect(page.getByText('赢得你的第一场对局。')).toBeVisible()
  await expect(page.getByText('领取你的第一笔有效对局赏金。')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: '初试锋芒' }))
    .toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(() =>
      document.documentElement.scrollWidth <= innerWidth
    ),
  ).toBe(true)
})
