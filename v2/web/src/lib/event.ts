import type { JSONValue, TurnDTO } from '../api/types'

// `game.emit` payloads are the script↔frontend contract: an object with a `type`
// discriminator and whatever else that type carries. Everything here reads them
// defensively — a scenario the SPA has never seen still renders as a row.

export type ScriptEvent = { [key: string]: JSONValue }

export function scriptEvent(turn: TurnDTO): ScriptEvent | null {
  const event = turn.event
  if (event == null || typeof event !== 'object' || Array.isArray(event)) {
    return null
  }
  return event
}

export function eventType(event: ScriptEvent): string | null {
  return typeof event.type === 'string' ? event.type : null
}

export function eventString(event: ScriptEvent, key: string): string | null {
  const value = event[key]
  return typeof value === 'string' ? value : null
}

export function eventNumber(event: ScriptEvent, key: string): number | null {
  const value = event[key]
  return typeof value === 'number' ? value : null
}

export function eventBoolean(event: ScriptEvent, key: string): boolean | null {
  const value = event[key]
  return typeof value === 'boolean' ? value : null
}

export function eventArray(
  event: ScriptEvent,
  key: string,
): JSONValue[] | null {
  const value = event[key]
  return Array.isArray(value) ? value : null
}

export function eventStringArray(
  event: ScriptEvent,
  key: string,
): string[] | null {
  const value = eventArray(event, key)
  if (!value || !value.every((item) => typeof item === 'string')) return null
  return value as string[]
}

export function eventRecord(
  event: ScriptEvent,
  key: string,
): Record<string, string> | null {
  const value = event[key]
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  const entries = Object.entries(value).flatMap(([name, raw]) =>
    typeof raw === 'string' || typeof raw === 'number'
      ? [[name, String(raw)] as const]
      : []
  )
  return entries.length > 0 ? Object.fromEntries(entries) : null
}

// The last-resort line for an event type this build does not know: never blank,
// never a raw JSON dump in the body — that goes behind a fold.
export function eventSummary(event: ScriptEvent): string | null {
  for (const key of ['text', 'title', 'message', 'label']) {
    const value = eventString(event, key)
    if (value) return value
  }
  return null
}
