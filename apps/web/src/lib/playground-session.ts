import type { PlaygroundRun } from '@axiia/shared'

import { runPlayground } from './api'

const STORAGE_KEY = 'axiia-playground-session-v2'

export type PlaygroundSession = {
  error: string | null
  judgeRounds: number
  requestId: string
  run: PlaygroundRun | null
  runId: number | null
  scenarioId: string
  startedAt: number
  status: 'error' | 'running' | 'success'
  submissionId: number
  turnCount: number
}

type SessionMap = Record<string, PlaygroundSession>

const listeners = new Set<() => void>()
const inflightRequests = new Map<number, string>()

function canUseStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  )
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `playground-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readPersistedState(): SessionMap {
  if (!canUseStorage()) {
    return {}
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    return JSON.parse(raw) as SessionMap
  } catch {
    return {}
  }
}

let sessions = readPersistedState()

function persistState() {
  if (!canUseStorage()) {
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function emit() {
  persistState()

  for (const listener of listeners) {
    listener()
  }
}

function getSessionKey(submissionId: number) {
  return String(submissionId)
}

function setSession(next: PlaygroundSession) {
  sessions = {
    ...sessions,
    [getSessionKey(next.submissionId)]: next,
  }
  emit()
}

function updateSession(
  submissionId: number,
  requestId: string,
  updater: (current: PlaygroundSession) => PlaygroundSession,
) {
  const current = sessions[getSessionKey(submissionId)]

  if (!current || current.requestId !== requestId) {
    return
  }

  setSession(updater(current))
}

export function getPlaygroundSession(submissionId: number) {
  return sessions[getSessionKey(submissionId)] ?? null
}

export function subscribePlaygroundSession(
  submissionId: number,
  listener: (session: PlaygroundSession | null) => void,
) {
  const wrapped = () => {
    listener(getPlaygroundSession(submissionId))
  }

  listeners.add(wrapped)
  wrapped()

  return () => {
    listeners.delete(wrapped)
  }
}

export function clearPlaygroundSession(submissionId: number) {
  const key = getSessionKey(submissionId)
  const current = sessions[key]

  if (!(key in sessions)) {
    return
  }

  const nextSessions = { ...sessions }
  delete nextSessions[key]
  sessions = nextSessions

  if (current && inflightRequests.get(submissionId) === current.requestId) {
    inflightRequests.delete(submissionId)
  }

  emit()
}

export function startPlaygroundRunSession(params: {
  judgeRounds: number
  scenarioId: string
  submissionId: number
  turnCount: number
}) {
  const requestId = createRequestId()
  inflightRequests.set(params.submissionId, requestId)

  setSession({
    error: null,
    judgeRounds: params.judgeRounds,
    requestId,
    run: null,
    runId: null,
    scenarioId: params.scenarioId,
    startedAt: Date.now(),
    status: 'running',
    submissionId: params.submissionId,
    turnCount: params.turnCount,
  })

  return requestId
}

export function syncPlaygroundRun(
  submissionId: number,
  requestId: string,
  run: PlaygroundRun,
) {
  updateSession(submissionId, requestId, (current) => ({
    ...current,
    error: run.error ?? null,
    run,
    runId: run.id,
    status: run.error
      ? 'error'
      : run.scoreA != null || run.scoreB != null || run.winner != null
        ? 'success'
        : 'running',
  }))
}

export function failPlaygroundRun(
  submissionId: number,
  requestId: string,
  error: string,
) {
  updateSession(submissionId, requestId, (current) => ({
    ...current,
    error,
    status: 'error',
  }))
}

export function startTrackedPlaygroundRun(params: {
  judgeRounds: number
  scenarioId: string
  submissionId: number
  turnCount: number
}) {
  const existing = getPlaygroundSession(params.submissionId)

  if (existing?.status === 'running') {
    return existing.requestId
  }

  const requestId = startPlaygroundRunSession(params)

  void runPlayground(params.submissionId)
    .then((run) => {
      syncPlaygroundRun(params.submissionId, requestId, run)
    })
    .catch((error) => {
      failPlaygroundRun(
        params.submissionId,
        requestId,
        error instanceof Error ? error.message : '试炼场运行失败',
      )
    })
    .finally(() => {
      if (inflightRequests.get(params.submissionId) === requestId) {
        inflightRequests.delete(params.submissionId)
      }
    })

  return requestId
}
