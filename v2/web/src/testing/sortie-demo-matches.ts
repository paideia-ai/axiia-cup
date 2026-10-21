import type { MatchDetail, MatchParticipantDTO, TurnDTO } from '../api/types'
import { sortieEntries, type SortieEntry } from '../features/sortie/fixtures'
import {
  type Entry,
  type RecordStats,
  settle,
} from '../features/sortie/matchmaking'
import { portraitScenarios } from './agent-portrait-fixtures'

interface Run {
  matchID: number
  startedAt: number
  detail: MatchDetail
  turns: TurnDTO[]
  own: SortieEntry
  opponent: Entry & { name: string }
  outcome: 'win' | 'loss' | 'draw'
  settled: boolean
}
const duration = 45000
function detail(run: Run): MatchDetail {
  const elapsed = Date.now() - run.startedAt
  const finished = elapsed >= duration
  const count = Math.min(run.turns.length, Math.floor(elapsed / (duration / 3)))
  return {
    ...run.detail,
    summary: {
      ...run.detail.summary,
      finished,
      scored: finished,
      winner: finished ? run.detail.summary.winner : null,
      finishedAt: finished ? (run.startedAt + duration) / 1000 : null,
    },
    currentTurn: count,
    turns: run.turns.slice(0, count),
    reasoning: finished
      ? '本地模拟结果，用于演示出战流程，不代表模型的实际表现。'
      : null,
  }
}

export function createSortieMatches() {
  const runs = new Map<number, Run>()
  const records = new Map<number, RecordStats>()
  let nextID = 9100
  function settleFinished() {
    for (const run of runs.values()) {
      if (run.settled || !detail(run).summary.finished) continue
      run.settled = true
      records.set(
        run.own.agentID,
        settle(records.get(run.own.agentID) ?? run.own, run.outcome),
      )
      records.set(
        run.opponent.agentID,
        settle(
          records.get(run.opponent.agentID) ?? run.opponent,
          run.outcome === 'win'
            ? 'loss'
            : run.outcome === 'loss'
            ? 'win'
            : 'draw',
        ),
      )
    }
  }
  function record(entry: Entry): RecordStats {
    settleFinished()
    return records.get(entry.agentID) ?? entry
  }
  function summaries() {
    settleFinished()
    return [...runs.values()].map((run) => detail(run).summary).reverse()
  }
  function create(
    own: SortieEntry,
    opponent: Entry & { name: string },
    outcome: 'win' | 'loss' | 'draw',
  ) {
    const other = sortieEntries.find((e) =>
      e.scenarioID === own.scenarioID && e.side === opponent.side
    )!
    const scenario = portraitScenarios.find((s) =>
      s.summary.id === own.scenarioID
    )!
    const participant = (
      entry: typeof own,
      mine: boolean,
    ): MatchParticipantDTO => ({
      role: { key: entry.roleKey, name: entry.roleName, side: entry.side },
      versionID: mine ? own.versionID : opponent.versionID,
      ownerDisplayName: mine ? '你' : opponent.name,
      isMine: mine,
    })
    const winner = outcome === 'draw'
      ? 'draw'
      : outcome === 'win'
      ? own.side
      : other.side
    const channel = 'demo-dialogue'
    const run: Run = {
      own,
      opponent,
      outcome,
      settled: false,
      matchID: nextID++,
      startedAt: Date.now(),
      detail: {
        summary: {
          id: nextID - 1,
          scenarioID: own.scenarioID,
          scenarioTitle: `${scenario.summary.title} · 本地演示`,
          kind: 'pvp',
          dispatched: true,
          finished: false,
          scored: false,
          winner,
          initiatorIsMe: true,
          createdAt: Date.now() / 1000,
          participants: own.side === 'a'
            ? { a: participant(own, true), b: participant(other, false) }
            : { a: participant(other, false), b: participant(own, true) },
        },
        currentTurn: 0,
        turns: [],
        verdicts: [],
        stages: [{
          id: 'demo',
          title: '模拟交锋',
          channels: [{ id: channel, label: '本地演示' }],
        }],
        speakerLabels: {
          a: scenario.summary.sideAName,
          b: scenario.summary.sideBName,
        },
      },
      turns: [
        {
          seq: 0,
          channel,
          kind: 'dialogue',
          speaker: own.roleKey,
          finalText: '【本地模拟】我将先陈述自己的立场，再回应对方的质疑。',
        },
        {
          seq: 1,
          channel,
          kind: 'dialogue',
          speaker: other.roleKey,
          finalText: '【本地模拟】我会提出不同的判断，并说明其中的理由。',
        },
        {
          seq: 2,
          channel,
          kind: 'dialogue',
          speaker: own.roleKey,
          finalText:
            '【本地模拟】双方已经完成交锋。本段仅用于预览对战页，不调用模型。',
        },
      ],
    }
    runs.set(run.matchID, run)
    return { matchID: run.matchID }
  }
  function handle(
    request: Request,
    path: string,
  ): Response | null {
    if (path === '/matches' && request.method === 'GET') {
      return Response.json({ matches: summaries(), open: true })
    }
    const found = /^\/matches\/(\d+)(?:\/(stream|view))?$/.exec(path)
    if (!found) return null
    const run = runs.get(Number(found[1]))
    if (!run) return null
    if (found[2] === 'view' && request.method === 'POST') {
      return Response.json({ ok: true })
    }
    if (request.method !== 'GET') return null
    if (!found[2]) return Response.json(detail(run))
    if (found[2] !== 'stream') return null
    let timer: ReturnType<typeof setInterval> | undefined
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder()
        let after = Number(
          new URL(request.url).searchParams.get('afterTurn') ?? -1,
        )
        const tick = () => {
          const current = detail(run)
          for (const turn of current.turns.filter((t) => t.seq > after)) {
            controller.enqueue(
              encoder.encode(
                `data: ${
                  JSON.stringify({
                    turnCompleted: {
                      matchID: run.matchID,
                      seq: turn.seq,
                      channel: turn.channel,
                      kind: turn.kind,
                    },
                  })
                }\n\n`,
              ),
            )
            after = turn.seq
          }
          if (current.summary.finished) {
            controller.enqueue(
              encoder.encode(
                `data: ${
                  JSON.stringify({
                    matchFinished: {
                      matchID: run.matchID,
                      winner: current.summary.winner ?? '',
                    },
                  })
                }\n\n`,
              ),
            )
            clearInterval(timer)
            controller.close()
          }
        }
        timer = setInterval(tick, 250)
        tick()
      },
      cancel() {
        clearInterval(timer)
      },
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
      },
    })
  }
  return { create, handle, record, summaries }
}
