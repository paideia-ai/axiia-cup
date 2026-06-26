const PROGRAMMATIC_SCORING_DETAIL_PREFIX = '程序化计分明细：'

export function formatScoringReasoning(reasoning: string | null | undefined) {
  if (!reasoning) {
    return ''
  }

  return reasoning
    .replace(
      new RegExp(`^\\s*${PROGRAMMATIC_SCORING_DETAIL_PREFIX}\\s*\\n?`),
      '',
    )
    .trimStart()
}
