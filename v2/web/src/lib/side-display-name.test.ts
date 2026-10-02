import { describe, expect, it } from 'vitest'
import type { ScenarioSummary } from '../api/types'
import { sideDisplayName, sideStatsLine } from './side-display-name'

const honnoji: ScenarioSummary = {
  id: 'honnoji-decision',
  title: '本能寺之变·敌在何处',
  subject: '历史',
  sideAName: '主张杀信长',
  sideBName: '主张不杀信长',
  sideALabel: '',
  sideBLabel: '',
  turnCount: 10,
  gateUnlocked: false,
  stats: { battleCount: 20, sideWinRate: { a: 0.7, b: 0.3 } },
}

describe('side display names', () => {
  it('replaces script side names only for faction scenarios', () => {
    expect(sideDisplayName('honnoji-decision', 'a', '主张杀信长'))
      .toBe('袭击本能寺')
    expect(sideDisplayName('honnoji-decision', 'b', '主张不杀信长'))
      .toBe('西进毛利')
    expect(sideDisplayName('shangyang-court', 'a', '商鞅')).toBe('商鞅')
    expect(sideDisplayName('unknown-scenario', 'b', '乙方')).toBe('乙方')
  })
  it('uses the faction names in the shared win-rate line', () => {
    expect(sideStatsLine(honnoji))
      .toBe('20 场 · 袭击本能寺 70% / 西进毛利 30%')
    expect(sideStatsLine({
      ...honnoji,
      id: 'shangyang-court',
      sideAName: '商鞅',
      sideBName: '甘龙',
    })).toBe('20 场 · 商鞅 70% / 甘龙 30%')
    expect(sideStatsLine({ ...honnoji, stats: null })).toBeNull()
  })
})
