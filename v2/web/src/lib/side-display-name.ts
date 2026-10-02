import type { ScenarioSummary, Side } from '../api/types'
import { scenarioModule } from '../scenarios'

// UI copy only: keep script metadata, prompts and historical transcripts intact.
export function sideDisplayName(
  scenarioID: string,
  side: Side,
  fallback: string,
): string {
  return scenarioModule(scenarioID)?.factionCopy?.names[side] ?? fallback
}

// #38/#39 统计一行：N 场 · 甲侧 x% / 乙侧 y%（胜率是 0..1 分数；平局等
// 未分胜负的场次让两侧合计可小于 100%，因此各自独立取整，不做 100-x）。
// 场景目录卡与场景详情页共用这一行。
export function sideStatsLine(summary: ScenarioSummary): string | null {
  const stats = summary.stats
  if (!stats) return null
  const pct = (rate: number) => `${Math.round(rate * 100)}%`
  return `${stats.battleCount} 场 · ${
    sideDisplayName(summary.id, 'a', summary.sideAName)
  } ${pct(stats.sideWinRate.a)} / ${
    sideDisplayName(summary.id, 'b', summary.sideBName)
  } ${pct(stats.sideWinRate.b)}`
}
