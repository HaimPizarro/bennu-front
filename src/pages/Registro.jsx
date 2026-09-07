import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import { signUp, getSession, accountStatus, sendPasswordReset } from '../lib/api.js'
import '../styles/auth.css'

export default function Registro() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [existing, setExisting] = useState(null) // null | { type, email, recoverySent }
  const [sendingRecovery, setSendingRecovery] = useState(false)

  useEffect(() => {
    getSession().then((s) => {
      if (s) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  const presentExisting = (status, emailAddress) => {
    const providers = status?.providers || []
    const hasGoogle = providers.includes('google')
    const hasEmail = providers.includes('email')
    let type = 'generic'
    if (status && status.exists !== null) {
      type = hasGoogle && !hasEmail ? 'google' : hasEmail ? 'password' : 'generic'
    }
    setExisting({ type, email: emailAddress, recoverySent: false })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const status = await accountStatus(email)
      if (status?.exists) {
        presentExisting(status, email)
        return
      }
      const { session, existing: alreadyExists } = await signUp({ name, email, password })
      if (alreadyExists) {
        const status2 = await accountStatus(email)
        presentExisting(status2 || { exists: null, providers: [] }, email)
        return
      }
      if (session) {
        navigate('/mi-cuenta')
        return
      }
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecover = async () => {
    setError('')
    setSendingRecovery(true)
    try {
      await sendPasswordReset(email)
      setExisting((prev) => ({ ...prev, recoverySent: true }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingRecovery(false)
    }
  }

  const renderExisting = () => {
    const isGoogle = existing.type === 'google'
    const isPassword = existing.type === 'password'
    return (
      <div className="auth-note" role="status">
        <p className="auth-note__title">
          {isGoogle ? 'Cuenta creada con Google' : 'Ya existe una cuenta'}
        </p>
        {isGoogle ? (
          <p className="auth-note__body">
            Ya existe una cuenta para <strong>{existing.email}</strong> creada con Google. Esa
            cuenta no tiene contraseña, por lo que no se puede recuperar. Para acceder, utiliza
            la opción <strong>“Ingresar con Google”</strong> en la pantalla de inicio de sesión.
          </p>
        ) : (
          <p className="auth-note__body">
            Ya existe una cuenta para <strong>{existing.email}</strong>. No se envía ningún
            correo nuevo. {isPassword && 'Si olvidaste tu contraseña, puedes pedir un enlace para recuperarla.'}
          </p>
        )}

        {isGoogle ? (
          <Link className="btn btn--primary btn--block" to="/login">
            Ir a iniciar sesión
          </Link>
        ) : isPassword ? (
          existing.recoverySent ? (
            <div className="auth-note__sent" role="status">
              <p>
                Te enviamos un email para restablecer tu contraseña. Revisa tu bandeja de entrada
                y la carpeta de spam.
              </p>
              <Link className="btn btn--primary btn--block" to="/login">
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <p className="form__error" role="alert">
                  {error}
                </p>
              )}
              <div className="auth-note__actions">
                <button
                  className="btn btn--primary btn--block"
                  type="button"
                  disabled={sendingRecovery}
                  onClick={handleRecover}
                >
                  {sendingRecovery ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </button>
                <Link className="btn btn--ghost btn--block" to="/login">
                  Iniciar sesión
                </Link>
              </div>
            </>
          )
        ) : (
          <Link className="btn btn--primary btn--block" to="/login">
            Ir a iniciar sesión
          </Link>
        )}
      </div>
    )
  }

  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>

      <Link className="auth-back" to="/">
        ← Volver al inicio
      </Link>

      {done ? (
        <div className="form__success" role="status">
          <p className="form__success-title">Cuenta creada</p>
          <p>
            Te enviamos un email de confirmación a <strong>{email}</strong>. Revisa tu bandeja
            de entrada y haz clic en el enlace para activar la cuenta. Luego podrás iniciar
            sesión normalmente.
          </p>
          <Link className="btn btn--primary btn--block" to="/login">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : existing ? (
        renderExisting()
      ) : (
        <>
          <h1 className="auth-title">Crea tu cuenta</h1>
          <p className="auth-sub">
            Regístrate para reservar turnos, canjear puntos y gestionar tu membresía en Bennu.
          </p>

          <form className="form auth-form" onSubmit={submit}>
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__input"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="field__input"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Contraseña</span>
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
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link className="auth-link" to="/login">Inicia sesión</Link>
          </p>
        </>
      )}
    </AuthSplit>
  )
}
