import { legalHarborMurderJuryIntro } from './intro-copy'
import type { ScenarioModule } from './types'

const source = legalHarborMurderJuryIntro.source

export const legalHarborMurderJury: ScenarioModule = {
  slotID: 'legal-harbor-murder-jury',
  roles: [],
  intro: legalHarborMurderJuryIntro,
  laneLabels: {},
  education: {
    hook: source.overview.title,
    difficulty: 3,
    minutes: 35,
    noviceFriendly: false,
    formatLabel: '最多 5 轮陪审团审议',
    winConditions: {
      a: source.participants.sides.a.goal,
      b: source.participants.sides.b.goal,
    },
    judgeSummary: source.participants.judge.paragraphs.join('\n\n'),
    scoring:
      '十一名陪审员各投一票；有罪票达到 6 票，林方胜；有罪票少于 6 票，苏方胜。胜方以 1:0 获胜。',
    background: source.overview.paragraphs.join('\n\n'),
    hiddenGoalHowTo: '本场景没有真假请求式的隐藏目标机制。',
  },
}
