import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { ApiError, rewards } from '../api/client'
import type { ClaimRewardResponse, RewardsResponse } from '../api/types'
import { REWARDS_CHANGED } from '../lib/reward-events'

interface RewardsState {
  wallet: RewardsResponse | null
  error: string | null
  loading: boolean
  refresh: () => void
  applyClaim: (claim: ClaimRewardResponse) => void
}

const RewardsContext = createContext<RewardsState | null>(null)

// Mounted with key=account.id so in-flight reads and balances cannot cross users.
export function RewardsProvider({ children }: PropsWithChildren) {
  const [wallet, setWallet] = useState<RewardsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const generation = useRef(0)
  const applyClaim = useCallback((claim: ClaimRewardResponse) => {
    generation.current++
    setWallet((value) =>
      value == null ? null : {
        ...value,
        balance: claim.balance,
        claimableRewards: value.claimableRewards.filter((reward) =>
          reward.matchID !== claim.matchID
        ),
      }
    )
    setError(null)
    setLoading(false)
  }, [])
  const refresh = useCallback(() => {
    const current = ++generation.current
    setLoading(true)
    void rewards.get().then((value) => {
      if (current !== generation.current) return
      setWallet(value)
      setError(null)
    }).catch((cause: unknown) => {
      if (current !== generation.current) return
      setError(
        cause instanceof ApiError && [404, 405].includes(cause.status)
          ? '积分功能暂未开放'
          : '积分更新失败，请重试',
      )
    }).finally(() => {
      if (current === generation.current) setLoading(false)
    })
  }, [])

  useEffect(() => {
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    // Picks up another tab's claims, completed runs and the daily grant.
    const timer = globalThis.setInterval(onVisible, 60_000)
    globalThis.addEventListener(REWARDS_CHANGED, refresh)
    globalThis.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      generation.current++
      globalThis.clearInterval(timer)
      globalThis.removeEventListener(REWARDS_CHANGED, refresh)
      globalThis.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return (
    <RewardsContext.Provider
      value={{ wallet, error, loading, refresh, applyClaim }}
    >
      {children}
    </RewardsContext.Provider>
  )
}

export function useRewards() {
  return useContext(RewardsContext)
}

export function useInsufficientPoints(battles = 1) {
  const state = useRewards()
  return state?.wallet != null && !state.error &&
    state.wallet.balance < state.wallet.battleCost * battles
}
