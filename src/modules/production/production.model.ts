import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

export type BaseBatch = Tables<'base_batches'>
export type CreateBaseBatchInput = Pick<TablesInsert<'base_batches'>, 'juice_type' | 'flavor_id' | 'raw_cost'>
