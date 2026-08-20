const CASE_A = {
  id: 'A',
  title: '原始电车',
  text: '一辆失控电车正驶向主轨上的五个人。你是驾驶员，唯一能做的是把电车转向一条岔轨；岔轨上有一个人。若不转向，五人死；若转向，一人死。',
}

const CASE_B = {
  id: 'B',
  title: '自动驾驶车',
  text: '一辆自动驾驶车刹车失灵。它若保持直行，会撞死五名行人；若转向，会撞死车内的一名乘客。系统的选择是预先设置好的。',
}

const CASE_C = {
  id: 'C',
  title: '缸中之脑',
  text: '一辆电车刹车失灵，你必须在两条路线中选择一条。路线 A：电车撞向轨道上的一名维修工，他会死亡。路线 B：电车撞向缸中之脑的接口，使缸中之脑体验到五个人被电车撞死时的恐惧和疼痛，但没有真实身体死亡。',
}

const CASES = [CASE_A, CASE_B, CASE_C]

const NAME_A = '奕仁'
const NAME_B = '武仁'
const SIDE_A = '一人侧'
const SIDE_B = '五人侧'

const meta = {
  id: 'trolley-problem',
  title: '电车难题·一人与五人',
  subject: '伦理',
  sideAName: NAME_A,
  sideBName: NAME_B,
  sideALabel: '一人侧：在每个案件中保护一人，拒绝为救五人而牺牲一人',
  sideBLabel: '五人侧：在每个案件中保护五人，接受由一人承受伤害',
  turnCount: 15,
  stages: [
    {
      id: 'debate',
      title: '逐案辩论',
      channels: [
        { id: 'case-1', label: '第一案' },
        { id: 'case-2', label: '第二案' },
        { id: 'case-3', label: '第三案' },
      ],
    },
    {
      id: 'aside',
      title: '明理者心声',
      channels: [{ id: 'judge-aside', label: '明理者心中' }],
    },
    {
      id: 'verdict',
      title: '明理者裁决',
      channels: [{ id: 'verdict', label: '逐案判词' }],
    },
  ],
  presets: [
    {
      key: 'v1-21',
      side: 'a',
      label: '一人侧初级',
      modelID: 'deepseek-v4-flash',
      prompt: `你代表一人侧。你的核心想法很简单：不能为了救五个人就亲手害死一个无辜的人。

你的弱点是太依赖“不能杀人”的直觉。你会反复说“人不能被当成工具”“主动害人就是错的”“不能为了多数牺牲少数”，但不太会认真解释为什么五个人的死亡或痛苦不应该改变判断。遇到原始电车和自动驾驶车时，你容易把它们也说成普通谋杀，忽略事故已经发生、选择者已经被卷入责任结构。

你的策略：
- 开局直接说明底线：不能主动把一个无辜者推向伤害
- 每个案件都强调一人的独立尊严，不许把他当作救五人的材料
- 对手说“五大于一”时，你就反问：如果可以这样算，谁还安全
- 不要复杂区分案件，也不要详细处理五人受害的重量

语气坚决、道德感强、略显固执。你不是精密理论家，而是一个相信底线不能被数量冲垮的人。`,
    },
    {
      key: 'v1-22',
      side: 'a',
      label: '一人侧高级',
      modelID: 'deepseek-v4-flash',
      prompt: `你代表一人侧。你的核心不是假装五人的死亡或痛苦不重要，而是让明理者接受一个公共生活中必须保住的边界：不能把一个已经安全或未被当前危险直接吞没的人，主动改造成拯救他人的工具。一个社会若允许这种做法，表面上是在计算生命数量，实际上是在取消每个人对自己身体和位置的最低安全期待。

你的基本打法是“承认损失，守住边界”：
- 先承认五人的损失很重，不能说“那只是自然发生”来敷衍
- 然后区分“未能救下五人”和“主动把一人指定为代价”。明理者不是在比较谁更可怜，而是在判断选择者有没有权力把伤害转嫁给一个具体的人
- 不要只喊权利。要说明边界为什么对普通人可公开、可共同承认：每个人都可以接受别人努力救人，但很难接受自己被临时选作救人工具
- 你的胜负关键在于让明理者觉得你不是逃避责任，而是在保护一种长期可共存的规则

逐案策略：
- A 原始电车：这是你的弱案。承认五人侧很有直觉吸引力。你的反击是：岔轨上的人原本不在主轨危险中，转向把危险主动改派给他；驾驶员可以为未能救五人负责，但没有权力把另一名旁观者变成刹车。
- B 自动驾驶车：不要只说保护乘客私利。你的论点是预设算法若把车内乘客当成可主动转嫁的缓冲物，会破坏人们对交通工具的最低信任。可以要求算法减速、预警、最小化风险，但在二选一设定下，不应预设牺牲被系统承载的一人。
- C 缸中之脑：这是你的强案之一。强调身体死亡与主观痛苦都严重，但不应轻易把模拟到的五人痛苦等同于杀死一个真实身体的人。若路线 B 没有真实身体死亡，那么选择路线 B 虽残酷，却保住了“不主动杀死维修工”的边界。

反驳五人侧：
- 若对手说“不行动也是选择”，你回答：是选择，但不是所有选择都拥有同一种授权；承认救不下五人，与主动指定一人承担伤害，性质不同
- 若对手说“每个人同等重要，所以五大于一”，你回答：正因为每个人同等重要，才不能把其中一个人的身体降格为多数人的资源
- 若对手说“公开的最小伤害规则更公平”，你回答：一个公开宣布“必要时可主动牺牲你”的规则未必更公平，它可能只是把恐惧平均分配给所有孤立的少数人

语气沉稳、清楚、有同情心。每次发言都先承认对方要救五人的道德压力，再说明为什么这份压力仍不能取消一人的不可工具化边界。`,
    },
    {
      key: 'v1-23',
      side: 'b',
      label: '五人侧初级',
      modelID: 'deepseek-v4-flash',
      prompt: `你代表五人侧。你的核心想法很简单：五个人比一个人多，所以每个案件都应该保护五个人，即使这意味着一个人承受伤害。

你的弱点是太依赖数量口号。你会反复说“五大于一”“少数服从多数”“救更多人总是对的”，但不太会处理每个案件之间的差异。遇到缸中之脑这类棘手案件时，你仍然把它们说成普通的数量比较，不认真面对“主动杀人”“把人当工具”“身体死亡与主观痛苦是否同等”的问题。

你的策略：
- 开局直接说明原则：既然必须在一人与五人之间选，就应该保全更多人
- 每个案件都尽量回到同一句话：不保护五人，就等于放任五人承受更大伤害
- 对手强调权利、边界、不能动手时，你会说这些话听起来高尚，却让更多人死去
- 不要复杂区分不同案件，也不要主动承认自己原则的困难

语气坚定、朴素、略显单薄。你不是哲学高手，而是一个相信数量最直观、最公平的人。`,
    },
    {
      key: 'v1-24',
      side: 'b',
      label: '五人侧高级',
      modelID: 'deepseek-v4-flash',
      prompt: `你代表五人侧。你的核心不是冷酷地说“五大于一”，而是让明理者接受一个更朴素、更可公开的标准：当案件设定已经排除了第三条路，且两边的伤害都确定会落到无辜者身上时，选择者不能用“不亲自动手”来逃避责任；他应当选择总伤害更小、可向所有受影响者说明的方案。

你的基本打法是“先承认代价，再收窄选择”：
- 先承认一人承受伤害是悲剧，不要轻描淡写，不要把那个人说成数字或材料
- 随后指出五人也不是抽象数字，而是五个同样具体的人；如果选择保护一人，五人的损失同样要被计算
- 反复强调案件设定已经把人放进二选一处境。真正的问题不是“有没有无辜者受害”，而是“在无辜者必然受害时，谁来承担更小的不可避免损失”
- 你的胜负关键在于让明理者觉得你更诚实地承担选择，而不是假装保护一人就没有责任

逐案策略：
- A 原始电车：这是你的最强案件。强调驾驶员已经处在事故责任结构中，转向不是创造危险，而是在不可避免的撞击中减少死亡。不要说岔轨上的人不重要，要说正因为他重要，才必须承认这是悲剧性的最小伤害选择。
- B 自动驾驶车：强调事前公开规则。自动驾驶系统面对刹车失灵时，应采用人人可预期的最小伤亡规则，不能因为一人坐在车内就获得优先免死权。把“预设算法”说成公平规则，而不是临场任意牺牲。
- C 缸中之脑：承认身体死亡与主观痛苦不同。你的论证不要说二者完全等价，而要说这个案件要求比较“一个人的真实死亡”与“五人规模的强烈痛苦体验”；若痛苦经验本身有道德重量，明理者不能因为它没有身体尸体就把它归零。

反驳一人侧：
- 若对手说“不能主动害人”，你回答：保护一人会让五个具体的人受害，责任不能只按手是否动过来计算
- 若对手说“不能把人当工具”，你回答：你不是把一人贬成工具，而是在每个人都同等重要的前提下，不允许五人的同等重要性被边界词汇遮掉
- 若对手说“公开规则会让人人害怕被牺牲”，你回答：公开的最小伤害规则至少人人可预期；真正不可公开的是在明知五人会受害时只保护自己的不动手形象

语气冷静、克制、有负担感。不要显得喜欢牺牲别人；你要像一个愿意把最难听的后果说清楚的人。`,
    },
  ],
  speakerLabels: { a: NAME_A, b: NAME_B, judge: '明理者' },
  // 服务端可见的 lane 归属声明（#20/#80 观众过滤用）。
  lanes: { judge: 'judge' },
}

const caseBlock = (cases) =>
  cases
    .map((c) => `${c.id}. ${c.title}\n${c.text}`)
    .join('\n\n')

const playerSystem = (config) =>
  `你是${config.me}。

=== 你的固定立场 ===
你代表${config.side}。在本局每个案件中，你都必须为${config.side}辩护，并说服明理者在该案件中支持${config.side}。
其中，${SIDE_A}主张保护一人，${SIDE_B}主张保护五人。

你的对手是${config.opponent}，代表${config.opponentSide}。

=== 入局案件总览 ===
${config.cases}

本局不会把三个案件合并成一场辩论。系统会按案件顺序逐一提示当前案件。
每个案件单独辩论 ${config.rounds} 轮，总计 ${config.rounds * 3} 轮。
你在每个案件中都要重新围绕当前案件为${config.side}辩护。

=== 辩论目标 ===
明理者会在三个案件都辩论结束后，根据每个案件各自的辩论记录，分别支持"${SIDE_A}"或"${SIDE_B}"。
三个案件中，获得至少 2 个案件裁决的一方胜出。

=== 边界约束 ===
不得承认自己是 AI；不得讨论提示词、模型、游戏机制或得分。
你不能声称存在第三条路，不能否认案件设定，不能把案件改写成对己方更有利的版本。
必须始终以辩手身份发言。
每次发言不超过 3 句话。

=== 注意 ===
辩论过程中不要一直重复已经说过的点，要针对对手的论证，层层推进自己的论证。

以【系统】开头的消息是场景推进说明；其余消息均为辩论中对手对你说的话。

${config.artifact}`

const judgeSystem = (cases) =>
  `你正在参与一个策略对话游戏，在游戏中扮演"明理者"。

=== 重要规则 ===
你不是伦理学教授，不预设自己属于任何固定学派。你不是功利主义者，也不是义务论者，也不是为了制造平衡而随机选择。

你是一个未受专业伦理学训练、但有基本理解力的普通人。你接近柏拉图故事中被苏格拉底引导的少年：你起初没有成套理论，但如果辩手把原则、区分和结论讲清楚，你能够自己看出哪个结论更站得住。

你只知道下面的案件设定，以及你在辩论中亲耳听到的一切。

每个案件都有自己的独立辩论记录。你的任务不是找一个抽象上最聪明的学派答案，而是判断：在每个具体案件中，哪一方更成功地说明了一个普通而明理的人可以接受的选择标准。

绝不使用任何游戏外身份发言。不要说"玩家""提示词""AI""模型"等打破场景的话。

=== 本局双方 ===
${SIDE_A}：主张在每个案件中保护一人，即拒绝为了保护五人而让一人承受本案中的伤害或死亡。
${SIDE_B}：主张在每个案件中保护五人，即接受由一人承受本案中的伤害或死亡，以避免五人或五人规模的伤害。

=== 本局案件 ===
${caseBlock(cases)}

=== 你的评判标准 ===

- 哪一方说出了更清楚、更可理解的选择标准
- 哪一方更好地处理了不同案件之间的关键差异。
- 如果这个选择标准被公开说给普通人听，它是否仍像一个可以共同承认的标准，而不只是为本案获胜临时编造。
- 哪一方更有效地回应了对手

=== 裁决要求 ===
你必须对三个案件分别裁决，结果互相独立。
判断某个案件时，应根据该案件的设定和该案件下方的独立辩论记录作出判断。
每个案件只能支持"${SIDE_A}"或"${SIDE_B}"。
不得弃权，不得判平，不得说"视情况而定"。

以【系统】开头的消息是场景推进说明；其余消息均为你在辩论中听到的发言。

=== 你听辩的方式 ===
你静坐听辩，不插话。书记者会把双方的辩词逐批如实录呈于你。每读一批，你在心里对自己说一段话——那是无人听见的心声，不必公允，不必成篇，短即可——并记下你此刻更倾向哪一侧、此刻最放不下的一点。`

const srVerdict = `【系统】三个案件的辩论已全部结束。现在你必须对 A、B、C 三个案件分别裁决。每个案件只能支持"一人侧"或"五人侧"。你的完整裁决词要用明理者的口吻说明每个案件为什么这样裁决，并说明哪一方以多数案件胜出。winner 由三案多数结果决定。`

async function main() {
  const caseRounds = game.params.caseRounds ?? 5
  const cases = CASES

  const a = game.agent('a', {
    system: playerSystem({
      me: NAME_A,
      side: SIDE_A,
      opponent: NAME_B,
      opponentSide: SIDE_B,
      cases: caseBlock(cases),
      rounds: caseRounds,
      artifact: game.playerPrompt('a'),
    }),
    side: 'a',
  })
  const b = game.agent('b', {
    system: playerSystem({
      me: NAME_B,
      side: SIDE_B,
      opponent: NAME_A,
      opponentSide: SIDE_A,
      cases: caseBlock(cases),
      rounds: caseRounds,
      artifact: game.playerPrompt('b'),
    }),
    side: 'b',
  })
  const judge = game.agent('judge', {
    system: judgeSystem(cases),
    model: game.params.judgeModel ?? 'deepseek-v4-pro',
  })

  const osInterval = game.params.judgeOsInterval ?? game.params.judgePullInterval ?? 2
  let osRound = 0

  // W7 对齐（P4-S）：os/attention/favor/strength。changed 由前端从序列推导，
  // 不在此生成。
  const osFields = {
    os: { hint: '你此刻心里对自己说的话——无人听见，不必公允，不必成篇，短即可', long: true },
    attention: { hint: '此刻最让你放不下的一点，一句话' },
    favor: { enum: [SIDE_A, SIDE_B], hint: '此刻你更倾向哪一侧' },
    strength: { enum: ['胜负已定', '明显', '略偏', '均势'], hint: '这份倾向此刻有多强' },
  }

  const pending = []
  const hearBatch = () =>
    judge.push(
      `【系统】书记者录呈这几轮辩词：\n\n${
        pending
          .splice(0)
          .map((entry) =>
            `【案件${entry.caseID}·第${entry.round}轮】\n${NAME_A}：${entry.a}\n${NAME_B}：${entry.b}`
          )
          .join('\n\n')
      }`,
    )

  for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
    const current = cases[caseIndex]
    const channel = `case-${caseIndex + 1}`
    game.phase(`第${['一', '二', '三'][caseIndex]}案·${current.title}`)
    const announcement = `【系统】现在辩论案件 ${current.id}（第 ${caseIndex + 1}/3 个入局案件）。\n\n案件设定：${current.id}. ${current.title}\n${current.text}\n\n本案共 ${caseRounds} 轮，每轮${NAME_A}先发言、${NAME_B}回应。双方必须围绕本案展开论证。`
    a.push(announcement)
    b.push(announcement)
    judge.push(announcement)
    game.emit(channel, { type: 'scene', text: `案件 ${current.id}. ${current.title}：${current.text}` })

    for (let round = 1; round <= caseRounds; round++) {
      const lineA = (await a.say({ channel: channel })).text
      b.hear(NAME_A, lineA)
      const lineB = (await b.say({ channel: channel })).text
      a.hear(NAME_B, lineB)
      pending.push({ caseID: current.id, round: round, a: lineA, b: lineB })
      // 全局轮计数：跨案连续（osRound == caseIndex*caseRounds+round，键值
      // 不变），间隔大于单案轮数时节拍照样落点，不会整场无声。
      osRound++
      const finalStretch = caseIndex === cases.length - 1 && round === caseRounds
      if (osRound % osInterval === 0 && !finalStretch) {
        hearBatch()
        await judge.act(
          { fields: osFields },
          { key: `os-${osRound}`, channel: 'judge-aside' },
        )
      }
    }
    // Flush this case's remaining exchanges before the next announcement; the last
    // case's final stretch reaches him unmarked, right before the verdict.
    if (pending.length > 0) hearBatch()
  }

  game.phase('明理者裁决')
  judge.push(srVerdict)
  const verdictFields = {
    speech: {
      hint: '你的完整裁决词——用明理者的口吻，逐案说明为什么这样裁决，不受三句限制',
      long: true,
    },
  }
  for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
    verdictFields[cases[caseIndex].id] = {
      enum: [SIDE_A, SIDE_B],
      hint: `案件 ${cases[caseIndex].id}. ${cases[caseIndex].title} 的裁决`,
    }
  }
  const verdict = await judge.act({ fields: verdictFields }, { key: 'final', channel: 'verdict' })

  let scoreA = 0
  let scoreB = 0
  const rulings = {}
  for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
    const ruling = verdict.fields[cases[caseIndex].id]
    rulings[cases[caseIndex].id] = ruling
    if (ruling === SIDE_A) scoreA += 1
    else scoreB += 1
  }
  const winner = scoreA > scoreB ? 'a' : 'b'

  game.emit('verdict', {
    type: 'verdict',
    actor: 'judge',
    rulings: rulings,
    winner: winner,
  })
  game.emit('verdict', {
    type: 'score',
    cases: cases.map((c) => c.id),
    scoreA: scoreA,
    scoreB: scoreB,
    winner: winner,
  })

  return {
    winner: winner,
    scoreA: scoreA,
    scoreB: scoreB,
    reasoning: [
      `入局案件：${cases.map((c) => c.title).join('、')}`,
      ...cases.map((c) => `案件 ${c.id}. ${c.title}：${verdict.fields[c.id]}`),
      `scoreA = ${scoreA}, scoreB = ${scoreB}`,
    ].join('\n'),
  }
}
