import {
  adminLlmLatencyReportSchema,
  adminMonitorUserSchema,
  adminScenarioSchema,
  adminErroredMatchSchema,
  adminPlayerSchema,
  adminStatsSchema,
  adminUserSchema,
  appMetaSchema,
  changePasswordSchema,
  createSubmissionSchema,
  leaderboardEntrySchema,
  matchDetailSchema,
  matchProgressSchema,
  okResponseSchema,
  playgroundRunSchema,
  playgroundRunProgressSchema,
  playgroundRunStartSchema,
  playgroundRunSummarySchema,
  personalStatsSchema,
  recentMatchSchema,
  registrationCodeResponseSchema,
  resetPasswordSchema,
  tokenSoftCapResponseSchema,
  updateTokenSoftCapSchema,
  scenarioSchema,
  submissionSchema,
  tournamentDetailSchema,
  tournamentListItemSchema,
  tournamentMatchSummarySchema,
  tournamentRoundSchema,
  tournamentSchema,
  updateRegistrationCodeSchema,
  updateProfileSchema,
  userSchema,
  type AdminLlmLatencyReport,
  type AdminPlayer,
  presetOpponentSchema,
  createPresetOpponentSchema,
  updatePresetOpponentSchema,
  type AdminMonitorUser,
  type AdminScenario,
  type AdminErroredMatch,
  type AdminStats,
  type AdminUser,
  type AppMeta,
  type CreatePresetOpponent,
  type LeaderboardEntry,
  type MatchDetail,
  type MatchProgress,
  type OpponentMode,
  type PersonalStats,
  type PlaygroundRun,
  type PlaygroundRunProgress,
  type PlaygroundRunStart,
  type PlaygroundRunSummary,
  type PresetOpponent,
  type RegistrationCodeResponse,
  type RecentMatch,
  type TokenSoftCapResponse,
  type Scenario,
  type Submission,
  type TournamentDetail,
  type TournamentListItem,
  type UpdatePresetOpponent,
  type UpdateScenario,
  type User,
} from '@axiia/shared'
import { z } from 'zod'

import { getCurrentAsUserId } from '../context/impersonation'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const TOKEN_STORAGE_KEY = 'axiia-token'

const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
})

export type AuthResponse = z.infer<typeof authResponseSchema>
const adminScenariosResponseSchema = z.array(adminScenarioSchema)
const submissionsResponseSchema = z.array(submissionSchema)
const leaderboardResponseSchema = z.array(leaderboardEntrySchema)
const tournamentsResponseSchema = z.array(tournamentListItemSchema)
const recentMatchesResponseSchema = z.array(recentMatchSchema)
const playgroundRunSummariesSchema = z.array(playgroundRunSummarySchema)
const presetOpponentsResponseSchema = z.array(presetOpponentSchema)
const adminMonitorUsersResponseSchema = z.array(adminMonitorUserSchema)
const adminLlmLatencyReportResponseSchema = adminLlmLatencyReportSchema
const adminPlayersResponseSchema = z.array(adminPlayerSchema)
const adminErroredMatchesResponseSchema = z.array(adminErroredMatchSchema)
const adminUsersResponseSchema = z.array(adminUserSchema)
const startTournamentResponseSchema = z.object({
  byeSubmissions: z.array(z.number().int().positive()),
  matches: z.array(tournamentMatchSummarySchema),
  round: tournamentRoundSchema,
  tournament: tournamentSchema,
})

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function readToken() {
  return getStoredToken()
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const IMPERSONATABLE_PATH_PATTERNS = [
  /^\/api\/stats\/me(?:$|\?)/,
  /^\/api\/matches\/my(?:$|\?)/,
  /^\/api\/submissions\/my(?:$|\/|\?)/,
  /^\/api\/playground\/runs\/\d+(?:\/\d+)?(?:$|\?)/,
]

function isImpersonatablePath(path: string): boolean {
  return IMPERSONATABLE_PATH_PATTERNS.some((pattern) => pattern.test(path))
}

function withImpersonation(path: string): string {
  const asUserId = getCurrentAsUserId()
  if (asUserId == null || !isImpersonatablePath(path)) {
    return path
  }
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}asUserId=${asUserId}`
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  schema?: z.ZodType<T>,
): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const finalPath = withImpersonation(path)

  const response = await fetch(`${API_BASE_URL}${finalPath}`, {
    ...init,
    headers,
  })

  const json = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new ApiError(json.error ?? 'Request failed', response.status)
  }

  return schema ? schema.parse(json) : (json as T)
}

export async function login(input: {
  email: string
  password: string
}): Promise<AuthResponse> {
  return apiFetch(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    authResponseSchema,
  )
}

export async function register(input: {
  displayName?: string
  email: string
  otp: string
  password: string
}): Promise<AuthResponse> {
  return apiFetch(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    authResponseSchema,
  )
}

export async function getMe(): Promise<User> {
  return apiFetch('/api/auth/me', { method: 'GET' }, userSchema)
}

export async function getAppMeta(): Promise<AppMeta> {
  return apiFetch('/api/meta', { method: 'GET' }, appMetaSchema)
}

export async function updateProfile(
  input: z.input<typeof updateProfileSchema>,
): Promise<User> {
  const body = updateProfileSchema.parse(input)

  return apiFetch(
    '/api/auth/me',
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    userSchema,
  )
}

export async function changePassword(
  input: z.input<typeof changePasswordSchema>,
): Promise<{ ok: true }> {
  const body = changePasswordSchema.parse(input)

  return apiFetch(
    '/api/auth/password',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    okResponseSchema,
  )
}

export async function getScenario(id: string): Promise<Scenario> {
  return apiFetch(`/api/scenarios/${id}`, { method: 'GET' }, scenarioSchema)
}

export async function getMySubmissions(
  scenarioId?: string,
): Promise<Submission[]> {
  return apiFetch(
    scenarioId ? `/api/submissions/my/${scenarioId}` : '/api/submissions/my',
    { method: 'GET' },
    submissionsResponseSchema,
  )
}

export async function createSubmission(
  input: z.input<typeof createSubmissionSchema>,
): Promise<Submission> {
  const body = createSubmissionSchema.parse(input)

  return apiFetch(
    '/api/submissions',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    submissionSchema,
  )
}

export async function runPlayground(
  submissionId: number,
  opponentMode: OpponentMode = 'self',
  presetOpponentId?: number,
): Promise<PlaygroundRunStart> {
  return apiFetch(
    '/api/playground/run',
    {
      method: 'POST',
      body: JSON.stringify({ submissionId, opponentMode, presetOpponentId }),
    },
    playgroundRunStartSchema,
  )
}

export async function interruptPlaygroundRun(
  submissionId: number,
  runId: number,
): Promise<PlaygroundRun> {
  return apiFetch(
    `/api/playground/runs/${submissionId}/${runId}/interrupt`,
    { method: 'POST' },
    playgroundRunSchema,
  )
}

export async function getPresetOpponents(
  scenarioId: string,
): Promise<PresetOpponent[]> {
  return apiFetch(
    `/api/scenarios/${encodeURIComponent(scenarioId)}/preset-opponents`,
    { method: 'GET' },
    presetOpponentsResponseSchema,
  )
}

export async function createPresetOpponent(
  body: CreatePresetOpponent,
): Promise<PresetOpponent> {
  return apiFetch(
    '/api/admin/preset-opponents',
    { method: 'POST', body: JSON.stringify(body) },
    presetOpponentSchema,
  )
}

export async function updatePresetOpponent(
  id: number,
  body: UpdatePresetOpponent,
): Promise<PresetOpponent> {
  return apiFetch(
    `/api/admin/preset-opponents/${id}`,
    { method: 'PUT', body: JSON.stringify(body) },
    presetOpponentSchema,
  )
}

export async function deletePresetOpponent(id: number): Promise<{ ok: true }> {
  return apiFetch(
    `/api/admin/preset-opponents/${id}`,
    { method: 'DELETE' },
    okResponseSchema,
  )
}

export async function getPlaygroundRuns(
  submissionId: number,
): Promise<PlaygroundRunSummary[]> {
  return apiFetch(
    `/api/playground/runs/${submissionId}`,
    { method: 'GET' },
    playgroundRunSummariesSchema,
  )
}

export async function getPlaygroundRun(
  submissionId: number,
  runId: number,
): Promise<PlaygroundRun> {
  return apiFetch(
    `/api/playground/runs/${submissionId}/${runId}`,
    { method: 'GET' },
    playgroundRunSchema,
  )
}

export async function getPlaygroundRunProgress(
  submissionId: number,
  runId: number,
): Promise<PlaygroundRunProgress> {
  return apiFetch(
    `/api/playground/runs/${submissionId}/${runId}/status`,
    { method: 'GET' },
    playgroundRunProgressSchema,
  )
}

export async function getMatch(id: number | string): Promise<MatchDetail> {
  return apiFetch(`/api/matches/${id}`, { method: 'GET' }, matchDetailSchema)
}

export async function getMatchProgress(
  id: number | string,
): Promise<MatchProgress> {
  return apiFetch(
    `/api/matches/${id}/status`,
    { method: 'GET' },
    matchProgressSchema,
  )
}

export async function getTournament(
  id: number | string,
): Promise<TournamentDetail> {
  return apiFetch(
    `/api/tournaments/${id}`,
    { method: 'GET' },
    tournamentDetailSchema,
  )
}

export async function getTournaments(): Promise<TournamentListItem[]> {
  return apiFetch(
    '/api/tournaments',
    { method: 'GET' },
    tournamentsResponseSchema,
  )
}

export async function getLeaderboard(
  tournamentId: number | string,
): Promise<LeaderboardEntry[]> {
  return apiFetch(
    `/api/tournaments/${tournamentId}/leaderboard`,
    { method: 'GET' },
    leaderboardResponseSchema,
  )
}

export async function getMyStats(): Promise<PersonalStats> {
  return apiFetch('/api/stats/me', { method: 'GET' }, personalStatsSchema)
}

export async function getAdminMonitorUsers(): Promise<AdminMonitorUser[]> {
  return apiFetch(
    '/api/admin/monitor/users',
    { method: 'GET' },
    adminMonitorUsersResponseSchema,
  )
}

export async function getAdminLlmLatencyReport(
  filters: {
    from?: string
    model?: string
    phase?: string
    provider?: string
    scenarioId?: string
    source?: string
    to?: string
  } = {},
): Promise<AdminLlmLatencyReport> {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()

  return apiFetch(
    `/api/admin/monitor/llm-latency${query ? `?${query}` : ''}`,
    { method: 'GET' },
    adminLlmLatencyReportResponseSchema,
  )
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch('/api/admin/stats', { method: 'GET' }, adminStatsSchema)
}

export async function getAdminScenarios(): Promise<AdminScenario[]> {
  return apiFetch(
    '/api/admin/scenarios',
    { method: 'GET' },
    adminScenariosResponseSchema,
  )
}

export async function updateAdminScenario(
  id: string,
  body: UpdateScenario,
): Promise<AdminScenario> {
  return apiFetch(
    `/api/admin/scenarios/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    adminScenarioSchema,
  )
}

export async function getAdminTournamentPlayers(
  scenarioId: string,
): Promise<AdminPlayer[]> {
  return apiFetch(
    `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(scenarioId)}`,
    { method: 'GET' },
    adminPlayersResponseSchema,
  )
}

export async function getAdminErroredMatches(): Promise<AdminErroredMatch[]> {
  return apiFetch(
    '/api/admin/matches/errors',
    { method: 'GET' },
    adminErroredMatchesResponseSchema,
  )
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiFetch(
    '/api/admin/users',
    { method: 'GET' },
    adminUsersResponseSchema,
  )
}

export async function getAdminRegistrationCode(): Promise<RegistrationCodeResponse> {
  return apiFetch(
    '/api/admin/settings/registration-code',
    { method: 'GET' },
    registrationCodeResponseSchema,
  )
}

export async function getAdminTokenSoftCap(): Promise<TokenSoftCapResponse> {
  return apiFetch(
    '/api/admin/settings/token-soft-cap',
    { method: 'GET' },
    tokenSoftCapResponseSchema,
  )
}

export async function updateAdminTokenSoftCap(
  input: z.input<typeof updateTokenSoftCapSchema>,
): Promise<TokenSoftCapResponse> {
  const body = updateTokenSoftCapSchema.parse(input)

  return apiFetch(
    '/api/admin/settings/token-soft-cap',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    tokenSoftCapResponseSchema,
  )
}

export async function updateAdminRegistrationCode(
  input: z.input<typeof updateRegistrationCodeSchema>,
): Promise<RegistrationCodeResponse> {
  const body = updateRegistrationCodeSchema.parse(input)

  return apiFetch(
    '/api/admin/settings/registration-code',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    registrationCodeResponseSchema,
  )
}

export async function startTournament(scenarioId: string) {
  return apiFetch(
    '/api/admin/tournaments/start',
    {
      method: 'POST',
      body: JSON.stringify({ scenarioId }),
    },
    startTournamentResponseSchema,
  )
}

export async function terminateAdminTournament(
  tournamentId: number | string,
): Promise<{ ok: true }> {
  return apiFetch(
    `/api/admin/tournaments/${tournamentId}/terminate`,
    { method: 'POST' },
    okResponseSchema,
  )
}

export async function retryAdminMatch(
  matchId: number | string,
): Promise<{ ok: true }> {
  return apiFetch(
    `/api/admin/matches/${matchId}/retry`,
    { method: 'POST' },
    okResponseSchema,
  )
}

export async function toggleAdminUserDisabled(
  userId: number | string,
): Promise<AdminUser> {
  return apiFetch(
    `/api/admin/users/${userId}/disable`,
    {
      method: 'PATCH',
    },
    adminUserSchema,
  )
}

export async function resetAdminUserPassword(
  userId: number | string,
  input: z.input<typeof resetPasswordSchema>,
): Promise<{ ok: true }> {
  const body = resetPasswordSchema.parse(input)

  return apiFetch(
    `/api/admin/users/${userId}/reset-password`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    okResponseSchema,
  )
}

export async function getMyRecentMatches(): Promise<RecentMatch[]> {
  return apiFetch(
    '/api/matches/my',
    { method: 'GET' },
    recentMatchesResponseSchema,
  )
}
