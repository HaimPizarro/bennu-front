import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import { login, loginWithGoogle, getSession } from '../lib/api.js'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>

      <Link className="auth-back" to="/">
        ← Volver al inicio
      </Link>

      <h1 className="auth-title">Welcome back!</h1>
      <p className="auth-sub">Ingresa a tu cuenta para gestionar tu panel.</p>

      <form className="form auth-form" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Email Address</span>
          <input
            className="field__input"
            type="email"
            placeholder="e.g nobeijoan@******.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="field__input"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <div className="auth-row">
          <label className="auth-check">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            className="auth-link"
            onClick={() => setError('La recuperación de cuenta se conectará próximamente.')}
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Login'}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <span className="auth-link">Sign Up</span>
      </p>

      <div className="auth-divider">
        <span>Or</span>
      </div>

      <button type="button" className="auth-google" onClick={handleGoogle}>
        <GoogleIcon />
        Sign in with Google
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