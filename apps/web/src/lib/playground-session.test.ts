/// <reference types="bun-types" />

import { describe, expect, it } from 'bun:test'

import {
  canReusePlaygroundSession,
  resolvePlaygroundSession,
  type PlaygroundSession,
} from './playground-session'

function createSession(
  overrides: Partial<PlaygroundSession> = {},
): PlaygroundSession {
  return {
    error: null,
    opponentMode: 'self',
    presetOpponentId: null,
    requestId: 'req-1',
    run: null,
    runId: null,
    scenarioId: 'shangyang-court',
    startedAt: Date.parse('2026-04-07T09:22:45Z'),
    status: 'running',
    submissionCreatedAt: '2026-04-07 09:22:43',
    submissionId: 1,
    turnCount: 10,
    ...overrides,
  }
}

describe('resolvePlaygroundSession', () => {
  it('marks cached sessions stale when submission ids are reused after a reset', () => {
    const session = createSession({
      runId: 7,
      submissionCreatedAt: '2026-04-06 08:00:00',
    })

    const result = resolvePlaygroundSession(
      session,
      {
        createdAt: '2026-04-07 09:22:43',
        id: 1,
        scenarioId: 'shangyang-court',
      },
      [
        {
          createdAt: '2026-04-06 08:01:00',
          error: null,
          id: 7,
          opponentMode: 'self' as const,
          presetOpponentId: null,
          scoreA: 1,
          scoreB: 0,
          submissionId: 1,
          winner: 'a',
        },
      ],
    )

    expect(result).toEqual({ kind: 'stale' })
  })

  it('marks persisted transcripts stale when the backend has no matching run', () => {
    const session = createSession({
      run: {
        actualPromptA: null,
        actualPromptB: null,
        createdAt: '2026-04-07 09:22:50',
        error: null,
        finishedAt: null,
        id: 9,
        infoAssignment: null,
        judgeDecision: null,
        judgeTranscriptA: [],
        judgeTranscriptB: [],
        opponentMode: 'self' as const,
        presetOpponentId: null,
        presetOpponentLabel: null,
        presetOpponentRole: null,
        reasoning: null,
        scenarioId: 'shangyang-court',
        scoreA: null,
        scoreB: null,
        startedAt: null,
        submissionId: 1,
        transcript: [],
        updatedAt: '2026-04-07 09:22:50',
        winner: null,
      },
      runId: 9,
    })

    const result = resolvePlaygroundSession(
      session,
      {
        createdAt: '2026-04-07 09:22:43',
        id: 1,
        scenarioId: 'shangyang-court',
      },
      [],
    )

    expect(result).toEqual({ kind: 'stale' })
  })

  it('keeps a fresh in-flight session while the run is still being created', () => {
    const startedAt = Date.parse('2026-04-07T09:22:45Z')
    const session = createSession({ startedAt })

    const result = resolvePlaygroundSession(
      session,
      {
        createdAt: '2026-04-07 09:22:43',
        id: 1,
        scenarioId: 'shangyang-court',
      },
      [],
      startedAt + 10_000,
    )

    expect(result).toEqual({ kind: 'pending' })
  })

  it('resolves to a backend run once the server has recorded it', () => {
    const startedAt = Date.parse('2026-04-07T09:22:45Z')
    const session = createSession({ startedAt })

    const result = resolvePlaygroundSession(
      session,
      {
        createdAt: '2026-04-07 09:22:43',
        id: 1,
        scenarioId: 'shangyang-court',
      },
      [
        {
          createdAt: '2026-04-07 09:22:47',
          error: null,
          id: 11,
          opponentMode: 'self' as const,
          presetOpponentId: null,
          scoreA: null,
          scoreB: null,
          submissionId: 1,
          winner: null,
        },
      ],
      startedAt + 2_000,
    )

    expect(result).toEqual({ kind: 'run', runId: 11 })
  })
})

describe('canReusePlaygroundSession', () => {
  it('does not reuse an old running session when the turn count changed', () => {
    const session = createSession({
      scenarioId: 'trolley-problem',
      turnCount: 10,
    })

    expect(
      canReusePlaygroundSession(session, {
        scenarioId: 'trolley-problem',
        submissionCreatedAt: session.submissionCreatedAt,
        submissionId: session.submissionId,
        turnCount: 30,
      }),
    ).toBe(false)
  })

  it('does not reuse a running session when opponent mode changed', () => {
    const session = createSession({
      opponentMode: 'self',
      presetOpponentId: null,
    })

    expect(
      canReusePlaygroundSession(session, {
        opponentMode: 'preset',
        presetOpponentId: 5,
        scenarioId: session.scenarioId,
        submissionCreatedAt: session.submissionCreatedAt,
        submissionId: session.submissionId,
        turnCount: session.turnCount,
      }),
    ).toBe(false)
  })

  it('reuses the matching running session', () => {
    const session = createSession({
      opponentMode: 'preset',
      presetOpponentId: 5,
    })

    expect(
      canReusePlaygroundSession(session, {
        opponentMode: 'preset',
        presetOpponentId: 5,
        scenarioId: session.scenarioId,
        submissionCreatedAt: session.submissionCreatedAt,
        submissionId: session.submissionId,
        turnCount: session.turnCount,
      }),
    ).toBe(true)
  })
})
