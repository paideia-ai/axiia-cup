import type {
  AgentVersionDTO,
  ConfigResponse,
  MyAgentsResponse,
  VersionListResponse,
  VersionRefResponse,
} from '../src/api/types.ts'
import {
  assertFixtureOrigin,
  REVIEWED_BETA_ORIGIN,
  VIVIAN_A6_SOURCE_CAPTURED_AT,
  VIVIAN_A6_SOURCE_REVISION,
  VIVIAN_A6_SOURCE_SHA256,
} from './reviewed-human-fixtures.ts'

export interface EntryAPI {
  call<T>(method: string, path: string, body?: unknown): Promise<T>
}

export interface EntryRequest {
  baseURL: string
  scenarioID: string
  modelID?: string
}

export class EntryPreparationError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'EntryPreparationError'
  }
}

function requireState(value: unknown, code: string): asserts value {
  if (!value) throw new EntryPreparationError(code)
}

export const entryRoles = [
  { id: 'a6-entry', accountAlias: 'A6 人测·参赛版本切换' },
  { id: 'a6-entry-first-save', accountAlias: 'A6 人测·首存自动参赛' },
] as const
export type EntryRoleID = typeof entryRoles[number]['id']

export interface EntryAgent {
  agentID: number
  side: 'a' | 'b'
  versions: Array<{ id: number; ordinal: number; isEntry: boolean }>
}

export interface PrivateEntryRole {
  id: EntryRoleID
  accountAlias: string
  email: string
  password: string
  accountID?: string
  agents: EntryAgent[]
}

export interface EntryBundle {
  registrationCode: string
  roles: PrivateEntryRole[]
  pendingOperation?: { roleID?: EntryRoleID; action: string; agentID?: number }
}

export interface EntryManifest {
  schemaVersion: 1
  fixtureKind: 'a6-entry-first-save'
  state: 'preparing' | 'partial' | 'ready'
  environment: 'shared-beta' | 'isolated-local'
  appBaseUrl: string
  generation: {
    id: string
    inPlaceReset: false
    rerunCreatesFreshGeneration: true
  }
  preparedAt: string
  scenarioID: string
  modelID?: string
  steps: readonly ['HV-A6-ENTRY-QUOTA-S01', 'HV-A6-ENTRY-QUOTA-S02']
  provenance: {
    sourceRevision: string
    sourceSha256: string
    sourceCapturedAt: string
  }
  fixtures: Array<{
    roleID: EntryRoleID
    accountAlias: string
    agents: EntryAgent[]
    verified: boolean
  }>
  testModeFixtures: Partial<
    Record<
      'a6EntryAgentId' | 'a6EntrySiblingAgentId' | 'a6NoEntryAgentId',
      string
    >
  >
  verification?: {
    ownedMatches: 0
    battlesToday: 0
    pvpBattlesToday: 0
    firstSaveDraftEmpty: true
    modelsInvoked: false
  }
  failure?: string
}

export interface EntryOperations {
  now(): Date
  randomBytes(size: number): Uint8Array
  openAdmin(): Promise<EntryAPI>
  openPlayer(): EntryAPI
  checkpoint(bundle: EntryBundle, manifest: EntryManifest): Promise<void>
}

const token = (bytes: Uint8Array) =>
  [...bytes].map((n) => n.toString(16).padStart(2, '0')).join('')
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const positiveID = (id: number) => Number.isSafeInteger(id) && id > 0

export function validateEntryRequest(request: EntryRequest) {
  assertFixtureOrigin(request.baseURL)
  requireState(
    /^[a-z0-9][a-z0-9-]*$/.test(request.scenarioID),
    'explicit-scenario-slug-required',
  )
  requireState(
    request.modelID === undefined || request.modelID.trim().length > 0,
    'invalid-requested-model',
  )
}

async function readInputs(api: EntryAPI, request: EntryRequest) {
  const config = await api.call<ConfigResponse>('GET', '/v1/config')
  const catalog = await api.call<{ scenarios: Array<{ id: string }> }>(
    'GET',
    '/v1/scenarios',
  )
  requireState(
    catalog.scenarios?.some((row) => row.id === request.scenarioID),
    'scenario-not-live',
  )
  const detail = await api.call<{ summary: { id: string } }>(
    'GET',
    `/v1/scenarios/${request.scenarioID}`,
  )
  requireState(
    detail.summary?.id === request.scenarioID,
    'scenario-identity-mismatch',
  )
  const models = await api.call<{ models: Array<{ id: string }> }>(
    'GET',
    '/v1/models',
  )
  const modelIDs = models.models?.map((model) => model.id).sort()
  requireState(
    modelIDs?.length &&
      modelIDs.every((id) => typeof id === 'string' && id.length > 0),
    'no-selectable-models',
  )
  requireState(
    new Set(modelIDs).size === modelIDs.length &&
      same(modelIDs, config.models?.map((model) => model.id).sort()),
    'model-catalog-mismatch',
  )
  requireState(
    Number.isSafeInteger(config.pvpUnlockPerSideWins) &&
      config.pvpUnlockPerSideWins >= 0,
    'invalid-gate-config',
  )
  const modelID = request.modelID ?? modelIDs[0]
  requireState(modelIDs.includes(modelID), 'requested-model-unavailable')
  return { modelID, modelIDs, gateWins: config.pvpUnlockPerSideWins }
}

async function verifyRole(
  api: EntryAPI,
  role: PrivateEntryRole,
  request: EntryRequest,
  modelID: string,
  gateWins: number,
) {
  const me = await api.call<
    {
      account: {
        id: string
        email: string
        displayName: string | null
        isAdmin: boolean
      }
    }
  >('GET', '/v1/auth/me')
  requireState(
    me.account?.id === role.accountID && me.account.email === role.email &&
      me.account.displayName === role.accountAlias &&
      me.account.isAdmin === false,
    'player-identity-mismatch',
  )
  const config = await api.call<ConfigResponse>('GET', '/v1/config')
  requireState(
    config.usage?.battlesToday === 0 && config.usage.pvpBattlesToday === 0,
    'fresh-role-has-quota-usage',
  )
  requireState(
    config.pvpUnlockPerSideWins === gateWins &&
      config.models.some((model) => model.id === modelID),
    'player-config-changed',
  )
  const inventory = await api.call<MyAgentsResponse>('GET', '/v1/my/agents')
  const target = inventory.scenarios?.find((row) =>
    row.scenarioID === request.scenarioID
  )
  requireState(target, 'prepared-scenario-missing')
  const all = inventory.scenarios.flatMap((
    row,
  ) => [...row.sides.a, ...row.sides.b])
  requireState(all.length === role.agents.length, 'unexpected-owned-agent')
  for (const scenario of inventory.scenarios) {
    requireState(
      scenario.gateProgress.a.beaten === 0 &&
        scenario.gateProgress.b.beaten === 0 &&
        scenario.gateProgress.a.needed === gateWins &&
        scenario.gateProgress.b.needed === gateWins,
      'fresh-role-gate-not-zero',
    )
  }
  requireState(
    target.entryReady === (role.id === 'a6-entry'),
    'entry-ready-mismatch',
  )
  for (const agent of role.agents) {
    const row = target.sides[agent.side].find((item) =>
      item.agentID === agent.agentID
    )
    const entryID = agent.versions.find((version) => version.isEntry)?.id
    const latestID = agent.versions.at(-1)?.id
    requireState(
      row && row.versionCount === agent.versions.length &&
        (row.entryVersionID ?? undefined) === entryID &&
        (row.latestVersionID ?? undefined) === latestID,
      'inventory-version-matrix-mismatch',
    )
    const listed = await api.call<VersionListResponse>(
      'GET',
      `/v1/agents/${agent.agentID}/versions`,
    )
    requireState(
      listed.versions?.length === agent.versions.length &&
        (listed.entryVersionID ?? undefined) === entryID,
      'saved-version-count-or-entry-mismatch',
    )
    for (const expected of agent.versions) {
      const actual = listed.versions.find((version) =>
        version.id === expected.id
      )
      requireState(
        actual && actual.agentID === agent.agentID &&
          actual.ordinal === expected.ordinal &&
          actual.isEntry === expected.isEntry && actual.modelID === modelID &&
          actual.matchCount === 0 && actual.winCount === 0,
        'saved-version-matrix-mismatch',
      )
      const ref = await api.call<VersionRefResponse>(
        'GET',
        `/v1/versions/${expected.id}/ref`,
      )
      requireState(
        ref.versionID === expected.id && ref.agentID === agent.agentID &&
          ref.side === agent.side && ref.scenarioID === request.scenarioID &&
          ref.ownerAccountID === role.accountID && ref.modelID === modelID,
        'version-owner-mismatch',
      )
    }
  }
  if (role.id === 'a6-entry-first-save') {
    const draft = await api.call<
      { fields: Record<string, string>; side: string; scenarioID: string }
    >('GET', `/v1/agents/${role.agents[0].agentID}/draft`)
    requireState(
      draft.scenarioID === request.scenarioID && draft.side === 'a' &&
        draft.fields && Object.keys(draft.fields).length === 0,
      'first-save-draft-not-empty',
    )
  }
  const history = await api.call<
    {
      open: boolean
      matches: Array<
        {
          initiatorIsMe: boolean
          participants?: { a: { isMine: boolean }; b: { isMine: boolean } }
        }
      >
    }
  >('GET', '/v1/matches')
  requireState(
    Array.isArray(history.matches) &&
      history.matches.every((match) =>
        !match.initiatorIsMe && !match.participants?.a.isMine &&
        !match.participants?.b.isMine
      ) && (history.open || history.matches.length === 0),
    'fresh-role-has-matches',
  )
}

export async function prepareA6Entry(
  request: EntryRequest,
  operations: EntryOperations,
): Promise<EntryManifest> {
  validateEntryRequest(request)
  const nonce = token(operations.randomBytes(12))
  const bundle: EntryBundle = {
    registrationCode: `HVA6E-${token(operations.randomBytes(16))}`,
    roles: entryRoles.map((role) => ({
      ...role,
      email: `hv-${role.id}-${nonce}@axiia.test`,
      password: `Hv!${token(operations.randomBytes(18))}`,
      agents: [],
    })),
  }
  const manifest: EntryManifest = {
    schemaVersion: 1,
    fixtureKind: 'a6-entry-first-save',
    state: 'preparing',
    environment: request.baseURL === REVIEWED_BETA_ORIGIN
      ? 'shared-beta'
      : 'isolated-local',
    appBaseUrl: request.baseURL,
    generation: {
      id: `a6-entry-${token(operations.randomBytes(12))}`,
      inPlaceReset: false,
      rerunCreatesFreshGeneration: true,
    },
    preparedAt: operations.now().toISOString(),
    scenarioID: request.scenarioID,
    steps: ['HV-A6-ENTRY-QUOTA-S01', 'HV-A6-ENTRY-QUOTA-S02'],
    provenance: {
      sourceRevision: VIVIAN_A6_SOURCE_REVISION,
      sourceSha256: VIVIAN_A6_SOURCE_SHA256,
      sourceCapturedAt: VIVIAN_A6_SOURCE_CAPTURED_AT,
    },
    fixtures: [],
    testModeFixtures: {},
  }
  const checkpoint = async () => {
    manifest.fixtures = bundle.roles.map((role) => ({
      roleID: role.id,
      accountAlias: role.accountAlias,
      agents: structuredClone(role.agents),
      verified: manifest.state === 'ready',
    }))
    await operations.checkpoint(bundle, manifest)
  }
  const mutate = async <T>(
    api: EntryAPI,
    action: string,
    path: string,
    body: unknown,
    role?: PrivateEntryRole,
    agentID?: number,
  ): Promise<T> => {
    bundle.pendingOperation = {
      action,
      ...(role ? { roleID: role.id } : {}),
      ...(agentID ? { agentID } : {}),
    }
    await checkpoint()
    const result = await api.call<T>('POST', path, body)
    delete bundle.pendingOperation
    return result
  }
  try {
    await checkpoint()
    const admin = await operations.openAdmin()
    const inputs = await readInputs(admin, request)
    manifest.modelID = inputs.modelID
    await mutate(
      admin,
      'create-registration-code',
      '/v1/admin/registration-codes',
      { code: bundle.registrationCode, uses: 2 },
    )
    const sessions: EntryAPI[] = []
    for (const role of bundle.roles) {
      const api = operations.openPlayer()
      const response = await mutate<
        { account: { id: string; email: string; isAdmin: boolean } }
      >(api, 'signup', '/v1/auth/signup', {
        code: bundle.registrationCode,
        email: role.email,
        password: role.password,
        displayName: role.accountAlias,
      }, role)
      requireState(
        response.account?.id && response.account.email === role.email &&
          response.account.isAdmin === false,
        'signup-identity-mismatch',
      )
      role.accountID = response.account.id
      requireState(
        !bundle.roles.some((other) =>
          other !== role && other.accountID === role.accountID
        ),
        'roles-share-account',
      )
      sessions.push(api)
      await checkpoint()
    }
    const create = async (
      api: EntryAPI,
      role: PrivateEntryRole,
      side: 'a' | 'b',
      name: string,
    ) => {
      const created = await mutate<{ agentID: number }>(
        api,
        'create-agent',
        '/v1/agents',
        { scenarioID: request.scenarioID, side, name },
        role,
      )
      requireState(
        positiveID(created.agentID) &&
          !bundle.roles.some((r) =>
            r.agents.some((a) => a.agentID === created.agentID)
          ),
        'invalid-or-reused-agent-id',
      )
      const agent: EntryAgent = { agentID: created.agentID, side, versions: [] }
      role.agents.push(agent)
      await checkpoint()
      return agent
    }
    const save = async (
      api: EntryAPI,
      role: PrivateEntryRole,
      agent: EntryAgent,
      isEntry: boolean,
    ) => {
      const ordinal = agent.versions.length + 1
      const actual = await mutate<AgentVersionDTO>(
        api,
        'save-version',
        `/v1/agents/${agent.agentID}/save`,
        {
          prompt:
            `A6 entry fixture ${agent.side} revision ${ordinal}. State a claim, evidence, and a condition.`,
          modelID: inputs.modelID,
          method: 'raw',
          parentVersionID: null,
        },
        role,
        agent.agentID,
      )
      requireState(
        positiveID(actual.id) &&
          !bundle.roles.some((r) =>
            r.agents.some((a) => a.versions.some((v) => v.id === actual.id))
          ),
        'invalid-or-reused-version-id',
      )
      // Retain the real ID before checking the response: a failed contract still created it.
      agent.versions.push({
        id: actual.id,
        ordinal: actual.ordinal ?? 0,
        isEntry: actual.isEntry,
      })
      await checkpoint()
      requireState(
        actual.agentID === agent.agentID && actual.ordinal === ordinal &&
          actual.isEntry === isEntry && actual.modelID === inputs.modelID,
        'save-did-not-preserve-entry-contract',
      )
    }
    const [entry, firstSave] = bundle.roles
    const main = await create(sessions[0], entry, 'a', 'A6 参赛主智能体')
    await save(sessions[0], entry, main, true)
    await save(sessions[0], entry, main, false)
    const opposite = await create(sessions[0], entry, 'b', 'A6 对侧参赛智能体')
    await save(sessions[0], entry, opposite, true)
    const sibling = await create(sessions[0], entry, 'a', 'A6 同侧第二智能体')
    await save(sessions[0], entry, sibling, false)
    const untouched = await create(sessions[1], firstSave, 'a', 'A6 首存智能体')
    delete bundle.pendingOperation
    await checkpoint()
    for (let i = 0; i < bundle.roles.length; i++) {
      await verifyRole(
        sessions[i],
        bundle.roles[i],
        request,
        inputs.modelID,
        inputs.gateWins,
      )
    }
    requireState(
      same(await readInputs(admin, request), inputs),
      'live-inputs-changed-during-preparation',
    )
    manifest.testModeFixtures = {
      a6EntryAgentId: String(main.agentID),
      a6EntrySiblingAgentId: String(sibling.agentID),
      a6NoEntryAgentId: String(untouched.agentID),
    }
    manifest.verification = {
      ownedMatches: 0,
      battlesToday: 0,
      pvpBattlesToday: 0,
      firstSaveDraftEmpty: true,
      modelsInvoked: false,
    }
    manifest.state = 'ready'
    manifest.preparedAt = operations.now().toISOString()
    await checkpoint()
    return manifest
  } catch (error) {
    manifest.state = 'partial'
    manifest.failure = error instanceof EntryPreparationError
      ? error.code
      : 'preparation-failed-inspect-private-journal'
    manifest.testModeFixtures = {}
    delete manifest.verification
    try {
      await checkpoint()
    } catch {
      // Preserve the original failure if storage is unavailable. The last synced
      // private checkpoint still identifies any pending mutation for inspection.
    }
    throw new EntryPreparationError(manifest.failure)
  }
}
