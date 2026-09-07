/* B3 / A5 当前可交接人测集。
   这份数据刻意与 spec-v4 的 verification-journeys.json 使用同一组稳定 HV-* id：
   Test Mode 负责在产品里带路并写条款结果，详细手册负责 fixture、截图和完整证据提交。
   U05-C11 / U05-C12 虽各自规范句已确认，但两者的默认取版规则冲突，解决前不得进入本集合。 */
import type { FixtureField, FixtureProfile, Journey, Step } from '../data'

export const B3_A5_MANUAL_PATH = '/spec-v4-b3-a5-human-test'

/**
 * 只允许注入可公开的稳定业务 ID。账号别名留在 profile 文案；密码、cookie、
 * token 及运行时 a5HotseatActiveMatchId 不得进入此对象。
 */
export const B3_A5_FIXTURE_DEFAULTS: Record<string, string> = {
  appBaseUrl: 'https://axiia-cup-2-web.isofucius.cn',
  b3OwnerAgentId: '224',
  b3OwnerSiblingAgentId: '226',
  b3OwnerSoloSideAgentId: '225',
  b3OwnerTournamentId: '2',
  b3OwnerCompletedMatchId: '132',
  b3MissingSideAgentId: '227',
  b3PublicTargetAgentId: '224',
  a5CoreAgentId: '228',
  a5CoreMissingSideAgentId: '230',
  a5CoreLockedAgentId: '231',
  a5CoreMobileAgentId: '231',
  a5HotseatAgentId: '231',
  a5PvpExhaustedAgentId: '233',
  a5PvpExhaustedOpponentVersionId: '367',
  a5PvpChallengerAgentId: '228',
  a5PvpOpponentVersionId: '372',
}

type HandoffStep =
  & Pick<
    Step,
    | 'id'
    | 'action'
    | 'expected'
    | 'route'
    | 'marker'
    | 'versionPins'
    | 'testUrl'
    | 'links'
    | 'captures'
    | 'fixtureRefs'
    | 'knownGap'
    | 'screenshotEvidence'
  >
  & { clauseIds: string[] }

interface HandoffJourney {
  id: string
  n: string
  chapter: 'B3' | 'A5'
  title: string
  prerequisites: string[]
  evidenceRequirements: string[]
  completion: string
  fixtureProfiles: FixtureProfile[]
  steps: HandoffStep[]
}

const SCREENSHOT_HANDOFF =
  '先按指定文件名截图，再到「详细手册 · 上传本步骤截图」提交。Test Mode 的结果按钮只写条款与步骤状态，不会代替图片上传。'

function preparedId(name: string, label: string, help: string): FixtureField {
  return { name, label, help }
}

function handoffJourney(input: HandoffJourney): Journey {
  const fieldNames = new Set(
    input.fixtureProfiles.flatMap((profile) =>
      profile.fields.filter((field) => field.kind !== 'runtime').map((field) =>
        field.name
      )
    ),
  )
  const fixtureDefaults = Object.fromEntries(
    Object.entries(B3_A5_FIXTURE_DEFAULTS).filter(([name]) =>
      fieldNames.has(name)
    ),
  )
  return {
    id: input.id,
    round: 'handoff',
    n: input.n,
    chapter: input.chapter,
    title: input.title,
    manual: B3_A5_MANUAL_PATH,
    manualAnchor: input.id,
    prerequisites: input.prerequisites,
    evidenceRequirements: input.evidenceRequirements,
    completion: input.completion,
    fixtureProfiles: input.fixtureProfiles,
    fixtureDefaults,
    steps: input.steps.map((step, index) => ({
      ...step,
      round: 'handoff',
      journey: input.n,
      index: index + 1,
      specLine: `${input.chapter} · 规范句已确认 · 固定现行版本`,
      anchors: [],
      primary: step.clauseIds.slice(0, 1),
      known: null,
      humanOnly: SCREENSHOT_HANDOFF,
      manualUrl: `${B3_A5_MANUAL_PATH}#${step.id}`,
    })),
  }
}

export const B3_A5_JOURNEYS: Journey[] = [
  handoffJourney({
    id: 'HV-B3-OWNER-EA',
    n: 'B3.1',
    chapter: 'B3',
    title: '所有者 EA：入口、身份、版本与动作',
    prerequisites: [
      '先按 fixture 卡切换到账号 A（B3 人测·完整所有者）；主智能体有 v1、v2 两个版本，最新版文本已知，v2 已标为本阵营唯一参赛版本。',
      '种子数据口径固定：版本 359 有 1 场已计分、0 胜；参赛版本 360 为 0 场。执行中新增版本或对局后，先记录变化再按当时实际统计判定。',
      '同一阵营另有 b3OwnerSiblingAgentId，另一阵营有且仅有 b3OwnerSoloSideAgentId；缺侧检查必须切换到账号 B（B3 人测·访客缺侧）。',
      '准备 b3OwnerTournamentId 对应积分榜条目、D/DA「我的智能体」入口、玩家对局列表、b3OwnerCompletedMatchId 战报和一次 E 保存结果，全部指向 b3OwnerAgentId。',
      '记录环境 URL、build SHA、所有相关 agent/version/match ID 和预期统计。',
    ],
    evidenceRequirements: [
      '提交每个 screenshotEvidence 指定文件，截图须含地址栏或同时提交对应 URL 清单。',
      '另附去敏后的版本/对局种子查询，证明 S05 的已计分口径；不得提交密码、cookie 或令牌。',
      '记录 tester、执行时间、build SHA，以及每一步 pass/fail 和实际结果。',
    ],
    completion:
      'S01–S09 全部执行并提交证据；任何失败只更新 humanVerification 结果，不改变「规范句已确认」状态。',
    fixtureProfiles: [
      {
        id: 'b3-owner-rich',
        label: '账号 A · 完整所有者',
        accountAlias: 'B3 人测·完整所有者',
        readiness: 'ready',
        description:
          '双侧齐全；主智能体 224 的 v1=版本 359（已计分 1 场、0 胜），v2=版本 360（参赛版、0 场）；同侧兄弟=226，对侧唯一智能体=225。登录信息已通过私聊账号包交付。',
        fields: [
          preparedId(
            'b3OwnerAgentId',
            '完整所有者的主智能体 ID',
            '至少两个版本，且具备已计分与 0 场版本。',
          ),
          preparedId(
            'b3OwnerSiblingAgentId',
            '同阵营兄弟智能体 ID',
            '与主智能体同阵营，用于核对横向胶囊切换。',
          ),
          preparedId(
            'b3OwnerSoloSideAgentId',
            '另一阵营单智能体 ID',
            '该阵营同侧只有一个智能体，用于核对胶囊整排不出现。',
          ),
          preparedId(
            'b3OwnerTournamentId',
            '含主智能体的锦标赛 ID',
            '积分榜中必须有主智能体的可点击条目。',
          ),
          preparedId(
            'b3OwnerCompletedMatchId',
            '含主智能体的已完成对局 ID',
            '战报必须显示可进入该智能体详情的入口。',
          ),
        ],
      },
      {
        id: 'b3-owner-missing-side',
        label: '账号 B · 缺少对侧',
        accountAlias: 'B3 人测·访客缺侧',
        readiness: 'ready',
        description:
          '专门核对「去创建对侧」；与旅程 2 的只读访客复用同一私聊账号。',
        fields: [
          preparedId(
            'b3MissingSideAgentId',
            '缺少对侧账号的智能体 ID',
            '这个账号与完整所有者账号不是同一个状态。',
          ),
        ],
      },
    ],
    steps: [
      {
        id: 'HV-B3-OWNER-EA-S01',
        testUrl: '{{appBaseUrl}}/tournaments/{{b3OwnerTournamentId}}',
        links: [
          { label: '玩家对局列表', url: '{{appBaseUrl}}/matches' },
          {
            label: '已完成战报',
            url: '{{appBaseUrl}}/matches/{{b3OwnerCompletedMatchId}}',
          },
          { label: '我的智能体', url: '{{appBaseUrl}}/my-agents' },
          {
            label: '主智能体工作区',
            url: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}/build',
          },
        ],
        fixtureRefs: ['b3-owner-rich'],
        route: '/tournaments/:id',
        marker: null,
        action:
          '以账号 A 依次执行入口矩阵：在 b3OwnerTournamentId 的积分榜点 b3OwnerAgentId；在玩家对局列表点同一智能体；打开已完成战报后点「查看该智能体」；从 D/DA 侧卡点「查看我的…」；在 E 保存一个新版本后点保存结果中的智能体入口。上方每个辅助网址都可直接打开；每次记录落地 URL，再返回下一个入口。',
        expected:
          '每个入口都打开 /agents/{{b3OwnerAgentId}}，没有落到别的智能体或只停在中间列表页。',
        clauseIds: ['U10-C11', 'U10-C11b'],
        versionPins: {
          'U10-C11': 'baseline:U10-C11',
          'U10-C11b': 'comment-v2:U10-C11b',
        },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S01-leaderboard.png',
          'HV-B3-OWNER-EA-S01-player-matches.png',
          'HV-B3-OWNER-EA-S01-report.png',
          'HV-B3-OWNER-EA-S01-da-save.png',
        ],
      },
      {
        id: 'HV-B3-OWNER-EA-S02',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        links: [
          {
            label: '缺侧账号的 EA',
            url: '{{appBaseUrl}}/agents/{{b3MissingSideAgentId}}',
          },
          { label: '缺侧账号的我的智能体', url: '{{appBaseUrl}}/my-agents' },
        ],
        fixtureRefs: ['b3-owner-rich', 'b3-owner-missing-side'],
        route: '/agents/:id',
        marker: 'EA.page-header',
        action:
          '先以账号 A 查看 EA 页头的展示名、场景名和双侧完成度；再切换账号 B，打开上方「缺侧账号的 EA」与「缺侧账号的我的智能体」，点击或定位「去创建对侧」。',
        expected:
          '展示名使用「侧角色名「自起名」· 场景」口径，无自起名时回落「侧角色名 #id」，界面不出现「策略」「版本线」内部词；双侧状态分别显示 ✓/✗，缺侧时出现明确「去创建对侧」入口。',
        clauseIds: ['U10-C01', 'U10-C02'],
        versionPins: {
          'U10-C01': 'baseline:U10-C01',
          'U10-C02': 'baseline:U10-C02',
        },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S02-header.png',
          'HV-B3-OWNER-EA-S02-missing-side.png',
        ],
      },
      {
        id: 'HV-B3-OWNER-EA-S03',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id',
        marker: 'EA.edit-button',
        action: '在页头点击「编辑」，等待工作区加载完成；不要修改或保存文本。',
        expected:
          '浏览器进入 /agents/{{b3OwnerAgentId}}/build，编辑区载入该智能体最新版本的完整文本。',
        clauseIds: ['U10-C03'],
        versionPins: { 'U10-C03': 'comment-v2:U10-C03' },
        screenshotEvidence: ['HV-B3-OWNER-EA-S03-edit-latest.png'],
      },
      {
        id: 'HV-B3-OWNER-EA-S04',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id',
        marker: 'EA.diff-section',
        action:
          '展开「版本对比」，分别选择 v1 为基准版本、v2 为对比版本，点击页面提供的对比操作并展开两侧全文。',
        expected:
          '所有者能看到完整提示词和版本差异；基准、对比选择器都可用，结果对应所选两个版本。',
        clauseIds: ['U10-C04'],
        versionPins: { 'U10-C04': 'baseline:U10-C04' },
        screenshotEvidence: ['HV-B3-OWNER-EA-S04-diff.png'],
      },
      {
        id: 'HV-B3-OWNER-EA-S05',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id',
        marker: 'E.version-record',
        action:
          '逐张核对版本卡的对局数和胜场数；把非零版本与种子查询逐项比对，再定位 0 场版本并检查空态。',
        expected:
          '每张版本卡都按已完成且已计分对局显示对局数与胜场数，未完成/未计分对局不计入；0 场版本显示明确空态而不是空白。',
        clauseIds: ['U01-C32', 'U10-C05'],
        versionPins: {
          'U01-C32': 'baseline:U01-C32',
          'U10-C05': 'baseline:U10-C05',
        },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S05-scored-counts.png',
          'HV-B3-OWNER-EA-S05-zero-state.png',
        ],
      },
      {
        id: 'HV-B3-OWNER-EA-S06',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id',
        marker: 'E.entry-badge',
        action:
          '检查 v1、v2 的参赛徽章；点击非参赛版本的「设为参赛版本」，确认后再次检查两张卡。',
        expected:
          '操作前后本阵营始终恰好一个版本带参赛标记；改标后旧标记消失，新标记只出现在所选版本。',
        clauseIds: ['U10-C06'],
        versionPins: { 'U10-C06': 'baseline:U10-C06' },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S06-before.png',
          'HV-B3-OWNER-EA-S06-after.png',
        ],
      },
      {
        id: 'HV-B3-OWNER-EA-S07',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id',
        marker: 'E.version-card',
        action:
          '在一张参赛版本卡和一张非参赛版本卡上逐项检查并点击安全的展开动作；只打开「出战」面板后立即关闭，不确认派发。全文搜索「复制为新智能体」。',
        expected:
          '版本卡提供「展开全文」「设为参赛版本」（仅适用卡）、「基于该版本迭代」「出战」；不存在「复制为新智能体」或其降级入口。',
        clauseIds: ['U10-C08'],
        versionPins: { 'U10-C08': 'baseline:U10-C08' },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S07-actions.png',
          'HV-B3-OWNER-EA-S07-no-copy.png',
        ],
      },
      {
        id: 'HV-B3-OWNER-EA-S08',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}/build',
        links: [
          {
            label: '同一智能体 EA',
            url: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
          },
        ],
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id/build',
        marker: 'E.version-card',
        action:
          '截取 E 页下方版本卡，再打开上方「同一智能体 EA」截取同一版本卡；逐项比较动作、版本号、战绩和时间结构。',
        expected:
          'E 与 EA 使用同一套版本卡动作和信息结构；EA 额外提供版本 diff/公开视图语境，E 额外提供编辑区。',
        clauseIds: ['U10-C09'],
        versionPins: { 'U10-C09': 'baseline:U10-C09' },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S08-e.png',
          'HV-B3-OWNER-EA-S08-ea.png',
        ],
      },
      {
        id: 'HV-B3-OWNER-EA-S09',
        testUrl: '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        links: [
          {
            label: '同阵营兄弟 EA',
            url: '{{appBaseUrl}}/agents/{{b3OwnerSiblingAgentId}}',
          },
          {
            label: '另一阵营单智能体 EA',
            url: '{{appBaseUrl}}/agents/{{b3OwnerSoloSideAgentId}}',
          },
        ],
        fixtureRefs: ['b3-owner-rich'],
        route: '/agents/:id',
        marker: 'EA.sibling-pills',
        action:
          '在主智能体页点击 b3OwnerSiblingAgentId 的同侧兄弟胶囊并确认 URL；然后打开上方「另一阵营单智能体 EA」。',
        expected:
          '有多个同侧智能体时显示横向胶囊、当前项高亮且点击切换到 b3OwnerSiblingAgentId；同侧只有一个智能体时整排胶囊不出现。',
        clauseIds: ['U10-C10'],
        versionPins: { 'U10-C10': 'baseline:U10-C10' },
        screenshotEvidence: [
          'HV-B3-OWNER-EA-S09-siblings.png',
          'HV-B3-OWNER-EA-S09-solo.png',
        ],
      },
    ],
  }),

  handoffJourney({
    id: 'HV-B3-PUBLIC-NPC',
    n: 'B3.2',
    chapter: 'B3',
    title: '非所有者公开 EA 与 PVE NPC 聚合视图',
    prerequisites: [
      '按 fixture 卡登录账号 C（B3_PUBLIC_VIEWER）；该账号与 b3PublicTargetAgentId 无所有权关系。提前保存目标智能体的逐版本预期战绩和一段可唯一识别的提示词片段。',
      'NPC 步骤直接从场景页开始。当前产品没有 NPC agent 实体或可填写的 NPC ID；不得拼造 npcAgentId。若入口缺失，按已知实现缺口提交失败证据。',
      '记录环境 URL、build SHA、账号角色和所有预期值。',
    ],
    evidenceRequirements: [
      '提交指定截图及去敏后的公开/私有字段核对表。',
      '截图须能识别登录视角、玩家 agent ID、场景与 URL；NPC 入口缺失时明确写「无 NPC ID，不拼造」，不要求伪造 ID。',
      '记录 tester、执行时间、build SHA 和每一步实际结果。',
    ],
    completion:
      'S01–S02 全部执行并提交证据；实现缺口应记为 humanVerification fail，不改变「规范句已确认」状态。',
    fixtureProfiles: [
      {
        id: 'b3-public-viewer',
        label: '账号 C · 非所有者只读视角',
        accountAlias: 'B3 人测·访客缺侧',
        readiness: 'ready',
        description:
          '与目标智能体无所有权关系；与旅程 1 的缺侧账号复用同一私聊账号。',
        fields: [
          preparedId(
            'b3PublicTargetAgentId',
            '只读账号要查看的玩家智能体 ID',
            '测试者以无所有权关系的账号打开此 ID。',
          ),
        ],
      },
      {
        id: 'b3-npc-gap',
        label: 'NPC 聚合视图 · 无账号 ID',
        kind: 'known-gap',
        readiness: 'known-gap',
        description:
          '当前产品没有 NPC agent 实体或 /agents/:id 入口。不要填写或拼造 npcAgentId；真人从场景页查找入口并把缺失记录为 U10-C14 的实现失败。',
        fields: [],
      },
    ],
    steps: [
      {
        id: 'HV-B3-PUBLIC-NPC-S01',
        testUrl: '{{appBaseUrl}}/agents/{{b3PublicTargetAgentId}}',
        fixtureRefs: ['b3-public-viewer'],
        route: '/agents/:id',
        marker: 'EA.public-version-list',
        action:
          '以账号 C 打开 b3PublicTargetAgentId，逐张检查公开版本战绩；全文搜索已知提示词片段，并检查版本差异、工作区草稿或相关入口是否出现。',
        expected:
          '公开视图展示每个版本的对局数和胜场数；页面不显示提示词、工作区草稿或版本差异，也不能通过可见入口取得这些内容。',
        clauseIds: ['U10-C12', 'U10-C13'],
        versionPins: {
          'U10-C12': 'baseline:U10-C12',
          'U10-C13': 'baseline:U10-C13',
        },
        screenshotEvidence: [
          'HV-B3-PUBLIC-NPC-S01-public-stats.png',
          'HV-B3-PUBLIC-NPC-S01-private-content-absent.png',
        ],
      },
      {
        id: 'HV-B3-PUBLIC-NPC-S02',
        testUrl: '{{appBaseUrl}}/scenarios/shangyang-court',
        fixtureRefs: ['b3-public-viewer', 'b3-npc-gap'],
        knownGap: {
          title: '已知实现缺口 · U10-C14 仍需真人取证',
          detail:
            '当前产品的 PVE NPC 没有 agent 实体或 /agents/:id 聚合页，因此没有真实 npcAgentId 可以预填。',
          instruction:
            '不要跳过，也不要拼造 ID。若场景页找不到 NPC 的可查看入口，请截取目标 NPC 区域和地址栏，结果选「有问题」并写明缺少入口；只有入口存在时才继续核对两侧胜率。',
        },
        route: '/scenarios/:id',
        marker: null,
        action:
          '在场景页找到目标 PVE NPC，查找其可查看入口。若入口不存在，按上方已知缺口说明直接取证；若入口已经实现，点击进入聚合视图并核对两个阵营的胜率。',
        expected:
          '每个 PVE NPC 都有可查看的聚合视图；目标 NPC 在当前场景分别展示两个阵营胜率，数值与种子数据一致，不显示成玩家胜率。',
        clauseIds: ['U10-C14'],
        versionPins: { 'U10-C14': 'baseline:U10-C14' },
        screenshotEvidence: [
          'HV-B3-PUBLIC-NPC-S02-entry.png',
          'HV-B3-PUBLIC-NPC-S02-known-gap-or-two-side-rates.png',
        ],
      },
    ],
  }),

  handoffJourney({
    id: 'HV-A5-OS-CORE',
    n: 'A5.1',
    chapter: 'A5',
    title: '选择对手面板：预选、版本、换侧、锁定与移动端',
    prerequisites: [
      '账号 D（A5 人测·完整发起方）在同一场景两个阵营各有智能体，a5CoreAgentId 有三个版本且有显式参赛版本；创建引导必须另切账号 E（A5 人测·缺侧玩家）。',
      '锁定态必须切账号 F（A5 人测·锁定热座），并记录当前可配置解锁门槛及两侧实时进度。',
      '移动端复用账号 F（A5 人测·锁定热座）；浏览器切到 390×844，并在测试当天完成前序派发，让进行中对战条出现足够卡片后再执行本步。',
      '本旅程不点击最终派发按钮；记录环境 URL、build SHA 与 fixture 标识。',
    ],
    evidenceRequirements: [
      '提交每一步指定截图，S02 截图须同时显示版本选项和参赛标识，S05 须提交滚动前后两张。',
      '附当前解锁配置与账号门槛状态的去敏数据说明。',
      '记录 tester、执行时间、viewport、build SHA 和每一步实际结果。',
    ],
    completion:
      'S01–S05 全部执行并提交证据；fixme 或实现缺口可以导致失败，但不改变「规范句已确认」状态。',
    fixtureProfiles: [
      {
        id: 'a5-core-rich-owner',
        label: '账号 D · 双侧多版本',
        accountAlias: 'A5 人测·完整发起方',
        readiness: 'ready',
        description:
          '双侧齐全；主智能体 228 有版本 364（参赛版）、365、366，对侧智能体 229 的版本为 367；用于预选、版本列表与正常换侧。',
        fields: [
          preparedId(
            'a5CoreAgentId',
            '双侧齐全、含多版本的智能体 ID',
            '用于预选、版本列表与换侧，不执行最终派发。',
          ),
        ],
      },
      {
        id: 'a5-core-missing-side',
        label: '账号 E · 缺少对侧',
        accountAlias: 'A5 人测·缺侧玩家',
        readiness: 'ready',
        description: '只用于创建对侧引导。',
        fields: [
          preparedId(
            'a5CoreMissingSideAgentId',
            '缺少对侧的智能体 ID',
            '用于核对换侧时的创建引导。',
          ),
        ],
      },
      {
        id: 'a5-core-pvp-locked',
        label: '账号 F · PVP 未解锁',
        accountAlias: 'A5 人测·锁定热座',
        readiness: 'ready',
        description:
          '新账号保持 PVP 未解锁，用于锁图标、配置门槛和双侧实时进度；与 Hotseat 旅程复用同一私聊账号。',
        fields: [
          preparedId(
            'a5CoreLockedAgentId',
            'PVP 未解锁账号的智能体 ID',
            '需记录当前配置门槛与两侧实时进度。',
          ),
        ],
      },
      {
        id: 'a5-core-mobile-overflow',
        label: '账号 G · 多张进行中卡片',
        accountAlias: 'A5 人测·锁定热座',
        readiness: 'refresh-required',
        description:
          '与 Hotseat 旅程复用同一私聊账号；多张进行中卡片会自然结束，测试当天按步骤派发后再核对移动端横向对战条。',
        fields: [
          preparedId(
            'a5CoreMobileAgentId',
            '有多张进行中卡片的智能体 ID',
            '用于 390×844 下核对底部弹层与对战条横向滚动。',
          ),
        ],
      },
    ],
    steps: [
      {
        id: 'HV-A5-OS-CORE-S01',
        testUrl: '{{appBaseUrl}}/agents/{{a5CoreAgentId}}',
        fixtureRefs: ['a5-core-rich-owner'],
        route: '/agents/:id',
        marker: 'EA.field-button',
        action:
          '点击页头「出战」，关闭面板；再在指定版本卡点击「出战」并保持面板打开。',
        expected:
          '两次都打开紧凑的选择对手面板；面板预选 a5CoreAgentId，第二次还保持从指定版本发起的上下文。',
        clauseIds: ['U05-C01'],
        versionPins: { 'U05-C01': 'comment-v2:U05-C01' },
        screenshotEvidence: ['HV-A5-OS-CORE-S01-preselected.png'],
      },
      {
        id: 'HV-A5-OS-CORE-S02',
        testUrl: '{{appBaseUrl}}/agents/{{a5CoreAgentId}}',
        fixtureRefs: ['a5-core-rich-owner'],
        route: '/agents/:id',
        marker: 'OS.fielded-version',
        action:
          '在选择对手面板展开己方版本选择器，逐项核对所有可用版本；选择非默认版本，再切换回明确标记的参赛版本。',
        expected:
          '面板内列出全部可用版本，清楚标识当前参赛版本并允许选择本次出战版本；每个阵营只把真正已标记的一个版本显示为参赛版本。',
        clauseIds: ['U05-C02', 'U05-C02b'],
        versionPins: {
          'U05-C02': 'comment-v2:U05-C02',
          'U05-C02b': 'baseline:U05-C02b',
        },
        screenshotEvidence: [
          'HV-A5-OS-CORE-S02-version-list.png',
          'HV-A5-OS-CORE-S02-entry-marker.png',
        ],
      },
      {
        id: 'HV-A5-OS-CORE-S03',
        testUrl: '{{appBaseUrl}}/agents/{{a5CoreAgentId}}',
        links: [
          {
            label: '缺侧账号的 EA',
            url: '{{appBaseUrl}}/agents/{{a5CoreMissingSideAgentId}}',
          },
        ],
        fixtureRefs: ['a5-core-rich-owner', 'a5-core-missing-side'],
        route: '/agents/:id',
        marker: 'OS.tab-hotseat',
        action:
          '先以账号 D 查看面板当前阵营，点击「测试另一侧」或等义换侧操作并核对所选智能体；随后切换账号 E，打开上方「缺侧账号的 EA」重开面板并点击同一换侧操作。',
        expected:
          '当前阵营清楚可见；测试另一侧后改为选择对侧智能体；缺少该侧智能体时出现并可点击明确的创建引导。',
        clauseIds: ['U05-C03', 'U05-C04'],
        versionPins: {
          'U05-C03': 'comment-v2:U05-C03',
          'U05-C04': 'baseline:U05-C04',
        },
        screenshotEvidence: [
          'HV-A5-OS-CORE-S03-side-switch.png',
          'HV-A5-OS-CORE-S03-create-other-side.png',
        ],
      },
      {
        id: 'HV-A5-OS-CORE-S04',
        testUrl: '{{appBaseUrl}}/agents/{{a5CoreLockedAgentId}}',
        fixtureRefs: ['a5-core-pvp-locked'],
        route: '/agents/:id',
        marker: 'OS.gate-locked',
        action:
          '切换账号 F，打开「出战」并点击可见的 PVP/玩家约战 tab；核对锁图标、进度徽章和两侧数值。',
        expected:
          'PVP tab 在锁定时仍可见，内容明确显示锁定和两侧进度；门槛/进度数值来自当前配置，不是固定旧值。',
        clauseIds: ['U05-C06'],
        versionPins: { 'U05-C06': 'baseline:U05-C06' },
        screenshotEvidence: ['HV-A5-OS-CORE-S04-locked-progress.png'],
      },
      {
        id: 'HV-A5-OS-CORE-S05',
        testUrl: '{{appBaseUrl}}/agents/{{a5CoreMobileAgentId}}',
        fixtureRefs: ['a5-core-mobile-overflow'],
        route: '/agents/:id',
        marker: 'OS.panel',
        action:
          '切换账号 G，把 viewport 设为 390×844，点击「出战」；关闭面板后定位进行中对战条，用触摸或 Shift+滚轮横向滚到最后一张卡。',
        expected:
          '选择对手面板呈现为贴底弹层；对战条可横向滚动到全部卡片，页面本身不产生横向溢出。',
        clauseIds: ['U05-C14'],
        versionPins: { 'U05-C14': 'baseline:U05-C14' },
        screenshotEvidence: [
          'HV-A5-OS-CORE-S05-mobile-sheet.png',
          'HV-A5-OS-CORE-S05-strip-end.png',
        ],
      },
    ],
  }),

  handoffJourney({
    id: 'HV-A5-HOTSEAT-LIFECYCLE',
    n: 'A5.2',
    chapter: 'A5',
    title: '左右手互搏与进行中对战条',
    prerequisites: [
      '按 fixture 卡登录账号 H（A5 人测·锁定热座）：PVP 未解锁，但每日总对战仍有至少 1 场余量；同一场景两侧智能体齐全。',
      '操作前记录 battlesToday、pvpBattlesToday、总配额和 PVP 配额；确保没有其他进行中对局。',
      '打开网络记录和屏幕录制。a5HotseatActiveMatchId 不能预填：S01 派发成功后，把落地 /matches/:id 网址粘贴到本步的运行时记录框。',
    ],
    evidenceRequirements: [
      '提交指定截图、a5HotseatActiveMatchId、配额前后值和去敏后的派发响应。',
      'S02 另交一段从派发后出现到完局后隐藏的连续录屏或带时间戳截图序列。',
      '记录 tester、执行时间、build SHA 和每一步实际结果。',
    ],
    completion:
      'S01–S03 全部执行并提交证据；任何实现偏差记录为对应 clause 的真人失败。',
    fixtureProfiles: [
      {
        id: 'a5-hotseat',
        label: '账号 H · Hotseat 生命周期',
        accountAlias: 'A5 人测·锁定热座',
        readiness: 'ready',
        description:
          '双侧齐全、总配额仍有余量、PVP 未解锁或 PVP 配额不可用；执行前应无其他进行中对局。',
        fields: [
          preparedId(
            'a5HotseatAgentId',
            '可派发左右手互搏的智能体 ID',
            '双侧齐全、每日总对战至少剩 1 场，且操作前没有其他进行中对局。',
          ),
          {
            name: 'a5HotseatActiveMatchId',
            label: 'S01 本轮新派发的对局 ID',
            help:
              '不能预填：完成 S01 后粘贴 /matches/:id 的完整网址或只粘贴 ID，本页会自动提取并解锁后续网址。',
            kind: 'runtime',
            extract: 'matchId',
          },
        ],
      },
    ],
    steps: [
      {
        id: 'HV-A5-HOTSEAT-LIFECYCLE-S01',
        testUrl: '{{appBaseUrl}}/agents/{{a5HotseatAgentId}}',
        fixtureRefs: ['a5-hotseat'],
        captures: [
          {
            variable: 'a5HotseatActiveMatchId',
            label: '派发后记录本轮 activeMatchId',
            placeholder: '粘贴 …/matches/123 或只粘贴 123',
            hint:
              '本值只保存在当前标签会话；填入后 S02/S03 的对局网址会立即变成可点击链接。',
          },
        ],
        route: '/agents/:id',
        marker: 'OS.hotseat-dispatch-button',
        action:
          '点击「出战」→「左右手互搏」，确认双方智能体后点击「自打一场」；派发落地后立即把地址栏中的 /matches/:id 完整网址粘贴到下方记录框，并记录操作前后配额。',
        expected:
          '即使 PVP 门槛未解锁或 PVP 配额不可用也能派发 hotseat；pvpBattlesToday 不增加，battlesToday 恰增加 1。',
        clauseIds: ['U05-C08'],
        versionPins: {
          'U05-C08': 'confirmed-2026-09-06-u05-c08',
        },
        screenshotEvidence: [
          'HV-A5-HOTSEAT-LIFECYCLE-S01-before.png',
          'HV-A5-HOTSEAT-LIFECYCLE-S01-dispatched.png',
          'HV-A5-HOTSEAT-LIFECYCLE-S01-quota-after.png',
        ],
      },
      {
        id: 'HV-A5-HOTSEAT-LIFECYCLE-S02',
        testUrl: '{{appBaseUrl}}/agents/{{a5HotseatAgentId}}/build',
        links: [
          { label: '非派发处：场景目录', url: '{{appBaseUrl}}/scenarios' },
          {
            label: '本轮进行中对局',
            url: '{{appBaseUrl}}/matches/{{a5HotseatActiveMatchId}}',
          },
        ],
        fixtureRefs: ['a5-hotseat'],
        route: '/agents/:id/build',
        marker: 'OS.battle-strip',
        action:
          '派发后立即返回工作区，定位「进行中的对战」条，确认 a5HotseatActiveMatchId 卡片并点击折叠/展开；随后打开上方「场景目录」和「本轮进行中对局」核对非派发处与观战落点，再等待对局完成并返回工作区。',
        expected:
          '横条只在派发相关区域出现；派发后立即包含本人发起且仍进行中的 a5HotseatActiveMatchId，可折叠；非派发处不出现；对局完成且列表为空后卡片移出并自动隐藏空条。',
        clauseIds: ['U05-C09', 'U05-C09b'],
        versionPins: {
          'U05-C09': 'baseline:U05-C09',
          'U05-C09b': 'comment-v2:U05-C09b',
        },
        screenshotEvidence: [
          'HV-A5-HOTSEAT-LIFECYCLE-S02-expanded.png',
          'HV-A5-HOTSEAT-LIFECYCLE-S02-collapsed.png',
          'HV-A5-HOTSEAT-LIFECYCLE-S02-absent.png',
          'HV-A5-HOTSEAT-LIFECYCLE-S02-finished-hidden.png',
        ],
      },
      {
        id: 'HV-A5-HOTSEAT-LIFECYCLE-S03',
        testUrl: '{{appBaseUrl}}/agents/{{a5HotseatAgentId}}/build',
        links: [
          {
            label: '预期观战落点',
            url: '{{appBaseUrl}}/matches/{{a5HotseatActiveMatchId}}',
          },
        ],
        fixtureRefs: ['a5-hotseat'],
        route: '/agents/:id/build',
        marker: 'OS.battle-card',
        action:
          '在 a5HotseatActiveMatchId 仍进行中时点击横条里的该对局卡，并把实际落地与上方「预期观战落点」比较。',
        expected:
          '系统打开可观看的 a5HotseatActiveMatchId 对局视图；本条不要求 A5 内出现分享入口。',
        clauseIds: ['U05-C10'],
        versionPins: { 'U05-C10': 'comment-v2:U05-C10' },
        screenshotEvidence: ['HV-A5-HOTSEAT-LIFECYCLE-S03-watch.png'],
      },
    ],
  }),

  handoffJourney({
    id: 'HV-A5-PVP-BOUNDARIES',
    n: 'A5.3',
    chapter: 'A5',
    title: 'PVP 配额触顶、成对约战与被约方通知',
    prerequisites: [
      '账号 I（A5 人测·配额被约方）：稳定 ID 已预置；测试当天先将 PVP 解锁并刷新到当日可用次数 N/N，再以 {{a5PvpExhaustedOpponentVersionId}} 这个有效对手执行负例；操作前记录队列和对局基线。',
      '账号 J（A5 人测·完整发起方）与账号 K（A5 人测·配额被约方）在同一场景两侧智能体齐全；测试当天先完成双方 PVP 解锁，每侧显式标记一个参赛版本，成功约战时显式选择 {{a5PvpOpponentVersionId}}。',
      '账号 K 保持另一个浏览器会话并打开通知页；两边都打开网络记录，记录环境 URL 与 build SHA。',
    ],
    evidenceRequirements: [
      '提交指定截图，以及两次操作前后的对局/队列数量和去敏网络响应。',
      'S02 使用显式版本选择并只判断无需同意与通知，不记录 U05-C11/U05-C12 的冲突默认值；不得提交账号密码或令牌。',
      '记录 tester、执行时间、build SHA 和每一步实际结果。',
    ],
    completion:
      'S01–S02 全部执行并提交证据；配额触顶仍入队，或友谊约战等待同意/没有通知，都必须标记对应条款失败。',
    fixtureProfiles: [
      {
        id: 'a5-pvp-exhausted',
        label: '账号 I · PVP 已触顶',
        accountAlias: 'A5 人测·配额被约方',
        readiness: 'refresh-required',
        description:
          '稳定智能体与有效对手版本已就绪；当日 PVP 次数 N/N 必须在测试当天刷新。',
        fields: [
          preparedId(
            'a5PvpExhaustedAgentId',
            'PVP 当日次数 N/N 的发起智能体 ID',
            '必须已解锁 PVP，且执行前后都要核对队列与对局基线。',
          ),
          preparedId(
            'a5PvpExhaustedOpponentVersionId',
            '触顶负例使用的有效对手版本 ID',
            '仅证明拒绝原因是配额触顶，而不是对手无效。',
          ),
        ],
      },
      {
        id: 'a5-pvp-challenger',
        label: '账号 J · 成功约战发起方',
        accountAlias: 'A5 人测·完整发起方',
        readiness: 'refresh-required',
        description:
          '与被约方在同一场景、两侧齐全且版本 ID 已预置；测试当天先完成 PVP 解锁，再显式选择双方版本。',
        fields: [
          preparedId(
            'a5PvpChallengerAgentId',
            '成功约战发起方智能体 ID',
            '发起方双侧齐全并已解锁 PVP。',
          ),
          preparedId(
            'a5PvpOpponentVersionId',
            '成功约战被约方版本 ID',
            '在面板内显式选择；不以默认版本行为判定本步。',
          ),
        ],
      },
      {
        id: 'a5-pvp-invitee',
        label: '账号 K · 被约方通知会话',
        accountAlias: 'A5 人测·配额被约方',
        readiness: 'ready',
        description:
          '在另一个浏览器会话登录；与触顶负例复用同一私聊账号，无需填写公开业务 ID，直接打开通知页。',
        fields: [],
      },
    ],
    steps: [
      {
        id: 'HV-A5-PVP-BOUNDARIES-S01',
        testUrl: '{{appBaseUrl}}/agents/{{a5PvpExhaustedAgentId}}',
        links: [
          { label: '操作前后对局列表', url: '{{appBaseUrl}}/matches' },
        ],
        fixtureRefs: ['a5-pvp-exhausted'],
        route: '/agents/:id',
        marker: 'OS.challenge-button',
        action:
          '以账号 I 点击「出战」→「玩家约战」，显式选择有效对手版本 {{a5PvpExhaustedOpponentVersionId}} 并点击确认发起；随后检查页面文案、网络响应、队列和上方对局列表。',
        expected:
          '系统显示完整文案「今日次数已用完（N/N），明天再来」并拒绝入队；操作前后不得新增、排队或派发任何对局。',
        clauseIds: ['U03-C11'],
        versionPins: {
          'U03-C11': 'confirmed-2026-09-06-u03-c11',
        },
        screenshotEvidence: [
          'HV-A5-PVP-BOUNDARIES-S01-copy.png',
          'HV-A5-PVP-BOUNDARIES-S01-no-new-match.png',
        ],
      },
      {
        id: 'HV-A5-PVP-BOUNDARIES-S02',
        testUrl: '{{appBaseUrl}}/agents/{{a5PvpChallengerAgentId}}',
        links: [
          { label: '账号 K 的通知页', url: '{{appBaseUrl}}/notifications' },
        ],
        fixtureRefs: ['a5-pvp-challenger', 'a5-pvp-invitee'],
        route: '/agents/:id',
        marker: 'OS.challenge-button',
        action:
          '切换账号 J，在「玩家约战」显式选择双方版本（被约方选择 {{a5PvpOpponentVersionId}}）后发起友谊约战；不要评价默认版本选择。账号 K 的独立会话不做同意操作，直接打开上方通知页并检查是否有拒绝/取消入口。',
        expected:
          '约战无需被约方同意即可派发，被约方收到约战通知，且没有可拒绝已派发约战的入口；本步不判断创建几场或默认采用哪个版本。',
        clauseIds: ['U05-C13'],
        versionPins: { 'U05-C13': 'baseline:U05-C13' },
        screenshotEvidence: [
          'HV-A5-PVP-BOUNDARIES-S02-dispatched-without-consent.png',
          'HV-A5-PVP-BOUNDARIES-S02-notification.png',
        ],
      },
    ],
  }),
]
