// Fresh, replaceable A6 human-verification fixtures for the reviewed shared
// beta. This script only uses current HTTP APIs. It never resets an existing
// account: every explicit run creates a unique batch and records credentials in
// a caller-selected 0600 file.

import { resolve } from 'node:path'

import { adminSession, Session } from './http.ts'
import {
  type A6ConfigSnapshot,
  assertA6JourneyCapacity,
  assertFixtureOrigin,
  assertPublicManifestRedacted,
  buildA6TestModeFixtures,
  type FixtureSide,
  type LiveScenarioCandidate,
  optionalCommitSha,
  redactFixtureError,
  REVIEWED_BETA_ORIGIN,
  type ScenarioFixtureEvidence,
  selectA6Scenarios,
  utc8QuotaDate,
  VIVIAN_A6_SOURCE_CAPTURED_AT,
  VIVIAN_A6_SOURCE_REVISION,
  VIVIAN_A6_SOURCE_SHA256,
} from './reviewed-human-fixtures.ts'

type RoleID = 'a6-gate-actor' | 'a6-creation-actor' | 'a6-locked-invitee'

interface RoleSpec {
  id: RoleID
  accountAlias: string
  displayName: string
}

interface PrivateRole extends RoleSpec {
  email: string
  password: string
  accountID?: string
}

interface ModelDTO {
  id: string
  label: string
}

interface ConfigResponse extends A6ConfigSnapshot {
  statsDisplayThreshold: number
  promptUnitLimit: number
  models: ModelDTO[]
  usage: { battlesToday: number; pvpBattlesToday: number }
}

interface ConfigEvidence extends A6ConfigSnapshot {
  statsDisplayThreshold: number
  promptUnitLimit: number
}

interface GateSideProgress {
  beaten: number
  needed: number
}

interface GateProgress {
  a: GateSideProgress
  b: GateSideProgress
}

interface ScenarioSummary {
  id: string
  title: string
  gateUnlocked: boolean
  gateProgress?: GateProgress | null
}

interface ScenarioDetail {
  summary: ScenarioSummary
  presets: Array<{ key: string; side: string; label: string; modelID: string }>
}

interface MyAgent {
  agentID: number
  versionCount: number
  entryVersionID?: number | null
  latestVersionID?: number | null
}

interface MyScenario {
  scenarioID: string
  sides: { a: MyAgent[]; b: MyAgent[] }
  gateProgress: GateProgress
  entryReady: boolean
}

interface AgentVersion {
  id: number
  agentID: number
  modelID: string
  isEntry: boolean
  ordinal: number
  matchCount: number
  winCount: number
}

interface VersionRef {
  versionID: number
  agentID: number
  side: string
  scenarioID: string
  ownerAccountID: string
  modelID: string
}

interface MatchSummary {
  initiatorIsMe: boolean
  participants?: {
    a: { isMine: boolean }
    b: { isMine: boolean }
  } | null
}

interface SavedAgent {
  scenarioSlug: string
  side: FixtureSide
  agentID: number
  versionID: number
  modelID: string
}

type SideAgents = Record<FixtureSide, SavedAgent>

interface PreparedFixtures {
  gateActor?: { primary: SideAgents; other: SideAgents }
  creationActor?: { primary: { a: SavedAgent } }
  lockedInvitee?: { primary: SideAgents; pinnedVersionID: number }
}

interface ScenarioExpectation {
  a: SavedAgent[]
  b: SavedAgent[]
}

interface RoleVerification {
  ownedAgentCount: number
  ownedVersionCount: number
  ownedMatchCount: 0
  usage: { battlesToday: 0; pvpBattlesToday: 0 }
  scenarios: Record<string, {
    gateUnlocked: false
    gateProgress: GateProgress
    entryReady: boolean
  }>
}

interface Preflight {
  config: ConfigEvidence
  minimumJourneyPveWins: number
  pveRetryHeadroom: number
  availableModelIDs: string[]
  selectedModelID: string
  primary: ScenarioFixtureEvidence
  other: ScenarioFixtureEvidence
}

interface PrivateFileIdentity {
  device: number
  inode: number
}

const roleSpecs: RoleSpec[] = [
  {
    id: 'a6-gate-actor',
    accountAlias: 'A6 人测·PVP 门槛账号',
    displayName: 'A6 人测·PVP 门槛',
  },
  {
    id: 'a6-creation-actor',
    accountAlias: 'A6 人测·单侧已保存账号',
    displayName: 'A6 人测·单侧已保存',
  },
  {
    id: 'a6-locked-invitee',
    accountAlias: 'A6 人测·未解锁被约方',
    displayName: 'A6 人测·未解锁被约方',
  },
]

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function bytes(size: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size))
}

function hex(value: Uint8Array): string {
  return [...value]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('')
}

function randomToken(prefix: string, size = 12): string {
  return `${prefix}${hex(bytes(size))}`
}

function timestampBatch(now: Date): string {
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  return `${stamp}-${hex(bytes(4))}`
}

function configEvidence(config: ConfigResponse): ConfigEvidence {
  return {
    dailyBattleLimit: config.dailyBattleLimit,
    pvpDailyLimit: config.pvpDailyLimit,
    concurrencyLimit: config.concurrencyLimit,
    pvpUnlockPerSideWins: config.pvpUnlockPerSideWins,
    statsDisplayThreshold: config.statsDisplayThreshold,
    promptUnitLimit: config.promptUnitLimit,
    opponentDailyChallengeLimit: config.opponentDailyChallengeLimit,
    trialsBlocked: config.trialsBlocked,
  }
}

function sameJSON(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function assertGateZero(
  progress: GateProgress,
  needed: number,
  label: string,
): void {
  invariant(progress?.a?.beaten === 0, `${label} side a gate is not zero`)
  invariant(progress?.b?.beaten === 0, `${label} side b gate is not zero`)
  invariant(progress.a.needed === needed, `${label} side a gate N changed`)
  invariant(progress.b.needed === needed, `${label} side b gate N changed`)
}

function sortedUniqueModelIDs(models: ModelDTO[], label: string): string[] {
  invariant(
    Array.isArray(models) && models.length > 0,
    `${label} returned no models`,
  )
  const ids = models.map((model) => model.id?.trim())
  invariant(ids.every((id) => id), `${label} returned an empty model id`)
  const unique = [...new Set(ids)].sort((left, right) =>
    left.localeCompare(right, 'en')
  )
  invariant(
    unique.length === ids.length,
    `${label} returned duplicate model ids`,
  )
  return unique
}

async function assertOutputAbsent(path: string, label: string): Promise<void> {
  try {
    await Deno.lstat(path)
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return
    throw error
  }
  throw new Error(
    `${label} already exists; choose a new output path for this fresh batch`,
  )
}

async function privatePathIdentity(path: string): Promise<PrivateFileIdentity> {
  const info = await Deno.lstat(path)
  invariant(
    info.isFile && !info.isSymlink,
    'private output is not a regular file',
  )
  invariant(
    info.mode != null && (info.mode & 0o077) === 0,
    'private output permissions are not 0600-equivalent',
  )
  invariant(
    info.dev != null && info.ino != null,
    'private output identity is unavailable',
  )
  return { device: info.dev, inode: info.ino }
}

function assertSamePrivateFile(
  actual: PrivateFileIdentity,
  expected: PrivateFileIdentity,
): void {
  invariant(
    actual.device === expected.device && actual.inode === expected.inode,
    'private output path was replaced during provisioning',
  )
}

async function writeFileFully(
  file: Deno.FsFile,
  content: string,
): Promise<void> {
  const encoded = new TextEncoder().encode(content)
  await file.truncate(0)
  await file.seek(0, Deno.SeekMode.Start)
  let offset = 0
  while (offset < encoded.length) {
    offset += await file.write(encoded.subarray(offset))
  }
  await file.sync()
}

async function readPreflight(
  session: Session,
  requestedPrimary: string | undefined,
  requestedOther: string | undefined,
  requestedModel: string | undefined,
): Promise<Preflight> {
  const config = await session.call<ConfigResponse>('GET', '/v1/config')
  const snapshot = configEvidence(config)
  const minimumJourneyPveWins = assertA6JourneyCapacity(snapshot)
  const pveRetryHeadroom = snapshot.dailyBattleLimit - minimumJourneyPveWins

  const models = await session.call<{ models: ModelDTO[] }>('GET', '/v1/models')
  const configModelIDs = sortedUniqueModelIDs(config.models, 'GET /v1/config')
  const availableModelIDs = sortedUniqueModelIDs(
    models.models,
    'GET /v1/models',
  )
  invariant(
    sameJSON(configModelIDs, availableModelIDs),
    'config and model catalog disagree',
  )
  const selectedModelID = requestedModel?.trim() || availableModelIDs[0]
  invariant(
    availableModelIDs.includes(selectedModelID),
    `requested model ${selectedModelID} is not in the live model catalog`,
  )

  const catalog = await session.call<{ scenarios: ScenarioSummary[] }>(
    'GET',
    '/v1/scenarios',
  )
  invariant(
    Array.isArray(catalog.scenarios),
    'GET /v1/scenarios returned no list',
  )
  const candidates: LiveScenarioCandidate[] = []
  for (const summary of catalog.scenarios) {
    invariant(summary.id?.trim(), 'live catalog returned an empty scenario id')
    const detail = await session.call<ScenarioDetail>(
      'GET',
      `/v1/scenarios/${encodeURIComponent(summary.id)}`,
    )
    invariant(
      detail.summary?.id === summary.id,
      `scenario detail identity mismatch for ${summary.id}`,
    )
    invariant(
      detail.summary.title === summary.title,
      `scenario detail title mismatch for ${summary.id}`,
    )
    candidates.push({
      id: summary.id,
      title: summary.title,
      presets: detail.presets,
    })
  }
  const selected = selectA6Scenarios(
    candidates,
    snapshot.pvpUnlockPerSideWins,
    requestedPrimary,
    requestedOther,
  )
  return {
    config: snapshot,
    minimumJourneyPveWins,
    pveRetryHeadroom,
    availableModelIDs,
    selectedModelID,
    primary: selected.primary,
    other: selected.other,
  }
}

async function signup(
  baseURL: string,
  role: PrivateRole,
  registrationCode: string,
): Promise<Session> {
  const session = new Session(baseURL)
  const response = await session.call<{ account: { id: string } }>(
    'POST',
    '/v1/auth/signup',
    {
      code: registrationCode,
      email: role.email,
      phone: null,
      password: role.password,
      displayName: role.displayName,
    },
  )
  invariant(
    response.account?.id,
    `signup returned no account id for ${role.id}`,
  )
  role.accountID = response.account.id
  return session
}

async function saveEntryAgent(
  session: Session,
  scenarioSlug: string,
  side: FixtureSide,
  name: string,
  modelID: string,
  batch: string,
  roleID: RoleID,
): Promise<SavedAgent> {
  const created = await session.call<{ agentID: number }>(
    'POST',
    '/v1/agents/ensure',
    { scenarioID: scenarioSlug, side },
  )
  invariant(
    Number.isInteger(created.agentID) && created.agentID > 0,
    `${roleID}/${scenarioSlug}/${side} returned an invalid agent id`,
  )
  await session.call('PATCH', `/v1/agents/${created.agentID}`, { name })
  const version = await session.call<AgentVersion>(
    'POST',
    `/v1/agents/${created.agentID}/save`,
    {
      prompt: `【A6 人测 ${roleID}】先回应争点，再给出事实、条件和可核验结论。`,
      modelID,
      parentVersionID: null,
      method: 'raw',
      note: `human-fixture:${batch}:${roleID}:${scenarioSlug}:${side}:v1`,
    },
  )
  invariant(
    version.agentID === created.agentID,
    `${roleID} save returned the wrong agent`,
  )
  invariant(
    Number.isInteger(version.id) && version.id > 0,
    `${roleID} save returned no version`,
  )
  invariant(
    version.modelID === modelID,
    `${roleID} save returned the wrong model`,
  )
  invariant(version.ordinal === 1, `${roleID} fresh agent did not start at v1`)
  invariant(
    version.matchCount === 0 && version.winCount === 0,
    `${roleID} fresh version has a record`,
  )
  await session.call(
    'POST',
    `/v1/agents/${created.agentID}/entry/${version.id}`,
  )
  return {
    scenarioSlug,
    side,
    agentID: created.agentID,
    versionID: version.id,
    modelID,
  }
}

async function bothSides(
  session: Session,
  scenarioSlug: string,
  namePrefix: string,
  modelID: string,
  batch: string,
  roleID: RoleID,
): Promise<SideAgents> {
  return {
    a: await saveEntryAgent(
      session,
      scenarioSlug,
      'a',
      `${namePrefix}甲`,
      modelID,
      batch,
      roleID,
    ),
    b: await saveEntryAgent(
      session,
      scenarioSlug,
      'b',
      `${namePrefix}乙`,
      modelID,
      batch,
      roleID,
    ),
  }
}

function expectedAgents(
  rows: Record<string, ScenarioExpectation>,
): SavedAgent[] {
  return Object.values(rows).flatMap((row) => [...row.a, ...row.b])
}

async function verifyRole(
  session: Session,
  expected: Record<string, ScenarioExpectation>,
  expectedConfig: ConfigEvidence,
): Promise<RoleVerification> {
  const config = await session.call<ConfigResponse>('GET', '/v1/config')
  invariant(
    sameJSON(configEvidence(config), expectedConfig),
    'live config changed while A6 fixtures were being created',
  )
  invariant(
    config.usage?.battlesToday === 0 && config.usage?.pvpBattlesToday === 0,
    'fresh A6 account has non-zero quota usage',
  )

  const inventory = await session.call<{ scenarios: MyScenario[] }>(
    'GET',
    '/v1/my/agents',
  )
  invariant(
    Array.isArray(inventory.scenarios),
    'GET /v1/my/agents returned no list',
  )
  const expectedAll = expectedAgents(expected)
  const seenExpected = new Set<string>()
  let observedAgents = 0
  for (const scenario of inventory.scenarios) {
    assertGateZero(
      scenario.gateProgress,
      expectedConfig.pvpUnlockPerSideWins,
      `inventory ${scenario.scenarioID}`,
    )
    const wanted = expected[scenario.scenarioID] ?? { a: [], b: [] }
    for (const side of ['a', 'b'] as const) {
      const actual = scenario.sides?.[side]
      invariant(
        Array.isArray(actual),
        `${scenario.scenarioID}/${side} has no agent list`,
      )
      observedAgents += actual.length
      const wantedSide = wanted[side]
      invariant(
        actual.length === wantedSide.length,
        `${scenario.scenarioID}/${side} has ${actual.length} agents; expected ${wantedSide.length}`,
      )
      for (const fixture of wantedSide) {
        const row = actual.find((agent) => agent.agentID === fixture.agentID)
        invariant(
          row,
          `${scenario.scenarioID}/${side} is missing agent ${fixture.agentID}`,
        )
        invariant(
          row.versionCount === 1,
          `agent ${fixture.agentID} does not have exactly one version`,
        )
        invariant(
          row.latestVersionID === fixture.versionID,
          `agent ${fixture.agentID} latest version changed`,
        )
        invariant(
          row.entryVersionID === fixture.versionID,
          `agent ${fixture.agentID} is not fielded`,
        )
        seenExpected.add(`${scenario.scenarioID}:${side}:${fixture.agentID}`)
      }
    }
    const expectedEntryReady = wanted.a.length > 0 && wanted.b.length > 0
    invariant(
      scenario.entryReady === expectedEntryReady,
      `${scenario.scenarioID} entryReady is not ${expectedEntryReady}`,
    )
  }
  invariant(
    observedAgents === expectedAll.length,
    'fresh account has an unexpected agent',
  )
  invariant(
    seenExpected.size === expectedAll.length,
    'inventory omitted an expected agent',
  )

  for (const fixture of expectedAll) {
    const listed = await session.call<{
      versions: AgentVersion[]
      entryVersionID?: number | null
    }>('GET', `/v1/agents/${fixture.agentID}/versions`)
    invariant(
      listed.versions?.length === 1,
      `agent ${fixture.agentID} version list is not isolated`,
    )
    const version = listed.versions[0]
    invariant(
      version.id === fixture.versionID,
      `agent ${fixture.agentID} version id changed`,
    )
    invariant(
      version.agentID === fixture.agentID,
      `version ${version.id} belongs to another agent`,
    )
    invariant(
      version.modelID === fixture.modelID,
      `version ${version.id} model changed`,
    )
    invariant(
      version.isEntry === true,
      `version ${version.id} is not the entry version`,
    )
    invariant(version.ordinal === 1, `version ${version.id} is not v1`)
    invariant(
      version.matchCount === 0 && version.winCount === 0,
      `version ${version.id} has match history`,
    )
    invariant(
      listed.entryVersionID === fixture.versionID,
      `agent ${fixture.agentID} entry pointer changed`,
    )
  }

  const catalog = await session.call<{ scenarios: ScenarioSummary[] }>(
    'GET',
    '/v1/scenarios',
  )
  invariant(
    Array.isArray(catalog.scenarios),
    'GET /v1/scenarios returned no list',
  )
  const publicScenarios: RoleVerification['scenarios'] = {}
  for (const [scenarioSlug, wanted] of Object.entries(expected)) {
    const scenario = catalog.scenarios.find((row) => row.id === scenarioSlug)
    invariant(
      scenario,
      `${scenarioSlug} left the live catalog during provisioning`,
    )
    invariant(
      scenario.gateUnlocked === false,
      `${scenarioSlug} unexpectedly unlocked PVP`,
    )
    invariant(scenario.gateProgress, `${scenarioSlug} has no gate progress`)
    assertGateZero(
      scenario.gateProgress,
      expectedConfig.pvpUnlockPerSideWins,
      `catalog ${scenarioSlug}`,
    )
    publicScenarios[scenarioSlug] = {
      gateUnlocked: false,
      gateProgress: scenario.gateProgress,
      entryReady: wanted.a.length > 0 && wanted.b.length > 0,
    }
  }

  const matchList = await session.call<{
    matches: MatchSummary[]
    open: boolean
  }>('GET', '/v1/matches')
  invariant(
    Array.isArray(matchList.matches),
    'GET /v1/matches returned no list',
  )
  const ownedMatches = matchList.matches.filter((match) =>
    match.initiatorIsMe || match.participants?.a?.isMine ||
    match.participants?.b?.isMine
  )
  invariant(ownedMatches.length === 0, 'fresh A6 account has a match')
  if (!matchList.open) {
    invariant(matchList.matches.length === 0, 'private match list is not empty')
  }

  return {
    ownedAgentCount: expectedAll.length,
    ownedVersionCount: expectedAll.length,
    ownedMatchCount: 0,
    usage: { battlesToday: 0, pvpBattlesToday: 0 },
    scenarios: publicScenarios,
  }
}

function publicAgent(fixture: SavedAgent) {
  return {
    agentID: fixture.agentID,
    versionID: fixture.versionID,
    side: fixture.side,
    scenarioSlug: fixture.scenarioSlug,
    modelID: fixture.modelID,
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function main(): Promise<void> {
  const baseURL = Deno.env.get('AXIIA_BASE_URL') ?? ''
  const adminEmail = Deno.env.get('AXIIA_ADMIN_EMAIL') ?? ''
  const adminPassword = Deno.env.get('AXIIA_ADMIN_PASSWORD') ?? ''
  const adminTotpSecret = Deno.env.get('AXIIA_ADMIN_TOTP_SECRET') ?? ''
  const privateOutRaw = Deno.env.get('AXIIA_PRIVATE_OUT') ?? ''
  const publicOutRaw = Deno.env.get('AXIIA_PUBLIC_OUT') ?? ''
  const requestedPrimary = Deno.env.get('AXIIA_A6_PRIMARY_SCENARIO')
  const requestedOther = Deno.env.get('AXIIA_A6_OTHER_SCENARIO')
  const requestedModel = Deno.env.get('AXIIA_A6_MODEL_ID')
  const deploymentRevisionRaw = Deno.env.get('AXIIA_A6_DEPLOYMENT_REVISION')

  invariant(
    Deno.args.length === 1 && Deno.args[0] === '--apply',
    'usage: provision-a6-human.ts --apply',
  )
  assertFixtureOrigin(baseURL)
  invariant(
    adminEmail && adminPassword && adminTotpSecret && privateOutRaw &&
      publicOutRaw,
    'admin credentials and both output paths are required',
  )
  const deploymentRevision = optionalCommitSha(deploymentRevisionRaw)

  const privateOut = resolve(privateOutRaw)
  const publicOut = resolve(publicOutRaw)
  invariant(
    privateOut !== publicOut,
    'private and public output paths must differ',
  )

  const startedAt = new Date()
  const batch = timestampBatch(startedAt)
  const publicGenerationID = randomToken('a6-public-', 8)
  const registrationCode = randomToken('HVA6-', 10)
  const roles: PrivateRole[] = roleSpecs.map((role) => ({
    ...role,
    email: `hv-${role.id}-${batch}@axiia.test`,
    password: randomToken('Hv!', 14),
  }))
  const prepared: PreparedFixtures = {}
  let preflight: Preflight | undefined
  let privateFile: Deno.FsFile | undefined
  let privateIdentity: PrivateFileIdentity | undefined

  const privatePayload = (state: string, failure?: string) => ({
    schemaVersion: 1,
    state,
    fixtureKind: 'a6-human-replaceable-generation',
    resetSemantics: {
      inPlaceReset: false,
      rerunCreatesFreshBatch: true,
    },
    baseURL,
    batch,
    startedAt: startedAt.toISOString(),
    registrationCode,
    roles,
    preflight,
    prepared,
    publicOut,
    ...(failure ? { failure } : {}),
  })

  const writePrivate = async (state: string, failure?: string) => {
    const content = `${
      JSON.stringify(privatePayload(state, failure), null, 2)
    }\n`
    if (!privateFile) {
      privateFile = await Deno.open(privateOut, {
        write: true,
        createNew: true,
        mode: 0o600,
      })
      await Deno.chmod(privateOut, 0o600)
      privateIdentity = await privatePathIdentity(privateOut)
    }
    invariant(privateIdentity, 'private output identity was not captured')
    assertSamePrivateFile(
      await privatePathIdentity(privateOut),
      privateIdentity,
    )
    await writeFileFully(privateFile, content)
    assertSamePrivateFile(
      await privatePathIdentity(privateOut),
      privateIdentity,
    )
  }

  try {
    await assertOutputAbsent(privateOut, 'AXIIA_PRIVATE_OUT')
    await assertOutputAbsent(publicOut, 'AXIIA_PUBLIC_OUT')
    await writePrivate('preflight')

    const admin = await adminSession(
      baseURL,
      adminEmail,
      adminPassword,
      adminTotpSecret,
    )
    const live = await readPreflight(
      admin,
      requestedPrimary,
      requestedOther,
      requestedModel,
    )
    preflight = live
    await writePrivate('preflight-verified')

    await admin.call('POST', '/v1/admin/registration-codes', {
      code: registrationCode,
      uses: roles.length,
    })

    const sessions = new Map<RoleID, Session>()
    for (const role of roles) {
      sessions.set(role.id, await signup(baseURL, role, registrationCode))
      await writePrivate('accounts-in-progress')
    }

    const gateSession = sessions.get('a6-gate-actor')!
    const gateActor = {
      primary: await bothSides(
        gateSession,
        live.primary.slug,
        'A6门槛主场',
        live.selectedModelID,
        batch,
        'a6-gate-actor',
      ),
      other: await bothSides(
        gateSession,
        live.other.slug,
        'A6门槛异场',
        live.selectedModelID,
        batch,
        'a6-gate-actor',
      ),
    }
    prepared.gateActor = gateActor
    await writePrivate('fixtures-in-progress')

    const creationSession = sessions.get('a6-creation-actor')!
    const creationActor = {
      primary: {
        a: await saveEntryAgent(
          creationSession,
          live.primary.slug,
          'a',
          'A6单侧已保存',
          live.selectedModelID,
          batch,
          'a6-creation-actor',
        ),
      },
    }
    prepared.creationActor = creationActor
    await writePrivate('fixtures-in-progress')

    const inviteeSession = sessions.get('a6-locked-invitee')!
    const inviteePrimary = await bothSides(
      inviteeSession,
      live.primary.slug,
      'A6未解锁被约',
      live.selectedModelID,
      batch,
      'a6-locked-invitee',
    )
    const lockedInvitee = {
      primary: inviteePrimary,
      pinnedVersionID: inviteePrimary.a.versionID,
    }
    prepared.lockedInvitee = lockedInvitee
    await writePrivate('fixtures-created')

    const gateVerification = await verifyRole(
      gateSession,
      {
        [live.primary.slug]: {
          a: [gateActor.primary.a],
          b: [gateActor.primary.b],
        },
        [live.other.slug]: {
          a: [gateActor.other.a],
          b: [gateActor.other.b],
        },
      },
      live.config,
    )
    const creationVerification = await verifyRole(
      creationSession,
      {
        [live.primary.slug]: {
          a: [creationActor.primary.a],
          b: [],
        },
      },
      live.config,
    )
    const inviteeVerification = await verifyRole(
      inviteeSession,
      {
        [live.primary.slug]: {
          a: [lockedInvitee.primary.a],
          b: [lockedInvitee.primary.b],
        },
      },
      live.config,
    )

    const lockedRole = roles.find((role) => role.id === 'a6-locked-invitee')!
    invariant(lockedRole.accountID, 'locked invitee has no account id')
    const pinnedRef = await gateSession.call<VersionRef>(
      'GET',
      `/v1/versions/${lockedInvitee.pinnedVersionID}/ref`,
    )
    invariant(
      pinnedRef.versionID === lockedInvitee.pinnedVersionID &&
        pinnedRef.agentID === lockedInvitee.primary.a.agentID &&
        pinnedRef.scenarioID === live.primary.slug &&
        pinnedRef.side === 'a' &&
        pinnedRef.ownerAccountID === lockedRole.accountID &&
        pinnedRef.modelID === live.selectedModelID,
      'locked invitee pinned version did not resolve to the prepared fixture',
    )

    const allAgents = [
      ...Object.values(gateActor.primary),
      ...Object.values(gateActor.other),
      creationActor.primary.a,
      ...Object.values(lockedInvitee.primary),
    ]
    invariant(
      new Set(allAgents.map((agent) => agent.agentID)).size ===
        allAgents.length,
      'prepared roles unexpectedly share an agent id',
    )
    invariant(
      new Set(allAgents.map((agent) => agent.versionID)).size ===
        allAgents.length,
      'prepared roles unexpectedly share a version id',
    )
    invariant(
      roles.every((role) => role.accountID),
      'prepared role has no account id',
    )
    invariant(
      new Set(roles.map((role) => role.accountID)).size === roles.length,
      'prepared roles unexpectedly share an account',
    )

    // Re-read every live input after creation. No remote mutation follows this.
    const finalPreflight = await readPreflight(
      admin,
      live.primary.slug,
      live.other.slug,
      live.selectedModelID,
    )
    invariant(
      sameJSON(finalPreflight, live),
      'live config, models, or selected scenario proof changed during provisioning',
    )

    const completedAt = new Date()
    const publicManifest = {
      schemaVersion: 1,
      fixtureKind: 'a6-human-replaceable-generation',
      environment: baseURL === REVIEWED_BETA_ORIGIN
        ? 'shared-beta'
        : 'isolated-local',
      appBaseUrl: baseURL,
      preparedAt: completedAt.toISOString(),
      quotaDateUtc8: utc8QuotaDate(completedAt),
      generation: {
        id: publicGenerationID,
        inPlaceReset: false,
        rerunCreatesFreshGeneration: true,
      },
      provenance: {
        requestedBy: 'Vivian',
        requestDate: '2026-09-09',
        reviewedSourceRevision: VIVIAN_A6_SOURCE_REVISION,
        reviewedSourceSha256: VIVIAN_A6_SOURCE_SHA256,
        reviewedSourceCapturedAt: VIVIAN_A6_SOURCE_CAPTURED_AT,
        generator: 'v2/web/e2e/provision-a6-human.ts',
        ...(deploymentRevision ? { deploymentRevision } : {}),
      },
      configSnapshot: {
        ...live.config,
        minimumJourneyPveWins: live.minimumJourneyPveWins,
        pveRetryHeadroom: live.pveRetryHeadroom,
        pveOutcomesPreprovisioned: false,
        selectedModelID: live.selectedModelID,
        availableModelIDs: live.availableModelIDs,
        scenarios: {
          primary: live.primary,
          other: live.other,
        },
      },
      testModeFixtures: buildA6TestModeFixtures(
        live.primary.slug,
        live.other.slug,
        gateActor.primary.a.agentID,
        lockedInvitee.pinnedVersionID,
        creationActor.primary.a.agentID,
      ),
      fixtures: {
        gateActor: {
          accountAlias: roleSpecs.find((role) => role.id === 'a6-gate-actor')!
            .accountAlias,
          primary: {
            a: publicAgent(gateActor.primary.a),
            b: publicAgent(gateActor.primary.b),
          },
          other: {
            a: publicAgent(gateActor.other.a),
            b: publicAgent(gateActor.other.b),
          },
          verified: gateVerification,
        },
        creationActor: {
          accountAlias: roleSpecs.find((role) =>
            role.id === 'a6-creation-actor'
          )!
            .accountAlias,
          primary: {
            a: publicAgent(creationActor.primary.a),
            b: [],
          },
          verified: creationVerification,
        },
        lockedInvitee: {
          accountAlias: roleSpecs.find((role) =>
            role.id === 'a6-locked-invitee'
          )!
            .accountAlias,
          primary: {
            a: publicAgent(lockedInvitee.primary.a),
            b: publicAgent(lockedInvitee.primary.b),
          },
          pinnedVersion: {
            versionID: pinnedRef.versionID,
            agentID: pinnedRef.agentID,
            side: pinnedRef.side,
            scenarioSlug: pinnedRef.scenarioID,
            modelID: pinnedRef.modelID,
          },
          verified: inviteeVerification,
        },
      },
    }

    const privateSecrets = [
      adminEmail,
      adminPassword,
      adminTotpSecret,
      registrationCode,
      batch,
      ...roles.flatMap((role) => [
        role.email,
        role.password,
        role.accountID ?? '',
      ]),
    ]
    assertPublicManifestRedacted(publicManifest, privateSecrets)
    await writePrivate('verified')
    await Deno.writeTextFile(
      publicOut,
      `${JSON.stringify(publicManifest, null, 2)}\n`,
      { createNew: true, mode: 0o644 },
    )
    await writePrivate('ready')

    console.log(JSON.stringify({
      ok: true,
      fixtureKind: publicManifest.fixtureKind,
      generationID: publicGenerationID,
      publicManifestWritten: true,
      privateBundleWritten: true,
      primaryScenarioSlug: live.primary.slug,
      otherScenarioSlug: live.other.slug,
      roles: roleSpecs.map((role) => role.id),
    }))
  } catch (error) {
    const raw = errorMessage(error)
    try {
      await writePrivate('failed', raw)
    } catch {
      // Keep the originating failure; an earlier checkpoint remains 0600.
    }
    const redacted = redactFixtureError(raw, [
      privateOutRaw,
      publicOutRaw,
      privateOut,
      publicOut,
      batch,
      adminEmail,
      adminPassword,
      adminTotpSecret,
      registrationCode,
      ...roles.flatMap((role) => [
        role.email,
        role.password,
        role.accountID ?? '',
      ]),
    ])
    throw new Error(redacted)
  } finally {
    privateFile?.close()
  }
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error(`A6 provisioning failed: ${errorMessage(error)}`)
    Deno.exit(1)
  }
}
