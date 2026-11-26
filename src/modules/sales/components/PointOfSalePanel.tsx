import { useEffect, useMemo, useState } from 'react'
import type { Client } from '@/modules/clients/client.model'
import { salesService, type SaleLot, type CartLine } from '../sales.service'
import { catalogService } from '@/modules/catalog/catalog.service'
import { ReceiptModal } from './ReceiptModal'

interface Props {
  organizationId: string
  branchId: string
  memberId: string
}

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

type FlavorGroup = {
  key: string
  flavor: string
  lots: SaleLot[]
}

type PresentationGroup = {
  key: string
  sizeOz: number
  lots: SaleLot[]
}

// Los lotes nunca se mezclan en la base de datos: cada uno conserva su costo,
// fecha y trazabilidad. Esta clave solo los agrupa para que el vendedor vea un
// único jugo por sabor, aunque se haya producido en varios momentos.
function normalizedFlavor(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

export function PointOfSalePanel({
  organizationId,
  branchId,
  memberId,
}: Props) {
  const [lots, setLots] = useState<SaleLot[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [cart, setCart] = useState<CartLine[]>([])
  const [clientId, setClientId] = useState('')
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [qty, setQty] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [receipt, setReceipt] = useState<
    Awaited<ReturnType<typeof salesService.createTicket>> | null
  >(null)
  const [receiptItems, setReceiptItems] = useState<
    Awaited<ReturnType<typeof salesService.getTicketItems>>
  >([])

  useEffect(() => {
    let live = true

    Promise.all([
      salesService.listAvailableLots(organizationId, branchId),
      salesService.listClients(organizationId),
      catalogService.listProducts(organizationId),
    ])
      .then(([availableLots, availableClients, products]) => {
        if (!live) return

        setLots(availableLots)
        setClients(availableClients)
        setPrices(
          Object.fromEntries(products.map((product) => [product.id, Number(product.price)])),
        )
      })
      .catch((loadError) => {
        if (live) {
          setError(loadError.message ?? 'No se pudo cargar Punto de Venta.')
        }
      })
      .finally(() => {
        if (live) setLoading(false)
      })

    return () => {
      live = false
    }
  }, [organizationId, branchId])

  const grouped = useMemo<FlavorGroup[]>(() => {
    const byFlavor = new Map<string, FlavorGroup>()
    for (const lot of lots) {
      const key = normalizedFlavor(lot.flavor)
      const group = byFlavor.get(key)
      if (group) group.lots.push(lot)
      else byFlavor.set(key, { key, flavor: lot.flavor.trim(), lots: [lot] })
    }
    return [...byFlavor.values()].sort((a, b) => a.flavor.localeCompare(b.flavor))
  }, [lots])

  const selectedFlavorGroup = grouped.find((group) => group.key === selectedFlavor)

  const presentations = useMemo<PresentationGroup[]>(() => {
    if (!selectedFlavorGroup) return []
    const bySize = new Map<string, PresentationGroup>()
    for (const lot of selectedFlavorGroup.lots) {
      const sizeOz = Number(lot.size_oz)
      const key = `${selectedFlavorGroup.key}:${sizeOz}`
      const group = bySize.get(key)
      if (group) group.lots.push(lot)
      else bySize.set(key, { key, sizeOz, lots: [lot] })
    }
    return [...bySize.values()].sort((a, b) => a.sizeOz - b.sizeOz)
  }, [selectedFlavorGroup])

  const total = cart.reduce((sum, line) => sum + line.qty * line.price, 0)

  function addPresentation(presentation: PresentationGroup) {
    const amount = Number(qty[presentation.key] || 1)
    const available = presentation.lots.reduce(
      (sum, lot) => sum + Number(lot.current_qty) - (cart.find((line) => line.lot.id === lot.id)?.qty ?? 0),
      0,
    )

    if (amount < 1 || amount > available) {
      setError('La cantidad debe estar entre 1 y el stock disponible.')
      return
    }

    setError('')
    let remaining = amount
    const additions: CartLine[] = []
    // Se descuenta primero el lote más antiguo para evitar que producto viejo quede atrás.
    const orderedLots = [...presentation.lots].sort((a, b) =>
      new Date(a.packed_at ?? 0).getTime() - new Date(b.packed_at ?? 0).getTime(),
    )
    for (const lot of orderedLots) {
      const alreadyInCart = cart.find((line) => line.lot.id === lot.id)?.qty ?? 0
      const fromLot = Math.min(remaining, Number(lot.current_qty) - alreadyInCart)
      if (fromLot > 0) {
        additions.push({ lot, qty: fromLot, price: prices[lot.product_id ?? ''] ?? 0 })
        remaining -= fromLot
      }
      if (remaining === 0) break
    }
    setCart((current) => additions.reduce((next, addition) => {
      const existing = next.find((line) => line.lot.id === addition.lot.id)
      return existing
        ? next.map((line) => line.lot.id === addition.lot.id ? { ...line, qty: line.qty + addition.qty } : line)
        : [...next, addition]
    }, current))
  }

  async function save(paid: boolean) {
    if (!cart.length) {
      setError('Agrega productos al ticket.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const client = clients.find((item) => item.id === clientId) ?? null
      const ticket = await salesService.createTicket(
        organizationId,
        branchId,
        memberId,
        client,
        cart,
        paid,
      )

      setReceipt(ticket)
      setReceiptItems(await salesService.getTicketItems(ticket.id))
      setNotice(
        paid
          ? 'Venta registrada correctamente.'
          : 'Ticket guardado como pendiente (crédito).',
      )
      setCart([])

      const refreshedLots = await salesService.listAvailableLots(
        organizationId,
        branchId,
      )
      setLots(refreshedLots)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar el ticket.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      <header className="rounded-xl bg-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="font-bold text-slate-900">
          🛒 Punto de Venta{' '}
          <span className="text-sm font-normal text-slate-500">
            (Jugos disponibles)
          </span>
        </h2>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <>
          <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
            {grouped.map(({ key, flavor, lots: flavorLots }) => (
              <button
                key={key}
                onClick={() =>
                  setSelectedFlavor((current) =>
                    current === key ? '' : key,
                  )
                }
                className={`min-w-0 rounded-xl border bg-white p-2 text-left shadow-sm transition sm:p-4 ${
                  selectedFlavor === key
                    ? 'border-orange-400 ring-2 ring-orange-100'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <span className="text-lg sm:text-2xl">🧃</span>
                <p className="mt-1 break-words text-xs font-bold leading-tight sm:mt-2 sm:text-base">
                  Jugo de {flavor}
                </p>
                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                  Stock: {flavorLots.reduce(
                    (sum, lot) => sum + Number(lot.current_qty),
                    0,
                  )}
                </p>
                <p className="mt-1 text-[10px] font-bold text-orange-600 sm:mt-2 sm:text-sm">
                  Ver tamaños
                </p>
              </button>
            ))}
          </div>

          {selectedFlavor && (
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedFlavor('')
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="pos-size-title"
                className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[min(42rem,calc(100dvh-3rem))]"
              >
                <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-5">
                  <h3 id="pos-size-title" className="min-w-0 font-bold text-slate-900">
                    Jugo de {selectedFlavorGroup?.flavor} — Tamaños disponibles
                  </h3>
                  <button
                    aria-label="Cerrar tamaños"
                    onClick={() => setSelectedFlavor('')}
                    className="ml-3 min-h-10 min-w-10 shrink-0 rounded-lg text-xl text-slate-500 hover:bg-slate-100"
                  >
                    ×
                  </button>
                </header>

                <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain p-3 sm:p-4">
                  {presentations.map((presentation) => {
                    const available = presentation.lots.reduce(
                      (sum, lot) => sum + Number(lot.current_qty) - (cart.find((line) => line.lot.id === lot.id)?.qty ?? 0),
                      0,
                    )
                    const referenceLot = presentation.lots[0]
                    return (
                      <div
                        key={presentation.key}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-semibold">
                            {selectedFlavorGroup?.flavor} {presentation.sizeOz}oz
                          </p>
                          <p className="text-xs text-slate-500">
                            Stock: {available} disponibles · {presentation.lots.length} {presentation.lots.length === 1 ? 'lote' : 'lotes'}
                          </p>
                          <p className="font-bold text-orange-600">
                            {cop.format(Number(prices[referenceLot.product_id ?? ''] ?? 0))}
                          </p>
                        </div>

                        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                          <input
                            aria-label={`Cantidad de ${selectedFlavorGroup?.flavor} ${presentation.sizeOz}oz`}
                            className="min-h-11 w-20 rounded-lg border p-2 text-center"
                            type="number"
                            min="1"
                            max={available}
                            value={qty[presentation.key] ?? '1'}
                            onChange={(event) =>
                              setQty({ ...qty, [presentation.key]: event.target.value })
                            }
                          />
                          <button
                            onClick={() => addPresentation(presentation)}
                            className="min-h-11 flex-1 rounded-lg bg-orange-600 px-4 py-2 font-bold text-white hover:bg-orange-700 sm:flex-none"
                          >
                            ＋ Agregar
                          </button>
                        </div>
                      </div>
                    )})}
                </div>
              </section>
            </div>
          )}

          <section className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <div className="border-b p-3">
              <select
                className="min-h-11 w-full rounded-lg border p-2"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                <option value="">Mostrador (Particular)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-center justify-between gap-2 font-bold">
                <span>Ticket de Venta</span>
                <button
                  className="min-h-10 px-2 text-xs font-medium text-rose-600"
                  onClick={() => setCart([])}
                >
                  ♲ Vaciar
                </button>
              </div>
            </div>

            <div className="min-h-32 space-y-2 p-3">
              {cart.map((line) => (
                <div
                  key={line.lot.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold">
                      {line.qty}x {line.lot.flavor} {line.lot.size_oz}oz
                    </p>
                    <p className="text-xs text-slate-500">
                      {cop.format(line.price)} c/u
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <input
                      aria-label="Cantidad en ticket"
                      className="min-h-11 w-16 rounded-lg border p-2 text-center"
                      type="number"
                      min="1"
                      max={line.lot.current_qty}
                      value={line.qty}
                      onChange={(event) =>
                        setCart((current) =>
                          current.map((item) =>
                            item.lot.id === line.lot.id
                              ? { ...item, qty: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                    />
                    <strong className="text-sm sm:text-base">
                      {cop.format(line.qty * line.price)}
                    </strong>
                    <button
                      aria-label="Quitar producto del ticket"
                      onClick={() =>
                        setCart((current) =>
                          current.filter((item) => item.lot.id !== line.lot.id),
                        )
                      }
                      className="min-h-10 min-w-10 text-rose-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {!cart.length && (
                <p className="py-8 text-center text-sm text-slate-400">
                  Selecciona un jugo para agregarlo al ticket.
                </p>
              )}
            </div>

            <footer className="space-y-2 border-t bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <span>Total a pagar</span>
                <strong className="text-xl">{cop.format(total)}</strong>
              </div>
              <button
                disabled={busy || !cart.length}
                onClick={() => void save(true)}
                className="min-h-12 w-full rounded-lg bg-emerald-600 p-3 font-bold text-white disabled:opacity-50"
              >
                {busy ? 'Guardando...' : 'Registrar Pago'}
              </button>
              <button
                disabled={busy || !cart.length}
                onClick={() => void save(false)}
                className="min-h-12 w-full rounded-lg bg-amber-500 p-3 font-bold text-white disabled:opacity-50"
              >
                Fiar / Guardar Ticket (Crédito)
              </button>
            </footer>
          </section>
        </>
      )}

      {receipt && (
        <ReceiptModal
          ticket={receipt}
          items={receiptItems}
          onClose={() => setReceipt(null)}
        />
      )}
    </section>
  )
}
