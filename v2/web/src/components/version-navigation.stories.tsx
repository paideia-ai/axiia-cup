import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { navigationVersions } from '../testing/version-navigation-fixtures'
import { VersionList } from './version-list'

function Surface(
  { count = 12, selectedVersionID }: {
    count?: number
    selectedVersionID?: number
  },
) {
  const [versions, setVersions] = useState(() => navigationVersions(count))
  const [fielded, setFielded] = useState<number | null>(null)
  return (
    <MemoryRouter>
      <VersionList
        versions={versions}
        selectedVersionID={selectedVersionID}
        sideName='商鞅'
        onSetEntry={(id) =>
          setVersions((current) =>
            current.map((v) => ({ ...v, isEntry: v.id === id }))
          )}
        onField={(version) => setFielded(version.ordinal ?? null)}
      />
      {fielded != null && <p role='status'>准备使用 v{fielded} 出战</p>}
    </MemoryRouter>
  )
}

const meta = {
  title: 'Agents/Version navigation',
  component: Surface,
  parameters: { a11y: { test: 'error' } },
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>

export const TwelveVersions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const directory = within(
      canvas.getByRole('navigation', { name: '版本快速导航' }),
    )
    await expect(directory.getAllByRole('link')).toHaveLength(12)
    await userEvent.click(
      directory.getByRole('link', { name: '跳转到 v1' }),
    )
    const oldest = canvasElement.querySelector<HTMLElement>('#version-10101')!
    await waitFor(() =>
      expect(oldest.getBoundingClientRect().top).toBeLessThan(innerHeight - 100)
    )
    await expect(oldest).toHaveFocus()
    await waitFor(() =>
      expect(directory.getByRole('link', { name: '跳转到 v1' }))
        .toHaveAttribute('aria-current', 'location')
    )
    await userEvent.click(
      within(oldest).getByRole('button', { name: '将 v1 设为商鞅参赛版本' }),
    )
    await expect(directory.getByRole('link', { name: '跳转到 v1，参赛版本' }))
      .toHaveAttribute('aria-current', 'location')
    await userEvent.click(
      within(oldest).getByRole('button', { name: '用 v1 出战' }),
    )
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '准备使用 v1 出战',
    )
    const newest = directory.getByRole('link', { name: '跳转到 v12，最新版本' })
    newest.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(newest).toHaveAttribute('aria-current', 'location')
    )
    await expect(canvasElement.querySelector('#version-10112')).toHaveFocus()
  },
}

export const BelowThreshold: Story = {
  args: { count: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('navigation', { name: '版本快速导航' }))
      .toBeNull()
    await expect(canvas.getAllByTestId('version-card')).toHaveLength(1)
  },
}

export const FiveVersions: Story = {
  args: { count: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(within(canvas.getByRole('navigation')).getAllByRole('link'))
      .toHaveLength(5)
    const nav = within(canvas.getByRole('navigation'))
    // Near the page bottom, v3 and v2 must not share v1's clamped target.
    for (const ordinal of [5, 4, 3, 2, 1, 2, 3, 4, 5]) {
      const link = nav.getByRole('link', {
        name: new RegExp(`跳转到 v${ordinal}(，|$)`),
      })
      await userEvent.click(link)
      const card = canvasElement.querySelector<HTMLElement>(
        `#version-${10100 + ordinal}`,
      )!
      await waitFor(() => {
        expect(card).toHaveFocus()
        expect(link).toHaveAttribute('aria-current', 'location')
      })
      // Wait for the smooth scroll to settle before asserting the final choice.
      await new Promise<void>((resolve) => setTimeout(resolve, 700))
      await expect(link).toHaveAttribute('aria-current', 'location')
    }
  },
}

export const FortyVersions: Story = {
  args: { count: 40 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const horizontal = getComputedStyle(nav).flexDirection !== 'column'
    await expect(horizontal ? nav.scrollWidth : nav.scrollHeight)
      .toBeGreaterThan(horizontal ? nav.clientWidth : nav.clientHeight)
    await userEvent.click(within(nav).getByRole('link', { name: '跳转到 v1' }))
    await waitFor(
      () =>
        expect(within(nav).getByRole('link', { name: '跳转到 v1' }))
          .toHaveAttribute('aria-current', 'location'),
      { timeout: 3000 },
    )
    await expect(nav.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      horizontal ? 47 : 63,
    )
  },
}

export const LinkedOlderVersion: Story = {
  args: { selectedVersionID: 10103 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = within(canvas.getByRole('navigation')).getAllByRole('link')
    await expect(links[0]).toHaveAttribute('href', '#version-10103')
    await expect(canvas.getAllByTestId('version-card')[0]).toHaveAttribute(
      'id',
      'version-10103',
    )
    await expect(canvas.getByRole('link', { name: '跳转到 v12，最新版本' }))
      .toBeVisible()
  },
}

export const PreviewOnHoverAndFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const link = canvas.getByRole('link', { name: '跳转到 v12，最新版本' })
    const before = scrollY
    await userEvent.hover(link)
    const preview = await body.findByRole('tooltip')
    await expect(preview).toHaveTextContent('v12 · 约束执行')
    await expect(preview).toHaveTextContent('你是商鞅')
    await expect(scrollY).toBe(before)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull())
    await userEvent.unhover(link)
    link.focus()
    await expect(await body.findByRole('tooltip')).toHaveTextContent('最新版本')
    await userEvent.keyboard('{Enter}')
    await expect(canvasElement.querySelector('#version-10112')).toHaveFocus()
  },
}

export const CompactCards: Story = {
  args: { count: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const latest = canvasElement.querySelector<HTMLElement>(
      '#version-10105 [data-version-prompt]',
    )!
    const older = canvasElement.querySelector<HTMLElement>(
      '#version-10104 [data-version-prompt]',
    )!
    await expect(latest.textContent).toBe(navigationVersions(5).at(-1)!.prompt)
    await expect(latest).not.toHaveClass('line-clamp-2')
    await expect(older).toHaveClass('line-clamp-2')
    await expect(older.clientHeight).toBeLessThanOrEqual(
      Math.ceil(Number.parseFloat(getComputedStyle(older).lineHeight) * 2),
    )
    await userEvent.click(
      await canvas.findByRole('button', {
        name: '收起 v5 全文',
      }),
    )
    await expect(latest).toHaveClass('line-clamp-2')
    await userEvent.click(
      await canvas.findByRole('button', {
        name: '展开 v5 全文',
      }),
    )
    await expect(latest).not.toHaveClass('line-clamp-2')
    await userEvent.click(
      await canvas.findByRole('button', {
        name: '展开 v4 全文',
      }),
    )
    await expect(older.textContent).toBe(navigationVersions(5)[3].prompt)
    await expect(older).not.toHaveClass('line-clamp-2')
  },
}

export const AtThreshold: Story = {
  args: { count: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = within(canvas.getByRole('navigation', { name: '版本快速导航' }))
    await expect(nav.getAllByRole('link')).toHaveLength(2)
    for (const ordinal of [1, 2, 1]) {
      const link = nav.getByRole('link', {
        name: new RegExp(`跳转到 v${ordinal}(，|$)`),
      })
      await userEvent.click(link)
      await waitFor(() =>
        expect(link).toHaveAttribute('aria-current', 'location')
      )
    }
  },
}

export const CopyFeedbackKeepsCardHeight: Story = {
  args: { count: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvasElement.querySelector<HTMLElement>('#version-10101')!
    const copy = within(card).getByRole('button', { name: '复制 v1 提示词' })
    await canvas.findByRole('button', { name: '展开 v1 全文' })
    const height = card.getBoundingClientRect().height
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {},
        },
      })
      await userEvent.click(copy)
      await expect(within(card).getByRole('status')).toHaveTextContent(
        'v1 已复制',
      )
      await expect(card.getBoundingClientRect().height).toBe(height)
      await waitFor(
        () => expect(within(card).queryByRole('status')).toBeNull(),
        { timeout: 2500 },
      )
      await expect(card.getBoundingClientRect().height).toBe(height)
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () =>
            Promise.reject(new Error('Clipboard permission denied')),
        },
      })
      await userEvent.click(copy)
      await expect(within(card).getByRole('alert')).toHaveTextContent(
        '复制失败',
      )
      await expect(card.getBoundingClientRect().height).toBe(height)
      await userEvent.click(
        within(card).getByRole('button', { name: '用 v1 出战' }),
      )
      await expect(card.getBoundingClientRect().height).toBe(height)
      await expect(card.querySelector('[data-version-prompt]')).toHaveClass(
        'line-clamp-2',
      )
    } finally {
      if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  },
}

// Browser-runner viewport control exercises real CSS media queries and native
// scroll containers. Ordinary Storybook still renders at the reader's width.
function phonePlay(
  play: NonNullable<Story['play']>,
): NonNullable<Story['play']> {
  return async (context) => {
    const browserPage = '__vitest_browser_runner__' in globalThis
      ? (await import('vitest/browser')).page
      : null
    if (!browserPage && !matchMedia('(max-width: 767px)').matches) return
    const initial = { width: innerWidth, height: innerHeight }
    try {
      if (browserPage) await browserPage.viewport(390, 844)
      await waitFor(() => expect(innerWidth).toBeLessThan(768))
      await play(context)
    } finally {
      if (browserPage) await browserPage.viewport(initial.width, initial.height)
    }
  }
}

async function expectMobileActivity(
  nav: HTMLElement,
  activity: 'idle' | 'page' | 'rail',
  opacity: number,
  timeout = 3000,
) {
  await waitFor(() => {
    expect(nav).toHaveAttribute('data-activity', activity)
    expect(Number.parseFloat(getComputedStyle(nav).opacity)).toBeCloseTo(
      opacity,
      3,
    )
  }, { timeout, interval: 5 })
}

export const MobileOpacityChangesAtScrollEnd: Story = {
  args: { count: 12 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    await expectMobileActivity(nav, 'idle', 0.1)
    const transitions = getComputedStyle(nav).transitionProperty.split(',')
      .map((property) => property.trim())
    await expect(transitions).not.toContain('opacity')
    await expect(transitions).not.toContain('all')
    canvasElement.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        deltaY: 100,
      }),
    )
    await expectMobileActivity(nav, 'page', 0.2, 100)
    globalThis.dispatchEvent(new Event('scrollend'))
    await expectMobileActivity(nav, 'idle', 0.1, 100)
    nav.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        deltaY: 100,
      }),
    )
    await expectMobileActivity(nav, 'rail', 1, 100)
    nav.dispatchEvent(new Event('scrollend'))
    await expectMobileActivity(nav, 'idle', 0.1, 100)
  }),
}

export const MobileScrollingTheRailNavigates: Story = {
  args: { count: 40 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const newest = within(nav).getByRole('link', {
      name: '跳转到 v40，最新版本',
    })
    const oldest = within(nav).getByRole('link', { name: '跳转到 v1' })
    globalThis.scrollTo({ top: 0, behavior: 'instant' })
    await waitFor(() =>
      expect(newest).toHaveAttribute('aria-current', 'location')
    )
    await expectMobileActivity(nav, 'idle', 0.1)
    const pageBefore = scrollY
    const entryBefore = canvas.getAllByRole('button', { pressed: true })
      .map((button) => button.getAttribute('aria-label'))
    // Native scrolling emits wheel intent followed by scroll events. Set the
    // browser scroll position directly so the assertion is deterministic.
    nav.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 2000 }))
    await expectMobileActivity(nav, 'rail', 1, 100)
    nav.scrollTo({ top: nav.scrollHeight, behavior: 'instant' })
    await waitFor(() => {
      expect(oldest).toHaveAttribute('aria-current', 'location')
      expect(scrollY).toBeGreaterThan(pageBefore)
    }, { timeout: 3000 })
    await expectMobileActivity(nav, 'idle', 0.1)
    await expect(
      canvas.getAllByRole('button', { pressed: true })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(entryBefore)
    nav.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -2000 }))
    await expectMobileActivity(nav, 'rail', 1, 100)
    nav.scrollTo({ top: 0, behavior: 'instant' })
    await waitFor(() =>
      expect(newest).toHaveAttribute('aria-current', 'location')
    )
    await expectMobileActivity(nav, 'idle', 0.1)
    // A tap's animated document scroll still belongs to the rail gesture.
    await userEvent.click(oldest)
    await expectMobileActivity(nav, 'rail', 1, 100)
    await waitFor(() =>
      expect(oldest).toHaveAttribute('aria-current', 'location')
    )
    await expectMobileActivity(nav, 'idle', 0.1)
  }),
}

export const MobilePausedTouchPanKeepsFollowing: Story = {
  args: { count: 40 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const entryBefore = canvas.getAllByRole('button', { pressed: true })
      .map((button) => button.getAttribute('aria-label'))
    const center = (link: HTMLElement) =>
      link.offsetTop - (nav.clientHeight - link.offsetHeight) / 2
    const firstStop = within(nav).getByRole('link', { name: '跳转到 v30' })
    const secondStop = within(nav).getByRole('link', { name: '跳转到 v20' })
    nav.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'touch',
        pointerId: 1,
        isPrimary: true,
      }),
    )
    // A browser cancels the pointer once native touch panning takes over. This
    // is not a finger lift: a pause must retain ownership until touchend.
    nav.dispatchEvent(
      new PointerEvent('pointercancel', {
        bubbles: true,
        pointerType: 'touch',
        pointerId: 1,
        isPrimary: true,
      }),
    )
    nav.scrollTo({ top: center(firstStop), behavior: 'instant' })
    await waitFor(() =>
      expect(firstStop).toHaveAttribute('aria-current', 'location')
    )
    const pageAtPause = scrollY
    await new Promise<void>((resolve) => setTimeout(resolve, 350))
    await expectMobileActivity(nav, 'rail', 1)
    nav.scrollTo({ top: center(secondStop), behavior: 'instant' })
    await waitFor(() => {
      expect(secondStop).toHaveAttribute('aria-current', 'location')
      expect(scrollY).toBeGreaterThan(pageAtPause)
    })
    // Resume movement before lifting the finger so release has momentum.
    nav.dispatchEvent(new Event('scroll'))
    globalThis.dispatchEvent(new Event('touchend'))
    // Momentum is still rail input after the finger lifts; only scrollend
    // marks its completion and restores the idle appearance.
    nav.dispatchEvent(new Event('scroll'))
    await expectMobileActivity(nav, 'rail', 1, 100)
    nav.dispatchEvent(new Event('scrollend'))
    await expectMobileActivity(nav, 'idle', 0.1, 100)
    await expect(
      canvas.getAllByRole('button', { pressed: true })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(entryBefore)
    await expectMobileActivity(nav, 'idle', 0.1)
  }),
}

export const MobilePageScrollingKeepsRailInSync: Story = {
  args: { count: 40 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const oldest = within(nav).getByRole('link', { name: '跳转到 v1' })
    const newest = within(nav).getByRole('link', {
      name: '跳转到 v40，最新版本',
    })
    canvasElement.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        deltaY: 2000,
      }),
    )
    await expectMobileActivity(nav, 'page', 0.2, 100)
    globalThis.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    })
    await waitFor(() => {
      expect(oldest).toHaveAttribute('aria-current', 'location')
      expect(oldest.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        nav.getBoundingClientRect().top,
      )
      expect(oldest.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        nav.getBoundingClientRect().bottom,
      )
    })
    // Page-driven rail synchronization must not masquerade as rail input.
    await expectMobileActivity(nav, 'idle', 0.1)
    const bottom = scrollY
    // Programmatic rail synchronization must never start another page scroll.
    await new Promise<void>((resolve) => setTimeout(resolve, 500))
    await expect(scrollY).toBe(bottom)
    await expectMobileActivity(nav, 'idle', 0.1)
    canvasElement.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        deltaY: -2000,
      }),
    )
    await expectMobileActivity(nav, 'page', 0.2, 100)
    globalThis.scrollTo({ top: 0, behavior: 'instant' })
    await waitFor(() => {
      expect(newest).toHaveAttribute('aria-current', 'location')
      expect(newest.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        nav.getBoundingClientRect().top,
      )
    })
    await expectMobileActivity(nav, 'idle', 0.1)
  }),
}

export const MobileIdleRailKeepsKeyboardFocusVisible: Story = {
  args: { count: 12 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const link = within(nav).getByRole('link', {
      name: '跳转到 v12，最新版本',
    })
    const keyboard = '__vitest_browser_runner__' in globalThis
      ? (await import('vitest/browser')).userEvent
      : userEvent
    await expectMobileActivity(nav, 'idle', 0.1)
    await keyboard.keyboard('{Tab}')
    link.focus()
    await expect(link.matches(':focus-visible')).toBe(true)
    await new Promise<void>((resolve) => setTimeout(resolve, 1500))
    await expect(link).toHaveFocus()
    await expectMobileActivity(nav, 'rail', 1)
    const outside = canvas.getByRole('button', { name: '复制 v12 提示词' })
    outside.focus()
    await expectMobileActivity(nav, 'idle', 0.1, 100)
    // Keyboard users can rediscover the dimmed directory without a pointer.
    link.focus()
    await expectMobileActivity(nav, 'rail', 1)
    // A new gesture on the page takes over even if browser focus-visible still
    // points to the directory's old keyboard selection.
    outside.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        deltaY: 300,
      }),
    )
    await expectMobileActivity(nav, 'page', 0.2, 100)
    globalThis.scrollBy({ top: 300, behavior: 'instant' })
    await expect(link).toHaveFocus()
    await expectMobileActivity(nav, 'idle', 0.1)
  }),
}

export const MobileTouchFocusAndHoverDoNotKeepRailBright: Story = {
  args: { count: 12 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const link = within(nav).getByRole('link', {
      name: '跳转到 v12，最新版本',
    })
    const browser = '__vitest_browser_runner__' in globalThis
      ? await import('vitest/browser')
      : null
    // A trusted pointer click establishes browser pointer modality, allowing
    // this regression to distinguish touch focus from keyboard focus-visible.
    if (browser) {
      await browser.page.getByRole('link', { name: '跳转到 v12，最新版本' })
        .click()
    } else {
      await userEvent.click(link)
    }
    link.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'touch',
        pointerId: 1,
        isPrimary: true,
      }),
    )
    link.focus()
    if (browser) await expect(link.matches(':focus-visible')).toBe(false)
    link.dispatchEvent(
      new PointerEvent('pointerenter', {
        pointerType: 'touch',
        pointerId: 1,
        isPrimary: true,
      }),
    )
    await expectMobileActivity(nav, 'rail', 1)
    link.dispatchEvent(
      new PointerEvent('pointercancel', {
        bubbles: true,
        pointerType: 'touch',
        pointerId: 1,
        isPrimary: true,
      }),
    )
    globalThis.dispatchEvent(new Event('touchend'))
    nav.dispatchEvent(new Event('scrollend'))
    // Deliberately leave focus and the pointer inside the rail after release.
    await expectMobileActivity(nav, 'idle', 0.1, 100)
    await expect(link).toHaveFocus()
    canvasElement.dispatchEvent(
      new WheelEvent('wheel', {
        bubbles: true,
        deltaY: 300,
      }),
    )
    await expectMobileActivity(nav, 'page', 0.2, 100)
    globalThis.scrollBy({ top: 300, behavior: 'instant' })
    await expectMobileActivity(nav, 'idle', 0.1)
  }),
}

export const MobileKeyboardDirectory: Story = {
  args: { count: 40 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = within(canvas.getByRole('navigation', { name: '版本快速导航' }))
    const newest = nav.getByRole('link', { name: '跳转到 v40，最新版本' })
    newest.focus()
    for (
      const [key, ordinal] of [
        ['{ArrowDown}', 39],
        ['{End}', 1],
        ['{ArrowUp}', 2],
        ['{Home}', 40],
      ] as const
    ) {
      await userEvent.keyboard(key)
      const link = nav.getByRole('link', {
        name: new RegExp(`跳转到 v${ordinal}(，|$)`),
      })
      await waitFor(() => {
        expect(link).toHaveFocus()
        expect(link).toHaveAttribute('aria-current', 'location')
      })
    }
    await userEvent.keyboard('{Enter}')
    await expect(canvasElement.querySelector('#version-10140')).toHaveFocus()
  }),
}

export const MobileCardsKeepTheirFullWidth: Story = {
  args: { count: 2 },
  play: phonePlay(async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const [first, second] = within(nav).getAllByRole('link')
    await waitFor(() => {
      expect(getComputedStyle(nav).flexDirection).toBe('column')
      expect(getComputedStyle(nav).position).toBe('fixed')
      expect(first.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
      expect(second.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        first.getBoundingClientRect().bottom,
      )
    })
    // The directory overlays the original page gutter; cards retain exactly
    // the same 16px margins as a version list with no directory.
    // The existing html scrollbar-gutter also reserves room in Chromium.
    const pageBounds = document.body.getBoundingClientRect()
    for (const card of canvas.getAllByTestId('version-card')) {
      const bounds = card.getBoundingClientRect()
      await expect(bounds.left - pageBounds.left).toBe(16)
      await expect(pageBounds.right - bounds.right).toBe(16)
      await expect(bounds.width).toBe(pageBounds.width - 32)
    }
    await expect(nav.getBoundingClientRect().left).toBeLessThan(16)
    await userEvent.click(second)
    await waitFor(() =>
      expect(second).toHaveAttribute('aria-current', 'location')
    )
  }),
}

export const DesktopBehaviorIsUnchanged: Story = {
  args: { count: 40 },
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in globalThis)) return
    const { page } = await import('vitest/browser')
    const initial = { width: innerWidth, height: innerHeight }
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: '版本快速导航' })
    const newest = within(nav).getByRole('link', {
      name: '跳转到 v40，最新版本',
    })
    try {
      for (const width of [768, 1280, 1440]) {
        await page.viewport(width, 900)
        globalThis.scrollTo({ top: 0, behavior: 'instant' })
        await waitFor(() => {
          expect(getComputedStyle(nav).flexDirection).toBe(
            width < 1320 ? 'row' : 'column',
          )
          expect(getComputedStyle(nav).opacity).toBe('1')
          expect(newest).toHaveAttribute('aria-current', 'location')
        })
        const pageBefore = scrollY
        nav.dispatchEvent(
          new WheelEvent('wheel', {
            bubbles: true,
            deltaY: 1000,
          }),
        )
        nav.scrollTo({
          top: width < 1320 ? 0 : nav.scrollHeight,
          left: width < 1320 ? nav.scrollWidth : 0,
          behavior: 'instant',
        })
        await new Promise<void>((resolve) => setTimeout(resolve, 350))
        await expect(scrollY).toBe(pageBefore)
        await expect(newest).toHaveAttribute('aria-current', 'location')
        await expect(getComputedStyle(nav).opacity).toBe('1')
      }
    } finally {
      await page.viewport(initial.width, initial.height)
    }
  },
}
