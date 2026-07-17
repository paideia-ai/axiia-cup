import {
  evaluationModelIdSchema,
  examinationAnswerSchema,
  hiddenInfoItemSchema,
  infoAssignmentSchema,
  judgeOsProvenanceSchema,
  SHANGYANG_JUDGE_OS_SCENARIO_ID,
  type JudgeOsEntry,
  type JudgeOsProvenance,
  judgeQASchema,
  matchWinnerSchema,
  requestItemSchema,
  scorerOutputSchema,
  submissionModelIdSchema,
  transcriptTurnSchema,
  formatTrolleyCaseForPrompt,
  formatTrolleyCasesForPrompt,
  getTrolleyCaseById,
  trolleyFixedCaseIds,
  trolleyRandomCaseIds,
  TROLLEY_SCENARIO_ID,
  type EvaluationModelId,
  type HiddenInfoItem,
  type InfoAssignment,
  type JudgeQA,
  type RequestItem,
  type SubmissionModelId,
  type TranscriptTurn,
} from '@axiia/shared'

import type { ScenarioRecord } from '../db/schema'
import { chatCompletion, type ChatCompletionTrace } from './llm'
import {
  buildJudgeOsProvenance,
  buildJudgeOsUserMessage,
  createJudgeOsSidecar,
  type JudgeOsGenerationRequest,
  validateJudgeOsResponse,
} from './judge-os'
import {
  getPlaygroundInterruptMessage,
  isPlaygroundRunInterruptedError,
  PlaygroundRunInterruptedError,
  throwIfPlaygroundRunInterrupted,
} from './playground-interrupt'
import { computeProgrammaticScore } from './programmatic-scorer'

const RETRY_COUNT = 3
const RETRY_DELAY_MS = 2000
// Judge-model calls have been observed at 33-55s; a straggling final OS call
// gets this long after scoring before it is tombstoned as failed.
const JUDGE_OS_FINALIZE_TIMEOUT_MS = 120_000

// deepseek-v3.2 is stranded on the dead SiliconFlow account and the official
// DeepSeek API retires v3-era models on 2026-07-24; default to V4 instead.
export const DEFAULT_JUDGE_MODEL =
  'deepseek-v4-pro' as const satisfies EvaluationModelId

export const DEFAULT_SCORER_MODEL =
  'deepseek-v4-flash' as const satisfies EvaluationModelId

type MatchExecutionParams = {
  completeChat?: typeof chatCompletion
  infoAssignment?: InfoAssignment
  judgeOs?: JudgeOsEntry[]
  judgeOsFailedTurns?: number[]
  judgeOsProvenance?: JudgeOsProvenance | null
  judgeTranscriptA?: JudgeQA[]
  judgeTranscriptB?: JudgeQA[]
  matchId?: number
  modelA: string
  modelB: string
  onDialogueTurn?: (transcript: TranscriptTurn[]) => Promise<void> | void
  onInfoAssignment?: (assignment: InfoAssignment) => Promise<void> | void
  onJudgeOsState?: (state: {
    entries: JudgeOsEntry[]
    failedTurns: number[]
  }) => Promise<void> | void
  onJudgeOsProvenance?: (provenance: JudgeOsProvenance) => Promise<void> | void
  onJudgeTranscriptA?: (judgeTranscriptA: JudgeQA[]) => Promise<void> | void
  onJudgeTranscriptB?: (judgeTranscriptB: JudgeQA[]) => Promise<void> | void
  onJudgingStart?: (transcript: TranscriptTurn[]) => Promise<void> | void
  onStart?: () => Promise<void> | void
  playgroundRunId?: number
  promptA: string
  promptB: string
  scenario: ScenarioRecord
  signal?: AbortSignal
  transcript?: TranscriptTurn[]
  userIdA?: number
  userIdB?: number
}

export type MatchExecutionResult = {
  infoAssignment: InfoAssignment
  judgeDecision: string
  judgeOs: JudgeOsEntry[]
  judgeOsFailedTurns: number[]
  judgeOsProvenance: JudgeOsProvenance | null
  judgeTranscriptA: JudgeQA[]
  judgeTranscriptB: JudgeQA[]
  reasoning: string
  scoreA: number
  scoreB: number
  transcript: TranscriptTurn[]
  winner: 'a' | 'b' | 'draw'
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        new PlaygroundRunInterruptedError(
          getPlaygroundInterruptMessage(signal),
        ),
      )
      return
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve(undefined)
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(
        new PlaygroundRunInterruptedError(
          getPlaygroundInterruptMessage(signal),
        ),
      )
    }

    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

async function withRetry<T>(
  task: (attempt: number) => Promise<T>,
  signal?: AbortSignal,
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    throwIfPlaygroundRunInterrupted(signal)

    try {
      return await task(attempt)
    } catch (error) {
      if (isPlaygroundRunInterruptedError(error) || signal?.aborted) {
        throw new PlaygroundRunInterruptedError(
          getPlaygroundInterruptMessage(signal),
        )
      }

      lastError = error

      if (attempt < RETRY_COUNT) {
        await sleep(RETRY_DELAY_MS, signal)
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unknown engine error')
}

export function parseSubmissionModelId(value: string) {
  return submissionModelIdSchema.parse(value)
}

export function parseEvaluationModelId(value: string) {
  return evaluationModelIdSchema.parse(value)
}

export function sanitizeJsonResponse(raw: string) {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

  return fenced ? fenced[1].trim() : trimmed
}

// ── Helpers: parse JSON fields from scenario ────────────────────────────────

function parseHiddenInfo(jsonText: string): HiddenInfoItem[] {
  return hiddenInfoItemSchema.array().parse(JSON.parse(jsonText))
}

function parseRequests(jsonText: string): RequestItem[] {
  return requestItemSchema.array().parse(JSON.parse(jsonText))
}

function getOpponentFalseInfoIds(
  assignment: InfoAssignment,
  roleSide: 'a' | 'b',
) {
  return roleSide === 'a'
    ? assignment.roleBFalseInfoIds
    : assignment.roleAFalseInfoIds
}

function getOpponentHiddenInfo(
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
): HiddenInfoItem[] {
  return parseHiddenInfo(
    roleSide === 'a' ? scenario.roleBHiddenInfo : scenario.roleAHiddenInfo,
  )
}

// ── Randomization ───────────────────────────────────────────────────────────

/** Pick `count` random items from `items` and return their IDs. */
function pickRandomIds(items: { id: string }[], count: number): string[] {
  if (count >= items.length) return items.map((i) => i.id)
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((i) => i.id)
}

function randomizeSelectedCaseIds(scenario: ScenarioRecord): string[] {
  if (scenario.id !== TROLLEY_SCENARIO_ID) {
    return []
  }

  return [
    ...trolleyFixedCaseIds,
    ...pickRandomIds(
      trolleyRandomCaseIds.map((id) => ({ id })),
      2,
    ),
  ]
}

export function randomizeInfoAssignment(
  scenario: ScenarioRecord,
): InfoAssignment {
  const roleAInfo = parseHiddenInfo(scenario.roleAHiddenInfo)
  const roleBInfo = parseHiddenInfo(scenario.roleBHiddenInfo)
  const roleAReqs = parseRequests(scenario.roleARequests)
  const roleBReqs = parseRequests(scenario.roleBRequests)

  return infoAssignmentSchema.parse({
    roleAFalseInfoIds: pickRandomIds(roleAInfo, scenario.falseInfoCount),
    roleATrueRequestIds: pickRandomIds(roleAReqs, scenario.trueRequestCount),
    roleBFalseInfoIds: pickRandomIds(roleBInfo, scenario.falseInfoCount),
    roleBTrueRequestIds: pickRandomIds(roleBReqs, scenario.trueRequestCount),
    selectedCaseIds: randomizeSelectedCaseIds(scenario),
  })
}

// ── Template interpolation ──────────────────────────────────────────────────

function interpolateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in vars ? vars[key] : match
  })
}

function buildHiddenInfoText(
  items: HiddenInfoItem[],
  falseIds: string[],
): string {
  return items
    .map((item) => {
      const label = falseIds.includes(item.id) ? '假' : '真'
      return `- ${item.id}（${label}）：${item.content}`
    })
    .join('\n')
}

function buildRequestsText(items: RequestItem[], trueIds: string[]): string {
  return items
    .map((item) => {
      if (trueIds.includes(item.id)) {
        return `- ${item.id}（真 — 你真正在意的目标）：${item.content}`
      }
      return `- ${item.id}（假）：${item.content}`
    })
    .join('\n')
}

function buildOpponentRequestsText(items: RequestItem[]): string {
  return items.map((item) => `- ${item.id}：${item.content}`).join('\n')
}

function getSelectedTrolleyCaseIds(assignment: InfoAssignment): string[] {
  return assignment.selectedCaseIds && assignment.selectedCaseIds.length > 0
    ? assignment.selectedCaseIds
    : [...trolleyFixedCaseIds, ...trolleyRandomCaseIds.slice(0, 2)]
}

function buildScenarioCaseVars(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
): Record<string, string> {
  if (scenario.id !== TROLLEY_SCENARIO_ID) {
    return {
      caseId1: '',
      caseId2: '',
      caseId3: '',
      caseCount: '',
      caseTurnCount: String(scenario.turnCount),
      cases: '',
      totalTurnCount: String(scenario.turnCount),
    }
  }

  const selectedCaseIds = getSelectedTrolleyCaseIds(assignment)
  const [caseId1 = '', caseId2 = '', caseId3 = ''] = selectedCaseIds

  return {
    caseId1,
    caseId2,
    caseId3,
    caseCount: String(selectedCaseIds.length),
    caseTurnCount: String(scenario.turnCount),
    cases: formatTrolleyCasesForPrompt(selectedCaseIds),
    totalTurnCount: String(scenario.turnCount * selectedCaseIds.length),
  }
}

export function getScenarioDialogueTurnLimit(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
) {
  if (scenario.id !== TROLLEY_SCENARIO_ID) {
    return scenario.turnCount
  }

  return scenario.turnCount * getSelectedTrolleyCaseIds(assignment).length
}

/** Build the system message for a role agent using the scenario template. */
export function buildAgentSystemMessage(
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
  assignment: InfoAssignment,
): string {
  const isA = roleSide === 'a'
  const myInfo = parseHiddenInfo(
    isA ? scenario.roleAHiddenInfo : scenario.roleBHiddenInfo,
  )
  const myRequests = parseRequests(
    isA ? scenario.roleARequests : scenario.roleBRequests,
  )
  const opponentRequests = parseRequests(
    isA ? scenario.roleBRequests : scenario.roleARequests,
  )
  const myFalseIds = isA
    ? assignment.roleAFalseInfoIds
    : assignment.roleBFalseInfoIds
  const myTrueReqIds = isA
    ? assignment.roleATrueRequestIds
    : assignment.roleBTrueRequestIds

  const opponentInfo = parseHiddenInfo(
    isA ? scenario.roleBHiddenInfo : scenario.roleAHiddenInfo,
  )
  const roleName = isA ? scenario.roleAName : scenario.roleBName
  const opponentName = isA ? scenario.roleBName : scenario.roleAName
  const sideName =
    scenario.id === TROLLEY_SCENARIO_ID ? (isA ? '一人侧' : '五人侧') : roleName
  const opponentSideName =
    scenario.id === TROLLEY_SCENARIO_ID
      ? isA
        ? '五人侧'
        : '一人侧'
      : opponentName

  const vars: Record<string, string> = {
    ...buildScenarioCaseVars(scenario, assignment),
    roleName,
    opponentName,
    sideName,
    opponentSideName,
    roleAName: scenario.roleAName,
    roleBName: scenario.roleBName,
    hiddenInfo: buildHiddenInfoText(myInfo, myFalseIds),
    requests: buildRequestsText(myRequests, myTrueReqIds),
    opponentRequests: buildOpponentRequestsText(opponentRequests),
    opponentInfoIds: opponentInfo.map((i) => i.id).join('/'),
    opponentRequestIds: opponentRequests.map((i) => i.id).join('/'),
    turnCount: String(scenario.turnCount),
  }

  return interpolateTemplate(scenario.agentPromptTemplate, vars)
}

export function buildAgentRuntimeSystemPrompt(
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
  assignment: InfoAssignment,
  userStrategyPrompt: string,
): string {
  const systemPrompt = buildAgentSystemMessage(scenario, roleSide, assignment)
  const trimmedStrategyPrompt = userStrategyPrompt.trim()

  if (trimmedStrategyPrompt.length === 0) {
    return systemPrompt
  }

  return `${systemPrompt}\n\n${trimmedStrategyPrompt}`
}

/** Build the judge prompt with all available variables interpolated. */
export function buildJudgePrompt(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  extras: {
    debate: string
    examinationA: string
    examinationB: string
  },
): string {
  const roleAInfo = parseHiddenInfo(scenario.roleAHiddenInfo)
  const roleBInfo = parseHiddenInfo(scenario.roleBHiddenInfo)
  const roleARequests = parseRequests(scenario.roleARequests)
  const roleBRequests = parseRequests(scenario.roleBRequests)

  const vars: Record<string, string> = {
    ...buildScenarioCaseVars(scenario, assignment),
    roleAName: scenario.roleAName,
    roleBName: scenario.roleBName,
    turnCount: String(scenario.turnCount),
    debate: extras.debate,
    examinationA: extras.examinationA,
    examinationB: extras.examinationB,
    roleARequests: buildRequestsText(
      roleARequests,
      assignment.roleATrueRequestIds,
    ),
    roleAHiddenInfo: buildHiddenInfoText(
      roleAInfo,
      assignment.roleAFalseInfoIds,
    ),
    roleBRequests: buildRequestsText(
      roleBRequests,
      assignment.roleBTrueRequestIds,
    ),
    roleBHiddenInfo: buildHiddenInfoText(
      roleBInfo,
      assignment.roleBFalseInfoIds,
    ),
  }

  // Add per-item LABEL/CONTENT for hidden info
  for (const item of roleAInfo) {
    const isFalse = assignment.roleAFalseInfoIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isFalse ? '子虚乌有' : '确有其事'
    vars[`${item.id}_CONTENT`] = item.content
  }

  for (const item of roleBInfo) {
    const isFalse = assignment.roleBFalseInfoIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isFalse ? '子虚乌有' : '确有其事'
    vars[`${item.id}_CONTENT`] = item.content
  }

  // Add per-item LABEL/CONTENT for requests
  for (const item of roleARequests) {
    const isTrue = assignment.roleATrueRequestIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isTrue ? '真' : '假'
    vars[`${item.id}_CONTENT`] = item.content
  }

  for (const item of roleBRequests) {
    const isTrue = assignment.roleBTrueRequestIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isTrue ? '真' : '假'
    vars[`${item.id}_CONTENT`] = item.content
  }

  return interpolateTemplate(scenario.judgePrompt, vars)
}

// ── Message building ────────────────────────────────────────────────────────

type TrolleyDialogueScope = {
  caseId: string
  caseIndex: number
  caseTranscript: TranscriptTurn[]
  selectedCaseIds: string[]
}

function getTrolleyDialogueScope(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  transcript: TranscriptTurn[],
): TrolleyDialogueScope | null {
  if (scenario.id !== TROLLEY_SCENARIO_ID) {
    return null
  }

  const selectedCaseIds = getSelectedTrolleyCaseIds(assignment)
  const caseIndex = Math.min(
    Math.floor(transcript.length / scenario.turnCount),
    selectedCaseIds.length - 1,
  )
  const startIndex = caseIndex * scenario.turnCount

  return {
    caseId: selectedCaseIds[caseIndex] ?? '',
    caseIndex,
    caseTranscript: transcript.slice(
      startIndex,
      startIndex + scenario.turnCount,
    ),
    selectedCaseIds,
  }
}

function buildTrolleyCaseOpening(
  scenario: ScenarioRecord,
  scope: TrolleyDialogueScope,
) {
  const caseText = formatTrolleyCaseForPrompt(scope.caseId)

  return [
    `现在进入案件 ${scope.caseId}（第 ${scope.caseIndex + 1}/${scope.selectedCaseIds.length} 个入局案件）。`,
    `本案件单独辩论 ${scenario.turnCount} 轮，只围绕当前案件发言；不要把其他案件合并进本案件。`,
    '',
    '=== 当前案件 ===',
    caseText || scope.caseId,
    '',
    `请${scenario.roleAName}先发言。`,
  ].join('\n')
}

function buildDialogueContext(
  transcript: TranscriptTurn[],
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
  assignment: InfoAssignment,
  userStrategyPrompt: string,
  trolleyScope?: TrolleyDialogueScope | null,
) {
  const systemPrompt = buildAgentRuntimeSystemPrompt(
    scenario,
    roleSide,
    assignment,
    userStrategyPrompt,
  )
  const contextTranscript = trolleyScope
    ? trolleyScope.caseTranscript
    : transcript

  const messages: { role: 'user' | 'assistant'; content: string }[] = []

  if (trolleyScope) {
    messages.push({
      role: 'user',
      content: buildTrolleyCaseOpening(scenario, trolleyScope),
    })
  } else if (transcript.length === 0) {
    messages.push({ role: 'user', content: scenario.openingLine })
  }

  messages.push(
    ...contextTranscript.map((turn) => ({
      role:
        turn.speaker === roleSide ? ('assistant' as const) : ('user' as const),
      content: turn.content,
    })),
  )

  return { systemPrompt, messages }
}

function formatTranscript(
  transcript: TranscriptTurn[],
  scenario: ScenarioRecord,
) {
  return transcript
    .map(
      (t, i) =>
        `[第${i + 1}轮] ${t.speaker === 'a' ? scenario.roleAName : scenario.roleBName}：${t.content}`,
    )
    .join('\n\n')
}

export function formatDebateTranscriptForJudge(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  transcript: TranscriptTurn[],
) {
  if (transcript.length === 0) {
    return '（暂无对话）'
  }

  if (scenario.id !== TROLLEY_SCENARIO_ID) {
    return formatTranscript(transcript, scenario)
  }

  const selectedCaseIds = getSelectedTrolleyCaseIds(assignment)

  return selectedCaseIds
    .map((caseId, caseIndex) => {
      const caseInfo = getTrolleyCaseById(caseId)
      const caseTranscript = transcript.slice(
        caseIndex * scenario.turnCount,
        (caseIndex + 1) * scenario.turnCount,
      )

      return [
        `=== 案件 ${caseInfo?.id ?? caseId}. ${caseInfo?.title ?? ''} ===`,
        `案件设定：${caseInfo?.description ?? caseId}`,
        '',
        '本案件辩论记录：',
        caseTranscript.length > 0
          ? formatTranscript(caseTranscript, scenario)
          : '（暂无对话）',
      ].join('\n')
    })
    .join('\n\n')
}

async function getJudgeOsEntry(
  provenance: JudgeOsProvenance,
  request: JudgeOsGenerationRequest,
  traceTarget: Pick<
    ChatCompletionTrace,
    'matchId' | 'playgroundRunId' | 'scenarioId' | 'userId'
  >,
  signal?: AbortSignal,
  completeChat: typeof chatCompletion = chatCompletion,
): Promise<JudgeOsEntry> {
  const judgeModel = parseEvaluationModelId(provenance.model)

  return withRetry(async (attempt) => {
    const response = await completeChat({
      jsonMode: true,
      messages: [
        {
          role: 'user',
          content: buildJudgeOsUserMessage(request),
        },
      ],
      model: judgeModel,
      signal,
      systemPrompt: provenance.systemPrompt,
      temperature: provenance.temperature,
      trace: {
        ...traceTarget,
        attempt,
        phase: 'judge_os',
        side: 'judge',
        turnIndex: request.afterTurn,
      },
    })

    return validateJudgeOsResponse(
      JSON.parse(sanitizeJsonResponse(response)),
      request.afterTurn,
    )
  }, signal)
}

// ── Phase 2: Examination ────────────────────────────────────────────────────

export function buildExaminationQuestion(
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
): string {
  const isA = roleSide === 'a'
  const opponentInfo = getOpponentHiddenInfo(scenario, roleSide)
  const opponentRequests = parseRequests(
    isA ? scenario.roleBRequests : scenario.roleARequests,
  )

  const vars: Record<string, string> = {
    roleName: isA ? scenario.roleAName : scenario.roleBName,
    opponentName: isA ? scenario.roleBName : scenario.roleAName,
    opponentInfoIds: opponentInfo.map((i) => i.id).join('/'),
    opponentRequestIds: opponentRequests.map((i) => i.id).join('/'),
  }

  return interpolateTemplate(scenario.examinationQuestionTemplate, vars)
}

function buildExaminationPrompt(question: string, validIds: string[]) {
  return [
    question,
    '',
    '请严格按 JSON 输出，不要输出额外说明：',
    '{',
    '  "selectedInfoId": "从给定编号中选 1 条",',
    '  "answer": "以当前角色口吻，用中文简要说明理由"',
    '}',
    `selectedInfoId 必须是以下编号之一：${validIds.join(' / ')}`,
  ].join('\n')
}

export function validateExaminationAnswer(
  raw: unknown,
  validInfoIds: string[],
) {
  const parsed = examinationAnswerSchema.parse(raw)

  if (!validInfoIds.includes(parsed.selectedInfoId)) {
    throw new Error(
      `Invalid examination selectedInfoId: ${parsed.selectedInfoId}`,
    )
  }

  return parsed
}

/** Derive valid examination IDs: info IDs if available, else request IDs. */
function getExaminationValidIds(
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
): string[] {
  const opponentInfo = getOpponentHiddenInfo(scenario, roleSide)
  if (opponentInfo.length > 0) return opponentInfo.map((i) => i.id)

  const isA = roleSide === 'a'
  const opponentRequests = parseRequests(
    isA ? scenario.roleBRequests : scenario.roleARequests,
  )
  return opponentRequests.map((i) => i.id)
}

/** Check if the examination answer is "correct" based on available data. */
function checkExaminationCorrectness(
  selectedId: string,
  assignment: InfoAssignment,
  roleSide: 'a' | 'b',
  scenario: ScenarioRecord,
): boolean {
  // If opponent has hidden info, correct = selected a false info
  const opponentInfo = getOpponentHiddenInfo(scenario, roleSide)
  if (opponentInfo.length > 0) {
    return getOpponentFalseInfoIds(assignment, roleSide).includes(selectedId)
  }

  // If opponent only has requests, correct = selected the true request
  const isA = roleSide === 'a'
  const opponentTrueReqIds = isA
    ? assignment.roleBTrueRequestIds
    : assignment.roleATrueRequestIds
  return opponentTrueReqIds.includes(selectedId)
}

async function getExaminationAnswer(
  scenario: ScenarioRecord,
  transcript: TranscriptTurn[],
  question: string,
  roleSide: 'a' | 'b',
  assignment: InfoAssignment,
  submissionPrompt: string,
  model: SubmissionModelId,
  traceTarget: Pick<
    ChatCompletionTrace,
    'matchId' | 'playgroundRunId' | 'scenarioId' | 'userId'
  >,
  signal?: AbortSignal,
  completeChat: typeof chatCompletion = chatCompletion,
): Promise<JudgeQA> {
  const validIds = getExaminationValidIds(scenario, roleSide)
  const rawAnswer = await withRetry(async (attempt) => {
    const { systemPrompt, messages } = buildDialogueContext(
      transcript,
      scenario,
      roleSide,
      assignment,
      submissionPrompt,
    )

    messages.push({
      role: 'user',
      content: buildExaminationPrompt(question, validIds),
    })

    const response = await completeChat({
      jsonMode: true,
      messages,
      model,
      systemPrompt,
      temperature: 0,
      signal,
      trace: {
        ...traceTarget,
        attempt,
        phase: 'examination',
        side: roleSide,
        turnIndex: transcript.length,
      },
    })

    return validateExaminationAnswer(
      JSON.parse(sanitizeJsonResponse(response)),
      validIds,
    )
  }, signal)

  return judgeQASchema.parse({
    round: 1,
    question: question.trim(),
    answer: rawAnswer.answer.trim(),
    selectedInfoId: rawAnswer.selectedInfoId,
    isCorrect: checkExaminationCorrectness(
      rawAnswer.selectedInfoId,
      assignment,
      roleSide,
      scenario,
    ),
  })
}

// ── Phase 3: Judge Decision ─────────────────────────────────────────────────

function buildExaminationSummary(roleName: string, examination: JudgeQA[]) {
  if (examination.length === 0) {
    return `【${roleName}】未完成问询。`
  }

  return examination
    .map((item) =>
      [
        `【${roleName}】`,
        `- 指认编号：${item.selectedInfoId ?? '未作答'}`,
        `- 系统判定：${item.isCorrect == null ? '未判定' : item.isCorrect ? '正确' : '错误'}`,
        `- 回答：${item.answer}`,
      ].join('\n'),
    )
    .join('\n\n')
}

async function getJudgeDecision(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  transcript: TranscriptTurn[],
  examinationA: JudgeQA[],
  examinationB: JudgeQA[],
  traceTarget: Pick<
    ChatCompletionTrace,
    'matchId' | 'playgroundRunId' | 'scenarioId' | 'userId'
  >,
  signal?: AbortSignal,
  completeChat: typeof chatCompletion = chatCompletion,
): Promise<string> {
  const debateText = formatDebateTranscriptForJudge(
    scenario,
    assignment,
    transcript,
  )

  const examinationAText = buildExaminationSummary(
    scenario.roleAName,
    examinationA,
  )
  const examinationBText = buildExaminationSummary(
    scenario.roleBName,
    examinationB,
  )

  const judgePrompt = buildJudgePrompt(scenario, assignment, {
    debate: debateText,
    examinationA: examinationAText,
    examinationB: examinationBText,
  })
  const judgeModel = parseEvaluationModelId(
    scenario.judgeModel ?? DEFAULT_JUDGE_MODEL,
  )

  const raw = await withRetry(async (attempt) => {
    return await completeChat({
      messages: [{ role: 'user', content: '请做出你的裁决。' }],
      model: judgeModel,
      signal,
      systemPrompt: judgePrompt,
      temperature: 0,
      trace: {
        ...traceTarget,
        attempt,
        phase: 'judgment',
        side: 'judge',
        turnIndex: transcript.length,
      },
    })
  }, signal)

  return raw.trim()
}

// ── Phase 4: Scorer ─────────────────────────────────────────────────────────

function buildScorerPrompt(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  extras: {
    judgeOutput: string
    debate: string
    examinationA: string
    examinationB: string
  },
): string {
  const roleAInfo = parseHiddenInfo(scenario.roleAHiddenInfo)
  const roleBInfo = parseHiddenInfo(scenario.roleBHiddenInfo)
  const roleARequests = parseRequests(scenario.roleARequests)
  const roleBRequests = parseRequests(scenario.roleBRequests)

  const vars: Record<string, string> = {
    ...buildScenarioCaseVars(scenario, assignment),
    roleAName: scenario.roleAName,
    roleBName: scenario.roleBName,
    judgeOutput: extras.judgeOutput,
    infoAssignment: JSON.stringify(assignment, null, 2),
    debate: extras.debate,
    examinationA: extras.examinationA,
    examinationB: extras.examinationB,
    roleARequests: buildRequestsText(
      roleARequests,
      assignment.roleATrueRequestIds,
    ),
    roleAHiddenInfo: buildHiddenInfoText(
      roleAInfo,
      assignment.roleAFalseInfoIds,
    ),
    roleBRequests: buildRequestsText(
      roleBRequests,
      assignment.roleBTrueRequestIds,
    ),
    roleBHiddenInfo: buildHiddenInfoText(
      roleBInfo,
      assignment.roleBFalseInfoIds,
    ),
  }

  // Add per-item LABEL/CONTENT
  for (const item of roleAInfo) {
    const isFalse = assignment.roleAFalseInfoIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isFalse ? '子虚乌有' : '确有其事'
    vars[`${item.id}_CONTENT`] = item.content
  }
  for (const item of roleBInfo) {
    const isFalse = assignment.roleBFalseInfoIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isFalse ? '子虚乌有' : '确有其事'
    vars[`${item.id}_CONTENT`] = item.content
  }
  for (const item of roleARequests) {
    const isTrue = assignment.roleATrueRequestIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isTrue ? '真' : '假'
    vars[`${item.id}_CONTENT`] = item.content
  }
  for (const item of roleBRequests) {
    const isTrue = assignment.roleBTrueRequestIds.includes(item.id)
    vars[`${item.id}_LABEL`] = isTrue ? '真' : '假'
    vars[`${item.id}_CONTENT`] = item.content
  }

  return interpolateTemplate(scenario.scorerPrompt, vars)
}

async function getScoreFromScorer(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  judgeOutput: string,
  transcript: TranscriptTurn[],
  examinationA: JudgeQA[],
  examinationB: JudgeQA[],
  traceTarget: Pick<
    ChatCompletionTrace,
    'matchId' | 'playgroundRunId' | 'scenarioId' | 'userId'
  >,
  signal?: AbortSignal,
  completeChat: typeof chatCompletion = chatCompletion,
): Promise<{
  scoreA: number
  scoreB: number
  reasoning: string
  winner: 'a' | 'b' | 'draw'
}> {
  const debateText = formatDebateTranscriptForJudge(
    scenario,
    assignment,
    transcript,
  )

  const scorerPrompt = buildScorerPrompt(scenario, assignment, {
    judgeOutput,
    debate: debateText,
    examinationA: buildExaminationSummary(scenario.roleAName, examinationA),
    examinationB: buildExaminationSummary(scenario.roleBName, examinationB),
  })
  const scorerModel = parseEvaluationModelId(
    scenario.scorerModel ?? DEFAULT_SCORER_MODEL,
  )

  const result = await withRetry(async (attempt) => {
    const response = await completeChat({
      jsonMode: true,
      messages: [{ role: 'user', content: '请根据以上信息计算双方得分。' }],
      model: scorerModel,
      signal,
      systemPrompt: scorerPrompt,
      temperature: 0,
      trace: {
        ...traceTarget,
        attempt,
        phase: 'scoring',
        side: 'scorer',
        turnIndex: transcript.length,
      },
    })

    return scorerOutputSchema.parse(JSON.parse(sanitizeJsonResponse(response)))
  }, signal)

  const winner =
    result.scoreA > result.scoreB
      ? 'a'
      : result.scoreB > result.scoreA
        ? 'b'
        : 'draw'

  return {
    scoreA: result.scoreA,
    scoreB: result.scoreB,
    reasoning: result.reasoning,
    winner: matchWinnerSchema.parse(winner),
  }
}

// ── Main execution ──────────────────────────────────────────────────────────

export async function executeMatchSession(
  params: MatchExecutionParams,
): Promise<MatchExecutionResult> {
  const transcript = (params.transcript ?? []).map((item) =>
    transcriptTurnSchema.parse(item),
  )
  const judgeTranscriptA = (params.judgeTranscriptA ?? []).map((item) =>
    judgeQASchema.parse(item),
  )
  const judgeTranscriptB = (params.judgeTranscriptB ?? []).map((item) =>
    judgeQASchema.parse(item),
  )
  const modelA = parseSubmissionModelId(params.modelA)
  const modelB = parseSubmissionModelId(params.modelB)
  const completeChat = params.completeChat ?? chatCompletion

  // Randomize or restore assignment
  const assignment = params.infoAssignment
    ? infoAssignmentSchema.parse(params.infoAssignment)
    : randomizeInfoAssignment(params.scenario)

  throwIfPlaygroundRunInterrupted(params.signal)
  await params.onStart?.()
  throwIfPlaygroundRunInterrupted(params.signal)
  await params.onInfoAssignment?.(assignment)
  throwIfPlaygroundRunInterrupted(params.signal)

  const dialogueTurnLimit = getScenarioDialogueTurnLimit(
    params.scenario,
    assignment,
  )
  const configuredJudgeOs =
    params.scenario.id === SHANGYANG_JUDGE_OS_SCENARIO_ID &&
    params.scenario.judgeOsPrompt.trim().length > 0
  const persistedJudgeOsProvenance = judgeOsProvenanceSchema.safeParse(
    params.judgeOsProvenance,
  )
  const judgeOsProvenance =
    params.scenario.id === SHANGYANG_JUDGE_OS_SCENARIO_ID
      ? ((persistedJudgeOsProvenance.success
          ? persistedJudgeOsProvenance.data
          : null) ??
        (configuredJudgeOs
          ? buildJudgeOsProvenance({
              dialogueTurnCount: dialogueTurnLimit,
              model: params.scenario.judgeModel ?? DEFAULT_JUDGE_MODEL,
              systemPrompt: params.scenario.judgeOsPrompt,
            })
          : null))
      : null

  if (judgeOsProvenance && !persistedJudgeOsProvenance.success) {
    try {
      void Promise.resolve(
        params.onJudgeOsProvenance?.(judgeOsProvenance),
      ).catch(() => undefined)
    } catch {
      // Provenance is persisted again with the final result. Judge OS metadata
      // must not block the debate or final judgment.
    }
  }

  const judgeOsAbortController = new AbortController()
  const judgeOsSignal = params.signal
    ? AbortSignal.any([params.signal, judgeOsAbortController.signal])
    : judgeOsAbortController.signal

  const judgeOsSidecar = createJudgeOsSidecar({
    enabled: judgeOsProvenance !== null,
    generate: (request) => {
      if (!judgeOsProvenance) {
        throw new Error('Judge OS provenance is unavailable')
      }

      return getJudgeOsEntry(
        judgeOsProvenance,
        request,
        {
          matchId: params.matchId,
          playgroundRunId: params.playgroundRunId,
          scenarioId: params.scenario.id,
        },
        judgeOsSignal,
        completeChat,
      )
    },
    initialEntries: params.judgeOs,
    initialFailedTurns: params.judgeOsFailedTurns,
    maxAfterTurnExclusive: dialogueTurnLimit,
    onUpdate: params.onJudgeOsState,
  })

  // Recover any complete dialogue pairs that were persisted before their OS.
  // Scheduling is intentionally not awaited, so resumed dialogue can continue.
  judgeOsSidecar.schedule(transcript)

  try {
    // ── Phase 1: Dialogue ──────────────────────────────────────────────────
    for (
      let turnIndex = transcript.length;
      turnIndex < dialogueTurnLimit;
      turnIndex += 1
    ) {
      throwIfPlaygroundRunInterrupted(params.signal)

      const trolleyScope = getTrolleyDialogueScope(
        params.scenario,
        assignment,
        transcript,
      )
      const speakerTurnIndex = trolleyScope
        ? trolleyScope.caseTranscript.length
        : turnIndex
      const speaker = speakerTurnIndex % 2 === 0 ? 'a' : 'b'
      const { systemPrompt, messages } = buildDialogueContext(
        transcript,
        params.scenario,
        speaker,
        assignment,
        speaker === 'a' ? params.promptA : params.promptB,
        trolleyScope,
      )

      const response = await withRetry(
        (attempt) =>
          completeChat({
            messages,
            model: speaker === 'a' ? modelA : modelB,
            signal: params.signal,
            systemPrompt,
            temperature: 0,
            trace: {
              attempt,
              matchId: params.matchId,
              phase: 'dialogue',
              playgroundRunId: params.playgroundRunId,
              scenarioId: params.scenario.id,
              side: speaker,
              turnIndex,
              userId: speaker === 'a' ? params.userIdA : params.userIdB,
            },
          }),
        params.signal,
      )

      transcript.push(
        transcriptTurnSchema.parse({
          speaker,
          role:
            speaker === 'a'
              ? params.scenario.roleAName
              : params.scenario.roleBName,
          content: response.trim(),
        }),
      )

      await params.onDialogueTurn?.(transcript)
      judgeOsSidecar.schedule(transcript)
      throwIfPlaygroundRunInterrupted(params.signal)
    }

    throwIfPlaygroundRunInterrupted(params.signal)
    await params.onJudgingStart?.(transcript)
    throwIfPlaygroundRunInterrupted(params.signal)

    // ── Phase 2: Examination (optional) ────────────────────────────────────
    const hasExamination =
      params.scenario.examinationQuestionTemplate.trim().length > 0

    if (hasExamination) {
      if (judgeTranscriptA.length === 0) {
        const questionA = buildExaminationQuestion(params.scenario, 'a')
        const answerA = await getExaminationAnswer(
          params.scenario,
          transcript,
          questionA,
          'a',
          assignment,
          params.promptA,
          modelA,
          {
            matchId: params.matchId,
            playgroundRunId: params.playgroundRunId,
            scenarioId: params.scenario.id,
            userId: params.userIdA,
          },
          params.signal,
          completeChat,
        )

        judgeTranscriptA.push(answerA)
        await params.onJudgeTranscriptA?.(judgeTranscriptA)
      }

      if (judgeTranscriptB.length === 0) {
        const questionB = buildExaminationQuestion(params.scenario, 'b')
        const answerB = await getExaminationAnswer(
          params.scenario,
          transcript,
          questionB,
          'b',
          assignment,
          params.promptB,
          modelB,
          {
            matchId: params.matchId,
            playgroundRunId: params.playgroundRunId,
            scenarioId: params.scenario.id,
            userId: params.userIdB,
          },
          params.signal,
          completeChat,
        )

        judgeTranscriptB.push(answerB)
        await params.onJudgeTranscriptB?.(judgeTranscriptB)
      }
    }

    // ── Phase 3: Judge decision (free-form output) ────────────────────────
    const judgeDecision = await getJudgeDecision(
      params.scenario,
      assignment,
      transcript,
      judgeTranscriptA,
      judgeTranscriptB,
      {
        matchId: params.matchId,
        playgroundRunId: params.playgroundRunId,
        scenarioId: params.scenario.id,
      },
      params.signal,
      completeChat,
    )

    // ── Phase 4: Scorer ───────────────────────────────────────────────────
    const programmaticScore = computeProgrammaticScore({
      assignment,
      examinationA: judgeTranscriptA,
      examinationB: judgeTranscriptB,
      judgeOutput: judgeDecision,
      scenario: params.scenario,
    })

    const { scoreA, scoreB, reasoning, winner } =
      programmaticScore ??
      (await getScoreFromScorer(
        params.scenario,
        assignment,
        judgeDecision,
        transcript,
        judgeTranscriptA,
        judgeTranscriptB,
        {
          matchId: params.matchId,
          playgroundRunId: params.playgroundRunId,
          scenarioId: params.scenario.id,
        },
        params.signal,
        completeChat,
      ))

    // Final judging never waits for display-only Judge OS. Join the sidecar only
    // after scoring, and convert any stragglers into ordered unavailable slots.
    const judgeOsState = await judgeOsSidecar.wait({
      onTimeout: () =>
        judgeOsAbortController.abort('Judge OS finalization timeout'),
      timeoutMs: JUDGE_OS_FINALIZE_TIMEOUT_MS,
    })

    return {
      infoAssignment: assignment,
      judgeDecision,
      judgeOs: judgeOsState.entries,
      judgeOsFailedTurns: judgeOsState.failedTurns,
      judgeOsProvenance,
      judgeTranscriptA,
      judgeTranscriptB,
      reasoning,
      scoreA,
      scoreB,
      transcript,
      winner,
    }
  } catch (error) {
    // The session failed or was interrupted: cancel any in-flight Judge OS
    // generations so they stop consuming LLM quota in the background.
    judgeOsAbortController.abort('Match session ended before Judge OS settled')
    throw error
  }
}
