import { afterEach, describe, expect, it, vi } from 'vitest'

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
  })
})
