import { useEffect, useMemo, useState } from 'react'
import type { Flavor, Product } from '@/modules/catalog/catalog.model'
import { catalogService } from '@/modules/catalog/catalog.service'
import type { InventoryItem } from '@/modules/inventory/inventory.model'
import type { BaseBatch } from '../production.model'
import { productionService, type FinishedLot } from '../production.service'

interface Props { organizationId: string; branchId: string; branchName: string; memberId: string; canManage: boolean }
const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
type MaterialRow = { itemId: string; qty: string }
type CupRow = { productId: string; qty: string }

function errorText(error: unknown) { return error && typeof error === 'object' && 'message' in error ? String(error.message) : 'No se pudo completar la operación.' }

export function ProductionPanel({ organizationId, branchId, branchName, memberId, canManage }: Props) {
  const [batches, setBatches] = useState<BaseBatch[]>([])
  const [materials, setMaterials] = useState<InventoryItem[]>([])
  const [packaging, setPackaging] = useState<InventoryItem[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lots, setLots] = useState<FinishedLot[]>([])
  const [flavorId, setFlavorId] = useState('')
  const [rows, setRows] = useState<MaterialRow[]>([{ itemId: '', qty: '1' }])
  const [batchId, setBatchId] = useState('')
  const [cupRows, setCupRows] = useState<CupRow[]>([{ productId: '', qty: '' }])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newFlavor, setNewFlavor] = useState('')
  const [showFlavorForm, setShowFlavorForm] = useState(false)
  const [wasteBatchId, setWasteBatchId] = useState<string | null>(null)
  const [wasteQty, setWasteQty] = useState<Record<string, string>>({})
  const [wasteReason, setWasteReason] = useState('Vaso roto')

  async function refresh() {
    setLoading(true); setError('')
    try {
      const [allBatches, allMaterials, allLots, flavorList, productList, allInventory] = await Promise.all([
        productionService.listBatches(organizationId, branchId), productionService.listMaterials(organizationId, branchId),
        productionService.listFinishedLots(organizationId, branchId), catalogService.listFlavors(organizationId),
        catalogService.listProducts(organizationId),
        (await import('@/modules/inventory/inventory.service')).inventoryService.list(organizationId, branchId),
      ])
      setBatches(allBatches); setMaterials(allMaterials); setPackaging(allInventory.filter((item) => item.category === 'empaque'))
      setLots(allLots); setFlavors(flavorList); setProducts(productList)
      setBatchId((current) => allBatches.find((b) => b.id === current && !b.is_packed)?.id ?? allBatches.find((b) => !b.is_packed)?.id ?? '')
    } catch (err) { setError(errorText(err)) } finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [organizationId, branchId])

  const pending = useMemo(() => batches.filter((batch) => !batch.is_packed), [batches])
  const batchForPacking = pending.find((batch) => batch.id === batchId)
  const baseCost = rows.reduce((sum, row) => { const item = materials.find((material) => material.id === row.itemId); return sum + (item ? Number(item.cost) * (Number(row.qty) || 0) : 0) }, 0)

  async function prepare() {
    setError(''); setSuccess('')
    const selected = rows.map((row) => ({ item: materials.find((item) => item.id === row.itemId), qty: Number(row.qty) })).filter((row): row is { item: InventoryItem; qty: number } => Boolean(row.item && row.qty > 0))
    if (!flavorId || selected.length === 0) { setError('Selecciona un sabor y al menos un insumo con cantidad válida.'); return }
    const insufficient = selected.find(({ item, qty }) => Number(item.stock) < qty)
    if (insufficient) { setError(`Existencia insuficiente de ${insufficient.item.name}.`); return }
    setBusy(true)
    try {
      const flavor = flavors.find((item) => item.id === flavorId)?.name ?? ''
      await productionService.prepareBatch(organizationId, branchId, memberId, flavorId, flavor, selected)
      setSuccess(`Lote base de ${flavor} preparado.`); setRows([{ itemId: '', qty: '1' }]); await refresh()
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }
  async function pack() {
    setError(''); setSuccess('')
    if (!batchForPacking) { setError('Selecciona un lote pendiente.'); return }
    const selected = cupRows.map((row) => ({ row, product: products.find((item) => item.id === row.productId) })).filter((entry) => entry.product && Number(entry.row.qty) > 0)
    if (!selected.length) { setError('Añade al menos una presentación y su cantidad producida.'); return }
    const packNeeds = selected.map(({ product, row }) => ({ item: packaging.find((item) => item.size_oz === product?.size_oz), qty: Number(row.qty) })).filter((item): item is { item: InventoryItem; qty: number } => Boolean(item.item))
    const short = packNeeds.find(({ item, qty }) => Number(item.stock) < qty)
    if (short) { setError(`No hay suficientes ${short.item.name} para envasar.`); return }
    setBusy(true)
    try {
      await productionService.processPacking(batchForPacking, selected.map(({ product, row }) => ({ id: product!.id, name: product!.name, size_oz: Number(product!.size_oz ?? 0), qty: Number(row.qty) })), packNeeds.map(({ item, qty }) => ({ id: item.id, qty })))
      setSuccess('Envasado procesado y existencias de producto creadas.'); setCupRows([{ productId: '', qty: '' }]); await refresh()
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }
  async function saveFlavor() {
    const name = newFlavor.trim()
    if (!name || flavors.some((flavor) => flavor.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { setError('Escribe un sabor nuevo; no debe estar repetido.'); return }
    setBusy(true); setError('')
    try { const flavor = await productionService.addFlavor(organizationId, { name }); setFlavors((all) => [...all, flavor].sort((a,b)=>a.name.localeCompare(b.name))); setFlavorId(flavor.id); setNewFlavor(''); setShowFlavorForm(false) }
    catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }
  async function deleteBatch(batch: BaseBatch) {
    if (!window.confirm(`¿Eliminar el lote pendiente ${batch.id.slice(0,8)}? Esta acción no se puede deshacer.`)) return
    setBusy(true); setError('')
    try { await productionService.deletePendingBatch(batch.id); setSuccess('Lote pendiente eliminado.'); await refresh() }
    catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }
  async function applyWaste() {
    const batchLots = lots.filter((lot) => lot.batch_id === wasteBatchId)
    const pendingWaste = batchLots.map((lot) => ({ lot, qty: Number(wasteQty[lot.id] || 0) })).filter((row) => row.qty > 0)
    if (!pendingWaste.length) { setError('Ingresa la cantidad de merma para al menos una presentación.'); return }
    setBusy(true); setError('')
    try { for (const row of pendingWaste) await productionService.recordWaste(row.lot, row.qty, wasteReason); setWasteBatchId(null); setWasteQty({}); setSuccess('Merma registrada con su causa.'); await refresh() }
    catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  return <section className="space-y-5">
    <header><p className="text-sm font-semibold text-brand-700">Operación · {branchName}</p><h2 className="mt-1 text-2xl font-bold text-ink-950">Fábrica / Producción</h2><p className="mt-1 text-sm text-slate-600">Prepara la base del jugo y luego registra el envasado por presentación.</p></header>
    {error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{success && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
    {loading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Cargando datos de producción...</p> : <>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-bold text-blue-800">1. Preparar Lote Base</h3><button onClick={()=>setShowFlavorForm((value)=>!value)} className="text-xs font-bold text-blue-700">⚙ Gestionar sabores</button></div>
          {showFlavorForm&&<div className="mt-3 flex gap-2"><input className={field} value={newFlavor} onChange={(e)=>setNewFlavor(e.target.value)} placeholder="Ej: Corozo, Mango, Piña..."/><button disabled={busy} onClick={()=>void saveFlavor()} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">＋ Agregar</button></div>}
          <label className="mt-5 block text-xs font-semibold text-slate-700">Sabor del Jugo<select className={`${field} mt-1.5`} value={flavorId} onChange={(e) => setFlavorId(e.target.value)}><option value="">Seleccionar sabor...</option>{flavors.map((flavor) => <option key={flavor.id} value={flavor.id}>{flavor.name}</option>)}</select></label>
          <div className="mt-5 flex items-center justify-between"><label className="text-xs font-semibold text-slate-700">Materia Prima Utilizada</label><span className="text-xs text-slate-500">Costo: {money.format(baseCost)}</span></div>
          <div className="mt-2 space-y-2">{rows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_6rem_2rem] gap-2"><select className={field} value={row.itemId} onChange={(e) => setRows((all) => all.map((item, i) => i === index ? { ...item, itemId: e.target.value } : item))}><option value="">Seleccionar Insumo...</option>{materials.map((item) => <option key={item.id} value={item.id}>{item.name} (Stock: {item.stock})</option>)}</select><input className={`${field} text-center`} type="number" min="0.01" step="0.01" value={row.qty} onChange={(e) => setRows((all) => all.map((item, i) => i === index ? { ...item, qty: e.target.value } : item))}/><button title="Quitar insumo" onClick={() => setRows((all) => all.length > 1 ? all.filter((_, i) => i !== index) : all.map(() => ({ itemId: '', qty: '1' })))} className="text-lg text-rose-500">×</button></div>)}</div>
          <button onClick={() => setRows((all) => [...all, { itemId: '', qty: '1' }])} className="mt-3 text-sm font-bold text-blue-700">＋ Añadir Insumo</button>
          <button disabled={!canManage || busy} onClick={() => void prepare()} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Procesando...' : 'Preparar Lote'}</button>
        </section>
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><h3 className="font-bold text-emerald-800">2. Envasado y Empaque</h3>
          <label className="mt-5 block text-xs font-semibold text-slate-700">Seleccionar Lote Pendiente<select className={`${field} mt-1.5`} value={batchId} onChange={(e) => setBatchId(e.target.value)}><option value="">-- Elige un lote --</option>{pending.map((batch) => <option key={batch.id} value={batch.id}>{batch.id.slice(0, 8).toUpperCase()} · {flavors.find((f) => f.id === batch.flavor_id)?.name ?? batch.juice_type} ({money.format(Number(batch.raw_cost))})</option>)}</select></label>
          <div className="mt-5 flex items-center justify-between"><label className="text-xs font-semibold text-slate-700">Presentaciones (Vasos Buenos)</label><button onClick={() => setCupRows((all) => [...all, { productId: '', qty: '' }])} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">＋ Añadir Vaso</button></div>
          <div className="mt-2 space-y-2">{cupRows.map((row, index) => <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="grid grid-cols-[1fr_2rem] gap-2"><select className={field} value={row.productId} onChange={(e) => setCupRows((all) => all.map((item, i) => i === index ? { ...item, productId: e.target.value } : item))}><option value="">Seleccionar presentación...</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} {product.size_oz ? `${product.size_oz}oz` : ''}</option>)}</select><button onClick={() => setCupRows((all) => all.length > 1 ? all.filter((_, i) => i !== index) : [{ productId: '', qty: '' }])} className="text-rose-500">♲</button></div><input className={`${field} mt-2 text-center`} aria-label="Vasos producidos" type="number" min="1" step="1" placeholder="Cantidad de vasos producidos" value={row.qty} onChange={(e) => setCupRows((all) => all.map((item, i) => i === index ? { ...item, qty: e.target.value } : item))}/>{row.productId && <p className="mt-1 text-xs text-slate-500">Empaque disponible: {packaging.find((item) => item.size_oz === products.find((p) => p.id === row.productId)?.size_oz)?.stock ?? 'sin empaque asociado'}</p>}</div>)}</div>
          <button disabled={!canManage || busy || !batchForPacking} onClick={() => void pack()} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Procesando...' : 'Procesar Envasado'}</button>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-900">Historial de Lotes Base</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['ID Lote','Sabor','Insumos Usados','Costo Base','Detalle Vasos','Estado','Acciones'].map((item)=><th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{batches.map((batch)=>{const batchLots=lots.filter((lot)=>lot.batch_id===batch.id);return <tr key={batch.id}><td className="px-4 py-3 font-bold">{batch.id.slice(0,8).toUpperCase()}</td><td className="px-4 py-3 font-semibold text-orange-700">{flavors.find((f)=>f.id===batch.flavor_id)?.name??batch.juice_type}</td><td className="px-4 py-3 text-xs text-slate-600">{batch.raw_cost?`${money.format(Number(batch.raw_cost))} en materiales`:'—'}</td><td className="px-4 py-3 font-bold">{money.format(Number(batch.raw_cost))}</td><td className="px-4 py-3 text-xs text-slate-600">{batchLots.map((lot)=><div key={lot.id} className="mb-1 rounded bg-slate-100 px-2 py-1">{lot.initial_qty}x {lot.size_oz}oz ({lot.current_qty} disp.)</div>)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${batch.is_packed?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{batch.is_packed?'Envasado':'Pendiente'}</span></td><td className="px-4 py-3">{batch.is_packed?<button onClick={()=>{setWasteBatchId(batch.id);setWasteQty({})}} className="whitespace-nowrap rounded border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600">△ Añadir merma</button>:<button disabled={!canManage} onClick={()=>void deleteBatch(batch)} className="text-rose-600 hover:underline">Eliminar</button>}</td></tr>})}{batches.length===0&&<tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aún no hay lotes preparados.</td></tr>}</tbody></table></div></section>
    </>}
    {wasteBatchId&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white shadow-xl"><header className="flex justify-between border-b px-5 py-4"><h3 className="font-bold">Registrar Merma</h3><button onClick={()=>setWasteBatchId(null)} aria-label="Cerrar">×</button></header><div className="space-y-3 p-5"><p className="text-sm text-slate-600">Ingresa los vasos dañados o perdidos por presentación del lote <strong>{wasteBatchId.slice(0,8).toUpperCase()}</strong>.</p>{lots.filter((lot)=>lot.batch_id===wasteBatchId).map((lot)=><div key={lot.id} className="grid grid-cols-[1fr_4rem] items-center gap-3 rounded-lg border bg-slate-50 p-3"><div><p className="text-sm font-bold text-slate-800">{lot.product_name} {lot.size_oz}oz</p><p className="text-xs text-slate-500">Stock actual: {lot.current_qty} unds</p></div><input aria-label={`Merma ${lot.product_name}`} className={`${field} text-center`} type="number" min="0" max={lot.current_qty} value={wasteQty[lot.id]??''} placeholder="0" onChange={(e)=>setWasteQty((all)=>({...all,[lot.id]:e.target.value}))}/></div>)}<label className="block text-sm font-medium">Causa de la merma<select className={`${field} mt-1`} value={wasteReason} onChange={(e)=>setWasteReason(e.target.value)}>{['Vaso roto','Derrame','Producto vencido','Error de preparación','Contaminación','Otra causa'].map((reason)=><option key={reason}>{reason}</option>)}</select></label><button disabled={busy} onClick={()=>void applyWaste()} className="w-full rounded-lg bg-rose-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy?'Aplicando...':'Aplicar Merma'}</button></div></section></div>}
  </section>
}
