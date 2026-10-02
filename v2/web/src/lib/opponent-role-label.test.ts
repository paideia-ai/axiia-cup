import { describe, expect, it } from 'vitest'
import type { RoleIdentityDTO } from '../api/types'
import { opponentRoleLabel, roleOrFactionName } from './opponent-role-label'

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
  it('uses the role picker name when the server names the role after its faction', () => {
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
  it('keeps the faction name for missing or wrong-side identities', () => {
    expect(opponentRoleLabel('honnoji-decision', 'b', [null], '西进毛利'))
      .toBe('西进毛利（角色待确认）')
    expect(opponentRoleLabel('honnoji-decision', 'a', [hosokawa], '袭击本能寺'))
      .toBe('袭击本能寺（角色待确认）')
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
      .toBe('细川藤孝 / 西进毛利（角色待确认）')
  })
  it('keeps the side name for scenarios without selectable roles', () => {
    expect(opponentRoleLabel('shangyang-court', 'b', [
      { key: 'b', name: '甘龙', side: 'b' },
      null,
    ], '甘龙')).toBe('甘龙')
  })
  it('resolves a fielded version from its options when the role is absent', () => {
    expect(roleOrFactionName({
      scenarioID: 'honnoji-decision',
      side: 'a',
      options: '{"role":"chosokabe"}',
      fallback: '袭击本能寺',
    })).toBe('长宗我部元亲的密使')
  })
})
