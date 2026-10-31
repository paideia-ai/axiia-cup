import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { buildReplaySteps, replayBeats } from '../lib/replay'
import { speakerLabels } from './timeline/labels'
import { OsBeatCard } from './timeline/os-beat-card'
import { JudgeTrendChart } from './judge-trend'

function StanceExample({ legacy = false }: { legacy?: boolean }) {
  const labels = speakerLabels('honnoji-decision', {
    a: '足利义昭的使者',
    b: '明智军中的足轻',
  })
  const verdict = {
    key: 'os-2',
    afterSeq: 4,
    model: 'preview',
    output: JSON.stringify(
      legacy
        ? { os: '足轻说得有理，须有明白军令。', favor: '明智军中的足轻' }
        : {
          os: '足轻要一道明白军令，这话不错。军令便是转向京中，袭击本能寺。',
          stance: '袭击本能寺',
        },
    ),
  }
  return (
    <div style={{ maxWidth: 600, padding: 16 }}>
      <JudgeTrendChart
        labels={labels}
        speakers={['a', 'b']}
        beats={replayBeats(buildReplaySteps([], [verdict]))}
      />
      <OsBeatCard labels={labels} verdict={verdict} />
    </div>
  )
}
const meta = {
  title: 'v3.4/Judge stance',
  component: StanceExample,
} satisfies Meta<typeof StanceExample>
export default meta
type Story = StoryObj<typeof meta>

export const MainDecision: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('group', {
        name: '裁判立场倾向：上为袭击本能寺，下为西进毛利，共 1 拍',
      }),
    ).toBeVisible()
    await expect(canvas.queryByText('明智军中的足轻')).toBeNull()
    await userEvent.click(
      canvas.getByRole('button', { name: '点选查看 os-2 心声' }),
    )
    await expect(canvas.getByText('os-2 · 倾向：袭击本能寺')).toBeVisible()
  },
}
export const HistoricalRole: Story = {
  args: { legacy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: /裁判倾向轨迹（旧版）：/ }))
      .toBeVisible()
    await expect(canvas.queryByText('西进毛利')).toBeNull()
    await expect(canvas.getByText(/当前倾向（旧版）：/)).toBeVisible()
  },
}
