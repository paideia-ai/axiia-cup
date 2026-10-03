import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAchievements } from '../context/achievements'
import { Button } from '../components/ui/button'
import { PageLoading } from '../components/page-loading'
import type { AchievementDTO } from '../api/types'

const tiers = ['金', '银', '铜'] as const
const tierColors = { 金: '#dbbc73', 银: '#c4cbd6', 铜: '#c99170' }

export function AchievementsPage() {
  const state = useAchievements()
  const location = useLocation()
  const data = state?.data
  useEffect(() => {
    if (location.hash && data) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({
        block: 'center',
      })
    }
  }, [location.hash, data])
  return (
    <div className='space-y-8 pb-8'>
      <header>
        <Link
          to='/settings'
          className='text-sm text-(--foreground-muted) hover:text-(--foreground)'
        >
          ← 账户
        </Link>
        <div className='mt-3 flex items-baseline justify-between gap-4'>
          <h1 className='text-2xl font-black tracking-tight'>成就中心</h1>
          {data && (
            <p className='text-sm text-(--foreground-subtle)'>
              {data.achievements.filter((row) => row.id).length} /{' '}
              {data.achievements.length} 已获得
            </p>
          )}
        </div>
        <p className='mt-2 text-sm text-(--foreground-subtle)'>
          每一场论战，都可能留下新的故事。
        </p>
      </header>
      {state?.error && (
        <div
          role='status'
          className='flex items-center gap-3 text-sm text-(--foreground-subtle)'
        >
          {state.error}
          <Button variant='secondary' size='sm' onClick={state.refresh}>
            重试
          </Button>
        </div>
      )}
      {!data && !state?.error && <PageLoading variant='list' />}
      {data && tiers.map((tier) => {
        const rows = data.achievements.filter((row) => row.tier === tier)
        return (
          <section
            key={tier}
            aria-labelledby={`tier-${tier}`}
            className='space-y-4'
          >
            <div className='flex items-baseline gap-3 border-b border-(--border) pb-3'>
              <h2
                id={`tier-${tier}`}
                className='text-lg font-semibold'
                style={{ color: tierColors[tier] }}
              >
                {tier}级成就
              </h2>
              <span className='text-xs text-(--foreground-muted)'>
                {rows.filter((row) => row.id).length} / {rows.length}
              </span>
            </div>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-3'>
              {rows.map((row) => <AchievementTile key={row.slot} row={row} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function AchievementTile({ row }: { row: AchievementDTO }) {
  return (
    <article
      id={row.id ?? undefined}
      className='scroll-mt-20 rounded-xl border border-(--border) bg-white/2 p-4 target:outline-2 target:outline-(--accent)'
    >
      {row.id
        ? (
          <>
            <img
              src={`/achievements/${row.id}.webp`}
              alt=''
              width={112}
              height={112}
              className='mb-4 aspect-square w-24 rounded-lg sm:w-28'
              loading='lazy'
            />
            <h3 className='text-base font-semibold text-(--foreground)'>
              {row.title}
            </h3>
            <p className='mt-2 text-sm leading-relaxed text-(--foreground-subtle)'>
              {row.description}
            </p>
            {row.flavor && (
              <p className='mt-3 text-xs leading-relaxed text-(--foreground-muted)'>
                “{row.flavor}”
              </p>
            )}
            <p className='mt-4 text-xs text-(--foreground-muted)'>
              {row.earnedAt != null &&
                new Date(row.earnedAt * 1000).toLocaleDateString('zh-CN')} 获得
            </p>
            {row.matchID != null && (
              <Link
                to={`/matches/${row.matchID}`}
                className='mt-2 inline-block text-xs text-(--accent) underline underline-offset-4'
              >
                查看触发对局
              </Link>
            )}
          </>
        )
        : (
          <>
            <div
              role='img'
              aria-label='未获得的成就'
              className='mb-4 flex aspect-square w-24 items-center justify-center rounded-lg border border-(--border) bg-white/3 text-5xl font-light text-(--foreground-muted) sm:w-28'
            >
              ?
            </div>
            <h3 className='text-sm font-medium text-(--foreground-muted)'>
              未获得
            </h3>
          </>
        )}
    </article>
  )
}
