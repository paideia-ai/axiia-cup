import type {
  AgentVersionDTO,
  ConfigResponse,
  MatchDetail,
  MyAgentsResponse,
  NotificationsResponse,
  ScenarioDetail,
  ScenarioListResponse,
} from '../api/types'

export const scenario: ScenarioDetail = {
  summary: {
    id: 'shangyang-court',
    title: '商鞅庭辩',
    subject: '制度与人情的公开辩论',
    sideAName: '商鞅',
    sideBName: '甘龙',
    sideALabel: '主张变法',
    sideBLabel: '主张守旧',
    turnCount: 6,
    gateUnlocked: false,
    gateProgress: {
      a: { beaten: 1, needed: 1 },
      b: { beaten: 0, needed: 1 },
    },
  },
  stages: [
    {
      id: 'debate',
      title: '公开辩论',
      channels: [{ id: 'court', label: '朝堂' }],
    },
    {
      id: 'inquiry',
      title: '问询',
      channels: [{ id: 'inquiry-judge', label: '裁判问询' }],
    },
  ],
  presets: [
    {
      key: 'ganlong-steady',
      side: 'b',
      label: '稳健守旧派',
      modelID: 'fixture-model',
    },
    {
      key: 'shangyang-direct',
      side: 'a',
      label: '强硬变法派',
      modelID: 'fixture-model',
    },
  ],
}

export const unlockedScenario: ScenarioDetail = {
  ...scenario,
  summary: {
    ...scenario.summary,
    gateUnlocked: true,
    gateProgress: {
      a: { beaten: 2, needed: 1 },
      b: { beaten: 1, needed: 1 },
    },
  },
}

export const versions: AgentVersionDTO[] = [
  {
    id: 1001,
    agentID: 101,
    prompt: '先澄清争点，再用最短证据链回应。',
    modelID: 'fixture-model',
    isEntry: false,
    snapshotSeq: 1,
  },
  {
    id: 1002,
    agentID: 101,
    prompt: '承认对方最强论点，再证明变法能降低长期制度成本。',
    modelID: 'fixture-model',
    parentVersionID: 1001,
    isEntry: true,
    snapshotSeq: 2,
  },
]

export const config: ConfigResponse = {
  dailyBattleLimit: 12,
  pvpDailyLimit: 4,
  concurrencyLimit: 2,
  pvpUnlockPerSideWins: 1,
  statsDisplayThreshold: 20,
  promptUnitLimit: 1000,
  models: [{ id: 'fixture-model', label: 'Fixture Model' }],
  visibility: {
    ownerOnly: ['prompt', 'reasoning', 'version_diff'],
  },
  opponentDailyChallengeLimit: 2,
  trialsBlocked: false,
  usage: { battlesToday: 3, pvpBattlesToday: 1 },
}

export const scenarioList: ScenarioListResponse = {
  scenarios: [scenario.summary],
}

export const inventory: MyAgentsResponse = {
  scenarios: [
    {
      scenarioID: scenario.summary.id,
      title: scenario.summary.title,
      sides: {
        a: [{
          agentID: 101,
          versionCount: 2,
          entryVersionID: 1002,
          latestVersionID: 1002,
        }],
        b: [{
          agentID: 102,
          versionCount: 1,
          entryVersionID: null,
          latestVersionID: 1003,
        }],
      },
      gateProgress: scenario.summary.gateProgress!,
      entryReady: false,
    },
  ],
}

export const notificationsFixture: NotificationsResponse = {
  unreadCount: 1,
  notifications: [
    {
      id: 501,
      kind: 'battle_finished',
      matchID: 9001,
      read: false,
    },
    {
      id: 502,
      kind: 'battle_finished',
      matchID: 8999,
      read: true,
    },
  ],
}

export const finishedMatch: MatchDetail = {
  summary: {
    id: 9001,
    scenarioID: scenario.summary.id,
    scenarioTitle: scenario.summary.title,
    kind: 'pve',
    dispatched: true,
    finished: true,
    scored: true,
    winner: 'a',
  },
  currentTurn: 4,
  turns: [
    {
      seq: 0,
      channel: 'court',
      kind: 'dialogue',
      speaker: 'a',
      finalText: '法令公开，奖惩一致，百姓才知道如何安身。',
      reasoning: '先立可验证的制度标准。',
    },
    {
      seq: 1,
      channel: 'court',
      kind: 'dialogue',
      speaker: 'b',
      finalText: '制度若不顾旧俗，也会让执行失去人心。',
      reasoning: '强调迁移成本。',
    },
    {
      seq: 2,
      channel: 'inquiry-judge',
      kind: 'dialogue',
      speaker: 'judge',
      finalText: '双方如何处理改革初期的受损者？',
    },
    {
      seq: 3,
      channel: 'inquiry-judge',
      kind: 'event',
      speaker: 'game',
      finalText: '',
      event: {
        type: 'score',
        trueRequests: { a: '制度可信', b: '迁移补偿' },
        guesses: { a: '迁移补偿', b: '制度可信' },
        scoreA: 7,
        scoreB: 5,
      },
    },
  ],
  verdicts: [
    {
      key: 'os-1',
      afterSeq: 1,
      output: JSON.stringify({
        os: '商鞅提出了可验证标准。',
        attention: '制度能否被执行',
        favor: 'a',
        strength: '弱',
      }),
      model: 'fixture-judge',
    },
    {
      key: 'os-2',
      afterSeq: 2,
      output: JSON.stringify({
        os: '甘龙补上了改革成本。',
        attention: '受损者是否有补偿',
        favor: 'b',
        strength: '中',
      }),
      model: 'fixture-judge',
    },
    {
      key: 'judge',
      afterSeq: 4,
      output: JSON.stringify({
        winner: 'a',
        judgment: '商鞅的制度方案更可检验，且回应了执行问题。',
      }),
      model: 'fixture-judge',
    },
  ],
  scoreA: 7,
  scoreB: 5,
  reasoning: '程序化计分明细：\n商鞅 +7\n甘龙 +5',
  stages: scenario.stages,
  speakerLabels: {
    a: '商鞅',
    b: '甘龙',
    judge: '裁判',
    game: '系统',
  },
}
