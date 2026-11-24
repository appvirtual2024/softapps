import { useState, type FormEvent } from 'react'
import { authService } from '../auth.service'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function messageFor(error: unknown) {
    if (!(error instanceof Error)) return 'Ocurrió un error inesperado'
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return 'Tu correo aún no está confirmado. Solicita un nuevo enlace de confirmación.'
    }
    return error.message
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await authService.signUp(email, password, fullName)
        setConfirmationEmail(email)
        setInfo('Cuenta creada. Si tu proyecto pide confirmación por correo, revisa tu bandeja antes de iniciar sesión.')
      } else {
        await authService.signIn(email, password)
      }
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleResendConfirmation() {
    if (!confirmationEmail) return
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await authService.resendConfirmation(confirmationEmail)
      setInfo(`Enviamos un nuevo enlace de confirmación a ${confirmationEmail}. Revisa también Spam.`)
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-brand-50 via-white to-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="mb-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-black text-white shadow-lg shadow-brand-600/25">
            J
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-950">JugoSoft</h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'signup' ? 'Crea tu cuenta para administrar tu negocio.' : 'Ingresa para continuar con tu operación.'}
          </p>
        </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Nombre completo
            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              placeholder="Tu nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
        )}
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Correo electrónico
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            type="email"
            placeholder="correo@negocio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Contraseña
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <button className="mt-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>
          {busy ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{info}</p>}

      {confirmationEmail && mode === 'signup' && (
        <button className="mt-4 w-full rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60" type="button" onClick={() => void handleResendConfirmation()} disabled={busy}>
          Reenviar confirmación
        </button>
      )}

      <button
        className="mt-6 w-full text-sm font-semibold text-brand-700 hover:text-brand-600"
        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
      >
        {mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
      </section>
    </main>
  )
}
