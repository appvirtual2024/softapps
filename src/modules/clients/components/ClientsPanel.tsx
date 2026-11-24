import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Client, ClientInput } from '../client.model'
import { clientService } from '../client.service'

interface Props { organizationId: string; canManage: boolean }
const emptyForm = { name: '', id_type: 'CC', id_number: '', phone: '', email: '', address: '' }
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100'

function messageFor(error: unknown) {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Ocurrió un error con los clientes.'
}

export function ClientsPanel({ organizationId, canManage }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function reload() {
    setLoading(true)
    try { setClients(await clientService.list(organizationId)); setError('') }
    catch (err) { setError(messageFor(err)) }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [organizationId])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return clients.filter((client) => [client.name, client.id_number, client.phone, client.email].some((value) => value?.toLocaleLowerCase().includes(term)))
  }, [clients, query])

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModal(true) }
  function openEdit(client: Client) {
    setEditing(client); setForm({ name: client.name, id_type: client.id_type, id_number: client.id_number ?? '', phone: client.phone ?? '', email: client.email ?? '', address: client.address ?? '' }); setError(''); setModal(true)
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const input: ClientInput = { name: form.name.trim(), id_type: form.id_type, id_number: form.id_number.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, address: form.address.trim() || null }
    try {
      const saved = editing ? await clientService.update(editing.id, input) : await clientService.create(organizationId, input)
      setClients((items) => editing ? items.map((item) => item.id === saved.id ? saved : item).sort((a,b) => a.name.localeCompare(b.name)) : [...items, saved].sort((a,b) => a.name.localeCompare(b.name)))
      setModal(false)
    } catch (err) { setError(messageFor(err)) }
    finally { setBusy(false) }
  }
  async function remove(client: Client) {
    if (!window.confirm(`¿Eliminar el cliente ${client.name}?`)) return
    try { await clientService.remove(client.id); setClients((items) => items.filter((item) => item.id !== client.id)); setError('') }
    catch (err) { setError(messageFor(err)) }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm font-semibold text-purple-700">Ventas</p><h2 className="mt-1 text-xl font-bold text-ink-950">Directorio de Clientes</h2><p className="mt-1 text-sm text-slate-600">Contactos de tu negocio y sus datos de identificación.</p></div>
      {canManage && <button onClick={openCreate} className="rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-800">＋ Nuevo Cliente</button>}
    </div>
    <div className="mt-5"><input className={inputClass} placeholder="Buscar por nombre, documento, teléfono o email..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    {error && !modal && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <p className="mt-6 text-sm text-slate-500">Cargando clientes...</p> : filtered.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="font-semibold text-slate-800">{query ? 'No encontramos clientes con esa búsqueda.' : 'Aún no hay clientes registrados.'}</p><p className="mt-1 text-sm text-slate-500">{!query && 'Agrega el primer contacto para tenerlo disponible en ventas.'}</p></div> : <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Cliente','Identificación','Teléfono','Email','Dirección',...(canManage?['Acciones']:[])].map((label)=><th key={label} className="px-4 py-3 font-bold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((client)=><tr key={client.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold text-slate-900">{client.name}</td><td className="px-4 py-3 text-slate-600">{client.id_type} · {client.id_number || '—'}</td><td className="px-4 py-3 text-slate-600">{client.phone || '—'}</td><td className="px-4 py-3 text-slate-600">{client.email || '—'}</td><td className="px-4 py-3 text-slate-600">{client.address || '—'}</td>{canManage&&<td className="whitespace-nowrap px-4 py-3"><button onClick={()=>openEdit(client)} className="font-semibold text-purple-700 hover:underline">Editar</button><button onClick={()=>void remove(client)} className="ml-3 font-semibold text-rose-600 hover:underline">Eliminar</button></td>}</tr>)}</tbody></table></div>}
    {modal&&<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setModal(false)}}><section role="dialog" aria-modal="true" aria-labelledby="client-modal-title" className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h3 id="client-modal-title" className="font-bold text-slate-900">{editing?'Editar Cliente':'Nuevo Cliente'}</h3><button aria-label="Cerrar" onClick={()=>setModal(false)} className="text-2xl leading-none text-slate-500 hover:text-slate-800">×</button></header><form onSubmit={(e)=>void submit(e)} className="space-y-4 p-5"><label className="block text-xs font-semibold text-slate-700">Nombre Completo<input required autoFocus className={`${inputClass} mt-1.5`} value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><div className="grid grid-cols-[7rem_1fr] gap-3"><label className="block text-xs font-semibold text-slate-700">Tipo Doc.<select className={`${inputClass} mt-1.5`} value={form.id_type} onChange={(e)=>setForm({...form,id_type:e.target.value})}>{['CC','CE','NIT','PASAPORTE','OTRO'].map(x=><option key={x}>{x}</option>)}</select></label><label className="block text-xs font-semibold text-slate-700">Número de Identificación<input className={`${inputClass} mt-1.5`} value={form.id_number} onChange={(e)=>setForm({...form,id_number:e.target.value})}/></label></div><label className="block text-xs font-semibold text-slate-700">Teléfono<input type="tel" className={`${inputClass} mt-1.5`} value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></label><label className="block text-xs font-semibold text-slate-700">Email<input type="email" className={`${inputClass} mt-1.5`} value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label><label className="block text-xs font-semibold text-slate-700">Dirección<textarea rows={2} className={`${inputClass} mt-1.5`} value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/></label>{error&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-purple-700 px-4 py-3 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-60">{busy?'Guardando...':editing?'Guardar Cambios':'Guardar Cliente'}</button></form></section></div>}
  </section>
}
