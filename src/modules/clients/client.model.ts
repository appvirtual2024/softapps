import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

export type Client = Tables<'clients'>
export type ClientInput = Pick<TablesInsert<'clients'>, 'name' | 'id_type' | 'id_number' | 'phone' | 'email' | 'address'>
