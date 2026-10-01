import { describe, expect, it } from 'vitest'
import type { RoleIdentityDTO } from '../api/types'
import { opponentRoleLabel } from './opponent-role-label'

const hosokawa: RoleIdentityDTO = {
  key: 'hosokawa',
  name: '细川藤孝',
  side: 'b',
}
const ashigaru: RoleIdentityDTO = {
  key: 'ashigaru',
  name: '明智军中的足轻',
  side: 'b',
}

describe('opponent role labels', () => {
  it('uses the character name when old metadata names their faction', () => {
    expect(opponentRoleLabel('honnoji-decision', 'a', [
      { key: 'chosokabe', name: '长宗我部元亲阵营', side: 'a' },
    ], '袭击本能寺')).toBe('长宗我部元亲的密使')
  })
  it('lists distinct roles for a player with multiple agents', () => {
    expect(
      opponentRoleLabel(
        'honnoji-decision',
        'b',
        [hosokawa, ashigaru, hosokawa],
        '西进毛利',
      ),
    )
      .toBe('细川藤孝 / 明智军中的足轻')
  })
  it('does not invent a role for missing or wrong-side identities', () => {
    expect(opponentRoleLabel('honnoji-decision', 'b', [null], '西进毛利'))
      .toBe('乙方（角色待确认）')
    expect(opponentRoleLabel('honnoji-decision', 'a', [hosokawa], '袭击本能寺'))
      .toBe('甲方（角色待确认）')
  })
  it('preserves known and unknown identities in a mixed player roster', () => {
    expect(
      opponentRoleLabel(
        'honnoji-decision',
        'b',
        [hosokawa, undefined],
        '西进毛利',
      ),
    )
      .toBe('细川藤孝 / 乙方（角色待确认）')
  })
})
