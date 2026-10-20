import { ArrowRight, LoaderCircle, Swords } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { RolePortrait } from '../../components/role-portrait'
import type { SpeakerLabels } from '../../components/timeline/labels'
import { type Entry, gamesPlayed, winRate } from './matchmaking'

export function OpponentReveal({
  entry,
  opponent,
  labels,
  ownRole,
  otherRole,
  name,
  submitting,
  error,
  onStart,
  disabled = false,
}: {
  entry: Entry
  opponent: Entry
  labels: SpeakerLabels
  ownRole: { roleKey: string; roleName: string }
  otherRole: { roleKey: string; roleName: string }
  name: string
  submitting: boolean
  error: string | null
  disabled?: boolean
  onStart: () => void
}) {
  const [ready, setReady] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
    const reduced =
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    titleRef.current?.parentElement?.scrollIntoView({
      block: 'nearest',
      behavior: reduced ? 'instant' : 'smooth',
    })
    const timer = globalThis.setTimeout(() => setReady(true), reduced ? 0 : 800)
    return () => globalThis.clearTimeout(timer)
  }, [])
  const rate = (e: Entry) => {
    const value = winRate(e)
    return value == null ? '尚无战绩' : `${(value * 100).toFixed(1)}% 胜率`
  }
  return (
    <div className='sortie-reveal' data-ready={ready}>
      <h4 ref={titleRef} tabIndex={-1}>匹配成功</h4>
      <div className='sortie-duel'>
        <div className='sortie-duelist sortie-duelist-own'>
          <span className='sortie-duelist-caption'>你的智能体</span>
          <RolePortrait labels={labels} speaker={ownRole.roleKey} />
          <strong>你</strong>
          <span>{ownRole.roleName}</span>
          <small>{rate(entry)}</small>
        </div>
        <div className='sortie-duel-bridge' aria-hidden='true'>
          <span />
          <Swords size={24} />
          <span />
        </div>
        <div className='sortie-duelist sortie-duelist-opponent'>
          <span className='sortie-duelist-caption'>匹配到的对手</span>
          <RolePortrait labels={labels} speaker={otherRole.roleKey} />
          <strong>{name}</strong>
          <span>{otherRole.roleName}</span>
          <small>{rate(opponent)} · {gamesPlayed(opponent)} 场</small>
        </div>
      </div>
      <div className='sortie-reveal-actions'>
        {error && <p role='alert'>{error}</p>}
        <button
          className='sortie-primary'
          type='button'
          disabled={!ready || submitting || disabled}
          onClick={onStart}
        >
          {submitting
            ? <LoaderCircle className='sortie-spinner' size={18} />
            : <Swords size={18} />}
          {submitting ? '正在开始…' : '开始对局'}
          {!submitting && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  )
}
