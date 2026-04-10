import { type AdminScenario, type TournamentListItem } from '@axiia/shared'

const API_BASE_URL = process.env.AXIIA_API_URL ?? 'http://localhost:3001'
const AUTH_TOKEN = process.env.AXIIA_AUTH_TOKEN ?? process.env.AXIIA_ADMIN_TOKEN

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  authRequired = false,
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (AUTH_TOKEN) {
    headers.set('Authorization', `Bearer ${AUTH_TOKEN}`)
  } else if (authRequired) {
    throw new Error('Missing AXIIA_AUTH_TOKEN or AXIIA_ADMIN_TOKEN')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
  const json = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new Error(json.error ?? `Request failed: ${response.status}`)
  }

  return json as T
}

export async function resolveTournamentId(input?: string) {
  if (input) {
    return Number(input)
  }

  const tournaments = await apiFetch<TournamentListItem[]>(
    '/api/tournaments',
    undefined,
    true,
  )
  const latest = tournaments[0]

  if (!latest) {
    throw new Error('No tournaments found')
  }

  return latest.id
}

export async function fetchAdminScenarios() {
  return apiFetch<AdminScenario[]>(
    '/api/admin/scenarios',
    { method: 'GET' },
    true,
  )
}

export async function fetchAdminScenarioById(scenarioId: string) {
  const scenarios = await fetchAdminScenarios()
  const scenario = scenarios.find((item) => item.id === scenarioId)

  if (!scenario) {
    throw new Error(`Scenario "${scenarioId}" not found`)
  }

  return scenario
}
