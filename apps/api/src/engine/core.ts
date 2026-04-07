import {
  examinationAnswerSchema,
  hiddenInfoItemSchema,
  infoAssignmentSchema,
  judgeDecisionSchema,
  judgeQASchema,
  matchWinnerSchema,
  modelIdSchema,
  requestItemSchema,
  transcriptTurnSchema,
  type HiddenInfoItem,
  type InfoAssignment,
  type JudgeDecision,
  type JudgeQA,
  type ModelId,
  type RequestItem,
  type TranscriptTurn,
} from '@axiia/shared'

import type { ScenarioRecord } from '../db/schema'
import { chatCompletion, type ChatCompletionTrace } from './llm'

const RETRY_COUNT = 3
const RETRY_DELAY_MS = 2000

export const DEFAULT_JUDGE_MODEL = 'deepseek-v3.2' as const satisfies ModelId

type MatchExecutionParams = {
  infoAssignment?: InfoAssignment
  judgeTranscriptA?: JudgeQA[]
  judgeTranscriptB?: JudgeQA[]
  matchId?: number
  modelA: string
  modelB: string
  onDialogueTurn?: (transcript: TranscriptTurn[]) => Promise<void> | void
  onInfoAssignment?: (assignment: InfoAssignment) => Promise<void> | void
  onJudgeTranscriptA?: (judgeTranscriptA: JudgeQA[]) => Promise<void> | void
  onJudgeTranscriptB?: (judgeTranscriptB: JudgeQA[]) => Promise<void> | void
  onJudgingStart?: (transcript: TranscriptTurn[]) => Promise<void> | void
  onStart?: () => Promise<void> | void
  playgroundRunId?: number
  promptA: string
  promptB: string
  scenario: ScenarioRecord
  transcript?: TranscriptTurn[]
}

export type MatchExecutionResult = {
  infoAssignment: InfoAssignment
  judgeDecision: JudgeDecision
  judgeTranscriptA: JudgeQA[]
  judgeTranscriptB: JudgeQA[]
  reasoning: string
  scoreA: number
  scoreB: number
  transcript: TranscriptTurn[]
  winner: 'a' | 'b' | 'draw'
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(task: (attempt: number) => Promise<T>) {
  let lastError: unknown

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      return await task(attempt)
    } catch (error) {
      lastError = error

      if (attempt < RETRY_COUNT) {
        await sleep(RETRY_DELAY_MS)
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unknown engine error')
}

export function parseModelId(value: string) {
  return modelIdSchema.parse(value)
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

function buildRequestCatalogText(items: RequestItem[]): string {
  return items.map((item) => `- [${item.id}] ${item.content}`).join('\n')
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

  const vars: Record<string, string> = {
    roleName: isA ? scenario.roleAName : scenario.roleBName,
    publicIdentity: isA
      ? scenario.roleAPublicIdentity
      : scenario.roleBPublicIdentity,
    mainGoal: isA ? scenario.roleAMainGoal : scenario.roleBMainGoal,
    context: scenario.context,
    hiddenInfo: buildHiddenInfoText(myInfo, myFalseIds),
    requests: buildRequestsText(myRequests, myTrueReqIds),
    opponentName: isA ? scenario.roleBName : scenario.roleAName,
    opponentIdentity: isA
      ? scenario.roleBPublicIdentity
      : scenario.roleAPublicIdentity,
    opponentGoal: isA ? scenario.roleBMainGoal : scenario.roleAMainGoal,
    opponentRequests: buildOpponentRequestsText(opponentRequests),
    turnCount: String(scenario.turnCount),
    judgeName: scenario.judgeName,
    constraints: scenario.boundaryConstraints,
    mainGoalScore: String(scenario.mainGoalScore),
    trueRequestScore: String(scenario.trueRequestScore),
    falseRequestPenalty: String(scenario.falseRequestPenalty),
  }

  return interpolateTemplate(scenario.agentPromptTemplate, vars)
}

/** Build the judge system message with info labels interpolated. */
export function buildJudgeSystemMessage(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
): string {
  const roleAInfo = parseHiddenInfo(scenario.roleAHiddenInfo)
  const roleBInfo = parseHiddenInfo(scenario.roleBHiddenInfo)
  const roleARequests = parseRequests(scenario.roleARequests)
  const roleBRequests = parseRequests(scenario.roleBRequests)

  const vars: Record<string, string> = {
    context: scenario.context,
    judgeName: scenario.judgeName,
    constraints: scenario.boundaryConstraints,
    turnCount: String(scenario.turnCount),
    mainGoalScore: String(scenario.mainGoalScore),
    trueRequestScore: String(scenario.trueRequestScore),
    falseRequestPenalty: String(scenario.falseRequestPenalty),
    roleAName: scenario.roleAName,
    roleAPublicIdentity: scenario.roleAPublicIdentity,
    roleAMainGoal: scenario.roleAMainGoal,
    roleAStance: scenario.roleAStance,
    roleARequests: buildRequestCatalogText(roleARequests),
    roleAHiddenInfo: buildHiddenInfoText(
      roleAInfo,
      assignment.roleAFalseInfoIds,
    ),
    roleBName: scenario.roleBName,
    roleBPublicIdentity: scenario.roleBPublicIdentity,
    roleBMainGoal: scenario.roleBMainGoal,
    roleBStance: scenario.roleBStance,
    roleBRequests: buildRequestCatalogText(roleBRequests),
    roleBHiddenInfo: buildHiddenInfoText(
      roleBInfo,
      assignment.roleBFalseInfoIds,
    ),
  }

  // Add S1_LABEL, S1_CONTENT, etc.
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

  return interpolateTemplate(scenario.judgePrompt, vars)
}

// ── Message building ────────────────────────────────────────────────────────

function buildDialogueContext(
  transcript: TranscriptTurn[],
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
  assignment: InfoAssignment,
  userStrategyPrompt: string,
) {
  const systemPrompt = buildAgentSystemMessage(scenario, roleSide, assignment)

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: userStrategyPrompt },
    ...transcript.map((turn) => ({
      role:
        turn.speaker === roleSide ? ('assistant' as const) : ('user' as const),
      content: turn.content,
    })),
  ]

  if (transcript.length === 0) {
    messages.push({ role: 'user', content: scenario.openingLine })
  }

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

// ── Phase 2: Examination ────────────────────────────────────────────────────

export function buildExaminationQuestion(
  scenario: ScenarioRecord,
  roleSide: 'a' | 'b',
): string {
  const isA = roleSide === 'a'
  const opponentInfo = getOpponentHiddenInfo(scenario, roleSide)
  const opponentInfoIds = opponentInfo.map((i) => i.id).join('/')

  const vars: Record<string, string> = {
    roleName: isA ? scenario.roleAName : scenario.roleBName,
    opponentName: isA ? scenario.roleBName : scenario.roleAName,
    opponentInfoIds,
    judgeName: scenario.judgeName,
  }

  return interpolateTemplate(scenario.examinationQuestionTemplate, vars)
}

function buildExaminationPrompt(
  judgeName: string,
  question: string,
  validInfoIds: string[],
) {
  return [
    `【${judgeName}问询】${question}`,
    '',
    '请严格按 JSON 输出，不要输出额外说明：',
    '{',
    '  "selectedInfoId": "从给定编号中选 1 条",',
    '  "answer": "以当前角色口吻，用中文简要说明理由"',
    '}',
    `selectedInfoId 必须是以下编号之一：${validInfoIds.join(' / ')}`,
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

async function getExaminationAnswer(
  scenario: ScenarioRecord,
  transcript: TranscriptTurn[],
  question: string,
  roleSide: 'a' | 'b',
  assignment: InfoAssignment,
  submissionPrompt: string,
  model: ModelId,
  traceTarget: Pick<ChatCompletionTrace, 'matchId' | 'playgroundRunId'>,
): Promise<JudgeQA> {
  const validInfoIds = getOpponentHiddenInfo(scenario, roleSide).map(
    (item) => item.id,
  )
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
      content: buildExaminationPrompt(
        scenario.judgeName,
        question,
        validInfoIds,
      ),
    })

    const response = await chatCompletion({
      jsonMode: true,
      messages,
      model,
      systemPrompt,
      temperature: 0,
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
      validInfoIds,
    )
  })

  return judgeQASchema.parse({
    round: 1,
    question: question.trim(),
    answer: rawAnswer.answer.trim(),
    selectedInfoId: rawAnswer.selectedInfoId,
    isCorrect: getOpponentFalseInfoIds(assignment, roleSide).includes(
      rawAnswer.selectedInfoId,
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

export function validateJudgeDecision(
  scenario: ScenarioRecord,
  raw: unknown,
): JudgeDecision {
  const decision = judgeDecisionSchema.parse(raw)
  const validJudgments = new Set([scenario.roleAStance, scenario.roleBStance])

  if (!validJudgments.has(decision.judgment)) {
    throw new Error(`Invalid judgment: ${decision.judgment}`)
  }

  const requestIds = [
    ...parseRequests(scenario.roleARequests).map((request) => request.id),
    ...parseRequests(scenario.roleBRequests).map((request) => request.id),
  ]
  const expectedRequestIds = new Set(requestIds)
  const actualRequestIds = Object.keys(decision.requests)
  const missingRequestIds = requestIds.filter(
    (id) => !(id in decision.requests),
  )
  const extraRequestIds = actualRequestIds.filter(
    (id) => !expectedRequestIds.has(id),
  )

  if (missingRequestIds.length > 0 || extraRequestIds.length > 0) {
    throw new Error(
      `Judge request decisions mismatch (missing: ${missingRequestIds.join(', ') || 'none'}; extra: ${extraRequestIds.join(', ') || 'none'})`,
    )
  }

  return decision
}

async function getJudgeDecision(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  transcript: TranscriptTurn[],
  examinationA: JudgeQA[],
  examinationB: JudgeQA[],
  traceTarget: Pick<ChatCompletionTrace, 'matchId' | 'playgroundRunId'>,
): Promise<JudgeDecision> {
  const transcriptText =
    transcript.length > 0
      ? formatTranscript(transcript, scenario)
      : '（暂无对话）'

  const examinationAText = buildExaminationSummary(
    scenario.roleAName,
    examinationA,
  )
  const examinationBText = buildExaminationSummary(
    scenario.roleBName,
    examinationB,
  )

  const roleAReqs = parseRequests(scenario.roleARequests)
  const roleBReqs = parseRequests(scenario.roleBRequests)

  const roleAReqList = buildRequestCatalogText(roleAReqs)
  const roleBReqList = buildRequestCatalogText(roleBReqs)
  const decisionShape = [...roleAReqs, ...roleBReqs]
    .map((request) => `    "${request.id}": "同意" 或 "不同意"`)
    .join(',\n')

  const prompt = [
    `=== 朝堂辩论记录 ===`,
    transcriptText,
    '',
    `=== 问询结果（以下“系统判定”已由系统根据本局真相计算） ===`,
    examinationAText,
    '',
    examinationBText,
    '',
    `=== 【${scenario.roleAName}】的请求（ID 与内容） ===`,
    roleAReqList,
    '',
    `=== 【${scenario.roleBName}】的请求（ID 与内容） ===`,
    roleBReqList,
    '',
    `请做出你的最终裁决。严格按以下 JSON 格式输出，不要其他内容：`,
    `{`,
    `  "judgment": "${scenario.roleAStance}" 或 "${scenario.roleBStance}",`,
    `  "requests": {`,
    decisionShape,
    `  },`,
    `  "speech": "（你的完整判决词）"`,
    `}`,
    '',
    '注意：`requests` 中的 key 必须与上面列出的请求 ID 完全一致，不能遗漏，也不能新增其他 key。',
  ].join('\n')

  const judgeSystemMessage = buildJudgeSystemMessage(scenario, assignment)
  const judgeModel = parseModelId(scenario.judgeModel ?? DEFAULT_JUDGE_MODEL)

  const raw = await withRetry(async (attempt) => {
    const response = await chatCompletion({
      jsonMode: true,
      messages: [{ role: 'user', content: prompt }],
      model: judgeModel,
      systemPrompt: judgeSystemMessage,
      temperature: 0,
      trace: {
        ...traceTarget,
        attempt,
        phase: 'judgment',
        side: 'judge',
        turnIndex: transcript.length,
      },
    })

    return validateJudgeDecision(
      scenario,
      JSON.parse(sanitizeJsonResponse(response)),
    )
  })

  return raw
}

// ── Score computation ───────────────────────────────────────────────────────

export function computeScores(
  decision: JudgeDecision,
  assignment: InfoAssignment,
  scenario: ScenarioRecord,
): { scoreA: number; scoreB: number; winner: 'a' | 'b' | 'draw' } {
  let scoreA = 0
  let scoreB = 0

  // Main goal
  if (decision.judgment === scenario.roleAStance) {
    scoreA += scenario.mainGoalScore
  } else if (decision.judgment === scenario.roleBStance) {
    scoreB += scenario.mainGoalScore
  }

  // Role A requests
  const roleAReqs = parseRequests(scenario.roleARequests)
  for (const req of roleAReqs) {
    if (decision.requests[req.id] === '同意') {
      if (assignment.roleATrueRequestIds.includes(req.id)) {
        scoreA += scenario.trueRequestScore
      } else {
        scoreA += scenario.falseRequestPenalty
      }
    }
  }

  // Role B requests
  const roleBReqs = parseRequests(scenario.roleBRequests)
  for (const req of roleBReqs) {
    if (decision.requests[req.id] === '同意') {
      if (assignment.roleBTrueRequestIds.includes(req.id)) {
        scoreB += scenario.trueRequestScore
      } else {
        scoreB += scenario.falseRequestPenalty
      }
    }
  }

  const winner = scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'draw'

  return { scoreA, scoreB, winner: matchWinnerSchema.parse(winner) }
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
  const modelA = parseModelId(params.modelA)
  const modelB = parseModelId(params.modelB)

  // Randomize or restore assignment
  const assignment = params.infoAssignment
    ? infoAssignmentSchema.parse(params.infoAssignment)
    : randomizeInfoAssignment(params.scenario)

  await params.onStart?.()
  await params.onInfoAssignment?.(assignment)

  // ── Phase 1: Dialogue ──────────────────────────────────────────────────
  for (
    let turnIndex = transcript.length;
    turnIndex < params.scenario.turnCount;
    turnIndex += 1
  ) {
    const speaker = turnIndex % 2 === 0 ? 'a' : 'b'
    const { systemPrompt, messages } = buildDialogueContext(
      transcript,
      params.scenario,
      speaker,
      assignment,
      speaker === 'a' ? params.promptA : params.promptB,
    )

    const response = await withRetry((attempt) =>
      chatCompletion({
        messages,
        model: speaker === 'a' ? modelA : modelB,
        systemPrompt,
        temperature: 0,
        trace: {
          attempt,
          matchId: params.matchId,
          phase: 'dialogue',
          playgroundRunId: params.playgroundRunId,
          side: speaker,
          turnIndex,
        },
      }),
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
  }

  await params.onJudgingStart?.(transcript)

  // ── Phase 2: Examination — fixed "identify the lie" question ───────────
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
      },
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
      },
    )

    judgeTranscriptB.push(answerB)
    await params.onJudgeTranscriptB?.(judgeTranscriptB)
  }

  // ── Phase 3: Judge decision ────────────────────────────────────────────
  const judgeDecision = await getJudgeDecision(
    params.scenario,
    assignment,
    transcript,
    judgeTranscriptA,
    judgeTranscriptB,
    {
      matchId: params.matchId,
      playgroundRunId: params.playgroundRunId,
    },
  )

  const { scoreA, scoreB, winner } = computeScores(
    judgeDecision,
    assignment,
    params.scenario,
  )

  return {
    infoAssignment: assignment,
    judgeDecision,
    judgeTranscriptA,
    judgeTranscriptB,
    reasoning: judgeDecision.speech,
    scoreA,
    scoreB,
    transcript,
    winner,
  }
}
