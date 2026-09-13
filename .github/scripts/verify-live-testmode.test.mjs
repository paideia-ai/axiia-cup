import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createLifecycle,
  parseArguments,
  readRelease,
  sourcePath,
  validateSource,
} from "./verify-live-testmode.mjs";

const releaseSHA = "d62a7b47ad1c4430fda2137675d8f959605fd7ec";
const source = {
  sourceSha256:
    "c7fd05b72e85849294a0a4fed4b52348b74ec9077ba3344e294b23c6a06c2c35",
  sourceCommit: "0d70e9df97ea418a78eeada51d6d051b3651ee2e",
  sourceRevision: "286c97c106cc0590f6e466f78a4ca234b896dba4",
  capturedAt: "2026-09-09",
};

async function temporaryDirectory(test) {
  const directory = Deno.makeTempDirSync({ prefix: "live-guide-contract-" });
  try {
    await test(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function readReport(directory) {
  return JSON.parse(
    fs.readFileSync(path.join(directory, "report.json"), "utf8"),
  );
}

Deno.test("explicit run requires a full SHA, release checkout, and new absolute output", async () => {
  await temporaryDirectory((directory) => {
    const output = path.join(directory, "new-evidence");
    const args = [
      "--run",
      "--expected-sha",
      releaseSHA,
      "--release-dir",
      directory,
      "--output-dir",
      output,
    ];
    assert.deepEqual(parseArguments(args), {
      expectedSHA: releaseSHA,
      releaseDir: directory,
      out: output,
    });
    assert.throws(() => parseArguments(args.slice(1)));
    assert.throws(() => parseArguments([...args, "--skip-assets"]));
    assert.throws(() => parseArguments(args.with(2, releaseSHA.slice(0, 7))));
    assert.throws(() => parseArguments(args.with(2, "g".repeat(40))));
    assert.throws(() => parseArguments(args.with(4, "relative-release")));
    assert.throws(() => parseArguments(args.with(6, `${directory}/../other`)));
    assert.throws(() => parseArguments(args.with(6, directory)), /must be new/);
    assert.equal(
      fs.existsSync(output),
      false,
      "Validation creates no evidence directory",
    );
  });
});

Deno.test("release metadata validates separate live source and historical audit provenance", () => {
  assert.deepEqual(validateSource(source), {
    sourceHash: source.sourceSha256,
    sourceCommit: source.sourceCommit,
    historicalRevision: source.sourceRevision,
    historicalCapturedAt: source.capturedAt,
  });
  for (const value of [null, [], "source"]) {
    assert.throws(() => validateSource(value));
  }
  for (const field of Object.keys(source)) {
    const missing = { ...source };
    delete missing[field];
    assert.throws(() => validateSource(missing), field);
    assert.throws(() => validateSource({ ...source, [field]: 42 }), field);
  }
  for (const capturedAt of ["2026-02-30", "2026-13-01", "yesterday"]) {
    assert.throws(() => validateSource({ ...source, capturedAt }));
  }
  assert.throws(() =>
    validateSource({ ...source, sourceCommit: releaseSHA.slice(0, 7) })
  );
  assert.throws(() =>
    validateSource({ ...source, sourceSha256: "a".repeat(63) })
  );
});

Deno.test("release source is read only after exact HEAD validation and cannot be a symlink", async () => {
  await temporaryDirectory(async (directory) => {
    let headReads = 0;
    const head = () => {
      headReads++;
      return Promise.resolve(releaseSHA);
    };
    await assert.rejects(
      readRelease(directory, "a".repeat(40), head),
      /HEAD differs/,
    );
    assert.equal(headReads, 1);
    const file = path.join(directory, sourcePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(source));
    assert.deepEqual(
      await readRelease(directory, releaseSHA, head),
      validateSource(source),
    );
    fs.writeFileSync(file, "{bad-json");
    await assert.rejects(readRelease(directory, releaseSHA, head), SyntaxError);
    fs.writeFileSync(
      file,
      JSON.stringify({ ...source, capturedAt: "not-a-date" }),
    );
    await assert.rejects(
      readRelease(directory, releaseSHA, head),
      /capture date/,
    );
    const linkedSource = path.join(directory, "linked-source.json");
    fs.renameSync(file, linkedSource);
    fs.symlinkSync(linkedSource, file);
    await assert.rejects(
      readRelease(directory, releaseSHA, head),
      /regular file/,
    );
  });
});

Deno.test("initial evidence and immediately rejected response bodies are durable without delayed handlers", async () => {
  await temporaryDirectory(async (directory) => {
    const report = {
      state: "running",
      phase: "navigation",
      browserClosed: false,
    };
    let failureSignals = 0;
    const lifecycle = createLifecycle(directory, report, {
      onFailure: () => failureSignals++,
    });
    lifecycle.saveReport();
    assert.equal(readReport(directory).state, "running");
    // Deliberately do not await the returned promise until a later event turn.
    // Deno fails the test if an asset rejection escapes as an unhandled rejection.
    lifecycle.trackDownload(
      "https://example.invalid/assets/overlay-test.js",
      () => {
        throw new Error("response body closed during navigation");
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await lifecycle.settleDownloads("test");
    const saved = readReport(directory);
    assert.equal(saved.state, "failed");
    assert.equal(saved.originalFailure.stage, "asset-download");
    assert.match(saved.originalFailure.error, /body closed during navigation/);
    assert.equal(saved.assetDownloads[0].state, "rejected");
    assert.equal(lifecycle.pendingCount(), 0);
    assert.equal(failureSignals, 1);
    assert.equal(
      fs.statSync(path.join(directory, "report.json")).mode & 0o777,
      0o600,
    );
  });
});

Deno.test("cleanup failures preserve the original navigation failure", async () => {
  await temporaryDirectory(async (directory) => {
    const report = {
      state: "running",
      phase: "navigation",
      browserClosed: false,
    };
    const lifecycle = createLifecycle(directory, report);
    lifecycle.recordFailure(
      "main:navigation",
      new Error("original navigation failure"),
    );
    lifecycle.beginCleanup();
    await lifecycle.trackDownload(
      "https://example.invalid/assets/late.js",
      () => {
        return Promise.reject(new Error("secondary response closed"));
      },
    );
    lifecycle.recordFailure(
      "context-close",
      new Error("secondary close timeout"),
    );
    const saved = readReport(directory);
    assert.equal(saved.failures.length, 3);
    assert.match(saved.failure, /original navigation failure/);
    assert.equal(saved.originalFailure.stage, "main:navigation");
    assert.equal(saved.failures[0].duringCleanup, false);
    assert.equal(saved.failures[1].duringCleanup, true);
    assert.equal(saved.failures[2].duringCleanup, true);
  });
});

Deno.test("hung bodies fail within their deadline and late rejection remains handled", async () => {
  await temporaryDirectory(async (directory) => {
    const report = { state: "running", phase: "assets", browserClosed: false };
    const lifecycle = createLifecycle(directory, report, {
      assetTimeoutMs: 5,
      settlementTimeoutMs: 1000,
    });
    let rejectBody;
    const body = new Promise((_, reject) => {
      rejectBody = reject;
    });
    lifecycle.trackDownload(
      "https://example.invalid/assets/hung.js",
      () => body,
    );
    await lifecycle.settleDownloads("test");
    assert.equal(report.assetDownloads[0].state, "rejected");
    assert.match(report.originalFailure.error, /deadline exceeded after 5ms/);
    rejectBody(new Error("late underlying body rejection"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(report.failures.length, 1);
    assert.equal(lifecycle.pendingCount(), 0);
  });
});

Deno.test("late actual close updates closure evidence without erasing timeout or promoting failure", async () => {
  await temporaryDirectory((directory) => {
    const report = {
      state: "running",
      phase: "navigation",
      browserClosed: false,
    };
    const lifecycle = createLifecycle(directory, report);
    lifecycle.recordFailure("main:navigation", new Error("navigation failed"));
    lifecycle.beginCleanup();
    lifecycle.recordFailure(
      "context-close",
      new Error("context close deadline exceeded"),
    );
    assert.equal(readReport(directory).browserClosed, false);
    lifecycle.lifecycleEvent("page-close");
    assert.equal(readReport(directory).browserClosed, false);
    lifecycle.lifecycleEvent("context-close");
    lifecycle.lifecycleEvent("browser-disconnected");
    const saved = readReport(directory);
    assert.equal(saved.browserClosed, true);
    assert.ok(saved.browserClosedAt);
    assert.equal(saved.state, "failed");
    assert.equal(saved.originalFailure.stage, "main:navigation");
    assert.equal(saved.failures.length, 2);
    assert.deepEqual(saved.browserEvents.map((event) => event.kind), [
      "page-close",
      "context-close",
      "browser-disconnected",
    ]);
    assert.ok(saved.browserEvents.every((event) => event.expectedCleanup));
  });
});

Deno.test("a failed final evidence write cannot leave a passed report or success exit signal", async () => {
  await temporaryDirectory((directory) => {
    const report = { state: "passed", phase: "closed", browserClosed: true };
    let failureSignals = 0;
    const lifecycle = createLifecycle(directory, report, {
      onFailure: () => failureSignals++,
    });
    lifecycle.saveReport();
    assert.equal(readReport(directory).state, "passed");
    // A directory at the atomic destination makes rename fail even as root.
    fs.rmSync(path.join(directory, "report.json"));
    fs.mkdirSync(path.join(directory, "report.json"));
    lifecycle.saveReport();
    assert.equal(report.state, "failed");
    assert.equal(report.originalFailure.stage, "evidence-checkpoint");
    assert.equal(
      report.failures.length,
      1,
      "Checkpoint failure never recurses",
    );
    assert.equal(failureSignals, 1);
    assert.ok(report.checkpointError);
  });
});

Deno.test("unexpected browser closure is an immediate durable failure", async () => {
  await temporaryDirectory((directory) => {
    const report = {
      state: "running",
      phase: "navigation",
      browserClosed: false,
    };
    const lifecycle = createLifecycle(directory, report);
    lifecycle.lifecycleEvent("context-close");
    const saved = readReport(directory);
    assert.equal(saved.state, "failed");
    assert.equal(saved.browserClosed, true);
    assert.equal(saved.originalFailure.stage, "context-close");
    assert.equal(saved.browserEvents[0].expectedCleanup, false);
  });
});
