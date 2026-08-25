import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import AddToCalendarButton from '../components/AddToCalendarButton.jsx'
import { getPagoEstado, getCombo, getPublicBooking, crearPagoCanje } from '../lib/api.js'
import { formatCurrency } from '../lib/data.js'
import { formatDate } from '../lib/date.js'
import '../styles/auth.css'

const finalState = (estado) => {
  if (estado === 'aprobado') return 'paid'
  if (estado === 'rechazado' || estado === 'cancelado' || estado === 'expirado') return 'failed'
  return 'processing'
}

// Pago de la diferencia de un canje (tipo 'combo'). Maneja el formulario y los
// estados de resultado inline: MP redirige de vuelta a esta misma ruta.
export default function PagoCanje() {
  const { pagoId } = useParams()
  const [searchParams] = useSearchParams()

  const [pago, setPago] = useState(null)
  const [combo, setCombo] = useState(null)
  const [booking, setBooking] = useState(null)
  const [status, setStatus] = useState('checking')
  const [errorMsg, setErrorMsg] = useState('')
  const popupRef = useRef(null)

  // Carga inicial: pago + combo + cita ancla para el resumen.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getPagoEstado(pagoId)
      if (!alive) return
      if (!p || p.tipo !== 'combo') {
        setStatus('notFound')
        return
      }
      setPago(p)
      const [cb, bk] = await Promise.all([
        getCombo(p.promotion_id),
        p.appointment_id ? getPublicBooking(p.appointment_id) : Promise.resolve(null),
      ])
      if (!alive) return
      setCombo(cb)
      setBooking(bk)
      if (p.estado === 'aprobado') setStatus('paid')
      else if (p.estado === 'pendiente') setStatus(searchParams.get('resultado') ? 'processing' : 'idle')
      else setStatus('failed')
    })()
    return () => {
      alive = false
    }
  }, [pagoId, searchParams])

  // Polling: confirma con el backend hasta el estado final. Corré desde que se
  // abre MP ('redirecting') y tras el retorno ('processing').
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
          setErrorMsg('Todavía no confirmamos el pago. Revisa tu canje desde "Mi cuenta" en unos minutos.')
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

    crearPagoCanje(pagoId)
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

  const [bDate, bTime] = booking ? String(booking.fecha_hora).split('T') : []
  const monto = pago?.monto_total ?? combo?.price ?? 0

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
          <p className="eyebrow">Canje</p>
          <h1 className="auth-title">No encontramos el pago</h1>
          <p className="muted">Revisa el link o vuelve a canjear desde tu cuenta.</p>
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
          <h1 className="auth-title">{status === 'processing' ? 'Verificando tu pago…' : 'Abriendo Mercado Pago…'}</h1>
          <p className="muted">Se abrió una pestaña con Mercado Pago. Completa el pago ahí; esta página se actualiza sola.</p>
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
          <p className="muted">{errorMsg || 'Puedes reintentar el pago de la diferencia.'}</p>
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
          <p className="eyebrow">Canje pagado</p>
          <h1 className="auth-title">¡Tu canje fue confirmado!</h1>
          <p className="muted">La diferencia fue abonada y tus turnos quedaron confirmados.</p>

          <dl className="summary-dl">
            <dt>Canje</dt>
            <dd>{combo?.name || 'Servicios combinados'}</dd>
            {bDate && (
              <>
                <dt>Fecha</dt>
                <dd>
                  {formatDate(bDate)} a las {bTime?.slice(0, 5)} hs
                </dd>
              </>
            )}
            <dt>Abonado</dt>
            <dd>{formatCurrency(monto)}</dd>
          </dl>

          {bDate && (
            <AddToCalendarButton
              title={`Canje — ${combo?.name || 'bennu'}`}
              startDate={bDate}
              startTime={bTime?.slice(0, 5)}
              durationMin={booking?.services?.duracion_minutos || 60}
              location="bennu — cosmetología studio"
              className="btn btn--ghost"
            />
          )}

          <Link className="btn btn--primary" to="/mi-cuenta">
            Volver a mi cuenta
          </Link>
        </div>
      </AuthSplit>
    )
  }

  // status === 'idle': formulario de pago de la diferencia.
  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>
      <div className="auth-center">
        <p className="eyebrow">Canje</p>
        <h1 className="auth-title">Completa el pago de la diferencia</h1>

        <dl className="summary-dl">
          <dt>Canje</dt>
          <dd>{combo?.name || 'Servicios combinados'}</dd>
          {bDate && (
            <>
              <dt>Fecha</dt>
              <dd>
                {formatDate(bDate)} a las {bTime?.slice(0, 5)} hs
              </dd>
            </>
          )}
          <dt>Diferencia a abonar</dt>
          <dd>{formatCurrency(monto)}</dd>
        </dl>

        <form className="form auth-form" onSubmit={pay}>
          <button className="btn btn--primary btn--block" type="submit">
            Pagar diferencia {formatCurrency(monto)}
          </button>
          {errorMsg && <p className="form__error">{errorMsg}</p>}
          <p className="form__hint">
            Pagas de forma segura con Mercado Pago. Tus turnos quedan reservados por 1 hora mientras completas
            el pago; los puntos se descuentan al confirmarse.
          </p>
        </form>
      </div>
    </AuthSplit>
  )
}