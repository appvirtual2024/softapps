import { useEffect, useState, type FormEvent } from 'react'
import type { Branch } from '../branch.model'
import { branchService } from '../branch.service'

interface Props {
  organizationId: string
  canManage: boolean
}

function messageFor(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'No se pudieron cargar las sucursales.'
}

export function BranchesPanel({ organizationId, canManage }: Props) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void branchService
      .list(organizationId)
      .then((data) => {
        if (active) setBranches(data)
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
  }, [organizationId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const branch = await branchService.create(organizationId, { name, address: address || null })
      setBranches((current) => [...current, branch].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setAddress('')
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
          <p className="text-sm font-semibold text-brand-700">Operación</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink-950">Sucursales</h2>
          <p className="mt-1 text-sm text-slate-600">Selecciona una sede antes de operar inventario, producción o ventas.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'}
        </span>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando sucursales...</p>
      ) : branches.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="font-semibold text-slate-800">Aún no hay sucursales.</p>
          <p className="mt-1 text-sm text-slate-600">Crea la sede principal para empezar a organizar la operación.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {branches.map((branch) => (
            <li key={branch.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{branch.name}</p>
              <p className="mt-1 text-sm text-slate-500">{branch.address || 'Dirección pendiente'}</p>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Nombre de la sucursal
            <input className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Sede principal" required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Dirección <span className="font-normal text-slate-400">(opcional)</span>
            <input className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Ej. Calle 10 # 15-20" />
          </label>
          <button className="rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2" type="submit" disabled={busy}>
            {busy ? 'Creando sucursal...' : 'Crear sucursal'}
          </button>
        </form>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}
