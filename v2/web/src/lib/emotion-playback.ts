import type { MatchDetail } from '../api/types'

export type EmotionCategory =
  | 'E01'
  | 'E02'
  | 'E03'
  | 'E04'
  | 'E05'
  | 'E06'
  | 'E07'
  | 'E08'
  | 'E09'
  | 'E10'
export interface EmotionOutput {
  outputRef: string
  status: 'pending' | 'ready' | 'unavailable'
  categoryId?: EmotionCategory | null
  playback?: { text: string; frames: { atMs: number; end: number }[] } | null
  waitMs: number
  updateMs: number
}
export interface EmotionSnapshot {
  enabled: boolean
  settled: boolean
  outputs: EmotionOutput[]
}
export interface Presentation {
  category: EmotionCategory
  text: string
  end: number
  waiting: boolean
  complete: boolean
}
interface Entry {
  output: EmotionOutput
  historical: boolean
  waitUntil: number
  updateUntil: number
  locked: boolean
  prepared: EmotionCategory | null
  start: number | null
  view: Presentation
}

export function outputRefs(value: unknown): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap(outputRefs)
  const object = value as Record<string, unknown>
  return [
    typeof object.outputRef === 'string' ? object.outputRef : [],
    ...Object.values(object).flatMap(outputRefs),
  ].flat()
}

export function outputGroups(data: MatchDetail): string[][] {
  const groups: string[][] = []
  const seen = new Set<string>()
  const add = (values: string[]) => {
    const fresh = values.filter((value) => !seen.has(value))
    fresh.forEach((value) => seen.add(value))
    if (fresh.length) groups.push(fresh)
  }
  for (const turn of [...data.turns].sort((a, b) => a.seq - b.seq)) {
    // Private conversations are serial; ballots in one reveal are simultaneous.
    const event = turn.event as
      | { type?: string; messages?: unknown[] }
      | undefined
    if (event?.type === 'observer_private_chat') {
      for (const message of event.messages ?? []) add(outputRefs(message))
    } else add(outputRefs(turn))
    for (
      const verdict of data.verdicts.filter((item) =>
        item.afterSeq === turn.seq + 1
      )
    ) add(outputRefs(verdict))
  }
  for (const verdict of data.verdicts) add(outputRefs(verdict))
  return groups
}

export class EmotionPlayback {
  private entries = new Map<string, Entry>()
  private groups: string[][] = []
  private initialized = false
  private latest = new Map<string, { output: EmotionOutput; at: number }>()
  private listeners = new Set<() => void>()
  private revision = 0
  enabled = false
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  version = () => this.revision
  get = (ref?: string | null) =>
    ref ? this.entries.get(ref)?.view ?? null : null
  output = (ref: string) => this.entries.get(ref)?.output
  get busy() {
    return [...this.entries.values()].some((entry) => !entry.view.complete)
  }
  cutoff(data: MatchDetail | null): number {
    if (!data || !this.enabled) return Infinity
    let cutoff = Infinity
    const pending = (ref: string) =>
      this.entries.get(ref)?.view.complete === false
    for (const turn of data.turns) {
      if (outputRefs(turn).some(pending)) cutoff = Math.min(cutoff, turn.seq)
    }
    for (const verdict of data.verdicts) {
      if (verdict.outputRef && pending(verdict.outputRef)) {
        cutoff = Math.min(cutoff, verdict.afterSeq)
      }
    }
    return cutoff
  }
  private emit() {
    this.revision++
    this.listeners.forEach((listener) => listener())
  }

  ingest(data: MatchDetail, now: number) {
    this.enabled = data.emotions?.enabled === true
    const historical = !this.initialized
    this.initialized = true
    this.groups = outputGroups(data)
    for (const received of data.emotions?.outputs ?? []) {
      const cached = this.latest.get(received.outputRef)
      const output = cached
        ? {
          ...cached.output,
          waitMs: Math.min(
            received.waitMs,
            Math.max(0, cached.output.waitMs - (now - cached.at)),
          ),
          updateMs: Math.min(
            received.updateMs,
            Math.max(0, cached.output.updateMs - (now - cached.at)),
          ),
        }
        : received
      if (!this.entries.has(output.outputRef)) {
        this.entries.set(output.outputRef, {
          output,
          historical,
          // An already-settled private reply can be published much later than it
          // was classified. Its valid result gets an image gate on first display.
          waitUntil: now +
            (output.status === 'ready'
              ? 200
              : Math.min(200, Math.max(0, output.waitMs))),
          updateUntil: now +
            (output.status === 'ready'
              ? 1000
              : Math.min(1000, Math.max(0, output.updateMs))),
          locked: output.status === 'unavailable',
          prepared: null,
          start: historical ? now : null,
          view: {
            category: 'E01',
            text: output.playback?.text ?? '',
            end: historical ? Infinity : 0,
            waiting: !historical,
            complete: historical,
          },
        })
      }
    }
    this.update(data.emotions?.outputs ?? [], now)
    this.emit()
  }

  update(outputs: EmotionOutput[], now: number) {
    for (const output of outputs) {
      if (
        !this.latest.has(output.outputRef) ||
        this.latest.get(output.outputRef)?.output.status === 'pending'
      ) this.latest.set(output.outputRef, { output, at: now })
      const entry = this.entries.get(output.outputRef)
      if (!entry || entry.output.status !== 'pending') continue
      // Old snapshots cannot replace a terminal result or extend either deadline.
      entry.waitUntil = Math.min(
        entry.waitUntil,
        now + Math.max(0, output.waitMs),
      )
      entry.updateUntil = Math.min(
        entry.updateUntil,
        now + Math.max(0, output.updateMs),
      )
      if (output.status !== 'pending') entry.output = output
      if (output.status === 'unavailable') entry.locked = true
    }
    this.tick(now)
    this.emit()
  }

  prepare(ref: string, category: EmotionCategory, now: number) {
    const entry = this.entries.get(ref)
    if (
      !entry || entry.locked || (entry.output.categoryId ?? 'E01') !== category
    ) return
    if (!entry.historical && now > entry.updateUntil) {
      entry.locked = true
      return
    }
    entry.prepared = category
    this.tick(now)
  }

  tick(now: number) {
    let changed = false
    let previousEnd = -Infinity
    for (const group of this.groups) {
      let groupEnd = previousEnd
      for (const ref of group) {
        const entry = this.entries.get(ref)
        if (!entry) continue
        const { output, historical } = entry
        if (!historical && now > entry.updateUntil && !entry.prepared) {
          entry.locked = true
        }
        const canStart = output.status === 'unavailable' ||
          entry.prepared != null || now >= entry.waitUntil
        if (entry.start == null && canStart && now >= previousEnd) {
          entry.start = now
        }
        const frames = output.playback?.frames ?? []
        const duration = frames.at(-1)?.atMs ?? 0
        const start = entry.start
        const waiting = start == null
        const elapsed = start == null ? -1 : now - start
        const complete = historical || (!waiting && elapsed >= duration)
        let end = complete ? Infinity : 0
        if (!complete) {
          for (const frame of frames) {
            if (frame.atMs > elapsed) break
            end = frame.end
          }
        }
        const category = waiting ? 'E01' : entry.prepared ?? 'E01'
        const old = entry.view
        if (
          old.category !== category || old.end !== end ||
          old.waiting !== waiting || old.complete !== complete
        ) {
          entry.view = { category, end, waiting, complete, text: old.text }
          changed = true
        }
        if (!historical) {
          groupEnd = Math.max(
            groupEnd,
            start == null ? Infinity : start + duration,
          )
        }
      }
      previousEnd = groupEnd
    }
    if (changed) this.emit()
  }
}

export function presentedText(
  view: Presentation | null,
  text: string,
  source = text,
): string {
  if (!view || view.complete) return text
  if (view.waiting) return ''
  const offset = view.text.indexOf(source)
  if (offset < 0) return ''
  const length = Math.max(0, view.end - offset)
  if (text !== source) return length >= source.length ? text : ''
  let end = Math.min(text.length, length)
  // Never split an emoji surrogate pair at a stream boundary.
  if (end > 0 && /[\uD800-\uDBFF]/.test(text[end - 1])) end--
  return text.slice(0, end)
}
