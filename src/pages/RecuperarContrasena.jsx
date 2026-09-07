import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import { supabase } from '../lib/supabaseClient.js'
import '../styles/auth.css'

export default function RecuperarContrasena() {
  const [phase, setPhase] = useState('idle') // idle | form | done | invalid
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPhase((prev) => (prev === 'idle' ? 'form' : prev))
      }
    })

    // Fuerza el parseo de los tokens del enlace de recuperación (implicit flow).
    supabase.auth.getSession().catch(() => {})

    const timeout = setTimeout(() => {
      setPhase((prev) => (prev === 'idle' ? 'invalid' : prev))
    }, 5000)

    return () => {
      subscription?.subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      setPhase('done')
    } catch (err) {
      const msg = String(err.message || '').toLowerCase()
      if (msg.includes('no password') || msg.includes('google')) {
        setError('Esta cuenta se creó con Google y no tiene contraseña. Usa "Ingresar con Google".')
      } else {
        setError('No se pudo actualizar la contraseña. Intenta solicitar un nuevo enlace.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>

      <Link className="auth-back" to="/">
        ← Volver al inicio
      </Link>

      {phase === 'form' && (
        <>
          <h1 className="auth-title">Crea una nueva contraseña</h1>
          <p className="auth-sub">Elige una contraseña nueva para tu cuenta. Mínimo 6 caracteres.</p>

          <form className="form auth-form" onSubmit={submit}>
            <label className="field">
              <span className="field__label">Nueva contraseña</span>
              <input
                className="field__input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </form>

          <p className="auth-switch">
            <Link className="auth-link" to="/login">Volver a iniciar sesión</Link>
          </p>
        </>
      )}

      {phase === 'done' && (
        <div className="form__success" role="status">
          <p className="form__success-title">Contraseña actualizada</p>
          <p>Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con ella.</p>
          <Link className="btn btn--primary btn--block" to="/login">
            Ir a iniciar sesión
          </Link>
        </div>
      )}

      {phase === 'invalid' && (
        <div className="auth-note" role="status">
          <p className="auth-note__title">Enlace no válido</p>
          <p className="auth-note__body">
            Este enlace de recuperación es inválido o ya fue utilizado. Solicita uno nuevo desde
            la pantalla de inicio de sesión.
          </p>
          <Link className="btn btn--primary btn--block" to="/login">
            Solicitar otro enlace
          </Link>
        </div>
      )}

      {phase === 'idle' && (
        <p className="auth-sub">Verificando el enlace de recuperación…</p>
      )}
    </AuthSplit>
  )
}
