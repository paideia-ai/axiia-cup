import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { finishedMatch } from '../testing/v34-fixtures'
import { MatchDetailPage } from './match-detail'

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

// act 生成的原始标签一个字都不该出现在战报里（#22）——心声卡已经渲染过同一份
// 内容，标签本身是引擎向模型索要的格式。
const RAW_ACT_MARKUP = /<(os|attention|favor|strength|reason|guess)>/

export const FinishedScored: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const result = await canvas.findByRole('heading', { name: '结果' })
    const dialogue = canvas.getByRole('heading', { name: '对话全文' })
    const inquiry = canvas.getByRole('heading', { name: '问询' })
    // F2 · #69：隐藏目标五步区块独立成段，位于问询与计分推导之间。
    const hiddenGoal = canvas.getByRole('heading', { name: '隐藏目标' })
    const scoring = canvas.getByRole('heading', { name: '计分推导' })

    await expect(result.compareDocumentPosition(dialogue) & 4).toBeTruthy()
    await expect(dialogue.compareDocumentPosition(inquiry) & 4).toBeTruthy()
    await expect(inquiry.compareDocumentPosition(hiddenGoal) & 4).toBeTruthy()
    await expect(hiddenGoal.compareDocumentPosition(scoring) & 4).toBeTruthy()
    await expect(canvas.queryByText('先立可验证的制度标准。')).toBeNull()
    // F7：胜负行与徽记带「我方」视角（fixture 的 a 侧 isMine）。
    await expect(canvas.getAllByText('我方（商鞅）胜')).toHaveLength(2)
    // F2：得分账是逐项账目——「被识破」的扣分既是账目表明确的一行，也是
    // 五步区块里的一步；结果卡的签名明细与合计都与 scoreA/scoreB 同源。
    await expect(canvas.getByText('真目标 SR2 被甘龙识破')).toBeVisible()
    await expect(canvas.getByText('被识破 -1')).toBeVisible()
    await expect(
      canvas.getByText('商鞅 +1 大政方针 · +0.5 真请求获准 · -1 被识破 = 0.5'),
    ).toBeVisible()
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
    await canvas.findByRole('heading', { name: '结果' })
    await userEvent.click(canvas.getByRole('switch', { name: /调试模式/ }))
    await userEvent.click(canvas.getAllByRole('button', { name: /内心/ })[0])
    await expect(canvas.getByText('先立可验证的制度标准。')).toBeVisible()

    // #22②：被吸收的 act 行留下的是真实推演轨迹，它现在挂在心声卡里。
    const beat = canvas.getByText('甘龙补上了改革成本。').closest('div')!
    await userEvent.click(within(beat).getByRole('button', { name: /内心/ }))
    await expect(canvas.getByText('真实推演：先比较两方对执行成本的处理。'))
      .toBeVisible()
  },
}

export const ReplayHidesSpoilers: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: '结果' })
    await userEvent.click(canvas.getByRole('button', { name: '回放' }))
    await expect(canvas.queryByRole('heading', { name: '结果' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '问询' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '隐藏目标' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '计分推导' })).toBeNull()
    await expect(canvas.getByRole('heading', { name: '对话重演' }))
      .toBeVisible()
    // 不渲染的行不占步数：两行对话 + 两拍心声＝4 步，被吸收的 act 行不在其中。
    await expect(canvas.getByText(/^\d+\/4$/)).toBeVisible()
    // 回放是另一条渲染路径，同样一个标签都不许漏。
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await userEvent.click(canvas.getByRole('button', { name: '步进' }))
    await expect(canvas.queryByText(RAW_ACT_MARKUP)).toBeNull()
    await expect(canvas.getByText('甘龙补上了改革成本。')).toBeVisible()
  },
}
