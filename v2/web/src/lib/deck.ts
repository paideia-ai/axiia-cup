// MCQ deck 拼装（#12/#15/E6，W1 schema）：deck 是纯内容（选项文案 + 拼装
// 规则），这里是消费它的纯函数——UI 与测试共用，不碰网络与存储。两种形态：
// ① fragment deck——每个选项带一段提示词片段，按「<sectionHeading>：\n
// <fragment>」逐题替换、题间以 joiner 连接；② combo deck（电车）——选项
// 组合整体映射到一份完整 prompt（comboPrompts 查表），片段不可分解。
// 产出永远是纯文本（A2：MCQ 产出统一为纯文本，保存后按 E5 固化）。

export interface DeckOption {
  id: string
  label: string
  // combo deck 的选项没有独立片段（内容评审注明不可分解）——缺席即是。
  fragment?: string | null
}

export interface DeckQuestion {
  id: string
  sectionHeading: string
  prompt: string
  // 当前全部单选；multi 预留给后续 deck 内容，拼装器按单选消费。
  multi?: boolean
  options: DeckOption[]
}

export interface DeckAssembly {
  // fragment deck 的逐题模板，占位符 <sectionHeading>/<fragment>；combo
  // deck 该字段是说明文字，拼装走 comboPrompts 查表。
  perQuestion: string
  joiner: string
}

export interface Deck {
  title: string
  role: string
  intro?: string
  assembly: DeckAssembly
  questions: DeckQuestion[]
  // combo deck：外层 key 为按题序连接的选项 id（如 'A-C-A-B'），值是这份
  // 完整 prompt 的分节正文（节标题 → 段落，与 questions 的 sectionHeading
  // 同序同名）——渲染成文与 fragment deck 同一形状。
  comboPrompts?: Record<string, Record<string, string>>
}

// 一个场景的整套 deck：key 是侧别（'a'/'b'）或角色 key（本能寺按入场角色
// 各一套）——与 scenarios 模块的 roles/side 词汇一致。
export interface ScenarioDeckSet {
  slotID: string
  decks: Record<string, Deck>
}

// 玩家的当前选择：questionID → optionID。仅存在于内存（本阶段不持久化；
// E5 的「选项随版本存档」等 P5 后端批次接入后由保存接口承接）。
export type DeckSelections = Record<string, string>

function pickedOption(
  question: DeckQuestion,
  selections: DeckSelections,
): DeckOption | null {
  const picked = selections[question.id]
  if (picked == null) return null
  return question.options.find((option) => option.id === picked) ?? null
}

// 是否每道题都选好了一个真实存在的选项。
export function deckComplete(
  deck: Deck,
  selections: DeckSelections,
): boolean {
  return deck.questions.every((question) =>
    pickedOption(question, selections) != null
  )
}

// combo deck 的查表 key：按题序连接选项 id；未选完 → null。
export function deckComboKey(
  deck: Deck,
  selections: DeckSelections,
): string | null {
  const ids: string[] = []
  for (const question of deck.questions) {
    const option = pickedOption(question, selections)
    if (option == null) return null
    ids.push(option.id)
  }
  return ids.join('-')
}

// 容错：deck 内容若把模板写成字面 \n（JSON 逐字迁移的常见残留），这里统一
// 归一成真实换行——已归一的内容原样通过。
function normalizeTemplate(template: string): string {
  return template.replaceAll('\\n', '\n')
}

// 逐节模板：combo deck 的 perQuestion 字段是说明文字而非模板，此时用与
// fragment deck 相同的规范形状渲染分节。
function sectionTemplate(deck: Deck): string {
  const raw = normalizeTemplate(deck.assembly.perQuestion)
  return raw.includes('<sectionHeading>') && raw.includes('<fragment>')
    ? raw
    : '<sectionHeading>：\n<fragment>'
}

// 替换一律走函数形式，防片段里的 $ 序列被当替换模式。
function renderSection(
  template: string,
  heading: string,
  body: string,
): string {
  return template
    .replaceAll('<sectionHeading>', () => heading)
    .replaceAll('<fragment>', () => body)
}

// 实时拼装：fragment deck 按已答的题渐进生成（题序固定、跳过未答）；combo
// deck 需选完全部题才能查表，未选完或组合缺失 → ''（调用方据此显示引导而
// 不是半份 prompt）。
export function assembleDeck(
  deck: Deck,
  selections: DeckSelections,
): string {
  const template = sectionTemplate(deck)
  const joiner = normalizeTemplate(deck.assembly.joiner)
  if (deck.comboPrompts != null) {
    const key = deckComboKey(deck, selections)
    const combo = key == null ? null : deck.comboPrompts[key]
    if (combo == null) return ''
    return Object.entries(combo)
      .map(([heading, body]) => renderSection(template, heading, body))
      .join(joiner)
  }
  const sections: string[] = []
  for (const question of deck.questions) {
    const option = pickedOption(question, selections)
    const fragment = option?.fragment
    if (fragment == null) continue
    sections.push(renderSection(template, question.sectionHeading, fragment))
  }
  return sections.join(joiner)
}

// E7/#83 的入口门（唯一判据）：工作区没有任何文本才提供初始化方式三选一；
// 出现任何文本（拼装填入或手打）即收起，迭代只剩文本工作台——文本→MCQ
// 无路可回（纯 MCQ 首稿也不例外），想重选走清空工作区或 E4 复制为新智能体。
export function initModesAvailable(workspaceText: string): boolean {
  return workspaceText.trim() === ''
}
