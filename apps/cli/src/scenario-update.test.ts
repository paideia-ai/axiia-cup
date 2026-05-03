import { describe, expect, test } from 'bun:test'
import type { AdminScenario, UpdateScenario } from '@axiia/shared'

import { parseScenarioUpdateInput, toEditableScenario } from './scenario-update'

function buildUpdateScenario(): UpdateScenario {
  return {
    turnCount: 10,
    judgeModel: 'deepseek-v3.2',
    scorerModel: 'gpt-4.1',
    openingLine: 'The ruler asks both speakers to present their arguments.',
    agentPromptTemplate: 'agent prompt',
    examinationQuestionTemplate: '',
    judgePrompt: 'judge prompt',
    scorerPrompt: 'scorer prompt',
    roleAName: 'Role A',
    roleAHiddenInfo: [{ id: 'S1', content: 'Role A hidden info' }],
    roleAOptions: [],
    roleARequests: [{ id: 'SR1', content: 'Role A request' }],
    roleBName: 'Role B',
    roleBHiddenInfo: [{ id: 'G1', content: 'Role B hidden info' }],
    roleBOptions: [],
    roleBRequests: [{ id: 'GR1', content: 'Role B request' }],
    falseInfoCount: 1,
    trueRequestCount: 1,
  }
}

function buildAdminScenario(): AdminScenario {
  return {
    id: 'reform-court',
    title: 'Court Reform Debate',
    subject: 'history',
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
