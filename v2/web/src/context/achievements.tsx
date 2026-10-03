import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { X } from 'lucide-react'
import { achievements, ApiError } from '../api/client'
import type { AchievementDTO, AchievementsResponse } from '../api/types'
import {
  claimAchievementToast,
  freshAchievementEvents,
} from '../lib/achievement-events'
import { navigationCache } from '../lib/navigation-cache'
import { playSound } from '../lib/sound'

interface AchievementState {
  data: AchievementsResponse | null
  error: string | null
  refresh: () => void
}
const Context = createContext<AchievementState | null>(null)
export const useAchievements = () => useContext(Context)

export function AchievementsProvider(
  { accountID, children }: PropsWithChildren<{ accountID: string }>,
) {
  const [data, setData] = useState<AchievementsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<AchievementDTO[]>([])
  const [attempt, setAttempt] = useState(0)
  const refresh = useCallback(() => setAttempt((value) => value + 1), [])
  const cursor = useRef<number | null>(null)
  const current = queue[0]

  useEffect(() => {
    let alive = true
    let pending = false
    const load = async () => {
      if (
        pending || document.hidden ||
        (cursor.current != null && !document.hasFocus())
      ) return
      pending = true
      try {
        if (cursor.current == null) {
          const snapshot = await achievements.list()
          if (!alive) return
          cursor.current = snapshot.cursor
          setData(snapshot)
        } else {
          const after = cursor.current
          const update = await achievements.events(after)
          if (!alive) return
          if (update.achievements.length) {
            const fresh = freshAchievementEvents(
              update.achievements,
              after,
              Date.now() / 1000,
            )
            for (const row of fresh) {
              if (
                await claimAchievementToast(accountID, row.eventID!) && alive
              ) {
                setQueue((items) => [...items, row])
              }
            }
            if (!alive) return
            setData((previous) =>
              previous && ({
                cursor: update.cursor,
                achievements: previous.achievements.map((row) =>
                  update.achievements.find((next) => next.slot === row.slot) ??
                    row
                ),
              })
            )
            void navigationCache.invalidateQueries({
              queryKey: ['notifications'],
            })
          }
          cursor.current = update.cursor
        }
        setError(null)
      } catch (cause) {
        if (alive) {
          setError(
            cause instanceof ApiError && [404, 405].includes(cause.status)
              ? '成就中心暂未开放'
              : '成就暂时无法更新，请重试',
          )
        }
      } finally {
        pending = false
      }
    }
    void load()
    const timer = setInterval(() => void load(), 2000)
    const visible = () => void load()
    globalThis.addEventListener('focus', visible)
    document.addEventListener('visibilitychange', visible)
    return () => {
      alive = false
      clearInterval(timer)
      globalThis.removeEventListener('focus', visible)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [accountID, attempt])

  useEffect(() => {
    if (!current) return
    const sound = setTimeout(
      () => playSound('achievement', `${accountID}:${current.eventID}`),
      1000,
    )
    const dismiss = setTimeout(() => setQueue((items) => items.slice(1)), 6500)
    return () => {
      clearTimeout(sound)
      clearTimeout(dismiss)
    }
  }, [accountID, current])

  return (
    <Context.Provider value={{ data, error, refresh }}>
      {children}
      {current && (
        <aside
          aria-label='获得成就'
          className='fixed bottom-20 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm items-center gap-2 rounded-xl border border-(--border) bg-(--background) p-3 shadow-xl md:bottom-5'
        >
          <a
            href={`/achievements#${current.id}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-(--accent)'
          >
            <img
              src={`/achievements/${current.id}.webp`}
              width={56}
              height={56}
              alt=''
              className='h-14 w-14 shrink-0 rounded-lg'
            />
            <div aria-live='polite' aria-atomic='true'>
              <p className='text-sm font-semibold text-(--foreground)'>
                {current.title}
              </p>
              {current.flavor && (
                <p className='mt-1 text-sm text-(--foreground-subtle)'>
                  {current.flavor}
                </p>
              )}
            </div>
          </a>
          <button
            type='button'
            aria-label='关闭成就提示'
            className='self-start rounded p-1 text-(--foreground-muted) hover:text-(--foreground) focus-visible:outline-2'
            onClick={() => setQueue((items) => items.slice(1))}
          >
            <X size={16} />
          </button>
        </aside>
      )}
    </Context.Provider>
  )
}
