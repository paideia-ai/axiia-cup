import { beforeAll, describe, expect, it } from 'bun:test'

import type { ScenarioRecord } from '../db/schema'

process.env.SILICONFLOW_API_KEY = 'test-siliconflow-api-key'

let sanitizeJsonResponse: (typeof import('./core'))['sanitizeJsonResponse']
let buildAgentContextMessage: (typeof import('./core'))['buildAgentContextMessage']

beforeAll(async () => {
  const core = await import('./core')
  sanitizeJsonResponse = core.sanitizeJsonResponse
  buildAgentContextMessage = core.buildAgentContextMessage
})

const scenario: ScenarioRecord = {
  id: 'scenario-1',
  title: 'Campus Budget Debate',
  subject: 'negotiation',
  context:
    '学生会正在决定是否将有限预算用于延长图书馆开放时间还是增加心理咨询服务。',
  roleAName: '学生会主席',
  roleAPublicGoal: [
    '公开身份：代表学生会统筹预算。',
    '公开要求：需要兼顾多数学生的直接需求。',
    '隐藏考虑：希望在下次选举前提升支持率。',
  ].join('\n'),
  roleBName: '心理中心主任',
  roleBPublicGoal: [
    '公开身份：心理中心负责人。',
    '公开要求：争取增加心理咨询服务资源。',
    '隐藏考虑：近期咨询预约积压严重。',
  ].join('\n'),
  boundaryConstraints: '不得承诺不存在的外部资金，不得跳出校园治理场景。',
  turnCount: 8,
  judgeRounds: 3,
  judgePrompt: '请根据说服力、策略性和角色一致性评分。',
  createdAt: '2025-01-01T00:00:00.000Z',
}

describe('sanitizeJsonResponse', () => {
  it('passes through a plain JSON string', () => {
    expect(sanitizeJsonResponse('{"winner":"a","score":8}')).toBe(
      '{"winner":"a","score":8}',
    )
  })

  it('extracts JSON from markdown json code fences', () => {
    expect(sanitizeJsonResponse('```json\n{"winner":"b","score":7}\n```')).toBe(
      '{"winner":"b","score":7}',
    )
  })

  it('extracts JSON from plain code fences', () => {
    expect(sanitizeJsonResponse('```\n{"winner":"draw","score":6}\n```')).toBe(
      '{"winner":"draw","score":6}',
    )
  })

  it('handles whitespace around JSON', () => {
    expect(sanitizeJsonResponse('  \n\t {"winner":"a"} \n\n  ')).toBe(
      '{"winner":"a"}',
    )
  })
})

describe('buildAgentContextMessage', () => {
  it('returns a string containing scenario context, role name, and role card', () => {
    const message = buildAgentContextMessage(scenario, 'a')

    expect(message).toContain(scenario.context)
    expect(message).toContain(`角色：${scenario.roleAName}`)
    expect(message).toContain(scenario.roleAPublicGoal)
  })

  it("includes opponent public info for role 'a'", () => {
    const message = buildAgentContextMessage(scenario, 'a')

    expect(message).toContain(`对手角色：${scenario.roleBName}`)
    expect(message).toContain('公开身份：心理中心负责人。')
    expect(message).not.toContain('隐藏考虑：近期咨询预约积压严重。')
  })

  it("includes opponent public info for role 'b'", () => {
    const message = buildAgentContextMessage(scenario, 'b')

    expect(message).toContain(`对手角色：${scenario.roleAName}`)
    expect(message).toContain('公开身份：代表学生会统筹预算。')
    expect(message).not.toContain('隐藏考虑：希望在下次选举前提升支持率。')
  })
})
