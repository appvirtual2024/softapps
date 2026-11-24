import type { Tables, TablesInsert } from '@/lib/supabase/database.types'

export type Product = Tables<'products'>
export type Flavor = Tables<'flavors'>

export type CreateProductInput = Pick<TablesInsert<'products'>, 'name' | 'price' | 'size_oz' | 'category'>
export type CreateFlavorInput = Pick<TablesInsert<'flavors'>, 'name'>
