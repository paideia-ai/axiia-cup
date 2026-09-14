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
> = builders

export function metaPromptFor(
  module: ScenarioModule | null,
  scenarioTitle: string,
  side: Side,
  sideName: string,
  scoring: ScenarioScoringDTO | null | undefined,
  roleKey: string | null = null,
  promptUnitLimit: number | null = PROMPT_UNIT_LIMIT,
): string {
  const education = module?.education ?? null
  const selectedRole = module?.roles.find((role) =>
    role.key === roleKey && role.side === side
  )
  const roleName = selectedRole?.name ?? sideName
  const candidate = module
    ? assets[module.slotID]?.[roleKey ?? side]
    : undefined
  const asset = candidate?.side === side ? candidate : undefined
  const limit = promptUnitLimit == null
    ? '构建器显示的单位上限（汉字按字、英文按词计；粘贴后核查）'
    : `${promptUnitLimit} 个单位（汉字按字、英文按词计）`
  const lines: string[] = [
    `我们正在为「${scenarioTitle}」中的「${roleName}」一方准备策略。你是帮助玩家构建策略的对话伙伴。先与我讨论，等我确认后再生成交给比赛智能体的最终策略提示词。`,
    `最终策略使用中文，不超过${limit}。这个长度限制只用于最终策略，不用于本份 Prompt Builder 或整段对话。`,
    '参考材料中的角色扮演与发言限制供比赛智能体使用；你在准备阶段遵循下方 Prompt Builder 的互动规则，不要直接开始比赛或代替玩家决定策略。',
  ]
  if (education) {
    lines.push(
      '',
      `场景一句话：${education.hook}`,
      `我方胜利条件：${education.winConditions[side]}`,
    )
  }
  const rules = [
    `策略长度限制：${limit}。`,
    '比赛时系统会自动把最终策略与官方角色模板合并，无需重写模板内容。',
    '参考模板展示脚本默认流程；比赛时以系统实际提供的回合、对手、真假请求和消息为准。不要要求玩家提前提供运行时信息。',
    ...(education
      ? [`比赛流程：${education.formatLabel}`, education.hiddenGoalHowTo]
      : []),
    ...(scoring
      ? [
        `计分规则：${scoring.summary}`,
        ...scoring.items.map((item) => `- ${item.label}：${item.points} 分`),
        ...(scoring.notes ?? []),
      ]
      : [`计分规则：${education?.scoring ?? '计分规则整理中'}`]),
  ].join('\n')
  if (asset) {
    const references: Record<string, string> = {
      ...asset.references,
      other_rules: rules,
      player_visible_rules: [asset.references.player_visible_rules, rules]
        .filter(Boolean).join('\n\n'),
      strategy_prompt_limit: limit,
    }
    const rendered = asset.template.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (_, name: string) => {
        if (!(name in references)) {
          throw new Error(`Missing Prompt Builder reference: ${name}`)
        }
        return references[name]
      },
    )
    lines.push('', rendered)
  } else {
    // Future scenarios and an unselected/unknown persona still get a usable
    // conversation starter, never another role's authored builder.
    lines.push(
      '',
      '先问一个具体问题，了解我希望智能体怎样说服对方。每轮围绕一个选择，帮助我理解材料、检验想法；只记录我明确确认的偏好。不要立即生成最终策略。',
      '当我确认策略后，输出可粘贴到构建器的策略正文，不要把准备阶段的提问指令写入最终策略。',
      rules,
    )
    if (module?.roles.length && !selectedRole) {
      lines.push(
        '先请我确认本方角色，再讨论策略。可选角色：' +
          module.roles.filter((role) => role.side === side).map((role) =>
            role.name
          ).join('、'),
      )
    }
    if (module?.roleTemplates?.[side]) {
      lines.push('', module.roleTemplates[side]!)
    }
    if (education?.judgePrompt) lines.push('', education.judgePrompt)
  }
  return lines.join('\n')
}
