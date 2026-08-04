import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { ApiError, auth } from '../api/client'
import type { AccountDTO, LoginRequest, SignupRequest } from '../api/types'

interface AuthContextValue {
  isLoading: boolean
  account: AccountDTO | null
  elevated: boolean
  login: (input: LoginRequest) => Promise<void>
  signup: (input: SignupRequest) => Promise<void>
  logout: () => Promise<void>
  elevate: (code: string) => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [account, setAccount] = useState<AccountDTO | null>(null)
  const [elevated, setElevated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await auth.me()
      setAccount(me.account)
      setElevated(me.elevated)
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        setAccount(null)
        setElevated(false)
      } else {
        throw error
      }
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await refresh().catch(() => {})
      setIsLoading(false)
    })()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      account,
      elevated,
      login: async (input) => {
        const me = await auth.login(input)
        setAccount(me.account)
        setElevated(me.elevated)
      },
      signup: async (input) => {
        const me = await auth.signup(input)
        setAccount(me.account)
        setElevated(me.elevated)
      },
      logout: async () => {
        await auth.logout()
        setAccount(null)
        setElevated(false)
      },
      elevate: async (code) => {
        const me = await auth.elevate({ code })
        setAccount(me.account)
        setElevated(me.elevated)
      },
      refresh,
    }),
    [isLoading, account, elevated, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
