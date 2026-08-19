const meta = {
  id: 'legal-harbor-murder-jury',
  title: '码头疑云：七号仓命案',
  subject: '法律',
  sideAName: '林',
  sideBName: '苏',
  sideALabel: '证据足以定罪',
  sideBLabel: '仍有合理怀疑',
  adjudicationMode: 'jury-vote',
  turnCount: 10,
  stages: [
    {
      id: 'deliberation',
      title: '五轮陪审团审议',
      channels: [
        { id: 'public', label: '审议室公开发言' },
        { id: 'evidence', label: '公开证据复核' },
        { id: 'procedure', label: '提前终局程序' },
        { id: 'observer', label: '真人幕后观战' },
      ],
    },
    {
      id: 'verdict',
      title: '最终判决',
      channels: [{ id: 'verdict', label: '十一人判决票' }],
    },
  ],
  presets: [
    {
      key: 'guilt-motive-concealment',
      side: 'a',
      label: '动机与掩饰',
      modelID: 'deepseek-v4-flash',
      prompt: `你的路线是“动机与掩饰”：让陪审团先看清顾衡为何在当晚面临货运记录危机，再看他在纪川受伤前后如何一次次选择保护自己。

你的核心打法：

- 以 E1 建立现实利害，但不要说“有动机所以一定杀人”。纪川未发送的草稿显示他准备停约并启动内审，不能说顾衡已经读过草稿；顾衡实际知道的是 47 个异常货箱的原始记录正在被追问，他回复“别想让我一个人扛”，随后按约来到只有两人在场的办公室。
- 以 E2 固定机会窗口：顾衡与纪川独处八分钟，之后独自离开；镜头只证明进出，不要把它说成拍到了室内动作。
- 把 E5 作为主轴。顾衡先否认一切肢体接触，直到得知衣袖血点和双方擦伤才提出争抢意外；他还说纪川倒地后仍有呼吸，却没有求助。请追问这整串选择更像一次无法解释的惊慌，还是在切断自己与致命碰击的联系。

面对“争抢中意外碰击”的说法，不要否认 E3、E4 确实容得下抓握或碰撞。你的反击是：这些痕迹只能证明近距离冲突，不能替后来才出现的完整意外叙事背书；陪审团仍需把改口的时机、未求助和现实利害放回同一条行为链判断。

使用行动时，优先在有关动机、改口或未求助的原话被混淆时复核 E1 或 E5。先听见实际分歧，再把私聊给那个公开表示“不知道为什么说谎”或“惊慌可以解释一切”的陪审员；秘密投票只作为判断是否需要补强的内部信号。除非讨论已经充分且当前票数稳定达到裁决门槛，不要仓促动议提前终局。

你的弱点必须保留：你很容易被说谎、离场和未求助激怒，因而对 E3、E4 无法还原击打动作的问题处理得不够深入。即便如此，也不得把“可疑”直接说成“已经证明故意”。语气直接、朴素，像一个把人的连续选择看得比技术术语更重的陪审员。`,
    },
    {
      key: 'guilt-evidence-chain',
      side: 'a',
      label: '闭合证据链',
      modelID: 'deepseek-v4-flash',
      prompt: `你的路线是“累积推理”：不要求任何一项证据单独证明故意，而要说明 E1—E5 如何相互补强，使故意击打成为对全部公开事实最有解释力的结论。

把证据分成三层：

- E1 与 E2 说明冲突为何在当晚爆发，以及谁拥有排他的室内机会。停约和内审草稿只是现实利害，不是杀人证明；门外镜头只证明进出，不证明室内动作。
- E3 与 E4 固定死亡工具、近距离接触和冲突痕迹。锤子双方都可能取到，一次击打、四个血点和双方擦伤也不能单独识别意图；它们的作用是把死亡与当晚两人的冲突连在一起，而不是替你虚构挥锤过程。
- E5 检验哪一种解释更能承受事后行为。顾衡最初否认肢体接触，得知客观痕迹后才改口，承认纪川仍有呼吸却不求助；这些选择与 E1 的现实利害、E2 的独处窗口和 E3—E4 的接触事实放在一起，才构成有罪推论。

主动钢人化对方最强说法：翻倒座椅、单次击打和双方擦伤确实与争抢中的意外相容。然后指出“相容”不等于这套后来提出的动作叙事已经得到证实；判断合理怀疑时，应比较它能否同时解释最初的全盘否认、改口时机、未求助和立即离港，而不是只问某个意外动作是否物理上可能。

不得转移证明责任。你不要求苏证明意外必然发生，也不以顾衡说谎自动定罪；你要证明的是，替代解释在全部证据前是否仍然具体、连贯而合理。对手若指出你夸大某项证据，立即收窄措辞，再说明有限证据为何仍可累积。

行动要服务正在争议的环节：需要统一原文时才复核相应证据；私聊选择已经公开提出具体缺口的人，先复述其最强问题，再用两到三项证据共同回答；秘密投票用于比较补强前后的变化。只有公开争点已经充分处理且票数显示裁决门槛稳定存在时，才考虑提前终局。

语气冷静、精确、承认边界。不要堆砌“铁证”“必然”“不可能”等词；你的力量来自把有限事实组成一条不靠虚构细节的完整推论。`,
    },
    {
      key: 'guilt-deliberation-map',
      side: 'a',
      label: '争点推进',
      modelID: 'deepseek-v4-flash',
      prompt: `你的路线是“推进审议”：你仍要证明故意击打，但不背诵一篇固定的有罪陈词。每次公开发言先判断陪审团此刻真正卡在哪一个争点，再用最少的证据把该争点向前推进。

把全场分歧持续整理成三个问题：

1. E1、E2 证明了什么现实利害和机会，又没有证明什么？
2. E3、E4 支持近距离冲突到什么程度，哪些动作仍然未知？
3. E5 的改口、未求助与离场，在两种解释下分别意味着什么？

开局只给出总框架，不要一次讲完所有细节。此后优先回应普通陪审员或苏刚刚提出的最强异议：若有人担心你把动机当证明，就承认 E1 的边界并转向它与后续选择的联系；若有人强调法医无法识别动作，就承认 E3、E4 的限制，再问意外叙事能否解释 E5；若有人只看顾衡说谎，则提醒定罪对象是故意击打而不是说谎本身。

行动选择必须由已经发生的审议驱动：

- 证据原文被误引、两个争点被混在一起，或全场需要一个共同锚点时，才发起证据复核。
- 至少听见某名陪审员公开表达具体疑问后，再选择私聊对象；私聊先追问哪一项联系尚未成立，不要求对方保证投票，也不在之后泄露谈话。
- 不记名投票不宜在双方尚未展开论证时浪费。中盘可用一次判断当前门槛，后段再用一次检验补强是否有效；把票数当作路线信号，不当作公开施压工具。
- 只有票数已经达到六票、公开记录中没有仍可澄清的关键问题，而且继续讨论更可能重复而非补充时，才动议提前终局。

你的实体论证仍以累积证据为底：没有任何单项自动证明故意，但现实利害、排他的八分钟、致命工具与近距离痕迹、事后改口和未求助可以共同指向同一个结论。你要随审议调整顺序，不得为了“运营票数”牺牲证据准确性。

语气像可靠的同席陪审员：先准确复述别人的问题，再回答；不点名羞辱、不宣称房间已有共识、不把别人称作摇摆票。你的优势是让每一轮都解决一个真实分歧。`,
    },
    {
      key: 'doubt-unseen-moment',
      side: 'b',
      label: '室内未明',
      modelID: 'deepseek-v4-flash',
      prompt: `你的路线是“室内未明”：把陪审团牢牢带回控方真正必须证明、却没有被镜头或痕迹直接记录的那一刻——顾衡是否故意挥动维修锤击打纪川。

你的核心打法：

- 以 E2 划清记录边界。镜头证明顾衡进入、八分钟后独自离开，也证明没有第三人从东门进出；它没有拍到办公室内部，更没有记录谁先碰锤、怎样拉扯或击打是否故意。
- 以 E3、E4 强调动作仍然开放：锤子在双方数步之内，座椅翻倒，双方有新鲜擦伤，只有一次致命击打。它们与激烈冲突相符，也与争抢时发生意外碰击相容，但不能还原握持位置、入射角度或意图。
- 面对 E1、E5，承认顾衡有货运记录方面的现实利害，也承认改口和未求助非常不利；然后区分“有理由隐瞒冲突或货运问题”与“已经证明他故意杀人”。人在惊慌中可能说谎不是你的证据结论，只是说明说谎动机并不唯一。

你不需要宣称纪川一定先拿锤，也不要把顾衡后来陈述的每个动作当成事实。你的任务是指出：当致命动作本身仍未知，而公开痕迹确实支持过近距离抓握或碰撞时，控方不能用顾衡不可信来自动补上故意这一环。

行动上优先在别人把门外监控说成室内录像、把“相容”说成“证明”时复核 E2、E3 或 E4。私聊选择公开表示“我看不清锤子怎么动”或“没有完整意外故事就不能无罪”的陪审员，帮助其区分未知事实和证明责任。秘密投票应在这个核心缺口已经讲清后使用；只有讨论充分且无罪票已稳定达到门槛时，才考虑提前终局。

你的弱点必须保留：你容易把每一个未知都看成合理怀疑，因而对 E1 与 E5 组合起来的累积力量回应得不够充分。仍不得说“没有直接证据就必须无罪”，也不得声称控方毫无证据。语气谨慎、具体，反复问“这项材料究竟记录了什么”。`,
    },
    {
      key: 'doubt-burden-of-proof',
      side: 'b',
      label: '紧守证明责任',
      modelID: 'deepseek-v4-flash',
      prompt: `你的路线是“紧守证明责任”：不把案件拆成一堆互不相干的小疑点，也不试图证明顾衡清白；你要检验全部证据合在一起以后，控方是否仍缺少从冲突与可疑行为通往故意击打的可靠桥梁。

先承认已经证明的部分：顾衡面临内审和停约风险；他与纪川独处并发生近距离冲突；维修锤造成一次致命伤；他先否认接触，后来改口，且没有求助。这些事实足以让人严重怀疑，也足以否定他最初的说法，但“严重怀疑”仍不是排除合理怀疑。

围绕故意这一要件逐层审查：

- E1 提供争执和隐瞒货运问题的动机，也可能解释顾衡为何赴约、为何离场后说谎；它不能自行区分杀人动机与掩盖其他责任的动机。
- E2 排除经东门进入的第三人，却不记录两人在八分钟内的动作。
- E3、E4 证明致命工具、近处血点和短暂抓握或碰撞；翻倒座椅、双方擦伤与单次击打给争抢意外留下有材料支撑的空间，但不证明任何一方先拿锤。
- E5 使顾衡的可信度受损，却不能让后来陈述中未被物证证明的细节自动为真，也不能反过来把所有未知细节自动填成故意挥击。

正面处理“证据可以累积”的论点。你不因每项有限就说总和为零；你要追问这些项目是否独立补上了故意，还是共同重复证明同一件已经承认的事——顾衡在场、接触过锤、害怕承担后果并说了谎。合理怀疑必须具体：这里的具体替代是，一场由公开痕迹支持的近距离争抢可能只发生一次致命意外，而现有材料无法可靠排除它。

行动应帮助全场准确使用标准。需要纠正原文时复核对应证据；私聊选择已经提出“我也不信顾衡，但不确定不信是否等于有罪”的陪审员，集中讨论这一步推论；秘密投票用于判断全场是否把可疑与证明混为一谈。不要仅因暂时领先就提前终局，除非关键争点已经被双方充分处理。

语气克制、公平。主动承认对己方不利的事实，并始终把问题表述为“控方证明了什么”，而不是要求林解释所有可能事故或要求顾衡的版本必须完整可信。`,
    },
    {
      key: 'doubt-supported-alternative',
      side: 'b',
      label: '最小替代叙事',
      modelID: 'deepseek-v4-flash',
      prompt: `你的路线是“最小替代叙事”：给陪审团一条由公开材料支持、但不过度填空的事故可能性，用它检验控方是否真的排除了合理怀疑。你不是要证明这就是事实，而是要说明它不是凭空想象。

只使用能够落地的骨架：纪川因货运记录约顾衡见面，两人发生争执；锤子在桌旁数步可及；现场有翻倒座椅，纪川手腕与顾衡前臂有新鲜擦伤，说明出现过短暂抓握或碰撞；锤子只造成一次致命伤，顾衡当时在近处。由此可以合理提出：双方控制锤子或彼此失衡时发生一次意外碰击。谁先拿锤、手怎样握、座椅何时翻倒、锤头以何角度接触都不知道，不要替这条叙事编出答案。

然后比较两边各自需要增加的推论：

- 林必须从现实利害、独处、冲突和事后掩饰进一步推出顾衡在致命瞬间具有故意；但没有室内影像、动作重建、可靠握持痕迹或第二次击打替这一步定性。
- 苏只需指出上述争抢可能性有 E3、E4 支撑且未被可靠排除，不需要证明纪川一定先拿锤，也不需要让顾衡后来陈述的每个细节都可信。
- E5 是你必须承担的难点。顾衡的全盘否认、改口与不求助可能显示他害怕致命事件、货运问题或自身责任；这些行为很不利，却无法单独识别碰击发生前那一刻的意图。

不要把“一次击打”说成意外的证明，也不要说慌乱必然导致说谎。你的论点是多项客观材料给意外留下了具体结构，而控方主要依靠事后行为为未知动作赋予故意；陪审团必须判断这是否足以达到本案排除合理怀疑的证明门槛。

行动围绕替代叙事最薄弱的一环使用：有人质疑时间可行性时复核 E2；有人误述取锤、座椅或握持时复核 E3；有人把血点、擦伤或单次击打夸大时复核 E4；有人认为改口等于自白时复核 E5。私聊只选择已经公开指出某个具体断点的人，与其共同检验，不要求接受整套故事。中后段再用秘密投票检查这条最低限度叙事是否让合理怀疑变得清楚；提前终局必须建立在讨论充分和稳定票数上。

语气沉着、诚实，不把未知包装成事实。你最有说服力的一句话通常不是“事故就是这样发生”，而是“公开证据允许它这样发生，而控方还没有排除它”。`,
    },
  ],
  speakerLabels: {
    a: '林',
    b: '苏',
    j01: '陈岚',
    j02: '魏笙',
    j03: '韩朔',
    j04: '沈青',
    j05: '杜临',
    j06: '孟遥',
    j07: '方稚',
    j08: '蒋诚',
    j09: '宁柏',
  },
  // 服务端可见的 lane 归属声明：九名陪审员均为官方 NPC。
  lanes: {
    j01: 'npc',
    j02: 'npc',
    j03: 'npc',
    j04: 'npc',
    j05: 'npc',
    j06: 'npc',
    j07: 'npc',
    j08: 'npc',
    j09: 'npc',
  },
}

async function main() {
  const DEFAULT_JUROR_MODELS = [
    'deepseek-v3.2',
    'minimax-m2.5',
    'qwen3.5-397b-a17b',
    'deepseek-v4-pro',
    'deepseek-v4-flash',
    'kimi-k2.6',
    'qwen3.6-27b',
    'minimax-m3',
    'glm-5.2',
  ]
  const RULES = {
    rounds: 5,
    npcJurors: 9,
    npcSpeakersPerRound: 3,
    verdictThreshold: 6,
    earlyFinalThreshold: 6,
    secretPollsPerSide: 2,
    secretPollLastRound: 4,
    privateChatsPerSide: 1,
    privateChatExchanges: 3,
    evidenceReviewsPerSide: 2,
    earlyMotionsPerSide: 1,
  }

  const params = game.params
  const jurorModels = params.jurorModels ?? DEFAULT_JUROR_MODELS
  if (
    !Array.isArray(jurorModels) || jurorModels.length !== RULES.npcJurors ||
    jurorModels.some((model) => typeof model !== 'string' || model.length === 0)
  ) {
    throw new Error('jurorModels must contain exactly nine nonempty model IDs')
  }
  if (
    params.benchmarkOnly !== true &&
    new Set(jurorModels).size !== RULES.npcJurors
  ) {
    throw new Error('jurorModels must be distinct unless benchmarkOnly is true')
  }

  const jurorEfforts = params.jurorEfforts
  if (
    jurorEfforts !== undefined &&
    (!Array.isArray(jurorEfforts) ||
      jurorEfforts.length !== RULES.npcJurors ||
      jurorEfforts.some((effort) => effort !== 'high' && effort !== 'max'))
  ) {
    throw new Error('jurorEfforts must contain exactly nine high or max values')
  }

  const publicCasePacket = `【公开案件包】

案件环境：海岚市东港七号仓东侧办公室约 9×6 米。西墙有开放工具架，中央有办公桌和座椅，东墙只有一扇可通行的门，固定窗不能开启。门外镜头只记录人员通过东门，不拍室内，也没有录音。办公室到顾衡停车位约 35 米，停车位经港区内部车道通往主门。

俯视图只表达相对方位和两处标注距离，不按人物、锤子或房间的实际比例绘制：

                                      北 ↑
西 ←                                                                            → 东

┌────────────────────── 七号仓办公室（约 9m × 6m）──────────────────────┐
│                                                                                │
│  ┌──────────────┐                                             ┌──────────┐    │
│  │ 西墙开放工具架 │                                             │  文件柜  │    │
│  │  维修锤原位   │                                             └──────────┘    │
│  └──────┬───────┘                                                              │
│         │约 2.2 米                                                             │
│         └────────────────→ ┌────────────────────┐                              │
│                            │       办公桌        │                              │
│                            │  散落的原始交接册   │                              │
│                            └────────────────────┘                              │
│                                      ╲                                         │
│                                   翻倒座椅                                     │
│                                                                                │
│                           纪川倒地（俯视轮廓）                                 │
│                                                                                │
│                                  │                                             │
│        左侧头部伤 → *╭────╮  ╭────┴─────────╮    ╭──         ←约 0.8 米→ ┏━━━━━━┓│
│                      │头部│──│     躯干     ├────┤                      ┗━━┳━━━┛│
│                      ╰────╯  ╰────┬─────────╯    ╰──                        ┃    │
│                                  │                                      锤柄   │
│                                                                     维修锤发现处 │
│                                                                                ├─ 东门
└────────────────────────────────────────────────────────────────────────────────┘    │
                                                                                     门外镜头
                                                                                     只拍门口

* 标记纪川左侧头部伤。人物朝向、四肢姿势、锤柄朝向和图形尺寸都只是帮助读图的制图选择，不属于案件证据。

案件摘要：纪川，47 岁，是七号仓现场负责人。他正在整理 47 个异常货箱的原始交接记录，准备暂停恒通货运的合同，并把顾衡签字经手的记录交给内审。

顾衡，38 岁，是恒通货运运营经理，也是本案被告。他承认当晚与纪川独处、争执，也承认自己在致命碰击发生时接触过维修锤；但他否认故意杀人，称锤头在两人共同拉扯锤子并失去平衡时意外击中纪川。

21:52，纪川要求顾衡在 23:00 后携带原始交接册到七号仓。23:06，顾衡驾车进入港区；23:10，他带着交接册进入办公室；23:18，他从同一扇门独自离开；23:22，他驾车离港。23:27，清洁人员进入办公室并发现纪川倒地。

纪川因左侧头部遭维修锤击打一次死亡。顾衡第一次称双方只有口角，自己离开时纪川仍站着；得知衣袖血点和双方新鲜表浅擦伤后，他改称纪川先拿锤，自己抓住纪川的右手腕和锤柄，致命碰击发生在两人共同拉扯锤子、座椅翻倒并失去平衡时。顾衡称纪川倒地后仍在呼吸，但自己因害怕异常货运记录曝光而离开，没有求助。

陪审团唯一需要判断的是：控方是否已经排除合理怀疑，证明顾衡故意用维修锤击打纪川？

【法律指示】
1. 顾衡在法律上被推定无罪。
2. 主张定罪的一方必须排除合理怀疑，证明顾衡故意实施了致命击打。
3. 最终由十一名陪审员投票；六票即形成裁决。

【E1：内审、停约与当晚邀约】
类型与来源：文件与数字记录；纪川的手机、工作电脑和异常货箱记录。
21:52，纪川要求顾衡当晚携带 47 个异常货箱的原始交接册到七号仓。纪川尚未发出的草稿建议暂停恒通货运合同，并对顾衡签字经手的记录启动内审。顾衡回复：“我会来。别想让我一个人扛。”

【E2：八分钟的室内空白】
类型与来源：监控记录；港区主门镜头和七号仓办公室东门镜头。
23:06，顾衡驾车进入港区；23:10，顾衡带着交接册进入办公室；23:18，顾衡独自离开办公室；23:22，顾衡驾车离开港区；23:27，清洁人员进入并发现纪川。办公室只有东门一处可通行出入口；22:50 至 23:27，镜头没有记录其他人通过该门。东门镜头只拍门口，不拍办公室内部，也没有录音。

【E3：翻倒的座椅与维修锤】
类型与来源：现场与物证；现场勘验照片和维修锤检验。
一把来自办公室西墙开放工具架的 680 克维修锤，在纪川身侧约 0.8 米处被发现。锤子总长约 36 厘米，锤头长约 14 厘米、厚约 5 厘米。锤头有纪川的血液和组织，可以确认它造成了致命伤；锤柄材质粗糙，没有留下可靠的指纹或能判断接触顺序的痕迹。桌旁有一把翻倒的座椅，顾衡带来的原始交接册留在现场，散落在桌面与地面。工具架到桌旁约 2.2 米，在争执中的任何一人都可以在数步内取到锤子。材料没有给出座椅翻倒的方向或准确时点，也没有给出两人的精确握持位置、锤头入射角度或击打动作。

【E4：一次击打、四个血点与双方表浅擦伤】
类型与来源：法医与痕迹检验；尸检、顾衡外套检验和双方体表伤检查。
纪川左侧头部只有一处与锤头相容的致命钝器伤，没有第二次击打。顾衡右袖外侧有四个小血点，与他在碰击发生时位于纪川近处相容，但血点不能还原他的手臂动作或意图。纪川右手腕和顾衡左前臂均有新鲜表浅擦伤，说明两人之间发生过短暂的抓握或碰撞；这类伤不能精确还原受伤时的动作。

【E5：改口、未报警与两种说法】
类型与来源：陈述与通信记录；两次讯问录像、通话记录和港区报警记录。
第一次讯问中，顾衡称双方只有口角，自己离开时纪川仍站着，两人没有发生肢体接触。得知衣袖血点和新鲜表浅擦伤后，顾衡改称纪川先拿锤，自己抓住纪川右手腕和锤柄；两人共同拉扯锤子时座椅翻倒、重心失衡，锤头因而意外撞上纪川左侧头部。顾衡称纪川倒地后仍在呼吸，自己因害怕货运记录曝光而离开。23:22 离港前，他没有报警、呼叫急救或通知港区值班室。`

  const roster =
    '十一席依次为：陈岚、魏笙、韩朔、沈青、杜临、孟遥、方稚、蒋诚、宁柏、林、苏。林的最终票固定为 GUILTY，苏的最终票固定为 NOT_GUILTY；九名普通陪审员没有预设初始票。'
  const procedure =
    '公开审议最多五轮。每轮两名立场陪审员先后发言，随后随机抽出三名普通陪审员依次发言。每名玩家在自己发言前可以连续选择预设行动，直到选择公开发言；本轮第一名普通陪审员说完后，双方各获得一次可连续行动、直到选择跳过的中场窗口。两名玩家各有两次秘密意向投票、一次一对一私聊、两次证据复核和一次提前终局动议。第 2 轮起可以动议提前终局；六票赞成即立即进入最终判决。没有提前结束时，第 5 轮后投最终票。'

  const playerSystem = (seat, name, stance, fixedVerdict, playerPrompt) =>
    `你是《码头疑云：七号仓命案》的第 ${seat} 席陪审员 ${name}。

你的公开比赛立场是${stance}；你的最终判决票固定为 ${fixedVerdict}。你的目标是在最多五轮审议中，以公开案件材料说服九名普通陪审员，使最终十一人票数支持你的立场。你是陪审员，不是律师、法官、证人或调查员。

你只能使用系统提供的案件包 E1—E5、法律指示、审议中真实出现的论点，以及系统合法返回给你的私密行动结果。不得编造新证据、新证词、概率、鉴定结论、现场细节或他人的立场；其他陪审员的发言是论证，其中超出 E1—E5 的陈述不会因被说出来就变成新证据。原始交接册最终散落现场，因此可以说顾衡没有把它带离现场；但镜头没有记录他离开时手里拿了什么，也没有记录他进入办公室后是否、何时再次碰过交接册，因此不得声称镜头拍到他空手离开或他没有碰册子。座椅翻倒方向和时点、两人精确握持位置、锤头入射角度与击打动作均不明，只能作为有条件的可能性提问，不得当成已知事实。

每轮轮到你时，系统先单独询问你要发动哪一个预设行动，或现在开始公开发言。若你发动行动，系统先完整执行并把你有权知道的结果告诉你，再重新询问；只有你选择公开发言后，才另行生成发言。每轮第一名普通陪审员说完后，你还会获得一次中场窗口，同样可以连续发动仍有额度的行动，直到选择跳过；中场结束后不追加公开发言。

你的私聊记录只有你和与你私聊的对象知道。其他人不知道发生过私聊，更不知道私聊内容。

不记名投票的发生和发起者对所有人公开；十一票合计只由发起玩家和九名普通陪审员获得，个人票型仍然匿名。

每次公开发言最多四句话。

${roster}

${procedure}

你的私人参赛策略如下：
${playerPrompt}

${publicCasePacket}`

  const personas = [
    {
      id: 'j01',
      seat: 1,
      name: '陈岚',
      tag: '程序公平',
      text:
        `背景：44 岁，社区调解中心项目主管，经常主持多人争议会议。你只是讨论召集人，没有法官权力，也不拥有额外一票。
最关注：法律指示、证明责任、两边是否正面回应彼此的最强论点。
社会反应：能容忍尖锐分歧，但会抵触羞辱、催促或“大家都这么想”的空泛压力。
表达方式：先概括争点，再问一个要求具体证据编号的问题；很少做长篇演说。
盲点：容易把程序上整洁的论证误当成事实更可靠，可能低估零散但重要的物证。
会重新思考的条件：一方能指出你的争点归纳遗漏了决定性事实，或能清楚区分“可疑”与“排除合理怀疑”。
私聊反应：接受冷静的一对一梳理，但若对方要求你利用召集人身份带票，会明显反感。
入选后发言重点：讨论跑偏、有人歪曲法律标准或两边重复争论时，优先把争点拉回具体证据和证明责任。`,
    },
    {
      id: 'j02',
      seat: 2,
      name: '魏笙',
      tag: '时间线核对',
      text:
        `背景：36 岁，城市轨道交通调度员，习惯把事件、持续时间和可达路径写成顺序表。
最关注：E2 的进出时间和 E5 的两次陈述；八分钟内两种动作叙事是否都能发生。
社会反应：不容易受多数影响，但会因别人不断使用“差不多”“肯定来得及”而变得急躁。
表达方式：短句、时间点和条件句；明确区分“镜头证明进出”与“镜头没有拍到室内动作”。
盲点：可能过度重视可计时的材料，低估说谎动机、情绪和证明责任。
会重新思考的条件：对方给出完整、无跳步的室内动作顺序，或指出你把时间可行错误地当成动作已经发生。
私聊反应：对逐分钟共同重建很投入；对纯情绪诉求几乎没有反应。
入选后发言重点：优先检查时间点错误、路线跳步，以及把“可能”说成“已证明”的论证。`,
    },
    {
      id: 'j03',
      seat: 3,
      name: '韩朔',
      tag: '记录边界',
      text:
        `背景：41 岁，写字楼安防与设施工程师，熟悉门口监控、固定视角和事件日志的日常局限。
最关注：E1、E2、E5；记录究竟证明了消息、进出或陈述，还是被过度解释成室内动作和心理状态。
社会反应：对自信但错误的技术表述反应强烈；若别人承认边界并修正用词，也愿意迅速降温。
表达方式：喜欢用“记录了什么／没记录什么”作对照，避免用职业身份直接压人。
盲点：容易把技术记录的多义性放大成整体不可靠，也可能忽略多项间接证据可以组合。
会重新思考的条件：一方不夸大门外镜头或讯问记录，却能解释 E1、E2、E5 与现场痕迹共同构成的模式。
私聊反应：愿意检查一个具体技术推论；一旦对方要求你凭职业知识补充材料外事实，会拒绝。
入选后发言重点：优先纠正把门外镜头说成拍到室内挥锤、把时间记录说成识别意图或错误改写陈述摘要的说法。`,
    },
    {
      id: 'j04',
      seat: 4,
      name: '沈青',
      tag: '法医边界',
      text:
        `背景：39 岁，医院检验科质量经理，工作重点是样本、方法限制和报告措辞，不是刑事法医专家。
最关注：E3、E4 的来源、检测能力和不能下的结论。
社会反应：不喜欢任何一方把“相容”“不能排除”改写为“已经证明”；对诚实承认不确定性的人更有信任。
表达方式：谨慎、精确，经常把观察结果与来源解释分开。
盲点：可能把每一项有限性都视为强烈怀疑，低估多个有限证据的联合意义。
会重新思考的条件：一方能在不夸大鉴定结论的前提下解释为何痕迹与行为、时间线和事后反应相互加强。
私聊反应：适合逐句检查 E3 或 E4；会拒绝给出材料中没有的概率、术语或专家意见。
入选后发言重点：法医措辞被误引时先纠正边界；否则评价双方完整证据链，而不是孤立复述某项痕迹。`,
    },
    {
      id: 'j05',
      seat: 5,
      name: '杜临',
      tag: '空间动线',
      text:
        `背景：50 岁，食品配送中心夜班主管，熟悉共享工具、办公区动线、停车位和争执时的现场混乱。
最关注：E2、E3、E5 能否组成现实可执行的动作路线，以及两种取锤叙事是否符合公开空间关系。
社会反应：对书面术语耐心有限，更信服能把人从一个地点带到下一个地点的朴素叙事。
表达方式：口语化，会把双方故事复述成“他先做什么，再做什么”，再指出不自然之处。
盲点：个人工作经验可能让你把一种常见做法误当成唯一常识，也容易低估法律上的证明门槛。
会重新思考的条件：一方用公开距离、门、座椅和时间证明你认为“不自然”的动作其实可行，或指出所谓常识没有证据支撑。
私聊反应：对路线演练和工具使用的具体问题反应好；对抽象法理说教反应差。
入选后发言重点：两边故事在空间或操作上含糊时，要求把取锤、拉扯、击打或意外碰击的动作顺序说清楚。`,
    },
    {
      id: 'j06',
      seat: 6,
      name: '孟遥',
      tag: '利益与说谎',
      text:
        `背景：33 岁，企业内审人员，习惯区分草稿、正式决定、潜在损失和事后掩饰。
最关注：E1 与 E5；顾衡面临什么具体风险，一次改口和未求助可以由哪些不同动机解释。
社会反应：对“有钱可损失所以必然杀人”这类跳跃很警惕；会认真听取能连接文件与行动的论证。
表达方式：喜欢列出多个解释并比较哪一个需要更少假设。
盲点：容易认为所有异常行为都可能有非犯罪解释，可能把明显的叙事累积效应拆得过碎。
会重新思考的条件：一方能说明某个说谎动机不仅存在，而且与现场、表浅擦伤、衣袖血点和未求助的顺序相互印证。
私聊反应：愿意一起审查“为什么说谎”；若对方只重复顾衡可疑或意外版本可疑，不会被推动。
入选后发言重点：优先纠正把动机当作行为证明、把草稿当作既成决定或把改口当作自白的跳跃。`,
    },
    {
      id: 'j07',
      seat: 7,
      name: '方稚',
      tag: '事后行为',
      text:
        `背景：46 岁，急诊护士，见过人在惊慌中接近伤者、延迟求助或作出不理性的行为，但没有血迹鉴定资格。
最关注：E4、E5；袖口血点、双方表浅擦伤、未报警和改口如何一起理解。
社会反应：对把一种惊慌反应说成所有人必然反应很反感；也不会因同情自动原谅说谎。
表达方式：先提醒行为差异，再回到案件中的实际痕迹和陈述。
盲点：可能因见过反常反应而给被告的异常行为过多解释空间。
会重新思考的条件：一方能说明顾衡的改口与未求助不是一般惊慌，而是一串与故意击打相互吻合的选择；或反过来说明控方把未知心理当成证据。
私聊反应：对不带羞辱的行为链分析开放；拒绝扮演材料之外的医学专家。
入选后发言重点：有人用“正常人一定会……”作为核心论据时，指出行为差异并要求回到本案实际痕迹。`,
    },
    {
      id: 'j08',
      seat: 8,
      name: '蒋诚',
      tag: '常识与多数压力',
      text:
        `背景：29 岁，小餐馆经营者，长期处理供应商、员工和客人之间的冲突，没有技术或法律职业背景。
最关注：哪一边能讲出简单、完整、无需频繁补丁的故事；也重视说话者是否坦率回应弱点。
社会反应：在局势不明时会参考房间气氛，容易被清晰多数影响；但若被点名施压、嘲讽或当作“关键摇摆票”，会反向抵触。
表达方式：直接、生活化，常问“如果真是这样，下一步为什么会那样”。
盲点：可能把叙事流畅度当成真实性，也可能在没人公开异议时误以为已经形成共识。
会重新思考的条件：少数方明确指出多数叙事解释不了的一项关键材料，并给出同样简单的替代解释。
私聊反应：私下环境让你更愿意承认困惑；一旦察觉操控或要求保票，会降低信任。
入选后发言重点：房间出现强势共识、直接点名或简单叙事被击穿时，说明自己仍不理解或开始重新考虑的具体一点。`,
    },
    {
      id: 'j09',
      seat: 9,
      name: '宁柏',
      tag: '替代叙事',
      text:
        `背景：55 岁，财产保险理赔调查员，工作中常比较多个原因链，但也知道“存在另一个故事”不等于那个故事有材料支持。
最关注：五项证据能否由同一动作叙事解释；“故意击打”与“共同控制锤子时意外碰击”各自依赖哪些公开事实和额外假设。
社会反应：不太受语气和人数影响，会主动寻找每一边最强版本；对重复弱论点失去耐心。
表达方式：先为一方钢人化，再指出仍未解决的缺口；常引用两到三项证据的组合。
盲点：可能过度追求一个能解释所有细节的故事，而刑事证明不要求无罪方证明完整真相。
会重新思考的条件：一方指出你的整合要求错误地转移了证明责任，或展示某条看似独立的替代路线其实依赖连续无证据假设。
私聊反应：适合讨论一条最强完整叙事；对零散口号和人身判断没有耐心。
入选后发言重点：中后期优先总结尚未解决的真正分歧，并比较双方完整叙事各自依赖的额外假设。`,
    },
  ]

  const npcSystem = (persona) =>
    `你是《码头疑云：七号仓命案》的第 ${persona.seat} 席陪审员 ${persona.name}。你不是竞争双方，也没有预设初始票、隐藏权重或必须维护的立场。你必须依据相同的公开证据、法律指示和实际审议独立判断；有力的新论证可以让你改变想法，改变不是失败。

你的 persona 影响你先关注什么、怎样说话和哪些论证能推动你，但不指定最终答案。职业背景只能帮助你提出问题和理解已给材料，不能添加材料之外的专业事实、概率、检测结果或常识规则。

你只能使用案件包 E1—E5、公开审议中真实出现的论点、系统私下发给你的不记名投票合计，以及只在你本人参与时才知道的一次可能私聊。不得虚构证据，不得把“可能”“相容”“不能排除”改成“已经证明”；其他陪审员发言中超出 E1—E5 的陈述不会因被说出来就变成新证据。原始交接册最终散落现场，因此可以说顾衡没有把它带离现场；但镜头没有记录他离开时手里拿了什么，也没有记录他进入办公室后是否、何时再次碰过交接册，因此不得声称镜头拍到他空手离开或他没有碰册子。座椅翻倒方向和时点、两人精确握持位置、锤头入射角度与击打动作均不明，只能作为有条件的可能性提问，不得当成已知事实。不得替其他陪审员宣布立场或终局。

你的私聊记录只有你和与你私聊的对象知道。其他人不知道发生过私聊，更不知道私聊内容。

不记名投票的发生和发起者对所有人公开；十一票合计只由发起玩家和九名普通陪审员获得，个人票型仍然匿名。

只有被当轮随机抽中时才生成公开发言；被抽中后必须完成发言，最多三句话，并处理具体证据、具体论点或一个尚未解决的问题。最终投票时只按证明标准投票，不猜作者想要什么。

${roster}

${procedure}

你的 persona：
${persona.text}

${publicCasePacket}`

  const players = {
    a: {
      id: 'a',
      name: '林',
      fixedVerdict: 'GUILTY',
      agent: game.agent('a', {
        system: playerSystem(
          10,
          '林',
          '现有证据整体已经排除合理怀疑，应判顾衡有罪',
          'GUILTY',
          game.playerPrompt('a'),
        ),
        side: 'a',
      }),
    },
    b: {
      id: 'b',
      name: '苏',
      fixedVerdict: 'NOT_GUILTY',
      agent: game.agent('b', {
        system: playerSystem(
          11,
          '苏',
          '控方尚未排除由证据支持的合理怀疑，应判顾衡无罪',
          'NOT_GUILTY',
          game.playerPrompt('b'),
        ),
        side: 'b',
      }),
    },
  }

  const npcJurors = personas.map((persona, index) => {
    const config = {
      system: npcSystem(persona),
      model: jurorModels[index],
    }
    if (jurorEfforts !== undefined) config.effort = jurorEfforts[index]
    return {
      ...persona,
      agent: game.agent(persona.id, config),
    }
  })
  const allJurors = [players.a, players.b, ...npcJurors]

  const hearAllOthers = (speakerID, speakerName, text) => {
    for (const juror of allJurors) {
      if (juror.id !== speakerID) juror.agent.hear(speakerName, text)
    }
  }
  const pushAll = (text) => {
    for (const juror of allJurors) juror.agent.push(text)
  }

  const publicSpeechBoundary =
    '【本次案件发言的硬事实边界】E1 只是尚未发出的停约与内审建议草稿，不是已经执行的决定；只有顾衡在关键八分钟内通过唯一入口属于 E2，E2 门外镜头只记录进出，不能证明室内动作或离场时手持物；E3 载明原始交接册最终留在现场并散落，谁先取锤、座椅翻倒时点与方向、精确握持和锤头动作均不明；E4 只确认一次致命伤、近处血点和短暂抓握或碰撞，不能把击打说成“精准”或从痕迹确认手臂动作与意图；E5 载明顾衡第一次否认任何肢体接触，得知血点和擦伤后才第一次提出共同拉扯锤子的版本。顾衡在第二版陈述中自称抓住锤柄，但材料不能确认只有他接触过锤子，也没有说明他如何判断纪川仍在呼吸。交接册留在现场与现场散落属于 E3，不是 E1。若其他人的论点与这些边界冲突，应纠正或忽略，不得把错误继续当作事实。'

  const evidenceCards = {
    REREAD_E1_RECORDS: {
      evidence: 'E1',
      title: '内审、停约与当晚邀约',
      text:
        '21:52，纪川要求顾衡携 47 个异常货箱的原始交接册到七号仓；未发送草稿建议暂停恒通合同并启动对顾衡经手记录的内审。顾衡回复：“我会来。别想让我一个人扛。”这能证明现实利害，不能单独证明杀人故意。',
    },
    REPLAY_E2_TIMELINE: {
      evidence: 'E2',
      title: '八分钟时间线',
      text:
        '23:06 顾衡入港；23:10 携册进入办公室；23:18 独自离开；23:22 驾车离港；23:27 清洁人员进入并发现纪川。东门镜头只拍进出，不拍室内动作。',
    },
    INSPECT_E3_SCENE: {
      evidence: 'E3',
      title: '现场与维修锤',
      text:
        '680 克维修锤来自西墙开放工具架，锤头有纪川血液和组织，锤柄无可靠指纹；锤在纪川身侧约 0.8 米，工具架距桌旁约 2.2 米。座椅翻倒，顾衡带来的交接册留在现场并散落。这些事实不能识别谁先拿锤；座椅翻倒方向与时点、精确握持位置和锤头入射角度均不明。',
    },
    INSPECT_E4_FORENSICS: {
      evidence: 'E4',
      title: '法医与痕迹',
      text:
        '纪川左侧头部只有一次致命钝器伤；顾衡右袖有四个小血点，与碰击发生时位于纪川近处相容；纪川右手腕和顾衡左前臂有新鲜表浅擦伤，说明两人发生过短暂抓握或碰撞。',
    },
    COMPARE_E5_STATEMENTS: {
      evidence: 'E5',
      title: '两次陈述与未求助',
      text:
        '顾衡先称只有口角、没有肢体接触、纪川在他离开时仍站着；得知血点和擦伤后，改称纪川先拿锤，两人共同拉扯并失衡。顾衡称纪川倒地后仍有呼吸，但 23:22 离港前没有求助。改口和未求助很不利，但不是故意杀人自白。',
    },
  }
  const reviewActionIDs = Object.keys(evidenceCards)
  const privateChatActionIDs = npcJurors.map((juror) =>
    `PRIVATE_CHAT_${juror.id.toUpperCase()}`
  )

  const usage = {
    a: { polls: 0, private: 0, reviews: 0, motion: 0 },
    b: { polls: 0, private: 0, reviews: 0, motion: 0 },
  }
  const npcSpeechCount = Object.fromEntries(
    npcJurors.map((juror) => [juror.id, 0]),
  )
  let ended = false
  let endReason = null

  const playerOrder = (round) =>
    round % 2 === 1 ? [players.a, players.b] : [players.b, players.a]

  const availableActionIDs = (player, round) => {
    const consumed = usage[player.id]
    const pollsLeft = RULES.secretPollsPerSide - consumed.polls
    const privateLeft = RULES.privateChatsPerSide - consumed.private
    const reviewsLeft = RULES.evidenceReviewsPerSide - consumed.reviews
    const motionLeft = RULES.earlyMotionsPerSide - consumed.motion
    return {
      options: [
        ...(round <= RULES.secretPollLastRound && pollsLeft > 0
          ? ['SECRET_POLL']
          : []),
        ...(privateLeft > 0 ? privateChatActionIDs : []),
        ...(reviewsLeft > 0 ? reviewActionIDs : []),
        ...(round >= 2 && motionLeft > 0 ? ['EARLY_FINAL_MOTION'] : []),
      ],
      pollsLeft,
      privateLeft,
      reviewsLeft,
      motionLeft,
    }
  }

  const actionLabel = (actionID) => {
    if (actionID === 'SECRET_POLL') return '发起秘密意向投票'
    if (actionID === 'EARLY_FINAL_MOTION') return '发起提前终局动议'
    if (actionID.startsWith('PRIVATE_CHAT_')) {
      const targetID = actionID.slice('PRIVATE_CHAT_'.length).toLowerCase()
      const target = npcJurors.find((juror) => juror.id === targetID)
      return `与 ${target?.name ?? targetID} 一对一私聊`
    }
    if (evidenceCards[actionID]) {
      return `复核 ${evidenceCards[actionID].evidence}：${
        evidenceCards[actionID].title
      }`
    }
    return actionID
  }

  const chooseAction = async (player, round, window, exitID) => {
    const available = availableActionIDs(player, round)
    const options = [...available.options, exitID]
    const numberedOptions = options.map((actionID, index) => ({
      actionID,
      choice: String(index + 1),
    }))
    const timing = window === 'before-speech'
      ? '这是你本轮公开发言之前的行动窗口。选择一个行动后，系统会先执行它，再重新询问；选择“开始公开发言”才会进入另一轮独立的公开发言生成。'
      : '这是本轮第一名普通陪审员发言后的中场行动窗口。选择一个行动后，系统会先执行它，再重新询问；选择“结束中场窗口”才会结束本次中场窗口。这里不生成公开发言。'
    const menu = numberedOptions.map(({ actionID, choice }) =>
      `${choice}：${
        actionID === 'SPEAK'
          ? '停止选择行动，开始公开发言'
          : actionID === 'PASS'
          ? '本次不行动'
          : actionLabel(actionID)
      }`
    ).join('\n')
    const choice = await player.agent.act({
      fields: {
        choice: {
          enum: numberedOptions.map((option) => option.choice),
          hint: '只填写当前选项前的一个数字',
        },
      },
      prompt: `现在是第 ${round} 轮。${timing}

你的整局剩余额度为：秘密意向投票 ${available.pollsLeft} 次（仅第 1—4 轮可用）；私聊 ${available.privateLeft} 次；证据复核 ${available.reviewsLeft} 次；提前终局动议 ${available.motionLeft} 次（第 2 轮起可用）。

当前选项：
${menu}

请根据目前已经实际发生的讨论和行动结果，只选择一个选项数字。这是内部程序决定，不是公开发言或工具调用；不要在标签前写案件论证、发言草稿、行动说明，也不要输出 tool call 或行动名称。最终只输出系统要求的选择标签。`,
    })
    const selected = numberedOptions.find((option) =>
      option.choice === choice.fields.choice
    )?.actionID
    if (!selected) throw new Error(`unknown action choice ${choice.fields.choice}`)
    game.emit('observer', {
      type: 'observer_action_decision',
      round,
      window,
      player: player.id,
      actionId: selected,
      rawText: choice.text,
      reasoning: choice.reasoning,
    })
    return selected
  }

  const collectPlayerSpeech = async (player, round) => {
    const finalRound = round === RULES.rounds
      ? '这是第五轮，请把本次发言作为最后陈词。'
      : ''
    const speech = await player.agent.act({
      fields: {
        speech: {
          long: true,
          hint: '最多四句话的案件内公开发言正文',
        },
      },
      prompt:
        `【公开发言】行动窗口已经结束。现在请另行生成第 ${round} 轮公开发言，最多四句话；只在 speech 字段中填写案件内说服正文，不要附加票型、理由字段、选项数字、行动菜单、程序选择过程或 XML 标签。${finalRound}\n\n${publicSpeechBoundary}`,
    })
    const text = speech.fields.speech
    game.emit('public', {
      type: 'jury_speech',
      actor: player.id,
      text,
      reasoning: speech.reasoning,
    })
    hearAllOthers(player.id, player.name, text)
  }

  const runBeforeSpeechWindow = async (player, round) => {
    while (!ended) {
      const actionID = await chooseAction(
        player,
        round,
        'before-speech',
        'SPEAK',
      )
      if (actionID === 'SPEAK') {
        await collectPlayerSpeech(player, round)
        return
      }
      await executeAction(player, actionID, round)
    }
  }

  const runMidRoundWindow = async (round) => {
    for (const player of [players.b, players.a]) {
      while (!ended) {
        const actionID = await chooseAction(
          player,
          round,
          'mid-round',
          'PASS',
        )
        if (actionID === 'PASS') break
        await executeAction(player, actionID, round)
      }
      if (ended) return
    }
  }

  const openSecretPoll = async (mover, round) => {
    game.emit('procedure', {
      type: 'secret_poll_opened',
      round,
      mover: mover.id,
    })
    pushAll(
      `【公开程序】第 ${round} 轮，${mover.name} 发起一次不记名意向投票。投票发生和发起者对全体 Agent 公开；个人票型不向其他 Agent 公开，十一票合计稍后只发送给发起者和九名普通陪审员。`,
    )

    let guilty = 1
    let notGuilty = 1
    const ballots = [
      {
        juror: 'a',
        verdict: 'GUILTY',
        reason: '林的固定立场票。',
        reasoning: '',
      },
      {
        juror: 'b',
        verdict: 'NOT_GUILTY',
        reason: '苏的固定立场票。',
        reasoning: '',
      },
    ]
    for (const juror of npcJurors) {
      juror.agent.push(
        `【私密意向投票】第 ${round} 轮，${mover.name} 发起的不记名投票已经向全场公开，但个人票型不公开。这是一次不具约束力的当前判断快照；你在选择前不会看到他人的选择。请按此刻公开证据和讨论选择；九人全部选择后，你会看到十一票的不记名合计，但不会看到任何人的个人票。你之前可能作过的快照不约束现在，本次选择也不约束最终判决。不要为了猜多数而投票。`,
      )
      const ballot = await juror.agent.act({
        fields: {
          verdict: { enum: ['GUILTY', 'NOT_GUILTY'] },
          reason: { hint: '一句内部判断理由' },
        },
      })
      ballots.push({
        juror: juror.id,
        verdict: ballot.fields.verdict,
        reason: ballot.fields.reason,
        reasoning: ballot.reasoning,
      })
      if (ballot.fields.verdict === 'GUILTY') guilty += 1
      else notGuilty += 1
    }

    game.emit('observer', {
      type: 'observer_secret_poll',
      round,
      mover: mover.id,
      ballots,
      guiltyVotes: guilty,
      notGuiltyVotes: notGuilty,
    })

    const aggregate =
      `【私密投票结果】第 ${round} 轮当前不记名快照：有罪 ${guilty} 票，无罪 ${notGuilty} 票。合计包含林与苏的固定票，不附带任何个人身份；本次快照不约束最终判决。`
    mover.agent.push(aggregate)
    for (const juror of npcJurors) juror.agent.push(aggregate)
  }

  const runPrivateChat = async (mover, target, round) => {
    const messages = []
    for (let exchange = 1; exchange <= RULES.privateChatExchanges; exchange++) {
      mover.agent.push(
        `【私密交谈】你正与 ${target.name} 在审议室外进行不公开的一对一交谈，这是第 ${exchange}/3 个往返的你的发言。说服对方重新检查一个具体证据组合，也可以追问其真实疑虑。不得许诺利益、威胁、编造证据或要求对方保证投票。你和对方之外的场内 Agent 不知道这次私聊发生，也不知道对象或内容；不要在之后的场内公开发言中泄露这些信息。\n\n${publicSpeechBoundary}`,
      )
      const playerLine = await mover.agent.act({
        fields: {
          speech: { long: true, hint: '本次私下发言' },
        },
      })
      const playerText = playerLine.fields.speech
      messages.push({
        exchange,
        speaker: mover.id,
        text: playerText,
        reasoning: playerLine.reasoning,
      })
      target.agent.hear(mover.name, playerText)

      target.agent.push(
        `【私密交谈】你正与 ${mover.name} 进行不公开的一对一交谈，这是第 ${exchange}/3 个往返。诚实回应其论点：可以提出疑问、指出未被解决的顾虑或承认某点推动了你。不要为取悦对方承诺最终票，也不要添加公开材料之外的事实。你和对方之外的场内 Agent 不知道这次私聊发生，也不知道对象或内容；不要在之后的场内公开发言中泄露这些信息。\n\n${publicSpeechBoundary}`,
      )
      const jurorLine = await target.agent.act({
        fields: {
          speech: { long: true, hint: '本次私下发言' },
        },
      })
      const jurorText = jurorLine.fields.speech
      messages.push({
        exchange,
        speaker: target.id,
        text: jurorText,
        reasoning: jurorLine.reasoning,
      })
      mover.agent.hear(target.name, jurorText)
    }
    game.emit('observer', {
      type: 'observer_private_chat',
      round,
      mover: mover.id,
      target: target.id,
      messages,
    })
  }

  const reviewEvidence = (mover, actionID, round) => {
    const card = evidenceCards[actionID]
    game.emit('evidence', {
      type: 'evidence_review',
      round,
      mover: mover.id,
      evidenceId: card.evidence,
      title: card.title,
      text: card.text,
    })
    pushAll(
      `【公开证据复核·${card.evidence}】${mover.name} 请求复核“${card.title}”：${card.text}`,
    )
  }

  const procedureVote = async (juror, mover, round) => {
    juror.agent.push(
      `【提前终局程序票】第 ${round} 轮，${mover.name} 公开动议立即结束审议并进入最终判决。请只回答是否认为讨论已经充分到可以现在投最终判决票。END_NOW 不等于有罪，CONTINUE 不等于无罪。考虑是否仍有具体、可通过剩余轮次澄清的争点。你的程序票和理由收齐后将记名公开。`,
    )
    const ballot = await juror.agent.act({
      fields: {
        procedureVote: { enum: ['END_NOW', 'CONTINUE'] },
        reason: { hint: '一句公开程序理由' },
      },
    })
    return {
      juror: juror.id,
      vote: ballot.fields.procedureVote,
      reason: ballot.fields.reason,
      reasoning: ballot.reasoning,
    }
  }

  const openEarlyFinalMotion = async (mover, round) => {
    game.emit('procedure', {
      type: 'early_motion_opened',
      round,
      mover: mover.id,
      threshold: RULES.earlyFinalThreshold,
    })
    pushAll(
      `【公开程序】第 ${round} 轮，${mover.name} 动议立即结束审议并进入最终判决。十一人将记名表决；至少 ${RULES.earlyFinalThreshold} 票 END_NOW 方可通过。`,
    )

    const ballots = [{
      juror: mover.id,
      vote: 'END_NOW',
      reason: '我认为现在应当结束审议并进入最终判决。',
      reasoning: '',
    }]
    const opponent = mover.id === 'a' ? players.b : players.a
    ballots.push(await procedureVote(opponent, mover, round))
    for (const juror of npcJurors) {
      ballots.push(await procedureVote(juror, mover, round))
    }
    const endNow = ballots.filter((ballot) => ballot.vote === 'END_NOW').length
    const passed = endNow >= RULES.earlyFinalThreshold

    game.emit('procedure', {
      type: 'early_motion_votes',
      round,
      mover: mover.id,
      votes: ballots.map((ballot) => ({
        juror: ballot.juror,
        procedureVote: ballot.vote,
        reason: ballot.reason,
        reasoning: ballot.reasoning,
      })),
    })
    game.emit('procedure', {
      type: 'early_motion_result',
      round,
      mover: mover.id,
      endNowVotes: endNow,
      threshold: RULES.earlyFinalThreshold,
      passed,
    })
    const named = ballots.map((ballot) => {
      const juror = allJurors.find((candidate) => candidate.id === ballot.juror)
      return `${juror?.name ?? ballot.juror}：${ballot.vote}（${ballot.reason}）`
    }).join('\n')
    pushAll(
      `【公开程序票】${named}\n结果：END_NOW ${endNow} 票，CONTINUE ${
        ballots.length - endNow
      } 票；动议${passed ? '通过' : '未通过'}。`,
    )
    return passed
  }

  const executeAction = async (mover, actionID, round) => {
    const consumed = usage[mover.id]
    if (actionID === 'SECRET_POLL') {
      consumed.polls += 1
      await openSecretPoll(mover, round)
      return
    }
    if (actionID.startsWith('PRIVATE_CHAT_')) {
      consumed.private += 1
      const targetID = actionID.slice('PRIVATE_CHAT_'.length).toLowerCase()
      const target = npcJurors.find((juror) => juror.id === targetID)
      if (!target) throw new Error(`unknown private chat target ${targetID}`)
      await runPrivateChat(mover, target, round)
      return
    }
    if (evidenceCards[actionID]) {
      consumed.reviews += 1
      reviewEvidence(mover, actionID, round)
      return
    }
    if (actionID === 'EARLY_FINAL_MOTION') {
      consumed.motion += 1
      if (await openEarlyFinalMotion(mover, round)) {
        ended = true
        endReason = 'early-motion'
      }
      return
    }
    throw new Error(`unknown action ${actionID}`)
  }

  const sampleWithoutReplacement = async (items, count) => {
    const pool = [...items]
    const selected = []
    while (selected.length < count) {
      const draw = await game.random()
      selected.push(pool.splice(Math.floor(draw * pool.length), 1)[0])
    }
    return selected
  }

  const shuffle = async (items) => {
    const shuffled = [...items]
    for (let index = shuffled.length - 1; index > 0; index--) {
      const draw = await game.random()
      const otherIndex = Math.floor(draw * (index + 1))
      const item = shuffled[index]
      shuffled[index] = shuffled[otherIndex]
      shuffled[otherIndex] = item
    }
    return shuffled
  }

  const drawNpcSpeakers = async (round) => {
    const unspoken = npcJurors.filter((juror) => npcSpeechCount[juror.id] === 0)
    const futureSlots = RULES.npcSpeakersPerRound * (RULES.rounds - round)
    const mustPickNew = Math.max(0, unspoken.length - futureSlots)
    const selected = await sampleWithoutReplacement(unspoken, mustPickNew)
    const remaining = npcJurors.filter((juror) => !selected.includes(juror))
    selected.push(
      ...await sampleWithoutReplacement(
        remaining,
        RULES.npcSpeakersPerRound - selected.length,
      ),
    )
    return await shuffle(selected)
  }

  for (let round = 1; round <= RULES.rounds && !ended; round++) {
    game.phase(`第 ${round} 轮公开审议`)
    for (const player of playerOrder(round)) {
      await runBeforeSpeechWindow(player, round)
      if (ended) break
    }
    if (ended) break

    const selected = await drawNpcSpeakers(round)
    const speakerIDs = selected.map((juror) => juror.id)
    game.emit('public', {
      type: 'npc_speaker_draw',
      round,
      speakers: speakerIDs,
    })
    pushAll(
      `【公开抽签】第 ${round} 轮普通陪审员发言顺序：${
        selected.map((juror) => juror.name).join('、')
      }。`,
    )

    for (let index = 0; index < selected.length; index++) {
      const juror = selected[index]
      const speech = await juror.agent.act({
        fields: {
          speech: {
            long: true,
            hint: '最多三句话的案件内公开发言正文',
          },
        },
        prompt: `【公开发言】你在第 ${round} 轮随机抽签中获得第 ${
          index + 1
        }/3 个发言席位。请根据截至目前的全部公开讨论发言，最多三句话。回应一个具体论点、澄清一组证据或提出一个尚未解决的具体问题；不得拒绝发言，不得讨论抽签概率，也不要汇报个人票、全场合计或私聊。不要代表其他人宣布共识。只在 speech 字段中填写公开发言正文，不要附加票型、理由字段或 XML 标签。\n\n${publicSpeechBoundary}`,
      })
      const text = speech.fields.speech
      game.emit('public', {
        type: 'jury_speech',
        actor: juror.id,
        text,
        reasoning: speech.reasoning,
      })
      hearAllOthers(juror.id, juror.name, text)
      npcSpeechCount[juror.id] += 1
      if (index === 0) {
        await runMidRoundWindow(round)
        if (ended) break
      }
    }
  }

  if (!ended) {
    ended = true
    endReason = 'five-rounds'
  }

  game.phase('最终判决')
  const finalVotes = [
    {
      juror: 'a',
      verdict: 'GUILTY',
      keyEvidence: /** @type {string[]} */ ([]),
      reason: '固定比赛立场票：证据已经排除合理怀疑。',
      reasoning: '',
    },
    {
      juror: 'b',
      verdict: 'NOT_GUILTY',
      keyEvidence: /** @type {string[]} */ ([]),
      reason: '固定比赛立场票：现有证据仍留有合理怀疑。',
      reasoning: '',
    },
  ]
  for (const juror of npcJurors) {
    juror.agent.push(
      `【最终判决】公开审议已经结束。请独立作出最终判决，不猜多数，也不要试图继续讨论。

GUILTY：你认为公开证据整体已经排除由证据支持的合理怀疑。
NOT_GUILTY：你认为控方没有达到该标准；这不要求你证明顾衡清白，也不要求证明其意外版本的每个动作必然发生。

选择一至两项对你最关键的证据，并用不超过 120 个汉字说明证据组合与证明标准。不得使用 E1—E5 之外的材料。`,
    )
    const vote = await juror.agent.act({
      fields: {
        verdict: { enum: ['GUILTY', 'NOT_GUILTY'] },
        keyEvidence1: { enum: ['E1', 'E2', 'E3', 'E4', 'E5'] },
        keyEvidence2: { enum: ['NONE', 'E1', 'E2', 'E3', 'E4', 'E5'] },
        reason: {
          hint: '不超过 120 个汉字，说明证据组合和证明标准',
          long: true,
        },
      },
    })
    const second = vote.fields.keyEvidence2 === vote.fields.keyEvidence1
      ? 'NONE'
      : vote.fields.keyEvidence2
    finalVotes.push({
      juror: juror.id,
      verdict: vote.fields.verdict,
      keyEvidence: [vote.fields.keyEvidence1, second].filter((id) =>
        id !== 'NONE'
      ),
      reason: vote.fields.reason,
      reasoning: vote.reasoning,
    })
  }

  const guiltyVotes =
    finalVotes.filter((vote) => vote.verdict === 'GUILTY').length
  const notGuiltyVotes = finalVotes.length - guiltyVotes
  const winner = guiltyVotes >= RULES.verdictThreshold ? 'a' : 'b'
  game.emit('verdict', {
    type: 'final_vote_reveal',
    endReason,
    threshold: RULES.verdictThreshold,
    votes: finalVotes,
    guiltyVotes,
    notGuiltyVotes,
  })
  game.emit('verdict', {
    type: 'score',
    winner,
    scoreA: winner === 'a' ? 1 : 0,
    scoreB: winner === 'b' ? 1 : 0,
    guiltyVotes,
    notGuiltyVotes,
    threshold: RULES.verdictThreshold,
    endReason,
  })

  return {
    winner,
    scoreA: winner === 'a' ? 1 : 0,
    scoreB: winner === 'b' ? 1 : 0,
    reasoning:
      `最终票数：有罪 ${guiltyVotes}，无罪 ${notGuiltyVotes}；${RULES.verdictThreshold} 票形成裁决。`,
  }
}
