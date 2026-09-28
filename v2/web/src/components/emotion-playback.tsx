import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { sseUrl } from '../api/client'
import type { MatchDetail } from '../api/types'
import {
  EmotionPlayback,
  type EmotionSnapshot,
  type Presentation,
  presentedText,
} from '../lib/emotion-playback'
import { rolePortrait } from '../lib/role-portrait'
import type { SpeakerLabels } from './timeline/labels'

const PlaybackContext = createContext<EmotionPlayback | null>(null)
const OutputContext = createContext<Presentation | null>(null)
const noop = () => () => {}
const pictures = new Map<string, Promise<void>>()
export function decodePortrait(src: string): Promise<void> {
  let loading = pictures.get(src)
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        void image.decode().then(resolve, reject)
      }
      image.onerror = reject
      image.fetchPriority = 'low'
      image.src = src
    })
    pictures.set(src, loading)
  }
  return loading
}

export function EmotionPlaybackProvider(
  { data, children }: { data: MatchDetail | null; children: ReactNode },
) {
  const [store] = useState(() => new EmotionPlayback())
  useLayoutEffect(() => {
    if (data) store.ingest(data, performance.now())
  }, [data, store])
  const ticking = useSyncExternalStore(store.subscribe, () => store.needsTick)
  const enabled = data?.emotions?.enabled === true
  const settled = data?.emotions?.settled === true
  const matchID = data?.summary.id
  useEffect(() => {
    if (!enabled || !ticking) return
    const timer = setInterval(() => store.tick(performance.now()), 16)
    return () => clearInterval(timer)
  }, [enabled, ticking, store])
  useEffect(() => {
    if (!enabled || settled || matchID == null) return
    const source = new EventSource(sseUrl(`/matches/${matchID}/emotions`), {
      withCredentials: true,
    })
    source.onmessage = (event) => {
      try {
        const snapshot = JSON.parse(event.data) as EmotionSnapshot
        if (Array.isArray(snapshot.outputs)) {
          store.update(snapshot.outputs, performance.now())
        }
        if (snapshot.settled) source.close()
      } catch { /* A malformed update cannot hold text playback. */ }
    }
    return () => source.close()
  }, [enabled, settled, matchID, store])
  return (
    <PlaybackContext.Provider value={store}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function useEmotionBuffering() {
  const store = useContext(PlaybackContext)
  return useSyncExternalStore(
    store?.subscribe ?? noop,
    () => store?.enabled ?? false,
  )
}
export function usePlaybackPending() {
  const store = useContext(PlaybackContext)
  return useSyncExternalStore(
    store?.subscribe ?? noop,
    () => store?.busy ?? false,
  )
}
export function usePlaybackCutoff(data: MatchDetail | null) {
  const store = useContext(PlaybackContext)
  return useSyncExternalStore(
    store?.subscribe ?? noop,
    () => store?.cutoff(data) ?? Infinity,
  )
}
export function usePresentedMatch(data: MatchDetail | null) {
  const cutoff = usePlaybackCutoff(data)
  const busy = usePlaybackPending()
  return useMemo(() => {
    if (!data || !busy) return data
    return {
      ...data,
      summary: {
        ...data.summary,
        finished: false,
        scored: false,
        winner: null,
      },
      scoreA: null,
      scoreB: null,
      reasoning: null,
      turns: data.turns.filter((turn) => turn.seq <= cutoff),
      verdicts: data.verdicts.filter((verdict) => verdict.afterSeq <= cutoff),
    }
  }, [data, cutoff, busy])
}
export function useOutputPresentation() {
  return useContext(OutputContext)
}

export function OutputBoundary({ outputRef, labels, speaker, children }: {
  outputRef?: string | null
  labels?: SpeakerLabels
  speaker: string
  children: ReactNode
}) {
  const store = useContext(PlaybackContext)
  const output = useSyncExternalStore(
    store?.subscribe ?? noop,
    () => outputRef ? store?.output(outputRef) : undefined,
  )
  const view = useSyncExternalStore(
    store?.subscribe ?? noop,
    () => store?.get(outputRef) ?? null,
  )
  const category = output?.status === 'ready'
    ? output.categoryId ?? 'E01'
    : null
  const src = labels && category
    ? rolePortrait(labels, speaker, category)
    : null
  useEffect(() => {
    if (!store || !outputRef || !category) return
    let active = true
    const prepared = () => {
      if (active) store.prepare(outputRef, category, performance.now())
    }
    if (src) void decodePortrait(src).then(prepared, () => {})
    else prepared()
    return () => {
      active = false
    }
  }, [store, outputRef, category, src])
  return (
    <OutputContext.Provider value={view}>{children}</OutputContext.Provider>
  )
}

export function OutputBody({ children }: { children: ReactNode }) {
  const view = useOutputPresentation()
  return view?.waiting
    ? <p className='text-sm text-(--foreground-muted)'>正在斟酌措辞…</p>
    : <>{children}</>
}
export function OutputText(
  { text, source }: { text: string; source?: string },
) {
  const view = useOutputPresentation()
  const shown = presentedText(view, text, source)
  const typing = view != null && !view.waiting && !view.complete &&
    shown.length > 0 && shown.length < text.length
  return (
    <>
      {shown}
      {typing && (
        <span
          aria-hidden='true'
          className='ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-(--accent)'
        />
      )}
    </>
  )
}
