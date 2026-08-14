import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Button } from './button'

// These two ran green in unit tests and still shipped broken, because both defects
// only exist once real CSS cascades in a real browser. Storybook runs in chromium,
// so they belong here.
const meta = {
  title: 'v3.4/样式基线',
} satisfies Meta

export default meta

export const LinkUtilitiesBeatTheAnchorReset: StoryObj = {
  name: '链接上的文字颜色工具类必须生效（导航选中态）',
  render: () => (
    <nav className='flex gap-4'>
      <a
        data-testid='active'
        className='text-(--accent)'
        aria-current='page'
        href='#'
      >
        场景
      </a>
      <a data-testid='idle' className='text-(--foreground-muted)' href='#'>
        历史
      </a>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const active = getComputedStyle(await canvas.findByTestId('active')).color
    const idle = getComputedStyle(await canvas.findByTestId('idle')).color
    // Regression: a global unlayered `a { color: inherit }` beat @layer utilities,
    // so both computed to the plain foreground and the active tab was unmarkable.
    await expect(active).toBe('rgb(224, 74, 47)')
    await expect(active).not.toBe(idle)
  },
}

export const PrimaryButtonFocusRingIsVisible: StoryObj = {
  name: '主按钮键盘焦点环可见',
  render: () => (
    <div className='p-6'>
      <Button>保存版本</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: '保存版本' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    const shadow = getComputedStyle(button).boxShadow
    // An accent ring drawn flush against an accent fill is invisible; the offset ring
    // is what makes it readable, and it shows up as a second shadow layer.
    await expect(shadow).not.toBe('none')
    await expect(shadow.split(',').length).toBeGreaterThan(1)
  },
}
