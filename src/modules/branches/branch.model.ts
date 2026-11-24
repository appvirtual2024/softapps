import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

export type Branch = Tables<'branches'>
export type CreateBranchInput = Pick<TablesInsert<'branches'>, 'name' | 'address'>
