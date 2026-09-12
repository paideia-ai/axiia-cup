export const REVIEWED_BETA_ORIGIN = 'https://axiia-cup-2-web.isofucius.cn'

export function assertFixtureOrigin(origin: string): void {
  if (origin === REVIEWED_BETA_ORIGIN) return
  const url = new URL(origin)
  if (
    url.origin === origin && url.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  ) return
  throw new Error('fixture origin must be the reviewed beta or a local server')
}

export const VIVIAN_A6_SOURCE_REVISION =
  '286c97c106cc0590f6e466f78a4ca234b896dba4'

export const VIVIAN_A6_SOURCE_SHA256 =
  '56e7eead8d0bd28d27f612f6f99b622c3683470591add2025c80fe2e6cd37654'

export const VIVIAN_A6_SOURCE_CAPTURED_AT = '2026-09-09'

export type FixtureSide = 'a' | 'b'

export interface ScenarioPreset {
  key: string
  side: string
}

export interface LiveScenarioCandidate {
  id: string
  title: string
  presets: ScenarioPreset[]
}

export interface ScenarioFixtureEvidence {
  slug: string
  title: string
  liveCatalogObserved: true
  presetCounts: Record<FixtureSide, number>
  supportsConfiguredGate: true
}

export interface ScenarioSelection {
  primary: ScenarioFixtureEvidence
  other: ScenarioFixtureEvidence
}

export interface A6ConfigSnapshot {
  dailyBattleLimit: number
  pvpDailyLimit: number
  concurrencyLimit: number
  pvpUnlockPerSideWins: number
  opponentDailyChallengeLimit: number
  trialsBlocked: boolean
}

export interface A6TestModeFixtures {
  a6GateAgentId: string
  a6OtherScenarioSlug: string
  a6LockedOpponentVersionId: string
  a6CreationAgentId: string
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function positiveInteger(value: number, label: string): void {
  invariant(
    Number.isInteger(value) && value > 0,
    `${label} must be a positive integer`,
  )
}

function nonNegativeInteger(value: number, label: string): void {
  invariant(
    Number.isInteger(value) && value >= 0,
    `${label} must be a non-negative integer`,
  )
}

/**
 * A6 gate isolation needs N primary-side-A wins, 2N wins in the other scenario,
 * then N primary-side-B wins. Real-scenario outcomes are not deterministic, so
 * 4N is only the no-loss minimum; require at least one additional retry slot and
 * report the remaining headroom rather than claiming the journey is guaranteed.
 */
export function assertA6JourneyCapacity(config: A6ConfigSnapshot): number {
  positiveInteger(
    config.pvpUnlockPerSideWins,
    'config.pvpUnlockPerSideWins',
  )
  nonNegativeInteger(config.dailyBattleLimit, 'config.dailyBattleLimit')
  nonNegativeInteger(config.pvpDailyLimit, 'config.pvpDailyLimit')
  positiveInteger(config.concurrencyLimit, 'config.concurrencyLimit')
  nonNegativeInteger(
    config.opponentDailyChallengeLimit,
    'config.opponentDailyChallengeLimit',
  )
  invariant(
    config.trialsBlocked === false,
    'live config has trialsBlocked enabled',
  )

  const minimumPveWins = 4 * config.pvpUnlockPerSideWins
  invariant(
    config.dailyBattleLimit > minimumPveWins,
    `dailyBattleLimit ${config.dailyBattleLimit} has no retry headroom above the A6 journey's ${minimumPveWins} required PVE wins`,
  )
  return minimumPveWins
}

function evidence(
  scenario: LiveScenarioCandidate,
  requiredWins: number,
): ScenarioFixtureEvidence {
  invariant(scenario.id.trim() !== '', 'live scenario has an empty id')
  invariant(scenario.title.trim() !== '', `${scenario.id} has an empty title`)
  invariant(
    Array.isArray(scenario.presets),
    `${scenario.id} has no preset list`,
  )

  const keys: Record<FixtureSide, Set<string>> = {
    a: new Set<string>(),
    b: new Set<string>(),
  }
  const allKeys = new Set<string>()
  for (const preset of scenario.presets) {
    invariant(
      preset.side === 'a' || preset.side === 'b',
      `${scenario.id} preset ${preset.key} has invalid side ${preset.side}`,
    )
    invariant(
      preset.key.trim() !== '',
      `${scenario.id} contains a preset with an empty key`,
    )
    invariant(
      !allKeys.has(preset.key),
      `${scenario.id} contains duplicate preset key ${preset.key}`,
    )
    allKeys.add(preset.key)
    keys[preset.side].add(preset.key)
  }

  // A player's A-side version fights B-side presets, and vice versa. Requiring
  // N on both declared sides is therefore sufficient for both player sides.
  const presetCounts = { a: keys.a.size, b: keys.b.size }
  invariant(
    presetCounts.a >= requiredWins && presetCounts.b >= requiredWins,
    `${scenario.id} cannot satisfy N=${requiredWins}: presets a=${presetCounts.a}, b=${presetCounts.b}`,
  )
  return {
    slug: scenario.id,
    title: scenario.title,
    liveCatalogObserved: true,
    presetCounts,
    supportsConfiguredGate: true,
  }
}

/** Select two distinct, live-catalog scenarios that can satisfy the live N. */
export function selectA6Scenarios(
  scenarios: LiveScenarioCandidate[],
  requiredWins: number,
  requestedPrimary?: string,
  requestedOther?: string,
): ScenarioSelection {
  positiveInteger(requiredWins, 'requiredWins')
  invariant(scenarios.length >= 2, 'A6 requires at least two live scenarios')

  const byID = new Map<string, LiveScenarioCandidate>()
  for (const scenario of scenarios) {
    invariant(
      !byID.has(scenario.id),
      `duplicate live scenario id ${scenario.id}`,
    )
    byID.set(scenario.id, scenario)
  }

  const requested = (
    raw: string | undefined,
    label: string,
  ): LiveScenarioCandidate | undefined => {
    const id = raw?.trim()
    if (!id) return undefined
    const found = byID.get(id)
    invariant(found, `${label} ${id} is not in the live catalog`)
    return found
  }

  const primaryRequest = requested(
    requestedPrimary,
    'requested primary scenario',
  )
  const otherRequest = requested(requestedOther, 'requested other scenario')
  invariant(
    !primaryRequest || !otherRequest || primaryRequest.id !== otherRequest.id,
    'primary and other scenarios must be distinct',
  )

  const eligible = [...scenarios]
    .sort((left, right) => left.id.localeCompare(right.id, 'en'))
    .flatMap((scenario) => {
      try {
        return [{ scenario, proof: evidence(scenario, requiredWins) }]
      } catch {
        return []
      }
    })

  const choose = (
    explicit: LiveScenarioCandidate | undefined,
    label: string,
  ) => {
    if (explicit) {
      return { scenario: explicit, proof: evidence(explicit, requiredWins) }
    }
    const found = eligible[0]
    invariant(
      found,
      `no live ${label} scenario can satisfy configured N=${requiredWins}`,
    )
    return found
  }

  const primary = primaryRequest ? choose(primaryRequest, 'primary') : (() => {
    const found = eligible.find((candidate) =>
      candidate.scenario.id !== otherRequest?.id
    )
    invariant(
      found,
      `no live primary scenario distinct from the requested other can satisfy configured N=${requiredWins}`,
    )
    return found
  })()
  let other: typeof primary
  if (otherRequest) {
    other = choose(otherRequest, 'other')
  } else {
    const found = eligible.find((candidate) =>
      candidate.scenario.id !== primary.scenario.id
    )
    invariant(
      found,
      `no distinct live other scenario can satisfy configured N=${requiredWins}`,
    )
    other = found
  }
  invariant(
    primary.scenario.id !== other.scenario.id,
    'primary and other scenarios must be distinct',
  )
  return { primary: primary.proof, other: other.proof }
}

/** Calendar date used by the server's UTC+8 quota ledger. */
export function utc8QuotaDate(at: Date): string {
  invariant(!Number.isNaN(at.getTime()), 'quota timestamp is invalid')
  return new Date(at.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

export function optionalCommitSha(
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  invariant(
    /^[0-9a-f]{40}$/i.test(trimmed),
    'deployment revision must be a 40-hex commit SHA',
  )
  return trimmed.toLowerCase()
}

/** The exact public variable names consumed by Vivian's reviewed A6 journey. */
export function buildA6TestModeFixtures(
  primaryScenarioSlug: string,
  otherScenarioSlug: string,
  gateAgentID: number,
  lockedOpponentVersionID: number,
  creationAgentID: number,
): A6TestModeFixtures {
  invariant(primaryScenarioSlug.trim() !== '', 'primary scenario slug is empty')
  invariant(otherScenarioSlug.trim() !== '', 'other scenario slug is empty')
  invariant(
    primaryScenarioSlug !== otherScenarioSlug,
    'primary and other scenarios must be distinct',
  )
  positiveInteger(gateAgentID, 'a6GateAgentId')
  positiveInteger(lockedOpponentVersionID, 'a6LockedOpponentVersionId')
  positiveInteger(creationAgentID, 'a6CreationAgentId')
  return {
    a6GateAgentId: String(gateAgentID),
    a6OtherScenarioSlug: otherScenarioSlug,
    a6LockedOpponentVersionId: String(lockedOpponentVersionID),
    a6CreationAgentId: String(creationAgentID),
  }
}

const FORBIDDEN_PUBLIC_KEY =
  /(?:password|email|token|secret|cookie|registrationcode|accountid|batch)/i
const EMAIL_VALUE = /[^\s@]+@[^\s@]+\.[^\s@]+/
const EMAIL_VALUES = /[^\s@]+@[^\s@]+\.[^\s@]+/g

/** Redact secrets and operator-selected paths before an error reaches stdout. */
export function redactFixtureError(
  value: string,
  privateValues: string[],
): string {
  let redacted = value.replace(EMAIL_VALUES, '[redacted-email]')
  const longestFirst = [...new Set(privateValues)].sort((left, right) =>
    right.length - left.length
  )
  for (const privateValue of longestFirst) {
    if (privateValue.length >= 8) {
      redacted = redacted.replaceAll(privateValue, '[redacted]')
    }
  }
  return redacted
}

/** Fail closed before writing a supposedly public fixture manifest. */
export function assertPublicManifestRedacted(
  value: unknown,
  secrets: string[],
): void {
  const visit = (candidate: unknown, path: string): void => {
    if (typeof candidate === 'string') {
      invariant(
        !EMAIL_VALUE.test(candidate),
        `${path} contains an email address`,
      )
      return
    }
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (!candidate || typeof candidate !== 'object') return
    for (const [key, child] of Object.entries(candidate)) {
      invariant(
        !FORBIDDEN_PUBLIC_KEY.test(key),
        `${path}.${key} is secret-bearing`,
      )
      visit(child, `${path}.${key}`)
    }
  }
  visit(value, '$')

  const serialized = JSON.stringify(value)
  for (const secret of secrets) {
    if (secret.length < 8) continue
    invariant(
      !serialized.includes(secret),
      'public manifest contains a private value',
    )
  }
}
