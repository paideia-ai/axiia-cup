import { expect, test } from '@playwright/test'

import { finishedMatch } from '../../src/testing/v34-fixtures'
import {
  buildVersion,
  requireServerFixtures,
  scenarioID,
  signup,
} from './helpers'

test.beforeEach(() => requireServerFixtures())

const rawActMarkup = /<(os|attention|favor|strength|reason|guess)>/

test('v3.4 #14/#17/#57 saves one side and never dispatches implicitly', async ({ page }) => {
  await signup(page, 'builder')
  const prompt = '先确认争点再举证'
  await buildVersion(page, 'a', prompt)

  const matches = await page.request.get('/v1/matches')
  expect(matches.ok()).toBe(true)
  expect((await matches.json() as { matches: unknown[] }).matches).toEqual([])
  await expect(page.getByText('版本（1）')).toBeVisible()
  // #88：保存后留在 E 页，所以同一段文字同时出现在编辑框与版本卡里——断言要
  // 指名是版本卡上的那一份，否则命中两个节点。
  await expect(page.getByTestId('version-card').getByText(prompt))
    .toBeVisible()
})

test('v3.4 #65/#77/#78 shows the two-side gate, rejects real PVP, and permits hotseat', async ({ page }) => {
  await signup(page, 'gates')
  const sideA = await buildVersion(page, 'a', '甲方先定义可验证的制度收益')

  // #88：保存不再把玩家送回 EA，而出战面板的页头入口在 EA——显式过去。
  await page.goto(`/agents/${sideA.agentID}`)
  await page.getByTestId('open-os-panel').click()
  await page.getByRole('tab', { name: /玩家约战/ }).click()
  await expect(page.getByText(/每侧各赢 ≥1 场 NPC 练习/)).toBeVisible()
  await expect(page.getByText(/^[^/]+ 0\/1$/)).toHaveCount(2)
  await page.getByRole('button', { name: '关闭' }).click()

  const opponentsResponse = await page.request.get(
    `/v1/scenarios/${scenarioID}/opponents?side=b`,
  )
  expect(opponentsResponse.ok()).toBe(true)
  const opponents = (await opponentsResponse.json() as {
    opponents: Array<{ agentID: number; isSelf: boolean }>
  }).opponents
  const realOpponent = opponents.find((opponent) => !opponent.isSelf)
  expect(realOpponent, 'seed-dev provides a real opponent fixture')
    .toBeDefined()

  const rejected = await page.request.post('/v1/matches/pvp', {
    headers: { 'Sec-Fetch-Site': 'same-origin' },
    data: {
      versionID: sideA.versionID,
      opponentAgentID: realOpponent!.agentID,
    },
  })
  expect(rejected.status()).toBe(403)
  expect((await rejected.json() as { error: string }).error).toBe('gate_locked')

  await buildVersion(page, 'b', '乙方逐项质疑改革的执行与迁移成本')
  await page.goto(`/agents/${sideA.agentID}`)
  await page.getByTestId('open-os-panel').click()
  await page.getByRole('tab', { name: '左右手互搏' }).click()
  const dispatched = page.waitForResponse((response) =>
    response.url().endsWith('/v1/matches/pvp') &&
    response.request().method() === 'POST'
  )
  await page.getByRole('button', { name: '自打一场' }).click()
  expect((await dispatched).status()).toBe(200)
  await expect(page).toHaveURL(/\/matches\/\d+$/)

  const matches = await page.request.get('/v1/matches')
  const matchList = await matches.json() as {
    matches: Array<{ id: number; kind: string }>
  }
  expect(matchList.matches).toHaveLength(1)
  expect(matchList.matches[0].kind).toBe('pvp')
})

test('v3.4 #20/#22/#24/#69/#80 report journey uses a deterministic API fixture over real auth', async ({ page }) => {
  await signup(page, 'report')
  const me = await page.request.get('/v1/auth/me')
  expect(me.ok(), 'authentication is served by the real Swift process').toBe(
    true,
  )

  await page.route(
    '**/v1/matches/9001',
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(finishedMatch),
      }),
  )
  await page.goto('/matches/9001')
  const result = page.getByRole('heading', { name: '结果' })
  const dialogue = page.getByRole('heading', { name: '对话全文' })
  const inquiry = page.getByRole('heading', { name: '问询', exact: true })
  const hiddenGoal = page.getByRole('heading', { name: '隐藏目标' })
  const scoring = page.getByRole('heading', { name: '计分推导' })
  await expect(result).toBeVisible()
  await expect(dialogue).toBeVisible()
  await expect(inquiry).toBeVisible()
  await expect(hiddenGoal).toBeVisible()
  await expect(scoring).toBeVisible()
  expect((await result.boundingBox())!.y).toBeLessThan(
    (await dialogue.boundingBox())!.y,
  )
  // F2 · #69：隐藏目标五步区块独立成段，位于问询与计分推导之间；「被识破」
  // 的扣分是得分账里明确的一行，不再只是页底散文。
  expect((await inquiry.boundingBox())!.y).toBeLessThan(
    (await hiddenGoal.boundingBox())!.y,
  )
  expect((await hiddenGoal.boundingBox())!.y).toBeLessThan(
    (await scoring.boundingBox())!.y,
  )
  await expect(page.getByText('真目标 SR2 被甘龙识破')).toBeVisible()
  await expect(page.getByText('被识破 -1')).toBeVisible()
  await expect(page.getByText('先立可验证的制度标准。')).toHaveCount(0)
  await expect(page.getByText('商鞅提出了可验证标准。', { exact: true }))
    .toBeVisible()
  // #22：act 的原始标签一个都不许进战报——心声卡已渲染过同一份内容。
  await expect(page.getByText(rawActMarkup)).toHaveCount(0)

  await page.getByRole('switch', { name: /调试模式/ }).click()
  await page.getByRole('button', { name: /内心/ }).first().click()
  await expect(page.getByText('先立可验证的制度标准。', { exact: true }))
    .toBeVisible()
  await page.getByRole('button', { name: '回放' }).click()
  await expect(page.getByRole('heading', { name: '结果' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '问询', exact: true }))
    .toHaveCount(0)
  await expect(page.getByRole('heading', { name: '隐藏目标' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '计分推导' })).toHaveCount(0)
  await expect(page.getByRole('switch', { name: /调试模式/ }))
    .toHaveAttribute('aria-disabled', 'true')
  // 回放是另一条渲染路径，同样不许漏。
  await expect(page.getByText(rawActMarkup)).toHaveCount(0)
})

test('v3.4 #72/#74 keeps the mobile shell ordered, touchable, and overflow-free', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signup(page, 'mobile')
  const bottomNav = page.locator('nav.fixed')
  await expect(bottomNav).toBeVisible()
  await expect(bottomNav.locator('a')).toHaveText([
    '场景',
    '我的智能体',
    '排名',
    '历史',
  ])
  for (const link of await bottomNav.locator('a').all()) {
    expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
})
