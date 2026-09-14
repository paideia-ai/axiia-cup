import {
  assertA6JourneyCapacity,
  assertFixtureOrigin,
  assertPublicManifestRedacted,
  buildA6TestModeFixtures,
  optionalCommitSha,
  redactFixtureError,
  selectA6Scenarios,
  utc8QuotaDate,
  VIVIAN_A6_SOURCE_CAPTURED_AT,
  VIVIAN_A6_SOURCE_REVISION,
  VIVIAN_A6_SOURCE_SHA256,
} from './reviewed-human-fixtures.ts'

import assert from 'node:assert/strict'
import specIndex from '../src/testmode/data/spec-index.json' with {
  type: 'json',
}

Deno.test('A6 manifest provenance matches the product clause overlay', () => {
  assert.deepEqual({
    sourceRevision: VIVIAN_A6_SOURCE_REVISION,
    sourceSha256: VIVIAN_A6_SOURCE_SHA256,
    capturedAt: VIVIAN_A6_SOURCE_CAPTURED_AT,
  }, {
    sourceRevision: specIndex.vivianOverlay.sourceRevision,
    sourceSha256: specIndex.vivianOverlay.sourceSha256,
    capturedAt: specIndex.vivianOverlay.capturedAt,
  })
  assert.match(VIVIAN_A6_SOURCE_SHA256, /^[0-9a-f]{64}$/)
})

const scenario = (id: string, count: number) => ({
  id,
  title: `Scenario ${id}`,
  presets: [
    ...Array.from({ length: count }, (_, index) => ({
      key: `a-${index}`,
      side: 'a',
    })),
    ...Array.from({ length: count }, (_, index) => ({
      key: `b-${index}`,
      side: 'b',
    })),
  ],
})

Deno.test('A6 capacity follows live N and requires cross-scenario retry headroom', () => {
  assert.equal(
    assertA6JourneyCapacity({
      dailyBattleLimit: 13,
      pvpDailyLimit: 5,
      concurrencyLimit: 3,
      pvpUnlockPerSideWins: 3,
      opponentDailyChallengeLimit: 3,
      trialsBlocked: false,
    }),
    12,
  )
  assert.throws(() =>
    assertA6JourneyCapacity({
      dailyBattleLimit: 12,
      pvpDailyLimit: 5,
      concurrencyLimit: 3,
      pvpUnlockPerSideWins: 3,
      opponentDailyChallengeLimit: 3,
      trialsBlocked: false,
    })
  )
  assert.throws(() =>
    assertA6JourneyCapacity({
      dailyBattleLimit: 13,
      pvpDailyLimit: 5,
      concurrencyLimit: 3,
      pvpUnlockPerSideWins: 3,
      opponentDailyChallengeLimit: 3,
      trialsBlocked: true,
    })
  )
})

Deno.test('A6 scenario selection proves two distinct live slugs with N presets per side', () => {
  const selected = selectA6Scenarios(
    [scenario('zeta', 2), scenario('alpha', 2), scenario('too-small', 1)],
    2,
  )
  assert.equal(selected.primary.slug, 'alpha')
  assert.equal(selected.other.slug, 'zeta')
  assert.deepEqual(selected.primary.presetCounts, { a: 2, b: 2 })
  assert.equal(selected.other.liveCatalogObserved, true)

  const explicit = selectA6Scenarios(
    [scenario('alpha', 2), scenario('zeta', 2)],
    2,
    'zeta',
    'alpha',
  )
  assert.equal(explicit.primary.slug, 'zeta')
  assert.equal(explicit.other.slug, 'alpha')

  const otherOnly = selectA6Scenarios(
    [scenario('alpha', 2), scenario('zeta', 2)],
    2,
    undefined,
    'alpha',
  )
  assert.equal(otherOnly.primary.slug, 'zeta')
  assert.equal(otherOnly.other.slug, 'alpha')
})

Deno.test('A6 scenario selection rejects aliases, missing live slugs, and insufficient presets', () => {
  assert.throws(() =>
    selectA6Scenarios(
      [scenario('alpha', 2), scenario('zeta', 2)],
      2,
      'alpha',
      'alpha',
    )
  )
  assert.throws(() =>
    selectA6Scenarios(
      [scenario('alpha', 2), scenario('zeta', 1)],
      2,
      'alpha',
      'zeta',
    )
  )
  assert.throws(() =>
    selectA6Scenarios(
      [scenario('alpha', 2), scenario('zeta', 2)],
      2,
      'missing',
    )
  )

  const duplicateAcrossSides = scenario('duplicate', 2)
  duplicateAcrossSides.presets[2].key = duplicateAcrossSides.presets[0].key
  assert.throws(() =>
    selectA6Scenarios(
      [duplicateAcrossSides, scenario('zeta', 2)],
      2,
      'duplicate',
      'zeta',
    )
  )
})

Deno.test('public manifest redaction rejects secret keys, emails, and private values', () => {
  assertPublicManifestRedacted(
    {
      testModeFixtures: { a6GateAgentId: '42' },
      generation: {
        id: 'public-generation-abcdef',
        rerunCreatesFreshGeneration: true,
      },
    },
    ['super-private-value'],
  )
  assert.throws(() =>
    assertPublicManifestRedacted({ password: 'not-public' }, [])
  )
  assert.throws(() =>
    assertPublicManifestRedacted({ alias: 'tester@example.test' }, [])
  )
  assert.throws(() =>
    assertPublicManifestRedacted(
      { harmless: 'prefix-super-private-value-suffix' },
      ['super-private-value'],
    )
  )
  assert.throws(() =>
    assertPublicManifestRedacted({ generation: { batch: 'private' } }, [])
  )
})

Deno.test('A6 failure output redacts operator paths and private generation values', () => {
  const privatePathRaw = 'artifacts/a6-private.json'
  const privatePath = `/sensitive/workdir/${privatePathRaw}`
  const publicPath = '/tmp/operator-selected/a6-public.json'
  const privateBatch = '20260909123456-private-batch'
  const message =
    `open '${privatePath}' then ${publicPath}; batch ${privateBatch}; ` +
    'admin@example.test and role@example.test'

  const redacted = redactFixtureError(message, [
    privatePathRaw,
    privatePath,
    publicPath,
    privateBatch,
  ])
  assert.doesNotMatch(
    redacted,
    /sensitive|workdir|artifacts|operator-selected|private-batch|example\.test/,
  )
  assert.match(redacted, /\[redacted\]/)
  assert.match(redacted, /\[redacted-email\]/)
})

Deno.test('A6 Test Mode fixture projection uses the exact reviewed variable names', () => {
  assert.deepEqual(
    buildA6TestModeFixtures('primary', 'other', 41, 42, 43),
    {
      a6GateAgentId: '41',
      a6OtherScenarioSlug: 'other',
      a6LockedOpponentVersionId: '42',
      a6CreationAgentId: '43',
    },
  )
  assert.throws(() => buildA6TestModeFixtures('primary', 'primary', 41, 42, 43))
  assert.throws(() => buildA6TestModeFixtures('primary', 'other', 0, 42, 43))
})

Deno.test('UTC+8 quota date rolls over at the server boundary', () => {
  assert.equal(utc8QuotaDate(new Date('2026-09-09T15:59:59Z')), '2026-09-09')
  assert.equal(utc8QuotaDate(new Date('2026-09-09T16:00:00Z')), '2026-09-10')
})

Deno.test('optional deployment provenance accepts only a commit SHA', () => {
  assert.equal(optionalCommitSha(undefined), undefined)
  assert.equal(
    optionalCommitSha(' AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA '),
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  )
  assert.throws(() => optionalCommitSha('token-looking-but-not-a-commit'))
})

Deno.test('fixture origins accept production and loopback but reject credential forwarding', () => {
  assertFixtureOrigin('https://axiia-cup-2-web.isofucius.cn')
  for (
    const origin of [
      'http://localhost:3001',
      'http://127.0.0.1:9090',
      'http://[::1]:8080',
    ]
  ) assertFixtureOrigin(origin)
  for (
    const origin of [
      'https://example.org',
      'http://127.0.0.1.evil.test:3001',
      'http://localhost:3001/path',
      'http://name:password@localhost:3001',
      'http://localhost:3001?redirect=elsewhere',
    ]
  ) {
    let rejected = false
    try {
      assertFixtureOrigin(origin)
    } catch {
      rejected = true
    }
    if (!rejected) {
      throw new Error('unexpectedly accepted untrusted fixture origin')
    }
  }
})
