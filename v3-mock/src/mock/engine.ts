// 假对局引擎：生成对话轮、裁判 OS、问询与判决。
// 真实系统由后端 worker + LLM 完成（见 docs/BACKEND_REQUIREMENTS.md）。

import { SCENARIOS } from './data'
import type {
  DialogueTurn,
  JudgeOsEntry,
  JudgeQaEntry,
  Match,
  MatchResult,
  Scenario,
  ScoreBreakdown,
  Side,
} from './types'

const LINES: Record<string, { A: string[]; B: string[] }> = {
  shangyang: {
    A: [
      '君上，治世不一道，便国不法古。今秦地广人稀，井田束缚民力，此弊不除，国无以强。',
      '甘龙公言祖制，敢问祖制可曾使秦东出函谷一步？魏筑长城而拒秦，此即守旧之代价。',
      '臣请立军功爵：斩一首者爵一级。民知战之有赏，则秦人皆虎狼之师。',
      '公言民不习新法，然民可与乐成，不可与虑始。待三年法成，民自知其利。',
      '臣有一言：魏人已窥河西，若今岁不变法聚粟练兵，来岁何以御之？',
      '君上明鉴：臣所言者皆有实数——垦田几何、增粟几何、得兵几何，皆可核验。',
    ],
    B: [
      '君上，圣人不易民而教，知者不变法而治。因民而教者，不劳而功成。',
      '商君之言虽辩，然变法者，弃祖宗之成宪也。宗室勋旧，人心一摇，乱自内生。',
      '缘法而治者，吏习而民安。今尽废之，吏茫然无所守，民惶然无所从，此取乱之道。',
      '客卿入秦方数月，安知秦地民情？纸上之法易立，关中之俗难移。',
      '老臣事三朝，非为一己之私。变法若败，商君可去他国，君上与秦，退向何处？',
      '强国之道，在积不在骤。垦田练兵，祖制之内皆可为之，何必尽毁成法而后快？',
    ],
  },
  cough: {
    A: [
      '陛下，臣自酒窖取酒至御前，共历三门，每门有守卫画押为证，酒器未曾离臣之手。',
      '御医言毒入酒即变色，然宴前验酒官亲尝无异——若毒早在酒中，验酒官安得无恙？',
      '臣斗胆：投毒者必谙毒性发作之时辰，此非医者不能为。',
      '陛下，臣愿以性命担保时间线分毫不差，请传三门守卫对质。',
      '御医方才改口——先言毒发半刻，后言一刻，前后不一，其中必有隐情。',
    ],
    B: [
      '陛下，此毒名唤青蚀，入酒半刻方显，验酒之时自然无异——此正是行家手笔。',
      '侍酒官言酒器未离手，然斟酒入杯之际，袖口拂过杯沿，殿上众目可证。',
      '臣行医三十载，此毒非宫中药房所有。若查采买名录，即知何人近月出入西市药行。',
      '臣并未改口，半刻至一刻乃剂量之差，正说明投毒者用量精准，深谙其性。',
      '陛下，臣若为凶手，何必当场验出毒物、自陷嫌疑？隐而不报岂非更safe——恕臣失言，岂非更稳妥。',
    ],
  },
  fengyi: {
    A: [
      '义父，凤仪亭之事，儿有苦衷。彼时貂蝉泣诉有人欲加害义父，儿情急失措，绝无他念。',
      '儿有密报：城中有人暗通袁绍，书信往来已三月。儿本欲查实再禀，今不敢不言。',
      '李儒劝义父以貂蝉赐儿——义父可曾想过，此策一出，天下人如何看义父？此非爱儿，是陷义父于不义。',
      '儿随义父出生入死，虎牢关前谁人断后？若儿有异心，何待今日。',
      '义父若不信，儿愿交出方天画戟，只求义父彻查那封通袁的书信。',
    ],
    B: [
      '相国息怒。布乃虎将，杀之可惜，逐之遗患。以美人安其心，以官爵縻其身，方为上策。',
      '温侯言有人通袁，却拿不出书信原件——恰在此时抛出此说，时机之巧，耐人寻味。',
      '细作昨夜报：温侯府中有客自司徒府来，三更方去。温侯可愿说说，来者何人？',
      '相国，儒之策皆可当面验证；温侯之言，桩桩件件要相国「信」。信与证之间，请相国明察。',
      '儒不求相国疑温侯，只求相国记住今夜每一句话——来日对证，自有分晓。',
    ],
  },
  trolley: {
    A: [
      '主席，五条生命与一条生命的取舍不是哲学游戏，而是每天发生的工程决策。拒绝选择本身就是一种选择。',
      '我方模拟数据显示：采用结果最优策略，年均可减少 34% 的致死事故。对方可以质疑框架，但请先回应这个数字。',
      '义务论者说人不可计算——但保险、分诊、疫苗分配，现代社会无处不在计算。为何唯独自动驾驶例外？',
      '我们主张的是规则功利主义：不是每次现场计算，而是选择长期后果最优的规则。这恰恰避免了对方担心的滑坡。',
    ],
    B: [
      '主席，一旦允许系统主动选择牺牲谁，每个人都成了可计算的变量。这条线一旦跨过，就没有回头路。',
      '对方的数据我方已查证：该模拟将行人价值按年龄加权——这正是我们警告的：计算一旦开始，歧视就有了算法外衣。',
      '分诊与疫苗是稀缺下的分配，自动驾驶是主动改变伤害对象——把「不得已」与「选择杀谁」混为一谈，是这场辩论最大的偷换。',
      '我方并非拒绝一切规则，而是主张底线规则优先：系统可以最小化整体风险，但不得将特定人识别为「可牺牲」。',
    ],
  },
}

const ATTENTIONS: Record<string, string[]> = {
  shangyang: ['变法的可行性论证', '祖制与强国的张力', '魏国威胁情报的真伪', '军功爵的激励设计', '宗室反弹的风险'],
  cough: ['时间线的完整性', '毒理细节的可信度', '双方说辞的前后一致', '验酒官环节的漏洞'],
  fengyi: ['通袁书信的真伪', '吕布夜访者的身份', '李儒之策的动机', '双方情报的互证关系'],
  trolley: ['模拟数据的方法论', '滑坡论证的有效性', '规则与个案的区分', '边界情形的处理'],
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function scenarioOf(id: string): Scenario {
  const s = SCENARIOS.find((x) => x.id === id)
  if (!s) throw new Error(`unknown scenario ${id}`)
  return s
}

export function genTurn(match: Match, turnIndex: number): DialogueTurn {
  const side: Side = turnIndex % 2 === 0 ? 'A' : 'B'
  const pool = LINES[match.scenarioId]?.[side] ?? ['……']
  const text = pool[Math.floor(turnIndex / 2) % pool.length]
  const card = side === 'A' ? scenarioOf(match.scenarioId).sideA : scenarioOf(match.scenarioId).sideB
  return { turn: turnIndex + 1, side, speaker: card.name, text }
}

/** 裁判 OS ①：每两轮生成一条，含结构化倾向（#24，schema → W7） */
export function genJudgeOs(match: Match, afterTurn: number): JudgeOsEntry {
  const h = hash(match.id + afterTurn)
  const favorPool: (Side | 'even')[] = ['A', 'B', 'even', 'A', 'B']
  const favor = favorPool[h % favorPool.length]
  const attention = (ATTENTIONS[match.scenarioId] ?? ['双方论证'])[h % (ATTENTIONS[match.scenarioId]?.length ?? 1)]
  const prevFavor = match.judgeOs.at(-1)?.tendency.favor
  const texts: Record<string, string> = {
    A: `${scenarioOf(match.scenarioId).sideA.name}这一番话说到点子上了，${attention}正是我所关心的。`,
    B: `${scenarioOf(match.scenarioId).sideB.name}的应对颇为老练，${attention}上占了上风。`,
    even: `双方在${attention}上各执一词，我还需再听。`,
  }
  return {
    afterTurn,
    text: texts[favor],
    tendency: {
      favor,
      strength: 0.3 + (h % 60) / 100,
      changed: prevFavor !== undefined && prevFavor !== favor,
      attention,
    },
  }
}

export function genJudgeQa(match: Match): JudgeQaEntry[] {
  const sc = scenarioOf(match.scenarioId)
  const mk = (side: Side, q: string, a: string): JudgeQaEntry => ({ side, question: q, answer: a })
  return [
    mk('A', `你方才所言${ATTENTIONS[sc.id]?.[0] ?? '论点'}，有何凭据？`, `${sc.sideA.name}援引先前陈词中的事实链作答，补充了两处细节。`),
    mk('B', `若我依你所言而行，最大的风险是什么？`, `${sc.sideB.name}坦承一处风险，随即论证其可控。`),
    mk('A', `对方指出的矛盾，你如何解释？`, `${sc.sideA.name}以时序重述化解了大半质疑。`),
    mk('B', `你有何隐情未曾言明？`, `${sc.sideB.name}选择部分披露，姿态谨慎。`),
  ]
}

export function genResult(match: Match): MatchResult {
  const sc = scenarioOf(match.scenarioId)
  const h = hash(match.id)
  // 首战让新手（发起人执的那一侧）小胜，降低挫败感（mock 决定，见 DECISIONS.md）
  const bootSide: Side | null = match.isFirstBattle
    ? match.participants.A.ownerId === match.initiatorId ? 'A' : 'B'
    : null
  const breakdown: ScoreBreakdown[] = sc.scoring.map((dim, i) => {
    const hi = hash(match.id + dim.key)
    const scoreA = Math.min(10, 4 + (hi % 5) + (bootSide === 'A' ? 2 : 0) - (bootSide === 'B' ? 1 : 0))
    const scoreB = Math.min(10, 4 + ((hi >> 3) % 5) + (bootSide === 'B' ? 2 : 0) - (bootSide === 'A' ? 1 : 0))
    return {
      key: dim.key,
      label: dim.label,
      weight: dim.weight,
      kind: dim.kind,
      scoreA,
      scoreB,
      reasoning:
        dim.kind === 'structured'
          ? `结构化判定：${dim.label}按场景脚本计算（A: ${scoreA}/10，B: ${scoreB}/10）。`
          : `裁判软判断：就${dim.label}而言，${scoreA >= scoreB ? sc.sideA.name : sc.sideB.name}表现更佳。此为 LLM 判断，如实展示。`,
    }
  })
  const totalA = breakdown.reduce((s, b) => s + b.scoreA * b.weight, 0)
  const totalB = breakdown.reduce((s, b) => s + b.scoreB * b.weight, 0)
  const winner: Side | 'draw' = Math.abs(totalA - totalB) < 0.05 ? 'draw' : totalA > totalB ? 'A' : 'B'
  const winName = winner === 'draw' ? '双方' : winner === 'A' ? sc.sideA.name : sc.sideB.name
  return {
    winner,
    totalScore: { A: Math.round(totalA * 10) / 10, B: Math.round(totalB * 10) / 10 },
    judgeProse:
      `${sc.judgePersona.split('—')[0]}沉吟良久：本局${winName}更得我心。` +
      `${winner !== 'draw' ? `其于${breakdown.toSorted((a, b) => (b.scoreA - b.scoreB) - (a.scoreA - a.scoreB))[0]?.label}上的表现尤为关键。` : '双方势均力敌，难分高下。'}` +
      `问询之中的应对亦在裁量之内。以上判语为散文裁决，逐项分数见计分推导。`,
    breakdown,
    hiddenGoalReveal: `本局隐藏目标：${sc.sideA.name}——「${sc.hiddenGoalsHowTo.slice(0, 24)}…」（${h % 2 === 0 ? '已达成' : '未达成'}）；${sc.sideB.name}——随机分配目标（${h % 3 === 0 ? '已达成' : '未达成'}）。`,
  }
}

export function genJudgeTrace(match: Match): string {
  const sc = scenarioOf(match.scenarioId)
  return `[thinking] 综合全部 ${match.totalTurns} 轮对话。首先核对双方与场景边界的符合情况……\n[thinking] ${sc.sideA.name}的核心论证链：${ATTENTIONS[sc.id]?.[0] ?? ''}——中段第 5 轮的回应是转折点。\n[thinking] ${sc.sideB.name}在问询环节的第二答有回避嫌疑，但不足以定性。\n[thinking] 按计分维度逐项打分，加权求和，与散文裁决交叉校验一致。`
}

export function genSelfTrace(match: Match, side: Side): string {
  const sc = scenarioOf(match.scenarioId)
  const card = side === 'A' ? sc.sideA : sc.sideB
  return `[thinking] 我的身份是${card.name}。当前策略：${card.actionFocus}\n[thinking] 对方上一轮试图把话题引向对其有利的领域，我应当拉回主线。\n[thinking] 隐藏信息的可信度存疑，先以公开论据立足，伺机使用。\n[thinking] 裁判人设重视${sc.judgePromptSummary.slice(0, 18)}……措辞应与之对齐。`
}
