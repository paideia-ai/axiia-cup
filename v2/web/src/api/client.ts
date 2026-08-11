import type {
  AgentRefResponse,
  AgentVersionDTO,
  ConfigResponse,
  CreateRegistrationCodeRequest,
  CreateScriptRequest,
  DispatchPVERequest,
  DispatchPVPRequest,
  DispatchResponse,
  DraftResponse,
  ElevateRequest,
  EnsureAgentRequest,
  ErrorResponse,
  FieldMutationRequest,
  LoginRequest,
  MatchDetail,
  MatchListResponse,
  MeResponse,
  ModelListResponse,
  MyAgentsResponse,
  NotificationsResponse,
  OKResponse,
  OpponentListResponse,
  SaveVersionRequest,
  ScenarioDetail,
  ScenarioListResponse,
  ScriptRefResponse,
  ScriptResponse,
  Side,
  SignupRequest,
  SlotListResponse,
  StandingsResponse,
  TournamentListResponse,
  UpdateSlotRequest,
  VersionDiffResponse,
  VersionListResponse,
} from './types'

// Same-origin by design (plan §6): the SPA is served from the Swift origin (dev:
// via the vite `/v1` proxy) so the HttpOnly cookie and CSRF Sec-Fetch-Site gate
// work with zero auth code in JS. `credentials: 'include'` sends the cookie; the
// browser stamps Sec-Fetch-Site itself. Web code never builds an auth header.
const API_ROOT =
  (import.meta.env.VITE_API_ROOT as string | undefined)?.replace(/\/$/, '') ??
    ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    'message' in value
  )
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers = new Headers()
  const init: RequestInit = { method, credentials: 'include', headers }
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    init.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_ROOT}/v1${path}`, init)
  const text = await response.text()
  // Not every response is JSON: the CSRF refusal and encode-failure fallbacks are
  // plain text, and a dead proxy answers HTML. Never let JSON.parse mask the real
  // status with a SyntaxError.
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    if (isErrorResponse(payload)) {
      throw new ApiError(payload.message, response.status, payload.error)
    }
    throw new ApiError(text || '请求失败', response.status, 'unknown')
  }

  return (payload ?? {}) as T
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  signup: (input: SignupRequest) =>
    request<MeResponse>('POST', '/auth/signup', input),
  login: (input: LoginRequest) =>
    request<MeResponse>('POST', '/auth/login', input),
  logout: () => request<OKResponse>('POST', '/auth/logout'),
  me: () => request<MeResponse>('GET', '/auth/me'),
  elevate: (input: ElevateRequest) =>
    request<MeResponse>('POST', '/auth/elevate', input),
}

// ── Catalog ─────────────────────────────────────────────────────────────────

export const catalog = {
  scenarios: () => request<ScenarioListResponse>('GET', '/scenarios'),
  scenario: (id: string, side: Side) =>
    request<ScenarioDetail>(
      'GET',
      `/scenarios/${encodeURIComponent(id)}?side=${side}`,
    ),
  models: () => request<ModelListResponse>('GET', '/models'),
  opponents: (id: string, side: Side) =>
    request<OpponentListResponse>(
      'GET',
      `/scenarios/${encodeURIComponent(id)}/opponents?side=${side}`,
    ),
}

// ── Config & inventory (P2) ─────────────────────────────────────────────────

export const config = {
  // §C2 read-only projection: quotas, gate threshold, models, trials switch,
  // plus the caller's usage. Callers must degrade gracefully on failure.
  get: () => request<ConfigResponse>('GET', '/config'),
}

export const myAgents = {
  // Cross-scenario inventory of the caller's agents (#64/#58).
  list: () => request<MyAgentsResponse>('GET', '/my/agents'),
}

// ── Builder ─────────────────────────────────────────────────────────────────

export const builder = {
  ensure: (input: EnsureAgentRequest) =>
    request<AgentRefResponse>('POST', '/agents/ensure', input),
  mutate: (agentID: number, input: FieldMutationRequest) =>
    request<OKResponse>('POST', `/agents/${agentID}/mutate`, input),
  save: (agentID: number, input: SaveVersionRequest) =>
    request<AgentVersionDTO>('POST', `/agents/${agentID}/save`, input),
  draft: (agentID: number) =>
    request<DraftResponse>('GET', `/agents/${agentID}/draft`),
  versions: (agentID: number) =>
    request<VersionListResponse>('GET', `/agents/${agentID}/versions`),
  setEntry: (agentID: number, versionID: number) =>
    request<OKResponse>('POST', `/agents/${agentID}/entry/${versionID}`),
  diff: (agentID: number, base: number, head: number) =>
    request<VersionDiffResponse>(
      'GET',
      `/agents/${agentID}/diff?base=${base}&head=${head}`,
    ),
}

// ── Matches ─────────────────────────────────────────────────────────────────

export const matches = {
  dispatchPVE: (input: DispatchPVERequest) =>
    request<DispatchResponse>('POST', '/matches/pve', input),
  dispatchPVP: (input: DispatchPVPRequest) =>
    request<DispatchResponse>('POST', '/matches/pvp', input),
  list: () => request<MatchListResponse>('GET', '/matches'),
  detail: (id: number) => request<MatchDetail>('GET', `/matches/${id}`),
}

// ── Notifications ───────────────────────────────────────────────────────────

export const notifications = {
  list: () => request<NotificationsResponse>('GET', '/notifications'),
  markRead: (id: number) =>
    request<OKResponse>('POST', `/notifications/${id}/read`),
}

// ── Tournaments ─────────────────────────────────────────────────────────────

export const tournaments = {
  list: () => request<TournamentListResponse>('GET', '/tournaments'),
  standings: (id: number) =>
    request<StandingsResponse>('GET', `/tournaments/${id}/standings`),
}

// ── Admin ───────────────────────────────────────────────────────────────────

export const admin = {
  createRegistrationCode: (input: CreateRegistrationCodeRequest) =>
    request<OKResponse>('POST', '/admin/registration-codes', input),
  // Scripts are content-addressed: uploading the same source twice returns the
  // same sha and writes nothing.
  createScript: (input: CreateScriptRequest) =>
    request<ScriptRefResponse>('POST', '/admin/scripts', input),
  script: (sha: string) =>
    request<ScriptResponse>('GET', `/admin/scripts/${encodeURIComponent(sha)}`),
  slots: () => request<SlotListResponse>('GET', '/admin/slots'),
  updateSlot: (id: string, input: UpdateSlotRequest) =>
    request<OKResponse>(
      'PATCH',
      `/admin/slots/${encodeURIComponent(id)}`,
      input,
    ),
}

// ── SSE ─────────────────────────────────────────────────────────────────────

// EventSource rides the same-origin HttpOnly cookie automatically — the whole
// reason auth is cookie-based (Safari EventSource cannot carry an Authorization
// header). Frames are unnamed (data: only); callers JSON-parse and discriminate on
// the single object key.

export function sseUrl(path: string): string {
  return `${API_ROOT}/v1${path}`
}
