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

import {
  agentPreviewInventory,
  agentPreviewScenarios,
  previewAgent,
} from '../../src/testing/scenario-agent-fixtures'
import type { MyAgentDTO } from '../../src/api/types'
import { deckFor } from '../../src/scenarios/decks'

interface FixtureOptions {
  sideAAgents?: MyAgentDTO[]
  oppositeAgents?: MyAgentDTO[]
  guest?: boolean
  empty?: boolean
  inventoryFailed?: boolean
  multiple?: boolean
  noEntry?: boolean
  opponents?: boolean
  unlocked?: boolean
  scenarioFailed?: boolean
}

const scenarioPath = `/scenarios/${scenario.summary.id}`

async function fixtures(page: Page, options: FixtureOptions = {}) {
  const ensures: { page: Page; side: string }[] = []
  const usedPresets = new Set<string>()
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
    if (path === '/achievements' && request.method() === 'GET') {
      return json({ achievements: [], eventCursor: 0 })
    }
    if (path === '/achievements/events' && request.method() === 'GET') {
      return json({ events: [], cursor: 0 })
    }
    if (path === '/account/preset-usage') {
      if (request.method() === 'POST') {
        usedPresets.add(
          (request.postDataJSON() as { scenarioID: string }).scenarioID,
        )
      }
      return json({ scenarioIDs: [...usedPresets] })
    }
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
    if (path === '/rewards') {
      return json({
        balance: 1000,
        dailyAllowance: 1000,
        battleCost: 100,
        dailyRuns: 10,
        pveWinRefundPercent: 50,
        pvpWinRefundPercent: 80,
        pointsPerYuan: 100,
        nextGrantAt: 0,
        claimableRewards: [{ matchID: 9001, points: 50, kind: 'pve' }],
      })
    }
    if (path === '/rewards/quote') {
      return json({
        cost: 100,
        perBattleCost: 100,
        repeatRoleSurcharge: false,
        battleCosts: [100],
      })
    }
    if (path === '/rewards/matches/9001') {
      return json({
        matchID: 9001,
        points: 50,
        status: 'claimable',
        kind: 'pve',
      })
    }
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
    if (path === '/my/archived-agents') return json({ agents: [] })
    if (path === '/my/agents') {
      if (options.inventoryFailed) return json({ error: 'unavailable' }, 503)
      if (options.empty) return json({ scenarios: [] })
      const data = structuredClone(inventory)
      if (options.multiple) {
        data.scenarios[0].sides.a.unshift({ agentID: 103, versionCount: 0 })
      }
      if (options.sideAAgents) data.scenarios[0].sides.a = options.sideAAgents
      if (options.oppositeAgents) {
        data.scenarios[0].sides.b = options.oppositeAgents
      }
      if (options.noEntry) {
        data.scenarios[0].sides.a.forEach((agent) =>
          agent.entryVersionID = null
        )
      }
      return json(data)
    }
    if (path === '/agents/ensure') {
      const { side } = request.postDataJSON()
      ensures.push({ page: request.frame().page(), side })
      return json({ agentID: side === 'b' ? 102 : 101 })
    }
    if (path === '/agents/202/draft') {
      return json({ error: 'forbidden', message: '不是你的智能体' }, 403)
    }
    if (path === '/agents/202/public') {
      return json({
        agentID: 202,
        scenarioID: scenario.summary.id,
        scenarioTitle: scenario.summary.title,
        side: 'b',
        sideName: '甘龙',
        name: '公开导航测试',
        ownerName: '另一位玩家',
        versions: [{
          id: 466,
          ordinal: 1,
          isEntry: true,
          createdAt: 1,
          modelID: config.models[0].id,
          matchCount: 2,
          winCount: 1,
          drawCount: 0,
          lossCount: 1,
        }],
      })
    }
    if (path === `/scenarios/${scenario.summary.id}/npcs/ganlong-steady`) {
      return json({
        scenarioID: scenario.summary.id,
        scenarioTitle: scenario.summary.title,
        key: 'ganlong-steady',
        side: 'b',
        sideName: '甘龙',
        label: '稳健守旧派',
        modelID: config.models[0].id,
        prompt: '先询问新制度的实施代价。',
        sourceMatchID: 9001,
        versionTag: 'fixture',
        matchCount: 2,
        winCount: 1,
        drawCount: 0,
        lossCount: 1,
        challengeCount: 2,
      })
    }
    if (path === '/admin/slots') {
      return json({
        slots: [{
          id: scenario.summary.id,
          title: scenario.summary.title,
          scriptSHA: 'navigation-fixture',
          params: {},
          status: 'live',
        }],
      })
    }
    if (path === '/admin/scripts/navigation-fixture') {
      return json({
        sha: 'navigation-fixture',
        source: '// Navigation fixture',
        createdAt: 1,
      })
    }
    if (path === '/matches/9998' || path === '/versions/9998/ref') {
      return json({ error: 'not_found', message: '未找到' }, 404)
    }
    if (/^\/agents\/\d+\/draft$/.test(path)) {
      return json({
        fields: {},
        scenarioID: scenario.summary.id,
        side: path.includes('/102/') || options.oppositeAgents?.some((agent) =>
            path.includes(`/${agent.agentID}/`)
          )
          ? 'b'
          : 'a',
      })
    }
    if (/^\/agents\/\d+\/matches$/.test(path) && request.method() === 'GET') {
      return json({ matches: [], open: false })
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
    if (path === '/tournaments/1/standings') {
      return json({
        entries: [{
          playerID: 'navigation-test',
          playerName: '导航测试',
          rank: 1,
          wins: 1,
          losses: 0,
          buchholz: 0,
          winRate: 100,
          submissionIDs: [1002],
        }],
      })
    }
    if (path === '/versions/1002/ref') {
      return json({ versionID: 1002, agentID: 101 })
    }
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

for (const event of ['visibilitychange', 'online'] as const) {
  test(`preset usage refreshes across builder tabs on ${event}`, async ({ page, context }) => {
    const { unexpected, errors } = await fixtures(page)
    await context.route(
      '**/v1/agents/101/mutate',
      (route) => route.fulfill({ json: { ok: true } }),
    )
    await page.goto('/agents/101/build')
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    const other = await context.newPage()
    await other.goto('/agents/101/build')
    await other.getByRole('button', { name: '选择预设策略' }).click()
    const dialog = other.getByRole('dialog', { name: '选择预设策略' })
    const deck = deckFor(scenario.summary.id, 'a')!
    for (const question of deck.questions) {
      await dialog.getByRole('button', {
        name: question.options[0].label,
        exact: true,
      }).click()
    }
    await expect(other.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()

    // Keep both builders mounted; expire the 10s cache without reloading.
    await page.clock.setFixedTime(new Date(Date.now() + 11_000))
    if (event === 'online') {
      await page.evaluate(() => globalThis.dispatchEvent(new Event('offline')))
      await page.evaluate(() => globalThis.dispatchEvent(new Event('online')))
    } else {
      await page.bringToFront()
      await page.evaluate(() =>
        globalThis.dispatchEvent(new Event('visibilitychange'))
      )
    }
    await expect(page.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toHaveCount(0)
    expect(unexpected).toEqual([])
    expect(errors).toEqual([])
  })
}

for (const width of [1440, 390]) {
  test(`history whole row and independent agent links at ${width}px`, async ({ page }) => {
    const { unexpected, errors } = await fixtures(page)
    await page.setViewportSize({ width, height: 900 })
    await page.context().route('**/v1/matches', (route) =>
      route.fulfill({
        json: {
          matches: [
            finishedMatch.summary,
            { ...finishedMatch.summary, id: 9002, participants: undefined },
            {
              ...finishedMatch.summary,
              id: 9003,
              participants: {
                a: { agentID: 101, isMine: true },
                b: { agentID: 102, isMine: true },
              },
            },
          ],
        },
      }))
    await page.goto('/matches')
    const cards = page.locator('.history-card')
    await expect(cards).toHaveCount(3)
    await expect(page.locator('a a')).toHaveCount(0)
    // Real browser hit testing catches dead padding and overlays blocking an
    // agent link; dispatching synthetic clicks directly on links misses both.
    for (const card of await cards.all()) {
      const hits = await card.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return [
          [rect.left + 4, rect.top + 4],
          [rect.right - 4, rect.bottom - 4],
          [rect.left + rect.width / 2, rect.bottom - 4],
        ].map(([x, y]) =>
          element.ownerDocument.elementFromPoint(x, y)?.closest('a')
            ?.getAttribute('href')
        )
      })
      const destination = await card.locator('[data-tm="L.match-card"]')
        .getAttribute('href')
      expect(hits).toEqual([destination, destination, destination])
    }
    for (const link of await page.locator('[data-tm="L.owned-agent"]').all()) {
      await expect(link).toBeVisible()
      expect(
        await link.evaluate((element) => {
          const rect = element.getBoundingClientRect()
          return element.ownerDocument.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          )?.closest('a') === element
        }),
      ).toBe(true)
    }
    const card = cards.first()
    const rect = (await card.boundingBox())!
    await page.mouse.click(rect.x + rect.width - 4, rect.y + rect.height - 4)
    await expect(page).toHaveURL(/\/matches\/9001$/)
    await page.goBack()
    const agent = card.locator('[data-tm="L.owned-agent"]')
    await agent.click()
    await expect(page).toHaveURL(/\/agents\/101$/)
    await page.goBack()
    const popupPromise = page.context().waitForEvent('page')
    await agent.click({ modifiers: ['ControlOrMeta'] })
    const popup = await popupPromise
    await expect(popup).toHaveURL(/\/agents\/101$/)
    await expect(page).toHaveURL(/\/matches$/)
    await popup.close()
    await page.bringToFront()
    await card.locator('[data-tm="L.match-card"]').focus()
    await page.keyboard.press('Tab')
    await expect(agent).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/agents\/101$/)
    expect(unexpected).toEqual([])
    expect(errors).toEqual([])
  })
}

// Each of the nine former page-return placements is checked on a real touch
// viewport and desktop, including pages opened directly without app history.
const pagesWithoutBackLinks = [
  { path: '/agents/101', ready: '[data-tm="EA.scenario-link"]' },
  { path: '/agents/101/build', ready: '[data-tm="E.prompt-input"]' },
  { path: '/agents/202/identity', ready: '[data-tm="EA.public-title"]' },
  {
    path: `${scenarioPath}/npcs/ganlong-steady?match=9001`,
    ready: '[data-testid="npc-identity"] h1',
  },
  { path: '/settings/archived-agents', ready: 'h2' },
  { path: '/versions/9998?tournament=1', ready: '[role="alert"]' },
  {
    path: `/admin/slots/${scenario.summary.id}`,
    ready: '[data-tm="ADM.slot-editor"]',
  },
  { path: '/matches/9001', ready: '[data-tm="FA.page-title"]' },
  { path: '/matches/9998', ready: '[data-tm="FA.not-found"]' },
]

for (const mobile of [false, true]) {
  test.describe(
    mobile ? 'mobile return navigation' : 'desktop return navigation',
    () => {
      test.use({
        viewport: { width: mobile ? 390 : 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
      })

      test('all former back-link surfaces support direct entry without return arrows', async ({ page }) => {
        const { unexpected, errors } = await fixtures(page)
        for (const surface of pagesWithoutBackLinks) {
          await test.step(surface.path, async () => {
            await page.goto(surface.path)
            await expect(page.locator(surface.ready).first()).toBeVisible()
            await expect(page.getByRole('link', { name: /^←/ })).toHaveCount(0)
            await expect(page.getByRole('button', { name: /^←/ })).toHaveCount(
              0,
            )
            await expect(page.locator('[data-tm$="back-link"]')).toHaveCount(0)
            await expect(
              page.getByRole('link', { name: '我的智能体', exact: true })
                .first(),
            )
              .toBeVisible()
            expect(
              await page.evaluate(() =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth
              ),
            ).toBeLessThanOrEqual(1)
          })
        }
        expect(unexpected).toEqual([])
        expect(errors).toEqual([])
      })

      test('browser Back immediately after typing preserves the builder draft', async ({ page, context }) => {
        const { unexpected, errors } = await fixtures(page)
        let savedPrompt = ''
        let mutations = 0
        await context.route('**/v1/agents/101/draft', (route) =>
          route.fulfill({
            json: {
              fields: { prompt: savedPrompt },
              scenarioID: scenario.summary.id,
              side: 'a',
            },
          }))
        await context.route('**/v1/agents/101/mutate', async (route) => {
          const { field, value } = route.request().postDataJSON() as {
            field: string
            value: string
          }
          if (field === 'prompt') {
            mutations++
            savedPrompt = value
          }
          await route.fulfill({ json: { ok: true } })
        })
        await page.goto('/agents/101')
        await page.getByRole('link', { name: '新建版本', exact: true }).click()
        const prompt = '浏览器后退前刚输入的草稿，重新进入仍应完整保留。'
        await page.getByLabel('策略提示词').fill(prompt)
        // Do not wait for the debounce or a network response before leaving.
        await page.goBack()
        await expect(page).toHaveURL(/\/agents\/101$/)
        await page.getByRole('link', { name: '新建版本', exact: true }).click()
        await expect(page.getByLabel('策略提示词')).toHaveValue(prompt)
        await expect.poll(() => savedPrompt).toBe(prompt)
        expect(mutations).toBeGreaterThan(0)
        await page.reload()
        await expect(page.getByLabel('策略提示词')).toHaveValue(prompt)
        expect(unexpected).toEqual([])
        expect(errors).toEqual([])
      })

      test('scenario title and browser back/forward preserve the agent and builder route', async ({ page }) => {
        const { unexpected, errors } = await fixtures(page)
        await page.goto('/my-agents')
        const inventoryScenario = page.locator('[data-tm="MA.scenario-link"]')
          .first()
        await expect(inventoryScenario).toHaveAttribute('href', scenarioPath)
        await page.locator('a[data-agent-id="101"]').click()
        await expect(page).toHaveURL(/\/agents\/101$/)
        const scenarioLink = page.locator('[data-tm="EA.scenario-link"]')
        await expect(scenarioLink).toHaveText(scenario.summary.title)
        await expect(scenarioLink).toHaveAttribute('href', scenarioPath)
        if (mobile) {
          await scenarioLink.tap()
        } else {
          await scenarioLink.focus()
          await expect(scenarioLink).toBeFocused()
          await page.keyboard.press('Enter')
        }
        await expect(page).toHaveURL(new RegExp(`${scenarioPath}$`))
        await expect(
          page.getByRole('heading', {
            name: '商鞅变法 · 朝堂辩法',
            exact: true,
          }),
        ).toBeVisible()
        await page.goBack()
        await expect(page).toHaveURL(/\/agents\/101$/)
        await expect(scenarioLink).toBeVisible()
        await page.goForward()
        await expect(page).toHaveURL(new RegExp(`${scenarioPath}$`))
        await page.goBack()
        await page.getByRole('link', { name: '新建版本', exact: true }).click()
        await expect(page).toHaveURL(/\/agents\/101\/build$/)
        await expect(page.getByLabel('策略提示词')).toBeEnabled()
        await page.goBack()
        await expect(page).toHaveURL(/\/agents\/101$/)
        await expect(scenarioLink).toBeVisible()
        await page.goForward()
        await expect(page).toHaveURL(/\/agents\/101\/build$/)
        await expect(page.getByLabel('策略提示词')).toBeEnabled()
        await expect(page.getByRole('link', { name: /^←/ })).toHaveCount(0)
        expect(unexpected).toEqual([])
        expect(errors).toEqual([])
      })
    },
  )
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
  marker?: string
  selector?: string
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
    name: 'agent home scenario title',
    path: '/agents/101',
    marker: 'EA.scenario-link',
    destination: /\/scenarios\/shangyang-court$/,
  },
  {
    name: 'inventory scenario title',
    path: '/my-agents',
    marker: 'MA.scenario-link',
    destination: /\/scenarios\/shangyang-court$/,
  },
  {
    name: 'new version',
    path: '/agents/101',
    marker: 'EA.edit-button',
    destination: /\/agents\/101\/build$/,
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
    destination: /\/agents\/101$/,
    options: { multiple: true },
  },
  {
    name: 'scenario multiple agents without entry',
    path: scenarioPath,
    marker: 'DA.view-mine-button',
    destination: /\/agents\/103$/,
    options: { multiple: true, noEntry: true },
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
    name: 'battle panel hotseat open opposite',
    path: '/agents/101',
    marker: 'OS.hotseat-open-opposite',
    destination: /\/agents\/102$/,
    prepare: (page) => openPanel(page, 'hotseat'),
  },
  {
    name: 'battle panel hotseat create opposite',
    path: '/agents/101',
    marker: 'OS.hotseat-create-opposite',
    destination: /\/agents\/102$/,
    options: { oppositeAgents: [] },
    prepare: (page) => openPanel(page, 'hotseat'),
  },
  {
    name: 'battle panel practice opposite',
    path: '/agents/101',
    marker: 'OS.gate-practice-opposite',
    destination: /\/agents\/102$/,
    options: { opponents: true },
    prepare: (page) => openPanel(page, 'pvp'),
  },
  {
    name: 'battle panel create opposite',
    path: '/agents/101',
    marker: 'OS.gate-create-opposite',
    destination: /\/agents\/102$/,
    options: { oppositeAgents: [] },
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
    name: 'continue accepted first battle',
    path: '/agents/101/build?scenario=shangyang-court&side=a&express=1',
    selector: 'a[href="/matches/9001?express=1"]',
    destination: /\/matches\/9001\?express=1$/,
    prepare: async (page) => {
      await page.evaluate(() =>
        sessionStorage.setItem(
          'axiia:first-battle-attempt:v1:navigation-test:101',
          JSON.stringify({
            versionID: 1002,
            presetKey: 'test',
            status: 'accepted',
            matchID: 9001,
          }),
        )
      )
      await page.reload()
      await page.getByRole('button', { name: '关闭弹窗' }).click()
    },
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
  {
    name: 'tournament submitted version',
    path: '/tournaments/1',
    selector: 'a[href="/versions/1002?tournament=1"]:visible',
    destination: /\/agents\/101\?version=1002$/,
  },
  {
    name: 'header rewards',
    path: '/my-agents',
    selector: 'a[href="/rewards"]',
    destination: /\/rewards$/,
  },
  {
    name: 'reward match details',
    path: '/rewards',
    selector: 'a[href="/matches/9001"]',
    destination: /\/matches\/9001$/,
  },
]

async function checkNewTab(
  page: Page,
  link: Locator,
  destination: RegExp,
  ctrl: boolean,
) {
  const original = page.url()
  // A background-tab close does not consistently restore focus in headless
  // Chromium. Model the user returning to the source before the next gesture.
  await page.bringToFront()
  const popupPromise = page.context().waitForEvent('page')
  await link.click(
    ctrl ? { modifiers: ['ControlOrMeta'] } : { button: 'middle' },
  )
  const popup = await popupPromise
  await popup.bringToFront()
  await expect(popup).toHaveURL(destination)
  await expect(popup.getByRole('heading').first()).toBeVisible()
  if (
    new URL(popup.url()).searchParams.get('express') === '1' &&
    new URL(popup.url()).pathname.startsWith('/matches/')
  ) {
    await expect(popup.locator('[data-tm="FA.journey-rematch-button"]'))
      .toBeVisible()
  }
  await expect(page).toHaveURL(original)
  await expect(link).toBeVisible()
  await popup.close()
  await page.bringToFront()
}

for (const entry of cases) {
  test(`${entry.name}: native link, middle-click, Ctrl/Cmd-click, normal click`, async ({ page }) => {
    const { ensures, unexpected, errors } = await fixtures(page, entry.options)
    await page.goto(entry.path)
    await entry.prepare?.(page)
    const link = page.locator(entry.selector ?? `[data-tm="${entry.marker}"]`)
      .first()
    await expect(link).toHaveAttribute('href', /^\//)
    expect(await link.evaluate((el) => el.tagName)).toBe('A')
    await expect(link.locator('button, a, input')).toHaveCount(0)
    await link.hover()
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

test('right-click preserves the source and does not resolve an agent', async ({ page }) => {
  const { ensures } = await fixtures(page)
  await page.goto('/express')
  const link = page.locator('[data-tm="X.build-button"]')
  await expect(link).toHaveAttribute('href', /^\/agents\/entry\?/)
  await link.click({ button: 'right' })
  await expect(page).toHaveURL(/\/express$/)
  expect(ensures).toHaveLength(0)
  // End this gesture independently: sending Escape in a headless browser can
  // dismiss the application's dialog rather than a native context menu.
})

test('inventory fallback directly creates an agent', async ({ page }) => {
  await fixtures(page, { inventoryFailed: true })
  await page.context().route(
    '**/v1/agents',
    (route) => route.fulfill({ json: { agentID: 101 } }),
  )
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建商鞅智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/101$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
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
  await page.bringToFront()
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
  await page.goto('/express')
  await page.locator('[data-tm="X.build-button"]').click()
  await expect(page.getByRole('alert')).toHaveText('请稍后重试')
  expect(attempts).toBe(1)
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page).toHaveURL(/\/agents\/101\?express=1$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  await expect(page.getByRole('link', { name: '新建版本' })).toHaveAttribute(
    'href',
    '/agents/101/build?scenario=shangyang-court&side=a&express=1',
  )
  expect(attempts).toBe(2)
  expect(ensures).toHaveLength(1)
  await page.goBack()
  await expect(page).toHaveURL(/\/express$/)
  expect(attempts).toBe(2)
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

for (const detail of agentPreviewScenarios) {
  for (const side of ['a', 'b'] as const) {
    test(`${detail.summary.id} ${side}: direct home, scoped siblings, refresh and full inventory`, async ({ page }) => {
      const { ensures, unexpected, errors } = await fixtures(page)
      await page.context().route('**/v1/**', async (route) => {
        const path = new URL(route.request().url()).pathname.slice(3)
        if (path === '/my/agents') {
          return route.fulfill({ json: agentPreviewInventory })
        }
        if (path === '/scenarios') {
          return route.fulfill({
            json: {
              scenarios: agentPreviewScenarios.map((item) => item.summary),
            },
          })
        }
        const scenario = agentPreviewScenarios.find((item) =>
          path === `/scenarios/${item.summary.id}`
        )
        if (scenario) return route.fulfill({ json: scenario })
        const match = /^\/agents\/(\d+)\/(draft|versions)$/.exec(path)
        const agent = match ? previewAgent(Number(match[1])) : null
        if (agent && match) {
          return route.fulfill({
            json: match[2] === 'draft'
              ? { fields: {}, scenarioID: agent.scenarioID, side: agent.side }
              : {
                versions: agent.versions,
                entryVersionID: agent.agent.entryVersionID,
              },
          })
        }
        return route.fallback()
      })
      const inventory = agentPreviewInventory.scenarios.find((item) =>
        item.scenarioID === detail.summary.id
      )!
      const agents = inventory.sides[side]
      const selected = agents[side === 'a' ? 1 : 0]
      if (side === 'b') await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/scenarios/${detail.summary.id}`)
      const link = page.locator('[data-tm="DA.view-mine-button"]').nth(
        side === 'a' ? 0 : 1,
      )
      await expect(link).toHaveAttribute('href', `/agents/${selected.agentID}`)
      await expect(link).toContainText(`（${agents.length}）`)
      await link.click()
      await expect(page).toHaveURL(new RegExp(`/agents/${selected.agentID}$`))
      const siblings = page.getByRole('navigation', { name: '同角色智能体' })
        .getByRole('link')
      await expect(siblings).toHaveCount(agents.length)
      expect(
        await siblings.evaluateAll((links) =>
          links.map((link) => link.getAttribute('href'))
        ),
      )
        .toEqual(agents.map((agent) => `/agents/${agent.agentID}`))
      await page.reload()
      await expect(siblings).toHaveCount(agents.length)
      const other = agents[side === 'a' ? 0 : 1]
      await page.locator(
        `[data-tm="EA.sibling-pill"][href="/agents/${other.agentID}"]`,
      ).click()
      await expect(page).toHaveURL(new RegExp(`/agents/${other.agentID}$`))
      await expect(
        page.locator(
          `[data-tm="EA.sibling-pill"][href="/agents/${other.agentID}"]`,
        ),
      ).toHaveAttribute('aria-current', 'page')
      await page.goBack()
      await expect(page).toHaveURL(new RegExp(`/agents/${selected.agentID}$`))
      await page.goBack()
      await expect(page).toHaveURL(
        new RegExp(`/scenarios/${detail.summary.id}$`),
      )
      // Browser history follows the actual source; main navigation still
      // opens the complete inventory regardless of the current scenario.
      await page.getByRole('link', { name: '我的智能体', exact: true }).click()
      await expect(page).toHaveURL(/\/my-agents$/)
      await expect(page.locator('[data-tm="MA.scenario-group"]')).toHaveCount(5)
      expect(ensures).toHaveLength(0)
      expect(unexpected).toEqual([])
      expect(errors).toEqual([])
    })
  }
}

for (const mobile of [false, true]) {
  for (
    const choice of ['single', 'draft', 'entry', 'recent', 'missing'] as const
  ) {
    test(`opposite practice ${choice} on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      const oppositeAgents: MyAgentDTO[] = choice === 'missing' ? [] : [
        {
          agentID: 102,
          versionCount: choice === 'draft' ? 0 : 2,
          lastEditedAt: 100,
        },
        ...(choice === 'single' || choice === 'draft' ? [] : [
          { agentID: 103, versionCount: 2, lastEditedAt: 300 },
          {
            agentID: 104,
            versionCount: 2,
            lastEditedAt: 200,
            entryVersionID: choice === 'entry' ? 1002 : null,
          },
          {
            agentID: 105,
            versionCount: 2,
            lastEditedAt: 400,
            entryVersionID: 1002,
            isArchived: true,
          },
        ]),
      ]
      const { ensures, errors, unexpected } = await fixtures(page, {
        opponents: choice !== 'missing' && choice !== 'draft',
        oppositeAgents,
      })
      await page.goto('/agents/101')
      await openPanel(page, 'pvp')
      const marker = choice === 'missing'
        ? 'OS.gate-create-opposite'
        : 'OS.gate-practice-opposite'
      await page.locator(`[data-tm="${marker}"]`).click()
      const selected = choice === 'entry'
        ? 104
        : choice === 'recent'
        ? 103
        : 102
      await expect(page).toHaveURL(new RegExp(`/agents/${selected}$`))
      if (choice === 'missing') {
        await expect(page.getByRole('textbox', { name: '智能体名称' }))
          .toBeFocused()
        expect(ensures.map((request) => request.side)).toEqual(['b'])
      } else {
        await expect(page.getByRole('textbox', { name: '智能体名称' }))
          .toHaveCount(0)
        expect(ensures).toHaveLength(0)
      }
      expect(errors).toEqual([])
      expect(unexpected).toEqual([])
    })
  }
}

// The hotseat empty state shares the gate's opposite entry. Drafts never reach
// the fieldable opponent list, so an existing draft opens instead of creating.
for (const mobile of [false, true]) {
  for (const choice of ['draft', 'recent', 'missing'] as const) {
    test(`hotseat opposite entry ${choice} on ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 })
      const oppositeAgents: MyAgentDTO[] = choice === 'missing' ? [] : [
        { agentID: 102, versionCount: 0, lastEditedAt: 100 },
        ...(choice === 'draft' ? [] : [
          { agentID: 103, versionCount: 0, lastEditedAt: 300 },
          {
            agentID: 105,
            versionCount: 2,
            lastEditedAt: 400,
            entryVersionID: 1002,
            isArchived: true,
          },
        ]),
      ]
      const { ensures, errors, unexpected } = await fixtures(page, {
        oppositeAgents,
      })
      await page.goto('/agents/101')
      await openPanel(page, 'hotseat')
      await expect(page.locator('[data-tm="OS.hotseat-empty"]')).toContainText(
        choice === 'missing'
          ? '你还没有对侧智能体'
          : '你还没有可出战的对侧智能体',
      )
      await page.locator(
        `[data-tm="OS.hotseat-${
          choice === 'missing' ? 'create' : 'open'
        }-opposite"]`,
      ).click()
      await expect(page).toHaveURL(
        new RegExp(`/agents/${choice === 'recent' ? 103 : 102}$`),
      )
      if (choice === 'missing') {
        await expect(page.getByRole('textbox', { name: '智能体名称' }))
          .toBeFocused()
        expect(ensures.map((request) => request.side)).toEqual(['b'])
      } else {
        await expect(page.getByRole('textbox', { name: '智能体名称' }))
          .toHaveCount(0)
        expect(ensures).toHaveLength(0)
      }
      expect(errors).toEqual([])
      expect(unexpected).toEqual([])
    })
  }
}

// Every side shortcut must use the same selection policy, including callers
// whose destination is a builder rather than an agent home.
for (const hasEntry of [true, false]) {
  for (
    const entry of [
      'scenario',
      'express',
      'guest-return',
      'journey',
      'sibling-gate',
    ] as const
  ) {
    test(`shared agent selection ${entry}: ${hasEntry ? 'entry version' : 'last edit'}`, async ({ page }) => {
      const candidates: MyAgentDTO[] = [
        { agentID: 103, versionCount: 1, lastEditedAt: 100 },
        { agentID: 104, versionCount: 1, lastEditedAt: 300 },
        {
          agentID: 105,
          versionCount: 1,
          lastEditedAt: 200,
          entryVersionID: hasEntry ? 1002 : null,
        },
        {
          agentID: 106,
          versionCount: 1,
          lastEditedAt: 400,
          entryVersionID: 1002,
          isArchived: true,
        },
      ]
      const opposite = entry === 'journey' || entry === 'sibling-gate'
      const { ensures, errors, unexpected } = await fixtures(
        page,
        opposite ? { oppositeAgents: candidates } : { sideAAgents: candidates },
      )
      const selected = hasEntry ? 105 : 104
      if (entry === 'scenario') {
        await page.goto(scenarioPath)
        await page.locator('[data-tm="DA.view-mine-button"]').first().click()
      } else if (entry === 'express') {
        await page.goto('/express')
        await page.locator('[data-tm="X.build-button"]').click()
      } else if (entry === 'guest-return') {
        // This is the destination restored by login for the public scene CTA.
        await page.goto(`${scenarioPath}/build?side=a`)
      } else if (entry === 'journey') {
        await page.goto('/matches/9001')
        await showJourney(page)
        await page.locator('[data-tm="FA.journey-opposite-button"]').click()
      } else {
        await page.context().route('**/v1/agents', (route) =>
          route.fulfill({
            status: 409,
            json: { error: 'sibling_gate', message: '先为对侧保存一个策略' },
          }))
        await page.goto('/agents/101')
        await page.getByRole('button', { name: '新建商鞅智能体' }).click()
        await page.locator('[data-tm="E.new-agent-gate-switch"]').click()
      }
      await expect(page).toHaveURL(
        entry === 'express'
          ? new RegExp(
            `/agents/${selected}/build\\?scenario=shangyang-court&side=a&express=1$`,
          )
          : new RegExp(`/agents/${selected}$`),
      )
      await expect(
        entry === 'express'
          ? page.locator('[data-tm="E.prompt-input"]')
          : page.getByRole('link', { name: '新建版本', exact: true }),
      )
        .toBeVisible()
      expect(ensures).toHaveLength(0)
      expect(errors).toEqual([])
      expect(unexpected).toEqual([])
    })
  }
}
