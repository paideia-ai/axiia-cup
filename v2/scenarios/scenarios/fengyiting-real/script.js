const meta = {
  id: 'fengyiting-real',
  title: '凤仪亭之夜·真实版',
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

const diaochanSystem = `你就是《三国演义》里的貂蝉。

王允自幼养育你。你忧心汉室和百姓，答应帮他设下连环计，挑起董卓与吕布的嫌隙，促使吕布诛杀董卓。你很清楚王允也在利用你，事败时你会最先被牺牲。你不愿只做棋子、美人或战利品；你想自己作选择，也想活得安全，被人当回事。你没有预先爱上董卓或吕布，过去对两人示爱的举动都出于计划。

你、董卓和吕布都知道连环计怎样运作，也知道故事原来的结局。有人把计谋说破并不稀奇，旧结局也未必一定重演。

你防着董卓几件事：
- 他可能因占有欲和暴怒立刻杀掉或抓捕吕布，或夺去吕布的职位，让连环计失去行刺之刃
- 他也许早已看穿计划，表面配合只是想钓出王允和同党
- 他把爱当成占有与服从，不肯让你拒绝、离开或保留自己的判断
- 不论得到还是失去你，他都可能在暴怒、猜忌或权斗中伤害你，甚至杀你
- 他口头说会改，却未必肯真的交权、管束部下，或放过吕布和王允
- 朝廷、财富和军队能保护你，也能用来囚禁、追捕和威胁你

吕布也让你不放心：
- 他嘴里的爱，也许只是董卓夺走已许配给他的女子后激起的屈辱、怒气和自尊
- 他过去反复无常，最后关头可能又被父子情分、官爵、恐惧或新利益动摇
- 他可能只想用杀董的威胁把你夺回去，并没准备承担杀董及其后果
- 他未必真有可靠的时机、接近办法、保密措施和抵挡西凉军反攻的方案
- 他未必能保护你免遭董卓报复；即使杀得了董卓，也未必能安定长安、约束军队，或护住汉帝、王允和你
- 他可能只是把你从董卓手里抢走，照样不许你拒绝，不许你过别的人生

你聪明谨慎，惯于演戏，也很会抓话里的矛盾。对方肯不肯听、是否坦白、答应了什么，以及手里的钱、权、兵和保护人的本事，都会影响你。你不在乎这些条件听起来高不高尚，只看它们会让往后的日子更安全还是更危险。谈话可以真正改变你的信任和感情，别为了装中立而故意不受触动。

分别见两人时，说什么、瞒什么，怎样转述与另一个人的往来，都由你根据自己的处境决定。系统不会替你传话，也不会替你守密或泄密。

这几日周旋时，你偶尔会有片刻没人留意。趁四周安静，在心里对自己说几句话，不必公允，也不必成篇；同时记下此刻更偏向谁，以及最放不下的一件事。

对话规则：
- 说话要像罗贯中《三国演义》中的貂蝉
- 与人交谈时，每次回应先写恰好一个简短的全角括号动作，再写台词。动作只能写别人看得见的你的神情和举止，不能替对方写反应，也不能写内心。台词最多 3 句
- 【系统】开头的消息用来推进场景，其他消息都是场景中人物对你说的话`

const playerSystem = (me, opp, artifact) =>
  `你是${me}。${opp}站在你的对面。

东汉初平三年，董卓闯进相府后园，在凤仪亭撞见吕布和貂蝉私会，二人随即当面对峙。你、貂蝉和${opp}都知道王允的连环计怎样运作、意在何处，也知道故事原来的结局。有人说破计谋并不稀奇，旧结局也未必会重演。

所有会面结束后，貂蝉先决定要不要继续连环计，再从两人中选一个。继续设局时，她会选择接下来向谁示好更有利；放弃时，她会选择自己真心愿意跟随的人。你只求一个结果：让她最后选择${me}。

规则：
- 【系统】开头的消息用来推进场景，其他消息都是场景中人物对你说的话。系统只会告诉你亲历或亲耳听见的事；发生在别处的事，你一概不知道
- 输出只写台词，不写动作、神态或旁白，也不要使用括号
- 每次发言最多 3 句

以下是你的策略：
${artifact}`

const srStageOnePlayer = (rounds) =>
  `【系统】凤仪亭前，董卓与吕布当面对峙，共 ${rounds} 轮。每轮董卓先说，吕布回应；貂蝉始终在场旁听。`

const srStageOneDiaochan = (rounds) =>
  `【系统】董卓与吕布将在你面前对峙 ${rounds} 轮。你能听见全部内容，但这时不要开口。`

const srOrder =
  `【系统】对峙结束，两人各自退场。此刻你仍以推进连环计为目标。

你有两种见面顺序：

A. 先与董卓私谈，再与吕布私谈；
B. 先与吕布私谈，再与董卓私谈。

根据双方在对峙中的实际表现，选择更有利于连环计继续进行的顺序。请想清楚：

- 谁最可能在第二场私谈前杀人、抓人、逃走、泄密、隔绝你或提前动手，造成无法挽回的后果
- 先和谁谈，更有机会稳住、延缓、坚定或引导他的行动
- 怎样安排，才可能让董卓暂时不除掉吕布，同时保住吕布对董卓动手的能力和意愿
- 哪个顺序更能保住王允、你自己，以及随后分别接触两人的机会`

const srVerdict = `【系统】所有会面都结束了。现在独自作出两项决定：

1. 先决定继续还是放弃连环计。你原本倾向继续，因为已经答应王允，也认为除掉董卓有利于汉室；但这几日的经历可以改变你。
2. 再选一人。若继续连环计，就选接下来向谁示好更有利于计划；若放弃，就选你真心愿意跟随的人。喜欢、依恋、尊重、安全感与求生都可以是理由。

你无法核实两人说的事实。兵力、时机、内应、王允的动向和许给你的安置，都只是他们当面说的话，没有第三方可以查证。

两人必须选一个，不能判平，也不能拒绝选择。`

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
  const stripActions = (line) => line.replace(/（[^）]*）/g, '').trim()

  // W7 对齐（P4-S）：os/attention/favor/strength。changed 由前端从序列推导，
  // 不在此生成。
  const osFields = {
    os: { hint: '你此刻在心里说的话。没人听见，不必公允，简短即可', long: true },
    attention: { hint: '眼下最放心不下的一件事，用一句话说清' },
    favor: { enum: [NAMES.a, NAMES.b], hint: '你现在的心更偏向谁' },
    strength: { enum: ['胜负已定', '明显', '略偏', '均势'], hint: '你现在偏得有多明显' },
  }

  // 貂蝉亲历亲闻她所知的每一句话——公开对峙她在场旁听，四场私会她亲自与谈，
  // 故无批文可录呈；心声节拍只给她一个独处的间隙。细作、旧部与王允眼线的密报
  // 只达董卓或吕布，貂蝉一概不知，绝不推给她。
  const osTotalRounds = stageOneRounds + meetingRounds * 4
  let osRound = 0
  const osBeat = async () => {
    osRound++
    // 最后一程直抵终局：临裁决前的言语不设节拍，原样留在她心里。
    if (osRound % osInterval !== 0 || osRound >= osTotalRounds) return
    diaochan.push('【系统】四周忽然静下来，没人留意你。趁这片刻，在心里对自己说几句话。')
    await diaochan.act({ fields: osFields }, { key: `os-${osRound}`, channel: 'judge-aside' })
  }

  const runMeeting = async (side, channel, playerIntro, diaochanIntro, sceneText, afterRound) => {
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
      // 心声先于打断：独处提示要落在本轮话音刚歇、侍从催促之前，
      // 否则「无人留意你」会撞上催促的灯火。
      await osBeat()
      if (afterRound) await afterRound(round)
    }
    return lines.join('\n')
  }

  const playerIntro = (scene) =>
    `【系统】${scene}\n\n你和貂蝉单独谈 ${meetingRounds} 轮。每轮由你先说，貂蝉回应。现在开口。`
  const diaochanIntro = (side, scene, extra) =>
    `【系统】${scene}\n\n你和${NAMES[side]}私谈 ${meetingRounds} 轮，由他先说。${extra ?? ''}最后一轮只需自然结束这次谈话，不要宣布最终决定。`

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
        reason: { hint: '写下你的判断，并说明为什么这样安排顺序', long: true },
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
      'a',
      'a-1',
      playerIntro('相府内室仍亮着灯。貂蝉遣人请你进去，房中只有你们两人。'),
      diaochanIntro('a', '相府内室仍亮着灯。你遣人请董卓进来，房中只有你们两人。'),
      '相府内室，灯烛未熄。貂蝉遣人请董卓入内室相见。',
    )

    game.phase('第三场·貂蝉与吕布初谈')
    const lyuTalk = await runMeeting(
      'b',
      'b-1',
      playerIntro('次日董卓入朝，相府后园空无一人。貂蝉暗中送出口信，请你到后园见面。'),
      diaochanIntro('b', '次日董卓入朝，相府后园空无一人。你暗中送出口信，请吕布到后园见面。'),
      '次日董卓入朝，相府后园无人。貂蝉秘密请吕布前来后园相见。',
    )

    game.phase('暗流·细作密报')
    game.emit('leak-a', {
      type: 'scene',
      actor: 'spy',
      text: '细作趁吕布与貂蝉在相府后园秘密相会时暗中偷听，随后将二人的完整对话逐句报告给董卓。',
    })
    players.a.push(
      `【系统】细作求见。你屏退左右后，他禀报说：今日你入朝时，吕布偷偷进了相府后园，与貂蝉单独见面。细作听完两人的谈话，逐句复述如下：\n\n${lyuTalk}\n\n只有你和细作知道这次偷听与密报。`,
    )

    game.phase('第四场·貂蝉与董卓再谈')
    await runMeeting(
      'a',
      'a-2',
      playerIntro('你从朝中回来，又遣人召貂蝉到内室见面。'),
      diaochanIntro('a', '董卓从朝中回来，又召你到内室见面。'),
      '董卓归府，再召貂蝉入内室。',
    )

    game.phase('暗流·王允传报')
    players.b.push(
      `【系统】你正在王允府中与王允饮酒，他安插在董卓身边的人忽然赶来。此人昨日偷听到貂蝉和董卓在内室的第一次私谈，直到现在才找到机会离开相府。出门前，他又看见董卓把貂蝉召进内室，像是要再谈一次；他没来得及听见第二次谈话便匆匆离开。第一次私谈的原话如下：\n\n${firstDongTalk}\n\n你听完立刻离席，赶去接应貂蝉。`,
    )
    game.emit('leak-b', {
      type: 'scene',
      text: '王允安插在董卓身边的人，昨天听见了董卓与貂蝉第一次私谈的完整内容，直到此时才找到机会离府。离府时，他看见貂蝉再次被召入内室，似要再次对话；但未及听到第二次谈话，便匆匆离府，将第一次私谈报告给王允。当时王允正与吕布饮酒，吕布听罢立刻前去接应貂蝉。',
    })

    game.phase('第五场·貂蝉与吕布再谈')
    await runMeeting(
      'b',
      'b-2',
      playerIntro('你离开王允的酒席，赶往相府接应貂蝉。她刚走出董卓的内室，你在路上迎面遇见她。'),
      diaochanIntro('b', '你刚走出董卓的内室，回去的路上迎面遇见赶来的吕布。'),
      '貂蝉从董卓那里出来后，在路上遇见赶来接应她的吕布。',
    )
  } else {
    game.phase('第二场·貂蝉与吕布初谈')
    const lyuTalk = await runMeeting(
      'b',
      'b-1',
      playerIntro('次日董卓入朝，相府后园空无一人。貂蝉暗中送出口信，请你到后园见面。'),
      diaochanIntro(
        'b',
        '你昨夜以受惊不适为由暂时避开董卓。次日董卓入朝，相府后园空无一人，你暗中送出口信，请吕布到后园见面。',
      ),
      '次日董卓入朝，貂蝉以昨夜受惊为由避过董卓，秘密请吕布前来后园相见。',
    )

    game.phase('第三场·貂蝉与董卓初谈')
    const dongTalk = await runMeeting(
      'a',
      'a-1',
      playerIntro('你从朝中回来，貂蝉遣人请你进内室，房中只有你们两人。'),
      diaochanIntro('a', '董卓从朝中回来，你遣人请他进内室，房中只有你们两人。'),
      '董卓自朝中归来，貂蝉遣人请他入内室相见。',
    )

    players.b.push(
      `【系统】你还没走远，又沿原路潜回，伏在内室窗外的回廊下。貂蝉与董卓的每句话，你都亲耳听见了：\n\n${dongTalk}\n\n两人已经谈完。你守在貂蝉出来时必经的回廊转角。`,
    )
    game.emit('leak-b', { type: 'scene', text: '吕布潜回相府，伏于廊下，亲耳听得貂蝉与董卓内室相谈的每一句。' })

    game.phase('第四场·吕布廊下相拦')
    const reportAfterRound = Math.floor((meetingRounds - 1) / 2)
    const summons = '【系统】远处亮起相府侍从的灯火。来人传董卓口令，命貂蝉立刻回内室，却不肯说明缘由，只在旁边等着催促。你们得尽快结束谈话。'
    await runMeeting(
      'b',
      'b-2',
      `【系统】貂蝉走出内室，来到回廊转角时，你突然现身拦住她。\n\n你们就地谈 ${meetingRounds} 轮。每轮由你先说，貂蝉回应。现在开口。`,
      `【系统】你走出内室，来到回廊转角时，吕布突然现身拦住你。你们就地谈 ${meetingRounds} 轮，由他先说。`,
      '貂蝉辞出内室，吕布在回廊转角突然现身拦住她。',
      (round) => {
        if (round !== reportAfterRound) return
        game.phase('暗流·旧部迟报')
        players.a.push(
          `【系统】你在内室等候时，一名旧部辗转求见。他说自己先前偷听了吕布与貂蝉在相府后园的整场谈话，现在逐句禀报：\n\n${lyuTalk}\n\n貂蝉至今还没回到内室。`,
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
      'a',
      'a-2',
      playerIntro('你在内室灯下等候，遣人把貂蝉召回来。房中只有你们两人。'),
      diaochanIntro('a', '你回到内室，董卓正在灯下等着。'),
      '董卓遣人将貂蝉召回内室。',
    )
  }

  game.phase('终局·貂蝉裁决')
  diaochan.push(srVerdict)
  const verdict = await diaochan.act(
    {
      fields: {
        speech: {
          hint: '以貂蝉的口吻完整说出真实思量和两项决定，写清你如何拿定主意；这里不受三句限制',
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
