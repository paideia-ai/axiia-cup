import { expect, type Page, test } from '@playwright/test'
import { sortieDemoAPI } from '../src/testing/sortie-demo-api'
import { sortieEntries } from '../src/features/sortie/fixtures'
import type { LadderEntryDTO } from '../src/api/types'
import { createSortieLadderAPI } from '../src/testing/sortie-ladder-api'

for (const width of [390, 1440]) {
  test(`shared demo page can return, switch scenarios, and start three battles at ${width}px`, async ({ page }) => {
    const api = createSortieLadderAPI()
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/v1/**', async (route) => {
      const req = route.request()
      const path = new URL(req.url()).pathname.slice(3)
      if (path.endsWith('/stream') || path === '/notifications/bell') {
        return route.fulfill({
          contentType: 'text/event-stream',
          body: 'retry: 60000\n\n',
        })
      }
      const request = new Request(req.url(), {
        method: req.method(),
        ...(req.postData() ? { body: req.postData()! } : {}),
      })
      const response = await api.handle(request, path) ??
        await sortieDemoAPI(request, path)
      await route.fulfill({
        status: response.status,
        json: await response.json(),
      })
    })
    await page.goto('/sortie')
    await expect(page.getByText('演示选项', { exact: true })).toHaveCount(0)
    const ids = new Set<string>()
    for (const scene of ['商鞅变法', '码头疑云', '商鞅变法']) {
      const button = page.getByRole('button', { name: scene, exact: true })
      await expect(button).toBeEnabled()
      await button.click()
      await page.getByRole('button', { name: '随机匹配', exact: true }).click()
      await page.getByRole('button', { name: '开始对局', exact: true }).click()
      await page.waitForURL(/\/matches\/\d+$/)
      ids.add(page.url())
      await page.getByRole('link', { name: '天梯', exact: true }).click()
    }
    expect(ids.size).toBe(3)
    await page.getByRole('button', { name: '随机匹配', exact: true }).click()
    await page.getByRole('button', { name: '开始对局', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(
      '同时进行的对局已达上限',
    )
    const response = await api.handle(
      new Request('http://demo/v1/matches'),
      '/matches',
    )
    expect(
      (await response!.json()).matches.filter((m: { finished: boolean }) =>
        !m.finished
      ),
    ).toHaveLength(3)
  })
}

async function fixtures(
  page: Page,
  { locked = false, failStart = false, empty = false } = {},
) {
  let starts = 0
  let requestedVersion = 0
  const entryDTO = (entry: typeof sortieEntries[number]): LadderEntryDTO => ({
    ...entry,
    ownerName: '你',
    role: { key: entry.roleKey, name: entry.roleName, side: entry.side },
    record: entry,
  })
  await page.route('**/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.slice(3)
    if (path === '/ladder') {
      if (empty) {
        return route.fulfill({
          status: 503,
          json: { error: 'unavailable', message: '战绩加载失败' },
        })
      }
      return route.fulfill({
        json: {
          entries: sortieEntries.filter((e) =>
            e.scenarioID === url.searchParams.get('scenarioID')
          ).map(entryDTO),
          highestWinRate: .8,
          highestWinRateAgentID: 8000,
        },
      })
    }
    if (path === '/ladder/pairings') {
      requestedVersion = req.postDataJSON().versionID
      const own = sortieEntries.find((e) => e.versionID === requestedVersion)!
      const other = sortieEntries.find((e) =>
        e.scenarioID === own.scenarioID && e.side !== own.side
      )!
      return route.fulfill({
        json: {
          id: 'server-selected-ticket',
          expiresAt: Math.floor(Date.now() / 1000) + 600,
          entry: entryDTO(own),
          opponent: {
            ...entryDTO(other),
            ownerID: 'rival',
            ownerName: '服务端对手',
          },
        },
      })
    }
    if (path === '/ladder/pairings/server-selected-ticket/start') {
      starts++
      return route.fulfill(
        failStart
          ? {
            status: 409,
            json: { error: 'pairing_expired', message: 'expired' },
          }
          : { json: { matchID: 9500 } },
      )
    }
    const response = await sortieDemoAPI(
      new Request(req.url(), {
        method: req.method(),
        headers: req.headers(),
        ...(req.postData() ? { body: req.postData()! } : {}),
      }),
      path,
    )
    if (locked && path === '/scenarios') {
      const body = await response.json()
      body.scenarios.forEach((s: { gateUnlocked: boolean }) =>
        s.gateUnlocked = false
      )
      return route.fulfill({ json: body })
    }
    return route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    })
  })
  return { starts: () => starts, version: () => requestedVersion }
}

test('production ladder uses server pairing, no demo controls or rules, and explicitly starts once', async ({ page }) => {
  const api = await fixtures(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sortie')
  await expect(
    page.getByRole('link', { name: '商鞅变法场景介绍', exact: true }),
  )
    .toBeVisible()
  await expect(page.getByText('匹配规则', { exact: true })).toHaveCount(0)
  await expect(page.getByText('演示选项', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '商鞅变法', exact: true }).click()
  await expect(page.locator('.sortie-records')).toContainText('80.0%')
  await page.getByRole('button', { name: '随机匹配', exact: true }).click()
  await expect(page.locator('.sortie-duelist-opponent')).toContainText(
    '服务端对手',
  )
  expect(api.starts()).toBe(0)
  expect(api.version()).toBe(13000)
  await page.getByRole('button', { name: '开始对局', exact: true }).click()
  await page.waitForURL('**/matches/9500')
  expect(api.starts()).toBe(1)
})

test('role without entry retains its identity, links to its agent, and cannot match', async ({ page }) => {
  await fixtures(page)
  await page.goto('/sortie')
  await page.getByRole('button', { name: '本能寺之变', exact: true }).click()
  await page.getByRole('button', { name: '主张杀信长：更换角色', exact: true })
    .click()
  await expect(page.locator('.sortie-entry-picker select')).toHaveCount(0)
  await page.locator('.sortie-picker-roles button').filter({
    hasText: '足利义昭',
  }).click()
  await page.getByRole('button', { name: '确认角色', exact: true }).click()
  await expect(page.getByRole('link', { name: '设置参赛版本' }))
    .toHaveAttribute('href', '/agents/194')
  await expect(page.getByRole('button', { name: '随机匹配', exact: true }))
    .toHaveCount(0)
  await expect(page.locator('[data-sortie-side=a]')).toContainText('足利义昭')
  await expect(page.getByRole('link', { name: /^智能体胜率/ })).toHaveCount(0)
})

test('expired pairing is not retried as a new battle; loading failures do not expose match controls', async ({ page }) => {
  await fixtures(page, { failStart: true })
  await page.goto('/sortie')
  await page.getByRole('button', { name: '随机匹配', exact: true }).click()
  await page.getByRole('button', { name: '开始对局', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('过期')
  await expect(page.getByRole('button', { name: '开始对局', exact: true }))
    .toBeDisabled()
  await page.getByRole('button', { name: '重新匹配', exact: true }).click()
  await expect(page.getByRole('button', { name: '随机匹配', exact: true }))
    .toBeVisible()
  await page.unrouteAll()
  await fixtures(page, { empty: true })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('战绩加载失败')
  await expect(page.getByRole('button', { name: '随机匹配', exact: true }))
    .toHaveCount(0)
})

test('practice opens the existing NPC picker at the exact entry version', async ({ page }) => {
  await fixtures(page, { locked: true })
  await page.goto('/sortie')
  await page.getByRole('button', { name: '商鞅变法', exact: true }).click()
  await page.getByRole('link', { name: '去练习', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'NPC 练习', exact: true }))
    .toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('dialog')).toContainText('★参赛版本')
  await expect(page).toHaveURL(/agents\/1300\?version=13000$/)
})

test('highest win rate opens its agent identity independently of the scenario card', async ({ page }) => {
  await fixtures(page)
  await page.goto('/sortie')
  const record = page.getByRole('link', {
    name: '全服最高胜率 80.0%，查看智能体',
    exact: true,
  })
  await expect(record).toHaveAttribute('href', '/agents/8000/identity')
  await record.hover()
  await expect(record).not.toHaveCSS('box-shadow', 'none')
  await expect(page.locator('a a')).toHaveCount(0)
  await record.click()
  await expect(page).toHaveURL(/\/agents\/8000\/identity$/)
  await expect(page.locator('[data-tm="EA.public-owner-line"]')).toContainText(
    '山月',
  )
  await page.goBack()
  await page.getByRole('link', { name: '商鞅变法场景介绍', exact: true })
    .click()
  await expect(page).toHaveURL(/\/scenarios\/shangyang-court$/)
})

test('agent win rate follows the selected entry and opens its home', async ({ page }) => {
  await fixtures(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sortie')
  const ownRate = page.getByRole('link', { name: /^智能体胜率/ })
  await expect(ownRate).toHaveAttribute('href', '/agents/1300')
  await expect(page.locator('.sortie-entry-line a')).toHaveCount(0)
  await page.locator('[data-sortie-side=b]').click()
  const other = sortieEntries.find((e) =>
    e.scenarioID === 'shangyang-court' && e.side === 'b'
  )!
  await expect(ownRate).toHaveAttribute('href', `/agents/${other.agentID}`)
  await ownRate.hover()
  await expect(ownRate).not.toHaveCSS('box-shadow', 'none')
  await expect(page.locator('a a')).toHaveCount(0)
  await ownRate.click()
  await expect(page).toHaveURL(new RegExp(`/agents/${other.agentID}$`))
  await expect(page.locator('[data-tm="EA.scenario-link"]')).toBeVisible()
})

for (const width of [390, 1440]) {
  test(`identity shows cumulative ladder separately from version records at ${width}px`, async ({ page }) => {
    await fixtures(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/agents/8000/identity')
    const record = page.getByRole('region', { name: '天梯战绩', exact: true })
    await expect(record).toContainText('58.6%')
    await expect(record).toContainText('29 场 · 17 胜 · 10 负 · 2 平')
    await expect(page.getByTestId('identity-version')).toContainText('69.2%')
    await expect(page.getByTestId('identity-version')).toHaveAttribute(
      'href',
      '/matches?agent=8000&version=80000',
    )
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
    ).toBe(false)
    await page.goto('/agents/8040/identity')
    await expect(record).toContainText('0 场 · 0 胜 · 0 负 · 0 平')
    await expect(record).toContainText('—')
  })
}

test('identity remains readable when an older server omits ladder records', async ({ page }) => {
  await fixtures(page)
  await page.route(
    '**/v1/agents/8000/public',
    (route) =>
      route.fulfill({
        json: {
          agentID: 8000,
          scenarioID: 'shangyang-court',
          scenarioTitle: '商鞅变法',
          side: 'a',
          sideName: '商鞅',
          ownerName: '山月',
          versions: [{
            id: 80000,
            ordinal: 1,
            isEntry: true,
            createdAt: 1700000000,
            matchCount: 20,
            winCount: 10,
            lossCount: 10,
            drawCount: 0,
          }],
        },
      }),
  )
  await page.goto('/agents/8000/identity')
  await expect(page.getByTestId('identity-version')).toContainText('50%')
  await expect(page.getByRole('region', { name: '天梯战绩', exact: true }))
    .toHaveCount(0)
})

test('ladder shows a recently finished loss with a battle report link', async ({ page }) => {
  await fixtures(page)
  await page.route('**/v1/matches', (route) =>
    route.fulfill({
      json: {
        open: true,
        matches: [{
          id: 9876,
          scenarioID: 'shangyang-court',
          scenarioTitle: '商鞅变法',
          kind: 'pvp',
          dispatched: true,
          finished: true,
          scored: true,
          winner: 'b',
          createdAt: Date.now() / 1000 - 60,
          finishedAt: Date.now() / 1000,
          initiatorIsMe: true,
          participants: {
            a: { versionID: 13000, ownerDisplayName: '你', isMine: true },
            b: { versionID: 13500, ownerDisplayName: '对手', isMine: false },
          },
        }],
      },
    }))
  await page.goto('/sortie')
  const report = page.getByRole('link').filter({ hasText: '刚完成' })
  await expect(report).toContainText('对方')
  await expect(report).toContainText('胜')
  await expect(report).toHaveAttribute('href', '/matches/9876')
  await expect(page.getByRole('button', { name: '随机匹配', exact: true }))
    .toBeEnabled()
})
