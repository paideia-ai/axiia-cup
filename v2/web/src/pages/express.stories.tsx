import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { ScenarioDetail, Side } from '../api/types'
import { AuthProvider } from '../context/auth'
import { config, expressScoring, scenario } from '../testing/v34-fixtures'
import { shangyangCourtIntro } from '../scenarios/intro-copy'
import { ExpressPage } from './express'

function Surface() {
  return (
    <MemoryRouter initialEntries={['/express']}>
      <AuthProvider>
        <Routes>
          <Route path='/express' element={<ExpressPage />} />
          <Route path='/scenarios' element={<h1>场景列表</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function handlers({
  opponentSide = 'b',
  detail = { ...scenario, scoring: expressScoring },
  done = false,
  configFails = false,
}: {
  opponentSide?: Side
  detail?: ScenarioDetail
  done?: boolean
  configFails?: boolean
} = {}) {
  return [
    http.get('/v1/auth/me', () =>
      HttpResponse.json({
        account: {
          id: 'express-reader',
          displayName: '首战玩家',
          isAdmin: false,
          hasTOTP: false,
        },
        elevated: false,
        firstBattleDone: done,
      })),
    http.get(
      '/v1/config',
      () =>
        configFails
          ? HttpResponse.json({ error: 'unavailable' }, { status: 503 })
          : HttpResponse.json({
            ...config,
            expressPreset: {
              scenarioID: detail.summary.id,
              side: opponentSide,
              presetKey: 'preview-preset',
            },
          }),
    ),
    http.get('/v1/scenarios/:id', ({ request, params }) => {
      expect(params.id).toBe(detail.summary.id)
      expect(new URL(request.url).searchParams.get('side')).toBe(
        opponentSide === 'a' ? 'b' : 'a',
      )
      return HttpResponse.json(detail)
    }),
  ]
}

const meta = {
  title: 'v3.4/First battle court introduction',
  component: Surface,
  parameters: { msw: handlers(), a11y: { test: 'error' } },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const CourtIntroduction: Story = {
  name: '首战朝堂：人物关系、来源文案、计分与构建链接',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const court = within(await canvas.findByTestId('express-court'))
    expect(court.getByText('你的角色').parentElement).toHaveTextContent('商鞅')
    expect(court.getByText('你的对手').parentElement).toHaveTextContent('甘龙')
    await expect(court.getByRole('img', { name: '商鞅头像' })).toBeVisible()
    await expect(court.getByRole('img', { name: '甘龙头像' })).toBeVisible()
    await expect(court.getByRole('img', { name: '秦孝公头像' })).toBeVisible()
    await expect(
      canvas.getByText(shangyangCourtIntro.source.participants.sides.a.goal),
    ).toBeVisible()
    const build = canvas.getByRole('link', { name: '去构建商鞅 →' })
    const href = new URL(build.getAttribute('href')!, location.origin)
    expect(href.pathname).toBe('/agents/entry')
    expect(href.searchParams.get('side')).toBe('a')
    expect(href.searchParams.get('scenario')).toBe('shangyang-court')
    expect(href.searchParams.get('target')).toBe('build')
    expect(href.searchParams.get('express')).toBe('1')
    const details = canvasElement.querySelectorAll('details')
    await userEvent.click(details[0].querySelector('summary')!)
    await expect(
      canvas.getByText(shangyangCourtIntro.source.overview.paragraphs[0]),
    ).toBeVisible()
    await userEvent.click(details[1].querySelector('summary')!)
    await expect(canvas.getByText(expressScoring.summary)).toBeVisible()
    await expect(canvas.getByText(expressScoring.notes![0])).toBeVisible()
    await expect(canvas.getByText('−0.25', { exact: true })).toBeVisible()
  },
}

export const OppositePreset: Story = {
  name: '配置为甘龙执方：身份、目标和入口一致切换',
  parameters: { msw: handlers({ opponentSide: 'a' }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const court = within(await canvas.findByTestId('express-court'))
    expect(court.getByText('你的角色').parentElement).toHaveTextContent('甘龙')
    expect(court.getByText('你的对手').parentElement).toHaveTextContent('商鞅')
    await expect(
      canvas.getByText(shangyangCourtIntro.source.participants.sides.b.goal),
    ).toBeVisible()
    const href = canvas.getByRole('link', { name: '去构建甘龙 →' })
      .getAttribute('href')!
    expect(new URL(href, location.origin).searchParams.get('side')).toBe('b')
  },
}

export const ServerScoring: Story = {
  name: '显示服务端的计分条目和权重，避免写死演示数字',
  parameters: {
    msw: handlers({
      detail: {
        ...scenario,
        scoring: {
          summary: '服务端更新后的计分规则',
          items: [{ id: 'new-rule', label: '服务端新增项', points: 2.75 }],
          notes: ['服务端更新后的平分规则'],
        },
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('express-court')
    await userEvent.click(canvasElement.querySelectorAll('summary')[1])
    await expect(canvas.getByText('服务端更新后的计分规则')).toBeVisible()
    await expect(canvas.getByText('服务端新增项')).toBeVisible()
    await expect(canvas.getByText('+2.75')).toBeVisible()
    expect(canvas.queryByText('−0.25', { exact: true })).toBeNull()
  },
}

export const MissingScoring: Story = {
  name: '旧脚本缺少计分元数据：提供详情入口，不显示演示分值',
  parameters: {
    msw: handlers({ detail: { ...scenario, scoring: undefined } }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('express-court')
    await userEvent.click(canvasElement.querySelectorAll('summary')[1])
    await expect(canvas.getByRole('link', { name: '查看场景完整规则' }))
      .toHaveAttribute('href', '/scenarios/shangyang-court')
    expect(canvas.queryByText('−0.25', { exact: true })).toBeNull()
  },
}

export const CompletedFirstBattle: Story = {
  name: '已完成首战的账号仍返回场景列表',
  parameters: { msw: handlers({ done: true }) },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('heading', { name: '场景列表' }),
    ).toBeVisible()
    expect(within(canvasElement).queryByTestId('express-court')).toBeNull()
  },
}

export const ConfigFallback: Story = {
  name: '配置请求失败时保留商鞅首战回退',
  parameters: { msw: handlers({ configFails: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('express-court')
    await expect(canvas.getByRole('link', { name: '去构建商鞅 →' }))
      .toBeVisible()
  },
}

export const OtherConfiguredScenario: Story = {
  name: '其他首战场景保留原有配置与单角色介绍',
  parameters: {
    msw: handlers({
      detail: {
        ...scenario,
        summary: {
          ...scenario.summary,
          id: 'trolley-problem',
          sideAName: '奕仁',
          sideBName: '武仁',
        },
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '电车难题 · 一人与五人' }),
    ).toBeVisible()
    expect(canvas.queryByTestId('express-court')).toBeNull()
    const href = canvas.getByRole('link', { name: '去构建 →' }).getAttribute(
      'href',
    )!
    expect(new URL(href, location.origin).searchParams.get('scenario')).toBe(
      'trolley-problem',
    )
  },
}
