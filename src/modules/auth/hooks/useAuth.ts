import { useEffect, useState, useCallback } from 'react'
import { authService } from '../auth.service'
import type { AuthSession } from '../auth.model'

interface UseAuthResult {
  session: AuthSession | null
  loading: boolean
  refresh: () => Promise<void>
}

/** Fuente única de verdad de "quién soy y a qué organización pertenezco". */
export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (userId: string | null, email: string | null) => {
    if (!userId) {
      setSession(null)
      setLoading(false)
      return
    }
    const s = await authService.loadSession(userId, email)
    setSession(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(load)
    return unsubscribe
  }, [load])

  const refresh = useCallback(async () => {
    if (session) await load(session.userId, session.email)
  }, [session, load])

  return { session, loading, refresh }
}
