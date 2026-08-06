import type { Side } from '../../api/types'
import type { ScenarioModule } from '../../scenarios'
import { scenarioModule } from '../../scenarios'

// Speaker keys are wire ids — a side ('a', 'b'), an NPC lane ('diaochan', 'judge'),
// or, in a role-cast scenario, the role the player picked. Resolution is
// module-first (authored here, always current), then whatever the match itself
// carries (which is what a finished match rendered with), then a generic side
// name, then the raw key.
export interface SpeakerLabels {
  readonly lanes: Record<string, string>
  readonly module: ScenarioModule | null
}

const SIDE_NAMES: Record<string, string> = { a: '甲方', b: '乙方' }

export function speakerLabels(
  slotID: string | null | undefined,
  lanes: Record<string, string>,
): SpeakerLabels {
  return { lanes, module: scenarioModule(slotID) }
}

export function speakerName(labels: SpeakerLabels, key: string): string {
  const fromModule: string | undefined = labels.module?.laneLabels[key]
  const fromMatch: string | undefined = labels.lanes[key]
  return fromModule ?? fromMatch ?? SIDE_NAMES[key] ?? key
}

export function speakerSide(labels: SpeakerLabels, key: string): Side | null {
  const role = labels.module?.roles.find((role) => role.key === key)
  if (role) return role.side
  if (key === 'a' || key === 'b') return key
  return null
}

// The name to head a side with when nothing in the transcript has been spoken
// under it yet.
export function sideName(
  labels: SpeakerLabels,
  side: Side,
  speakers: string[],
): string {
  const fromMatch: string | undefined = labels.lanes[side]
  if (fromMatch) return fromMatch
  const spoken = speakers.find((key) => speakerSide(labels, key) === side)
  return spoken ? speakerName(labels, spoken) : SIDE_NAMES[side]
}

export function speakerAccent(labels: SpeakerLabels, key: string): string {
  const side = speakerSide(labels, key)
  if (side === 'a') return 'border-l-(--accent)'
  if (side === 'b') return 'border-l-(--info)'
  return 'border-l-(--warning)'
}
