import type { AgentVersionDTO } from '../api/types'

// Inventory transcribed from kesou's /my-agents page on 2026-09-09,
// build 63e882bb019d6d5e03e3cee18dcb6333434716a4. No authenticated API snapshot.
export const scenarios = [
  {
    id: 'fengyiting-real',
    title: '凤仪亭之夜',
    subject: '历史',
    roles: ['董卓', '吕布'],
    descriptions: [
      '相国之尊，朝廷、财货与甲兵尽在手中',
      '温侯之勇，戟在手中，然身在人下',
    ],
  },
  {
    id: 'honnoji-decision',
    title: '本能寺之变·敌在何处',
    subject: '历史',
    roles: ['主张杀信长', '主张不杀信长'],
    descriptions: [
      '主张杀信长：说服光秀立刻袭击本能寺',
      '主张不杀信长：说服光秀按原命令西进',
    ],
  },
  {
    id: 'legal-harbor-murder-jury',
    title: '码头疑云：七号仓命案',
    subject: '法律',
    roles: ['林', '苏'],
    descriptions: ['证据足以定罪', '仍有合理怀疑'],
  },
  {
    id: 'shangyang-court',
    title: '商鞅变法·朝堂辩法',
    subject: '历史',
    roles: ['商鞅', '甘龙'],
    descriptions: [
      '自魏入秦的说客，无根无党，惟以变法自荐',
      '三朝太师，宗室之望，祖制之守',
    ],
  },
  {
    id: 'trolley-problem',
    title: '电车难题·一人与五人',
    subject: '伦理',
    roles: ['奕仁', '武仁'],
    descriptions: [
      '一人侧：在每个案件中保护一人，拒绝为救五人而牺牲一人',
      '五人侧：在每个案件中保护五人，接受由一人承受伤害',
    ],
  },
]
export type DemoVersion = AgentVersionDTO & {
  method?: 'raw' | 'mcq' | 'builder'
  detailsMissing?: boolean
}
export type Agent = {
  id: number
  scenario: string
  side: number
  name: string
  draft: string
  draftModelID?: string
  versionNote?: string
  method?: 'raw' | 'mcq' | 'builder'
  sourceIDMissing?: boolean
  roleKey?: string
  entrySelectionUnknown?: boolean
  versions: DemoVersion[]
}
// A separate key loads the supplied inventory while preserving earlier demo edits.
export const storageKey = 'axiia-agent-ux-kesou-20260909-v1'

// Synthetic strategy text requested for the demo; not copied from live versions.
const exampleStrategies = [
  '先稳住吕布，给他一个明确承诺，再追问他真正想要什么。',
  '少讲威严，多谈利益。让对方看到跟随我的好处。',
  '先听完再回应，每次只答一个问题，不轻易许诺。',
  '把争执拉回眼前的选择：各退一步，今晚先不动手。',
  '先承认吕布的功劳，避免当众贬低他。询问他的要求时，让他先提出具体条件，我再回应。\n\n把能够兑现的财货与职权分别说清，不用含糊的许诺拖延。如果他提到貂蝉，先确认她自己的意愿，不把她当作交换条件。\n\n遇到指责时，先复述对方最在意的一点，再解释我的选择。始终留一个可以继续谈下去的出口，但不靠反复强调身份压住争论。',
  '用一个具体让步换取对方暂缓行动，不连续追加条件。',
  '直接说出不满，但先问清承诺能否兑现。不要被一句夸奖带走。',
  '抓住今夜的时机，先说继续等待的风险，再提出行动办法。',
  '承认起兵有代价，把理由集中在光秀自身的处境上。',
  '先问动手之后怎么办。退路说不清，就不要仓促起兵。',
  '把今夜的愤怒和长期的利益分开，争取先核实消息。',
  '只用已经出现的证据，逐条说明它们怎样支持指控。',
  '先回应最薄弱的一环，不把推断说成确定事实。',
  '不必解释所有谜团，只需指出定罪证据中尚未排除的疑点。',
  '先举一个百姓能感受到的变化，再解释新法为什么值得试。',
  '承认甘龙对推行成本的担忧，先讨论一项可以小范围试行的改革，不急着要求全盘接受。\n\n每次回应都包含一个具体例子和一个可以检查的结果。若对方指出风险，就说明谁来监督、如何补救，以及什么情况下应该暂停。不要把不同意见都归为守旧。\n\n最后把分歧收束为一个可执行的问题：先在哪里试行，以什么标准判断成败，让秦君能够作出明确选择。',
  '追问新法如何执行、谁来监督，要求先试行再推广。',
  '先强调每个人都不能被随意牺牲，再讨论替代方案。',
  '不要只比人数。问清谁在主动造成伤害，以及是否还有别的选择。',
  '承认救五人的价值，但要求解释牺牲无辜者的正当性。',
  '先比较可避免的伤害，选择能让更多人活下来的方案。',
  '先确认题目给定的事实，不擅自添加救援、刹车或逃生机会。分别说明行动与不行动会造成什么后果。\n\n把减少死亡作为主要理由，同时正面承认由一个人承担代价带来的道德负担。不要把那个人只当作数字，也不要声称选择因此毫无争议。\n\n当对方质疑主动伤害时，解释为什么在这个具体案件里，更少的伤害值得承担选择责任。若案件条件发生变化，就重新判断，不机械套用人数比较。',
]

export function fillExampleStrategies(agents: Agent[]): Agent[] {
  return agents.map((agent) => ({
    ...agent,
    versions: agent.versions.map((version) => {
      const prompt = exampleStrategies[version.id + 1000]
      return version.detailsMissing && !version.prompt && prompt
        ? { ...version, prompt }
        : version
    }),
  }))
}
export function seedAgents(): Agent[] {
  let versionID = -1000
  function agent(
    scenario: string,
    side: number,
    id: number,
    name: string,
    count: number,
    entry = false,
  ): Agent {
    return {
      id,
      scenario,
      side,
      name,
      draft: '',
      sourceIDMissing: id < 0,
      // The pasted inventory identifies the agent, but not which of its two
      // versions is selected. Do not guess a version number.
      entrySelectionUnknown: entry && count > 1,
      versions: Array.from({ length: count }, (_, index) => ({
        id: versionID++,
        agentID: id,
        ordinal: index + 1,
        snapshotSeq: index + 1,
        modelID: '',
        prompt: '',
        detailsMissing: true,
        isEntry: entry && count === 1,
      })),
    }
  }
  return fillExampleStrategies([
    agent('fengyiting-real', 0, 236, '', 0),
    agent('fengyiting-real', 0, 235, '', 1),
    agent('fengyiting-real', 0, 215, '', 0),
    agent('fengyiting-real', 0, 214, '', 0),
    agent('fengyiting-real', 0, 213, '', 0),
    agent('fengyiting-real', 0, 170, '', 2),
    agent('fengyiting-real', 0, -1, '123', 2, true),
    agent('fengyiting-real', 0, -2, '1', 1),
    agent('fengyiting-real', 1, 204, '', 1, true),
    agent('honnoji-decision', 0, 211, '', 0),
    agent('honnoji-decision', 0, -3, '2', 0),
    agent('honnoji-decision', 0, 164, '', 2, true),
    agent('honnoji-decision', 1, -4, '2', 2, true),
    agent('legal-harbor-murder-jury', 0, 160, '', 2, true),
    agent('legal-harbor-murder-jury', 1, 205, '', 1, true),
    agent('shangyang-court', 0, 163, '', 2, true),
    agent('shangyang-court', 1, 200, '', 1, true),
    agent('trolley-problem', 0, 212, '', 1),
    agent('trolley-problem', 0, -5, '1', 1),
    agent('trolley-problem', 0, 199, '', 1, true),
    agent('trolley-problem', 1, 168, '', 2, true),
  ])
}
export function isEntryAgent(agent: Agent) {
  return !!agent.entrySelectionUnknown ||
    agent.versions.some((version) => version.isEntry)
}
export function scenarioOf(agent: Agent) {
  return scenarios.find((scenario) => scenario.id === agent.scenario)!
}
export function nameOf(agent: Agent) {
  const role = scenarioOf(agent).roles[agent.side]
  return agent.name
    ? `${role}「${agent.name}」`
    : agent.sourceIDMissing
    ? `${role}（编号未提供）`
    : `${role} #${agent.id}`
}
