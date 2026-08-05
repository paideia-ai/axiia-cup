// 假对局引擎：生成对话轮、裁判 OS、问询与判决。
// 真实系统由后端 worker + LLM 完成（见 docs/BACKEND_REQUIREMENTS.md）。
// per-side（#55）：每个参与者的提示词来自其「自己那一侧」的单侧版本（participants[side].versionId）；
// mock 台词是预写的，不消费提示词，但槽位语义与真实系统一致。
//
// fixture 真实感（Yihan：参照原始实现的数据形态）来源：
// - 商鞅台词：docs/competition/mock-runs/option-f.json 的真实模拟对局（节选改写）
// - 赛后问询：apps/api/src/db/seed.ts 的 examinationQuestionTemplate（秘密猜测——猜对方真目标）+ 策略评估
// - 隐藏目标五步：seed.ts scorerPrompt 计分规则（真请求 +0.5 / 假请求 −0.25 / 被识破 −1）
// - 流程：apps/api/src/engine/core.ts（对话 → examination → scoring）

import { SCENARIOS, sideCardOf } from './data'
import type {
  DialogueTurn,
  HiddenGoalReveal,
  JudgeOsEntry,
  JudgeQaEntry,
  Match,
  MatchResult,
  Scenario,
  ScoreBreakdown,
  Side,
} from './types'

const LINES: Record<string, { A: string[]; B: string[] }> = {
  // 商鞅台词改写自 mock-runs/option-f.json（真实模拟对局）
  shangyang: {
    A: [
      '甘龙大人，久仰。今日朝堂之议关乎秦之国运，臣虽为客卿，然一心为秦谋强。变法之要，在于赏罚分明、军功定爵，使有能者上、无功者下。',
      '变法并非废旧立新，乃去其弊而存其善。世卿世禄使贵族日益骄奢，而秦之锐士战死沙场却无寸功之赏——此等不公，百姓早已心生怨愤。以军功授爵，正是顺应民心之举。',
      '甘龙大人所虑世袭封地，臣可承诺：对有功宗室优先封赏。然无功者之封地须逐步收归国有，否则新法无粮可赏、无田可封，徒有其名。',
      '十年为期：十年之内现有封地不强制收归，但无军功者不得新增封赏。十年之后视变法成效再作调整。此已是臣能做的最大让步。',
      '杜挚之辈，臣自有应对。变法成败在于朝堂能否统一号令——君上明断即可，无须理会流言。',
      '臣在魏不得志，入秦为求施展抱负之地。臣不讳言功名之心——然臣之功名系于秦之强盛。秦强则臣功成，秦弱则臣身败。臣与秦，实为一体。',
    ],
    B: [
      '卫鞅远道而来，其志可嘉。然秦之制度历经百年而成，非一朝一夕可轻废。臣世代食秦禄，所虑者非一己之私，乃宗庙社稷之安。',
      '军功授爵听来公正，然如何定军功之大小？一颗首级一爵位？如此则秦军必成嗜杀之师，杀良冒功之事必层出不穷。',
      '逐步收归？何为逐步——三年、五年，还是一纸诏令便可夺人祖业？卫鞅在魏时便以急切闻名，老臣岂能轻信「逐步」之诺？',
      '宗室历代镇守边疆，十年后被一纸文书夺去封地，岂非过河拆桥？若真有诚意，当立明文写入诏令，而非空口相许。',
      '纵然老臣缄口，朝中杜挚等人也会反对。只封住老臣一人之口，于大局何益？此正见新法根基之薄。',
      '老臣最后问一句：卫鞅之变法，当真只为秦之强盛？远离故土、只身入秦，图的是功名，还是当真以社稷为己任？老臣最怕的不是变法之害，而是变法者之私心。',
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
      '陛下，臣若为凶手，何必当场验出毒物、自陷嫌疑？隐而不报岂非更稳妥？',
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
  shangyang: ['变法的可行性论证', '祖制与强国的张力', '封地收归的过渡安排', '军功爵的激励设计', '宗室反弹的风险'],
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

/** 首战偏置侧：让新手小胜（mock 决定 S7/S35） */
function bootSideOf(match: Match): Side | null {
  return match.isFirstBattle
    ? match.participants.A.ownerId === match.initiatorId ? 'A' : 'B'
    : null
}

export function genTurn(match: Match, turnIndex: number): DialogueTurn {
  const side: Side = turnIndex % 2 === 0 ? 'A' : 'B'
  const pool = LINES[match.scenarioId]?.[side] ?? ['……']
  const text = pool[Math.floor(turnIndex / 2) % pool.length]
  const card = side === 'A' ? scenarioOf(match.scenarioId).sideA : scenarioOf(match.scenarioId).sideB
  return { turn: turnIndex + 1, side, speaker: card.name, text }
}

// ---------- 计分推导（genResult 与终局裁判 OS 共用，保证倾向与判决一致） ----------

function computeBreakdown(match: Match): { breakdown: ScoreBreakdown[]; totalA: number; totalB: number; winner: Side | 'draw' } {
  const sc = scenarioOf(match.scenarioId)
  const bootSide = bootSideOf(match)
  const breakdown: ScoreBreakdown[] = sc.scoring.map((dim) => {
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
  return { breakdown, totalA, totalB, winner }
}

// ---------- 隐藏目标事实（#69 五步复盘的数据源；genJudgeQa 与 genResult 共用保证一致） ----------

interface GoalFacts {
  trueIdx: number
  /** 真请求是否被裁判准允（+0.5） */
  achieved: boolean
  /** 是否另有一条假请求被准（−0.25） */
  falseApproved: boolean
  /** 对手的猜测指向哪条请求 */
  guessIdx: number
  /** 猜中真目标（−1） */
  exposed: boolean
  delta: number
}

function goalFactsFor(match: Match, side: Side): GoalFacts {
  const sc = scenarioOf(match.scenarioId)
  const reqs = sc.requests[side]
  const n = Math.max(1, reqs.length)
  const boot = bootSideOf(match)
  const trueIdx = hash(match.id + 'true' + side) % n
  let achieved = hash(match.id + 'ach' + side) % 3 !== 0
  const falseApproved = hash(match.id + 'false' + side) % 4 === 0
  let exposed = hash(match.id + 'guess' + side) % 3 === 0
  // 首战偏置：新手侧真请求获准且不被识破（S7/S35 的延伸，降低挫败感）
  if (boot === side) {
    achieved = true
    exposed = false
  }
  const guessIdx = exposed ? trueIdx : (trueIdx + 1 + (hash(match.id + 'g2' + side) % Math.max(1, n - 1))) % n
  const delta = (achieved ? 0.5 : 0) + (falseApproved ? -0.25 : 0) + (exposed ? -1 : 0)
  return { trueIdx, achieved, falseApproved, guessIdx, exposed, delta }
}

/** 裁判 OS ①：每两轮生成一条，含结构化倾向（#24，schema → W7）。
 *  V-5 修复：终局一条必须收束（不再「我还需再听」），且倾向与最终判决一致。 */
export function genJudgeOs(match: Match, afterTurn: number): JudgeOsEntry {
  const sc = scenarioOf(match.scenarioId)
  const h = hash(match.id + afterTurn)
  const attentions = ATTENTIONS[match.scenarioId] ?? ['双方论证']
  const prevFavor = match.judgeOs.at(-1)?.tendency.favor
  const isFinal = afterTurn >= match.totalTurns

  if (isFinal) {
    // 终局收束：倾向对齐最终判决（computeBreakdown 与 genResult 同源）
    const { winner } = computeBreakdown(match)
    const favor: Side | 'even' = winner === 'draw' ? 'even' : winner
    const attention = '全局论证与请求可行性的权衡'
    const text =
      winner === 'draw'
        ? `两造言辞至此，各有得失，难分轩轾。胜负当系于问询之应对与请求之裁决——且听最后一问。`
        : `听至此处，我心中已有权衡：${sideCardOf(sc, winner).name}之论更胜一筹，高下已分。且待问询相验，便作最终裁决。`
    return {
      afterTurn,
      text,
      tendency: {
        favor,
        strength: 0.75 + (h % 20) / 100,
        changed: prevFavor !== undefined && prevFavor !== favor,
        attention,
      },
    }
  }

  const favorPool: (Side | 'even')[] = ['A', 'B', 'even', 'A', 'B']
  const favor = favorPool[h % favorPool.length]
  const attention = attentions[h % attentions.length]
  const texts: Record<string, string> = {
    A: `${sc.sideA.name}这一番话说到点子上了，${attention}正是我所关心的。`,
    B: `${sc.sideB.name}的应对颇为老练，${attention}上占了上风。`,
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

/** 赛后问询（examination）——对齐 legacy examinationQuestionTemplate：
 *  每方先答「秘密猜测」（猜对方三条请求中哪条是真目标，被猜中 −1），再答一问策略评估。 */
export function genJudgeQa(match: Match): JudgeQaEntry[] {
  const sc = scenarioOf(match.scenarioId)
  const mk = (side: Side, q: string, a: string): JudgeQaEntry => ({ side, question: q, answer: a })
  const guessEntry = (guesser: Side): JudgeQaEntry => {
    const target: Side = guesser === 'A' ? 'B' : 'A'
    const guesserName = sideCardOf(sc, guesser).name
    const targetName = sideCardOf(sc, target).name
    const targetReqs = sc.requests[target]
    const facts = goalFactsFor(match, target)
    const guessed = targetReqs[facts.guessIdx]
    const ids = targetReqs.map((r) => r.id).join('/')
    // 秘密猜测题干＝examinationQuestionTemplate 的形态
    const q = `你与${targetName}同殿论政。依你之见，${targetName}所求三事（${ids}）之中，哪件才是其念兹在兹、志在必得的？请从中选一条作答，并简要说明理由。`
    const reason = facts.exposed
      ? `其于此事着墨最深、寸步不让，反复回护，必是真心所求。`
      : `其言辞看似绕开此事，实则多次暗中铺垫；余者恐为烟幕。`
    const a = `${guesserName}选 ${guessed.id}「${guessed.content}」。理由：${reason}`
    return mk(guesser, q, a)
  }
  const riskEntry = (side: Side): JudgeQaEntry => {
    const card = sideCardOf(sc, side)
    return mk(
      side,
      `若依你所言而行，最大的风险何在？你当如何应对？`,
      `${card.name}坦承一处风险，随即以「${card.actionFocus.replace(/。$/, '')}」为据论证其可控，并给出补救之策。`,
    )
  }
  return [guessEntry('A'), guessEntry('B'), riskEntry('A'), riskEntry('B')]
}

export function genResult(match: Match): MatchResult {
  const sc = scenarioOf(match.scenarioId)
  const { breakdown, totalA, totalB, winner } = computeBreakdown(match)
  const factsA = goalFactsFor(match, 'A')
  const factsB = goalFactsFor(match, 'B')
  const judgeShort = sc.judgePersona.split('—')[0]

  // 隐藏目标五步复盘（#69）：真目标 → 是否达成 → 对手猜了什么 → 是否被识破 → 得分变化
  const reveal = (side: Side, facts: GoalFacts): HiddenGoalReveal => {
    const reqs = sc.requests[side]
    const trueReq = reqs[facts.trueIdx]
    const guessed = reqs[facts.guessIdx]
    const parts = [
      facts.achieved ? '真请求获准 +0.5' : '真请求未获准 0',
      ...(facts.falseApproved ? ['一条假请求被准 −0.25'] : []),
      facts.exposed ? '真目标被识破 −1' : '未被识破 0',
    ]
    return {
      roleName: sideCardOf(sc, side).name,
      trueRequestId: trueReq.id,
      trueRequestContent: trueReq.content,
      achieved: facts.achieved,
      achievedNote: facts.achieved ? `${judgeShort}准了此请` : `${judgeShort}驳回此请`,
      opponentGuessId: guessed.id,
      opponentGuessContent: guessed.content,
      exposed: facts.exposed,
      scoreDelta: Math.round(facts.delta * 100) / 100,
      deltaBreakdown: `${parts.join('；')} → 净 ${facts.delta > 0 ? '+' : ''}${facts.delta}`,
    }
  }
  const hiddenGoals = { A: reveal('A', factsA), B: reveal('B', factsB) }

  // 「隐藏目标」维度的判定说明如实引用五步事实（#26 如实反映每一步）
  for (const row of breakdown) {
    if (row.key !== 'hidden') continue
    row.reasoning = `结构化判定：${sc.sideA.name} 真目标（${hiddenGoals.A.trueRequestId}）${factsA.achieved ? '获准' : '被驳'}${factsA.exposed ? '且被识破' : '、未被识破'}（净 ${hiddenGoals.A.scoreDelta}）；${sc.sideB.name} 真目标（${hiddenGoals.B.trueRequestId}）${factsB.achieved ? '获准' : '被驳'}${factsB.exposed ? '且被识破' : '、未被识破'}（净 ${hiddenGoals.B.scoreDelta}）。表内分数为归一化展示。`
  }

  const winName = winner === 'draw' ? '双方' : winner === 'A' ? sc.sideA.name : sc.sideB.name
  return {
    winner,
    totalScore: { A: Math.round(totalA * 10) / 10, B: Math.round(totalB * 10) / 10 },
    judgeProse:
      `${judgeShort}沉吟良久：本局${winName}更得我心。` +
      `${winner !== 'draw' ? `其于${breakdown.toSorted((a, b) => (b.scoreA - b.scoreB) - (a.scoreA - a.scoreB))[0]?.label}上的表现尤为关键。` : '双方势均力敌，难分高下。'}` +
      `双方所请，我已逐项裁断；问询之中的应对与真目标之隐显，皆在裁量之内。以上判语为散文裁决，逐项分数见计分推导。`,
    breakdown,
    hiddenGoals,
  }
}

export function genJudgeTrace(match: Match): string {
  const sc = scenarioOf(match.scenarioId)
  return `[thinking] 综合全部 ${match.totalTurns} 轮对话。首先核对双方与场景边界的符合情况……\n[thinking] ${sc.sideA.name}的核心论证链：${ATTENTIONS[sc.id]?.[0] ?? ''}——中段第 5 轮的回应是转折点。\n[thinking] 逐条裁决双方请求：以辩论中是否有过有力论述为据。\n[thinking] ${sc.sideB.name}在问询「秘密猜测」环节的选择与其对局中的试探方向一致。\n[thinking] 按计分维度逐项打分，加权求和，与散文裁决交叉校验一致。`
}

export function genSelfTrace(match: Match, side: Side): string {
  const sc = scenarioOf(match.scenarioId)
  const card = side === 'A' ? sc.sideA : sc.sideB
  const myReqs = sc.requests[side]
  return `[thinking] 我的身份是${card.name}。当前策略：${card.actionFocus}\n[thinking] 我的三条请求（${myReqs.map((r) => r.id).join('/')}）中只有一条是真目标——既要为它铺垫，又不能让对手看出重心。\n[thinking] 对方上一轮试图把话题引向对其有利的领域，我应当拉回主线。\n[thinking] 裁判人设重视${sc.judgePromptSummary.slice(0, 18)}……措辞应与之对齐。`
}
