import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Button } from './button'
import { Card, CardContent } from './card'

// These ran green in unit tests and still shipped broken, because the defects
// only exist once real CSS cascades in a real browser. Storybook runs in chromium,
// so they belong here.
const meta = {
  title: 'v3.4/样式基线',
} satisfies Meta

export default meta

export const LinkUtilitiesBeatTheAnchorReset: StoryObj = {
  name: '导航选中态与正文强调色保持克制',
  render: () => (
    <div className='space-y-6'>
      <nav className='flex gap-2' aria-label='一级导航'>
        <a
          data-testid='active'
          data-tm='NAV.nav-link'
          className='rounded-md px-3 py-1.5 text-(--foreground)'
          aria-current='page'
          href='#scenarios'
        >
          场景
        </a>
        <a
          data-testid='idle'
          data-tm='NAV.nav-link'
          className='rounded-md px-3 py-1.5 text-(--foreground-subtle)'
          href='#matches'
        >
          历史
        </a>
      </nav>
      <p data-testid='accent-copy' className='text-(--accent)'>
        需要注意的状态文字
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const active = getComputedStyle(await canvas.findByTestId('active'))
    const idle = getComputedStyle(await canvas.findByTestId('idle'))
    const accent = getComputedStyle(
      await canvas.findByTestId('accent-copy'),
    ).color
    // Regression: a global unlayered `a { color: inherit }` beat @layer utilities,
    // so both links became indistinguishable. Keso's replacement is deliberately
    // neutral: foreground text plus a barely-there white surface, not a red tab.
    await expect(active.color).toBe('rgb(232, 232, 232)')
    await expect(active.backgroundColor).toBe(
      'rgba(255, 255, 255, 0.024)',
    )
    await expect(active.color).not.toBe(idle.color)
    await expect(idle.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    // Status text keeps meaning without reusing the stronger button red.
    await expect(accent).toBe('rgb(241, 122, 97)')
  },
}

export const PrimaryButtonFocusRingIsVisible: StoryObj = {
  name: '主按钮的强调环与共享中性焦点环可见',
  render: () => (
    <div className='flex items-center gap-6 p-6'>
      <Button>保存版本</Button>
      <a
        className='rounded-md text-sm text-(--foreground)'
        href='#version-help'
      >
        查看版本说明
      </a>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: '保存版本' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    const shadow = getComputedStyle(button).boxShadow
    // The existing accent ring remains the second cue on the primary action.
    await expect(shadow).not.toBe('none')
    await expect(shadow.split(',').length).toBeGreaterThan(1)

    const control = await canvas.findByRole('link', {
      name: '查看版本说明',
    })
    await userEvent.tab()
    await expect(control).toHaveFocus()
    await expect(control.matches(':focus-visible')).toBe(true)
    const style = getComputedStyle(control)
    // The shared neutral outline stays legible on red and neutral controls alike.
    await expect(style.outlineColor).toBe('rgb(199, 199, 199)')
    await expect(style.outlineStyle).toBe('solid')
    await expect(style.outlineWidth).toBe('2px')
    await expect(style.outlineOffset).toBe('3px')
  },
}

export const RestrainedCardSurfaceAndTitle: StoryObj = {
  name: '卡片表面与标题使用中性层级',
  render: () => (
    <a data-tm='D.scenario-card' href='#scenario'>
      <Card>
        <CardContent>
          <h2 data-tm='D.card-title'>商鞅变法</h2>
          <p className='mt-2 text-sm text-(--foreground-subtle)'>
            在可验证的制度得失中展开辩论。
          </p>
        </CardContent>
      </Card>
    </a>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = await canvas.findByRole('link', { name: /商鞅变法/ })
    const surface = card.firstElementChild as HTMLElement
    const title = await canvas.findByRole('heading', { name: '商鞅变法' })

    const surfaceStyle = getComputedStyle(surface)
    await expect(surfaceStyle.backgroundColor).toBe('rgb(22, 22, 22)')
    await expect(surfaceStyle.borderTopColor).toBe('rgb(48, 48, 48)')
    await expect(surfaceStyle.borderTopWidth).toBe('1px')
    await expect(surfaceStyle.borderRadius).toBe('10px')
    await expect(surfaceStyle.boxShadow).toBe('none')
    await expect(surfaceStyle.transitionDuration).toBe('0.15s, 0.15s')
    await expect(surfaceStyle.transitionProperty).toContain('border-color')
    await expect(surfaceStyle.transitionProperty).toContain('background-color')

    const titleStyle = getComputedStyle(title)
    const mobile = canvasElement.ownerDocument.defaultView!.innerWidth <= 767
    await expect(titleStyle.color).toBe('rgb(232, 232, 232)')
    await expect(titleStyle.fontSize).toBe(mobile ? '19px' : '20px')
    await expect(titleStyle.fontWeight).toBe('600')
    await expect(titleStyle.lineHeight).toBe(mobile ? '27.55px' : '29px')
    await expect(titleStyle.letterSpacing).toBe(mobile ? '-0.475px' : '-0.5px')
  },
}

export const TypographyAndNeutralTokens: StoryObj = {
  name: '中性色与中英文字体回退链完整',
  render: () => (
    <div className='space-y-2'>
      <p data-testid='sans' className='font-sans'>
        AXIIA 克制样式
      </p>
      <code data-testid='mono' className='font-mono'>
        match #9201 对战
      </code>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = getComputedStyle(document.documentElement)
    await expect(root.getPropertyValue('--foreground-subtle').trim()).toBe(
      '#aaa',
    )
    await expect(root.getPropertyValue('--foreground-muted').trim()).toBe(
      '#929292',
    )
    await expect(root.getPropertyValue('--border-soft').trim()).toBe('#303030')
    await expect(root.getPropertyValue('--surface').trim()).toBe('#161616')

    const bodyFamily = getComputedStyle(document.body).fontFamily
    const sansFamily = getComputedStyle(await canvas.findByTestId('sans'))
      .fontFamily
    const monoFamily = getComputedStyle(await canvas.findByTestId('mono'))
      .fontFamily
    for (const family of [bodyFamily, sansFamily]) {
      await expect(family).toMatch(/^Satoshi, "Noto Sans SC"/)
      await expect(family).toContain('"PingFang SC"')
      await expect(family).toContain('"Microsoft YaHei"')
      await expect(family).toContain('"WenQuanYi Micro Hei"')
      await expect(family).toContain('Arial')
    }
    await expect(monoFamily).toMatch(
      /^SFMono-Regular, Consolas, "DejaVu Sans Mono"/,
    )
    await expect(monoFamily).toContain('"Noto Sans SC"')
    await expect(monoFamily).toContain('"PingFang SC"')
    await expect(monoFamily).toContain('"Microsoft YaHei"')
    await expect(monoFamily).toContain('"WenQuanYi Micro Hei"')
  },
}
