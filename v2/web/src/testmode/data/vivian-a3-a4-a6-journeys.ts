/* Vivian 已确认的 A3/A4/A6 固定版本旅程。
   数据由 scripts/sync-vivian-testmode.ts 从 uiux 仓的
   verification-vivian-rest.json 生成；这里仅把共享 source schema 投影成
   Test Mode 的 Journey 类型，不另抄文案、fixture 或 version pin。 */
import snapshotJson from './vivian-a3-a4-a6.json'
import type {
  CaptureKind,
  FixtureField,
  FixtureProfile,
  Journey,
  KnownGap,
  ReviewedChapter,
  StepCapture,
  StepTestLink,
} from '../data'
import { REVIEWED_MANUAL_PATH } from './reviewed-manual'

interface SourceManualVariable {
  label: string
  hint: string
  kind?: 'environment' | 'runtime'
  extract?: CaptureKind
}

type Readiness = NonNullable<FixtureProfile['readiness']>

interface SourceRole {
  id: string
  title: string
  accountAlias: string
  status: Readiness
  description: string
  variables: string[]
  defaults: Record<string, string>
}

interface SourceFixtureProfile {
  journeyId: string
  roles: SourceRole[]
}

interface SourceStep {
  id: string
  url: string
  links?: StepTestLink[]
  route: string
  marker: string | null
  fixtureRefs: string[]
  captures?: Omit<StepCapture, 'extract'>[]
  knownGap?: KnownGap
  action: string
  expected: string
  clauses: string[]
  versionPins: Record<string, string>
  screenshotEvidence: string[]
}

interface SourceJourney {
  id: string
  chapter: Extract<ReviewedChapter, 'A3' | 'A4' | 'A6'>
  title: string
  prerequisites: string[]
  steps: SourceStep[]
  evidenceRequirements: string[]
  completion: string
}

interface VivianSnapshot {
  schemaVersion: number
  sourceRevision: string
  sourceSha256: string
  capturedAt: string
  handoffReadyClauseIds: string[]
  confirmedClauses: Record<string, {
    versionId: string
    canonical: string
    handoffReady: boolean
  }>
  manualDefaults: Record<string, string>
  manualVariables: Record<string, SourceManualVariable>
  fixtureProfiles: SourceFixtureProfile[]
  journeys: SourceJourney[]
}

const source = snapshotJson as unknown as VivianSnapshot

export const VIVIAN_SOURCE_REVISION = source.sourceRevision
export const VIVIAN_SOURCE_SHA256 = source.sourceSha256
export const VIVIAN_CAPTURED_AT = source.capturedAt
export const VIVIAN_HANDOFF_READY_CLAUSE_IDS = source.handoffReadyClauseIds

const JOURNEY_NUMBERS: Record<string, string> = {
  'HV-A3-FIRST-BATTLE': 'A3.1',
  'HV-A3-TRIALS-BLOCKED': 'A3.2',
  'HV-A4-CATALOG-DETAIL': 'A4.1',
  'HV-A6-GATES-CREATION': 'A6.1',
  'HV-A6-ENTRY-QUOTA': 'A6.2',
}

const SCREENSHOT_HANDOFF =
  '先按指定文件名截图，再到「详细手册 · 上传本步骤截图」提交。Test Mode 的结果按钮只写条款与步骤状态，不会代替图片上传。'

function fixtureField(name: string): FixtureField {
  const definition = source.manualVariables[name]
  if (!definition) {
    throw new Error(`Vivian fixture variable ${name} is undefined`)
  }
  return {
    name,
    label: definition.label,
    help: definition.hint,
    ...(definition.kind === 'runtime' ? { kind: 'runtime' as const } : {}),
    ...(definition.extract ? { extract: definition.extract } : {}),
  }
}

function fixtureProfiles(journeyId: string): {
  profiles: FixtureProfile[]
  defaults: Record<string, string>
} {
  const sourceProfile = source.fixtureProfiles.find((profile) =>
    profile.journeyId === journeyId
  )
  if (!sourceProfile) {
    throw new Error(`Vivian journey ${journeyId} has no fixture profile`)
  }

  const defaults: Record<string, string> = { ...source.manualDefaults }
  const profiles = sourceProfile.roles.map((role): FixtureProfile => {
    // refresh-required ids describe mutable shared state. Never silently revive
    // yesterday's agent/version ids; the provisioner or tester must refresh them.
    if (role.status === 'ready') Object.assign(defaults, role.defaults)
    return {
      id: role.id,
      label: role.title,
      accountAlias: role.accountAlias,
      readiness: role.status,
      ...(role.status === 'known-gap' ? { kind: 'known-gap' as const } : {}),
      description: role.description,
      fields: role.variables.map(fixtureField),
    }
  })
  return { profiles, defaults }
}

function capture(input: Omit<StepCapture, 'extract'>): StepCapture {
  const definition = source.manualVariables[input.variable]
  return {
    ...input,
    ...(definition?.extract ? { extract: definition.extract } : {}),
  }
}

function journey(input: SourceJourney): Journey {
  const fixtures = fixtureProfiles(input.id)
  const n = JOURNEY_NUMBERS[input.id]
  if (!n) throw new Error(`Vivian journey ${input.id} has no Test Mode number`)
  return {
    id: input.id,
    round: 'handoff',
    n,
    chapter: input.chapter,
    title: input.title,
    manual: REVIEWED_MANUAL_PATH,
    manualAnchor: input.id,
    prerequisites: input.prerequisites,
    evidenceRequirements: input.evidenceRequirements,
    completion: input.completion,
    fixtureProfiles: fixtures.profiles,
    fixtureDefaults: fixtures.defaults,
    steps: input.steps.map((step, index) => ({
      id: step.id,
      round: 'handoff',
      journey: n,
      index: index + 1,
      action: step.action,
      expected: step.expected,
      clauseIds: step.clauses,
      specLine: `${input.chapter} · Vivian 已确认 · 固定现行版本`,
      anchors: [],
      primary: step.clauses.slice(0, 1),
      known: null,
      humanOnly: SCREENSHOT_HANDOFF,
      manualUrl: `${REVIEWED_MANUAL_PATH}#${step.id}`,
      route: step.route,
      marker: step.marker,
      versionPins: step.versionPins,
      testUrl: step.url,
      links: step.links,
      captures: step.captures?.map(capture),
      fixtureRefs: step.fixtureRefs,
      knownGap: step.knownGap,
      screenshotEvidence: step.screenshotEvidence,
    })),
  }
}

export const VIVIAN_A3_A4_A6_JOURNEYS: Journey[] = source.journeys.map(journey)
