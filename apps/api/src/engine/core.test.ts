import { beforeAll, describe, expect, it } from 'bun:test'

import type { ScenarioRecord } from '../db/schema'

process.env.SILICONFLOW_API_KEY = 'test-siliconflow-api-key'

let sanitizeJsonResponse: (typeof import('./core'))['sanitizeJsonResponse']
let buildAgentSystemMessage: (typeof import('./core'))['buildAgentSystemMessage']
let buildJudgeSystemMessage: (typeof import('./core'))['buildJudgeSystemMessage']
let buildExaminationQuestion: (typeof import('./core'))['buildExaminationQuestion']
let computeScores: (typeof import('./core'))['computeScores']
let randomizeInfoAssignment: (typeof import('./core'))['randomizeInfoAssignment']
let validateExaminationAnswer: (typeof import('./core'))['validateExaminationAnswer']
let validateJudgeDecision: (typeof import('./core'))['validateJudgeDecision']

beforeAll(async () => {
  const core = await import('./core')
  sanitizeJsonResponse = core.sanitizeJsonResponse
  buildAgentSystemMessage = core.buildAgentSystemMessage
  buildJudgeSystemMessage = core.buildJudgeSystemMessage
  buildExaminationQuestion = core.buildExaminationQuestion
  computeScores = core.computeScores
  randomizeInfoAssignment = core.randomizeInfoAssignment
  validateExaminationAnswer = core.validateExaminationAnswer
  validateJudgeDecision = core.validateJudgeDecision
})

const scenario: ScenarioRecord = {
  id: 'scenario-1',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  context: '公元前359年，秦孝公召卫鞅与太师甘龙于朝堂辩论。',
  roleAName: '商鞅',
  roleAPublicIdentity: '卫国公族后裔，从魏入秦，主张以法家之术强秦',
  roleAMainGoal: '在朝堂辩论中说服秦孝公支持变法',
  roleAStance: '变法',
  roleAHiddenInfo: JSON.stringify([
    { id: 'S1', content: '商鞅已通过近臣景监将变法方案呈给秦孝公预览' },
    { id: 'S2', content: '商鞅在魏国时亲眼见证了李悝变法的成效' },
    { id: 'S3', content: '商鞅已在秦国边境小邑秘密试行军功授爵三月' },
  ]),
  roleARequests: JSON.stringify([
    { id: 'SR1', content: '请封商鞅为左庶长，委以军政重任' },
    { id: 'SR2', content: '请擢景监为大夫，入朝参与国政' },
    { id: 'SR3', content: '请赐商鞅举荐各县县令之权' },
  ]),
  roleBName: '甘龙',
  roleBPublicIdentity: '秦国三朝元老太师，反对激进变法',
  roleBMainGoal: '在朝堂辩论中说服秦孝公维持现状',
  roleBStance: '维持现状',
  roleBHiddenInfo: JSON.stringify([
    { id: 'G1', content: '甘龙已联合杜挚、公子虔等宗室重臣集体抵制' },
    { id: 'G2', content: '楚国吴起变法后被旧贵族射杀于灵堂之上' },
    { id: 'G3', content: '商鞅在魏国时方案被公叔痤否决' },
  ]),
  roleBRequests: JSON.stringify([
    { id: 'GR1', content: '请封甘龙之子为陇西郡守' },
    { id: 'GR2', content: '请加太师府议政之权' },
    { id: 'GR3', content: '请保世族封地食邑世代相传' },
  ]),
  boundaryConstraints: '不得跳出战国秦国背景。',
  turnCount: 8,
  judgeName: '秦孝公',
  judgeModel: 'deepseek-v3.2',
  judgePrompt: '你是秦孝公。',
  openingLine: '请开始辩论。',
  agentPromptTemplate:
    '你是{{roleName}}。背景：{{context}} 身份：{{publicIdentity}} 目标：{{mainGoal}} 隐藏信息：{{hiddenInfo}} 请求：{{requests}} 对手：{{opponentName}} 约束：{{constraints}}',
  examinationQuestionTemplate:
    '{{opponentName}}的信息（{{opponentInfoIds}}）中哪条是假的？',
  falseInfoCount: 1,
  trueRequestCount: 1,
  mainGoalScore: 1,
  trueRequestScore: 0.5,
  falseRequestPenalty: -0.25,
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

describe('buildAgentSystemMessage', () => {
  const assignment = {
    roleAFalseInfoIds: ['S2'],
    roleBFalseInfoIds: ['G2'],
    roleATrueRequestIds: ['SR1'],
    roleBTrueRequestIds: ['GR1'],
  }

  it('returns a string containing context, role name, and identity', () => {
    const message = buildAgentSystemMessage(scenario, 'a', assignment)

    expect(message).toContain(scenario.context)
    expect(message).toContain(scenario.roleAName)
    expect(message).toContain(scenario.roleAPublicIdentity)
  })

  it('includes hidden info with true/false labels for role A', () => {
    const message = buildAgentSystemMessage(scenario, 'a', assignment)

    expect(message).toContain('S1（真）')
    expect(message).toContain('S2（假）')
    expect(message).toContain('S3（真）')
  })

  it('includes opponent name for role A', () => {
    const message = buildAgentSystemMessage(scenario, 'a', assignment)

    expect(message).toContain(scenario.roleBName)
  })
})

describe('buildJudgeSystemMessage', () => {
  const assignment = {
    roleAFalseInfoIds: ['S2'],
    roleBFalseInfoIds: ['G2'],
    roleATrueRequestIds: ['SR1'],
    roleBTrueRequestIds: ['GR1'],
  }

  it('interpolates shared scenario variables for the judge template', () => {
    const message = buildJudgeSystemMessage(
      {
        ...scenario,
        judgePrompt:
          '裁判：{{judgeName}} A={{roleAName}} A身份={{roleAPublicIdentity}} B={{roleBName}} B身份={{roleBPublicIdentity}} 分值={{mainGoalScore}}/{{trueRequestScore}}/{{falseRequestPenalty}}',
      },
      assignment,
    )

    expect(message).toContain('裁判：秦孝公')
    expect(message).toContain('A=商鞅')
    expect(message).toContain('A身份=卫国公族后裔')
    expect(message).toContain('B=甘龙')
    expect(message).toContain('B身份=秦国三朝元老太师')
    expect(message).toContain('分值=1/0.5/-0.25')
  })

  it('interpolates hidden info truth labels by id', () => {
    const message = buildJudgeSystemMessage(
      {
        ...scenario,
        judgePrompt: '{{S1_LABEL}} {{S2_LABEL}} {{G1_LABEL}} {{G2_LABEL}}',
      },
      assignment,
    )

    expect(message).toContain('确有其事')
    expect(message).toContain('子虚乌有')
  })
})

describe('buildExaminationQuestion', () => {
  it('lists the opponent hidden info ids in the prompt', () => {
    expect(buildExaminationQuestion(scenario, 'a')).toContain('G1/G2/G3')
    expect(buildExaminationQuestion(scenario, 'b')).toContain('S1/S2/S3')
  })
})

describe('randomizeInfoAssignment', () => {
  it('picks the configured number of false info ids', () => {
    const assignment = randomizeInfoAssignment(scenario)

    expect(assignment.roleAFalseInfoIds).toHaveLength(1)
    expect(assignment.roleBFalseInfoIds).toHaveLength(1)
    expect(assignment.roleATrueRequestIds).toHaveLength(1)
    expect(assignment.roleBTrueRequestIds).toHaveLength(1)
  })

  it('picks valid ids from the scenario', () => {
    const assignment = randomizeInfoAssignment(scenario)

    expect(['S1', 'S2', 'S3']).toContain(assignment.roleAFalseInfoIds[0])
    expect(['G1', 'G2', 'G3']).toContain(assignment.roleBFalseInfoIds[0])
  })
})

describe('validateExaminationAnswer', () => {
  it('accepts a selected info id from the allowed set', () => {
    const parsed = validateExaminationAnswer(
      {
        selectedInfoId: 'G2',
        answer: '我疑其言过其实。',
      },
      ['G1', 'G2', 'G3'],
    )

    expect(parsed.selectedInfoId).toBe('G2')
  })

  it('rejects a selected info id outside the allowed set', () => {
    expect(() =>
      validateExaminationAnswer(
        {
          selectedInfoId: 'X9',
          answer: '此言不实。',
        },
        ['G1', 'G2', 'G3'],
      ),
    ).toThrow('Invalid examination selectedInfoId')
  })
})

describe('validateJudgeDecision', () => {
  it('accepts a complete decision keyed by request id', () => {
    const decision = validateJudgeDecision(scenario, {
      judgment: '变法',
      requests: {
        SR1: '同意',
        SR2: '不同意',
        SR3: '不同意',
        GR1: '不同意',
        GR2: '不同意',
        GR3: '不同意',
      },
      speech: '寡人已有决断。',
    })

    expect(decision.judgment).toBe('变法')
  })

  it('rejects a decision with missing request keys', () => {
    expect(() =>
      validateJudgeDecision(scenario, {
        judgment: '变法',
        requests: {
          SR1: '同意',
        },
        speech: '寡人已有决断。',
      }),
    ).toThrow('Judge request decisions mismatch')
  })

  it('rejects a decision with an invalid judgment value', () => {
    expect(() =>
      validateJudgeDecision(scenario, {
        judgment: '两边都不支持',
        requests: {
          SR1: '同意',
          SR2: '不同意',
          SR3: '不同意',
          GR1: '不同意',
          GR2: '不同意',
          GR3: '不同意',
        },
        speech: '寡人已有决断。',
      }),
    ).toThrow('Invalid judgment')
  })
})

describe('computeScores', () => {
  const assignment = {
    roleAFalseInfoIds: ['S2'],
    roleBFalseInfoIds: ['G2'],
    roleATrueRequestIds: ['SR1'],
    roleBTrueRequestIds: ['GR1'],
  }

  it('gives mainGoalScore to the winner of judgment', () => {
    const result = computeScores(
      {
        judgment: '变法',
        requests: {},
        speech: '判决词',
      },
      assignment,
      scenario,
    )

    expect(result.scoreA).toBe(1)
    expect(result.scoreB).toBe(0)
    expect(result.winner).toBe('a')
  })

  it('adds trueRequestScore for approved true requests', () => {
    const result = computeScores(
      {
        judgment: '变法',
        requests: { SR1: '同意', GR1: '同意' },
        speech: '判决词',
      },
      assignment,
      scenario,
    )

    expect(result.scoreA).toBe(1.5) // 1 + 0.5
    expect(result.scoreB).toBe(0.5) // 0 + 0.5
  })

  it('applies falseRequestPenalty for approved false requests', () => {
    const result = computeScores(
      {
        judgment: '维持现状',
        requests: { SR2: '同意', SR3: '同意' },
        speech: '判决词',
      },
      assignment,
      scenario,
    )

    // scoreA: 0 (judgment to B) + (-0.25) + (-0.25) = -0.5
    expect(result.scoreA).toBe(-0.5)
    expect(result.scoreB).toBe(1)
  })
})
