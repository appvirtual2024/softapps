import { supabase } from '@/lib/supabase/client'
import type { Branch, CreateBranchInput } from './branch.model'

export const branchService = {
  async list(organizationId: string): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name')

    if (error) throw error
    return data
  },

  async create(organizationId: string, input: CreateBranchInput): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .insert({ organization_id: organizationId, ...input })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
