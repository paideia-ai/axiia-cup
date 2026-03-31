import { and, asc, eq, or } from "drizzle-orm";

import { db } from "../db/client";
import { matches } from "../db/schema";
import { runMatch } from "./runner";

const MAX_CONCURRENT_MATCHES = 4;
const WORKER_POLL_INTERVAL_MS = 5_000;
const MATCH_STALE_TIMEOUT_MS = 10 * 60_000;
const MATCH_TIMEOUT_ERROR = "Worker timed out waiting for match progress";

let intervalId: ReturnType<typeof setInterval> | null = null;
const inFlightMatchIds = new Set<number>();

function nowIso() {
  return new Date().toISOString();
}

function createLeaseToken() {
  return crypto.randomUUID();
}

function listQueuedMatches() {
  return db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.status, "queued"))
    .orderBy(asc(matches.createdAt))
    .all();
}

function recoverInterruptedMatches() {
  const recovered = db
    .update(matches)
    .set({
      error: null,
      leaseToken: null,
      status: "queued",
      updatedAt: nowIso(),
    })
    .where(or(eq(matches.status, "running"), eq(matches.status, "judging")))
    .returning({ id: matches.id })
    .all();

  if (recovered.length > 0) {
    console.log(`[worker] recovered ${recovered.length} interrupted matches back to queued`);
  }
}

function claimQueuedMatch(matchId: number) {
  const leaseToken = createLeaseToken();
  const claimed = db
    .update(matches)
    .set({
      error: null,
      finishedAt: null,
      leaseToken,
      status: "running",
      updatedAt: nowIso(),
    })
    .where(and(eq(matches.id, matchId), eq(matches.status, "queued")))
    .returning({ id: matches.id })
    .get();

  return claimed ? { id: claimed.id, leaseToken } : null;
}

function markMatchAsTimedOut(matchId: number, leaseToken: string) {
  return db
    .update(matches)
    .set({
      error: `Worker timeout after ${Math.floor(MATCH_STALE_TIMEOUT_MS / 60_000)} minutes without progress`,
      finishedAt: nowIso(),
      leaseToken: null,
      status: "error",
      updatedAt: nowIso(),
    })
    .where(and(eq(matches.id, matchId), eq(matches.leaseToken, leaseToken)))
    .run();
}

async function runClaimedMatch(matchId: number, leaseToken: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    console.log(`[worker] starting match ${matchId}`);
    await Promise.race([
      runMatch(matchId, leaseToken),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(MATCH_TIMEOUT_ERROR));
        }, MATCH_STALE_TIMEOUT_MS);
      }),
    ]);
    console.log(`[worker] completed match ${matchId}`);
  } catch (error) {
    if (error instanceof Error && error.message === MATCH_TIMEOUT_ERROR) {
      markMatchAsTimedOut(matchId, leaseToken);
    }

    console.error(`[worker] failed match ${matchId}:`, error);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    inFlightMatchIds.delete(matchId);
    queueMicrotask(() => {
      void pollOnce();
    });
  }
}

async function pollOnce() {
  const capacity = MAX_CONCURRENT_MATCHES - inFlightMatchIds.size;

  if (capacity <= 0) {
    return;
  }

  const queuedMatches = listQueuedMatches()
    .filter((match) => !inFlightMatchIds.has(match.id))
    .slice(0, capacity);

  if (queuedMatches.length === 0) {
    return;
  }

  for (const match of queuedMatches) {
    const claimed = claimQueuedMatch(match.id);

    if (!claimed) {
      continue;
    }

    inFlightMatchIds.add(match.id);
    void runClaimedMatch(match.id, claimed.leaseToken);
  }
}

export function startWorker() {
  if (intervalId) {
    return;
  }

  recoverInterruptedMatches();
  intervalId = setInterval(() => {
    void pollOnce();
  }, WORKER_POLL_INTERVAL_MS);

  void pollOnce();
  console.log("[worker] started");
}

export function kickWorker() {
  startWorker();
  void pollOnce();
}
