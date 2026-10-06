import { expect, type Page, test } from '@playwright/test'

interface PollRead {
  accountID: string
  after: number
  ids: number[]
}
declare global {
  interface Window {
    deliveryPolls: PollRead[]
  }
}

const accountA = 'delivery-preview-a'
const accountB = 'delivery-preview-b'
const titles = ['初试锋芒', '戏里戏外', '百折，尚未不挠']
const toast = (page: Page) =>
  page.getByRole('complementary', { name: '成就达成' })
const receipts = (page: Page, accountID = accountA) =>
  page.evaluate(
    (id) =>
      JSON.parse(
        localStorage.getItem(`axiia-achievement-toasts-v1:${id}`) ?? '[]',
      ),
    accountID,
  )

async function realFocus(page: Page) {
  // Playwright otherwise emulates every tab as focused. Use the browser's
  // actual foreground tab so the provider's focus check stays unmodified.
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setFocusEmulationEnabled', { enabled: false })
}
async function expectPolling(page: Page, accountID = accountA) {
  await expect.poll(() =>
    page.evaluate(
      (id) => window.deliveryPolls.some((poll) => poll.accountID === id),
      accountID,
    )
  ).toBe(true)
}
async function expectBatchRead(page: Page) {
  await expect.poll(
    () =>
      page.evaluate(() =>
        window.deliveryPolls.some((poll) => poll.ids.includes(4))
      ),
    { timeout: 10_000 },
  ).toBe(true)
}
async function dismiss(page: Page) {
  await toast(page).getByRole('button', { name: '关闭成就提示' }).click()
}

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    window.deliveryPolls = []
    globalThis.addEventListener(
      'achievement-delivery-preview:read',
      (event) => {
        window.deliveryPolls.push((event as CustomEvent).detail)
      },
    )
  })
  await page.goto('/')
  await realFocus(page)
  await page.bringToFront()
  await expectPolling(page)
})

test('a background event survives reload and appears when the tab regains focus', async ({ page, context }) => {
  await page.getByRole('button', { name: '5 秒后解锁 3 项' }).click()
  const foreground = await context.newPage()
  await foreground.goto('about:blank')
  await realFocus(foreground)
  await foreground.bringToFront()
  await expect.poll(() => page.evaluate(() => document.hasFocus())).toBe(false)
  await expectBatchRead(page)
  await expect(toast(page)).toHaveCount(0)
  expect(await receipts(page)).toEqual([])

  await page.reload()
  await page.bringToFront()
  await expectPolling(page)
  await expectBatchRead(page)
  await expect(toast(page)).toContainText(titles[0])
  expect(await receipts(page)).toEqual([2])
  await foreground.close()
})

test('reload resumes the unseen queue without replaying the displayed toast', async ({ page }) => {
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await expect(toast(page)).toContainText(titles[0])
  expect(await receipts(page)).toEqual([2])

  await page.reload()
  await expectPolling(page)
  await expect(toast(page)).toContainText(titles[1])
  expect(await receipts(page)).toEqual([2, 3])
  await dismiss(page)
  await expect(toast(page)).toContainText(titles[2])
  await dismiss(page)
  await expect(toast(page)).toHaveCount(0)
  expect(await receipts(page)).toEqual([2, 3, 4])
  await page.reload()
  await expectPolling(page)
  await expect(toast(page)).toHaveCount(0)
})

test('one foreground tab presents each event and the other tab does not replay it', async ({ page, context }) => {
  const observer = await context.newPage()
  await observer.goto('/')
  await realFocus(observer)
  await expectPolling(observer)
  await page.bringToFront()
  await expect.poll(() => observer.evaluate(() => document.hasFocus()))
    .toBe(false)
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await expect(toast(page)).toContainText(titles[0])
  await expectBatchRead(observer)
  await expect(toast(observer)).toHaveCount(0)
  for (const title of titles) {
    await expect(toast(page)).toContainText(title)
    await dismiss(page)
  }
  expect(await receipts(page)).toEqual([2, 3, 4])
  await observer.bringToFront()
  await expect.poll(() =>
    observer.evaluate(() =>
      sessionStorage.getItem('axiia-achievement-cursor-v1:delivery-preview-a')
    )
  ).toBe('4')
  await expect(toast(observer)).toHaveCount(0)
  await observer.close()
})

test('new accounts and existing history stay quiet, with receipts scoped to the account', async ({ page, context }) => {
  await expect(toast(page)).toHaveCount(0)
  expect(await receipts(page)).toEqual([])
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await expect(toast(page)).toContainText(titles[0])
  const freshTab = await context.newPage()
  await freshTab.goto('/')
  await realFocus(freshTab)
  await freshTab.bringToFront()
  await expectPolling(freshTab)
  await expect(toast(freshTab)).toHaveCount(0)
  await expect(freshTab.getByRole('status')).toHaveText(
    '此账号已获得 4 / 4 项成就。',
  )
  await freshTab.close()
  await page.bringToFront()

  await page.getByLabel('演示账号').selectOption(accountB)
  await expectPolling(page, accountB)
  await expect(toast(page)).toHaveCount(0)
  expect(await receipts(page, accountB)).toEqual([])
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await expect(toast(page)).toContainText(titles[0])
  expect(await receipts(page, accountB)).toEqual([2])
  expect(await receipts(page, accountA)).toEqual([2])
})

test('mobile toast stays within the viewport and opens the real collection', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await expect(toast(page)).toContainText(titles[0])
  const bounds = await toast(page).boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  const opened = context.waitForEvent('page')
  await toast(page).getByRole('link').click()
  const collection = await opened
  await expect(collection).toHaveURL(/\/settings\/achievements#first-word$/)
  await expect(collection.getByText('赢得你的第一场对局。', { exact: true }))
    .toBeVisible()
  await expect(collection.locator('.achievement-item')).toHaveCount(4)
  expect(errors).toEqual([])
  await collection.close()
})

test('a hovered toast keeps already admitted queued events past the freshness window', async ({ page }) => {
  await page.clock.install()
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await page.clock.runFor(2000)
  await expect(toast(page)).toContainText(titles[0])
  await toast(page).hover()
  await page.clock.fastForward(121_000)
  await expect(toast(page)).toContainText(titles[0])
  await dismiss(page)
  await expect(toast(page)).toContainText(titles[1])
  await dismiss(page)
  await expect(toast(page)).toContainText(titles[2])
  expect(await receipts(page)).toEqual([2, 3, 4])
})

test('a rejected Web Lock does not consume the unshown event and a later poll retries', async ({ page }) => {
  await page.evaluate(() => {
    const locks = navigator.locks
    const original = locks.request.bind(locks)
    let rejected = false
    Object.defineProperty(locks, 'request', {
      configurable: true,
      value: (name: string, callback: LockGrantedCallback<unknown>) => {
        if (name === 'axiia-achievement-toast' && !rejected) {
          rejected = true
          return Promise.reject(
            new DOMException('Transient lock failure', 'AbortError'),
          )
        }
        return original(name, callback)
      },
    })
  })
  await page.getByRole('button', { name: '解锁 3 项成就', exact: true }).click()
  await expect(toast(page)).toContainText(titles[0], { timeout: 10_000 })
  expect(await receipts(page)).toEqual([2])
  await dismiss(page)
  await expect(toast(page)).toContainText(titles[1])
})
