import { QuotaPreparationError } from './a5-quota-preparation.ts'
import {
  type A6QuotaCheckpoint,
  type A6QuotaManifest,
  type A6QuotaRequest,
  prepareA6Quota,
  validateA6QuotaRequest,
} from './a6-quota-preparation.ts'
import {
  createPreparationJournal,
  QuotaSession,
  validateQuotaOutputPaths,
} from './prepare-a5-quota.ts'
import { totp } from './http.ts'
import { a6SignupInputError } from './a6-signup-input.ts'
import { assertPublicManifestRedacted } from './reviewed-human-fixtures.ts'

export interface A6QuotaEnvironment extends A6QuotaRequest {
  adminEmail: string
  adminPassword: string
  adminTotpSecret: string
  privateOut: string
  publicOut: string
  resumeFrom?: string
}
export const usage =
  `Prepare a fresh dedicated A6 S06 total-quota actor, or resume its recorded run.
REAL Hotseat matches consume model usage and total quota; no PVP quota is spent.

Usage: deno task prepare:human:a6-quota --apply [--resume]
Required: AXIIA_BASE_URL, AXIIA_A6_QUOTA_SCENARIO, AXIIA_A6_QUOTA_MODEL_ID,
AXIIA_A6_QUOTA_MAX_MATCHES (explicit 0..20 for the WHOLE preparation),
AXIIA_PRIVATE_OUT and AXIIA_PUBLIC_OUT (two NEW absolute paths, both mode0600).
Fresh run requires exactly one signup source: AXIIA_A6_REGISTRATION_CODE
(authorized, unreserved code with >=1 available use), OR AXIIA_ADMIN_EMAIL,
AXIIA_ADMIN_PASSWORD and AXIIA_ADMIN_TOTP_SECRET. Codes must be 8..256 characters
without whitespace/control characters; never use the reserved A3 code.
Supplied-code mode makes no admin login/elevation/code-creation request. Config
and cost-limit checks require the first accepted signup; failure is partial,
never an automatic replacement account/code. No code goes to public output.
It creates one dedicated account and two saved v1s.
--resume instead requires AXIIA_A6_QUOTA_RESUME_FROM (previous private JSONL).
Resume uses the recorded player credentials, never provisions another actor,
waits accepted IDs and preserves the original full-run budget/UTC+8 expiry.
Optional AXIIA_A6_QUOTA_MATCH_TIMEOUT_SECONDS=600 (1..1800 per match).

Do not run concurrently or reuse A5/entry/first-save actors. No POST is retried.
Resume exclusively locks its input journal (.resume.lock); after an interrupted
process, inspect the actor/journal before manually removing a stale lock.
Copies of a journal must never be resumed concurrently.
Uncertain mutation outcomes require inspection; the command refuses blind resume.
Resume a timed-out accepted match with NEW output paths. After UTC+8 midnight,
use a fresh run/account; expired checkpoints cannot continue. A ready manifest
proves total N/N, PVP0, actual PVE429 daily_limit and unchanged matches/counters.
Human S06: open own A agent, 出战 → 左右手互搏; its own B agent is selected
automatically and uses B's ★ entry. Check that entry ID against the manifest,
then click enabled 自打一场; require exactly 今日次数已用完（N/N），明天再来.
No production fixture is ready merely because an isolated verification passed.`

export function validateA6QuotaCLI(
  args: readonly string[],
  config: A6QuotaEnvironment,
) {
  if (
    !(args.length === 1 && args[0] === '--apply') &&
    !(args.length === 2 && args[0] === '--apply' && args[1] === '--resume')
  ) {
    throw new QuotaPreparationError('use-apply-or-apply-resume')
  }
  validateA6QuotaRequest(config)
  validateQuotaOutputPaths(config)
  const resume = args.includes('--resume')
  if (resume !== !!config.resumeFrom) {
    throw new QuotaPreparationError(
      'resume-flag-and-private-journal-required-together',
    )
  }
  const inputError = a6SignupInputError(config, resume)
  if (inputError) throw new QuotaPreparationError(inputError)
  if (
    config.resumeFrom &&
    (!config.resumeFrom.startsWith('/') ||
      [config.privateOut, config.publicOut].includes(config.resumeFrom))
  ) throw new QuotaPreparationError('resume-path-must-be-distinct-and-absolute')
  return config
}

export async function readA6QuotaCheckpoint(
  path: string,
): Promise<A6QuotaCheckpoint> {
  const before = await Deno.lstat(path)
  if (
    !before.isFile || before.isSymlink || before.mode == null ||
    (before.mode & 0o077) !== 0 || before.size > 16 * 1024 * 1024
  ) {
    throw new QuotaPreparationError(
      'resume-journal-must-be-private-regular-file',
    )
  }
  const file = await Deno.open(path, { read: true })
  try {
    const after = await file.stat()
    if (before.dev !== after.dev || before.ino !== after.ino) {
      throw new QuotaPreparationError('resume-journal-replaced')
    }
    const text = await new Response(file.readable).text()
    const lines = text.split('\n')
    lines.pop()
    let latest: A6QuotaCheckpoint | undefined
    for (const line of lines) {
      const record = JSON.parse(line)
      if (record.record === 'checkpoint' && record.bundle && record.manifest) {
        latest = { bundle: record.bundle, manifest: record.manifest }
      }
    }
    if (!latest) throw new QuotaPreparationError('resume-checkpoint-missing')
    return latest
  } finally {
    try {
      file.close()
    } catch { /* Reading the stream closes its file. */ }
  }
}

/** Never wait for or automatically remove a possibly active/stale resume lock. */
export async function lockA6QuotaResume(path: string) {
  const lockPath = `${path}.resume.lock`
  let file: Deno.FsFile
  try {
    file = await Deno.open(lockPath, {
      write: true,
      createNew: true,
      mode: 0o600,
    })
  } catch {
    throw new QuotaPreparationError(
      'resume-locked-inspect-before-removing-lock',
    )
  }
  const original = await file.stat()
  await file.sync()
  return async () => {
    file.close()
    const current = await Deno.lstat(lockPath)
    if (
      !current.isFile || current.isSymlink || current.dev !== original.dev ||
      current.ino !== original.ino
    ) {
      throw new QuotaPreparationError('resume-lock-replaced')
    }
    await Deno.remove(lockPath)
  }
}

function environment(): A6QuotaEnvironment {
  const env = (key: string) => Deno.env.get(key) ?? ''
  return {
    baseURL: env('AXIIA_BASE_URL'),
    scenarioID: env('AXIIA_A6_QUOTA_SCENARIO'),
    modelID: env('AXIIA_A6_QUOTA_MODEL_ID'),
    maxMatches: env('AXIIA_A6_QUOTA_MAX_MATCHES').trim()
      ? Number(env('AXIIA_A6_QUOTA_MAX_MATCHES'))
      : NaN,
    matchTimeoutSeconds: Number(
      env('AXIIA_A6_QUOTA_MATCH_TIMEOUT_SECONDS') || '600',
    ),
    adminEmail: env('AXIIA_ADMIN_EMAIL'),
    adminPassword: env('AXIIA_ADMIN_PASSWORD'),
    adminTotpSecret: env('AXIIA_ADMIN_TOTP_SECRET'),
    registrationCode: Deno.env.get('AXIIA_A6_REGISTRATION_CODE'),
    privateOut: env('AXIIA_PRIVATE_OUT'),
    publicOut: env('AXIIA_PUBLIC_OUT'),
    ...(env('AXIIA_A6_QUOTA_RESUME_FROM')
      ? { resumeFrom: env('AXIIA_A6_QUOTA_RESUME_FROM') }
      : {}),
  }
}

async function main() {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(usage)
    return
  }
  const config = validateA6QuotaCLI(Deno.args, environment())
  const unlock = config.resumeFrom
    ? await lockA6QuotaResume(config.resumeFrom)
    : undefined
  try {
    await run(config)
  } finally {
    await unlock?.()
  }
}

async function run(config: A6QuotaEnvironment) {
  const previous = config.resumeFrom
    ? await readA6QuotaCheckpoint(config.resumeFrom)
    : undefined
  const secrets = [
    config.adminEmail,
    config.adminPassword,
    config.adminTotpSecret,
    config.registrationCode ?? '',
  ]
  const journal = await createPreparationJournal<A6QuotaManifest>(config, {
    record: 'preparation',
    baseURL: config.baseURL,
    scenarioID: config.scenarioID,
  }, secrets)
  try {
    const manifest = await prepareA6Quota(config, {
      now: Date.now,
      randomBytes: (size) => crypto.getRandomValues(new Uint8Array(size)),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      openPlayer: () => new QuotaSession(config.baseURL),
      async openAdmin() {
        const admin = new QuotaSession(config.baseURL)
        await admin.call('POST', '/v1/auth/login', {
          email: config.adminEmail,
          password: config.adminPassword,
        })
        await admin.call('POST', '/v1/auth/elevate', {
          code: await totp(config.adminTotpSecret),
        })
        return admin
      },
      async checkpoint({ bundle, manifest }) {
        assertPublicManifestRedacted(manifest, [
          ...secrets,
          bundle.actor.email,
          bundle.actor.password,
          bundle.registrationCode,
        ])
        await journal.checkpoint(manifest, {
          record: 'checkpoint',
          bundle,
          manifest,
        })
      },
    }, previous)
    console.log(JSON.stringify(manifest))
  } finally {
    journal.close()
  }
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error(
      `A6 quota preparation failed: ${
        error instanceof QuotaPreparationError
          ? error.code
          : 'preparation-failed'
      }. Inspect the private journal; no POST was retried.`,
    )
    Deno.exit(1)
  }
}
