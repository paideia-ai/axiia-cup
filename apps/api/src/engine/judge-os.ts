import { createHash } from 'node:crypto'

import {
  evaluationModelIdSchema,
  getModelDefinition,
  judgeOsEntrySchema,
  judgeOsProvenanceSchema,
  type JudgeOsEntry,
  type JudgeOsProvenance,
  type TranscriptTurn,
} from '@axiia/shared'

type JudgeOsGenerationRequest = {
  afterTurn: number
  turns: [TranscriptTurn, TranscriptTurn]
}

type JudgeOsState = {
  entries: JudgeOsEntry[]
  failedTurns: number[]
}

type JudgeOsSidecarParams = {
  enabled: boolean
  generate: (request: JudgeOsGenerationRequest) => Promise<JudgeOsEntry>
  initialEntries?: JudgeOsEntry[]
  initialFailedTurns?: number[]
  maxAfterTurnExclusive: number
  onUpdate?: (state: JudgeOsState) => Promise<void> | void
}

type JudgeOsWaitOptions = {
  onTimeout?: () => void
  timeoutMs?: number
}

export function buildJudgeOsProvenance(params: {
  dialogueTurnCount: number
  model: string
  systemPrompt: string
}): JudgeOsProvenance {
  const model = evaluationModelIdSchema.parse(params.model)
  const systemPrompt = params.systemPrompt.trim()
  const modelDefinition = getModelDefinition(model)

  return judgeOsProvenanceSchema.parse({
    schemaVersion: 1,
    contextVariant: 'C0',
    dialogueTurnCount: params.dialogueTurnCount,
    finalTurnExcluded: true,
    jsonMode: true,
    model,
    systemPrompt,
    systemPromptSha256: createHash('sha256').update(systemPrompt).digest('hex'),
    temperature: 0,
    thinkingMode:
      modelDefinition.thinking === 'disabled' ? 'disabled' : 'provider-default',
  })
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

function normalizePersistedState(
  initialEntries: JudgeOsEntry[],
  initialFailedTurns: number[],
  maxAfterTurnExclusive: number,
): JudgeOsState {
  const entriesByTurn = new Map<number, JudgeOsEntry>()
  const failedTurnSet = new Set<number>()

  for (const value of initialEntries) {
    const parsed = judgeOsEntrySchema.safeParse(value)
    if (
      parsed.success &&
      parsed.data.afterTurn < maxAfterTurnExclusive &&
      !entriesByTurn.has(parsed.data.afterTurn)
    ) {
      entriesByTurn.set(parsed.data.afterTurn, parsed.data)
    }
  }

  for (const value of initialFailedTurns) {
    if (
      Number.isInteger(value) &&
      value > 0 &&
      value % 2 === 0 &&
      value < maxAfterTurnExclusive &&
      !entriesByTurn.has(value)
    ) {
      failedTurnSet.add(value)
    }
  }

  const entries: JudgeOsEntry[] = []
  const failedTurns: number[] = []

  // Only a continuous settled prefix is trusted. A later orphaned result is
  // regenerated so publication ordering remains deterministic after recovery.
  for (let afterTurn = 2; afterTurn < maxAfterTurnExclusive; afterTurn += 2) {
    const entry = entriesByTurn.get(afterTurn)
    if (entry) {
      entries.push(entry)
      continue
    }
    if (failedTurnSet.has(afterTurn)) {
      failedTurns.push(afterTurn)
      continue
    }
    break
  }

  return { entries, failedTurns }
}

export function createJudgeOsSidecar(params: JudgeOsSidecarParams) {
  const maxAfterTurnExclusive = Math.max(
    0,
    Math.floor(params.maxAfterTurnExclusive),
  )
  const initialState = normalizePersistedState(
    params.initialEntries ?? [],
    params.initialFailedTurns ?? [],
    maxAfterTurnExclusive,
  )
  const entries = [...initialState.entries]
  const failedTurns = [...initialState.failedTurns]
  const completedOutcomes = new Map<number, JudgeOsEntry | null>()
  const generationTasks: Promise<void>[] = []
  const scheduledTurns = new Set([
    ...entries.map((entry) => entry.afterTurn),
    ...failedTurns,
  ])
  let nextPublishTurn = (entries.length + failedTurns.length + 1) * 2
  let acceptingResults = true
  let persistenceQueue = Promise.resolve()

  function snapshot(): JudgeOsState {
    return {
      entries: [...entries],
      failedTurns: [...failedTurns],
    }
  }

  function publishReadyOutcomes() {
    let changed = false

    while (completedOutcomes.has(nextPublishTurn)) {
      const outcome = completedOutcomes.get(nextPublishTurn)
      completedOutcomes.delete(nextPublishTurn)

      if (outcome) {
        entries.push(outcome)
      } else {
        failedTurns.push(nextPublishTurn)
      }

      nextPublishTurn += 2
      changed = true
    }

    if (!changed) {
      return
    }

    const nextState = snapshot()
    persistenceQueue = persistenceQueue.then(async () => {
      try {
        await params.onUpdate?.(nextState)
      } catch {
        // Judge OS is display-only. The final result write gets another chance
        // to persist the in-memory state, so this sidecar must not fail a match.
      }
      return undefined
    })
  }

  function settle(afterTurn: number, outcome: JudgeOsEntry | null) {
    if (!acceptingResults) {
      return
    }

    completedOutcomes.set(afterTurn, outcome)
    publishReadyOutcomes()
  }

  function schedule(transcript: TranscriptTurn[]) {
    if (!params.enabled) {
      return
    }

    const lastCompletePairTurn = transcript.length - (transcript.length % 2)

    for (
      let afterTurn = 2;
      afterTurn <= lastCompletePairTurn && afterTurn < maxAfterTurnExclusive;
      afterTurn += 2
    ) {
      if (scheduledTurns.has(afterTurn)) {
        continue
      }

      scheduledTurns.add(afterTurn)
      const firstTurn = transcript[afterTurn - 2]
      const secondTurn = transcript[afterTurn - 1]

      if (
        !firstTurn ||
        !secondTurn ||
        firstTurn.speaker !== 'a' ||
        secondTurn.speaker !== 'b'
      ) {
        settle(afterTurn, null)
        continue
      }

      const turns: [TranscriptTurn, TranscriptTurn] = [
        { ...firstTurn },
        { ...secondTurn },
      ]

      const task = (async () => {
        try {
          const entry = await params.generate({ afterTurn, turns })
          settle(afterTurn, validateJudgeOsResponse(entry, afterTurn))
        } catch {
          settle(afterTurn, null)
        }
      })()
      generationTasks.push(task)
    }
  }

  async function wait(options: JudgeOsWaitOptions = {}) {
    const timeoutMs = options.timeoutMs
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const generationFinished = Promise.all(generationTasks).then(() => true)
    const finished =
      timeoutMs && timeoutMs > 0
        ? await Promise.race([
            generationFinished,
            new Promise<false>((resolve) => {
              timeoutId = setTimeout(() => resolve(false), timeoutMs)
            }),
          ])
        : await generationFinished

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!finished) {
      acceptingResults = false
      try {
        options.onTimeout?.()
      } catch {
        // Cleanup hooks are also best-effort.
      }

      const publishedTurns = new Set([
        ...entries.map((entry) => entry.afterTurn),
        ...failedTurns,
      ])
      for (const afterTurn of scheduledTurns) {
        if (
          !publishedTurns.has(afterTurn) &&
          !completedOutcomes.has(afterTurn)
        ) {
          completedOutcomes.set(afterTurn, null)
        }
      }
      publishReadyOutcomes()
    }

    await persistenceQueue
    return snapshot()
  }

  return {
    getEntries: () => [...entries],
    getFailedTurns: () => [...failedTurns],
    getState: snapshot,
    schedule,
    wait,
  }
}

export type { JudgeOsGenerationRequest, JudgeOsState }
