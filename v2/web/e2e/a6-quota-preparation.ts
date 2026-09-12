import type {
  AgentVersionDTO,
  ConfigResponse,
  MatchSummary,
  MyAgentsResponse,
  ScenarioDetail,
  VersionListResponse,
  VersionRefResponse,
} from '../src/api/types.ts'
import { validA6RegistrationCode } from './a6-signup-input.ts'
import {
  type Credentials,
  type QuotaAPI,
  quotaExpiry,
  QuotaHTTPError,
  QuotaPreparationError,
} from './a5-quota-preparation.ts'
import {
  assertFixtureOrigin,
  VIVIAN_A6_SOURCE_CAPTURED_AT,
  VIVIAN_A6_SOURCE_REVISION,
  VIVIAN_A6_SOURCE_SHA256,
} from './reviewed-human-fixtures.ts'

export const A6_QUOTA_ALIAS = 'A6 人测·总配额耗尽'
export interface A6QuotaRequest {
  baseURL: string
  scenarioID: string
  modelID: string
  maxMatches: number
  matchTimeoutSeconds: number
  registrationCode?: string
}
interface Binding {
  agentID: number
  versionID: number
}
export interface A6QuotaBundle {
  actor: Credentials
  registrationCode: string
  accountID?: string
  agents: Array<{ side: 'a' | 'b'; agentID: number; versionID?: number }>
  pendingOperation?: { action: string; agentID?: number }
}
export interface A6QuotaManifest {
  schemaVersion: 1
  fixture: 'a6-daily-exhausted'
  state: 'provisioning' | 'running' | 'ready' | 'partial' | 'expired'
  baseURL: string
  scenarioID: string
  modelID: string
  maxMatches: number
  provenance: {
    sourceRevision: string
    sourceSha256: string
    sourceCapturedAt: string
  }
  accountAlias: typeof A6_QUOTA_ALIAS
  startedAt: string
  expiresAt: string
  verifiedAt?: string
  bindings?: { a: Binding; b: Binding }
  presetKey?: string
  initial?: ConfigResponse
  latest?: ConfigResponse
  plannedMatches?: number
  attempts: Array<
    {
      state: 'request-pending' | 'accepted' | 'terminal' | 'uncertain'
      matchID?: number
    }
  >
  probe?: {
    state: 'request-pending' | 'rejected' | 'accepted' | 'uncertain'
    status?: number
    reason?: string
    matchID?: number
  }
  verification?: {
    realHotseatMatches: true
    pvpCharged: 0
    rejection: 'daily_limit'
    status: 429
    unchangedMatchIDs: number[]
    expectedCopy: string
  }
  testModeFixtures?: {
    a6DailyExhaustedAgentId: string
    a6DailyExhaustedOpponentVersionId: string
  }
  failure?: string
}
export interface A6QuotaCheckpoint {
  bundle: A6QuotaBundle
  manifest: A6QuotaManifest
}
export interface A6QuotaOperations {
  now(): number
  randomBytes(size: number): Uint8Array
  sleep(milliseconds: number): Promise<void>
  openAdmin(): Promise<QuotaAPI>
  openPlayer(): QuotaAPI
  checkpoint(value: A6QuotaCheckpoint): Promise<void>
}

const requireState = (value: unknown, code: string): void => {
  if (!value) throw new QuotaPreparationError(code)
}
const integer = (value: unknown, minimum = 0) =>
  Number.isSafeInteger(value) && Number(value) >= minimum
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const token = (bytes: Uint8Array) =>
  [...bytes].map((n) => n.toString(16).padStart(2, '0')).join('')
const limits = (
  c: ConfigResponse,
) => [c.dailyBattleLimit, c.pvpDailyLimit, c.concurrencyLimit, c.trialsBlocked]

export function validateA6QuotaRequest(request: A6QuotaRequest) {
  assertFixtureOrigin(request.baseURL)
  requireState(
    /^[a-z0-9][a-z0-9-]*$/.test(request.scenarioID),
    'explicit-scenario-required',
  )
  requireState(
    typeof request.modelID === 'string' && request.modelID.trim().length > 0,
    'explicit-model-required',
  )
  requireState(
    integer(request.maxMatches) && request.maxMatches <= 20,
    'max-matches-must-be-between-0-and-20',
  )
  requireState(
    integer(request.matchTimeoutSeconds, 1) &&
      request.matchTimeoutSeconds <= 1800,
    'match-timeout-must-be-between-1-and-1800-seconds',
  )
}

export async function prepareA6Quota(
  request: A6QuotaRequest,
  operations: A6QuotaOperations,
  previous?: A6QuotaCheckpoint,
): Promise<A6QuotaManifest> {
  validateA6QuotaRequest(request)
  requireState(
    validA6RegistrationCode(request.registrationCode),
    'invalid-supplied-registration-code',
  )
  requireState(
    !previous || request.registrationCode === undefined,
    'registration-code-not-allowed-on-resume',
  )
  const nonce = token(operations.randomBytes(12))
  const bundle: A6QuotaBundle = previous ? structuredClone(previous.bundle) : {
    actor: {
      email: `hv-a6-daily-exhausted-${nonce}@axiia.test`,
      password: `Hv!${token(operations.randomBytes(18))}`,
    },
    registrationCode: request.registrationCode ??
      `HVA6Q-${token(operations.randomBytes(16))}`,
    agents: [],
  }
  const manifest: A6QuotaManifest = previous
    ? structuredClone(previous.manifest)
    : {
      schemaVersion: 1,
      fixture: 'a6-daily-exhausted',
      state: 'provisioning',
      baseURL: request.baseURL,
      scenarioID: request.scenarioID,
      modelID: request.modelID,
      maxMatches: request.maxMatches,
      provenance: {
        sourceRevision: VIVIAN_A6_SOURCE_REVISION,
        sourceSha256: VIVIAN_A6_SOURCE_SHA256,
        sourceCapturedAt: VIVIAN_A6_SOURCE_CAPTURED_AT,
      },
      accountAlias: A6_QUOTA_ALIAS,
      startedAt: new Date(operations.now()).toISOString(),
      expiresAt: new Date(quotaExpiry(operations.now())).toISOString(),
      attempts: [],
    }
  const expires = Date.parse(manifest.expiresAt)
  const checkpoint = () =>
    operations.checkpoint(structuredClone({ bundle, manifest }))
  const sameDay = (margin = 0) => {
    requireState(operations.now() < expires, 'quota-day-expired')
    requireState(
      operations.now() + margin < expires,
      'too-close-to-quota-reset',
    )
  }
  const readConfig = async (api: QuotaAPI) => {
    const config = await api.call<ConfigResponse>('GET', '/v1/config')
    requireState(
      integer(config.dailyBattleLimit, 1) && integer(config.pvpDailyLimit) &&
        integer(config.concurrencyLimit, 1),
      'invalid-quota-config',
    )
    requireState(
      integer(config.usage?.battlesToday) &&
        integer(config.usage?.pvpBattlesToday) &&
        config.usage.battlesToday <= config.dailyBattleLimit,
      'invalid-quota-usage',
    )
    requireState(config.trialsBlocked === false, 'trials-blocked')
    requireState(
      config.models.some((model) => model.id === request.modelID),
      'requested-model-unavailable',
    )
    sameDay()
    return config
  }
  const mutate = async <T>(
    api: QuotaAPI,
    action: string,
    path: string,
    body: unknown,
    agentID?: number,
  ) => {
    sameDay(120_000)
    bundle.pendingOperation = { action, ...(agentID ? { agentID } : {}) }
    await checkpoint()
    const result = await api.call<T>('POST', path, body)
    delete bundle.pendingOperation
    return result
  }
  let api: QuotaAPI
  const ownedMatches = async () => {
    const history = await api.call<{ matches: MatchSummary[] }>(
      'GET',
      '/v1/matches',
    )
    requireState(Array.isArray(history.matches), 'invalid-match-list')
    const owned = history.matches.filter((match) =>
      match.initiatorIsMe || match.participants?.a.isMine ||
      match.participants?.b.isMine
    )
    requireState(
      owned.every((match) => integer(match.id, 1)),
      'invalid-match-list',
    )
    return owned
  }
  const verifyBindings = async () => {
    const me = await api.call<
      {
        account: {
          id: string
          email: string
          displayName: string
          isAdmin: boolean
        }
      }
    >('GET', '/v1/auth/me')
    requireState(
      me.account.id === bundle.accountID &&
        me.account.email === bundle.actor.email &&
        me.account.displayName === A6_QUOTA_ALIAS &&
        me.account.isAdmin === false,
      'dedicated-actor-identity-mismatch',
    )
    const inventory = await api.call<MyAgentsResponse>('GET', '/v1/my/agents')
    const all = inventory.scenarios.flatMap((
      scenario,
    ) => [...scenario.sides.a, ...scenario.sides.b])
    requireState(
      all.length === 2,
      'dedicated-actor-must-have-exactly-two-agents',
    )
    for (const side of ['a', 'b'] as const) {
      const binding = manifest.bindings![side]
      requireState(
        integer(binding.agentID, 1) &&
          integer(binding.versionID, 1),
        'invalid-dedicated-binding',
      )
      const row = inventory.scenarios.find((scenario) =>
        scenario.scenarioID === request.scenarioID
      )?.sides[side]
      requireState(
        row?.length === 1 && row[0].agentID === binding.agentID &&
          row[0].entryVersionID === binding.versionID,
        'entry-bindings-changed',
      )
      const versions = await api.call<VersionListResponse>(
        'GET',
        `/v1/agents/${binding.agentID}/versions`,
      )
      requireState(
        versions.versions.length === 1 &&
          versions.versions[0].id === binding.versionID &&
          versions.versions[0].agentID === binding.agentID &&
          versions.versions[0].ordinal === 1 &&
          versions.versions[0].modelID === request.modelID &&
          versions.versions[0].isEntry === true &&
          versions.entryVersionID === binding.versionID,
        'entry-bindings-changed',
      )
      const ref = await api.call<VersionRefResponse>(
        'GET',
        `/v1/versions/${binding.versionID}/ref`,
      )
      requireState(
        ref.versionID === binding.versionID &&
          ref.ownerAccountID === bundle.accountID &&
          ref.agentID === binding.agentID && ref.side === side &&
          ref.scenarioID === request.scenarioID &&
          ref.modelID === request.modelID,
        'version-owner-or-model-mismatch',
      )
    }
    const detail = await api.call<ScenarioDetail>(
      'GET',
      `/v1/scenarios/${request.scenarioID}`,
    )
    requireState(
      detail.summary.id === request.scenarioID &&
        detail.presets.some((preset) =>
          preset.key === manifest.presetKey && preset.side === 'b'
        ),
      'valid-pve-opponent-missing',
    )
  }
  const waitForMatch = async (id: number) => {
    const deadline = operations.now() + request.matchTimeoutSeconds * 1000
    for (;;) {
      sameDay()
      const { summary } = await api.call<{ summary: MatchSummary }>(
        'GET',
        `/v1/matches/${id}`,
      )
      requireState(
        summary.id === id && summary.initiatorIsMe === true &&
          summary.scenarioID === request.scenarioID && summary.kind === 'pvp' &&
          summary.participants?.a.isMine && summary.participants?.b.isMine &&
          summary.participants.a.versionID === manifest.bindings!.a.versionID &&
          summary.participants.b.versionID === manifest.bindings!.b.versionID,
        'hotseat-match-binding-mismatch',
      )
      sameDay()
      if (summary.finished) {
        requireState(
          summary.scored === true,
          'hotseat-failed-inspect-before-resuming',
        )
        return
      }
      requireState(operations.now() < deadline, 'match-poll-timeout')
      await operations.sleep(Math.min(3000, deadline - operations.now()))
    }
  }

  try {
    delete manifest.testModeFixtures
    delete manifest.verification
    delete manifest.verifiedAt
    manifest.state = previous ? 'running' : 'provisioning'
    requireState(
      Number.isFinite(expires) &&
        expires === quotaExpiry(Date.parse(manifest.startedAt)),
      'invalid-quota-expiry',
    )
    requireState(
      manifest.schemaVersion === 1 &&
        manifest.fixture === 'a6-daily-exhausted' &&
        manifest.baseURL === request.baseURL &&
        manifest.scenarioID === request.scenarioID &&
        manifest.modelID === request.modelID &&
        manifest.maxMatches === request.maxMatches &&
        manifest.accountAlias === A6_QUOTA_ALIAS,
      'resume-fixture-mismatch',
    )
    requireState(
      /^hv-a6-daily-exhausted-[0-9a-f]+@axiia\.test$/.test(
        bundle.actor.email,
      ) && bundle.actor.password.length > 0,
      'dedicated-actor-credentials-required',
    )
    sameDay(120_000)
    requireState(
      !bundle.pendingOperation &&
        manifest.attempts.every((attempt) =>
          attempt.state === 'accepted' || attempt.state === 'terminal'
        ),
      'uncertain-mutation-inspect-do-not-retry',
    )
    requireState(
      !manifest.probe || manifest.probe.state === 'rejected',
      'uncertain-probe-inspect-do-not-retry',
    )
    delete manifest.failure
    await checkpoint()
    api = operations.openPlayer()
    if (!previous) {
      const admin = request.registrationCode === undefined
        ? await operations.openAdmin()
        : undefined
      const preflightConfig = async (session: QuotaAPI) => {
        const config = await readConfig(session)
        requireState(
          config.dailyBattleLimit <= request.maxMatches,
          'daily-deficit-exceeds-match-bound',
        )
      }
      if (admin) await preflightConfig(admin)
      const detail = await (admin ?? api).call<ScenarioDetail>(
        'GET',
        `/v1/scenarios/${request.scenarioID}`,
      )
      const preset = detail.presets.filter((row) =>
        row.side === 'b'
      ).sort((a, b) => a.key.localeCompare(b.key))[0]
      requireState(
        detail.summary.id === request.scenarioID && !!preset,
        'valid-pve-opponent-missing',
      )
      manifest.presetKey = preset.key
      if (admin) {
        await mutate(
          admin,
          'registration-code',
          '/v1/admin/registration-codes',
          {
            code: bundle.registrationCode,
            uses: 1,
          },
        )
      }
      const signup = await mutate<{ account: { id: string } }>(
        api,
        'signup',
        '/v1/auth/signup',
        {
          ...bundle.actor,
          code: bundle.registrationCode,
          displayName: A6_QUOTA_ALIAS,
        },
      )
      bundle.accountID = signup.account.id
      await checkpoint()
      // /config needs a session. Record the real account before this can fail;
      // an ordinary-code partial provision is never silently replaced/resumed.
      if (!admin) {
        await preflightConfig(api)
      }
      const bindings = {} as { a: Binding; b: Binding }
      for (const side of ['a', 'b'] as const) {
        const agent = await mutate<{ agentID: number }>(
          api,
          `create-${side}`,
          '/v1/agents',
          { scenarioID: request.scenarioID, side },
        )
        requireState(
          integer(agent.agentID, 1) &&
            !bundle.agents.some((row) =>
              row.agentID === agent.agentID
            ),
          'invalid-or-reused-agent-id',
        )
        const created: A6QuotaBundle['agents'][number] = {
          side,
          agentID: agent.agentID,
        }
        bundle.agents.push(created)
        await checkpoint()
        const version = await mutate<AgentVersionDTO>(
          api,
          `save-${side}`,
          `/v1/agents/${agent.agentID}/save`,
          {
            prompt:
              `A6 total-quota fixture, side ${side}. Present a concise argument.`,
            modelID: request.modelID,
          },
          agent.agentID,
        )
        requireState(
          integer(version.id, 1) &&
            !bundle.agents.some((row) => row.versionID === version.id),
          'invalid-or-reused-version-id',
        )
        created.versionID = version.id
        await checkpoint()
        requireState(
          version.agentID === agent.agentID && version.ordinal === 1 &&
            version.isEntry === true && version.modelID === request.modelID,
          'save-did-not-preserve-entry-contract',
        )
        bindings[side] = { agentID: agent.agentID, versionID: version.id }
      }
      manifest.bindings = bindings
      manifest.initial = await readConfig(api)
      requireState(
        manifest.initial.usage.battlesToday === 0 &&
          manifest.initial.usage.pvpBattlesToday === 0 &&
          (await ownedMatches()).length === 0,
        'fresh-actor-not-empty',
      )
      manifest.plannedMatches = manifest.initial.dailyBattleLimit
      manifest.state = 'running'
      await checkpoint()
    } else {
      requireState(
        !!manifest.initial && !!manifest.bindings && !!bundle.accountID &&
          manifest.plannedMatches === manifest.initial!.dailyBattleLimit,
        'incomplete-provisioning-cannot-resume',
      )
      await api.call('POST', '/v1/auth/login', bundle.actor)
    }
    requireState(
      manifest.plannedMatches! <= request.maxMatches,
      'daily-deficit-exceeds-match-bound',
    )
    await verifyBindings()
    const expectedIDs = () =>
      manifest.attempts.map((attempt) => attempt.matchID!).sort((a, b) => a - b)
    requireState(
      manifest.attempts.every((attempt) => integer(attempt.matchID, 1)) &&
        new Set(expectedIDs()).size === manifest.attempts.length,
      'invalid-checkpoint-match-ids',
    )
    requireState(
      same(
        (await ownedMatches()).map((match) => match.id).sort((a, b) => a - b),
        expectedIDs(),
      ),
      'unexpected-owned-match-inspect-before-resuming',
    )
    for (const attempt of manifest.attempts) {
      await waitForMatch(attempt.matchID!)
      attempt.state = 'terminal'
      await checkpoint()
    }
    const assertUsage = async () => {
      const current = await readConfig(api)
      manifest.latest = current
      requireState(
        same(limits(current), limits(manifest.initial!)),
        'quota-limits-changed',
      )
      requireState(
        current.usage.battlesToday === manifest.attempts.length &&
          current.usage.pvpBattlesToday === 0,
        'quota-usage-drifted',
      )
      return current
    }
    await assertUsage()
    manifest.state = 'running'
    await checkpoint()
    while (manifest.attempts.length < manifest.plannedMatches!) {
      sameDay(120_000)
      await verifyBindings()
      await assertUsage()
      requireState(
        same(
          (await ownedMatches()).map((match) => match.id).sort((a, b) => a - b),
          expectedIDs(),
        ),
        'unexpected-owned-match',
      )
      const attempt: A6QuotaManifest['attempts'][number] = {
        state: 'request-pending',
      }
      manifest.attempts.push(attempt)
      await checkpoint()
      sameDay(120_000)
      try {
        const result = await api.call<{ matchID: number }>(
          'POST',
          '/v1/matches/pvp',
          {
            versionID: manifest.bindings!.a.versionID,
            opponentAgentID: manifest.bindings!.b.agentID,
          },
        )
        requireState(
          integer(result.matchID, 1) &&
            !manifest.attempts.some((prior) =>
              prior !== attempt && prior.matchID === result.matchID
            ),
          'invalid-dispatch-response',
        )
        attempt.matchID = result.matchID
        attempt.state = 'accepted'
      } catch {
        attempt.state = 'uncertain'
        throw new QuotaPreparationError(
          'dispatch-outcome-uncertain-do-not-retry',
        )
      }
      await checkpoint()
      await waitForMatch(attempt.matchID!)
      attempt.state = 'terminal'
      await assertUsage()
      await checkpoint()
    }
    const final = await assertUsage()
    requireState(
      final.usage.battlesToday === final.dailyBattleLimit,
      'total-quota-not-exhausted',
    )
    await verifyBindings()
    const beforeIDs = (await ownedMatches()).map((match) => match.id).sort((
      a,
      b,
    ) => a - b)
    requireState(same(beforeIDs, expectedIDs()), 'unexpected-owned-match')
    sameDay(120_000)
    manifest.probe = { state: 'request-pending' }
    await checkpoint()
    sameDay(120_000)
    try {
      const result = await api.call<{ matchID: number }>(
        'POST',
        '/v1/matches/pve',
        {
          versionID: manifest.bindings!.a.versionID,
          presetKey: manifest.presetKey,
        },
      )
      manifest.probe = {
        state: 'accepted',
        ...(integer(result.matchID, 1) ? { matchID: result.matchID } : {}),
      }
    } catch (error) {
      manifest.probe = error instanceof QuotaHTTPError
        ? {
          state: 'rejected',
          status: error.status,
          reason: error.errorCode === 'daily_limit'
            ? 'daily_limit'
            : 'unexpected-rejection',
        }
        : { state: 'uncertain' }
    }
    await checkpoint()
    requireState(
      manifest.probe.state === 'rejected' && manifest.probe.status === 429 &&
        manifest.probe.reason === 'daily_limit',
      'pve-probe-did-not-reach-total-quota',
    )
    const afterIDs = (await ownedMatches()).map((match) => match.id).sort((
      a,
      b,
    ) => a - b)
    requireState(same(beforeIDs, afterIDs), 'pve-probe-enqueued-match')
    await assertUsage()
    sameDay()
    manifest.state = 'ready'
    manifest.verifiedAt = new Date(operations.now()).toISOString()
    manifest.verification = {
      realHotseatMatches: true,
      pvpCharged: 0,
      rejection: 'daily_limit',
      status: 429,
      unchangedMatchIDs: afterIDs,
      expectedCopy:
        `今日次数已用完（${final.dailyBattleLimit}/${final.dailyBattleLimit}），明天再来`,
    }
    manifest.testModeFixtures = {
      a6DailyExhaustedAgentId: String(manifest.bindings!.a.agentID),
      a6DailyExhaustedOpponentVersionId: String(manifest.bindings!.b.versionID),
    }
    await checkpoint()
    return manifest
  } catch (error) {
    delete manifest.testModeFixtures
    delete manifest.verification
    delete manifest.verifiedAt
    manifest.state = operations.now() >= expires ? 'expired' : 'partial'
    manifest.failure = error instanceof QuotaPreparationError
      ? error.code
      : 'preparation-failed-inspect-private-journal'
    try {
      await checkpoint()
    } catch {
      // Keep the original error and the last synced pending/accepted record.
    }
    throw new QuotaPreparationError(manifest.failure)
  }
}
