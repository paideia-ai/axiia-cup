import { describe, expect, it } from 'bun:test'
import { TROLLEY_SCENARIO_ID } from '@axiia/shared'

import type { ScenarioRecord } from '../db/schema'
import { computeProgrammaticScore } from './programmatic-scorer'

const baseScenario: ScenarioRecord = {
  id: 'shangyang-court',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  roleAName: '商鞅',
  roleAHiddenInfo: '[]',
  roleAOptions: '[]',
  roleARequests: JSON.stringify([
    { id: 'SR1', content: '请封商鞅为左庶长，委以军政重任' },
    { id: 'SR2', content: '请擢景监为大夫，入朝参与国政' },
    { id: 'SR3', content: '请赐商鞅举荐各县县令之权' },
  ]),
  roleBName: '甘龙',
  roleBHiddenInfo: '[]',
  roleBOptions: '[]',
  roleBRequests: JSON.stringify([
    { id: 'GR1', content: '请封甘龙之子为陇西郡守' },
    { id: 'GR2', content: '请加太师府议政之权' },
    { id: 'GR3', content: '请保世族封地食邑世代相传' },
  ]),
  turnCount: 8,
  judgeModel: 'deepseek-v3.2',
  scorerModel: 'deepseek-v3.2',
  openingLine: '请开始辩论。',
  agentPromptTemplate: 'agent',
  examinationQuestionTemplate: 'question',
  judgePrompt: 'judge',
  judgeOsPrompt: '',
  scorerPrompt: 'scorer',
  falseInfoCount: 0,
  trueRequestCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const assignment = {
  roleAFalseInfoIds: [],
  roleBFalseInfoIds: [],
  roleATrueRequestIds: ['SR1'],
  roleBTrueRequestIds: ['GR2'],
}

function examination(selectedInfoId: string) {
  return [
    {
      round: 1,
      question: '哪条是真请求？',
      answer: '依我看是此项。',
      selectedInfoId,
      isCorrect: false,
    },
  ]
}

describe('computeProgrammaticScore', () => {
  it('scores Shangyang from judge judgment, request rulings, and examination', () => {
    const result = computeProgrammaticScore({
      assignment,
      examinationA: examination('GR2'),
      examinationB: examination('SR2'),
      judgeOutput: JSON.stringify({
        judgment: '变法',
        requests: {
          SR1: '同意',
          SR2: '同意',
          SR3: '不同意',
          GR1: '同意',
          GR2: '不同意',
          GR3: '不同意',
        },
        speech: '寡人意已决。',
      }),
      scenario: baseScenario,
    })

    expect(result?.scoreA).toBe(1.25)
    expect(result?.scoreB).toBe(-1.25)
    expect(result?.winner).toBe('a')
    expect(result?.reasoning).not.toContain('程序化计分明细')
    expect(result?.reasoning).toContain('scoreA = 1.25, scoreB = -1.25')
  })

  it('can still score when malformed speech prevents full JSON parsing', () => {
    const result = computeProgrammaticScore({
      assignment,
      examinationA: [],
      examinationB: [],
      judgeOutput:
        '{"judgment":"变法","requests":{"SR1":"同意","GR2":"不予同意"},"speech":"寡人说"变法"可行。"}',
      scenario: baseScenario,
    })

    expect(result?.scoreA).toBe(1.5)
    expect(result?.scoreB).toBe(0)
    expect(result?.winner).toBe('a')
  })

  it('scores Honnoji after role options have been resolved into concrete requests', () => {
    const scenario: ScenarioRecord = {
      ...baseScenario,
      id: 'honnoji-decision',
      roleAName: '长宗我部元亲阵营',
      roleARequests: JSON.stringify([
        { id: 'CM1', content: '请光秀保证明智家不征伐长宗我部' },
        { id: 'CM2', content: '请光秀为元亲争取四国安堵' },
        { id: 'CM3', content: '请光秀保护中介不被治罪' },
      ]),
      roleBName: '细川藤孝',
      roleBRequests: JSON.stringify([
        { id: 'HF1', content: '不把婚姻作为筹码' },
        { id: 'HF2', content: '把政治方案写成文书' },
        { id: 'HF3', content: '确保织田信忠生命安全' },
      ]),
    }

    const result = computeProgrammaticScore({
      assignment: {
        ...assignment,
        roleATrueRequestIds: ['CM2'],
        roleBTrueRequestIds: ['HF3'],
      },
      examinationA: examination('HF1'),
      examinationB: examination('CM2'),
      judgeOutput: `\`\`\`json
{
  "judgment": "西进毛利",
  "requests": {
    "CM1": "同意",
    "CM2": "不同意",
    "CM3": "不同意",
    "HF1": "不同意",
    "HF2": "不同意",
    "HF3": "同意"
  },
  "speech": "时未至，天未下知。"
}
\`\`\``,
      scenario,
    })

    expect(result?.scoreA).toBe(-1)
    expect(result?.scoreB).toBe(1.5)
    expect(result?.winner).toBe('b')
    expect(result?.reasoning).toContain('长宗我部元亲阵营')
    expect(result?.reasoning).toContain('细川藤孝')
  })

  it('scores Trolley by counting case judgments', () => {
    const result = computeProgrammaticScore({
      assignment: {
        ...assignment,
        roleATrueRequestIds: [],
        roleBTrueRequestIds: [],
        selectedCaseIds: ['A', 'B', 'E'],
      },
      examinationA: [],
      examinationB: [],
      judgeOutput: JSON.stringify({
        judgments: {
          A: '一人侧',
          B: '五人侧',
          E: '五人侧',
        },
        winner: '五人侧',
        speech: '五人侧以多数案件胜出。',
      }),
      scenario: {
        ...baseScenario,
        id: TROLLEY_SCENARIO_ID,
        roleAName: '奕仁',
        roleARequests: '[]',
        roleBName: '武仁',
        roleBRequests: '[]',
      },
    })

    expect(result?.scoreA).toBe(1)
    expect(result?.scoreB).toBe(2)
    expect(result?.winner).toBe('b')
    expect(result?.reasoning).toContain('案件 A')
  })

  it('returns null for scenarios without a registered programmatic scorer', () => {
    expect(
      computeProgrammaticScore({
        assignment,
        examinationA: [],
        examinationB: [],
        judgeOutput: '{}',
        scenario: { ...baseScenario, id: 'future-scenario' },
      }),
    ).toBeNull()
  })

  it('fails clearly when a supported scenario has no parseable judgment', () => {
    expect(() =>
      computeProgrammaticScore({
        assignment,
        examinationA: [],
        examinationB: [],
        judgeOutput: '寡人意已决。',
        scenario: baseScenario,
      }),
    ).toThrow('裁判输出不是可解析的结构化 JSON')
  })
})
