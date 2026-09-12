import { assertFixtureOrigin } from './reviewed-human-fixtures.ts'

export interface Credentials {
  email: string
  password: string
}

export interface A5QuotaRequest {
  baseURL: string
  scenarioID: string
  initiator: Credentials
  rival: Credentials
  maxMatches: number
  matchTimeoutSeconds: number
}

export interface QuotaAPI {
  call<T>(method: string, path: string, body?: unknown): Promise<T>
}

export interface QuotaOperations {
  now(): number
  sleep(milliseconds: number): Promise<void>
  login(credentials: Credentials): Promise<QuotaAPI>
  checkpoint(manifest: QuotaManifest): Promise<void>
}

export interface Usage {
  battlesToday: number
  pvpBattlesToday: number
}

export interface QuotaConfig {
  dailyBattleLimit: number
  pvpDailyLimit: number
  concurrencyLimit: number
  opponentDailyChallengeLimit: number
  pvpUnlockPerSideWins: number
  trialsBlocked: boolean
  usage: Usage
}

interface Agent {
  agentID: number
  entryVersionID?: number
}

interface Inventory {
  scenarioID: string
  entryReady: boolean
  gateProgress: Record<'a' | 'b', { beaten: number; needed: number }>
  sides: Record<'a' | 'b', Agent[]>
}

export interface MatchSummary {
  id: number
  scenarioID: string
  kind: string
  finished: boolean
  scored: boolean
  initiatorIsMe: boolean
  createdAt?: number
  challengeID?: number
  participants?: Record<
    'a' | 'b',
    { agentID?: number; versionID?: number; isMine?: boolean }
  >
}

interface Binding {
  a: { agentID: number; versionID: number }
  b: { agentID: number; versionID: number }
}

export interface QuotaManifest {
  schemaVersion: 1
  fixture: 'a5-quota-invitee'
  state: 'preparing' | 'running' | 'ready' | 'partial' | 'expired'
  realMatches: true
  baseURL: string
  scenarioID: string
  startedAt: string
  expiresAt: string
  verifiedAt?: string
  initial?: QuotaConfig
  latest?: QuotaConfig
  rivalUsageBefore?: Usage
  rivalUsageAfter?: Usage
  bindings?: { initiator: Binding; rival: Binding }
  plannedMatches?: number
  resumedMatchIDs: number[]
  attempts: Array<{
    state: 'request-pending' | 'accepted' | 'terminal' | 'uncertain'
    matchID?: number
    scored?: boolean
  }>
  probe?: {
    state: 'request-pending' | 'rejected' | 'accepted' | 'uncertain'
    status?: number
    reason?: string
    challengeID?: number
    matchIDs?: number[]
  }
  failure?: string
}

export class QuotaPreparationError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

export class QuotaHTTPError extends Error {
  constructor(readonly status: number, readonly errorCode: string) {
    super(`HTTP ${status}`)
  }
}

function requireState(condition: unknown, code: string): asserts condition {
  if (!condition) throw new QuotaPreparationError(code)
}

function integer(value: unknown, minimum = 0): value is number {
  return Number.isSafeInteger(value) && Number(value) >= minimum
}

export function quotaExpiry(now: number): number {
  const offset = 8 * 60 * 60 * 1000
  const day = 24 * 60 * 60 * 1000
  return (Math.floor((now + offset) / day) + 1) * day - offset
}

export function validateQuotaRequest(request: A5QuotaRequest): void {
  assertFixtureOrigin(request.baseURL)
  requireState(
    /^[a-z0-9][a-z0-9-]*$/.test(request.scenarioID),
    'scenario-required',
  )
  for (
    const [credentials, role] of [
      [request.initiator, 'quota-invitee'],
      [request.rival, 'rich-challenger'],
    ] as const
  ) {
    requireState(
      new RegExp(String.raw`^hv-a5-${role}-[a-zA-Z0-9-]+@axiia\.test$`).test(
        credentials.email,
      ) && credentials.password.length > 0,
      'dedicated-fixture-role-credentials-required',
    )
  }
  requireState(
    request.initiator.email !== request.rival.email,
    'distinct-fixture-accounts-required',
  )
  requireState(
    integer(request.maxMatches) && request.maxMatches <= 10,
    'max-matches-must-be-between-0-and-10',
  )
  requireState(
    integer(request.matchTimeoutSeconds, 1) &&
      request.matchTimeoutSeconds <= 1800,
    'match-timeout-must-be-between-1-and-1800-seconds',
  )
}

function validateConfig(config: QuotaConfig): void {
  requireState(
    integer(config?.dailyBattleLimit) && integer(config.pvpDailyLimit) &&
      integer(config.concurrencyLimit, 2) &&
      integer(config.opponentDailyChallengeLimit, 1) &&
      integer(config.pvpUnlockPerSideWins) &&
      integer(config.usage?.battlesToday) &&
      integer(config.usage.pvpBattlesToday) &&
      config.usage.pvpBattlesToday <= config.usage.battlesToday &&
      config.usage.battlesToday <= config.dailyBattleLimit &&
      config.usage.pvpBattlesToday <= config.pvpDailyLimit,
    'invalid-quota-config',
  )
  requireState(config.trialsBlocked === false, 'trials-blocked')
}

function sameLimits(left: QuotaConfig, right: QuotaConfig): boolean {
  return left.dailyBattleLimit === right.dailyBattleLimit &&
    left.pvpDailyLimit === right.pvpDailyLimit &&
    left.concurrencyLimit === right.concurrencyLimit &&
    left.opponentDailyChallengeLimit === right.opponentDailyChallengeLimit &&
    left.pvpUnlockPerSideWins === right.pvpUnlockPerSideWins &&
    left.trialsBlocked === right.trialsBlocked
}

function sameUsage(left: Usage, right: Usage): boolean {
  return left.battlesToday === right.battlesToday &&
    left.pvpBattlesToday === right.pvpBattlesToday
}

async function readConfig(api: QuotaAPI): Promise<QuotaConfig> {
  const value = await api.call<QuotaConfig>('GET', '/v1/config')
  validateConfig(value)
  return {
    dailyBattleLimit: value.dailyBattleLimit,
    pvpDailyLimit: value.pvpDailyLimit,
    concurrencyLimit: value.concurrencyLimit,
    opponentDailyChallengeLimit: value.opponentDailyChallengeLimit,
    pvpUnlockPerSideWins: value.pvpUnlockPerSideWins,
    trialsBlocked: value.trialsBlocked,
    usage: {
      battlesToday: value.usage.battlesToday,
      pvpBattlesToday: value.usage.pvpBattlesToday,
    },
  }
}

async function eligibleBinding(
  api: QuotaAPI,
  scenarioID: string,
  needed: number,
): Promise<Binding> {
  const detail = await api.call<{
    summary: { id: string; gateUnlocked: boolean }
  }>('GET', `/v1/scenarios/${scenarioID}`)
  requireState(
    detail.summary?.id === scenarioID && detail.summary.gateUnlocked === true,
    'live-unlocked-scenario-required',
  )
  const inventory = await api.call<{ scenarios: Inventory[] }>(
    'GET',
    '/v1/my/agents',
  )
  const scenario = inventory.scenarios?.find((row) =>
    row.scenarioID === scenarioID
  )
  requireState(scenario?.entryReady === true, 'both-entry-sides-required')
  const sides = (['a', 'b'] as const).map((side) => {
    const progress = scenario.gateProgress?.[side]
    requireState(
      integer(progress?.beaten) && progress.needed === needed &&
        progress.beaten >= needed,
      'both-unlocked-sides-required',
    )
    const entries = scenario.sides?.[side]?.filter((agent) =>
      integer(agent.agentID, 1) && integer(agent.entryVersionID, 1)
    ).sort((left, right) => left.agentID - right.agentID)
    const entry = entries?.[0]
    requireState(
      entry && integer(entry.entryVersionID, 1),
      'entry-version-required',
    )
    return { agentID: entry.agentID, versionID: entry.entryVersionID }
  })
  return { a: sides[0], b: sides[1] }
}

async function verifiedIdentity(
  api: QuotaAPI,
  credentials: Credentials,
  displayName: string,
): Promise<string> {
  const me = await api.call<{
    account: {
      id: string
      email?: string
      displayName: string
      isAdmin: boolean
    }
  }>('GET', '/v1/auth/me')
  requireState(
    typeof me.account?.id === 'string' && me.account.id.length > 0 &&
      me.account.email === credentials.email &&
      me.account.displayName === displayName && me.account.isAdmin === false,
    'authenticated-fixture-role-mismatch',
  )
  return me.account.id
}

export async function prepareA5Quota(
  request: A5QuotaRequest,
  operations: QuotaOperations,
): Promise<QuotaManifest> {
  validateQuotaRequest(request)
  const expires = quotaExpiry(operations.now())
  const manifest: QuotaManifest = {
    schemaVersion: 1,
    fixture: 'a5-quota-invitee',
    state: 'preparing',
    realMatches: true,
    baseURL: request.baseURL,
    scenarioID: request.scenarioID,
    startedAt: new Date(operations.now()).toISOString(),
    expiresAt: new Date(expires).toISOString(),
    resumedMatchIDs: [],
    attempts: [],
  }
  const checkpoint = () => operations.checkpoint(structuredClone(manifest))
  const sameDay = (margin = 0) => {
    requireState(operations.now() < expires, 'quota-day-expired')
    requireState(
      operations.now() + margin < expires,
      'too-close-to-quota-reset',
    )
  }
  const waitForMatch = async (api: QuotaAPI, id: number) => {
    const deadline = operations.now() + request.matchTimeoutSeconds * 1000
    for (;;) {
      sameDay()
      const detail = await api.call<{ summary: MatchSummary }>(
        'GET',
        `/v1/matches/${id}`,
      )
      requireState(
        detail.summary?.id === id && detail.summary.initiatorIsMe === true &&
          typeof detail.summary.finished === 'boolean',
        'match-ownership-or-status-mismatch',
      )
      sameDay()
      if (detail.summary.finished) return detail.summary
      requireState(operations.now() < deadline, 'match-poll-timeout')
      await operations.sleep(Math.min(3000, deadline - operations.now()))
    }
  }

  try {
    await checkpoint()
    sameDay(120_000)
    const initiator = await operations.login(request.initiator)
    const rival = await operations.login(request.rival)
    const initiatorID = await verifiedIdentity(
      initiator,
      request.initiator,
      'A5 人测·配额被约方',
    )
    const rivalID = await verifiedIdentity(
      rival,
      request.rival,
      'A5 人测·完整发起方',
    )
    requireState(initiatorID !== rivalID, 'distinct-fixture-accounts-required')

    const listed = await initiator.call<{ matches: MatchSummary[] }>(
      'GET',
      '/v1/matches',
    )
    requireState(Array.isArray(listed.matches), 'invalid-match-list')
    for (const match of listed.matches) {
      requireState(
        integer(match.id, 1) && typeof match.finished === 'boolean' &&
          typeof match.initiatorIsMe === 'boolean',
        'invalid-match-list',
      )
      if (match.initiatorIsMe && !match.finished) {
        manifest.resumedMatchIDs.push(match.id)
        await checkpoint()
        await waitForMatch(initiator, match.id)
      }
    }

    const initial = await readConfig(initiator)
    const rivalBefore = await readConfig(rival)
    requireState(sameLimits(initial, rivalBefore), 'quota-config-mismatch')
    requireState(
      rivalBefore.dailyBattleLimit - rivalBefore.usage.battlesToday >= 2 &&
        rivalBefore.pvpDailyLimit - rivalBefore.usage.pvpBattlesToday >= 2,
      'rival-positive-challenge-headroom-required',
    )
    const assertReceiverCapacity = (matches: MatchSummary[]) => {
      const received = new Set<number>()
      const dayStart = (expires - 86_400_000) / 1000
      for (const match of matches) {
        if (match.challengeID == null || match.initiatorIsMe) continue
        requireState(
          integer(match.createdAt) && integer(match.challengeID, 1),
          'invalid-challenge-list',
        )
        if (
          match.createdAt >= dayStart &&
          (match.participants?.a.isMine || match.participants?.b.isMine)
        ) received.add(match.challengeID)
      }
      requireState(
        received.size < initial.opponentDailyChallengeLimit,
        'receiver-challenge-cap-reached',
      )
    }
    assertReceiverCapacity(listed.matches)
    const rivalListed = await rival.call<{ matches: MatchSummary[] }>(
      'GET',
      '/v1/matches',
    )
    requireState(Array.isArray(rivalListed.matches), 'invalid-match-list')
    requireState(
      !rivalListed.matches.some((match) =>
        match.initiatorIsMe && !match.finished
      ),
      'rival-match-still-running',
    )
    assertReceiverCapacity(rivalListed.matches)
    const bindings = {
      initiator: await eligibleBinding(
        initiator,
        request.scenarioID,
        initial.pvpUnlockPerSideWins,
      ),
      rival: await eligibleBinding(
        rival,
        request.scenarioID,
        initial.pvpUnlockPerSideWins,
      ),
    }
    const planned = initial.pvpDailyLimit - initial.usage.pvpBattlesToday
    requireState(
      planned <= request.maxMatches,
      'daily-deficit-exceeds-match-bound',
    )
    requireState(
      initial.dailyBattleLimit - initial.usage.battlesToday - planned >= 2,
      'insufficient-total-headroom',
    )
    Object.assign(manifest, {
      state: 'running',
      initial,
      latest: initial,
      rivalUsageBefore: rivalBefore.usage,
      bindings,
      plannedMatches: planned,
    })
    await checkpoint()

    for (let index = 0; index < planned; index++) {
      sameDay(120_000)
      const current = await readConfig(initiator)
      manifest.latest = current
      requireState(sameLimits(initial, current), 'quota-limits-changed')
      requireState(
        sameUsage(current.usage, {
          battlesToday: initial.usage.battlesToday + index,
          pvpBattlesToday: initial.usage.pvpBattlesToday + index,
        }),
        'quota-usage-drifted',
      )
      for (
        const [api, expected] of [[initiator, bindings.initiator], [
          rival,
          bindings.rival,
        ]] as const
      ) {
        const currentBinding = await eligibleBinding(
          api,
          request.scenarioID,
          initial.pvpUnlockPerSideWins,
        )
        requireState(
          JSON.stringify(currentBinding) === JSON.stringify(expected),
          'entry-bindings-changed',
        )
      }
      sameDay(120_000)
      const attempt: QuotaManifest['attempts'][number] = {
        state: 'request-pending',
      }
      manifest.attempts.push(attempt)
      await checkpoint()
      try {
        const response = await initiator.call<{ matchID: number }>(
          'POST',
          '/v1/matches/pvp',
          {
            versionID: bindings.initiator.a.versionID,
            opponentAgentID: bindings.rival.b.agentID,
          },
        )
        requireState(integer(response.matchID, 1), 'invalid-dispatch-response')
        attempt.matchID = response.matchID
        attempt.state = 'accepted'
      } catch {
        attempt.state = 'uncertain'
        throw new QuotaPreparationError(
          'dispatch-outcome-uncertain-do-not-retry',
        )
      }
      await checkpoint()
      const finished = await waitForMatch(initiator, attempt.matchID!)
      attempt.state = 'terminal'
      attempt.scored = finished.scored
      await checkpoint()
      requireState(
        finished.scenarioID === request.scenarioID && finished.kind === 'pvp',
        'dispatch-match-mismatch',
      )
      const after = await readConfig(initiator)
      manifest.latest = after
      await checkpoint()
      requireState(
        finished.scored === true,
        'match-failed-inspect-before-resuming',
      )
    }

    const final = await readConfig(initiator)
    const rivalAfter = await readConfig(rival)
    manifest.latest = final
    manifest.rivalUsageAfter = rivalAfter.usage
    requireState(
      sameLimits(initial, final) && sameLimits(initial, rivalAfter),
      'quota-limits-changed',
    )
    requireState(
      final.usage.pvpBattlesToday === final.pvpDailyLimit &&
        final.usage.battlesToday === initial.usage.battlesToday + planned &&
        final.dailyBattleLimit - final.usage.battlesToday >= 2,
      'final-quota-state-mismatch',
    )
    requireState(
      sameUsage(rivalBefore.usage, rivalAfter.usage),
      'rival-quota-changed',
    )
    for (
      const [api, expected] of [[initiator, bindings.initiator], [
        rival,
        bindings.rival,
      ]] as const
    ) {
      const current = await eligibleBinding(
        api,
        request.scenarioID,
        final.pvpUnlockPerSideWins,
      )
      requireState(
        JSON.stringify(current) === JSON.stringify(expected),
        'entry-bindings-changed',
      )
    }

    // The reviewed A5 action is a paired challenge. Only its exact quota
    // rejection establishes that earlier guards (including receiver cap) pass.
    // Compare the authenticated match IDs and counters to prove no enqueue/charge.
    const ownedIDs = async () => {
      const response = await initiator.call<{ matches: MatchSummary[] }>(
        'GET',
        '/v1/matches',
      )
      requireState(Array.isArray(response.matches), 'invalid-match-list')
      assertReceiverCapacity(response.matches)
      const owned = response.matches.filter((match) =>
        match.initiatorIsMe === true
      )
      requireState(
        owned.every((match) => integer(match.id, 1) && match.finished === true),
        'initiated-match-still-running',
      )
      return owned.map((match) => match.id).sort((a, b) => a - b)
    }
    const beforeIDs = await ownedIDs()
    sameDay(120_000)
    manifest.probe = { state: 'request-pending' }
    await checkpoint()
    try {
      const response = await initiator.call<
        { challengeID: number; matchIDs: number[] }
      >(
        'POST',
        '/v1/challenges',
        {
          scenarioID: request.scenarioID,
          mine: {
            a: { versionID: bindings.initiator.a.versionID },
            b: { versionID: bindings.initiator.b.versionID },
          },
          opponent: { pinnedVersionID: bindings.rival.b.versionID },
        },
      )
      manifest.probe = {
        state: 'accepted',
        ...(integer(response.challengeID, 1)
          ? { challengeID: response.challengeID }
          : {}),
        matchIDs: Array.isArray(response.matchIDs)
          ? response.matchIDs.filter((id) => integer(id, 1))
          : [],
      }
    } catch (error) {
      if (error instanceof QuotaHTTPError) {
        manifest.probe = {
          state: 'rejected',
          status: error.status,
          reason: [
              'pvp_daily_limit',
              'opponent_challenge_limit',
              'daily_limit',
              'concurrency_limit',
              'trials_blocked',
              'gate_locked',
              'opponent_gate_locked',
              'both_sides_required',
              'opponent_both_sides_required',
            ].includes(error.errorCode)
            ? error.errorCode
            : 'unexpected-rejection',
        }
      } else {
        manifest.probe = { state: 'uncertain' }
      }
    }
    await checkpoint()
    requireState(
      manifest.probe.state === 'rejected',
      'paired-probe-outcome-unsafe-do-not-retry',
    )
    requireState(
      manifest.probe.status === 429 &&
        manifest.probe.reason === 'pvp_daily_limit',
      'paired-probe-did-not-reach-pvp-quota',
    )
    const afterIDs = await ownedIDs()
    const afterProbe = await readConfig(initiator)
    const rivalAfterProbe = await readConfig(rival)
    manifest.latest = afterProbe
    manifest.rivalUsageAfter = rivalAfterProbe.usage
    requireState(
      JSON.stringify(beforeIDs) === JSON.stringify(afterIDs),
      'paired-probe-created-matches',
    )
    requireState(
      sameLimits(final, afterProbe) && sameLimits(final, rivalAfterProbe) &&
        sameUsage(final.usage, afterProbe.usage) &&
        sameUsage(rivalBefore.usage, rivalAfterProbe.usage),
      'paired-probe-changed-quota',
    )
    sameDay(120_000)
    manifest.verifiedAt = new Date(operations.now()).toISOString()
    manifest.state = 'ready'
    await checkpoint()
    return manifest
  } catch (error) {
    manifest.state = operations.now() >= expires ? 'expired' : 'partial'
    manifest.failure = error instanceof QuotaPreparationError
      ? error.code
      : 'preparation-failed-inspect-private-output'
    try {
      await checkpoint()
    } catch {
      throw new QuotaPreparationError(
        'checkpoint-failed-inspect-account-before-resuming',
      )
    }
    throw new QuotaPreparationError(manifest.failure)
  }
}
