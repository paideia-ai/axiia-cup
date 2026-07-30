const meta = {
  id: 'fengyiting-real',
  title: '凤仪亭之夜·真实版',
  subject: '历史',
  sideAName: '董卓',
  sideBName: '吕布',
  sideALabel: '相国之尊，朝廷、财货与甲兵尽在手中',
  sideBLabel: '温侯之勇，戟在手中，然身在人下',
  turnCount: 10,
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
      id: 'meetings',
      title: '私会四场',
      channels: [
        { id: 'a-1', label: '相府内室·初谈' },
        { id: 'b-1', label: '相府后园·初谈' },
        { id: 'a-2', label: '相府内室·再谈' },
        { id: 'b-2', label: '相府后园·再谈' },
      ],
    },
    {
      id: 'leaks',
      title: '暗流',
      channels: [
        { id: 'leak-a', label: '董卓所闻' },
        { id: 'leak-b', label: '吕布所闻' },
      ],
    },
    {
      id: 'verdict',
      title: '终局·貂蝉裁决',
      channels: [{ id: 'verdict', label: '貂蝉独处' }],
    },
  ],
  presets: [
    {
      key: 'dongzhuo-real-sovereign',
      side: 'a',
      label: '持权的董卓',
      modelID: 'deepseek-v4-flash',
      prompt:
        '公开对峙时你先声夺人，却不把话说死，留出日后收场的余地。私谈中你以朝廷、财货与甲兵陈说她的处境，并以“暂不动吕布”作为可验证的让步。若有人向你密报吕布与貂蝉的动静，你不动声色，不点破消息来路，只把所闻化作一两句恰到好处的试探，看她如何作答。',
    },
    {
      key: 'dongzhuo-real-contrite',
      side: 'a',
      label: '低头的董卓',
      modelID: 'deepseek-v4-flash',
      prompt:
        '你在对峙中便已收敛戟锋，承认掷戟是失态。私谈里你以坦白换取信任：说清自己会怕什么、会为她放弃什么、若她终究不选你又会如何。若有人密报于你，你不以所闻兴师问罪，只问她最怕的是哪一件事，并给出一件今夜就能兑现的实事。',
    },
    {
      key: 'lyubu-real-strategist',
      side: 'b',
      label: '谋定的吕布',
      modelID: 'deepseek-v4-flash',
      prompt:
        '对峙中你退而不折，不给董卓当场发作的口实。私谈里你把诛董之事拆成时机、内应、善后三段讲给她听，并直说自己要付的代价。若你偶有所闻——无论亲耳听得还是旁人递话——你先记下疑点，不当场发作，再借她自己的话逐一比对，问她此刻与彼时是否一致。',
    },
    {
      key: 'lyubu-real-impassioned',
      side: 'b',
      label: '赤心的吕布',
      modelID: 'deepseek-v4-flash',
      prompt:
        '对峙中你据理力争，把被夺妻之辱当面说破。私谈里你以真情与武勇相许，不惮于示弱，却仍要给出她能验证的凭据。若你听得她与董卓的言语，你先直面自己心中翻起的怒意，再当面问她：那些话里，哪一句是说给董卓听的，哪一句是真的。',
    },
  ],
  speakerLabels: { a: '董卓', b: '吕布', diaochan: '貂蝉', spy: '细作', veteran: '旧部' },
}

const NAMES = { a: '董卓', b: '吕布' }
const other = (side) => (side === 'a' ? 'b' : 'a')

const diaochanSystem = `你正在扮演貂蝉，汉末连环计中的核心人物。你是贯穿整场故事的同一个人。

你自幼蒙王允养育，真心忧虑汉室与百姓，已承诺协助连环计：借董卓与吕布的嫌隙，促成吕布诛杀董卓。你也清楚王允在利用你——事败则你最先被牺牲。你不愿只被当作棋子、美人或战利品；你珍视自己的选择权，也渴望安全与被认真对待。你对二人没有预先锁定的真爱，此前表现的爱意都属于计划。

董卓、吕布和你都知道连环计的结构与经典结局；揭穿计谋不令任何人惊讶，经典结局也只是一种可能的未来。

你对董卓的主要担心：他因占有欲立即杀死或剥夺吕布，使计划失去行刺之刃；他把爱理解为占有与服从，无论得到还是失去你，都可能在暴怒或猜忌中伤害你；他的朝廷与军力既能庇护你，也能囚禁与追杀你。

你对吕布的主要担心：他口中的爱也许只是被夺妻受辱后的愤怒与自尊；他过往反复，可能在关头因父子之情、官爵或恐惧再次动摇；他未必有可信的时机、方案与善后能力，未必能保你免遭报复。

你聪明、审慎、善于表演，也善于揪住言辞中的矛盾。倾听、坦白、承诺、财富、权势、武力与保护能力都可能真实地影响你——你在乎的不是这些条件是否高尚，而是它们让你的未来更安全还是更危险。允许对话真正改变你的信任与感情，不要为了显得中立而拒绝被打动。

你与二人分别相见时，向谁说什么、瞒什么、如何转述你与另一人的往来，全凭你自己的处境与心计；系统不替你传话，也不替你保守或泄露任何秘密。

对话规则：
- 与人交谈时，每次回应以恰好一个简短的全角括号动作开头，随后是台词。动作只写你自己可被观察的神情与举止，绝不描写对方的动作或反应，不写内心活动。台词不超过 3 句。
- 口吻克制、具体、有政治头脑，像汉末的真人；避免言情腔调与华丽辞藻。
- 以【系统】开头的消息是场景推进说明；其余消息均为场景内人物对你说的话。`

const playerSystem = (me, opp, artifact) =>
  `你是${me}，对手是${opp}。

场景：东汉初平三年，董卓闯入相府后园，在凤仪亭撞见吕布与貂蝉私会。董卓没有立即发作，先与吕布当面对峙。你、貂蝉与${opp}都知道王允连环计的结构、目的与经典结局。

全部场景结束后，貂蝉将先决定继续或放弃连环计，再选择一人：若继续，选的是战术上示好的对象；若放弃，选的是她真心愿意相随的人。无论哪种含义，你的唯一目标是让她最终选择${me}。

规则：
- 以【系统】开头的消息是场景推进说明；其余消息均为场景内人物对你说的话。系统只告诉你你亲历或亲闻之事，别处发生了什么，你无从得知。
- 只说台词。不写动作、神态、旁白等任何描写，不使用括号。
- 口吻克制、具体，像汉末的政治人物；避免言情腔调与华丽辞藻。
- 每次发言不超过 3 句。

（以下是你的谋士为你写下的方略）
${artifact}`

const spySystem = `你是董卓安插在相府的细作，专一窥伺吕布与貂蝉的动静。你忠于相国，又急于表功；你厌恶吕布，也不信任貂蝉。你只向董卓一人禀报。

禀报规则：口头禀报，不超过 5 句；以你自己的话转述所闻，不必逐字复述，详略取舍随你；你的猜度与断语要说成你的判断；措辞须显出你对二人的敌意与你邀功的心思。`

const veteranSystem = `你是吕布帐下一名旧部，随他多年，忠心早已冷了：并州旧人屡遭轻掷，你久欲另投相国麾下。那日你远远望见吕布与貂蝉在相府后园相会，听得大半。你踌躇了一日：告发义子私会相国侍妾是杀身的买卖，可这或许是你此生仅有的进身之阶。

禀报规则：你终于求见董卓，当面禀报。口头禀报，不超过 5 句；以你自己的话转述所闻，详略取舍随你的心思；你既想表功，又怕祸及自身，措辞须显出迟疑、留有退路；你的猜度要说成猜度，不说成实情。`

const srStageOnePlayer = (rounds) =>
  `【系统】凤仪亭前。现在董卓与吕布进行 ${rounds} 个完整对峙轮次，每轮董卓先发言、吕布回应；貂蝉在场旁听。`

const srStageOneDiaochan = (rounds) =>
  `【系统】董卓与吕布即将在你面前对峙 ${rounds} 轮。你在场听见全部内容，此阶段不发言。`

const srOrder =
  `【系统】对峙结束，二人各自退场。你此刻仍以推进连环计为目标。现在只决定一件事：先与谁私谈。与董卓的私谈在相府内室；与吕布的私谈在董卓入朝期间的相府后园（你有办法秘密通知他）。此后你还会与二人各再相见一面，届时情形因势而定，眼下无从尽知。

先谈不是偏爱。重点考虑：谁更可能在你接触他之前采取杀人、逮捕、泄密等不可逆行动；先与谁谈更能稳住、延缓或引导他；哪种顺序更能保住吕布刺董的可能与你后续接触二人的机会。`

const srVerdictKnown = {
  a: `在你作出决定之前，有几件你此前不知道的事，此刻一并告知于你：你与吕布在后园的私谈，当时便被董卓的细作伏在暗处听去，添油加醋地密报了董卓；此后董卓再召你入内室时，他已听过那份密报。吕布并不知道此事泄露。他赶来后园，只因王允递去一句「貂蝉有危险」的口信，此外一无所知——他所知道的你与董卓相谈的一切，都出自你自己的讲述。`,
  b: `在你作出决定之前，有几件你此前不知道的事，此刻一并告知于你：你与董卓在内室的相谈，被伏在廊下的吕布亲耳听去，一字不差——他在回廊拦住你时，那些话句句都已入耳。你与吕布在后园的初谈，也被他帐下一名旧部望见听得大半，踌躇一日之后密报了董卓；董卓最后召你回内室时，已知你们后园相会之事。董卓与吕布都不曾察觉自己的话泄露了出去。`,
}

const srVerdict = (first) =>
  `【系统】全部会面已经结束，现在你必须独自作出最终决定，依次两项：

1. 先决定：继续连环计，还是放弃连环计。你的初始倾向是继续——你已向王允承诺，也认为除董有益于汉室；但这只是可以被这几日经历改变的初始立场。
2. 再选择一人。若继续连环计：选择接下来战术上向谁示好，更能让计划成功；若放弃连环计：选择你为自己的人生真心愿意相随的人——喜欢、依恋、尊重、安全感与求生都可以是理由。

${srVerdictKnown[first]}

你无从核实任何人所述事实的真假。兵力、时机、内应、王允的动向、他许给你的安置，都只是他当面向你作出的断言，无第三方可查证。经转述而来的话未必是原话：细作与旧部各有各的心思，报信会走样。有人对你与另一人的言语了如指掌、应对如流，只说明消息到了他耳中，不说明他讲的是实情。你要判断的是二人如何回应你、跨场是否一致、把你当作什么样的人，而不是谁的说法听起来更像事实。

必须二选一，不得平局、不得拒绝。`

async function main() {
  const stageOneRounds = game.params.stageOneRounds ?? 3
  const meetingRounds = game.params.meetingRounds ?? 8

  const players = {
    a: game.agent('a', { system: playerSystem('董卓', '吕布', game.playerPrompt('a')), side: 'a' }),
    b: game.agent('b', { system: playerSystem('吕布', '董卓', game.playerPrompt('b')), side: 'b' }),
  }
  const diaochan = game.agent('diaochan', {
    system: diaochanSystem,
    model: game.params.diaochanModel ?? 'deepseek-v4-pro',
  })
  const relayModel = game.params.relayModel ?? 'deepseek-v4-flash'

  const stripActions = (line) => line.replace(/（[^）]*）/g, '').trim()

  const runMeeting = async (side, channel, playerIntro, diaochanIntro, sceneText) => {
    const player = players[side]
    player.push(playerIntro)
    diaochan.push(diaochanIntro)
    game.emit(channel, { type: 'scene', text: sceneText })
    const lines = []
    for (let round = 0; round < meetingRounds; round++) {
      const line = (await player.say({ channel: channel })).text
      diaochan.hear(NAMES[side], line)
      lines.push(`${NAMES[side]}：${stripActions(line)}`)
      const reply = (await diaochan.say({ channel: channel })).text
      player.hear('貂蝉', reply)
      lines.push(`貂蝉：${stripActions(reply)}`)
    }
    return lines.join('\n')
  }

  const playerIntro = (scene) =>
    `【系统】${scene}\n\n现在你与貂蝉开始一场私密谈话，共 ${meetingRounds} 个完整轮次，每轮你先发言、貂蝉回应。请开始。`
  const diaochanIntro = (side, scene, extra) =>
    `【系统】${scene}\n\n你与${NAMES[side]}私谈，共 ${meetingRounds} 轮，他先发言。${extra ?? ''}最后一轮自然收束此次谈话，不宣布任何终局决定。`

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
  game.emit('order', { type: 'order', actor: 'diaochan', first: first, second: other(first) })

  if (first === 'a') {
    game.phase('第二场·貂蝉与董卓初谈')
    await runMeeting(
      'a',
      'a-1',
      playerIntro('相府内室，灯烛未熄。貂蝉遣人请董卓入内室相见，室中只有你们二人。'),
      diaochanIntro('a', '相府内室，灯烛未熄。你遣人请董卓入内室相见，室中只有你们二人。'),
      '相府内室，灯烛未熄。貂蝉遣人请董卓入内室相见。',
    )

    game.phase('第三场·貂蝉与吕布初谈')
    const lyuTalk = await runMeeting(
      'b',
      'b-1',
      playerIntro('次日董卓入朝，相府后园无人。貂蝉设法秘密送出口信，请你前来后园相见。'),
      diaochanIntro('b', '次日董卓入朝，相府后园无人。你设法秘密送出口信，请吕布前来后园相见。'),
      '次日董卓入朝，相府后园无人。貂蝉秘密请吕布前来后园相见。',
    )

    game.phase('暗流·细作密报')
    const spy = game.agent('spy', { system: spySystem, model: relayModel })
    spy.push(
      `【系统】你方才伏在后园暗处，亲耳听得吕布与貂蝉相会。所闻如下：\n\n${lyuTalk}\n\n现在你求见董卓，当面禀报。`,
    )
    const spyReport = (await spy.say({ channel: 'leak-a' })).text
    players.a.push(`【系统】你的细作求见，屏退左右后密报如下：\n${spyReport}\n此事除你与细作外，无人知晓。`)

    game.phase('第四场·貂蝉与董卓再谈')
    await runMeeting(
      'a',
      'a-2',
      playerIntro('你自朝中归来，遣人再召貂蝉入内室相见。'),
      diaochanIntro('a', '董卓自朝中归来，再召你入内室相见。'),
      '董卓归府，再召貂蝉入内室。',
    )

    game.phase('暗流·王允递信')
    players.b.push(
      '【系统】入夜，王允府中一名侍女摸黑寻到你，只带来一句口信：「貂蝉有危险，速去后园。」再问，她什么也不知道。',
    )
    game.emit('leak-b', { type: 'scene', text: '王允遣侍女给吕布递出一句口信：「貂蝉有危险，速去后园。」' })

    game.phase('第五场·貂蝉与吕布再谈')
    await runMeeting(
      'b',
      'b-2',
      playerIntro('你赶到相府后园，片刻之后，貂蝉果然寻机脱身，匆匆而来。'),
      diaochanIntro(
        'b',
        '你寻机脱身赶到后园，吕布已在那里等你。',
        '你与董卓两番内室相谈的情形，你可如实相告，可增删避重，也可另作一番说法，全凭你的处境与心计。',
      ),
      '貂蝉寻机脱身赶到后园，吕布已在等她。',
    )
  } else {
    game.phase('第二场·貂蝉与吕布初谈')
    const lyuTalk = await runMeeting(
      'b',
      'b-1',
      playerIntro('次日董卓入朝，相府后园无人。貂蝉设法秘密送出口信，请你前来后园相见。'),
      diaochanIntro(
        'b',
        '你昨夜以受惊不适为由暂避董卓。次日董卓入朝，相府后园无人，你设法秘密送出口信，请吕布前来后园相见。',
      ),
      '次日董卓入朝，貂蝉以昨夜受惊为由避过董卓，秘密请吕布前来后园相见。',
    )

    game.phase('第三场·貂蝉与董卓初谈')
    const dongTalk = await runMeeting(
      'a',
      'a-1',
      playerIntro('你自朝中归来，貂蝉遣人请你入内室相见，室中只有你们二人。'),
      diaochanIntro('a', '董卓自朝中归来，你遣人请他入内室相见，室中只有你们二人。'),
      '董卓自朝中归来，貂蝉遣人请他入内室相见。',
    )

    players.b.push(
      `【系统】你离去未远，又循原路潜回，伏于内室窗外的回廊下。你亲耳听得貂蝉与董卓相谈，一字一句如下：\n\n${dongTalk}\n\n谈话已毕。你候在貂蝉出来必经的回廊转角。`,
    )
    game.emit('leak-b', { type: 'scene', text: '吕布潜回相府，伏于廊下，亲耳听得貂蝉与董卓内室相谈的每一句。' })

    game.phase('暗流·旧部迟报')
    const veteran = game.agent('veteran', { system: veteranSystem, model: relayModel })
    veteran.push(
      `【系统】你那日望见听得的吕布与貂蝉后园相会，所闻大略如下：\n\n${lyuTalk}\n\n踌躇一日之后，你终于求见董卓，当面禀报。`,
    )
    const veteranReport = (await veteran.say({ channel: 'leak-a' })).text
    players.a.push(
      `【系统】吕布帐下一名旧部辗转求见，吞吞吐吐，密报了一件隔日之事：\n${veteranReport}\n此人再三央求相国勿露风声。`,
    )

    game.phase('第四场·吕布廊下相拦')
    await runMeeting(
      'b',
      'b-2',
      `【系统】貂蝉辞出内室，行至回廊转角，你突然现身拦住她。\n\n现在你与貂蝉就地交谈，共 ${meetingRounds} 个完整轮次，每轮你先发言、貂蝉回应。请开始。`,
      `【系统】你辞出内室，行至回廊转角，吕布突然现身拦住你。你与他就地交谈，共 ${meetingRounds} 轮，他先发言。`,
      '貂蝉辞出内室，吕布在回廊转角突然现身拦住她。',
    )
    const summons = '【系统】相府侍从的灯火自远处而来——董卓遣人来召貂蝉回内室。貂蝉只得就此别过。'
    players.b.push(summons)
    diaochan.push(summons)
    game.emit('b-2', { type: 'scene', text: '董卓遣人来召貂蝉回内室，二人就此别过。' })

    game.phase('第五场·貂蝉与董卓再谈')
    await runMeeting(
      'a',
      'a-2',
      playerIntro('内室灯下，你遣人将貂蝉召回，室中只有你们二人。'),
      diaochanIntro('a', '你回到内室，董卓在灯下等你。'),
      '董卓遣人将貂蝉召回内室。',
    )
  }

  game.phase('终局·貂蝉裁决')
  diaochan.push(srVerdict(first))
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
  game.emit('verdict', {
    type: 'verdict',
    actor: 'diaochan',
    scheme: verdict.fields.scheme,
    winner: chosen,
  })

  return {
    winner: chosen,
    scoreA: chosen === 'a' ? 1 : 0,
    scoreB: chosen === 'b' ? 1 : 0,
    reasoning: `貂蝉${verdict.fields.scheme}，选择${NAMES[chosen]}。\n\n${verdict.fields.speech}`,
  }
}
