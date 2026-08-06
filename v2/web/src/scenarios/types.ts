import type { Side } from '../api/types'

// One playable persona of a scenario. `key` is the vocabulary the script reads out
// of the side's options blob, and — for scripts that name their lanes after it —
// the speaker key of that persona's transcript rows.
export interface ScenarioRole {
  key: string
  name: string
  side: Side
  pitch: string
}

// Scenario display knowledge, bundled with the SPA rather than fetched: the server
// is deliberately ignorant of what a scenario's options blob means, so the picker
// that writes one and the transcript that reads it are authored here.
export interface ScenarioModule {
  slotID: string
  roles: ScenarioRole[]
  // Lane keys the script speaks under, mapped to display names. Side keys ('a',
  // 'b') stay out on purpose: a finished match carries its own labels for them,
  // and in a role-cast match they name a side rather than a speaker.
  laneLabels: Record<string, string>
}
