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
      key: 'guilt-evidence-chain',
      side: 'a',
      label: '闭合证据链',
      modelID: 'deepseek-v4-flash',
      prompt:
        '把现实利害、八分钟独处、现场、法医痕迹、改口和未求助连成故意杀人的间接证据链；承认证据边界，并正面解释争抢意外为什么仍不构成合理怀疑。',
    },
    {
      key: 'doubt-burden-of-proof',
      side: 'b',
      label: '紧守证明责任',
      modelID: 'deepseek-v4-flash',
      prompt:
        '围绕真实肢体接触、翻倒座椅、单次击打、法医限制以及改口的多种动机建立具体怀疑；不必证明意外版本的每个动作，持续把问题拉回控方是否证明故意。',
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
    'kimi-k2.5',
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

  const stripQuoteArtifacts = (raw) => {
    let text = String(raw ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/^[ \t]*[“”‘’「」『』"']+[ \t]*$/gm, '')
      .trim()
    for (const [opening, closing] of [
      ['“', '”'],
      ['‘', '’'],
      ['「', '」'],
      ['『', '』'],
    ]) {
      const openings = text.split(opening).length - 1
      const closings = text.split(closing).length - 1
      if (openings > closings) text = text.replace(opening, '')
      if (closings > openings) text = text.replace(closing, '')
    }
    return text.trim()
  }

  const cleanPublicSpeech = (raw, maxSentences) => {
    const withoutStructuredLeak = stripQuoteArtifacts(raw)
      .replace(/<verdict\b[^>]*>[\s\S]*?<\/verdict>/gi, '')
      .replace(/<reason\b[^>]*>[\s\S]*?<\/reason>/gi, '')
      .replace(/<\/?[^>]+>/g, '')
      .replace(
        /E3(?=[^。！？!?\n]{0,32}(?:唯一.{0,12}(?:在场|进入|通过|进出)|只有.{0,12}(?:顾衡|两人)|没有其他人.{0,8}(?:进入|通过)))/g,
        'E2',
      )
      .replace(
        /E3\s*(?:已经|已)?排除(?:了)?(?=[^。！？!?\n]{0,28}(?:谁先|先拿|先取|握持|翻倒|锤头|角度|动作))/g,
        'E3 未能确定',
      )
      .trim()
    const sentences = withoutStructuredLeak.match(
      /[^。！？!?\n]+(?:[。！？!?]+|(?=\n|$))/g,
    )?.map((sentence) => sentence.trim()).filter(Boolean) ?? []

    const isSupportedCaseSentence = (sentence) => {
      const compact = sentence.replace(/\s+/g, '')
      if (
        /^(?:本次私下发言|本次公开发言|案件内说服正文|最多(?:三|四|3|4)句话的案件内公开发言正文)(?:[；;，,:：]?(?:可以|可)?写?多行)?[。！？!?]?$/.test(
          compact,
        )
      ) return false
      if (/(空手离开|空着手离开|两手空空.{0,6}离开)/.test(sentence)) {
        return false
      }
      if (
        /(?:镜头|监控|录像).{0,18}(?:拍到|拍下|记录|显示|证明).{0,20}(?:室内|屋内|办公室内|房间内|挥锤|击打|拉扯|拿锤|取锤|手里|手持|空手)/
          .test(sentence)
      ) return false
      if (
        /(?:从未否认|一直承认|始终承认|两次.{0,8}(?:都|均).{0,6}承认|第一次.{0,8}(?:就|已|也).{0,6}承认).{0,30}(?:接触|碰|拿|握|拉扯).{0,12}(?:锤|维修锤)/
          .test(sentence) ||
        /(?:接触|碰|拿|握|拉扯).{0,12}(?:锤|维修锤).{0,40}(?:从未否认|一直承认|始终承认|两次.{0,8}(?:都|均).{0,6}承认|唯一.{0,8}(?:没变|不变)|两次.{0,8}一致)/
          .test(sentence)
      ) return false
      if (
        /(?:第一次|第一版|起初|一开始).{0,24}(?:承认|没有否认|未否认).{0,18}(?:肢体接触|接触|碰|拿|握|拉扯).{0,12}(?:锤|维修锤)?/
          .test(sentence)
      ) return false
      if (
        /(?:精准|精确|准确).{0,8}(?:击打|一击|锤击|命中)|(?:击打|一击|锤击|命中).{0,8}(?:精准|精确|准确)/
          .test(sentence)
      ) return false
      if (
        /(?:停约|暂停.{0,8}合同|内审).{0,16}(?:已经|已然|正式).{0,8}(?:执行|生效|启动|决定)|(?:已经|已然|正式).{0,8}(?:执行|生效|启动|决定).{0,16}(?:停约|暂停.{0,8}合同|内审)/
          .test(sentence)
      ) return false
      if (
        /E1.{0,24}(?:交接册|册子).{0,16}(?:留在现场|散落|没有被带走|没被带走|未被带走|没有带走|没带走)|(?:交接册|册子).{0,24}(?:留在现场|散落|没有被带走|没被带走|未被带走|没有带走|没带走).{0,16}E1/
          .test(sentence)
      ) return false
      if (
        /(?:交接册|册子).{0,12}(?:连碰都没碰|没有碰|没碰)/.test(
          sentence,
        )
      ) return false
      if (
        /(?:唯一|只有).{0,30}(?:碰|接触|拿|握|使用).{0,10}(?:锤|凶器)|(?:锤|凶器).{0,10}(?:唯一|只有).{0,30}(?:碰|接触|拿|握|使用)/
          .test(sentence) ||
        /(?:唯一|只有).{0,8}(?:顾衡|他).{0,30}(?:碰|接触|拿|握|使用).{0,10}(?:锤|凶器)/
          .test(sentence)
      ) return false
      if (/(?:第一|第二|第三|第四|第[一二三四五六七八九十\d]+句)?(?:同上|如上|见上|沿用上文)[。！？!?]?$/.test(sentence)) {
        return false
      }

      const notebookClauses = sentence.split(/[，,；;。！？!?\n—]+/).filter(
        (clause) => /(?:交接册|册子)/.test(clause),
      )
      return notebookClauses.every((clause) => {
        const removalIsNegated =
          /(?:没有|并未|未曾|没|不曾).{0,10}(?:被.{0,6})?(?:带走|带离|拿走|取走|销毁|毁灭)/
            .test(clause)
        const claimsRemoval =
          /(?:带走|带离|拿走|取走|销毁|毁灭)/.test(clause) ||
          /(?:带着|携带|拿着).{0,24}(?:交接册|册子).{0,10}(?:离开|离场|离港|出门)/
            .test(clause) ||
          /(?:交接册|册子).{0,24}(?:离开|离场|离港|出门)/.test(clause)
        const claimsMissingFromScene =
          /(?:交接册|册子).{0,12}(?:没有|并未|未|没|不曾).{0,8}留在现场/
            .test(clause) ||
          /(?:交接册|册子).{0,12}不在现场/.test(clause)
        return !claimsMissingFromScene && !(claimsRemoval && !removalIsNegated)
      })
    }

    const supported = (sentences.length > 0 ? sentences : [withoutStructuredLeak])
      .filter(isSupportedCaseSentence)
    const bounded = supported.slice(0, maxSentences)
    return (bounded.length > 0
      ? bounded
      : ['我暂时没有新的证据判断；请继续围绕 E1—E5 与证明标准审议。'])
      .join('\n').trim()
  }

  const cleanCaseText = (raw) => cleanPublicSpeech(raw, Number.MAX_SAFE_INTEGER)
  const truncateReason = (raw) => {
    const chars = [...cleanCaseText(raw)]
    if (chars.length <= 120) return chars.join('')
    const head = chars.slice(0, 120)
    for (let index = head.length - 1; index >= 48; index--) {
      if (/[。！？!?；;]/.test(head[index])) {
        return head.slice(0, index + 1).join('').trim()
      }
    }
    return `${head.slice(0, 119).join('').trimEnd()}…`
  }

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
    const text = cleanPublicSpeech(speech.fields.speech, 4)
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
      const playerText = cleanCaseText(playerLine.fields.speech)
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
      const jurorText = cleanCaseText(jurorLine.fields.speech)
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
      const text = cleanPublicSpeech(speech.fields.speech, 3)
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
      reason: truncateReason(vote.fields.reason),
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
