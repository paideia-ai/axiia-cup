import { totp } from './http.ts'
import { assertPublicManifestRedacted } from './reviewed-human-fixtures.ts'
import {
  type EntryAPI,
  type EntryBundle,
  type EntryManifest,
  EntryPreparationError,
  type EntryRequest,
  prepareA6Entry,
  validateEntryRequest,
} from './a6-entry-preparation.ts'

export interface EntryEnvironment extends EntryRequest {
  adminEmail: string
  adminPassword: string
  adminTotpSecret: string
  privateOut: string
  publicOut: string
}

export const usage =
  `Prepare fresh A6 S01 entry-switch and S02 first-save accounts.
Creates exactly two accounts, four agents and four saved versions through supported
APIs. No model inference, gameplay, entry switching or shared-account resets.

Usage: deno task prepare:human:a6-entry --apply

Required environment (keep credentials out of shell history):
  AXIIA_BASE_URL=https://axiia-cup-2-web.isofucius.cn
  AXIIA_ADMIN_EMAIL=<admin email>
  AXIIA_ADMIN_PASSWORD=<admin password>
  AXIIA_ADMIN_TOTP_SECRET=<admin TOTP secret>
  AXIIA_A6_ENTRY_SCENARIO=<explicit live scenario slug>
  AXIIA_PRIVATE_OUT=<new absolute private .jsonl path>
  AXIIA_PUBLIC_OUT=<new absolute redacted .json path>
Optional: AXIIA_A6_ENTRY_MODEL_ID=<selectable model ID>

The first-save account is left untouched after creating its empty agent shell.
Each rerun uses NEW output paths and creates new accounts. A partial run is never
resumed or blindly retried: inspect the private journal for committed/ambiguous
writes before preparing a replacement. Output state=ready proves the initial
fixture state, not completion of Vivian's human test. Start a new Test Mode round
and fill its three session fields from testModeFixtures in the public manifest.
This command does not prepare S03-S08 or the separate three-role A6 gate pack.
An HTTP loopback origin is supported for isolated verification.`

export function validateEntryCLI(
  args: readonly string[],
  config: EntryEnvironment,
) {
  if (args.length !== 1 || args[0] !== '--apply') {
    throw new EntryPreparationError('exactly-one-apply-argument-required')
  }
  validateEntryRequest(config)
  if (!config.adminEmail || !config.adminPassword || !config.adminTotpSecret) {
    throw new EntryPreparationError('admin-credentials-required')
  }
  for (const path of [config.privateOut, config.publicOut]) {
    if (
      !path.startsWith('/') || path.endsWith('/') ||
      path.split('/').some((part) => part === '.' || part === '..') ||
      ['/dev', '/proc', '/sys'].some((root) =>
        path === root || path.startsWith(`${root}/`)
      )
    ) {
      throw new EntryPreparationError(
        'new-absolute-regular-output-paths-required',
      )
    }
  }
  if (config.privateOut === config.publicOut) {
    throw new EntryPreparationError('distinct-output-paths-required')
  }
  return config
}

export class EntryHTTPError extends EntryPreparationError {
  constructor(readonly status: number) {
    super(`entry-http-status-${status}`)
  }
}

// The allowed mutation set deliberately excludes matches, draft edits and entry marks.
export class EntrySession implements EntryAPI {
  private cookies = new Map<string, string>()
  constructor(private baseURL: string, private request: typeof fetch = fetch) {}

  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const permitted = method === 'GET'
      ? /^\/v1\/(?:config|models|scenarios(?:\/[a-z0-9-]+)?|my\/agents|matches|auth\/me|agents\/\d+\/(?:draft|versions)|versions\/\d+\/ref)$/
        .test(path)
      : method === 'POST' &&
        /^\/v1\/(?:auth\/(?:login|elevate|signup)|admin\/registration-codes|agents(?:\/\d+\/save)?)$/
          .test(path)
    if (!permitted) {
      throw new EntryPreparationError('unsupported-entry-preparation-request')
    }
    const headers = new Headers({ 'Sec-Fetch-Site': 'same-origin' })
    if (this.cookies.size) {
      headers.set(
        'Cookie',
        [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '),
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
    for (const raw of response.headers.getSetCookie()) {
      const head = raw.split(';')[0]
      const split = head.indexOf('=')
      if (split < 1) continue
      const key = head.slice(0, split)
      const value = head.slice(split + 1)
      if (value) this.cookies.set(key, value)
      else this.cookies.delete(key)
    }
    const result = await response.json().catch(() => undefined)
    if (!response.ok) throw new EntryHTTPError(response.status)
    if (result === undefined) {
      throw new EntryPreparationError('invalid-json-response')
    }
    return result as T
  }
}

async function openAdmin(config: EntryEnvironment) {
  const api = new EntrySession(config.baseURL)
  await api.call('POST', '/v1/auth/login', {
    email: config.adminEmail,
    password: config.adminPassword,
  })
  const deadline = Date.now() + 120_000
  const attempted = new Set<number>()
  while (Date.now() < deadline) {
    const now = Math.floor(Date.now() / 1000)
    let throttled = false
    for (const at of [now, now + 30]) {
      const counter = Math.floor(at / 30)
      if (attempted.has(counter)) continue
      attempted.add(counter)
      try {
        await api.call('POST', '/v1/auth/elevate', {
          code: await totp(config.adminTotpSecret, at),
        })
        return api
      } catch (error) {
        if (!(error instanceof EntryHTTPError)) throw error
        if (error.status === 429) {
          attempted.delete(counter)
          throttled = true
          break
        }
        if (error.status !== 401) throw error
      }
    }
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.max(
          0,
          Math.min(
            throttled ? 60_000 : (31 - now % 30) * 1000,
            deadline - Date.now(),
          ),
        ),
      )
    )
  }
  throw new EntryPreparationError('admin-elevation-deadline')
}

export async function createEntryJournal(config: EntryEnvironment) {
  const files: Array<
    { path: string; handle: Deno.FsFile; info: Deno.FileInfo }
  > = []
  const close = () => files.forEach(({ handle }) => handle.close())
  async function verify(index: number) {
    const file = files[index]
    const info = await Deno.lstat(file.path)
    if (
      !info.isFile || info.isSymlink || info.dev !== file.info.dev ||
      info.ino !== file.info.ino || info.mode == null ||
      (info.mode & 0o077) !== 0
    ) throw new EntryPreparationError('output-path-replaced-or-not-private')
  }
  async function write(index: number, data: unknown, append: boolean) {
    await verify(index)
    const handle = files[index].handle
    if (!append) {
      await handle.truncate(0)
      await handle.seek(0, Deno.SeekMode.Start)
    }
    const bytes = new TextEncoder().encode(`${JSON.stringify(data)}\n`)
    let offset = 0
    while (offset < bytes.length) {
      offset += await handle.write(bytes.subarray(offset))
    }
    await handle.sync()
    await verify(index)
  }
  try {
    for (const path of [config.privateOut, config.publicOut]) {
      const handle = await Deno.open(path, {
        write: true,
        createNew: true,
        mode: 0o600,
      })
      files.push({ path, handle, info: await handle.stat() })
    }
  } catch {
    close()
    throw new EntryPreparationError('cannot-reserve-new-output-files')
  }
  return {
    close,
    async checkpoint(bundle: EntryBundle, manifest: EntryManifest) {
      assertPublicManifestRedacted(manifest, [
        config.adminEmail,
        config.adminPassword,
        config.adminTotpSecret,
        config.privateOut,
        bundle.registrationCode,
        ...bundle.roles.flatMap((
          role,
        ) => [role.email, role.password, role.accountID ?? '']),
      ])
      await write(0, { record: 'checkpoint', bundle, manifest }, true)
      await write(1, manifest, false)
    },
  }
}

export async function runEntryCLI(
  args: readonly string[],
  config: EntryEnvironment,
) {
  validateEntryCLI(args, config)
  const journal = await createEntryJournal(config)
  try {
    return await prepareA6Entry(config, {
      now: () => new Date(),
      randomBytes: (size) => crypto.getRandomValues(new Uint8Array(size)),
      openAdmin: () => openAdmin(config),
      openPlayer: () => new EntrySession(config.baseURL),
      checkpoint: journal.checkpoint,
    })
  } finally {
    journal.close()
  }
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(usage)
  } else {
    try {
      const manifest = await runEntryCLI(Deno.args, {
        baseURL: Deno.env.get('AXIIA_BASE_URL') ?? '',
        scenarioID: Deno.env.get('AXIIA_A6_ENTRY_SCENARIO') ?? '',
        modelID: Deno.env.get('AXIIA_A6_ENTRY_MODEL_ID'),
        adminEmail: Deno.env.get('AXIIA_ADMIN_EMAIL') ?? '',
        adminPassword: Deno.env.get('AXIIA_ADMIN_PASSWORD') ?? '',
        adminTotpSecret: Deno.env.get('AXIIA_ADMIN_TOTP_SECRET') ?? '',
        privateOut: Deno.env.get('AXIIA_PRIVATE_OUT') ?? '',
        publicOut: Deno.env.get('AXIIA_PUBLIC_OUT') ?? '',
      })
      console.log(
        JSON.stringify({
          ok: true,
          state: manifest.state,
          testModeFixtures: manifest.testModeFixtures,
        }),
      )
    } catch (error) {
      console.error(
        JSON.stringify({
          ok: false,
          error: error instanceof EntryPreparationError
            ? error.code
            : 'entry-preparation-failed',
        }),
      )
      Deno.exitCode = 1
    }
  }
}
