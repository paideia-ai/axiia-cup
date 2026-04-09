import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

const STORAGE_KEY = 'axiia-impersonation'

type ImpersonationState = {
  userId: number
  displayName: string
} | null

type ImpersonationContextValue = {
  impersonation: ImpersonationState
  startImpersonation: (userId: number, displayName: string) => void
  stopImpersonation: () => void
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(
  null,
)

let currentAsUserId: number | null = null

export function getCurrentAsUserId(): number | null {
  return currentAsUserId
}

function readStoredImpersonation(): ImpersonationState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      userId?: unknown
      displayName?: unknown
    }
    if (
      typeof parsed.userId === 'number' &&
      Number.isInteger(parsed.userId) &&
      parsed.userId > 0 &&
      typeof parsed.displayName === 'string'
    ) {
      return { userId: parsed.userId, displayName: parsed.displayName }
    }
  } catch {
    // ignore parse errors
  }
  return null
}

export function ImpersonationProvider({ children }: PropsWithChildren) {
  const [impersonation, setImpersonation] = useState<ImpersonationState>(() =>
    readStoredImpersonation(),
  )

  useEffect(() => {
    currentAsUserId = impersonation?.userId ?? null
    if (impersonation) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(impersonation))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [impersonation])

  const startImpersonation = useCallback(
    (userId: number, displayName: string) => {
      setImpersonation({ userId, displayName })
    },
    [],
  )

  const stopImpersonation = useCallback(() => {
    setImpersonation(null)
  }, [])

  const value = useMemo<ImpersonationContextValue>(
    () => ({ impersonation, startImpersonation, stopImpersonation }),
    [impersonation, startImpersonation, stopImpersonation],
  )

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (!context) {
    throw new Error(
      'useImpersonation must be used within ImpersonationProvider',
    )
  }
  return context
}
