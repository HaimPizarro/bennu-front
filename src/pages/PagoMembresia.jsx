import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import { getPagoEstado, crearPagoMembresia } from '../lib/api.js'
import { formatCurrency } from '../lib/data.js'
import { formatDate } from '../lib/date.js'
import '../styles/auth.css'

const finalState = (estado) => {
  if (estado === 'aprobado') return 'paid'
  if (estado === 'rechazado' || estado === 'cancelado' || estado === 'expirado') return 'failed'
  return 'processing'
}

// Pago de la membresía mensual (tipo 'suscripcion'). Maneja el formulario y los
// estados de resultado inline: MP redirige de vuelta a esta misma ruta.
export default function PagoMembresia() {
  const { pagoId } = useParams()
  const [searchParams] = useSearchParams()

  const [pago, setPago] = useState(null)
  const [status, setStatus] = useState('checking')
  const [errorMsg, setErrorMsg] = useState('')
  const popupRef = useRef(null)

  // Carga inicial: pago para el resumen.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getPagoEstado(pagoId)
      if (!alive) return
      if (!p || p.tipo !== 'suscripcion') {
        setStatus('notFound')
        return
      }
      setPago(p)
      if (p.estado === 'aprobado') setStatus('paid')
      else if (p.estado === 'pendiente') setStatus(searchParams.get('resultado') ? 'processing' : 'idle')
      else setStatus('failed')
    })()
    return () => {
      alive = false
    }
  }, [pagoId, searchParams])

  // Polling: confirma con el backend hasta el estado final.
  useEffect(() => {
    if (status !== 'redirecting' && status !== 'processing') return undefined

    const paymentId = Number(searchParams.get('payment_id')) || null
    const maxTurns = status === 'redirecting' ? 300 : 25
    let turns = 0
    let timer

    const tick = async () => {
      turns += 1
      try {
        const pagoRow = await getPagoEstado(pagoId, paymentId)
        if (pagoRow) {
          const next = finalState(pagoRow.estado)
          if (next !== 'processing') {
            clearInterval(timer)
            setPago(pagoRow)
            setStatus(next)
            if (popupRef.current) {
              popupRef.current.close()
              popupRef.current = null
            }
            return
          }
        }
      } catch {
        // reintentar en el próximo tick
      }
      if (turns >= maxTurns) {
        clearInterval(timer)
        if (status === 'redirecting') {
          setErrorMsg('Todavía no confirmamos el pago. Si ya pagaste, cierra la ventana de Mercado Pago y reintenta.')
          setStatus('idle')
        } else {
          setErrorMsg('Todavía no confirmamos el pago. Revisa tu membresía desde "Mi cuenta" en unos minutos.')
        }
      }
    }

    timer = setInterval(tick, 3000)
    tick()
    return () => clearInterval(timer)
  }, [status, searchParams, pagoId])

  const pay = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setStatus('redirecting')

    const win = window.open('', '_blank')
    popupRef.current = win

    crearPagoMembresia(pagoId)
      .then((res) => {
        if (!res?.init_point) throw new Error('No se pudo generar el pago')
        if (win) win.location.assign(res.init_point)
        else window.location.assign(res.init_point)
      })
      .catch((err) => {
        if (win) win.close()
        setErrorMsg(err.message || 'Error al generar el pago')
        setStatus('idle')
      })
  }

  const monto = pago?.monto_total ?? 0
  const puntos = Number(pago?.detalle?.puntos_mes) || 0
  const planNombre = pago?.detalle?.concepto || 'Membresía mensual'
  const validaHasta = pago?.updated_at ? String(pago.updated_at).slice(0, 10) : null

  if (status === 'checking') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          <div className="spinner" aria-hidden="true" />
          <p className="muted">Cargando…</p>
        </div>
      </AuthSplit>
    )
  }

  if (status === 'notFound') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          <p className="eyebrow">Membresía</p>
          <h1 className="auth-title">No encontramos el pago</h1>
          <p className="muted">Revisa el link o vuelve a intentarlo desde tu cuenta.</p>
          <Link className="btn btn--primary" to="/mi-cuenta">
            Ir a mi cuenta
          </Link>
        </div>
      </AuthSplit>
    )
  }

  if (status === 'redirecting' || status === 'processing') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          <div className="spinner" aria-hidden="true" />
          <p className="eyebrow">Pago</p>
          <h1 className="auth-title">
            {status === 'processing' ? 'Verificando tu pago…' : 'Abriendo Mercado Pago…'}
          </h1>
          <p className="muted">
            Se abrió una pestaña con Mercado Pago. Completa el pago ahí; esta página se actualiza sola.
          </p>
        </div>
      </AuthSplit>
    )
  }

  if (status === 'failed') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          <p className="eyebrow">Pago no confirmado</p>
          <h1 className="auth-title">Todavía no pudimos confirmar el pago</h1>
          <p className="muted">{errorMsg || 'Puedes reintentar el pago de la membresía.'}</p>
          <button className="btn btn--primary" type="button" onClick={pay}>
            Reintentar pago
          </button>
          <Link className="btn btn--ghost" to="/mi-cuenta">
            Ir a mi cuenta
          </Link>
        </div>
      </AuthSplit>
    )
  }

  if (status === 'paid') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          <span className="check-ring" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="check-path" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="eyebrow">Membresía pagada</p>
          <h1 className="auth-title">¡Tu membresía quedó activa!</h1>
          <p className="muted">
            Ya puedes aprovechar los descuentos en tus servicios.
            {puntos > 0 && ` Sumaste +${puntos} pts de fidelización.`}
          </p>

          <dl className="summary-dl">
            <dt>Membresía</dt>
            <dd>{planNombre}</dd>
            <dt>Abonado</dt>
            <dd>{formatCurrency(monto)}</dd>
            <dt>Vigente desde</dt>
            <dd>{validaHasta ? formatDate(validaHasta) : 'hoy'}</dd>
            {puntos > 0 && (
              <>
                <dt>Puntos</dt>
                <dd>+{puntos} pts</dd>
              </>
            )}
          </dl>

          <Link className="btn btn--primary" to="/mi-cuenta">
            Volver a mi cuenta
          </Link>
        </div>
      </AuthSplit>
    )
  }

  // status === 'idle': formulario de pago de la membresía.
  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>
      <div className="auth-center">
        <p className="eyebrow">Membresía</p>
        <h1 className="auth-title">Completa el pago de tu membresía</h1>

        <dl className="summary-dl">
          <dt>Membresía</dt>
          <dd>{planNombre}</dd>
          <dt>Monto</dt>
          <dd>{formatCurrency(monto)}</dd>
          {puntos > 0 && (
            <>
              <dt>Puntos</dt>
              <dd>+{puntos} pts al activarla</dd>
            </>
          )}
        </dl>

        <form className="form auth-form" onSubmit={pay}>
          <button className="btn btn--primary btn--block" type="submit">
            Pagar {formatCurrency(monto)}
          </button>
          {errorMsg && <p className="form__error">{errorMsg}</p>}
          <p className="form__hint">
            Pagas de forma segura con Mercado Pago. La membresía queda activa por 30 días y se puede
            renovar desde «Mi cuenta».
          </p>
        </form>
      </div>
    </AuthSplit>
  )
}