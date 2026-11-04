// The one interface the scripts drive. Two implementations: the HTTP adapter
// for the axiia server (http.ts, every path in that file) and the mock
// (mock.ts), which plays submitted games with the mock strength model.

import type { MatchRecord, SubmitItem, SubmitResult, VersionInfo } from '../types.ts'

export interface Backend {
  readonly mode: 'http' | 'mock'
  // Games one `next` keeps queued or running at once. The server has no
  // concurrency cap of its own, so the HTTP adapter paces; the mock does not.
  readonly maxInFlight: number
  // Idempotent by key: a key already on the server comes back created: false
  // (the same key with a different payload is a 409 key_conflict).
  submit(items: SubmitItem[]): Promise<SubmitResult[]>
  // Every match carrying all of `tags`, ascending matchID.
  query(tags: string[]): Promise<MatchRecord[]>
  versions(ids: number[]): Promise<VersionInfo[]>
  // Persist (mock) or release resources.
  close(): Promise<void>
}
