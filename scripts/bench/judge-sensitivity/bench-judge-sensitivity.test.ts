import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'

import {
  applyTrolleyJudgePromptOverride,
  assertTrolleySingleCaseJudgePrompt,
  buildJudgeReplayJobs,
  completionFromCapture,
  expandGlmReasoningEffortModels,
  historyMatchesTrolleyCaseFilters,
  parseGlmReasoningEfforts,
  parseTrolleyCaseFilters,
  parseTrolleyCaseIds,
} from './bench-judge-sensitivity'

const TROLLEY_BALANCER_RUN =
  'docs/bench/judge-prompt-winrate-balancer/runs/trolley/judge-prompt-balance-trolley-20260721T225005Z'
const SENSITIVITY_SNAPSHOTS =
  'docs/bench/judge-sensitivity/runs/multi-scenario/judge-sensitivity-prod-20260708T200403Z/scenario-snapshots.json'

describe('Trolley case selection', () => {
  it('normalizes, deduplicates, and orders selected cases', () => {
    expect(parseTrolleyCaseIds('e, A,D,A')).toEqual(['A', 'D', 'E'])
  })

  it('keeps the single-case flag as a compatibility alias', () => {
    expect(parseTrolleyCaseFilters({ case: 'e' })).toEqual(['E'])
  })

  it('rejects simultaneous singular and plural flags', () => {
    expect(() =>
      parseTrolleyCaseFilters({ case: 'E', cases: 'A,D,E' }),
    ).toThrow('Use either --case or --cases')
  })

  it('rejects unknown cases', () => {
    expect(() => parseTrolleyCaseIds('A,F')).toThrow(
      'Unsupported Trolley case id: F',
    )
  })

  it('filters non-selected and non-Trolley histories', () => {
    const selected = ['A', 'D', 'E']

    expect(
      historyMatchesTrolleyCaseFilters(
        { caseId: 'D', scenarioId: 'trolley-problem' },
        selected,
      ),
    ).toBe(true)
    expect(
      historyMatchesTrolleyCaseFilters(
        { caseId: 'B', scenarioId: 'trolley-problem' },
        selected,
      ),
    ).toBe(false)
    expect(
      historyMatchesTrolleyCaseFilters(
        { caseId: null, scenarioId: 'shangyang-court' },
        selected,
      ),
    ).toBe(false)
  })
})

describe('Trolley P2 judge prompt', () => {
  it('starts from the exact sensitivity P0 and applies the second balancer iteration', () => {
    const snapshots = JSON.parse(readFileSync(SENSITIVITY_SNAPSHOTS, 'utf8'))
    const p0Candidate = JSON.parse(
      readFileSync(
        `${TROLLEY_BALANCER_RUN}/candidates/TR-P0/candidate.json`,
        'utf8',
      ),
    )
    const p1Candidate = JSON.parse(
      readFileSync(
        `${TROLLEY_BALANCER_RUN}/candidates/TR-P1/candidate.json`,
        'utf8',
      ),
    )
    const p2Candidate = JSON.parse(
      readFileSync(
        `${TROLLEY_BALANCER_RUN}/candidates/TR-P2/candidate.json`,
        'utf8',
      ),
    )
    const p0Prompt = readFileSync(
      `${TROLLEY_BALANCER_RUN}/candidates/TR-P0/prompt.txt`,
      'utf8',
    )
    const p2Prompt = readFileSync(
      `${TROLLEY_BALANCER_RUN}/candidates/TR-P2/prompt.txt`,
      'utf8',
    )
    const trolleySnapshot = snapshots.scenarios['trolley-problem']

    expect(trolleySnapshot.judgePrompt).toBe(p0Prompt)
    expect(trolleySnapshot.judgePromptHash).toBe(p0Candidate.promptHash)
    expect(p0Candidate.parentCandidateId).toBeNull()
    expect(p1Candidate.parentCandidateId).toBe('TR-P0')
    expect(p2Candidate.parentCandidateId).toBe('TR-P1')
    expect(p2Prompt).not.toBe(p0Prompt)
    expect(p2Prompt).toContain('2. 论证增量：')
    expect(() => assertTrolleySingleCaseJudgePrompt(p2Prompt)).not.toThrow()

    const applied = applyTrolleyJudgePromptOverride({
      override: {
        candidateId: 'TR-P2',
        parentCandidateId: 'TR-P1',
        prompt: p2Prompt,
        sourceHash: p2Candidate.promptHash,
        sourcePath: `${TROLLEY_BALANCER_RUN}/candidates/TR-P2/prompt.txt`,
      },
      snapshot: trolleySnapshot,
    })

    expect(applied.metadata).toMatchObject({
      candidateId: 'TR-P2',
      originalJudgePromptHash: p0Candidate.promptHash,
      overrideJudgePromptHash: p2Candidate.promptHash,
      parentCandidateId: 'TR-P1',
    })
    expect(applied.snapshot.judgePrompt).toBe(p2Prompt)
    expect(applied.snapshot.judgePromptHash).toBe(p2Candidate.promptHash)
  })

  it('rejects a prompt that still expects several mini-cases', () => {
    expect(() =>
      assertTrolleySingleCaseJudgePrompt(
        '{{cases}} {{debate}} {{caseId1}} {{caseId2}}',
      ),
    ).toThrow('still expects multiple mini-cases')
  })
})

describe('GLM-5.2 reasoning efforts', () => {
  it('expands high and max into independent judge lanes', () => {
    const efforts = parseGlmReasoningEfforts('max,high,max')

    expect(efforts).toEqual(['max', 'high'])
    expect(expandGlmReasoningEffortModels(['glm-5.2'], efforts)).toEqual([
      'glm-5.2-reasoning-max',
      'glm-5.2-reasoning-high',
    ])
  })

  it('rejects applying GLM effort controls to a mixed model list', () => {
    expect(() =>
      expandGlmReasoningEffortModels(
        ['glm-5.2', 'deepseek-v4-pro'],
        ['high', 'max'],
      ),
    ).toThrow('requires --judge-models glm-5.2')
  })

  it('records a dynamic-thinking skip without retrying the response', () => {
    const completion = completionFromCapture({
      capture: {
        apiModel: 'glm-5.2',
        content: '{"winner":"A"}',
        durationMs: 100,
        firstContentMs: 80,
        provider: 'zhipu',
        providerCreatedAt: null,
        providerResponseId: 'response-1',
        reasoningContentChars: 0,
        requestJson: '{}',
        responseJson: '{}',
        thinkingMode: 'enabled',
        thinkingRequestControl: {
          reasoning_effort: 'high',
          thinking: { type: 'enabled' },
        },
        tokenUsage: {
          cachedTokens: null,
          completionTokens: 10,
          promptTokens: 20,
          reasoningTokens: 0,
        },
        ttftMs: 50,
      },
      definition: {
        allowMissingReasoningWhenEnabled: true,
        apiModel: 'glm-5.2',
        baseModel: 'glm-5.2',
        id: 'glm-5.2-reasoning-high',
        label: 'GLM-5.2 (reasoning high)',
        provider: 'zhipu',
        reasoningEffort: 'high',
        surfaces: ['evaluation'],
        thinkingOnRequest: 'native-thinking-enabled',
        underlyingProvider: 'zai',
        verifyReasoningEnabled: true,
      },
      requestedThinkingMode: 'enabled',
    })

    expect(completion.reasoningVerification).toMatchObject({
      effort: 'high',
      reasoningContentChars: 0,
      reasoningSkippedByModelAllowed: true,
      reasoningTokens: 0,
      requestControlVerifiedOn: true,
    })
    expect(completion.reasoningVerification?.verifiedOn).toBeUndefined()
    expect(completion.requestProvenance?.configuredEffort).toBe('high')
  })

  it('builds separate replay ids for each effort and selected case', () => {
    const histories = [
      {
        caseId: 'A',
        jobId: 'case-A',
        scenarioId: 'trolley-problem',
        status: 'ok' as const,
      },
      {
        caseId: 'B',
        jobId: 'case-B',
        scenarioId: 'trolley-problem',
        status: 'ok' as const,
      },
      {
        caseId: 'D',
        jobId: 'case-D',
        scenarioId: 'trolley-problem',
        status: 'ok' as const,
      },
      {
        caseId: 'E',
        jobId: 'case-E',
        scenarioId: 'trolley-problem',
        status: 'ok' as const,
      },
    ] as unknown as Parameters<typeof buildJudgeReplayJobs>[0]['histories']

    const jobs = buildJudgeReplayJobs({
      caseFilters: ['A', 'D', 'E'],
      histories,
      judgeModels: ['glm-5.2-reasoning-high', 'glm-5.2-reasoning-max'],
      repeats: 2,
      scenarioIds: ['trolley-problem'],
    })

    expect(jobs).toHaveLength(12)
    expect(new Set(jobs.map((job) => job.history.caseId))).toEqual(
      new Set(['A', 'D', 'E']),
    )
    expect(new Set(jobs.map((job) => job.judgeModel))).toEqual(
      new Set(['glm-5.2-reasoning-high', 'glm-5.2-reasoning-max']),
    )
    expect(new Set(jobs.map((job) => job.id)).size).toBe(12)
  })
})
