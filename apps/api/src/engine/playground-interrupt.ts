import { APIUserAbortError } from 'openai'

export const PLAYGROUND_RUN_INTERRUPTED_MESSAGE =
  '用户手动中断了本次试炼场运行'

const activePlaygroundControllers = new Map<number, AbortController>()

export class PlaygroundRunInterruptedError extends Error {
  constructor(message = PLAYGROUND_RUN_INTERRUPTED_MESSAGE) {
    super(message)
    this.name = 'PlaygroundRunInterruptedError'
  }
}

export function getPlaygroundInterruptMessage(signal?: AbortSignal) {
  if (typeof signal?.reason === 'string' && signal.reason.trim().length > 0) {
    return signal.reason
  }

  return PLAYGROUND_RUN_INTERRUPTED_MESSAGE
}

export function isPlaygroundRunInterruptedError(error: unknown) {
  return (
    error instanceof PlaygroundRunInterruptedError ||
    error instanceof APIUserAbortError ||
    (error instanceof Error && error.name === 'AbortError')
  )
}

export function throwIfPlaygroundRunInterrupted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new PlaygroundRunInterruptedError(getPlaygroundInterruptMessage(signal))
  }
}

export function registerPlaygroundAbortController(
  runId: number,
  controller: AbortController,
) {
  activePlaygroundControllers.set(runId, controller)
}

export function unregisterPlaygroundAbortController(
  runId: number,
  controller?: AbortController,
) {
  const activeController = activePlaygroundControllers.get(runId)

  if (!activeController) {
    return
  }

  if (!controller || activeController === controller) {
    activePlaygroundControllers.delete(runId)
  }
}

export function interruptActivePlaygroundRun(
  runId: number,
  reason = PLAYGROUND_RUN_INTERRUPTED_MESSAGE,
) {
  const controller = activePlaygroundControllers.get(runId)

  if (!controller) {
    return false
  }

  controller.abort(reason)
  return true
}
