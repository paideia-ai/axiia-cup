import {
  matchWinnerSchema,
  requestItemSchema,
  scenarioUsesProgrammaticScorer,
  TROLLEY_SCENARIO_ID,
  type InfoAssignment,
  type JudgeQA,
  type ProgrammaticScorerScenarioId,
  type RequestItem,
} from '@axiia/shared'

import type { ScenarioRecord } from '../db/schema'

type Side = 'a' | 'b'

type ProgrammaticScoreParams = {
  assignment: InfoAssignment
  examinationA: JudgeQA[]
  examinationB: JudgeQA[]
  judgeOutput: string
  scenario: ScenarioRecord
}

export type ProgrammaticScoreResult = {
  scoreA: number
  scoreB: number
  reasoning: string
  winner: 'a' | 'b' | 'draw'
}

type StructuredJudgeOutput = {
  judgment: string | null
  judgments: Record<string, string>
  requests: Record<string, string>
  winner: string | null
}

type RequestScoreItem = {
  content: string
  id: string
  isTrue: boolean
  roleName: string
  side: Side
}

type RequestGameConfig = {
  examinationPenalty: number
  majorGoals: {
    a: readonly string[]
    b: readonly string[]
  }
}

type ProgrammaticScorer = (
  params: ProgrammaticScoreParams,
) => ProgrammaticScoreResult

function stripMarkdownCodeFence(raw: string) {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

  return fenced ? fenced[1]!.trim() : trimmed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJsonRecord(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown

    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function extractBalancedObject(text: string, start: number) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }

  return null
}

function extractFirstJsonRecord(text: string) {
  const start = text.indexOf('{')
  if (start < 0) {
    return null
  }

  const objectText = extractBalancedObject(text, start)

  return objectText ? parseJsonRecord(objectText) : null
}

function asString(value: unknown) {
  if (value == null) {
    return null
  }

  return String(value).trim() || null
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const text = asString(entry)
      return text ? [[key, text] as const] : []
    }),
  )
}

function extractStringField(text: string, field: string) {
  const match = text.match(
    new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`),
  )
  if (!match?.[1]) {
    return null
  }

  try {
    return JSON.parse(`"${match[1]}"`) as string
  } catch {
    return match[1]
  }
}

function extractObjectField(text: string, field: string) {
  const fieldMatch = new RegExp(`"${field}"\\s*:`).exec(text)
  if (!fieldMatch) {
    return {}
  }

  const start = text.indexOf('{', fieldMatch.index + fieldMatch[0].length)
  if (start < 0) {
    return {}
  }

  const objectText = extractBalancedObject(text, start)
  const parsed = objectText ? parseJsonRecord(objectText) : null

  return asStringRecord(parsed)
}

function parseStructuredJudgeOutput(raw: string): StructuredJudgeOutput {
  const normalized = stripMarkdownCodeFence(raw)
  const parsed =
    parseJsonRecord(normalized) ?? extractFirstJsonRecord(normalized)

  if (parsed) {
    return {
      judgment: asString(parsed.judgment),
      judgments: asStringRecord(parsed.judgments),
      requests: asStringRecord(parsed.requests),
      winner: asString(parsed.winner),
    }
  }

  const fallback = {
    judgment: extractStringField(normalized, 'judgment'),
    judgments: extractObjectField(normalized, 'judgments'),
    requests: extractObjectField(normalized, 'requests'),
    winner: extractStringField(normalized, 'winner'),
  }

  if (
    fallback.judgment ||
    fallback.winner ||
    Object.keys(fallback.judgments).length > 0 ||
    Object.keys(fallback.requests).length > 0
  ) {
    return fallback
  }

  throw new Error('裁判输出不是可解析的结构化 JSON，无法程序化计分')
}

function parseRequests(jsonText: string): RequestItem[] {
  return requestItemSchema.array().parse(JSON.parse(jsonText))
}

function normalizeScore(score: number) {
  const normalized = Number(score.toFixed(10))
  return Object.is(normalized, -0) ? 0 : normalized
}

function resolveWinner(scoreA: number, scoreB: number) {
  return matchWinnerSchema.parse(
    scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'draw',
  )
}

function findSideForJudgment(
  judgment: string | null,
  config: RequestGameConfig,
) {
  if (!judgment) {
    return null
  }

  const normalized = judgment.trim()

  if (config.majorGoals.a.includes(normalized)) {
    return 'a' as const
  }

  if (config.majorGoals.b.includes(normalized)) {
    return 'b' as const
  }

  return null
}

function getApprovedOutcome(value: string | undefined) {
  if (!value) {
    return false
  }

  if (/不同意|不予同意|未同意|反对|驳回|拒绝|不准|不许|否决/i.test(value)) {
    return false
  }

  return /同意|支持|采纳|准许|批准|通过|允/i.test(value)
}

function buildRequestScoreItems(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
) {
  const items: RequestScoreItem[] = []

  for (const request of parseRequests(scenario.roleARequests)) {
    items.push({
      ...request,
      isTrue: assignment.roleATrueRequestIds.includes(request.id),
      roleName: scenario.roleAName,
      side: 'a',
    })
  }

  for (const request of parseRequests(scenario.roleBRequests)) {
    items.push({
      ...request,
      isTrue: assignment.roleBTrueRequestIds.includes(request.id),
      roleName: scenario.roleBName,
      side: 'b',
    })
  }

  return items
}

function getSelectedExaminationId(examination: JudgeQA[]) {
  return examination[0]?.selectedInfoId?.trim() || null
}

function formatScoreChange(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function computeRequestGameScore(
  params: ProgrammaticScoreParams,
  config: RequestGameConfig,
) {
  const judgeOutput = parseStructuredJudgeOutput(params.judgeOutput)
  const majorGoalSide = findSideForJudgment(judgeOutput.judgment, config)

  if (!majorGoalSide) {
    throw new Error(
      `裁判 judgment 无法识别，无法程序化计分：${judgeOutput.judgment ?? '缺失'}`,
    )
  }

  const score: Record<Side, number> = { a: 0, b: 0 }
  const lines: string[] = []
  const requestItems = buildRequestScoreItems(
    params.scenario,
    params.assignment,
  )
  const requestMap = new Map(requestItems.map((item) => [item.id, item]))
  const majorGoalRoleName =
    majorGoalSide === 'a'
      ? params.scenario.roleAName
      : params.scenario.roleBName

  score[majorGoalSide] += 1
  lines.push(
    `大目标：裁判判定“${judgeOutput.judgment}”，${majorGoalRoleName} +1。`,
  )

  for (const request of requestItems) {
    const outcome = judgeOutput.requests[request.id]
    const isApproved = getApprovedOutcome(outcome)

    if (!isApproved) {
      lines.push(
        `请求 ${request.id}（${request.isTrue ? '真目标' : '假目标'}）：${
          outcome ?? '未裁决'
        }，${request.roleName} 0。`,
      )
      continue
    }

    const delta = request.isTrue ? 0.5 : -0.25
    score[request.side] += delta
    lines.push(
      `请求 ${request.id}（${request.isTrue ? '真目标' : '假目标'}）：同意，${
        request.roleName
      } ${formatScoreChange(delta)}。`,
    )
  }

  for (const [id, outcome] of Object.entries(judgeOutput.requests)) {
    if (!requestMap.has(id) && getApprovedOutcome(outcome)) {
      lines.push(`请求 ${id} 不属于当前入局角色，已忽略。`)
    }
  }

  const selectedByA = getSelectedExaminationId(params.examinationA)
  if (
    selectedByA &&
    params.assignment.roleBTrueRequestIds.includes(selectedByA)
  ) {
    score.b -= config.examinationPenalty
    lines.push(
      `问询：${params.scenario.roleAName} 指认 ${selectedByA}，命中 ${
        params.scenario.roleBName
      } 的真请求，${params.scenario.roleBName} -${config.examinationPenalty}。`,
    )
  } else if (selectedByA) {
    lines.push(
      `问询：${params.scenario.roleAName} 指认 ${selectedByA}，未命中 ${
        params.scenario.roleBName
      } 的真请求，${params.scenario.roleBName} 0。`,
    )
  }

  const selectedByB = getSelectedExaminationId(params.examinationB)
  if (
    selectedByB &&
    params.assignment.roleATrueRequestIds.includes(selectedByB)
  ) {
    score.a -= config.examinationPenalty
    lines.push(
      `问询：${params.scenario.roleBName} 指认 ${selectedByB}，命中 ${
        params.scenario.roleAName
      } 的真请求，${params.scenario.roleAName} -${config.examinationPenalty}。`,
    )
  } else if (selectedByB) {
    lines.push(
      `问询：${params.scenario.roleBName} 指认 ${selectedByB}，未命中 ${
        params.scenario.roleAName
      } 的真请求，${params.scenario.roleAName} 0。`,
    )
  }

  const scoreA = normalizeScore(score.a)
  const scoreB = normalizeScore(score.b)
  lines.push(`总分：scoreA = ${scoreA}, scoreB = ${scoreB}`)

  return {
    scoreA,
    scoreB,
    reasoning: lines.join('\n'),
    winner: resolveWinner(scoreA, scoreB),
  }
}

function computeTrolleyScore(params: ProgrammaticScoreParams) {
  const judgeOutput = parseStructuredJudgeOutput(params.judgeOutput)
  const caseIds = params.assignment.selectedCaseIds?.length
    ? params.assignment.selectedCaseIds
    : Object.keys(judgeOutput.judgments)

  if (caseIds.length === 0) {
    throw new Error('裁判 judgments 缺失，无法程序化计分')
  }

  let scoreA = 0
  let scoreB = 0
  const lines: string[] = []

  for (const caseId of caseIds) {
    const judgment = judgeOutput.judgments[caseId]

    if (judgment === '一人侧') {
      scoreA += 1
      lines.push(
        `案件 ${caseId}：裁判支持一人侧，${params.scenario.roleAName} +1。`,
      )
      continue
    }

    if (judgment === '五人侧') {
      scoreB += 1
      lines.push(
        `案件 ${caseId}：裁判支持五人侧，${params.scenario.roleBName} +1。`,
      )
      continue
    }

    throw new Error(
      `裁判 judgments.${caseId} 无法识别，无法程序化计分：${judgment ?? '缺失'}`,
    )
  }

  lines.push(`总分：scoreA = ${scoreA}, scoreB = ${scoreB}`)

  return {
    scoreA,
    scoreB,
    reasoning: lines.join('\n'),
    winner: resolveWinner(scoreA, scoreB),
  }
}

const programmaticScorers: Record<
  ProgrammaticScorerScenarioId,
  ProgrammaticScorer
> = {
  'honnoji-decision': (params) =>
    computeRequestGameScore(params, {
      examinationPenalty: 0.75,
      majorGoals: {
        a: ['袭击本能寺'],
        b: ['西进毛利'],
      },
    }),
  'shangyang-court': (params) =>
    computeRequestGameScore(params, {
      examinationPenalty: 1,
      majorGoals: {
        a: ['变法', '推行变法', '支持变法'],
        b: ['维持现状'],
      },
    }),
  [TROLLEY_SCENARIO_ID]: computeTrolleyScore,
}

export function computeProgrammaticScore(params: ProgrammaticScoreParams) {
  if (!scenarioUsesProgrammaticScorer(params.scenario.id)) {
    return null
  }

  const scorer =
    programmaticScorers[params.scenario.id as ProgrammaticScorerScenarioId]

  return scorer(params)
}
