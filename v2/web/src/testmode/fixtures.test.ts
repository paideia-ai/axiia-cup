import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fillFixtureText,
  FIXTURE_SESSION_STORAGE_KEY,
  FIXTURE_STORAGE_KEY,
  fixtureVariables,
  matchIdFromUrl,
  readFixtureValues,
  resolveFixtureUrl,
  writeFixtureValues,
} from './fixtures'

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

describe('Test Mode fixture 解析', () => {
  it('跨网址、操作和预期取双花括号变量，并按首次出现去重', () => {
    expect(
      fixtureVariables(
        '{{appBaseUrl}}/agents/{{b3OwnerAgentId}}',
        '打开 /matches/{{b3OwnerCompletedMatchId}} 后回到 {{b3OwnerAgentId}}',
        '应该看到 {{b3OwnerAgentId}}',
      ),
    ).toEqual([
      'appBaseUrl',
      'b3OwnerAgentId',
      'b3OwnerCompletedMatchId',
    ])
  })

  it('未填 ID 时保留可见占位符并不产生假链接', () => {
    expect(
      resolveFixtureUrl('{{appBaseUrl}}/agents/{{b3OwnerAgentId}}', {
        appBaseUrl: 'https://cup.example/',
      }),
    ).toEqual({
      preview: 'https://cup.example/agents/{{b3OwnerAgentId}}',
      href: null,
      missing: ['b3OwnerAgentId'],
    })
  })

  it('填好后生成真实 http(s) 链接，并安全编码路径 ID', () => {
    expect(
      resolveFixtureUrl('{{appBaseUrl}}/tournaments/{{tournamentId}}', {
        appBaseUrl: 'https://cup.example/',
        tournamentId: 'fall cup',
      }),
    ).toEqual({
      preview: 'https://cup.example/tournaments/fall%20cup',
      href: 'https://cup.example/tournaments/fall%20cup',
      missing: [],
    })
  })

  it('操作文字代入原值，未填的 fixture 仍然显眼', () => {
    expect(
      fillFixtureText(
        '先打开 {{b3OwnerAgentId}}，再打开 {{b3OwnerCompletedMatchId}}',
        { b3OwnerAgentId: 'agent-42' },
      ),
    ).toEqual({
      value: '先打开 agent-42，再打开 {{b3OwnerCompletedMatchId}}',
      missing: ['b3OwnerCompletedMatchId'],
    })
  })

  it('只从 /matches/:id 捕获运行时对局 ID', () => {
    expect(matchIdFromUrl('https://cup.example/matches/match%2042')).toBe(
      'match 42',
    )
    expect(matchIdFromUrl('/matches/live-9')).toBe('live-9')
    expect(matchIdFromUrl('/agents/42')).toBeNull()
    expect(matchIdFromUrl('/matches')).toBeNull()
  })
})

describe('Test Mode fixture 按旅程隔离', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    vi.stubGlobal('location', {
      origin: 'https://cup.example',
      href: 'https://cup.example/scenarios',
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('稳定 ID 留在各自旅程，运行时 match ID 只进当前 session', () => {
    writeFixtureValues('HV-B3-OWNER-EA', {
      appBaseUrl: 'https://ignored.example',
      b3OwnerAgentId: 'b3-agent',
    })
    writeFixtureValues('HV-A5-HOTSEAT-LIFECYCLE', {
      appBaseUrl: 'https://ignored.example',
      a5HotseatAgentId: 'hotseat-agent',
      a5HotseatActiveMatchId: 'live-match',
    })

    expect(readFixtureValues('HV-B3-OWNER-EA')).toEqual({
      appBaseUrl: 'https://cup.example',
      b3OwnerAgentId: 'b3-agent',
    })
    expect(readFixtureValues('HV-A5-HOTSEAT-LIFECYCLE')).toEqual({
      appBaseUrl: 'https://cup.example',
      a5HotseatAgentId: 'hotseat-agent',
      a5HotseatActiveMatchId: 'live-match',
    })

    const stable = JSON.parse(
      localStorage.getItem(FIXTURE_STORAGE_KEY) ?? '{}',
    )
    expect(stable['HV-A5-HOTSEAT-LIFECYCLE']).not.toHaveProperty(
      'a5HotseatActiveMatchId',
    )
    const runtime = JSON.parse(
      sessionStorage.getItem(FIXTURE_SESSION_STORAGE_KEY) ?? '{}',
    )
    expect(runtime['HV-A5-HOTSEAT-LIFECYCLE']).toEqual({
      a5HotseatActiveMatchId: 'live-match',
    })
  })

  it('默认值可注入但本机值优先', () => {
    expect(
      readFixtureValues('HV-B3-PUBLIC-NPC', {
        b3PublicTargetAgentId: 'prepared-default',
      }),
    ).toMatchObject({ b3PublicTargetAgentId: 'prepared-default' })

    writeFixtureValues('HV-B3-PUBLIC-NPC', {
      appBaseUrl: 'https://cup.example',
      b3PublicTargetAgentId: 'local-override',
    })
    expect(
      readFixtureValues('HV-B3-PUBLIC-NPC', {
        b3PublicTargetAgentId: 'prepared-default',
      }).b3PublicTargetAgentId,
    ).toBe('local-override')
  })
})
