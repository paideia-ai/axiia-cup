// 全局 mock store：单例 + useSyncExternalStore。
// 所有「后端行为」（派发、对局推进、判决、通知）都在这里模拟；
// 每一处真实系统需要后端支持的地方见 docs/BACKEND_REQUIREMENTS.md。

import { useSyncExternalStore } from 'react'

import { CONFIG } from './config'
import { NPCS, SCENARIOS } from './data'
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
  playerName: string
  agentName: string
  scenarioId: string
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

const STORAGE_KEY = 'axiia-v3-mock-state-v1'

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
    participants: {
      A: { kind: 'player', refId: 'ext', versionId: `${id}-va`, ownerId: 'ext-a', displayName: aName, model: 'kimi-k2.5' },
      B: { kind: 'player', refId: 'ext', versionId: `${id}-vb`, ownerId: 'ext-b', displayName: bName, model: 'deepseek-v3.2' },
    },
    transcript: [],
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
  return match
}

function seedState(): AppState {
  const veteranAgentVersion1: AgentVersion = {
    id: 'ver-zy-1',
    num: 1,
    promptA: '你是商鞅。以强国实效为最高论据……（v1 初版策略）',
    promptB: '你是甘龙。以稳定压倒一切为核心防线……（v1 初版策略）',
    model: 'kimi-k2.5',
    mode: 'mcq',
    note: '首战版本',
    createdAt: '2026-07-20T08:00:00Z',
    record: { A: { wins: 1, losses: 1 }, B: { wins: 0, losses: 1 } },
  }
  const veteranAgentVersion2: AgentVersion = {
    id: 'ver-zy-2',
    num: 2,
    promptA: '你是商鞅。以强国实效为最高论据，遇祖制之辩即转向质问对方强国之策；魏国情报压轴使用……',
    promptB: '你是甘龙。以三朝老臣姿态构筑稳定防线，攻击对方客卿身份；情报谨慎存疑……',
    model: 'deepseek-v3.2',
    mode: 'basic',
    note: '强化了情报使用时机',
    createdAt: '2026-07-26T10:00:00Z',
    record: { A: { wins: 2, losses: 0 }, B: { wins: 1, losses: 1 } },
  }
  const veteranAgent: Agent = {
    id: 'agent-zy',
    ownerId: 'me',
    scenarioId: 'shangyang',
    name: '琢玉的策论',
    versions: [veteranAgentVersion1, veteranAgentVersion2],
    tournamentVersionId: 'ver-zy-2',
    createdAt: '2026-07-20T08:00:00Z',
  }
  const demoA = seedDemoMatch('demo-1', 'shangyang', '墨白·变法七策 v4', '疏影·老甘龙 v2')
  const demoB = seedDemoMatch('demo-2', 'fengyi', '青梧·连环记 v3', '止水·毒士 v5')
  const historyDone: Match = seedDemoMatch('m-hist-1', 'shangyang', '琢玉的策论 v2', '老成持重·甘龙')
  historyDone.kind = 'pve'
  historyDone.initiatorId = 'me'
  historyDone.participants.A = { kind: 'player', refId: 'agent-zy', versionId: 'ver-zy-2', ownerId: 'me', displayName: '琢玉的策论 v2', model: 'deepseek-v3.2' }
  historyDone.participants.B = { kind: 'npc', refId: 'npc-shangyang-baoshou', versionId: null, ownerId: null, displayName: '老成持重·甘龙', model: 'kimi-k2.5' }

  return {
    user: {
      id: 'me',
      name: '琢玉',
      email: 'zhuoyu@example.com',
      expressPending: false,
      firstBattleDone: true,
      battlesToday: 2,
      progress: [
        { scenarioId: 'shangyang', npcsBeaten: ['npc-shangyang-baoshou', 'npc-shangyang-jinji'], ladderScore: null },
        { scenarioId: 'cough', npcsBeaten: ['npc-cough-easy'], ladderScore: null },
      ],
    },
    agents: [veteranAgent],
    matches: [demoA, demoB, historyDone],
    notifications: [
      {
        id: 'n-1',
        kind: 'challenged',
        title: '友谊赛来袭',
        body: '墨白 用「变法七策 v4」向你的「琢玉的策论」发起了友谊赛（无需同意，结果出来会通知你）。',
        link: null,
        read: false,
        createdAt: '2026-08-04T02:10:00Z',
      },
      {
        id: 'n-2',
        kind: 'gate-unlocked',
        title: 'PVP 已解锁：商鞅变法',
        body: '你已赢过 2 个不同 NPC，达成门槛，「商鞅变法」的 PVP 对战已解锁。',
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
      { versionId: 'ver-mo-4', playerName: '墨白', agentName: '墨白的商鞅变法', scenarioId: 'shangyang', model: 'kimi-k2.5' },
      { versionId: 'ver-zs-5', playerName: '止水', agentName: '止水的凤仪亭之夜', scenarioId: 'fengyi', model: 'glm-5' },
      { versionId: 'ver-sy-2', playerName: '疏影', agentName: '疏影的商鞅变法', scenarioId: 'shangyang', model: 'qwen3-max' },
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

  createAgent(scenarioId: string, name: string): Agent {
    const agent: Agent = {
      id: nextId('agent'),
      ownerId: this.state.user?.id ?? 'me',
      scenarioId,
      name,
      versions: [],
      tournamentVersionId: null,
      createdAt: now(),
    }
    this.commit((s) => {
      s.agents = [...s.agents, agent]
    })
    return agent
  }

  /** 保存＝存版本，不派发（#17）。返回新版本。 */
  saveVersion(
    agentId: string,
    input: { promptA: string; promptB: string; model: string; mode: BuildMode; note?: string },
  ): AgentVersion {
    const version: AgentVersion = {
      id: nextId('ver'),
      num: 0,
      promptA: input.promptA,
      promptB: input.promptB,
      model: input.model,
      mode: input.mode,
      note: input.note ?? '',
      createdAt: now(),
      record: { A: { wins: 0, losses: 0 }, B: { wins: 0, losses: 0 } },
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

  /** 每日上限检查（#45/#52：只计发起人；触顶＝可点→提示→拒绝入队） */
  dailyLimitReached(): boolean {
    return (this.state.user?.battlesToday ?? 0) >= CONFIG.dailyBattleLimit
  }

  dispatch(opts: {
    kind: MatchKind
    scenarioId: string
    agentId: string
    versionId: string
    mySide: Side
    opponent: { npcId?: string; publicVersionId?: string }
    firstBattle?: boolean
  }): { ok: true; match: Match } | { ok: false; reason: 'daily-limit' | 'trials-blocked' | 'bad-opponent' } {
    if (this.state.trialsBlocked) return { ok: false, reason: 'trials-blocked' }
    if (this.dailyLimitReached()) return { ok: false, reason: 'daily-limit' }
    const agent = this.state.agents.find((a) => a.id === opts.agentId)
    const version = agent?.versions.find((v) => v.id === opts.versionId)
    if (!agent || !version) return { ok: false, reason: 'bad-opponent' }
    const sc = scenarioOf(opts.scenarioId)

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
    } else if (opts.opponent.publicVersionId) {
      const ref = this.state.publicVersions.find((p) => p.versionId === opts.opponent.publicVersionId)
      if (!ref) return { ok: false, reason: 'bad-opponent' }
      theirs = { kind: 'player', refId: ref.versionId, versionId: ref.versionId, ownerId: `ext-${ref.playerName}`, displayName: `${ref.agentName}（${ref.playerName}）`, model: ref.model }
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
      participants: opts.mySide === 'A' ? { A: mine, B: theirs } : { A: theirs, B: mine },
      transcript: [],
      totalTurns: opts.firstBattle ? CONFIG.expressTurns : Math.min(sc.dialogueTurns, 10),
      judgeOs: [],
      judgeTrace: null,
      selfTrace: { A: null, B: null },
      judgeQa: [],
      result: null,
    }
    this.commit((s) => {
      s.matches = [match, ...s.matches]
      if (s.user) s.user = { ...s.user, battlesToday: s.user.battlesToday + 1 }
    })
    this.schedule.set(match.id, Date.now() + (opts.firstBattle ? 1200 : 2500))
    this.ensureTimer()
    return { ok: true, match }
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
        this.schedule.delete(id)
        this.onMatchDone(match)
      }
    }
    if (dirty) this.commit(() => {})
  }

  private onMatchDone(match: Match) {
    const user = this.state.user
    if (!user || match.initiatorId !== user.id) return
    const mySide: Side | null = match.participants.A.ownerId === user.id ? 'A' : match.participants.B.ownerId === user.id ? 'B' : null
    if (!mySide) return
    const won = match.result?.winner === mySide
    // 逐版本按侧战绩（#35）
    const myP = match.participants[mySide]
    this.state.agents = this.state.agents.map((a) =>
      a.id !== myP.refId ? a : {
        ...a,
        versions: a.versions.map((v) => {
          if (v.id !== myP.versionId) return v
          const rec = { ...v.record, [mySide]: { wins: v.record[mySide].wins + (won ? 1 : 0), losses: v.record[mySide].losses + (won ? 0 : 1) } }
          return { ...v, record: rec }
        }),
      },
    )
    // 「玩家赢过某 NPC」事实（A6）+ 门槛通知
    const oppSide: Side = mySide === 'A' ? 'B' : 'A'
    const opp = match.participants[oppSide]
    if (won && opp.kind === 'npc') {
      let progress: PlayerScenarioProgress | undefined = user.progress.find((p) => p.scenarioId === match.scenarioId)
      const before = progress?.npcsBeaten.length ?? 0
      if (!progress) {
        progress = { scenarioId: match.scenarioId, npcsBeaten: [], ladderScore: null }
        user.progress = [...user.progress, progress]
      }
      if (!progress.npcsBeaten.includes(opp.refId)) {
        progress.npcsBeaten = [...progress.npcsBeaten, opp.refId]
      }
      if (before < CONFIG.pvpUnlockDistinctNpcs && progress.npcsBeaten.length >= CONFIG.pvpUnlockDistinctNpcs) {
        this.pushNotification('gate-unlocked', 'PVP 已解锁', `你已赢过 ${CONFIG.pvpUnlockDistinctNpcs} 个不同 NPC，「${scenarioOf(match.scenarioId).name}」的 PVP 对战已解锁。`, `/scenarios/${match.scenarioId}`)
      }
      this.state.user = { ...user }
    }
    if (match.isFirstBattle && this.state.user) {
      this.state.user = { ...this.state.user, firstBattleDone: true, expressPending: false }
    }
    // ① 对局完成通知 → 深链战报
    this.pushNotification('match-done', '对局完成', `你发起的对局已出结果：${match.result?.winner === 'draw' ? '平局' : won ? '你赢了' : '你输了'}（${scenarioOf(match.scenarioId).name}）。`, `/matches/${match.id}`)
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

  pvpUnlocked(scenarioId: string): boolean {
    const p = this.state.user?.progress.find((x) => x.scenarioId === scenarioId)
    return (p?.npcsBeaten.length ?? 0) >= CONFIG.pvpUnlockDistinctNpcs
  }

  pvpProgress(scenarioId: string): { beaten: number; needed: number } {
    const p = this.state.user?.progress.find((x) => x.scenarioId === scenarioId)
    return { beaten: p?.npcsBeaten.length ?? 0, needed: CONFIG.pvpUnlockDistinctNpcs }
  }
}

export const store = new MockStore()

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.getState)
}

export { CONFIG, NPCS, SCENARIOS }
