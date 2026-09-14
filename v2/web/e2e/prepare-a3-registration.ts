// One-use registration preparation for Vivian's A3 human-verification journey
// on the shared beta. This deliberately does NOT create the player account:
// registration and the resulting automatic login are the first assertions in
// the journey. Secrets exist only in the explicitly supplied private file.

import { adminSession, HttpError } from './http.ts'
import { assertFixtureOrigin } from './reviewed-human-fixtures.ts'

export const reviewedBaseURL = 'https://axiia-cup-2-web.isofucius.cn'

const roleID = 'a3-first-battle'
const displayName = 'A3 人测·全新首战账号'

export interface PreparationEnvironment {
  baseURL: string
  adminEmail: string
  adminPassword: string
  adminTotpSecret: string
  privateOut: string
}

interface ConfigResponse {
  expressPreset?: {
    scenarioID: string
    side: string
    presetKey: string
  } | null
}

interface ScenarioDetail {
  summary: { id: string }
  presets: Array<{ key: string; side: string }>
}

export interface PreparationAdmin {
  call<T>(method: string, path: string, body?: unknown): Promise<T>
}

export interface PreparationOperations {
  now(): Date
  randomBytes(size: number): Uint8Array
  createPrivate(
    path: string,
    bundle: RegistrationBundle,
    state: BundleState,
  ): Promise<void>
  rewritePrivate(
    path: string,
    bundle: RegistrationBundle,
    state: BundleState,
  ): Promise<void>
  openAdmin(config: PreparationEnvironment): Promise<PreparationAdmin>
}

interface PrivateFileInfo {
  isFile: boolean
  isSymlink: boolean
}

export interface PrivateFileIO {
  createNewTextFile(path: string, value: string, mode: number): Promise<void>
  lstat(path: string): Promise<PrivateFileInfo>
  chmod(path: string, mode: number): Promise<void>
  writeTextFile(path: string, value: string): Promise<void>
}

export interface A3PresetSnapshot {
  source: 'GET /v1/config' | 'GET /v1/config + web fallback'
  fetchedAt: string
  scenarioID: string
  playerSide: 'a' | 'b'
  opponentSide: 'a' | 'b'
  opponentPresetKey: string
}

const fallbackScenarioID = 'shangyang-court'
const fallbackPlayerSide = 'a'
const fallbackOpponentSide = 'b'

export interface RegistrationBundle {
  baseURL: string
  createdAt: string
  batch: string
  role: {
    id: typeof roleID
    reviewer: 'Vivian'
    displayName: typeof displayName
  }
  registration: {
    code: string
    uses: 1
    email: string
    password: string
  }
  a3Preset: A3PresetSnapshot | null
  accountCreated: false
}

export type BundleState = 'prepared-locally' | 'ready'

export const usage =
  `Prepare a one-use A3 registration bundle without creating an account.

Usage:
  deno run -A e2e/prepare-a3-registration.ts --apply

Required environment:
  AXIIA_BASE_URL=${reviewedBaseURL}
  AXIIA_ADMIN_EMAIL=<admin email>
  AXIIA_ADMIN_PASSWORD=<admin password>
  AXIIA_ADMIN_TOTP_SECRET=<admin TOTP secret>
  AXIIA_PRIVATE_OUT=<private JSON path>

The private file contains the one-use registration code and proposed credentials.
The account must be created by the reviewer through /register.
For isolated verification, AXIIA_BASE_URL may instead name an HTTP localhost origin.`

export function isHelpRequest(args: readonly string[]) {
  return args.includes('--help') || args.includes('-h')
}

export function validatePreparationRequest(
  args: readonly string[],
  environment: Readonly<PreparationEnvironment>,
): PreparationEnvironment {
  if (args.length !== 1 || args[0] !== '--apply') {
    throw new Error('exactly one --apply argument is required')
  }
  assertFixtureOrigin(environment.baseURL)
  if (
    !environment.adminEmail || !environment.adminPassword ||
    !environment.adminTotpSecret || !environment.privateOut
  ) {
    throw new Error(
      'admin credentials, TOTP secret, and private output path are required',
    )
  }
  if (!environment.privateOut.startsWith('/')) {
    throw new Error('AXIIA_PRIVATE_OUT must be an absolute private file path')
  }
  if (
    ['/dev', '/proc', '/sys'].some((root) =>
      environment.privateOut === root ||
      environment.privateOut.startsWith(`${root}/`)
    )
  ) {
    throw new Error('AXIIA_PRIVATE_OUT must name a regular private file')
  }
  return { ...environment }
}

const bytes = (size: number) => crypto.getRandomValues(new Uint8Array(size))

export function hex(value: Uint8Array) {
  return [...value]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('')
}

export function createRegistrationBundle(
  baseURL: string,
  now = new Date(),
  randomBytes: (size: number) => Uint8Array = bytes,
): RegistrationBundle {
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const batch = `${stamp}-${hex(randomBytes(6))}`
  return {
    baseURL,
    createdAt: now.toISOString(),
    batch,
    role: { id: roleID, reviewer: 'Vivian', displayName },
    registration: {
      code: `HV-A3-${hex(randomBytes(16))}`,
      uses: 1,
      email: `hv-a3-first-battle-${batch}@axiia.test`,
      password: `Hv!${hex(randomBytes(18))}`,
    },
    a3Preset: null,
    accountCreated: false,
  }
}

export function a3PresetSnapshot(
  config: ConfigResponse,
  fetchedAt = new Date(),
): A3PresetSnapshot {
  const preset = config.expressPreset
  if (
    preset == null || !preset.scenarioID || !preset.presetKey ||
    (preset.side !== 'a' && preset.side !== 'b')
  ) {
    throw new Error('GET /v1/config did not resolve a valid expressPreset')
  }
  return {
    source: 'GET /v1/config',
    fetchedAt: fetchedAt.toISOString(),
    scenarioID: preset.scenarioID,
    playerSide: preset.side === 'a' ? 'b' : 'a',
    opponentSide: preset.side,
    opponentPresetKey: preset.presetKey,
  }
}

export function a3FallbackPresetSnapshot(
  detail: ScenarioDetail,
  fetchedAt = new Date(),
): A3PresetSnapshot {
  if (detail.summary?.id !== fallbackScenarioID) {
    throw new Error('A3 web fallback resolved the wrong scenario')
  }
  const opponent = detail.presets?.find((preset) =>
    preset.side === fallbackOpponentSide && preset.key.trim() !== ''
  )
  if (!opponent) {
    throw new Error('A3 web fallback has no opponent-side preset')
  }
  return {
    source: 'GET /v1/config + web fallback',
    fetchedAt: fetchedAt.toISOString(),
    scenarioID: fallbackScenarioID,
    playerSide: fallbackPlayerSide,
    opponentSide: fallbackOpponentSide,
    opponentPresetKey: opponent.key,
  }
}

async function resolveA3Preset(
  admin: PreparationAdmin,
  config: ConfigResponse,
  fetchedAt: Date,
): Promise<A3PresetSnapshot> {
  if (config.expressPreset != null) {
    return a3PresetSnapshot(config, fetchedAt)
  }

  // This is the exact effective fallback in ExpressPage/BuilderPage when the
  // server omits expressPreset: Shangyang Court, player A, first B preset.
  const detail = await admin.call<ScenarioDetail>(
    'GET',
    `/v1/scenarios/${fallbackScenarioID}?side=${fallbackPlayerSide}`,
  )
  return a3FallbackPresetSnapshot(detail, fetchedAt)
}

export function privateDocument(
  bundle: RegistrationBundle,
  state: BundleState,
) {
  return {
    state,
    registrationCodeCreated: state === 'ready',
    ...bundle,
    instructions:
      'Use this bundle once at /register; do not pre-create the account.',
  }
}

export function redactedSuccess(a3Preset: A3PresetSnapshot) {
  return {
    ok: true,
    role: roleID,
    registrationCodeCreated: true,
    accountCreated: false,
    privateOutputWritten: true,
    a3Preset,
    testModeFixtures: {
      a3Preset:
        `${a3Preset.scenarioID} / player ${a3Preset.playerSide} / NPC ${a3Preset.opponentPresetKey}`,
    },
  }
}

const textEncoder = new TextEncoder()

const denoPrivateFileIO: PrivateFileIO = {
  async createNewTextFile(path, value, mode) {
    const file = await Deno.open(path, { write: true, createNew: true, mode })
    try {
      const data = textEncoder.encode(value)
      let offset = 0
      while (offset < data.length) {
        offset += await file.write(data.subarray(offset))
      }
      await file.sync()
    } finally {
      file.close()
    }
  },
  lstat: (path) => Deno.lstat(path),
  chmod: (path, mode) => Deno.chmod(path, mode),
  writeTextFile: (path, value) => Deno.writeTextFile(path, value),
}

function privateJSON(bundle: RegistrationBundle, state: BundleState) {
  return `${JSON.stringify(privateDocument(bundle, state), null, 2)}\n`
}

export async function createPrivateBundle(
  path: string,
  bundle: RegistrationBundle,
  state: BundleState,
  fileIO: PrivateFileIO = denoPrivateFileIO,
) {
  try {
    await fileIO.createNewTextFile(path, privateJSON(bundle, state), 0o600)
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      throw new Error(
        'AXIIA_PRIVATE_OUT already exists; choose a unique path for this generation',
      )
    }
    throw error
  }
  await fileIO.chmod(path, 0o600)
}

export async function rewritePrivateBundle(
  path: string,
  bundle: RegistrationBundle,
  state: BundleState,
  fileIO: PrivateFileIO = denoPrivateFileIO,
) {
  const info = await fileIO.lstat(path)
  if (info.isSymlink || !info.isFile) {
    throw new Error(
      'AXIIA_PRIVATE_OUT must remain the regular file created by this run',
    )
  }
  // Lock an existing bundle down before replacing its secret contents, then
  // reassert the mode after the write.
  await fileIO.chmod(path, 0o600)
  await fileIO.writeTextFile(path, privateJSON(bundle, state))
  await fileIO.chmod(path, 0o600)
}

function environment(): PreparationEnvironment {
  return {
    baseURL: Deno.env.get('AXIIA_BASE_URL') ?? '',
    adminEmail: Deno.env.get('AXIIA_ADMIN_EMAIL') ?? '',
    adminPassword: Deno.env.get('AXIIA_ADMIN_PASSWORD') ?? '',
    adminTotpSecret: Deno.env.get('AXIIA_ADMIN_TOTP_SECRET') ?? '',
    privateOut: Deno.env.get('AXIIA_PRIVATE_OUT') ?? '',
  }
}

export async function prepareA3Registration(
  config: PreparationEnvironment,
  operations: PreparationOperations,
) {
  let bundle = createRegistrationBundle(
    config.baseURL,
    operations.now(),
    operations.randomBytes,
  )

  // This create-new write is the first side effect. It both preserves every
  // proposed credential before remote activity and refuses to overwrite a
  // bundle from an earlier generation.
  await operations.createPrivate(
    config.privateOut,
    bundle,
    'prepared-locally',
  )

  const admin = await operations.openAdmin(config)
  const liveConfig = await admin.call<ConfigResponse>('GET', '/v1/config')
  const preset = await resolveA3Preset(admin, liveConfig, operations.now())
  bundle = {
    ...bundle,
    a3Preset: preset,
  }
  // Preserve the test-day §C2 triple before creating the code as well. Only the
  // non-secret projection is later repeated on stdout.
  await operations.rewritePrivate(
    config.privateOut,
    bundle,
    'prepared-locally',
  )

  await admin.call('POST', '/v1/admin/registration-codes', {
    code: bundle.registration.code,
    uses: 1,
  })

  await operations.rewritePrivate(config.privateOut, bundle, 'ready')
  return { bundle, preset }
}

async function main() {
  if (isHelpRequest(Deno.args)) {
    console.log(usage)
    return
  }

  const config = validatePreparationRequest(Deno.args, environment())
  const { preset } = await prepareA3Registration(config, {
    now: () => new Date(),
    randomBytes: bytes,
    createPrivate: createPrivateBundle,
    rewritePrivate: rewritePrivateBundle,
    openAdmin: (candidate) =>
      adminSession(
        candidate.baseURL,
        candidate.adminEmail,
        candidate.adminPassword,
        candidate.adminTotpSecret,
      ),
  })
  console.log(JSON.stringify(redactedSuccess(preset)))
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    const detail = error instanceof HttpError
      ? `HTTP request failed with status ${error.status}`
      : error instanceof Error
      ? error.message
      : 'unknown error'
    console.error(
      `A3 registration preparation failed: ${detail}`,
    )
    console.error(
      'No account was created. Inspect the private bundle before retrying.',
    )
    Deno.exit(1)
  }
}
