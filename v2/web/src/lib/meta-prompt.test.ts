import { describe, expect, it } from 'vitest'

import type { ScenarioScoringDTO } from '../api/types'
import { honnojiDecision } from '../scenarios/honnoji-decision'
import { fengyitingReal } from '../scenarios/fengyiting-real'
import { shangyangCourt } from '../scenarios/shangyang-court'
import { trolleyProblem } from '../scenarios/trolley-problem'
import { legalHarborMurderJury } from '../scenarios/legal-harbor-murder-jury'
import type { ScenarioModule } from '../scenarios/types'
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
      expect(prompt).toContain('角色模板')
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

describe('interactive strategy construction', () => {
  const roles: [ScenarioModule, 'a' | 'b', string | null, string][] = [
    [shangyangCourt, 'a', null, '# 商鞅 Prompt Builder'],
    [shangyangCourt, 'b', null, '# 甘龙 Prompt Builder'],
    [fengyitingReal, 'a', null, '## 董卓 Prompt Builder'],
    [fengyitingReal, 'b', null, '## 吕布 Prompt Builder'],
    [trolleyProblem, 'a', null, '# 奕仁Prompt Builder'],
    [trolleyProblem, 'b', null, '# 武仁Prompt Builder'],
    [
      honnojiDecision,
      'a',
      'chosokabe',
      'A.长宗我部元亲阵营辩论策略 Prompt Builder',
    ],
    [honnojiDecision, 'a', 'yoshiaki', 'D.足利义昭使者辩论策略 Prompt Builder'],
    [honnojiDecision, 'b', 'hosokawa', 'B.细川藤孝辩论策略 Prompt Builder'],
    [honnojiDecision, 'b', 'ashigaru', 'C.明智军足轻辩论策略 Prompt Builder'],
    [legalHarborMurderJury, 'a', null, '# 林 Prompt Builder'],
    [legalHarborMurderJury, 'b', null, '# 苏 Prompt Builder'],
  ]

  it.each(roles)(
    'renders the selected role %#',
    (module, side, role, heading) => {
      const prompt = metaPromptFor(
        module,
        '测试场景',
        side,
        '本方',
        scoring,
        role,
        750,
      )
      expect(prompt).toContain(heading)
      expect(prompt).toContain('等我确认后再生成')
      expect(prompt).toContain('750 个单位（汉字按字、英文按词计）')
      expect(prompt).not.toMatch(
        /\{\{|\{%|undefined|NaN|1000|标题、标点和换行均计入|只输出策略提示词正文/,
      )
      const roleHeadings = roles.filter(([otherModule]) =>
        otherModule === module
      ).map(([, , , title]) => title)
      for (const other of roleHeadings.filter((title) => title !== heading)) {
        expect(prompt).not.toContain(other)
      }
    },
  )

  it('includes Harbor evidence, all nine personas, procedures and final verdict criteria', () => {
    const prompt = metaPromptFor(
      legalHarborMurderJury,
      '码头疑云',
      'b',
      '苏',
      null,
    )
    for (
      const name of [
        '陈岚',
        '魏笙',
        '韩朔',
        '沈青',
        '杜临',
        '孟遥',
        '方稚',
        '蒋诚',
        '宁柏',
      ]
    ) {
      expect(prompt).toContain(name)
    }
    for (const evidence of ['E1', 'E2', 'E3', 'E4', 'E5']) {
      expect(prompt).toContain(`【${evidence}：`)
    }
    expect(prompt).toContain('第 11 席陪审员 苏')
    expect(prompt).toContain('最多四句话')
    expect(prompt).toContain('NOT_GUILTY：你认为控方没有达到该标准')
    expect(prompt).toContain('秘密意向投票')
  })

  it('prepares both possible Honnoji opponents without assigning a true request', () => {
    const prompt = metaPromptFor(
      honnojiDecision,
      '本能寺',
      'a',
      '袭击',
      null,
      'yoshiaki',
    )
    expect(prompt).toContain('「足利义昭的使者」一方')
    expect(prompt).toContain('【可能对阵：细川藤孝')
    expect(prompt).toContain('【可能对阵：明智军中的足轻')
    expect(prompt).toContain('请光秀保证义昭使者安全离营')
    expect(prompt).toContain('真假标记由系统在比赛时分配')
    expect(prompt).not.toContain('【可能对阵：长宗我部')
  })

  it.each([null, 'unknown', 'hosokawa'])(
    'does not substitute an incorrect persona (%s)',
    (role) => {
      const prompt = metaPromptFor(
        honnojiDecision,
        '本能寺',
        'a',
        '袭击',
        null,
        role,
      )
      expect(prompt).toContain('先请我确认本方角色')
      expect(prompt).not.toContain('B.细川藤孝辩论策略 Prompt Builder')
      expect(prompt).toContain('不要立即生成最终策略')
    },
  )

  it('does not invent a limit before config loads', () => {
    const prompt = metaPromptFor(
      shangyangCourt,
      '商鞅',
      'a',
      '商鞅',
      null,
      null,
      null,
    )
    expect(prompt).toContain('构建器显示的单位上限')
    expect(prompt).not.toContain('1000')
  })
})
