import { describe, expect, it } from 'vitest'

import type { MatchParticipantsDTO } from '../api/types'
import { outcomeCopy } from './outcome'

const roles = { a: '商鞅', b: '甘龙' }

function participants(
  mineA: boolean,
  mineB: boolean,
): MatchParticipantsDTO {
  return { a: { isMine: mineA }, b: { isMine: mineB } }
}

describe('F7 带视角的结果文案（outcomeCopy）', () => {
  it('names my side when my agent wins', () => {
    expect(
      outcomeCopy(
        { winner: 'a', participants: participants(true, false) },
        roles,
      ),
    ).toBe('我方（商鞅）胜')
    expect(
      outcomeCopy(
        { winner: 'b', participants: participants(false, true) },
        roles,
      ),
    ).toBe('我方（甘龙）胜')
  })

  it('names the opponent side when their agent wins', () => {
    expect(
      outcomeCopy(
        { winner: 'b', participants: participants(true, false) },
        roles,
      ),
    ).toBe('对方（甘龙）胜')
    expect(
      outcomeCopy(
        { winner: 'a', participants: participants(false, true) },
        roles,
      ),
    ).toBe('对方（商鞅）胜')
  })

  it('falls back to 胜方+角色 for spectators and old servers', () => {
    // open 历史：两侧都不是我。
    expect(
      outcomeCopy(
        { winner: 'a', participants: participants(false, false) },
        roles,
      ),
    ).toBe('胜方 商鞅')
    // 老服务器：没有 participants。
    expect(outcomeCopy({ winner: 'a' }, roles)).toBe('胜方 商鞅')
  })

  it('marks hotseat matches instead of inventing a fake 我方', () => {
    expect(
      outcomeCopy(
        { winner: 'a', participants: participants(true, true) },
        roles,
      ),
    ).toBe('左右手互搏 · 商鞅胜')
  })

  // round4 评审 #7：participants 存在但形态不全（{} / 缺一侧）——不抛错，
  // 按旁观回退「胜方 角色」。
  it('treats malformed participants as spectator view', () => {
    expect(
      outcomeCopy(
        { winner: 'a', participants: {} as MatchParticipantsDTO },
        roles,
      ),
    ).toBe('胜方 商鞅')
    expect(
      outcomeCopy(
        {
          winner: 'a',
          participants: { b: { isMine: false } } as MatchParticipantsDTO,
        },
        roles,
      ),
    ).toBe('胜方 商鞅')
  })

  it('reads 平局 regardless of perspective', () => {
    expect(
      outcomeCopy(
        { winner: 'draw', participants: participants(true, false) },
        roles,
      ),
    ).toBe('平局')
    expect(outcomeCopy({ winner: 'draw' }, null)).toBe('平局')
  })

  it('falls back to 甲方/乙方 without catalog role names', () => {
    expect(
      outcomeCopy(
        { winner: 'b', participants: participants(false, true) },
        null,
      ),
    ).toBe('我方（乙方）胜')
  })

  it('returns null when there is no readable winner', () => {
    expect(outcomeCopy({ winner: null }, roles)).toBeNull()
    expect(outcomeCopy({}, roles)).toBeNull()
    expect(outcomeCopy({ winner: 'judge' }, roles)).toBeNull()
  })
})
