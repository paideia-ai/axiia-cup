// Operator-only preparation: these are REAL model-backed matches, billed and
// charged to the dedicated quota invitee. No result or quota overrides exist.
import {
  type A5QuotaRequest,
  prepareA5Quota,
  type QuotaAPI,
  QuotaHTTPError,
  type QuotaManifest,
  QuotaPreparationError,
  validateQuotaRequest,
} from './a5-quota-preparation.ts'
import { assertPublicManifestRedacted } from './reviewed-human-fixtures.ts'

export interface QuotaEnvironment extends A5QuotaRequest {
  privateOut: string
  publicOut: string
}

export const usage =
  `Prepare the EXISTING dedicated A5 quota invitee using REAL model-backed duels.
This spends its daily total/PVP quota and model usage. It does not reset results.

Usage: deno task prepare:human:a5 --apply

Required environment (keep credentials out of command history):
  AXIIA_BASE_URL=https://axiia-cup-2-web.isofucius.cn
  AXIIA_A5_SCENARIO_ID=shangyang-court
  AXIIA_A5_INITIATOR_EMAIL=<existing hv-a5-quota-invitee-...@axiia.test>
  AXIIA_A5_INITIATOR_PASSWORD=<existing password>
  AXIIA_A5_RIVAL_EMAIL=<existing hv-a5-rich-challenger-...@axiia.test>
  AXIIA_A5_RIVAL_PASSWORD=<existing password>
  AXIIA_A5_MAX_MATCHES=<explicit maximum 0..10, usually 5>
  AXIIA_PRIVATE_OUT=<new absolute private .jsonl path>
  AXIIA_PUBLIC_OUT=<new absolute redacted .json path>
Optional: AXIIA_A5_MATCH_TIMEOUT_SECONDS=600 (1..1800 per match)

Use idle, dedicated fixture accounts only; do not run concurrent preparations.
Both roles must already have unlocked gates and entry versions on both sides.
Duels are sequential; at least two total slots must remain. The final paired
challenge must reject with pvp_daily_limit without changing counters/match IDs.
Readiness expires at midnight UTC+8, and this run never crosses that reset.
On failure inspect the private append-only journal and account first. No POST
is automatically retried. Resume by rerunning with NEW output paths: pending
initiated matches are awaited and only the fresh daily deficit is dispatched.
Credentials stay in the private journal. The public manifest contains no login
details. An HTTP loopback origin is supported for isolated local verification.`

export function validateQuotaCLI(
  args: readonly string[],
  config: QuotaEnvironment,
): QuotaEnvironment {
  if (args.length !== 1 || args[0] !== '--apply') {
    throw new QuotaPreparationError('exactly-one-apply-argument-required')
  }
  validateQuotaRequest(config)
  for (const path of [config.privateOut, config.publicOut]) {
    if (
      !path.startsWith('/') || path.endsWith('/') ||
      path.split('/').some((part) => part === '.' || part === '..') ||
      ['/dev', '/proc', '/sys'].some((root) =>
        path === root || path.startsWith(`${root}/`)
      )
    ) {
      throw new QuotaPreparationError(
        'new-absolute-regular-output-paths-required',
      )
    }
  }
  if (config.privateOut === config.publicOut) {
    throw new QuotaPreparationError('distinct-output-paths-required')
  }
  return config
}

/** Bounded same-origin cookie session. Never follows redirects or retries. */
export class QuotaSession implements QuotaAPI {
  private jar = new Map<string, string>()

  constructor(
    private baseURL: string,
    private request: typeof fetch = fetch,
  ) {}

  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!path.startsWith('/v1/')) {
      throw new QuotaPreparationError('unsupported-api-path')
    }
    const headers = new Headers({ 'Sec-Fetch-Site': 'same-origin' })
    if (this.jar.size) {
      headers.set(
        'Cookie',
        [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '),
      )
    }
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    const response = await this.request(`${this.baseURL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    })
    for (const cookie of response.headers.getSetCookie()) {
      const head = cookie.split(';')[0]
      const separator = head.indexOf('=')
      if (separator < 1) continue
      const key = head.slice(0, separator)
      const value = head.slice(separator + 1)
      if (value) this.jar.set(key, value)
      else this.jar.delete(key)
    }
    const parsed = await response.json().catch(() => undefined)
    if (!response.ok) {
      // API response text is untrusted and may echo credentials. Only fixed
      // contract codes are admitted to errors/public evidence.
      const known = [
        'pvp_daily_limit',
        'daily_limit',
        'concurrency_limit',
        'opponent_challenge_limit',
        'trials_blocked',
        'gate_locked',
        'opponent_gate_locked',
        'both_sides_required',
        'opponent_both_sides_required',
      ]
      throw new QuotaHTTPError(
        response.status,
        known.includes(parsed?.error) ? parsed.error : 'unknown-http-error',
      )
    }
    if (parsed === undefined) {
      throw new QuotaPreparationError('invalid-json-response')
    }
    return parsed as T
  }
}

/** A synced JSONL journal preserves the last full record across interruptions. */
export async function createQuotaJournal(config: QuotaEnvironment) {
  const files: Array<{ path: string; file: Deno.FsFile; info: Deno.FileInfo }> =
    []
  const encoder = new TextEncoder()
  const secrets = [
    config.initiator.email,
    config.initiator.password,
    config.rival.email,
    config.rival.password,
  ]
  const close = () => files.forEach(({ file }) => file.close())
  async function verify(index: number) {
    const { path, info } = files[index]
    const current = await Deno.lstat(path)
    if (
      !current.isFile || current.isSymlink || current.dev !== info.dev ||
      current.ino !== info.ino || current.mode == null ||
      (current.mode & 0o077) !== 0
    ) throw new QuotaPreparationError('output-file-replaced-or-not-private')
  }
  async function write(index: number, value: unknown, append: boolean) {
    await verify(index)
    const file = files[index].file
    if (!append) {
      await file.truncate(0)
      await file.seek(0, Deno.SeekMode.Start)
    }
    const data = encoder.encode(`${JSON.stringify(value)}\n`)
    let offset = 0
    while (offset < data.length) {
      offset += await file.write(data.subarray(offset))
    }
    await file.sync()
    await verify(index)
  }
  try {
    // Reserve BOTH new paths before writing credentials or making requests.
    for (const path of [config.privateOut, config.publicOut]) {
      const file = await Deno.open(path, {
        write: true,
        createNew: true,
        mode: 0o600,
      })
      const info = await file.stat()
      files.push({ path, file, info })
    }
    await write(0, { record: 'credentials', request: config }, true)
  } catch {
    close()
    throw new QuotaPreparationError('cannot-create-new-private-output-files')
  }
  return {
    close,
    async checkpoint(manifest: QuotaManifest) {
      assertPublicManifestRedacted(manifest, secrets)
      await write(0, { record: 'checkpoint', manifest }, true)
      await write(1, manifest, false)
    },
  }
}

function environment(): QuotaEnvironment {
  const env = (name: string) => Deno.env.get(name) ?? ''
  const bounded = env('AXIIA_A5_MAX_MATCHES')
  return {
    baseURL: env('AXIIA_BASE_URL'),
    scenarioID: env('AXIIA_A5_SCENARIO_ID'),
    initiator: {
      email: env('AXIIA_A5_INITIATOR_EMAIL'),
      password: env('AXIIA_A5_INITIATOR_PASSWORD'),
    },
    rival: {
      email: env('AXIIA_A5_RIVAL_EMAIL'),
      password: env('AXIIA_A5_RIVAL_PASSWORD'),
    },
    maxMatches: bounded.trim() ? Number(bounded) : NaN,
    matchTimeoutSeconds: Number(env('AXIIA_A5_MATCH_TIMEOUT_SECONDS') || '600'),
    privateOut: env('AXIIA_PRIVATE_OUT'),
    publicOut: env('AXIIA_PUBLIC_OUT'),
  }
}

async function main() {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(usage)
    return
  }
  const config = validateQuotaCLI(Deno.args, environment())
  const journal = await createQuotaJournal(config)
  try {
    console.error(
      'A5 preparation runs REAL matches and spends the quota invitee’s daily allowance.',
    )
    const manifest = await prepareA5Quota(config, {
      now: Date.now,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      async login(credentials) {
        const session = new QuotaSession(config.baseURL)
        await session.call('POST', '/v1/auth/login', credentials)
        return session
      },
      checkpoint: journal.checkpoint,
    })
    assertPublicManifestRedacted(manifest, [
      config.initiator.email,
      config.initiator.password,
      config.rival.email,
      config.rival.password,
    ])
    console.log(JSON.stringify(manifest))
  } finally {
    journal.close()
  }
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    const reason = error instanceof QuotaPreparationError
      ? error.code
      : 'preparation-failed'
    console.error(
      `A5 quota preparation failed: ${reason}. Inspect saved evidence and account before rerunning with new paths.`,
    )
    Deno.exit(1)
  }
}
