import { join, resolve } from "node:path";

type Side = "a" | "b";
type Lane = "high" | "max";

type History = {
  caseId: string;
  caseTitle: string;
  id: string;
  jobId: string;
  levelA: number;
  levelB: number;
  roleAName: string;
  roleBName: string;
  scenarioId: string;
  status: "error" | "ok";
  transcript: Array<{ content: string; role: string; speaker: Side }>;
  variedLevel: number;
  variedSide: Side;
};

type JudgeResult = {
  cacheUsage?: {
    cachedPromptTokens: number | null;
    promptCacheHitTokens: number | null;
    promptCacheMissTokens: number | null;
  } | null;
  caseId: string;
  durationMs: number;
  error: string | null;
  historyJobId: string;
  parsedPolicy: {
    parseError: string | null;
    policyWinner: Side | "unknown";
  };
  providerResponseId?: string | null;
  reasoningVerification: {
    effort?: string;
    verifiedOn?: true;
  } | null;
  status: "error" | "ok";
  variedLevel: number;
  variedSide: Side;
};

type Cell = {
  aWins: number;
  bWins: number;
  caseId: string;
  lane: Lane;
  total: number;
  variedLevel: number;
  variedSide: Side;
  variedWins: number;
};

type ComparisonSummary = {
  cases: string[];
  generatedAt: string;
  histories: number;
  historiesPerCase: number;
  judgeModel: string;
  judgePromptCandidateId: string;
  judgePromptHash: string;
  judgePromptVersion: string;
  repeatsPerHistory: number;
  retainedJudgmentsPerEffort: number;
  results: Record<
    Lane,
    {
      averageAbsoluteSensitivity: number;
      badToGoodSensitivity: number;
      cache: { hitCalls: number; hitPromptTokens: number };
      cost: Record<string, number>;
      fixedHistoryInstability: number;
      level3To4Sensitivity: number;
      uncachedLatency: {
        calls: number;
        maxSeconds: number;
        meanSeconds: number;
        medianSeconds: number;
        p90Seconds: number;
      };
    }
  >;
  sourceRuns: {
    highADE: string;
    highBC: string;
    maxAE: string;
  };
};

type LaneMetric = {
  averageAbsoluteSensitivity: number | null;
  badToGoodSensitivity: number | null;
  fixedHistoryInstability: number | null;
  level3To4: number | null;
  promptStrengthTrend: number | null;
  promptStrengthTrendIgnoringLevel1: number | null;
  totalScore: number | null;
};

const comparisonDir = process.argv[2];
if (!comparisonDir) {
  throw new Error(
    "Usage: bun scripts/bench/judge-sensitivity/render-trolley-judge-sensitivity.ts <comparison-dir> [output-file]",
  );
}

const outputPath =
  process.argv[3] ?? join(comparisonDir, "trolley-judge-sensitivity.html");
const comparison = (await Bun.file(
  join(comparisonDir, "summary.json"),
).json()) as ComparisonSummary;

async function readRun(relativeDir: string) {
  const directory = resolve(process.cwd(), relativeDir);
  const [config, historiesArtifact, judgeArtifact, promptArtifact] =
    await Promise.all([
      Bun.file(join(directory, "config.json")).json(),
      Bun.file(join(directory, "histories.json")).json(),
      Bun.file(join(directory, "judge-results.json")).json(),
      Bun.file(join(directory, "prompt-levels.json")).json(),
    ]);
  return {
    config,
    histories: historiesArtifact.histories as History[],
    promptArtifact,
    results: judgeArtifact.results as JudgeResult[],
  };
}

const [highADE, highBC, maxAE] = await Promise.all([
  readRun(comparison.sourceRuns.highADE),
  readRun(comparison.sourceRuns.highBC),
  readRun(comparison.sourceRuns.maxAE),
]);

const highHistories = [...highADE.histories, ...highBC.histories].sort(
  (left, right) => left.id.localeCompare(right.id),
);
const maxHistories = [...maxAE.histories].sort((left, right) =>
  left.id.localeCompare(right.id),
);
if (highHistories.length !== maxHistories.length) {
  throw new Error(
    `History count differs between lanes: ${highHistories.length} high vs ${maxHistories.length} max`,
  );
}
for (let index = 0; index < highHistories.length; index += 1) {
  if (
    JSON.stringify(highHistories[index]) !== JSON.stringify(maxHistories[index])
  ) {
    throw new Error(
      `History differs between lanes: ${highHistories[index]?.id}`,
    );
  }
}

const laneResults: Record<Lane, JudgeResult[]> = {
  high: [...highADE.results, ...highBC.results],
  max: maxAE.results,
};
const lanes: Lane[] = ["high", "max"];
const laneLabels: Record<Lane, string> = {
  high: "GLM-5.2 · High",
  max: "GLM-5.2 · Max",
};
const laneRunIds: Record<Lane, string[]> = {
  high: [String(highADE.config.runId), String(highBC.config.runId)],
  max: [String(maxAE.config.runId)],
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function average(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(value: number | null, digits = 1) {
  return value == null ? "n/a" : `${(value * 100).toFixed(digits)}%`;
}

function signedPercent(value: number | null) {
  if (value == null) return "n/a";
  const points = value * 100;
  return `${points > 0 ? "+" : ""}${points.toFixed(1)}%`;
}

function signedPoints(value: number | null) {
  if (value == null) return "n/a";
  const points = value * 100;
  return `${points > 0 ? "+" : ""}${points.toFixed(1)} pts`;
}

function dollars(value: number) {
  return `$${value.toFixed(4)}`;
}

function yuan(value: number) {
  return `¥${value.toFixed(2)}`;
}

function pairwiseTrend(rates: Map<number, number>, levels: number[]) {
  const differences: number[] = [];
  for (let lower = 0; lower < levels.length; lower += 1) {
    for (let higher = lower + 1; higher < levels.length; higher += 1) {
      const lowerRate = rates.get(levels[lower]!);
      const higherRate = rates.get(levels[higher]!);
      if (lowerRate == null || higherRate == null) return null;
      differences.push(higherRate - lowerRate);
    }
  }
  return average(differences);
}

function heatStyle(rate: number | null) {
  if (rate == null) return "background:#f4f4f1;color:#667085";
  const low = [253, 242, 232];
  const middle = [250, 204, 107];
  const high = [88, 166, 92];
  const start = rate <= 0.5 ? low : middle;
  const end = rate <= 0.5 ? middle : high;
  const mix = rate <= 0.5 ? rate * 2 : (rate - 0.5) * 2;
  const rgb = start.map((channel, index) =>
    Math.round(channel + (end[index]! - channel) * mix),
  );
  return `background:rgb(${rgb.join(" ")});color:${rate >= 0.75 ? "#fff" : "#1f2933"}`;
}

function metricBar(value: number | null) {
  return value == null ? 0 : Math.min(100, Math.abs(value) * 100);
}

const caseMap = new Map<
  string,
  { id: string; roleAName: string; roleBName: string; title: string }
>();
for (const history of maxHistories) {
  if (caseMap.has(history.caseId)) continue;
  caseMap.set(history.caseId, {
    id: history.caseId,
    roleAName: history.roleAName,
    roleBName: history.roleBName,
    title: history.caseTitle,
  });
}
const cases = comparison.cases.map((caseId) => {
  const item = caseMap.get(caseId);
  if (!item) throw new Error(`Missing case metadata for ${caseId}`);
  return item;
});

const validByLane: Record<Lane, JudgeResult[]> = {
  high: laneResults.high.filter(
    (result) =>
      result.status === "ok" &&
      !result.parsedPolicy.parseError &&
      (result.parsedPolicy.policyWinner === "a" ||
        result.parsedPolicy.policyWinner === "b"),
  ),
  max: laneResults.max.filter(
    (result) =>
      result.status === "ok" &&
      !result.parsedPolicy.parseError &&
      (result.parsedPolicy.policyWinner === "a" ||
        result.parsedPolicy.policyWinner === "b"),
  ),
};

const cells = new Map<string, Cell>();
for (const lane of lanes) {
  for (const result of validByLane[lane]) {
    const key = [
      lane,
      result.caseId,
      result.variedSide,
      result.variedLevel,
    ].join("|");
    const cell = cells.get(key) ?? {
      aWins: 0,
      bWins: 0,
      caseId: result.caseId,
      lane,
      total: 0,
      variedLevel: result.variedLevel,
      variedSide: result.variedSide,
      variedWins: 0,
    };
    cell.total += 1;
    if (result.parsedPolicy.policyWinner === "a") cell.aWins += 1;
    if (result.parsedPolicy.policyWinner === "b") cell.bWins += 1;
    if (result.parsedPolicy.policyWinner === result.variedSide) {
      cell.variedWins += 1;
    }
    cells.set(key, cell);
  }
}

function getCell(lane: Lane, caseId: string, side: Side, level: number) {
  return cells.get([lane, caseId, side, level].join("|"));
}

function calculateMetrics(lane: Lane): LaneMetric {
  const trends: number[] = [];
  const trendsIgnoringLevel1: number[] = [];
  const level3To4: number[] = [];
  const absoluteSensitivity: number[] = [];
  const badToGoodSensitivity: number[] = [];

  for (const trolleyCase of cases) {
    for (const side of ["a", "b"] as const) {
      const rates = new Map<number, number>();
      for (const level of [1, 2, 3, 4]) {
        const cell = getCell(lane, trolleyCase.id, side, level);
        if (cell?.total) rates.set(level, cell.variedWins / cell.total);
      }
      const trend = pairwiseTrend(rates, [1, 2, 3, 4]);
      if (trend != null) trends.push(trend);
      const ignoringLevel1 = pairwiseTrend(rates, [2, 3, 4]);
      if (ignoringLevel1 != null) trendsIgnoringLevel1.push(ignoringLevel1);
      const level1 = rates.get(1);
      const level2 = rates.get(2);
      const level3 = rates.get(3);
      const level4 = rates.get(4);
      if (level3 != null) {
        for (const rate of [level1, level2, level4]) {
          if (rate != null) absoluteSensitivity.push(Math.abs(rate - level3));
        }
      }
      if (level3 != null && level4 != null) level3To4.push(level4 - level3);
      if (
        level1 != null &&
        level2 != null &&
        level3 != null &&
        level4 != null
      ) {
        badToGoodSensitivity.push((level3 + level4 - level1 - level2) / 2);
      }
    }
  }

  const resultGroups = new Map<string, JudgeResult[]>();
  for (const result of validByLane[lane]) {
    resultGroups.set(result.historyJobId, [
      ...(resultGroups.get(result.historyJobId) ?? []),
      result,
    ]);
  }
  const instability = [...resultGroups.values()].map((rows) => {
    const aRate =
      rows.filter((row) => row.parsedPolicy.policyWinner === "a").length /
      rows.length;
    return aRate * (1 - aRate);
  });

  const promptStrengthTrend = average(trends);
  const directionalLevel3To4 = average(level3To4);
  const fixedHistoryInstability = average(instability);
  return {
    averageAbsoluteSensitivity: average(absoluteSensitivity),
    badToGoodSensitivity: average(badToGoodSensitivity),
    fixedHistoryInstability,
    level3To4: directionalLevel3To4,
    promptStrengthTrend,
    promptStrengthTrendIgnoringLevel1: average(trendsIgnoringLevel1),
    totalScore:
      promptStrengthTrend == null ||
      directionalLevel3To4 == null ||
      fixedHistoryInstability == null
        ? null
        : promptStrengthTrend + directionalLevel3To4 - fixedHistoryInstability,
  };
}

const laneMetrics: Record<Lane, LaneMetric> = {
  high: calculateMetrics("high"),
  max: calculateMetrics("max"),
};

for (const lane of lanes) {
  const expected = comparison.results[lane];
  const calculated = laneMetrics[lane];
  for (const [label, left, right] of [
    [
      "average absolute sensitivity",
      calculated.averageAbsoluteSensitivity,
      expected.averageAbsoluteSensitivity,
    ],
    [
      "bad-to-good sensitivity",
      calculated.badToGoodSensitivity,
      expected.badToGoodSensitivity,
    ],
    ["level 3 to 4", calculated.level3To4, expected.level3To4Sensitivity],
    [
      "fixed-history instability",
      calculated.fixedHistoryInstability,
      expected.fixedHistoryInstability,
    ],
  ] as const) {
    if (left == null || Math.abs(left - right) > 1e-9) {
      throw new Error(`${lane} ${label} differs from comparison summary`);
    }
  }
}

const promptScenario = maxAE.promptArtifact.scenarios["trolley-problem"] as {
  roles: Record<
    string,
    {
      levels: Record<
        string,
        {
          body: string;
          label: string;
          metadata?: { displayName?: string; version?: number };
        }
      >;
      roleName: string;
    }
  >;
};

const totalResults = lanes.reduce(
  (sum, lane) => sum + laneResults[lane].length,
  0,
);
const totalValid = lanes.reduce(
  (sum, lane) => sum + validByLane[lane].length,
  0,
);
const totalVerifiedOn = lanes.reduce(
  (sum, lane) =>
    sum +
    validByLane[lane].filter(
      (result) =>
        result.reasoningVerification?.verifiedOn &&
        result.reasoningVerification.effort === lane,
    ).length,
  0,
);
const responseIds = lanes.flatMap((lane) =>
  validByLane[lane]
    .map((result) => result.providerResponseId)
    .filter((id): id is string => Boolean(id)),
);

const modelCardsHtml = lanes
  .map((lane) => {
    const metric = laneMetrics[lane];
    const values: Array<[string, string, number | null]> = [
      ["Total score", signedPoints(metric.totalScore), metric.totalScore],
      [
        "Prompt-strength trend",
        signedPercent(metric.promptStrengthTrend),
        metric.promptStrengthTrend,
      ],
      [
        "Prompt-strength trend (ignoring Level 1)",
        signedPercent(metric.promptStrengthTrendIgnoringLevel1),
        metric.promptStrengthTrendIgnoringLevel1,
      ],
      ["Level 3 to 4", signedPercent(metric.level3To4), metric.level3To4],
      [
        "Fixed-history instability",
        percent(metric.fixedHistoryInstability),
        metric.fixedHistoryInstability,
      ],
    ];
    return `<article class="model" data-lane="${lane}" data-score="${metric.totalScore ?? ""}">
      <div class="model-heading"><h3>${laneLabels[lane]}</h3><span class="effort-badge">Thinking ${lane}</span></div>
      ${values
        .map(
          ([label, formatted, value]) => `<div class="metric">
        <span>${escapeHtml(label)}</span><strong>${escapeHtml(formatted)}</strong>
        <span class="metric-track"><span class="metric-fill${(value ?? 0) < 0 ? " negative" : ""}" style="width:${metricBar(value).toFixed(1)}%"></span></span>
      </div>`,
        )
        .join("\n")}
    </article>`;
  })
  .join("\n");

function heatCell(lane: Lane, caseId: string, side: Side, level: number) {
  const cell = getCell(lane, caseId, side, level);
  const rate = cell?.total ? cell.variedWins / cell.total : null;
  return `<td class="heat-cell" style="${heatStyle(rate)}"><strong>${percent(rate, 0)}</strong><span>N=${cell?.total ?? 0}</span></td>`;
}

const matrixHtml = cases
  .map((trolleyCase) => {
    const sideTables = (["a", "b"] as const)
      .map((side) => {
        const variedName =
          side === "a" ? trolleyCase.roleAName : trolleyCase.roleBName;
        const baselineName =
          side === "a" ? trolleyCase.roleBName : trolleyCase.roleAName;
        const rows = lanes
          .map(
            (
              lane,
              laneIndex,
            ) => `<tr data-score="${laneMetrics[lane].totalScore ?? ""}" data-order="${laneIndex}">
              <th>${laneLabels[lane]}</th>
              ${[1, 2, 3, 4]
                .map((level) => heatCell(lane, trolleyCase.id, side, level))
                .join("")}
            </tr>`,
          )
          .join("\n");
        return `<section class="matrix-panel">
          <h3>${escapeHtml(variedName)} prompt varied vs. ${escapeHtml(baselineName)} baseline</h3>
          <div class="table-wrap"><table class="heatmap compact-heatmap">
            <thead><tr><th>Judge configuration</th><th>Level 1</th><th>Level 2</th><th>Level 3</th><th>Level 4</th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </section>`;
      })
      .join("\n");
    return `<div class="case-matrix" data-case="${trolleyCase.id}">
      <h3 class="case-heading"><span>Case ${trolleyCase.id}</span>${escapeHtml(trolleyCase.title)}</h3>
      <div class="matrix-grid">${sideTables}</div>
      <p class="section-note">Numbers are the win rate of the side whose prompt is varied. Each cell contains ten repeated judgments of one fixed debate history.</p>
    </div>`;
  })
  .join("\n");

const spectrumHtml = [...cells.values()]
  .sort(
    (left, right) =>
      comparison.cases.indexOf(left.caseId) -
        comparison.cases.indexOf(right.caseId) ||
      left.variedSide.localeCompare(right.variedSide) ||
      left.variedLevel - right.variedLevel ||
      lanes.indexOf(left.lane) - lanes.indexOf(right.lane),
  )
  .map((cell) => {
    const trolleyCase = caseMap.get(cell.caseId)!;
    const variedName =
      cell.variedSide === "a" ? trolleyCase.roleAName : trolleyCase.roleBName;
    const bRate = cell.total ? cell.bWins / cell.total : 0;
    return `<article class="spectrum-row" data-lane="${cell.lane}" data-case="${cell.caseId}" data-side="${cell.variedSide}" data-level="${cell.variedLevel}">
      <div class="row-head"><strong>${laneLabels[cell.lane]}</strong><span>Case ${cell.caseId} · ${escapeHtml(variedName)} varied · Level ${cell.variedLevel} · N=${cell.total}</span></div>
      <div class="spectrum"><span class="side left">奕仁 / 一人侧</span><span class="midline"></span><span class="side right">武仁 / 五人侧</span><span class="marker marker-${cell.lane}" style="left:${(bRate * 100).toFixed(1)}%"></span></div>
      <strong class="spectrum-value">${percent(bRate, 0)}</strong>
    </article>`;
  })
  .join("\n");

const detailHtml = [...cells.values()]
  .sort(
    (left, right) =>
      lanes.indexOf(left.lane) - lanes.indexOf(right.lane) ||
      comparison.cases.indexOf(left.caseId) -
        comparison.cases.indexOf(right.caseId) ||
      left.variedSide.localeCompare(right.variedSide) ||
      left.variedLevel - right.variedLevel,
  )
  .map((cell) => {
    const trolleyCase = caseMap.get(cell.caseId)!;
    const variedName =
      cell.variedSide === "a" ? trolleyCase.roleAName : trolleyCase.roleBName;
    const baselineName =
      cell.variedSide === "a" ? trolleyCase.roleBName : trolleyCase.roleAName;
    return `<tr><td>${laneLabels[cell.lane]}</td><td>${cell.caseId} · ${escapeHtml(trolleyCase.title)}</td><td>${escapeHtml(variedName)}</td><td>${escapeHtml(baselineName)}</td><td>${cell.variedLevel}</td><td>${percent(cell.variedWins / cell.total)}</td><td>${percent(cell.aWins / cell.total)}</td><td>${percent(cell.bWins / cell.total)}</td><td>${cell.total}</td></tr>`;
  })
  .join("\n");

const sampleHistories = maxHistories
  .filter((history) => history.caseId === "A" && history.variedSide === "a")
  .sort((left, right) => left.variedLevel - right.variedLevel)
  .slice(0, 4);
const historiesHtml = sampleHistories
  .map(
    (history) => `<details class="history-card">
      <summary><span>Case ${history.caseId} · ${escapeHtml(history.roleAName)} prompt varied · Level ${history.variedLevel}</span><code>${escapeHtml(history.jobId)}</code></summary>
      <div class="history-meta"><span>${escapeHtml(history.roleAName)} Level ${history.levelA}</span><span>${escapeHtml(history.roleBName)} Level ${history.levelB}</span><span>${history.transcript.length} turns</span></div>
      <div class="turn-list">${history.transcript
        .map(
          (turn, index) =>
            `<div class="turn side-${turn.speaker}"><div class="turn-head">Turn ${index + 1} · ${escapeHtml(turn.role)}</div><div class="turn-body">${escapeHtml(turn.content)}</div></div>`,
        )
        .join("")}</div>
    </details>`,
  )
  .join("\n");

const selectedPromptsHtml = Object.values(promptScenario.roles)
  .map((role) => {
    const level4 = role.levels["4"];
    const author = level4.metadata?.displayName ?? "unknown";
    const version = level4.metadata?.version;
    return `<tr><td>${escapeHtml(role.roleName)}</td><td>${escapeHtml(level4.label)}</td><td>${escapeHtml(author)}${version == null ? "" : ` v${version}`}</td></tr>`;
  })
  .join("\n");

const caseOptions = cases
  .map(
    (trolleyCase) =>
      `<option value="${trolleyCase.id}">Case ${trolleyCase.id} · ${escapeHtml(trolleyCase.title)}</option>`,
  )
  .join("");

const highCost = comparison.results.high.cost;
const maxCost = comparison.results.max.cost;
const costRows = `<tr><td>GLM-5.2 · High</td><td>${highCost.actualBillableGenerations}</td><td>${highCost.zeroCostTimeoutTraces}</td><td>${comparison.results.high.cache.hitCalls}</td><td>${comparison.results.high.cache.hitPromptTokens.toLocaleString("en-US")}</td><td>${dollars(highCost.estimatedTotalUsd)}</td><td>${yuan(highCost.estimatedTotalCny)}</td></tr>
<tr><td>GLM-5.2 · Max</td><td>${maxCost.billableGenerations}</td><td>${maxCost.zeroCostTimeoutTraces}</td><td>${comparison.results.max.cache.hitCalls}</td><td>${comparison.results.max.cache.hitPromptTokens.toLocaleString("en-US")}</td><td>${dollars(maxCost.usd)}</td><td>${yuan(maxCost.cny)}</td></tr>`;

const latencyRows = lanes
  .map((lane) => {
    const latency = comparison.results[lane].uncachedLatency;
    return `<tr><td>${laneLabels[lane]}</td><td class="numeric"><strong>${latency.meanSeconds.toFixed(2)}s</strong></td><td class="numeric">${latency.medianSeconds.toFixed(2)}s</td><td class="numeric">${latency.p90Seconds.toFixed(2)}s</td><td class="numeric">${latency.maxSeconds.toFixed(2)}s</td><td class="numeric">${latency.calls}</td><td class="numeric">${comparison.results[lane].cache.hitCalls}</td><td class="bar-cell"><span class="latency-bar"><span style="width:${((latency.meanSeconds / comparison.results.max.uncachedLatency.meanSeconds) * 100).toFixed(1)}%"></span></span></td></tr>`;
  })
  .join("\n");

const generatedAt = new Date().toISOString();
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Trolley Judge Sensitivity · GLM-5.2 High vs Max</title>
  <style>
    :root { color-scheme:light; --ink:#1f2933; --muted:#667085; --line:#d8dee4; --paper:#fff; --band:#f6f7f3; --accent:#2f7d62; --accent-2:#b85632; --gold:#d9a441; --green:#58a65c; --red:#b94a48; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:#fbfbf8; letter-spacing:0; }
    header { padding:28px 32px 20px; border-bottom:1px solid var(--line); background:var(--paper); }
    main { padding:24px 32px 40px; max-width:1680px; margin:0 auto; }
    h1 { margin:0 0 10px; font-size:28px; line-height:1.15; font-weight:720; }
    h2 { margin:0 0 14px; font-size:18px; line-height:1.25; }
    h3 { margin:0 0 10px; font-size:15px; line-height:1.3; }
    code { padding:2px 5px; border-radius:4px; background:#eef0ea; color:#344054; overflow-wrap:anywhere; }
    .sub { display:flex; flex-wrap:wrap; gap:10px 18px; color:var(--muted); font-size:13px; }
    .stats { display:grid; grid-template-columns:repeat(6,minmax(145px,1fr)); gap:12px; margin:0 0 24px; }
    .stat { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:14px; min-height:84px; }
    .stat span { display:block; color:var(--muted); font-size:12px; margin-bottom:6px; }
    .stat strong { display:block; font-size:26px; line-height:1; }
    .section { margin-top:22px; padding:18px 0; border-top:1px solid var(--line); }
    .section:first-of-type { border-top:0; }
    .method-grid { display:grid; grid-template-columns:repeat(4,minmax(180px,1fr)); gap:12px; }
    .method-item,.level-card,.model { border:1px solid var(--line); border-radius:8px; padding:12px; background:#fff; }
    .method-item strong,.level-card strong { display:block; font-size:14px; margin-bottom:5px; }
    .method-item span,.level-card span,.section-note { color:var(--muted); font-size:12px; line-height:1.5; }
    .section-note { margin:10px 0 0; }
    .level-grid { display:grid; grid-template-columns:repeat(4,minmax(160px,1fr)); gap:12px; }
    .toolbar { display:flex; gap:12px; flex-wrap:wrap; align-items:end; margin-bottom:14px; }
    label { display:grid; gap:5px; font-size:12px; color:var(--muted); }
    select { min-width:210px; max-width:100%; border:1px solid var(--line); border-radius:6px; padding:8px 30px 8px 10px; background:#fff; color:var(--ink); font:inherit; }
    .model-grid { display:grid; grid-template-columns:repeat(2,minmax(260px,520px)); gap:12px; }
    .model-heading { display:flex; justify-content:space-between; gap:12px; align-items:start; }
    .effort-badge { color:#475467; background:#eef0ea; border-radius:999px; padding:4px 8px; font-size:11px; white-space:nowrap; }
    .metric { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; margin:10px 0; font-size:13px; }
    .metric span:first-child { color:var(--muted); }
    .metric-track { grid-column:1/-1; display:block; width:100%; height:7px; border-radius:999px; background:#ecefe8; overflow:hidden; }
    .metric-fill { display:block; height:100%; background:linear-gradient(90deg,var(--accent),var(--gold)); }
    .metric-fill.negative { background:linear-gradient(90deg,var(--gold),var(--red)); }
    .formula-note { display:grid; gap:8px; max-width:1180px; }
    .table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:8px; background:#fff; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th,td { border-bottom:1px solid var(--line); padding:9px 10px; text-align:left; vertical-align:middle; }
    tbody tr:last-child th,tbody tr:last-child td { border-bottom:0; }
    th { color:#475467; background:var(--band); font-weight:650; }
    .table-wrap th,.table-wrap td { white-space:nowrap; }
    .numeric { text-align:right; font-variant-numeric:tabular-nums; }
    .bar-cell { min-width:140px; width:24%; }
    .latency-bar { display:block; width:100%; height:8px; border-radius:999px; background:#ecefe8; overflow:hidden; }
    .latency-bar span { display:block; height:100%; background:linear-gradient(90deg,var(--gold),var(--red)); }
    .matrix-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
    .case-matrix + .case-matrix { margin-top:26px; padding-top:24px; border-top:1px solid var(--line); }
    .case-heading { display:flex; gap:9px; align-items:baseline; margin-bottom:14px; font-size:17px; }
    .case-heading span { color:var(--accent); font-size:12px; text-transform:uppercase; }
    .matrix-panel { min-width:0; }
    .heatmap th,.heatmap td { border:1px solid #e1e5dc; }
    .compact-heatmap th:first-child { width:34%; min-width:165px; }
    .heat-cell { min-width:72px; text-align:center; }
    .heat-cell strong { display:block; font-size:15px; }
    .heat-cell span { display:block; margin-top:4px; font-size:10px; opacity:.8; }
    .spectrum-list { display:grid; gap:4px; }
    .spectrum-row { display:grid; grid-template-columns:minmax(220px,290px) minmax(340px,1fr) 62px; gap:12px; align-items:center; padding:9px 0; border-bottom:1px solid #edf0e9; }
    .row-head { display:grid; gap:3px; }
    .row-head span { color:var(--muted); font-size:12px; }
    .spectrum { position:relative; height:30px; border-radius:999px; background:linear-gradient(90deg,#b94a48 0%,#e5dfc8 50%,#4f9a64 100%); border:1px solid rgba(31,41,51,.18); overflow:hidden; }
    .spectrum .side { position:absolute; top:7px; font-size:11px; color:rgba(255,255,255,.94); text-shadow:0 1px 1px rgba(0,0,0,.3); z-index:2; }
    .spectrum .left { left:12px; } .spectrum .right { right:12px; }
    .midline { position:absolute; inset:0 auto 0 50%; width:2px; background:rgba(31,41,51,.55); z-index:2; }
    .marker { position:absolute; top:3px; bottom:3px; width:4px; margin-left:-2px; border-radius:999px; background:#111827; box-shadow:0 0 0 2px rgba(255,255,255,.9); z-index:3; }
    .marker-max { background:#7a271a; }
    .spectrum-value { text-align:right; font-variant-numeric:tabular-nums; }
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
    @media (max-width:1100px) { .stats,.method-grid,.level-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .matrix-grid { grid-template-columns:1fr; } }
    @media (max-width:720px) { header,main { padding-left:16px; padding-right:16px; } .stats,.method-grid,.level-grid,.model-grid { grid-template-columns:1fr; } .spectrum-row { grid-template-columns:1fr; } .spectrum-value { text-align:left; } .history-card summary { align-items:start; flex-direction:column; } h1 { font-size:23px; } }
  </style>
</head>
<body>
  <header>
    <h1>Trolley Problem Judge Sensitivity</h1>
    <div class="sub"><span>Judge <code>${escapeHtml(comparison.judgeModel)}</code></span><span>Reasoning <code>high vs max</code></span><span>Judge prompt <code>${escapeHtml(comparison.judgePromptCandidateId)} / ${escapeHtml(comparison.judgePromptVersion)}</code></span><span>Player model <code>${escapeHtml(maxAE.config.playerModel)}</code></span><span>Generated ${escapeHtml(generatedAt)}</span></div>
  </header>
  <main>
    <section class="stats" aria-label="Run status">
      <div class="stat"><span>Retained judgments</span><strong>${totalValid}/${totalResults}</strong></div>
      <div class="stat"><span>Frozen histories</span><strong>${comparison.histories}</strong></div>
      <div class="stat"><span>Repeats per history</span><strong>${comparison.repeatsPerHistory}</strong></div>
      <div class="stat"><span>Mini-cases</span><strong>${cases.length}</strong></div>
      <div class="stat"><span>Reasoning verified</span><strong>${totalVerifiedOn}/${totalValid}</strong></div>
      <div class="stat"><span>Unique responses</span><strong>${new Set(responseIds).size}/${responseIds.length}</strong></div>
    </section>

    <section class="section">
      <h2>Methodology</h2>
      <div class="method-grid">
        <div class="method-item"><strong>One mini-case at a time</strong><span>The same single-case P2 judge prompt evaluates Cases A through E independently.</span></div>
        <div class="method-item"><strong>Matched history panel</strong><span>High and max use the exact same 40 saved histories: eight conditions per case.</span></div>
        <div class="method-item"><strong>Repeated judging</strong><span>Each saved history is judged ten times per reasoning effort. Histories are not regenerated.</span></div>
        <div class="method-item"><strong>Measured outcome</strong><span>The report tracks whether the side with the varied prompt wins as prompt quality moves from Level 1 to Level 4.</span></div>
      </div>
      <p class="section-note">High combines runs <code>${escapeHtml(laneRunIds.high.join(" + "))}</code>. Max uses run <code>${escapeHtml(laneRunIds.max[0])}</code>. Judge prompt SHA-256: <code>${escapeHtml(comparison.judgePromptHash)}</code>.</p>
    </section>

    <section class="section">
      <h2>Prompt Levels</h2>
      <div class="level-grid">
        <div class="level-card"><strong>Level 1</strong><span>Random meaningless 乱码, eg. %$&amp;(**^%(*&amp;</span></div>
        <div class="level-card"><strong>Level 2</strong><span>Weak but grammatical Chinese. Prompt used: <code>${escapeHtml(Object.values(promptScenario.roles)[0]!.levels["2"].body)}</code></span></div>
        <div class="level-card"><strong>Level 3</strong><span>Near-empty baseline prompt. The user prompt is just <code>-</code>.</span></div>
        <div class="level-card"><strong>Level 4</strong><span>Strong representative production user prompt.</span></div>
      </div>
      <p class="section-note">Each history varies one side's user prompt while the opposing side remains at the Level 3 baseline.</p>
      <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Role</th><th>Level 4 prompt</th><th>Author / version</th></tr></thead><tbody>${selectedPromptsHtml}</tbody></table></div>
    </section>

    <section class="section">
      <h2>Model Sensitivity</h2>
      <div class="toolbar"><label>Sort judge configurations<select id="modelSensitivitySort"><option value="effort">Reasoning effort</option><option value="total-desc">Total score (high to low)</option></select></label></div>
      <div class="model-grid" id="modelGrid">${modelCardsHtml}</div>
      <div class="section-note formula-note">
        <div><strong>Prompt-strength trend</strong>: positive means the varied side tends to win more as its prompt moves from Level 1 to Level 4; negative means it tends to win less; near 0 means no consistent direction.</div>
        <div><strong>Prompt-strength trend formula</strong>: let <code>w_s(l)</code> be varied-side win rate for case/varied-side series <code>s</code> at Level <code>l</code>. For each series, <code>T_s = [(w_s(2)-w_s(1)) + (w_s(3)-w_s(1)) + (w_s(4)-w_s(1)) + (w_s(3)-w_s(2)) + (w_s(4)-w_s(2)) + (w_s(4)-w_s(3))] / 6</code>. The displayed metric averages <code>T_s</code> across all ten series.</div>
        <div><strong>Prompt-strength trend (ignoring Level 1)</strong> applies the same pairwise-gap calculation to Levels 2, 3, and 4.</div>
        <div><strong>Level 3 to 4</strong>: <code>D = average_s[w_s(4) - w_s(3)]</code>.</div>
        <div><strong>Fixed-history instability</strong> averages <code>p(1-p)</code> across saved histories, where <code>p</code> is one policy's win rate over ten judgments of that history.</div>
        <div><strong>Total score</strong>: <code>S = T + D - I</code>, using unrounded Prompt-strength trend <code>T</code>, Level 3 to 4 <code>D</code>, and instability <code>I</code>.</div>
      </div>
    </section>

    <section class="section"><h2>Judge Latency</h2><div class="table-wrap"><table><thead><tr><th>Judge configuration</th><th>Average</th><th>Median</th><th>P90</th><th>Maximum</th><th>Uncached N</th><th>Cached omitted</th><th>Average bar</th></tr></thead><tbody>${latencyRows}</tbody></table></div><p class="section-note">Latency statistics use only retained calls reporting no cache-hit tokens. Cache-assisted calls are excluded because their latency is not comparable to uncached generation. Durations include retries.</p></section>

    <section class="section">
      <h2>Varied-Side Win Rate</h2>
      <div class="toolbar"><label>Sort configurations<select id="winRateSort"><option value="effort">Reasoning effort</option><option value="total-desc">Total score (high to low)</option></select></label></div>
      ${matrixHtml}
    </section>

    <section class="section">
      <h2>Policy Lean Spectrum</h2>
      <div class="toolbar">
        <label>Mini-case<select id="caseFilter">${caseOptions}</select></label>
        <label>Judge configuration<select id="laneFilter"><option value="all">High and max</option><option value="high">GLM-5.2 · High</option><option value="max">GLM-5.2 · Max</option></select></label>
        <label>Varied side<select id="sideFilter"><option value="all">Both sides</option><option value="a">奕仁 / 一人侧</option><option value="b">武仁 / 五人侧</option></select></label>
        <label>Level<select id="levelFilter"><option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option></select></label>
      </div>
      <div class="spectrum-list" id="spectrumRows">${spectrumHtml}</div>
      <p class="section-note">The marker and value show 武仁 / 五人侧's win rate. Left means more judgments selected 奕仁 / 一人侧; right means more selected 武仁 / 五人侧.</p>
    </section>

    <section class="section"><h2>Cost And Cache</h2><div class="table-wrap"><table><thead><tr><th>Judge configuration</th><th>Billable generations</th><th>Zero-cost timeout traces</th><th>Cache-hit calls</th><th>Cache-hit prompt tokens</th><th>Cost USD</th><th>Cost CNY</th></tr></thead><tbody>${costRows}</tbody></table></div><p class="section-note">High includes one successful repair generation missing from Langfuse, estimated from its adjacent repair calls. Max is fully represented in Langfuse. These are application-side estimates, not provider invoices.</p></section>

    <details class="section foldable-section"><summary>Detail Table</summary><div class="table-wrap"><table><thead><tr><th>Judge configuration</th><th>Mini-case</th><th>Prompt varied</th><th>Baseline</th><th>Level</th><th>Varied-side win rate</th><th>奕仁 / 一人侧</th><th>武仁 / 五人侧</th><th>N</th></tr></thead><tbody>${detailHtml}</tbody></table></div></details>

    <section class="section"><h2>Sample Debating Histories</h2><p class="section-note">These four Case A histories vary 奕仁's prompt from Level 1 to Level 4 while 武仁 remains at Level 3. Each history is fed to each judge configuration ten times.</p><div class="history-list" style="margin-top:14px">${historiesHtml}</div></section>
  </main>
  <script>
    const modelGrid = document.getElementById('modelGrid')
    const modelCards = [...modelGrid.children]
    modelCards.forEach((card, index) => { card.dataset.order = String(index) })
    document.getElementById('modelSensitivitySort').addEventListener('change', (event) => {
      modelCards.sort((left, right) => event.target.value === 'effort'
        ? Number(left.dataset.order) - Number(right.dataset.order)
        : Number(right.dataset.score || '-Infinity') - Number(left.dataset.score || '-Infinity'))
      modelGrid.append(...modelCards)
    })
    const winRateSort = document.getElementById('winRateSort')
    function sortWinRateRows() {
      document.querySelectorAll('.heatmap tbody').forEach((body) => {
        const rows = [...body.rows]
        rows.sort((left, right) => winRateSort.value === 'effort'
          ? Number(left.dataset.order) - Number(right.dataset.order)
          : Number(right.dataset.score || '-Infinity') - Number(left.dataset.score || '-Infinity'))
        body.append(...rows)
      })
    }
    winRateSort.addEventListener('change', sortWinRateRows)
    const caseFilter = document.getElementById('caseFilter')
    const laneFilter = document.getElementById('laneFilter')
    const sideFilter = document.getElementById('sideFilter')
    const levelFilter = document.getElementById('levelFilter')
    const spectrumRows = [...document.querySelectorAll('.spectrum-row')]
    function applySpectrumFilters() {
      spectrumRows.forEach((row) => {
        const visible = row.dataset.case === caseFilter.value
          && (laneFilter.value === 'all' || row.dataset.lane === laneFilter.value)
          && (sideFilter.value === 'all' || row.dataset.side === sideFilter.value)
          && (levelFilter.value === 'all' || row.dataset.level === levelFilter.value)
        row.classList.toggle('hidden', !visible)
      })
    }
    ;[caseFilter, laneFilter, sideFilter, levelFilter].forEach((control) => control.addEventListener('change', applySpectrumFilters))
    applySpectrumFilters()
  </script>
</body>
</html>
`;

await Bun.write(outputPath, html);
console.log(
  JSON.stringify(
    {
      cases: cases.length,
      cells: cells.size,
      histories: maxHistories.length,
      outputPath,
      results: totalResults,
      verifiedReasoning: totalVerifiedOn,
    },
    null,
    2,
  ),
);
