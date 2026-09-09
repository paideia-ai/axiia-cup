// Runtime adapters. Normalized records are an in-memory view of original logs;
// archives always contain the original bytes, never these derived records.
import { canonical } from "./engine.mjs";

export function codeSignature(code) {
  if (typeof code !== "string") return null;
  const body = code.replace(
    /^\s*\/\/ @exec: \{"max_output_tokens": 60000\}\s*\n/,
    "",
  );
  const tokens = body.match(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+|[^\s]/g,
  ) || [];
  return canonical(tokens);
}

export function v1Code(plan) {
  const args = {
    message: plan.spawn.message,
    model: plan.spawn.model,
    reasoning_effort: plan.spawn.reasoning_effort,
    fork_context: false,
  };
  return `const result = await tools.multi_agent_v1__spawn_agent(${
    JSON.stringify(args)
  });\ntext(result);`;
}

// Exact legacy wrapper observed in the stopped Luna trial; parse, never eval.
function legacyV1Code(plan) {
  const args = {
    task_name: plan.spawn.task_name,
    message: plan.spawn.message,
    model: plan.spawn.model,
    reasoning_effort: plan.spawn.reasoning_effort,
    fork_turns: plan.spawn.fork_turns,
    fork_context: false,
  };
  return `const task = {${
    Object.entries(args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(",")
  }};\nconst r = await tools.multi_agent_v1__spawn_agent(task);\ntext(JSON.stringify(r));`;
}

export function runtimeVersion(root) {
  return root.rows.filter((r) => r.type === "turn_context").at(-1)?.payload
    .multi_agent_version || root.meta.multi_agent_version || "v2";
}

export function dispatches(root) {
  const direct = root.rows.filter((r) =>
    r.type === "response_item" && r.payload.type === "function_call" &&
    String(r.payload.name).endsWith("spawn_agent")
  ).map((row) => {
    let args;
    try {
      args = JSON.parse(row.payload.arguments);
    } catch {
      args = {};
    }
    const ack = root.rows.find((r) =>
      r.type === "response_item" && r.payload.type === "function_call_output" &&
      r.payload.call_id === row.payload.call_id
    );
    let returned;
    try {
      returned = typeof ack?.payload.output === "string"
        ? JSON.parse(ack.payload.output)
        : ack?.payload.output;
    } catch {
      returned = null;
    }
    return { version: "v2", row, args, returned, id: row.payload.call_id };
  });
  const wrapped = root.rows.filter((r) =>
    r.type === "event_msg" && r.payload.type === "item_completed" &&
    r.payload.item?.type === "CollabAgentToolCall" &&
    r.payload.item.tool === "spawn_agent"
  ).map((row) => {
    const item = row.payload.item;
    return {
      version: "v1",
      row,
      args: {
        message: item.prompt,
        model: item.model,
        reasoning_effort: item.reasoning_effort,
      },
      returned: { thread_id: item.receiver_thread_ids?.[0] },
      id: item.id,
      status: item.status,
    };
  });
  return [...direct, ...wrapped];
}

export function matchesPlan(dispatch, plan) {
  return dispatch.version === "v1"
    ? dispatch.args.message === plan.spawn.message
    : dispatch.args.task_name === plan.spawn.task_name;
}

export function normalizeV1(root, child, plan) {
  if (runtimeVersion(root) !== "v1") return { root, child };
  const found = dispatches(root).filter((d) =>
    d.version === "v1" && matchesPlan(d, plan)
  );
  if (found.length !== 1) {
    throw Error("V1 dispatch missing or ambiguous; do not regenerate");
  }
  const d = found[0];
  if (d.returned.thread_id !== child.meta.id || d.status !== "completed") {
    throw Error("V1 dispatch acknowledgement differs from child");
  }
  const wrappers = root.rows.filter((r) =>
    r.type === "response_item" && r.payload.type === "custom_tool_call" &&
    [v1Code(plan), legacyV1Code(plan)].some((code) =>
      codeSignature(r.payload.input) === codeSignature(code)
    )
  );
  if (wrappers.length !== 1) {
    throw Error(
      "V1 fork_context=false wrapper is not verifiable; repair adapter, do not regenerate",
    );
  }
  // Inherited conversation would have extra user/assistant/task content before
  // the new task. Only ordinary AGENTS/environment bootstrap user text is allowed.
  const tasks = child.rows.filter((r) =>
    r.type === "response_item" && r.payload.type === "message" &&
    r.payload.role === "user" && r.payload.content?.map((c) =>
        c.text || ""
      ).join("") === plan.spawn.message
  );
  if (tasks.length !== 1) {
    throw Error("V1 exact task delivery is not verifiable");
  }
  const taskIndex = child.rows.indexOf(tasks[0]);
  for (const r of child.rows.slice(0, taskIndex)) {
    if (r.type !== "response_item") continue;
    const p = r.payload;
    if (
      ["function_call", "custom_tool_call", "agent_message"].includes(p.type) ||
      (p.type === "message" && p.role === "assistant")
    ) throw Error("V1 inherited conversation detected");
    if (
      p.type === "message" && p.role === "user" &&
      !p.content?.every((c) =>
        c.type === "input_text" &&
        /^\s*(# AGENTS\.md instructions|<environment_context>|<recommended_plugins>)/
          .test(c.text)
      )
    ) throw Error("V1 inherited user context detected");
  }
  const stamp = d.row.timestamp;
  if (
    Date.parse(wrappers[0].timestamp) < Date.parse(plan.createdAt) ||
    Date.parse(wrappers[0].timestamp) > Date.parse(stamp)
  ) throw Error("V1 wrapper and dispatch timing disagree");
  const extras = [
    {
      timestamp: stamp,
      type: "response_item",
      payload: {
        type: "function_call",
        name: "spawn_agent",
        call_id: d.id,
        arguments: JSON.stringify({ ...plan.spawn, ...d.args }),
      },
    },
    {
      timestamp: stamp,
      type: "response_item",
      payload: {
        type: "function_call_output",
        call_id: d.id,
        output: JSON.stringify({ thread_id: child.meta.id }),
      },
    },
  ];
  // Preserve follow-up evidence from both runtime shapes.
  for (const r of root.rows) {
    const item = r.payload?.item;
    if (
      r.type === "event_msg" && item?.type === "CollabAgentToolCall" &&
      ["send_input", "send_message", "resume_agent"].includes(item.tool) &&
      item.receiver_thread_ids?.includes(child.meta.id)
    ) {
      extras.push({
        type: "response_item",
        payload: {
          type: "function_call",
          name: "send_message",
          arguments: JSON.stringify({ target: child.meta.id }),
        },
      });
    }
  }
  return {
    root: { ...root, rows: [...root.rows, ...extras] },
    child: {
      ...child,
      meta: { ...child.meta, agent_path: plan.actorPath },
      rows: child.rows.map((r) =>
        r === tasks[0]
          ? {
            ...r,
            payload: {
              type: "agent_message",
              author: "/root",
              recipient: plan.actorPath,
              content: [{ type: "input_text", text: plan.spawn.message }],
            },
          }
          : r
      ),
    },
  };
}
