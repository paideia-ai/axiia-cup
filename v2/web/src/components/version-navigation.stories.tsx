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
  args: { count: 4 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('navigation', { name: '版本快速导航' }))
      .toBeNull()
    await expect(canvas.getAllByTestId('version-card')).toHaveLength(4)
  },
}

export const AtThreshold: Story = {
  args: { count: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(within(canvas.getByRole('navigation')).getAllByRole('link'))
      .toHaveLength(5)
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
