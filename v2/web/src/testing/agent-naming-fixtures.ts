import type { MatchSummary } from '../api/types'
import { historyFixture } from './history-fixtures'

export const namingAgentID = 400
export const namingCurrentName = '稳健派'

export function agentNamingFixtures(): MatchSummary[] {
  return ['初出茅庐', '稳健派', null, '稳健派'].map((name, i) => ({
    ...historyFixture(),
    id: 8101 + i,
    kind: i === 2 ? 'pve' : 'pvp',
    createdAt: 1793420000 + i * 100,
    dispatched: i !== 3,
    finished: i !== 3,
    scored: i !== 3,
    winner: i === 3 ? null : 'a',
    participants: {
      a: {
        agentID: namingAgentID,
        versionID: 9001 + i,
        agentName: name,
        ownerDisplayName: '演示选手',
        modelID: 'glm-5.2',
        isMine: true,
      },
      b: i === 2
        ? {
          presetKey: 'lvbu-default',
          presetLabel: '勇而多疑',
          modelID: 'glm-5.2',
          isMine: false,
        }
        : {
          agentID: 401,
          versionID: 9010,
          agentName: '以退为进',
          ownerDisplayName: '小舟',
          modelID: 'glm-5.2',
          isMine: false,
        },
    },
  }))
}
