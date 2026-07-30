// Speaker keys are wire ids ('a', 'b', 'diaochan', 'judge'); the match DTO carries
// the display name for every one of them.
export type SpeakerLabels = Record<string, string>

export function speakerName(labels: SpeakerLabels, key: string): string {
  return labels[key] ?? key
}

export function speakerAccent(speaker: string): string {
  if (speaker === 'a') return 'border-l-(--accent)'
  if (speaker === 'b') return 'border-l-(--info)'
  return 'border-l-(--warning)'
}
