// HTTP adapter for the axiia server. Every server path the tournament scripts
// use is in this file.
//
// Auth, in order:
//   AXIIA_TOKEN  — the federated operator bearer token
//   GitHub OIDC  — ACTIONS_ID_TOKEN_REQUEST_TOKEN/URL, exchanged at
//                  /v1/auth/federated and re-exchanged before it expires

import type { MatchRecord, SubmitItem, SubmitResult, VersionInfo } from '../types.ts'
import type { Backend } from './backend.ts'

export const PATHS = {
  federatedExchange: '/v1/auth/federated',
  batchSubmit: '/v1/federation/matches/batch',
  matches: '/v1/federation/matches',
  versions: '/v1/federation/versions',
}

// Server limits: a batch holds 1–1000 items, a query page at most 1000 rows.
const SUBMIT_CHUNK = 500
const QUERY_LIMIT = 1000
const VERSION_CHUNK = 100
export const DEFAULT_MAX_IN_FLIGHT = 50

// A non-2xx answer. `code` is the server's error code when the body carries
// one: key_conflict (409, same key, different payload), version_mismatch and
// unknown_scenario (400).
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message)
  }
}

export class HttpBackend implements Backend {
  readonly mode = 'http' as const
  readonly maxInFlight: number
  #baseURL: string
  #staticToken?: string
  #minted?: { token: string; at: number }

  constructor(baseURL: string, token?: string, maxInFlight = DEFAULT_MAX_IN_FLIGHT) {
    this.#baseURL = baseURL.replace(/\/$/, '')
    this.#staticToken = token
    this.maxInFlight = maxInFlight
  }

  // AXIIA_MAX_IN_FLIGHT overrides the default pacing; an explicit
  // maxInFlight (the --max-in-flight flag) overrides both.
  static fromEnv(maxInFlight?: number): HttpBackend {
    const base = Deno.env.get('AXIIA_BASE_URL')
    if (!base) {
      throw new Error('AXIIA_BASE_URL is required (or pass --mock <file>)')
    }
    const env = Deno.env.get('AXIIA_MAX_IN_FLIGHT')
    const cap = maxInFlight ?? (env ? Number(env) : DEFAULT_MAX_IN_FLIGHT)
    if (!(Number.isInteger(cap) && cap >= 1)) {
      throw new Error(`max in flight must be an integer ≥ 1, got ${cap}`)
    }
    return new HttpBackend(base, Deno.env.get('AXIIA_TOKEN') || undefined, cap)
  }

  async #token(): Promise<string> {
    if (this.#staticToken) return this.#staticToken
    if (this.#minted && Date.now() - this.#minted.at < 480_000) {
      return this.#minted.token
    }
    const requestToken = Deno.env.get('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
    const requestURL = Deno.env.get('ACTIONS_ID_TOKEN_REQUEST_URL')
    if (!requestToken || !requestURL) {
      throw new Error(
        'no credential: set AXIIA_TOKEN, or run under GitHub Actions with id-token: write',
      )
    }
    const assertion = await fetch(
      `${requestURL}&audience=${encodeURIComponent(this.#baseURL)}`,
      { headers: { authorization: `Bearer ${requestToken}` } },
    )
    if (!assertion.ok) {
      throw new Error(`OIDC assertion request -> ${assertion.status}`)
    }
    const { value } = await assertion.json() as { value?: string }
    if (!value) throw new Error('OIDC assertion response carried no value')
    const exchange = await fetch(this.#baseURL + PATHS.federatedExchange, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ assertion: value }),
    })
    if (!exchange.ok) {
      throw new Error(`federated exchange refused (${exchange.status})`)
    }
    const { accessToken } = await exchange.json() as { accessToken: string }
    this.#minted = { token: accessToken, at: Date.now() }
    return accessToken
  }

  async #api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${await this.#token()}`,
    }
    if (body !== undefined) headers['content-type'] = 'application/json'
    const response = await fetch(this.#baseURL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) {
      let code: string | undefined
      try {
        const body = JSON.parse(text)
        code = body?.error?.code ?? body?.code ?? body?.error
        if (typeof code !== 'string') code = undefined
      } catch {
        // not JSON
      }
      const hint = code === 'key_conflict'
        ? ' (a game key already exists with a different payload: pairing drift or a reused tournament id)'
        : ''
      throw new HttpError(
        response.status,
        code,
        `${method} ${path} -> ${response.status} ${text}${hint}`,
      )
    }
    return (text ? JSON.parse(text) : undefined) as T
  }

  async submit(items: SubmitItem[]): Promise<SubmitResult[]> {
    const out: SubmitResult[] = []
    // Each batch is all-or-nothing on the server; keys make a rerun after a
    // partial failure safe.
    for (let i = 0; i < items.length; i += SUBMIT_CHUNK) {
      const { matches } = await this.#api<{ matches: SubmitResult[] }>(
        'POST',
        PATHS.batchSubmit,
        { items: items.slice(i, i + SUBMIT_CHUNK) },
      )
      out.push(...matches)
    }
    return out
  }

  async query(tags: string[]): Promise<MatchRecord[]> {
    const out: MatchRecord[] = []
    let after: string | number | null = null
    do {
      const params = new URLSearchParams()
      for (const tag of tags) params.append('tag', tag)
      params.set('limit', String(QUERY_LIMIT))
      if (after !== null) params.set('after', String(after))
      const page: { matches: MatchRecord[]; next: string | number | null } = await this.#api(
        'GET',
        `${PATHS.matches}?${params}`,
      )
      out.push(...page.matches)
      after = page.next ?? null
    } while (after !== null)
    return out
  }

  // The server silently omits ids it does not know; callers treat a missing
  // version as an error.
  async versions(ids: number[]): Promise<VersionInfo[]> {
    const out: VersionInfo[] = []
    for (let i = 0; i < ids.length; i += VERSION_CHUNK) {
      const params = new URLSearchParams()
      for (const id of ids.slice(i, i + VERSION_CHUNK)) {
        params.append('id', String(id))
      }
      out.push(
        ...await this.#api<VersionInfo[]>('GET', `${PATHS.versions}?${params}`),
      )
    }
    return out
  }

  close(): Promise<void> {
    return Promise.resolve()
  }
}
