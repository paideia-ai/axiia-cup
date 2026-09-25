import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { finishedMatch, finishedNoInquiryMatch } from '../testing/v34-fixtures'
import { harborMatch } from '../testing/harbor-fixtures'
import { MatchDetailPage } from './match-detail'
import referenceMatch144 from '../testing/reference-match-144.json'
import referenceMatch120 from '../testing/reference-match-120.json'
import referenceMatch122 from '../testing/reference-match-122.json'
import referenceMatch123 from '../testing/reference-match-123.json'
import referenceMatch145 from '../testing/reference-match-145.json'

function MatchReport() {
  return (
    <MemoryRouter initialEntries={['/matches/9001']}>
      <Routes>
        <Route path='/matches/:matchId' element={<MatchDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Match report',
  component: MatchReport,
  parameters: {
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(finishedMatch)),
    ],
  },
} satisfies Meta<typeof MatchReport>

export default meta
type Story = StoryObj<typeof meta>

export const SameDayTimestamps: Story = {
  parameters: {
    msw: [
      http.get('/v1/matches/9001', () =>
        HttpResponse.json({
          ...finishedMatch,
          summary: {
            ...finishedMatch.summary,
            createdAt: new Date(2026, 8, 24, 9, 32).getTime() / 1000,
            finishedAt: new Date(2026, 8, 24, 9, 42).getTime() / 1000,
            kind: 'pvp',
            participants: {
              a: finishedMatch.summary.participants!.a,
              b: {
                ownerDisplayName: '预览玩家',
                versionID: 466,
                modelID: 'fixture-model',
                isMine: false,
              },
            },
          },
        })),
    ],
  },
}

export const CrossDayTimestamps: Story = {
  parameters: {
    msw: [
      http.get('/v1/matches/9001', () =>
        HttpResponse.json({
          ...finishedMatch,
          summary: {
            ...finishedMatch.summary,
            createdAt: new Date(2026, 8, 24, 23, 52).getTime() / 1000,
            finishedAt: new Date(2026, 8, 25, 0, 2).getTime() / 1000,
          },
        })),
    ],
  },
}

// Historical snapshot used by the approved local preview at localhost:5235.
async function checkThreeStageReport(
  canvasElement: HTMLElement,
  first: string,
  third: string,
  names: string[],
) {
  const canvas = within(canvasElement)
  const second = await canvas.findByRole('heading', {
    name: '（阶段2/3）屏退问询',
  })
  const firstHeading = canvas.getByRole('heading', { name: first })
  const thirdHeading = canvas.getByRole('heading', { name: third })
  const final = canvas.getByRole('heading', { name: '终局裁决' })
  await expect(firstHeading.compareDocumentPosition(second) & 4).toBeTruthy()
  for (const name of names) {
    const inquiry = canvas.getByRole('heading', { name: `问询：${name}` })
    await expect(second.compareDocumentPosition(inquiry) & 4).toBeTruthy()
    await expect(inquiry.compareDocumentPosition(thirdHeading) & 4).toBeTruthy()
  }
  await expect(thirdHeading.compareDocumentPosition(final) & 4).toBeTruthy()
  await expect(canvas.queryByText(/inquiry-[ab]|第 \d\/\d 阶段/)).toBeNull()
  await userEvent.click(canvas.getByRole('button', { name: '回放' }))
  await expect(canvas.queryByRole('heading', { name: '（阶段2/3）屏退问询' }))
    .toBeNull()
  await expect(canvas.queryByRole('heading', { name: '终局裁决' })).toBeNull()
  await userEvent.click(canvas.getByRole('button', { name: '退出回放' }))
  await canvas.findByRole('heading', { name: '（阶段2/3）屏退问询' })
}

export const ReferenceMatch144: Story = {
  decorators: [
    (Story) => (
      <main className='mx-auto max-w-[1040px] px-4 py-8 sm:px-6'>
        <Story />
      </main>
    ),
  ],
  parameters: {
    fullApp: true,
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(referenceMatch144)),
    ],
  },
  play: ({ canvasElement }) =>
    checkThreeStageReport(
      canvasElement,
      '（阶段1/3）朝堂辩论',
      '（阶段3/3）秦孝公裁决',
      ['商鞅', '甘龙'],
    ),
}

export const ReferenceMatch120: Story = {
  ...ReferenceMatch144,
  parameters: {
    fullApp: true,
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(referenceMatch120)),
    ],
  },
  play: async ({ canvasElement }) => {
    await checkThreeStageReport(
      canvasElement,
      '（阶段1/3）深夜军议',
      '（阶段3/3）光秀决断',
      ['足利义昭的使者', '细川藤孝'],
    )
    const canvas = within(canvasElement)
    const result = within(canvas.getByRole('region', { name: '简要对局结果' }))
    await expect(result.getByRole('heading', { name: '细川藤孝胜' }))
      .toBeVisible()
    await expect(result.getByText('足利义昭的使者 / 细川藤孝')).toBeVisible()
    await expect(
      canvas.getByText('本能寺之变·敌在何处 · 足利义昭的使者 对细川藤孝'),
    ).toBeVisible()
    const legend = canvasElement.querySelector('[data-tm="FA.trend-legend"]')
    await expect(legend?.textContent).toContain('足利义昭的使者')
    await expect(legend?.textContent).toContain('细川藤孝')
  },
}

export const ReferenceMatch145: Story = {
  ...ReferenceMatch144,
  parameters: {
    fullApp: true,
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(referenceMatch145)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('region', { name: '简要对局结果' }),
    ).toBeVisible()
    await expect(canvas.getByText('有罪 8 票 / 无罪 3 票', { exact: true }))
      .toBeVisible()
    for (let round = 1; round <= 5; round++) {
      await userEvent.click(canvas.getByRole('tab', { name: `第${round}轮` }))
      const panel = within(canvas.getByRole('tabpanel'))
      await expect(panel.getByText(`第 ${round} 轮公开审议`, { exact: true }))
        .toBeVisible()
      await expect(canvas.getByText('十一人最终判决')).toBeVisible()
      await expect(panel.queryByText('十一人最终判决')).toBeNull()
      for (let other = 1; other <= 5; other++) {
        if (other !== round) {
          await expect(
            panel.queryByText(`第 ${other} 轮公开审议`, { exact: true }),
          ).toBeNull()
        }
      }
    }
    await userEvent.click(canvas.getByRole('tab', { name: '第1轮' }))
  },
}

export const ReferenceMatch122: Story = {
  ...ReferenceMatch144,
  parameters: {
    fullApp: true,
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(referenceMatch122)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: '裁判裁决' })
    const labels = ['原始电车', '自动驾驶车', '缸中之脑']
    for (const [index, label] of labels.entries()) {
      await userEvent.click(canvas.getByRole('tab', { name: label }))
      const panel = within(canvas.getByRole('tabpanel', { name: label }))
      await expect(
        panel.getByRole('heading', { name: `第${'一二三'[index]}案·${label}` }),
      ).toBeVisible()
      for (const turn of referenceMatch122.turns) {
        if (
          turn.kind === 'dialogue' && turn.channel === `case-${index + 1}` &&
          turn.finalText.trim()
        ) {
          await expect(
            canvas.getByRole('tabpanel').textContent!.replace(/\s+/g, ''),
          ).toContain(turn.finalText.replace(/\s+/g, ''))
        }
      }
      await expect(canvas.getByRole('heading', { name: '裁判裁决' }))
        .toBeVisible()
    }
    await userEvent.click(canvas.getByRole('tab', { name: labels[0] }))
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: labels[1] })).toHaveFocus()
    await expect(canvas.getByRole('tab', { name: labels[1] })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.keyboard('{Home}')
    await expect(canvas.getByRole('tab', { name: labels[0] })).toHaveFocus()
  },
}

export const ReferenceMatch123: Story = {
  ...ReferenceMatch144,
  parameters: {
    fullApp: true,
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(referenceMatch123)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('tab', { name: '交锋' })
    await expect(
      canvas.getByText('第一场·凤仪亭公开交锋', { exact: true }),
    ).toBeVisible()
    const segments = [
      { label: '交锋', channels: ['public', 'order'] },
      { label: '私会', channels: ['a-1', 'b-1'] },
      { label: '暗流', channels: ['leak-a', 'leak-b', 'a-2', 'b-2'] },
    ]
    for (const { label, channels } of segments) {
      await userEvent.click(canvas.getByRole('tab', { name: label }))
      for (const turn of referenceMatch123.turns) {
        if (
          turn.kind === 'dialogue' && channels.includes(turn.channel) &&
          turn.channel !== 'order' && turn.finalText.trim()
        ) {
          await expect(
            canvas.getByRole('tabpanel').textContent!.replace(/\s+/g, ''),
          ).toContain(turn.finalText.replace(/\s+/g, ''))
        }
      }
      await expect(canvas.getByRole('heading', { name: '终局裁决' }))
        .toBeVisible()
    }
    await userEvent.click(canvas.getByRole('tab', { name: '交锋' }))
  },
}

// act 生成的原始标签一个字都不该出现在战报里（#22）——心声卡已经渲染过同一份
// 内容，标签本身是引擎向模型索要的格式。
const RAW_ACT_MARKUP = /<(os|attention|favor|strength|reason|guess)>/

export const FinishedScored: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const result = await canvas.findByRole('region', { name: '简要对局结果' })
    const dialogue = canvas.getByRole('heading', { name: '对话全文' })
    const inquiry = canvas.getByRole('heading', { name: '问询' })
    const verdict = canvas.getByRole('heading', {
      name: '终局裁决',
      level: 2,
    })
    // F2 · #69：隐藏目标五步区块独立成段，位于问询与计分推导之间。
    const hiddenGoal = canvas.getByRole('heading', { name: '隐藏目标' })
    const scoring = canvas.getByRole('heading', { name: '计分推导' })

    await expect(result.compareDocumentPosition(dialogue) & 4).toBeTruthy()
    await expect(dialogue.compareDocumentPosition(inquiry) & 4).toBeTruthy()
    await expect(inquiry.compareDocumentPosition(verdict) & 4).toBeTruthy()
    await expect(verdict.compareDocumentPosition(hiddenGoal) & 4).toBeTruthy()
    await expect(hiddenGoal.compareDocumentPosition(scoring) & 4).toBeTruthy()
    await expect(canvas.queryByText('先立可验证的制度标准。')).toBeNull()
    // F7：胜负行与徽记带「我方」视角（fixture 的 a 侧 isMine）。
    await expect(canvas.getByText('我方（商鞅）胜')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: '商鞅胜' })).toBeVisible()
    // 完整得分账仍在页下方呈现。
    await expect(canvas.getByText('真目标 SR2 被甘龙识破')).toBeVisible()
    await expect(canvas.getByText('被识破 -1')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '查看详细裁决' }))
    await expect(verdict.closest('#match-final-verdict')).toHaveFocus()
    await expect(canvas.getByText('合计 商鞅 0.5 : 0 甘龙')).toBeVisible()

    await expect(canvas.queryByText(RAW_ACT_MARKUP)).toBeNull()
    // 纯载荷的 act 行整行不渲染：心声只出现在它自己的卡里一次，那一幕也不留
    // 空标题。
    await expect(canvas.getAllByText('甘龙补上了改革成本。')).toHaveLength(1)
    await expect(canvas.queryByRole('heading', { name: /旁白/ })).toBeNull()
    // 带叙述的 act 行只剥标签，叙述照常在问询段里。
    await expect(canvas.getByText('受损者按新法补偿，三年为限。')).toBeVisible()
  },
}

export const DebugReasoning: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('region', { name: '简要对局结果' })
    await userEvent.click(canvas.getByRole('switch', { name: /调试模式/ }))
    await expect(canvas.getByText('Chain-of-thought 已显示')).toBeVisible()
    await userEvent.click(canvas.getAllByRole('button', { name: /内心/ })[0])
    await expect(canvas.getByText('先立可验证的制度标准。')).toBeVisible()

    // #22②：被吸收的 act 行留下的是真实推演轨迹，它现在挂在心声卡里。
    const beat = canvas.getByText('甘龙补上了改革成本。').closest('div')!
    await userEvent.click(within(beat).getByRole('button', { name: /内心/ }))
    await expect(canvas.getByText('真实推演：先比较两方对执行成本的处理。'))
      .toBeVisible()
  },
}

export const NoInquiryKeepsChronology: Story = {
  parameters: {
    msw: [
      http.get(
        '/v1/matches/9001',
        () => HttpResponse.json(finishedNoInquiryMatch),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const result = await canvas.findByRole('region', { name: '简要对局结果' })
    const dialogue = canvas.getByRole('heading', { name: '对话全文' })
    const verdict = canvas.getByRole('heading', {
      name: '终局裁决',
      level: 2,
    })
    const scoring = canvas.getByRole('heading', { name: '计分推导' })

    await expect(canvas.queryByRole('heading', { name: '问询' })).toBeNull()
    await expect(result.compareDocumentPosition(dialogue) & 4).toBeTruthy()
    await expect(dialogue.compareDocumentPosition(verdict) & 4).toBeTruthy()
    await expect(verdict.compareDocumentPosition(scoring) & 4).toBeTruthy()
    await expect(canvas.getByText('我们同意直接进入最终表决。')).toBeVisible()
  },
}

export const ReplayHidesSpoilers: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('region', { name: '简要对局结果' })
    await userEvent.click(canvas.getByRole('button', { name: '回放' }))
    await expect(canvas.queryByRole('region', { name: '简要对局结果' }))
      .toBeNull()
    await expect(canvas.queryByRole('heading', { name: '问询' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '隐藏目标' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '计分推导' })).toBeNull()
    await expect(canvas.getByRole('heading', { name: '对话重演' }))
      .toBeVisible()
    // 不渲染的行不占步数：两行对话 + 两拍心声 + 两条终局
    // 事件＝6 步，被吸收的 act 行不在其中。
    await expect(canvas.getByText(/^\d+\/6$/)).toBeVisible()
    // 回放是另一条渲染路径，同样一个标签都不许漏。
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await expect(canvas.queryByText(RAW_ACT_MARKUP)).toBeNull()
    await expect(canvas.getByText('甘龙补上了改革成本。')).toBeVisible()
  },
}

export const HarborBallots: Story = {
  parameters: {
    msw: [http.get('/v1/matches/9001', () => HttpResponse.json(harborMatch))],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('region', { name: '简要对局结果' })
    const first = canvas.getByText('真人幕后 · 秘密意向投票结果').parentElement!
    const firstFold = first.querySelector('details')!
    await expect(firstFold).not.toHaveAttribute('open')
    await userEvent.click(firstFold.querySelector('summary')!)
    await expect(within(first).queryByLabelText(/^上次票型：/)).toBeNull()
    await userEvent.click(canvas.getByRole('tab', { name: '第2轮' }))
    const polls = [
      first,
      canvas.getByText('真人幕后 · 秘密意向投票结果').parentElement!,
    ]
    const final = canvas.getByText('十一人最终判决').closest<HTMLElement>(
      '[data-tm="FA.jury-final-vote-reveal"]',
    )!
    const folds = [
      firstFold,
      polls[1].querySelector('details')!,
      final.querySelector('details')!,
    ]
    for (const fold of folds.slice(1)) {
      await expect(fold).not.toHaveAttribute('open')
    }
    await expect(within(polls[1]).getByText('有罪 6 · 无罪 5')).toBeVisible()
    await expect(within(polls[1]).getByLabelText('上次票型：有罪')).not
      .toBeVisible()
    await userEvent.click(folds[1].querySelector('summary')!)
    await expect(within(polls[1]).getByLabelText('上次票型：有罪'))
      .toBeVisible()
    await expect(within(polls[1]).getByLabelText('上次票型：无罪'))
      .toBeVisible()
    const previousGuilty = within(polls[1]).getByLabelText('上次票型：有罪')
    const previousNotGuilty = within(polls[1]).getByLabelText('上次票型：无罪')
    const currentNotGuilty = within(previousGuilty.parentElement!)
      .getByLabelText('当前票型：无罪')
    const currentGuilty = within(previousNotGuilty.parentElement!)
      .getByLabelText('当前票型：有罪')
    await expect(getComputedStyle(previousGuilty).color).toBe(
      getComputedStyle(currentGuilty).color,
    )
    await expect(getComputedStyle(previousNotGuilty).color).toBe(
      getComputedStyle(currentNotGuilty).color,
    )
    await expect(getComputedStyle(currentGuilty).color).not.toBe(
      getComputedStyle(currentNotGuilty).color,
    )
    await expect(parseFloat(getComputedStyle(currentGuilty).fontSize))
      .toBe(parseFloat(getComputedStyle(previousGuilty).fontSize))
    await expect(getComputedStyle(previousGuilty).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(getComputedStyle(currentGuilty).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(previousGuilty.parentElement!.querySelector('svg'))
      .toBeVisible()
    await expect(previousNotGuilty.parentElement!.querySelector('svg'))
      .toBeVisible()
    await expect(parseInt(getComputedStyle(currentGuilty).fontWeight))
      .toBeGreaterThan(parseInt(getComputedStyle(previousGuilty).fontWeight))
    await expect(within(polls[1]).getAllByLabelText('当前票型：有罪'))
      .toHaveLength(6)
    await expect(within(polls[1]).getAllByLabelText('当前票型：无罪'))
      .toHaveLength(5)
    await userEvent.click(folds[1].querySelector('summary')!)
    await expect(within(polls[1]).getByLabelText('上次票型：有罪')).not
      .toBeVisible()
    await userEvent.click(folds[2].querySelector('summary')!)
    await expect(within(final).getByText('陪审员 1')).toBeVisible()
    await expect(within(final).queryByLabelText(/^上次票型：/)).toBeNull()
  },
}

export const HarborReplay: Story = {
  parameters: HarborBallots.parameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('region', { name: '简要对局结果' })
    await userEvent.click(canvas.getByRole('button', { name: '回放' }))
    await expect(canvas.queryByLabelText('上次票型：有罪')).toBeNull()
    await expect(canvas.queryByText('十一人最终判决')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    const polls = canvas.getAllByText('真人幕后 · 秘密意向投票结果')
    await expect(canvas.getByRole('tab', { name: '第2轮' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(polls).toHaveLength(1)
    const second = polls[0].parentElement!
    await userEvent.click(second.querySelector('summary')!)
    await expect(within(second).getByLabelText('上次票型：有罪')).toBeVisible()
    await expect(canvas.queryByText('十一人最终判决')).toBeNull()
  },
}

// A stable, interactive preview; unlike acceptance stories it does not auto-click.
export const HarborPreview: Story = {
  parameters: HarborBallots.parameters,
  decorators: [(Story) => (
    <>
      <p className='mb-4 text-sm text-(--foreground-subtle)'>
        界面预览 · 示例对局（非真实比赛）
      </p>
      <Story />
    </>
  )],
}

export const HarborMissingHistory: Story = {
  parameters: {
    msw: [http.get('/v1/matches/9001', () =>
      HttpResponse.json({
        ...harborMatch,
        turns: harborMatch.turns.map((turn, index) =>
          index === 0
            ? {
              ...turn,
              event: {
                type: 'observer_secret_poll',
                round: 1,
                ballots: [{ juror: 'j01', verdict: 'UNKNOWN' }],
              },
            }
            : turn
        ),
      }))],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('region', { name: '简要对局结果' })
    await userEvent.click(canvas.getByRole('tab', { name: '第2轮' }))
    const poll = canvas.getByText('真人幕后 · 秘密意向投票结果').parentElement!
    await userEvent.click(poll.querySelector('summary')!)
    await expect(within(poll).queryByLabelText(/^上次票型：/)).toBeNull()
    await expect(within(poll).getAllByText('有罪')).toHaveLength(6)
    await expect(within(poll).getAllByText('无罪')).toHaveLength(5)
  },
}
