import { expect, test } from '@playwright/test'

import type { ScenarioDetail } from '../../src/api/types'
import { baseURL } from './helpers'

test.skip(
  process.env.AXIIA_E2E_ISOLATED !== '1' ||
    !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(baseURL),
  'Only the isolated Swift runner is used for this contract',
)

test('guest can inspect the current NPC catalog without dispatching or borrowing scenario rates', async ({ page }) => {
  const response = await page.request.get('/v1/scenarios/shangyang-court')
  expect(response.ok()).toBe(true)
  const scenario = await response.json() as ScenarioDetail
  expect(scenario.presets.length).toBeGreaterThan(0)
  const preset = scenario.presets[0]
  const writes: string[] = []
  await page.route('**/v1/**', async (route) => {
    const request = route.request()
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      return await route.continue()
    }
    writes.push(request.method())
    await route.abort()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/scenarios/shangyang-court')
  const list = page.locator('[data-tm="DA.npc-list"]')
  await expect(list.getByRole('link')).toHaveCount(scenario.presets.length)
  const href = `/scenarios/shangyang-court/npcs/${
    encodeURIComponent(preset.key)
  }`
  await list.locator(`a[href="${href}"]`).click()
  await expect(page).toHaveURL(`${baseURL}${href}`)
  await expect(page.getByRole('heading', { name: preset.label, exact: true }))
    .toBeVisible()
  const view = page.locator('[data-tm="EA.npc-page"]')
  await expect(view.getByText(preset.modelID, { exact: true })).toBeVisible()
  const side = preset.side === 'a' ? '甲方' : '乙方'
  const name = preset.side === 'a'
    ? scenario.summary.sideAName
    : scenario.summary.sideBName
  await expect(view.getByText(`${side} · ${name}`, { exact: true }))
    .toBeVisible()
  await expect(view).not.toContainText('胜率')
  await expect(view.getByRole('button')).toHaveCount(0)
  expect(
    await page.evaluate(() =>
      document.documentElement.scrollWidth <= innerWidth
    ),
  )
    .toBe(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: preset.label, exact: true }))
    .toBeVisible()
  await page.goto('/scenarios/shangyang-court/npcs/not-a-current-preset')
  await expect(page.getByText(/当前场景已没有这个 NPC 预设/)).toBeVisible()
  await expect(page.getByRole('heading', { name: preset.label, exact: true }))
    .toHaveCount(0)
  expect(writes).toEqual([])
})
