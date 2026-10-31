import { expect, type Page, test } from '@playwright/test'
import {
  type BattlePreviewCase,
  battleStripPreviewAPI,
} from '../../src/testing/battle-strip-preview-api'

async function fixtures(page: Page, variant: BattlePreviewCase = 'default') {
  let matchReads = 0
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.slice(3)
    if (path === '/matches') matchReads++
    const response = await battleStripPreviewAPI(
      new Request(request.url(), { method: request.method() }),
      path,
      variant,
    )
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    })
  })
  return { errors, matchReads: () => matchReads }
}

const strip = (page: Page) => page.getByRole('region', { name: '进行中的对战' })

test('reserves a responsive left rail from 960px and keeps wide content centered', async ({ page }) => {
  const { errors } = await fixtures(page)
  await page.goto('/my-agents')
  await expect(strip(page).getByRole('link')).toHaveCount(4)
  for (
    const width of [
      320,
      390,
      768,
      928,
      951,
      959,
      960,
      1024,
      1119,
      1120,
      1280,
      1359,
      1360,
      1422,
      1440,
      1463,
      1512,
      1536,
      1679,
      1680,
      1920,
    ]
  ) {
    await page.setViewportSize({ width, height: 900 })
    const vertical = width >= 960
    await expect(strip(page)).toHaveCSS(
      'position',
      vertical ? 'fixed' : 'static',
    )
    await expect(strip(page).locator('.battle-strip-cards')).toHaveCSS(
      'flex-direction',
      vertical ? 'column' : 'row',
    )
    const geometry = await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>('.battle-strip')!
      const main = document.querySelector('main')!.getBoundingClientRect()
      const heading = document.querySelector('main h1')!.getBoundingClientRect()
      const box = bar.getBoundingClientRect()
      bar.style.display = 'none'
      const without = document.querySelector('main h1')!.getBoundingClientRect()
      bar.style.removeProperty('display')
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        bar: { x: box.x, right: box.right, y: box.y },
        main: { x: main.x, width: main.width },
        pageWidth:
          document.querySelector('#root')!.getBoundingClientRect().width,
        heading: { x: heading.x, y: heading.y },
        without: { x: without.x, y: without.y },
      }
    })
    expect(geometry.overflow, `${width}px overflow`).toBe(false)
    expect(geometry.main.width).toBeLessThanOrEqual(1040)
    expect(geometry.heading.x).toBe(geometry.without.x)
    expect((await strip(page).getByRole('button').boundingBox())!.height)
      .toBeGreaterThanOrEqual(44)
    for (const card of await strip(page).getByRole('link').all()) {
      expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    }
    if (vertical) {
      const railWidth = width >= 1360 ? 176 : width >= 1120 ? 144 : 112
      await expect(strip(page)).toHaveCSS('width', `${railWidth}px`)
      expect(geometry.bar.x).toBeGreaterThanOrEqual(16)
      expect(geometry.main.x - geometry.bar.right).toBeGreaterThanOrEqual(16)
      expect(geometry.heading.y).toBe(geometry.without.y)
      expect(geometry.bar.y).toBe(80)
      expect(geometry.main.x + geometry.main.width)
        .toBeLessThanOrEqual(geometry.pageWidth - 16)
      if (width >= 1472) {
        expect(geometry.main.x).toBe((geometry.pageWidth - 1040) / 2)
      }
    } else {
      expect(geometry.heading.y).toBeGreaterThan(geometry.without.y)
    }
  }
  expect(errors).toEqual([])
})

test('stays available across everyday pages, including reports, history and settings', async ({ page }) => {
  const state = await fixtures(page)
  await page.goto('/scenarios')
  await expect(strip(page).getByRole('link')).toHaveCount(4)
  await page.getByRole('link', { name: '我的智能体', exact: true }).filter({
    visible: true,
  }).click()
  await expect(page).toHaveURL(/\/my-agents$/)
  await expect(strip(page)).toBeVisible()
  // The shared feed survives navigation; expanding the route scope adds no poll.
  expect(state.matchReads()).toBe(1)
  for (
    const path of [
      '/scenarios/fengyiting-real',
      '/my-agents',
      '/agents/1000',
      '/agents/1000/build',
      '/sortie',
      '/matches',
      '/matches/9400',
      '/tournaments',
      '/notifications',
      '/settings',
      '/settings/archived-agents',
      '/settings/achievements',
      '/rewards',
    ]
  ) {
    await page.goto(path)
    await expect(strip(page), path).toBeVisible()
    await expect(strip(page).getByRole('link')).toHaveCount(4)
  }
  await strip(page).getByRole('link', { name: /#9400/ }).click()
  await expect(page).toHaveURL(/\/matches\/9400$/)
  await expect(strip(page).getByRole('link', { name: /#9400/ }))
    .toHaveAttribute('aria-current', 'page')
  expect(state.errors).toEqual([])
})

test('keeps version tabs in the page until both left rails fit', async ({ page }) => {
  await fixtures(page)
  for (const path of ['/agents/1000', '/agents/1000/build']) {
    await page.goto(path)
    const directory = page.locator('.version-directory-nav')
    const hasDirectory = path === '/agents/1000'
    if (hasDirectory) await expect(directory).toBeVisible()
    else await expect(directory).toHaveCount(0)
    for (const width of [960, 1120, 1320, 1360, 1422, 1679, 1680, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await expect(strip(page)).toHaveCSS(
        'position',
        'fixed',
      )
      if (hasDirectory) {
        await expect(directory).toHaveCSS(
          'position',
          width >= 1680 ? 'fixed' : 'sticky',
        )
        await expect(directory).toHaveCSS(
          'flex-direction',
          width >= 1680 ? 'column' : 'row',
        )
      }
      if (hasDirectory && width >= 1680) {
        await expect.poll(async () => {
          const bar = await strip(page).boundingBox()
          const nav = await directory.boundingBox()
          return nav!.x - (bar!.x + bar!.width)
        }).toBeGreaterThanOrEqual(20)
      }
    }
  }
})

test('narrow strips keep every card in one 44px-high row and scroll with the page', async ({ page }) => {
  await fixtures(page, 'many')
  await page.goto('/my-agents')
  await expect(strip(page).getByRole('link')).toHaveCount(25)
  for (const width of [320, 390, 669, 834, 928, 951, 959]) {
    await page.setViewportSize({ width, height: 844 })
    await page.evaluate(() => scrollTo(0, 0))
    const geometry = await strip(page).evaluate((el) => {
      const cards = [...el.querySelectorAll('a')].map((card) =>
        card.getBoundingClientRect()
      )
      const list = el.querySelector('.battle-strip-cards')!
      return {
        y: el.getBoundingClientRect().y,
        tops: cards.map((card) => card.y),
        heights: cards.map((card) => card.height),
        scrollable: list.scrollWidth > list.clientWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    })
    expect(new Set(geometry.tops).size).toBe(1)
    expect(Math.min(...geometry.heights)).toBeGreaterThanOrEqual(44)
    expect(geometry.scrollable).toBe(true)
    expect(geometry.overflow).toBe(false)
    await page.evaluate(() => scrollTo(0, 400))
    const after = await strip(page).boundingBox()
    expect(after!.y).toBe(geometry.y - 400)
  }
})

// These are browser viewport samples, not claims of physical-device testing.
const resizingCases = [
  {
    name: 'Fold6 cover, unfolded, rotated and folded again',
    scale: 2,
    sizes: [
      { width: 484, height: 1112 },
      { width: 928, height: 1004 },
      { width: 1028, height: 876 },
      { width: 484, height: 1112 },
    ],
  },
  {
    name: 'iPhone Duo outer, inner, rotated and split window',
    scale: 3,
    sizes: [
      { width: 382, height: 580 },
      { width: 669, height: 867 },
      { width: 951, height: 585 },
      { width: 385, height: 571 },
      { width: 382, height: 580 },
    ],
  },
  {
    name: 'iPad rotated and split window',
    scale: 2,
    sizes: [
      { width: 834, height: 1194 },
      { width: 1194, height: 834 },
      { width: 480, height: 1194 },
      { width: 834, height: 1194 },
    ],
  },
]

for (const sample of resizingCases) {
  test(`${sample.name}: preserves the page, feed and collapse state`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: sample.sizes[0],
      deviceScaleFactor: sample.scale,
      isMobile: true,
      hasTouch: true,
    })
    try {
      const page = await context.newPage()
      const state = await fixtures(page)
      await page.goto('/my-agents?keep=this-page')
      await expect(strip(page).getByRole('link')).toHaveCount(4)
      const rows = await strip(page).getByRole('link').allTextContents()
      await strip(page).evaluate((el) => {
        el.setAttribute('data-resize-check', 'same-node')
      })
      for (const collapsed of [true, false]) {
        await strip(page).getByRole('button').click()
        for (const size of sample.sizes) {
          await page.setViewportSize(size)
          await expect(page).toHaveURL(/\/my-agents\?keep=this-page$/)
          await expect(strip(page)).toHaveAttribute(
            'data-resize-check',
            'same-node',
          )
          await expect(strip(page)).toHaveCSS(
            'position',
            size.width >= 960 ? 'fixed' : 'static',
          )
          await expect(strip(page).getByRole('button')).toHaveAttribute(
            'aria-expanded',
            String(!collapsed),
          )
          if (collapsed) {
            await expect(strip(page).getByRole('link')).toHaveCount(0)
          } else {expect(await strip(page).getByRole('link').allTextContents())
              .toEqual(rows)}
          expect(state.matchReads()).toBe(1)
        }
      }
      expect(state.errors).toEqual([])
    } finally {
      await context.close()
    }
  })
}

test('175% device scale uses CSS width and the same desktop threshold', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1422, height: 850 },
    deviceScaleFactor: 1.75,
  })
  try {
    const page = await context.newPage()
    await fixtures(page)
    await page.goto('/my-agents')
    await expect(strip(page)).toHaveCSS('position', 'fixed')
    await expect(strip(page)).toHaveCSS('width', '176px')
    expect(await page.evaluate(() => devicePixelRatio)).toBe(1.75)
  } finally {
    await context.close()
  }
})

test('collapse survives navigation, reload and layout changes', async ({ page }) => {
  await fixtures(page)
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto('/my-agents')
  const toggle = strip(page).getByRole('button')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(strip(page).getByRole('link')).toHaveCount(0)
  await page.getByRole('link', { name: '历史', exact: true }).filter({
    visible: true,
  }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(strip(page).getByRole('link')).toHaveCount(4)
  const cards = strip(page).locator('.battle-strip-cards')
  await expect.poll(() =>
    cards.evaluate((el) => el.scrollWidth > el.clientWidth)
  ).toBe(true)
  await cards.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
  })
  await expect(strip(page).getByRole('link').last()).toBeInViewport()
})

test('long lists scroll inside the fixed rail without moving it', async ({ page }) => {
  const { errors } = await fixtures(page, 'many')
  await page.setViewportSize({ width: 1920, height: 600 })
  await page.goto('/my-agents')
  await expect(strip(page).getByRole('link')).toHaveCount(25)
  const cards = strip(page).locator('.battle-strip-cards')
  await expect.poll(() =>
    cards.evaluate((el) => el.scrollHeight > el.clientHeight)
  ).toBe(true)
  await strip(page).getByRole('link').last().focus()
  await expect(strip(page).getByRole('link').last()).toBeInViewport()
  await expect(strip(page).getByRole('button')).toBeInViewport()
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
  expect((await strip(page).boundingBox())!.y).toBe(80)
  expect(errors).toEqual([])
})

for (
  const variant of [
    'empty',
    'foreign',
    'old-server',
    'expired',
    'error',
    'guest',
  ] as const
) {
  test(`${variant}: hides the entire strip`, async ({ page }) => {
    await fixtures(page, variant)
    await page.goto('/scenarios')
    await expect(page.getByRole('heading', { name: '场景', exact: true }))
      .toBeVisible()
    await expect(strip(page)).toHaveCount(0)
  })
}

test('omits the strip from the landing page, first-battle guide and administration', async ({ page }) => {
  await fixtures(page, 'admin')
  for (const path of ['/', '/express', '/admin', '/admin/slots/1']) {
    await page.goto(path)
    await expect(page.getByRole('link', { name: 'AXIIA CUP', exact: true }))
      .toBeVisible()
    await expect(strip(page), path).toHaveCount(0)
  }
})
