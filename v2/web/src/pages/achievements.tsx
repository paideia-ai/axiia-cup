import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { PageLoading } from '../components/page-loading'
import { Button } from '../components/ui/button'
import { achievementsQuery } from '../lib/navigation-queries'
import { usePageQuery } from '../lib/use-page-query'

const tiers = [
  { name: '金', color: 'text-amber-300' },
  { name: '银', color: 'text-slate-300' },
  { name: '铜', color: 'text-orange-300' },
] as const

export function AchievementsPage() {
  const { account } = useAuth()
  const { data, loading, error, reload } = usePageQuery(
    achievementsQuery(account?.id ?? ''),
  )
  const { hash } = useLocation()
  useEffect(() => {
    if (data && hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        block: 'center',
      })
    }
  }, [data, hash])
  if (loading) return <PageLoading />
  if (error || !data) {
    return (
      <div role='alert' className='space-y-3'>
        <p>{error ?? '成就暂时无法加载'}</p>
        <Button variant='secondary' onClick={reload}>重试</Button>
      </div>
    )
  }
  const unlocked = data.achievements.filter((item) => item.unlocked).length
  return (
    <div className='space-y-8 page-content-ready'>
      <header className='space-y-2'>
        <Link
          to='/settings'
          className='text-sm text-(--foreground-subtle) underline'
        >
          返回账户
        </Link>
        <h1 className='text-2xl font-black tracking-tight'>成就中心</h1>
        <p className='text-sm text-(--foreground-subtle)'>
          已获得 {unlocked} / {data.achievements.length}
        </p>
        {unlocked === 0
          ? (
            <p className='text-sm text-(--foreground-muted)'>
              故事还未揭晓。完成对局后，成就会在这里留下记录。
            </p>
          )
          : null}
      </header>
      {tiers.map((tier) => {
        const items = data.achievements.filter((item) =>
          item.tier === tier.name
        )
          .sort((a, b) =>
            Number(b.unlocked) - Number(a.unlocked) || a.slot - b.slot
          )
        return (
          <section
            key={tier.name}
            aria-labelledby={`tier-${tier.name}`}
            className='space-y-4'
          >
            <h2
              id={`tier-${tier.name}`}
              className={`border-b border-(--border-soft) pb-3 text-lg font-semibold ${tier.color}`}
            >
              {tier.name}级{' '}
              <span className='ml-2 text-xs font-normal text-(--foreground-muted)'>
                {items.filter((item) => item.unlocked).length} / {items.length}
              </span>
            </h2>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {items.map((item) =>
                item.unlocked
                  ? (
                    <article
                      key={item.slot}
                      id={item.id}
                      className='scroll-mt-20 rounded-xl border border-(--border-soft) bg-(--surface) p-4 target:border-(--accent)'
                    >
                      <div className='flex items-start gap-4'>
                        <img
                          src={item.image}
                          alt=''
                          width={80}
                          height={80}
                          loading='lazy'
                          className='h-20 w-20 shrink-0 rounded-lg object-cover'
                        />
                        <div className='min-w-0 space-y-2'>
                          <h3 className='font-semibold'>{item.title}</h3>
                          <p className='text-sm leading-relaxed text-(--foreground-subtle)'>
                            {item.description}
                          </p>
                          {item.flavor
                            ? (
                              <p className='text-sm italic leading-relaxed text-(--foreground-muted)'>
                                {item.flavor}
                              </p>
                            )
                            : null}
                          {item.unlockedAt != null
                            ? (
                              <time
                                dateTime={new Date(item.unlockedAt * 1000)
                                  .toISOString()}
                                className='block text-xs text-(--foreground-muted)'
                              >
                                {new Date(item.unlockedAt * 1000)
                                  .toLocaleDateString('zh-CN')} 获得
                              </time>
                            )
                            : null}
                        </div>
                      </div>
                    </article>
                  )
                  : (
                    <div
                      key={item.slot}
                      className='flex min-h-28 items-center justify-center rounded-xl border border-(--border-soft) p-4'
                    >
                      <div
                        role='img'
                        aria-label='尚未获得的成就'
                        className='flex h-20 w-20 items-center justify-center rounded-lg border border-(--border-soft) bg-white/4 text-4xl font-light text-(--foreground-muted)'
                      >
                        ?
                      </div>
                    </div>
                  )
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
