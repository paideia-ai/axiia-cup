import { Coins, Gift } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, rewards } from '../api/client'
import type { MatchRewardResponse } from '../api/types'
import { useRewards } from '../context/rewards'
import { refreshRewards } from '../lib/reward-events'
import { playSound, unlockAudio } from '../lib/sound'
import { Button } from './ui/button'

export function PointsIndicator() {
  const state = useRewards()
  if (!state?.wallet) return null
  return (
    <Link
      to='/rewards'
      aria-label={`${state.wallet.balance} 积分，查看积分与奖励`}
      title={state.error ? '上次确认余额，刷新失败' : undefined}
      className='inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-(--foreground-subtle) hover:text-(--foreground)'
      data-spec='U18-C18'
    >
      <Coins aria-hidden className='h-4 w-4' />
      {state.wallet.balance.toLocaleString('zh-CN')}
    </Link>
  )
}

export function BattleCostNotice({ kind = 'pve' }: { kind?: string }) {
  const state = useRewards()
  const wallet = state?.wallet
  if (!wallet) return null
  const paired = kind === 'pvp'
  const cost = wallet.battleCost * (paired ? 2 : 1)
  return (
    <div
      className='mb-3 space-y-1 text-xs text-(--foreground-subtle)'
      data-spec='U18-C24'
    >
      <p>
        {paired ? '双场约战' : '本次对战'}消耗 <strong>{cost} 积分</strong>
        {' · '}
        {state.error ? '余额待更新' : `余额 ${wallet.balance}`}
        {kind === 'hotseat'
          ? ' · 自打无胜利返还'
          : ` · 胜利后可领取${paired ? '各场消耗的' : ''} ${
            paired ? wallet.pvpWinRefundPercent : wallet.pveWinRefundPercent
          }% 返还`}
      </p>
      {!state.error && wallet.balance < cost
        ? (
          <p className='text-(--warning)'>
            积分不足，可领取胜利奖励或等待每日积分。
          </p>
        )
        : null}
      <Link className='underline underline-offset-2' to='/rewards'>
        查看积分与奖励
      </Link>
    </div>
  )
}

// The caller keys this by account + match; no previous match's success can bleed
// into the next route. Eligibility and amount are always returned by the server.
export function RewardClaimCard({ matchID }: { matchID: number }) {
  const walletState = useRewards()
  const [reward, setReward] = useState<MatchRewardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0)
  const inFlight = useRef(false)
  const alive = useRef(true)
  const generation = useRef(0)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    const current = ++generation.current
    void rewards.match(matchID).then((value) => {
      if (current !== generation.current) return
      setReward(value)
      setError(null)
    }).catch((cause: unknown) => {
      if (current !== generation.current) return
      if (cause instanceof ApiError && [403, 404, 405].includes(cause.status)) {
        return
      }
      setError('奖励加载失败，请重试')
    })
    return () => {
      generation.current++
    }
  }, [matchID, nonce])

  const claim = async () => {
    if (inFlight.current || reward?.status !== 'claimable') return
    unlockAudio()
    inFlight.current = true
    setBusy(true)
    setError(null)
    try {
      const result = await rewards.claim(matchID)
      if (!alive.current) return
      walletState?.applyClaim(result)
      refreshRewards()
      setReward({ ...reward, status: 'claimed' })
      if (!result.alreadyClaimed && result.creditedPoints > 0) {
        playSound('reward', `reward:${matchID}`)
      }
    } catch {
      if (alive.current) setError('领取未确认，请重试；同一奖励只会到账一次。')
    } finally {
      inFlight.current = false
      if (alive.current) setBusy(false)
    }
  }

  if (!reward && !error) return null
  if (reward?.status === 'ineligible' || reward?.status === 'pending') {
    return null
  }
  return (
    <section
      aria-label='胜利奖励'
      className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--border) bg-(--surface) px-5 py-4'
      data-spec='U18-C17 U18-C19 U19-C10'
    >
      <div className='space-y-1'>
        <p className='flex items-center gap-2 text-sm font-semibold text-(--foreground)'>
          <Gift aria-hidden className='h-4 w-4 text-(--accent)' />
          胜利奖励{reward ? ` · ${reward.points} 积分` : ''}
        </p>
        <p role='status' className='text-xs text-(--foreground-subtle)'>
          {reward?.status === 'claimed'
            ? `已领取 · +${reward.points} 积分`
            : '点击领取，将胜利化为下一场的机会。'}
        </p>
        {error
          ? <p role='alert' className='text-sm text-(--warning)'>{error}</p>
          : null}
      </div>
      {reward?.status === 'claimable'
        ? (
          <Button onClick={() => void claim()} disabled={busy}>
            {busy ? '领取中…' : '领取奖励'}
          </Button>
        )
        : !reward && error
        ? (
          <Button
            variant='secondary'
            onClick={() => setNonce((value) => value + 1)}
          >
            重试
          </Button>
        )
        : null}
    </section>
  )
}
