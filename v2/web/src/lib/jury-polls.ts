import type { TurnDTO } from '../api/types'
import { type ScriptEvent, scriptEvent } from './event'

// Use committed event order, not round or mover: either player can call several
// polls in a round. Only the immediately preceding poll is a valid baseline.
export function previousSecretPolls(
  turns: TurnDTO[],
): Map<number, ScriptEvent> {
  const previousBySeq = new Map<number, ScriptEvent>()
  let previous: ScriptEvent | undefined
  for (const turn of [...turns].sort((a, b) => a.seq - b.seq)) {
    const event = scriptEvent(turn)
    if (turn.kind !== 'event' || event?.type !== 'observer_secret_poll') {
      continue
    }
    if (previous) previousBySeq.set(turn.seq, previous)
    previous = event
  }
  return previousBySeq
}
