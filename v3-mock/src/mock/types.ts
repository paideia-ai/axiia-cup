// v3.4 规格核心概念的类型定义（mock 层）。
// 引用形如 (#13) 的编号对应 UI-Doc-v3.4.md §−2 变更清单；#55–#64 为 per-side 反转。

export type Side = 'A' | 'B'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

/** MCQ deck（schema 属系统 W1，内容属场景 §C1）。纯文本选择题拼装提示词。 */
export interface McqQuestion {
  id: string
  side: Side
  title: string
  multi: boolean
  options: { id: string; label: string; fragment: string }[]
}

export interface ScenarioSideCard {
  name: string
  publicRequirements: string
  hiddenInfoSummary: string
  actionFocus: string
  /** W2 EXPAND-1 新增：可选立场/请求项 */
  optionalStances: string[]
  /** W2 EXPAND-1 新增：开场白 */
  openingStatement: string
}

/** 计分规则从场景数据读取（#42），精确权重全公开（#26）。 */
export interface ScoringDimension {
  key: string
  label: string
  weight: number
  kind: 'structured' | 'llm'
  description: string
}

export interface Scenario {
  id: string
  subject: string
  name: string
  oneLiner: string
  difficulty: Difficulty
  /** 「适合新手」独立可配置标注（#40） */
  beginnerFriendly: boolean
  estimatedMinutes: number
  isNew: boolean
  createdAt: string
  background: string
  sideA: ScenarioSideCard
  sideB: ScenarioSideCard
  victoryConditions: { A: string; B: string }
  boundaries: string[]
  dialogueTurns: number
  /** W2 EXPAND-2 新增：阶段结构（如有） */
  phases: string[] | null
  /** W2 EXPAND-2 新增：隐藏信息真假配置概况 */
  hiddenInfoTruthConfig: string
  /** W2 EXPAND-2 新增：赛后问询方式 */
  postGameInquiry: string
  judgePersona: string
  judgePromptSummary: string
  judgePrompt: string
  /** W2 DEEP 新增：裁判/计分模型 */
  judgeModel: string
  scoringModel: string
  scoring: ScoringDimension[]
  hiddenGoalsHowTo: string
  mcqDeck: McqQuestion[]
}

/** PVE-NPC（#48）：每场景 2 个（可配置 #28）；战绩＝该场景两侧 agent 的胜率（#34）。 */
export interface Npc {
  id: string
  scenarioId: string
  name: string
  tagline: string
  /** 「最容易」排序，1 = 最容易（首战对手 #10） */
  easeRank: number
  /** 两侧胜率（该 NPC 以 A/B 出战时的胜率，#34 语义） */
  sideWinRate: { A: number; B: number }
}

export type BuildMode = 'mcq' | 'basic' | 'meta'

/** 版本快照＝单侧提示词 + 所选模型（#55/#13）；模式逐版本、每版单侧（#57）。 */
export interface AgentVersion {
  id: string
  num: number
  /** 单侧提示词——agent 属于一侧，版本天然只有一段（#55） */
  prompt: string
  model: string
  mode: BuildMode
  note: string
  createdAt: string
  /** 逐版本胜负——agent 即一侧，战绩天然单侧（#55/#63） */
  record: { wins: number; losses: number }
}

export interface Agent {
  id: string
  ownerId: string
  /** 所有者昵称（真实系统由后端下发） */
  ownerName: string
  scenarioId: string
  /** agent 属于场景的一侧（#55）；执方由 agent 隐含（#62） */
  side: Side
  /** 玩家给这套策略起的名字；EA 展示名＝侧角色名 + 场景（#63） */
  name: string
  versions: AgentVersion[]
  /** 参赛版本显式标记（#33）；参赛需两侧各标一个（#58），本字段是「该侧的参赛版本」 */
  tournamentVersionId: string | null
  createdAt: string
}

export type MatchKind = 'pve' | 'pvp-friendly' | 'pvp-ranked' | 'tournament' | 'hotseat'
export type MatchStatus = 'queued' | 'running' | 'done'

export interface MatchParticipant {
  kind: 'player' | 'npc'
  /** player: agentId / npc: npcId */
  refId: string
  versionId: string | null
  ownerId: string | null
  displayName: string
  model: string
}

export interface DialogueTurn {
  turn: number
  side: Side
  speaker: string
  text: string
}

/** 裁判 OS ①生成层：独立 prompt 生成 + 结构化倾向数据（#22/#24，schema → W7） */
export interface JudgeOsEntry {
  afterTurn: number
  text: string
  tendency: {
    favor: Side | 'even'
    strength: number // 0-1
    changed: boolean
    attention: string
  }
}

export interface JudgeQaEntry {
  side: Side
  question: string
  answer: string
}

export interface ScoreBreakdown {
  key: string
  label: string
  weight: number
  kind: 'structured' | 'llm'
  scoreA: number
  scoreB: number
  reasoning: string
}

export interface MatchResult {
  winner: Side | 'draw'
  totalScore: { A: number; B: number }
  /** 结果与裁判理由（散文）分列（A7） */
  judgeProse: string
  /** 计分推导（#26）——如实反映包括 LLM 软判断的每一步 */
  breakdown: ScoreBreakdown[]
  hiddenGoalReveal: string
}

export interface Match {
  id: string
  kind: MatchKind
  scenarioId: string
  status: MatchStatus
  createdAt: string
  /** 发起人（每日上限只计发起人 #52） */
  initiatorId: string | null
  isFirstBattle: boolean
  participants: { A: MatchParticipant; B: MatchParticipant }
  /** 进行中：已生成的对话轮 */
  transcript: DialogueTurn[]
  /** 完成后固定的完整对话总轮数 */
  totalTurns: number
  judgeOs: JudgeOsEntry[]
  /** 裁判 OS ②trace 层：真实 thinking trace，debug mode 公开（#22 修订） */
  judgeTrace: string | null
  /** 己方 OS：真实 thinking trace，仅所有者 + debug mode（#20/#22） */
  selfTrace: { A: string | null; B: string | null }
  judgeQa: JudgeQaEntry[]
  result: MatchResult | null
}

export type NotificationKind =
  | 'match-done' // ① 对局完成
  | 'challenged' // ② 被挑战（不可拒绝 #29）
  | 'automatch-result' // ③ 自动匹配结果 / 天梯变动
  | 'tournament-round' // ④ 锦标赛：新一轮 / 你的对局完成 / 最终排名
  | 'tournament-invite' // ⑤ 锦标赛资格（直邀/跳过海选 #32）
  | 'gate-unlocked' // ⑥ PVE 门槛达成
  | 'entry-version-reminder' // ⑦ 参赛版本提醒
  | 'announcement' // ⑧ 系统公告

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface PlayerScenarioProgress {
  scenarioId: string
  /** 「玩家赢过某 NPC」事实记录（A6 门槛判定依据） */
  npcsBeaten: string[]
  ladderScore: number | null
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  /** 首战快速通道状态：注册后 true，首战完成后 false（#12） */
  expressPending: boolean
  firstBattleDone: boolean
  /** 今日已发起的对战数（#45/#52）；battlesDate 变更日自动清零 */
  battlesToday: number
  /** 今日已发起的 PVP 对战数（#46 每日限次） */
  pvpBattlesToday: number
  /** battlesToday 对应的日期（YYYY-MM-DD），跨日重置 */
  battlesDate: string
  progress: PlayerScenarioProgress[]
}

export interface TournamentRoundMatchRef {
  matchId: string
  playerA: string
  playerB: string
  winner: string | null
}

export interface Tournament {
  id: string
  name: string
  scenarioId: string
  status: 'upcoming' | 'running' | 'finished'
  rounds: { name: string; matches: TournamentRoundMatchRef[] }[]
}

export interface LadderRow {
  rank: number
  player: string
  scenarioId: string
  score: number
  agentDisplay: string
}
