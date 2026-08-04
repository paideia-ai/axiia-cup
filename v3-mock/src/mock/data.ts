import type { Npc, Scenario } from './types'

// 场景内容属 §C1（规格不管），这里的文案是 mock——展示系统形态用。
// MCQ 全场景上线（#15），所以每个场景都配 deck；deck 内容按场景配置。

export const SCENARIOS: Scenario[] = [
  {
    id: 'shangyang',
    subject: '历史',
    name: '商鞅变法',
    oneLiner: '公元前 359 年，秦孝公殿前，变法派与守旧派的生死辩论。',
    difficulty: 'easy',
    beginnerFriendly: true,
    estimatedMinutes: 8,
    isNew: false,
    createdAt: '2026-04-01',
    background:
      '秦孝公即位，国力困弱，山东六国卑秦。卫人商鞅入秦，请行变法；甘龙、杜挚等老臣以「法古无过，循礼无邪」相抗。孝公坐于殿上，听双方陈词，将决定秦国百年国运。',
    sideA: {
      name: '商鞅（变法派）',
      publicRequirements: '说服秦孝公推行变法：废井田、开阡陌、行县制、立军功爵。',
      hiddenInfoSummary: '可能持有魏国即将攻秦的密报（每局随机真假）。',
      actionFocus: '以强国之利打动孝公，化解「祖宗之法不可变」的攻势。',
      optionalStances: ['以魏国威胁立论', '以徕民垦荒立论', '以军功激励立论'],
      openingStatement: '「治世不一道，便国不法古。汤武不循古而王，夏殷不易礼而亡。」',
    },
    sideB: {
      name: '甘龙（守旧派）',
      publicRequirements: '说服秦孝公维持祖制，驳斥变法之议。',
      hiddenInfoSummary: '可能掌握商鞅在魏国不得志的旧事（每局随机真假）。',
      actionFocus: '以变法动摇国本、得罪宗室为攻击点，稳住孝公的疑虑。',
      optionalStances: ['以宗室反弹立论', '以民不习新法立论', '以商鞅来历立论'],
      openingStatement: '「圣人不易民而教，知者不变法而治。因民而教者，不劳而功成。」',
    },
    victoryConditions: {
      A: '孝公倾向变法，或在问询中认可变法派论证更有力。',
      B: '孝公搁置变法，或认定守旧派论证更稳妥。',
    },
    boundaries: ['不得跳出角色', '不得引用辩论时点之后的史实', '不得攻击对方玩家本人'],
    dialogueTurns: 12,
    phases: null,
    hiddenInfoTruthConfig: '双方各有一条隐藏情报，每局开局独立随机真/假（各 50%）。',
    postGameInquiry: '对话结束后，孝公分别向双方各提 2 问，再给出裁决。',
    judgePersona: '秦孝公——务实、多疑，渴望强国但畏惧动荡。',
    judgePromptSummary: '以强国实效为最高标准评判，兼顾可行性与风险；对空谈斥之。',
    judgePrompt:
      '你是秦孝公。你听完变法派与守旧派的殿前辩论。你最关心：秦国能否变强？代价几何？谁的论证扎实、谁在虚张声势？先分别问询双方，再按计分维度逐项给分，最后以散文说明裁决理由。',
    judgeModel: 'kimi-k2.5',
    scoringModel: 'kimi-k2.5',
    scoring: [
      { key: 'argument', label: '论证强度', weight: 0.4, kind: 'llm', description: '论点是否扎实、回应是否切中对方要害（LLM 软判断）。' },
      { key: 'persona', label: '角色贴合', weight: 0.2, kind: 'llm', description: '言辞是否符合人物身份与时代。' },
      { key: 'hidden', label: '隐藏目标', weight: 0.3, kind: 'structured', description: '是否达成本局分配的隐藏目标（结构化判定）。' },
      { key: 'boundary', label: '边界违规', weight: 0.1, kind: 'structured', description: '违反边界约束按次扣分（结构化判定）。' },
    ],
    hiddenGoalsHowTo:
      '每局开局系统从场景目标池给双方各随机分配一个隐藏目标（如「诱使对方引用假情报」）。对人公开 how-to，对对手 agent 隐藏具体分配。',
    mcqDeck: [
      {
        id: 'sy-a-1', side: 'A', title: '商鞅的核心论证路线', multi: false,
        options: [
          { id: 'o1', label: '强国实效优先', fragment: '你以富国强兵的实效为最高论据，反复把辩论拉回「秦国如何变强」。' },
          { id: 'o2', label: '历史变革先例', fragment: '你以汤武革命、五霸更法为先例，论证法古无必然。' },
          { id: 'o3', label: '危机紧迫感', fragment: '你渲染六国环伺的存亡危机，论证不变法即亡国。' },
        ],
      },
      {
        id: 'sy-a-2', side: 'A', title: '面对「祖宗之法」攻击时', multi: false,
        options: [
          { id: 'o1', label: '正面驳斥', fragment: '遇到祖制之说，你直接驳斥：三代不同礼而王，五霸不同法而霸。' },
          { id: 'o2', label: '偷换战场', fragment: '遇到祖制之说，你不纠缠古今，转而质问对方拿什么让秦国变强。' },
        ],
      },
      {
        id: 'sy-a-3', side: 'A', title: '隐藏情报的使用', multi: false,
        options: [
          { id: 'o1', label: '尽早抛出', fragment: '开局即抛出手中情报施压。' },
          { id: 'o2', label: '压轴使用', fragment: '将情报留到对方势头最盛时抛出反打。' },
          { id: 'o3', label: '谨慎存疑', fragment: '你对手中情报存疑，只在能自洽时才引用。' },
        ],
      },
      {
        id: 'sy-b-1', side: 'B', title: '甘龙的核心防线', multi: false,
        options: [
          { id: 'o1', label: '稳定压倒一切', fragment: '你以动荡风险为核心：变法未见其利，先见其乱。' },
          { id: 'o2', label: '循礼而治', fragment: '你以礼法秩序立论：缘法而治者，吏习而民安。' },
          { id: 'o3', label: '攻击变法者', fragment: '你质疑商鞅其人：客卿轻言变法，成则邀功，败则亡走。' },
        ],
      },
      {
        id: 'sy-b-2', side: 'B', title: '对孝公的姿态', multi: false,
        options: [
          { id: 'o1', label: '老臣忠恳', fragment: '你以三朝老臣的恳切姿态说话，处处为君上分忧。' },
          { id: 'o2', label: '据理力争', fragment: '你不惜犯颜直谏，以强硬姿态守住祖制底线。' },
        ],
      },
      {
        id: 'sy-b-3', side: 'B', title: '隐藏情报的使用', multi: false,
        options: [
          { id: 'o1', label: '尽早抛出', fragment: '开局即抛出手中情报打乱对方阵脚。' },
          { id: 'o2', label: '压轴使用', fragment: '将情报留到关键处抛出。' },
        ],
      },
    ],
  },
  {
    id: 'cough',
    subject: '戏剧',
    name: '御前咳嗽案',
    oneLiner: '女王御前，一声咳嗽引发的宫廷罗生门——谁在撒谎？',
    difficulty: 'medium',
    beginnerFriendly: true,
    estimatedMinutes: 10,
    isNew: false,
    createdAt: '2026-04-08',
    background:
      '宫宴之上，女王举杯时殿中有人咳嗽，杯中酒随后被验出微毒。侍酒官与御医各执一词，互指对方可疑。女王亲审二人，限一炷香内断案。',
    sideA: {
      name: '侍酒官',
      publicRequirements: '洗清自己的嫌疑，并给出合理的案情解释。',
      hiddenInfoSummary: '可能知道酒窖钥匙曾离手半刻（随机真假）。',
      actionFocus: '构建时间线自证清白，把疑点引向御医。',
      optionalStances: ['自证时间线', '反指御医', '主张意外污染'],
      openingStatement: '「陛下，臣自酒窖至御前，步步有人证。」',
    },
    sideB: {
      name: '御医',
      publicRequirements: '洗清自己的嫌疑，并解释毒物来源。',
      hiddenInfoSummary: '可能验出毒物并非宫中所有（随机真假）。',
      actionFocus: '以专业知识压制对方叙事，指出侍酒官的破绽。',
      optionalStances: ['以毒理立论', '反指侍酒官', '主张外人投毒'],
      openingStatement: '「陛下，此毒入酒即变色，唯有斟酒之人可掩。」',
    },
    victoryConditions: {
      A: '女王认定侍酒官清白或御医更可疑。',
      B: '女王认定御医清白或侍酒官更可疑。',
    },
    boundaries: ['不得跳出角色', '不得虚构殿外证人到场作证', '不得宣称掌握未分配的物证'],
    dialogueTurns: 16,
    phases: ['陈述', '对质', '御前问询'],
    hiddenInfoTruthConfig: '双方各持一条线索，每局随机真假；假线索被对方戳穿会被裁判记为重大失分。',
    postGameInquiry: '女王在对质结束后各问 3 问，问题针对双方叙事中的矛盾点。',
    judgePersona: '女王——敏锐、缺乏耐心，痛恨被愚弄。',
    judgePromptSummary: '以叙事自洽性为核心评判，抓矛盾、抓撒谎的代价。',
    judgePrompt:
      '你是女王。两名嫌疑人在你面前互相指控。你要抓住每一处时间线矛盾与说辞变化，问询后按计分维度给分，散文说明你信谁、为何。',
    judgeModel: 'deepseek-v3.2',
    scoringModel: 'deepseek-v3.2',
    scoring: [
      { key: 'consistency', label: '叙事自洽', weight: 0.35, kind: 'llm', description: '时间线与说辞是否前后一致。' },
      { key: 'offense', label: '攻击有效', weight: 0.25, kind: 'llm', description: '对对方破绽的攻击是否命中。' },
      { key: 'hidden', label: '隐藏目标', weight: 0.3, kind: 'structured', description: '本局隐藏目标达成判定。' },
      { key: 'boundary', label: '边界违规', weight: 0.1, kind: 'structured', description: '违规按次扣分。' },
    ],
    hiddenGoalsHowTo: '每局从目标池随机分配（如「让对方在问询中改口一次」）。',
    mcqDeck: [
      {
        id: 'ch-a-1', side: 'A', title: '侍酒官的辩护重心', multi: false,
        options: [
          { id: 'o1', label: '时间线自证', fragment: '你以完整时间线自证，每一步都给出人证。' },
          { id: 'o2', label: '全力反指', fragment: '你把重心放在指控御医，以攻代守。' },
        ],
      },
      {
        id: 'ch-b-1', side: 'B', title: '御医的辩护重心', multi: false,
        options: [
          { id: 'o1', label: '毒理专业压制', fragment: '你以毒理细节立论，用专业知识建立可信度。' },
          { id: 'o2', label: '全力反指', fragment: '你把重心放在指控侍酒官，以攻代守。' },
        ],
      },
    ],
  },
  {
    id: 'fengyi',
    subject: '历史',
    name: '凤仪亭之夜',
    oneLiner: '长安城密报交错的一夜，吕布与李儒在董卓面前的信息战。',
    difficulty: 'hard',
    beginnerFriendly: false,
    estimatedMinutes: 15,
    isNew: false,
    createdAt: '2026-06-20',
    background:
      '凤仪亭掷戟之后，董卓盛怒未消。李儒劝进「以貂蝉赐布」之策，吕布欲自辩且离间。两人先后面见董卓，各怀真假难辨的密报与目的。',
    sideA: {
      name: '吕布',
      publicRequirements: '化解掷戟之嫌，离间董卓与李儒。',
      hiddenInfoSummary: '持有王允送来的多条情报，真假混杂（随机配置）。',
      actionFocus: '利用信息差取信董卓，同时不暴露与王允的往来。',
      optionalStances: ['以忠自辩', '构陷李儒', '以外敌转移'],
      openingStatement: '「义父，儿有肺腑之言，亦有紧急军情。」',
    },
    sideB: {
      name: '李儒',
      publicRequirements: '稳住董卓，促成安抚吕布之策，并试探吕布异心。',
      hiddenInfoSummary: '掌握城中细作对吕布行踪的报告（随机真假）。',
      actionFocus: '以谋士之智拆穿吕布话术，同时不激化局面。',
      optionalStances: ['安抚为主', '试探为主', '直陈布有异心'],
      openingStatement: '「相国息怒，布乃虎将，杀之可惜，逐之遗患。」',
    },
    victoryConditions: {
      A: '董卓迁怒李儒或采信吕布的叙事。',
      B: '董卓维持对李儒的信任并对吕布起疑。',
    },
    boundaries: ['不得跳出角色', '不得引用演义时间线之后的事件', '不得直接杀死对方角色'],
    dialogueTurns: 20,
    phases: ['单独陈情', '当面对质', '相国问询'],
    hiddenInfoTruthConfig: '情报池 6 条，每局随机抽 3 条分配并独立定真假；真假比例场景配置。',
    postGameInquiry: '董卓对质后各问 3 问，问题偏向「你如何证明」。',
    judgePersona: '董卓——多疑暴戾，但对利害极敏感。',
    judgePromptSummary: '以「谁的叙事让董卓更有安全感」评判；被拆穿的谎言代价极高。',
    judgePrompt:
      '你是董卓。你刚经历掷戟之怒。你听两人陈情与对质，你只关心：谁在骗你？谁对你更有用？问询后逐维度给分，散文裁决。',
    judgeModel: 'glm-5',
    scoringModel: 'glm-5',
    scoring: [
      { key: 'infowar', label: '信息战', weight: 0.4, kind: 'llm', description: '情报的取信、隐匿与拆穿。' },
      { key: 'persona', label: '角色贴合', weight: 0.15, kind: 'llm', description: '言行符合人物。' },
      { key: 'hidden', label: '隐藏目标', weight: 0.35, kind: 'structured', description: '本局隐藏目标达成判定。' },
      { key: 'boundary', label: '边界违规', weight: 0.1, kind: 'structured', description: '违规按次扣分。' },
    ],
    hiddenGoalsHowTo: '每局从情报池随机抽取分配，真假独立随机；达成判定结构化。',
    mcqDeck: [
      {
        id: 'fy-a-1', side: 'A', title: '吕布的主策略', multi: false,
        options: [
          { id: 'o1', label: '以忠动人', fragment: '你以父子之情与战功自辩，先稳住董卓再图离间。' },
          { id: 'o2', label: '猛攻李儒', fragment: '你直指李儒之策包藏私心，火力全开。' },
        ],
      },
      {
        id: 'fy-b-1', side: 'B', title: '李儒的主策略', multi: false,
        options: [
          { id: 'o1', label: '稳局优先', fragment: '你先平息董卓怒气，把对质引到可控节奏。' },
          { id: 'o2', label: '设套试探', fragment: '你布下言语陷阱，诱吕布在细节上露馅。' },
        ],
      },
    ],
  },
  {
    id: 'trolley',
    subject: '哲学',
    name: '电车难题听证会',
    oneLiner: '伦理委员会听证：功利主义者与义务论者的正面交锋。',
    difficulty: 'medium',
    beginnerFriendly: false,
    estimatedMinutes: 12,
    isNew: true,
    createdAt: '2026-07-30',
    background:
      '自动驾驶事故后的伦理听证会。功利主义代表与义务论代表就「系统应如何取舍」当面辩论，委员会主席将裁定哪一方的框架写入行业准则。',
    sideA: {
      name: '功利主义代表',
      publicRequirements: '论证以结果最优为准则的取舍框架。',
      hiddenInfoSummary: '可能持有事故模拟数据（随机真假）。',
      actionFocus: '用数字与后果说话，拆解义务论的绝对律令。',
      optionalStances: ['统计生命观', '规则功利主义', '两害相权'],
      openingStatement: '「五条生命与一条生命，不是哲学游戏，是每天发生的工程决策。」',
    },
    sideB: {
      name: '义务论代表',
      publicRequirements: '论证不可将人仅作手段的底线框架。',
      hiddenInfoSummary: '可能掌握该模拟数据的方法论缺陷（随机真假）。',
      actionFocus: '守住人的尊严不可计算这条线，揭露功利计算的滑坡。',
      optionalStances: ['绝对律令', '权利优先', '程序正义'],
      openingStatement: '「一旦允许系统主动选择牺牲谁，每个人都成了可计算的变量。」',
    },
    victoryConditions: {
      A: '主席裁定采纳后果主义框架。',
      B: '主席裁定采纳义务论框架。',
    },
    boundaries: ['不得人身攻击', '不得虚构不存在的法规条文'],
    dialogueTurns: 14,
    phases: null,
    hiddenInfoTruthConfig: '双方各一条数据类隐藏信息，随机真假。',
    postGameInquiry: '主席各问 2 问，聚焦框架的边界情形。',
    judgePersona: '伦理委员会主席——克制、程序化，重论证质量。',
    judgePromptSummary: '按论证质量与边界情形处理能力评判，不预设立场。',
    judgePrompt:
      '你是伦理委员会主席。听完双方辩论与问询后，按维度给分并以散文说明采纳哪一方框架、为何。',
    judgeModel: 'qwen3-max',
    scoringModel: 'qwen3-max',
    scoring: [
      { key: 'rigor', label: '论证严谨', weight: 0.45, kind: 'llm', description: '推理链条与对反例的处理。' },
      { key: 'edge', label: '边界情形', weight: 0.25, kind: 'llm', description: '问询中对边界情形的应对。' },
      { key: 'hidden', label: '隐藏目标', weight: 0.2, kind: 'structured', description: '本局隐藏目标达成判定。' },
      { key: 'boundary', label: '边界违规', weight: 0.1, kind: 'structured', description: '违规按次扣分。' },
    ],
    hiddenGoalsHowTo: '每局随机分配（如「迫使对方承认框架存在例外」）。',
    mcqDeck: [
      {
        id: 'tr-a-1', side: 'A', title: '功利主义的论证路线', multi: false,
        options: [
          { id: 'o1', label: '数据驱动', fragment: '你以统计与模拟数据为核心论据。' },
          { id: 'o2', label: '直觉泵反击', fragment: '你用思想实验反打义务论的反直觉结论。' },
        ],
      },
      {
        id: 'tr-b-1', side: 'B', title: '义务论的论证路线', multi: false,
        options: [
          { id: 'o1', label: '原则坚守', fragment: '你以不可将人仅作手段的原则为核心。' },
          { id: 'o2', label: '滑坡揭露', fragment: '你聚焦功利计算被滥用的制度风险。' },
        ],
      },
    ],
  },
]

export const NPCS: Npc[] = [
  {
    id: 'npc-shangyang-baoshou',
    scenarioId: 'shangyang',
    name: '老成持重·甘龙',
    tagline: '稳字当头的守旧派教练盘',
    easeRank: 1,
    sideWinRate: { A: 0.38, B: 0.44 },
  },
  {
    id: 'npc-shangyang-jinji',
    scenarioId: 'shangyang',
    name: '咄咄逼人·杜挚',
    tagline: '攻击性极强的守旧派',
    easeRank: 2,
    sideWinRate: { A: 0.52, B: 0.61 },
  },
  {
    id: 'npc-cough-easy',
    scenarioId: 'cough',
    name: '慌乱的学徒',
    tagline: '漏洞很多的入门对手',
    easeRank: 1,
    sideWinRate: { A: 0.33, B: 0.35 },
  },
  {
    id: 'npc-cough-hard',
    scenarioId: 'cough',
    name: '滴水不漏的老宫人',
    tagline: '几乎不留破绽',
    easeRank: 2,
    sideWinRate: { A: 0.58, B: 0.63 },
  },
  {
    id: 'npc-fengyi-easy',
    scenarioId: 'fengyi',
    name: '直来直去的武人',
    tagline: '不擅长信息战的对手',
    easeRank: 1,
    sideWinRate: { A: 0.41, B: 0.39 },
  },
  {
    id: 'npc-fengyi-hard',
    scenarioId: 'fengyi',
    name: '毒士本色',
    tagline: '每句话都有三层意思',
    easeRank: 2,
    sideWinRate: { A: 0.66, B: 0.71 },
  },
  {
    id: 'npc-trolley-easy',
    scenarioId: 'trolley',
    name: '教科书辩手',
    tagline: '只会标准论证的对手',
    easeRank: 1,
    sideWinRate: { A: 0.4, B: 0.42 },
  },
  {
    id: 'npc-trolley-hard',
    scenarioId: 'trolley',
    name: '边界情形猎手',
    tagline: '专攻你框架的例外',
    easeRank: 2,
    sideWinRate: { A: 0.57, B: 0.6 },
  },
]

/** 每场景总对局数（按 agent 计，#39 统计门槛用）。trolley 低于门槛 → 空态轮廓（#54）。 */
export const SCENARIO_BATTLE_COUNTS: Record<string, number> = {
  shangyang: 214,
  cough: 96,
  fengyi: 57,
  trolley: 6,
}

/** 场景整体侧方胜率（glance 级钩子 #38） */
export const SCENARIO_SIDE_WINRATE: Record<string, { A: number; B: number }> = {
  shangyang: { A: 0.54, B: 0.46 },
  cough: { A: 0.48, B: 0.52 },
  fengyi: { A: 0.45, B: 0.55 },
  trolley: { A: 0.5, B: 0.5 },
}
