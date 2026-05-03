import { z } from 'zod'

import { evaluationModelIds, modelIds, submissionModelIds } from './constants'

export const modelIdSchema = z.enum(modelIds)
export const submissionModelIdSchema = z.enum(submissionModelIds)
export const evaluationModelIdSchema = z.enum(evaluationModelIds)
export const tournamentStatusSchema = z.enum([
  'open',
  'running',
  'finished',
  'terminated',
])
export const roundStatusSchema = z.enum(['pairing', 'running', 'done'])
export const matchStatusSchema = z.enum([
  'queued',
  'running',
  'judging',
  'scored',
  'error',
])
export const matchWinnerSchema = z.enum(['a', 'b', 'draw'])

// ── Scenario structured data ────────────────────────────────────────────────

const templateVariableIdPattern = /^[A-Za-z][A-Za-z0-9_]*$/

const hiddenInfoIdSchema = z
  .string()
  .trim()
  .regex(
    templateVariableIdPattern,
    '隐藏信息 ID 仅支持字母、数字和下划线，且需以字母开头',
  )

const requestIdSchema = z
  .string()
  .trim()
  .regex(
    templateVariableIdPattern,
    '请求 ID 仅支持字母、数字和下划线，且需以字母开头',
  )

export const hiddenInfoItemSchema = z.object({
  id: hiddenInfoIdSchema,
  content: z.string().trim().min(1),
})

export const requestItemSchema = z.object({
  id: requestIdSchema,
  content: z.string().trim().min(1),
})

export const roleOptionSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(
      templateVariableIdPattern,
      '角色选项 ID 仅支持字母、数字和下划线，且需以字母开头',
    ),
  name: z.string().trim().min(1),
  requests: z.array(requestItemSchema),
})

// ── Per-match randomization result ──────────────────────────────────────────

export const infoAssignmentSchema = z.object({
  roleAFalseInfoIds: z.array(z.string()),
  roleBFalseInfoIds: z.array(z.string()),
  roleATrueRequestIds: z.array(z.string()),
  roleBTrueRequestIds: z.array(z.string()),
})

// ── Judge decision — free-form text, structure controlled by admin's prompt ──

export const judgeDecisionSchema = z.string()

// ── Scorer output — the only engine-validated LLM output ────────────────────

export const scorerOutputSchema = z.object({
  scoreA: z.number(),
  scoreB: z.number(),
  reasoning: z.string().optional().default(''),
})

export const examinationAnswerSchema = z.object({
  selectedInfoId: z.string().trim().min(1),
  answer: z.string().trim().min(1),
})

// ── Common schemas ──────────────────────────────────────────────────────────

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  isAdmin: z.boolean(),
})

export const adminUserSchema = userSchema.extend({
  createdAt: z.string(),
  disabled: z.boolean(),
})

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6),
})

export const okResponseSchema = z.object({
  ok: z.literal(true),
})

export const registrationCodeResponseSchema = z.object({
  code: z.string(),
})

export const updateRegistrationCodeSchema = z.object({
  code: z.string().trim().min(1),
})

export const tokenSoftCapResponseSchema = z.object({
  cap: z.number().int().positive(),
})

export const updateTokenSoftCapSchema = z.object({
  cap: z.number().int().positive().max(100_000_000),
})

function validateUniqueIds(
  items: { id: string }[],
  path: string,
  context: z.RefinementCtx,
) {
  const seen = new Set<string>()

  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${path} 中存在重复 ID：${item.id}`,
        path: [path, index, 'id'],
      })
      return
    }

    seen.add(item.id)
  })

  return seen
}

function validateScenarioProtocol(
  scenario: {
    falseInfoCount: number
    roleAHiddenInfo: { id: string }[]
    roleAOptions: { id: string; requests: { id: string }[] }[]
    roleARequests: { id: string }[]
    roleBHiddenInfo: { id: string }[]
    roleBOptions: { id: string; requests: { id: string }[] }[]
    roleBRequests: { id: string }[]
    trueRequestCount: number
  },
  context: z.RefinementCtx,
) {
  const roleAInfoIds = validateUniqueIds(
    scenario.roleAHiddenInfo,
    'roleAHiddenInfo',
    context,
  )
  const roleBInfoIds = validateUniqueIds(
    scenario.roleBHiddenInfo,
    'roleBHiddenInfo',
    context,
  )
  const roleARequestIds = validateUniqueIds(
    scenario.roleARequests,
    'roleARequests',
    context,
  )
  const roleBRequestIds = validateUniqueIds(
    scenario.roleBRequests,
    'roleBRequests',
    context,
  )
  validateUniqueIds(scenario.roleAOptions, 'roleAOptions', context)
  validateUniqueIds(scenario.roleBOptions, 'roleBOptions', context)

  if (scenario.roleAOptions.length > 0 && scenario.roleBOptions.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: '使用角色选项时，角色 B 也必须配置选项',
      path: ['roleBOptions'],
    })
  }

  if (scenario.roleBOptions.length > 0 && scenario.roleAOptions.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: '使用角色选项时，角色 A 也必须配置选项',
      path: ['roleAOptions'],
    })
  }

  const roleAOptionRequestIds = new Set<string>()
  scenario.roleAOptions.forEach((option, optionIndex) => {
    const seen = new Set<string>()

    option.requests.forEach((request, requestIndex) => {
      if (seen.has(request.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${option.id} 中存在重复请求 ID：${request.id}`,
          path: ['roleAOptions', optionIndex, 'requests', requestIndex, 'id'],
        })
      }

      seen.add(request.id)

      if (roleAOptionRequestIds.has(request.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `roleAOptions 中请求 ID 不能重复：${request.id}`,
          path: ['roleAOptions', optionIndex, 'requests', requestIndex, 'id'],
        })
      }

      roleAOptionRequestIds.add(request.id)
    })
  })

  const roleBOptionRequestIds = new Set<string>()
  scenario.roleBOptions.forEach((option, optionIndex) => {
    const seen = new Set<string>()

    option.requests.forEach((request, requestIndex) => {
      if (seen.has(request.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${option.id} 中存在重复请求 ID：${request.id}`,
          path: ['roleBOptions', optionIndex, 'requests', requestIndex, 'id'],
        })
      }

      seen.add(request.id)

      if (roleBOptionRequestIds.has(request.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `roleBOptions 中请求 ID 不能重复：${request.id}`,
          path: ['roleBOptions', optionIndex, 'requests', requestIndex, 'id'],
        })
      }

      roleBOptionRequestIds.add(request.id)
    })
  })

  for (const requestId of roleAOptionRequestIds) {
    if (roleBOptionRequestIds.has(requestId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `roleAOptions 和 roleBOptions 不能复用同一请求 ID：${requestId}`,
        path: ['roleBOptions'],
      })
    }
  }

  if (roleAInfoIds && roleBInfoIds) {
    scenario.roleBHiddenInfo.forEach((item, index) => {
      if (roleAInfoIds.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `roleAHiddenInfo 和 roleBHiddenInfo 不能复用同一 ID：${item.id}`,
          path: ['roleBHiddenInfo', index, 'id'],
        })
      }
    })
  }

  if (roleARequestIds && roleBRequestIds) {
    scenario.roleBRequests.forEach((item, index) => {
      if (roleARequestIds.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `roleARequests 和 roleBRequests 不能复用同一 ID：${item.id}`,
          path: ['roleBRequests', index, 'id'],
        })
      }
    })
  }

  if (roleAInfoIds && roleBInfoIds) {
    const allHiddenInfoIds = new Set([...roleAInfoIds, ...roleBInfoIds])

    scenario.roleARequests.forEach((item, index) => {
      if (allHiddenInfoIds.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `隐藏信息 ID 和请求 ID 不能复用同一 ID：${item.id}`,
          path: ['roleARequests', index, 'id'],
        })
      }
    })

    scenario.roleBRequests.forEach((item, index) => {
      if (allHiddenInfoIds.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `隐藏信息 ID 和请求 ID 不能复用同一 ID：${item.id}`,
          path: ['roleBRequests', index, 'id'],
        })
      }
    })
  }

  if (
    scenario.roleAHiddenInfo.length > 0 &&
    scenario.falseInfoCount > scenario.roleAHiddenInfo.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'falseInfoCount 不能超过角色 A 的隐藏信息数量',
      path: ['falseInfoCount'],
    })
  }

  if (
    scenario.roleBHiddenInfo.length > 0 &&
    scenario.falseInfoCount > scenario.roleBHiddenInfo.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'falseInfoCount 不能超过角色 B 的隐藏信息数量',
      path: ['falseInfoCount'],
    })
  }

  if (
    scenario.roleARequests.length > 0 &&
    scenario.trueRequestCount > scenario.roleARequests.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'trueRequestCount 不能超过角色 A 的请求数量',
      path: ['trueRequestCount'],
    })
  }

  scenario.roleAOptions.forEach((option, index) => {
    if (scenario.trueRequestCount > option.requests.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${option.id} 的请求数量不能少于 trueRequestCount`,
        path: ['roleAOptions', index, 'requests'],
      })
    }
  })

  if (
    scenario.roleBRequests.length > 0 &&
    scenario.trueRequestCount > scenario.roleBRequests.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'trueRequestCount 不能超过角色 B 的请求数量',
      path: ['trueRequestCount'],
    })
  }

  scenario.roleBOptions.forEach((option, index) => {
    if (scenario.trueRequestCount > option.requests.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${option.id} 的请求数量不能少于 trueRequestCount`,
        path: ['roleBOptions', index, 'requests'],
      })
    }
  })
}

// ── Scenario ────────────────────────────────────────────────────────────────

const scenarioBaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  turnCount: z.number().int().positive(),
  judgeModel: evaluationModelIdSchema,
  scorerModel: evaluationModelIdSchema,
  openingLine: z.string(),
  // Prompt templates (admin-controlled)
  agentPromptTemplate: z.string(),
  examinationQuestionTemplate: z.string(),
  judgePrompt: z.string(),
  scorerPrompt: z.string(),
  // Role A
  roleAName: z.string(),
  roleAHiddenInfo: z.array(hiddenInfoItemSchema),
  roleAOptions: z.array(roleOptionSchema),
  roleARequests: z.array(requestItemSchema),
  // Role B
  roleBName: z.string(),
  roleBHiddenInfo: z.array(hiddenInfoItemSchema),
  roleBOptions: z.array(roleOptionSchema),
  roleBRequests: z.array(requestItemSchema),
  // Randomization config
  falseInfoCount: z.number().int().nonnegative(),
  trueRequestCount: z.number().int().nonnegative(),
})

export const scenarioSchema = scenarioBaseSchema.superRefine(
  (scenario, context) => {
    validateScenarioProtocol(scenario, context)
  },
)

const updateScenarioBaseSchema = z.object({
  turnCount: z.number().int().min(1).max(50),
  judgeModel: evaluationModelIdSchema,
  scorerModel: evaluationModelIdSchema,
  openingLine: z.string().min(1),
  // Prompt templates
  agentPromptTemplate: z.string().min(1),
  examinationQuestionTemplate: z.string(), // empty = skip examination
  judgePrompt: z.string().min(1),
  scorerPrompt: z.string().min(1),
  // Roles
  roleAName: z.string().min(1),
  roleAHiddenInfo: z.array(hiddenInfoItemSchema),
  roleAOptions: z.array(roleOptionSchema),
  roleARequests: z.array(requestItemSchema),
  roleBName: z.string().min(1),
  roleBHiddenInfo: z.array(hiddenInfoItemSchema),
  roleBOptions: z.array(roleOptionSchema),
  roleBRequests: z.array(requestItemSchema),
  // Randomization
  falseInfoCount: z.number().int().nonnegative(),
  trueRequestCount: z.number().int().nonnegative(),
})

export const updateScenarioSchema = updateScenarioBaseSchema.superRefine(
  (scenario, context) => {
    validateScenarioProtocol(scenario, context)
  },
)

export const adminScenarioSchema = scenarioBaseSchema
  .extend({
    locked: z.boolean(),
  })
  .superRefine((scenario, context) => {
    validateScenarioProtocol(scenario, context)
  })

export const modelOptionSchema = z.object({
  id: modelIdSchema,
  label: z.string(),
})

export const scenarioSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  summary: z.string(),
  turnCount: z.number().int().positive(),
  roleAName: z.string(),
  roleBName: z.string(),
})

export const leaderboardEntrySchema = z.object({
  submissionId: z.number().int().positive(),
  rank: z.number().int().positive(),
  playerName: z.string(),
  modelA: z.string(),
  modelB: z.string(),
  modelLabel: z.string(),
  wins: z.number().nonnegative(),
  losses: z.number().int().nonnegative(),
  roleAWins: z.number().nonnegative(),
  roleALosses: z.number().int().nonnegative(),
  roleBWins: z.number().nonnegative(),
  roleBLosses: z.number().int().nonnegative(),
  buchholz: z.number().nonnegative(),
  winRate: z.number().min(0).max(100),
  status: z.enum(['queued', 'running', 'done']),
})

export const matchTranscriptTurnSchema = z.object({
  id: z.string(),
  speaker: z.enum(['roleA', 'roleB', 'judge']),
  label: z.string(),
  content: z.string(),
})

export const transcriptTurnSchema = z.object({
  speaker: z.enum(['a', 'b']),
  role: z.string(),
  content: z.string(),
})

export const judgeQASchema = z.object({
  round: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
  selectedInfoId: z.string().nullable().optional(),
  isCorrect: z.boolean().nullable().optional(),
})

// Legacy scoring schema kept for DB read compatibility; engine now produces judgeDecision
export const judgeScoringSchema = z.object({
  score_a: z.number(),
  score_b: z.number(),
  winner: matchWinnerSchema,
  reasoning: z.string(),
})

export const submissionSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  promptA: z.string(),
  promptB: z.string(),
  modelA: z.string(),
  modelB: z.string(),
  roleAOptionId: z.string().nullable().optional(),
  roleBOptionId: z.string().nullable().optional(),
  retiredAt: z.string().nullable(),
  version: z.number().int().positive(),
  createdAt: z.string(),
})

export const createSubmissionSchema = z.object({
  scenarioId: z.string().min(1),
  promptA: z.string().trim().min(1).max(1000),
  promptB: z.string().trim().min(1).max(1000),
  modelA: submissionModelIdSchema,
  modelB: submissionModelIdSchema,
  roleAOptionId: z.string().trim().min(1).nullable().optional(),
  roleBOptionId: z.string().trim().min(1).nullable().optional(),
})

export const matchSchema = z.object({
  id: z.number().int().positive(),
  roundId: z.number().int().positive(),
  scenarioId: z.string(),
  subAId: z.number().int().positive(),
  subBId: z.number().int().positive(),
  status: matchStatusSchema,
  currentTurn: z.number().int().nonnegative(),
  transcript: z.array(transcriptTurnSchema),
  judgeTranscriptA: z.array(judgeQASchema),
  judgeTranscriptB: z.array(judgeQASchema),
  infoAssignment: infoAssignmentSchema.nullable(),
  judgeDecision: z.string().nullable(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  reasoning: z.string().nullable(),
  error: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const adminPlayerSchema = z.object({
  userId: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  modelA: z.string(),
  modelB: z.string(),
  version: z.number().int().positive(),
  submittedAt: z.string(),
})

export const adminPlayerPromptExportSchema = adminPlayerSchema.extend({
  promptA: z.string(),
  promptB: z.string(),
})

export const tournamentListItemSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  status: tournamentStatusSchema,
  currentRound: z.number().int().nonnegative(),
  totalRounds: z.number().int().positive(),
  roundCount: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export const tournamentMatchSummarySchema = z.object({
  id: z.number().int().positive(),
  roundId: z.number().int().positive(),
  scenarioId: z.string(),
  subAId: z.number().int().positive(),
  subBId: z.number().int().positive(),
  status: matchStatusSchema,
  currentTurn: z.number().int().nonnegative(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const tournamentRoundSchema = z.object({
  id: z.number().int().positive(),
  tournamentId: z.number().int().positive(),
  roundNumber: z.number().int().positive(),
  status: roundStatusSchema,
  byeSubmissions: z.array(z.number().int().positive()),
  matches: z.array(tournamentMatchSummarySchema),
})

export const tournamentSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  status: tournamentStatusSchema,
  currentRound: z.number().int().nonnegative(),
  totalRounds: z.number().int().positive(),
  pairingMode: z.enum(['auto', 'manual']).optional(),
  modelOverride: z.string().nullable().optional(),
  createdAt: z.string(),
})

export const tournamentDetailSchema = tournamentSchema.extend({
  rounds: z.array(tournamentRoundSchema),
})

export const matchDetailSchema = matchSchema.extend({
  tournamentId: z.number().int().positive(),
  roundNumber: z.number().int().positive(),
  playerADisplayName: z.string(),
  playerAModel: z.string(),
  roleAOptionId: z.string().nullable().optional(),
  roleBOptionId: z.string().nullable().optional(),
  playerBDisplayName: z.string(),
  playerBModel: z.string(),
})

export const matchProgressSchema = z.object({
  id: z.number().int().positive(),
  status: matchStatusSchema,
  currentTurn: z.number().int().nonnegative(),
  judgeTranscriptALength: z.number().int().nonnegative(),
  judgeTranscriptBLength: z.number().int().nonnegative(),
  hasInfoAssignment: z.boolean(),
  hasJudgeDecision: z.boolean(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  error: z.string().nullable(),
})

export const opponentModeSchema = z.enum(['self', 'preset'])

export const presetOpponentSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  role: z.enum(['a', 'b']),
  roleOptionId: z.string().nullable().optional(),
  label: z.string(),
  prompt: z.string(),
  createdAt: z.string(),
})

export const createPresetOpponentSchema = z.object({
  scenarioId: z.string().min(1),
  role: z.enum(['a', 'b']),
  roleOptionId: z.string().trim().min(1).nullable().optional(),
  label: z.string().trim().min(1).max(100),
  prompt: z.string().trim().min(1).max(2000),
})

export const updatePresetOpponentSchema = z.object({
  label: z.string().trim().min(1).max(100),
  prompt: z.string().trim().min(1).max(2000),
})

export const playgroundRunSchema = z.object({
  id: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  scenarioId: z.string(),
  opponentMode: opponentModeSchema,
  presetOpponentId: z.number().int().positive().nullable(),
  presetOpponentRole: z.enum(['a', 'b']).nullable(),
  presetOpponentLabel: z.string().nullable(),
  actualPromptA: z.string().nullable(),
  actualPromptB: z.string().nullable(),
  transcript: z.array(transcriptTurnSchema),
  judgeTranscriptA: z.array(judgeQASchema),
  judgeTranscriptB: z.array(judgeQASchema),
  infoAssignment: infoAssignmentSchema.nullable(),
  judgeDecision: z.string().nullable(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  reasoning: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  updatedAt: z.string(),
})

export const playgroundRunProgressSchema = z.object({
  id: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  status: z.enum(['queued', 'running', 'scored', 'error']),
  updatedAt: z.string(),
})

export const playgroundRunStartSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal('queued'),
})

export const playgroundRunSummarySchema = z.object({
  id: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  opponentMode: opponentModeSchema,
  presetOpponentId: z.number().int().positive().nullable(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
})

export const personalStatsSchema = z.object({
  rank: z.number().int().positive().nullable(),
  winRate: z.number().min(0).max(100).nullable(),
  submissionCount: z.number().int().nonnegative(),
  pendingMatchCount: z.number().int().nonnegative(),
  completedMatchCount: z.number().int().nonnegative(),
  currentVersion: z.number().int().positive().nullable(),
  scenarioTitle: z.string().nullable(),
  tournamentRound: z.number().int().nonnegative().nullable(),
})

export const adminStatsSchema = z.object({
  queued: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  scored: z.number().int().nonnegative(),
})

export const analyticsBattleSourceSchema = z.enum(['tournament', 'playground'])

export const analyticsBattleModeSchema = z.enum(['pvp', 'pve'])

export const analyticsAgentKindSchema = z.enum(['submission', 'preset'])

export const analyticsBattleParticipantSchema = z.object({
  agentKey: z.string(),
  kind: analyticsAgentKindSchema,
  side: z.enum(['a', 'b']),
  roleName: z.string(),
  label: z.string(),
  userId: z.number().int().positive().nullable(),
  userDisplayName: z.string().nullable(),
  submissionId: z.number().int().positive().nullable(),
  version: z.number().int().positive().nullable(),
  model: z.string().nullable(),
  presetOpponentId: z.number().int().positive().nullable(),
  presetLabel: z.string().nullable(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
})

export const adminAnalyticsBattleSchema = z.object({
  id: z.number().int().positive(),
  source: analyticsBattleSourceSchema,
  mode: analyticsBattleModeSchema.nullable(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  tournamentId: z.number().int().positive().nullable(),
  roundId: z.number().int().positive().nullable(),
  roundNumber: z.number().int().positive().nullable(),
  status: matchStatusSchema,
  currentTurn: z.number().int().nonnegative(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  error: z.string().nullable(),
  participantA: analyticsBattleParticipantSchema,
  participantB: analyticsBattleParticipantSchema,
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
})

export const adminAnalyticsAgentSummarySchema = z.object({
  agentKey: z.string(),
  userId: z.number().int().positive(),
  userDisplayName: z.string(),
  submissionId: z.number().int().positive(),
  side: z.enum(['a', 'b']),
  roleName: z.string(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  model: z.string(),
  version: z.number().int().positive(),
  createdAt: z.string(),
  retiredAt: z.string().nullable(),
  battleCount: z.number().int().nonnegative(),
  tournamentBattleCount: z.number().int().nonnegative(),
  playgroundPvpCount: z.number().int().nonnegative(),
  playgroundPveCount: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  avgScoreFor: z.number().nullable(),
  avgScoreAgainst: z.number().nullable(),
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  lastBattleAt: z.string().nullable(),
})

export const adminAnalyticsAgentDetailSchema = z.object({
  summary: adminAnalyticsAgentSummarySchema,
  recentBattles: z.array(adminAnalyticsBattleSchema),
})

export const adminMonitorUserSchema = z.object({
  userId: z.number().int().positive(),
  displayName: z.string(),
  email: z.string(),
  disabled: z.boolean(),
  submissionCount: z.number().int().nonnegative(),
  latestVersion: z.number().int().nonnegative().nullable(),
  playgroundRunCount: z.number().int().nonnegative(),
  matchCount: z.number().int().nonnegative(),
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  lastActiveAt: z.string().nullable(),
  isOverSoftCap: z.boolean(),
})

export const adminErroredMatchSchema = z.object({
  id: z.number().int().positive(),
  tournamentId: z.number().int().positive(),
  roundId: z.number().int().positive(),
  roundNumber: z.number().int().positive(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  status: z.literal('error'),
  playerADisplayName: z.string(),
  playerAModel: z.string(),
  playerBDisplayName: z.string(),
  playerBModel: z.string(),
  error: z.string().nullable(),
  createdAt: z.string(),
})

export const recentMatchSchema = z.object({
  id: z.number().int().positive(),
  status: matchStatusSchema,
  scenarioTitle: z.string(),
  scenarioId: z.string(),
  roleALabel: z.string(),
  roleBLabel: z.string(),
  winner: matchWinnerSchema.nullable(),
  opponentName: z.string(),
  model: z.string(),
  mySide: z.enum(['a', 'b']),
  createdAt: z.string(),
})

export const appMetaSchema = z.object({
  name: z.string(),
  stage: z.literal('mvp'),
  models: z.array(modelOptionSchema),
  scenarios: z.array(scenarioSummarySchema),
})

export type Scenario = z.infer<typeof scenarioSchema>
export type UpdateScenario = z.infer<typeof updateScenarioSchema>
export type AdminScenario = z.infer<typeof adminScenarioSchema>
export type ScenarioSummary = z.infer<typeof scenarioSummarySchema>
export type HiddenInfoItem = z.infer<typeof hiddenInfoItemSchema>
export type RequestItem = z.infer<typeof requestItemSchema>
export type RoleOption = z.infer<typeof roleOptionSchema>
export type InfoAssignment = z.infer<typeof infoAssignmentSchema>
export type ScorerOutput = z.infer<typeof scorerOutputSchema>
export type ExaminationAnswer = z.infer<typeof examinationAnswerSchema>
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>
export type MatchTranscriptTurn = z.infer<typeof matchTranscriptTurnSchema>
export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>
export type JudgeQA = z.infer<typeof judgeQASchema>
export type JudgeScoring = z.infer<typeof judgeScoringSchema>
export type Submission = z.infer<typeof submissionSchema>
export type AdminPlayer = z.infer<typeof adminPlayerSchema>
export type AdminPlayerPromptExport = z.infer<
  typeof adminPlayerPromptExportSchema
>
export type TournamentListItem = z.infer<typeof tournamentListItemSchema>
export type TournamentMatchSummary = z.infer<
  typeof tournamentMatchSummarySchema
>
export type TournamentRound = z.infer<typeof tournamentRoundSchema>
export type Tournament = z.infer<typeof tournamentSchema>
export type TournamentDetail = z.infer<typeof tournamentDetailSchema>
export type MatchDetail = z.infer<typeof matchDetailSchema>
export type MatchProgress = z.infer<typeof matchProgressSchema>
export type OpponentMode = z.infer<typeof opponentModeSchema>
export type PresetOpponent = z.infer<typeof presetOpponentSchema>
export type CreatePresetOpponent = z.infer<typeof createPresetOpponentSchema>
export type UpdatePresetOpponent = z.infer<typeof updatePresetOpponentSchema>
export type PlaygroundRun = z.infer<typeof playgroundRunSchema>
export type PlaygroundRunProgress = z.infer<typeof playgroundRunProgressSchema>
export type PlaygroundRunStart = z.infer<typeof playgroundRunStartSchema>
export type PlaygroundRunSummary = z.infer<typeof playgroundRunSummarySchema>
export type PersonalStats = z.infer<typeof personalStatsSchema>
export type AnalyticsBattleSource = z.infer<typeof analyticsBattleSourceSchema>
export type AnalyticsBattleMode = z.infer<typeof analyticsBattleModeSchema>
export type AnalyticsAgentKind = z.infer<typeof analyticsAgentKindSchema>
export type AnalyticsBattleParticipant = z.infer<
  typeof analyticsBattleParticipantSchema
>
export type AdminAnalyticsBattle = z.infer<typeof adminAnalyticsBattleSchema>
export type AdminAnalyticsAgentSummary = z.infer<
  typeof adminAnalyticsAgentSummarySchema
>
export type AdminAnalyticsAgentDetail = z.infer<
  typeof adminAnalyticsAgentDetailSchema
>
export type AdminMonitorUser = z.infer<typeof adminMonitorUserSchema>
export type AdminStats = z.infer<typeof adminStatsSchema>
export type AdminErroredMatch = z.infer<typeof adminErroredMatchSchema>
export type AdminUser = z.infer<typeof adminUserSchema>
export type RecentMatch = z.infer<typeof recentMatchSchema>
export type Match = z.infer<typeof matchSchema>
export type AppMeta = z.infer<typeof appMetaSchema>
export type RegistrationCodeResponse = z.infer<
  typeof registrationCodeResponseSchema
>
export type TokenSoftCapResponse = z.infer<typeof tokenSoftCapResponseSchema>
export type User = z.infer<typeof userSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
