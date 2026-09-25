import type { LiveBubble } from '../api/sse'
import type { TurnDTO } from '../api/types'
import { scriptEvent } from './event'
import type { StageGroup } from './transcript'

export interface TranscriptTabPlan {
  labels: string[]
  bySeq: Map<number, number | null>
}

function harborRoundPlan(rows: (TurnDTO | LiveBubble)[]): TranscriptTabPlan {
  const bySeq = new Map<number, number | null>()
  let current = 0
  let lastRound = 0
  for (const row of rows) {
    const event = 'kind' in row ? scriptEvent(row) : null
    const title = event?.type === 'phase' && typeof event.title === 'string'
      ? event.title
      : ''
    if (
      row.channel === 'verdict' || title === '最终判决' ||
      event?.type === 'final_vote_reveal' || event?.type === 'score'
    ) {
      bySeq.set(row.seq, null)
      continue
    }
    const phaseRound = /^第\s*(\d+)\s*轮/.exec(title)
    const round = phaseRound ? Number(phaseRound[1]) : event?.round
    if (
      typeof round === 'number' && Number.isInteger(round) && round >= 1 &&
      round <= 5
    ) {
      current = round - 1
    }
    lastRound = Math.max(lastRound, current)
    bySeq.set(row.seq, current)
  }
  return {
    labels: Array.from(
      { length: lastRound + 1 },
      (_, index) => `第${index + 1}轮`,
    ),
    bySeq,
  }
}

// Keep the original sequence within each chapter; final verdicts stay below tabs.
export function transcriptTabPlan(
  scenarioID: string,
  turns: TurnDTO[],
  bubbles: LiveBubble[] = [],
): TranscriptTabPlan | null {
  const trolley = scenarioID === 'trolley-problem'
  const harbor = scenarioID === 'legal-harbor-murder-jury'
  if (!trolley && !harbor && scenarioID !== 'fengyiting-real') return null
  const labels = trolley
    ? ['原始电车', '自动驾驶车', '缸中之脑']
    : ['交锋', '私会', '暗流']
  const bySeq = new Map<number, number | null>()
  const committed = new Set(turns.map((turn) => turn.seq))
  const rows = [
    ...turns,
    ...bubbles.filter((bubble) =>
      bubble.seq >= 0 && !committed.has(bubble.seq)
    ),
  ].sort((left, right) => left.seq - right.seq)
  if (harbor) return harborRoundPlan(rows)
  let current = 0
  let pendingPhases: number[] = []
  for (const row of rows) {
    const event = 'kind' in row ? scriptEvent(row) : null
    if (event?.type === 'phase') {
      pendingPhases.push(row.seq)
      if (trolley && typeof event.title === 'string') {
        const title = /^第([一二三])案·(.+)$/.exec(event.title)
        if (title) labels['一二三'.indexOf(title[1])] = title[2]
      }
      continue
    }
    let tab: number | null = current
    if (row.channel === 'verdict') tab = null
    else if (trolley) {
      const number = /^case-([123])$/.exec(row.channel)
      if (number) tab = Number(number[1]) - 1
    } else if (row.channel === 'public' || row.channel === 'order') tab = 0
    else if (/^[ab]-1$/.test(row.channel)) tab = 1
    else if (/^(leak-[ab]|[ab]-2)$/.test(row.channel)) tab = 2
    for (const seq of pendingPhases) bySeq.set(seq, tab)
    pendingPhases = []
    bySeq.set(row.seq, tab)
    if (tab != null) current = tab
  }
  // A phase can arrive before its first line during streaming.
  for (const seq of pendingPhases) {
    const phase = turns.find((turn) => turn.seq === seq)
    const title = phase ? scriptEvent(phase)?.title : null
    if (typeof title === 'string') {
      if (/^(终局|明理者裁决)/.test(title)) {
        bySeq.set(seq, null)
        continue
      }
      if (trolley) {
        const number = /^第([一二三])案·/.exec(title)
        if (number) current = '一二三'.indexOf(number[1])
      } else if (/^(暗流|第四场|第五场)/.test(title)) current = 2
      else if (/^第[二三]场/.test(title)) current = 1
    }
    bySeq.set(seq, current)
  }
  return { labels, bySeq }
}

export function sliceTranscriptGroup(
  group: StageGroup,
  plan: TranscriptTabPlan,
  tab: number | null,
): StageGroup {
  return {
    ...group,
    phases: group.phases.filter((phase) => plan.bySeq.get(phase.seq) === tab),
    channels: group.channels.map((channel) => ({
      ...channel,
      items: channel.items.filter((item) => plan.bySeq.get(item.seq) === tab),
    })).filter((channel) => channel.items.length > 0),
  }
}
