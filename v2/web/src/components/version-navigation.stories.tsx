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
