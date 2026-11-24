import { useEffect, useState, type FormEvent } from 'react'
import type { Flavor, Product } from '../catalog.model'
import { catalogService } from '../catalog.service'

interface Props {
  organizationId: string
  canManage: boolean
}

function messageFor(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'No se pudo actualizar el catálogo.'
}

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function CatalogPanel({ organizationId, canManage }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [sizeOz, setSizeOz] = useState('')
  const [flavorName, setFlavorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'product' | 'flavor' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([catalogService.listProducts(organizationId), catalogService.listFlavors(organizationId)])
      .then(([nextProducts, nextFlavors]) => {
        if (!active) return
        setProducts(nextProducts)
        setFlavors(nextFlavors)
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

  async function createProduct(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy('product')
    try {
      const product = await catalogService.createProduct(organizationId, {
        name: productName,
        price: Number(price),
        size_oz: sizeOz ? Number(sizeOz) : null,
        category: 'jugo',
      })
      setProducts((current) => [...current, product].sort((a, b) => a.name.localeCompare(b.name)))
      setProductName('')
      setPrice('')
      setSizeOz('')
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(null)
    }
  }

  async function createFlavor(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy('flavor')
    try {
      const flavor = await catalogService.createFlavor(organizationId, { name: flavorName })
      setFlavors((current) => [...current, flavor].sort((a, b) => a.name.localeCompare(b.name)))
      setFlavorName('')
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700">Configuración</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink-950">Catálogo</h2>
          <p className="mt-1 text-sm text-slate-600">Define lo que vendes hoy; POS y producción usarán esta misma información.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{products.length} productos</span>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando catálogo...</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            {products.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Aún no hay productos registrados.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.size_oz ? `${product.size_oz} oz` : 'Tamaño por definir'}</p>
                    </div>
                    <span className="font-semibold text-slate-800">{money.format(Number(product.price))}</span>
                  </li>
                ))}
              </ul>
            )}

            {canManage && (
              <form onSubmit={createProduct} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Nombre del producto" required />
                <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="1" placeholder="Precio COP" required />
                <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={sizeOz} onChange={(event) => setSizeOz(event.target.value)} type="number" min="0" step="0.5" placeholder="Onzas (opcional)" />
                <button className="rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:col-span-3" type="submit" disabled={busy !== null}>{busy === 'product' ? 'Guardando...' : 'Agregar producto'}</button>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Sabores</h3>
            <p className="mt-1 text-sm text-slate-500">Úsalos más adelante en producción.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {flavors.length === 0 ? <span className="text-sm text-slate-500">Sin sabores todavía.</span> : flavors.map((flavor) => <span key={flavor.id} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">{flavor.name}</span>)}
            </div>
            {canManage && (
              <form onSubmit={createFlavor} className="mt-5 flex gap-2">
                <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={flavorName} onChange={(event) => setFlavorName(event.target.value)} placeholder="Nuevo sabor" required />
                <button className="rounded-lg border border-brand-200 px-3 py-2 font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60" type="submit" disabled={busy !== null}>{busy === 'flavor' ? '...' : 'Añadir'}</button>
              </form>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}
