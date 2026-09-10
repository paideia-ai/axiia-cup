import { sha } from "./engine.mjs";
import {
  childObservedAbsent,
  observedAbsent,
  requireEvidence as check,
} from "./provenance.mjs";
import { codeSignature, dispatches, matchesPlan } from "./transport.mjs";

// A fresh actor is allowed only for an independently observable execution failure.
// An ordinary final reply (including a disliked verdict) is never a retry reason.
export function unacknowledgedDispatchProof({ root, plan }) {
  const found = dispatches(root).filter((d) => matchesPlan(d, plan));
  check(found.length === 1, "Ambiguous or missing dispatch");
  const d = found[0];
  check(d.version === "v2" && !d.returned, "Dispatch has an acknowledgement");
  check(
    !root.rows.some((r) =>
      r.type === "response_item" &&
      r.payload.type === "function_call_output" && r.payload.call_id === d.id
    ),
    "Dispatch has an acknowledgement, even if its format is unknown",
  );
  const opaque = typeof d.args.message === "string" &&
    d.args.message.startsWith("gAAAAA");
  check(
    ["model", "reasoning_effort", "fork_turns"].every((k) =>
      d.args[k] === plan.spawn[k]
    ) &&
      (opaque || d.args.message === plan.spawn.message),
    "Unacknowledged dispatch differs from plan",
  );
  check(
    Date.parse(d.row.timestamp) >= Date.parse(plan.createdAt),
    "Dispatch predates plan",
  );
  check(
    observedAbsent(root, plan, Date.parse(d.row.timestamp)),
    "Unacknowledged dispatch needs two later unfiltered live-agent snapshots",
    "unverified",
  );
  return {
    threadId: `unacknowledged:${d.id}`,
    actorPath: plan.actorPath,
    text: "",
    replySha256: sha(""),
    inputSha256: plan.inputSha256,
    execution: "rejected",
    reason: "dispatch-unacknowledged",
    model: null,
    effort: null,
    usage: null,
    modelResponses: null,
    dispatchText: opaque ? "unverified-encrypted" : "observed",
    source: {
      path: root.filename,
      sha256: root.sha256,
      byteLength: root.bytes.length,
    },
    parentSource: {
      path: root.filename,
      sha256: root.sha256,
      byteLength: root.bytes.length,
    },
  };
}

export function failureProof({ root, child, plan }) {
  const found = dispatches(root).filter((d) => matchesPlan(d, plan));
  check(
    found.length === 1,
    "Cannot recover an ambiguous or unobserved dispatch",
  );
  const d = found[0];
  check(
    child.meta.parent_thread_id === root.meta.id,
    "Cannot recover a foreign child",
  );
  check(
    Date.parse(child.meta.timestamp) >= Date.parse(plan.createdAt),
    "Cannot recover a stale child",
  );
  if (d.version === "v1") {
    check(
      d.returned?.thread_id === child.meta.id,
      "Recovery child does not match acknowledgement",
    );
  } else {check(
      child.meta.agent_path === plan.actorPath &&
        (d.returned?.task_name === plan.actorPath ||
          [d.returned?.id, d.returned?.agent_id, d.returned?.thread_id]
            .includes(child.meta.id)),
      "Recovery identity is not proven",
    );}
  const terminal = child.rows.filter((r) =>
    r.type === "event_msg" &&
    ["task_complete", "turn_aborted"].includes(r.payload.type)
  ).at(-1);
  const absent = !terminal && childObservedAbsent(root, child, plan);
  check(
    terminal || absent,
    "Actor is still running or log is unflushed; wait for the same actor",
    "unverified",
  );
  const after = terminal
    ? child.rows.slice(child.rows.indexOf(terminal) + 1)
    : [];
  check(
    !after.some((r) =>
      r.type === "turn_context" ||
      (r.type === "event_msg" && r.payload.type === "task_started")
    ),
    "Actor resumed after completion; do not regenerate",
  );
  const cfg = child.rows.filter((r) => r.type === "turn_context").at(-1)
    ?.payload;
  const finals = child.rows.filter((r) =>
    r.type === "response_item" && r.payload.type === "message" &&
    r.payload.role === "assistant"
  );
  const text = finals.map((r) =>
    (r.payload.content || []).map((c) => c.text || "").join("")
  ).join("\n");
  const actorCalls = child.rows.filter((r) =>
    r.type === "response_item" &&
    ["function_call", "custom_tool_call"].includes(r.payload.type)
  );
  const outputs = child.rows.filter((r) =>
    r.type === "response_item" && r.payload.type === "custom_tool_call_output"
  ).flatMap((r) => Array.isArray(r.payload.output) ? r.payload.output : []);
  let reason = null;
  const wrongConfiguration = d.args.model !== plan.spawn.model ||
    d.args.reasoning_effort !== plan.spawn.reasoning_effort ||
    (d.version === "v2" && d.args.fork_turns !== plan.spawn.fork_turns) ||
    (cfg && (cfg.model !== plan.spawn.model ||
      (cfg.effort ?? cfg.reasoning_effort) !== plan.spawn.reasoning_effort));
  if (wrongConfiguration) reason = "misconfigured-actor";
  else if (text === "CONTEXT_READ_FAILED" && actorCalls.length === 0) {
    reason = "input-not-read";
  } else if (
    actorCalls.length === 1 &&
    codeSignature(actorCalls[0].payload.input) ===
      codeSignature(plan.readCode) &&
    !outputs.some((b) => b.text === plan.input) &&
    outputs.some((b) =>
      /Warning: truncated|tokens truncated|original token count:/i.test(
        b.text || "",
      )
    )
  ) reason = "input-truncated";
  else if (
    text === "CONTEXT_READ_FAILED" && actorCalls.length === 1 &&
    codeSignature(actorCalls[0].payload.input) ===
      codeSignature(plan.readCode) &&
    !outputs.some((b) => b.text === plan.input)
  ) reason = "input-read-failed";
  else if ((terminal?.payload.type === "turn_aborted" || absent) && !text) {
    reason = absent
      ? "registry-absent-without-reply"
      : "cancelled-without-reply";
  }
  check(
    reason,
    "Not a proven recoverable execution failure. Keep the actor and fix the adapter; do not regenerate",
  );
  return {
    threadId: child.meta.id,
    actorPath: plan.actorPath,
    text,
    replySha256: sha(text),
    inputSha256: sha(plan.input),
    execution: "rejected",
    reason,
    model: cfg?.model ?? null,
    effort: cfg?.effort ?? cfg?.reasoning_effort ?? null,
    dispatchText:
      typeof d.args.message === "string" && d.args.message.startsWith("gAAAAA")
        ? "unverified-encrypted"
        : "observed",
    usage: null,
    modelResponses: null,
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
