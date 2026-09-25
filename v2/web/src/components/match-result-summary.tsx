import { ArrowDown } from 'lucide-react'
import type { MatchDetail } from '../api/types'
import { scriptEvent } from '../lib/event'
import { isTerminalVerdict } from '../lib/verdict'
import { tm } from '../testmode/mark'
import './match-result-summary.css'

function decisionSummary(match: MatchDetail): string | null {
  let final: Record<string, unknown> = {}
  try {
    const value: unknown = JSON.parse(
      match.verdicts.find(isTerminalVerdict)?.output ?? '{}',
    )
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      final = value as Record<string, unknown>
    }
  } catch {
    // Older matches can have a plain-text verdict; the full verdict stays below.
  }
  const text = (key: string) => typeof final[key] === 'string' ? final[key] : ''
  switch (match.summary.scenarioID) {
    case 'shangyang-court':
    case 'honnoji-decision': {
      if (!text('judgment')) return null
      const judge = match.summary.scenarioID === 'shangyang-court'
        ? '秦孝公'
        : '明智光秀'
      return `${judge}决定${text('judgment')}`
    }
    case 'fengyiting-real':
      return text('side') && text('scheme')
        ? `貂蝉选择${text('side')}，${text('scheme')}`
        : null
    case 'trolley-problem':
      return ['A', 'B', 'C'].every((key) => text(key))
        ? `三案裁决：${
          ['A', 'B', 'C'].map((key) => `${key} ${text(key)}`).join('；')
        }`
        : null
    case 'legal-harbor-murder-jury': {
      const score = match.turns.map(scriptEvent).reverse().find((event) =>
        event?.type === 'score'
      )
      return typeof score?.guiltyVotes === 'number' &&
          typeof score.notGuiltyVotes === 'number'
        ? `有罪 ${score.guiltyVotes} 票 / 无罪 ${score.notGuiltyVotes} 票`
        : null
    }
    default:
      return null
  }
}

// Layout and type scale copied from the reviewed 5235 battle preview.
export function MatchResultSummary({ match, sideA, sideB, onDetails }: {
  match: MatchDetail
  sideA: string
  sideB: string
  onDetails: () => void
}) {
  const winner = match.summary.winner
  const outcome = winner === 'a'
    ? `${sideA}胜`
    : winner === 'b'
    ? `${sideB}胜`
    : winner === 'draw'
    ? '平局'
    : '已结束'
  const decision = decisionSummary(match)
  return (
    <section
      {...tm('FA.result-card')}
      className='match-result-summary'
      aria-label='简要对局结果'
    >
      <div>
        <p className='match-summary-caption'>本局结果</p>
        <h2 {...tm('FA.result-winner')}>{outcome}</h2>
        {decision ? <p>{decision}</p> : null}
      </div>
      <div {...tm('FA.result-score')} className='match-summary-score'>
        <span>{sideA} / {sideB}</span>
        <strong>
          {match.scoreA ?? '—'}
          <i>:</i>
          {match.scoreB ?? '—'}
        </strong>
        <button type='button' onClick={onDetails}>
          查看详细裁决 <ArrowDown size={13} />
        </button>
      </div>
    </section>
  )
}
