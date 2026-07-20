/**
 * Static mock data for all mock pages.
 * Edit this file to change what the mock pages display.
 */

export const mockUser = {
  displayName: 'Alice',
  email: 'alice@example.com',
  isAdmin: false,
}

export const mockScenario = {
  id: 'shangyang-court',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  turnCount: 5,
  falseInfoCount: 1,
  trueRequestCount: 2,
  roleAName: '商鞅',
  roleBName: '甘龙',
  roleAOptions: [],
  roleBOptions: [],
  roleAHiddenInfo: [
    { id: 'A1', content: '秦国军队在河西之战中损失惨重，急需改革军功制度。' },
    { id: 'A2', content: '魏国商人已秘密向秦国走私铁器，变法可利用此渠道。' },
    { id: 'A3', content: '秦孝公曾私下表示对旧贵族势力的不满。' },
  ],
  roleBHiddenInfo: [
    { id: 'B1', content: '楚国变法失败导致国力衰退，前车之鉴不可忽视。' },
    { id: 'B2', content: '秦国边境部落首领已表示，若废除旧制将发动叛乱。' },
    { id: 'B3', content: '秦孝公的母族是旧贵族中最有势力的一支。' },
  ],
  roleARequests: [
    { id: 'RA1', content: '请求秦孝公颁布「军功爵制」，以战功取代世袭。' },
    {
      id: 'RA2',
      content: '请求秦孝公下令「废井田、开阡陌」，允许土地自由买卖。',
    },
    { id: 'RA3', content: '请求秦孝公设立县制，派遣官吏取代封地贵族。' },
  ],
  roleBRequests: [
    { id: 'RB1', content: '请求秦孝公维持「世卿世禄」制度，保障贵族权益。' },
    { id: 'RB2', content: '请求秦孝公以渐进方式改良，而非激进变法。' },
    { id: 'RB3', content: '请求秦孝公先平定边境，再议内政改革。' },
  ],
  agentPromptTemplate:
    '你是{{roleName}}，正在秦孝公面前与{{opponentName}}辩论。\n\n你的隐藏信息：\n{{hiddenInfo}}\n\n你的诉求：\n{{requests}}\n\n对手的诉求：\n{{opponentRequests}}\n\n本次辩论共 {{turnCount}} 轮。',
  examinationQuestionTemplate:
    '请问{{roleName}}，你认为对手的哪条隐藏信息最可能是假的？',
  judgePrompt:
    '你是秦孝公，正在听取商鞅与甘龙的朝堂辩论。你需要根据双方的论述做出裁决。你更倾向于务实、可行的方案，看重论据的具体性和可执行性。',
}

export const mockStats = {
  winRate: 68.5,
  completedMatchCount: 12,
  rank: 3,
  currentVersion: 5,
  scenarioTitle: '商鞅变法·朝堂辩法',
  tournamentRound: 4,
  pendingMatchCount: 2,
  submissionCount: 5,
}

export const mockRecentMatches = [
  {
    id: 301,
    opponentName: 'Bob',
    scenarioTitle: '商鞅变法·朝堂辩法',
    mySide: 'a' as const,
    model: 'deepseek-v3',
    status: 'scored' as const,
    winner: 'a' as const,
    scoreA: 1.5,
    scoreB: -0.5,
    createdAt: '2026-04-20T10:30:00Z',
  },
  {
    id: 298,
    opponentName: 'Charlie',
    scenarioTitle: '商鞅变法·朝堂辩法',
    mySide: 'b' as const,
    model: 'qwen-max',
    status: 'scored' as const,
    winner: 'b' as const,
    scoreA: 0,
    scoreB: 0.25,
    createdAt: '2026-04-19T15:20:00Z',
  },
  {
    id: 295,
    opponentName: 'Diana',
    scenarioTitle: '商鞅变法·朝堂辩法',
    mySide: 'a' as const,
    model: 'deepseek-v3',
    status: 'scored' as const,
    winner: 'draw' as const,
    scoreA: 0.5,
    scoreB: 0.5,
    createdAt: '2026-04-18T09:10:00Z',
  },
  {
    id: 290,
    opponentName: 'Eve',
    scenarioTitle: '商鞅变法·朝堂辩法',
    mySide: 'b' as const,
    model: 'deepseek-v3',
    status: 'running' as const,
    winner: null,
    scoreA: null,
    scoreB: null,
    createdAt: '2026-04-21T01:00:00Z',
  },
]

export const mockLeaderboard = [
  {
    submissionId: 1,
    rank: 1,
    playerName: 'Kurt',
    modelA: 'deepseek-v3',
    modelB: 'deepseek-v3',
    wins: 4,
    losses: 1,
    roleAWins: 2,
    roleALosses: 0,
    roleBWins: 2,
    roleBLosses: 1,
    buchholz: 6.5,
    winRate: 80.0,
  },
  {
    submissionId: 2,
    rank: 2,
    playerName: 'Tachi',
    modelA: 'qwen-max',
    modelB: 'qwen-max',
    wins: 3.5,
    losses: 1.5,
    roleAWins: 2,
    roleALosses: 0.5,
    roleBWins: 1.5,
    roleBLosses: 1,
    buchholz: 5.0,
    winRate: 70.0,
  },
  {
    submissionId: 3,
    rank: 3,
    playerName: 'Alice',
    modelA: 'deepseek-v3',
    modelB: 'deepseek-v3',
    wins: 3,
    losses: 2,
    roleAWins: 1.5,
    roleALosses: 1,
    roleBWins: 1.5,
    roleBLosses: 1,
    buchholz: 4.5,
    winRate: 68.5,
  },
  {
    submissionId: 4,
    rank: 4,
    playerName: 'Bob',
    modelA: 'deepseek-v3',
    modelB: 'qwen-max',
    wins: 2,
    losses: 3,
    roleAWins: 1,
    roleALosses: 1.5,
    roleBWins: 1,
    roleBLosses: 1.5,
    buchholz: 3.0,
    winRate: 40.0,
  },
  {
    submissionId: 5,
    rank: 5,
    playerName: 'Charlie',
    modelA: 'qwen-max',
    modelB: 'qwen-max',
    wins: 1,
    losses: 4,
    roleAWins: 0.5,
    roleALosses: 2,
    roleBWins: 0.5,
    roleBLosses: 2,
    buchholz: 1.5,
    winRate: 20.0,
  },
]

export const mockMatchTranscript = [
  {
    speaker: 'a' as const,
    content:
      '秦公，臣商鞅以为，秦欲强必变法。观魏国李悝变法、楚国吴起变法，凡变法者国强，守旧者国衰。今秦地处西陲，若不改革军功制度，何以与东方六国争雄？臣请秦公下令推行「军功爵制」，使有功者升爵，无功者虽贵必贬。',
  },
  {
    speaker: 'b' as const,
    content:
      '秦公，甘龙以为商鞅之言太过偏激。楚国吴起变法，确实一时国强，然吴起身死法灭，楚国反而陷入内乱。变法并非不可为，但须循序渐进。祖宗之法行之百年，一朝废弃，恐引朝野震荡。臣以为当先稳内政，再图改革。',
  },
  {
    speaker: 'a' as const,
    content:
      '甘龙所言楚国之例，恰恰说明变法不彻底之害，非变法本身之过。吴起变法因贵族反扑而功亏一篑，正是因为未能一次性铲除旧势力。今秦孝公英明，若能坚定支持变法，以法治国，则可避免楚国旧辙。况且，秦国军队在河西之战中损失惨重，急需改革军功制度以振军威。',
  },
  {
    speaker: 'b' as const,
    content:
      '商鞅口口声声说楚国变法不彻底，可曾想过变法之所以不彻底，正是因为阻力太大？秦国旧贵族盘根错节，岂是一纸法令可以撼动的？况且，秦国边境部落首领已表示不满，若贸然废除旧制，恐怕外患未平又添内乱。当务之急是先平定边境，再议内政改革。',
  },
  {
    speaker: 'a' as const,
    content:
      '甘龙此言差矣。正是因为不变法，秦国才积弱至此，边境才不稳。推行军功爵制，让士兵看到上升之路，军心自然凝聚。臣恳请秦公颁布「废井田、开阡陌」之令，允许土地自由买卖，使百姓勤于耕作，国库充盈，如此方能内强外固。',
  },
]

export const mockMatchDetail = {
  id: 277,
  tournamentId: 8,
  roundNumber: 3,
  status: 'scored' as const,
  playerADisplayName: 'Kurt',
  playerBDisplayName: 'Tachi',
  playerAModel: 'deepseek-v3',
  playerBModel: 'qwen-max',
  scoreA: 1.5,
  scoreB: -0.5,
  winner: 'a' as const,
  transcript: mockMatchTranscript,
  reasoning:
    '本场辩论中，商鞅（Kurt）的论述更具说服力。商鞅方引用了具体的军事困境（河西之战损失），提出了明确的改革方案（军功爵制、废井田），并有效反驳了甘龙的渐进论。甘龙（Tachi）虽然提出了楚国前车之鉴，但未能提供具体的替代方案，仅主张"先稳后改"，缺乏可执行性。综合双方表现，裁定商鞅方胜出。',
  error: null,
  currentTurn: 5,
  infoAssignment: {
    roleAFalseInfoIds: ['A2'],
    roleBFalseInfoIds: ['B3'],
    roleATrueRequestIds: ['RA1', 'RA2'],
    roleBTrueRequestIds: ['RB1', 'RB2'],
  },
  judgeDecision: {
    ruling: '支持变法',
    side: 'a' as const,
    roleARequestDecisions: [
      { requestId: 'RA1', granted: true },
      { requestId: 'RA2', granted: true },
      { requestId: 'RA3', granted: false },
    ],
    roleBRequestDecisions: [
      { requestId: 'RB1', granted: false },
      { requestId: 'RB2', granted: false },
      { requestId: 'RB3', granted: true },
    ],
  },
  judgeOs: [],
  judgeOsFailedTurns: [],
  judgeOsProvenance: null,
  judgeTranscriptA: [
    {
      round: 1,
      question:
        '商鞅，你提到河西之战损失惨重。具体损失了多少兵力？这些数据从何而来？',
      answer:
        '秦公，河西之战我军损兵折将逾万人，此乃前线将领呈报之军情。正因如此，臣才力主改革军功制度，以战功激励士气。',
      selectedInfoId: 'B3',
      isCorrect: true,
    },
  ],
  judgeTranscriptB: [
    {
      round: 1,
      question: '甘龙，你说边境部落首领不满。他们具体提出了什么要求？',
      answer:
        '秦公，边境部落首领曾派使者言明，若废除世袭封地，他们将不再为秦戍边，甚至可能联合外敌反叛。',
      selectedInfoId: 'A1',
      isCorrect: false,
    },
  ],
  scenarioId: 'shangyang-court',
}

export const mockSubmissions = [
  {
    id: 42,
    version: 5,
    promptA:
      '你是商鞅，在辩论中强调变法对军事力量的具体提升，用河西之战的惨败作为论据……',
    promptB: '你是甘龙，以楚国变法失败为切入点，强调渐进改良的重要性……',
    modelA: 'deepseek-v3',
    modelB: 'deepseek-v3',
    createdAt: '2026-04-20T08:00:00Z',
  },
  {
    id: 38,
    version: 4,
    promptA: '你是商鞅，专注于经济改革论述……',
    promptB: '你是甘龙，以民生稳定为核心论点……',
    modelA: 'deepseek-v3',
    modelB: 'qwen-max',
    createdAt: '2026-04-18T14:30:00Z',
  },
]
