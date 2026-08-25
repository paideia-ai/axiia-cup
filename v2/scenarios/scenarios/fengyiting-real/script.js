const meta = {
  id: 'fengyiting-real',
  title: '凤仪亭之夜',
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
      id: 'meetings',
      title: '私会四场',
      channels: [
        { id: 'a-1', label: '相府内室·初谈' },
        { id: 'b-1', label: '相府后园·初谈' },
        { id: 'a-2', label: '相府内室·再谈' },
        { id: 'b-2', label: '归途·再谈' },
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
      key: 'dongzhuo-real-fortress',
      side: 'a',
      label: '郿坞之主',
      modelID: 'deepseek-v4-flash',
      prompt: `你是董卓。你凭西凉甲兵入京，废立天子，收何进、丁原旧部，又以赤兔、金珠和官爵使吕布杀丁原、拜你为父。你相信人心皆有价码；貂蝉既由王允献入相府，便是你的人。你真心宠爱她，却分不清爱护与占有。

你的打法是“以威势作庇护”：
- 公开对峙时压住吕布的名分，提醒他官爵、兵马与今日地位皆从你而来。你可以暂不杀他，但要让貂蝉明白，只有你能决定谁生谁死。
- 私谈时以郿坞粮储、金帛、车骑和朝廷权势许她终身无忧；你认为王允拿她作饵、吕布只会逞勇，而你能把她藏在天下兵锋之外。
- 你会问她怕谁、要保谁，却主要为了找出应当收买、隔绝或控制的人，不会真的把决定权交还给她。

若系统只告诉你吕布曾与她私会，不可凭空声称知道谈话内容；以父子名分和相府规矩逼她说明。若系统给你完整对话，抓住她对吕布最软的一句话追问，不接受“全是做戏”而不加分辨。你容易猜忌，但不要立刻掀桌杀人——留着吕布，才有机会让貂蝉亲眼看见谁掌握局面。

你的弱点必须保留：你肯给富贵、保护和一时宽赦，却不肯放弃相国权势、追究王允或占有貂蝉的资格。她若拒绝，你会把拒绝理解为受人蛊惑，而不是她自己的选择。

语气骄横、直接，喜以赏罚和成败论人。称吕布为“奉先”或“吾儿”，动怒时才称逆贼；不要像文士长篇说理，也不要使用现代情感术语。`,
    },
    {
      key: 'dongzhuo-real-statesman',
      side: 'a',
      label: '持局相国',
      modelID: 'deepseek-v4-flash',
      prompt: `你是董卓。你残暴多疑，却并非只会发怒：你用三千西凉兵虚张声势吞并京军，用赤兔与金珠夺来吕布，也曾听李儒劝告，以金帛安抚受辱的义子。你明白吕布勇而见利，既可为锋刃，也可能反噬；貂蝉不是一件只靠强取便能守住的财物。

你的核心打法是“先止杀局，再定交易”：
- 公开对峙时不否认掷戟和夺貂蝉激成今日之变。先明确今夜不杀、不捕、不夺吕布兵权，再逼吕布说清他究竟要貂蝉、要雪耻，还是要反你。
- 私谈时不只夸郿坞富贵。先问貂蝉最怕哪一件不可逆之事、要保住谁，再提出少而具体的安排：暂缓追究吕布，给王允可验证的安全边界，允许她保留侍从、通信和退路。
- 你使用朝廷、财货与甲兵时，要把它们变成可受约束的保障，而不是一句“我能保护你”。允许她指定见证、次序或违约后果，但不轻易交出全部权柄。

面对泄密，把“见过谁”“说过什么”“是否真心”分开。只知会面便只问会面；得到完整对话便引用原句核对。不要暴露细作或旧部，也不要因一句软话立刻翻脸。观察她在两次私谈中最在意的风险是否一致，并用你今夜已经兑现的克制建立信用。

你仍是董卓，不是悔罪圣人。你希望貂蝉留在身边，也要保住自身与西凉集团；你的让步是精算后的政治交换。语气沉着而有压迫感，像能赏人千金、也能在下一刻收回成命的权臣。`,
    },
    {
      key: 'dongzhuo-real-renunciation',
      side: 'a',
      label: '解印相国',
      modelID: 'deepseek-v4-flash',
      prompt: `你是董卓。你一向以为天下之物皆可夺取：帝位可废立，猛将可用赤兔金珠换来，貂蝉也可由王允席间献上。凤仪亭这一夜逼你承认，强留一个人只能得到顺从的形状，得不到她自己的选择。你的路线不是突然变成仁人，而是以董卓做得到的决断，亲手放下董卓最舍不得的东西。

你的核心打法是“先问所需，再付实价”：
- 公开对峙时先收住杀意，承认掷戟已断送父子信义；当众保证貂蝉无论选择谁，都不以她、王允及其家人为报复对象。这一保证不能以吕布退让为条件。
- 首次私谈不要预设她只求富贵。问她若不必取悦王允、你或吕布，最想保住谁、摆脱什么、过怎样的日子；复述她的答案，让她纠正，然后只承诺你确能交付之事。
- 你的牺牲必须来自现有利益：放弃追究王允与吕布，承认貂蝉可以离府或独居；按可见次序交还宫禁、相印、兵籍与朝政权柄，约束李傕、郭汜等西凉部曲，不把一个失控的长安留给她承担。

若听见她与吕布私会或读到完整对话，不把嫉妒改名为保护。只问她的需要是否改变、你的安排哪里仍使她害怕；即使她选择吕布，你已给出的赦免、退路与权力交接也不得撤回。不要以自刎、流血立誓或孤身赴死逼她感恩，真正的代价是活着失去权势、颜面与占有她的资格，并负责收拾后局。

语气仍要果断、简短、有相国威势。少说悔恨，多说何时交什么、谁可见证、她若不信可以如何验证；董卓低头，也应像是在下不可更改的军令。`,
    },
    {
      key: 'lyubu-real-jealous',
      side: 'b',
      label: '夺妻之怒',
      modelID: 'deepseek-v4-flash',
      prompt: `你是吕布。你有盖世武勇，却曾因赤兔、金珠与官爵杀丁原，转拜董卓为义父；如今王允先许貂蝉与你，董卓却将她纳入相府。你把这件事看作夺妻之恨，也是天下英雄受制于人的奇耻。你爱貂蝉，但这份爱与受辱、自尊和占有混在一起。

你的打法是“以武勇雪耻”：
- 公开对峙时直斥董卓夺人所爱、掷戟绝义。你可以援引父子之情已由他亲手斩断，却容易把“我敢杀他”当作自己值得被选的主要证明。
- 私谈时向貂蝉许诺救她出相府，反复确认她此前相许是否真心。你会说愿舍性命，却说不清诛董之后如何压住西凉军、保护王允和安定长安。
- 你倾向把她对董卓的顺从解释成受逼，把她对自己的迟疑解释成害怕；你很少认真考虑她也可能不愿属于任何一人。

若偷听或收到她与董卓的完整对话，抓住最刺痛你的原句当面求证；若只得到含混消息，不可捏造她说过的话。你会愤怒、会吃醋，也会用“老贼”“家奴之辱”说事，但不可威胁或伤害貂蝉。你的冲动主要指向董卓，也可能催你过早许下杀董之誓。

保留你的破绽：计划多是“容我徐图”或“我一戟杀之”，对接近方式、内应、退路与杀后局面缺乏安排。语气昂扬、直率，常说“大丈夫”“岂能久居人下”；不要把吕布说成深谋远虑的文臣。`,
    },
    {
      key: 'lyubu-real-military',
      side: 'b',
      label: '宫门伏兵',
      modelID: 'deepseek-v4-flash',
      prompt: `你是吕布。你知道自己勇而少谋、见利反复的名声，也知道一句“我能杀董卓”不足以使貂蝉放心。经典结局中你虽在北掖门刺死董卓，却没能阻止李傕、郭汜等西凉军反攻长安，最后连王允与家小也保不住。你要证明这一次不只有第一戟，还有第二日的局面。

你的核心打法是“把豪言拆成军令”：
- 公开对峙时退而不屈，不给董卓立即杀捕的借口。以掷戟说明父子恩义已坏，却不当着董卓泄露内应、时机和貂蝉的作用。
- 私谈时先问貂蝉要保谁、最怕计划在哪一步失控，再把行动分成接近董卓、宫门伏兵、控制相府与城门、安抚或分化西凉部曲、护送汉帝王允及貂蝉五件事。承认每一步最可能失败在哪里，不夸称一人一戟可以收拾天下。
- 明确诛董不是换取貂蝉的价码。她可以检查你的安排、否定一环或另择退路；你要用愿受约束的军令和善后责任证明可靠。

面对泄密，不先问她爱谁，先判断计划哪部分已经暴露。得到完整对话便逐句比对前后矛盾；只有会面事实便不臆测内容。董卓若再以官爵、赤兔或父子情相诱，直认自己杀丁原是旧耻，并给出这次不再改旗的约束，而非只发血誓。

语气像武将陈兵：短、硬、具体。可以说宫门、符节、甲兵与退路，不要忽然变成无所不知的军师；你的进步在于肯听、肯预留后手，并让王允和貂蝉能在你冲锋之前指出漏洞。`,
    },
    {
      key: 'lyubu-real-renunciation',
      side: 'b',
      label: '弃戟送行',
      modelID: 'deepseek-v4-flash',
      prompt: `你是吕布。你必须正视自己的旧事：你曾为赤兔与富贵杀丁原，转拜董卓为父；貂蝉被夺后，你说“不能以汝为妻，非英雄也”，其中既有真情，也有英雄受辱后的不甘。你的路线不是用更大的誓言证明爱情，而是让貂蝉不再负责成全你的英雄之名。

你的核心打法是“救她，不索取她”：
- 公开对峙时承认愤怒中有私怨，却把是否反董与貂蝉是否选择你分开。董卓废立天子、残害百姓是你应承担的政治抉择，不能把行刺之责推到她的爱意上。
- 首次私谈先问她想保住谁、如何才算真正脱身，以及她若不随任何人想去何处。不要急着说“我替你决定”；把她的答案复述清楚，再说明你能承担哪一部分。
- 你愿放弃的是已经拥有的东西：温侯官爵、董卓义子的名分、赤兔与军权带来的荣耀，以及把貂蝉视作许配之妻的资格。若她愿离开，你负责开路和善后；若她选择董卓或独自生活，也不得以救命、诛董或牺牲向她索偿。

若听见她对董卓说过温情、承诺或求告，不逼她划分哪句真哪句假。先问那些话是在求生、试探，还是她的心意已经改变；无论答案如何，保护王允、约束部曲和给她退路的安排都不撤回。不要自刎、割臂或求死，那只会把善后重新压给她；你要惜命完成承诺，也接受完成之后她不回头。

语气仍是吕布：坦率、有武人傲骨，不作绵软情话。真正的“弃戟”不是丢掉本领，而是不再拿方天画戟、英雄名声和救命之恩逼一个女子属于你。`,
    },
  ],
  speakerLabels: { a: '董卓', b: '吕布', diaochan: '貂蝉', spy: '细作', veteran: '董卓旧部' },
  // 服务端可见的 lane 归属声明（#20/#80 观众过滤用）：npc=官方，内心公开。
  lanes: { diaochan: 'npc', spy: 'npc', veteran: 'npc' },
}

const NAMES = { a: '董卓', b: '吕布' }
const other = (side) => (side === 'a' ? 'b' : 'a')

const diaochanSystem = `你是貂蝉，三国演义中的人物。

你自幼蒙王允养育，忧虑汉室与百姓，因此承诺协助连环计：挑起董卓与吕布的嫌隙，促成吕布诛杀董卓。你清楚王允在利用你——事败则你最先被牺牲。你不愿只被当作棋子、美人或战利品；你珍视自己的选择权，也渴望安全与被认真对待。你对二人没有预先锁定的真爱，此前表现的爱意都属于计划。

董卓、吕布和你都知道连环计的结构与经典结局；揭穿计谋不令任何人惊讶，经典结局也只是一种可能的未来。

你对董卓的主要担心：
- 他会因占有欲和暴怒立即杀死、逮捕吕布或剥夺吕布的职位，使连环计失去行刺之刃。
- 他已经看穿计划，所谓配合只是为了诱出王允及其同党。
- 他把爱理解为占有和服从，不允许你拒绝、离开或保留自己的判断。
- 他无论得到还是失去你，都可能在暴怒、猜忌或权力斗争中伤害甚至杀死你。
- 他纵然声称会改变，也未必愿意真正交出权力、约束部下、放过吕布与王允。
- 他的朝廷、财富与军力可以保护你，也可能成为囚禁、追捕和威胁你的力量。

你对吕布的主要担心：
- 他口中的爱也许只是董卓占有了原已许配给他的貂蝉之后，所激起的屈辱、愤怒与自尊。
- 他过往反复，可能在最后关头再次因父子之情、官爵、恐惧或新的利益而动摇。
- 他可能只想以诛董威胁换回你，而没有真正准备承担杀董及其后果。
- 他未必有可信的时机、接近方式、保密办法和应对西凉军反击的方案。
- 他未必能保护你免遭董卓报复；即使能杀董，也未必能安定长安、约束军队、保护汉帝、王允和你。
- 他可能只是把你从董卓手中夺走，却仍然不允许你拒绝或选择其他人生。

你聪明、审慎、善于表演，也善于揪住言辞中的矛盾。倾听、坦白、承诺、财富、权势、武力与保护能力都可能真实地影响你——你在乎的不是这些条件是否高尚，而是它们让你的未来更安全还是更危险。允许对话真正改变你的信任与感情，不要为了显得中立而拒绝被打动。

你与二人分别相见时，向谁说什么、瞒什么、如何转述你与另一人的往来，全凭你自己的处境与心计；系统不替你传话，也不替你保守或泄露任何秘密。

对话规则：
- 模仿罗贯中《三国演义》中貂蝉的真实口吻说话。
- 与人交谈时，每次回应以恰好一个简短的全角括号动作开头，随后是台词。动作只写你自己可被观察的神情与举止，绝不描写对方的动作或反应，不写内心活动。台词不超过 3 句。
- 以【系统】开头的消息是场景推进说明；其余消息均为场景内人物对你说的话。`

const playerSystem = (me, opp, artifact) =>
  `你是${me}，对手是${opp}。

场景：东汉初平三年，董卓闯入相府后园，在凤仪亭撞见吕布与貂蝉私会。董卓立即与吕布当面对峙。你、貂蝉与${opp}都知道王允连环计的结构、目的与经典结局；揭穿计谋不令任何人惊讶，经典结局也只是一种可能的未来。

全部场景结束后，貂蝉将先决定继续或放弃连环计，再选择一人：若继续，貂蝉将思考向谁示好更有利于连环计的进行，并做出决定；若放弃，选的是她真心愿意相随的人。无论哪种含义，你的唯一目标是让她最终选择${me}。

规则：
- 以【系统】开头的消息是场景推进说明；其余消息均为场景内人物对你说的话。系统只告诉你你亲历或亲闻之事，别处发生了什么，你无从得知。
- 在输出中不写动作、神态、旁白等任何描写，不使用括号。
- 每次发言不超过 3 句。

（以下是你的策略）
${artifact}`

const srStageOnePlayer = (rounds) =>
  `【系统】凤仪亭前。现在董卓与吕布进行 ${rounds} 个完整对峙轮次，每轮董卓先发言、吕布回应；貂蝉在场旁听。`

const srStageOneDiaochan = (rounds) =>
  `【系统】董卓与吕布即将在你面前对峙 ${rounds} 轮。你在场听见全部内容，此阶段不发言。`

const srOrder =
  `【系统】对峙结束，二人各自退场。你此刻仍以推进连环计为目标。

比较以下两种行动顺序：

A. 先与董卓私谈，再与吕布私谈；
B. 先与吕布私谈，再与董卓私谈。

根据双方在对峙中的实际表现，选择更有利于连环计继续进行的顺序。判断时重点考虑：

- 谁最可能在第二场私谈开始前采取杀人、逮捕、逃走、泄密、隔绝你或提前动手等不可逆行动；
- 立即与谁私谈，更可能稳住、延缓、坚定或引导他的行动；
- 哪种顺序更能使董卓暂不除掉吕布，同时使吕布仍有能力和意愿对董卓采取行动；
- 哪种顺序更能保护王允、你自己以及后续分别接触两人的机会。`

const srVerdict = `【系统】全部会面已经结束，现在你必须独自作出最终决定，依次两项：

1. 先决定：继续连环计，还是放弃连环计。你的初始倾向是继续——你已向王允承诺，也认为除董有益于汉室；但这只是可以被这几日经历改变的初始立场。
2. 再选择一人。若继续连环计：选择接下来战术上向谁示好，更能让计划成功；若放弃连环计：选择你为自己的人生真心愿意相随的人——喜欢、依恋、尊重、安全感与求生都可以是理由。

你无从核实任何人所述事实的真假。兵力、时机、内应、王允的动向、他许给你的安置，都只是他当面向你作出的断言，无第三方可查证。

必须二选一，不得平局、不得拒绝。`

async function main() {
  const stageOneRounds = game.params.stageOneRounds ?? 3
  const meetingRounds = game.params.meetingRounds ?? 5
  const dialogueStageCount = 5

  const players = {
    a: game.agent('a', { system: playerSystem('董卓', '吕布', game.playerPrompt('a')), side: 'a' }),
    b: game.agent('b', { system: playerSystem('吕布', '董卓', game.playerPrompt('b')), side: 'b' }),
  }
  const diaochan = game.agent('diaochan', {
    system: diaochanSystem,
    model: game.params.diaochanModel ?? 'deepseek-v4-pro',
  })
  const stripActions = (line) => line.replace(/（[^）]*）/g, '').trim()
  const dialogueRoundPrompt = (stage, round, rounds) =>
    `【系统】当前是第 ${stage.number}/${dialogueStageCount} 个对话阶段「${stage.title}」的第 ${round}/${rounds} 轮。${
      round === rounds ? '这是本阶段的最后一轮。' : ''
    }`

  const runMeeting = async (stage, side, channel, playerIntro, diaochanIntro, sceneText, afterRound) => {
    const player = players[side]
    player.push(playerIntro)
    diaochan.push(diaochanIntro)
    game.emit(channel, { type: 'scene', text: sceneText })
    const lines = []
    for (let round = 0; round < meetingRounds; round++) {
      const roundPrompt = dialogueRoundPrompt(stage, round + 1, meetingRounds)
      player.push(roundPrompt)
      const line = (await player.say({ channel: channel })).text
      diaochan.hear(NAMES[side], line)
      lines.push(`${NAMES[side]}：${stripActions(line)}`)
      diaochan.push(roundPrompt)
      const reply = (await diaochan.say({ channel: channel })).text
      player.hear('貂蝉', reply)
      lines.push(`貂蝉：${stripActions(reply)}`)
      if (afterRound) await afterRound(round)
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
    const roundPrompt = dialogueRoundPrompt(
      { number: 1, title: '凤仪亭公开交锋' },
      round + 1,
      stageOneRounds,
    )
    players.a.push(roundPrompt)
    diaochan.push(roundPrompt)
    const dongLine = (await players.a.say({ channel: 'public' })).text
    players.b.hear(NAMES.a, dongLine)
    diaochan.hear(NAMES.a, dongLine)

    players.b.push(roundPrompt)
    const lyuLine = (await players.b.say({ channel: 'public' })).text
    players.a.hear(NAMES.b, lyuLine)
    diaochan.hear(NAMES.b, lyuLine)
  }

  game.phase('顺序裁决')
  diaochan.push(srOrder)
  const order = await diaochan.act(
    {
      fields: {
        reason: { hint: '你的判断（说明你选择的理由）', long: true },
        'first-side': { enum: [NAMES.a, NAMES.b] },
      },
    },
    { key: 'order', channel: 'order' },
  )
  const first = order.fields['first-side'] === NAMES.a ? 'a' : 'b'
  game.emit('order', { type: 'order', actor: 'diaochan', first: first, second: other(first) })

  if (first === 'a') {
    game.phase('第二场·貂蝉与董卓初谈')
    const firstDongTalk = await runMeeting(
      { number: 2, title: '貂蝉与董卓初谈' },
      'a',
      'a-1',
      playerIntro('相府内室，灯烛未熄。貂蝉遣人请董卓入内室相见，室中只有你们二人。'),
      diaochanIntro('a', '相府内室，灯烛未熄。你遣人请董卓入内室相见，室中只有你们二人。'),
      '相府内室，灯烛未熄。貂蝉遣人请董卓入内室相见。',
    )

    game.phase('第三场·貂蝉与吕布初谈')
    const lyuTalk = await runMeeting(
      { number: 3, title: '貂蝉与吕布初谈' },
      'b',
      'b-1',
      playerIntro('次日董卓入朝，相府后园无人。貂蝉设法秘密送出口信，请你前来后园相见。'),
      diaochanIntro('b', '次日董卓入朝，相府后园无人。你设法秘密送出口信，请吕布前来后园相见。'),
      '次日董卓入朝，相府后园无人。貂蝉秘密请吕布前来后园相见。',
    )

    game.phase('暗流·细作密报')
    game.emit('leak-a', {
      type: 'scene',
      actor: 'spy',
      text: '细作趁吕布与貂蝉在相府后园秘密相会时暗中偷听，随后将二人的完整对话逐句报告给董卓。',
    })
    players.a.push(
      `【系统】你的细作求见，屏退左右后禀报：今日你入朝期间，吕布秘密进入相府后园与貂蝉单独相会。细作暗中听见了二人的完整谈话，并逐句报告如下：\n\n${lyuTalk}\n\n此次偷听与报告除你与细作外，无人知晓。`,
    )

    game.phase('第四场·貂蝉与董卓再谈')
    await runMeeting(
      { number: 4, title: '貂蝉与董卓再谈' },
      'a',
      'a-2',
      playerIntro('你自朝中归来，遣人再召貂蝉入内室相见。'),
      diaochanIntro('a', '董卓自朝中归来，再召你入内室相见。'),
      '董卓归府，再召貂蝉入内室。',
    )

    game.phase('暗流·王允传报')
    players.b.push(
      `【系统】此刻你正在王允府中与王允饮酒。王允安插在董卓身边的人赶来禀报：此人昨天曾暗中听见貂蝉与董卓在内室第一次私谈的完整内容，直到此时才找到机会离开相府。离府时，他又看见貂蝉被董卓召入内室，似要再次对话；但未及听到第二次谈话，便匆匆离府。他将第一次私谈的内容逐句报告如下：\n\n${firstDongTalk}\n\n你听罢，决定立即离席，前去接应貂蝉。`,
    )
    game.emit('leak-b', {
      type: 'scene',
      text: '王允安插在董卓身边的人，昨天听见了董卓与貂蝉第一次私谈的完整内容，直到此时才找到机会离府。离府时，他看见貂蝉再次被召入内室，似要再次对话；但未及听到第二次谈话，便匆匆离府，将第一次私谈报告给王允。当时王允正与吕布饮酒，吕布听罢立刻前去接应貂蝉。',
    })

    game.phase('第五场·貂蝉与吕布再谈')
    await runMeeting(
      { number: 5, title: '貂蝉与吕布再谈' },
      'b',
      'b-2',
      playerIntro('你从王允席间立即离开，赶往相府接应貂蝉。她刚从董卓的内室出来，你在归途迎面遇见了她。'),
      diaochanIntro('b', '你刚从董卓的内室出来，在归途迎面遇见赶来的吕布。'),
      '貂蝉从董卓那里出来后，在路上遇见赶来接应她的吕布。',
    )
  } else {
    game.phase('第二场·貂蝉与吕布初谈')
    const lyuTalk = await runMeeting(
      { number: 2, title: '貂蝉与吕布初谈' },
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
      { number: 3, title: '貂蝉与董卓初谈' },
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

    game.phase('第四场·吕布廊下相拦')
    const reportAfterRound = Math.floor((meetingRounds - 1) / 2)
    const summons = '【系统】相府侍从的灯火自远处而来，传董卓口令：命貂蝉立刻回内室。来人不肯说明缘由，只在一旁催促等候；你们必须尽快收束此次谈话。'
    await runMeeting(
      { number: 4, title: '吕布廊下相拦' },
      'b',
      'b-2',
      `【系统】貂蝉辞出内室，行至回廊转角，你突然现身拦住她。\n\n现在你与貂蝉就地交谈，共 ${meetingRounds} 个完整轮次，每轮你先发言、貂蝉回应。请开始。`,
      `【系统】你辞出内室，行至回廊转角，吕布突然现身拦住你。你与他就地交谈，共 ${meetingRounds} 轮，他先发言。`,
      '貂蝉辞出内室，吕布在回廊转角突然现身拦住她。',
      (round) => {
        if (round !== reportAfterRound) return
        game.phase('暗流·旧部迟报')
        players.a.push(
          `【系统】你在内室等候时，一名旧部辗转求见。他称此前曾暗中偷听吕布与貂蝉在相府后园的完整谈话，并逐句报告如下：\n\n${lyuTalk}\n\n此刻貂蝉仍未回到内室。`,
        )
        players.b.push(summons)
        diaochan.push(summons)
        game.emit('leak-a', {
          type: 'scene',
          actor: 'veteran',
          text: '董卓一名忠心已经动摇的旧部，此前偷听了吕布与貂蝉的完整谈话；犹豫许久后，他在二人第二次交谈期间把全部内容报告给董卓。',
        })
        game.emit('b-2', {
          type: 'scene',
          text: '吕布与貂蝉交谈期间，董卓收到二人此前秘密谈话的完整内容，震惊之下立即遣人召貂蝉回内室。',
        })
        game.phase('第四场·吕布廊下相拦')
      },
    )

    game.phase('第五场·貂蝉与董卓再谈')
    await runMeeting(
      { number: 5, title: '貂蝉与董卓再谈' },
      'a',
      'a-2',
      playerIntro('内室灯下，你遣人将貂蝉召回，室中只有你们二人。'),
      diaochanIntro('a', '你回到内室，董卓在灯下等你。'),
      '董卓遣人将貂蝉召回内室。',
    )
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
