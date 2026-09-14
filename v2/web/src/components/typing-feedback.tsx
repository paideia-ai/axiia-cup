import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getSoundPreferences, subscribeSound } from '../lib/sound'
import { TypingAudio } from '../lib/typing/audio'
import { attachFeedback, type Preferences } from '../lib/typing/feedback'
import '../lib/typing/typing.css'

export function TypingFeedback() {
  const master = useSyncExternalStore(
    subscribeSound,
    getSoundPreferences,
    getSoundPreferences,
  )
  const current = useRef<Preferences>({
    enabled: master.enabled,
    volume: master.volume * 100,
  })
  const engine = useRef<TypingAudio | null>(null)

  useEffect(() => {
    current.current = {
      enabled: master.enabled,
      volume: master.volume * 100,
    }
    engine.current?.configure(master.enabled, master.volume * 100)
  }, [master.enabled, master.volume])

  useEffect(() => {
    const audio = new TypingAudio()
    audio.configure(current.current.enabled, current.current.volume)
    engine.current = audio
    let detach: (() => void) | undefined
    let attached: HTMLTextAreaElement | null = null
    function findEditor() {
      const editor = document.querySelector<HTMLTextAreaElement>(
        '#prompt-input',
      )
      if (editor === attached) return
      detach?.()
      attached = editor
      detach = editor
        ? attachFeedback(editor, audio, () => current.current)
        : undefined
    }
    const observer = new MutationObserver(findEditor)
    observer.observe(document.body, { childList: true, subtree: true })
    findEditor()
    return () => {
      observer.disconnect()
      detach?.()
      audio.dispose()
      engine.current = null
    }
  }, [])

  return null
}
