export interface JudgePromptCoachScope {
  accountID: string
  scenarioID: string
}

interface JudgePromptCoachState {
  viewed: boolean
  completed: boolean
}

const PREFIX = 'axiia:judge-prompt-coach:v1'

function keyOf(scope: JudgePromptCoachScope) {
  return `${PREFIX}:${encodeURIComponent(scope.accountID)}:${
    encodeURIComponent(scope.scenarioID)
  }`
}

function read(
  scope: JudgePromptCoachScope,
  storage: Pick<Storage, 'getItem'> = localStorage,
): JudgePromptCoachState {
  try {
    const value = JSON.parse(storage.getItem(keyOf(scope)) ?? 'null')
    return {
      viewed: value?.viewed === true,
      completed: value?.completed === true,
    }
  } catch {
    return { viewed: false, completed: false }
  }
}

function write(
  scope: JudgePromptCoachScope,
  value: JudgePromptCoachState,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  try {
    storage.setItem(keyOf(scope), JSON.stringify(value))
  } catch {
    // Coaching must never block navigation or saving when storage is unavailable.
  }
}

export function judgePromptCoachCompleted(
  scope: JudgePromptCoachScope,
  storage?: Pick<Storage, 'getItem'>,
) {
  return read(scope, storage).completed
}

export function markJudgePromptViewed(
  scope: JudgePromptCoachScope,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const current = read(scope, storage)
  write(scope, { ...current, viewed: true }, storage)
}

export function completeJudgePromptCoachAfterSave(
  scope: JudgePromptCoachScope,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const current = read(scope, storage)
  if (!current.viewed) return false
  write(scope, { viewed: true, completed: true }, storage)
  return true
}
