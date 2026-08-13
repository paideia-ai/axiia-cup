// 元提示词模式（A2 初始化方式③ / E8）：给玩家一段拿去外部 AI 用的元提示
// 词——由场景模块的教育内容与只读角色模板就地拼成，纯前端、零调用（产品
// 内不提供聊天）。#84 无说明书：文案本身就是全部说明。

import type { Side } from '../api/types'
import type { ScenarioModule } from '../scenarios/types'
import { PROMPT_UNIT_LIMIT } from './prompt-length'

export function metaPromptFor(
  module: ScenarioModule | null,
  scenarioTitle: string,
  side: Side,
  sideName: string,
): string {
  const education = module?.education ?? null
  const roleTemplate = module?.roleTemplates?.[side] ?? null
  const lines: string[] = [
    `请为「${scenarioTitle}」中的「${sideName}」一方，写一段对战策略提示词（中文，不超过 ${PROMPT_UNIT_LIMIT} 个单位：汉字按字、英文按词计）。只输出策略提示词正文，不要任何解释或标题。`,
  ]
  if (education) {
    lines.push(
      '',
      `场景一句话：${education.hook}`,
      `我方胜利条件：${education.winConditions[side]}`,
      `计分规则：${education.scoring}`,
    )
  }
  if (roleTemplate) {
    lines.push(
      '',
      '比赛时系统会自动把这段策略提示词与官方角色模板合并，无需重写模板内容。角色模板如下（仅供参考）：',
      '',
      roleTemplate,
    )
  }
  return lines.join('\n')
}
