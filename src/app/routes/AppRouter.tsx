import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { AuthPage } from '@/modules/auth/components/AuthPage'
import { CreateOrganizationPage } from '@/modules/organizations/components/CreateOrganizationPage'
import { authService } from '@/modules/auth/auth.service'
import { BranchesPanel } from '@/modules/branches/components/BranchesPanel'
import { CatalogPanel } from '@/modules/catalog/components/CatalogPanel'
import { InventoryPanel } from '@/modules/inventory/components/InventoryPanel'
import { ProductionPanel } from '@/modules/production/components/ProductionPanel'
import { ClientsPanel } from '@/modules/clients/components/ClientsPanel'
import type { Branch } from '@/modules/branches/branch.model'
import { branchService } from '@/modules/branches/branch.service'
import { useSession } from '@/app/providers/SessionProvider'
import { useState as useViewState } from 'react'
import { PointOfSalePanel } from '@/modules/sales/components/PointOfSalePanel'
import { TicketsPanel } from '@/modules/sales/components/TicketsPanel'

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-600">Cargando sesión...</main>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to={session.membership ? '/app' : '/onboarding'} replace />
  return <>{children}</>
}

function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function OnboardingRoute() {
  const { session, refresh } = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.membership) return <Navigate to="/app" replace />
  return <CreateOrganizationPage onCreated={refresh} />
}

function DashboardPage() {
  const { session } = useSession()
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [section, setSection] = useViewState('inicio')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const organizationId = session?.membership?.organization_id ?? ''

  useEffect(() => {
    if (!organizationId) return
    let active = true
    void branchService.list(organizationId).then((data) => {
      if (!active) return
      setBranches(data)
      setSelectedBranchId((current) => current || data[0]?.id || '')
    })
    return () => {
      active = false
    }
  }, [organizationId])

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId)
  if (!session?.membership) return <Navigate to="/onboarding" replace />

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-600 font-black text-white">J</div>
            <span className="text-lg font-bold tracking-tight text-ink-950">JugoSoft</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 sm:px-3 sm:text-sm" onClick={() => void authService.signOut()}>Cerrar sesión</button>
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 lg:hidden" aria-expanded={mobileMenuOpen} aria-controls="app-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? 'Cerrar menú' : '☰ Menú'}</button>
          </div>
        </div>
      </header>
      <section className="mx-auto grid w-full max-w-6xl min-w-0 grid-cols-[minmax(0,1fr)] gap-4 overflow-x-hidden px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav id="app-navigation" className={`${mobileMenuOpen ? 'block' : 'hidden'} h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:block`}>
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">Navegación</p>
          {([['inicio','Inicio'],['sucursales','Sucursales'],['catalogo','Catálogo'],['inventario','Inventario'],['produccion','Producción'],['ventas','Punto de Venta'],['tickets','Tickets'],['clientes','Clientes']] as const).map(([key,label])=><button key={key} onClick={()=>{setSection(key);setMobileMenuOpen(false)}} className={`mt-1 block w-full rounded-xl px-3 py-3 text-left text-sm font-medium transition ${section===key?'bg-brand-50 font-semibold text-brand-700':'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
        </nav>
        <div className="min-w-0 max-w-full overflow-x-hidden">
          {section==='inicio'&&<><p className="text-sm font-semibold text-brand-700">Panel de control</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-950">Tu operación empieza aquí</h1>
          <p className="mt-3 max-w-xl text-slate-600">Iniciaste sesión como <strong className="font-semibold text-slate-800">{session.email}</strong> con rol <strong className="font-semibold text-slate-800">{session.membership.role}</strong>.</p>
          {branches.length > 0 && (
            <label className="mt-6 inline-grid gap-1.5 text-sm font-semibold text-slate-700">
              Sucursal activa
              <select className="min-w-56 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)}>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </label>
          )}
          </>}
          {section==='sucursales'&&<div className="mt-2">
            <BranchesPanel organizationId={session.membership.organization_id} canManage={session.membership.role === 'admin'} />
          </div>}
          {section==='catalogo'&&<div className="mt-2">
            <CatalogPanel organizationId={session.membership.organization_id} canManage={session.membership.role === 'admin'} />
          </div>}
          {section==='clientes'&&<div className="mt-2">
            <ClientsPanel organizationId={session.membership.organization_id} canManage={session.membership.role === 'admin' || session.membership.role === 'cajero'} />
          </div>}
          {section==='ventas'&&selectedBranch&&<PointOfSalePanel organizationId={session.membership.organization_id} branchId={selectedBranch.id} memberId={session.membership.id} />}
          {section==='tickets'&&selectedBranch&&<TicketsPanel organizationId={session.membership.organization_id} branchId={selectedBranch.id} memberId={session.membership.id} />}
          {section==='inventario'&&selectedBranch&&(
            <div className="mt-2">
              <InventoryPanel organizationId={session.membership.organization_id} branchId={selectedBranch.id} branchName={selectedBranch.name} canManage={session.membership.role === 'admin' || session.membership.role === 'produccion'} />
            </div>
          )}
          {section==='produccion'&&selectedBranch&&(
            <div className="mt-2">
              <ProductionPanel organizationId={session.membership.organization_id} branchId={selectedBranch.id} branchName={selectedBranch.name} memberId={session.membership.id} canManage={session.membership.role === 'admin' || session.membership.role === 'produccion'} />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/onboarding" element={<RequireSession><OnboardingRoute /></RequireSession>} />
      <Route path="/app" element={<RequireSession><DashboardPage /></RequireSession>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
