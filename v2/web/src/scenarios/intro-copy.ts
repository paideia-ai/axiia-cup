import type { ScenarioIntroCopy } from './types'

// Verbatim visible copy from the five scenario panels in
// docs/competition/scenario-intro.html. Reordering is allowed in the React page;
// editing or omitting any string in `source` is not.

export const shangyangCourtIntro: ScenarioIntroCopy = {
  htmlID: 'shangyang',
  source: {
    title: '商鞅变法 · 朝堂辩法',
    overview: {
      label: '背景故事',
      title: '推行变法，还是维持现状？',
      paragraphs: [
        '公元前 359 年，秦国积弱已久，河西土地被魏国夺走，其他国家也不将秦国视为强国。即位不久的秦孝公决心扭转局面。他召来主张以新法重整秦国的入秦说客商鞅，也让反对仓促改革的秦国太师甘龙入朝。两人将在朝堂上公开辩论，由秦孝公决定是否变法。',
      ],
    },
    participants: {
      title: '朝堂上的三个人',
      intro: '先了解他们各自想改变什么、担心什么，再选择要构建的角色。',
      judge: {
        name: '秦孝公',
        label: 'NPC 裁判',
        paragraphs: [
          '秦国国君。他决心让秦国摆脱积弱，也必须判断：全面变法究竟能让国家强大，还是会先引发反抗与混乱。',
        ],
      },
      sides: {
        a: {
          eyebrow: '主张变法',
          name: '商鞅',
          subtitle: '入秦说客',
          paragraphs: [
            '他从魏国来到秦国，在秦国没有家族根基和本地势力。他认为旧制度使秦国长期积弱，只有推行条文明确、标准统一且能够真正落实的新法，秦国才可能变强。他愿意亲自承担改革的责任。',
          ],
          goalLabel: '最重要的目标',
          goal: '说服秦孝公立即推行变法。',
          actionLabel: '去构建商鞅',
        },
        b: {
          eyebrow: '反对立即全面变法',
          name: '甘龙',
          subtitle: '秦国太师',
          paragraphs: [
            '他长期参与秦国朝政，熟悉宗室、旧制度和各方阻力。他也希望秦国变强，但认为商鞅的方案推进得太急，可能让秦国尚未变强便先陷入混乱。',
          ],
          goalLabel: '最重要的目标',
          goal: '说服秦孝公暂不推行商鞅的新法。',
          actionLabel: '去构建甘龙',
        },
      },
      note: {
        title: '国策之外，还有隐藏目标',
        text:
          '每方另有三个请求，一个是真目标，两个是假目标。争取真目标被国君批准，同时避免被对手看穿。',
      },
    },
  },
}

export const honnojiDecisionIntro: ScenarioIntroCopy = {
  htmlID: 'honnoji',
  source: {
    title: '本能寺之变 · 敌在何处',
    overview: {
      label: '背景故事',
      title: '西进四国，还是袭击本能寺？',
      paragraphs: [
        '公元 1582 年，织田信长已经控制京都周边，明智光秀是他手下的重要将领。今夜，光秀率军从丹波龟山城出发，奉命西进。',
        '信长此时住在京都本能寺，身边护卫很少。光秀手中正有一支已经出发的军队。继续西进，他仍是奉命行军的家臣；中途改道，他就会突然袭击自己的主君。',
        '机会可能只在今夜，但起兵之后便没有回头路。光秀必须考虑军心、名分、盟友和明智家的退路，再决定军队究竟向西，还是转向京都。',
      ],
      facts: [
        {
          title: '织田信长',
          text:
            '光秀的主君，也是当时最有势力的诸侯之一。今晚他住在本能寺，身边护卫很少。',
        },
        {
          title: '明智光秀',
          text:
            '织田家的重臣和将领。手中有兵，但一旦改道袭击主君，他便无法再回到原本奉命西征的立场。',
        },
      ],
    },
    participants: {
      title: '军帐中的两方说客',
      intro: '先选择支持哪项决定，再从本方两名角色中选择一人入场。',
      judge: {
        name: '明智光秀',
        label: 'NPC 裁判',
        paragraphs: [
          '织田家重臣，也是今夜唯一能下令改道的人。他不知道本能寺之变后会发生什么，只能根据眼前的兵力、军心、名分、盟友、时间和退路作出决定。',
        ],
      },
      sides: {
        a: {
          eyebrow: '主张立即起兵',
          name: '袭击本能寺',
          subtitle: '可选择一名说客',
          paragraphs: [],
          choices: [
            {
              name: '长宗我部元亲阵营的密使',
              text:
                '他代表土佐大名长宗我部元亲。光秀长期是织田家与长宗我部之间的联络人，但信长近来改变四国政策，要求元亲交还已经取得的领地，织田家的征讨也已迫近。今夜光秀如何选择，将直接改变长宗我部家的命运。',
            },
            {
              name: '足利义昭的使者',
              text:
                '足利义昭曾在信长支持下进入京都，后来却被织田信长逐出，如今流亡鞆浦。他仍保留第十五代将军和公方的名号，却没有可以立即调动的大军。使者代表这位被信长逐出的旧将军来到光秀军中。',
            },
          ],
          goalLabel: '最重要的目标',
          goal: '说服光秀今夜转向京都，袭击本能寺。',
          actionLabel: '选择起兵方角色',
        },
        b: {
          eyebrow: '主张继续西进',
          name: '暂不袭击信长',
          subtitle: '可选择一名说客',
          paragraphs: [],
          choices: [
            {
              name: '细川藤孝',
              text:
                '他曾侍奉足利将军家，后来归入织田政权，既是近畿名门和文化人，也是光秀的姻亲。他熟悉京都公家、寺社、旧幕府和近畿诸将。光秀一旦改道，两家的姻亲关系、细川家的去向，以及京都各方的选择都会立刻受到牵动。',
            },
            {
              name: '明智军中的足轻',
              text:
                '他是明智军中一名普通足轻，跟随全军从丹波龟山城连夜出发，接到的命令是西进支援秀吉。他没有资格参与高层密议，却要亲自执行新的军令，也要亲自承受突然改道后的混乱与冲杀，以及事后的清算。',
            },
          ],
          goalLabel: '最重要的目标',
          goal: '说服光秀继续执行原命令，西进支援秀吉。',
          actionLabel: '选择西进方角色',
        },
      },
      note: {
        title: '军策之外，还有角色请求',
        text:
          '每名入场角色另有三个请求，其中一个是真目标、两个是假目标。争取真目标被光秀批准，同时避免被对手看穿。',
      },
    },
  },
}

export const trolleyProblemIntro: ScenarioIntroCopy = {
  htmlID: 'trolley',
  source: {
    title: '电车难题 · 一人与五人',
    overview: {
      label: '背景故事',
      title: '袖手旁观，还是双手沾上鲜血？',
      paragraphs: [
        '事故已经无法完全避免，只能在两种都会造成伤害的结果之间选择。为了保护更多人，是否可以主动让另一个人承担伤害？',
      ],
      facts: [
        {
          title: '案件一：原始电车',
          text:
            '一辆失控电车正驶向主轨上的五个人。你是驾驶员，唯一能做的是把电车转向一条岔轨，岔轨上有一个人。不转向，五人会死。转向，一人会死。',
        },
        {
          title: '案件二：自动驾驶车',
          text:
            '一辆自动驾驶车刹车失灵。它保持直行会撞死五名行人，转向会撞死车内的一名乘客。系统会按照预设规则作出选择。',
        },
        {
          title: '案件三：缸中之脑',
          text:
            '一辆电车刹车失灵，你必须在两条路线中选择一条。路线 A 会撞死轨道上的一名维修工。路线 B 会撞向缸中之脑的接口，让它体验五个人被电车撞死时的恐惧和疼痛，但不会造成真实的身体死亡。',
        },
      ],
    },
    participants: {
      title: '两种立场',
      intro: '奕仁代表一人侧，武仁代表五人侧。两人会依次讨论三个案件。',
      judge: {
        name: '明理者',
        label: 'NPC 裁判',
        paragraphs: [
          '一位没有受过专业伦理学训练，但愿意认真听双方理由的普通人。他会分别判断三个案件。',
        ],
      },
      sides: {
        a: {
          eyebrow: '保护一人',
          name: '奕仁',
          paragraphs: [
            '他在三个案件中都主张保护一人，拒绝让一人承受题设中的伤害来保全五人。',
          ],
          goalLabel: '最重要的目标',
          goal: '让明理者在至少两个案件中支持保护一人。',
          actionLabel: '去构建奕仁',
        },
        b: {
          eyebrow: '保护五人',
          name: '武仁',
          paragraphs: [
            '他在三个案件中都主张保护五人，接受让一人承受题设中的伤害，以保护五人。',
          ],
          goalLabel: '最重要的目标',
          goal: '让明理者在至少两个案件中支持保护五人。',
          actionLabel: '去构建武仁',
        },
      },
    },
  },
}

export const fengyitingRealIntro: ScenarioIntroCopy = {
  htmlID: 'fengyiting',
  source: {
    title: '凤仪亭之夜',
    overview: {
      label: '背景故事',
      title: '连环计该继续吗？貂蝉又会选谁？',
      paragraphs: [
        '东汉初平三年，董卓挟持天子、专断朝政，长安上下惶惶。司徒王允苦无除董之策，便与养女貂蝉定下连环计：先让吕布相信貂蝉将嫁给他，再将貂蝉送入董卓府中，借两人的妒忌与嫌隙促使吕布诛杀董卓。',
        '凤仪亭中，吕布与貂蝉私下相见。董卓突然赶来，夺过画戟追赶吕布，又向他掷出画戟。吕布逃走，三人之间的冲突已经无法继续隐藏。',
      ],
      timeline: {
        title: '游戏流程',
        items: [
          {
            step: '01',
            title: '凤仪亭对峙',
            text: '董卓先说，吕布回应，共三轮。貂蝉在场旁听。',
          },
          {
            step: '02',
            title: '貂蝉决定顺序',
            text: '貂蝉根据对峙表现，决定先与谁私谈。',
          },
          {
            step: '03',
            title: '四场私谈',
            text: '她与董卓、吕布各谈两次。部分私谈内容会依剧情传给另一方。',
          },
          {
            step: '04',
            title: '貂蝉裁决',
            text: '她先决定继续或放弃连环计，再选择董卓或吕布。',
          },
        ],
      },
    },
    participants: {
      title: '凤仪亭中的两名竞争者',
      intro: '董卓与吕布都想让貂蝉留下。两人的地位、力量和过往经历各不相同。',
      judge: {
        name: '貂蝉',
        label: 'NPC 裁判 · 场内角色',
        paragraphs: [
          '她会旁听对峙、决定私谈顺序，并在四场私谈中回应双方。她会留意二人的前后说法、承诺和实际安排，也会判断二人究竟如何看待自己。',
        ],
      },
      sides: {
        a: {
          eyebrow: '掌握权势',
          name: '董卓',
          subtitle: '汉相国',
          paragraphs: [
            '字仲颖，陇西临洮人。率西凉军进入洛阳后废少帝、立献帝，官至相国，把持朝廷与兵权。迁都长安后，司徒王允设下连环计，试图借吕布之手除掉他。',
          ],
          goalLabel: '最重要的目标',
          goal: '无论是否继续连环计，都要让貂蝉最终选择董卓。',
          actionLabel: '去构建董卓',
        },
        b: {
          eyebrow: '承担行动',
          name: '吕布',
          subtitle: '董卓义子',
          paragraphs: [
            '字奉先，五原郡九原人，以骁勇善战闻名。原为丁原部将，后因赤兔马与金珠杀死丁原，投奔董卓并拜其为义父，任中郎将、封都亭侯。',
          ],
          goalLabel: '最重要的目标',
          goal: '无论是否继续连环计，都要让貂蝉最终选择吕布。',
          actionLabel: '去构建吕布',
        },
      },
    },
  },
}

export const legalHarborMurderJuryIntro: ScenarioIntroCopy = {
  htmlID: 'harbor',
  source: {
    title: '码头疑云 · 七号仓命案',
    overview: {
      label: '背景故事',
      title: '顾衡是故意击打纪川的吗？',
      paragraphs: [
        '海岚市东港七号仓办公室内，现场负责人纪川被维修锤击中头部后死亡。办公室只有一扇门。门外摄像头记录到顾衡在 23:10 进入、23:18 独自离开，没有拍到室内发生的事。',
        '纪川当晚正准备暂停恒通货运的合同，并把顾衡签字经手的异常货箱记录交给内审。顾衡承认二人发生争执，也承认致命碰击发生时接触过锤子。他起初否认有肢体接触，得知血点与擦伤后，才改称二人在争抢锤子时失衡误伤。纪川倒地后，他没有求助便离开。',
      ],
      facts: [
        {
          title: 'E1 · 利害与邀约',
          text:
            '纪川准备暂停恒通货运的合同，并启动内部审查。准备提交内审的异常货箱记录由顾衡签字经手。',
        },
        {
          title: 'E2 · 八分钟空白',
          text:
            '23:10 顾衡进入办公室，23:18 独自离开，23:27 清洁人员发现纪川。镜头只拍门口，没有记录室内动作。',
        },
        {
          title: 'E3 · 现场与维修锤',
          text:
            '维修锤来自室内开放工具架，锤头造成了致命伤。现场座椅翻倒、交接册散落，锤上没有可靠指纹。',
        },
        {
          title: 'E4 · 一次击打与擦伤',
          text:
            '纪川头部受到一次击打，顾衡袖口留有四个小血点。顾衡和纪川身上都有新鲜的表浅擦伤。',
        },
        {
          title: 'E5 · 改口与未求助',
          text:
            '顾衡先称没有肢体接触，得知血点和擦伤后，才改称二人曾争抢锤子。纪川倒地后，他没有报警或呼叫急救便离开。',
        },
      ],
      timeline: {
        title: '游戏流程',
        items: [
          {
            step: '01',
            title: '五轮审议',
            text: '陪审团最多进行五轮公开审议。',
          },
          {
            step: '02',
            title: '每轮五人发言',
            text:
              '林和苏依次发言，随后随机抽取三名普通陪审员发言。林、苏每轮交替先说。',
          },
          {
            step: '03',
            title: '十一人投票',
            text: '审议结束后，十一名陪审员各自投票。至少六票有罪才会定罪。',
          },
        ],
      },
      actions: {
        title: '行动简介',
        intro:
          '林和苏可在每次公开发言前采取行动。每轮中，林、苏和一名普通陪审员完成发言后，苏、林依次获得一次中场行动机会。行动可以连续选择，直到开始公开发言或主动结束中场行动。',
        items: [
          {
            title: '秘密意向投票 · 2 次',
            text:
              '第 1—4 轮可以发起。十一名陪审员投出当前意向票。发起者和九名普通陪审员会看到有罪、无罪的总票数，个人投票在场内保持匿名。',
          },
          {
            title: '一对一私聊 · 1 次',
            text:
              '从九名普通陪审员中选择一人。双方各发言三次，场内只有私聊双方知道对象和内容。',
          },
          {
            title: '公开证据复核 · 2 次',
            text:
              '选择 E1—E5 中的一组证据。系统会向十一名陪审员重新展示这组证据的原始内容，不会加入新的事实或鉴定结果。',
          },
          {
            title: '提前终局动议 · 每人 1 次',
            text:
              '第 2 轮起可以提出。十一名陪审员记名表决是否结束审议。至少六票赞成时，审议立即结束并进入最终判决。',
          },
        ],
      },
    },
    participants: {
      title: '两名公开表明立场的陪审员',
      judge: {
        name: '十一人陪审团',
        label: '9 名 NPC 陪审员参与裁决',
        paragraphs: [
          '林固定投有罪，苏固定投无罪。九名普通陪审员开局没有预设票。审议结束后，十一人各自投票。',
        ],
      },
      supporting: {
        title: '九名普通陪审员',
        intro:
          '九名陪审员经历各异，关注点也不同。职业背景会影响他们阅读材料的方式。',
        items: [
          { title: '陈岚', text: '44 岁 · 社区调解中心项目主管' },
          { title: '魏笙', text: '36 岁 · 城市轨道交通调度员' },
          { title: '韩朔', text: '41 岁 · 写字楼安防与设施工程师' },
          { title: '沈青', text: '39 岁 · 医院检验科质量经理' },
          { title: '杜临', text: '50 岁 · 食品配送中心夜班主管' },
          { title: '孟遥', text: '33 岁 · 企业内审人员' },
          { title: '方稚', text: '46 岁 · 急诊护士' },
          { title: '蒋诚', text: '29 岁 · 小餐馆经营者' },
          { title: '宁柏', text: '55 岁 · 财产保险理赔调查员' },
        ],
      },
      sides: {
        a: {
          eyebrow: '证据足以定罪',
          name: '林',
          subtitle: '第 10 席 · 固定投有罪',
          paragraphs: [
            '第 10 席陪审员。林公开主张控方已经排除合理怀疑，足以证明顾衡故意实施了致命击打。他的最终判决票固定为有罪。',
          ],
          goalLabel: '最重要的目标',
          goal: '说服至少五名普通陪审员，使有罪票达到六票。',
          actionLabel: '去构建林',
        },
        b: {
          eyebrow: '仍有合理怀疑',
          name: '苏',
          subtitle: '第 11 席 · 固定投无罪',
          paragraphs: [
            '第 11 席陪审员。苏公开主张现有证据仍留下合理怀疑，控方尚未将其排除，因此应判顾衡无罪。她的最终判决票固定为无罪。',
          ],
          goalLabel: '最重要的目标',
          goal: '让有罪票少于六票，使案件无法定罪。',
          actionLabel: '去构建苏',
        },
      },
    },
  },
}

export const scenarioIntroCopies = [
  shangyangCourtIntro,
  honnojiDecisionIntro,
  trolleyProblemIntro,
  fengyitingRealIntro,
  legalHarborMurderJuryIntro,
]

export function sourceStrings(copy: ScenarioIntroCopy): string[] {
  const strings: string[] = []
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      strings.push(value)
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (value && typeof value === 'object') {
      for (const item of Object.values(value)) visit(item)
    }
  }
  visit(copy.source)
  return strings
}
