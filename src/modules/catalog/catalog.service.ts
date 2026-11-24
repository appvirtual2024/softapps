import { supabase } from '@/lib/supabase/client'
import type { CreateFlavorInput, CreateProductInput, Flavor, Product } from './catalog.model'

export const catalogService = {
  async listProducts(organizationId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name')

    if (error) throw error
    return data
  },

  async listFlavors(organizationId: string): Promise<Flavor[]> {
    const { data, error } = await supabase
      .from('flavors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name')

    if (error) throw error
    return data
  },

  async createProduct(organizationId: string, input: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({ organization_id: organizationId, ...input })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createFlavor(organizationId: string, input: CreateFlavorInput): Promise<Flavor> {
    const { data, error } = await supabase
      .from('flavors')
      .insert({ organization_id: organizationId, ...input })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
