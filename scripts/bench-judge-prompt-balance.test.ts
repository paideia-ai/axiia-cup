import { describe, expect, it } from 'bun:test'

import type { ScenarioRecord } from '../apps/api/src/db/schema'
import {
  DEFAULT_PLAYER_MODELS,
  LEVEL_3_PROMPT,
  applyJudgeSensitivityPromptSnapshot,
  buildCalibrationManifest,
  buildPromptResultsSummaryArtifact,
  parseJudgeOutput,
  renderPromptResultsSummary,
  summarizeCandidateResults,
  verifyThinkingCapture,
  type CandidateRecord,
  type HistoryResult,
  type JudgeResult,
  type ScenarioSnapshot,
} from './bench-judge-prompt-balance'

function scenario(id: ScenarioRecord['id']): ScenarioRecord {
  const base: ScenarioRecord = {
    agentPromptTemplate: '你是{{roleName}}。',
    createdAt: '2026-07-21T00:00:00.000Z',
    examinationQuestionTemplate: '',
    falseInfoCount: 0,
    id,
    judgeModel: 'deepseek-v3.2',
    judgeOsPrompt: '',
    judgePrompt: '{{debate}}',
    openingLine: '请开始。',
    roleAHiddenInfo: '[]',
    roleAName: '甲方',
    roleAOptions: '[]',
    roleARequests: JSON.stringify([
      { content: '甲方请求一', id: 'AR1' },
      { content: '甲方请求二', id: 'AR2' },
      { content: '甲方请求三', id: 'AR3' },
    ]),
    roleBHiddenInfo: '[]',
    roleBName: '乙方',
    roleBOptions: '[]',
    roleBRequests: JSON.stringify([
      { content: '乙方请求一', id: 'BR1' },
      { content: '乙方请求二', id: 'BR2' },
      { content: '乙方请求三', id: 'BR3' },
    ]),
    scorerModel: 'deepseek-v3.2',
    scorerPrompt: '',
    subject: 'test',
    title: id,
    trueRequestCount: 1,
    turnCount: 10,
  }

  if (id === 'honnoji-decision') {
    return {
      ...base,
      examinationQuestionTemplate: '猜测对手的真实请求。',
      roleAOptions: JSON.stringify([
        {
          id: 'attacker_one',
          name: '攻击方一',
          requests: [{ content: '攻击请求一', id: 'AO1' }],
        },
        {
          id: 'attacker_two',
          name: '攻击方二',
          requests: [{ content: '攻击请求二', id: 'AT1' }],
        },
      ]),
      roleARequests: '[]',
      roleBOptions: JSON.stringify([
        {
          id: 'defender_one',
          name: '防守方一',
          requests: [{ content: '防守请求一', id: 'DO1' }],
        },
        {
          id: 'defender_two',
          name: '防守方二',
          requests: [{ content: '防守请求二', id: 'DT1' }],
        },
      ]),
      roleBRequests: '[]',
      turnCount: 20,
    }
  }

  if (id === 'trolley-problem') {
    return {
      ...base,
      roleAName: '奕仁',
      roleARequests: '[]',
      roleBName: '武仁',
      roleBRequests: '[]',
      trueRequestCount: 0,
    }
  }

  return base
}

function snapshot(id: ScenarioRecord['id']): ScenarioSnapshot {
  return {
    ...scenario(id),
    agentPromptTemplateHash: `agent-${id}`,
    examinationQuestionTemplateHash: `exam-${id}`,
    judgePromptChars: 11,
    judgePromptHash: `judge-${id}`,
    scenarioSnapshotHash: `snapshot-${id}`,
    scorerPromptHash: `scorer-${id}`,
  }
}

describe('calibration manifest', () => {
  it('builds the exact trolley-only development panel', () => {
    const manifest = buildCalibrationManifest({
      now: new Date('2026-07-21T00:00:00.000Z'),
      scenarioIds: ['trolley-problem'],
      scenarios: { 'trolley-problem': snapshot('trolley-problem') },
    })

    expect(manifest.counts.unitsByScenario['trolley-problem']).toBe(5)
    expect(manifest.counts.historiesByScenario['trolley-problem']).toBe(40)
    expect(manifest.counts.normalJudgeCallsByScenario['trolley-problem']).toBe(
      240,
    )
    expect(manifest.counts.historiesByScenario['shangyang-court']).toBe(0)
    expect(manifest.counts.historiesByScenario['honnoji-decision']).toBe(0)
    expect(manifest.judgeModel).toBe('glm-5.2')
    expect(manifest.playerModels).toEqual([...DEFAULT_PLAYER_MODELS])
    expect(manifest.playerModels).not.toContain('qwen3.6-27b')
    expect(
      manifest.jobs.every(
        (job) =>
          job.promptA === LEVEL_3_PROMPT && job.promptB === LEVEL_3_PROMPT,
      ),
    ).toBe(true)
  })

  it('implements one Shangyang, four Honnoji, and five trolley units', () => {
    const manifest = buildCalibrationManifest({
      now: new Date('2026-07-21T00:00:00.000Z'),
      scenarioIds: ['shangyang-court', 'honnoji-decision', 'trolley-problem'],
      scenarios: {
        'honnoji-decision': snapshot('honnoji-decision'),
        'shangyang-court': snapshot('shangyang-court'),
        'trolley-problem': snapshot('trolley-problem'),
      },
    })

    expect(manifest.counts.unitsByScenario).toEqual({
      'honnoji-decision': 4,
      'shangyang-court': 1,
      'trolley-problem': 5,
    })
    expect(manifest.counts.totalHistories).toBe(80)
    expect(manifest.counts.totalNormalJudgeCallsPerCandidate).toBe(480)
  })
})

describe('judge prompt baseline', () => {
  it('overlays the one-case sensitivity prompt onto fresh production data', () => {
    const production = {
      ...snapshot('trolley-problem'),
      judgePrompt:
        '{{cases}}\n{{debate}}\n{{caseId1}} {{caseId2}} {{caseId3}} winner',
    }
    const oneCasePrompt =
      '{{cases}}\n{{debate}}\n{"judgments":{"{{caseId1}}":"一人侧"}}'
    const result = applyJudgeSensitivityPromptSnapshot({
      productionScenarios: { 'trolley-problem': production },
      scenarioIds: ['trolley-problem'],
      snapshot: {
        generatedAt: '2026-07-09T13:42:10.107Z',
        scenarios: {
          'trolley-problem': { judgePrompt: oneCasePrompt },
        },
      },
      sourcePath: 'sensitivity-snapshot.json',
    })

    expect(result.scenarios['trolley-problem']?.judgePrompt).toBe(oneCasePrompt)
    expect(
      result.source.scenarios['trolley-problem']?.byteIdenticalToProduction,
    ).toBe(false)
    expect(result.source.path).toBe('sensitivity-snapshot.json')
  })

  it('rejects the three-case production contract for isolated trolley judging', () => {
    expect(() =>
      applyJudgeSensitivityPromptSnapshot({
        productionScenarios: {
          'trolley-problem': snapshot('trolley-problem'),
        },
        scenarioIds: ['trolley-problem'],
        snapshot: {
          scenarios: {
            'trolley-problem': {
              judgePrompt:
                '{{cases}}\n{{debate}}\n{{caseId1}} {{caseId2}} {{caseId3}}',
            },
          },
        },
        sourcePath: 'bad-snapshot.json',
      }),
    ).toThrow('one-mini-case contract')
  })
})

describe('judge parsing', () => {
  it('uses the trolley mini-case judgment and ignores the aggregate winner', () => {
    const parsed = parseJudgeOutput({
      caseId: 'A',
      rawOutput: JSON.stringify({
        judgments: { A: '一人侧' },
        winner: '五人侧',
      }),
      scenarioId: 'trolley-problem',
    })

    expect(parsed.policyWinner).toBe('a')
    expect(parsed.parseError).toBeNull()
  })
})

describe('thinking verification', () => {
  const baseCapture = {
    apiModel: 'glm-5.2',
    content: '{"judgment":"变法"}',
    durationMs: 100,
    firstContentMs: 90,
    provider: 'zhipu' as const,
    providerCreatedAt: 1_700_000_000,
    providerResponseId: 'response-1',
    reasoningContentChars: 20,
    requestJson: '{}',
    responseJson: '{}',
    thinkingMode: 'enabled' as const,
    thinkingRequestControl: { thinking: { type: 'enabled' } },
    tokenUsage: {
      cachedTokens: 0,
      completionTokens: 20,
      promptTokens: 100,
      reasoningTokens: 10,
    },
    ttftMs: 10,
  }

  it('requires both an explicit request control and response evidence', () => {
    expect(verifyThinkingCapture(baseCapture).passed).toBe(true)
    expect(
      verifyThinkingCapture({
        ...baseCapture,
        reasoningContentChars: 0,
        tokenUsage: { ...baseCapture.tokenUsage, reasoningTokens: 0 },
      }).passed,
    ).toBe(false)
  })
})

function historyFromJob(
  job: ReturnType<typeof buildCalibrationManifest>['jobs'][number],
): HistoryResult {
  return {
    assignment: job.assignment,
    durationMs: 1,
    error: null,
    generatedAt: '2026-07-21T00:00:00.000Z',
    historyIndex: job.historyIndex,
    jobId: job.jobId,
    judgeTranscriptA: [],
    judgeTranscriptB: [],
    models: { agentA: job.playerModel, agentB: job.playerModel },
    playerModel: job.playerModel,
    promptA: LEVEL_3_PROMPT,
    promptAHash: 'level-3',
    promptB: LEVEL_3_PROMPT,
    promptBHash: 'level-3',
    roleAKey: job.roleAKey,
    roleAName: job.roleAName,
    roleARequests: job.roleARequests,
    roleBKey: job.roleBKey,
    roleBName: job.roleBName,
    roleBRequests: job.roleBRequests,
    scenarioId: job.scenarioId,
    status: 'ok',
    transcript: [],
    unitId: job.id,
    unitLabel: job.label,
  }
}

function judgeResult(params: {
  history: HistoryResult
  repeatIndex: number
  winner: 'a' | 'b'
}): JudgeResult {
  const id = `${params.history.jobId}-${params.repeatIndex}`
  return {
    attempts: [],
    cachePhase: params.repeatIndex === 1 ? 'warmup' : 'replay',
    cachedPromptTokens: params.repeatIndex === 1 ? 0 : 80,
    candidateId: 'SY-P0',
    durationMs: 100,
    error: null,
    generatedAt: '2026-07-21T00:00:00.000Z',
    historyJobId: params.history.jobId,
    id,
    judgeModel: 'glm-5.2',
    judgePromptChars: 10,
    judgePromptHash: 'prompt',
    parsedPolicy: {
      judgment: params.winner === 'a' ? '变法' : '维持现状',
      judgments: {},
      parseError: null,
      policyWinner: params.winner,
      requests: {},
    },
    playerModel: params.history.playerModel,
    promptTokens: 100,
    providerCreatedAt: 1_700_000_000,
    providerResponseId: `response-${id}`,
    rawOutput: '{}',
    reasoningContentChars: 10,
    reasoningTokens: 5,
    repeatIndex: params.repeatIndex,
    scenarioId: params.history.scenarioId,
    status: 'ok',
    thinkingVerified: true,
    unitId: params.history.unitId,
  }
}

function shangyangSummary(
  canonicalWins: (historyIndex: number, repeat: number) => boolean,
) {
  const manifest = buildCalibrationManifest({
    now: new Date('2026-07-21T00:00:00.000Z'),
    scenarioIds: ['shangyang-court'],
    scenarios: { 'shangyang-court': snapshot('shangyang-court') },
  })
  const histories = manifest.jobs.map(historyFromJob)
  const results = histories.flatMap((history, historyIndex) =>
    Array.from({ length: 6 }, (_, repeatIndex) =>
      judgeResult({
        history,
        repeatIndex: repeatIndex + 1,
        winner: canonicalWins(historyIndex, repeatIndex) ? 'a' : 'b',
      }),
    ),
  )
  const candidate: CandidateRecord = {
    benchmarkBaseline: true,
    candidateId: 'SY-P0',
    createdAt: '2026-07-21T00:00:00.000Z',
    evidence: null,
    exactDiffFromParent: '',
    hypothesis: null,
    kind: 'judge_prompt_balance.candidate',
    observedFailure: null,
    parentCandidateId: null,
    prediction: null,
    productionBaseline: true,
    prompt: '{{debate}}',
    promptChars: 11,
    promptHash: 'prompt',
    scenarioId: 'shangyang-court',
  }
  return summarizeCandidateResults({
    candidate,
    histories,
    judgeModel: 'glm-5.2',
    judgeRepeats: 6,
    results,
    units: manifest.units,
  })
}

describe('balance stop condition', () => {
  it('does not use fixed-history instability as a veto', () => {
    const summary = shangyangSummary((_history, repeat) => repeat < 3)

    expect(summary.units[0]?.canonicalRate).toBe(0.5)
    expect(summary.units[0]?.fixedHistoryInstability).toBe(0.25)
    expect(summary.stabilityAffectsPass).toBe(false)
    expect(summary.candidatePass).toBe(true)
  })

  it('uses the 30%-70% unit bounds with the four-model panel', () => {
    expect(
      shangyangSummary((history, repeat) => history * 6 + repeat < 15)
        .candidatePass,
    ).toBe(true)
    expect(
      shangyangSummary((history, repeat) => history * 6 + repeat < 33)
        .candidatePass,
    ).toBe(true)
    expect(
      shangyangSummary((history, repeat) => history * 6 + repeat < 14)
        .candidatePass,
    ).toBe(false)
    expect(
      shangyangSummary((history, repeat) => history * 6 + repeat < 34)
        .candidatePass,
    ).toBe(false)
  })
})

describe('prompt results summary', () => {
  it('preserves each exact prompt with its empirical unit win probability', () => {
    const manifest = buildCalibrationManifest({
      now: new Date('2026-07-21T00:00:00.000Z'),
      scenarioIds: ['shangyang-court'],
      scenarios: { 'shangyang-court': snapshot('shangyang-court') },
    })
    const p0: CandidateRecord = {
      benchmarkBaseline: true,
      candidateId: 'SY-P0',
      createdAt: '2026-07-21T00:00:00.000Z',
      evidence: null,
      exactDiffFromParent: '',
      hypothesis: null,
      kind: 'judge_prompt_balance.candidate',
      observedFailure: null,
      parentCandidateId: null,
      prediction: null,
      productionBaseline: true,
      prompt: '{{debate}}',
      promptChars: 11,
      promptHash: 'p0-hash',
      scenarioId: 'shangyang-court',
    }
    const p1: CandidateRecord = {
      ...p0,
      benchmarkBaseline: false,
      candidateId: 'SY-P1',
      exactDiffFromParent: '+Prefer evidence',
      parentCandidateId: 'SY-P0',
      productionBaseline: false,
      prompt: 'Prefer evidence\n{{debate}}',
      promptChars: 27,
      promptHash: 'p1-hash',
    }
    const artifact = buildPromptResultsSummaryArtifact({
      candidates: [
        { candidate: p1, summary: null },
        {
          candidate: p0,
          summary: shangyangSummary((_history, repeat) => repeat < 3),
        },
      ],
      config: { judgeModel: 'glm-5.2', runId: 'run-1' },
      generatedAt: '2026-07-21T01:00:00.000Z',
      manifest,
    })

    expect(
      artifact.prompts.map((candidate) => candidate.promptVersion),
    ).toEqual(['P0', 'P1'])
    expect(
      artifact.prompts[0]?.unitProbabilities[0]
        ?.estimatedCanonicalWinProbability,
    ).toBe(0.5)
    expect(artifact.prompts[0]?.unitProbabilities[0]?.canonicalWins).toBe(24)
    expect(
      artifact.prompts[0]?.unitProbabilities[0]?.canonicalPolicyLabel,
    ).toBe('变法')
    expect(artifact.prompts[0]?.unitProbabilities[0]?.canonicalRoleName).toBe(
      '甲方',
    )
    expect(artifact.prompts[1]?.evaluationStatus).toBe('not-run')

    const markdown = renderPromptResultsSummary(artifact)
    expect(markdown).toContain('## P0: SY-P0')
    expect(markdown).toContain('## P1: SY-P1')
    expect(markdown).toContain('Estimated canonical-policy win probability')
    expect(markdown).toContain('Prefer evidence\n{{debate}}')
  })
})
