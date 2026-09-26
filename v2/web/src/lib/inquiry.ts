import type { Side, VerdictDTO } from '../api/types'
import type { SpeakerLabels } from '../components/timeline/labels'
import { sideName, speakerSide } from '../components/timeline/labels'
import type { StageGroup } from './transcript'

export interface InquiryAnswer {
  side: Side
  name: string
  otherName: string
  guess: string
  goal: string
  reason: string
  trace: string | null
}

function parseAnswer(output: string): { guess: string; reason: string } | null {
  try {
    const value: unknown = JSON.parse(output)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const object = value as Record<string, unknown>
    // Extra fields still belong in the generic renderer; do not silently drop
    // information when a historical or future script has a different contract.
    if (
      Object.keys(object).some((key) => key !== 'guess' && key !== 'reason')
    ) {
      return null
    }
    return typeof object.guess === 'string' && object.guess.trim() &&
        typeof object.reason === 'string' && object.reason.trim()
      ? { guess: object.guess, reason: object.reason }
      : null
  } catch {
    return null
  }
}

// Only replace pure, completed inquiry acts with their normalized answers.
// Prose, live rows, unmatched verdicts and unfamiliar fields keep the existing
// chronological renderer. A lone completed answer is allowed while waiting.
export function inquiryAnswers(
  group: StageGroup,
  verdicts: VerdictDTO[],
  labels: SpeakerLabels,
): InquiryAnswer[] | null {
  if (
    !['shangyang-court', 'honnoji-decision'].includes(
      labels.module?.slotID ?? '',
    ) ||
    group.title !== '第二阶段·屏退问询' ||
    group.phases.some((phase) => phase.title !== group.title) ||
    group.channels.some((channel) => !/^inquiry-[ab]$/.test(channel.id))
  ) return null
  const items = group.channels.flatMap((channel) => channel.items)
  if (!items.length || items.length > 2 || verdicts.length !== items.length) {
    return null
  }
  const answers: InquiryAnswer[] = []
  for (const item of items) {
    if (
      item.kind !== 'turn' || !item.verdictAnchor || item.turn.finalText.trim()
    ) {
      return null
    }
    const side = item.turn.channel === 'inquiry-a' ? 'a' : 'b'
    if (
      speakerSide(labels, item.turn.speaker) !== side ||
      answers.some((answer) => answer.side === side)
    ) return null
    const matches = verdicts.filter((verdict) =>
      verdict.key === `inquiry-${side}` && verdict.afterSeq === item.seq
    )
    if (matches.length !== 1) return null
    const payload = parseAnswer(matches[0].output)
    if (!payload) return null
    const other = side === 'a' ? 'b' : 'a'
    const option = labels.module?.hiddenGoals?.[other]?.groups
      .flatMap((group) => group.options).find((option) =>
        option.id === payload.guess
      )
    answers.push({
      side,
      name: sideName(labels, side),
      otherName: sideName(labels, other),
      guess: payload.guess,
      goal: option?.text ?? payload.guess,
      reason: payload.reason,
      trace: item.turn.reasoning ?? null,
    })
  }
  return answers
}
