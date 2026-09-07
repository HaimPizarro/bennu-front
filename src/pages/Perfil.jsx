import { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import useSessionAuth from '../hooks/useSessionAuth.js'
import { useVisitor } from '../context/visitanteContext.js'
import {
  updateMiPerfil,
  guardarVisitante,
  eliminarMiCuenta,
  logout,
} from '../lib/api.js'
import { toast } from '../lib/toast.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import '../styles/perfil.css'

export default function Perfil() {
  const { session, loading } = useSessionAuth()
  const { ready } = useVisitor()

  if (loading || !ready) return <p className="muted">Cargando tu perfil…</p>
  if (!session) return <Navigate to="/login" replace />

  return <PerfilContent session={session} key={session.user.id} />
}

function PerfilContent({ session }) {
  const navigate = useNavigate()
  const perfil = session.perfil || {}
  const { profile, syncProfile } = useVisitor()

  const [nombre, setNombre] = useState(perfil.nombre || '')
  const [telefono, setTelefono] = useState(perfil.telefono || '')
  const [alias, setAlias] = useState(profile?.alias || '')
  const [edad, setEdad] = useState(profile?.edad != null ? String(profile.edad) : '')
  const [busy, setBusy] = useState('') // '' | 'cuenta' | 'welcome' | 'delete'
  const [confirmDelete, setConfirmDelete] = useState(false)

  const initials = (nombre || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

  const isAdmin = Number(perfil.rol) === 0
  const backTo = isAdmin ? '/dashboard' : '/mi-cuenta'

  const saveAccount = async (e) => {
    e.preventDefault()
    setBusy('cuenta')
    try {
      await updateMiPerfil({ nombre: nombre.trim(), telefono: telefono.trim() })
      toast.success('Datos de contacto actualizados.')
    } catch (error) {
      toast.error(error.message || 'No se pudieron actualizar tus datos.')
    } finally {
      setBusy('')
    }
  }

  const saveWelcome = async (e) => {
    e.preventDefault()
    const edadNum = edad.trim() === '' ? null : Number(edad)
    if (edad.trim() !== '' && (!Number.isInteger(edadNum) || edadNum < 0 || edadNum > 120)) {
      toast.error('La edad debe ser un número entre 0 y 120 (o déjala vacía).')
      return
    }
    setBusy('welcome')
    try {
      const saved = await guardarVisitante({
        nombre: nombre.trim() || perfil.nombre,
        alias: alias.trim(),
        edad: edadNum,
      })
      syncProfile({
        user_id: session.user.id,
        nombre: saved.nombre,
        alias: saved.alias,
        edad: saved.edad ?? null,
      })
      toast.success('Tu bienvenida quedó guardada.')
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar tu bienvenida.')
    } finally {
      setBusy('')
    }
  }

  const deleteAccount = async () => {
    setBusy('delete')
    try {
      await eliminarMiCuenta()
      await logout()
      toast.success('Tu cuenta fue eliminada.')
      navigate('/')
    } catch (error) {
      setConfirmDelete(false)
      toast.error(error.message || 'No se pudo eliminar tu cuenta.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="perfil">
      <header className="perfil__bar">
        <Link className="perfil__brand" to="/">
          bennu
        </Link>
        <Link className="perfil__back" to={backTo}>
          ← Volver al panel
        </Link>
      </header>

      <main className="perfil__main">
        <section className="perfil__hero">
          <span className="perfil__avatar">{initials}</span>
          <div>
            <h1 className="perfil__title">{nombre || 'Tu perfil'}</h1>
            <p className="perfil__email">{perfil.email || ''}</p>
          </div>
        </section>

        {/* Información personal */}
        <section className="perfil-card">
          <h2 className="perfil-card__title">Información personal</h2>
          <p className="perfil-card__hint">
            Tu nombre y teléfono aparecen en tus citas y comunicaciones con Bennu.
          </p>
          <form className="perfil-form" onSubmit={saveAccount}>
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__input"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Correo electrónico</span>
              <input className="field__input" type="email" value={perfil.email || ''} disabled readOnly />
              <span className="field__hint">Lo gestiona tu proveedor de acceso (Google o email).</span>
            </label>
            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                className="field__input"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 …"
                autoComplete="tel"
              />
            </label>
            <button className="btn btn--primary" type="submit" disabled={busy === 'cuenta'}>
              {busy === 'cuenta' ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        {/* Bienvenida */}
        <section className="perfil-card">
          <h2 className="perfil-card__title">Bienvenida personalizada</h2>
          <p className="perfil-card__hint">
            Con estos datos te saludamos por tu nombre cuando visitas la página.
          </p>
          <form className="perfil-form" onSubmit={saveWelcome}>
            <label className="field">
              <span className="field__label">Alias (como te gusta que te llamen)</span>
              <input
                className="field__input"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej: Ani, Vale, Gabo"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Edad (opcional)</span>
              <input
                className="field__input"
                type="number"
                min="0"
                max="120"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                placeholder="Solo si quieres compartirla"
              />
            </label>
            <button className="btn btn--primary" type="submit" disabled={busy === 'welcome'}>
              {busy === 'welcome' ? 'Guardando…' : 'Guardar bienvenida'}
            </button>
          </form>
        </section>

        {/* Seguridad */}
        <section className="perfil-card">
          <h2 className="perfil-card__title">Seguridad</h2>
          <p className="perfil-card__hint">
            Tu contraseña la gestiona el proveedor con el que iniciaste sesión (correo o Google).
            Si olvidaste tu contraseña, puedes recuperarla desde la pantalla de acceso.
          </p>
          <Link className="btn btn--ghost" to="/login">
            Recuperar contraseña
          </Link>
        </section>

        {/* Zona de riesgo */}
        <section className="perfil-card perfil-card--danger">
          <h2 className="perfil-card__title">Eliminar cuenta</h2>
          <p className="perfil-card__hint">
            Si eliminas tu cuenta se borran tus datos de forma permanente. No podrás eliminarla
            si tienes citas, pagos o membresías registradas (para no perder el historial).
          </p>
          <button
            className="btn btn--danger"
            type="button"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar mi cuenta
          </button>
        </section>
      </main>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar tu cuenta"
          message="Esto borrará tu cuenta y tus datos de bienvenida de forma permanente. Esta acción no se puede deshacer."
          confirmLabel={busy === 'delete' ? 'Eliminando…' : 'Eliminar mi cuenta'}
          onConfirm={deleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
