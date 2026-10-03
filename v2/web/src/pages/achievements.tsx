import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import type { AchievementDTO, AchievementTier } from '../api/types'
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
        <p className='mt-2 text-sm text-(--foreground-subtle)'>
          每一次突破，都在这里留下印记。
        </p>
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
                          <p className='text-sm text-(--foreground-subtle)'>
                            {item.flavor}
                          </p>
                          <p className='text-sm leading-relaxed text-(--foreground-muted)'>
                            {item.description}
                          </p>
                          <time
                            dateTime={new Date(item.unlockedAt * 1000)
                              .toISOString()}
                            className='block text-xs text-(--foreground-subtle)'
                          >
                            {new Date(item.unlockedAt * 1000)
                              .toLocaleDateString('zh-CN')} 获得
                          </time>
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
