import type { MatchParticipantDTO } from '../api/types'
import { npcIdentityPath } from './identity-links'

export function participantName(participant?: MatchParticipantDTO): string {
  if (participant?.agentID != null) {
    return participant.agentName?.trim() || `#${participant.agentID}`
  }
  if (participant?.presetKey) {
    return participant.presetLabel?.trim() || '预设智能体'
  }
  return '身份信息缺失'
}

export function participantIdentityPath(
  scenarioID: string,
  matchID: number,
  participant?: MatchParticipantDTO,
): string | null {
  if (participant?.agentID != null) {
    const params = new URLSearchParams()
    if (participant.versionID != null) {
      params.set('version', String(participant.versionID))
    }
    params.set('match', String(matchID))
    return `/agents/${participant.agentID}${
      participant.isMine ? '' : '/identity'
    }?${params}`
  }
  return participant?.presetKey
    ? npcIdentityPath(scenarioID, participant.presetKey, matchID)
    : null
}
