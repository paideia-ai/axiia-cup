import { expect, type Locator, type Page, test } from '@playwright/test'

import {
  config,
  finishedMatch,
  inventory,
  notificationsFixture,
  scenario,
  scenarioList,
  unlockedScenario,
  versions,
} from '../../src/testing/v34-fixtures'

interface FixtureOptions {
  guest?: boolean
  empty?: boolean
  inventoryFailed?: boolean
  multiple?: boolean
  opponents?: boolean
  unlocked?: boolean
  scenarioFailed?: boolean
}

const scenarioPath = `/scenarios/${scenario.summary.id}`

async function fixtures(page: Page, options: FixtureOptions = {}) {
  const ensures: { page: Page; side: string }[] = []
  const unexpected: string[] = []
  const errors: string[] = []
  const observeErrors = (tab: Page) =>
    tab.on('pageerror', (error) => errors.push(error.message))
  observeErrors(page)
  page.context().on('page', observeErrors)
  await page.context().route('**/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.slice(3)
    const json = (body: unknown, status = 200) =>
      route.fulfill({ json: body, status })
    if (path === '/auth/me') {
      return options.guest
        ? json({ error: 'unauthorized', message: '请登录' }, 401)
        : json({
          account: {
            id: 'navigation-test',
            email: 'nav@example.test',
            displayName: '导航测试',
            isAdmin: true,
          },
          elevated: true,
          firstBattleDone: false,
        })
    }
    if (path === '/landing') {
      return json({ demoMatches: [], topPlayers: [], totalMatches: 0 })
    }
    if (path === '/models') return json({ models: config.models })
    if (path === '/config') return json(config)
    if (path === '/scenarios') return json(scenarioList)
    if (path === `/scenarios/${scenario.summary.id}`) {
      return options.scenarioFailed
        ? json({ error: 'unavailable', message: '场景暂不可用' }, 503)
        : json(options.unlocked ? unlockedScenario : scenario)
    }
    if (path.endsWith('/opponents')) {
      return json({
        opponents: options.opponents
          ? [{ agentID: 102, displayName: '我的甘龙', isSelf: true }]
          : [],
      })
    }
    if (path === '/my/agents') {
      if (options.inventoryFailed) return json({ error: 'unavailable' }, 503)
      if (options.empty) return json({ scenarios: [] })
      const data = structuredClone(inventory)
      if (options.multiple) {
        data.scenarios[0].sides.a.push({ agentID: 103, versionCount: 0 })
      }
      return json(data)
    }
    if (path === '/agents/ensure') {
      const { side } = request.postDataJSON()
      ensures.push({ page: request.frame().page(), side })
      return json({ agentID: side === 'b' ? 102 : 101 })
    }
    if (/^\/agents\/\d+\/draft$/.test(path)) {
      return json({
        fields: {},
        scenarioID: scenario.summary.id,
        side: path.includes('/102/') ? 'b' : 'a',
      })
    }
    if (/^\/agents\/\d+\/versions$/.test(path)) {
      return json({ versions, entryVersionID: 1002 })
    }
    if (path === '/matches') return json({ matches: [finishedMatch.summary] })
    if (path === '/matches/9001') return json(finishedMatch)
    if (path === '/notifications') return json(notificationsFixture)
    if (/^\/notifications\/\d+\/read$/.test(path)) return json({ ok: true })
    if (
      path === '/notifications/bell' || /^\/agents\/\d+\/stream$/.test(path)
    ) {
      return route.fulfill({
        contentType: 'text/event-stream',
        body: 'retry: 60000\ndata: {"unreadCount":1}\n\n',
      })
    }
    if (path === '/tournaments') {
      return json({ tournaments: [{ id: 1, phase: 'qualifier', round: 1 }] })
    }
    if (path === '/tournaments/1/standings') return json({ entries: [] })
    unexpected.push(`${request.method()} ${path}`)
    return json({ error: 'unexpected_fixture_request', message: path }, 500)
  })
  return { ensures, unexpected, errors }
}

async function openPanel(page: Page, tab: 'pvp' | 'hotseat') {
  await page.getByRole('button', { name: '用 v2 出战' }).click()
  await page.getByRole('tab', {
    name: tab === 'pvp' ? /玩家约战/ : /左右手互搏/,
  }).click()
}

async function showJourney(page: Page) {
  await page.evaluate(() => {
    history.replaceState({ ...history.state, usr: { express: true } }, '')
  })
  await page.reload()
}

const cases: {
  name: string
  path: string
  marker: string
  destination: RegExp
  options?: FixtureOptions
  prepare?: (page: Page) => Promise<void>
}[] = [
  {
    name: 'landing registration',
    path: '/',
    marker: 'A.cta-register',
    destination: /\/register$/,
    options: { guest: true },
  },
  {
    name: 'header registration',
    path: '/',
    marker: 'A.header-register-button',
    destination: /\/register$/,
    options: { guest: true },
  },
  {
    name: 'landing login',
    path: '/',
    marker: 'A.cta-login',
    destination: /\/login$/,
    options: { guest: true },
  },
  {
    name: 'landing enter',
    path: '/',
    marker: 'A.cta-enter',
    destination: /\/scenarios$/,
  },
  {
    name: 'header enter',
    path: '/',
    marker: 'A.header-enter-button',
    destination: /\/scenarios$/,
  },
  {
    name: 'new version',
    path: '/agents/101',
    marker: 'EA.edit-button',
    destination: /\/agents\/101\/build$/,
  },
  {
    name: 'scenario build',
    path: scenarioPath,
    marker: 'DA.build-button',
    destination: /\/agents\/101\/build\?scenario=shangyang-court&side=a$/,
    options: { empty: true },
  },
  {
    name: 'scenario create another',
    path: scenarioPath,
    marker: 'DA.build-more-button',
    destination: /\/my-agents$/,
  },
  {
    name: 'scenario single agent',
    path: scenarioPath,
    marker: 'DA.view-mine-button',
    destination: /\/agents\/101$/,
  },
  {
    name: 'scenario multiple agents',
    path: scenarioPath,
    marker: 'DA.view-mine-button',
    destination: /\/my-agents\?scenario=shangyang-court&side=a$/,
    options: { multiple: true },
  },
  {
    name: 'express build',
    path: '/express',
    marker: 'X.build-button',
    destination:
      /\/agents\/101\/build\?scenario=shangyang-court&side=a&express=1$/,
  },
  {
    name: 'express error escape',
    path: '/express',
    marker: 'X.error-browse-button',
    destination: /\/scenarios$/,
    options: { scenarioFailed: true },
  },
  {
    name: 'battle panel inventory',
    path: '/agents/101',
    marker: 'OS.hotseat-go-my-agents',
    destination: /\/my-agents$/,
    prepare: (page) => openPanel(page, 'hotseat'),
  },
  {
    name: 'battle panel practice opposite',
    path: '/agents/101',
    marker: 'OS.gate-practice-opposite',
    destination: /\/my-agents$/,
    options: { opponents: true },
    prepare: (page) => openPanel(page, 'pvp'),
  },
  {
    name: 'battle panel create opposite',
    path: '/agents/101',
    marker: 'OS.gate-create-opposite',
    destination: /\/agents\/102$/,
    prepare: (page) => openPanel(page, 'pvp'),
  },
  {
    name: 'battle panel missing side',
    path: '/agents/101',
    marker: 'OS.create-side-button',
    destination: /\/agents\/101$/,
    options: { empty: true, unlocked: true },
    prepare: (page) => openPanel(page, 'pvp'),
  },
  {
    name: 'first battle rematch',
    path: '/matches/9001',
    marker: 'FA.journey-rematch-button',
    destination: /\/agents\/101$/,
    prepare: showJourney,
  },
  {
    name: 'first battle opposite',
    path: '/matches/9001',
    marker: 'FA.journey-opposite-button',
    destination: /\/agents\/102$/,
    prepare: showJourney,
  },
  {
    name: 'first battle progress',
    path: '/matches/9001',
    marker: 'FA.journey-progress-button',
    destination: /\/agents\/101$/,
    prepare: showJourney,
  },
  {
    name: 'match history card',
    path: '/matches',
    marker: 'L.match-card',
    destination: /\/matches\/9001$/,
  },
  {
    name: 'notification details',
    path: '/notifications',
    marker: 'I.detail-link',
    destination: /\/matches\/9001$/,
  },
  {
    name: 'tournament card',
    path: '/tournaments',
    marker: 'G.tournament-card',
    destination: /\/tournaments\/1$/,
  },
]

async function checkNewTab(
  page: Page,
  link: Locator,
  destination: RegExp,
  ctrl: boolean,
) {
  const original = page.url()
  const popupPromise = page.context().waitForEvent('page')
  await link.click(
    ctrl ? { modifiers: ['ControlOrMeta'] } : { button: 'middle' },
  )
  const popup = await popupPromise
  await expect(popup).toHaveURL(destination)
  await expect(popup.getByRole('heading').first()).toBeVisible()
  await expect(page).toHaveURL(original)
  await expect(link).toBeVisible()
  await popup.close()
}

for (const entry of cases) {
  test(`${entry.name}: native link, middle-click, Ctrl/Cmd-click, normal click`, async ({ page }) => {
    const { ensures, unexpected, errors } = await fixtures(page, entry.options)
    await page.goto(entry.path)
    await entry.prepare?.(page)
    const link = page.locator(`[data-tm="${entry.marker}"]`).first()
    await expect(link).toHaveAttribute('href', /^\//)
    expect(await link.evaluate((el) => el.tagName)).toBe('A')
    await expect(link.locator('button, a, input')).toHaveCount(0)
    await link.hover()
    await link.click({ button: 'right' })
    expect(ensures).toHaveLength(0)

    await checkNewTab(page, link, entry.destination, false)
    await checkNewTab(page, link, entry.destination, true)
    expect(ensures.every((request) => request.page !== page)).toBe(true)
    await link.click()
    await expect(page).toHaveURL(entry.destination)
    expect(unexpected).toEqual([])
    expect(errors).toEqual([])
  })
}

test('inventory fallback opens or creates in the destination tab', async ({ page }) => {
  const { ensures } = await fixtures(page, { inventoryFailed: true })
  await page.goto('/my-agents')
  const link = page.getByRole('link', { name: '打开或创建商鞅智能体' })
  await checkNewTab(page, link, /\/agents\/101$/, false)
  expect(ensures).toHaveLength(1)
  expect(ensures[0].page).not.toBe(page)
})

test('Shift-click opens a separate page; Meta-click is not intercepted', async ({ page }) => {
  await fixtures(page)
  await page.goto('/agents/101')
  const link = page.getByRole('link', { name: '新建版本' })
  await expect(link).toBeVisible()
  const intercepted = await link.evaluate((element) => {
    let prevented = true
    window.addEventListener('click', (event) => {
      prevented = event.defaultPrevented
      event.preventDefault()
    }, { once: true })
    element.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        metaKey: true,
      }),
    )
    return prevented
  })
  expect(intercepted).toBe(false)
  const popupPromise = page.context().waitForEvent('page')
  await link.click({ modifiers: ['Shift'] })
  const popup = await popupPromise
  await expect(popup).toHaveURL(/\/agents\/101\/build$/)
  await expect(page).toHaveURL(/\/agents\/101$/)
  await popup.close()
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/agents\/101\/build$/)
})

test('entry errors can retry, and back does not repeat get-or-create', async ({ page }) => {
  const { ensures } = await fixtures(page, { empty: true })
  let attempts = 0
  await page.context().route('**/v1/agents/ensure', async (route) => {
    attempts++
    if (attempts === 1) {
      return route.fulfill({
        status: 503,
        json: { error: 'unavailable', message: '请稍后重试' },
      })
    }
    await route.fallback()
  })
  await page.goto(scenarioPath)
  await page.getByTestId('build-agent').click()
  await expect(page.getByRole('alert')).toHaveText('请稍后重试')
  expect(attempts).toBe(1)
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page).toHaveURL(/\/agents\/101\/build\?/)
  expect(attempts).toBe(2)
  expect(ensures).toHaveLength(1)
  await page.goBack()
  await expect(page).toHaveURL(scenarioPath)
  expect(attempts).toBe(2)
})

test('leaving a pending entry cannot redirect the current page', async ({ page }) => {
  await fixtures(page, { empty: true })
  let release!: () => void
  const gate = new Promise<void>((resolve) => release = resolve)
  await page.context().route('**/v1/agents/ensure', async (route) => {
    await gate
    await route.fulfill({ json: { agentID: 101 } })
  })
  await page.goto(scenarioPath)
  await page.getByTestId('build-agent').click()
  await expect(page.getByRole('status')).toHaveText('正在打开智能体…')
  await page.goBack()
  await expect(page).toHaveURL(scenarioPath)
  release()
  await expect(page.getByTestId('build-agent')).toBeVisible()
  await expect(page).toHaveURL(scenarioPath)
})

test('dialogs and disclosure controls remain buttons on the current page', async ({ page }) => {
  const { ensures } = await fixtures(page)
  await page.goto('/agents/101')
  await page.getByRole('button', { name: '新建商鞅智能体' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(/\/agents\/101$/)
  expect(ensures).toHaveLength(0)
})

test('a signed-out entry keeps its complete destination through login', async ({ page }) => {
  const { ensures } = await fixtures(page, { guest: true })
  const destination =
    '/agents/entry?scenario=shangyang-court&side=b&target=build&express=1'
  await page.goto(destination)
  await expect(page).toHaveURL(/\/login\?next=/)
  expect(new URL(page.url()).searchParams.get('next')).toBe(destination)
  expect(ensures).toHaveLength(0)
})

test('invalid entry parameters never call get-or-create', async ({ page }) => {
  const { ensures } = await fixtures(page)
  for (
    const query of [
      'side=a',
      'scenario=shangyang-court&side=c',
      'scenario=shangyang-court&side=a&target=unknown',
    ]
  ) {
    await page.goto(`/agents/entry?${query}`)
    await expect(page).toHaveURL(/\/scenarios$/)
  }
  expect(ensures).toHaveLength(0)
})
