import type { MatchEventDTO, MatchSummary } from '../api/types'
import { playSound } from './sound'

const launched = new Set<number>()
export function trackSoundMatch(matchID: number) {
  launched.add(matchID)
}
export function clearSoundMatches() {
  launched.clear()
}

// Only completions preceded by visible live text are audible. EventSource sends
// committed history on every connection; history carries no live chunks.
export class LiveMatchSounds {
  private pending = new Set<number>()
  constructor(private readonly matchID: number, private afterSeq: number) {
    trackSoundMatch(matchID)
  }

  reconnect() {
    this.pending.clear()
  }

  observe(event: MatchEventDTO) {
    if ('chunk' in event) {
      const chunk = event.chunk
      if (
        chunk.matchID === this.matchID && chunk.seq > this.afterSeq &&
        chunk.phase === 'text' && chunk.delta.trim() !== '' &&
        chunk.channel !== '*' &&
        (chunk.call == null || chunk.call === 'say')
      ) this.pending.add(chunk.seq)
      return
    }
    if ('turnCompleted' in event) {
      const turn = event.turnCompleted
      if (turn.matchID !== this.matchID) return
      const fresh = turn.seq > this.afterSeq && this.pending.delete(turn.seq)
      this.afterSeq = Math.max(this.afterSeq, turn.seq)
      if (fresh && turn.kind === 'dialogue') {
        playSound('output', `${this.matchID}:${turn.seq}`)
      }
    }
    if (
      'matchFinished' in event && event.matchFinished.matchID === this.matchID
    ) {
      playSound('finish', String(this.matchID))
    }
    if ('matchFinished' in event || 'matchFailed' in event) this.pending.clear()
  }
}

// Running games are tracked for this signed-in session, across route changes.
// Finished initial rows never ring; unsuccessful (unscored) terminal rows do not
// ring. A visibility resync updates the baseline silently instead of making a
// backlog of background completions audible.
export class MatchCompletionTracker {
  private running = new Set<number>()
  observe(rows: MatchSummary[], audible = true) {
    for (const matchID of launched) this.running.add(matchID)
    launched.clear()
    for (const row of rows) {
      if (row.initiatorIsMe !== true) continue
      if (!row.finished) this.running.add(row.id)
      else if (this.running.delete(row.id) && row.scored && audible) {
        playSound('finish', String(row.id))
      }
    }
  }
}
