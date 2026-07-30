import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { matches } from '../api/client'
import { useMatchStream } from '../api/sse'
import type { SpeakerLabels } from '../components/timeline/labels'
import { speakerName } from '../components/timeline/labels'
import { ReasoningFold } from '../components/timeline/reasoning-fold'
import { TranscriptStage } from '../components/timeline/stage'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { VerdictCard } from '../components/verdict-card'
import { formatScoringReasoning } from '../lib/scoring-reasoning'
import { usePinToBottom } from '../lib/scroll'
import { groupTranscript, placeVerdicts } from '../lib/transcript'
import { useAsync } from '../lib/use-async'
import { isTerminalVerdict } from '../lib/verdict'

export function MatchDetailPage() {
  const { matchId = '' } = useParams()
  const matchID = Number(matchId)
  const { data, error, loading, reload } = useAsync(
    () => matches.detail(matchID),
    [matchID],
  )
  const labels: SpeakerLabels = data?.speakerLabels ?? {}
  const sideA = labels.a ?? '甲方'
  const sideB = labels.b ?? '乙方'

  const live = data != null && !data.summary.finished
  const stream = useMatchStream(matchID, live)

  useEffect(() => {
    if (stream.done) reload()
  }, [stream.done, reload])

  // Chunks carry the content of the turn in flight; the committed row still comes
  // from a refetch, but only at a landmark (turn/verdict), never per token.
  const landmark = stream.landmark == null
    ? null
    : JSON.stringify(stream.landmark)
  useEffect(() => {
    if (landmark != null) reload()
  }, [landmark, reload])

  const stageGroups = data
    ? groupTranscript(data.turns, data.stages, stream.bubbles)
    : []
  const interim = placeVerdicts(
    stageGroups,
    data?.verdicts.filter((verdict) => !isTerminalVerdict(verdict)) ?? [],
  )
  const finalVerdict = data?.verdicts.find(isTerminalVerdict) ?? null
  const ledger = formatScoringReasoning(data?.reasoning)
  // A private generation (an `act` with no channel, an affordance-only reply) has
  // no timeline row to grow into; it belongs to the status card, not the script.
  const offstage = stream.bubbles.filter((bubble) => bubble.seq < 0)

  const grown = stream.bubbles.reduce(
    (total, bubble) => total + bubble.text.length + bubble.reasoning.length,
    data?.turns.length ?? 0,
  )
  usePinToBottom(live, grown)

  return (
    <div className='space-y-6'>
      {loading && data == null
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : !data
        ? (
          <div className='rounded-xl border border-(--border-soft) bg-white/2 px-6 py-8 text-center text-sm'>
            <p className='font-semibold text-(--foreground)'>
              {error ?? '对局不存在'}
            </p>
            <p className='mt-2 text-(--foreground-subtle)'>
              该对局可能已被删除或链接无效。
            </p>
            <div className='mt-5 flex justify-center'>
              <Link
                to='/matches'
                className='inline-flex items-center rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90'
              >
                返回对战列表
              </Link>
            </div>
          </div>
        )
        : (
          <>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
                  对战 #{data.summary.id}
                </h1>
                <p className='mt-1 text-sm text-(--foreground-subtle)'>
                  {data.summary.scenarioTitle} · {sideA} 对{sideB}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge tone='info'>{data.summary.kind.toUpperCase()}</Badge>
                {data.summary.finished
                  ? (
                    <Badge tone='success'>
                      {data.summary.winner === 'a'
                        ? `胜方 ${sideA}`
                        : data.summary.winner === 'b'
                        ? `胜方 ${sideB}`
                        : '已结束'}
                    </Badge>
                  )
                  : (
                    <Badge tone='warning'>
                      {stream.connected ? '直播中' : '进行中'}
                    </Badge>
                  )}
              </div>
            </div>

            {live && offstage.length > 0
              ? (
                <Card>
                  <CardContent className='space-y-2 pt-5'>
                    <h2 className='text-sm font-semibold text-(--foreground)'>
                      幕后
                    </h2>
                    {offstage.map((bubble) => (
                      <div key={bubble.speaker}>
                        <p className='text-sm text-(--foreground-subtle)'>
                          {speakerName(labels, bubble.speaker)} 正在推演…
                        </p>
                        <ReasoningFold text={bubble.reasoning} streaming />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
              : null}

            <div className='space-y-5'>
              <h2 className='text-sm font-semibold text-(--foreground)'>
                对话
              </h2>
              {stageGroups.length === 0
                ? (
                  <p className='text-sm text-(--foreground-muted)'>
                    {live ? '对局即将开始…' : '暂无回合。'}
                  </p>
                )
                : stageGroups.map((group, index) => (
                  <div key={group.id} className='space-y-3'>
                    <TranscriptStage
                      group={group}
                      index={index}
                      total={stageGroups.length}
                      labels={labels}
                    />
                    {interim.perGroup[index].map((verdict) => (
                      <VerdictCard
                        key={verdict.key}
                        verdict={verdict}
                        labels={labels}
                        interim
                      />
                    ))}
                  </div>
                ))}
              {interim.trailing.map((verdict) => (
                <VerdictCard
                  key={verdict.key}
                  verdict={verdict}
                  labels={labels}
                  interim
                />
              ))}
            </div>

            {finalVerdict
              ? (
                <VerdictCard
                  verdict={finalVerdict}
                  labels={labels}
                  interim={false}
                >
                  {data.scoreA != null && data.scoreB != null
                    ? (
                      <p className='text-sm text-(--foreground-subtle)'>
                        比分 {sideA} {data.scoreA} : {data.scoreB} {sideB}
                      </p>
                    )
                    : null}
                  {ledger
                    ? (
                      <p className='whitespace-pre-wrap text-xs text-(--foreground-muted)'>
                        {ledger}
                      </p>
                    )
                    : null}
                </VerdictCard>
              )
              : null}

            {data.error
              ? (
                <p className='text-sm text-(--accent)'>
                  对战错误：{data.error}
                </p>
              )
              : null}
          </>
        )}
    </div>
  )
}
