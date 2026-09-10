import { Check, Coins, Play, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../components/ui/button'
import { useSound } from '../context/sound'
import { rewardSound, type RewardSoundID } from '../lib/reward-sounds'

export function RewardDemo({ disabled = false }: { disabled?: boolean }) {
  const { prepareReward, playReward, stop, preferences } = useSound()
  const candidate: RewardSoundID = 'cashout-b'
  const [status, setStatus] = useState<
    'available' | 'requesting' | 'counting' | 'claimed'
  >('available')
  const [credited, setCredited] = useState(0)
  const [notice, setNotice] = useState('')
  const [auditioning, setAuditioning] = useState<RewardSoundID | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const auditionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const epoch = useRef(0)
  const claimLock = useRef(false)
  const mounted = useRef(true)
  const claiming = status === 'requesting' || status === 'counting'
  const spec = rewardSound(candidate)
  const clearAudition = () => {
    if (auditionTimer.current) clearTimeout(auditionTimer.current)
    auditionTimer.current = null
    setAuditioning(null)
  }
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      epoch.current++
      timers.current.forEach(clearTimeout)
      if (auditionTimer.current) clearTimeout(auditionTimer.current)
      stop()
    }
  }, [stop])
  useEffect(() => {
    if (disabled) {
      epoch.current++
      clearAudition()
      stop()
    }
  }, [disabled, stop])

  const audition = async (id: RewardSoundID) => {
    if (disabled || claimLock.current && status !== 'claimed') return
    clearAudition()
    stop()
    const token = ++epoch.current
    const ready = await prepareReward(id)
    if (!mounted.current || token !== epoch.current) return
    if (!ready || !playReward(id, crypto.randomUUID())) {
      setNotice(
        !ready
          ? '音效暂未加载，请点击试听重试。'
          : '请开启音效并调高音量后，再点击试听。',
      )
      return
    }
    setAuditioning(id)
    setNotice(`正在试听：${rewardSound(id).name}`)
    auditionTimer.current = setTimeout(() => {
      setAuditioning(null)
      setNotice(`${rewardSound(id).name} · 试听结束，积分未变动`)
    }, rewardSound(id).duration * 1000)
  }

  const claim = () => {
    if (disabled || claimLock.current || status !== 'available') return
    claimLock.current = true
    clearAudition()
    stop()
    epoch.current++
    void prepareReward(candidate)
    setStatus('requesting')
    setNotice('')
    // Demo confirmation only. A real integration must await the claim API's
    // authoritative success and amount before this point.
    timers.current.push(setTimeout(() => {
      setStatus('counting')
      if (
        !playReward(candidate, `claim:${crypto.randomUUID()}`) &&
        preferences.enabled && preferences.volume > 0
      ) {
        setNotice('积分正常到账；音效暂未加载，可点击试听重试。')
      }
      spec.times.forEach((at, index) => {
        timers.current.push(setTimeout(() => {
          setCredited(Math.round(120 * (index + 1) / (spec.times.length + 1)))
        }, at * 1000))
      })
      timers.current.push(setTimeout(() => {
        setCredited(120)
        setStatus('claimed')
      }, spec.finalAt * 1000))
    }, 180))
  }

  const reset = () => {
    if (claiming) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    clearAudition()
    stop()
    epoch.current++
    claimLock.current = false
    setCredited(0)
    setStatus('available')
    setNotice('演示已重置，可以再次领取。')
  }

  return (
    <section
      aria-label='领取奖励音效'
      className='mb-8 space-y-5 rounded-[10px] border border-(--border-soft) bg-(--surface) p-5'
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold'>领取奖励 · 已选 B</h2>
          <p className='mt-2 text-sm leading-6 text-(--foreground-subtle)'>
            原速 · 收高频。保留提现时短促的硬币碰响。
          </p>
        </div>
        <span className='rounded border border-(--border-soft) px-2 py-1 text-xs text-(--foreground-subtle)'>
          基础音效已确认：清透轻点
        </span>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--border-soft) px-4 py-3'>
        <div>
          <p className='text-sm font-medium'>B · {spec.name}</p>
          <p className='mt-1 text-xs leading-5 text-(--foreground-muted)'>
            {spec.description}
          </p>
        </div>
        <Button
          variant='secondary'
          disabled={claiming || disabled}
          aria-label='试听提现音效'
          onClick={() => void audition(candidate)}
        >
          <Play size={16} className='mr-2' />
          {auditioning ? '重新试听' : '试听'}
        </Button>
      </div>

      <div className='rounded-lg border border-(--border-soft) bg-(--background) p-5'>
        <div className='flex flex-wrap items-center justify-between gap-5'>
          <div>
            <p className='flex items-center gap-2 text-sm font-medium'>
              <Trophy size={18} className='text-(--warning)' />你赢下了这场游戏
            </p>
            <p className='mt-2 text-xs text-(--foreground-muted)'>
              模拟胜利奖励{' '}
              <span className='ml-2 text-(--foreground)'>+120 积分</span>
            </p>
          </div>
          <div className='text-right'>
            <p className='text-xs text-(--foreground-muted)'>演示积分余额</p>
            <p className='mt-1 flex items-center justify-end gap-2 text-[30px] font-semibold tabular-nums'>
              <Coins size={22} className='text-(--warning)' />
              <output aria-label='演示积分余额'>
                {(1000 + credited).toLocaleString('en-US')}
              </output>
            </p>
          </div>
        </div>
        <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-(--border-soft) pt-4'>
          <div role='status' className='text-sm text-(--foreground-subtle)'>
            {status === 'claimed'
              ? (
                <span className='inline-flex items-center gap-2'>
                  <Check size={16} className='text-(--success)' />+120
                  积分已到账
                </span>
              )
              : status === 'counting'
              ? `积分到账中 +${credited}`
              : status === 'requesting'
              ? '正在领取…'
              : `已选音效：${spec.name}`}
          </div>
          <div className='flex flex-wrap gap-2'>
            {status === 'claimed' && (
              <Button variant='secondary' disabled={disabled} onClick={reset}>
                <RotateCcw size={14} className='mr-2' />重置再听
              </Button>
            )}
            <Button
              disabled={status !== 'available' || disabled}
              onClick={claim}
            >
              <Coins size={16} className='mr-2' />
              {status === 'claimed'
                ? '已领取'
                : claiming
                ? '领取中…'
                : '领取奖励'}
            </Button>
          </div>
        </div>
      </div>
      <p role='status' className='text-xs leading-6 text-(--foreground-muted)'>
        {!preferences.enabled ? '音效已关闭，领取演示仍可进行。' : notice ||
          '模拟奖励，可重置反复试听。试听不加分，同一次胜利只能领取一次。'}
      </p>
    </section>
  )
}
