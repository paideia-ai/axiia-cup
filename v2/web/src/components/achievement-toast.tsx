import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import type { AchievementEventDTO } from '../api/types'
import { playSound } from '../lib/sound'
import './achievements.css'

export function AchievementToast({ event, accountID, onDismiss }: {
  event: AchievementEventDTO
  accountID: string
  onDismiss: () => void
}) {
  const { achievement } = event
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(!document.hidden)
  const remaining = useRef(7000)
  useEffect(() => {
    playSound('achievement', `${accountID}:${event.id}`)
  }, [accountID, event.id])
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])
  useEffect(() => {
    if (hovered || focused || !visible) return
    const started = performance.now()
    const timer = setTimeout(onDismiss, remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - started),
      )
    }
  }, [hovered, focused, visible, onDismiss])

  return (
    <aside
      className='achievement-toast'
      aria-label='成就达成'
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false)
        }
      }}
    >
      <Link
        to={`/settings/achievements#${encodeURIComponent(achievement.id)}`}
        target='_blank'
        rel='noopener noreferrer'
        className='achievement-toast-link'
        aria-label={`${achievement.title}，${achievement.flavor}，在新标签页打开成就中心`}
      >
        <span aria-live='polite' aria-atomic='true' className='block'>
          <span className='block text-sm font-semibold text-(--foreground)'>
            {achievement.title}
          </span>
          <span className='mt-1 block text-sm text-(--foreground-subtle)'>
            {achievement.flavor}
          </span>
        </span>
      </Link>
      <button
        type='button'
        onClick={onDismiss}
        aria-label='关闭成就提示'
        className='achievement-toast-close'
      >
        <X aria-hidden className='h-4 w-4' />
      </button>
    </aside>
  )
}
