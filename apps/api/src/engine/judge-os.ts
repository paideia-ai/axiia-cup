import {
  judgeOsEntrySchema,
  type JudgeOsEntry,
  type TranscriptTurn,
} from '@axiia/shared'

export const SHANGYANG_JUDGE_OS_SCENARIO_ID = 'shangyang-court'

type JudgeOsGenerationRequest = {
  afterTurn: number
  turns: [TranscriptTurn, TranscriptTurn]
}

type JudgeOsSidecarParams = {
  enabled: boolean
  generate: (request: JudgeOsGenerationRequest) => Promise<JudgeOsEntry>
  initialEntries?: JudgeOsEntry[]
  onUpdate?: (entries: JudgeOsEntry[]) => Promise<void> | void
}

export function buildJudgeOsUserMessage(
  request: JudgeOsGenerationRequest,
): string {
  const [firstTurn, secondTurn] = request.turns

  return [
    `本次记录发生在第 ${request.afterTurn} 回合之后。`,
    '',
    '以下是此次唯一可以审视的两次发言：',
    `【第 ${request.afterTurn - 1} 回合 · ${firstTurn.role}】`,
    firstTurn.content,
    '',
    `【第 ${request.afterTurn} 回合 · ${secondTurn.role}】`,
    secondTurn.content,
    '',
    '只根据以上两次发言，按系统规定的 JSON 格式记录此刻的内心倾向。',
  ].join('\n')
}

export function validateJudgeOsResponse(
  value: unknown,
  expectedAfterTurn: number,
): JudgeOsEntry {
  const parsed = judgeOsEntrySchema.parse(value)

  if (parsed.afterTurn !== expectedAfterTurn) {
    throw new Error(
      `Judge OS afterTurn mismatch: expected ${expectedAfterTurn}, received ${parsed.afterTurn}`,
    )
  }

  return parsed
}

function validatePersistedJudgeOsEntries(entries: JudgeOsEntry[]) {
  return entries.map((entry, index) =>
    validateJudgeOsResponse(entry, (index + 1) * 2),
  )
}

export function createJudgeOsSidecar(params: JudgeOsSidecarParams) {
  const entries = validatePersistedJudgeOsEntries(params.initialEntries ?? [])
  const completedEntries = new Map<number, JudgeOsEntry>()
  const generationTasks: Promise<void>[] = []
  const scheduledTurns = new Set(entries.map((entry) => entry.afterTurn))
  let failure: unknown = null
  let persistenceQueue = Promise.resolve()

  function recordFailure(error: unknown) {
    if (failure === null) {
      failure = error
    }
  }

  function publishReadyEntries() {
    let nextTurn = (entries.length + 1) * 2
    let changed = false

    while (completedEntries.has(nextTurn)) {
      entries.push(completedEntries.get(nextTurn)!)
      completedEntries.delete(nextTurn)
      nextTurn += 2
      changed = true
    }

    if (!changed) {
      return
    }

    const snapshot = [...entries]
    persistenceQueue = persistenceQueue.then(async () => {
      try {
        await params.onUpdate?.(snapshot)
      } catch (error) {
        recordFailure(error)
      }
      return undefined
    })
  }

  function schedule(transcript: TranscriptTurn[]) {
    if (!params.enabled) {
      return
    }

    const lastCompletePairTurn = transcript.length - (transcript.length % 2)

    for (let afterTurn = 2; afterTurn <= lastCompletePairTurn; afterTurn += 2) {
      if (scheduledTurns.has(afterTurn)) {
        continue
      }

      const firstTurn = transcript[afterTurn - 2]
      const secondTurn = transcript[afterTurn - 1]

      if (!firstTurn || !secondTurn) {
        throw new Error(`Missing dialogue turns for judge OS at ${afterTurn}`)
      }

      if (firstTurn.speaker !== 'a' || secondTurn.speaker !== 'b') {
        throw new Error(
          `Invalid speaker order for judge OS at ${afterTurn}: expected a,b`,
        )
      }

      const turns: [TranscriptTurn, TranscriptTurn] = [
        { ...firstTurn },
        { ...secondTurn },
      ]
      scheduledTurns.add(afterTurn)

      const task = (async () => {
        try {
          const entry = await params.generate({
            afterTurn,
            turns,
          })
          completedEntries.set(
            afterTurn,
            validateJudgeOsResponse(entry, afterTurn),
          )
          publishReadyEntries()
        } catch (error) {
          recordFailure(error)
        }
      })()
      generationTasks.push(task)
    }
  }

  async function wait() {
    await Promise.all(generationTasks)
    await persistenceQueue

    if (failure !== null) {
      throw failure
    }

    return [...entries]
  }

  return {
    getEntries: () => [...entries],
    schedule,
    wait,
  }
}

export type { JudgeOsGenerationRequest }
