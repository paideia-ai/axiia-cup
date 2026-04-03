/**
 * Lightweight kick signal to wake the worker on new jobs.
 * This module exists to break a circular dependency:
 * worker.ts → runner.ts → lib/tournaments.ts → (needs kickWorker) → worker.ts
 */
let kickHandler: (() => void) | null = null

export function registerWorkerKickHandler(handler: () => void) {
  kickHandler = handler
}

export function kickWorker() {
  kickHandler?.()
}
