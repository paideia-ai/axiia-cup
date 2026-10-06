import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import type {
  AchievementDTO,
  AchievementTier,
  EarnedAchievementDTO,
} from '../api/types'
import { Button } from '../components/ui/button'
import { PageLoading } from '../components/page-loading'
import { useAuth } from '../context/auth'
import { achievementsQuery } from '../lib/navigation-queries'
import { usePageQuery } from '../lib/use-page-query'
import '../components/achievements.css'

const TIERS: { key: AchievementTier; name: string }[] = [
  { key: 'gold', name: '金' },
  { key: 'silver', name: '银' },
  { key: 'bronze', name: '铜' },
]

export function AchievementsPage() {
  const { account } = useAuth()
  const { data, loading, error, refreshError, reload } = usePageQuery(
    achievementsQuery(account!.id),
  )
  const { hash } = useLocation()
  useEffect(() => {
    if (!data || !hash) return
    try {
      const element = document.getElementById(decodeURIComponent(hash.slice(1)))
      element?.scrollIntoView({ block: 'center' })
    } catch {
      /* A malformed fragment must not prevent reading the collection. */
    }
  }, [data, hash])
  const earned = data?.achievements.filter((item) => item.unlocked).length ?? 0
  return (
    <div className='space-y-8'>
      <header>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          成就中心
        </h1>
        {data
          ? (
            <p className='mt-3 text-sm text-(--foreground-muted)'>
              已获得 {earned} / {data.achievements.length}
            </p>
          )
          : null}
      </header>
      {(error || refreshError)
        ? (
          <div
            role='alert'
            className='flex flex-wrap items-center gap-3 text-sm text-(--warning)'
          >
            <p>
              {data
                ? '成就更新失败，正在显示上次的收藏。'
                : '暂时无法加载成就，请重试。'}
            </p>
            <Button variant='secondary' onClick={reload}>重新加载</Button>
          </div>
        )
        : null}
      {loading && !data ? <PageLoading variant='list' /> : null}
      {data ? <AchievementCollection achievements={data.achievements} /> : null}
    </div>
  )
}

export function AchievementCollection(
  { achievements }: { achievements: AchievementDTO[] },
) {
  return (
    <div className='space-y-9'>
      {TIERS.map((tier) => {
        const items = achievements.filter((item) => item.tier === tier.key)
        return (
          <section
            key={tier.key}
            aria-labelledby={`achievement-tier-${tier.key}`}
            className='space-y-4'
          >
            <div className='flex items-baseline gap-3 border-b border-(--border-soft) pb-3'>
              <h2
                id={`achievement-tier-${tier.key}`}
                className={`achievement-tier achievement-tier-${tier.key}`}
              >
                {tier.name}级成就
              </h2>
              <span className='text-xs text-(--foreground-subtle)'>
                {items.filter((item) => item.unlocked).length} / {items.length}
              </span>
            </div>
            <ul className='achievement-grid'>
              {items.map((item) => (
                <li
                  key={item.id}
                  id={item.unlocked ? item.id : undefined}
                  className='achievement-item'
                >
                  {item.unlocked
                    ? (
                      <>
                        <img
                          src={item.iconURL}
                          alt=''
                          width={240}
                          height={240}
                          loading='lazy'
                          className='achievement-art'
                        />
                        <div className='mt-3 space-y-2'>
                          <h3 className='text-sm font-semibold text-(--foreground)'>
                            {item.title}
                          </h3>
                          {item.flavor.trim()
                            ? (
                              <p className='text-sm text-(--foreground-subtle)'>
                                “{item.flavor.trim()}”
                              </p>
                            )
                            : null}
                          <p className='text-sm leading-relaxed text-(--foreground-muted)'>
                            {item.description}
                          </p>
                          <AchievementDate achievement={item} />
                        </div>
                      </>
                    )
                    : (
                      <div
                        role='img'
                        aria-label='未解锁成就'
                        className='achievement-locked'
                      >
                        <span aria-hidden='true'>?</span>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function AchievementDate(
  { achievement }: { achievement: EarnedAchievementDTO },
) {
  const date = new Date(achievement.unlockedAt * 1000)
  const dateText = (
    <time dateTime={date.toISOString()}>
      {date.toLocaleDateString('zh-CN')} 获得
    </time>
  )
  return achievement.matchID != null
    ? (
      <Link
        to={`/matches/${achievement.matchID}`}
        className='inline-block rounded text-xs text-(--foreground-subtle) underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)'
      >
        {dateText}
      </Link>
    )
    : (
      <span className='block text-xs text-(--foreground-subtle)'>
        {dateText}
      </span>
    )
}
