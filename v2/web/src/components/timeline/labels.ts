import type { MatchParticipantsDTO, Side } from '../../api/types'
import type { ScenarioModule } from '../../scenarios'
import { roleByKey, scenarioModule } from '../../scenarios'
import { roleIdentity } from '../../lib/role-identity'

// Speaker keys are wire ids — a side ('a', 'b'), an NPC lane ('diaochan', 'judge'),
// or the role selected for this match. Side keys use the shared participant
// resolver; role and NPC keys use the scenario registry and historical labels.
export interface SpeakerLabels {
  readonly lanes: Record<string, string>
  readonly module: ScenarioModule | null
  readonly speakers?: readonly string[]
  readonly participants?: MatchParticipantsDTO | null
}

const SIDE_NAMES: Record<string, string> = { a: '甲方', b: '乙方' }

export function speakerLabels(
  slotID: string | null | undefined,
  lanes: Record<string, string>,
  speakers: readonly string[] = [],
  participants?: MatchParticipantsDTO | null,
): SpeakerLabels {
  return { lanes, module: scenarioModule(slotID), speakers, participants }
}

export function speakerName(labels: SpeakerLabels, key: string): string {
  if (key === 'a' || key === 'b') return sideName(labels, key)
  for (const side of ['a', 'b'] as const) {
    const identity = labels.participants?.[side]?.role
    if (identity?.side === side && identity.key === key) return identity.name
  }
  const role = roleByKey(labels.module, key)
  const snapshot = role ? labels.participants?.[role.side]?.role : null
  if (
    snapshot && snapshot.side === role?.side &&
    roleByKey(labels.module, snapshot.key)?.key === role?.key
  ) {
    return snapshot.name
  }
  if (role) return role.name
  const fromModule: string | undefined = labels.module?.laneLabels[key]
  const fromMatch: string | undefined = labels.lanes[key]
  return fromModule ?? fromMatch ?? SIDE_NAMES[key] ?? key
}

export function speakerSide(labels: SpeakerLabels, key: string): Side | null {
  for (const side of ['a', 'b'] as const) {
    const identity = labels.participants?.[side]?.role
    if (identity?.side === side && identity.key === key) return side
  }
  const role = roleByKey(labels.module, key)
  if (role) return role.side
  if (key === 'a' || key === 'b') return key
  return null
}

// Resolve from this match's speakers; a faction label is not a selected role.
export function sideName(
  labels: SpeakerLabels,
  side: Side,
  speakers: readonly string[] = labels.speakers ?? [],
): string {
  return roleIdentity({
    scenarioID: labels.module?.slotID,
    side,
    role: labels.participants?.[side]?.role,
    lanes: labels.lanes,
    speakers,
  }).name
}

export function speakerAccent(labels: SpeakerLabels, key: string): string {
  const side = speakerSide(labels, key)
  if (side === 'a') return 'border-l-(--accent)'
  if (side === 'b') return 'border-l-(--info)'
  return 'border-l-(--warning)'
}
