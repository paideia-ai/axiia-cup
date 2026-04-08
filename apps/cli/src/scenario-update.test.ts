import { describe, expect, test } from 'bun:test'
import type { AdminScenario, UpdateScenario } from '@axiia/shared'

import { parseScenarioUpdateInput, toEditableScenario } from './scenario-update'

function buildUpdateScenario(): UpdateScenario {
  return {
    turnCount: 10,
    judgeModel: 'deepseek-v3.2',
    openingLine: '秦孝公命两人陈词。',
    agentPromptTemplate: 'agent prompt',
    examinationQuestionTemplate: '',
    judgePrompt: 'judge prompt',
    scorerPrompt: 'scorer prompt',
    roleAName: '商鞅',
    roleAHiddenInfo: [{ id: 'S1', content: '角色 A 隐藏信息' }],
    roleARequests: [{ id: 'SR1', content: '角色 A 请求' }],
    roleBName: '甘龙',
    roleBHiddenInfo: [{ id: 'G1', content: '角色 B 隐藏信息' }],
    roleBRequests: [{ id: 'GR1', content: '角色 B 请求' }],
    falseInfoCount: 1,
    trueRequestCount: 1,
  }
}

function buildAdminScenario(): AdminScenario {
  return {
    id: 'shangyang-court',
    title: '商鞅变法·朝堂辩法',
    subject: '历史',
    locked: false,
    ...buildUpdateScenario(),
  }
}

describe('scenario update helpers', () => {
  test('extracts editable payload from admin scenario', () => {
    const adminScenario = buildAdminScenario()

    expect(toEditableScenario(adminScenario)).toEqual(buildUpdateScenario())
  })

  test('accepts a full admin scenario payload', () => {
    const parsed = parseScenarioUpdateInput(buildAdminScenario())

    expect(parsed).toEqual(buildUpdateScenario())
  })

  test('accepts an editable-only payload', () => {
    const parsed = parseScenarioUpdateInput(buildUpdateScenario())

    expect(parsed).toEqual(buildUpdateScenario())
  })

  test('rejects invalid payloads', () => {
    expect(() =>
      parseScenarioUpdateInput({
        ...buildAdminScenario(),
        trueRequestCount: 2,
      }),
    ).toThrow(/trueRequestCount/)
  })
})
