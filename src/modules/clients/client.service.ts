import { supabase } from '@/lib/supabase/client'
import type { Client, ClientInput } from './client.model'

export const clientService = {
  async list(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').eq('organization_id', organizationId).order('name')
    if (error) throw error
    return data
  },
  async create(organizationId: string, input: ClientInput): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert({ organization_id: organizationId, ...input }).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, input: ClientInput): Promise<Client> {
    const { data, error } = await supabase.from('clients').update(input).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}
