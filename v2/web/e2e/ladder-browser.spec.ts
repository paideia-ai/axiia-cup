import { expect, type Page, test } from '@playwright/test'
import { sortieDemoAPI } from '../src/testing/sortie-demo-api'
import { sortieEntries } from '../src/features/sortie/fixtures'
import type { LadderEntryDTO } from '../src/api/types'

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
  await expect(page.getByRole('heading', { name: '天梯', exact: true }))
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
