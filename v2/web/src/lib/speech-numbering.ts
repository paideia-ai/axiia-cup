import type { LiveBubble } from '../api/sse'
import type { TurnDTO } from '../api/types'
import { scriptEvent } from './event'

// These channels contain conversation, including NPC replies. A dialogue row
// elsewhere can be an act (OS, inquiry, verdict), so kind alone is insufficient.
const speechChannels: Record<string, readonly string[]> = {
  'shangyang-court': ['court'],
  'honnoji-decision': ['council'],
  'trolley-problem': ['case-1', 'case-2', 'case-3'],
  'fengyiting-real': ['public', 'a-1', 'b-1', 'a-2', 'b-2'],
}

// Build from the full timeline before replay/tab filtering. Never rewrite seq:
// it remains the identity used by SSE, verdict placement, and replay.
export function buildSpeechNumbers(
  scenarioID: string,
  turns: readonly TurnDTO[],
  bubbles: readonly LiveBubble[] = [],
): ReadonlyMap<number, number> {
  const committed = new Set(turns.map((turn) => turn.seq))
  const rows = [
    ...turns,
    ...bubbles.filter((bubble) =>
      bubble.seq >= 0 && !committed.has(bubble.seq)
    ),
  ].sort((a, b) => a.seq - b.seq)
  const channels = speechChannels[scenarioID] ?? []
  const numbers = new Map<number, number>()
  for (const row of rows) {
    const isSpeech = scenarioID === 'legal-harbor-murder-jury'
      ? 'kind' in row && row.kind === 'event' &&
        row.channel === 'public' && scriptEvent(row)?.type === 'jury_speech'
      : channels.includes(row.channel) &&
        ('kind' in row
          ? row.kind === 'dialogue'
          : row.call == null || row.call === 'say')
    if (isSpeech && !numbers.has(row.seq)) {
      numbers.set(row.seq, numbers.size + 1)
    }
  }
  return numbers
}

// afterSeq is the count of committed timeline rows at the verdict, not a
// speech number. Skip non-speech rows to label the last speech it has read.
export function speechNumberBefore(
  numbers: ReadonlyMap<number, number>,
  afterSeq: number,
): number | undefined {
  let last: number | undefined
  for (const [seq, number] of numbers) {
    if (seq >= afterSeq) break
    last = number
  }
  return last
}
