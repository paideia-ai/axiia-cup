import type { MatchSummary, ScenarioSummary } from '../api/types'

export const historyScenarios: ScenarioSummary[] = [
  {
    id: 'fengyiting-real',
    title: '凤仪亭之夜',
    sideAName: '董卓',
    sideBName: '吕布',
  },
  {
    id: 'shangyang-court',
    title: '商鞅庭辩',
    sideAName: '商鞅',
    sideBName: '甘龙',
  },
  {
    id: 'honnoji-decision',
    title: '本能寺之变·敌在何处',
    sideAName: '甲方',
    sideBName: '乙方',
  },
  {
    id: 'trolley-problem',
    title: '电车难题',
    sideAName: '奕仁',
    sideBName: '武仁',
  },
  {
    id: 'legal-harbor-murder-jury',
    title: '港口谋杀案',
    sideAName: '林',
    sideBName: '苏',
  },
].map((s) => ({
  ...s,
  subject: '',
  sideALabel: s.sideAName,
  sideBLabel: s.sideBName,
  turnCount: 6,
  gateUnlocked: true,
}))

export function historyFixture(index = 0): MatchSummary {
  const scene = historyScenarios[index % historyScenarios.length]
  const side = index % 2 === 0 ? 'a' : 'b'
  return {
    id: 478 - index,
    scenarioID: scene.id,
    scenarioTitle: scene.title,
    kind: 'pvp',
    dispatched: true,
    finished: true,
    scored: true,
    winner: index % 3 ? 'b' : 'a',
    viewed: index % 7 !== 0,
    initiatorIsMe: true,
    participants: {
      a: {
        agentID: 400 + index * 2,
        versionID: 4000 + index * 2,
        isMine: side === 'a',
        ownerDisplayName: side === 'a' ? 'yihan' : '墨川',
      },
      b: {
        agentID: 401 + index * 2,
        versionID: 4001 + index * 2,
        isMine: side === 'b',
        ownerDisplayName: side === 'b' ? 'yihan' : '小舟',
      },
    },
    createdAt: 1793412000 - index * 1800,
  }
}

export function historyFixtures(): MatchSummary[] {
  const list = Array.from({ length: 20 }, (_, i) => historyFixture(i))
  for (const m of list) {
    if (m.scenarioID === 'honnoji-decision') {
      m.participants!.a.role = {
        key: 'yoshiaki',
        name: '足利义昭的使者',
        side: 'a',
      }
      m.participants!.b.role = {
        key: 'ashigaru',
        name: '明智军中的足轻',
        side: 'b',
      }
    }
  }
  list[4].participants!.a.isMine = false
  list[4].participants!.b.isMine = false
  list[4].initiatorIsMe = false
  list[5].participants!.a.isMine = true
  list[5].participants!.b.isMine = true
  list[5].kind = 'hotseat'
  list[6].winner = 'draw'
  list[7].finished = false
  list[7].scored = false
  list[7].winner = null
  list[8].dispatched = false
  list[8].finished = false
  list[8].scored = false
  list[8].winner = null
  list[9].scored = false
  list[9].winner = null
  list[10].participants!.b = { isMine: false, presetKey: 'lvbu-default' }
  list[10].kind = 'pve'
  list[11].winner = null
  list[12].winner = 'unknown'
  list[13].participants = undefined
  list[14].participants!.a.isMine = true
  list[14].participants!.b.isMine = true
  list[14].kind = 'hotseat'
  list[14].winner = 'draw'
  list[15].participants!.a.ownerDisplayName = '来自洛阳的很长很长的玩家名字'
  for (const i of [16, 17]) {
    list[i].scenarioID = list[16].scenarioID
    list[i].scenarioTitle = list[16].scenarioTitle
    list[i].participants!.a.role = null
    list[i].participants!.b.role = null
    list[i].challengeID = 81
    list[i].challengeLeg = i - 15
  }
  list[18].scenarioID = 'retired-scenario'
  list[18].scenarioTitle = '旧场景'
  list[18].participants = undefined
  list[19].participants!.a.isMine = false
  list[19].participants!.b.isMine = false
  list[19].initiatorIsMe = false
  list[19].winner = 'draw'
  for (const m of list) {
    for (const p of [m.participants?.a, m.participants?.b]) {
      if (p?.isMine) p.ownerDisplayName = 'yihan'
      else if (p?.ownerDisplayName === 'yihan') p.ownerDisplayName = '青禾'
    }
  }
  return list
}
