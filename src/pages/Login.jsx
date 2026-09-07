import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import { login, loginWithGoogle, getSession, sendPasswordReset } from '../lib/api.js'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverSent, setRecoverSent] = useState(false)
  const [recoverError, setRecoverError] = useState('')
  const [recoverSending, setRecoverSending] = useState(false)

  useEffect(() => {
    getSession().then((s) => {
      if (s) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  const openRecover = () => {
    setRecoverEmail(email)
    setRecoverSent(false)
    setRecoverError('')
    setRecoverOpen(true)
  }

  const handleRecover = async (e) => {
    e.preventDefault()
    setRecoverError('')
    setRecoverSending(true)
    try {
      await sendPasswordReset(recoverEmail)
      setRecoverSent(true)
    } catch (err) {
      setRecoverError(err.message)
    } finally {
      setRecoverSending(false)
    }
  }

  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>

      <Link className="auth-back" to="/">
        ← Volver al inicio
      </Link>

      <h1 className="auth-title">Hola de nuevo</h1>
      <p className="auth-sub">Ingresa a tu cuenta para gestionar tu panel.</p>

      <form className="form auth-form" onSubmit={submit}>
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
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <div className="auth-row">
          <label className="auth-check">
            <input type="checkbox" />
            <span>Recordarme</span>
          </label>
          <button type="button" className="auth-link" onClick={openRecover}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      {recoverOpen && (
        <div className="auth-note auth-recover">
          {recoverSent ? (
            <>
              <p className="auth-note__title">Email enviado</p>
              <p className="auth-note__body">
                Si existe una cuenta para <strong>{recoverEmail}</strong>, te enviamos un enlace
                para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <button
                className="btn btn--ghost btn--block"
                type="button"
                onClick={() => setRecoverOpen(false)}
              >
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            <form className="form" onSubmit={handleRecover}>
              <p className="auth-note__title">Recuperar contraseña</p>
              <p className="auth-note__body">
                Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
              </p>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="field__input"
                  type="email"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              {recoverError && (
                <p className="form__error" role="alert">
                  {recoverError}
                </p>
              )}
              <div className="auth-note__actions">
                <button
                  className="btn btn--primary btn--block"
                  type="submit"
                  disabled={recoverSending}
                >
                  {recoverSending ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </button>
                <button
                  className="btn btn--ghost btn--block"
                  type="button"
                  onClick={() => setRecoverOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <p className="auth-switch">
        ¿No tienes cuenta? <Link className="auth-link" to="/registro">Regístrate</Link>
      </p>

      <div className="auth-divider">
        <span>O</span>
      </div>

      <button type="button" className="auth-google" onClick={handleGoogle}>
        <GoogleIcon />
        Ingresar con Google
      </button>
    </AuthSplit>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
