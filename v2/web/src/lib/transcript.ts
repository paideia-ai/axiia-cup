import type { LiveBubble } from '../api/sse'
import type { StageDTO, TurnDTO, VerdictDTO } from '../api/types'
import { scriptEvent } from './event'

// Channels are labels over one global seq order. A stage may switch between
// channels many times, so only adjacent rows from the same channel form a
// display run. Turns whose channel belongs to no declared stage still render —
// a transcript row is never silently dropped.
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
  key: string
  id: string
  label: string
  items: TranscriptItem[]
}

export interface StageGroup {
  id: string
  title: string
  phases: PhaseMarker[]
  channels: ChannelGroup[]
  // One past the last committed transcript row in this stage: the anchor a
  // verdict has to reach to belong after it.
  endSeq: number
}

export interface PhaseMarker {
  seq: number
  title: string
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

  const channelOwners = new Map<
    string,
    { stage: StageDTO; label: string }
  >()
  for (const stage of stages) {
    for (const channel of stage.channels) {
      if (!channelOwners.has(channel.id)) {
        channelOwners.set(channel.id, { stage, label: channel.label })
      }
    }
  }

  const rows = [
    ...body.map((turn) => {
      const owner = channelOwners.get(turn.channel)
      return {
        stage: owner?.stage ?? null,
        channelID: owner ? turn.channel : UNSTAGED_GROUP_ID,
        channelLabel: owner?.label ?? '',
        item: { kind: 'turn', seq: turn.seq, turn } as TranscriptItem,
      }
    }),
    ...live.map((bubble) => {
      const owner = channelOwners.get(bubble.channel)
      return {
        stage: owner?.stage ?? null,
        channelID: owner ? bubble.channel : UNSTAGED_GROUP_ID,
        channelLabel: owner?.label ?? '',
        item: { kind: 'live', seq: bubble.seq, bubble } as TranscriptItem,
      }
    }),
  ].sort((left, right) => left.item.seq - right.item.seq)

  const groups: StageGroup[] = []
  let lastStageId: string | null = null
  const stageVisits = new Map<string, number>()
  for (const row of rows) {
    const stageId = row.stage?.id ?? UNSTAGED_GROUP_ID
    let group = groups.at(-1)
    if (stageId !== lastStageId || !group) {
      lastStageId = stageId
      const visit = (stageVisits.get(stageId) ?? 0) + 1
      stageVisits.set(stageId, visit)
      group = {
        id: visit === 1 ? stageId : `${stageId}@${visit}`,
        title: row.stage?.title ?? '其他',
        phases: [],
        channels: [],
        endSeq: 0,
      }
      groups.push(group)
    }

    const channel = group.channels.at(-1)
    if (channel?.id === row.channelID) {
      channel.items.push(row.item)
    } else {
      group.channels.push({
        key: `${group.id}:${row.item.seq}:${row.channelID}`,
        id: row.channelID,
        label: row.channelLabel,
        items: [row.item],
      })
    }
    if (row.item.kind === 'turn') {
      group.endSeq = Math.max(group.endSeq, row.item.seq + 1)
    }
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
    if (
      title !== group.title &&
      !group.phases.some((marker) => marker.title === title)
    ) {
      group.phases.push({ seq: phase.seq, title })
    }
  }
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
