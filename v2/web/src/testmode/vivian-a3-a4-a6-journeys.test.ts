import { describe, expect, it } from 'vitest'

import { CLAUSES, JOURNEYS, STEPS } from './data'
import { REVIEWED_MANUAL_PATH } from './data/reviewed-manual'
import specIndexJson from './data/spec-index.json'
import {
  VIVIAN_A3_A4_A6_JOURNEYS,
  VIVIAN_HANDOFF_READY_CLAUSE_IDS,
  VIVIAN_SOURCE_SHA256,
} from './data/vivian-a3-a4-a6-journeys'
import snapshotJson from './data/vivian-a3-a4-a6.json'
import { fixtureVariables } from './fixtures'
import { TM } from './registry/index'

interface SnapshotClause {
  versionId: string
  canonical: string
  handoffReady: boolean
  testImpact: { implementationState: string }
}

interface SnapshotFixtureRole {
  id: string
  status: 'ready' | 'refresh-required' | 'known-gap'
  variables: string[]
  defaults: Record<string, string>
}

interface VivianSnapshot {
  sourceSha256: string
  handoffReadyClauseIds: string[]
  confirmedClauses: Record<string, SnapshotClause>
  manualDefaults: Record<string, string>
  fixtureProfiles: Array<{
    journeyId: string
    roles: SnapshotFixtureRole[]
  }>
}

const source = snapshotJson as unknown as VivianSnapshot
const MANUAL_PATH = '/spec-v4-reviewed-human-test'

const EXPECTED_JOURNEYS = [
  {
    id: 'HV-A3-FIRST-BATTLE',
    chapter: 'A3',
    steps: 7,
    screenshots: 11,
    roles: 1,
  },
  {
    id: 'HV-A3-TRIALS-BLOCKED',
    chapter: 'A3',
    steps: 1,
    screenshots: 2,
    roles: 1,
  },
  {
    id: 'HV-A4-CATALOG-DETAIL',
    chapter: 'A4',
    steps: 8,
    screenshots: 15,
    roles: 2,
  },
  {
    id: 'HV-A6-GATES-CREATION',
    chapter: 'A6',
    steps: 4,
    screenshots: 9,
    roles: 2,
  },
  {
    id: 'HV-A6-ENTRY-QUOTA',
    chapter: 'A6',
    steps: 8,
    screenshots: 17,
    roles: 7,
  },
] as const

const EXPECTED_STEP_IDS = EXPECTED_JOURNEYS.flatMap((journey) =>
  Array.from(
    { length: journey.steps },
    (_, index) => `${journey.id}-S${String(index + 1).padStart(2, '0')}`,
  )
)

const HANDOFF_READY_CLAUSES = [
  'U03-C01',
  'U03-C02',
  'U03-C03',
  'U03-C04',
  'U03-C05',
  'U03-C06',
  'U03-C07',
  'U03-C09',
  'U03-C10',
  'U03-C12',
  'U11-C06',
  'U04-C01',
  'U04-C02',
  'U04-C03',
  'U04-C04',
  'U04-C05',
  'U04-C06',
  'U04-C07',
  'U04-C08',
  'U04-C09',
  'U04-C10',
  'U04-C11',
  'U04-C12',
  'U04-C13',
  'U04-C15',
  'U06-C01',
  'U06-C02',
  'U06-C04',
  'U06-C06',
  'U06-C07',
  'U06-C08',
  'U06-C09',
  'U06-C10',
  'U06-C11',
  'U06-C12',
  'U06-C13',
  'U06-C14',
  'U06-C15',
  'U06-C16',
  'U11-C07',
]

const EXCLUDED_CLAUSES = [
  'U03-C08',
  'U03-C13',
  'U04-C14',
  'U04-C16',
  'U06-C03',
  'U06-C05',
]

const EXPECTED_ROLE_IDS = [
  'a3-first-battle',
  'a3-trials-blocked',
  'a4-catalog',
  'a4-detail',
  'a6-creation',
  'a6-daily-exhausted',
  'a6-entry',
  'a6-entry-first-save',
  'a6-entry-tournament',
  'a6-gates',
  'a6-qualification',
  'a6-quota',
  'a6-score',
].sort()

const A6_REQUIRED_VARIABLES = [
  'a6CreationAgentId',
  'a6DailyExhaustedAgentId',
  'a6DailyExhaustedOpponentVersionId',
  'a6EntryAgentId',
  'a6EntrySiblingAgentId',
  'a6GateAgentId',
  'a6LockedOpponentVersionId',
  'a6NoEntryAgentId',
  'a6OtherScenarioSlug',
  'a6PvpAgentId',
  'a6PvpOpponentVersionId',
  'a6QualificationAgentId',
  'a6QualificationTournamentId',
  'a6ScoreAgentId',
  'a6TournamentId',
].sort()

describe('Vivian A3 / A4 / A6 固定版本人测交接', () => {
  it('产品实际加载全部当前交接旅程与步骤，而不是只检查未引用的快照', () => {
    const handoff = JOURNEYS.filter((journey) => journey.round === 'handoff')
    expect(handoff).toHaveLength(10)
    expect(handoff.flatMap((journey) => journey.steps)).toHaveLength(49)
    for (const journey of VIVIAN_A3_A4_A6_JOURNEYS) {
      expect(handoff).toContain(journey)
      for (const step of journey.steps) expect(STEPS[step.id]).toBe(step)
    }
    for (const journey of handoff) {
      expect(journey.manual).toBe(MANUAL_PATH)
      for (const step of journey.steps) {
        expect(step.manualUrl).toBe(`${MANUAL_PATH}#${step.id}`)
      }
    }
  })

  it('精确投影 5 条旅程、28 步、54 张截图和 13 个角色', () => {
    expect(
      VIVIAN_A3_A4_A6_JOURNEYS.map((journey) => ({
        id: journey.id,
        chapter: journey.chapter,
        steps: journey.steps.length,
        screenshots: journey.steps.flatMap(
          (step) => step.screenshotEvidence ?? [],
        ).length,
        roles: journey.fixtureProfiles?.length ?? 0,
      })),
    ).toEqual(EXPECTED_JOURNEYS)

    const steps = VIVIAN_A3_A4_A6_JOURNEYS.flatMap((journey) => journey.steps)
    expect(steps).toHaveLength(28)
    expect(steps.map((step) => step.id)).toEqual(EXPECTED_STEP_IDS)

    const screenshots = steps.flatMap(
      (step) => step.screenshotEvidence ?? [],
    )
    expect(screenshots).toHaveLength(54)
    expect(new Set(screenshots)).toHaveLength(54)
    for (const step of steps) {
      for (const screenshot of step.screenshotEvidence ?? []) {
        expect(screenshot).toMatch(new RegExp(`^${step.id}-.+\\.png$`))
      }
    }

    const roles = VIVIAN_A3_A4_A6_JOURNEYS.flatMap(
      (journey) => journey.fixtureProfiles ?? [],
    )
    expect(roles).toHaveLength(13)
    expect(roles.map((role) => role.id).sort()).toEqual(EXPECTED_ROLE_IDS)
  })

  it('条款并集精确为 40 条，固定 Vivian 版本、规范句和实现状态', () => {
    expect(VIVIAN_HANDOFF_READY_CLAUSE_IDS).toEqual(HANDOFF_READY_CLAUSES)
    expect(source.handoffReadyClauseIds).toEqual(HANDOFF_READY_CLAUSES)
    expect(Object.keys(source.confirmedClauses).sort()).toEqual(
      [...HANDOFF_READY_CLAUSES].sort(),
    )

    const steps = VIVIAN_A3_A4_A6_JOURNEYS.flatMap((journey) => journey.steps)
    const clauseIds = steps.flatMap((step) => step.clauseIds)
    expect(clauseIds).toHaveLength(40)
    expect(new Set(clauseIds)).toHaveLength(40)
    expect([...new Set(clauseIds)].sort()).toEqual(
      [...HANDOFF_READY_CLAUSES].sort(),
    )

    for (const step of steps) {
      expect(Object.keys(step.versionPins ?? {}).sort()).toEqual(
        [...step.clauseIds].sort(),
      )
      for (const id of step.clauseIds) {
        const confirmed = source.confirmedClauses[id]
        expect(confirmed.handoffReady, `${id} 没有 handoffReady`).toBe(true)
        expect(step.versionPins?.[id], `${step.id} 没钉住 ${id}`).toBe(
          confirmed.versionId,
        )
        expect(CLAUSES[id]?.q, `${id} 仍不是 Vivian 规范句`).toBe(
          confirmed.canonical,
        )
        expect(CLAUSES[id]?.impl, `${id} 实现状态与 Vivian 快照不一致`).toBe(
          confirmed.testImpact.implementationState,
        )
      }
    }
  })

  it('明确排除未进入交接并集的 A3 / A4 / A6 条款', () => {
    const included = new Set(
      VIVIAN_A3_A4_A6_JOURNEYS.flatMap((journey) =>
        journey.steps.flatMap((step) => step.clauseIds)
      ),
    )
    for (const id of EXCLUDED_CLAUSES) {
      expect(included.has(id), `${id} 不应进入人测旅程`).toBe(false)
      expect(VIVIAN_HANDOFF_READY_CLAUSE_IDS).not.toContain(id)
      expect(source.confirmedClauses).not.toHaveProperty(id)
    }
  })

  it('全部步骤使用规范手册深链、可执行网址、截图和已登记标记', () => {
    expect(REVIEWED_MANUAL_PATH).toBe(MANUAL_PATH)
    for (const journey of VIVIAN_A3_A4_A6_JOURNEYS) {
      expect(journey.manual).toBe(MANUAL_PATH)
      expect(journey.manualAnchor).toBe(journey.id)
      expect(journey.prerequisites?.length).toBeGreaterThan(0)
      expect(journey.evidenceRequirements?.length).toBeGreaterThan(0)
      expect(journey.completion).toBeTruthy()

      for (const step of journey.steps) {
        expect(step.manualUrl).toBe(`${MANUAL_PATH}#${step.id}`)
        expect(step.testUrl).toMatch(/^\{\{appBaseUrl\}\}\//)
        expect(step.route).toMatch(/^\//)
        expect(step.action).toBeTruthy()
        expect(step.expected).toBeTruthy()
        expect(step.screenshotEvidence?.length).toBeGreaterThan(0)
        expect(step.fixtureRefs?.length).toBeGreaterThan(0)
        if (step.marker) {
          expect(TM[step.marker], `${step.id} 的标记 ${step.marker} 未登记`)
            .toBeTruthy()
        }
      }
    }
  })

  it('A3 在产生资源的步骤精确捕获 agentId 和 matchId', () => {
    const steps = Object.fromEntries(
      VIVIAN_A3_A4_A6_JOURNEYS.flatMap((journey) =>
        journey.steps.map((step) => [step.id, step])
      ),
    )
    expect(steps['HV-A3-FIRST-BATTLE-S02'].captures).toEqual([
      {
        variable: 'a3FreshAgentId',
        label: '记录新建 agentId',
        placeholder: '/agents/123/build?express=1',
        hint: '只取本轮地址栏。',
        extract: 'agentId',
      },
    ])
    expect(steps['HV-A3-FIRST-BATTLE-S04'].captures).toEqual([
      {
        variable: 'a3FirstMatchId',
        label: '记录首战 matchId',
        placeholder: '/matches/123',
        hint: '明确点击开始首战后记录。',
        extract: 'matchId',
      },
    ])

    const a3 = VIVIAN_A3_A4_A6_JOURNEYS.find(
      (journey) => journey.id === 'HV-A3-FIRST-BATTLE',
    )!
    const fields = Object.fromEntries(
      (a3.fixtureProfiles?.[0].fields ?? []).map((field) => [
        field.name,
        field,
      ]),
    )
    expect(fields.a3FreshAgentId).toMatchObject({
      kind: 'runtime',
      extract: 'agentId',
    })
    expect(fields.a3FirstMatchId).toMatchObject({
      kind: 'runtime',
      extract: 'matchId',
    })
  })

  it('A6 精确要求 15 个变量，且每一步只引用其角色提供的变量', () => {
    const journeys = VIVIAN_A3_A4_A6_JOURNEYS.filter(
      (journey) => journey.chapter === 'A6',
    )
    const declared = journeys.flatMap((journey) =>
      (journey.fixtureProfiles ?? []).flatMap((profile) =>
        profile.fields.map((field) => field.name)
      )
    )
    expect([...new Set(declared)].sort()).toEqual(A6_REQUIRED_VARIABLES)

    const used = fixtureVariables(
      ...journeys.flatMap((journey) =>
        journey.steps.flatMap((step) => [
          step.testUrl,
          step.action,
          step.expected,
          ...(step.links ?? []).map((link) => link.url),
        ])
      ),
    ).filter((name) => name.startsWith('a6'))
    expect(used.sort()).toEqual(A6_REQUIRED_VARIABLES)

    for (const journey of journeys) {
      const profiles = new Map(
        (journey.fixtureProfiles ?? []).map((profile) => [profile.id, profile]),
      )
      for (const step of journey.steps) {
        const available = new Set(
          (step.fixtureRefs ?? []).flatMap((id) => {
            const profile = profiles.get(id)
            expect(profile, `${step.id} 引用了不存在的 profile ${id}`)
              .toBeTruthy()
            return profile?.fields.map((field) => field.name) ?? []
          }),
        )
        const required = fixtureVariables(
          step.testUrl,
          step.action,
          step.expected,
          ...(step.links ?? []).map((link) => link.url),
        ).filter((name) => name !== 'appBaseUrl')
        expect(
          required.filter((name) => !available.has(name)),
          `${step.id} 有未归属角色的变量`,
        ).toEqual([])
      }
    }
  })

  it('refresh-required 与 known-gap 的旧默认值不进入 Test Mode', () => {
    const defaults = Object.fromEntries(
      VIVIAN_A3_A4_A6_JOURNEYS.map((journey) => [
        journey.id,
        journey.fixtureDefaults,
      ]),
    )
    expect(defaults).toEqual({
      'HV-A3-FIRST-BATTLE': {
        appBaseUrl: 'https://axiia-cup-2-web.isofucius.cn',
      },
      'HV-A3-TRIALS-BLOCKED': {
        appBaseUrl: 'https://axiia-cup-2-web.isofucius.cn',
      },
      'HV-A4-CATALOG-DETAIL': {
        appBaseUrl: 'https://axiia-cup-2-web.isofucius.cn',
        a4ScenarioSlug: 'shangyang-court',
      },
      'HV-A6-GATES-CREATION': {
        appBaseUrl: 'https://axiia-cup-2-web.isofucius.cn',
      },
      'HV-A6-ENTRY-QUOTA': {
        appBaseUrl: 'https://axiia-cup-2-web.isofucius.cn',
      },
    })

    for (const fixture of source.fixtureProfiles) {
      const actual = defaults[fixture.journeyId] ?? {}
      for (const role of fixture.roles) {
        for (const [name, value] of Object.entries(role.defaults)) {
          if (role.status === 'ready') expect(actual[name]).toBe(value)
          else expect(actual).not.toHaveProperty(name)
        }
      }
    }
  })

  it('来源摘要是小写十六进制 SHA-256', () => {
    expect(VIVIAN_SOURCE_SHA256).toBe(source.sourceSha256)
    expect(VIVIAN_SOURCE_SHA256).toMatch(/^[0-9a-f]{64}$/)
    expect(specIndexJson.vivianOverlay).toMatchObject({
      sourceSha256: VIVIAN_SOURCE_SHA256,
      handoffReadyClauseIds: [...HANDOFF_READY_CLAUSES].sort(),
    })
  })
})
