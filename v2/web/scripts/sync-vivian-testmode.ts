// Synchronize Vivian's reviewed A3/A4/A6 handoff source into the lazy-loaded
// Test Mode snapshot. The authoritative source lives in axiia-cup-uiux; this
// checked-in projection keeps the product bundle independent of that sibling
// checkout while preserving stable HV-* ids and clause-version pins.

import { verifiedSourceCommit } from './source-provenance.ts'

interface ConfirmedClause {
  chapter: string
  versionId: string
  canonical: string
  handoffReady: boolean
  testImpact: { implementationState: string }
}

interface VerificationSource {
  schemaVersion: number
  policyRevision?: { id: string; source: string; note: string }
  sourceRevision: string
  capturedAt: string
  scope: {
    handoffReadyClauseIds: string[]
  }
  confirmedClauses: Record<string, ConfirmedClause>
  manualDefaults: Record<string, string>
  manualVariables: Record<string, unknown>
  fixtureProfiles: unknown[]
  journeys: Array<{
    id: string
    steps: Array<{
      id: string
      clauses: string[]
      versionPins: Record<string, string>
    }>
  }>
}

interface SpecIndex {
  clauses: Record<string, {
    q: string
    impl: string
    [key: string]: unknown
  }>
  [key: string]: unknown
}

const defaultSource = new URL(
  '../../../../axiia-cup-uiux/spec-v4/sources/verification-vivian-rest.json',
  import.meta.url,
)
const checkOnly = Deno.args.includes('--check')
const sourceArgument = Deno.args.find((argument) => argument !== '--check')
const sourcePath: string | URL = sourceArgument
  ? await Deno.realPath(sourceArgument)
  : defaultSource
const snapshotPath = new URL(
  '../src/testmode/data/vivian-a3-a4-a6.json',
  import.meta.url,
)
const specIndexPath = new URL(
  '../src/testmode/data/spec-index.json',
  import.meta.url,
)

const parse = async <T>(path: string | URL): Promise<T> =>
  JSON.parse(await Deno.readTextFile(path)) as T

const sourceText = await Deno.readTextFile(sourcePath)
const source = JSON.parse(sourceText) as VerificationSource
const currentSnapshot = await parse<{
  policyRevision?: { id: string }
}>(snapshotPath)
if (
  currentSnapshot.policyRevision &&
  source.policyRevision?.id !== currentSnapshot.policyRevision.id
) {
  throw new Error(
    'The upstream guide predates the current single-match policy. Apply v2/specs/single-match-pvp/uiux-source.patch in axiia-cup-uiux and commit it before syncing; do not overwrite current copy with the old paired guide.',
  )
}
const sourceBytes = new TextEncoder().encode(sourceText)
const sourceCommit = verifiedSourceCommit(sourcePath, sourceBytes)
const sourceDigest = new Uint8Array(
  await crypto.subtle.digest('SHA-256', sourceBytes),
)
const sourceSha256 = [...sourceDigest]
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('')
if (source.schemaVersion !== 3) {
  throw new Error(
    `unsupported Vivian verification schema ${source.schemaVersion}`,
  )
}

const ready = [...source.scope.handoffReadyClauseIds]
const readySet = new Set(ready)
const stepClauses = source.journeys.flatMap((journey) =>
  journey.steps.flatMap((step) => step.clauses)
)
if (
  stepClauses.length !== ready.length ||
  new Set(stepClauses).size !== ready.length ||
  ready.some((id) => !stepClauses.includes(id))
) {
  throw new Error(
    'Vivian journey coverage is not an exact, duplicate-free handoff union',
  )
}

for (const journey of source.journeys) {
  for (const step of journey.steps) {
    const pinIds = Object.keys(step.versionPins).sort()
    const clauseIds = [...step.clauses].sort()
    if (JSON.stringify(pinIds) !== JSON.stringify(clauseIds)) {
      throw new Error(`${step.id} version pin keys do not match its clauses`)
    }
    for (const id of step.clauses) {
      const confirmed = source.confirmedClauses[id]
      if (!readySet.has(id) || !confirmed?.handoffReady) {
        throw new Error(`${step.id} includes non-handoff clause ${id}`)
      }
      if (step.versionPins[id] !== confirmed.versionId) {
        throw new Error(`${step.id} pins stale version for ${id}`)
      }
    }
  }
}

const snapshot = {
  schemaVersion: source.schemaVersion,
  ...(source.policyRevision ? { policyRevision: source.policyRevision } : {}),
  // Preserve the historical capture declaration separately from the clean
  // Git commit whose source bytes produced this projection.
  sourceRevision: source.sourceRevision,
  sourceCommit,
  sourceSha256,
  capturedAt: source.capturedAt,
  handoffReadyClauseIds: ready,
  confirmedClauses: Object.fromEntries(
    ready.map((id) => {
      const clause = source.confirmedClauses[id]
      if (!clause) throw new Error(`missing confirmed clause ${id}`)
      return [id, clause]
    }),
  ),
  manualDefaults: source.manualDefaults,
  manualVariables: source.manualVariables,
  fixtureProfiles: source.fixtureProfiles,
  journeys: source.journeys,
}

// Keep the reviewed canonical sentence and its dated implementation audit;
// current engineering evidence is maintained separately.
const specIndex = await parse<SpecIndex>(specIndexPath)
for (const [id, confirmed] of Object.entries(snapshot.confirmedClauses)) {
  const clause = specIndex.clauses[id]
  if (!clause) throw new Error(`spec-index is missing ${id}`)
  clause.q = confirmed.canonical
  clause.impl = confirmed.testImpact.implementationState
  if (confirmed.versionId.startsWith('policy-2026-09-17:')) {
    clause.historicalAudit ??= { text: clause.s, capturedAt: source.capturedAt }
    clause.s = '2026-09-17 单场规则修订；旧双场观察已归档，待本轮验收。'
  }
}
// The older spec-index generator revision did not produce this guide overlay.
// Record its verified source commit separately from the historical capture.
specIndex.vivianOverlay = {
  sourceRevision: source.sourceRevision,
  sourceCommit,
  sourceSha256,
  capturedAt: source.capturedAt,
  clauseIds: Object.keys(snapshot.confirmedClauses).sort(),
  handoffReadyClauseIds: [...ready].sort(),
}
for (
  const [path, value] of [[snapshotPath, snapshot], [
    specIndexPath,
    specIndex,
  ]] as const
) {
  if (checkOnly) {
    const current = await parse<unknown>(path)
    if (JSON.stringify(current) !== JSON.stringify(value)) {
      throw new Error(`Test Mode snapshot is stale: ${path.pathname}`)
    }
  } else {
    await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`)
  }
}

console.log(JSON.stringify({
  ok: true,
  checkOnly,
  sourcePath: sourcePath instanceof URL ? sourcePath.pathname : sourcePath,
  sourceRevision: source.sourceRevision,
  sourceCommit,
  sourceSha256,
  journeys: source.journeys.length,
  steps: source.journeys.flatMap((journey) => journey.steps).length,
  clauses: ready.length,
}))
