import { Clock3, Minus, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MatchParticipantDTO, MatchSummary } from '../../api/types'
import { historyResult } from '../../lib/history-result'
import { npcIdentityPath } from '../../lib/identity-links'
import type { RoleNames } from '../../lib/outcome'
import { roleIdentity } from '../../lib/role-identity'
import { rolePortrait } from '../../lib/role-portrait'
import { tm } from '../../testmode/mark'
import { speakerLabels } from '../timeline/labels'
import './history-bar.css'

function identityPath(m: MatchSummary, p?: MatchParticipantDTO) {
  if (p?.isMine && p.agentID != null) return `/agents/${p.agentID}`
  if (p?.presetKey) return npcIdentityPath(m.scenarioID, p.presetKey, m.id)
  if (p?.agentID != null && p.versionID != null) {
    return `/agents/${p.agentID}/identity?version=${p.versionID}&match=${m.id}`
  }
  return null
}

export function HistoryBar({ match: m, roles }: {
  match: MatchSummary
  roles: RoleNames | null
}) {
  const sides = ['a', 'b'] as const
  const nameOf = (side: 'a' | 'b') =>
    roleIdentity({
      scenarioID: m.scenarioID,
      side,
      role: m.participants?.[side]?.role,
      fallback: roles?.[side],
    }).name
  const names = { a: nameOf('a'), b: nameOf('b') }
  const labels = speakerLabels(m.scenarioID, names, [], m.participants)
  const result = historyResult(m, names)
  const Icon = result.tone === 'pending'
    ? Clock3
    : result.tone === 'neutral'
    ? Minus
    : null
  return (
    <div
      className='history-card history-bar'
      data-scroll-anchor={`match-${m.id}`}
    >
      <Link
        to={`/matches/${m.id}`}
        className='hbr-meta'
        {...tm('L.match-card')}
        aria-label={`对战 #${m.id}，${m.scenarioTitle}，${result.label}`}
      >
        {m.viewed === false && (
          <span
            className='history-unread-marker'
            role='img'
            aria-label='没有看过此对局'
            title='没有看过此对局'
          />
        )}
        <span className='hbr-number' {...tm('L.match-id')}>
          对战 #{m.id}
          {m.challengeLeg != null && (
            <span className='hbr-leg' {...tm('L.challenge-leg')}>
              约战{m.challengeLeg === 1 ? '①' : '②'}
            </span>
          )}
        </span>
        <span
          className='hbr-scene'
          title={`${m.scenarioTitle} · ${m.kind.toUpperCase()}`}
          {...tm('L.match-meta')}
        >
          <span>{m.scenarioTitle}</span>
          <span className='hbr-kind'>{m.kind.toUpperCase()}</span>
        </span>
      </Link>
      <div className='hbr-participants'>
        {sides.map((side) => {
          const p = m.participants?.[side]
          const href = identityPath(m, p)
          const outcome = result.winner
            ? result.winner === side ? 'win' : 'loss'
            : undefined
          const info = p?.agentID != null
            ? `${
              p.isMine ? '智能体' : p.ownerDisplayName || '其他玩家'
            } #${p.agentID}`
            : p?.presetKey
            ? '平台 NPC · 预设'
            : '身份信息缺失'
          const title = `${names[side]} · ${p?.isMine ? `我的${info}` : info}${
            outcome ? outcome === 'win' ? ' · 胜' : ' · 负' : ''
          }`
          const portrait = rolePortrait(labels, side)
          const content = (
            <>
              <span className='hbr-avatar'>
                {portrait
                  ? (
                    <img
                      src={portrait}
                      width='34'
                      height='34'
                      alt=''
                      loading='lazy'
                    />
                  )
                  : <UserRound aria-hidden='true' />}
                {p?.isMine && <span className='hbr-you'>你</span>}
              </span>
              <span className='hbr-info'>
                <span className='hbr-name'>
                  <strong>{names[side]}</strong>
                  {outcome && (
                    <span className='hbr-side-result'>
                      {outcome === 'win' ? '胜' : '负'}
                    </span>
                  )}
                </span>
                <span className='hbr-owner'>{info}</span>
              </span>
            </>
          )
          return href
            ? (
              <Link
                key={side}
                to={href}
                className='hbr-person'
                data-side={side}
                data-outcome={outcome}
                title={title}
                aria-label={title}
                {...(p?.isMine ? tm('L.owned-agent') : {})}
              >
                {content}
              </Link>
            )
            : (
              <div
                key={side}
                className='hbr-person'
                data-side={side}
                data-outcome={outcome}
                title={title}
              >
                {content}
              </div>
            )
        })}
      </div>
      <div
        className='hbr-result'
        data-tone={result.tone}
        {...tm('L.status-badge')}
      >
        <strong title={result.label}>
          {Icon && <Icon aria-hidden='true' />}
          {result.role
            ? (
              <span className='hbr-result-copy'>
                {result.personal && <span>你（</span>}
                <span className='hbr-result-role'>{result.role}</span>
                <span>
                  {result.personal ? '） ' : ' '}
                  {result.tone === 'loss' ? '负' : '胜'}
                </span>
              </span>
            )
            : result.label}
        </strong>
      </div>
    </div>
  )
}
