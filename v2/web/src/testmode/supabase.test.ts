import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('Test Mode 条款结果', () => {
  it('把固定版本分别写进对应条款记录，步骤进度记录不冒充条款版本', async () => {
    vi.stubEnv('VITE_TM_BOARD_URL', 'https://board.test')
    vi.stubEnv('VITE_TM_BOARD_ANON_KEY', 'test-anon-key')
    const { recordStep } = await import('./supabase')
    const calls: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        calls.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
        return new Response('null', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }),
    )

    await recordStep({
      stepId: 'HV-TEST-S01',
      clauseIds: ['U10-C03', 'U05-C08'],
      primary: ['U10-C03'],
      versionPins: {
        'U10-C03': 'comment-v2:U10-C03',
        'U05-C08': 'confirmed-2026-09-06-u05-c08',
      },
      choice: 'pass',
      note: '',
      identity: { name: 'tester', pwd: 'secret', role: 'tester' },
    })

    const byCard = new Map(calls.map((call) => [String(call.p_card), call]))
    expect(
      JSON.parse(String(byCard.get('ss:U10-C03')?.p_note)).clauseVersion,
    ).toBe('comment-v2:U10-C03')
    expect(
      JSON.parse(String(byCard.get('ss:U05-C08')?.p_note)).clauseVersion,
    ).toBe('confirmed-2026-09-06-u05-c08')
    expect(
      JSON.parse(String(byCard.get('pjg:HV-TEST-S01')?.p_note)),
    ).not.toHaveProperty('clauseVersion')
    expect(
      JSON.parse(String(byCard.get('pjg:HV-TEST-S01')?.p_note)).versionPins,
    ).toEqual({
      'U10-C03': 'comment-v2:U10-C03',
      'U05-C08': 'confirmed-2026-09-06-u05-c08',
    })
  })
})

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('Test Mode 固定版本进度', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
  it('readProgress 只保留当前 pin，过滤旧 pin 和缺失 pin 的步骤', async () => {
    const { progressKey, readProgress } = await import('./supabase')
    const journeyId = 'HV-A3-FIRST-BATTLE'
    const current = {
      choice: 'pass' as const,
      at: '2026-09-09T00:00:00.000Z',
      versionPins: { 'U03-C01': 'baseline:U03-C01' },
    }
    const stale = {
      choice: 'fail' as const,
      at: '2026-09-08T00:00:00.000Z',
      versionPins: { 'U03-C02': 'retired:U03-C02' },
    }
    const missing = {
      choice: 'skip' as const,
      at: '2026-09-07T00:00:00.000Z',
    }
    localStorage.setItem(
      progressKey(journeyId),
      JSON.stringify({ current, stale, missing }),
    )

    expect(
      readProgress(journeyId, {
        current: { 'U03-C01': 'baseline:U03-C01' },
        stale: { 'U03-C02': 'baseline:U03-C02' },
        missing: { 'U03-C03': 'baseline:U03-C03' },
      }),
    ).toEqual({ current })
  })

  it('没有为步骤提供当前 pins 时兼容旧的本机进度', async () => {
    const { progressKey, readProgress } = await import('./supabase')
    const journeyId = 'legacy-journey'
    const progress = {
      legacy: {
        choice: 'pass' as const,
        at: '2026-09-09T00:00:00.000Z',
      },
    }
    localStorage.setItem(progressKey(journeyId), JSON.stringify(progress))

    expect(readProgress(journeyId)).toEqual(progress)
  })
})
