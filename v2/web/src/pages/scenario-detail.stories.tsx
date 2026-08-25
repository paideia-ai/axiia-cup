import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { ScenarioDetail } from '../api/types'
import { ScenarioDetailPage } from './scenario-detail'

const gateProgress = {
  a: { beaten: 0, needed: 1 },
  b: { beaten: 0, needed: 1 },
}

const details: Record<string, ScenarioDetail> = {
  'shangyang-court': {
    summary: {
      id: 'shangyang-court',
      title: '商鞅变法·朝堂辩法',
      subject: '历史',
      sideAName: '商鞅',
      sideBName: '甘龙',
      sideALabel: '自魏入秦的说客，无根无党，惟以变法自荐',
      sideBLabel: '三朝太师，宗室之望，祖制之守',
      turnCount: 5,
      gateUnlocked: false,
      gateProgress,
    },
    stages: [],
    presets: [],
  },
  'honnoji-decision': {
    summary: {
      id: 'honnoji-decision',
      title: '本能寺之变·敌在何处',
      subject: '历史',
      sideAName: '袭击本能寺',
      sideBName: '暂不袭击信长',
      sideALabel: '主张立即起兵',
      sideBLabel: '主张继续西进',
      turnCount: 5,
      gateUnlocked: false,
      gateProgress,
    },
    stages: [],
    presets: [],
  },
  'trolley-problem': {
    summary: {
      id: 'trolley-problem',
      title: '电车难题·一人与五人',
      subject: '伦理',
      sideAName: '奕仁',
      sideBName: '武仁',
      sideALabel: '一人侧',
      sideBLabel: '五人侧',
      turnCount: 15,
      gateUnlocked: false,
      gateProgress,
    },
    stages: [],
    presets: [],
  },
  'fengyiting-real': {
    summary: {
      id: 'fengyiting-real',
      title: '凤仪亭之夜',
      subject: '文学',
      sideAName: '董卓',
      sideBName: '吕布',
      sideALabel: '汉相国',
      sideBLabel: '董卓义子',
      turnCount: 7,
      gateUnlocked: false,
      gateProgress,
    },
    stages: [],
    presets: [],
  },
  'legal-harbor-murder-jury': {
    summary: {
      id: 'legal-harbor-murder-jury',
      title: '码头疑云：七号仓命案',
      subject: '法律',
      sideAName: '林',
      sideBName: '苏',
      sideALabel: '证据足以定罪',
      sideBLabel: '仍有合理怀疑',
      turnCount: 10,
      gateUnlocked: false,
      gateProgress,
    },
    stages: [],
    presets: [],
  },
}

function Surface({ scenarioID }: { scenarioID: keyof typeof details }) {
  return (
    <MemoryRouter initialEntries={[`/scenarios/${scenarioID}`]}>
      <Routes>
        <Route path='/scenarios/:scenarioId' element={<ScenarioDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Scenario detail',
  component: Surface,
  parameters: {
    msw: [
      http.get(
        '/v1/scenarios/:id',
        ({ params }) => HttpResponse.json(details[String(params.id)]),
      ),
      http.get('/v1/my/agents', () => HttpResponse.json({ scenarios: [] })),
    ],
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const ShangyangFourCards: Story = {
  args: { scenarioID: 'shangyang-court' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '商鞅变法 · 朝堂辩法' }),
    ).toBeVisible()
    await expect(canvas.getAllByTestId('scenario-intro-card')).toHaveLength(4)
    await expect(
      canvas.getByText('每侧各赢 ≥1 场 PVE 练习解锁 PVP'),
    ).toBeVisible()
    await expect(canvas.getByText('国策之外，还有隐藏目标')).toBeVisible()
    const hiddenGoalButtons = canvas.getAllByRole('button', {
      name: '隐藏目标列表',
    })
    await expect(hiddenGoalButtons).toHaveLength(2)
    for (const button of hiddenGoalButtons) {
      await expect(button).toHaveAttribute('aria-expanded', 'false')
    }
    await expect(canvas.queryByText('SR1')).toBeNull()
    await expect(canvas.queryByText('GR3')).toBeNull()
    await expect(
      canvas.getByRole('heading', { name: '计分规则' }),
    ).toBeVisible()
    await expect(canvas.getByText('−1')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '去构建商鞅' }))
      .toBeVisible()
    await expect(canvas.queryByText(/深读/)).toBeNull()
  },
}

export const HonnojiFourCards: Story = {
  args: { scenarioID: 'honnoji-decision' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '本能寺之变 · 敌在何处' }),
    ).toBeVisible()
    await expect(canvas.getByText('10 轮深夜军议')).toBeVisible()
    await expect(
      canvas.queryByText(/袭击本能寺\s*对\s*暂不袭击信长/),
    ).toBeNull()
    await expect(canvas.getAllByTestId('scenario-intro-card')).toHaveLength(4)
    await expect(
      canvas.getByRole('heading', {
        level: 4,
        name: '长宗我部元亲阵营的密使',
      }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('heading', { level: 4, name: '明智军中的足轻' }),
    ).toBeVisible()
    const hiddenGoalButtons = canvas.getAllByRole('button', {
      name: '隐藏目标列表',
    })
    await expect(hiddenGoalButtons).toHaveLength(4)
    for (const button of hiddenGoalButtons) {
      await expect(button).toHaveAttribute('aria-expanded', 'false')
    }
    await expect(canvas.queryByText('CM1')).toBeNull()
    await expect(canvas.queryByText('YA3')).toBeNull()
    await expect(canvas.queryByText('HF1')).toBeNull()
    await expect(canvas.queryByText('AS3')).toBeNull()
    await expect(
      canvas.getByRole('heading', { name: '计分规则' }),
    ).toBeVisible()
    await expect(canvas.getByText('−0.75')).toBeVisible()
  },
}

export const TrolleyFourCards: Story = {
  args: { scenarioID: 'trolley-problem' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '电车难题 · 一人与五人' }),
    ).toBeVisible()
    await expect(canvas.getAllByTestId('scenario-intro-card')).toHaveLength(4)
    await expect(
      canvas.getByRole('heading', { name: '袖手旁观，还是双手沾上鲜血？' }),
    ).toBeVisible()
    await expect(canvas.getByText('案件一：原始电车')).toBeVisible()
    await expect(canvas.getByText('案件三：缸中之脑')).toBeVisible()
    await expect(canvas.queryByText('一人侧')).toBeNull()
    await expect(canvas.queryByText('五人侧')).toBeNull()
    await expect(
      canvas.getByRole('img', { name: '失控电车驶向五人，岔轨上有一人' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('img', {
        name: '自动驾驶车面前的两条路线：五名行人与车内一名乘客',
      }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('img', {
        name: '失控电车面前的两条路线：一名维修工与缸中之脑',
      }),
    ).toBeVisible()
    await expect(
      canvas.queryByRole('button', { name: '隐藏目标列表' }),
    ).toBeNull()
  },
}

export const FengyitingFourCards: Story = {
  args: { scenarioID: 'fengyiting-real' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '凤仪亭之夜' }),
    ).toBeVisible()
    const cards = canvas.getAllByTestId('scenario-intro-card')
    await expect(cards).toHaveLength(5)
    const lastCard = within(cards.at(-1)!)
    await expect(
      lastCard.getByRole('heading', { name: '游戏流程' }),
    ).toBeVisible()
    await expect(lastCard.getByText('四场私谈')).toBeVisible()
    await expect(
      canvas.getAllByText(
        '字仲颖，陇西临洮人。率西凉军进入洛阳后废少帝、立献帝，官至相国，把持朝廷与兵权。迁都长安后，司徒王允设下连环计，试图借吕布之手除掉他。',
      ),
    ).toHaveLength(1)
    await expect(
      canvas.getAllByText(
        '字奉先，五原郡九原人，以骁勇善战闻名。原为丁原部将，后因赤兔马与金珠杀死丁原，投奔董卓并拜其为义父，任中郎将、封都亭侯。',
      ),
    ).toHaveLength(1)
    const backgroundCard = within(cards[0]!)
    await expect(backgroundCard.queryByText(/字仲颖/)).toBeNull()
    await expect(backgroundCard.queryByText(/字奉先/)).toBeNull()
    await expect(backgroundCard.queryByText(/三国演义/)).toBeNull()
    await expect(
      canvas.getByRole('heading', { name: '裁判与胜负规则' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('heading', { name: '胜负规则' }),
    ).toBeVisible()
    await expect(canvas.getByText('貂蝉终局选择的角色获胜')).toBeVisible()
    await expect(
      canvas.queryByText(/正史未记载其姓名/),
    ).toBeNull()
    await expect(
      canvas.queryByRole('button', { name: '隐藏目标列表' }),
    ).toBeNull()
    await expect(canvas.getByRole('button', { name: '去构建董卓' }))
      .toBeVisible()
  },
}

export const HarborFourCards: Story = {
  args: { scenarioID: 'legal-harbor-murder-jury' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '码头疑云 · 七号仓命案' }),
    ).toBeVisible()
    await expect(canvas.getAllByTestId('scenario-intro-card')).toHaveLength(4)
    await expect(canvas.getByText('E5 · 改口与未求助')).toBeVisible()
    await expect(canvas.getByText('九名普通陪审员')).toBeVisible()
    await expect(
      canvas.getByRole('heading', { name: '裁判与投票规则' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('heading', { name: '投票规则' }),
    ).toBeVisible()
    await expect(
      canvas.getByText('11名陪审员各投一票，11票中超过6票方胜。'),
    ).toBeVisible()
    await expect(
      canvas.queryByText(/林和苏以陪审员身份参加审议/),
    ).toBeNull()
    await expect(
      canvas.queryByText(/不会给案件增加新事实/),
    ).toBeNull()
    await expect(
      canvas.queryByRole('button', { name: '隐藏目标列表' }),
    ).toBeNull()
    await expect(canvas.getByRole('button', { name: '去构建苏' })).toBeVisible()
  },
}
