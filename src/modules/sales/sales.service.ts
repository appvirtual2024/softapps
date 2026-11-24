import { supabase } from '@/lib/supabase/client'
import type { Client } from '@/modules/clients/client.model'
import type { Tables } from '@/lib/supabase/database.types'

export type SaleLot = Tables<'finished_lots'>
export type CartLine = { lot: SaleLot; qty: number; price: number }
export type Ticket = Tables<'tickets'>
export type TicketItem = Tables<'ticket_items'>

export const salesService = {
  async listAvailableLots(organizationId: string, branchId: string): Promise<SaleLot[]> {
    const { data, error } = await supabase.from('finished_lots').select('*').eq('organization_id', organizationId).eq('branch_id', branchId).gt('current_qty', 0).order('product_name')
    if (error) throw error
    return data
  },
  async listClients(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').eq('organization_id', organizationId).order('name')
    if (error) throw error
    return data
  },
  async listTickets(organizationId: string, branchId: string): Promise<Ticket[]> {
    const { data, error } = await supabase.from('tickets').select('*').eq('organization_id', organizationId).eq('branch_id', branchId).order('sale_date', { ascending: false })
    if (error) throw error
    return data
  },
  async getTicketItems(ticketId: string): Promise<TicketItem[]> {
    const { data, error } = await supabase.from('ticket_items').select('*').eq('ticket_id', ticketId)
    if (error) throw error
    return data
  },
  async registerPayment(ticket: Ticket, memberId: string, amount: number, method: 'efectivo'|'transferencia'|'mixto', cash: number, transfer: number) {
    const balance = Number(ticket.total) - Number(ticket.paid_amount)
    if (amount <= 0 || amount > balance || Math.abs(cash + transfer - amount) > 0.01) throw new Error('Revisa el monto y la distribución del pago.')
    const { error: paymentError } = await supabase.from('ticket_payments').insert({ ticket_id: ticket.id, amount, method, cash_amount: cash, transfer_amount: transfer, received_by: memberId })
    if (paymentError) throw paymentError
    const paid = Number(ticket.paid_amount) + amount
    const { error } = await supabase.from('tickets').update({ paid_amount: paid, status: paid >= Number(ticket.total) ? 'pagado' : 'pendiente', payment_method: method, cash_amount: cash, transfer_amount: transfer }).eq('id', ticket.id)
    if (error) throw error
  },
  async createTicket(organizationId: string, branchId: string, memberId: string, client: Client | null, lines: CartLine[], paid: boolean) {
    const total = lines.reduce((sum, line) => sum + line.qty * line.price, 0)
    const { data: ticket, error } = await supabase.from('tickets').insert({ organization_id: organizationId, branch_id: branchId, created_by: memberId, client_id: client?.id ?? null, client_name: client?.name ?? 'Mostrador', total, paid_amount: paid ? total : 0, status: paid ? 'pagado' : 'pendiente', payment_method: paid ? 'efectivo' : null, cash_amount: paid ? total : 0, transfer_amount: 0 }).select().single()
    if (error) throw error
    const ticketItems = lines.map(({ lot, qty, price }) => ({ ticket_id: ticket.id, product_id: lot.product_id, finished_lot_id: lot.id, name: `${lot.flavor} ${lot.size_oz}oz`, qty, price }))
    const { error: linesError } = await supabase.from('ticket_items').insert(ticketItems)
    if (linesError) throw linesError
    for (const { lot, qty } of lines) {
      const { data: updated, error: stockError } = await supabase.from('finished_lots').update({ current_qty: Number(lot.current_qty) - qty }).eq('id', lot.id).gte('current_qty', qty).select('id')
      if (stockError) throw stockError
      if (!updated?.length) throw new Error(`Stock insuficiente para ${lot.product_name} ${lot.size_oz}oz.`)
    }
    if (paid) {
      const { error: paymentError } = await supabase.from('ticket_payments').insert({ ticket_id: ticket.id, amount: total, method: 'efectivo', cash_amount: total, transfer_amount: 0, received_by: memberId })
      if (paymentError) throw paymentError
    }
    return ticket
  },
}
