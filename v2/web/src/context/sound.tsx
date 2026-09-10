import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  DEFAULT_SOUND_PREFERENCES,
  readSoundPreferences,
  SOUND_STORAGE_KEY,
  type SoundCue,
  SoundEngine,
  type SoundPreferences,
} from '../lib/sound'

import type { SoundPaletteID } from '../lib/sound-palettes'

import type { RewardSoundID } from '../lib/reward-sounds'

interface SoundContextValue {
  preferences: SoundPreferences
  update: (patch: Partial<SoundPreferences>) => void
  unlock: () => Promise<boolean>
  play: (
    cue: SoundCue,
    key: string,
    audition?: boolean,
    paletteID?: SoundPaletteID,
  ) => boolean
  prepareReward: (id?: RewardSoundID) => Promise<boolean>
  playReward: (id: RewardSoundID, key: string) => boolean
  stop: () => void
}

const SoundContext = createContext<SoundContextValue>({
  preferences: DEFAULT_SOUND_PREFERENCES,
  update: () => {},
  unlock: () => Promise.resolve(false),
  play: () => false,
  prepareReward: () => Promise.resolve(false),
  playReward: () => false,
  stop: () => {},
})

export function SoundProvider({ children }: PropsWithChildren) {
  const [engine] = useState(() => new SoundEngine())
  const [preferences, setPreferences] = useState(() => {
    try {
      return readSoundPreferences(localStorage.getItem(SOUND_STORAGE_KEY))
    } catch {
      return { ...DEFAULT_SOUND_PREFERENCES }
    }
  })
  const current = useRef(preferences)
  const update = useCallback((patch: Partial<SoundPreferences>) => {
    const next = readSoundPreferences(
      JSON.stringify({ ...current.current, ...patch }),
    )
    current.current = next
    engine.configure(next)
    setPreferences(next)
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(next))
    } catch { /* Optional preference storage. */ }
  }, [engine])

  useEffect(() => {
    engine.configure(current.current)
    void engine.prefetchReward()
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SOUND_STORAGE_KEY && event.key !== null) return
      const next = readSoundPreferences(event.newValue)
      current.current = next
      engine.configure(next)
      setPreferences(next)
    }
    const onVisibility = () => {
      if (document.hidden) engine.stop()
    }
    const onGesture = () => {
      if (current.current.enabled) void engine.unlock()
    }
    globalThis.addEventListener('storage', onStorage)
    globalThis.addEventListener('blur', engine.stop)
    globalThis.addEventListener('pointerdown', onGesture)
    globalThis.addEventListener('keydown', onGesture)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      globalThis.removeEventListener('storage', onStorage)
      globalThis.removeEventListener('blur', engine.stop)
      globalThis.removeEventListener('pointerdown', onGesture)
      globalThis.removeEventListener('keydown', onGesture)
      document.removeEventListener('visibilitychange', onVisibility)
      engine.stop()
    }
  }, [engine])

  const value = useMemo(
    () => ({
      preferences,
      update,
      unlock: engine.unlock,
      play: engine.play,
      prepareReward: engine.prepareReward,
      playReward: engine.playReward,
      stop: engine.stop,
    }),
    [preferences, update, engine],
  )
  return <SoundContext value={value}>{children}</SoundContext>
}

export const useSound = () => useContext(SoundContext)
