// Frozen at init and run against candidate code on EVERY tool repair.
// Keep this suite independent of runner's repair test to avoid recursive suites.
import test from "node:test";
import assert from "node:assert/strict";
import { observedAbsent, verifyActor } from "./provenance.mjs";

function sample() {
  const rootConfig = {
    threadId: "root-fixture",
    model: "gpt-5.6-sol",
    effort: "high",
  };
  const createdAt = "2026-01-01T00:00:00Z";
  const at = "2026-01-01T00:00:01Z";
  const plan = {
    actorPath: "/root/fixture",
    createdAt,
    input: "COMPLETE_PRIVATE_INPUT",
    readCode:
      'const result = await tools.exec_command({cmd:"cat input"}); text(result.output);',
    spawn: {
      task_name: "fixture",
      message: "Read only input",
      model: "gpt-5.6-luna",
      reasoning_effort: "medium",
      fork_turns: "none",
    },
  };
  const row = (payload, type = "response_item") => ({
    timestamp: at,
    type,
    payload,
  });
  const root = {
    meta: { id: rootConfig.threadId },
    rows: [
      row({
        model: rootConfig.model,
        effort: rootConfig.effort,
        multi_agent_version: "v2",
      }, "turn_context"),
      row({
        type: "function_call",
        name: "collaboration.spawn_agent",
        arguments: JSON.stringify(plan.spawn),
        call_id: "spawn",
      }),
      row({
        type: "function_call_output",
        call_id: "spawn",
        output: JSON.stringify({ task_name: plan.actorPath }),
      }),
    ],
    filename: "root",
    bytes: Buffer.from("root"),
    sha256: "root",
  };
  const child = {
    meta: {
      id: "child-fixture",
      parent_thread_id: rootConfig.threadId,
      agent_path: plan.actorPath,
      timestamp: at,
    },
    filename: "child",
    bytes: Buffer.from("child"),
    sha256: "child",
    rows: [
      row({ model: plan.spawn.model, effort: "medium" }, "turn_context"),
      row({
        type: "agent_message",
        author: "/root",
        recipient: plan.actorPath,
        content: [{ text: plan.spawn.message }],
      }),
      row({
        type: "custom_tool_call",
        name: "exec",
        input: plan.readCode,
        call_id: "read",
      }),
      row({
        type: "custom_tool_call_output",
        call_id: "read",
        output: [
          {
            type: "input_text",
            text: "Script completed\nWall time 0.1 seconds\nOutput:\n",
          },
          { type: "input_text", text: plan.input },
        ],
      }),
      row({
        type: "message",
        role: "assistant",
        phase: "final_answer",
        content: [{ text: "<token>DONE</token>" }],
      }),
      row(
        { type: "task_complete", last_agent_message: "<token>DONE</token>" },
        "event_msg",
      ),
    ],
  };
  return { rootConfig, root, child, plan, createdAt };
}

function probe(s, input, output = "<token>DONE</token>") {
  const stamp = s.child.rows[3].timestamp;
  s.child.rows.splice(4, 0, {
    timestamp: stamp,
    type: "response_item",
    payload: {
      type: "custom_tool_call",
      name: "exec",
      call_id: "probe",
      input,
    },
  }, {
    timestamp: stamp,
    type: "response_item",
    payload: {
      type: "custom_tool_call_output",
      call_id: "probe",
      output: [
        {
          type: "input_text",
          text: "Script completed\nWall time 0.1 seconds\nOutput:\n",
        },
        { type: "input_text", text: output },
      ],
    },
  });
}

test("protected provenance accepts only original isolated complete-input reply", () => {
  assert.equal(verifyActor(sample()).text, "<token>DONE</token>");
  for (
    const mutate of [
      (s) => {
        s.child.meta.parent_thread_id = "foreign";
      },
      (s) => {
        s.child.rows[0].payload.model = "gpt-5.6-terra";
      },
      (s) => {
        s.child.rows[0].payload.effort = "high";
      },
      (s) => {
        const p = s.root.rows[1].payload;
        p.arguments = JSON.stringify({ ...s.plan.spawn, fork_turns: "all" });
      },
      (s) => {
        s.child.rows[3].payload.output[1].text = "PARTIAL";
      },
      (s) => {
        s.child.rows[3].payload.output.push({
          type: "input_text",
          text: "LEAK",
        });
      },
      (s) => {
        s.child.rows.at(-1).payload.last_agent_message = "ALTERED";
      },
      (s) => {
        s.child.rows.splice(-1, 1);
      },
      (s) => {
        s.child.rows[2].payload.input +=
          '; text(await tools.exec_command({cmd:"cat other"}));';
      },
    ]
  ) {
    const s = sample();
    mutate(s);
    assert.throws(() => verifyActor(s));
  }
});

test("protected no-op grammar accepts literal echo/empty true, rejects Terra nested-tool loophole", () => {
  for (
    const code of [
      'const r = await tools.exec_command({cmd:"true"}); text("<token>DONE</token>");',
      'const result=await tools.exec_command({cmd: "true", max_output_tokens:1000});text("<token>DONE</token>");',
    ]
  ) {
    const s = sample();
    probe(s, code);
    assert.doesNotThrow(() => verifyActor(s));
  }
  const empty = sample();
  probe(
    empty,
    'const result = await tools.exec_command({cmd:"true",max_output_tokens:100}); text(result.output);',
    "",
  );
  assert.doesNotThrow(() => verifyActor(empty));
  for (
    const code of [
      'const r = await tools.exec_command({cmd:"true"}); text(await tools.exec_command({cmd:"cat other"}));',
      'const r = await tools.exec_command({cmd:"true"}); text((await tools.exec_command({cmd:"cat other"}), "<token>DONE</token>"));',
      'const r = await tools.exec_command({cmd:"cat other"}); text("<token>DONE</token>");',
      'const r = await tools.exec_command({cmd:"true"}); text(`<token>DONE</token>`);',
      'const r = await tools.exec_command({cmd:"true"}); text("different");',
    ]
  ) {
    const s = sample();
    probe(s, code);
    assert.throws(() => verifyActor(s), /unapproved extra/);
  }
  const twice = sample();
  probe(
    twice,
    'const r = await tools.exec_command({cmd:"true"}); text("<token>DONE</token>");',
  );
  probe(
    twice,
    'const r = await tools.exec_command({cmd:"true"}); text("<token>DONE</token>");',
  );
  assert.throws(() => verifyActor(twice));
  const reordered = sample();
  probe(
    reordered,
    'const r = await tools.exec_command({cmd:"true"}); text("<token>DONE</token>");',
  );
  reordered.child.rows.splice(0, 0, ...reordered.child.rows.splice(4, 2));
  assert.throws(() => verifyActor(reordered));
  const leaked = sample();
  probe(
    leaked,
    'const r = await tools.exec_command({cmd:"true"}); text("<token>DONE</token>");',
    "LEAK",
  );
  assert.throws(() => verifyActor(leaked));
});

test("protected absence requires two later unfiltered snapshots and rejects later presence", () => {
  const s = sample(), after = Date.parse("2026-01-01T00:00:02Z");
  function snapshot(second, args = {}, present = false) {
    const stamp = new Date(after + second * 1000).toISOString();
    s.root.rows.push({
      timestamp: stamp,
      type: "response_item",
      payload: {
        type: "function_call",
        name: "list_agents",
        namespace: "collaboration",
        arguments: JSON.stringify(args),
        call_id: String(second),
      },
    }, {
      timestamp: stamp,
      type: "response_item",
      payload: {
        type: "function_call_output",
        call_id: String(second),
        output: JSON.stringify({
          agents: [
            { agent_name: "/root" },
            ...(present ? [{ agent_name: s.plan.actorPath }] : []),
          ],
        }),
      },
    });
  }
  snapshot(1);
  assert.equal(observedAbsent(s.root, s.plan, after), false);
  snapshot(2, { path_prefix: "/root/other" });
  assert.equal(observedAbsent(s.root, s.plan, after), false);
  snapshot(3);
  assert.equal(observedAbsent(s.root, s.plan, after), true);
  snapshot(4, {}, true);
  assert.equal(observedAbsent(s.root, s.plan, after), false);
});
