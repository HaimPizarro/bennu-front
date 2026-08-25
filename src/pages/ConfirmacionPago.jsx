import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import AddToCalendarButton from '../components/AddToCalendarButton.jsx'
import { getPagoEstado, getPagoPorReserva, getPublicBooking } from '../lib/api.js'
import { formatCurrency } from '../lib/data.js'
import { formatDate } from '../lib/date.js'
import '../styles/auth.css'

const pagoIdFromRef = (ref) => Number(String(ref || '').replace('bennu-pago-', '')) || null

const finalState = (estado) => {
  if (estado === 'aprobado') return 'paid'
  if (estado === 'rechazado' || estado === 'cancelado' || estado === 'expirado') return 'failed'
  return 'processing'
}

export default function ConfirmacionPago() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()

  const [booking, setBooking] = useState(null)
  const [service, setService] = useState(null)
  const [pago, setPago] = useState(null)
  const [status, setStatus] = useState('checking')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let alive = true
    getPublicBooking(bookingId).then((b) => {
      if (!alive) return
      if (!b) {
        setStatus('notFound')
        return
      }
      setBooking(b)
      setService(b.services || null)
      if (b.estado === 'Cancelada') {
        setStatus('cancelled')
        return
      }
      if (b.estado === 'Confirmada' || b.estado === 'Completada') {
        setStatus('paid')
        return
      }
      setStatus('processing')
    })
    return () => {
      alive = false
    }
  }, [bookingId])

  // Reconciliación: confirma el pago contra el backend (webhook + MP) hasta
  // llegar a un estado final. Si la URL no trae external_reference, busca el
  // pago por la reserva.
  useEffect(() => {
    if (status !== 'processing') return undefined

    const pagoId = pagoIdFromRef(searchParams.get('external_reference'))
    const paymentId = Number(searchParams.get('payment_id')) || null
    let turns = 0
    let timer

    const tick = async () => {
      turns += 1
      try {
        let pagoRow = pagoId ? await getPagoEstado(pagoId, paymentId) : null
        if (!pagoRow) pagoRow = await getPagoPorReserva(bookingId)
        if (pagoRow) {
          const next = finalState(pagoRow.estado)
          if (next !== 'processing') {
            clearInterval(timer)
            setPago(pagoRow)
            setStatus(next)
            return
          }
        }
      } catch {
        // reintentar en el próximo tick
      }
      if (turns >= 25) {
        clearInterval(timer)
        setErrorMsg('Todavía no confirmamos el pago. Revisa tu turno desde "Mi cuenta" en unos minutos.')
      }
    }

    timer = setInterval(tick, 3000)
    tick()
    return () => clearInterval(timer)
  }, [status, searchParams, bookingId])

  const [bDate, bTime] = booking ? String(booking.fecha_hora).split('T') : []
  const montoPagado = pago?.monto_total ?? service?.precio_oferta ?? service?.precio

  if (status === 'checking' || status === 'processing') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          <div className="spinner" aria-hidden="true" />
          <p className="eyebrow">Pago</p>
          <h1 className="auth-title">{status === 'processing' ? 'Verificando tu pago…' : 'Cargando…'}</h1>
          <p className="muted">Estamos confirmando el pago con Mercado Pago. Esto toma unos segundos.</p>
        </div>
      </AuthSplit>
    )
  }

  if (status === 'notFound' || status === 'cancelled') {
    return (
      <AuthSplit>
        <span className="auth-logo">bennu</span>
        <div className="auth-center">
          {status === 'cancelled' ? (
            <>
              <p className="eyebrow">Reserva vencida</p>
              <h1 className="auth-title">Tu turno fue cancelado</h1>
              <p className="muted">
                No se completó el pago dentro de la hora reservada y el turno quedó liberado. Reserva un
                nuevo horario cuando quieras.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">Reserva</p>
              <h1 className="auth-title">No encontramos la reserva</h1>
              <p className="muted">Revisa el link o vuelve a reservar tu turno.</p>
            </>
          )}
          <Link className="btn btn--primary" to="/agenda">
            Ir a la agenda
          </Link>
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
          <p className="muted">{errorMsg || 'Puedes reintentar el pago o elegir otro horario.'}</p>
          <Link className="btn btn--primary" to={`/pago/${bookingId}`}>
            Reintentar pago
          </Link>
          <Link className="btn btn--ghost" to="/agenda">
            Elegir otro horario
          </Link>
        </div>
      </AuthSplit>
    )
  }

  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>
      <div className="auth-center">
        <span className="check-ring" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="check-path" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <p className="eyebrow">Pago aprobado</p>
        <h1 className="auth-title">¡Tu cita fue creada y pagada con éxito!</h1>
        <p className="muted">
          Recibimos el pago y tu turno quedó confirmado. Guardalo en tu calendario para no perderlo.
        </p>

        <dl className="summary-dl">
          <dt>Servicio</dt>
          <dd>{service?.nombre || 'Servicio'}</dd>
          <dt>Fecha</dt>
          <dd>
            {formatDate(bDate)} a las {bTime?.slice(0, 5)} hs
          </dd>
          {service?.duracion_minutos && (
            <>
              <dt>Duración</dt>
              <dd>{service.duracion_minutos} min</dd>
            </>
          )}
          {montoPagado != null && (
            <>
              <dt>Abonado</dt>
              <dd>{formatCurrency(montoPagado)}</dd>
            </>
          )}
        </dl>

        <AddToCalendarButton
          title={`Turno — ${service?.nombre || 'bennu'}`}
          startDate={bDate}
          startTime={bTime?.slice(0, 5)}
          durationMin={service?.duracion_minutos || 60}
          location="bennu — cosmetología studio"
          className="btn btn--ghost"
        />

        <Link className="btn btn--primary" to="/">
          Volver al inicio
        </Link>
      </div>
    </AuthSplit>
  )
}