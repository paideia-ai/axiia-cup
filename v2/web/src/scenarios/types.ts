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

// DA 教育页四层内容（A4 基线 + #51：judgeOsPrompt 永不下发，这里只放可公开的
// 裁判摘要）。全部为展示文案；服务器对场景语义保持无知，真源后续迁往 meta（R7b）。
export interface ScenarioEducation {
  // 第 1 层 GLANCE：一句话钩子 + 元信息（难度 1–3、预计分钟数、是否适合新手）。
  hook: string
  difficulty: 1 | 2 | 3
  minutes: number
  noviceFriendly: boolean
  // 第 2 层：双方是谁、各自的胜利条件。
  winConditions: { a: string; b: string }
  // 第 3 层：裁判是谁、怎么判 + 计分规则。
  judgeSummary: string
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
