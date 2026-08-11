import type { LiveBubble } from '../api/sse'
import type { StageDTO, TurnDTO, VerdictDTO } from '../api/types'
import { scriptEvent } from './event'

// Channels are labels over one global seq order, so a stage renders as its
// channels side by side, each in seq order. Turns whose channel belongs to no
// declared stage still render — a transcript row is never silently dropped.
//
// Two rows are not body rows. `game.phase` emits on the reserved channel `*`,
// which belongs to no stage; it is a section marker and is hoisted onto the stage
// it opens. An in-flight bubble is not committed at all and carries the seq its
// row will take, so it sorts into its channel exactly where the committed row
// will land and is replaced there once it arrives.

export type TranscriptItem =
  | { kind: 'turn'; seq: number; turn: TurnDTO }
  | { kind: 'live'; seq: number; bubble: LiveBubble }

export interface ChannelGroup {
  id: string
  label: string
  items: TranscriptItem[]
}

export interface StageGroup {
  id: string
  title: string
  // `game.phase` titles that opened somewhere inside this stage.
  phases: string[]
  channels: ChannelGroup[]
  // One past the last committed transcript row in this stage: the anchor a
  // verdict has to reach to belong after it.
  endSeq: number
}

export const UNSTAGED_GROUP_ID = '__unstaged'

export function groupTranscript(
  turns: TurnDTO[],
  stages: StageDTO[],
  bubbles: LiveBubble[] = [],
): StageGroup[] {
  const ordered = [...turns].sort((left, right) => left.seq - right.seq)
  const phases: TurnDTO[] = []
  const body: TurnDTO[] = []
  for (const turn of ordered) {
    const event = scriptEvent(turn)
    if (event?.type === 'phase') phases.push(turn)
    else body.push(turn)
  }

  const committedSeqs = new Set(ordered.map((turn) => turn.seq))
  const live = bubbles.filter(
    (bubble) => bubble.seq >= 0 && !committedSeqs.has(bubble.seq),
  )

  const placed = new Set<number>()
  const groups: StageGroup[] = []

  // Channels, not stages, are the chronological unit: one stage's channels can
  // interleave with another's (a leak lands midway through the meetings), so
  // channels sort by their first row and adjacent runs of one stage fold back
  // into a group. A stage that re-enters gets a suffixed group id.
  const flat: Array<{
    stage: StageDTO
    channel: ChannelGroup
    firstSeq: number
  }> = []
  for (const stage of stages) {
    for (const channel of stage.channels) {
      const items: TranscriptItem[] = []
      for (const turn of body) {
        if (turn.channel !== channel.id || placed.has(turn.seq)) continue
        placed.add(turn.seq)
        items.push({ kind: 'turn', seq: turn.seq, turn })
      }
      for (const bubble of live) {
        if (bubble.channel !== channel.id) continue
        items.push({ kind: 'live', seq: bubble.seq, bubble })
      }
      items.sort((left, right) => left.seq - right.seq)
      if (items.length > 0) {
        flat.push({
          stage,
          channel: { id: channel.id, label: channel.label, items },
          firstSeq: items[0].seq,
        })
      }
    }
  }
  flat.sort((left, right) => left.firstSeq - right.firstSeq)
  let lastStageId: string | null = null
  const stageVisits = new Map<string, number>()
  for (const entry of flat) {
    if (entry.stage.id === lastStageId) {
      const group = groups[groups.length - 1]
      group.channels.push(entry.channel)
      group.endSeq = endSeq(group.channels)
      continue
    }
    lastStageId = entry.stage.id
    const visit = (stageVisits.get(entry.stage.id) ?? 0) + 1
    stageVisits.set(entry.stage.id, visit)
    groups.push({
      id: visit === 1 ? entry.stage.id : `${entry.stage.id}@${visit}`,
      title: entry.stage.title,
      phases: [],
      channels: [entry.channel],
      endSeq: endSeq([entry.channel]),
    })
  }

  const unstagedTurns = body.filter((turn) => !placed.has(turn.seq))
  const stagedChannels = new Set(
    stages.flatMap((stage) => stage.channels.map((channel) => channel.id)),
  )
  const unstagedLive = live.filter(
    (bubble) => !stagedChannels.has(bubble.channel),
  )
  if (unstagedTurns.length > 0 || unstagedLive.length > 0) {
    const items: TranscriptItem[] = [
      ...unstagedTurns.map((turn) => ({
        kind: 'turn' as const,
        seq: turn.seq,
        turn,
      })),
      ...unstagedLive.map((bubble) => ({
        kind: 'live' as const,
        seq: bubble.seq,
        bubble,
      })),
    ].sort((left, right) => left.seq - right.seq)
    const channels = [{ id: UNSTAGED_GROUP_ID, label: '', items }]
    groups.push({
      id: UNSTAGED_GROUP_ID,
      title: '其他',
      phases: [],
      channels,
      endSeq: endSeq(channels),
    })
  }

  attachPhases(groups, phases)
  return groups
}

// A phase marker is emitted before the rows it opens, so it belongs to the first
// stage that still has rows ahead of it; one emitted after every row trails on the
// last stage rather than vanishing.
function attachPhases(groups: StageGroup[], phases: TurnDTO[]) {
  if (groups.length === 0) return
  for (const phase of phases) {
    const event = scriptEvent(phase)
    const title = typeof event?.title === 'string' ? event.title : null
    if (!title) continue
    const group = groups.find((candidate) => candidate.endSeq > phase.seq) ??
      groups[groups.length - 1]
    if (title !== group.title && !group.phases.includes(title)) {
      group.phases.push(title)
    }
  }
}

function endSeq(channels: ChannelGroup[]): number {
  return channels.reduce(
    (highest, channel) =>
      channel.items.reduce(
        (inner, item) =>
          item.kind === 'turn' ? Math.max(inner, item.seq + 1) : inner,
        highest,
      ),
    0,
  )
}

// The finished report gives the judge-QA leg its own 问询 section (#69), but only
// when the transcript actually distinguishes one — a stage naming itself 问询, or
// one whose every channel is an inquiry channel. A scenario without such a stage
// simply gets no section, never an empty header.
export function isInquiryChannel(channelID: string): boolean {
  return /^inquiry([-_.]|$)/i.test(channelID)
}

export function isInquiryGroup(group: StageGroup): boolean {
  if (group.title.includes('问询')) return true
  return group.channels.length > 0 &&
    group.channels.every((channel) => isInquiryChannel(channel.id))
}

// A verdict settled on the first `afterSeq` rows, so it renders after the first
// stage that reaches that far; anything anchored past the whole transcript
// trails it.
export function placeVerdicts(
  groups: StageGroup[],
  verdicts: VerdictDTO[],
): { perGroup: VerdictDTO[][]; trailing: VerdictDTO[] } {
  const pending = [...verdicts].sort((left, right) =>
    left.afterSeq - right.afterSeq
  )
  const perGroup = groups.map((group) => {
    const taken: VerdictDTO[] = []
    while (pending.length > 0 && pending[0].afterSeq <= group.endSeq) {
      taken.push(pending.shift()!)
    }
    return taken
  })
  return { perGroup, trailing: pending }
}
