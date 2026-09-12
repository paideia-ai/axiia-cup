import { describe, expect, it } from 'vitest'

import { CLAUSES } from './data'
import reviewed from './data/vivian-a3-a4-a6.json'
import {
  clauseAuditDate,
  CURRENT_EVIDENCE,
  currentClauseEvidence,
  matchingCurrentEvidence,
} from './current-evidence'

describe('current engineering evidence stays separate from the reviewed audit', () => {
  it('fails closed when a reviewed clause pin changes or is unavailable', () => {
    for (const [id, evidence] of Object.entries(CURRENT_EVIDENCE)) {
      expect(currentClauseEvidence(id)).toEqual(evidence)
      expect(matchingCurrentEvidence(id, evidence.versionPin)).toEqual(evidence)
      expect(matchingCurrentEvidence(id, `next:${id}`)).toBeUndefined()
      expect(matchingCurrentEvidence(id, undefined)).toBeUndefined()
    }
    expect(currentClauseEvidence('unknown-clause')).toBeUndefined()
  })

  it('keeps current-scene engineering proof separate from human acceptance', () => {
    expect(currentClauseEvidence('U04-C02')).toBeUndefined()
    expect(currentClauseEvidence('U04-C01')?.scope).toBe(
      '当前公开场景已工程核验',
    )
    expect(currentClauseEvidence('U04-C01')?.remaining).toContain(
      '本轮真人验收仍需完成',
    )
    expect(currentClauseEvidence('U04-C01')?.remaining).toContain(
      '后续场景内容需另行核对',
    )
    expect(currentClauseEvidence('U06-C14')?.remaining).toContain('仍待准备')
  })

  it('retains canonical text, captured status, version pins and human verification', () => {
    const snapshot = JSON.stringify(reviewed.confirmedClauses)
    const clauses = JSON.stringify(CLAUSES)
    for (const [id, clause] of Object.entries(reviewed.confirmedClauses)) {
      currentClauseEvidence(id)
      expect(CLAUSES[id].q).toBe(clause.canonical)
      expect(CLAUSES[id].impl).toBe(clause.testImpact.implementationState)
    }
    expect(CLAUSES['U06-C14'].impl).toBe('pending_ruling')
    expect(CLAUSES['U04-C01'].impl).toBe('gap_open')
    expect(JSON.stringify(reviewed.confirmedClauses)).toBe(snapshot)
    expect(JSON.stringify(CLAUSES)).toBe(clauses)
  })

  it('dates a captured reviewed clause separately from the original audit index', () => {
    expect(clauseAuditDate('U06-C14')).toBe('2026-09-09')
    expect(clauseAuditDate('U01-C01')).toBe('2026-08-30')
    for (const evidence of Object.values(CURRENT_EVIDENCE)) {
      expect(evidence.checkedAt).toBe('2026-09-12')
      for (const release of evidence.releases) {
        expect(release.revision).toMatch(/^[a-f0-9]{40}$/)
        expect(release.url).toMatch(
          /^https:\/\/github\.com\/paideia-ai\/axiia-cup(?:-v2)?\/pull\/\d+$/,
        )
      }
    }
  })
})
