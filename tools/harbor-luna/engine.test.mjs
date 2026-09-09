import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  actSpec,
  Engine,
  instruction,
  parseAct,
  repairInstruction,
} from "./engine.mjs";

const source = fs.readFileSync(
  process.env.HARBOR_TEST_SOURCE || new URL(
    "../../v2/scenarios/scenarios/legal-harbor-murder-jury/script.js",
    import.meta.url,
  ),
  "utf8",
);
const sides = {
  a: { model: "gpt-5.6-luna", prompt: "" },
  b: { model: "gpt-5.6-luna", prompt: "" },
};
const raw = (fields) =>
  Object.entries(fields).map(([k, v]) => `<${k}>${v}</${k}>`).join("\n");
const textOf = (request) =>
  request.session.messages.map((x) => x.text).join("\n");
function response(request, mode) {
  const names = request.spec.fields.map((x) => x.name),
    last = request.session.messages.at(-1).text;
  if (names.includes("choice")) {
    const menu = [...last.matchAll(/^(\d+)：(.*)$/gm)];
    let selected;
    if (mode === "actions") {
      selected = menu.find((x) => x[2].includes("秘密意向")) || menu.find((x) =>
        x[2].includes(`与 ${request.lane === "a" ? "陈岚" : "魏笙"}`)
      ) || menu.find((x) =>
        x[2].includes("复核")
      );
    }
    if (mode === "motion") {
      selected = menu.find((x) => x[2].includes("提前终局"));
    }
    return raw({ choice: (selected || menu.at(-1))[1] });
  }
  if (names.includes("speech")) {
    return raw({
      speech: request.spec.prompt.includes("公开发言")
        ? `PUBLIC_${request.lane}_${request.laneSeq}。`
        : `PRIVATE_CANARY_${request.lane}_${request.laneSeq}。`,
    });
  }
  if (names.includes("procedureVote")) {
    return raw({
      procedureVote:
        request.lane.startsWith("j") && Number(request.lane.slice(1)) <= 5
          ? "END_NOW"
          : "CONTINUE",
      reason: `PROCEDURE_CANARY_${request.lane}_${request.laneSeq}`,
    });
  }
  return raw(
    Object.fromEntries(
      request.spec.fields.map((field) => [
        field.name,
        field.name === "verdict"
          ? (Number(request.lane.slice(1)) <= 4 ? "GUILTY" : "NOT_GUILTY")
          : field.options[0] ||
            `BALLOT_CANARY_${request.lane}_${request.laneSeq}`,
      ]),
    ),
  );
}
async function fixture(mode, seed = "1") {
  const journal = [], attempts = [];
  for (let step = 0; step < 220; step++) {
    const engine = await new Engine({ source, sides, journal, seed }).run();
    if (engine.result) return { engine, journal, attempts };
    assert.ok(engine.pending.length);
    for (const request of [...engine.pending].reverse()) {
      const text = response(request, mode);
      attempts.push(request);
      journal.push({
        lane: request.lane,
        seq: request.laneSeq,
        kind: "act",
        requestSha256: request.requestSha256,
        payload: {
          text,
          fields: parseAct(text, request.spec),
          reasoning: null,
        },
      });
    }
  }
  throw Error("Synthetic fixture did not terminate");
}

test("native-style tag order, scanner, errors and repair wording", () => {
  const spec = actSpec({
    fields: {
      reason: { long: true },
      verdict: { enum: ["GUILTY", "NOT_GUILTY"] },
    },
  });
  assert.ok(
    instruction(spec).endsWith(
      "<reason>可以写多行</reason>\n<verdict>必须是以下之一：GUILTY / NOT_GUILTY</verdict>",
    ),
  );
  assert.deepEqual(
    parseAct(
      "outside text\n<reason> x </reason><verdict>GUILTY</verdict>",
      spec,
    ),
    { reason: "x", verdict: "GUILTY" },
  );
  assert.throws(
    () => parseAct("<reason> </reason><verdict>GUILTY</verdict>", spec),
    /内容为空/,
  );
  assert.throws(
    () =>
      parseAct(
        "<reason>x</reason><verdict>GUILTY</verdict><verdict>NOT_GUILTY</verdict>",
        spec,
      ),
    /出现了 2 次/,
  );
  assert.throws(
    () => parseAct("<reason>x</reason><verdict>MAYBE</verdict>", spec),
    /不在允许范围/,
  );
  assert.ok(
    repairInstruction(["缺少 <reason> 标签"]).includes(
      "请保持你的判断不变，只修复标签格式与取值",
    ),
  );
});

test("five-round games preserve fixed votes, speaker coverage, turn order and sealed final ballots", async () => {
  for (const seed of ["1", "2", "3", "4", "5"]) {
    const { engine, attempts } = await fixture("full", seed);
    const speeches = engine.timeline.filter((x) =>
      x.event.type === "jury_speech"
    ).map((x) => x.event.actor);
    assert.equal(speeches.length, 25);
    assert.equal(new Set(speeches.filter((x) => x.startsWith("j"))).size, 9);
    for (let round = 0; round < 5; round++) {
      assert.deepEqual(
        speeches.slice(round * 5, round * 5 + 2),
        round % 2 ? ["b", "a"] : ["a", "b"],
      );
    }
    const mid = engine.timeline.filter((x) =>
      x.event.type === "observer_action_decision" &&
      x.event.window === "mid-round"
    ).map((x) => x.event.player);
    assert.deepEqual(mid, Array.from({ length: 5 }, () => ["b", "a"]).flat());
    const reveal = engine.timeline.find((x) =>
      x.event.type === "final_vote_reveal"
    ).event;
    assert.equal(reveal.guiltyVotes, 5);
    assert.equal(reveal.notGuiltyVotes, 6);
    assert.equal(reveal.threshold, 6);
    assert.equal(reveal.endReason, "five-rounds");
    assert.deepEqual(
      reveal.votes.slice(0, 2).map((x) => [x.juror, x.verdict]),
      [["a", "GUILTY"], ["b", "NOT_GUILTY"]],
    );
    const finals = attempts.filter((x) =>
      x.spec.fields.some((f) => f.name === "verdict")
    );
    assert.equal(finals.length, 9);
    assert.equal(new Set(finals.map((r) => r.batchId)).size, 1);
    assert.ok(finals[0].batchId);
    for (const request of finals) {
      for (const lane of engine.agents.keys()) {
        if (lane !== request.lane) {
          assert.ok(
            !textOf(request).includes(`BALLOT_CANARY_${lane}`),
          );
        }
      }
    }
  }
});

test("poll visibility, private chat isolation and finite action resources", async () => {
  const { engine, attempts } = await fixture("actions");
  const events = engine.timeline.map((x) => x.event);
  assert.equal(
    events.filter((x) => x.type === "observer_secret_poll").length,
    4,
  );
  assert.equal(
    events.filter((x) => x.type === "observer_private_chat").length,
    2,
  );
  assert.equal(events.filter((x) => x.type === "evidence_review").length, 4);
  for (const [lane, agent] of engine.agents) {
    const aggregates = agent.session.messages.filter((x) =>
      x.role === "user" && x.text.startsWith("【私密投票结果】")
    );
    assert.equal(aggregates.length, lane.startsWith("j") ? 4 : 2);
    const text = agent.session.messages.map((x) => x.text).join("\n");
    if (!["a", "j01"].includes(lane)) {
      assert.ok(
        !text.includes("PRIVATE_CANARY_a_") &&
          !text.includes("PRIVATE_CANARY_j01_"),
      );
    }
    if (!["b", "j02"].includes(lane)) {
      assert.ok(
        !text.includes("PRIVATE_CANARY_b_") &&
          !text.includes("PRIVATE_CANARY_j02_"),
      );
    }
  }
  const polls = attempts.filter((x) => x.batchId);
  assert.equal(polls.length, 45); // four nine-way polls plus nine-way final vote
  for (const request of polls) {
    for (const lane of engine.agents.keys()) {
      if (lane.startsWith("j") && lane !== request.lane) {
        assert.ok(!textOf(request).includes(`BALLOT_CANARY_${lane}`));
      }
    }
  }
  for (const chat of events.filter((x) => x.type === "observer_private_chat")) {
    assert.equal(chat.messages.length, 6);
    assert.deepEqual(chat.messages.map((x) => x.speaker), [
      chat.mover,
      chat.target,
      chat.mover,
      chat.target,
      chat.mover,
      chat.target,
    ]);
  }
});

test("early motion seals procedure choices, reveals after collection, and ends remaining rounds", async () => {
  const { engine, attempts } = await fixture("motion");
  const events = engine.timeline.map((x) => x.event),
    motion = events.find((x) => x.type === "early_motion_result");
  assert.equal(motion.endNowVotes, 6);
  assert.equal(motion.passed, true);
  assert.equal(events.filter((x) => x.type === "jury_speech").length, 5);
  assert.equal(
    events.find((x) => x.type === "final_vote_reveal").endReason,
    "early-motion",
  );
  const procedure = attempts.filter((x) =>
    x.spec.fields.some((f) => f.name === "procedureVote")
  );
  assert.deepEqual(procedure.map((x) => x.lane), [
    "a",
    "j01",
    "j02",
    "j03",
    "j04",
    "j05",
    "j06",
    "j07",
    "j08",
    "j09",
  ]);
  for (const request of procedure) {
    assert.ok(!textOf(request).includes("PROCEDURE_CANARY_"));
  }
  for (
    const request of attempts.filter((x) =>
      x.spec.fields.some((f) => f.name === "verdict")
    )
  ) assert.ok(textOf(request).includes("PROCEDURE_CANARY_j01"));
});

test("partially imported nine-way poll preserves every unreplied full context and no early aggregate", async () => {
  const base = await new Engine({ source, sides }).run(),
    first = base.pending[0],
    text = raw({ choice: "1" });
  const journal = [{
    lane: "a",
    seq: 0,
    kind: "act",
    payload: { text, fields: parseAct(text, first.spec), reasoning: null },
  }];
  const all = await new Engine({ source, sides, journal }).run();
  assert.equal(all.pending.length, 9);
  const original = new Map(
    all.pending.map((x) => [x.effectId, x.contextSha256]),
  );
  for (const request of all.pending.slice(0, 3).reverse()) {
    const text = response(request);
    journal.push({
      lane: request.lane,
      seq: request.laneSeq,
      kind: "act",
      payload: { text, fields: parseAct(text, request.spec), reasoning: null },
    });
  }
  const resumed = await new Engine({ source, sides, journal }).run();
  assert.equal(resumed.pending.length, 6);
  for (const request of resumed.pending) {
    assert.equal(request.contextSha256, original.get(request.effectId));
    assert.ok(!textOf(request).includes("BALLOT_CANARY_"));
  }
  assert.equal(
    resumed.timeline.filter((x) => x.event.type === "observer_secret_poll")
      .length,
    0,
  );
});

test("unsupported engine APIs and duplicate private lanes fail instead of silently approximating", async () => {
  await assert.rejects(
    () =>
      new Engine({
        source:
          `async function main(){ const a=game.agent('a',{model:'x'}); await game.parallelAct([{agent:a,spec:{}},{agent:a,spec:{}}]); }`,
      }).run(),
    /distinct declared/,
  );
  await assert.rejects(
    () =>
      new Engine({
        source: `async function main(){ return game.say('not-supported'); }`,
      }).run(),
    /not a function/,
  );
});
