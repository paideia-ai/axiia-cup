import { Link } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useRewards } from '../context/rewards'

export function RewardsPage() {
  const state = useRewards()
  const wallet = state?.wallet
  return (
    <div className='max-w-2xl space-y-6' data-spec='U18-C18'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          积分与奖励
        </h1>
        <p className='mt-2 text-sm text-(--foreground-subtle)'>
          每日补充，出战消耗，胜利后亲手领取返还。
        </p>
      </div>
      <div className='flex items-center gap-3'>
        <Button
          variant='secondary'
          disabled={state?.loading}
          onClick={state?.refresh}
        >
          刷新积分
        </Button>
        {state?.error
          ? (
            <p role='alert' className='text-sm text-(--warning)'>
              {state.error}
            </p>
          )
          : null}
        {state?.loading && !wallet ? <p role='status'>正在加载积分…</p> : null}
      </div>
      {wallet
        ? (
          <>
            <Card>
              <CardContent className='space-y-4 pt-5'>
                <div>
                  <p className='text-sm text-(--foreground-subtle)'>
                    {state?.error ? '上次更新余额' : '可用积分'}
                  </p>
                  <p className='mt-1 text-4xl font-black tabular-nums text-(--foreground)'>
                    {wallet.balance.toLocaleString('zh-CN')}
                  </p>
                </div>
                <dl className='grid gap-2 text-sm text-(--foreground-subtle)'>
                  <div className='flex justify-between gap-3'>
                    <dt>每日补充</dt>
                    <dd>{wallet.dailyAllowance} 积分</dd>
                  </div>
                  <div className='flex justify-between gap-3'>
                    <dt>每场消耗</dt>
                    <dd>{wallet.battleCost} 积分</dd>
                  </div>
                  <div className='flex justify-between gap-3'>
                    <dt>NPC 胜利返还</dt>
                    <dd>{wallet.pveWinRefundPercent}%</dd>
                  </div>
                  <div className='flex justify-between gap-3'>
                    <dt>玩家对战胜利返还</dt>
                    <dd>{wallet.pvpWinRefundPercent}%</dd>
                  </div>
                </dl>
                <p className='text-xs leading-relaxed text-(--foreground-subtle)'>
                  北京时间每日 00:00
                  后首次访问补充当日积分，余额保留；未访问日不补发。每日额度按每个在线场景
                  {' '}
                  {wallet.dailyRunsPerScenario}{' '}
                  场计算，可跨场景使用。双场约战消耗两场积分，胜利返还由付费发起人逐场领取。自打不返还胜利积分，运行失败自动退回该场消耗。
                </p>
                <p className='text-xs text-(--foreground-subtle)'>
                  积分仅用于平台对战，不支持购买、转账或提现。原有每日场次与并发上限仍适用。
                </p>
              </CardContent>
            </Card>
            <section className='space-y-3' aria-labelledby='claimable-title'>
              <h2
                id='claimable-title'
                className='font-semibold text-(--foreground)'
              >
                待领取奖励
              </h2>
              {wallet.claimableRewards.length === 0
                ? (
                  <p className='text-sm text-(--foreground-subtle)'>
                    暂无待领取奖励。赢下一场后，来战报领取积分。
                  </p>
                )
                : (
                  <ul className='space-y-2'>
                    {wallet.claimableRewards.map((reward) => (
                      <li
                        key={reward.matchID}
                        className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--border-soft) px-4 py-3 text-sm text-(--foreground)'
                      >
                        <span>
                          对战 #{reward.matchID} · {reward.kind.toUpperCase()}
                          {' '}
                          · +{reward.points} 积分
                        </span>
                        <Link
                          className='text-(--accent) underline underline-offset-2'
                          to={`/matches/${reward.matchID}`}
                        >
                          查看战报并领取
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
            </section>
          </>
        )
        : null}
    </div>
  )
}
