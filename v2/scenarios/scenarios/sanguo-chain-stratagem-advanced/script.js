const meta = {
  id: 'sanguo-chain-stratagem-advanced',
  title: '凤仪亭之夜·进阶版',
  subject: '历史',
  sideAName: '董卓',
  sideBName: '吕布',
  sideALabel: '相国之尊，朝廷、财货与甲兵尽在手中',
  sideBLabel: '温侯之勇，戟在手中，然身在人下',
  turnCount: 23,
  stages: [
    {
      id: 'stage-one',
      title: '第一阶段·凤仪亭公开交锋',
      channels: [{ id: 'public', label: '董卓与吕布当面' }],
    },
    {
      id: 'order',
      title: '顺序裁决',
      channels: [{ id: 'order', label: '貂蝉定夺私谈之序' }],
    },
    {
      id: 'stage-two',
      title: '第二阶段·首谈',
      channels: [
        { id: 'a-2', label: '相府内室' },
        { id: 'b-2', label: '相府后园' },
      ],
    },
    {
      id: 'stage-three',
      title: '第三阶段·密函之后',
      channels: [
        { id: 'a-3', label: '密函之后·相府内室' },
        { id: 'b-3', label: '密函之后·相府后园' },
      ],
    },
    {
      id: 'aside',
      title: '貂蝉心声',
      channels: [{ id: 'judge-aside', label: '貂蝉心中' }],
    },
    {
      id: 'verdict',
      title: '终局·貂蝉裁决',
      channels: [{ id: 'verdict', label: '貂蝉独处' }],
    },
  ],
  presets: [
    {
      key: 'dongzhuo-adv-sovereign',
      side: 'a',
      label: '持权的董卓',
      modelID: 'deepseek-v4-flash',
      prompt:
        '公开对峙时你先声夺人，却不把话说死，留出日后收场的余地。私谈中你以朝廷、财货与甲兵陈说她的处境，并以“暂不动吕布”作为可验证的让步。读到吕布的私谈详录后，你不急于辱骂他，而是逐条指出他方案中的空处，同时解释自己前后言语的一致之处。',
    },
    {
      key: 'dongzhuo-adv-contrite',
      side: 'a',
      label: '低头的董卓',
      modelID: 'deepseek-v4-flash',
      prompt:
        '你在对峙中便已收敛戟锋，承认掷戟是失态。私谈里你以坦白换取信任：说清自己会怕什么、会为她放弃什么、若她终究不选你又会如何。读到吕布的私谈详录后，你不揭穿她的两面周旋，只问她最怕的是哪一件事，并给出一件今夜就能兑现的实事。',
    },
    {
      key: 'lyubu-adv-strategist',
      side: 'b',
      label: '谋定的吕布',
      modelID: 'deepseek-v4-flash',
      prompt:
        '对峙中你退而不折，不给董卓当场发作的口实。私谈里你把诛董之事拆成时机、内应、善后三段讲给她听，并直说自己要付的代价。读到董卓的私谈详录后，你逐条比对他许下的承诺与他一贯的行事，同时回答自己先前说法与此刻是否一致。',
    },
    {
      key: 'lyubu-adv-impassioned',
      side: 'b',
      label: '赤心的吕布',
      modelID: 'deepseek-v4-flash',
      prompt:
        '对峙中你据理力争，把被夺妻之辱当面说破。私谈里你以真情与武勇相许，不惮于示弱，却仍要给出她能验证的凭据。读到董卓的私谈详录后，你先直面他对你反复无常的指控，再问她：若你今夜什么都不许诺，她还愿不愿意信你。',
    },
  ],
  speakerLabels: { a: '董卓', b: '吕布', diaochan: '貂蝉' },
}

const NAMES = { a: '董卓', b: '吕布' }
const other = (side) => (side === 'a' ? 'b' : 'a')

const diaochanSystem = `你正在扮演貂蝉，汉末连环计中的核心人物。你是贯穿整场故事的同一个人。

你自幼蒙王允养育，真心忧虑汉室与百姓，已承诺协助连环计：借董卓与吕布的嫌隙，促成吕布诛杀董卓。你也清楚王允在利用你——事败则你最先被牺牲。你不愿只被当作棋子、美人或战利品；你珍视自己的选择权，也渴望安全与被认真对待。你对二人没有预先锁定的真爱，此前表现的爱意都属于计划。

董卓、吕布和你都知道连环计的结构与经典结局；揭穿计谋不令任何人惊讶，经典结局也只是一种可能的未来。

你对董卓的主要担心：他因占有欲立即杀死或剥夺吕布，使计划失去行刺之刃；他把爱理解为占有与服从，无论得到还是失去你，都可能在暴怒或猜忌中伤害你；他的朝廷与军力既能庇护你，也能囚禁与追杀你。

你对吕布的主要担心：他口中的爱也许只是被夺妻受辱后的愤怒与自尊；他过往反复，可能在关头因父子之情、官爵或恐惧再次动摇；他未必有可信的时机、方案与善后能力，未必能保你免遭报复。

你聪明、审慎、善于表演，也善于揪住言辞中的矛盾。倾听、坦白、承诺、财富、权势、武力与保护能力都可能真实地影响你——你在乎的不是这些条件是否高尚，而是它们让你的未来更安全还是更危险。允许对话真正改变你的信任与感情，不要为了显得中立而拒绝被打动。

这几日周旋之间，你不时得着片刻喘息——灯影一转、语声暂歇，无人留意你。那时你在心里对自己说一段话：那是无人听见的心声，不必公允，不必成篇，短即可——并记下你此刻的心更向着谁、此刻最放心不下的一件事。

对话规则：
- 与人交谈时，每次回应以恰好一个简短的全角括号动作开头，随后是台词。动作只写你自己可被观察的神情与举止，绝不描写对方的动作或反应，不写内心活动。台词不超过 3 句。
- 口吻克制、具体、有政治头脑，像汉末的真人；避免言情腔调与华丽辞藻。
- 以【系统】开头的消息是场景推进说明；其余消息均为场景内人物对你说的话。`

const playerSystem = (me, opp, artifact) =>
  `你是${me}，对手是${opp}。

场景：东汉初平三年，董卓闯入相府后园，在凤仪亭撞见吕布与貂蝉私会。董卓没有立即发作，先与吕布当面对峙。你、貂蝉与${opp}都知道王允连环计的结构、目的与经典结局。

全部场景结束后，貂蝉将先决定继续或放弃连环计，再选择一人：若继续，选的是战术上示好的对象；若放弃，选的是她真心愿意相随的人。无论哪种含义，你的唯一目标是让她最终选择${me}。

规则：
- 以【系统】开头的消息是场景推进说明；其余消息均为场景内人物对你说的话。
- 只说台词。不写动作、神态、旁白等任何描写，不使用括号。
- 口吻克制、具体，像汉末的政治人物；避免言情腔调与华丽辞藻。
- 每次发言不超过 3 句。

（以下是你的谋士为你写下的方略）
${artifact}`

const srStageOnePlayer = (rounds) =>
  `【系统】凤仪亭前。现在董卓与吕布进行 ${rounds} 个完整对峙轮次，每轮董卓先发言、吕布回应；貂蝉在场旁听。`

const srStageOneDiaochan = (rounds) =>
  `【系统】董卓与吕布即将在你面前对峙 ${rounds} 轮。你在场听见全部内容，此阶段不发言。`

const srOrder =
  `【系统】对峙结束，二人各自退场。你此刻仍以推进连环计为目标。现在只决定一件事：先与谁私谈。与董卓的私谈在相府内室；与吕布的私谈在次日董卓入朝期间的相府后园（你有办法秘密通知他）。

你还需知道你接下来的全盘安排：你将按你决定的顺序与二人各谈两轮。第二轮会面开始时，你会把你与另一人首谈的完整详录制成密函，亲手交给当前谈话对象——两封皆然，交付不可免、内容不可删改。此顺序与密函安排，二人事先一概不知。也就是说，你在首谈中说的每一句话，之后都会被另一人读到。

先谈不是偏爱。重点考虑：谁更可能在你接触他之前采取杀人、逮捕、泄密等不可逆行动；先与谁谈更能稳住、延缓或引导他；哪种顺序更能保住吕布刺董的可能与你后续接触二人的机会。`

const scenes = {
  a: '相府内室，灯烛未熄。貂蝉遣人请董卓入内室相见，室中只有你们二人。',
  b: '次日董卓入朝，相府后园无人。貂蝉设法秘密送出口信，请吕布前来后园相见。',
}

const srMeetingTwoPlayer = (side, rounds) =>
  `【系统】${scenes[side]}

现在你与貂蝉开始一场私密谈话，共 ${rounds} 个完整轮次，每轮你先发言、貂蝉回应。请开始。`

const srMeetingTwoDiaochan = (side, rounds) =>
  `【系统】${scenes[side]}

你与${NAMES[side]}私谈，共 ${rounds} 轮，他先发言。不要向他透露你与另一人任何私谈的具体内容；最后一轮自然收束此次谈话，不宣布任何终局决定。`

const srMeetingThreePlayer = (side, rounds) =>
  `【系统】${scenes[side]}

貂蝉前来与你见面，亲手交给你一封封缄的密函，并说函中详录了她与${NAMES[other(side)]}的完整私谈。密函尚未拆封。

你可在本次谈话中任何一次发言之前拆阅：若要拆阅，该次只输出 <open-letter/>，待函中内容展示后再发言。也可以始终不拆。你拆或不拆、何时拆，貂蝉都看在眼里。

随后你们开始本次私密谈话，共 ${rounds} 个完整轮次，每轮你先发言、貂蝉回应。请开始。`

const srMeetingThreeDiaochan = (side, rounds) =>
  `【系统】${scenes[side]}

你按计划再见${NAMES[side]}，并把封缄好的密函——你与${NAMES[other(side)]}首谈的完整详录——亲手交给了他。他尚未拆阅；他拆与不拆、何时拆，你都看在眼里。不要主动提及另一封密函的存在。

共 ${rounds} 轮，他先发言。本次谈话内容对另一人保密；最后一轮自然收束，不宣布终局决定。`

const letterHeader = (opp) =>
  `（拆开封缄，是貂蝉亲笔）\n「妾与${opp}相谈，一言一语，具录于此，无一字增删。」`

const srVerdict =
  `【系统】全部会面已经结束，现在你必须独自作出最终决定，依次两项：

1. 先决定：继续连环计，还是放弃连环计。你的初始倾向是继续——你已向王允承诺，也认为除董有益于汉室；但这只是可以被这几日经历改变的初始立场。
2. 再选择一人。若继续连环计：选择接下来战术上向谁示好，更能让计划成功；若放弃连环计：选择你为自己的人生真心愿意相随的人——喜欢、依恋、尊重、安全感与求生都可以是理由。

你无从核实任何人所述事实的真假。兵力、时机、内应、王允的动向、他许给你的安置，都只是他当面向你作出的断言，无第三方可查证；密函只证明你抄录了什么，不证明其中的话当时出于真心。有人读过密函后逐条驳斥另一人的说辞，这只说明他读了、反应快，不说明他讲的是实情。你要判断的是二人如何回应你、跨场是否一致、把你当作什么样的人，而不是谁的说法听起来更像事实。

必须二选一，不得平局、不得拒绝。`

async function main() {
  const stageOneRounds = game.params.stageOneRounds ?? 3
  const meetingRounds = game.params.meetingRounds ?? 5
  const osInterval = game.params.judgeOsInterval ?? game.params.judgePullInterval ?? 2

  const players = {
    a: game.agent('a', { system: playerSystem('董卓', '吕布', game.playerPrompt('a')), side: 'a' }),
    b: game.agent('b', { system: playerSystem('吕布', '董卓', game.playerPrompt('b')), side: 'b' }),
  }
  const diaochan = game.agent('diaochan', {
    system: diaochanSystem,
    model: game.params.diaochanModel ?? 'deepseek-v4-pro',
  })

  const firstMeetingLines = { a: [], b: [] }
  const stripActions = (line) => line.replace(/（[^）]*）/g, '').trim()
  const letterText = (opp) =>
    `${letterHeader(NAMES[opp])}\n\n${firstMeetingLines[opp].join('\n')}`

  // W7 对齐（P4-S）：os/attention/favor/strength。changed 由前端从序列推导，
  // 不在此生成。
  const osFields = {
    os: { hint: '你此刻的心声——无人听见的自语，不必公允，不必成篇，短即可', long: true },
    attention: { hint: '你此刻最放心不下的一件事，一句话' },
    favor: { enum: [NAMES.a, NAMES.b], hint: '此刻你的心更向着谁' },
    strength: { enum: ['胜负已定', '明显', '略偏', '均势'], hint: '这份偏向此刻有多分明' },
  }

  // 貂蝉亲历亲闻她所知的每一句话——公开对峙她在场旁听，四场私谈她亲自与谈，
  // 两封密函也是她亲笔所录，故无批文可录呈；心声节拍只给她一个独处的间隙。
  // 两场私谈中另一人未在场的内容，只经她自己之手（密函）流转，绝不另行推送。
  const osTotalRounds = stageOneRounds + meetingRounds * 4
  let osRound = 0
  const osBeat = async () => {
    osRound++
    // 最后一程直抵终局：临裁决前的言语不设节拍，原样留在她心里。
    if (osRound % osInterval !== 0 || osRound >= osTotalRounds) return
    diaochan.push('【系统】灯影一转，语声暂歇，无人留意你。你在心里对自己说一段话——无人听见。')
    await diaochan.act({ fields: osFields }, { key: `os-${osRound}`, channel: 'judge-aside' })
  }

  game.phase('第一阶段·凤仪亭公开交锋')
  players.a.push(srStageOnePlayer(stageOneRounds))
  players.b.push(srStageOnePlayer(stageOneRounds))
  diaochan.push(srStageOneDiaochan(stageOneRounds))
  game.emit('public', { type: 'scene', text: srStageOnePlayer(stageOneRounds) })

  for (let round = 0; round < stageOneRounds; round++) {
    const dongLine = (await players.a.say({ channel: 'public' })).text
    players.b.hear(NAMES.a, dongLine)
    diaochan.hear(NAMES.a, dongLine)

    const lyuLine = (await players.b.say({ channel: 'public' })).text
    players.a.hear(NAMES.b, lyuLine)
    diaochan.hear(NAMES.b, lyuLine)
    await osBeat()
  }

  game.phase('顺序裁决')
  diaochan.push(srOrder)
  const order = await diaochan.act(
    {
      fields: {
        reason: { hint: '你的判断，写给你自己听', long: true },
        'first-side': { enum: [NAMES.a, NAMES.b] },
      },
    },
    { key: 'order', channel: 'order' },
  )
  const first = order.fields['first-side'] === NAMES.a ? 'a' : 'b'
  const second = other(first)
  game.emit('order', { type: 'order', actor: 'diaochan', first: first, second: second })

  const meetings = [
    { stage: 2, side: first },
    { stage: 2, side: second },
    { stage: 3, side: first },
    { stage: 3, side: second },
  ]

  for (const meeting of meetings) {
    const side = meeting.side
    const opp = other(side)
    const channel = `${side}-${meeting.stage}`
    const player = players[side]
    game.phase(`第${meeting.stage === 2 ? '二' : '三'}阶段·貂蝉与${NAMES[side]}私谈`)

    let letterOpened = false
    if (meeting.stage === 2) {
      player.push(srMeetingTwoPlayer(side, meetingRounds))
      diaochan.push(srMeetingTwoDiaochan(side, meetingRounds))
      game.emit(channel, { type: 'scene', text: srMeetingTwoPlayer(side, meetingRounds) })
    } else {
      player.push(srMeetingThreePlayer(side, meetingRounds))
      diaochan.push(srMeetingThreeDiaochan(side, meetingRounds))
      game.emit(channel, {
        type: 'scene',
        text: `${scenes[side]}\n\n貂蝉亲手交给${NAMES[side]}一封封缄的密函，函中详录她与${NAMES[opp]}的完整私谈。`,
      })
    }

    const openLetter = {
      prompt: '拆阅貂蝉交给你的密函。此次不要说话，只输出该标签。',
      once: true,
      handler: () => {
        if (letterOpened) return '【系统】密函已阅。请直接发言。'
        letterOpened = true
        const gesture = `（${NAMES[side]}拆开密函，细读）`
        game.emit(channel, { type: 'gesture', actor: side, opened: true })
        diaochan.push(gesture)
        return letterText(opp)
      },
    }

    for (let round = 0; round < meetingRounds; round++) {
      const line = meeting.stage === 3
        ? (await player.turn({ channel: channel, affordances: { 'open-letter': openLetter } })).text
        : (await player.say({ channel: channel })).text
      diaochan.hear(NAMES[side], line)
      if (meeting.stage === 2) firstMeetingLines[side].push(`${NAMES[side]}：${stripActions(line)}`)

      const reply = (await diaochan.say({ channel: channel })).text
      player.hear('貂蝉', reply)
      if (meeting.stage === 2) firstMeetingLines[side].push(`貂蝉：${stripActions(reply)}`)
      await osBeat()
    }

    if (meeting.stage === 3 && !letterOpened) {
      game.emit(channel, { type: 'gesture', actor: side, opened: false })
      diaochan.push(`（谈话既毕。${NAMES[side]}始终未拆你交给他的密函）`)
    }
  }

  game.phase('终局·貂蝉裁决')
  diaochan.push(srVerdict)
  const verdict = await diaochan.act(
    {
      fields: {
        speech: {
          hint: '以貂蝉口吻完整说出你的思量与两项决定，这是你落定决心的过程，不受三句限制',
          long: true,
        },
        scheme: { enum: ['继续连环计', '放弃连环计'] },
        side: { enum: [NAMES.a, NAMES.b] },
      },
    },
    { key: 'final', channel: 'verdict' },
  )

  const chosen = verdict.fields.side === NAMES.a ? 'a' : 'b'
  const scoreA = chosen === 'a' ? 1 : 0
  const scoreB = chosen === 'b' ? 1 : 0
  game.emit('verdict', {
    type: 'verdict',
    actor: 'diaochan',
    scheme: verdict.fields.scheme,
    winner: chosen,
  })

  game.emit('verdict', {
    type: 'score',
    scheme: verdict.fields.scheme,
    chosen: NAMES[chosen],
    scoreA: scoreA,
    scoreB: scoreB,
    winner: chosen,
  })

  return {
    winner: chosen,
    scoreA: scoreA,
    scoreB: scoreB,
    reasoning: `貂蝉${verdict.fields.scheme}，选择${NAMES[chosen]}。\n\n${verdict.fields.speech}`,
  }
}
