import type { Tables } from '@/lib/supabase/database.types'

export type Profile = Tables<'profiles'>
export type OrganizationMember = Tables<'organization_members'>

export type Role = 'admin' | 'cajero' | 'produccion'

/** Sesión de negocio: usuario autenticado + su membresía activa en la organización actual. */
export interface AuthSession {
  userId: string
  email: string | null
  profile: Profile | null
  /** null mientras el usuario no pertenece a ninguna organización todavía */
  membership: OrganizationMember | null
}
