import fs from "node:fs";
import path from "node:path";
import { sha } from "./engine.mjs";
import {
  codeSignature,
  dispatches,
  matchesPlan,
  normalizeV1,
  runtimeVersion,
} from "./transport.mjs";

export class EvidenceError extends Error {
  constructor(message, status = "invalid") {
    super(message);
    this.status = status;
  }
}
export function requireEvidence(condition, message, status = "invalid") {
  if (!condition) throw new EvidenceError(message, status);
}
export const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const isTool = (name, suffix) =>
  name === suffix || String(name).endsWith(`.${suffix}`) ||
  String(name).endsWith(`__${suffix}`);
const json = (value) => typeof value === "string" ? JSON.parse(value) : value;
const contentText = (content) =>
  (content || []).map((x) => x.text || "").join("");
const calls = (log) =>
  log.rows.filter((x) =>
    x.type === "response_item" &&
    ["function_call", "custom_tool_call"].includes(x.payload.type)
  );

// Registry absence is observable, not proof that an OS process died. Require two
// later, unfiltered snapshots separated in time; a later presence cancels them.
// Live audit repeats this check against the complete logs, including late replies.
export function observedAbsent(root, plan, after) {
  const snapshots = [];
  for (const call of calls(root)) {
    if (!isTool(call.payload.name, "list_agents")) continue;
    let args;
    try {
      args = json(call.payload.arguments || "{}");
    } catch {
      continue;
    }
    if (Object.keys(args).length) continue;
    const output = root.rows.find((r) =>
      r.type === "response_item" && r.payload.type === "function_call_output" &&
      r.payload.call_id === call.payload.call_id
    );
    if (!output || Date.parse(call.timestamp) <= after) continue;
    let data;
    try {
      data = json(output.payload.output);
    } catch {
      continue;
    }
    if (
      !Array.isArray(data.agents) ||
      !data.agents.some((a) => a.agent_name === "/root")
    ) continue;
    if (data.agents.some((a) => a.agent_name === plan.actorPath)) {
      snapshots.length = 0;
    } else {snapshots.push({
        id: call.payload.call_id,
        at: Date.parse(output.timestamp),
      });}
  }
  return new Set(snapshots.map((s) => s.id)).size >= 2 &&
    snapshots.at(-1).at - snapshots[0].at >= 1000;
}

export function childObservedAbsent(root, child, plan) {
  return observedAbsent(
    root,
    plan,
    Math.max(...child.rows.map((r) => Date.parse(r.timestamp))),
  );
}

// Accept a bounded, literal-only no-op AFTER the input read. Never evaluate
// source code or allow arbitrary expressions inside text(...), even if echoed
// output happens to match. This closes the Terra repair's nested-tool loophole.
function permittedNoop(child, call, readOutput, final) {
  if (
    !isTool(call.payload.name, "exec") ||
    child.rows.indexOf(call) <= child.rows.indexOf(readOutput) ||
    child.rows.indexOf(call) >= child.rows.indexOf(final)
  ) return false;
  const source = String(call.payload.input || "").replace(
    /^\s*\/\/\s*@exec:[^\r\n]*\r?\n/,
    "",
  ).trim();
  const match = source.match(
    /^const\s+(r|result)\s*=\s*await\s+tools\.exec_command\(\{\s*cmd\s*:\s*"true"\s*(?:,\s*max_output_tokens\s*:\s*(?:100|1000)\s*)?\}\)\s*;\s*text\(\s*("(?:\\.|[^"\\])*"|(?:r|result)\.output)\s*\)\s*;?$/s,
  );
  if (!match) return false;
  let expected;
  if (match[2] === `${match[1]}.output`) expected = "";
  else {
    try {
      expected = JSON.parse(match[2]);
    } catch {
      return false;
    }
    if (expected !== contentText(final.payload.content)) return false;
  }
  const outputs = child.rows.filter((r) =>
    r.type === "response_item" &&
    r.payload.type === "custom_tool_call_output" &&
    r.payload.call_id === call.payload.call_id
  );
  if (
    outputs.length !== 1 ||
    child.rows.indexOf(outputs[0]) <= child.rows.indexOf(call) ||
    child.rows.indexOf(outputs[0]) >= child.rows.indexOf(final)
  ) return false;
  const blocks = outputs[0].payload.output;
  return Array.isArray(blocks) && blocks.length === 2 &&
    blocks.every((b) => ["input_text", "text"].includes(b.type)) &&
    /^Script completed\nWall time [^\n]+\nOutput:\n$/.test(blocks[0].text) &&
    blocks[1].text === expected;
}

// Only complete JSONL records are read. A concurrent partial append is not evidence.
export function readLog(filename) {
  const data = fs.readFileSync(filename);
  const end = data.lastIndexOf(10) + 1;
  requireEvidence(end > 0, "Session log is not flushed yet", "unverified");
  const bytes = data.subarray(0, end);
  let rows;
  try {
    rows = bytes.toString("utf8").split("\n").filter(Boolean).map(JSON.parse);
  } catch {
    throw new EvidenceError("Malformed session log");
  }
  requireEvidence(rows[0]?.type === "session_meta", "Missing session metadata");
  return {
    filename: path.resolve(filename),
    rows,
    meta: rows[0].payload,
    bytes,
    sha256: sha(bytes),
  };
}

export function findLog(sessions, threadId) {
  requireEvidence(
    uuidPattern.test(threadId),
    "Expected a real thread UUID, not an actor alias",
  );
  const matches = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      // Do not follow symlinks out of the runtime-owned session tree.
      if (item.isDirectory()) walk(path.join(dir, item.name));
      else if (item.isFile() && item.name.endsWith(`-${threadId}.jsonl`)) {
        matches.push(path.join(dir, item.name));
      }
    }
  }
  walk(sessions);
  requireEvidence(
    matches.length === 1,
    matches.length
      ? "Ambiguous session identity"
      : "Session log not available yet",
    "unverified",
  );
  const log = readLog(matches[0]);
  requireEvidence(
    log.meta.id === threadId,
    "Filename and session identity disagree",
  );
  return log;
}

export function rootConfiguration(log, at = Infinity) {
  requireEvidence(
    !log.meta.parent_thread_id && !log.meta.agent_path,
    "Workflow must run in a root session",
  );
  const turns = log.rows.filter((x) =>
    x.type === "turn_context" && Date.parse(x.timestamp) <= at
  );
  const latest = turns.at(-1)?.payload;
  requireEvidence(
    latest?.model,
    "Root model configuration not observable",
    "unverified",
  );
  return {
    threadId: log.meta.id,
    model: latest.model,
    effort: latest.effort ?? latest.reasoning_effort ?? null,
  };
}

export function verifyActor(
  { root, child, plan, rootConfig, createdAt, allowOpaque = false },
) {
  const identitySource = runtimeVersion(root) === "v1"
    ? "runtime-uuid-and-root-wrapper; actorPath is reserved logical name"
    : "runtime-agent-path-and-parent";
  ({ root, child } = normalizeV1(root, child, plan));
  requireEvidence(
    child.meta.parent_thread_id === rootConfig.threadId,
    "Actor is not a direct child of the registered root",
  );
  requireEvidence(
    child.meta.agent_path === plan.actorPath,
    "Actor path does not match the reserved task",
  );
  requireEvidence(
    Date.parse(child.meta.timestamp) >= Date.parse(plan.createdAt),
    "Actor predates this attempt",
  );

  const spawns = calls(root).filter((x) =>
    isTool(x.payload.name, "spawn_agent")
  ).filter((x) => {
    try {
      return json(x.payload.arguments).task_name === plan.spawn.task_name;
    } catch {
      return false;
    }
  });
  requireEvidence(
    spawns.length === 1,
    "Exactly one real spawn must exist for the reserved task",
    spawns.length ? "invalid" : "unverified",
  );
  const spawn = spawns[0], args = json(spawn.payload.arguments);
  const currentRoot = rootConfiguration(root, Date.parse(spawn.timestamp));
  requireEvidence(
    currentRoot.model === rootConfig.model &&
      currentRoot.effort === rootConfig.effort,
    "Root model configuration changed",
  );
  requireEvidence(
    Date.parse(spawn.timestamp) >= Date.parse(plan.createdAt) &&
      Date.parse(spawn.timestamp) >= Date.parse(createdAt),
    "Spawn predates the frozen contract",
  );
  for (const key of ["model", "reasoning_effort", "fork_turns"]) {
    requireEvidence(
      args[key] === plan.spawn[key],
      `Spawn ${key} differs from the contract`,
    );
  }
  const returned = root.rows.find((x) =>
    x.type === "response_item" && x.payload.type === "function_call_output" &&
    x.payload.call_id === spawn.payload.call_id
  );
  requireEvidence(
    returned,
    "Spawn acknowledgement not flushed yet",
    "unverified",
  );
  let acknowledgement;
  try {
    acknowledgement = json(returned.payload.output);
  } catch {
    throw new EvidenceError(
      "Unknown spawn acknowledgement format",
      "unverified",
    );
  }
  requireEvidence(
    [acknowledgement.task_name, acknowledgement.agent_id, acknowledgement.id]
      .includes(plan.actorPath) ||
      [acknowledgement.agent_id, acknowledgement.id, acknowledgement.thread_id]
        .includes(child.meta.id),
    "Spawn acknowledgement does not identify this child",
  );

  const opaque = typeof args.message === "string" &&
    args.message.startsWith("gAAAAA");
  if (!opaque) {
    requireEvidence(
      args.message === plan.spawn.message,
      "Spawn message was changed or contains extra instructions",
    );
  }
  if (opaque && !allowOpaque) {
    throw new EvidenceError(
      "Runtime encrypted the spawn message; exact dispatch text cannot be verified",
      "unverified",
    );
  }

  // A followup/message can contaminate even a correctly forked initial task.
  for (const row of calls(root)) {
    if (
      !["send_message", "followup_task"].some((n) =>
        isTool(row.payload.name, n)
      )
    ) continue;
    let a;
    try {
      a = json(row.payload.arguments);
    } catch {
      continue;
    }
    requireEvidence(
      ![plan.actorPath, plan.spawn.task_name, child.meta.id].includes(a.target),
      "Root sent additional instructions to the actor",
    );
  }
  const tasks = child.rows.filter((x) =>
    x.type === "response_item" && x.payload.type === "agent_message"
  );
  requireEvidence(
    tasks.length === 1,
    "Actor has extra tasks or cross-agent messages",
  );
  requireEvidence(
    tasks[0].payload.author === "/root" &&
      tasks[0].payload.recipient === plan.actorPath,
    "Unexpected task sender or recipient",
  );
  if (opaque) {
    requireEvidence(
      tasks[0].payload.content.some((x) =>
        x.encrypted_content === args.message
      ),
      "Parent and child encrypted task envelopes disagree",
    );
  } else {
    const delivered = contentText(tasks[0].payload.content);
    const envelope =
      `Message Type: NEW_TASK\nTask name: ${plan.actorPath}\nSender: /root\nPayload:\n`;
    requireEvidence(
      delivered === plan.spawn.message ||
        delivered === envelope + plan.spawn.message,
      "Child task content differs from dispatch",
    );
  }
  const taskIndex = child.rows.indexOf(tasks[0]);
  requireEvidence(
    !child.rows.slice(taskIndex + 1).some((x) =>
      (x.type === "response_item" && x.payload.type === "message" &&
        ["user", "developer", "system"].includes(x.payload.role)) ||
      (x.type === "event_msg" && x.payload.type === "user_message")
    ),
    "Additional instructions arrived after actor dispatch",
  );

  const turns = child.rows.filter((x) => x.type === "turn_context");
  requireEvidence(turns.length === 1, "Actor was reused or has multiple turns");
  const cfg = turns[0].payload;
  requireEvidence(
    cfg.model === plan.spawn.model &&
      (cfg.effort ?? cfg.reasoning_effort) === plan.spawn.reasoning_effort,
    "Actual actor model or effort differs from the contract",
  );
  requireEvidence(
    !child.rows.some((x) => x.type === "compacted"),
    "Actor context was compacted",
  );
  const actorCalls = calls(child);
  requireEvidence(
    actorCalls.length >= 1 && actorCalls.length <= 2 &&
      actorCalls.every((call) => isTool(call.payload.name, "exec")),
    "Actor must make exactly the permitted input-file read",
  );
  requireEvidence(
    codeSignature(actorCalls[0].payload.input) === codeSignature(plan.readCode),
    "Actor executed an unapproved command or read",
  );
  const outputs = child.rows.filter((x) =>
    x.type === "response_item" &&
    x.payload.type === "custom_tool_call_output" &&
    x.payload.call_id === actorCalls[0].payload.call_id
  );
  requireEvidence(
    outputs.length === 1,
    "Input read result not available",
    "unverified",
  );
  const blocks = outputs[0].payload.output;
  requireEvidence(
    Array.isArray(blocks),
    "Unsupported input read output format",
    "unverified",
  );
  requireEvidence(
    blocks.every((x) => ["input_text", "text"].includes(x.type)),
    "Unexpected non-text input read content",
  );
  const texts = blocks.filter((x) =>
    x.type === "input_text" || x.type === "text"
  ).map((x) => x.text);
  requireEvidence(
    !texts.some((x) =>
      /Warning: truncated|tokens truncated|original token count:/i.test(x)
    ),
    "Actor input was truncated",
  );
  requireEvidence(
    texts.filter((x) => x === plan.input).length === 1,
    "Actor did not receive the complete frozen input",
  );
  requireEvidence(
    texts.every((x) =>
      x === plan.input ||
      /^Script completed\nWall time [^\n]+\nOutput:\n$/.test(x)
    ),
    "Actor read output contains unexpected extra context",
  );

  const finals = child.rows.filter((x) =>
    x.type === "response_item" && x.payload.type === "message" &&
    x.payload.role === "assistant"
  );
  requireEvidence(
    finals.length === 1 &&
      ["final", "final_answer"].includes(finals[0].payload.phase),
    "Actor must return exactly one final reply without commentary",
  );
  const text = contentText(finals[0].payload.content);
  requireEvidence(
    actorCalls.length === 1 ||
      permittedNoop(child, actorCalls[1], outputs[0], finals[0]),
    "Actor executed an unapproved extra tool call",
  );
  const complete = child.rows.filter((x) =>
    x.type === "event_msg" && x.payload.type === "task_complete"
  );
  requireEvidence(
    complete.length === 1 ||
      (complete.length === 0 && childObservedAbsent(root, child, plan)),
    "Actor has not completed or log is not flushed",
    "unverified",
  );
  requireEvidence(
    !complete.length || complete[0].payload.last_agent_message === text,
    "Completion and final reply disagree",
  );
  requireEvidence(
    Date.parse(finals[0].timestamp) >= Date.parse(outputs[0].timestamp),
    "Reply preceded the input read",
  );
  requireEvidence(
    text !== "CONTEXT_READ_FAILED",
    "Actor reported input transport failure",
  );

  const usageRows = child.rows.filter((x) => x.type === "token_usage_record");
  const seen = new Set();
  const usage = {};
  for (const row of usageRows) {
    const p = row.payload;
    if (!p.response_id || seen.has(p.response_id)) continue;
    seen.add(p.response_id);
    for (const [key, value] of Object.entries(p.usage || {})) {
      if (typeof value === "number") usage[key] = (usage[key] || 0) + value;
    }
  }
  return {
    threadId: child.meta.id,
    actorPath: child.meta.agent_path,
    text,
    replySha256: sha(text),
    inputSha256: sha(plan.input),
    execution: "verified",
    completionEvidence: complete.length
      ? "task_complete"
      : "two-later-registry-absence-observations",
    identitySource,
    dispatchText: opaque ? "unverified-encrypted" : "verified",
    model: cfg.model,
    effort: cfg.effort ?? cfg.reasoning_effort,
    usage: usageRows.length ? usage : null,
    modelResponses: usageRows.length ? seen.size : null,
    source: {
      path: child.filename,
      sha256: child.sha256,
      byteLength: child.bytes.length,
    },
    parentSource: {
      path: root.filename,
      sha256: root.sha256,
      byteLength: root.bytes.length,
    },
  };
}

// Locate only candidate children created since this reservation; never infer identity
// from an operator-supplied alias. The metadata supplies the actual thread UUID.
export function findChild(sessions, plan, parentId, root = null) {
  if (root && runtimeVersion(root) === "v1") {
    const ds = dispatches(root).filter((d) => matchesPlan(d, plan));
    requireEvidence(
      ds.length === 1,
      "V1 dispatch not available or ambiguous",
      ds.length ? "invalid" : "unverified",
    );
    requireEvidence(
      ds[0].returned?.thread_id,
      "V1 child acknowledgement not flushed",
      "unverified",
    );
    const child = findLog(sessions, ds[0].returned.thread_id);
    requireEvidence(
      child.meta.parent_thread_id === parentId,
      "V1 child has wrong parent",
    );
    return child;
  }
  const found = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const filename = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(filename);
        continue;
      }
      if (
        !item.isFile() || !item.name.endsWith(".jsonl")
      ) continue;
      const fd = fs.openSync(filename, "r");
      const prefix = Buffer.alloc(32768);
      let count;
      try {
        count = fs.readSync(fd, prefix);
      } finally {
        fs.closeSync(fd);
      }
      const end = prefix.subarray(0, count).indexOf(10);
      if (end < 0) continue;
      let row;
      try {
        row = JSON.parse(prefix.subarray(0, end).toString());
      } catch {
        continue;
      }
      if (
        row.type === "session_meta" &&
        row.payload.agent_path === plan.actorPath &&
        row.payload.parent_thread_id === parentId
      ) found.push(filename);
    }
  }
  walk(sessions);
  requireEvidence(
    found.length === 1,
    found.length
      ? "Task has multiple child sessions"
      : "Child log not available yet",
    found.length ? "invalid" : "unverified",
  );
  const child = readLog(found[0]);
  requireEvidence(
    uuidPattern.test(child.meta.id),
    "Child metadata has no real thread UUID",
  );
  return child;
}

export function checkArchivedPrefix(live, archive, digest) {
  const bytes = fs.readFileSync(archive);
  requireEvidence(
    sha(bytes) === digest,
    "Archived execution evidence was modified",
  );
  requireEvidence(
    live.bytes.subarray(0, bytes.length).equals(bytes),
    "Runtime session no longer matches archived evidence",
  );
}
