// Read-only production Test Mode verification. Imported helpers never launch a
// browser or fetch npm packages; only the explicit --run command does so.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";
import os from "node:os";

const run = promisify(execFile);
const errorText = (error) => error?.stack || String(error);
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
export const sourcePath = "v2/web/src/testmode/data/vivian-a3-a4-a6.json";
export const usage =
  "deno run -A --no-config .github/scripts/verify-live-testmode.mjs --run --expected-sha FULL_RELEASE_SHA --release-dir ABS_RELEASE_CHECKOUT --output-dir NEW_ABSOLUTE_DIRECTORY";

export function parseArguments(args) {
  assert.ok(
    args.length === 7 && args[0] === "--run" && args[1] === "--expected-sha" &&
      args[3] === "--release-dir" && args[5] === "--output-dir",
    usage,
  );
  const expectedSHA = args[2], releaseDir = args[4], out = args[6];
  assert.match(
    expectedSHA,
    /^[0-9a-f]{40}$/,
    "Expected release must be a full lowercase commit SHA",
  );
  for (const directory of [releaseDir, out]) {
    assert.ok(
      path.isAbsolute(directory) && !directory.split(path.sep).includes(".."),
      "Directories must be absolute without traversal",
    );
  }
  assert.ok(!fs.existsSync(out), "Output directory must be new");
  assert.notEqual(path.resolve(releaseDir), path.resolve(out));
  return { expectedSHA, releaseDir, out };
}

export function validateSource(source) {
  assert.ok(
    source && !Array.isArray(source) && typeof source === "object",
    "Release guide source must be an object",
  );
  assert.match(
    source.sourceSha256 ?? "",
    /^[0-9a-f]{64}$/,
    "Release guide source hash is missing or invalid",
  );
  assert.match(
    source.sourceCommit ?? "",
    /^[0-9a-f]{40}$/,
    "Release guide source commit is missing or invalid",
  );
  assert.match(
    source.sourceRevision ?? "",
    /^[0-9a-f]{40}$/,
    "Release guide audit revision is missing or invalid",
  );
  assert.match(
    source.capturedAt ?? "",
    /^\d{4}-\d{2}-\d{2}$/,
    "Release guide capture date is missing or invalid",
  );
  assert.equal(
    new Date(source.capturedAt).toISOString().slice(0, 10),
    source.capturedAt,
    "Release guide capture date is invalid",
  );
  return {
    sourceHash: source.sourceSha256,
    sourceCommit: source.sourceCommit,
    historicalRevision: source.sourceRevision,
    historicalCapturedAt: source.capturedAt,
  };
}

export async function readRelease(
  releaseDir,
  expectedSHA,
  readHead = async (directory) => {
    const { stdout } = await run(
      "git",
      ["-C", directory, "rev-parse", "HEAD"],
      { timeout: 15000 },
    );
    return stdout.trim();
  },
) {
  assert.equal(
    await readHead(releaseDir),
    expectedSHA,
    "Release checkout HEAD differs from expected deployed SHA",
  );
  const file = path.join(releaseDir, sourcePath);
  assert.ok(
    fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(),
    "Release guide source must be a regular file",
  );
  return validateSource(JSON.parse(fs.readFileSync(file, "utf8")));
}

export function createLifecycle(
  out,
  report,
  {
    assetTimeoutMs = 15000,
    settlementTimeoutMs = 20000,
    onFailure = () => {},
  } = {},
) {
  const pendingDownloads = new Set();
  let cleanupStarted = false;
  report.assetDownloads = [];
  report.failures = [];
  report.requestFailures = [];
  report.pageCrashes = [];
  report.browserEvents = [];
  const markFailure = (stage, error) => {
    const failure = {
      at: new Date().toISOString(),
      stage,
      error: errorText(error),
      duringCleanup: cleanupStarted,
    };
    report.failures.push(failure);
    if (!report.originalFailure) {
      report.originalFailure = failure;
      report.failure = failure.error;
    }
    report.state = "failed";
    onFailure();
  };
  const saveReport = () => {
    report.updatedAt = new Date().toISOString();
    try {
      const temp = path.join(out, "report.json.tmp");
      fs.writeFileSync(temp, JSON.stringify(report, null, 2) + "\n", {
        mode: 0o600,
      });
      fs.renameSync(temp, path.join(out, "report.json"));
    } catch (error) {
      // Never turn a handled browser failure into an unhandled checkpoint Promise.
      report.checkpointError = errorText(error);
      // A final checkpoint can fail after all assertions pass. Fail closed in
      // memory and the process exit status without recursively attempting a write.
      markFailure("evidence-checkpoint", error);
      console.error("Verifier checkpoint failed:", report.checkpointError);
    }
  };
  const recordFailure = (stage, error) => {
    markFailure(stage, error);
    saveReport();
  };
  const bounded = async (promise, ms, label) => {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(label + " deadline exceeded after " + ms + "ms"),
              ),
            ms,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
  const trackDownload = (url, work) => {
    const record = {
      url,
      startedAt: new Date().toISOString(),
      phase: report.phase,
      state: "pending",
    };
    report.assetDownloads.push(record);
    // Attach both resolution handlers immediately. Stored jobs always settle;
    // an early body rejection cannot escape while the verifier is navigating.
    const job = bounded(
      Promise.resolve().then(work),
      assetTimeoutMs,
      "asset body " + url,
    ).then(
      () => {
        record.state = "fulfilled";
        record.finishedAt = new Date().toISOString();
        saveReport();
      },
      (error) => {
        record.state = "rejected";
        record.finishedAt = new Date().toISOString();
        record.error = errorText(error);
        recordFailure("asset-download", error);
      },
    );
    pendingDownloads.add(job);
    void job.then(() => pendingDownloads.delete(job), (error) => {
      pendingDownloads.delete(job);
      recordFailure("download-tracker", error);
    });
    saveReport();
    return job;
  };
  const settleDownloads = async (stage) => {
    const deadline = Date.now() + settlementTimeoutMs;
    while (pendingDownloads.size) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error(stage + ": asset settlement deadline exceeded");
      }
      await bounded(
        Promise.allSettled([...pendingDownloads]),
        remaining,
        stage + ": asset settlement",
      );
    }
    saveReport();
  };

  const lifecycleEvent = (kind) => {
    const at = new Date().toISOString();
    report.browserEvents.push({ at, kind, expectedCleanup: cleanupStarted });
    if (kind === "context-close") {
      // A delayed close after a timed-out await is still an observed close.
      // Keep its earlier timeout and original failure; never promote it to pass.
      report.browserClosed = true;
      report.browserClosedAt = at;
    }
    if (!cleanupStarted) recordFailure(kind, new Error("Unexpected " + kind));
    else saveReport();
  };
  return {
    saveReport,
    recordFailure,
    bounded,
    trackDownload,
    settleDownloads,
    lifecycleEvent,
    beginCleanup: () => {
      cleanupStarted = true;
    },
    isCleaningUp: () => cleanupStarted,
    pendingCount: () => pendingDownloads.size,
  };
}

export async function verifyLive(args) {
  const { expectedSHA, releaseDir, out } = parseArguments(args);
  fs.mkdirSync(out, { mode: 0o700 });
  const base = "https://axiia-cup-2-web.isofucius.cn";
  const report = {
    state: "running",
    startedAt: new Date().toISOString(),
    base,
    expectedSHA,
    releaseDir,
    verifierPID: process.pid,
    controller: "playwright",
    checks: [],
    overlays: [],
    mutations: [],
    pageErrors: [],
    unexpectedConsoleErrors: [],
    screenshots: [],
    browserClosed: false,
    networkResponsesMocked: false,
    phase: "validating-release",
  };
  const lifecycle = createLifecycle(out, report, {
    onFailure: () => {
      process.exitCode = 1;
    },
  });
  const {
    saveReport,
    recordFailure,
    bounded,
    trackDownload,
    settleDownloads,
    lifecycleEvent,
  } = lifecycle;
  let context, userData;
  let acceptingAssets = true;
  const assets = new Map();
  const newCopyPrefix = "你今日向该玩家发起的约战已达上限";
  const oldCopyPrefix = "对方今日收到的约战已达上限";
  saveReport();
  const recordAsset = (url, bytes) => {
    const text = bytes.toString();
    assets.set(url, { text, sha256: hash(bytes) });
    fs.writeFileSync(
      path.join(out, path.basename(new URL(url).pathname)),
      bytes,
      { mode: 0o600 },
    );
  };
  try {
    assert.equal(
      report.checkpointError,
      undefined,
      "Initial evidence checkpoint failed",
    );
    const provenance = await readRelease(releaseDir, expectedSHA);
    Object.assign(report, provenance);
    const {
      sourceHash,
      sourceCommit: expectedSourceCommit,
      historicalRevision,
      historicalCapturedAt,
    } = provenance;
    saveReport();
    const [{ chromium }, { expect }] = await Promise.all([
      import("npm:playwright@1.62.1"),
      import("npm:@playwright/test@1.62.1"),
    ]);
    report.phase = "launching-browser";
    saveReport();
    // Raw browser state must never enter the uploaded evidence directory, even
    // if the browser fails to close and its profile cannot yet be removed.
    userData = fs.mkdtempSync(path.join(os.tmpdir(), "axiia-live-guide-"));
    fs.chmodSync(userData, 0o700);
    context = await chromium.launchPersistentContext(userData, {
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
        : {}),
      headless: true,
      timeout: 45000,
      serviceWorkers: "block",
      args: ["--no-first-run", "--no-default-browser-check"],
    });
    context.on("close", () => lifecycleEvent("context-close"));
    context.browser()?.on(
      "disconnected",
      () => lifecycleEvent("browser-disconnected"),
    );
    assert.equal(context.pages().length, 1);
    const page = context.pages()[0];
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => {
      report.pageErrors.push(error.message);
      saveReport();
    });
    page.on("close", () => lifecycleEvent("page-close"));
    page.on("crash", () => {
      const crash = {
        at: new Date().toISOString(),
        url: page.url(),
        duringCleanup: lifecycle.isCleaningUp(),
      };
      report.pageCrashes.push(crash);
      recordFailure("page-crash", new Error("Page crash event: " + crash.url));
    });
    page.on("requestfailed", (request) => {
      report.requestFailures.push({
        at: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType(),
        navigation: request.isNavigationRequest(),
        error: request.failure()?.errorText,
        duringCleanup: lifecycle.isCleaningUp(),
      });
      saveReport();
    });
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      if (
        message.location().url.endsWith("/v1/auth/me") &&
        message.text().includes("401")
      ) return;
      report.unexpectedConsoleErrors.push(message.text());
      saveReport();
    });
    await context.route("**/*", async (route) => {
      try {
        const request = route.request(), url = new URL(request.url());
        if (
          !["GET", "HEAD", "OPTIONS"].includes(request.method()) ||
          url.pathname.includes("/rpc/")
        ) {
          report.mutations.push({
            method: request.method(),
            origin: url.origin,
            path: url.pathname,
          });
          saveReport();
          return await route.abort("blockedbyclient");
        }
        return await route.continue();
      } catch (error) {
        recordFailure("route-handler", error);
      }
    });
    const responseListener = (response) => {
      if (!acceptingAssets) return;
      const url = new URL(response.url());
      if (url.origin === base && /^\/assets\/[^/]+\.js$/.test(url.pathname)) {
        trackDownload(response.url(), async () => {
          assert.equal(response.status(), 200);
          const bytes = await response.body(), text = bytes.toString();
          recordAsset(response.url(), bytes);
          if (/^\/assets\/overlay-/.test(url.pathname)) {
            report.overlays.push({
              url: response.url(),
              sha256: hash(bytes),
              containsSourceHash: text.includes(sourceHash),
              containsSourceCommit: text.includes(expectedSourceCommit),
              hasSeparateSourceCommit: text.includes("sourceCommit"),
              historicalCapturePreserved: text.includes(historicalRevision) &&
                text.includes(historicalCapturedAt),
            });
          }
        });
      }
    };
    page.on("response", responseListener);
    report.phase = "checking-release-footer";
    saveReport();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base + "/scenarios", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    const footer = page.locator('[data-tm="NAV.build-sha"]');
    await expect(footer).toHaveText("build " + expectedSHA);
    report.actualSHA = (await footer.innerText()).replace(/^build\s+/, "");
    saveReport();
    await footer.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, "release-footer.png") });
    report.screenshots.push(path.join(out, "release-footer.png"));

    const openGuide = async (journey, step) => {
      report.phase = "navigate:" + step;
      saveReport();
      await page.goto(
        `${base}/scenarios?tm=1&tmJourney=${journey}&tmStep=${step}`,
        { waitUntil: "domcontentloaded" },
      );
      await expect(page.locator('[data-tm="NAV.build-sha"]')).toHaveText(
        "build " + expectedSHA,
      );
      const guide = page.getByRole("dialog", { name: "导测", exact: true });
      await expect(guide).toContainText(step);
      const expand = guide.getByRole("button", { name: "展开", exact: true });
      if (await expand.isVisible()) await expand.click();
      return guide;
    };
    const screenshot = async (locator, name) => {
      await locator.scrollIntoViewIfNeeded();
      const file = path.join(out, name + ".png");
      await locator.screenshot({ path: file });
      report.screenshots.push(file);
      saveReport();
    };
    const noOverflow = async () => {
      const size = await page.evaluate(() => ({
        viewport: innerWidth,
        width: document.documentElement.scrollWidth,
      }));
      assert.ok(size.width <= size.viewport, "Horizontal overflow");
      return size;
    };
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const first = await openGuide(
        "HV-A3-FIRST-BATTLE",
        "HV-A3-FIRST-BATTLE-S01",
      );
      const prerequisites = first.locator("details").filter({
        hasText: "开测前准备",
      });
      await prerequisites.locator("summary").click();
      await expect(prerequisites).toContainText("2026-09-03 确认的 U03-C05 v2");
      await expect(prerequisites).toContainText(
        "S05–S07 须使用本轮实际派发的 matchId",
      );
      await screenshot(prerequisites, width + "-a3-prerequisites");
      for (const number of [4, 5, 6, 7]) {
        const stepID = `HV-A3-FIRST-BATTLE-S0${number}`;
        const guide = await openGuide("HV-A3-FIRST-BATTLE", stepID);
        await expect(guide.locator(".tm-known-gap")).toHaveCount(0);
        await expect(guide).not.toContainText("首战触发方式待产品裁决");
        if (number === 4) {
          await expect(guide.locator(".tm-block--action")).toContainText(
            "保存首个版本并确认尚未派发",
          );
          await expect(guide).toContainText("仅保存不派发");
          await expect(guide).toContainText("comment-v2:U03-C05");
          await screenshot(
            guide.locator(".tm-block--action"),
            width + "-a3-save-start",
          );
        }
        report.checks.push({
          width,
          stepID,
          noFalseRulingBlock: true,
          size: await noOverflow(),
        });
      }
      const trials = await openGuide(
        "HV-A3-TRIALS-BLOCKED",
        "HV-A3-TRIALS-BLOCKED-S01",
      );
      const gap = trials.locator(".tm-known-gap");
      await expect(gap).toContainText("隔离真实服务器测试已验证");
      await expect(gap).toContainText("不覆盖共享环境的真人测试窗");
      await expect(gap).toContainText("缺 fixture 记 blocked");
      await screenshot(gap, width + "-u11-fixture-gap");
      report.checks.push({
        width,
        stepID: "HV-A3-TRIALS-BLOCKED-S01",
        fixtureGapPreserved: true,
        size: await noOverflow(),
      });

      const a6 = await openGuide("HV-A6-ENTRY-QUOTA", "HV-A6-ENTRY-QUOTA-S05");
      const a6Gap = a6.locator(".tm-known-gap");
      await expect(a6Gap).toHaveCount(1);
      for (
        const text of [
          "计数规则已确认",
          "U06-C06 与 UI-Doc v3.4 #76 已确认按发起方→对手玩家分别计算每日约战次数",
          "不同发起方的次数不能汇总为被约方总量",
          "M=3、PVP 日上限 5",
          "前两次用 4 次",
          "第三次需要累计 6 次",
          "这是测试前态的可达性问题，不是未决定的计数规则",
          "暂停 S05，不标通过",
          "隔离验证与共享环境的真人结果分别记录",
        ]
      ) await expect(a6Gap).toContainText(text);
      await expect(a6Gap).not.toContainText("等待产品裁定");
      await expect(
        a6.locator(".tm-block").filter({
          has: page.getByText("应该看到", { exact: true }),
        }),
      ).toContainText("达到 M 后下一次拒绝且零腿创建，原因是同一对手上限");
      await expect(a6).toContainText("comment-v2:U06-C06");
      await screenshot(a6Gap, width + "-a6-approved-rule-fixture-gap");
      const gapSize = await a6Gap.evaluate((element) => ({
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      assert.ok(
        gapSize.scrollWidth <= gapSize.width,
        "A6 gap internal horizontal overflow",
      );
      report.checks.push({
        width,
        stepID: "HV-A6-ENTRY-QUOTA-S05",
        directedRuleApproved: true,
        quotaBoundaryStillUnavailable: true,
        humanPassNotClaimed: true,
        gapSize,
        size: await noOverflow(),
      });
    }
    report.humanProgressKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("axiia:tm:guided:")
      )
    );
    assert.equal(report.humanProgressKeys.length, 0);
    report.reviewIdentityKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("axiia-decisions:") || key === "axiia:tm:role"
      )
    );
    assert.equal(report.reviewIdentityKeys.length, 0);
    assert.ok(
      (await context.cookies()).every((cookie) =>
        !cookie.name.startsWith("axiia")
      ),
      "Unexpected auth session",
    );
    report.phase = "settling-page-assets";
    saveReport();
    await settleDownloads("verification");
    assert.ok(
      report.assetDownloads.every((asset) => asset.state === "fulfilled"),
      "A tracked deployment asset failed",
    );
    // Observe actual deployed bytes only. If the read-only guide route did not
    // load rejection code, fetch a named reject-copy chunk referenced by an actual
    // downloaded asset. Never invent an asset URL, dispatch, or mocked 429.
    const candidates = new Set();
    for (const [url, asset] of assets) {
      for (
        const match of asset.text.matchAll(
          /["']([^"'\s]*reject-copy-[^"'\s]+\.js)["']/g,
        )
      ) {
        const reference = match[1].startsWith("assets/")
          ? "/" + match[1]
          : match[1];
        const target = new URL(reference, url);
        if (
          target.origin === base &&
          /^\/assets\/[^/]+\.js$/.test(target.pathname)
        ) candidates.add(target.href);
      }
    }
    assert.ok(
      candidates.size <= 5,
      "Unexpected number of rejection-code assets",
    );
    for (const url of candidates) {
      if (assets.has(url)) continue;
      await trackDownload(url, async () => {
        const response = await context.request.get(url, {
          timeout: 15000,
          maxRedirects: 0,
        });
        assert.equal(
          response.status(),
          200,
          "Referenced rejection asset must be readable",
        );
        recordAsset(url, await response.body());
      });
    }
    const copies = [...assets].filter(([, asset]) =>
      asset.text.includes(newCopyPrefix)
    );
    report.rejectionCopy = {
      state: copies.length
        ? "verified-deployed-asset-bytes"
        : "not-observed-on-guest-route",
      assets: copies.map(([url, asset]) => ({ url, sha256: asset.sha256 })),
      actual429Triggered: false,
      limitation:
        "Byte presence verifies shipped wording only. No match was sent; actual error rendering remains covered by CI contracts.",
    };
    for (const [, asset] of copies) {
      assert.ok(
        !asset.text.includes(oldCopyPrefix),
        "Receiver-wide rejection wording remains in the same deployed application asset",
      );
    }
    assert.ok(
      report.overlays.length > 0 &&
        report.overlays.every((asset) =>
          asset.containsSourceHash && asset.containsSourceCommit &&
          asset.hasSeparateSourceCommit && asset.historicalCapturePreserved
        ),
    );
    assert.equal(report.mutations.length, 0);
    assert.equal(report.pageErrors.length, 0);
    assert.equal(report.unexpectedConsoleErrors.length, 0);
    await settleDownloads("final-verification");
    assert.ok(
      report.assetDownloads.every((asset) => asset.state === "fulfilled"),
      "A tracked deployment asset failed",
    );
    assert.equal(report.pageCrashes.length, 0);
    assert.equal(
      report.failures.length,
      0,
      "Verifier recorded an asynchronous/lifecycle failure",
    );
    assert.equal(
      report.checkpointError,
      undefined,
      "Verifier evidence checkpoint failed",
    );
    report.state = "passed";
    report.finishedAt = new Date().toISOString();
    saveReport();
  } catch (error) {
    report.mainFailure = {
      at: new Date().toISOString(),
      phase: report.phase,
      error: errorText(error),
    };
    recordFailure("main:" + report.phase, error);
  } finally {
    // Save the original failure before attempting cleanup. Stop accepting new
    // response jobs and settle every tracked body read before closing its browser.
    lifecycle.beginCleanup();
    acceptingAssets = false;
    report.phase = "settling-before-cleanup";
    saveReport();
    try {
      await settleDownloads("cleanup");
    } catch (error) {
      recordFailure("cleanup-settle", error);
    }
    report.phase = "closing-browser";
    saveReport();
    try {
      if (context) {
        await bounded(context.close(), 15000, "context close");
        assert.equal(
          report.browserClosed,
          true,
          "Browser context close was not observed",
        );
      }
    } catch (error) {
      recordFailure("context-close", error);
    }
    // A timed-out body operation still has a rejection handler attached. Give any
    // browser-close consequences a bounded opportunity to update durable evidence.
    try {
      await settleDownloads("post-close");
    } catch (error) {
      recordFailure("post-close-settle", error);
    }
    if (userData && report.browserClosed) {
      try {
        fs.rmSync(userData, { recursive: true, force: true });
      } catch (error) {
        recordFailure("profile-cleanup", error);
      }
    }
    report.phase = "closed";
    report.finishedAt ??= new Date().toISOString();
    saveReport();
  }

  return report;
}

if (import.meta.main) {
  if (process.argv.slice(2).length === 0 || process.argv[2] === "--help") {
    console.log(usage);
  } else {
    try {
      const report = await verifyLive(process.argv.slice(2));
      console.log(JSON.stringify(report, null, 2));
      if (report.state !== "passed") process.exitCode = 1;
    } catch (error) {
      console.error(errorText(error));
      process.exitCode = 1;
    }
  }
}
