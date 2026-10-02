import type { MyAgentsResponse, ScenarioDetail } from '../api/types'
// Public catalog copy read from the production API on 2026-10-02. Preserve its
// order and text; the authenticated account/inventory below is fictional.
const catalogSnapshot = [
  {
    'id': 'fengyiting-real',
    'title': '凤仪亭之夜',
    'subject': '历史',
    'sideAName': '董卓',
    'sideBName': '吕布',
    'sideALabel': '相国之尊，朝廷、财货与甲兵尽在手中',
    'sideBLabel': '温侯之勇，戟在手中，然身在人下',
    'turnCount': 23,
  },
  {
    'id': 'honnoji-decision',
    'title': '本能寺之变·敌在何处',
    'subject': '历史',
    'sideAName': '主张杀信长',
    'sideBName': '主张不杀信长',
    'sideALabel':
      '长宗我部元亲的密使：为保全四国，说服光秀趁今夜突袭本能寺。足利义昭的使者：以重振幕府为名，说服光秀起兵讨伐信长。',
    'sideBLabel':
      '细川藤孝：以故交身份，向光秀讲明起兵的风险，劝他继续西进。明智军中的足轻：从士卒的处境出发，劝光秀放弃夜袭，依令西进。',
    'turnCount': 10,
  },
  {
    'id': 'legal-harbor-murder-jury',
    'title': '码头疑云：七号仓命案',
    'subject': '法律',
    'sideAName': '林',
    'sideBName': '苏',
    'sideALabel': '串联案件证据，说服陪审团认定顾衡有罪。',
    'sideBLabel': '指出现有证据中的合理疑点，说服陪审团判顾衡无罪。',
    'turnCount': 10,
  },
  {
    'id': 'shangyang-court',
    'title': '商鞅变法·朝堂辩法',
    'subject': '历史',
    'sideAName': '商鞅',
    'sideBName': '甘龙',
    'sideALabel': '自魏入秦的说客，无根无党，惟以变法自荐',
    'sideBLabel': '三朝太师，宗室之望，祖制之守',
    'turnCount': 5,
  },
  {
    'id': 'trolley-problem',
    'title': '电车难题·一人与五人',
    'subject': '伦理',
    'sideAName': '奕仁',
    'sideBName': '武仁',
    'sideALabel': '一人侧：在每个案件中保护一人，拒绝为救五人而牺牲一人',
    'sideBLabel': '五人侧：在每个案件中保护五人，接受由一人承受伤害',
    'turnCount': 15,
  },
]
export const portraitScenarios: ScenarioDetail[] = catalogSnapshot.map((
  summary,
) => ({
  summary: {
    ...summary,
    gateUnlocked: true,
    gateProgress: { a: { beaten: 1, needed: 1 }, b: { beaten: 1, needed: 1 } },
  },
  stages: [],
  presets: [],
}))
export const portraitInventory: MyAgentsResponse = {
  scenarios: portraitScenarios.map(({ summary }, index) => ({
    scenarioID: summary.id,
    title: summary.title,
    gateProgress: summary.gateProgress!,
    entryReady: true,
    sides: {
      a: [0, 1].map((n) => ({
        agentID: 1000 + index * 100 + n,
        name: n === 0 ? null : '备用策略',
        versionCount: 1,
        entryVersionID: n === 0 ? (1000 + index * 100 + n) * 10 : null,
      })),
      b: [{
        agentID: 1050 + index * 100,
        name: null,
        versionCount: 1,
        entryVersionID: (1050 + index * 100) * 10,
      }],
    },
  })),
}
const honnoji = portraitInventory.scenarios.find((scene) =>
  scene.scenarioID === 'honnoji-decision'
)!
honnoji.sides = {
  a: [
    {
      agentID: 164,
      name: null,
      versionCount: 2,
      entryVersionID: 1640,
      role: { key: 'chosokabe', name: '长宗我部元亲的密使', side: 'a' },
    },
    {
      agentID: 165,
      name: '四国安堵',
      versionCount: 1,
      role: { key: 'chosokabe', name: '长宗我部元亲的密使', side: 'a' },
    },
    {
      agentID: 166,
      name: null,
      versionCount: 1,
      role: { key: 'chosokabe', name: '长宗我部元亲的密使', side: 'a' },
    },
    {
      agentID: 194,
      name: null,
      versionCount: 1,
      role: { key: 'yoshiaki_envoy', name: '足利义昭的使者', side: 'a' },
    },
    {
      agentID: 195,
      name: '奉公方归洛',
      versionCount: 1,
      role: { key: 'yoshiaki', name: '足利义昭的使者', side: 'a' },
    },
  ],
  b: [
    {
      agentID: 224,
      name: null,
      versionCount: 1,
      entryVersionID: 2240,
      role: { key: 'hosokawa', name: '细川藤孝', side: 'b' },
    },
    {
      agentID: 225,
      name: '故交之谏',
      versionCount: 1,
      role: { key: 'hosokawa_fujitaka', name: '细川藤孝', side: 'b' },
    },
    {
      agentID: 254,
      name: null,
      versionCount: 1,
      role: { key: 'ashigaru', name: '明智军中的足轻', side: 'b' },
    },
    {
      agentID: 255,
      name: '请下明令',
      versionCount: 1,
      role: { key: 'akechi_ashigaru', name: '明智军中的足轻', side: 'b' },
    },
  ],
}
