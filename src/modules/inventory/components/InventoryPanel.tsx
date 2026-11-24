import { useEffect, useState, type FormEvent } from 'react'
import type { InventoryCategory, InventoryItem } from '../inventory.model'
import { inventoryService } from '../inventory.service'

interface Props {
  organizationId: string
  branchId: string
  branchName: string
  canManage: boolean
}

function messageFor(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'No se pudo actualizar el inventario.'
}

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function InventoryPanel({ organizationId, branchId, branchName, canManage }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState<InventoryCategory>('materia_prima')
  const [stock, setStock] = useState('')
  const [cost, setCost] = useState('')
  const [sizeOz, setSizeOz] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [restocking, setRestocking] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [restockCost, setRestockCost] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    void inventoryService
      .list(organizationId, branchId)
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => {
        if (active) setError(messageFor(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [organizationId, branchId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const item = await inventoryService.create(organizationId, branchId, {
        name,
        category,
        stock: Number(stock),
        cost: Number(cost),
        size_oz: sizeOz ? Number(sizeOz) : null,
      })
      setItems((current) => [...current, item].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setStock('')
      setCost('')
      setSizeOz('')
      setNotice(`Insumo ${item.name} guardado correctamente.`)
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700">Operación · {branchName}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink-950">Inventario</h2>
          <p className="mt-1 text-sm text-slate-600">Materias primas y empaques disponibles para esta sede.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{items.length} ítems</span>
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">Cargando inventario...</p> : (
        <>
          {items.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Todavía no hay materiales registrados en esta sucursal.</p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3 font-semibold">Ítem</th><th className="px-4 py-3 font-semibold">Categoría</th><th className="px-4 py-3 text-right font-semibold">Stock actual</th><th className="px-4 py-3 text-right font-semibold">Costo unit.</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acción</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id}><td className="px-4 py-3 font-semibold text-slate-800">{item.name}{item.size_oz && <span className="ml-2 font-normal text-slate-400">({item.size_oz}oz)</span>}</td><td className="px-4 py-3 capitalize text-slate-600">{item.category.replace('_', ' ')}</td><td className="px-4 py-3 text-right font-bold text-slate-800">{item.stock} {item.category==='empaque'?'und':'kg'}</td><td className="px-4 py-3 text-right text-slate-600">{money.format(Number(item.cost))}</td><td className="px-4 py-3"><span className={`rounded-md border px-2 py-1 text-xs font-semibold ${Number(item.stock)<=5?'border-orange-200 bg-orange-50 text-orange-700':'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{Number(item.stock)<=5?'Poco Stock':'Óptimo'}</span></td><td className="px-4 py-3 text-right"><button onClick={()=>{setEditing(item);setName(item.name);setCategory(item.category as InventoryCategory);setCost(String(item.cost));setSizeOz(String(item.size_oz??''))}} className="mr-2 rounded border px-2 py-1 text-xs">Editar</button><button onClick={()=>{setRestocking(item);setRestockCost(String(item.cost));setRestockQty('')}} className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">Abastecer</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {canManage && (
            <form onSubmit={handleSubmit} className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
              <input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del material" required />
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={category} onChange={(event) => setCategory(event.target.value as InventoryCategory)}><option value="materia_prima">Materia prima</option><option value="empaque">Empaque</option></select>
              <input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" step="0.01" placeholder="Existencia inicial" required />
              <input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={cost} onChange={(event) => setCost(event.target.value)} type="number" min="0" step="1" placeholder="Costo unitario COP" required />
              <input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={sizeOz} onChange={(event) => setSizeOz(event.target.value)} type="number" min="0" step="0.5" placeholder="Onzas (opcional)" />
              <button className="rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60" type="submit" disabled={busy}>{busy ? 'Guardando...' : 'Agregar material'}</button>
            </form>
          )}
        </>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✓ {notice}</p>}
      {editing&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl" onSubmit={async(e)=>{e.preventDefault();setBusy(true);try{const saved=await inventoryService.update(editing.id,{name,category,cost:Number(cost),size_oz:sizeOz?Number(sizeOz):null});setItems((all)=>all.map((x)=>x.id===saved.id?saved:x));setNotice(`Insumo ${saved.name} actualizado.`);setEditing(null)}catch(err){setError(messageFor(err))}finally{setBusy(false)}}}><div className="flex justify-between font-bold"><span>Editar Insumo: {editing.name}</span><button type="button" onClick={()=>setEditing(null)}>×</button></div><input className="w-full rounded border p-2" value={name} onChange={(e)=>setName(e.target.value)} required/><select className="w-full rounded border p-2" value={category} onChange={(e)=>setCategory(e.target.value as InventoryCategory)}><option value="materia_prima">Materia Prima</option><option value="empaque">Empaque</option></select><label className="block text-sm">Costo Unitario<input className="mt-1 w-full rounded border p-2" type="number" min="0" value={cost} onChange={(e)=>setCost(e.target.value)} required/></label><button className="w-full rounded bg-slate-800 p-3 font-bold text-white">Guardar Cambios</button></form></div>}
      {restocking&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl" onSubmit={async(e)=>{e.preventDefault();setBusy(true);try{const saved=await inventoryService.restock(restocking,Number(restockQty),Number(restockCost));setItems((all)=>all.map((x)=>x.id===saved.id?saved:x));setNotice(`Stock de ${saved.name} actualizado exitosamente.`);setRestocking(null)}catch(err){setError(messageFor(err))}finally{setBusy(false)}}}><div className="flex justify-between font-bold"><span>Abastecer: {restocking.name}</span><button type="button" onClick={()=>setRestocking(null)}>×</button></div><p className="text-sm text-slate-600">Ingresa la cantidad que vas a agregar al inventario y verifica el costo.</p><label className="block text-sm">Cantidad a ingresar<input className="mt-1 w-full rounded border p-2" type="number" min="0.01" step="0.01" value={restockQty} onChange={(e)=>setRestockQty(e.target.value)} required/></label><label className="block text-sm">Costo unitario<input className="mt-1 w-full rounded border p-2" type="number" min="0" value={restockCost} onChange={(e)=>setRestockCost(e.target.value)} required/></label><label className="flex gap-2 text-sm"><input type="checkbox" defaultChecked/> Registrar compra como egreso en Finanzas</label><button className="w-full rounded bg-blue-600 p-3 font-bold text-white">Confirmar Abastecimiento</button></form></div>}
    </section>
  )
}
