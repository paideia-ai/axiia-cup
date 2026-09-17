import type { ScenarioSummary, Side } from '../api/types'

// Copy for the inventory page only; scenario metadata also serves other pages.
const descriptions: Partial<Record<string, Record<Side, string[]>>> = {
  'legal-harbor-murder-jury': {
    a: ['串联案件证据，说服陪审团认定顾衡有罪。'],
    b: ['指出现有证据中的合理疑点，说服陪审团判顾衡无罪。'],
  },
  'honnoji-decision': {
    a: [
      '长宗我部元亲的密使：为保全四国，说服光秀趁今夜突袭本能寺。',
      '足利义昭的使者：以重振幕府为名，说服光秀起兵讨伐信长。',
    ],
    b: [
      '细川藤孝：以故交身份，向光秀讲明起兵的风险，劝他继续西进。',
      '明智军中的足轻：从士卒的处境出发，劝光秀放弃夜袭，依令西进。',
    ],
  },
}

export function myAgentsDescriptions(
  scenario: ScenarioSummary,
  side: Side,
): string[] {
  const copy = descriptions[scenario.id]?.[side]
  if (copy != null) return copy
  const label = side === 'a' ? scenario.sideALabel : scenario.sideBLabel
  return label ? [label] : []
}
