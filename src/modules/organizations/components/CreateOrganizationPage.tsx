import { useState, type FormEvent } from 'react'
import { organizationService } from '../organization.service'

interface Props {
  onCreated: () => void
}

function messageFor(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'No se pudo crear la organización'
}

export function CreateOrganizationPage({ onCreated }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await organizationService.create(name)
      onCreated()
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-brand-50 via-white to-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-black text-white shadow-lg shadow-brand-600/25">J</div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-950">Crea tu negocio</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Quedarás como administrador y podrás invitar a tu equipo después.</p>
        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Nombre del negocio
            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              placeholder="Ej. Jugos Lumi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <button className="mt-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>
          {busy ? 'Creando...' : 'Crear negocio'}
        </button>
      </form>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>
    </main>
  )
}
