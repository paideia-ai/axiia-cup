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
import type {
  ClaimRewardResponse,
  RewardQuoteResponse,
  RewardsResponse,
} from '../api/types'
import { REWARDS_CHANGED } from '../lib/reward-events'

interface RewardsState {
  wallet: RewardsResponse | null
  error: string | null
  loading: boolean
  unavailable: boolean
  refresh: () => void
  applyClaim: (claim: ClaimRewardResponse) => void
}

const RewardsContext = createContext<RewardsState | null>(null)

// Mounted with key=account.id so in-flight reads and balances cannot cross users.
export function RewardsProvider({ children }: PropsWithChildren) {
  const [wallet, setWallet] = useState<RewardsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
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
      setUnavailable(false)
    }).catch((cause: unknown) => {
      if (current !== generation.current) return
      const unsupported = cause instanceof ApiError &&
        [404, 405].includes(cause.status)
      setUnavailable(unsupported)
      setError(
        unsupported ? '积分功能暂未开放' : '积分更新失败，请重试',
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
      value={{ wallet, error, loading, unavailable, refresh, applyClaim }}
    >
      {children}
    </RewardsContext.Provider>
  )
}

export function useRewards() {
  return useContext(RewardsContext)
}

export interface BattleQuoteState {
  quote: RewardQuoteResponse | null
  loading: boolean
  error: boolean
  blocked: boolean
  retry: () => void
}

// Costs depend on the payer's recent roles. Never infer a surcharge locally or
// reuse the previous role's quote while an updated request is in flight.
export function useBattleQuote(
  scenarioID: string,
  side: string,
  kind: string,
  enabled = true,
): BattleQuoteState {
  const rewardsState = useRewards()
  const wallet = rewardsState?.wallet
  const awaitingWallet = enabled && rewardsState?.loading === true &&
    wallet == null
  const walletFailure = enabled && wallet == null &&
    rewardsState?.error != null && !rewardsState.unavailable
  const active = enabled && wallet != null && scenarioID !== ''
  const key = `${scenarioID}:${side}:${kind}`
  const [result, setResult] = useState<
    {
      key: string
      wallet: RewardsResponse
      quote: RewardQuoteResponse | null
      error: boolean
    } | null
  >(null)
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    if (!active) return
    let alive = true
    setResult(null)
    void rewards.quote(scenarioID, side, kind).then((quote) => {
      if (alive && wallet) setResult({ key, wallet, quote, error: false })
    }).catch(() => {
      if (alive && wallet) setResult({ key, wallet, quote: null, error: true })
    })
    return () => {
      alive = false
    }
  }, [active, scenarioID, side, kind, key, wallet, nonce])
  const current = result?.key === key && result.wallet === wallet
    ? result
    : null
  const loading = awaitingWallet || (active && current == null)
  const error = walletFailure || (active && current?.error === true)
  const quote = active ? current?.quote ?? null : null
  return {
    quote,
    loading,
    error,
    blocked: awaitingWallet || walletFailure || (active &&
      (loading || error || (quote != null && wallet!.balance < quote.cost))),
    retry: () => {
      if (wallet == null) rewardsState?.refresh()
      else setNonce((value) => value + 1)
    },
  }
}
