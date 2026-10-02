import {
  decodePortrait,
  useEmotionBuffering,
  useOutputPresentation,
} from './emotion-playback'
import './role-portrait.css'
import { useEffect, useState } from 'react'
import type { SpeakerLabels } from './timeline/labels'
import { rolePortrait } from '../lib/role-portrait'

// Decorative beside an existing name: screen readers already have that name.
// Fixed dimensions reserve space before load; a missing asset hides quietly.
export function RolePortrait(
  { labels, speaker, size = 'default', generating = false }: {
    labels: SpeakerLabels
    speaker: string
    size?: 'default' | 'sm'
    generating?: boolean
  },
) {
  const buffering = useEmotionBuffering()
  const view = useOutputPresentation()
  const neutral = rolePortrait(labels, speaker)
  useEffect(() => {
    if (!buffering || !generating) return
    const categories = [
      'E01',
      'E02',
      'E03',
      'E04',
      'E05',
      'E06',
      'E07',
      'E08',
      'E09',
      'E10',
    ] as const
    for (const category of categories) {
      const image = rolePortrait(labels, speaker, category)
      if (image) void decodePortrait(image).catch(() => {})
    }
  }, [buffering, neutral, labels, speaker, generating])
  const selected = rolePortrait(labels, speaker, view?.category)
  const [failed, setFailed] = useState<string | null>(null)
  const src = selected === failed ? neutral : selected
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
