import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from '../../context/sound'
import { TypingAudio } from './audio'
import { attachFeedback, type Preferences } from './feedback'
import './typing.css'

const storageKey = 'axiia.typing-preview.v1'
function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    return {
      enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
      volume: Number.isFinite(value?.volume)
        ? Math.max(0, Math.min(60, value.volume))
        : 25,
    }
  } catch {
    return { enabled: true, volume: 25 }
  }
}

export function TypingFeedback() {
  const [prefs, setPrefs] = useState(readPreferences)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [audioError, setAudioError] = useState(false)
  const current = useRef(prefs)
  const engine = useRef<TypingAudio | null>(null)
  const location = useLocation()
  const { preferences: master } = useSound()
  const effective = {
    enabled: prefs.enabled && master.enabled,
    volume: Math.min(100, prefs.volume * master.volume / 0.25),
  }

  useEffect(() => {
    current.current = effective
    engine.current?.configure(effective.enabled, effective.volume)
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs))
    } catch { /* Optional preferences. */ }
  }, [prefs, master.enabled, master.volume])

  useEffect(() => {
    const audio = new TypingAudio()
    audio.configure(current.current.enabled, current.current.volume)
    engine.current = audio
    let detach: (() => void) | undefined
    let controls: HTMLElement | undefined
    let attached: HTMLTextAreaElement | null = null
    function findEditor() {
      const editor = document.querySelector<HTMLTextAreaElement>(
        '#prompt-input',
      )
      if (editor === attached) return
      detach?.()
      controls?.remove()
      attached = editor
      if (!editor) {
        setTarget(null)
        return
      }
      detach = attachFeedback(editor, audio, () => current.current)
      const toolbar = document.querySelector('[data-tm="E.copy-prompt-button"]')
        ?.parentElement
      if (toolbar) {
        controls = document.createElement('span')
        controls.className = 'typing-sound-controls'
        toolbar.insertBefore(controls, toolbar.lastElementChild)
        setTarget(controls)
      }
    }
    const observer = new MutationObserver(findEditor)
    observer.observe(document.body, { childList: true, subtree: true })
    findEditor()
    return () => {
      observer.disconnect()
      detach?.()
      controls?.remove()
      audio.dispose()
      engine.current = null
    }
  }, [location.pathname])

  async function enableSound(enabled: boolean, volume: number) {
    setPrefs({ enabled, volume })
    engine.current?.configure(
      enabled && master.enabled,
      Math.min(100, volume * master.volume / 0.25),
    )
    if (enabled && master.enabled) {
      const ok = await engine.current?.unlock(
        Math.min(100, volume * master.volume / 0.25),
      )
      setAudioError(!ok)
      if (ok) engine.current?.play()
    }
  }

  return target
    ? createPortal(
      <>
        <button
          type='button'
          className='typing-sound-toggle'
          aria-label={prefs.enabled ? '静音柔音' : '开启柔音'}
          aria-pressed={prefs.enabled}
          title={prefs.enabled ? '柔音已开启' : '柔音已静音'}
          onClick={() => void enableSound(!prefs.enabled, prefs.volume)}
        >
          {prefs.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span>柔音</span>
        </button>
        <input
          type='range'
          min='0'
          max='60'
          value={prefs.volume}
          aria-label='柔音音量'
          aria-valuetext={`${prefs.volume}%`}
          title={`柔音音量 ${prefs.volume}%`}
          onChange={(event) =>
            void enableSound(prefs.enabled, Number(event.target.value))}
        />
        {audioError
          ? (
            <span role='status' className='typing-audio-error'>
              点击重试声音
            </span>
          )
          : null}
      </>,
      target,
    )
    : null
}
