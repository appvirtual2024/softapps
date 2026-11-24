import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { AuthSession } from '@/modules/auth/auth.model'

interface SessionContextValue {
  session: AuthSession | null
  loading: boolean
  refresh: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useAuth()
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider')
  return context
}
