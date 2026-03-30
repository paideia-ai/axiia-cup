import { asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { matches } from "../db/schema";
import { runMatch } from "./runner";

let intervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

async function pollOnce() {
  if (isRunning) {
    return;
  }

  const nextMatch = db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.status, "queued"))
    .orderBy(asc(matches.createdAt))
    .get();

  if (!nextMatch) {
    return;
  }

  isRunning = true;

  try {
    console.log(`[worker] starting match ${nextMatch.id}`);
    await runMatch(nextMatch.id);
    console.log(`[worker] completed match ${nextMatch.id}`);
  } catch (error) {
    console.error(`[worker] failed match ${nextMatch.id}:`, error);
  } finally {
    isRunning = false;
  }
}

export function startWorker() {
  if (intervalId || process.env.ENABLE_WORKER === "false") {
    return;
  }

  intervalId = setInterval(() => {
    void pollOnce();
  }, 5000);

  void pollOnce();
  console.log("[worker] started");
}
