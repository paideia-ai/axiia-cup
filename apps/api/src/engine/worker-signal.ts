let kickHandler: (() => void) | null = null

export function registerWorkerKickHandler(handler: () => void) {
  kickHandler = handler
}

export function kickWorker() {
  kickHandler?.()
}
