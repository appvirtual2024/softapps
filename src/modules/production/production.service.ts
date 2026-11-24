import { supabase } from '@/lib/supabase/client'
import type { BaseBatch, CreateBaseBatchInput } from './production.model'
import type { Tables } from '@/lib/supabase/database.types'
import type { CreateFlavorInput } from '@/modules/catalog/catalog.model'

export type ProductionMaterial = { item: Tables<'inventory_items'>; qty: number }
export type FinishedLot = Tables<'finished_lots'>

export const productionService = {
  async listBatches(organizationId: string, branchId: string): Promise<BaseBatch[]> {
    const { data, error } = await supabase
      .from('base_batches')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createBatch(
    organizationId: string,
    branchId: string,
    memberId: string,
    input: CreateBaseBatchInput,
  ): Promise<BaseBatch> {
    const { data, error } = await supabase
      .from('base_batches')
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        created_by: memberId,
        juice_type: input.juice_type,
        flavor_id: input.flavor_id,
        raw_cost: input.raw_cost,
        is_packed: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listMaterials(organizationId: string, branchId: string) {
    const { data, error } = await supabase.from('inventory_items').select('*').eq('organization_id', organizationId).eq('branch_id', branchId).eq('category', 'materia_prima').order('name')
    if (error) throw error
    return data
  },

  async listFinishedLots(organizationId: string, branchId: string): Promise<FinishedLot[]> {
    const { data, error } = await supabase.from('finished_lots').select('*').eq('organization_id', organizationId).eq('branch_id', branchId).order('packed_at', { ascending: false })
    if (error) throw error
    return data
  },

  async addFlavor(organizationId: string, input: CreateFlavorInput) {
    const { data, error } = await supabase.from('flavors').insert({ organization_id: organizationId, ...input }).select().single()
    if (error) throw error
    return data
  },

  async deletePendingBatch(batchId: string) {
    const { error: materialsError } = await supabase.from('batch_materials').delete().eq('batch_id', batchId)
    if (materialsError) throw materialsError
    const { error } = await supabase.from('base_batches').delete().eq('id', batchId).eq('is_packed', false)
    if (error) throw error
  },

  async recordWaste(lot: FinishedLot, qty: number, reason: string) {
    if (qty <= 0 || qty > Number(lot.current_qty)) throw new Error('La cantidad debe ser mayor a cero y no superar las existencias del lote.')
    const nextQty = Number(lot.current_qty) - qty
    const { error } = await supabase.from('finished_lots').update({ current_qty: nextQty, waste_qty: Number(lot.waste_qty) + qty, waste_cost: Number(lot.waste_cost) + qty * Number(lot.unit_cost), waste_reason: reason }).eq('id', lot.id).gte('current_qty', qty)
    if (error) throw error
  },

  async prepareBatch(organizationId: string, branchId: string, memberId: string, flavorId: string, flavorName: string, materials: ProductionMaterial[]) {
    const total = materials.reduce((sum, row) => sum + Number(row.item.cost) * row.qty, 0)
    const { data: batch, error } = await supabase.from('base_batches').insert({ organization_id: organizationId, branch_id: branchId, created_by: memberId, flavor_id: flavorId, juice_type: flavorName, raw_cost: total, is_packed: false }).select().single()
    if (error) throw error
    const rows = materials.map(({ item, qty }) => ({ batch_id: batch.id, inventory_item_id: item.id, name: item.name, qty, cost: Number(item.cost) * qty }))
    const { error: materialError } = await supabase.from('batch_materials').insert(rows)
    if (materialError) { await supabase.from('base_batches').delete().eq('id', batch.id); throw materialError }
    for (const { item, qty } of materials) {
      const { data: updatedStock, error: stockError } = await supabase.from('inventory_items').update({ stock: Number(item.stock) - qty }).eq('id', item.id).gte('stock', qty).select('id')
      if (stockError) throw stockError
      if (!updatedStock?.length) throw new Error(`No se descontó ${item.name}: el stock cambió o es insuficiente.`)
    }
    return batch
  },

  async processPacking(batch: BaseBatch, products: Array<{ id: string; name: string; size_oz: number; qty: number }>, packaging: Array<{ id: string; qty: number }>) {
    const totalCups = products.reduce((sum, product) => sum + product.qty, 0)
    if (totalCups <= 0) throw new Error('Ingresa la cantidad producida para cada presentación.')
    const { data: materials } = await supabase.from('batch_materials').select('cost').eq('batch_id', batch.id)
    const cost = (materials ?? []).reduce((sum, row) => sum + Number(row.cost), 0)
    const newLots = products.filter((row) => row.qty > 0).map((product) => ({ organization_id: batch.organization_id, branch_id: batch.branch_id, batch_id: batch.id, product_id: product.id, product_name: product.name, flavor: batch.juice_type, size_oz: product.size_oz, initial_qty: product.qty, current_qty: product.qty, unit_cost: cost / totalCups }))
    const { error: lotError } = await supabase.from('finished_lots').insert(newLots)
    if (lotError) throw lotError
    for (const pack of packaging) {
      if (pack.qty <= 0) continue
      const { data: item, error: readError } = await supabase.from('inventory_items').select('stock,name').eq('id', pack.id).single()
      if (readError) throw readError
      if (Number(item.stock) < pack.qty) throw new Error('No hay suficientes empaques en inventario.')
      const { data: updated, error } = await supabase.from('inventory_items').update({ stock: Number(item.stock) - pack.qty }).eq('id', pack.id).gte('stock', pack.qty).select('id')
      if (error) throw error
      if (!updated?.length) throw new Error(`No se descontó el empaque ${item.name}: stock insuficiente.`)
    }
    const { error } = await supabase.from('base_batches').update({ is_packed: true }).eq('id', batch.id)
    if (error) throw error
  },
}
