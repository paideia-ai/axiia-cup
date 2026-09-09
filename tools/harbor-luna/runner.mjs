#!/usr/bin/env node
// Local, dependency-free scheduler. Only the Codex root can spawn actors; this
// program never generates, edits, or accepts operator-supplied model replies.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  actorText,
  atomic,
  canonical,
  Engine,
  FormatFailure,
  parseAct,
  repairInstruction,
  sha,
} from "./engine.mjs";
import {
  EvidenceError,
  findChild,
  findLog,
  readLog,
  requireEvidence as check,
  rootConfiguration,
  verifyActor,
} from "./provenance.mjs";
import {
  dispatches,
  matchesPlan,
  runtimeVersion,
  v1Code,
} from "./transport.mjs";
import { failureProof, unacknowledgedDispatchProof } from "./recovery.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(here, "../..");
const defaultSource = path.join(
  repository,
  "v2/scenarios/scenarios/legal-harbor-murder-jury/script.js",
);
const now = () => new Date().toISOString();
const json = (filename) => JSON.parse(fs.readFileSync(filename, "utf8"));
const files = [
  "engine.mjs",
  "provenance.mjs",
  "runner.mjs",
  "transport.mjs",
  "recovery.mjs",
];
const toolHashes = () =>
  Object.fromEntries(
    files.map((name) => [name, sha(fs.readFileSync(path.join(here, name)))]),
  );
const append = (filename, value) => {
  const fd = fs.openSync(filename, "a", 0o600);
  try {
    fs.writeSync(fd, canonical(value) + "\n");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
};
const quote = (text) => "'" + text.replaceAll("'", "'\\''") + "'";
const sessionRoot = () =>
  path.join(
    process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
    "sessions",
  );
const spawnCalls = dispatches;

export async function initialize(
  {
    dir,
    sourcePath = defaultSource,
    seeds = ["1"],
    slots = 3,
    rootId = process.env.CODEX_THREAD_ID,
    sessions = sessionRoot(),
    fixture = false,
    expectedScriptSha = null,
  },
) {
  dir = path.resolve(dir);
  check(
    !fs.existsSync(dir),
    "Run directory already exists; never overwrite an experiment",
  );
  check(
    seeds.length > 0 && seeds.length <= 100 &&
      new Set(seeds).size === seeds.length &&
      seeds.every((s) => /^\d{1,12}$/.test(s)),
    "Declare 1..100 distinct nonnegative integer seeds",
  );
  check(
    Number.isInteger(slots) && slots >= 1 && slots <= 3,
    "Actor slots must be 1..3",
  );
  const root = findLog(sessions, rootId), rootConfig = rootConfiguration(root);
  check(
    spawnCalls(root).length === 0,
    "Use a fresh root thread with no pre-run child experiments or readiness probes",
  );
  check(
    fixture || path.resolve(sourcePath) === defaultSource,
    "Real trials must use the repository Harbor script",
  );
  const indexDir = fixture
    ? path.dirname(dir)
    : path.join(repository, ".local/scenario-runs");
  const indexPath = path.join(indexDir, "harbor-workflow-index.jsonl");
  if (fs.existsSync(indexPath)) {
    check(
      !fs.readFileSync(indexPath, "utf8").split("\n").filter(Boolean).map(
        JSON.parse,
      ).some((e) => e.root.threadId === rootId),
      "This root already registered a batch; use a fresh root, do not hide previous attempts",
    );
  }
  const source = fs.readFileSync(sourcePath, "utf8");
  check(
    !expectedScriptSha || sha(source) === expectedScriptSha,
    "Script SHA differs from the requested comparison baseline",
  );
  check(
    ["v1", "v2"].includes(runtimeVersion(root)),
    "Unknown runtime version; repair adapter before registering the batch",
  );
  const contract = {
    schemaVersion: 3,
    workflowVersion: "3.1",
    runId: crypto.randomUUID(),
    createdAt: now(),
    directory: dir,
    purpose: fixture
      ? "synthetic-fixture-NOT-EXPERIMENT"
      : "execution-compliance-trial",
    mode: "full-game",
    stoppingRule:
      "Exactly the declared games; no outcome-dependent extension, filtering, or tuning.",
    sourcePath: path.resolve(sourcePath),
    scriptSha256: sha(source),
    tools: toolHashes(),
    protectedTests: Object.fromEntries(
      fs.readdirSync(here).filter((n) => n === "guard.test.mjs")
        .map((n) => [n, sha(fs.readFileSync(path.join(here, n)))]),
    ),
    root: rootConfig,
    transport: runtimeVersion(root),
    sessions: path.resolve(sessions),
    actor: {
      model: "gpt-5.6-luna",
      reasoning_effort: "medium",
      fork_turns: "none",
    },
    games: seeds.map((seed, index) => ({
      id: `game-${String(index + 1).padStart(3, "0")}`,
      seed,
    })),
    slots,
    params: {},
    sides: {
      a: { model: "gpt-5.6-luna", prompt: "" },
      b: { model: "gpt-5.6-luna", prompt: "" },
    },
    retryPolicy: { maxFreshAttempts: 3, formatRepairs: 1, transportRetries: 3 },
    repairPolicy:
      "Automatically recover observed execution failures on the same sealed effect; audit every retry and tool repair. Never reroll an accepted reply or change the experiment.",
    dispatchPolicy:
      "Check plaintext exactly when observable; encrypted text is not observable, not a failed check.",
    fidelity: [
      "All-Luna surrogate, not native provider execution.",
      "Native logical sessions embedded as task JSON, not API system/user/assistant roles.",
      "Hidden reasoning is not reproduced.",
      "Same-account filesystem and runtime logs are not an independent tamperproof authority.",
    ],
  };
  check(
    contract.protectedTests["guard.test.mjs"],
    "Required immutable provenance guard suite is missing",
  );
  // Probe compatibility before reserving a real batch. No model is called.
  for (const game of contract.games) {
    await new Engine({
      source,
      params: contract.params,
      sides: contract.sides,
      seed: game.seed,
      runId: game.id,
    }).run();
  }
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  atomic(path.join(dir, "contract.json"), contract);
  atomic(path.join(dir, "contract.sha256"), sha(contract) + "\n", true);
  atomic(path.join(dir, "script.snapshot.js"), source, true);
  for (const name of files) {
    atomic(
      path.join(dir, "frozen-tools", name),
      fs.readFileSync(path.join(here, name)),
      true,
    );
    atomic(
      path.join(dir, "operator-tools", name),
      fs.readFileSync(path.join(here, name)),
      true,
    );
  }
  for (
    const name of fs.readdirSync(here).filter((n) => n.endsWith(".test.mjs"))
  ) {
    atomic(
      path.join(dir, "frozen-tests", name),
      fs.readFileSync(path.join(here, name)),
      true,
    );
    atomic(
      path.join(dir, "operator-tools", name),
      fs.readFileSync(path.join(here, name)),
      true,
    );
  }
  atomic(path.join(dir, "root.jsonl"), root.bytes, true);
  atomic(path.join(dir, "events.jsonl"), "", true);
  // Append-only discovery index, including batches that subsequently fail or stop.
  fs.mkdirSync(indexDir, { recursive: true });
  append(indexPath, {
    runId: contract.runId,
    dir,
    root: rootConfig,
    createdAt: contract.createdAt,
    contractSha256: sha(contract),
    purpose: contract.purpose,
    runner: path.join(dir, "operator-tools", "runner.mjs"),
  });
  atomic(
    path.join(dir, "RESUME.md"),
    `# Resume this batch, not a new experiment\n\nRoot: ${rootId}\nRun: ${dir}\nContract: ${
      sha(contract)
    }\nScript: ${contract.scriptSha256}\n\nOnly the original root may execute. Keep ${rootConfig.model} / ${rootConfig.effort}. After compaction or a tool interruption, run:\n\n\`\`\`bash\nnode ${
      quote(path.join(dir, "operator-tools/runner.mjs"))
    } step --run-dir ${
      quote(dir)
    }\n\`\`\`\n\nRead all of the compact response, especially blockers/action. Do not re-init or re-spawn inFlight tasks. checkpoint.json is a cache; step reconstructs truth from the ledger and live logs. If stdout was lost, repeat step, not the old spawn calls. Only a current successful live audit permits a success final. Progress belongs in commentary, never a final.\n\nAn external interruption needs the host/user to resume this exact session; this file cannot restart Codex. A different root needs separately authorized migration.\n`,
    true,
  );
  return {
    runDir: dir,
    runner: path.join(dir, "operator-tools", "runner.mjs"),
    root: rootConfig,
    games: contract.games,
    contractSha256: sha(contract),
    scriptSha256: contract.scriptSha256,
    purpose: contract.purpose,
    resumeFile: path.join(dir, "RESUME.md"),
    nextAction:
      "Read RESUME.md; run the private runner step. Do not end the turn after initialization.",
  };
}

export function loadRun(
  dir,
  { executing = false, allowToolChange = false } = {},
) {
  dir = path.resolve(dir);
  const contract = json(path.join(dir, "contract.json"));
  check(
    sha(contract) ===
      fs.readFileSync(path.join(dir, "contract.sha256"), "utf8").trim(),
    "Frozen contract changed",
  );
  check(
    contract.directory === dir,
    "Run directory moved; use original location for this implementation",
  );
  const source = fs.readFileSync(path.join(dir, "script.snapshot.js"), "utf8");
  check(sha(source) === contract.scriptSha256, "Script snapshot changed");
  for (const [name, digest] of Object.entries(contract.protectedTests || {})) {
    check(
      /^[\w.-]+\.test\.mjs$/.test(name) &&
        sha(fs.readFileSync(path.join(dir, "frozen-tests", name))) === digest,
      "Protected baseline tests changed",
    );
  }
  if (executing) {
    check(
      process.env.CODEX_THREAD_ID === contract.root.threadId,
      "Only the registered root session may schedule or import",
    );
    const current = rootConfiguration(
      findLog(contract.sessions, contract.root.threadId),
    );
    check(
      canonical(current) === canonical(contract.root),
      "Root configuration changed during this batch",
    );
  }
  const raw = fs.readFileSync(path.join(dir, "events.jsonl"), "utf8");
  check(
    !raw || raw.endsWith("\n"),
    "Partial ledger write; preserve evidence and stop",
  );
  const events = raw.split("\n").filter(Boolean).map(JSON.parse);
  let previous = sha(contract);
  for (const [index, event] of events.entries()) {
    const { hash, ...body } = event;
    check(
      event.index === index && event.previous === previous &&
        sha(body) === hash,
      "Experiment ledger hash chain changed",
    );
    check(
      ["planned", "imported", "aborted", "tools_repaired"].includes(event.type),
      "Unknown ledger event",
    );
    previous = hash;
  }
  const revisions = events.filter((e) => e.type === "tools_repaired");
  const activeTools = revisions.at(-1)?.tools || contract.tools;
  if (!allowToolChange) {
    check(
      canonical(activeTools) === canonical(toolHashes()),
      "Workflow code changed; use repair-tools to test and record the repair, or use the recorded tool snapshot",
    );
  }
  let previousTools = contract.tools;
  for (const revision of revisions) {
    check(
      canonical(revision.previousTools) === canonical(previousTools),
      "Tool repair version chain changed",
    );
    check(
      revision.tools["engine.mjs"] === contract.tools["engine.mjs"],
      "Engine semantics cannot change during a batch",
    );
    check(
      revision.revision === sha(revision.tools),
      "Invalid tool revision identity",
    );
    for (const [name, digest] of Object.entries(revision.tools)) {
      check(
        files.includes(name) &&
          sha(
              fs.readFileSync(
                path.join(dir, "tool-revisions", revision.revision, name),
              ),
            ) === digest,
        "Tool repair snapshot changed",
      );
    }
    const revisionDir = path.join(dir, "tool-revisions", revision.revision);
    check(
      sha(fs.readFileSync(path.join(revisionDir, "tests.txt"))) ===
        revision.testOutputSha256,
      "Tool repair test output changed",
    );
    check(
      !contract.protectedTests || revision.baselineTestOutputSha256,
      "Tool revision has no protected baseline test evidence",
    );
    if (revision.baselineTestOutputSha256) {
      check(
        sha(fs.readFileSync(path.join(revisionDir, "baseline-tests.txt"))) ===
          revision.baselineTestOutputSha256,
        "Protected baseline test output changed",
      );
    }
    for (const [name, digest] of Object.entries(revision.tests)) {
      check(
        /^[\w.-]+\.test\.mjs$/.test(name) &&
          sha(fs.readFileSync(path.join(revisionDir, name))) === digest,
        "Tool repair test snapshot changed",
      );
    }
    previousTools = revision.tools;
  }
  const plans = events.filter((e) => e.type === "planned").flatMap((e) =>
    e.plans
  );
  const imports = events.filter((e) => e.type === "imported");
  check(
    new Set(plans.map((p) => p.spawn.task_name)).size === plans.length,
    "Duplicate reserved task",
  );
  check(
    new Set(imports.map((e) => e.task)).size === imports.length,
    "Duplicate import",
  );
  check(
    new Set(imports.map((e) => e.proof.threadId)).size === imports.length,
    "Actor reused across effects",
  );
  for (const record of imports) {
    check(
      plans.some((p) => p.spawn.task_name === record.task),
      "Import has no reserved task",
    );
  }
  return {
    dir,
    contract,
    source,
    events,
    plans,
    imports,
    previous,
    activeTools,
    aborted: events.some((e) => e.type === "aborted"),
  };
}

function event(run, type, body) {
  const entry = {
    index: run.events.length,
    previous: run.previous,
    timestamp: now(),
    type,
    ...body,
  };
  entry.hash = sha(entry);
  append(path.join(run.dir, "events.jsonl"), entry);
  run.events.push(entry);
  run.previous = entry.hash;
  return entry;
}

export function replay(run, game, imports = run.imports) {
  const journal = imports.filter((e) =>
    e.game === game.id && e.status === "accepted"
  ).map((e) => ({
    lane: e.lane,
    seq: e.laneSeq,
    kind: "act",
    requestSha256: e.requestSha256,
    payload: { text: e.proof.text, fields: e.fields, reasoning: null },
  }));
  return new Engine({
    source: run.source,
    params: run.contract.params,
    sides: run.contract.sides,
    seed: game.seed,
    runId: game.id,
    journal,
  }).run();
}

function requestAttempt(run, game, request) {
  const prior = run.imports.filter((e) =>
    e.game === game.id && e.effectId === request.effectId
  );
  check(
    !prior.some((e) => e.status === "accepted"),
    "Cannot reroll a valid response",
  );
  const failed = prior.filter((e) => e.status === "invalid-format");
  const executionFailures =
    prior.filter((e) => e.status === "failed-execution").length;
  check(
    executionFailures <= run.contract.retryPolicy.transportRetries,
    `Execution recovery limit exceeded for ${game.id}/${request.effectId}; inspect repeated cause before continuing`,
  );
  const repair = failed.length === 1;
  const freshFailures = failed.filter((e) => e.kind === "act").length;
  check(
    freshFailures < run.contract.retryPolicy.maxFreshAttempts,
    `Format retries exhausted for ${game.id}/${request.effectId}`,
  );
  const current = structuredClone(request);
  if (repair) {
    current.session.messages.push({
      role: "assistant",
      text: failed[0].proof.text,
      reasoning: null,
    });
    current.session.messages.push({
      role: "user",
      text: repairInstruction(failed[0].errors),
    });
  }
  return {
    request: current,
    attempt: prior.length,
    kind: repair ? "act_repair" : "act",
  };
}

function makePlan(run, game, request, createdAt = now()) {
  const current = requestAttempt(run, game, request);
  const task = `harbor_${run.contract.runId.replaceAll("-", "")}_${
    game.id.replace("-", "_")
  }_${request.lane}_${request.laneSeq}_${current.attempt}`;
  check(/^[a-z0-9_]+$/.test(task), "Unsupported scenario lane name");
  const input = actorText(current.request);
  const inputPath = path.join(run.dir, "inputs", task + ".txt");
  const readCode = '// @exec: {"max_output_tokens": 60000}\n' +
    `const result = await tools.exec_command({cmd: ${
      JSON.stringify("cat " + quote(inputPath))
    }, max_output_tokens: 60000});\ntext(result.output);`;
  const message =
    `One isolated game response. Execute exactly the following code with functions.exec once to read your complete input. Do not read any other file, use any other tool, send commentary, or contact another agent. If the read fails or is truncated, return exactly CONTEXT_READ_FAILED. Otherwise follow the participant session in that file and return only its next response.\n\n${readCode}`;
  return {
    game: game.id,
    effectId: request.effectId,
    lane: request.lane,
    laneSeq: request.laneSeq,
    batchId: request.batchId,
    requestSha256: request.requestSha256,
    attempt: current.attempt,
    kind: current.kind,
    createdAt,
    actorPath: `/root/${task}`,
    inputPath,
    input,
    inputSha256: sha(input),
    readCode,
    spawn: { task_name: task, message, ...run.contract.actor },
  };
}

function spawned(root, plan) {
  return dispatches(root).some((d) => matchesPlan(d, plan));
}

export async function next(dir, { reserve = true } = {}) {
  const run = loadRun(dir, { executing: true });
  check(!run.aborted, "Batch was aborted; it cannot be resumed or relabeled");
  const pending = run.plans.filter((p) =>
    !run.imports.some((e) => e.task === p.spawn.task_name)
  );
  const planned = [];
  const games = [];
  // Deterministic interleaving across games. Within each game only the
  // engine's current barrier is eligible, even if earlier ballots have arrived.
  const states = await Promise.all(
    run.contract.games.map(async (game) => ({
      game,
      engine: await replay(run, game),
    })),
  );
  for (const state of states) {
    games.push({
      game: state.game.id,
      status: state.engine.pending.length ? "running" : "finished",
    });
  }
  for (
    let slot = pending.length;
    reserve && slot < run.contract.slots;
    slot++
  ) {
    let chosen = null;
    for (const { game, engine } of states) {
      const request = engine.pending.find((r) =>
        ![...pending, ...planned].some((p) =>
          p.game === game.id && p.effectId === r.effectId
        )
      );
      if (request) {
        chosen = { game, request };
        break;
      }
    }
    if (!chosen) break;
    const plan = makePlan(run, chosen.game, chosen.request);
    atomic(plan.inputPath, plan.input, true);
    planned.push(plan);
  }
  if (planned.length) event(run, "planned", { plans: planned });
  const root = findLog(run.contract.sessions, run.contract.root.threadId);
  const outstanding = [...pending, ...planned];
  return {
    status: games.every((g) => g.status === "finished")
      ? "finished"
      : "running",
    games,
    toSpawn: (reserve ? outstanding : []).filter((p) => !spawned(root, p)).map((
      p,
    ) => ({
      game: p.game,
      effectId: p.effectId,
      attempt: p.attempt,
      spawn: p.spawn,
      transport: run.contract.transport || "v2",
      ...(run.contract.transport === "v1" ? { dispatchCode: v1Code(p) } : {}),
    })),
    inFlight: outstanding.filter((p) => spawned(root, p)).map((p) => ({
      task: p.spawn.task_name,
      actorPath: p.actorPath,
    })),
  };
}

export async function importReply(dir, task) {
  const run = loadRun(dir, { executing: true });
  check(!run.aborted, "Batch was aborted");
  const plan = run.plans.find((p) => p.spawn.task_name === task);
  check(
    plan,
    "Unknown reserved task; aliases and manually supplied replies are not accepted",
  );
  const existing = run.imports.find((e) => e.task === task);
  if (existing) {
    return {
      task,
      status: "already-imported",
      originalStatus: existing.status,
      threadId: existing.proof.threadId,
    };
  }
  check(
    fs.readFileSync(plan.inputPath, "utf8") === plan.input,
    "Frozen actor input file changed",
  );
  const game = run.contract.games.find((g) => g.id === plan.game);
  const engine = await replay(run, game);
  const request = engine.pending.find((r) => r.effectId === plan.effectId);
  check(request, "Task is not eligible in the current game state");
  check(
    canonical(makePlan(run, game, request, plan.createdAt)) === canonical(plan),
    "Reserved task differs from reconstructed context",
  );
  const root = findLog(run.contract.sessions, run.contract.root.threadId);
  const child = findChild(
    run.contract.sessions,
    plan,
    run.contract.root.threadId,
    root,
  );
  const proof = verifyActor({
    root,
    child,
    plan,
    rootConfig: run.contract.root,
    createdAt: run.contract.createdAt,
    allowOpaque: true,
  });
  check(
    !run.imports.some((e) => e.proof.threadId === proof.threadId),
    "Actor reused",
  );
  let fields, errors, status = "accepted";
  try {
    fields = parseAct(proof.text, request.spec);
  } catch (error) {
    if (!(error instanceof FormatFailure)) throw error;
    errors = error.errors;
    status = "invalid-format";
  }
  // Preserve original runtime evidence, never a root-copied reply file.
  atomic(
    path.join(run.dir, "evidence", proof.threadId + ".jsonl"),
    child.bytes,
    true,
  );
  atomic(path.join(run.dir, "root.jsonl"), root.bytes, true);
  event(run, "imported", {
    task,
    game: game.id,
    effectId: request.effectId,
    lane: request.lane,
    laneSeq: request.laneSeq,
    kind: plan.kind,
    requestSha256: request.requestSha256,
    status,
    ...(fields ? { fields } : { errors }),
    proof,
  });
  return {
    task,
    status,
    threadId: proof.threadId,
    dispatchText: proof.dispatchText,
    ...(errors ? { errors } : {}),
  };
}

export async function recover(dir, task) {
  // First try the ORIGINAL reply under the current adapter. A recoverable
  // representation difference must never force a fresh generation.
  try {
    return await importReply(dir, task);
  } catch (original) {
    let importError = original;
    const run = loadRun(dir, { executing: true });
    check(
      !run.aborted,
      "Aborted batches require a separately authorized migration",
    );
    check(
      run.contract.schemaVersion >= 3,
      "Historical batch has no recovery policy; do not silently change it",
    );
    const plan = run.plans.find((p) => p.spawn.task_name === task);
    check(plan, "Unknown recovery task");
    const root = findLog(run.contract.sessions, run.contract.root.threadId);
    if (!spawned(root, plan)) return { task, status: "ready-to-dispatch" };
    let child;
    try {
      child = findChild(
        run.contract.sessions,
        plan,
        run.contract.root.threadId,
        root,
      );
    } catch (error) {
      if (error.status === "unverified") {
        // No acknowledgement and no child is a separate, auditable failure.
        // The helper requires two later runtime snapshots, never a timeout alone.
        if (error.message === "Child log not available yet") {
          let proof;
          try {
            proof = unacknowledgedDispatchProof({ root, plan });
          } catch (failure) {
            if (!(failure instanceof EvidenceError)) throw failure;
          }
          if (proof) {
            const game = run.contract.games.find((g) => g.id === plan.game);
            const engine = await replay(run, game);
            const request = engine.pending.find((r) =>
              r.effectId === plan.effectId
            );
            check(
              request &&
                canonical(makePlan(run, game, request, plan.createdAt)) ===
                  canonical(plan),
              "Unacknowledged effect changed",
            );
            check(
              fs.readFileSync(plan.inputPath, "utf8") === plan.input,
              "Frozen actor input file changed",
            );
            atomic(
              path.join(run.dir, "evidence", proof.threadId + ".jsonl"),
              root.bytes,
              true,
            );
            atomic(path.join(run.dir, "root.jsonl"), root.bytes, true);
            event(run, "imported", {
              task,
              game: plan.game,
              effectId: plan.effectId,
              lane: plan.lane,
              laneSeq: plan.laneSeq,
              kind: plan.kind,
              requestSha256: plan.requestSha256,
              status: "failed-execution",
              proof,
            });
            return {
              task,
              status: "recovered-execution-failure",
              reason: proof.reason,
            };
          }
        }
        return {
          task,
          status: "waiting",
          retryAfterSeconds: 5,
          message: error.message,
        };
      }
      throw error;
    }
    const game = run.contract.games.find((g) => g.id === plan.game),
      engine = await replay(run, game);
    const request = engine.pending.find((r) => r.effectId === plan.effectId);
    check(
      request &&
        canonical(makePlan(run, game, request, plan.createdAt)) ===
          canonical(plan),
      "Cannot recover a changed or accepted effect",
    );
    check(
      fs.readFileSync(plan.inputPath, "utf8") === plan.input,
      "Restore the frozen input file before recovering; do not regenerate",
    );
    let proof;
    // A completion may have flushed since importReply's first read. Retry the
    // SAME actor once before classifying its lifecycle, never regenerate it.
    if (original.status === "unverified") {
      try {
        return await importReply(dir, task);
      } catch (retry) {
        importError = retry;
      }
    }
    try {
      proof = failureProof({ root, child, plan });
    } catch (error) {
      return {
        task,
        status:
          error.status === "unverified" || importError.status === "unverified"
            ? "waiting"
            : "needs-repair",
        retryAfterSeconds: 5,
        message: importError.message,
        repairHint: error.message,
        threadId: child.meta.id,
      };
    }
    check(
      !run.imports.some((e) => e.proof.threadId === child.meta.id),
      "Actor already accounted for",
    );
    atomic(
      path.join(run.dir, "evidence", proof.threadId + ".jsonl"),
      child.bytes,
      true,
    );
    atomic(path.join(run.dir, "root.jsonl"), root.bytes, true);
    event(run, "imported", {
      task,
      game: plan.game,
      effectId: plan.effectId,
      lane: plan.lane,
      laneSeq: plan.laneSeq,
      requestSha256: plan.requestSha256,
      kind: plan.kind,
      status: "failed-execution",
      proof,
    });
    return {
      task,
      status: "recovered-execution-failure",
      reason: proof.reason,
      threadId: proof.threadId,
      next: "Run step; a new actor will receive the same sealed effect",
    };
  }
}

export async function step(dir) {
  const run = loadRun(dir, { executing: true });
  check(!run.aborted, "Batch was aborted");
  const root = findLog(run.contract.sessions, run.contract.root.threadId);
  const outcomes = [];
  for (
    const plan of run.plans.filter((p) =>
      !run.imports.some((e) => e.task === p.spawn.task_name)
    )
  ) {
    if (spawned(root, plan)) {
      outcomes.push(await recover(dir, plan.spawn.task_name));
    }
  }
  const blockers = outcomes.filter((o) => o.status === "needs-repair");
  const inspection = outcomes.filter((o) =>
    o.status === "waiting" &&
    Date.now() - Date.parse(
            run.plans.find((p) => p.spawn.task_name === o.task).createdAt,
          ) > 180000
  );
  const state = await next(dir, {
    reserve: !blockers.length && !inspection.length,
  });
  const current = loadRun(dir);
  const result = {
    ...state,
    outcomes,
    blockers,
    inspection,
    status: blockers.length
      ? "needs-repair"
      : inspection.length
      ? "needs-inspection"
      : state.status,
    mustContinue: true,
    successFinalAllowed: false,
    completedGames: state.games.filter((g) => g.status === "finished").length,
    declaredGames: state.games.length,
    ledgerHead: current.previous,
    generatedAt: now(),
    checkpoint: path.join(current.dir, "checkpoint.json"),
    resumeFile: path.join(current.dir, "RESUME.md"),
    action: blockers.length
      ? "Fix the recorded compatibility issue, then retry the same task; do not end the session"
      : inspection.length
      ? "Inspect live agents and child logs now. Take two unfiltered list_agents snapshots at least 1 second apart; then step again. Age alone NEVER permits a retry. Keep valid replies. Do not end the turn."
      : state.status === "finished"
      ? "Run live audit now; finished games alone do not permit a success final"
      : "Dispatch exactly toSpawn, wait up to 60 seconds, then step again. Progress is commentary, NOT a final answer.",
  };
  // The ledger is the source of truth. Losing stdout or this cache cannot lose
  // reservations; repeat step to reconcile, never replay old spawn calls.
  atomic(result.checkpoint, result);
  return result;
}

export async function status(dir) {
  const run = loadRun(dir, { allowToolChange: true });
  const games = await Promise.all(run.contract.games.map(async (g) => ({
    game: g.id,
    finished: (await replay(run, g)).result !== null,
  })));
  let checkpoint = null, checkpointError = null;
  try {
    if (fs.existsSync(path.join(dir, "checkpoint.json"))) {
      checkpoint = json(path.join(dir, "checkpoint.json"));
    }
  } catch (error) {
    checkpointError = error.message;
  }
  return {
    runDir: run.dir,
    root: run.contract.root,
    ledgerHead: run.previous,
    completedGames: games.filter((g) => g.finished).length,
    declaredGames: games.length,
    importedAttempts: run.imports.length,
    aborted: run.aborted,
    pendingTasks: run.plans.filter((p) =>
      !run.imports.some((e) => e.task === p.spawn.task_name)
    )
      .map((p) => ({
        task: p.spawn.task_name,
        game: p.game,
        createdAt: p.createdAt,
      })),
    toolsRegistered: canonical(toolHashes()) === canonical(run.activeTools),
    checkpointMatchesLedger: checkpoint?.ledgerHead === run.previous,
    checkpointGeneratedAt: checkpoint?.generatedAt ?? null,
    checkpointError,
    successFinalAllowed: false,
    action:
      "Read-only diagnosis, NOT an audit. Original root: repeat private runner step; do not replay cached spawns or re-init.",
  };
}

export function locate(
  rootId = process.env.CODEX_THREAD_ID,
  indexPath = path.join(
    repository,
    ".local/scenario-runs/harbor-workflow-index.jsonl",
  ),
) {
  check(rootId, "Root thread identity is required");
  const entries = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, "utf8").split("\n").filter(Boolean).map(
      JSON.parse,
    )
    : [];
  const matches = entries.filter((e) => e.root.threadId === rootId);
  check(
    matches.length <= 1,
    "Multiple batches registered for this root; inspect evidence",
  );
  return matches.length ? { status: "resume-existing", ...matches[0] } : {
    status: "fresh-root",
    rootId,
    action: "Read workflow, then init once. No readiness subagent.",
  };
}

export async function repairTools(dir, reason) {
  check(reason?.trim(), "Document the actual fault and scoped repair");
  const run = loadRun(dir, { executing: true, allowToolChange: true });
  check(
    run.contract.schemaVersion >= 3 && !run.aborted,
    "This historical or aborted contract does not authorize in-run code upgrades",
  );
  const toolsNow = toolHashes();
  check(
    toolsNow["engine.mjs"] === run.contract.tools["engine.mjs"],
    "Engine/game/prompt semantics cannot be repaired during an experiment",
  );
  if (canonical(toolsNow) === canonical(run.activeTools)) {
    return { status: "already-current" };
  }
  // Execute the maintained regression suite, not an operator-supplied success flag.
  const tests = fs.readdirSync(here).filter((n) => n.endsWith(".test.mjs"))
    .sort();
  check(
    tests.includes("workflow.test.mjs") && tests.includes("engine.test.mjs"),
    "Required regression tests missing",
  );
  const testEnv = {
    ...process.env,
    HARBOR_TEST_SOURCE: path.join(run.dir, "script.snapshot.js"),
  };
  delete testEnv.NODE_TEST_CONTEXT; // Nested Node test runners otherwise suppress discovery.
  const output = execFileSync(process.execPath, [
    "--test",
    "--test-reporter=tap",
    ...tests.map((n) => path.join(here, n)),
  ], {
    encoding: "utf8",
    timeout: 45000,
    maxBuffer: 4 * 1024 * 1024,
    env: testEnv,
  });
  check(
    /# tests [1-9]\d*\s/.test(output) && /# fail 0\s/.test(output) &&
      /# skipped 0\s/.test(output),
    "Repair regression suite did not execute fully",
  );
  // Run frozen baseline assertions AGAINST CANDIDATE CODE, not frozen code.
  // Editing candidate tests cannot remove the original provenance protections.
  let baselineOutput = null;
  if (run.contract.protectedTests) {
    const temp = fs.mkdtempSync(
      path.join(os.tmpdir(), "harbor-repair-baseline-"),
    );
    try {
      for (const name of files) {
        fs.copyFileSync(path.join(here, name), path.join(temp, name));
      }
      for (const name of Object.keys(run.contract.protectedTests)) {
        fs.copyFileSync(
          path.join(run.dir, "frozen-tests", name),
          path.join(temp, name),
        );
      }
      baselineOutput = execFileSync(process.execPath, [
        "--test",
        "--test-reporter=tap",
        ...Object.keys(run.contract.protectedTests).map((n) =>
          path.join(temp, n)
        ),
      ], {
        encoding: "utf8",
        timeout: 45000,
        maxBuffer: 4 * 1024 * 1024,
        env: testEnv,
      });
      check(
        /# tests [1-9]\d*\s/.test(baselineOutput) &&
          /# fail 0\s/.test(baselineOutput) &&
          /# skipped 0\s/.test(baselineOutput),
        "Protected baseline did not execute fully",
      );
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }
  // New code must still reconstruct and validate all previously accepted evidence.
  await report(dir, { allowToolChange: true });
  check(
    canonical(toolHashes()) === canonical(toolsNow),
    "Candidate tools changed while tests were running; test the final bytes again",
  );
  const revision = sha(toolsNow);
  for (const name of files) {
    atomic(
      path.join(run.dir, "tool-revisions", revision, name),
      fs.readFileSync(path.join(here, name)),
      true,
    );
  }
  atomic(
    path.join(run.dir, "tool-revisions", revision, "tests.txt"),
    output,
    true,
  );
  if (baselineOutput) {
    atomic(
      path.join(run.dir, "tool-revisions", revision, "baseline-tests.txt"),
      baselineOutput,
      true,
    );
  }
  for (const name of tests) {
    atomic(
      path.join(run.dir, "tool-revisions", revision, name),
      fs.readFileSync(path.join(here, name)),
      true,
    );
  }
  event(run, "tools_repaired", {
    reason,
    previousTools: run.activeTools,
    tools: toolsNow,
    revision,
    tests: Object.fromEntries(
      tests.map((n) => [n, sha(fs.readFileSync(path.join(here, n)))]),
    ),
    testOutputSha256: sha(output),
    ...(baselineOutput
      ? { baselineTestOutputSha256: sha(baselineOutput) }
      : {}),
  });
  return {
    status: "repair-adopted",
    revision,
    next:
      "Continue the same batch with step; do not regenerate accepted replies",
  };
}

function ballotSummary(timeline) {
  return timeline.filter((r) =>
    ["observer_secret_poll", "final_vote_reveal"].includes(r.event?.type)
  ).map((r) => {
    const e = r.event, ballots = e.ballots ?? e.votes;
    check(
      ballots.length === 11 && new Set(ballots.map((b) => b.juror)).size === 11,
      "Vote count or juror identity invariant failed",
    );
    check(
      ballots.find((b) => b.juror === "a")?.verdict === "GUILTY" &&
        ballots.find((b) => b.juror === "b")?.verdict === "NOT_GUILTY",
      "Fixed a/b votes changed",
    );
    check(
      ballots.every((b) => ["GUILTY", "NOT_GUILTY"].includes(b.verdict)),
      "Unknown verdict",
    );
    const guilty = ballots.filter((b) => b.verdict === "GUILTY").length;
    check(
      e.guiltyVotes === guilty && e.notGuiltyVotes === 11 - guilty,
      "Reported vote totals disagree with ballots",
    );
    if (e.type === "final_vote_reveal") {
      check(e.threshold === 6, "Final threshold changed");
    }
    return {
      type: e.type,
      round: e.round ?? null,
      guilty,
      notGuilty: 11 - guilty,
      npcGuilty: guilty - 1,
      publicSpeechEventsBefore: timeline.slice(0, r.seq).filter((x) =>
        x.channel === "public" && x.event?.type === "jury_speech"
      ).length,
      privateChatEventsBefore: timeline.slice(0, r.seq).filter((x) =>
        x.event?.type === "observer_private_chat"
      ).length,
      endReason: e.endReason ?? null,
    };
  });
}

export async function report(
  dir,
  { offline = false, allowToolChange = false } = {},
) {
  const run = loadRun(dir, { allowToolChange });
  const archivedRoot = readLog(path.join(run.dir, "root.jsonl"));
  const root = offline
    ? archivedRoot
    : findLog(run.contract.sessions, run.contract.root.threadId);
  for (const row of spawnCalls(root)) {
    check(
      run.plans.some((p) => matchesPlan(row, p)),
      "Root dispatched an unregistered child; possible driver, warmup, discarded sample, or extra game",
    );
  }
  // Reconstruct every reservation in ledger order, not only the eventual winner.
  const seenImports = [], seenPlans = new Map();
  let aborted = false;
  for (const e of run.events) {
    check(!aborted, "Ledger continued after abort");
    if (e.type === "aborted") {
      aborted = true;
      continue;
    }
    if (e.type === "tools_repaired") continue;
    if (e.type === "planned") {
      const outstanding = [...seenPlans.keys()].filter((t) =>
        !seenImports.some((i) => i.task === t)
      );
      check(
        outstanding.length + e.plans.length <= run.contract.slots,
        "Reserved more actors than allowed",
      );
      for (const plan of e.plans) {
        const game = run.contract.games.find((g) => g.id === plan.game);
        check(game, "Undeclared game");
        const engine = await replay(run, game, seenImports);
        const request = engine.pending.find((r) =>
          r.effectId === plan.effectId
        );
        check(
          request,
          "Reservation crossed a game barrier or rerolled an accepted effect",
        );
        const partial = { ...run, imports: seenImports };
        check(
          canonical(makePlan(partial, game, request, plan.createdAt)) ===
            canonical(plan),
          "Frozen context or task plan changed",
        );
        check(
          !outstanding.some((t) => {
            const p = seenPlans.get(t);
            return p.game === plan.game && p.effectId === plan.effectId;
          }),
          "Duplicate in-flight effect",
        );
        check(
          fs.readFileSync(plan.inputPath, "utf8") === plan.input,
          "Frozen actor input changed",
        );
        seenPlans.set(plan.spawn.task_name, plan);
      }
    } else {
      const plan = seenPlans.get(e.task);
      check(plan, "Import preceded reservation");
      const archive = readLog(
        path.join(run.dir, "evidence", e.proof.threadId + ".jsonl"),
      );
      check(
        archive.sha256 === e.proof.source.sha256,
        "Child evidence archive changed",
      );
      check(
        sha(archivedRoot.bytes.subarray(0, e.proof.parentSource.byteLength)) ===
          e.proof.parentSource.sha256,
        "Root evidence archive changed",
      );
      const unacknowledged = e.proof.reason === "dispatch-unacknowledged";
      const child = unacknowledged
        ? archive
        : offline
        ? archive
        : findLog(run.contract.sessions, e.proof.threadId);
      if (unacknowledged && !offline) {
        let absent = false;
        try {
          findChild(
            run.contract.sessions,
            plan,
            run.contract.root.threadId,
            root,
          );
        } catch (error) {
          absent = error.message === "Child log not available yet";
        }
        check(
          absent,
          "Previously unacknowledged dispatch now has a child or ambiguous identity; do not hide late execution",
        );
      }
      check(
        child.bytes.subarray(0, archive.bytes.length).equals(archive.bytes),
        "Child runtime evidence was rewritten",
      );
      check(
        root.bytes.subarray(0, e.proof.parentSource.byteLength).equals(
          archivedRoot.bytes.subarray(0, e.proof.parentSource.byteLength),
        ),
        "Root runtime evidence was rewritten",
      );
      const proof = e.status === "failed-execution"
        ? unacknowledged
          ? unacknowledgedDispatchProof({ root, plan })
          : failureProof({ root, child, plan })
        : verifyActor({
          root,
          child,
          plan,
          rootConfig: run.contract.root,
          createdAt: run.contract.createdAt,
          allowOpaque: true,
        });
      for (
        const key of [
          "threadId",
          "actorPath",
          "text",
          "replySha256",
          "inputSha256",
          "model",
          "effort",
          "execution",
          "dispatchText",
          "usage",
          "modelResponses",
        ]
      ) {
        check(
          canonical(e.proof[key]) === canonical(proof[key]),
          `Imported proof ${key} changed`,
        );
      }
      if (e.status === "failed-execution") {
        check(
          proof.reason === e.proof.reason,
          "Execution failure classification changed",
        );
      }
      const game = run.contract.games.find((g) => g.id === plan.game),
        engine = await replay(run, game, seenImports);
      const request = engine.pending.find((r) => r.effectId === plan.effectId);
      check(
        request && e.requestSha256 === request.requestSha256 &&
          e.game === plan.game && e.effectId === plan.effectId &&
          e.lane === plan.lane && e.laneSeq === plan.laneSeq &&
          e.kind === plan.kind,
        "Imported effect mapping changed",
      );
      if (e.status !== "failed-execution") {
        try {
          const fields = parseAct(proof.text, request.spec);
          check(
            e.status === "accepted" &&
              canonical(e.fields) === canonical(fields),
            "Valid response was edited or rejected",
          );
        } catch (error) {
          if (!(error instanceof FormatFailure)) throw error;
          check(
            e.status === "invalid-format" &&
              canonical(e.errors) === canonical(error.errors),
            "Malformed response was accepted or changed",
          );
        }
      }
      seenImports.push(e);
    }
  }
  const games = [];
  for (const game of run.contract.games) {
    const engine = await replay(run, game);
    const ballots = ballotSummary(engine.timeline);
    const finished = !engine.pending.length;
    if (finished && !run.contract.purpose.startsWith("synthetic")) {
      const finals = ballots.filter((b) => b.type === "final_vote_reveal");
      check(
        finals.length === 1,
        "Completed Harbor game has no unique final vote",
      );
      check(
        engine.result?.winner === (finals[0].guilty >= 6 ? "a" : "b"),
        "Winner contradicts final ballots",
      );
    }
    const output = {
      ...game,
      status: finished ? "finished" : aborted ? "aborted" : "incomplete",
      ballots,
      accepted: run.imports.filter((e) =>
        e.game === game.id && e.status === "accepted"
      ).length,
      invalidFormat: run.imports.filter((e) =>
        e.game === game.id && e.status === "invalid-format"
      ).length,
      executionFailures: run.imports.filter((e) =>
        e.game === game.id && e.status === "failed-execution"
      ).length,
      pending: engine.pending.map((r) => ({
        effectId: r.effectId,
        batchId: r.batchId,
      })),
      result: engine.result,
    };
    games.push(output);
    atomic(path.join(run.dir, "replay", game.id + ".json"), {
      ...output,
      timeline: engine.timeline,
      deliveries: engine.deliveries,
      randoms: engine.randoms,
    });
  }
  const usage = {};
  let unknownUsage = 0;
  for (const e of run.imports) {
    if (e.proof.usage === null) unknownUsage++;
    else {for (const [k, v] of Object.entries(e.proof.usage)) {
        usage[k] = (usage[k] || 0) + v;
      }}
  }
  const completed = games.filter((g) => g.status === "finished").length;
  const unimported = run.plans.filter((p) =>
    !run.imports.some((e) => e.task === p.spawn.task_name)
  );
  const rootUsage = {}, rootResponses = new Set();
  for (
    const row of root.rows.filter((r) =>
      r.type === "token_usage_record" &&
      Date.parse(r.timestamp) >= Date.parse(run.contract.createdAt)
    )
  ) {
    const p = row.payload;
    if (!p.response_id || rootResponses.has(p.response_id)) continue;
    rootResponses.add(p.response_id);
    for (const [k, v] of Object.entries(p.usage || {})) {
      if (typeof v === "number") rootUsage[k] = (rootUsage[k] || 0) + v;
    }
  }
  const result = {
    schemaVersion: 3,
    generatedAt: now(),
    runDir: run.dir,
    runId: run.contract.runId,
    contractSha256: sha(run.contract),
    scriptSha256: run.contract.scriptSha256,
    root: run.contract.root,
    controllerFinalsBeforeCompletion: root.rows.filter((r) =>
      r.type === "response_item" && r.payload.type === "message" &&
      r.payload.role === "assistant" &&
      ["final", "final_answer"].includes(r.payload.phase) &&
      Date.parse(r.timestamp) >= Date.parse(run.contract.createdAt) &&
      (completed < games.length ||
        Date.parse(r.timestamp) <
          Date.parse(run.imports.at(-1)?.timestamp || now()))
    ).map((r) => ({ timestamp: r.timestamp })),
    actor: run.contract.actor,
    purpose: run.contract.purpose,
    mode: run.contract.mode,
    evidenceScope: offline
      ? "archived-prefix-only; later session activity not checked"
      : "live-runtime-and-archives",
    observableChecks: unimported.length ? "partial" : "passed",
    status: aborted
      ? "aborted"
      : completed === games.length && !unimported.length
      ? "complete"
      : "incomplete",
    fullNativeEquivalence: false,
    notObservable: [
      "Hidden model reasoning and provider-side inference details.",
      "Independent authenticity against a same-account adversary.",
      ...(run.imports.some((e) =>
          e.proof.dispatchText === "unverified-encrypted"
        )
        ? ["Exact encrypted spawn-message text."]
        : []),
    ],
    declaredGames: games.length,
    completedGames: completed,
    importedAttempts: run.imports.length,
    recoveredExecutionFailures: run.imports.filter((e) =>
      e.status === "failed-execution"
    ).map((e) => ({
      task: e.task,
      threadId: e.proof.threadId,
      reason: e.proof.reason,
    })),
    toolRepairs: run.events.filter((e) => e.type === "tools_repaired").map(
      (e) => ({
        reason: e.reason,
        revision: e.revision,
        timestamp: e.timestamp,
      }),
    ),
    activeTools: run.activeTools,
    unimportedTasks: unimported.map((p) => p.spawn.task_name),
    finalDistribution: games.filter((g) => g.status === "finished").map(
      (g) => ({
        game: g.id,
        seed: g.seed,
        ...g.ballots.find((b) => b.type === "final_vote_reveal"),
      }),
    ),
    actorUsage: {
      knownSubtotal: usage,
      unknownAttempts: unknownUsage,
      note:
        "Reasoning tokens are a subset of output, not extra tokens. Pending/unimported children are excluded.",
    },
    rootUsage: {
      usage: rootResponses.size ? rootUsage : null,
      modelResponses: rootResponses.size || null,
      scope:
        "Registered root session records from contract creation through this evidence snapshot; includes orchestration and any later root work, excludes pre-init work.",
    },
    games,
    fidelity: run.contract.fidelity,
  };
  if (!offline) atomic(path.join(run.dir, "root.jsonl"), root.bytes, true);
  atomic(path.join(run.dir, "report.json"), result);
  atomic(
    path.join(run.dir, "report.md"),
    `# Harbor workflow report\n\nStatus: ${result.status}; observable checks: ${result.observableChecks} (${result.evidenceScope}).\n\nDeclared games: ${games.length}; completed: ${completed}; imported attempts: ${run.imports.length}; unimported tasks: ${unimported.length}.\n\nRoot: ${result.root.model} / ${result.root.effort}; actors: gpt-5.6-luna / medium.\n\nNot a native-run equivalence or balance claim.\n\nNot observable:\n\n${
      result.notObservable.map((x) => "- " + x).join("\n")
    }\n\n| Game | Seed | Status | Final G / NG |\n| --- | --- | --- | --- |\n${
      games.map((g) => {
        const b = g.ballots.find((b) => b.type === "final_vote_reveal");
        return `| ${g.id} | ${g.seed} | ${g.status} | ${
          b ? `${b.guilty} / ${b.notGuilty}` : "—"
        } |`;
      }).join("\n")
    }\n`,
    true,
  );
  return result;
}

export async function withLock(dir, action) {
  const lock = path.join(path.resolve(dir), ".workflow-lock");
  // Serialize acquisition/reclamation so two recoverers cannot rename a new
  // owner's lock. Unknown/foreign/live owners remain locked; never kill them.
  const guard = lock + ".acquiring";
  fs.mkdirSync(guard);
  let fd;
  try {
    if (fs.existsSync(lock)) {
      const owner = json(lock);
      let dead = false;
      if (
        owner.hostname === os.hostname() && Number.isSafeInteger(owner.pid) &&
        owner.pid > 0 &&
        owner.rootId === process.env.CODEX_THREAD_ID
      ) {
        try {
          process.kill(owner.pid, 0);
        } catch (error) {
          dead = error.code === "ESRCH";
        }
      }
      if (dead) {
        // Verify original root and all frozen state before recovering its lock.
        loadRun(dir, { executing: true, allowToolChange: true });
        fs.renameSync(lock, lock + `.stale-${crypto.randomUUID()}`);
      }
    }
    fd = fs.openSync(lock, "wx", 0o600);
    fs.writeSync(
      fd,
      JSON.stringify({
        pid: process.pid,
        hostname: os.hostname(),
        rootId: process.env.CODEX_THREAD_ID,
        createdAt: now(),
      }),
    );
    fs.fsyncSync(fd);
  } finally {
    fs.rmdirSync(guard);
  }
  try {
    return await action();
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

async function cli() {
  const [command, ...args] = process.argv.slice(2), options = {};
  const allowed = command === "init"
    ? ["run-dir", "seeds", "slots", "expected-script-sha"]
    : ["import", "recover"].includes(command)
    ? ["run-dir", "task"]
    : command === "report" || command === "audit"
    ? ["run-dir", "offline"]
    : ["abort", "repair-tools"].includes(command)
    ? ["run-dir", "reason"]
    : ["run-dir"];
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, "");
    check(
      args[i].startsWith("--") && allowed.includes(key) && !(key in options),
      `Unknown or duplicate option ${args[i]}`,
    );
    if (key === "offline") options[key] = true;
    else {
      check(
        args[i + 1] && !args[i + 1].startsWith("--"),
        `Missing value for ${key}`,
      );
      options[key] = args[++i];
    }
  }
  check(
    [
      "init",
      "next",
      "step",
      "import",
      "recover",
      "repair-tools",
      "report",
      "audit",
      "abort",
      "status",
      "locate",
    ].includes(command) &&
      (options["run-dir"] || command === "locate"),
    "Usage: node runner.mjs locate | init|step|status|next|import|recover|repair-tools|report|audit|abort --run-dir ABSOLUTE_DIR",
  );
  let result;
  if (command === "locate") result = locate();
  else if (command === "status") result = await status(options["run-dir"]);
  else if (command === "init") {
    check(
      options.seeds,
      "init requires an explicit --seeds list; declare the entire batch before starting",
    );
    result = await initialize({
      dir: options["run-dir"],
      seeds: (options.seeds || "1").split(","),
      slots: Number(options.slots || 3),
      expectedScriptSha: options["expected-script-sha"],
    });
  } else {result = await withLock(options["run-dir"], async () => {
      // Legacy CLI name cannot accidentally bypass the step blocker gate.
      if (command === "next") return step(options["run-dir"]);
      if (command === "step") return step(options["run-dir"]);
      if (command === "recover") {
        check(options.task, "recover requires --task");
        return recover(options["run-dir"], options.task);
      }
      if (command === "repair-tools") {
        return repairTools(options["run-dir"], options.reason);
      }
      if (command === "import") {
        check(options.task, "import requires --task");
        return importReply(options["run-dir"], options.task);
      }
      if (command === "abort") {
        check(options.reason, "abort requires --reason");
        const run = loadRun(options["run-dir"], { executing: true });
        check(!run.aborted, "Already aborted");
        event(run, "aborted", { reason: options.reason });
        return { status: "aborted" };
      }
      try {
        const result = await report(options["run-dir"], {
          offline: options.offline,
        });
        atomic(path.join(options["run-dir"], "audit-result.json"), {
          status: result.status,
          observableChecks: result.observableChecks,
          evidenceScope: result.evidenceScope,
          generatedAt: result.generatedAt,
          successFinalAllowed: command === "audit" &&
            result.status === "complete" &&
            !options.offline && !result.purpose.startsWith("synthetic"),
          ledgerHead: loadRun(options["run-dir"]).previous,
        });
        result.successFinalAllowed = command === "audit" &&
          result.status === "complete" &&
          !options.offline && !result.purpose.startsWith("synthetic");
        return result;
      } catch (error) {
        atomic(path.join(options["run-dir"], "audit-result.json"), {
          status: error.status || "error",
          message: error.message,
          generatedAt: now(),
          previousReportIsStale: true,
        });
        throw error;
      }
    });}
  console.log(JSON.stringify(result, null, 2));
  if (
    command === "audit" &&
    (result.status !== "complete" || options.offline ||
      result.purpose.startsWith("synthetic"))
  ) process.exitCode = 2;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli().catch((error) => {
    console.error(
      JSON.stringify({
        status: error instanceof EvidenceError ? error.status : "error",
        message: error.message,
        ...(error.stdout
          ? { testOutputTail: String(error.stdout).slice(-8000) }
          : {}),
      }),
    );
    process.exitCode = 1;
  });
}
