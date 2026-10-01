import './role-portrait.css'
import { useState } from 'react'
import type { SpeakerLabels } from './timeline/labels'
import { rolePortrait } from '../lib/role-portrait'

// Decorative beside an existing name: screen readers already have that name.
// Fixed dimensions reserve space before load; a missing asset hides quietly.
export function RolePortrait({ labels, speaker, size = 'default' }: {
  labels: SpeakerLabels
  speaker: string
  size?: 'default' | 'sm'
}) {
  const src = rolePortrait(labels, speaker)
  const [failed, setFailed] = useState<string | null>(null)
  if (!src || src === failed) return null
  return (
    <img
      data-role-portrait={speaker}
      data-portrait-size={size}
      src={src}
      alt=''
      width={size === 'sm' ? 32 : 80}
      height={size === 'sm' ? 32 : 80}
      loading='lazy'
      decoding='async'
      onError={() => setFailed(src)}
      className='role-portrait size-20 shrink-0 rounded-[2px] object-contain [image-rendering:pixelated]'
    />
  )
}
