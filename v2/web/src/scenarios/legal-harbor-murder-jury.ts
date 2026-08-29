import { legalHarborMurderJuryIntro } from './intro-copy'
import type { ScenarioModule } from './types'

const source = legalHarborMurderJuryIntro.source

export const legalHarborMurderJury: ScenarioModule = {
  slotID: 'legal-harbor-murder-jury',
  roles: [],
  intro: legalHarborMurderJuryIntro,
  overviewImages: [
    {
      src: '/scenario-assets/legal-harbor-murder-jury/office-crime-scene.png',
      alt: '港口谋杀案办公室案发现场',
      caption: '办公室案发现场',
    },
    {
      src: '/scenario-assets/legal-harbor-murder-jury/jury-deliberation.jpeg',
      alt: '十一名陪审员围桌审议港口谋杀案',
      caption: '十一名陪审员审议',
    },
  ],
  scoringLabel: '投票规则',
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
    // 同源引用（u04-c10）：陪审团投票制无单一裁判 prompt——9 名 NPC 陪审员的
    // 提示词按 persona 在 script.js 的 main() 内拼装，不属可提取的顶层常量；
    // 该场景在 runtime-quotes.json 显式缺席（见 v2/scenarios/tools/web-quotes.ts）。
    scoring: '11名陪审员各投一票，有罪票达到6票即定罪。',
    background: source.overview.paragraphs.join('\n\n'),
    hiddenGoalHowTo: '本场景没有真假请求式的隐藏目标机制。',
  },
}
