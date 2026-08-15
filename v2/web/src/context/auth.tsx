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
import type {
  AccountDTO,
  LoginRequest,
  MeResponse,
  SignupRequest,
  UpdateProfileRequest,
} from '../api/types'

interface AuthContextValue {
  isLoading: boolean
  account: AccountDTO | null
  elevated: boolean
  // A3/#12：是否完成过自己发起的对局（服务端推导）。老服务器缺席该字段 →
  // false，快速通道照常可进。
  firstBattleDone: boolean
  login: (input: LoginRequest) => Promise<void>
  // 注册返回整个 me：注册页要按 firstBattleDone 决定落点（/express）。
  signup: (input: SignupRequest) => Promise<MeResponse>
  logout: () => Promise<void>
  elevate: (code: string) => Promise<void>
  // 账户自助：改昵称答完整 me，成功即覆盖本地账户态（同 elevate 的姿势）。
  // 改密码不改账户态，settings 页直接调 api client，不经过这里。
  updateProfile: (input: UpdateProfileRequest) => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [account, setAccount] = useState<AccountDTO | null>(null)
  const [elevated, setElevated] = useState(false)
  const [firstBattleDone, setFirstBattleDone] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await auth.me()
      setAccount(me.account)
      setElevated(me.elevated)
      setFirstBattleDone(me.firstBattleDone === true)
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        setAccount(null)
        setElevated(false)
        setFirstBattleDone(false)
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
      firstBattleDone,
      login: async (input) => {
        const me = await auth.login(input)
        setAccount(me.account)
        setElevated(me.elevated)
        setFirstBattleDone(me.firstBattleDone === true)
      },
      signup: async (input) => {
        const me = await auth.signup(input)
        setAccount(me.account)
        setElevated(me.elevated)
        setFirstBattleDone(me.firstBattleDone === true)
        return me
      },
      logout: async () => {
        await auth.logout()
        setAccount(null)
        setElevated(false)
        setFirstBattleDone(false)
      },
      elevate: async (code) => {
        const me = await auth.elevate({ code })
        setAccount(me.account)
        setElevated(me.elevated)
        setFirstBattleDone(me.firstBattleDone === true)
      },
      updateProfile: async (input) => {
        const me = await auth.updateProfile(input)
        setAccount(me.account)
        setElevated(me.elevated)
        setFirstBattleDone(me.firstBattleDone === true)
      },
      refresh,
    }),
    [isLoading, account, elevated, firstBattleDone, refresh],
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

// 可选形态：Provider 之外（stories/独立挂载）返回 null 而非抛错——供只把
// auth 当增强（如战报完局后刷新 firstBattleDone）的页面使用。
export function useOptionalAuth() {
  return useContext(AuthContext)
}
