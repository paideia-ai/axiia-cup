import { beforeAll, describe, expect, it } from 'bun:test'

import type { ScenarioRecord } from '../db/schema'

process.env.SILICONFLOW_API_KEY = 'test-siliconflow-api-key'

let sanitizeJsonResponse: (typeof import('./core'))['sanitizeJsonResponse']
let buildAgentSystemMessage: (typeof import('./core'))['buildAgentSystemMessage']
let buildAgentRuntimeSystemPrompt: (typeof import('./core'))['buildAgentRuntimeSystemPrompt']
let buildJudgePrompt: (typeof import('./core'))['buildJudgePrompt']
let buildExaminationQuestion: (typeof import('./core'))['buildExaminationQuestion']
let randomizeInfoAssignment: (typeof import('./core'))['randomizeInfoAssignment']
let validateExaminationAnswer: (typeof import('./core'))['validateExaminationAnswer']

beforeAll(async () => {
  const core = await import('./core')
  sanitizeJsonResponse = core.sanitizeJsonResponse
  buildAgentSystemMessage = core.buildAgentSystemMessage
  buildAgentRuntimeSystemPrompt = core.buildAgentRuntimeSystemPrompt
  buildJudgePrompt = core.buildJudgePrompt
  buildExaminationQuestion = core.buildExaminationQuestion
  randomizeInfoAssignment = core.randomizeInfoAssignment
  validateExaminationAnswer = core.validateExaminationAnswer
})

const scenario: ScenarioRecord = {
  id: 'scenario-1',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  roleAName: '商鞅',
  roleAHiddenInfo: JSON.stringify([
    { id: 'S1', content: '商鞅已通过近臣景监将变法方案呈给秦孝公预览' },
    { id: 'S2', content: '商鞅在魏国时亲眼见证了李悝变法的成效' },
    { id: 'S3', content: '商鞅已在秦国边境小邑秘密试行军功授爵三月' },
  ]),
  roleAOptions: '[]',
  roleARequests: JSON.stringify([
    { id: 'SR1', content: '请封商鞅为左庶长，委以军政重任' },
    { id: 'SR2', content: '请擢景监为大夫，入朝参与国政' },
    { id: 'SR3', content: '请赐商鞅举荐各县县令之权' },
  ]),
  roleBName: '甘龙',
  roleBHiddenInfo: JSON.stringify([
    { id: 'G1', content: '甘龙已联合杜挚、公子虔等宗室重臣集体抵制' },
    { id: 'G2', content: '楚国吴起变法后被旧贵族射杀于灵堂之上' },
    { id: 'G3', content: '商鞅在魏国时方案被公叔痤否决' },
  ]),
  roleBOptions: '[]',
  roleBRequests: JSON.stringify([
    { id: 'GR1', content: '请封甘龙之子为陇西郡守' },
    { id: 'GR2', content: '请加太师府议政之权' },
    { id: 'GR3', content: '请保世族封地食邑世代相传' },
  ]),
  turnCount: 8,
  judgeModel: 'deepseek-v3.2',
  scorerModel: 'deepseek-v3.2',
  judgePrompt:
    'A={{roleAName}} B={{roleBName}} 辩论：{{debate}} 问询A：{{examinationA}} 问询B：{{examinationB}} 请求A：{{roleARequests}} 请求B：{{roleBRequests}}',
  scorerPrompt: '计分。{{judgeOutput}}',
  openingLine: '请开始辩论。',
  agentPromptTemplate:
    '你是{{roleName}}。对手：{{opponentName}} 隐藏信息：{{hiddenInfo}} 请求：{{requests}} 对手请求：{{opponentRequests}} 轮数：{{turnCount}}',
  examinationQuestionTemplate:
    '{{opponentName}}的信息（{{opponentInfoIds}}）中哪条是假的？',
  falseInfoCount: 1,
  trueRequestCount: 1,
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

  it('returns a string containing role name', () => {
    const message = buildAgentSystemMessage(scenario, 'a', assignment)

    expect(message).toContain(scenario.roleAName)
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

  it('interpolates selected trolley cases and side names', () => {
    const message = buildAgentSystemMessage(
      {
        ...scenario,
        id: 'trolley-problem',
        roleAName: '奕仁',
        roleAHiddenInfo: '[]',
        roleARequests: '[]',
        roleBName: '武仁',
        roleBHiddenInfo: '[]',
        roleBRequests: '[]',
        agentPromptTemplate:
          '你是{{roleName}}。你代表{{sideName}}，对手是{{opponentSideName}}。案件：{{cases}}',
      },
      'a',
      {
        roleAFalseInfoIds: [],
        roleBFalseInfoIds: [],
        roleATrueRequestIds: [],
        roleBTrueRequestIds: [],
        selectedCaseIds: ['A', 'B', 'E'],
      },
    )

    expect(message).toContain('你是奕仁')
    expect(message).toContain('你代表一人侧')
    expect(message).toContain('对手是五人侧')
    expect(message).toContain('A. 原始电车')
    expect(message).toContain('B. 器官移植')
    expect(message).toContain('E. 缸中之脑')
  })
})

describe('buildAgentRuntimeSystemPrompt', () => {
  const assignment = {
    roleAFalseInfoIds: ['S2'],
    roleBFalseInfoIds: ['G2'],
    roleATrueRequestIds: ['SR1'],
    roleBTrueRequestIds: ['GR1'],
  }

  it('appends the user strategy prompt to the system prompt body', () => {
    const message = buildAgentRuntimeSystemPrompt(
      scenario,
      'a',
      assignment,
      '以下是你的行动策略：先稳住阵脚，再试探对手。',
    )

    expect(message).toContain('你是商鞅。')
    expect(message).toContain('以下是你的行动策略：先稳住阵脚，再试探对手。')
  })
})

describe('buildJudgePrompt', () => {
  const assignment = {
    roleAFalseInfoIds: ['S2'],
    roleBFalseInfoIds: ['G2'],
    roleATrueRequestIds: ['SR1'],
    roleBTrueRequestIds: ['GR1'],
  }

  it('interpolates role names and dynamic content', () => {
    const message = buildJudgePrompt(scenario, assignment, {
      debate: '辩论全文',
      examinationA: '问询A结果',
      examinationB: '问询B结果',
    })

    expect(message).toContain('A=商鞅')
    expect(message).toContain('B=甘龙')
    expect(message).toContain('辩论：辩论全文')
    expect(message).toContain('问询A：问询A结果')
    expect(message).toContain('问询B：问询B结果')
  })

  it('interpolates hidden info truth labels by id', () => {
    const message = buildJudgePrompt(
      {
        ...scenario,
        judgePrompt: '{{S1_LABEL}} {{S2_LABEL}} {{G1_LABEL}} {{G2_LABEL}}',
      },
      assignment,
      { debate: '', examinationA: '', examinationB: '' },
    )

    expect(message).toContain('确有其事')
    expect(message).toContain('子虚乌有')
  })

  it('interpolates request truth labels', () => {
    const message = buildJudgePrompt(
      {
        ...scenario,
        judgePrompt: '{{SR1_LABEL}} {{SR2_LABEL}} {{GR1_LABEL}} {{GR2_LABEL}}',
      },
      assignment,
      { debate: '', examinationA: '', examinationB: '' },
    )

    expect(message).toContain('真')
    expect(message).toContain('假')
  })

  it('interpolates turn count and request content by id', () => {
    const message = buildJudgePrompt(
      {
        ...scenario,
        judgePrompt: '轮数={{turnCount}} A={{SR1_CONTENT}} B={{GR2_CONTENT}}',
      },
      assignment,
      { debate: '', examinationA: '', examinationB: '' },
    )

    expect(message).toContain('轮数=8')
    expect(message).toContain('请封商鞅为左庶长，委以军政重任')
    expect(message).toContain('请加太师府议政之权')
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

  it('does not assign cases to non-trolley scenarios', () => {
    const assignment = randomizeInfoAssignment(scenario)

    expect(assignment.selectedCaseIds).toEqual([])
  })

  it('assigns case A plus two random pool cases for trolley scenarios', () => {
    const assignment = randomizeInfoAssignment({
      ...scenario,
      id: 'trolley-problem',
      roleAHiddenInfo: '[]',
      roleARequests: '[]',
      roleBHiddenInfo: '[]',
      roleBRequests: '[]',
      falseInfoCount: 0,
      trueRequestCount: 0,
    })

    const selectedCaseIds = assignment.selectedCaseIds ?? []

    expect(selectedCaseIds).toHaveLength(3)
    expect(selectedCaseIds).toContain('A')
    expect(
      selectedCaseIds.filter((caseId) => ['B', 'C', 'D', 'E'].includes(caseId)),
    ).toHaveLength(2)
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
