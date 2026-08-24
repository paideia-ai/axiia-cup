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

// snapshotSeq 故意非线性（0/4，复刻线上真实数据）：任何按 snapshotSeq 渲染版本
// 号的回归都会让 Agent surfaces 的 play 测试变红。
export const versions: AgentVersionDTO[] = [
  {
    id: 1001,
    agentID: 101,
    prompt: '先澄清争点，再用最短证据链回应。',
    modelID: 'fixture-model',
    isEntry: false,
    ordinal: 1,
    snapshotSeq: 0,
  },
  {
    id: 1002,
    agentID: 101,
    prompt: '承认对方最强论点，再证明变法能降低长期制度成本。',
    modelID: 'fixture-model',
    parentVersionID: 1001,
    isEntry: true,
    ordinal: 2,
    snapshotSeq: 4,
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
    // F7：participants 让战报胜负行有「我方/对方」视角可用（G20：isMine
    // 只对请求者本人计算）。
    participants: {
      a: {
        agentID: 101,
        versionID: 1002,
        ownerDisplayName: '测试玩家',
        modelID: 'fixture-model',
        isMine: true,
      },
      b: {
        presetKey: 'ganlong-steady',
        modelID: 'fixture-model',
        isMine: false,
      },
    },
  },
  currentTurn: 6,
  // seq 2 与 seq 4 是 act 行：同一次生成既写成 verdict（心声/问询卡），又把带
  // 标签的原始回复写成时间线行（#22）。前者整行都是结构化载荷（行不该渲染，
  // 真实推演轨迹随卡走），后者叙述在前、标签在后（只该剥标签）。
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
      channel: 'judge-aside',
      kind: 'dialogue',
      speaker: 'judge',
      finalText:
        '<os>甘龙补上了改革成本。</os>\n<attention>受损者是否有补偿</attention>\n<favor>b</favor>\n<strength>中</strength>',
      reasoning: '真实推演：先比较两方对执行成本的处理。',
    },
    {
      seq: 3,
      channel: 'inquiry-judge',
      kind: 'dialogue',
      speaker: 'judge',
      finalText: '双方如何处理改革初期的受损者？',
    },
    {
      seq: 4,
      channel: 'inquiry-judge',
      kind: 'dialogue',
      speaker: 'a',
      finalText:
        '受损者按新法补偿，三年为限。\n<reason>先给可执行的补偿口径</reason>\n<guess>GR1</guess>',
      reasoning: '真实推演：把补偿口径说死，再猜对方真目标。',
    },
    {
      seq: 5,
      channel: 'inquiry-judge',
      kind: 'event',
      speaker: 'game',
      finalText: '',
      event: {
        type: 'score',
        trueRequests: { a: 'SR2', b: 'GR2' },
        guesses: { a: 'GR1', b: 'SR2' },
        // round4 评审 #8：脚本 add() 的结构化账目随事件下发，与下方
        // reasoning 散文逐条对应——前端优先直读这里，散文只是回退。
        ledger: [
          { side: 'a', delta: 1, why: '秦孝公决意推行变法，大政方针达成' },
          { side: 'a', delta: 0.5, why: '真请求 SR2 获准' },
          { side: 'a', delta: -1, why: '真目标 SR2 被甘龙识破' },
        ],
        scoreA: 0.5,
        scoreB: 0,
        winner: 'a',
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
      key: 'inquiry-a',
      afterSeq: 4,
      output: JSON.stringify({
        reason: '先给可执行的补偿口径',
        guess: 'GR1',
      }),
      model: 'fixture-judge',
    },
    {
      key: 'judge',
      afterSeq: 6,
      output: JSON.stringify({
        winner: 'a',
        judgment: '商鞅的制度方案更可检验，且回应了执行问题。',
      }),
      model: 'fixture-judge',
    },
  ],
  scoreA: 0.5,
  scoreB: 0,
  // F2：reasoning 用商鞅脚本的真实形态（名字 ±delta：理由 + 重复的真目标/
  // 问询前置行 + 开发者收尾行），让得分账解析与隐藏目标五步走真路径。
  reasoning: [
    '程序化计分明细：',
    '真目标：商鞅 = SR2，甘龙 = GR2',
    '问询：商鞅猜 GR1，甘龙猜 SR2',
    '商鞅 +1：秦孝公决意推行变法，大政方针达成',
    '商鞅 +0.5：真请求 SR2 获准',
    '商鞅 -1：真目标 SR2 被甘龙识破',
    'scoreA = 0.5, scoreB = 0',
  ].join('\n'),
  // 心声阶段只有那一行纯载荷 act：它被吸收后这一幕整段不出现，连空标题都
  // 不该留下。
  stages: [
    ...scenario.stages,
    {
      id: 'aside',
      title: '旁白',
      channels: [{ id: 'judge-aside', label: '裁判旁白' }],
    },
  ],
  speakerLabels: {
    a: '商鞅',
    b: '甘龙',
    judge: '裁判',
    game: '系统',
  },
}
