import { describe, expect, it } from 'bun:test'

import type { ScenarioRecord } from '../db/schema'
import {
  resolveScenarioRoleOptions,
  validateScenarioRoleOptionSelection,
} from './scenario-options'

const baseScenario: ScenarioRecord = {
  id: 'honnoji-decision',
  title: '本能寺之变·敌在何处',
  subject: '历史',
  roleAName: '主张杀信长',
  roleAHiddenInfo: '[]',
  roleAOptions: JSON.stringify([
    {
      id: 'chosokabe',
      name: '长宗我部元亲阵营',
      requests: [{ id: 'CM1', content: '请光秀保证明智家不征伐长宗我部' }],
    },
  ]),
  roleARequests: '[]',
  roleBName: '主张不杀信长',
  roleBHiddenInfo: '[]',
  roleBOptions: JSON.stringify([
    {
      id: 'hosokawa_fujitaka',
      name: '细川藤孝',
      requests: [{ id: 'HF1', content: '请勿以婚姻为牵制筹码' }],
    },
  ]),
  roleBRequests: '[]',
  turnCount: 10,
  judgeModel: 'deepseek-v3.2',
  scorerModel: 'claude-sonnet-4-5',
  judgePrompt: 'judge',
  judgeOsPrompt: '',
  scorerPrompt: 'scorer',
  openingLine: '先陈杀信长之议。',
  agentPromptTemplate: '你是{{roleName}}',
  examinationQuestionTemplate: '{{opponentRequestIds}}',
  falseInfoCount: 0,
  trueRequestCount: 1,
  createdAt: '2026-05-03T00:00:00.000Z',
}

describe('scenario role options', () => {
  it('normalizes a valid selected role pair', () => {
    expect(
      validateScenarioRoleOptionSelection(baseScenario, {
        roleAOptionId: 'chosokabe',
        roleBOptionId: 'hosokawa_fujitaka',
      }),
    ).toEqual({
      roleAOptionId: 'chosokabe',
      roleBOptionId: 'hosokawa_fujitaka',
    })
  })

  it('resolves role names and request lists for the selected pair only', () => {
    const resolved = resolveScenarioRoleOptions(baseScenario, {
      roleAOptionId: 'chosokabe',
      roleBOptionId: 'hosokawa_fujitaka',
    })

    expect(resolved.roleAName).toBe('长宗我部元亲阵营')
    expect(resolved.roleARequests).toContain('CM1')
    expect(resolved.roleBName).toBe('细川藤孝')
    expect(resolved.roleBRequests).toContain('HF1')
    expect(resolved.agentPromptTemplate).toBe(baseScenario.agentPromptTemplate)
  })

  it('rejects role option ids on scenarios without selectable roles', () => {
    const scenarioWithoutOptions: ScenarioRecord = {
      ...baseScenario,
      roleAOptions: '[]',
      roleARequests: JSON.stringify([{ id: 'SR1', content: '请求1' }]),
      roleBOptions: '[]',
      roleBRequests: JSON.stringify([{ id: 'GR1', content: '请求2' }]),
    }

    expect(() =>
      validateScenarioRoleOptionSelection(scenarioWithoutOptions, {
        roleAOptionId: 'chosokabe',
        roleBOptionId: null,
      }),
    ).toThrow(/does not support selectable roles/)
  })
})
