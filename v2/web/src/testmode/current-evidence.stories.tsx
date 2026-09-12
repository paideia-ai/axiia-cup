import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'

import { CLAUSES } from './data'
import { BASE_CSS, TM_CSS } from './styles'
import { progressKey } from './supabase'
import { ClauseChips, ClauseRow } from './ui'

const journey = 'HV-A6-GATES-CREATION'
const savedProgress = JSON.stringify({
  'HV-A6-GATES-CREATION-S04': {
    choice: 'fail',
    at: '2026-09-11T10:00:00Z',
    versionPins: { 'U06-C14': 'baseline:U06-C14' },
  },
})
const writes: string[] = []

function Surface({ width = 720 }: { width?: number }) {
  return (
    <div
      data-tm-root
      style={{ position: 'relative', width, maxWidth: '100%', height: 'auto' }}
    >
      <style>{BASE_CSS}{TM_CSS}</style>
      <div className='tm-surface tm-body'>
        <section aria-label='清单条款行'>
          <ClauseRow id='U06-C14' clamp={false} />
          <ClauseRow id='U04-C01' clamp={false} />
          <ClauseRow id='U04-C02' clamp={false} />
          <ClauseRow id='U01-C01' clamp={false} />
        </section>
        <section aria-label='导测条款'>
          <ClauseChips ids={['U06-C14', 'U04-C01', 'U04-C02']} />
        </section>
      </div>
    </div>
  )
}

const meta = {
  title: 'Test Mode/Current engineering evidence',
  component: Surface,
  parameters: {
    msw: [http.post('*', ({ request }) => {
      writes.push(request.url)
      return HttpResponse.json(null)
    })],
  },
  loaders: [() => {
    localStorage.setItem(progressKey(journey), savedProgress)
    writes.length = 0
    return {}
  }],
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const DatedAuditAndSeparateEngineeringEvidence: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = within(canvas.getByRole('region', { name: '清单条款行' }))
    const guide = within(canvas.getByRole('region', { name: '导测条款' }))
    for (const surface of [rows, guide]) {
      const enrollment = within(
        surface.getByRole('region', { name: 'U06-C14 当前工程证据' }),
      )
      await expect(enrollment.getByText('当前工程证据 · 组织方报名校验已部署'))
        .toBeVisible()
      await expect(
        enrollment.getByText(/本轮组织方账号与可报名赛事 fixture 仍待准备/),
      ).toBeVisible()
      await expect(enrollment.getByRole('link', { name: '后端 #57 · 3d0726d' }))
        .toHaveAttribute(
          'href',
          'https://github.com/paideia-ai/axiia-cup-v2/pull/57',
        )
      await expect(
        enrollment.getByText(
          '工程记录不替代本轮真人验收，也不更改已记录的结果。',
        ),
      ).toBeVisible()
      await expect(
        surface.getByRole('region', { name: 'U04-C01 当前工程证据' }),
      ).toHaveTextContent('部分覆盖')
      expect(surface.queryByRole('region', { name: 'U04-C02 当前工程证据' }))
        .toBeNull()
    }
    const audit = rows.getByTitle(
      '审计快照 2026-09-09：待裁决；不是当前部署或真人验收结果',
    )
    await expect(audit).toBeVisible()
    await expect(audit).toHaveTextContent('审计快照 2026-09-09 · 待裁决')
    await expect(rows.getByText(CLAUSES['U06-C14'].q)).toBeVisible()
    await expect(rows.getByText(CLAUSES['U04-C02'].q)).toBeVisible()
    await expect(
      guide.getByRole('link', { name: 'U06-C14 审计快照 2026-09-09 · 待裁决' }),
    ).toBeVisible()
    await expect(rows.getByTitle(/^审计快照 2026-08-30：/)).toBeVisible()
    expect(localStorage.getItem(progressKey(journey))).toBe(savedProgress)
    expect(writes).toEqual([])
  },
}

export const NarrowCardsRemainReadable: Story = {
  args: { width: 340 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-tm-root]') as HTMLElement
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    const row = within(canvasElement).getByRole('region', {
      name: '清单条款行',
    })
    const evidence = within(row).getByRole('region', {
      name: 'U06-C14 当前工程证据',
    })
    await expect(evidence).toHaveTextContent('无需等待产品裁决')
    expect(evidence.scrollWidth).toBeLessThanOrEqual(evidence.clientWidth)
    expect(localStorage.getItem(progressKey(journey))).toBe(savedProgress)
    expect(writes).toEqual([])
  },
}
