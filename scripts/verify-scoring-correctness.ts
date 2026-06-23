import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DEFAULT_INPUT =
  'docs/bench/runs/scoring-pilot-combined-2026-06-23/results.json'
const DEFAULT_OUTPUT_DIR = 'docs/bench/runs/scoring-correctness-2026-06-23'
const EPSILON = 1e-9

type BattleSource = 'playground' | 'tournament'

type ReportCase = {
  battleId: number
  scenarioId: string
  source: BattleSource
}

type BenchmarkResult = {
  battleId: number
  jsonParseOk: boolean
  model: string
  scenarioId: string
  schemaOk: boolean
  scoreA: number | null
  scoreB: number | null
  source: BattleSource
}

type BenchmarkReport = {
  cases: ReportCase[]
  generatedAt: string
  models: Array<{ label: string }>
  results: BenchmarkResult[]
  summary: Array<Record<string, unknown>>
}

type LlmCallExport = {
  phase?: string
  requestJson?: unknown
  side?: string
}

type BattleExport = {
  llmCalls: LlmCallExport[]
}

type ScorerCase = {
  battleId: number
  scenarioId: string
  source: BattleSource
  systemPrompt: string
}

type RequestInfo = {
  id: string
  isTrue: boolean
  side: 'a' | 'b'
}

type ExpectedScore = {
  breakdown: string[]
  scoreA: number
  scoreB: number
}

type CorrectnessResult = BenchmarkResult & {
  expectedBreakdown: string[]
  expectedScoreA: number
  expectedScoreB: number
  scoreCorrect: boolean
  scoreDeltaA: number | null
  scoreDeltaB: number | null
}

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {
    input: DEFAULT_INPUT,
    jsonOnly: false,
    outputDir: DEFAULT_OUTPUT_DIR,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--input') {
      result.input = args[index + 1] ?? ''
      index += 1
      continue
    }
    if (arg === '--output-dir') {
      result.outputDir = args[index + 1] ?? ''
      index += 1
      continue
    }
    if (arg === '--json-only') {
      result.jsonOnly = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!result.input) {
    throw new Error('--input is required')
  }
  if (!result.outputDir) {
    throw new Error('--output-dir is required')
  }

  return result
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

async function apiFetch<T>(path: string): Promise<T> {
  const baseUrl = getRequiredEnv('AXIIA_API_URL')
  const token = getRequiredEnv('AXIIA_AUTH_TOKEN')
  const response = await fetch(new URL(path, normalizeBaseUrl(baseUrl)), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${await response.text()}`)
  }

  return (await response.json()) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractScorerSystemPrompt(exported: BattleExport) {
  const call = exported.llmCalls.find(
    (item) => item.phase === 'scoring' && item.side === 'scorer',
  )

  if (!call || !isRecord(call.requestJson)) {
    throw new Error('Missing scorer request')
  }

  const systemPrompt = call.requestJson.system
  if (typeof systemPrompt !== 'string') {
    throw new Error('Missing scorer system prompt')
  }

  return systemPrompt
}

async function fetchScorerCase(item: ReportCase): Promise<ScorerCase> {
  const exported = await apiFetch<BattleExport>(
    `/api/admin/analytics/battles/${item.source}/${item.battleId}/export`,
  )

  return {
    battleId: item.battleId,
    scenarioId: item.scenarioId,
    source: item.source,
    systemPrompt: extractScorerSystemPrompt(exported),
  }
}

function extractJsonObjectAfter(text: string, marker: string) {
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) {
    throw new Error(`Missing marker: ${marker}`)
  }

  const start = text.indexOf('{', markerIndex)
  if (start < 0) {
    throw new Error(`Missing JSON object after marker: ${marker}`)
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') {
      depth += 1
      continue
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return JSON.parse(text.slice(start, index + 1)) as Record<string, unknown>
      }
    }
  }

  throw new Error(`Unclosed JSON object after marker: ${marker}`)
}

function parseRequests(systemPrompt: string) {
  const requests = new Map<string, RequestInfo>()
  const sectionPattern =
    /([^\n]+) 的请求（含真假标记）：\n([\s\S]*?)(?=\n\n[^\n]+ 的请求（含真假标记）：|\n\n问询结果：|\n\n===|$)/g
  const sections = [...systemPrompt.matchAll(sectionPattern)]

  sections.forEach((section, index) => {
    const side = index === 0 ? 'a' : 'b'
    const body = section[2] ?? ''
    const itemPattern = /^- ([A-Za-z]+\d+)（(真|假)[^）]*）：/gm

    for (const item of body.matchAll(itemPattern)) {
      const id = item[1]
      if (!id) {
        continue
      }
      requests.set(id, {
        id,
        isTrue: item[2] === '真',
        side,
      })
    }
  })

  return requests
}

function parseExaminationSelections(systemPrompt: string) {
  const start = systemPrompt.indexOf('问询结果：')
  if (start < 0) {
    return { selectedByA: null, selectedByB: null }
  }

  const text = systemPrompt.slice(start)
  const sectionPattern = /【[^】]+】\n([\s\S]*?)(?=\n\n【|$)/g
  const sections = [...text.matchAll(sectionPattern)]
  const selected = sections.map((section) => {
    const match = section[1]?.match(/- 指认编号：([^\n]+)/)
    const value = match?.[1]?.trim() ?? null
    return value && value !== '未作答' ? value : null
  })

  return {
    selectedByA: selected[0] ?? null,
    selectedByB: selected[1] ?? null,
  }
}

function addRequestScore(
  request: RequestInfo,
  score: { a: number; b: number },
  breakdown: string[],
) {
  if (request.isTrue) {
    score[request.side] += 0.5
    breakdown.push(`${request.id} accepted true request: ${request.side} +0.5`)
    return
  }

  score[request.side] -= 0.25
  breakdown.push(`${request.id} accepted false request: ${request.side} -0.25`)
}

function parseExaminationPenalty(systemPrompt: string) {
  const tableMatch = systemPrompt.match(/真请求被对手识破\s*\|\s*[−-]([0-9.]+)/)
  if (tableMatch?.[1]) {
    return Number(tableMatch[1])
  }

  const stepMatch = systemPrompt.match(/则 [^\n]+ [−-]([0-9.]+) 分/)
  if (stepMatch?.[1]) {
    return Number(stepMatch[1])
  }

  throw new Error('Could not parse examination penalty from scorer prompt')
}

function computeHonnojiOrShangyangScore(
  testCase: ScorerCase,
  majorGoals: { a: string; b: string },
): ExpectedScore {
  const judgeOutput = extractJsonObjectAfter(testCase.systemPrompt, '裁判判决原文：')
  const requests = parseRequests(testCase.systemPrompt)
  const examination = parseExaminationSelections(testCase.systemPrompt)
  const examinationPenalty = parseExaminationPenalty(testCase.systemPrompt)
  const score = { a: 0, b: 0 }
  const breakdown: string[] = []
  const judgment = judgeOutput.judgment

  if (judgment === majorGoals.a) {
    score.a += 1
    breakdown.push(`judgment=${majorGoals.a}: a +1`)
  } else if (judgment === majorGoals.b) {
    score.b += 1
    breakdown.push(`judgment=${majorGoals.b}: b +1`)
  } else {
    throw new Error(`Unsupported judgment: ${String(judgment)}`)
  }

  const requestDecisions = isRecord(judgeOutput.requests)
    ? judgeOutput.requests
    : {}

  for (const [id, decision] of Object.entries(requestDecisions)) {
    if (decision !== '同意') {
      continue
    }

    const request = requests.get(id)
    if (!request) {
      breakdown.push(`${id} accepted but not in current request map`)
      continue
    }

    addRequestScore(request, score, breakdown)
  }

  const selectedByA = examination.selectedByA
    ? requests.get(examination.selectedByA)
    : null
  if (selectedByA?.side === 'b' && selectedByA.isTrue) {
    score.b -= examinationPenalty
    breakdown.push(`a identified b true request ${selectedByA.id}: b -${examinationPenalty}`)
  }

  const selectedByB = examination.selectedByB
    ? requests.get(examination.selectedByB)
    : null
  if (selectedByB?.side === 'a' && selectedByB.isTrue) {
    score.a -= examinationPenalty
    breakdown.push(`b identified a true request ${selectedByB.id}: a -${examinationPenalty}`)
  }

  return {
    breakdown,
    scoreA: score.a,
    scoreB: score.b,
  }
}

function computeTrolleyScore(testCase: ScorerCase): ExpectedScore {
  const judgeOutput = extractJsonObjectAfter(testCase.systemPrompt, '裁判判决原文：')
  const judgments = judgeOutput.judgments
  const values = Array.isArray(judgments)
    ? judgments
    : isRecord(judgments)
      ? Object.values(judgments)
      : []
  let scoreA = 0
  let scoreB = 0

  for (const value of values) {
    if (value === '一人侧') {
      scoreA += 1
    } else if (value === '五人侧') {
      scoreB += 1
    }
  }

  return {
    breakdown: [`trolley judgments: scoreA=${scoreA}, scoreB=${scoreB}`],
    scoreA,
    scoreB,
  }
}

function computeExpectedScore(testCase: ScorerCase) {
  if (testCase.scenarioId === 'honnoji-decision') {
    return computeHonnojiOrShangyangScore(
      testCase,
      { a: '袭击本能寺', b: '西进毛利' },
    )
  }

  if (testCase.scenarioId === 'shangyang-court') {
    return computeHonnojiOrShangyangScore(
      testCase,
      { a: '变法', b: '维持现状' },
    )
  }

  if (testCase.scenarioId === 'trolley-problem') {
    return computeTrolleyScore(testCase)
  }

  throw new Error(`Unsupported scenario: ${testCase.scenarioId}`)
}

function scoresEqual(left: number | null, right: number) {
  return left != null && Math.abs(left - right) <= EPSILON
}

function average(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length
}

function rate(count: number, total: number) {
  return total === 0 ? 0 : count / total
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function summarizeCorrectness(results: CorrectnessResult[]) {
  const models = [...new Set(results.map((item) => item.model))]

  return models.map((model) => {
    const rows = results.filter((item) => item.model === model)
    const correct = rows.filter((item) => item.scoreCorrect).length
    const deltas = rows
      .flatMap((item) => [item.scoreDeltaA, item.scoreDeltaB])
      .filter((value): value is number => typeof value === 'number')
      .map((value) => Math.abs(value))

    return {
      avgAbsDelta: average(deltas),
      correct,
      model,
      scoreCorrectRate: rate(correct, rows.length),
      total: rows.length,
    }
  })
}

function renderHtml(params: {
  cases: Array<ScorerCase & ExpectedScore>
  generatedAt: string
  input: string
  results: CorrectnessResult[]
  summary: ReturnType<typeof summarizeCorrectness>
}) {
  const failures = params.results.filter((item) => !item.scoreCorrect)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Axiia Scoring Correctness Benchmark</title>
  <style>
    :root { --bg: #f7f7f4; --ink: #17201b; --muted: #66736b; --line: #d9ded8; --panel: #fff; --good: #0f7a4c; --bad: #a33a2a; }
    body { background: var(--bg); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.45; margin: 0; }
    main { margin: 0 auto; max-width: 1180px; padding: 32px 20px 56px; }
    h1 { font-size: 34px; letter-spacing: 0; line-height: 1.15; margin: 0 0 6px; }
    h2 { border-top: 1px solid var(--line); font-size: 22px; letter-spacing: 0; line-height: 1.15; margin: 34px 0 14px; padding-top: 24px; }
    .meta { color: var(--muted); }
    table { background: var(--panel); border-collapse: collapse; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; width: 100%; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #edf2ee; font-size: 13px; }
    tr:last-child td { border-bottom: 0; }
    code, pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    pre { background: #1c211d; border-radius: 8px; color: #edf2ee; max-height: 220px; overflow: auto; padding: 12px; white-space: pre-wrap; }
    .good { color: var(--good); font-weight: 700; }
    .bad { color: var(--bad); font-weight: 700; }
  </style>
</head>
<body>
<main>
  <h1>Axiia Scoring Correctness Benchmark</h1>
  <p class="meta">Generated at ${escapeHtml(params.generatedAt)} from <code>${escapeHtml(params.input)}</code>.</p>

  <h2>Summary</h2>
  <table>
    <thead><tr><th>Model</th><th>Correct</th><th>Total</th><th>Score correctness</th><th>Avg absolute delta</th></tr></thead>
    <tbody>
      ${params.summary
        .map(
          (item) => `<tr>
        <td>${escapeHtml(item.model)}</td>
        <td>${item.correct}</td>
        <td>${item.total}</td>
        <td class="${item.scoreCorrectRate === 1 ? 'good' : 'bad'}">${formatRate(item.scoreCorrectRate)}</td>
        <td>${item.avgAbsDelta == null ? '-' : item.avgAbsDelta.toFixed(3)}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>

  <h2>Expected Scores</h2>
  <table>
    <thead><tr><th>Battle</th><th>Scenario</th><th>Expected scoreA</th><th>Expected scoreB</th><th>Breakdown</th></tr></thead>
    <tbody>
      ${params.cases
        .map(
          (item) => `<tr>
        <td>${escapeHtml(item.source)}:${item.battleId}</td>
        <td>${escapeHtml(item.scenarioId)}</td>
        <td>${item.scoreA}</td>
        <td>${item.scoreB}</td>
        <td><pre>${escapeHtml(item.breakdown.join('\n'))}</pre></td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>

  <h2>Incorrect Scores</h2>
  ${
    failures.length === 0
      ? '<p class="good">No score correctness failures.</p>'
      : `<table>
    <thead><tr><th>Model</th><th>Battle</th><th>Expected</th><th>Actual</th><th>Delta</th></tr></thead>
    <tbody>
      ${failures
        .map(
          (item) => `<tr>
        <td>${escapeHtml(item.model)}</td>
        <td>${escapeHtml(item.source)}:${item.battleId}</td>
        <td>${item.expectedScoreA}, ${item.expectedScoreB}</td>
        <td>${escapeHtml(item.scoreA)}, ${escapeHtml(item.scoreB)}</td>
        <td>${escapeHtml(item.scoreDeltaA)}, ${escapeHtml(item.scoreDeltaB)}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>`
  }
</main>
</body>
</html>`
}

async function main() {
  const options = parseArgs()
  const report = (await Bun.file(options.input).json()) as BenchmarkReport
  const caseMap = new Map<string, ScorerCase & ExpectedScore>()

  for (const item of report.cases) {
    const scorerCase = await fetchScorerCase(item)
    const expected = computeExpectedScore(scorerCase)
    caseMap.set(`${item.source}:${item.battleId}`, {
      ...scorerCase,
      ...expected,
    })
  }

  const results: CorrectnessResult[] = report.results.map((result) => {
    const expected = caseMap.get(`${result.source}:${result.battleId}`)
    if (!expected) {
      throw new Error(`Missing expected score for ${result.source}:${result.battleId}`)
    }

    const scoreCorrect =
      scoresEqual(result.scoreA, expected.scoreA) &&
      scoresEqual(result.scoreB, expected.scoreB)

    return Object.assign({}, result, {
      expectedBreakdown: expected.breakdown,
      expectedScoreA: expected.scoreA,
      expectedScoreB: expected.scoreB,
      scoreCorrect,
      scoreDeltaA: result.scoreA == null ? null : result.scoreA - expected.scoreA,
      scoreDeltaB: result.scoreB == null ? null : result.scoreB - expected.scoreB,
    })
  })

  const summary = summarizeCorrectness(results)
  const output = {
    cases: [...caseMap.values()].map((item) => ({
      battleId: item.battleId,
      breakdown: item.breakdown,
      expectedScoreA: item.scoreA,
      expectedScoreB: item.scoreB,
      scenarioId: item.scenarioId,
      source: item.source,
    })),
    generatedAt: new Date().toISOString(),
    input: options.input,
    results,
    summary,
  }

  await mkdir(options.outputDir, { recursive: true })
  await writeFile(
    join(options.outputDir, 'results.json'),
    `${JSON.stringify(output, null, 2)}\n`,
    'utf8',
  )
  if (!options.jsonOnly) {
    await writeFile(
      join(options.outputDir, 'index.html'),
      renderHtml({
        cases: [...caseMap.values()],
        generatedAt: output.generatedAt,
        input: options.input,
        results,
        summary,
      }),
      'utf8',
    )
  }

  console.log(
    JSON.stringify(
      {
        outputDir: options.outputDir,
        summary,
      },
      null,
      2,
    ),
  )
}

await main()
