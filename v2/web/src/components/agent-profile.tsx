import { tm } from '../testmode/mark'
import { Link } from 'react-router-dom'

export function IdentityVersionCard({
  title,
  href,
  modelID,
  matchCount,
  winCount,
  lossCount,
  context,
}: {
  title: string
  href: string
  modelID?: string
  matchCount: number
  winCount: number
  lossCount?: number
  context?: string
}) {
  const rate = matchCount > 0 ? winCount / matchCount * 100 : null
  const color = rate === null
    ? undefined
    : rate <= 50
    ? `color-mix(in oklab, #e87979, #b8b8b2 ${Math.max(0, rate) * 2}%)`
    : `color-mix(in oklab, #b8b8b2, var(--success) ${
      (Math.min(100, rate) - 50) * 2
    }%)`
  return (
    <Link
      to={href}
      data-testid='identity-version'
      {...tm('EA.public-version-item')}
      aria-label={`${title}，查看对战记录`}
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 transition hover:bg-white/3 focus-visible:outline-2 focus-visible:outline-offset-4 ${
        context ? 'border-(--accent)/50' : 'border-(--border-soft)'
      }`}
    >
      <div className='min-w-0 space-y-1.5'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          <h2 className='text-base font-semibold text-(--foreground)'>
            {title}
          </h2>
          {context && (
            <span className='text-xs text-(--foreground-subtle)'>
              {context}
            </span>
          )}
        </div>
        {modelID && (
          <p className='break-all text-xs text-(--foreground-subtle)'>
            {modelID}
          </p>
        )}
        <p className='text-xs text-(--foreground-subtle)'>
          {matchCount} 场 · {winCount} 胜 · {lossCount ?? '—'} 负
        </p>
      </div>
      <div className='shrink-0 text-right' {...tm('EA.public-record')}>
        <p className='text-xs text-(--foreground-subtle)'>胜率</p>
        <p
          className='mt-1 text-2xl font-semibold tabular-nums'
          style={{ color }}
        >
          {rate === null
            ? '暂无战绩'
            : `${
              new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 })
                .format(rate)
            }%`}
        </p>
      </div>
    </Link>
  )
}
