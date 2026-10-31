import { describe, expect, it } from 'vitest'
import {
  participantIdentityPath,
  participantName,
} from './participant-identity'
import { versionIDLabel } from './version-label'

describe('match participant identity', () => {
  it('uses the match snapshot for either owner; missing names use the agent ID', () => {
    for (const isMine of [true, false]) {
      expect(
        participantName({
          agentID: 125,
          versionID: 928,
          agentName: '旧名称',
          ownerDisplayName: '玩家名',
          isMine,
        }),
      ).toBe('旧名称')
      expect(participantName({ agentID: 125, versionID: 928, isMine })).toBe(
        '#125',
      )
      expect(participantName({ agentID: 125, agentName: '  ', isMine })).toBe(
        '#125',
      )
    }
  })
  it('uses pinned preset labels without exposing internal keys', () => {
    expect(
      participantName({
        presetKey: 'internal',
        presetLabel: '空旗使者',
        isMine: false,
      }),
    ).toBe('空旗使者')
    expect(participantName({ presetKey: 'internal', isMine: false })).toBe(
      '预设智能体',
    )
    expect(participantName()).toBe('身份信息缺失')
  })
  it('pins both owned and public links to the actual match version', () => {
    expect(
      participantIdentityPath('s', 44, {
        agentID: 125,
        versionID: 928,
        isMine: true,
      }),
    ).toBe('/agents/125?version=928&match=44')
    expect(
      participantIdentityPath('s', 44, {
        agentID: 125,
        versionID: 928,
        isMine: false,
      }),
    ).toBe('/agents/125/identity?version=928&match=44')
    expect(participantIdentityPath('s', 44)).toBeNull()
    expect(versionIDLabel(928)).toBe('V·928')
  })
})
