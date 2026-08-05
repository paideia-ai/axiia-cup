// 全局 mock store：单例 + useSyncExternalStore。
// 所有「后端行为」（派发、对局推进、判决、通知）都在这里模拟；
// 每一处真实系统需要后端支持的地方见 docs/BACKEND_REQUIREMENTS.md。

import { useSyncExternalStore } from 'react'

import { CONFIG } from './config'
import { NPCS, SCENARIOS, otherSide } from './data'
import { genJudgeOs, genJudgeQa, genResult, genSelfTrace, genJudgeTrace, genTurn, scenarioOf } from './engine'
import type {
  Agent,
  AgentVersion,
  AppNotification,
  BuildMode,
  CurrentUser,
  LadderRow,
  Match,
  MatchKind,
  MatchParticipant,
  NotificationKind,
  Npc,
  PlayerScenarioProgress,
  Side,
  Tournament,
} from './types'

export interface PublicVersionRef {
  versionId: string
  /** 所属 agent —— 战报「查看对手智能体」按 agent 解析（refId 契约＝agent id） */
  agentId: string
  playerName: string
  agentName: string
  scenarioId: string
  /** 该公开版本所属 agent 的侧（#55）；约战必须选对手对侧的版本（#62） */
  side: Side
  model: string
}

export interface AppState {
  user: CurrentUser | null
  agents: Agent[]
  matches: Match[]
  notifications: AppNotification[]
  tournaments: Tournament[]
  ladder: LadderRow[]
  /** 天梯未建时「顶尖玩家」tab 的排序依据（W11 未定——mock 按锦标赛战绩排，见 SPEC_ISSUES.md） */
  topPlayers: { name: string; wins: number; scenarioId: string; versionRef: string }[]
  publicVersions: PublicVersionRef[]
  /** 赛事运行期间阻挡全部试炼（#47）；mock 用开关模拟 */
  trialsBlocked: boolean
  /** debug mode 任何观众可开（A7）；按浏览器会话记忆 */
  debugMode: boolean
}

// v4 后缀：#65（npcsBeaten 按侧）/#66（Match 增 challengeId/Leg）又改了形状，旧存档直接丢弃
const STORAGE_KEY = 'axiia-v3-mock-state-v4'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

let idCounter = 1000
export function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter.toString(36)}`
}

function now(): string {
  return new Date().toISOString()
}

// ---------- 种子数据 ----------

function seedDemoMatch(id: string, scenarioId: string, aName: string, bName: string): Match {
  const sc = scenarioOf(scenarioId)
  const match: Match = {
    id,
    kind: 'pvp-ranked',
    scenarioId,
    status: 'queued',
    createdAt: '2026-07-28T09:00:00Z',
    initiatorId: null,
    isFirstBattle: false,
    challengeId: null,
    challengeLeg: null,
    participants: {
      A: { kind: 'player', refId: 'ext', versionId: `${id}-va`, ownerId: 'ext-a', displayName: aName, model: 'kimi-k2.5' },
      B: { kind: 'player', refId: 'ext', versionId: `${id}-vb`, ownerId: 'ext-b', displayName: bName, model: 'deepseek-v3.2' },
    },
    transcript: [],
    finishedAt: null,
    totalTurns: Math.min(sc.dialogueTurns, 8),
    judgeOs: [],
    judgeTrace: null,
    selfTrace: { A: null, B: null },
    judgeQa: [],
    result: null,
  }
  for (let i = 0; i < match.totalTurns; i++) {
    match.transcript.push(genTurn(match, i))
    if (i % 2 === 1) match.judgeOs.push(genJudgeOs(match, i + 1))
  }
  match.judgeQa = genJudgeQa(match)
  match.result = genResult(match)
  match.judgeTrace = genJudgeTrace(match)
  match.selfTrace = { A: genSelfTrace(match, 'A'), B: genSelfTrace(match, 'B') }
  match.status = 'done'
  match.finishedAt = match.createdAt
  return match
}

function seedState(): AppState {
  // per-side 种子（#55）：琢玉在商鞅变法两侧各有一个 agent（→ 满足参赛双侧 #58），
  // 在御前咳嗽案只有 A 侧（→ 同侧第二个 agent 触发引导门 #59，EA 显示 御医 ✗ #64）。
  const myShangV1: AgentVersion = {
    id: 'ver-zya-1',
    num: 1,
    prompt: '你是商鞅。以强国实效为最高论据……（v1 初版策略）',
    model: 'kimi-k2.5',
    mode: 'mcq',
    note: '首战版本',
    createdAt: '2026-07-20T08:00:00Z',
    record: { wins: 1, losses: 1 },
  }
  const myShangV2: AgentVersion = {
    id: 'ver-zya-2',
    num: 2,
    prompt: '你是商鞅。以强国实效为最高论据，遇祖制之辩即转向质问对方强国之策；魏国情报压轴使用……',
    model: 'deepseek-v3.2',
    mode: 'basic',
    note: '强化了情报使用时机',
    createdAt: '2026-07-26T10:00:00Z',
    record: { wins: 2, losses: 0 },
  }
  const myShangAgent: Agent = {
    id: 'agent-zy-a',
    ownerId: 'me',
    ownerName: '琢玉',
    scenarioId: 'shangyang',
    side: 'A',
    name: '铁腕变法',
    versions: [myShangV1, myShangV2],
    tournamentVersionId: 'ver-zya-2',
    createdAt: '2026-07-20T08:00:00Z',
  }
  const myGanAgent: Agent = {
    id: 'agent-zy-b',
    ownerId: 'me',
    ownerName: '琢玉',
    scenarioId: 'shangyang',
    side: 'B',
    name: '老成谋国',
    versions: [
      {
        id: 'ver-zyb-1',
        num: 1,
        prompt: '你是甘龙。以三朝老臣姿态构筑稳定防线，攻击对方客卿身份；情报谨慎存疑……',
        model: 'kimi-k2.5',
        mode: 'basic',
        note: '守旧防线初版',
        createdAt: '2026-07-24T09:00:00Z',
        record: { wins: 1, losses: 1 },
      },
    ],
    tournamentVersionId: 'ver-zyb-1',
    createdAt: '2026-07-24T09:00:00Z',
  }
  // 御前咳嗽案：只有侍酒官（A）侧——再建一个侍酒官会被 #59 引导门拦住
  const myCoughAgent: Agent = {
    id: 'agent-zy-cough',
    ownerId: 'me',
    ownerName: '琢玉',
    scenarioId: 'cough',
    side: 'A',
    name: '时间线卫士',
    versions: [
      {
        id: 'ver-zyc-1',
        num: 1,
        prompt: '你是侍酒官。以完整时间线自证，每一步都给出人证；把疑点引向御医的毒理知识……',
        model: 'glm-5',
        mode: 'mcq',
        note: '',
        createdAt: '2026-07-27T08:00:00Z',
        record: { wins: 1, losses: 0 },
      },
    ],
    tournamentVersionId: 'ver-zyc-1',
    createdAt: '2026-07-27T08:00:00Z',
  }
  // 公开玩家 agent（单侧 #55）：EA 公开视图 / 排名页 / 战报「查看该智能体」入口的演示对象
  const moAgent: Agent = {
    id: 'agent-mo',
    ownerId: 'ext-mo',
    ownerName: '墨白',
    scenarioId: 'shangyang',
    side: 'A',
    name: '变法七策',
    versions: [
      {
        id: 'ver-mo-4',
        num: 4,
        prompt: '（公开视图不可见）',
        model: 'kimi-k2.5',
        mode: 'basic',
        note: '',
        createdAt: '2026-07-18T08:00:00Z',
        record: { wins: 9, losses: 2 },
      },
    ],
    tournamentVersionId: 'ver-mo-4',
    createdAt: '2026-07-01T08:00:00Z',
  }

  // 公开玩家的宿主 agent 档案：refId 契约＝agent id，「查看对手智能体」要能解析出 EA 公开视图。
  const pubAgent = (
    id: string, ownerName: string, scenarioId: string, side: 'A' | 'B', name: string,
    versionId: string, num: number, model: string, record: { wins: number; losses: number },
  ): Agent => ({
    id,
    ownerId: `ext-${id}`,
    ownerName,
    scenarioId,
    side,
    name,
    versions: [{ id: versionId, num, prompt: '（公开视图不可见）', model, mode: 'basic', note: '', createdAt: '2026-07-15T08:00:00Z', record }],
    tournamentVersionId: versionId,
    createdAt: '2026-07-02T08:00:00Z',
  })
  const moAgentB = pubAgent('agent-mo-b', '墨白', 'shangyang', 'B', '守旧之问', 'ver-mo-b2', 2, 'deepseek-v3.2', { wins: 6, losses: 3 })
  const syAgent = pubAgent('agent-sy', '疏影', 'shangyang', 'B', '老甘龙', 'ver-sy-2', 2, 'qwen3-max', { wins: 9, losses: 4 })
  const zsAgent = pubAgent('agent-zs', '止水', 'fengyi', 'B', '毒士', 'ver-zs-5', 5, 'glm-5', { wins: 11, losses: 3 })
  const qwAgentA = pubAgent('agent-qw-a', '青梧', 'fengyi', 'A', '连环记', 'ver-qw-3', 3, 'deepseek-v3.2', { wins: 7, losses: 5 })
  const qwAgentB = pubAgent('agent-qw-b', '青梧', 'fengyi', 'B', '连环反制', 'ver-qw-b1', 1, 'qwen3-max', { wins: 2, losses: 1 })
  const demoA = seedDemoMatch('demo-1', 'shangyang', '墨白·变法七策 v4', '疏影·老甘龙 v2')
  const demoB = seedDemoMatch('demo-2', 'fengyi', '青梧·连环记 v3', '止水·毒士 v5')
  // 战报版本 id 必须能贴进 OS 面板按 id 约战（#25 闭环）：用公开版本 id；双方分属对侧 agent（#62/#64）
  demoA.participants.A = { ...demoA.participants.A, refId: 'agent-mo', versionId: 'ver-mo-4', ownerId: 'ext-mo' }
  demoA.participants.B = { ...demoA.participants.B, refId: 'agent-sy', versionId: 'ver-sy-2', ownerId: 'ext-sy' }
  demoB.participants.A = { ...demoB.participants.A, refId: 'agent-qw-a', versionId: 'ver-qw-3', ownerId: 'ext-qw' }
  demoB.participants.B = { ...demoB.participants.B, refId: 'agent-zs', versionId: 'ver-zs-5', ownerId: 'ext-zs' }
  const historyDone: Match = seedDemoMatch('m-hist-1', 'shangyang', '铁腕变法 v2', '老成持重·甘龙')
  historyDone.kind = 'pve'
  historyDone.initiatorId = 'me'
  historyDone.participants.A = { kind: 'player', refId: 'agent-zy-a', versionId: 'ver-zya-2', ownerId: 'me', displayName: '铁腕变法 v2', model: 'deepseek-v3.2' }
  historyDone.participants.B = { kind: 'npc', refId: 'npc-shangyang-baoshou', versionId: null, ownerId: null, displayName: '老成持重·甘龙', model: 'kimi-k2.5' }

  return {
    user: {
      id: 'me',
      name: '琢玉',
      email: 'zhuoyu@example.com',
      expressPending: false,
      firstBattleDone: true,
      battlesToday: 2,
      pvpBattlesToday: 0,
      battlesDate: today(),
      progress: [
        // #65 门槛按侧：商鞅变法两侧各有 PVE 胜 → 已解锁；御前咳嗽案只有 A 侧 → 锁定态显示 御医 0/1
        { scenarioId: 'shangyang', npcsBeaten: { A: ['npc-shangyang-baoshou'], B: ['npc-shangyang-jinji'] }, ladderScore: null },
        { scenarioId: 'cough', npcsBeaten: { A: ['npc-cough-easy'], B: [] }, ladderScore: null },
      ],
    },
    agents: [myShangAgent, myGanAgent, myCoughAgent, moAgent, moAgentB, syAgent, zsAgent, qwAgentA, qwAgentB],
    matches: [demoA, demoB, historyDone],
    notifications: [
      {
        // #66：一次约战＝两场（正/反），被挑战方收到一条合并通知（mock 决定，见 DECISIONS）
        id: 'n-1',
        kind: 'challenged',
        title: '双侧约战来袭',
        body: '墨白 向你发起了双侧约战（两场）：他的「变法七策 v4」（商鞅）vs 你的「老成谋国」，你的「铁腕变法」vs 他的「守旧之问 v2」（甘龙）。无需同意，两场结果出来会通知你。',
        link: null,
        read: false,
        createdAt: '2026-08-04T02:10:00Z',
      },
      {
        id: 'n-2',
        kind: 'gate-unlocked',
        title: 'PVP 已解锁：商鞅变法',
        body: '你已在两侧各赢下 ≥1 场 PVE（商鞅 ✓ / 甘龙 ✓），「商鞅变法」的 PVP 对战已解锁。',
        link: '/scenarios/shangyang',
        read: true,
        createdAt: '2026-07-25T12:00:00Z',
      },
      {
        id: 'n-3',
        kind: 'announcement',
        title: '系统公告：裁判 prompt 平衡补丁',
        body: '「御前咳嗽案」裁判对时间线矛盾的敏感度已上调。',
        link: null,
        read: true,
        createdAt: '2026-07-22T09:00:00Z',
      },
    ],
    tournaments: [
      {
        id: 't-1',
        name: '七月锦标赛 · 商鞅变法',
        scenarioId: 'shangyang',
        status: 'finished',
        rounds: [
          {
            name: '第一轮',
            matches: [
              { matchId: 'demo-1', playerA: '墨白', playerB: '疏影', winner: '墨白' },
              { matchId: 'demo-1', playerA: '青梧', playerB: '止水', winner: '止水' },
            ],
          },
          {
            name: '决赛',
            matches: [{ matchId: 'demo-1', playerA: '墨白', playerB: '止水', winner: '墨白' }],
          },
        ],
      },
    ],
    ladder: [
      { rank: 1, player: '墨白', scenarioId: 'shangyang', score: 1280, agentDisplay: '墨白的商鞅变法' },
      { rank: 2, player: '止水', scenarioId: 'shangyang', score: 1195, agentDisplay: '止水的商鞅变法' },
      { rank: 3, player: '疏影', scenarioId: 'shangyang', score: 1101, agentDisplay: '疏影的商鞅变法' },
    ],
    topPlayers: [
      { name: '墨白', wins: 14, scenarioId: 'shangyang', versionRef: 'ver-mo-4' },
      { name: '止水', wins: 11, scenarioId: 'fengyi', versionRef: 'ver-zs-5' },
      { name: '疏影', wins: 9, scenarioId: 'shangyang', versionRef: 'ver-sy-2' },
    ],
    publicVersions: [
      // agent 按侧（#55）；#66 约战按「玩家」成对——墨白/青梧双侧齐备（可被约战），疏影/止水单侧（演示「对方未双侧齐备」拒绝）
      { versionId: 'ver-mo-4', agentId: 'agent-mo', playerName: '墨白', agentName: '变法七策', scenarioId: 'shangyang', side: 'A', model: 'kimi-k2.5' },
      { versionId: 'ver-mo-b2', agentId: 'agent-mo-b', playerName: '墨白', agentName: '守旧之问', scenarioId: 'shangyang', side: 'B', model: 'deepseek-v3.2' },
      { versionId: 'ver-zs-5', agentId: 'agent-zs', playerName: '止水', agentName: '毒士', scenarioId: 'fengyi', side: 'B', model: 'glm-5' },
      { versionId: 'ver-sy-2', agentId: 'agent-sy', playerName: '疏影', agentName: '老甘龙', scenarioId: 'shangyang', side: 'B', model: 'qwen3-max' },
      { versionId: 'ver-qw-3', agentId: 'agent-qw-a', playerName: '青梧', agentName: '连环记', scenarioId: 'fengyi', side: 'A', model: 'deepseek-v3.2' },
      { versionId: 'ver-qw-b1', agentId: 'agent-qw-b', playerName: '青梧', agentName: '连环反制', scenarioId: 'fengyi', side: 'B', model: 'qwen3-max' },
    ],
    trialsBlocked: false,
    debugMode: false,
  }
}

// ---------- store ----------

type Listener = () => void

class MockStore {
  private state: AppState
  private listeners = new Set<Listener>()
  private timer: ReturnType<typeof setInterval> | null = null
  /** matchId -> 下一次推进时间戳 */
  private schedule = new Map<string, number>()

  constructor() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try {
        this.state = JSON.parse(raw) as AppState
      } catch {
        this.state = seedState()
      }
    } else {
      this.state = seedState()
    }
    // 刷新后把跑到一半的对局重新排进推进队列
    for (const m of this.state.matches) {
      if (m.status !== 'done') this.schedule.set(m.id, Date.now() + 1500)
    }
    this.ensureTimer()
  }

  getState = (): AppState => this.state

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private commit(mutate: (s: AppState) => void) {
    mutate(this.state)
    this.state = { ...this.state }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // 存储失败不致命
    }
    for (const fn of this.listeners) fn()
  }

  resetAll() {
    localStorage.removeItem(STORAGE_KEY)
    this.state = seedState()
    this.schedule.clear()
    this.commit(() => {})
  }

  // ---------- 账户 ----------

  loginDemo() {
    if (!this.state.user) {
      this.commit((s) => {
        const seeded = seedState()
        Object.assign(s, seeded)
      })
    }
  }

  register(name: string, _email: string, _inviteCode: string) {
    // 注册 → 自动登录 → 落进快速通道（B2/A3）
    this.commit((s) => {
      s.user = {
        id: 'me',
        name: name || '新选手',
        email: _email,
        expressPending: true,
        firstBattleDone: false,
        battlesToday: 0,
        pvpBattlesToday: 0,
        battlesDate: today(),
        progress: [],
      }
      s.agents = []
      s.matches = s.matches.filter((m) => m.initiatorId !== 'me')
      s.notifications = []
    })
  }

  logout() {
    this.commit((s) => {
      s.user = null
    })
  }

  toggleDebugMode() {
    this.commit((s) => {
      s.debugMode = !s.debugMode
    })
  }

  toggleTrialsBlocked() {
    this.commit((s) => {
      s.trialsBlocked = !s.trialsBlocked
    })
  }

  // ---------- agent / 版本 ----------

  /** 当前用户在某场景两侧各有哪些 agent（#59/#64 的判定基础） */
  myAgentsBySide(scenarioId: string): { A: Agent[]; B: Agent[] } {
    const uid = this.state.user?.id
    const mine = this.state.agents.filter((a) => a.scenarioId === scenarioId && a.ownerId === uid)
    return { A: mine.filter((a) => a.side === 'A'), B: mine.filter((a) => a.side === 'B') }
  }

  /**
   * 同侧第二个 agent 引导门（#59）：已有 1 个该侧 agent、想再建同侧 → 必须先有 ≥1 个对侧 agent；
   * 两侧都有后不再限制。版本迭代永不受此门限（解读 D16）——本检查只在「新建 agent」时调用。
   */
  canCreateAgent(scenarioId: string, side: Side): { ok: boolean; sameSideCount: number; otherSideCount: number } {
    const by = this.myAgentsBySide(scenarioId)
    const sameSideCount = by[side].length
    const otherSideCount = by[otherSide(side)].length
    return { ok: sameSideCount === 0 || otherSideCount >= 1, sameSideCount, otherSideCount }
  }

  /** 参赛资格＝双侧各有一个显式标记的参赛版本（#58）；供 D/DA/EA/G 的完成度徽章（#64） */
  entryReadiness(scenarioId: string): {
    A: { agent: Agent; version: AgentVersion } | null
    B: { agent: Agent; version: AgentVersion } | null
    eligible: boolean
  } {
    const by = this.myAgentsBySide(scenarioId)
    const pick = (side: Side) => {
      for (const a of by[side]) {
        const v = a.versions.find((x) => x.id === a.tournamentVersionId)
        if (v) return { agent: a, version: v }
      }
      return null
    }
    const A = pick('A')
    const B = pick('B')
    return { A, B, eligible: A !== null && B !== null }
  }

  createAgent(scenarioId: string, name: string, side: Side): { ok: true; agent: Agent } | { ok: false; reason: 'sibling-gate' } {
    if (!this.canCreateAgent(scenarioId, side).ok) return { ok: false, reason: 'sibling-gate' }
    const agent: Agent = {
      id: nextId('agent'),
      ownerId: this.state.user?.id ?? 'me',
      ownerName: this.state.user?.name ?? '选手',
      scenarioId,
      side,
      name,
      versions: [],
      tournamentVersionId: null,
      createdAt: now(),
    }
    this.commit((s) => {
      s.agents = [...s.agents, agent]
    })
    return { ok: true, agent }
  }

  /** 保存＝存版本，不派发（#17）；单侧提示词（#55/#57）。版本迭代不受 #59 门限（D16）。返回新版本。 */
  saveVersion(
    agentId: string,
    input: { prompt: string; model: string; mode: BuildMode; note?: string },
  ): AgentVersion {
    const version: AgentVersion = {
      id: nextId('ver'),
      num: 0,
      prompt: input.prompt,
      model: input.model,
      mode: input.mode,
      note: input.note ?? '',
      createdAt: now(),
      record: { wins: 0, losses: 0 },
    }
    this.commit((s) => {
      s.agents = s.agents.map((a) => {
        if (a.id !== agentId) return a
        version.num = a.versions.length + 1
        // 参赛版本迁移默认最新（#33/C4）
        return {
          ...a,
          versions: [...a.versions, version],
          tournamentVersionId: a.tournamentVersionId === null || a.tournamentVersionId === a.versions.at(-1)?.id
            ? version.id
            : a.tournamentVersionId,
        }
      })
    })
    return version
  }

  markTournamentVersion(agentId: string, versionId: string) {
    this.commit((s) => {
      s.agents = s.agents.map((a) => (a.id === agentId ? { ...a, tournamentVersionId: versionId } : a))
    })
  }

  // ---------- 派发 ----------

  /** 跨日清零（「明天再来」#52 的兑现）：日期变了就重置每日计数 */
  private rolloverDaily() {
    const user = this.state.user
    if (!user || user.battlesDate === today()) return
    this.commit((s) => {
      if (s.user) s.user = { ...s.user, battlesToday: 0, pvpBattlesToday: 0, battlesDate: today() }
    })
  }

  /** 每日上限检查（#45/#52：只计发起人；触顶＝可点→提示→拒绝入队） */
  dailyLimitReached(): boolean {
    this.rolloverDaily()
    return (this.state.user?.battlesToday ?? 0) >= CONFIG.dailyBattleLimit
  }

  /** 单场派发：PVE / hotseat（#61）。PVP 一律走 dispatchPairedPvp（#66 双侧成对）。 */
  dispatch(opts: {
    kind: MatchKind
    scenarioId: string
    agentId: string
    versionId: string
    /** 执方由所选 agent 隐含（#62）——不再接收 side 参数。
     *  对手二选一：NPC（补对侧槽位）/ 自己对侧的 agent-version（hotseat #61） */
    opponent: { npcId?: string; myVersion?: { agentId: string; versionId: string } }
    firstBattle?: boolean
  }):
    | { ok: true; match: Match }
    | { ok: false; reason: 'daily-limit' | 'concurrency' | 'trials-blocked' | 'bad-opponent' | 'wrong-side' } {
    if (this.state.trialsBlocked) return { ok: false, reason: 'trials-blocked' }
    if (this.dailyLimitReached()) return { ok: false, reason: 'daily-limit' }
    // #46 并发上限：同时排队/进行中的自发对局数
    const active = this.state.matches.filter(
      (m) => m.initiatorId === this.state.user?.id && m.status !== 'done',
    ).length
    if (!opts.firstBattle && active >= CONFIG.concurrencyLimit) return { ok: false, reason: 'concurrency' }
    const agent = this.state.agents.find((a) => a.id === opts.agentId)
    const version = agent?.versions.find((v) => v.id === opts.versionId)
    if (!agent || !version) return { ok: false, reason: 'bad-opponent' }
    const sc = scenarioOf(opts.scenarioId)
    const mySide: Side = agent.side
    const oppSide: Side = otherSide(mySide)

    const mine: MatchParticipant = {
      kind: 'player',
      refId: agent.id,
      versionId: version.id,
      ownerId: agent.ownerId,
      displayName: `${agent.name} v${version.num}`,
      model: version.model,
    }
    let theirs: MatchParticipant
    if (opts.opponent.npcId) {
      const npc = NPCS.find((n) => n.id === opts.opponent.npcId)
      if (!npc) return { ok: false, reason: 'bad-opponent' }
      theirs = { kind: 'npc', refId: npc.id, versionId: null, ownerId: null, displayName: npc.name, model: 'kimi-k2.5' }
    } else if (opts.opponent.myVersion) {
      // hotseat（#61）：打自己对侧的 agent；对侧多个时由 OS 面板选定
      const oppAgent = this.state.agents.find((a) => a.id === opts.opponent.myVersion?.agentId)
      const oppVersion = oppAgent?.versions.find((v) => v.id === opts.opponent.myVersion?.versionId)
      if (!oppAgent || !oppVersion || oppAgent.ownerId !== agent.ownerId || oppAgent.scenarioId !== opts.scenarioId) {
        return { ok: false, reason: 'bad-opponent' }
      }
      if (oppAgent.side !== oppSide) return { ok: false, reason: 'wrong-side' }
      theirs = {
        kind: 'player',
        refId: oppAgent.id,
        versionId: oppVersion.id,
        ownerId: oppAgent.ownerId,
        displayName: `${oppAgent.name} v${oppVersion.num}`,
        model: oppVersion.model,
      }
    } else {
      return { ok: false, reason: 'bad-opponent' }
    }

    const match: Match = {
      id: nextId('m'),
      kind: opts.kind,
      scenarioId: opts.scenarioId,
      status: opts.firstBattle ? 'running' : 'queued', // 首战直进实况（#9）
      createdAt: now(),
      initiatorId: this.state.user?.id ?? 'me',
      isFirstBattle: opts.firstBattle ?? false,
      challengeId: null,
      challengeLeg: null,
      participants: mySide === 'A' ? { A: mine, B: theirs } : { A: theirs, B: mine },
      transcript: [],
      finishedAt: null,
      totalTurns: opts.firstBattle ? CONFIG.expressTurns : Math.min(sc.dialogueTurns, 10),
      judgeOs: [],
      judgeTrace: null,
      selfTrace: { A: null, B: null },
      judgeQa: [],
      result: null,
    }
    this.commit((s) => {
      s.matches = [match, ...s.matches]
      if (s.user) {
        s.user = { ...s.user, battlesToday: s.user.battlesToday + 1 }
      }
    })
    this.schedule.set(match.id, Date.now() + (opts.firstBattle ? 1200 : 2500))
    this.ensureTimer()
    return { ok: true, match }
  }

  /**
   * #66 双侧成对约战：一次 PVP 约战产生两场——正（我 A vs 他 B）+ 反（他 A vs 我 B），共享 challengeId。
   * 双方都必须双侧齐备（每侧 ≥1 个有版本的 agent）；单侧玩家既不能约战也不能被约战。
   * 每日/PVP 计数对发起人记 2 场（解读 Q7，待确认——见 DECISIONS/SPEC_ISSUES）；配额不足 2 场时整对拒绝。
   */
  dispatchPairedPvp(opts: {
    kind: 'pvp-friendly' | 'pvp-ranked'
    scenarioId: string
    /** 发起人自选的双侧出战阵容（各侧一个 agent+version，默认参赛版本/最新版由 UI 决定） */
    mine: { A: { agentId: string; versionId: string }; B: { agentId: string; versionId: string } }
    /** 对手＝玩家（#66）；pinnedVersionId＝按 id 约战时固定其对应侧的版本，另一侧取其最新公开版 */
    opponent: { playerName: string; pinnedVersionId?: string }
  }):
    | { ok: true; matches: [Match, Match] }
    | { ok: false; reason: 'daily-limit' | 'pvp-daily-limit' | 'concurrency' | 'trials-blocked' | 'both-sides-required' | 'opponent-both-sides-required' | 'bad-opponent' } {
    if (this.state.trialsBlocked) return { ok: false, reason: 'trials-blocked' }
    this.rolloverDaily()
    const user = this.state.user
    if (!user) return { ok: false, reason: 'bad-opponent' }
    // 配额按 2 场检查（Q7 解读：两场都计发起人）
    if (user.battlesToday + 2 > CONFIG.dailyBattleLimit) return { ok: false, reason: 'daily-limit' }
    if (user.pvpBattlesToday + 2 > CONFIG.pvpDailyLimit) return { ok: false, reason: 'pvp-daily-limit' }
    const active = this.state.matches.filter((m) => m.initiatorId === user.id && m.status !== 'done').length
    if (active + 2 > CONFIG.concurrencyLimit) return { ok: false, reason: 'concurrency' }

    // 我方双侧阵容校验
    const mineFor = (side: Side): MatchParticipant | null => {
      const a = this.state.agents.find((x) => x.id === opts.mine[side].agentId)
      const v = a?.versions.find((x) => x.id === opts.mine[side].versionId)
      if (!a || !v || a.ownerId !== user.id || a.scenarioId !== opts.scenarioId || a.side !== side) return null
      return { kind: 'player', refId: a.id, versionId: v.id, ownerId: a.ownerId, displayName: `${a.name} v${v.num}`, model: v.model }
    }
    const mineA = mineFor('A')
    const mineB = mineFor('B')
    if (!mineA || !mineB) return { ok: false, reason: 'both-sides-required' }

    // 对手双侧解析：按玩家取每侧公开版本；按 id 约战只固定该 id 所属侧
    const refs = this.state.publicVersions.filter((p) => p.scenarioId === opts.scenarioId && p.playerName === opts.opponent.playerName)
    const pinned = opts.opponent.pinnedVersionId ? refs.find((r) => r.versionId === opts.opponent.pinnedVersionId) : undefined
    if (opts.opponent.pinnedVersionId && !pinned) return { ok: false, reason: 'bad-opponent' }
    const refFor = (side: Side): PublicVersionRef | undefined =>
      pinned?.side === side ? pinned : refs.find((r) => r.side === side)
    const refA = refFor('A')
    const refB = refFor('B')
    if (!refA || !refB) return { ok: false, reason: 'opponent-both-sides-required' }
    const theirsOf = (ref: PublicVersionRef): MatchParticipant => ({
      kind: 'player',
      refId: ref.agentId,
      versionId: ref.versionId,
      ownerId: `ext-${ref.playerName}`,
      displayName: `${ref.agentName}（${ref.playerName}）`,
      model: ref.model,
    })

    const sc = scenarioOf(opts.scenarioId)
    const challengeId = nextId('chal')
    const base = {
      kind: opts.kind,
      scenarioId: opts.scenarioId,
      status: 'queued' as const,
      createdAt: now(),
      initiatorId: user.id,
      isFirstBattle: false,
      challengeId,
      transcript: [],
      finishedAt: null,
      totalTurns: Math.min(sc.dialogueTurns, 10),
      judgeOs: [],
      judgeTrace: null,
      selfTrace: { A: null, B: null },
      judgeQa: [],
      result: null,
    }
    const leg1: Match = { ...base, id: nextId('m'), challengeLeg: 1, participants: { A: mineA, B: theirsOf(refB) } }
    const leg2: Match = { ...base, id: nextId('m'), challengeLeg: 2, participants: { A: theirsOf(refA), B: mineB } }
    this.commit((s) => {
      s.matches = [leg1, leg2, ...s.matches]
      if (s.user) {
        // Q7（待确认）：一次约战对发起人计 2 场
        s.user = { ...s.user, battlesToday: s.user.battlesToday + 2, pvpBattlesToday: s.user.pvpBattlesToday + 2 }
      }
    })
    this.schedule.set(leg1.id, Date.now() + 2500)
    this.schedule.set(leg2.id, Date.now() + 3400)
    this.ensureTimer()
    // 被挑战方通知：真实系统应向对方发一条合并通知（#29/#66）；mock 无对方收件箱，语义记录在 BACKEND_REQUIREMENTS
    return { ok: true, matches: [leg1, leg2] }
  }

  // ---------- 对局推进（假 worker） ----------

  private ensureTimer() {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), 700)
  }

  private tick() {
    const nowMs = Date.now()
    let dirty = false
    for (const [id, at] of this.schedule) {
      if (at > nowMs) continue
      const match = this.state.matches.find((m) => m.id === id)
      if (!match || match.status === 'done') {
        this.schedule.delete(id)
        continue
      }
      dirty = true
      if (match.status === 'queued') {
        match.status = 'running'
        this.schedule.set(id, nowMs + 1200)
      } else if (match.transcript.length < match.totalTurns) {
        const i = match.transcript.length
        match.transcript = [...match.transcript, genTurn(match, i)]
        if (i % 2 === 1) match.judgeOs = [...match.judgeOs, genJudgeOs(match, i + 1)]
        this.schedule.set(id, nowMs + 1600)
      } else if (match.judgeQa.length === 0) {
        match.judgeQa = genJudgeQa(match)
        this.schedule.set(id, nowMs + 1800)
      } else {
        match.result = genResult(match)
        match.judgeTrace = genJudgeTrace(match)
        match.selfTrace = {
          A: match.participants.A.kind === 'player' ? genSelfTrace(match, 'A') : null,
          B: match.participants.B.kind === 'player' ? genSelfTrace(match, 'B') : null,
        }
        match.status = 'done'
        match.finishedAt = now()
        this.schedule.delete(id)
        this.onMatchDone(match)
      }
    }
    if (dirty) this.commit(() => {})
  }

  private onMatchDone(match: Match) {
    const user = this.state.user
    if (!user || match.initiatorId !== user.id) return
    const winner = match.result?.winner
    // 逐版本战绩天然按侧（#55/#63）：属于我的每个参与者更新其单侧版本战绩。
    // hotseat（#61）两侧都是我的 agent——两个版本各记一笔。
    for (const side of ['A', 'B'] as const) {
      const p = match.participants[side]
      if (p.kind !== 'player' || p.ownerId !== user.id) continue
      const w = winner === side
      const l = winner !== undefined && winner !== 'draw' && !w
      this.state.agents = this.state.agents.map((a) =>
        a.id !== p.refId ? a : {
          ...a,
          versions: a.versions.map((v) =>
            v.id !== p.versionId ? v : { ...v, record: { wins: v.record.wins + (w ? 1 : 0), losses: v.record.losses + (l ? 1 : 0) } },
          ),
        },
      )
    }
    const mySides = (['A', 'B'] as const).filter((s) => match.participants[s].ownerId === user.id)
    const isHotseat = mySides.length === 2
    const mySide: Side | null = mySides[0] ?? null
    if (!mySide) return
    const won = winner === mySide
    // 「玩家赢过某 NPC」事实（A6）+ 门槛通知；#65：胜利按「我执的侧」归因，门槛＝每侧各赢 ≥N 场
    const oppSide: Side = mySide === 'A' ? 'B' : 'A'
    const opp = match.participants[oppSide]
    if (won && opp.kind === 'npc') {
      const N = CONFIG.pvpUnlockPerSideWins
      let progress: PlayerScenarioProgress | undefined = user.progress.find((p) => p.scenarioId === match.scenarioId)
      const wasUnlocked = progress !== undefined && progress.npcsBeaten.A.length >= N && progress.npcsBeaten.B.length >= N
      if (!progress) {
        progress = { scenarioId: match.scenarioId, npcsBeaten: { A: [], B: [] }, ladderScore: null }
        user.progress = [...user.progress, progress]
      }
      if (!progress.npcsBeaten[mySide].includes(opp.refId)) {
        progress.npcsBeaten = { ...progress.npcsBeaten, [mySide]: [...progress.npcsBeaten[mySide], opp.refId] }
      }
      const nowUnlocked = progress.npcsBeaten.A.length >= N && progress.npcsBeaten.B.length >= N
      if (!wasUnlocked && nowUnlocked) {
        const sc = scenarioOf(match.scenarioId)
        const roleA = sc.sideA.name.split('（')[0]
        const roleB = sc.sideB.name.split('（')[0]
        this.pushNotification('gate-unlocked', 'PVP 已解锁', `你已在两侧各赢下 ≥${N} 场 PVE（${roleA} ✓ / ${roleB} ✓），「${sc.name}」的 PVP 对战已解锁。`, `/scenarios/${match.scenarioId}`)
      }
      this.state.user = { ...user }
    }
    if (match.isFirstBattle && this.state.user) {
      this.state.user = { ...this.state.user, firstBattleDone: true, expressPending: false }
    }
    // hotseat 两侧都是你——胜负按侧报（#61）
    const outcomeText = isHotseat
      ? winner === 'draw' ? '平局' : `你的「${match.participants[winner as Side].displayName}」胜`
      : winner === 'draw' ? '平局' : won ? '你赢了' : '你输了'
    if (match.kind === 'pvp-ranked') {
      // 计分 PVP：更新天梯（mock 计分 ±25/−15）并发 ③ 自动匹配结果通知（#53）
      const cur = this.state.user
      if (cur) {
        const progress = cur.progress.find((p) => p.scenarioId === match.scenarioId)
        const prev = progress?.ladderScore ?? 1000
        const next = prev + (won ? 25 : match.result?.winner === 'draw' ? 0 : -15)
        if (progress) progress.ladderScore = next
        else cur.progress = [...cur.progress, { scenarioId: match.scenarioId, npcsBeaten: { A: [], B: [] }, ladderScore: next }]
        this.state.user = { ...cur }
        const others = this.state.ladder.filter((r) => !(r.player === cur.name && r.scenarioId === match.scenarioId))
        const rows = [
          ...others,
          { rank: 0, player: cur.name, scenarioId: match.scenarioId, score: next, agentDisplay: `${cur.name}的${scenarioOf(match.scenarioId).name}` },
        ].toSorted((a, b) => b.score - a.score)
        this.state.ladder = rows.map((r, i) => ({ ...r, rank: i + 1 }))
        this.pushNotification(
          'automatch-result',
          '自动匹配结果',
          `计分对战${outcomeText}（${scenarioOf(match.scenarioId).name}）。天梯分 ${prev} → ${next}。`,
          `/matches/${match.id}`,
        )
      }
    } else {
      // ① 对局完成通知 → 深链战报
      this.pushNotification(
        'match-done',
        '对局完成',
        `你发起的${isHotseat ? '自打' : ''}对局已出结果：${outcomeText}（${scenarioOf(match.scenarioId).name}）。`,
        `/matches/${match.id}`,
      )
    }
  }

  pushNotification(kind: NotificationKind, title: string, body: string, link: string | null) {
    this.state.notifications = [
      { id: nextId('n'), kind, title, body, link, read: false, createdAt: now() },
      ...this.state.notifications,
    ]
  }

  markNotificationRead(id: string) {
    this.commit((s) => {
      s.notifications = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    })
  }

  markAllRead() {
    this.commit((s) => {
      s.notifications = s.notifications.map((n) => ({ ...n, read: true }))
    })
  }

  clearNotifications() {
    this.commit((s) => {
      s.notifications = []
    })
  }

  // ---------- 查询 ----------

  npcsFor(scenarioId: string): Npc[] {
    return NPCS.filter((n) => n.scenarioId === scenarioId).toSorted((a, b) => a.easeRank - b.easeRank)
  }

  /** #65：门槛按侧——每侧各赢 ≥N 场 PVE 才解锁 PVP */
  pvpUnlocked(scenarioId: string): boolean {
    const p = this.pvpProgress(scenarioId)
    return p.A.beaten >= p.A.needed && p.B.beaten >= p.B.needed
  }

  /** 每侧进度（#65）；beaten＝该侧赢过的不同 NPC 数 */
  pvpProgress(scenarioId: string): { A: { beaten: number; needed: number }; B: { beaten: number; needed: number } } {
    const p = this.state.user?.progress.find((x) => x.scenarioId === scenarioId)
    const needed = CONFIG.pvpUnlockPerSideWins
    return {
      A: { beaten: p?.npcsBeaten.A.length ?? 0, needed },
      B: { beaten: p?.npcsBeaten.B.length ?? 0, needed },
    }
  }

  /** #66：发起 PVP 约战的资格＝我方双侧各有 ≥1 个有版本的 agent */
  pvpLineupReady(scenarioId: string): { A: boolean; B: boolean; ready: boolean } {
    const by = this.myAgentsBySide(scenarioId)
    const A = by.A.some((a) => a.versions.length > 0)
    const B = by.B.some((a) => a.versions.length > 0)
    return { A, B, ready: A && B }
  }

  /** #66：对手（公开玩家）在某场景的双侧公开版本分组 */
  publicPlayersFor(scenarioId: string): { name: string; A: PublicVersionRef | null; B: PublicVersionRef | null }[] {
    const map = new Map<string, { name: string; A: PublicVersionRef | null; B: PublicVersionRef | null }>()
    for (const p of this.state.publicVersions) {
      if (p.scenarioId !== scenarioId) continue
      const g = map.get(p.playerName) ?? { name: p.playerName, A: null, B: null }
      g[p.side] = p
      map.set(p.playerName, g)
    }
    return [...map.values()]
  }
}

export const store = new MockStore()

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.getState)
}

export { CONFIG, NPCS, SCENARIOS }
