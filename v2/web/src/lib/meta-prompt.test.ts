import { describe, expect, it } from 'vitest'

import type { ScenarioScoringDTO } from '../api/types'
import { honnojiDecision } from '../scenarios/honnoji-decision'
import { fengyitingReal } from '../scenarios/fengyiting-real'
import { shangyangCourt } from '../scenarios/shangyang-court'
import { metaPromptFor } from './meta-prompt'

const scoring: ScenarioScoringDTO = {
  summary: '逐项累计本场得分。',
  items: [
    { id: 'evidence', label: '证据闭环', points: 2.75 },
    { id: 'repetition', label: '重复论证', points: -1.125 },
    { id: 'unused', label: '未使用机会', points: 0 },
  ],
  notes: ['分数相同时比较证据完整性。', '每项仅计入一次。'],
}

describe('external-AI prompt public scoring', () => {
  it.each([
    { name: 'Shangyang scenario', module: shangyangCourt },
    { name: 'Honnoji scenario', module: honnojiDecision },
    { name: 'generic scenario', module: null },
  ])('carries exact current rules for a $name', ({ module }) => {
    const prompt = metaPromptFor(module, '公开计分场景', 'a', '甲方', scoring)
    expect(prompt).toContain([
      '计分规则：逐项累计本场得分。',
      '- 证据闭环：2.75 分',
      '- 重复论证：-1.125 分',
      '- 未使用机会：0 分',
      '分数相同时比较证据完整性。',
      '每项仅计入一次。',
    ].join('\n'))
    expect(prompt).not.toMatch(
      /计分规则整理中|undefined|NaN|\+0\.5|[−-]0\.25|[−-]0\.75|\+1(?![\d.])|[−-]1(?![\d.])/,
    )
    expect(prompt).toContain('「甲方」一方')
    if (module) {
      expect(prompt).toContain('场景一句话：')
      expect(prompt).toContain('角色模板如下（仅供参考）')
    }
  })

  it.each([undefined, null])('does not invent absent rules (%s)', (absent) => {
    const prompt = metaPromptFor(
      shangyangCourt,
      '商鞅庭辩',
      'a',
      '商鞅',
      absent,
    )
    expect(prompt).toContain('计分规则：计分规则整理中')
    expect(prompt).not.toMatch(
      /undefined|NaN|\+0\.5|[−-]0\.25|[−-]0\.75|\+1(?![\d.])|[−-]1(?![\d.])/,
    )
    expect(prompt).not.toContain('证据闭环')
  })

  it('retains non-additive outcome prose without API scoring', () => {
    const prompt = metaPromptFor(
      fengyitingReal,
      '凤仪亭',
      'a',
      '董卓',
      undefined,
    )
    expect(prompt).toContain('计分规则：貂蝉终局选择的角色获胜')
    expect(prompt).not.toContain('计分规则整理中')
  })

  it('handles public rules with no notes and keeps a zero-valued item', () => {
    const prompt = metaPromptFor(null, '公开计分场景', 'a', '甲方', {
      summary: '本场按公开条目计分。',
      items: [{ id: 'unused', label: '未使用机会', points: 0 }],
    })
    expect(prompt).toContain(
      '计分规则：本场按公开条目计分。\n- 未使用机会：0 分',
    )
    expect(prompt).not.toMatch(/undefined|NaN|证据完整性|2\.75/)
  })
})
