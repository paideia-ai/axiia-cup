import {
  TROLLEY_SCENARIO_ID,
  type InfoAssignment,
  type JudgeQA,
} from '@axiia/shared'

import type { ScenarioRecord } from '../db/schema'

type ProgrammaticScoreParams = {
  assignment: InfoAssignment
  examinationA: JudgeQA[]
  examinationB: JudgeQA[]
  judgeOutput: string
  scenario: ScenarioRecord
}

type ExpectedScore = {
  scoreA: number
  scoreB: number
  winner: 'a' | 'b' | 'draw'
}

export type ProgrammaticScorerVerificationCase = {
  category: 'edge' | 'golden'
  description: string
  id: string
  params: ProgrammaticScoreParams
  scenarioId: string
} & (
  | {
      expected: ExpectedScore
      expectedError?: never
    }
  | {
      expected?: never
      expectedError: string
    }
)

const createdAt = '2026-01-01T00:00:00.000Z'

function requests(items: Array<{ content: string; id: string }>) {
  return JSON.stringify(items)
}

function judgeOutput(value: unknown) {
  return JSON.stringify(value)
}

function assignment(
  roleATrueRequestIds: string[] = [],
  roleBTrueRequestIds: string[] = [],
  selectedCaseIds?: string[],
): InfoAssignment {
  return {
    roleAFalseInfoIds: [],
    roleATrueRequestIds,
    roleBFalseInfoIds: [],
    roleBTrueRequestIds,
    ...(selectedCaseIds ? { selectedCaseIds } : {}),
  }
}

function examination(selectedInfoId: string): JudgeQA[] {
  return [
    {
      answer: '我认为此项最关键。',
      isCorrect: false,
      question: '哪条是真请求？',
      round: 1,
      selectedInfoId,
    },
  ]
}

const noExamination: JudgeQA[] = []

const scenarioBase: ScenarioRecord = {
  agentPromptTemplate: 'agent',
  createdAt,
  examinationQuestionTemplate: 'question',
  falseInfoCount: 0,
  id: 'base',
  judgeModel: 'deepseek-v3.2',
  judgePrompt: 'judge',
  openingLine: '请开始辩论。',
  roleAHiddenInfo: '[]',
  roleAName: 'roleA',
  roleAOptions: '[]',
  roleARequests: '[]',
  roleBHiddenInfo: '[]',
  roleBName: 'roleB',
  roleBOptions: '[]',
  roleBRequests: '[]',
  scorerModel: 'deepseek-v3.2',
  scorerPrompt: 'scorer',
  subject: 'verification',
  title: 'verification scenario',
  trueRequestCount: 1,
  turnCount: 8,
}

const shangyangScenario: ScenarioRecord = {
  ...scenarioBase,
  id: 'shangyang-court',
  roleAName: '商鞅',
  roleARequests: requests([
    { id: 'SR1', content: '请封商鞅为左庶长，委以军政重任' },
    { id: 'SR2', content: '请擢景监为大夫，入朝参与国政' },
    { id: 'SR3', content: '请赐商鞅举荐各县县令之权' },
  ]),
  roleBName: '甘龙',
  roleBRequests: requests([
    { id: 'GR1', content: '请封甘龙之子为陇西郡守' },
    { id: 'GR2', content: '请加太师府议政之权' },
    { id: 'GR3', content: '请保世族封地食邑世代相传' },
  ]),
  title: '商鞅变法·朝堂辩法',
}

const honnojiScenario: ScenarioRecord = {
  ...scenarioBase,
  id: 'honnoji-decision',
  roleAName: '长宗我部元亲阵营',
  roleARequests: requests([
    { id: 'CM1', content: '请光秀保证明智家不征伐长宗我部' },
    { id: 'CM2', content: '请光秀为元亲争取四国安堵' },
    { id: 'CM3', content: '请光秀保护中介不被治罪' },
  ]),
  roleBName: '细川藤孝',
  roleBRequests: requests([
    { id: 'HF1', content: '不把婚姻作为筹码' },
    { id: 'HF2', content: '把政治方案写成文书' },
    { id: 'HF3', content: '确保织田信忠生命安全' },
  ]),
  title: '本能寺之变',
}

const trolleyScenario: ScenarioRecord = {
  ...scenarioBase,
  id: TROLLEY_SCENARIO_ID,
  examinationQuestionTemplate: '',
  roleAName: '奕仁',
  roleARequests: '[]',
  roleBName: '武仁',
  roleBRequests: '[]',
  title: '电车难题',
}

export const programmaticScorerVerificationCases = [
  {
    category: 'golden',
    description:
      'Shangyang: A wins cleanly by winning the major goal and true request.',
    expected: { scoreA: 1.5, scoreB: 0, winner: 'a' },
    id: 'SY-G01',
    params: {
      assignment: assignment(['SR1'], ['GR2']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '变法',
        requests: {
          GR1: '不同意',
          GR2: '不同意',
          GR3: '不同意',
          SR1: '同意',
          SR2: '不同意',
          SR3: '不同意',
        },
        speech: '寡人决意变法。',
      }),
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'golden',
    description:
      'Shangyang: B wins with major goal, true request, A fake-request penalty, and A true-request discovery.',
    expected: { scoreA: -1.25, scoreB: 1.5, winner: 'b' },
    id: 'SY-G02',
    params: {
      assignment: assignment(['SR1'], ['GR2']),
      examinationA: noExamination,
      examinationB: examination('SR1'),
      judgeOutput: judgeOutput({
        judgment: '维持现状',
        requests: {
          GR1: '不同意',
          GR2: '同意',
          GR3: '不同意',
          SR1: '不同意',
          SR2: '同意',
          SR3: '不同意',
        },
        speech: '祖制不可轻动。',
      }),
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'golden',
    description:
      'Shangyang: A wins despite two fake approvals; B true request is approved but then discovered.',
    expected: { scoreA: 0.5, scoreB: -0.75, winner: 'a' },
    id: 'SY-G03',
    params: {
      assignment: assignment(['SR3'], ['GR1']),
      examinationA: examination('GR1'),
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '变法',
        requests: {
          GR1: '同意',
          GR2: '不同意',
          GR3: '同意',
          SR1: '同意',
          SR2: '同意',
          SR3: '不同意',
        },
        speech: '变法可行，但各请各断。',
      }),
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'golden',
    description:
      'Shangyang: draw case from A major goal, two A fake approvals, and B true approval.',
    expected: { scoreA: 0.5, scoreB: 0.5, winner: 'draw' },
    id: 'SY-G04',
    params: {
      assignment: assignment(['SR1'], ['GR2']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '变法',
        requests: {
          GR1: '不同意',
          GR2: '同意',
          GR3: '不同意',
          SR1: '不同意',
          SR2: '同意',
          SR3: '同意',
        },
        speech: '变法可行，但两项请托不可全从。',
      }),
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'golden',
    description:
      'Honnoji: A wins cleanly by winning the major goal and true request.',
    expected: { scoreA: 1.5, scoreB: 0, winner: 'a' },
    id: 'HN-G01',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '袭击本能寺',
        requests: {
          CM1: '不同意',
          CM2: '同意',
          CM3: '不同意',
          HF1: '不同意',
          HF2: '不同意',
          HF3: '不同意',
        },
        speech: '敌在本能寺。',
      }),
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'golden',
    description:
      'Honnoji: B wins with major goal, true request, A fake-request penalty, and A true-request discovery.',
    expected: { scoreA: -1, scoreB: 1.5, winner: 'b' },
    id: 'HN-G02',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: noExamination,
      examinationB: examination('CM2'),
      judgeOutput: judgeOutput({
        judgment: '西进毛利',
        requests: {
          CM1: '同意',
          CM2: '不同意',
          CM3: '不同意',
          HF1: '不同意',
          HF2: '不同意',
          HF3: '同意',
        },
        speech: '此刻当西进毛利。',
      }),
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'golden',
    description:
      'Honnoji: A wins while B true request is approved and then discovered by A.',
    expected: { scoreA: 1, scoreB: -0.25, winner: 'a' },
    id: 'HN-G03',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: examination('HF3'),
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '袭击本能寺',
        requests: {
          CM1: '不同意',
          CM2: '不同意',
          CM3: '不同意',
          HF1: '不同意',
          HF2: '不同意',
          HF3: '同意',
        },
        speech: '本能寺之机不可失。',
      }),
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'golden',
    description:
      'Honnoji: draw case covering major goal, true approvals, fake approvals, and discovery.',
    expected: { scoreA: 0.25, scoreB: 0.25, winner: 'draw' },
    id: 'HN-G04',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: noExamination,
      examinationB: examination('CM2'),
      judgeOutput: judgeOutput({
        judgment: '袭击本能寺',
        requests: {
          CM1: '同意',
          CM2: '同意',
          CM3: '同意',
          HF1: '同意',
          HF2: '不同意',
          HF3: '同意',
        },
        speech: '局势复杂，诸请分别裁断。',
      }),
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'golden',
    description: 'Trolley: A wins all three selected cases.',
    expected: { scoreA: 3, scoreB: 0, winner: 'a' },
    id: 'TR-G01',
    params: {
      assignment: assignment([], [], ['A', 'B', 'E']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '一人侧',
          B: '一人侧',
          E: '一人侧',
        },
        speech: '三案皆支持一人侧。',
        winner: '一人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'golden',
    description: 'Trolley: B wins by two cases to one.',
    expected: { scoreA: 1, scoreB: 2, winner: 'b' },
    id: 'TR-G02',
    params: {
      assignment: assignment([], [], ['A', 'C', 'D']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '一人侧',
          C: '五人侧',
          D: '五人侧',
        },
        speech: '五人侧以二比一胜出。',
        winner: '五人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'golden',
    description:
      'Trolley: A wins by two cases to one with a different case set.',
    expected: { scoreA: 2, scoreB: 1, winner: 'a' },
    id: 'TR-G03',
    params: {
      assignment: assignment([], [], ['A', 'D', 'E']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '五人侧',
          D: '一人侧',
          E: '一人侧',
        },
        speech: '一人侧以二比一胜出。',
        winner: '一人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'golden',
    description:
      'Trolley: selected case order controls which judgments are counted.',
    expected: { scoreA: 1, scoreB: 2, winner: 'b' },
    id: 'TR-G04',
    params: {
      assignment: assignment([], [], ['E', 'A', 'B']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '五人侧',
          B: '一人侧',
          C: '一人侧',
          E: '五人侧',
        },
        speech: '只统计本局入选的三个案件。',
        winner: '五人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'edge',
    description:
      'Shangyang: malformed speech string should not block extraction of judgment and requests.',
    expected: { scoreA: 1.5, scoreB: 0, winner: 'a' },
    id: 'SY-E01',
    params: {
      assignment: assignment(['SR1'], ['GR2']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput:
        '{"judgment":"变法","requests":{"SR1":"同意","GR2":"不予同意"},"speech":"寡人说"变法"可行。"}',
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'edge',
    description:
      'Shangyang: denial variants are treated as not approved before matching the word 同意.',
    expected: { scoreA: 0, scoreB: 0.75, winner: 'b' },
    id: 'SY-E02',
    params: {
      assignment: assignment(['SR1'], ['GR2']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '维持现状',
        requests: {
          GR1: '同意',
          GR2: '未同意',
          GR3: '否决',
          SR1: '不予同意',
          SR2: '拒绝',
          SR3: '不同意',
        },
        speech: '各项多不可从。',
      }),
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'edge',
    description: 'Shangyang: unrecognized judgment label should fail clearly.',
    expectedError: '裁判 judgment 无法识别',
    id: 'SY-E03',
    params: {
      assignment: assignment(['SR1'], ['GR2']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '再议',
        requests: {
          GR2: '同意',
          SR1: '同意',
        },
        speech: '此事容后再议。',
      }),
      scenario: shangyangScenario,
    },
    scenarioId: 'shangyang-court',
  },
  {
    category: 'edge',
    description:
      'Honnoji: fenced JSON and approved unknown request IDs should still score only current-role requests.',
    expected: { scoreA: 0, scoreB: 1.5, winner: 'b' },
    id: 'HN-E01',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: `\`\`\`json
{
  "judgment": "西进毛利",
  "requests": {
    "AS1": "同意",
    "CM2": "不同意",
    "HF3": "同意"
  },
  "speech": "西へ参る。"
}
\`\`\``,
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'edge',
    description:
      'Honnoji: approval variants such as 准许 and 批准 should be counted as approved.',
    expected: { scoreA: 1.5, scoreB: -1, winner: 'a' },
    id: 'HN-E02',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: examination('HF3'),
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgment: '袭击本能寺',
        requests: {
          CM1: '不同意',
          CM2: '准许',
          CM3: '不同意',
          HF1: '批准',
          HF2: '不同意',
          HF3: '不同意',
        },
        speech: '既如此，准其所请。',
      }),
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'edge',
    description:
      'Honnoji: completely unstructured judge output should fail clearly.',
    expectedError: '裁判输出不是可解析的结构化 JSON',
    id: 'HN-E03',
    params: {
      assignment: assignment(['CM2'], ['HF3']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: '此事不可以数字衡量。',
      scenario: honnojiScenario,
    },
    scenarioId: 'honnoji-decision',
  },
  {
    category: 'edge',
    description: 'Trolley: fenced JSON should parse and score normally.',
    expected: { scoreA: 2, scoreB: 1, winner: 'a' },
    id: 'TR-E01',
    params: {
      assignment: assignment([], [], ['A', 'B', 'E']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: `\`\`\`json
{
  "judgments": {
    "A": "一人侧",
    "B": "五人侧",
    "E": "一人侧"
  },
  "winner": "一人侧",
  "speech": "一人侧胜。"
}
\`\`\``,
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'edge',
    description:
      'Trolley: when selectedCaseIds is absent, scorer falls back to the judgment object keys.',
    expected: { scoreA: 1, scoreB: 2, winner: 'b' },
    id: 'TR-E02',
    params: {
      assignment: assignment(),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '五人侧',
          C: '一人侧',
          D: '五人侧',
        },
        speech: '五人侧胜。',
        winner: '五人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'edge',
    description:
      'Trolley: unknown per-case judgment label should fail clearly.',
    expectedError: '裁判 judgments.B 无法识别',
    id: 'TR-E03',
    params: {
      assignment: assignment([], [], ['A', 'B', 'E']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '一人侧',
          B: '平局',
          E: '五人侧',
        },
        speech: 'B 案无法决断。',
        winner: '五人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
  {
    category: 'edge',
    description:
      'Trolley: missing judgment for an explicitly selected case should fail clearly.',
    expectedError: '裁判 judgments.E 无法识别',
    id: 'TR-E04',
    params: {
      assignment: assignment([], [], ['A', 'B', 'E']),
      examinationA: noExamination,
      examinationB: noExamination,
      judgeOutput: judgeOutput({
        judgments: {
          A: '一人侧',
          B: '五人侧',
        },
        speech: '漏掉了 E 案。',
        winner: '五人侧',
      }),
      scenario: trolleyScenario,
    },
    scenarioId: TROLLEY_SCENARIO_ID,
  },
] satisfies ProgrammaticScorerVerificationCase[]
