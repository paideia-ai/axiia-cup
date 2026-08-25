import type { Side } from '../api/types'

// One playable persona of a scenario. `key` is the vocabulary the script reads out
// of the side's options blob, and — for scripts that name their lanes after it —
// the speaker key of that persona's transcript rows.
export interface ScenarioRole {
  key: string
  name: string
  side: Side
  pitch: string
}

export interface ScenarioIntroFact {
  title: string
  text: string
}

export interface ScenarioIntroStep {
  step: string
  title: string
  text: string
}

export interface ScenarioIntroTimeline {
  title: string
  items: ScenarioIntroStep[]
}

export interface ScenarioIntroCollection {
  title: string
  intro?: string
  items: ScenarioIntroFact[]
}

export interface ScenarioIntroChoice {
  name: string
  text: string
}

export interface ScenarioIntroImage {
  src: string
  alt: string
}

export interface ScenarioHiddenGoalOption {
  id: string
  text: string
}

export interface ScenarioHiddenGoalGroup {
  role?: string
  options: ScenarioHiddenGoalOption[]
}

export interface ScenarioHiddenGoalList {
  note: string
  groups: ScenarioHiddenGoalGroup[]
}

export interface ScenarioRequestScoring {
  discoveryPenalty: number
}

export interface ScenarioIntroSide {
  eyebrow: string
  name: string
  subtitle?: string
  paragraphs: string[]
  choices?: ScenarioIntroChoice[]
  goalLabel: string
  goal: string
  actionLabel: string
}

export interface ScenarioIntroJudge {
  name: string
  label: string
  paragraphs: string[]
}

// `source` is a verbatim, structured transcription of the visible copy inside one
// scenario panel in docs/competition/scenario-intro.html. The detail page may move
// these fields between cards, but must not edit or omit them. Keep UI-only additions
// such as scoring labels outside `source` so the parity test can detect copy drift.
export interface ScenarioIntroCopy {
  htmlID: string
  source: {
    category?: string
    title: string
    overview: {
      label: string
      title: string
      paragraphs: string[]
      facts?: ScenarioIntroFact[]
      timeline?: ScenarioIntroTimeline
      actions?: ScenarioIntroCollection
    }
    participants: {
      title: string
      intro?: string
      judge: ScenarioIntroJudge
      supporting?: ScenarioIntroCollection
      sides: { a: ScenarioIntroSide; b: ScenarioIntroSide }
      note?: { title: string; text: string }
    }
  }
}

// DA 教育页四层内容（A4 基线 + #51：judgeOsPrompt 永不下发，这里只放可公开的
// 裁判摘要）。全部为展示文案；服务器对场景语义保持无知，真源后续迁往 meta（R7b）。
export interface ScenarioEducation {
  // 第 1 层 GLANCE：一句话钩子 + 元信息（难度 1–3、预计分钟数、是否适合新手）。
  hook: string
  difficulty: 1 | 2 | 3
  minutes: number
  noviceFriendly: boolean
  // Human-readable structure. `turnCount` is an engine count and is not always a
  // user-facing round count (for example, five jury rounds produce ten player turns).
  formatLabel: string
  // 第 2 层：双方是谁、各自的胜利条件。
  winConditions: { a: string; b: string }
  // #51 W2 EXPAND-1「开场白」（u04-c13 裁定 · 2026-08-25）：对局开始、双方发言
  // 之前，场景/裁判对双方同时说的统一首句。与运行时 OPENING_LINE 同源——值一律
  // 取自 runtime-quotes.json（`deno task web-quotes` 从 script.js 提取生成、
  // `deno task validate` 逐字核对）；没有统一开场首句的场景缺席，不许编造。
  openingLine?: string
  // 第 3 层：裁判是谁、怎么判 + 计分规则。
  judgeSummary: string
  // A4 基线「裁判 prompt + 摘要」（u04-c10 裁定）：对局中真实喂给裁判/NPC
  // 裁决者的扮演 system prompt 原文，只读展示，同源机制同 openingLine。
  // #51 只豁免 judgeOsPrompt——裁判内心独白的生成提示不在此列、维持不公开。
  judgePrompt?: string
  // 按局实填的场景（如本能寺按入场角色实填）用这行注解说明展示口径。
  judgePromptNote?: string
  // 裁判/裁决者模型默认值（#51 W2 DEEP「裁判/计分模型」），同源机制同上。
  judgeModel?: string
  scoring: string
  // 第 4 层 DEEP：背景故事全文 + 隐藏目标机制怎么玩。
  background: string
  hiddenGoalHowTo: string
}

// Scenario display knowledge, bundled with the SPA rather than fetched: the server
// is deliberately ignorant of what a scenario's options blob means, so the picker
// that writes one and the transcript that reads it are authored here.
export interface ScenarioModule {
  slotID: string
  roles: ScenarioRole[]
  intro?: ScenarioIntroCopy
  overviewFactImages?: Record<string, ScenarioIntroImage>
  // Public candidate lists for scenarios that randomly mark one request as the
  // player's true goal. The selected item stays private; these candidates do not.
  hiddenGoals?: Partial<Record<Side, ScenarioHiddenGoalList>>
  scoringInitiallyCollapsed?: boolean
  scoringLabel?: string
  requestScoring?: ScenarioRequestScoring
  hideHeaderMatchup?: boolean
  timelineAtEnd?: boolean
  // Lane keys the script speaks under, mapped to display names. Side keys ('a',
  // 'b') stay out on purpose: a finished match carries its own labels for them,
  // and in a role-cast match they name a side rather than a speaker.
  laneLabels: Record<string, string>
  // 裁判心声节拍 favor 词汇 → 侧别（#24 倾向轨迹图）：favor 通常就是某个
  // lane/角色的显示名，可自动解析；词汇不经由任何 lane 的场景（如电车的
  // 一人侧/五人侧）在此显式声明。
  favorSides?: Record<string, Side>
  // DA 四层教育内容；缺席的场景走通用空态轮廓（#54）。
  education?: ScenarioEducation
  // 只读系统角色模板展示文案（#68）：按侧给出，占位符用〔…〕样式实填示意。
  roleTemplates?: Partial<Record<Side, string>>
}
