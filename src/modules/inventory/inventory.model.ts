import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

export type InventoryItem = Tables<'inventory_items'>
export type InventoryCategory = 'materia_prima' | 'empaque'
export type CreateInventoryItemInput = Pick<TablesInsert<'inventory_items'>, 'name' | 'category' | 'stock' | 'cost' | 'size_oz'>
