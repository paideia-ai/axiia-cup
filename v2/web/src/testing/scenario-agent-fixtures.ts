import type {
  AgentVersionDTO,
  MyAgentsResponse,
  ScenarioDetail,
  Side,
} from '../api/types'

// Synthetic navigation fixtures, shared by the manual preview and browser tests.
// Deliberately put the entry agent second, and give side B no entry version.
export const agentPreviewScenarios: ScenarioDetail[] = [
  ['fengyiting-real', '凤仪亭之夜', '董卓', '吕布'],
  ['shangyang-court', '商鞅变法·朝堂辩法', '商鞅', '甘龙'],
  ['honnoji-decision', '本能寺之变·敌在何处', '袭击本能寺', '暂不袭击信长'],
  ['trolley-problem', '电车难题·一人与五人', '奕仁', '武仁'],
  ['legal-harbor-murder-jury', '码头疑云：七号仓命案', '林', '苏'],
].map(([id, title, sideAName, sideBName]) => ({
  summary: {
    id,
    title,
    sideAName,
    sideBName,
    sideALabel: sideAName,
    sideBLabel: sideBName,
    subject: '场景智能体导航预览',
    turnCount: 5,
    gateUnlocked: false,
    gateProgress: {
      a: { beaten: 0, needed: 1 },
      b: { beaten: 0, needed: 1 },
    },
  },
  stages: [],
  presets: [],
}))

export const agentPreviewInventory: MyAgentsResponse = {
  scenarios: agentPreviewScenarios.map(({ summary }, index) => ({
    scenarioID: summary.id,
    title: summary.title,
    gateProgress: summary.gateProgress!,
    entryReady: false,
    sides: {
      a: Array.from({ length: index === 0 ? 13 : 2 }, (_, offset) => {
        const agentID = 1000 + index * 100 + offset
        return {
          agentID,
          name: `方案${offset + 1}`,
          versionCount: 1,
          latestVersionID: agentID * 10,
          entryVersionID: offset === 1 ? agentID * 10 : null,
        }
      }),
      b: [0, 1].map((offset) => ({
        agentID: 1050 + index * 100 + offset,
        name: `备选${offset + 1}`,
        versionCount: 0,
        entryVersionID: null,
      })),
    },
  })),
}

export function previewAgent(agentID: number) {
  for (const scenario of agentPreviewInventory.scenarios) {
    for (const side of ['a', 'b'] as Side[]) {
      const agent = scenario.sides[side].find((item) =>
        item.agentID === agentID
      )
      if (agent) {
        const versions: AgentVersionDTO[] = agent.versionCount === 0 ? [] : [{
          id: agent.latestVersionID!,
          agentID,
          prompt:
            `这是${scenario.title}的模拟策略，仅用于检查页面跳转与同角色切换。`,
          modelID: 'fixture-model',
          ordinal: 1,
          snapshotSeq: 0,
          isEntry: agent.entryVersionID != null,
        }]
        return { agent, scenarioID: scenario.scenarioID, side, versions }
      }
    }
  }
  return null
}
