import type { JudgeQA, TranscriptTurn } from '@axiia/shared'
import { and, asc, eq, or } from 'drizzle-orm'

import { db } from '../db/client'
import { matches, playgroundRuns, scenarios, submissions } from '../db/schema'
import { parseJsonField } from '../lib/json'
import { executeMatchSession } from './core'
import { runMatch } from './runner'
import { registerWorkerKickHandler } from './worker-signal'

const MAX_CONCURRENT = 4
const WORKER_POLL_INTERVAL_MS = 5_000
const MATCH_STALE_TIMEOUT_MS = 10 * 60_000
const MATCH_TIMEOUT_ERROR = 'Worker timed out waiting for match progress'

let intervalId: ReturnType<typeof setInterval> | null = null
const inFlightJobKeys = new Set<string>()

function nowIso() {
  return new Date().toISOString()
}

function createLeaseToken() {
  return crypto.randomUUID()
}

function listQueuedMatches() {
  return db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.status, 'queued'))
    .orderBy(asc(matches.createdAt))
    .all()
}

function listQueuedPlaygroundRuns() {
  return db
    .select({ id: playgroundRuns.id })
    .from(playgroundRuns)
    .where(eq(playgroundRuns.status, 'queued'))
    .orderBy(asc(playgroundRuns.createdAt))
    .all()
}

function recoverInterruptedMatches() {
  const recovered = db
    .update(matches)
    .set({
      error: null,
      leaseToken: null,
      status: 'queued',
      updatedAt: nowIso(),
    })
    .where(or(eq(matches.status, 'running'), eq(matches.status, 'judging')))
    .returning({ id: matches.id })
    .all()

  if (recovered.length > 0) {
    console.log(
      `[worker] recovered ${recovered.length} interrupted matches back to queued`,
    )
  }
}

function recoverInterruptedPlaygroundRuns() {
  const recovered = db
    .update(playgroundRuns)
    .set({
      error: null,
      leaseToken: null,
      status: 'queued',
    })
    .where(eq(playgroundRuns.status, 'running'))
    .returning({ id: playgroundRuns.id })
    .all()

  if (recovered.length > 0) {
    console.log(
      `[worker] recovered ${recovered.length} interrupted playground runs back to queued`,
    )
  }
}

function claimQueuedMatch(matchId: number) {
  const leaseToken = createLeaseToken()
  const claimed = db
    .update(matches)
    .set({
      error: null,
      finishedAt: null,
      leaseToken,
      status: 'running',
      updatedAt: nowIso(),
    })
    .where(and(eq(matches.id, matchId), eq(matches.status, 'queued')))
    .returning({ id: matches.id })
    .get()

  return claimed ? { id: claimed.id, leaseToken } : null
}

function claimPlaygroundRun(runId: number) {
  const leaseToken = createLeaseToken()
  const claimed = db
    .update(playgroundRuns)
    .set({
      error: null,
      leaseToken,
      status: 'running',
    })
    .where(
      and(eq(playgroundRuns.id, runId), eq(playgroundRuns.status, 'queued')),
    )
    .returning({ id: playgroundRuns.id })
    .get()

  return claimed ? { id: claimed.id, leaseToken } : null
}

function markMatchAsTimedOut(matchId: number, leaseToken: string) {
  return db
    .update(matches)
    .set({
      error: `Worker timeout after ${Math.floor(MATCH_STALE_TIMEOUT_MS / 60_000)} minutes without progress`,
      finishedAt: nowIso(),
      leaseToken: null,
      status: 'error',
      updatedAt: nowIso(),
    })
    .where(and(eq(matches.id, matchId), eq(matches.leaseToken, leaseToken)))
    .run()
}

async function runClaimedMatch(matchId: number, leaseToken: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  try {
    console.log(`[worker] starting match ${matchId}`)
    await Promise.race([
      runMatch(matchId, leaseToken),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(MATCH_TIMEOUT_ERROR))
        }, MATCH_STALE_TIMEOUT_MS)
      }),
    ])
    console.log(`[worker] completed match ${matchId}`)
  } catch (error) {
    if (error instanceof Error && error.message === MATCH_TIMEOUT_ERROR) {
      markMatchAsTimedOut(matchId, leaseToken)
    }

    console.error(`[worker] failed match ${matchId}:`, error)
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    inFlightJobKeys.delete(`match:${matchId}`)
    queueMicrotask(() => {
      void pollOnce()
    })
  }
}

async function runClaimedPlaygroundRun(runId: number, leaseToken: string) {
  let transcript: TranscriptTurn[] = []
  let judgeTranscriptA: JudgeQA[] = []
  let judgeTranscriptB: JudgeQA[] = []

  try {
    console.log(`[worker] starting playground run ${runId}`)

    const run = db
      .select()
      .from(playgroundRuns)
      .where(
        and(
          eq(playgroundRuns.id, runId),
          eq(playgroundRuns.leaseToken, leaseToken),
        ),
      )
      .get()

    if (!run || run.status !== 'running') {
      return
    }

    const submission = db
      .select()
      .from(submissions)
      .where(eq(submissions.id, run.submissionId))
      .get()
    const scenario = db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, run.scenarioId))
      .get()

    if (!submission || !scenario) {
      db.update(playgroundRuns)
        .set({
          error: 'Missing scenario or submission for playground run',
          leaseToken: null,
          status: 'error',
        })
        .where(
          and(
            eq(playgroundRuns.id, runId),
            eq(playgroundRuns.leaseToken, leaseToken),
          ),
        )
        .run()
      return
    }

    transcript = parseJsonField<TranscriptTurn[]>(run.transcript, [])
    judgeTranscriptA = parseJsonField<JudgeQA[]>(run.judgeTranscriptA, [])
    judgeTranscriptB = parseJsonField<JudgeQA[]>(run.judgeTranscriptB, [])

    const persist = (values: Partial<typeof playgroundRuns.$inferInsert>) =>
      db
        .update(playgroundRuns)
        .set(values)
        .where(
          and(
            eq(playgroundRuns.id, runId),
            eq(playgroundRuns.leaseToken, leaseToken),
          ),
        )
        .run()

    const result = await executeMatchSession({
      judgeTranscriptA,
      judgeTranscriptB,
      modelA: submission.model,
      modelB: submission.model,
      onDialogueTurn: async (nextTranscript) => {
        transcript = nextTranscript
        await persist({ transcript: JSON.stringify(nextTranscript) })
      },
      onJudgeTranscriptA: async (nextJudgeTranscriptA) => {
        judgeTranscriptA = nextJudgeTranscriptA
        await persist({
          judgeTranscriptA: JSON.stringify(nextJudgeTranscriptA),
        })
      },
      onJudgeTranscriptB: async (nextJudgeTranscriptB) => {
        judgeTranscriptB = nextJudgeTranscriptB
        await persist({
          judgeTranscriptB: JSON.stringify(nextJudgeTranscriptB),
        })
      },
      promptA: submission.promptA,
      promptB: submission.promptB,
      scenario,
      transcript,
    })

    await persist({
      error: null,
      judgeTranscriptA: JSON.stringify(result.judgeTranscriptA),
      judgeTranscriptB: JSON.stringify(result.judgeTranscriptB),
      leaseToken: null,
      reasoning: result.reasoning,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      status: 'scored',
      transcript: JSON.stringify(result.transcript),
      winner: result.winner,
    })

    console.log(`[worker] completed playground run ${runId}`)
  } catch (error) {
    db.update(playgroundRuns)
      .set({
        error:
          error instanceof Error ? error.message : 'Unknown engine failure',
        judgeTranscriptA: JSON.stringify(judgeTranscriptA),
        judgeTranscriptB: JSON.stringify(judgeTranscriptB),
        leaseToken: null,
        status: 'error',
        transcript: JSON.stringify(transcript),
      })
      .where(
        and(
          eq(playgroundRuns.id, runId),
          eq(playgroundRuns.leaseToken, leaseToken),
        ),
      )
      .run()

    console.error(`[worker] failed playground run ${runId}:`, error)
  } finally {
    inFlightJobKeys.delete(`playground:${runId}`)
    queueMicrotask(() => {
      void pollOnce()
    })
  }
}

async function pollOnce() {
  let capacity = MAX_CONCURRENT - inFlightJobKeys.size

  if (capacity <= 0) {
    return
  }

  const queuedMatches = listQueuedMatches()
    .filter((match) => !inFlightJobKeys.has(`match:${match.id}`))
    .slice(0, capacity)

  for (const match of queuedMatches) {
    const claimed = claimQueuedMatch(match.id)

    if (!claimed) {
      continue
    }

    inFlightJobKeys.add(`match:${match.id}`)
    void runClaimedMatch(match.id, claimed.leaseToken)
  }

  capacity = MAX_CONCURRENT - inFlightJobKeys.size

  if (capacity <= 0) {
    return
  }

  const queuedPlaygroundRuns = listQueuedPlaygroundRuns()
    .filter((run) => !inFlightJobKeys.has(`playground:${run.id}`))
    .slice(0, capacity)

  for (const run of queuedPlaygroundRuns) {
    const claimed = claimPlaygroundRun(run.id)

    if (!claimed) {
      continue
    }

    inFlightJobKeys.add(`playground:${run.id}`)
    void runClaimedPlaygroundRun(run.id, claimed.leaseToken)
  }
}

export function startWorker() {
  if (intervalId) {
    return
  }

  recoverInterruptedMatches()
  recoverInterruptedPlaygroundRuns()
  intervalId = setInterval(() => {
    void pollOnce()
  }, WORKER_POLL_INTERVAL_MS)

  void pollOnce()
  console.log('[worker] started')
}

export function kickWorker() {
  startWorker()
  void pollOnce()
}

registerWorkerKickHandler(() => {
  startWorker()
  void pollOnce()
})
