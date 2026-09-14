import type { ScenarioScoringDTO, Side } from '../api/types'
import type { ScenarioModule } from '../scenarios/types'
import builders from '../scenarios/prompt-builders.json'
import { PROMPT_UNIT_LIMIT } from './prompt-length'

const assets: Record<
  string,
  Record<string, {
    side: string
    template: string
    references: Record<string, string>
  }>
> = builders.roles

function render(template: string, references: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    if (!Object.hasOwn(references, name)) {
      throw new Error(`Missing Prompt Builder reference: ${name}`)
    }
    return references[name]
  })
}

export function metaPromptFor(
  module: ScenarioModule | null,
  scenarioTitle: string,
  side: Side,
  sideName: string,
  scoring: ScenarioScoringDTO | null | undefined,
  roleKey: string | null = null,
  promptUnitLimit: number | null = PROMPT_UNIT_LIMIT,
): string {
  const education = module?.education
  const selectedRole = module?.roles.find((role) =>
    role.key === roleKey && role.side === side
  )
  const candidate = module
    ? assets[module.slotID]?.[roleKey ?? side]
    : undefined
  const asset = candidate?.side === side ? candidate : undefined
  const limit = promptUnitLimit == null
    ? '构建器显示的单位上限（汉字按字、英文按词计；粘贴后核查）'
    : `${promptUnitLimit} 个单位（汉字按字、英文按词计）`
  // Format the API's public scoring data, preserving all values and notes.
  const scoringRules = scoring
    ? [
      `计分规则：${scoring.summary}`,
      ...scoring.items.map((item) => `- ${item.label}：${item.points} 分`),
      ...(scoring.notes ?? []),
    ].join('\n')
    : `计分规则：${education?.scoring ?? '计分规则整理中'}`
  const references: Record<string, string> = {
    agent_prompt_template: module?.roleTemplates?.[side] ??
      '角色模板尚未提供。',
    judge_prompt: education?.judgePrompt ?? education?.judgeSummary ??
      '裁判资料尚未提供。',
    ...asset?.references,
    scenario_title: scenarioTitle,
    role_name: selectedRole?.name ?? sideName,
    scenario_hook: education?.hook ?? '',
    win_condition: education?.winConditions[side] ?? '',
    strategy_prompt_limit: limit,
    format_label: education?.formatLabel ?? '比赛流程尚未提供。',
    hidden_goal_rules: education?.hiddenGoalHowTo ?? '',
    scoring_rules: scoringRules,
    available_roles:
      module?.roles.filter((role) => role.side === side).map((role) =>
        role.name
      ).join('、') ?? '',
  }
  references.other_rules = render(builders.otherRules, references)
  references.player_visible_rules = [
    asset?.references.player_visible_rules,
    references.other_rules,
  ]
    .filter(Boolean).join('\n\n')
  references.role_selection = module?.roles.length && !selectedRole
    ? render(builders.roleSelection, references)
    : ''
  // All conversation instructions and surrounding copy live in product templates.
  return render(asset?.template ?? builders.fallback, references)
}
