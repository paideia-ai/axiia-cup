import { describe, expect, it } from 'vitest'
import type { MatchDetail } from '../api/types'
import { speakerLabels } from '../components/timeline/labels'
import court from '../testing/reference-match-144.json'
import honnoji from '../testing/reference-match-120.json'
import trolley from '../testing/reference-match-122.json'
import fengyi from '../testing/reference-match-123.json'
import harbor from '../testing/reference-match-145.json'
import { canConsolidateEnding } from './match-ending'
import { isTerminalVerdict } from './verdict'
import { scriptEvent } from './event'

function accepts(match: MatchDetail) {
  return canConsolidateEnding(
    match,
    match.verdicts.find(isTerminalVerdict) ?? null,
    speakerLabels(
      match.summary.scenarioID,
      match.speakerLabels,
      match.turns.map((turn) => turn.speaker),
      match.summary.participants,
    ),
  )
}
function copy(raw: unknown = court): MatchDetail {
  return structuredClone(raw) as MatchDetail
}

describe('finished report consolidation', () => {
  for (const raw of [court, honnoji, trolley, fengyi, harbor]) {
    it(`supports the complete ${raw.summary.scenarioID} report`, () => {
      expect(accepts(copy(raw))).toBe(true)
    })
  }
  it('retains the full report when the ledger does not reconcile', () => {
    const match = copy()
    match.scoreA = 999
    expect(accepts(match)).toBe(false)
  })
  it('does not label unknown truth as a false goal', () => {
    const match = copy()
    const score = match.turns.map(scriptEvent).find((event) =>
      event?.type === 'score'
    )!
    delete score.trueRequests
    expect(accepts(match)).toBe(false)
  })
  it('retains unknown request IDs and their verdicts', () => {
    const match = copy()
    const event = match.turns.map(scriptEvent).find((event) =>
      event?.type === 'verdict'
    )!
    event.requests = { ...(event.requests as object), FUTURE1: '同意' }
    expect(accepts(match)).toBe(false)
  })
  it('does not hide disagreement between judge output and event', () => {
    const match = copy()
    const verdict = match.verdicts.find(isTerminalVerdict)!
    verdict.output = JSON.stringify({
      ...JSON.parse(verdict.output),
      SR1: '不同意',
    })
    expect(accepts(match)).toBe(false)
  })
  for (const raw of [court, trolley, fengyi]) {
    it(`retains new output fields in ${raw.summary.scenarioID}`, () => {
      const match = copy(raw)
      const verdict = match.verdicts.find(isTerminalVerdict)!
      verdict.output = JSON.stringify({
        ...JSON.parse(verdict.output),
        extra: '保留此信息',
      })
      expect(accepts(match)).toBe(false)
    })
  }
  it('retains an unstructured historical verdict', () => {
    const match = copy()
    match.verdicts.find(isTerminalVerdict)!.output = '旧版判词'
    expect(accepts(match)).toBe(false)
  })
  it('waits until scoring is complete', () => {
    const match = copy()
    match.summary.scored = false
    expect(accepts(match)).toBe(false)
  })
})
