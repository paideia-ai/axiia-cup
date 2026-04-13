export const TOURNAMENT_TERMINATED_MESSAGE = '管理员手动终止了当前赛事'

const activeMatchControllers = new Map<number, AbortController>()

export function registerMatchAbortController(
  matchId: number,
  controller: AbortController,
) {
  activeMatchControllers.set(matchId, controller)
}

export function unregisterMatchAbortController(
  matchId: number,
  controller?: AbortController,
) {
  const activeController = activeMatchControllers.get(matchId)

  if (!activeController) {
    return
  }

  if (!controller || activeController === controller) {
    activeMatchControllers.delete(matchId)
  }
}

export function interruptActiveMatch(
  matchId: number,
  reason = TOURNAMENT_TERMINATED_MESSAGE,
) {
  const controller = activeMatchControllers.get(matchId)

  if (!controller) {
    return false
  }

  controller.abort(reason)
  return true
}
