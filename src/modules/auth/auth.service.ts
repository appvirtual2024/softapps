import { supabase } from '@/lib/supabase/client'
import type { AuthSession } from './auth.model'

/**
 * Todo el acceso a Supabase Auth pasa por aquí. Los componentes de React nunca
 * llaman a `supabase.auth.*` directamente, así si mañana cambia el proveedor
 * de auth, solo se toca este archivo.
 */
export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /** Reenvía la confirmación a una cuenta registrada pero aún no verificada. */
  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /** Carga perfil + membresía activa (primera organización a la que pertenezca el usuario). */
  async loadSession(userId: string, email: string | null): Promise<AuthSession> {
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .limit(1)
        .maybeSingle(),
    ])
    return { userId, email, profile: profile ?? null, membership: membership ?? null }
  },

  onAuthStateChange(callback: (userId: string | null, email: string | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user.id ?? null, session?.user.email ?? null)
    })
    return () => data.subscription.unsubscribe()
  },
}
