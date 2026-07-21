import { join } from 'node:path'

type Side = 'a' | 'b'

type History = {
  jobId: string
  levelA: number
  levelB: number
  pairId: string | null
  roleAKey: string
  roleAName: string
  roleBKey: string
  roleBName: string
  scenarioId: string
  status: 'error' | 'ok'
  transcript: Array<{ content: string; role: string; speaker: Side }>
  variedLevel: number
  variedSide: Side
}

type JudgeResult = {
  cachePhase?: 'replay' | 'warmup'
  cacheUsage?: {
    cachedPromptTokens: number | null
    promptCacheHitTokens: number | null
    promptCacheMissTokens: number | null
    promptTokens: number | null
  } | null
  durationMs: number
  error: string | null
  historyJobId: string
  judgeModel: string
  pairId: string | null
  parsedPolicy: {
    parseError: string | null
    policyWinner: Side | 'unknown'
  }
  reasoningVerification: {
    verifiedOff?: true
    verifiedOn?: true
  } | null
  status: 'error' | 'ok'
  variedLevel: number
  variedSide: Side
}

type Cell = {
  aWins: number
  bWins: number
  judgeModel: string
  pairId: string
  total: number
  variedLevel: number
  variedSide: Side
  variedWins: number
}

type ModelMetric = {
  fixedHistoryInstability: number | null
  judgeModel: string
  level3To4: number | null
  promptStrengthTrend: number | null
  promptStrengthTrendIgnoringLevel1: number | null
  totalScore: number | null
}

const outputDir = process.argv[2]
if (!outputDir) {
  throw new Error(
    'Usage: bun scripts/render-honnoji-judge-sensitivity.ts <run-dir> [output-file]',
  )
}

const outputPath =
  process.argv[3] ?? join(outputDir, 'honnoji-judge-sensitivity.html')
const config = await Bun.file(join(outputDir, 'config.json')).json()
const historiesArtifact = await Bun.file(
  join(outputDir, 'histories.json'),
).json()
const judgeArtifact = await Bun.file(
  join(outputDir, 'judge-results.json'),
).json()
const promptArtifact = await Bun.file(
  join(outputDir, 'prompt-levels.json'),
).json()

const histories = (historiesArtifact.histories as History[]).filter(
  (history) => history.scenarioId === 'honnoji-decision',
)
const results = (judgeArtifact.results as JudgeResult[]).filter((result) =>
  result.historyJobId.startsWith('honnoji-decision__'),
)
const judgeModels = config.judgeModels as string[]
const definitions = new Map<string, Record<string, unknown>>(
  (config.judgeModelDefinitions as Array<Record<string, unknown>>).map(
    (definition) => [String(definition.id), definition],
  ),
)
const promptScenario = promptArtifact.scenarios['honnoji-decision'] as {
  roles: Record<
    string,
    {
      levels: Record<
        string,
        {
          body: string
          label: string
          metadata?: { displayName?: string; version?: number }
        }
      >
      roleName: string
    }
  >
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function average(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length
}

function quantile(values: number[], probability: number) {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.max(0, Math.ceil(sorted.length * probability) - 1)]!
}

function percent(value: number | null, digits = 1) {
  return value == null ? 'n/a' : `${(value * 100).toFixed(digits)}%`
}

function signedPercent(value: number | null) {
  if (value == null) return 'n/a'
  const points = value * 100
  return `${points > 0 ? '+' : ''}${points.toFixed(1)}%`
}

function signedPoints(value: number | null) {
  if (value == null) return 'n/a'
  const points = value * 100
  return `${points > 0 ? '+' : ''}${points.toFixed(1)} pts`
}

function seconds(value: number | null) {
  return value == null ? 'n/a' : `${(value / 1000).toFixed(1)}s`
}

function promptCacheHitTokens(result: JudgeResult) {
  return (
    result.cacheUsage?.promptCacheHitTokens ??
    result.cacheUsage?.cachedPromptTokens ??
    null
  )
}

function isCacheAssisted(result: JudgeResult) {
  return (promptCacheHitTokens(result) ?? 0) > 0
}

function isConfirmedUncached(result: JudgeResult) {
  return (
    promptCacheHitTokens(result) === 0 &&
    (result.cacheUsage?.promptCacheMissTokens ?? 0) > 0
  )
}

function modelLabel(model: string) {
  return String(definitions.get(model)?.label ?? model)
}

function modelLab(model: string) {
  const provider = String(definitions.get(model)?.underlyingProvider ?? '')
  if (provider === 'deepseek') return 'DeepSeek'
  if (provider === 'moonshot') return 'Kimi'
  if (provider === 'qwen') return 'Qwen'
  if (provider === 'zai') return 'GLM'
  if (provider === 'minimax') return 'MiniMax'
  return provider || 'Other'
}

function pairwiseTrend(rates: Map<number, number>, levels: number[]) {
  const differences: number[] = []
  for (let lower = 0; lower < levels.length; lower += 1) {
    for (let higher = lower + 1; higher < levels.length; higher += 1) {
      const lowerRate = rates.get(levels[lower]!)
      const higherRate = rates.get(levels[higher]!)
      if (lowerRate == null || higherRate == null) return null
      differences.push(higherRate - lowerRate)
    }
  }
  return average(differences)
}

function heatStyle(rate: number | null) {
  if (rate == null) return 'background:#f4f4f1;color:#667085'
  const low = [253, 242, 232]
  const middle = [250, 204, 107]
  const high = [88, 166, 92]
  const start = rate <= 0.5 ? low : middle
  const end = rate <= 0.5 ? middle : high
  const mix = rate <= 0.5 ? rate * 2 : (rate - 0.5) * 2
  const rgb = start.map((channel, index) =>
    Math.round(channel + (end[index]! - channel) * mix),
  )
  return `background:rgb(${rgb.join(' ')});color:${rate >= 0.75 ? '#fff' : '#1f2933'}`
}

function metricBar(value: number | null) {
  return value == null ? 0 : Math.min(100, Math.abs(value) * 100)
}

const pairMap = new Map<
  string,
  {
    id: string
    roleAKey: string
    roleAName: string
    roleBKey: string
    roleBName: string
  }
>()
for (const history of histories) {
  if (!history.pairId || pairMap.has(history.pairId)) continue
  pairMap.set(history.pairId, {
    id: history.pairId,
    roleAKey: history.roleAKey,
    roleAName: history.roleAName,
    roleBKey: history.roleBKey,
    roleBName: history.roleBName,
  })
}
const pairs = [...pairMap.values()]

const validResults = results.filter(
  (result) =>
    result.status === 'ok' &&
    !result.parsedPolicy.parseError &&
    (result.parsedPolicy.policyWinner === 'a' ||
      result.parsedPolicy.policyWinner === 'b') &&
    result.pairId,
)
const cells = new Map<string, Cell>()
for (const result of validResults) {
  const pairId = result.pairId!
  const key = [
    result.judgeModel,
    pairId,
    result.variedSide,
    result.variedLevel,
  ].join('|')
  const cell = cells.get(key) ?? {
    aWins: 0,
    bWins: 0,
    judgeModel: result.judgeModel,
    pairId,
    total: 0,
    variedLevel: result.variedLevel,
    variedSide: result.variedSide,
    variedWins: 0,
  }
  cell.total += 1
  if (result.parsedPolicy.policyWinner === 'a') {
    cell.aWins += 1
  } else if (result.parsedPolicy.policyWinner === 'b') {
    cell.bWins += 1
  }
  if (result.parsedPolicy.policyWinner === result.variedSide) {
    cell.variedWins += 1
  }
  cells.set(key, cell)
}

function getCell(
  model: string,
  pairId: string,
  variedSide: Side,
  level: number,
) {
  return cells.get([model, pairId, variedSide, level].join('|'))
}

const instabilityByModel = new Map<string, number[]>()
const resultGroups = new Map<string, JudgeResult[]>()
for (const result of validResults) {
  const key = [result.judgeModel, result.historyJobId].join('|')
  resultGroups.set(key, [...(resultGroups.get(key) ?? []), result])
}
for (const rows of resultGroups.values()) {
  const aRate =
    rows.filter((row) => row.parsedPolicy.policyWinner === 'a').length /
    rows.length
  const model = rows[0]!.judgeModel
  instabilityByModel.set(model, [
    ...(instabilityByModel.get(model) ?? []),
    aRate * (1 - aRate),
  ])
}

const modelMetrics = new Map<string, ModelMetric>()
for (const model of judgeModels) {
  const trends: number[] = []
  const trendsIgnoringLevel1: number[] = []
  const level3To4: number[] = []
  for (const pair of pairs) {
    for (const side of ['a', 'b'] as const) {
      const rates = new Map<number, number>()
      for (const level of [1, 2, 3, 4]) {
        const cell = getCell(model, pair.id, side, level)
        if (cell?.total) rates.set(level, cell.variedWins / cell.total)
      }
      const trend = pairwiseTrend(rates, [1, 2, 3, 4])
      if (trend != null) trends.push(trend)
      const ignoringLevel1 = pairwiseTrend(rates, [2, 3, 4])
      if (ignoringLevel1 != null) trendsIgnoringLevel1.push(ignoringLevel1)
      const level3 = rates.get(3)
      const level4 = rates.get(4)
      if (level3 != null && level4 != null) level3To4.push(level4 - level3)
    }
  }
  const promptStrengthTrend = average(trends)
  const directionalLevel3To4 = average(level3To4)
  const fixedHistoryInstability = average(instabilityByModel.get(model) ?? [])
  modelMetrics.set(model, {
    fixedHistoryInstability,
    judgeModel: model,
    level3To4: directionalLevel3To4,
    promptStrengthTrend,
    promptStrengthTrendIgnoringLevel1: average(trendsIgnoringLevel1),
    totalScore:
      promptStrengthTrend == null ||
      directionalLevel3To4 == null ||
      fixedHistoryInstability == null
        ? null
        : promptStrengthTrend + directionalLevel3To4 - fixedHistoryInstability,
  })
}

const successfulResults = results.filter((result) => result.status === 'ok')
const outageThresholdMs = 15 * 60 * 1000
const parseFailures = successfulResults.filter(
  (result) => result.parsedPolicy.parseError,
).length
const erroredResults = results.filter((result) => result.status === 'error')
const plannedJobs =
  histories.filter((history) => history.status === 'ok').length *
  judgeModels.length *
  Number(config.judgeRepeats)
const expectedOn =
  judgeModels.filter((model) => definitions.get(model)?.verifyReasoningEnabled)
    .length *
  histories.length *
  Number(config.judgeRepeats)
const expectedOff =
  judgeModels.filter((model) => definitions.get(model)?.verifyReasoningDisabled)
    .length *
  histories.length *
  Number(config.judgeRepeats)
const verifiedOn = results.filter(
  (result) => result.reasoningVerification?.verifiedOn,
).length
const verifiedOff = results.filter(
  (result) => result.reasoningVerification?.verifiedOff,
).length

const latencyRows = judgeModels.map((model) => {
  const modelResults = successfulResults.filter(
    (result) => result.judgeModel === model,
  )
  const cacheHitsObserved = modelResults.some(isCacheAssisted)
  const confirmedUncachedResults = modelResults.filter(isConfirmedUncached)
  const warmupFallbackResults = modelResults.filter(
    (result) => result.cachePhase === 'warmup' && !isCacheAssisted(result),
  )
  const latencyResults = cacheHitsObserved
    ? confirmedUncachedResults.length > 0
      ? confirmedUncachedResults
      : warmupFallbackResults
    : modelResults
  const durations = latencyResults.map((result) => result.durationMs)
  const durationsExcludingOutage = durations.filter(
    (duration) => duration <= outageThresholdMs,
  )
  return {
    adjustedAverage: average(durationsExcludingOutage),
    average: average(durations),
    cacheHitsObserved,
    lab: modelLab(model),
    max: durations.length ? Math.max(...durations) : null,
    median: quantile(durations, 0.5),
    model,
    n: durations.length,
    nonUncachedIgnored: modelResults.length - latencyResults.length,
    outageExcluded: durations.length - durationsExcludingOutage.length,
    p90: quantile(durations, 0.9),
  }
})
const maxAverageLatency = Math.max(
  1,
  ...latencyRows.map((row) => row.average ?? 0),
)

const modelCardsHtml = judgeModels
  .map((model) => {
    const metric = modelMetrics.get(model)!
    const values: Array<[string, string, number | null]> = [
      ['Total score', signedPoints(metric.totalScore), metric.totalScore],
      [
        'Prompt-strength trend',
        signedPercent(metric.promptStrengthTrend),
        metric.promptStrengthTrend,
      ],
      [
        'Prompt-strength trend（ignoring level 1)',
        signedPercent(metric.promptStrengthTrendIgnoringLevel1),
        metric.promptStrengthTrendIgnoringLevel1,
      ],
      ['Level 3 to 4', signedPercent(metric.level3To4), metric.level3To4],
      [
        'Fixed-history instability',
        percent(metric.fixedHistoryInstability),
        metric.fixedHistoryInstability,
      ],
    ]
    return `<article class="model" data-model="${escapeHtml(model)}" data-score="${metric.totalScore ?? ''}">
      <h3>${escapeHtml(modelLabel(model))}</h3>
      ${values
        .map(
          ([label, formatted, value]) => `<div class="metric">
        <span>${escapeHtml(label)}</span><strong>${escapeHtml(formatted)}</strong>
        <span class="metric-track"><span class="metric-fill${(value ?? 0) < 0 ? ' negative' : ''}" style="width:${metricBar(value).toFixed(1)}%"></span></span>
      </div>`,
        )
        .join('\n')}
    </article>`
  })
  .join('\n')

const latencyHtml = latencyRows
  .map(
    (row) => `<tr>
      <td>${escapeHtml(row.lab)}</td>
      <td>${escapeHtml(modelLabel(row.model))}</td>
      <td>${row.cacheHitsObserved ? 'Uncached only' : 'All calls; no cache hits observed'}</td>
      <td class="numeric"><strong>${seconds(row.average)}</strong></td>
      <td class="numeric">${seconds(row.adjustedAverage)}</td>
      <td class="numeric">${seconds(row.median)}</td>
      <td class="numeric">${seconds(row.p90)}</td>
      <td class="numeric">${seconds(row.max)}</td>
      <td class="numeric">${row.n}</td>
      <td class="numeric">${row.outageExcluded}</td>
      <td class="numeric">${row.nonUncachedIgnored}</td>
      <td class="bar-cell"><span class="latency-bar"><span style="width:${(((row.average ?? 0) / maxAverageLatency) * 100).toFixed(1)}%"></span></span></td>
    </tr>`,
  )
  .join('\n')

function heatCell(model: string, pairId: string, side: Side, level: number) {
  const cell = getCell(model, pairId, side, level)
  const rate = cell?.total ? cell.variedWins / cell.total : null
  return `<td class="heat-cell" style="${heatStyle(rate)}"><strong>${percent(rate, 0)}</strong><span>N=${cell?.total ?? 0}</span></td>`
}

const matrixHtml = pairs
  .map((pair, pairIndex) => {
    const sideTables = (['a', 'b'] as const)
      .map((side) => {
        const variedName = side === 'a' ? pair.roleAName : pair.roleBName
        const baselineName = side === 'a' ? pair.roleBName : pair.roleAName
        const rows = judgeModels
          .map(
            (
              model,
            ) => `<tr data-score="${modelMetrics.get(model)?.totalScore ?? ''}" data-order="${judgeModels.indexOf(model)}">
              <th>${escapeHtml(modelLabel(model))}</th>
              ${[1, 2, 3, 4]
                .map((level) => heatCell(model, pair.id, side, level))
                .join('')}
            </tr>`,
          )
          .join('\n')
        return `<section class="matrix-panel">
          <h3>${escapeHtml(variedName)} prompt varied vs. ${escapeHtml(baselineName)} baseline</h3>
          <div class="table-wrap compact-table"><table class="heatmap compact-heatmap">
            <thead><tr><th>Judge model</th><th>Level 1</th><th>Level 2</th><th>Level 3</th><th>Level 4</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </section>`
      })
      .join('\n')
    return `<div class="pair-matrix${pairIndex === 0 ? '' : ' hidden'}" data-pair="${escapeHtml(pair.id)}">
      <div class="matrix-grid">${sideTables}</div>
      <p class="section-note">Numbers are the win rate of the side whose prompt is varied. For example, 90% in the first table means the policy preferred by ${escapeHtml(pair.roleAName)} was selected in 90% of repeated judgments.</p>
    </div>`
  })
  .join('\n')

const spectrumHtml = [...cells.values()]
  .sort(
    (left, right) =>
      pairs.findIndex((pair) => pair.id === left.pairId) -
        pairs.findIndex((pair) => pair.id === right.pairId) ||
      left.variedSide.localeCompare(right.variedSide) ||
      left.variedLevel - right.variedLevel ||
      judgeModels.indexOf(left.judgeModel) -
        judgeModels.indexOf(right.judgeModel),
  )
  .map((cell) => {
    const pair = pairMap.get(cell.pairId)!
    const variedName = cell.variedSide === 'a' ? pair.roleAName : pair.roleBName
    const bRate = cell.total ? cell.bWins / cell.total : 0
    return `<article class="spectrum-row" data-model="${escapeHtml(cell.judgeModel)}" data-pair="${escapeHtml(cell.pairId)}" data-side="${cell.variedSide}" data-level="${cell.variedLevel}">
      <div class="row-head"><strong>${escapeHtml(modelLabel(cell.judgeModel))}</strong><span>${escapeHtml(variedName)} varied · Level ${cell.variedLevel} · N=${cell.total}</span></div>
      <div class="spectrum"><span class="side left">袭击本能寺</span><span class="midline"></span><span class="side right">西进毛利</span><span class="marker" style="left:${(bRate * 100).toFixed(1)}%"></span></div>
    </article>`
  })
  .join('\n')

const detailHtml = [...cells.values()]
  .sort(
    (left, right) =>
      judgeModels.indexOf(left.judgeModel) -
        judgeModels.indexOf(right.judgeModel) ||
      pairs.findIndex((pair) => pair.id === left.pairId) -
        pairs.findIndex((pair) => pair.id === right.pairId) ||
      left.variedSide.localeCompare(right.variedSide) ||
      left.variedLevel - right.variedLevel,
  )
  .map((cell) => {
    const pair = pairMap.get(cell.pairId)!
    const variedName = cell.variedSide === 'a' ? pair.roleAName : pair.roleBName
    const baselineName =
      cell.variedSide === 'a' ? pair.roleBName : pair.roleAName
    return `<tr><td>${escapeHtml(modelLabel(cell.judgeModel))}</td><td>${escapeHtml(pair.roleAName)} vs. ${escapeHtml(pair.roleBName)}</td><td>${escapeHtml(variedName)}</td><td>${escapeHtml(baselineName)}</td><td>${cell.variedLevel}</td><td>${percent(cell.variedWins / cell.total)}</td><td>${percent(cell.aWins / cell.total)}</td><td>${percent(cell.bWins / cell.total)}</td><td>${cell.total}</td></tr>`
  })
  .join('\n')

const samplePair = pairs[0]
const sampleHistories = samplePair
  ? histories
      .filter(
        (history) =>
          history.pairId === samplePair.id && history.variedSide === 'a',
      )
      .sort((left, right) => left.variedLevel - right.variedLevel)
      .slice(0, 4)
  : []
const historiesHtml = sampleHistories
  .map(
    (history) => `<details class="history-card">
      <summary><span>${escapeHtml(history.roleAName)} prompt varied · Level ${history.variedLevel}</span><code>${escapeHtml(history.jobId)}</code></summary>
      <div class="history-meta"><span>${escapeHtml(history.roleAName)} Level ${history.levelA}</span><span>${escapeHtml(history.roleBName)} Level ${history.levelB}</span><span>${history.transcript.length} turns</span></div>
      <div class="turn-list">${history.transcript
        .map(
          (turn, index) =>
            `<div class="turn side-${turn.speaker}"><div class="turn-head">Turn ${index + 1} · ${escapeHtml(turn.role)}</div><div class="turn-body">${escapeHtml(turn.content)}</div></div>`,
        )
        .join('')}</div>
    </details>`,
  )
  .join('\n')

const selectedPromptsHtml = Object.values(promptScenario.roles)
  .map((role) => {
    const level4 = role.levels['4']
    const author = level4.metadata?.displayName ?? 'unknown'
    const version = level4.metadata?.version
    return `<tr><td>${escapeHtml(role.roleName)}</td><td>${escapeHtml(level4.label)}</td><td>${escapeHtml(author)}${version == null ? '' : ` v${version}`}</td></tr>`
  })
  .join('\n')

const modelOptions = judgeModels
  .map(
    (model) =>
      `<option value="${escapeHtml(model)}">${escapeHtml(modelLabel(model))}</option>`,
  )
  .join('')
const pairOptions = pairs
  .map(
    (pair) =>
      `<option value="${escapeHtml(pair.id)}">${escapeHtml(pair.roleAName)} vs. ${escapeHtml(pair.roleBName)}</option>`,
  )
  .join('')

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Honnoji Judge Sensitivity</title>
  <style>
    :root { color-scheme: light; --ink:#1f2933; --muted:#667085; --line:#d8dee4; --paper:#fff; --band:#f6f7f3; --accent:#2f7d62; --accent-2:#b85632; --gold:#d9a441; --green:#58a65c; --red:#b94a48; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:#fbfbf8; letter-spacing:0; }
    header { padding:28px 32px 20px; border-bottom:1px solid var(--line); background:var(--paper); }
    main { padding:24px 32px 40px; }
    h1 { margin:0 0 10px; font-size:28px; line-height:1.15; font-weight:720; }
    h2 { margin:0 0 14px; font-size:18px; line-height:1.25; }
    h3 { margin:0 0 10px; font-size:15px; line-height:1.3; }
    code { padding:2px 5px; border-radius:4px; background:#eef0ea; color:#344054; overflow-wrap:anywhere; }
    .sub { display:flex; flex-wrap:wrap; gap:10px 18px; color:var(--muted); font-size:13px; }
    .stats { display:grid; grid-template-columns:repeat(6,minmax(150px,1fr)); gap:12px; margin:0 0 24px; }
    .stat { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:14px; min-height:84px; }
    .stat span { display:block; color:var(--muted); font-size:12px; margin-bottom:6px; }
    .stat strong { display:block; font-size:26px; line-height:1; }
    .section { margin-top:22px; padding:18px; border:1px solid var(--line); border-radius:8px; background:var(--paper); }
    .toolbar { display:flex; gap:12px; flex-wrap:wrap; align-items:end; margin-bottom:14px; }
    label { display:grid; gap:5px; font-size:12px; color:var(--muted); }
    select { min-width:200px; max-width:100%; border:1px solid var(--line); border-radius:6px; padding:8px 30px 8px 10px; background:#fff; color:var(--ink); font:inherit; }
    .level-grid { display:grid; grid-template-columns:repeat(4,minmax(160px,1fr)); gap:12px; }
    .level-card,.model { border:1px solid var(--line); border-radius:8px; padding:12px; background:#fff; }
    .level-card strong { display:block; font-size:14px; margin-bottom:5px; }
    .level-card span,.section-note { color:var(--muted); font-size:12px; line-height:1.5; }
    .section-note { margin:10px 0 0; }
    .model-grid { display:grid; grid-template-columns:repeat(4,minmax(210px,1fr)); gap:12px; }
    .model h3 { min-height:39px; margin-bottom:12px; }
    .metric { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; margin:10px 0; font-size:13px; }
    .metric span:first-child { color:var(--muted); }
    .metric-track { grid-column:1/-1; display:block; width:100%; height:7px; border-radius:999px; background:#ecefe8; overflow:hidden; }
    .metric-fill { display:block; height:100%; background:linear-gradient(90deg,var(--accent),var(--gold)); }
    .metric-fill.negative { background:linear-gradient(90deg,var(--gold),var(--red)); }
    .formula-note { display:grid; gap:8px; }
    .table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:8px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th,td { border-bottom:1px solid var(--line); padding:9px 10px; text-align:left; vertical-align:middle; }
    th { color:#475467; background:var(--band); font-weight:650; }
    .table-wrap th,.table-wrap td { white-space:nowrap; }
    .numeric { text-align:right; font-variant-numeric:tabular-nums; }
    .bar-cell { min-width:130px; width:22%; }
    .latency-bar { display:block; width:100%; height:8px; border-radius:999px; background:#ecefe8; overflow:hidden; }
    .latency-bar span { display:block; height:100%; background:linear-gradient(90deg,var(--gold),var(--red)); }
    .matrix-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
    .matrix-panel { min-width:0; }
    .heatmap th,.heatmap td { border:1px solid #e1e5dc; }
    .compact-heatmap th:first-child { width:34%; min-width:180px; }
    .heat-cell { min-width:72px; text-align:center; }
    .heat-cell strong { display:block; font-size:15px; }
    .heat-cell span { display:block; margin-top:4px; font-size:10px; opacity:.8; }
    .spectrum-list { display:grid; gap:10px; }
    .spectrum-row { display:grid; grid-template-columns:minmax(220px,280px) 1fr; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid #edf0e9; }
    .row-head { display:grid; gap:3px; }
    .row-head span { color:var(--muted); font-size:12px; }
    .spectrum { position:relative; height:30px; border-radius:999px; background:linear-gradient(90deg,#b94a48 0%,#e5dfc8 50%,#4f9a64 100%); border:1px solid rgba(31,41,51,.18); overflow:hidden; }
    .spectrum .side { position:absolute; top:7px; font-size:11px; color:rgba(255,255,255,.94); text-shadow:0 1px 1px rgba(0,0,0,.3); z-index:2; }
    .spectrum .left { left:12px; } .spectrum .right { right:12px; }
    .midline { position:absolute; inset:0 auto 0 50%; width:2px; background:rgba(31,41,51,.55); z-index:2; }
    .marker { position:absolute; top:3px; bottom:3px; width:4px; margin-left:-2px; border-radius:999px; background:#111827; box-shadow:0 0 0 2px rgba(255,255,255,.9); z-index:3; }
    .foldable-section summary { cursor:pointer; font-size:18px; line-height:1.25; font-weight:720; }
    .foldable-section[open] summary { margin-bottom:14px; }
    .history-list { display:grid; gap:12px; }
    .history-card { border:1px solid var(--line); border-radius:8px; background:#fff; overflow:hidden; }
    .history-card summary { cursor:pointer; display:flex; justify-content:space-between; gap:12px; align-items:center; padding:12px 14px; font-size:13px; font-weight:650; }
    .history-meta { display:flex; flex-wrap:wrap; gap:8px 14px; padding:10px 14px; color:var(--muted); font-size:12px; border-top:1px solid #edf0e9; border-bottom:1px solid #edf0e9; }
    .turn-list { display:grid; gap:10px; padding:12px 14px 14px; }
    .turn { border-left:3px solid var(--line); padding-left:10px; }
    .turn.side-a { border-left-color:var(--accent-2); } .turn.side-b { border-left-color:var(--accent); }
    .turn-head { color:var(--muted); font-size:12px; font-weight:650; margin-bottom:4px; }
    .turn-body { white-space:pre-wrap; font-size:13px; line-height:1.55; }
    .hidden { display:none !important; }
    @media (max-width:1100px) { .stats,.model-grid,.level-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .matrix-grid { grid-template-columns:1fr; } }
    @media (max-width:720px) { header,main { padding-left:16px; padding-right:16px; } .stats,.model-grid,.level-grid { grid-template-columns:1fr; } .spectrum-row { grid-template-columns:1fr; } .history-card summary { align-items:start; flex-direction:column; } h1 { font-size:23px; } }
  </style>
</head>
<body>
  <header>
    <h1>Honnoji Judge Sensitivity</h1>
    <div class="sub"><span>Run <code>${escapeHtml(config.runId)}</code></span><span>Player model <code>${escapeHtml(config.playerModel)}</code></span><span>Judge concurrency <code>${escapeHtml(config.judgeConcurrency)}</code></span><span>Generated ${escapeHtml(new Date().toISOString())}</span></div>
  </header>
  <main>
    <section class="stats" aria-label="Run status">
      <div class="stat"><span>Honnoji judge calls</span><strong>${results.length}/${plannedJobs}</strong></div>
      <div class="stat"><span>Errored calls</span><strong>${erroredResults.length}</strong></div>
      <div class="stat"><span>Parse failures</span><strong>${parseFailures}</strong></div>
      <div class="stat"><span>Repeats per cell</span><strong>${escapeHtml(config.judgeRepeats)}</strong></div>
      <div class="stat"><span>Thinking-off verified</span><strong>${verifiedOff}/${expectedOff}</strong></div>
      <div class="stat"><span>Thinking-on verified</span><strong>${verifiedOn}/${expectedOn}</strong></div>
    </section>

    <section class="section">
      <h2>Prompt Levels</h2>
      <div class="level-grid">
        <div class="level-card"><strong>Level 1</strong><span>Random meaningless 乱码, eg. %$&amp;(**^%(*&amp;</span></div>
        <div class="level-card"><strong>Level 2</strong><span>Weak but grammatical Chinese. Prompt used: <code>${escapeHtml(promptScenario.roles[Object.keys(promptScenario.roles)[0]!]!.levels['2'].body)}</code></span></div>
        <div class="level-card"><strong>Level 3</strong><span>Near-empty baseline prompt. The user prompt is just <code>-</code>.</span></div>
        <div class="level-card"><strong>Level 4</strong><span>Strong representative production user prompt.</span></div>
      </div>
      <p class="section-note">Each debating history varies one role's user prompt level while the opposing role stays at the Level 3 baseline. Honnoji has four role pairs, producing eight varied-side series per judge configuration.</p>
      <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Role</th><th>Level 4 prompt</th><th>Author / version</th></tr></thead><tbody>${selectedPromptsHtml}</tbody></table></div>
    </section>

    <section class="section">
      <h2>Model Sensitivity</h2>
      <div class="toolbar"><label>Sort judge models<select id="modelSensitivitySort"><option value="catalog">Lab / newest first</option><option value="total-desc">Total score (high to low)</option></select></label></div>
      <div class="model-grid" id="modelGrid">${modelCardsHtml}</div>
      <div class="section-note formula-note">
        <div><strong>Prompt-strength trend</strong>: positive means the varied side tends to win more as its prompt moves from Level 1 to Level 4; negative means it tends to win less; near 0 means no consistent direction.</div>
        <div><strong>Prompt-strength trend formula</strong>: let <code>w_s(l)</code> be varied-side win rate for role-pair/varied-side series <code>s</code> at Level <code>l</code>. For each series, <code>T_s = [(w_s(2)-w_s(1)) + (w_s(3)-w_s(1)) + (w_s(4)-w_s(1)) + (w_s(3)-w_s(2)) + (w_s(4)-w_s(2)) + (w_s(4)-w_s(3))] / 6</code>. The model metric <code>T</code> averages <code>T_s</code> over all eight series.</div>
        <div><strong>Prompt-strength trend（ignoring level 1)</strong> applies the same pairwise-gap calculation to Levels 2, 3, and 4, then averages the eight series.</div>
        <div><strong>Level 3 to 4</strong>: for each series, <code>D_s = w_s(4) - w_s(3)</code>. The model metric <code>D</code> averages <code>D_s</code> over all eight series.</div>
        <div><strong>Fixed-history instability</strong> averages <code>p(1-p)</code> across saved histories, where <code>p</code> is one policy's win rate over ten repeated judgments of the same history. 0% means every repeat selected the same policy.</div>
        <div><strong>Total score</strong> is <code>S = T + D - I</code>, where <code>I</code> is Fixed-history instability. It uses unrounded values and is displayed in percentage points.</div>
      </div>
    </section>

    <section class="section"><h2>Judge Latency</h2><div class="table-wrap"><table><thead><tr><th>Lab</th><th>Judge model</th><th>Latency basis</th><th>Average</th><th>Avg excl. outage</th><th>Median</th><th>P90</th><th>Max</th><th>N</th><th>Outage-excluded</th><th>Non-uncached omitted</th><th>Average bar</th></tr></thead><tbody>${latencyHtml}</tbody></table></div><p class="section-note">For any model with observed prompt-cache hits, every latency statistic uses only calls reporting zero cache-hit tokens and positive cache-miss tokens. Cache-assisted and legacy calls with unknown cache status are omitted. Models with no observed cache hits use all successful calls. Durations include retries; Avg excl. outage additionally omits calls longer than 15 minutes from the documented connectivity interruption.</p></section>

    <section class="section">
      <h2>Varied-Side Win Rate</h2>
      <div class="toolbar"><label>Role pair<select id="matrixPair">${pairOptions}</select></label><label>Sort judge models<select id="winRateSort"><option value="catalog">Lab / newest first</option><option value="total-desc">Total score (high to low)</option></select></label></div>
      ${matrixHtml}
    </section>

    <section class="section">
      <h2>Policy Lean Spectrum</h2>
      <div class="toolbar">
        <label>Judge model<select id="modelFilter"><option value="all">All models</option>${modelOptions}</select></label>
        <label>Role pair<select id="pairFilter">${pairOptions}</select></label>
        <label>Varied side<select id="sideFilter"><option value="all">Both sides</option><option value="a">Assassination camp role</option><option value="b">Avoid-assassination camp role</option></select></label>
        <label>Level<select id="levelFilter"><option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option></select></label>
      </div>
      <div class="spectrum-list" id="spectrumRows">${spectrumHtml}</div>
      <p class="section-note">Each marker shows the policy outcome over ten repeated judgments of the same saved debate history: left is 袭击本能寺（刺杀信长）, right is 西进毛利（避免刺杀信长）.</p>
    </section>

    <details class="section foldable-section"><summary>Detail Table</summary><div class="table-wrap"><table><thead><tr><th>Judge model</th><th>Role pair</th><th>Prompt varied</th><th>Baseline</th><th>Level</th><th>Varied-side win rate</th><th>袭击本能寺</th><th>西进毛利</th><th>N</th></tr></thead><tbody>${detailHtml}</tbody></table></div></details>

    <section class="section"><h2>Sample Debating Histories</h2><p class="section-note">Each history below is fed to every listed judge configuration 10 times.</p><div class="history-list" style="margin-top:14px">${historiesHtml}</div></section>
  </main>
  <script>
    const modelGrid = document.getElementById('modelGrid')
    const modelCards = [...modelGrid.children]
    modelCards.forEach((card, index) => { card.dataset.order = String(index) })
    document.getElementById('modelSensitivitySort').addEventListener('change', (event) => {
      const sort = event.target.value
      modelCards.sort((left, right) => sort === 'catalog'
        ? Number(left.dataset.order) - Number(right.dataset.order)
        : Number(right.dataset.score || '-Infinity') - Number(left.dataset.score || '-Infinity') || Number(left.dataset.order) - Number(right.dataset.order))
      modelGrid.append(...modelCards)
    })
    const matrixPair = document.getElementById('matrixPair')
    function showMatrixPair() {
      document.querySelectorAll('.pair-matrix').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.pair !== matrixPair.value))
    }
    matrixPair.addEventListener('change', showMatrixPair)
    const winRateSort = document.getElementById('winRateSort')
    function sortWinRateRows() {
      document.querySelectorAll('.heatmap tbody').forEach((body) => {
        const rows = [...body.rows]
        rows.sort((left, right) => winRateSort.value === 'catalog'
          ? Number(left.dataset.order) - Number(right.dataset.order)
          : Number(right.dataset.score || '-Infinity') - Number(left.dataset.score || '-Infinity') || Number(left.dataset.order) - Number(right.dataset.order))
        body.append(...rows)
      })
    }
    winRateSort.addEventListener('change', sortWinRateRows)
    const modelFilter = document.getElementById('modelFilter')
    const pairFilter = document.getElementById('pairFilter')
    const sideFilter = document.getElementById('sideFilter')
    const levelFilter = document.getElementById('levelFilter')
    const spectrumRows = [...document.querySelectorAll('.spectrum-row')]
    function applySpectrumFilters() {
      spectrumRows.forEach((row) => {
        const visible = (modelFilter.value === 'all' || row.dataset.model === modelFilter.value)
          && row.dataset.pair === pairFilter.value
          && (sideFilter.value === 'all' || row.dataset.side === sideFilter.value)
          && (levelFilter.value === 'all' || row.dataset.level === levelFilter.value)
        row.classList.toggle('hidden', !visible)
      })
    }
    ;[modelFilter, pairFilter, sideFilter, levelFilter].forEach((control) => control.addEventListener('change', applySpectrumFilters))
    showMatrixPair()
    applySpectrumFilters()
  </script>
</body>
</html>
`

await Bun.write(outputPath, html)
console.log(
  JSON.stringify(
    {
      cells: cells.size,
      histories: histories.length,
      models: judgeModels.length,
      outputPath,
      pairs: pairs.length,
      results: results.length,
    },
    null,
    2,
  ),
)
