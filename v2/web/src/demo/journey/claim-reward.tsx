import { Check, Coins } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { useSound } from '../../context/sound'

type Receipt = {
  claimed: boolean
  balance: number
  amount: number
  newlyClaimed: boolean
}
export function ClaimReward() {
  const { matchId } = useParams()
  const { prepareReward, playReward } = useSound()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    void fetch(`/v1/demo/rewards/${matchId}`).then((r) => r.json()).then(
      (value) => {
        if (active.current) setReceipt(value)
      },
    ).catch(() => {
      if (active.current) setError('奖励加载失败，请刷新重试。')
    })
    return () => {
      active.current = false
    }
  }, [matchId])
  async function claim() {
    if (lock.current || receipt?.claimed) return
    lock.current = true
    setBusy(true)
    setError('')
    void prepareReward()
    try {
      const response = await fetch(`/v1/demo/rewards/${matchId}`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('领取失败，请重试。')
      const next = await response.json() as Receipt
      if (!active.current) return
      setReceipt(next)
      if (next.newlyClaimed) playReward('cashout-b', `journey-claim:${matchId}`)
    } catch (cause) {
      if (active.current) {
        setError(cause instanceof Error ? cause.message : '领取失败，请重试。')
      }
    } finally {
      lock.current = false
      if (active.current) setBusy(false)
    }
  }
  return (
    <section
      aria-label='胜利奖励'
      className='flex flex-wrap items-center justify-between gap-4 border-t border-(--border-soft) pt-4'
    >
      <div>
        <p className='flex items-center gap-2 text-sm font-semibold'>
          <Coins size={17} className='text-(--warning)' />胜利奖励 +120 积分
        </p>
        <p className='mt-1 text-xs text-(--foreground-subtle)' role='status'>
          {receipt?.claimed
            ? '奖励已到账 · '
            : ''}积分余额：<output aria-label='积分余额'>
            {receipt?.balance.toLocaleString('en-US') ?? '…'}
          </output>
        </p>
        {error && (
          <p role='alert' className='mt-1 text-xs text-(--accent)'>{error}</p>
        )}
      </div>
      <Button
        disabled={busy || !receipt || receipt.claimed}
        onClick={() => void claim()}
      >
        {receipt?.claimed
          ? (
            <>
              <Check size={16} className='mr-2' />已领取
            </>
          )
          : busy
          ? '领取中…'
          : '领取奖励'}
      </Button>
    </section>
  )
}
