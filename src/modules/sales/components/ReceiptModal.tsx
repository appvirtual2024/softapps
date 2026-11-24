import type { Ticket, TicketItem } from '../sales.service'

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function ReceiptModal({ ticket, items, onClose }: { ticket: Ticket; items: TicketItem[]; onClose: () => void }) {
  const balance = Number(ticket.total) - Number(ticket.paid_amount)
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
    <section role="dialog" aria-modal="true" className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b px-5 py-4"><h3 className="font-bold">Recibo de Venta</h3><button onClick={onClose} className="text-xl text-slate-500">×</button></header>
      <div className="p-5 text-sm"><div className="text-center"><p className="text-xl font-black text-orange-600">JUGOSOFT</p><p className="text-xs text-slate-500">Control de Negocio de Jugos</p><p className="mt-2 text-xs text-slate-400">Ticket: TKT-{ticket.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-slate-400">Fecha: {new Date(ticket.sale_date).toLocaleString('es-CO')}</p></div>
        <div className="my-4 border-y border-dashed py-3"><p className="flex justify-between">Cliente: <strong>{ticket.client_name}</strong></p><p className="flex justify-between">Estado: <strong className={ticket.status === 'pagado' ? 'text-emerald-600' : 'text-orange-600'}>{ticket.status.toUpperCase()}</strong></p></div>
        <div className="space-y-3"><div className="flex justify-between font-bold text-slate-400"><span>CANT / PROD</span><span>SUBTOTAL</span></div>{items.map((item) => <div key={item.id} className="flex justify-between gap-3"><div><p className="font-semibold">{item.qty}x {item.name}</p><p className="text-xs text-slate-400">PU: {money.format(Number(item.price))}</p></div><strong>{money.format(Number(item.qty) * Number(item.price))}</strong></div>)}</div>
        <div className="mt-4 border-t-2 border-slate-800 pt-3"><p className="flex justify-between text-base font-black"><span>TOTAL:</span><span className="text-orange-600">{money.format(Number(ticket.total))}</span></p>{Number(ticket.paid_amount)>0&&<p className="mt-2 flex justify-between text-blue-600"><span>Abonado:</span><strong>{money.format(Number(ticket.paid_amount))}</strong></p>}{balance>0&&<p className="flex justify-between text-rose-600"><span>Saldo pendiente:</span><strong>{money.format(balance)}</strong></p>}</div><p className="mt-6 text-center text-xs text-slate-400">¡Gracias por su compra!</p></div>
      <footer className="border-t p-4"><button onClick={()=>window.print()} className="w-full rounded-lg bg-slate-900 py-3 font-bold text-white">▣ Imprimir Recibo</button></footer>
    </section>
  </div>
}
