// 2026-09-09 咳嗽四页签 minimal stylistic change 的可执行 BDD。
// test.step 文案逐条镜像 keso-four-tab-style.feature。注册和会话走真实服务；
// 排名/历史只用只读响应夹具，避免为视觉验收创建赛事或派发对局。
import { expect, type Page, test } from '@playwright/test'

import { requireServerFixtures, signup } from './helpers'

const tabs = [
  {
    path: '/scenarios',
    ready: '[data-tm="D.scenario-card"]',
    card: '[data-tm="D.scenario-card"]',
    cardTitle: '[data-tm="D.card-title"]',
  },
  {
    path: '/my-agents',
    ready: '[data-tm="MA.scenario-list"]',
  },
  {
    path: '/tournaments',
    ready: '[data-tm="G.tournament-card"]',
    card: '[data-tm="G.tournament-card"]',
    cardTitle: '[data-tm="G.tournament-name"]',
  },
  {
    path: '/matches',
    ready: '[data-tm="L.match-card"]',
    card: '[data-tm="L.match-card"]',
    cardTitle: '[data-tm="L.match-id"]',
  },
] as const

const cardTitleSizes: Readonly<Record<string, string>> = {
  '/scenarios': '20px',
  '/tournaments': '15px',
  '/matches': '15px',
}

interface ShellMetrics {
  header: number
  main: number
  footer: number
  scrollWidth: number
  clientWidth: number
}

test.describe.configure({ timeout: 120_000 })

async function waitForTab(page: Page, tab: (typeof tabs)[number]) {
  await page.goto(tab.path)
  await expect(page.locator(tab.ready).first()).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.locator('main h1').first()).toBeVisible()
  await page.mouse.move(0, 0)
}

async function shellMetrics(page: Page): Promise<ShellMetrics> {
  return await page.evaluate(() => {
    const widthOf = (selector: string) => {
      const element = document.querySelector(selector)
      if (element == null) throw new Error(`Missing shell element: ${selector}`)
      return element.getBoundingClientRect().width
    }

    return {
      header: widthOf('[data-tm="NAV.header"] > div'),
      main: widthOf('main'),
      footer: widthOf('[data-tm="NAV.footer"] > div'),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }
  })
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
}

async function expectOnlyCurrentNavigation(
  page: Page,
  navMarker: 'NAV.desktop-nav' | 'NAV.mobile-nav',
  itemMarker: 'NAV.nav-link' | 'NAV.mobile-nav-link',
  path: string,
) {
  const navigation = page.locator(`[data-tm="${navMarker}"]`)
  const current = navigation.locator(
    `[data-tm="${itemMarker}"][aria-current="page"]`,
  )
  await expect(current).toHaveCount(1)
  await expect(current).toHaveAttribute('href', path)
}

async function cardStyles(
  page: Page,
  cardSelector: string,
  titleSelector: string,
) {
  const card = page.locator(cardSelector).first()
  await expect(card).toBeVisible()
  return await card.evaluate((element, nestedTitleSelector) => {
    const surface = element.firstElementChild
    const title = element.querySelector(nestedTitleSelector)
    if (surface == null || title == null) {
      throw new Error('Expected a direct card surface and its title')
    }
    const surfaceStyle = getComputedStyle(surface)
    const titleStyle = getComputedStyle(title)
    return {
      surface: {
        background: surfaceStyle.backgroundColor,
        borderColor: surfaceStyle.borderTopColor,
        borderWidth: surfaceStyle.borderTopWidth,
        radius: surfaceStyle.borderRadius,
        shadow: surfaceStyle.boxShadow,
      },
      title: {
        color: titleStyle.color,
        fontSize: titleStyle.fontSize,
        fontWeight: titleStyle.fontWeight,
        lineHeight: titleStyle.lineHeight,
        letterSpacing: titleStyle.letterSpacing,
        numeric: titleStyle.fontVariantNumeric,
      },
    }
  }, titleSelector)
}

test.beforeEach(() => requireServerFixtures())

test('咳嗽四页签：统一内容宽度、中性选中态与克制卡片', async ({ page }) => {
  let desktopWidths: Pick<ShellMetrics, 'header' | 'main' | 'footer'> | null =
    null
  const computedCards = new Map<
    string,
    Awaited<ReturnType<typeof cardStyles>>
  >()

  await test.step('假如 我通过真实注册流程进入登录态', async () => {
    // Keep the visible display name short so this style test does not turn into
    // an unrelated long-account-name overflow fixture. signup still timestamps
    // the email, so parallel or repeated runs remain unique.
    await signup(page, 'ks-style')
    const me = await page.request.get('/v1/auth/me')
    expect(me.ok(), 'registration establishes a real server session').toBe(true)
  })

  await test.step('并且 排名与历史的只读接口使用确定性展示夹具', async () => {
    await page.route('**/v1/tournaments', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          tournaments: [{
            id: 9101,
            scenarioID: 'style-fixture',
            status: 'registration',
            currentRound: 1,
            totalRounds: 3,
            phase: 'qualifier',
            rounds: [{
              id: 91011,
              roundNumber: 1,
              status: 'running',
              phase: 'qualifier',
            }],
          }],
        }),
      }))
    await page.route('**/v1/matches', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          open: false,
          matches: [{
            id: 9201,
            scenarioID: 'style-fixture',
            scenarioTitle: '样式夹具',
            kind: 'pve',
            dispatched: true,
            finished: true,
            scored: true,
            winner: 'a',
            participants: {
              a: { isMine: true },
              b: { isMine: false },
            },
          }],
        }),
      }))
  })

  await test.step('当 我在桌面依次打开「场景」「我的智能体」「排名」「历史」', async () => {
    await page.setViewportSize({ width: 1280, height: 900 })
    for (const tab of tabs) {
      await waitForTab(page, tab)
      const metrics = await shellMetrics(page)
      const widths = {
        header: metrics.header,
        main: metrics.main,
        footer: metrics.footer,
      }
      desktopWidths ??= widths
      expect(widths).toEqual(desktopWidths)
      if ('card' in tab) {
        computedCards.set(
          tab.path,
          await cardStyles(page, tab.card, tab.cardTitle),
        )
      }
    }
  })

  await test.step('那么 四页的顶栏、正文、页脚内容宽度相同且不超过 1040px', () => {
    expect(desktopWidths).not.toBeNull()
    const widths = Object.values(desktopWidths!)
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(0.5)
    expect(Math.max(...widths)).toBeLessThanOrEqual(1040)
  })

  await test.step('并且 四页没有水平溢出，当前桌面页签只有轻量中性选中态', async () => {
    for (const tab of tabs) {
      await waitForTab(page, tab)
      await expectNoHorizontalOverflow(page)
      await expectOnlyCurrentNavigation(
        page,
        'NAV.desktop-nav',
        'NAV.nav-link',
        tab.path,
      )
      const current = page.locator(
        '[data-tm="NAV.desktop-nav"] [data-tm="NAV.nav-link"]' +
          '[aria-current="page"]',
      )
      const style = await current.evaluate((element) => {
        const computed = getComputedStyle(element)
        return {
          background: computed.backgroundColor,
          color: computed.color,
          shadow: computed.boxShadow,
        }
      })
      expect(style).toEqual({
        background: 'rgba(255, 255, 255, 0.024)',
        color: 'rgb(232, 232, 232)',
        shadow: 'none',
      })
      const heading = await page.locator('main h1').first().evaluate(
        (element) => {
          const computed = getComputedStyle(element)
          return {
            size: computed.fontSize,
            weight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
          }
        },
      )
      expect(heading).toEqual({
        size: '26px',
        weight: '650',
        lineHeight: '36.4px',
        letterSpacing: '-0.91px',
      })
    }

    // A trusted keyboard move back onto a real primary Button proves the live
    // app has both Keso's neutral outline and the existing accent ring.
    const agentsTab = tabs.find((tab) => tab.path === '/my-agents')!
    await waitForTab(page, agentsTab)
    const primaryControl = page.locator(
      '[data-tm="MA.side-section"] button',
    ).first()
    await primaryControl.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(primaryControl).toBeFocused()
    // Button transitions include outline colour, so wait for the 150ms control
    // transition to settle before taking the full computed-style snapshot.
    await expect(primaryControl).toHaveCSS(
      'outline-color',
      'rgb(199, 199, 199)',
    )
    const focus = await primaryControl.evaluate((element) => {
      const computed = getComputedStyle(element)
      return {
        visible: element.matches(':focus-visible'),
        color: computed.outlineColor,
        style: computed.outlineStyle,
        width: computed.outlineWidth,
        offset: computed.outlineOffset,
        shadow: computed.boxShadow,
      }
    })
    expect(focus.visible).toBe(true)
    expect(focus.color).toBe('rgb(199, 199, 199)')
    expect(focus.style).toBe('solid')
    expect(focus.width).toBe('2px')
    expect(focus.offset).toBe('3px')
    expect(focus.shadow).not.toBe('none')
    expect(focus.shadow.split(',').length).toBeGreaterThan(1)
  })

  await test.step('并且 场景、排名、历史卡片及其标题遵守中性计算样式', async () => {
    expect([...computedCards.keys()]).toEqual([
      '/scenarios',
      '/tournaments',
      '/matches',
    ])
    for (const [path, computed] of computedCards) {
      expect(computed.surface).toEqual({
        background: 'rgb(22, 22, 22)',
        borderColor: 'rgb(48, 48, 48)',
        borderWidth: '1px',
        radius: '10px',
        shadow: 'none',
      })
      expect(computed.title.color).toBe('rgb(232, 232, 232)')
      expect(computed.title.fontWeight).toBe('600')
      expect(computed.title.fontSize).toBe(cardTitleSizes[path])
    }
    const scenarioTitle = computedCards.get('/scenarios')!.title
    expect(scenarioTitle.lineHeight).toBe('29px')
    expect(scenarioTitle.letterSpacing).toBe('-0.5px')
    for (const path of ['/tournaments', '/matches']) {
      expect(computedCards.get(path)!.title.numeric).toBe('tabular-nums')
    }

    // Storybook's synthetic hover cannot engage a browser CSS pseudo-class;
    // Playwright moves the real pointer and owns this part of the contract.
    for (const tab of tabs) {
      if (!('card' in tab)) continue
      await waitForTab(page, tab)
      const card = page.locator(tab.card).first()
      const surface = card.locator(':scope > div')
      await card.hover()
      await expect(surface).toHaveCSS('background-color', 'rgb(26, 26, 26)')
      await expect(surface).toHaveCSS('border-top-color', 'rgb(80, 80, 80)')
    }
  })

  await test.step('当 我在 390 × 844 移动视口重复访问四页', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const tab of tabs) {
      await waitForTab(page, tab)
    }
  })

  await test.step('那么 四页仍无水平溢出、只选中当前页签，标题保持移动字号', async () => {
    for (const tab of tabs) {
      await waitForTab(page, tab)
      await expectNoHorizontalOverflow(page)
      await expectOnlyCurrentNavigation(
        page,
        'NAV.mobile-nav',
        'NAV.mobile-nav-link',
        tab.path,
      )
      await expect(page.locator('main h1').first()).toHaveCSS(
        'font-size',
        '24px',
      )

      if (!('card' in tab)) continue
      const card = page.locator(tab.card).first()
      const surface = card.locator(':scope > div')
      await expect(surface).toHaveCSS('transition-duration', '0s')
      const content = surface.locator(':scope > div')
      if (tab.path === '/scenarios') {
        await expect(content).toHaveCSS('padding', '20px')
        await expect(card.locator(tab.cardTitle)).toHaveCSS(
          'font-size',
          '19px',
        )
      } else {
        await expect(content).toHaveCSS('flex-wrap', 'wrap')
        await expect(content).toHaveCSS('padding', '18px 16px')
        const meta = card.locator(
          tab.path === '/tournaments'
            ? '[data-tm="G.tournament-meta"]'
            : '[data-tm="L.match-meta"]',
        )
        await expect(meta).toHaveCSS('display', 'inline-block')
        await expect(meta).toHaveCSS('overflow-wrap', 'anywhere')
      }
    }
  })
})
