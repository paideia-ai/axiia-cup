import { describe, expect, it } from 'bun:test'
import {
  getJudgeOsExpectedCount,
  type JudgeOsEntry,
  type TranscriptTurn,
} from '@axiia/shared'

import { shangyangJudgeOsPrompt } from '../db/shangyang-judge-os-prompt'
import {
  buildJudgeOsProvenance,
  buildJudgeOsUserMessage,
  createJudgeOsSidecar,
  validateJudgeOsResponse,
} from './judge-os'

function transcript(count: number): TranscriptTurn[] {
  return Array.from({ length: count }, (_, index) => ({
    content: `发言-${index + 1}`,
    role: index % 2 === 0 ? '商鞅' : '甘龙',
    speaker: index % 2 === 0 ? ('a' as const) : ('b' as const),
  }))
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

describe('judge OS prompt input', () => {
  it('records the exact model, prompt, and request settings', () => {
    const provenance = buildJudgeOsProvenance({
      dialogueTurnCount: 10,
      model: 'glm-5.1',
      systemPrompt: shangyangJudgeOsPrompt,
    })

    expect(provenance).toMatchObject({
      contextVariant: 'C0',
      dialogueTurnCount: 10,
      finalTurnExcluded: true,
      jsonMode: true,
      model: 'glm-5.1',
      systemPrompt: shangyangJudgeOsPrompt,
      temperature: 0,
      thinkingMode: 'provider-default',
    })
    expect(provenance.systemPromptSha256).toHaveLength(64)
  })

  it('counts every completed pair except a pair ending on the final turn', () => {
    expect(getJudgeOsExpectedCount(2, 10)).toBe(1)
    expect(getJudgeOsExpectedCount(8, 10)).toBe(4)
    expect(getJudgeOsExpectedCount(10, 10)).toBe(4)
    expect(getJudgeOsExpectedCount(20, 20)).toBe(9)
  })

  it('requires a reason for every current tendency', () => {
    expect(shangyangJudgeOsPrompt).toContain('reason：必须始终输出')
    expect(shangyangJudgeOsPrompt).toContain(
      '无论倾向是否与此前相同，都必须给出 reason',
    )
    expect(shangyangJudgeOsPrompt).toContain('不得考虑此前自己的倾向')
  })

  it('contains only the immediate dialogue pair', () => {
    const turns = transcript(4).slice(2) as [TranscriptTurn, TranscriptTurn]
    const message = buildJudgeOsUserMessage({
      afterTurn: 4,
      turns,
    })

    expect(message).toContain('发言-3')
    expect(message).toContain('发言-4')
    expect(message).not.toContain('发言-1')
    expect(message).not.toContain('发言-2')
    expect(message).not.toContain('上一次倾向')
  })
})

describe('validateJudgeOsResponse', () => {
  it('accepts a current tendency with a reason', () => {
    expect(
      validateJudgeOsResponse(
        {
          afterTurn: 2,
          tendency: '甘龙',
          reason: '甘龙指出骤然更法会动摇宗室根基',
        },
        2,
      ),
    ).toEqual({
      afterTurn: 2,
      tendency: '甘龙',
      reason: '甘龙指出骤然更法会动摇宗室根基',
    })
  })

  it('always requires a reason', () => {
    expect(() =>
      validateJudgeOsResponse({ afterTurn: 2, tendency: '甘龙' }, 2),
    ).toThrow()
  })

  it('rejects wrong turn numbers and extra fields', () => {
    expect(() =>
      validateJudgeOsResponse(
        { afterTurn: 4, tendency: '甘龙', reason: '甘龙陈说更稳妥' },
        2,
      ),
    ).toThrow('afterTurn mismatch')
    expect(() =>
      validateJudgeOsResponse(
        {
          afterTurn: 2,
          extra: true,
          tendency: '甘龙',
          reason: '甘龙陈说更稳妥',
        },
        2,
      ),
    ).toThrow()
  })
})

describe('createJudgeOsSidecar', () => {
  it('starts completed pairs concurrently and publishes out-of-order results in turn order', async () => {
    const first = deferred<JudgeOsEntry>()
    const second = deferred<JudgeOsEntry>()
    const firstStarted = deferred<void>()
    const secondStarted = deferred<void>()
    const calls: number[] = []
    const updates: JudgeOsEntry[][] = []
    let activeCount = 0
    let maxActiveCount = 0

    const sidecar = createJudgeOsSidecar({
      enabled: true,
      generate: async (request) => {
        calls.push(request.afterTurn)
        activeCount += 1
        maxActiveCount = Math.max(maxActiveCount, activeCount)
        ;(request.afterTurn === 2 ? firstStarted : secondStarted).resolve()

        try {
          return await (request.afterTurn === 2
            ? first.promise
            : second.promise)
        } finally {
          activeCount -= 1
        }
      },
      maxAfterTurnExclusive: 6,
      onUpdate: (state) => {
        updates.push(state.entries)
      },
    })

    sidecar.schedule(transcript(2))
    await firstStarted.promise
    expect(calls).toEqual([2])

    // The next pair starts while turn 2 is still unresolved.
    sidecar.schedule(transcript(4))
    await secondStarted.promise

    expect(calls).toEqual([2, 4])
    expect(maxActiveCount).toBe(2)

    second.resolve({
      afterTurn: 4,
      tendency: '商鞅',
      reason: '商鞅提出可核验的施行办法',
    })
    await second.promise
    await Promise.resolve()

    expect(sidecar.getEntries()).toEqual([])
    expect(updates).toEqual([])

    first.resolve({
      afterTurn: 2,
      tendency: '甘龙',
      reason: '甘龙指出轻率更法会危及宗室根基',
    })

    await expect(sidecar.wait()).resolves.toEqual({
      entries: [
        {
          afterTurn: 2,
          tendency: '甘龙',
          reason: '甘龙指出轻率更法会危及宗室根基',
        },
        {
          afterTurn: 4,
          tendency: '商鞅',
          reason: '商鞅提出可核验的施行办法',
        },
      ],
      failedTurns: [],
    })
    expect(updates).toEqual([
      [
        {
          afterTurn: 2,
          tendency: '甘龙',
          reason: '甘龙指出轻率更法会危及宗室根基',
        },
        {
          afterTurn: 4,
          tendency: '商鞅',
          reason: '商鞅提出可核验的施行办法',
        },
      ],
    ])
  })

  it('serializes persistence snapshots so an older write cannot overwrite a newer one', async () => {
    const firstPersistStarted = deferred<void>()
    const releaseFirstPersist = deferred<void>()
    const persistedTurns: number[][] = []
    let activePersistCount = 0
    let maxActivePersistCount = 0

    const sidecar = createJudgeOsSidecar({
      enabled: true,
      generate: async (request) => ({
        afterTurn: request.afterTurn,
        tendency: request.afterTurn === 2 ? '甘龙' : '商鞅',
        reason:
          request.afterTurn === 2
            ? '甘龙指出骤然更法的风险'
            : '商鞅给出了可核验的施行办法',
      }),
      maxAfterTurnExclusive: 6,
      onUpdate: async (state) => {
        persistedTurns.push(state.entries.map((entry) => entry.afterTurn))
        activePersistCount += 1
        maxActivePersistCount = Math.max(
          maxActivePersistCount,
          activePersistCount,
        )

        try {
          if (state.entries.length === 1) {
            firstPersistStarted.resolve()
            await releaseFirstPersist.promise
          }
        } finally {
          activePersistCount -= 1
        }
      },
    })

    sidecar.schedule(transcript(2))
    await firstPersistStarted.promise

    sidecar.schedule(transcript(4))
    for (let index = 0; index < 3; index += 1) {
      await Promise.resolve()
    }

    expect(sidecar.getEntries().map((entry) => entry.afterTurn)).toEqual([2, 4])
    expect(persistedTurns).toEqual([[2]])

    releaseFirstPersist.resolve()
    await sidecar.wait()

    expect(persistedTurns).toEqual([[2], [2, 4]])
    expect(maxActivePersistCount).toBe(1)
  })

  it('recovers only missing completed pairs without duplicating persisted OS', async () => {
    const requestedTurns: number[] = []
    const updates: JudgeOsEntry[][] = []

    const sidecar = createJudgeOsSidecar({
      enabled: true,
      generate: async (request) => {
        requestedTurns.push(request.afterTurn)
        return {
          afterTurn: request.afterTurn,
          tendency: '甘龙',
          reason: '甘龙更能说明眼下施政风险',
        }
      },
      initialEntries: [
        {
          afterTurn: 2,
          tendency: '甘龙',
          reason: '甘龙更能说明眼下施政风险',
        },
      ],
      maxAfterTurnExclusive: 8,
      onUpdate: (state) => {
        updates.push(state.entries)
      },
    })

    sidecar.schedule(transcript(6))

    await expect(sidecar.wait()).resolves.toEqual({
      entries: [
        {
          afterTurn: 2,
          tendency: '甘龙',
          reason: '甘龙更能说明眼下施政风险',
        },
        {
          afterTurn: 4,
          tendency: '甘龙',
          reason: '甘龙更能说明眼下施政风险',
        },
        {
          afterTurn: 6,
          tendency: '甘龙',
          reason: '甘龙更能说明眼下施政风险',
        },
      ],
      failedTurns: [],
    })
    expect(requestedTurns).toEqual([4, 6])
    expect(updates[updates.length - 1]).toEqual([
      {
        afterTurn: 2,
        tendency: '甘龙',
        reason: '甘龙更能说明眼下施政风险',
      },
      {
        afterTurn: 4,
        tendency: '甘龙',
        reason: '甘龙更能说明眼下施政风险',
      },
      {
        afterTurn: 6,
        tendency: '甘龙',
        reason: '甘龙更能说明眼下施政风险',
      },
    ])
  })

  it('does nothing when disabled', async () => {
    let callCount = 0
    const sidecar = createJudgeOsSidecar({
      enabled: false,
      generate: async () => {
        callCount += 1
        return {
          afterTurn: 2,
          tendency: '甘龙',
          reason: '甘龙更能说明眼下施政风险',
        }
      },
      maxAfterTurnExclusive: 6,
    })

    sidecar.schedule(transcript(4))

    await expect(sidecar.wait()).resolves.toEqual({
      entries: [],
      failedTurns: [],
    })
    expect(callCount).toBe(0)
  })

  it('does not generate an OS for the final dialogue pair', async () => {
    const requestedTurns: number[] = []
    const sidecar = createJudgeOsSidecar({
      enabled: true,
      generate: async (request) => {
        requestedTurns.push(request.afterTurn)
        return {
          afterTurn: request.afterTurn,
          tendency: '甘龙',
          reason: '甘龙此轮更稳妥',
        }
      },
      maxAfterTurnExclusive: 10,
    })

    sidecar.schedule(transcript(10))
    await sidecar.wait()

    expect(requestedTurns).toEqual([2, 4, 6, 8])
  })

  it('publishes a failed earlier slot before a later successful result', async () => {
    const first = deferred<JudgeOsEntry>()
    const second = deferred<JudgeOsEntry>()
    const updates: Array<{ entries: number[]; failedTurns: number[] }> = []
    const sidecar = createJudgeOsSidecar({
      enabled: true,
      generate: (request) =>
        request.afterTurn === 2 ? first.promise : second.promise,
      maxAfterTurnExclusive: 6,
      onUpdate: (state) => {
        updates.push({
          entries: state.entries.map((entry) => entry.afterTurn),
          failedTurns: state.failedTurns,
        })
      },
    })

    sidecar.schedule(transcript(4))
    second.resolve({
      afterTurn: 4,
      tendency: '商鞅',
      reason: '商鞅给出了可行办法',
    })
    await Promise.resolve()
    expect(updates).toEqual([])

    // Rejecting a deferred promise is intentionally avoided to keep this test
    // free of transient unhandled-rejection reporting; an invalid response has
    // the same sidecar failure semantics.
    first.resolve({
      afterTurn: 99,
      tendency: '甘龙',
      reason: '无效回合',
    })

    await expect(sidecar.wait()).resolves.toEqual({
      entries: [
        {
          afterTurn: 4,
          tendency: '商鞅',
          reason: '商鞅给出了可行办法',
        },
      ],
      failedTurns: [2],
    })
    expect(updates).toEqual([{ entries: [4], failedTurns: [2] }])
  })

  it('marks unresolved slots unavailable after the bounded final wait', async () => {
    const never = deferred<JudgeOsEntry>()
    let timedOut = false
    const sidecar = createJudgeOsSidecar({
      enabled: true,
      generate: () => never.promise,
      maxAfterTurnExclusive: 4,
    })

    sidecar.schedule(transcript(2))

    await expect(
      sidecar.wait({
        onTimeout: () => {
          timedOut = true
        },
        timeoutMs: 1,
      }),
    ).resolves.toEqual({ entries: [], failedTurns: [2] })
    expect(timedOut).toBe(true)
  })
})
