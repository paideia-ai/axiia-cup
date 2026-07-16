import { describe, expect, it } from 'bun:test'
import type { JudgeOsEntry, TranscriptTurn } from '@axiia/shared'

import { shangyangJudgeOsPrompt } from '../db/shangyang-judge-os-prompt'
import {
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
      onUpdate: (entries) => {
        updates.push(entries)
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

    await expect(sidecar.wait()).resolves.toEqual([
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
    ])
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
      onUpdate: async (entries) => {
        persistedTurns.push(entries.map((entry) => entry.afterTurn))
        activePersistCount += 1
        maxActivePersistCount = Math.max(
          maxActivePersistCount,
          activePersistCount,
        )

        try {
          if (entries.length === 1) {
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
      onUpdate: (entries) => {
        updates.push(entries)
      },
    })

    sidecar.schedule(transcript(6))

    await expect(sidecar.wait()).resolves.toEqual([
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
    })

    sidecar.schedule(transcript(4))

    await expect(sidecar.wait()).resolves.toEqual([])
    expect(callCount).toBe(0)
  })
})
