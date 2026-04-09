import { z } from 'zod'

const structuredJudgeDecisionSchema = z.object({
  judgment: z.string().trim().min(1).optional(),
  requests: z.record(z.string().trim().min(1)).optional(),
  speech: z.string().trim().min(1).optional(),
})

export type ParsedJudgeDecision =
  | {
      kind: 'structured'
      judgment: string | null
      raw: string
      requests: Record<string, string>
      speech: string | null
    }
  | {
      kind: 'speech'
      raw: string
      speech: string
    }
  | {
      kind: 'unparsed'
      raw: string
    }

function trimToNull(value: string | null | undefined) {
  const nextValue = value?.trim()
  return nextValue ? nextValue : null
}

function stripMarkdownCodeFence(raw: string) {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

  return fencedMatch?.[1]?.trim() ?? raw.trim()
}

function looksLikeStructuredJson(raw: string) {
  return (
    raw.startsWith('{') ||
    raw.startsWith('```') ||
    raw.includes('"judgment"') ||
    raw.includes('"requests"') ||
    raw.includes('"speech"')
  )
}

function parseJsonCandidate(raw: string) {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function parseJudgeDecision(
  decision: string | null | undefined,
): ParsedJudgeDecision | null {
  const raw = trimToNull(decision)
  if (!raw) {
    return null
  }

  const normalized = stripMarkdownCodeFence(raw)
  const parsedJson = parseJsonCandidate(normalized)

  if (typeof parsedJson === 'string') {
    const speech = trimToNull(parsedJson)
    return speech ? { kind: 'speech', raw, speech } : { kind: 'unparsed', raw }
  }

  if (
    parsedJson &&
    typeof parsedJson === 'object' &&
    !Array.isArray(parsedJson)
  ) {
    const parsedDecision = structuredJudgeDecisionSchema.safeParse(parsedJson)

    if (parsedDecision.success) {
      const judgment = trimToNull(parsedDecision.data.judgment)
      const speech = trimToNull(parsedDecision.data.speech)
      const requests = Object.fromEntries(
        Object.entries(parsedDecision.data.requests ?? {}).filter((entry) =>
          Boolean(trimToNull(entry[1])),
        ),
      )

      if (judgment || speech || Object.keys(requests).length > 0) {
        return {
          kind: 'structured',
          judgment,
          raw,
          requests,
          speech,
        }
      }
    }
  }

  if (looksLikeStructuredJson(raw)) {
    return { kind: 'unparsed', raw }
  }

  return {
    kind: 'speech',
    raw,
    speech: normalized,
  }
}
