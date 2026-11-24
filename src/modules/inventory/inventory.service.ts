import { supabase } from '@/lib/supabase/client'
import type { CreateInventoryItemInput, InventoryItem } from './inventory.model'

export const inventoryService = {
  async list(organizationId: string, branchId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('branch_id', branchId)
      .order('name')

    if (error) throw error
    return data
  },

  async create(organizationId: string, branchId: string, input: CreateInventoryItemInput): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ organization_id: organizationId, branch_id: branchId, ...input })
      .select()
      .single()

    if (error) throw error
    return data
  },
  async update(id: string, input: Pick<CreateInventoryItemInput, 'name' | 'category' | 'cost' | 'size_oz'>): Promise<InventoryItem> {
    const { data, error } = await supabase.from('inventory_items').update(input).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async restock(item: InventoryItem, quantity: number, unitCost: number): Promise<InventoryItem> {
    const { data, error } = await supabase.from('inventory_items').update({ stock: Number(item.stock) + quantity, cost: unitCost }).eq('id', item.id).select().single()
    if (error) throw error
    return data
  },
}
