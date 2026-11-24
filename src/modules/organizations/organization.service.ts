import { supabase } from '@/lib/supabase/client'
import type { TablesInsert } from '@/lib/supabase/database.types'

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const organizationService = {
  /**
   * Crea la organización. El trigger `handle_new_organization` en la base de datos
   * inserta automáticamente al usuario actual como admin en `organization_members`
   * — por eso esto solo funciona con un usuario ya autenticado (auth.uid() no nulo).
   */
  async create(name: string): Promise<void> {
    const payload: TablesInsert<'organizations'> = { name, slug: slugify(name) }
    // No pedimos RETURNING: la política SELECT solo expone la organización cuando
    // el trigger ya creó la membresía del usuario. Después de insertar, el caller
    // recarga la sesión y obtiene esa membresía.
    const { error } = await supabase.from('organizations').insert(payload)
    if (error) throw error
  },
}
