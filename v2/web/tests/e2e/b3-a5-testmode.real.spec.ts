import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import { B3_A5_FIXTURE_DEFAULTS } from '../../src/testmode/data/b3-a5-journeys'
import { openBattlePanel } from './helpers'

// These tests use real handoff accounts. A failure must never persist a trace,
// video, screenshot, or automatic page snapshot that could contain the login
// form or authenticated data.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1'
test.use({ screenshot: 'off', trace: 'off', video: 'off' })

const enabled = process.env.AXIIA_HANDOFF_E2E === '1'
const productionOrigin = 'https://axiia-cup-2-web.isofucius.cn'
const defaultManualURL =
  'https://deploy-v2-ebon-beta.vercel.app/spec-v4-b3-a5-human-test'

interface Persona {
  displayName: string
  emailEnv: string
  passwordEnv: string
  agentID: string
  entryPath: string
  fixtureProfileID: string
  journeyID: string
  stepID: string
}

const b3Owner: Persona = {
  displayName: 'B3 人测·完整所有者',
  emailEnv: 'AXIIA_B3_RICH_OWNER_EMAIL',
  passwordEnv: 'AXIIA_B3_RICH_OWNER_PASSWORD',
  agentID: B3_A5_FIXTURE_DEFAULTS.b3OwnerAgentId,
  entryPath: `/tournaments/${B3_A5_FIXTURE_DEFAULTS.b3OwnerTournamentId}`,
  fixtureProfileID: 'b3-owner-rich',
  journeyID: 'HV-B3-OWNER-EA',
  stepID: 'HV-B3-OWNER-EA-S01',
}

const a5Owner: Persona = {
  displayName: 'A5 人测·完整发起方',
  emailEnv: 'AXIIA_A5_RICH_CHALLENGER_EMAIL',
  passwordEnv: 'AXIIA_A5_RICH_CHALLENGER_PASSWORD',
  agentID: B3_A5_FIXTURE_DEFAULTS.a5CoreAgentId,
  entryPath: `/agents/${B3_A5_FIXTURE_DEFAULTS.a5CoreAgentId}`,
  fixtureProfileID: 'a5-core-rich-owner',
  journeyID: 'HV-A5-OS-CORE',
  stepID: 'HV-A5-OS-CORE-S01',
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  expect(value, `${name} must be injected at runtime`).toBeTruthy()
  return value!
}

function assertApprovedProductBaseURL(): void {
  const raw = requiredEnvironment('AXIIA_BASE_URL')
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('AXIIA_BASE_URL must be an absolute URL')
  }

  const localHost = url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost'
  const explicitlyAllowedLocal =
    process.env.AXIIA_HANDOFF_ALLOW_LOCAL === '1' && localHost &&
    (url.protocol === 'http:' || url.protocol === 'https:')
  const approvedProduction = url.origin === productionOrigin
  expect(
    approvedProduction || explicitlyAllowedLocal,
    'real handoff credentials may only be sent to the approved product origin; local verification additionally requires AXIIA_HANDOFF_ALLOW_LOCAL=1',
  ).toBe(true)
  expect(
    url.pathname === '/' && !url.search && !url.hash && !url.username &&
      !url.password,
    'AXIIA_BASE_URL must be an origin without a path, query, hash, or embedded credentials',
  ).toBe(true)
}

function deepTestModePath(persona: Persona): string {
  const query = new URLSearchParams({
    tm: '1',
    tmJourney: persona.journeyID,
    tmStep: persona.stepID,
  })
  return `${persona.entryPath}?${query}`
}

async function assertFreshTester(page: Page, context: BrowserContext) {
  assertApprovedProductBaseURL()
  expect(await context.cookies(), 'a tester starts without a product session')
    .toEqual([])

  await page.goto('/')
  expect(
    await page.evaluate(() => localStorage.getItem('axiia:tm')),
    'a tester starts without a persisted Test Mode switch',
  ).toBeNull()
}

async function loginAfterProtectedEntry(page: Page, persona: Persona) {
  await expect(page).toHaveURL((url) =>
    url.pathname === '/login' && url.searchParams.has('next')
  )
  await expect(page.getByRole('navigation', { name: '测试模式' }))
    .toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('axiia:tm'))).toBe('1')

  const loginURL = new URL(page.url())
  const next = loginURL.searchParams.get('next')
  expect(next, 'login keeps the protected destination').not.toBeNull()
  const restored = new URL(next!, 'https://handoff.invalid')
  expect(restored.pathname).toBe(persona.entryPath)
  expect(restored.searchParams.get('tmJourney')).toBe(persona.journeyID)
  expect(restored.searchParams.get('tmStep')).toBe(persona.stepID)

  const panel = page.getByRole('tabpanel')
  await panel.getByLabel('邮箱').fill(requiredEnvironment(persona.emailEnv))
  await panel.getByLabel('密码').fill(requiredEnvironment(persona.passwordEnv))
  await panel.getByRole('button', { name: '登录', exact: true }).click()

  await expect(page).toHaveURL((url) =>
    url.pathname === persona.entryPath &&
    url.searchParams.get('tmJourney') === persona.journeyID &&
    url.searchParams.get('tmStep') === persona.stepID
  )
  await expect(page.getByRole('navigation', { name: '测试模式' }))
    .toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('axiia:tm'))).toBe('1')

  const meResponse = await page.request.get('/v1/auth/me')
  expect(meResponse.ok(), 'authenticated browser can read its own account')
    .toBe(true)
  const me = await meResponse.json() as {
    account: { displayName: string; email: string }
  }
  expect(me.account.displayName).toBe(persona.displayName)

  const guide = page.getByRole('dialog', { name: '导测', exact: true })
  await expect(guide).toBeVisible()
  await expect(guide.getByText(persona.stepID, { exact: true })).toBeVisible()
  await expect(guide.getByTestId('tm-current-account')).toContainText(
    persona.displayName,
  )
  await expect(guide.getByTestId('tm-current-account-email')).toHaveText(
    me.account.email,
  )
  const nicknameHint = guide.getByTestId('tm-fixture-account-status')
  await expect(nicknameHint).toHaveAttribute(
    'data-nickname-state',
    'match',
  )
  await expect(nicknameHint).toContainText('只是一条提示，不是账号验证')
  await expect(nicknameHint).toContainText('axiia-cup-product 群账号包')
  await expect(
    guide.getByTestId(`tm-current-profile-${persona.fixtureProfileID}`),
  ).toHaveText('昵称相同')

  return guide
}

async function beginAsFreshTester(
  page: Page,
  context: BrowserContext,
  persona: Persona,
) {
  await assertFreshTester(page, context)
  await page.goto(deepTestModePath(persona))
  return await loginAfterProtectedEntry(page, persona)
}

async function beginFromPublishedManual(
  page: Page,
  context: BrowserContext,
  persona: Persona,
) {
  await assertFreshTester(page, context)
  const manualURL = process.env.AXIIA_HANDOFF_MANUAL_URL?.trim() ||
    defaultManualURL
  expect(() => new URL(manualURL)).not.toThrow()
  await page.goto(`${manualURL}#${persona.stepID}`)
  const productOrigin = new URL(requiredEnvironment('AXIIA_BASE_URL')).origin
  // A preview/local product run exercises the same manual control a tester uses
  // to switch environments; production simply refills the already-prefilled URL.
  await page.locator('#fixture-appBaseUrl').fill(productOrigin)

  const step = page.locator(`[data-step-id="${persona.stepID}"]`)
  await expect(step).toBeVisible()
  const link = step.locator('[data-url-link]').first()
  await expect(link).toHaveText('打开网页 →')
  const href = await link.getAttribute('href')
  expect(href, 'the published manual resolves the product link').not.toBeNull()
  const target = new URL(href!)
  expect(target.origin).toBe(productOrigin)
  expect(target.pathname).toBe(persona.entryPath)
  expect(target.searchParams.get('tm')).toBe('1')
  expect(target.searchParams.get('tmJourney')).toBe(persona.journeyID)
  expect(target.searchParams.get('tmStep')).toBe(persona.stepID)

  const pagesBefore = context.pages().length
  await link.click()
  expect(
    context.pages().length,
    'the manual hands off to the product in the tester current tab',
  ).toBe(pagesBefore)
  return await loginAfterProtectedEntry(page, persona)
}

async function assertOwnsAgent(page: Page, agentID: string) {
  const inventoryResponse = await page.request.get('/v1/my/agents')
  expect(inventoryResponse.ok(), 'real account inventory request succeeds')
    .toBe(true)
  const inventory = await inventoryResponse.json() as {
    scenarios: Array<{
      sides: {
        a: Array<{ agentID: number }>
        b: Array<{ agentID: number }>
      }
    }>
  }
  const owned = inventory.scenarios.flatMap((scenario) => [
    ...scenario.sides.a,
    ...scenario.sides.b,
  ])
  expect(owned.map((agent) => String(agent.agentID))).toContain(agentID)
}

async function assertBoardIdentityBoundary(
  page: Page,
  guide: ReturnType<Page['getByRole']>,
) {
  await guide.getByRole('button', { name: /^看到了/ }).click()
  const identity = page.getByRole('dialog', { name: '先署个名' })
  await expect(identity).toBeVisible()
  await expect(identity.getByLabel('名字')).toHaveValue('')
  await expect(identity).toContainText('名字请填实际执行人的飞书显示名')
  await expect(identity).toContainText('不要填写 fixture 账号昵称')
  const boardPasscode = identity.getByLabel(/看板口令/)
  await expect(boardPasscode).toHaveValue('')
  await expect(boardPasscode).toHaveAttribute('autocomplete', 'off')
  await expect(identity).toContainText('不是产品账号密码')
  // This suite verifies the auth boundary but never writes a human result.
  await identity.getByRole('button', { name: '取消' }).click()
}

test.describe('B3/A5 Test Mode with real handoff accounts', () => {
  test.skip(
    !enabled,
    'set AXIIA_HANDOFF_E2E=1 and inject the four handoff account variables',
  )

  test('B3 handoff plumbing: manual entry, login, guide, role, and same-tab links', async ({ context, page }) => {
    const guide = await beginFromPublishedManual(page, context, b3Owner)
    await assertOwnsAgent(page, b3Owner.agentID)
    await assertBoardIdentityBoundary(page, guide)

    const pagesBefore = context.pages().length
    await guide.getByRole('link', {
      name: '打开网页：我的智能体',
    }).click()
    await expect(page).toHaveURL((url) => url.pathname === '/my-agents')
    expect(
      context.pages().length,
      'guided product links navigate in the tester current tab',
    ).toBe(pagesBefore)
    await expect(guide).toBeVisible()
    await expect(guide.getByText(b3Owner.stepID, { exact: true }))
      .toBeVisible()

    await page.goto(`/agents/${b3Owner.agentID}`)
    await expect(page.getByRole('button', { name: /用 v\d+ 出战/ }).first())
      .toBeVisible()
    await expect(page.getByRole('button', { name: '新建版本' }))
      .toBeVisible()
    await expect(page.getByText('版本对比', { exact: true })).toBeVisible()
    await expect(page.getByText('提示词与版本对比只有主人可见。'))
      .toHaveCount(0)
  })

  test('B3 U10-C11b: standings agent entry opens the exact owner agent', async ({ context, page }) => {
    const guide = await beginAsFreshTester(page, context, b3Owner)
    await assertOwnsAgent(page, b3Owner.agentID)
    await guide.getByRole('button', { name: '关闭导测' }).click()

    const row = page.getByRole('table').getByRole('row').filter({
      hasText: b3Owner.displayName,
    })
    await expect(row).toBeVisible()

    // Keep setup above as ordinary assertions. Only the confirmed-clause probe
    // is an expected failure, so broken login/fixtures cannot masquerade as the
    // known product gap. Once the entry ships, this becomes an unexpected pass.
    test.fail(
      true,
      'U10-C11b current behavior gap: the standings row has no clickable /agents/:id entry',
    )
    const agentEntry = row.locator(`a[href="/agents/${b3Owner.agentID}"]`)
    await expect(agentEntry).toBeVisible()
    await agentEntry.click()
    await expect(page).toHaveURL((url) =>
      url.pathname === `/agents/${b3Owner.agentID}`
    )
  })

  test('A5 owner: deep link restores the correct journey and owner battle UI', async ({ context, page }) => {
    const guide = await beginAsFreshTester(page, context, a5Owner)
    await assertOwnsAgent(page, a5Owner.agentID)
    await assertBoardIdentityBoundary(page, guide)

    await openBattlePanel(page, Number(a5Owner.agentID))
    const opponentPanel = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: /^出战 ·/ }),
    })
    await expect(opponentPanel).toBeVisible()
    await expect(opponentPanel.getByText(/出战版本：/)).toBeVisible()
    await expect(opponentPanel.getByRole('tab', { name: 'NPC 练习' }))
      .toBeVisible()
    await expect(opponentPanel.getByRole('tab', { name: '左右手互搏' }))
      .toBeVisible()
    await expect(opponentPanel.getByRole('tab', { name: '玩家约战' }))
      .toBeVisible()
    await opponentPanel.getByRole('button', { name: '关闭' }).click()
  })
})
