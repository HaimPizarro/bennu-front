import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AuthSplit from '../components/AuthSplit.jsx'
import AddToCalendarButton from '../components/AddToCalendarButton.jsx'
import { cancelPublicBooking, crearPagoReserva, getPagoEstado, getPagoPorReserva, getPublicBooking } from '../lib/api.js'
import { formatCurrency } from '../lib/data.js'
import { formatDate } from '../lib/date.js'
import '../styles/auth.css'

const pagoIdFromRef = (ref) => Number(String(ref || '').replace('bennu-pago-', '')) || null

const finalState = (estado) => {
  if (estado === 'aprobado') return 'paid'
  if (estado === 'rechazado' || estado === 'cancelado' || estado === 'expirado') return 'failed'
  return 'processing'
}

export default function Payment() {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [service, setService] = useState(null)
  const [pago, setPago] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [paymentState, setPaymentState] = useState(
    () => (searchParams.get('resultado') ? 'processing' : 'idle'),
  )
  const [errorMsg, setErrorMsg] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const popupRef = useRef(null)

  useEffect(() => {
    let alive = true
    getPublicBooking(bookingId).then((b) => {
      if (!alive) return
      if (!b) {
        setNotFound(true)
        return
      }
      setBooking(b)
      setService(b.services || null)
      if (b.estado === 'Confirmada' || b.estado === 'Completada') setPaymentState('paid')
    })
    return () => {
      alive = false
    }
  }, [bookingId])

  // Polling: confirma con el backend (webhook + reconciliación contra MP)
  // hasta que el pago quede en un estado final. Corré desde que se abre MP
  // ('redirecting') y tras el retorno ('processing'): así, aunque MP no nos
  // devuelva (ej. localhost), la pestaña original detecta el pago sola.
  useEffect(() => {
    if (paymentState !== 'redirecting' && paymentState !== 'processing') return undefined

    const pagoId = pagoIdFromRef(searchParams.get('external_reference'))
    const paymentId = Number(searchParams.get('payment_id')) || null
    const maxTurns = paymentState === 'redirecting' ? 300 : 25
    let turns = 0
    let timer

    const tick = async () => {
      turns += 1
      try {
        let pago = pagoId ? await getPagoEstado(pagoId, paymentId) : null
        if (!pago) pago = await getPagoPorReserva(bookingId)
        if (pago) {
          const next = finalState(pago.estado)
          if (next !== 'processing') {
            clearInterval(timer)
            setPago(pago)
            setPaymentState(next)
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
        if (paymentState === 'redirecting') {
          setErrorMsg('Todavía no confirmamos el pago. Si ya pagaste, cierra la ventana de Mercado Pago y reintenta.')
          setPaymentState('idle')
        } else {
          setErrorMsg('Todavía no confirmamos el pago. Revisa tu turno desde "Mi cuenta" en unos minutos.')
        }
      }
    }

    timer = setInterval(tick, 3000)
    tick()
    return () => clearInterval(timer)
  }, [paymentState, searchParams, bookingId])

  const pay = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setPaymentState('redirecting')

    // Abre una ventana vacía en el gesto del click (para no caer en el
    // popup-blocker); se llena con el init_point apenas llegue de MP.
    const win = window.open('', '_blank')
    popupRef.current = win

    crearPagoReserva(bookingId)
      .then((res) => {
        if (!res?.init_point) throw new Error('No se pudo generar el pago')
        if (win) win.location.assign(res.init_point)
        else window.location.assign(res.init_point)
      })
      .catch((err) => {
        if (win) win.close()
        setErrorMsg(err.message || 'Error al generar el pago')
        setPaymentState('idle')
      })
  }

  // Cancela la reserva (libera el turno) y vuelve a la agenda.
  const cancelar = async (e) => {
    e.preventDefault()
    setCancelling(true)
    setErrorMsg('')
    try {
      await cancelPublicBooking(bookingId)
      navigate('/agenda')
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cancelar la reserva')
      setCancelling(false)
    }
  }

  const [bDate, bTime] = booking ? String(booking.fecha_hora).split('T') : []
  const precioBase = Number(service?.precio_oferta ?? service?.precio) || 0
  const descuentoSusc = booking?.suscripcion_activa ? Number(service?.descuento_suscripcion) || 0 : 0
  const precioFinal =
    descuentoSusc > 0 ? Math.round(precioBase * (1 - descuentoSusc / 100) * 100) / 100 : precioBase
  const montoPagado = pago?.monto_total ?? precioFinal

  return (
    <AuthSplit>
      <span className="auth-logo">bennu</span>

      {notFound ? (
        <div className="auth-center">
          <p className="eyebrow">Reserva</p>
          <h1 className="auth-title">No encontramos la reserva</h1>
          <p className="muted">Revisa el link o vuelve a reservar tu turno.</p>
          <Link className="btn btn--primary" to="/agenda">
            Ir a la agenda
          </Link>
        </div>
      ) : paymentState === 'paid' ? (
        <div className="auth-center">
          <p className="eyebrow">Pago aprobado</p>
          <h1 className="auth-title">Turno confirmado</h1>
          <p className="muted">Gracias por tu reserva. Guarda el turno en tu calendario para no perderlo.</p>

          <dl className="summary-dl">
            <dt>Servicio</dt>
            <dd>{service?.nombre || 'Servicio'}</dd>
            <dt>Fecha</dt>
            <dd>
              {formatDate(bDate)} a las {bTime.slice(0, 5)} hs
            </dd>
            {montoPagado != null && (
              <>
                <dt>Abonado</dt>
                <dd>{formatCurrency(montoPagado)}</dd>
              </>
            )}
          </dl>

          <AddToCalendarButton
            title={`Turno — ${service?.nombre}`}
            startDate={bDate}
            startTime={bTime.slice(0, 5)}
            durationMin={service?.duration || 60}
            location="bennu — cosmetología studio"
            className="btn btn--ghost"
          />

          <Link className="btn btn--primary" to="/">
            Volver al inicio
          </Link>
        </div>
      ) : paymentState === 'failed' ? (
        <div className="auth-center">
          <p className="eyebrow">Pago rechazado</p>
          <h1 className="auth-title">No pudimos procesar el pago</h1>
          <p className="muted">Puedes reintentar el pago o volver a elegir otro horario.</p>
          <button className="btn btn--primary" type="button" onClick={pay}>
            Reintentar pago
          </button>
          <button className="btn btn--ghost" type="button" onClick={cancelar} disabled={cancelling}>
            {cancelling ? 'Cancelando…' : 'Cancelar y volver'}
          </button>
        </div>
      ) : booking ? (
        <>
          <p className="eyebrow">Pago</p>
          <h1 className="auth-title">Confirma tu reserva</h1>

          <dl className="summary-dl">
            <dt>Servicio</dt>
            <dd>{service?.nombre || 'Servicio eliminado'}</dd>
            <dt>Fecha</dt>
            <dd>
              {formatDate(bDate)} a las {bTime.slice(0, 5)} hs
            </dd>
            {booking?.user_id && service?.puntos_otorgados > 0 && (
              <>
                <dt>Puntos a sumar</dt>
                <dd>+{service.puntos_otorgados} pts de fidelización</dd>
              </>
            )}
            {booking?.respuestas && Object.keys(booking.respuestas).length > 0 && (
              <>
                {Object.entries(booking.respuestas).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{Array.isArray(value) ? value.join(', ') : value}</dd>
                  </div>
                ))}
              </>
            )}
            <dt>Total</dt>
            <dd>
              {descuentoSusc > 0 ? (
                <>
                  <s className="price--old">{formatCurrency(precioBase)}</s>{' '}
                  <span className="price--offer">
                    {formatCurrency(precioFinal)}
                    <span className="payment-badge">membresía -{descuentoSusc}%</span>
                  </span>
                </>
              ) : service?.precio_oferta ? (
                <>
                  <s className="price--old">{formatCurrency(service.precio)}</s>{' '}
                  <span className="price--offer">{formatCurrency(service.precio_oferta)}</span>
                </>
              ) : (
                formatCurrency(service?.precio)
              )}
            </dd>
          </dl>

          <form className="form auth-form" onSubmit={pay}>
            <button className="btn btn--primary btn--block" type="submit" disabled={paymentState !== 'idle'}>
              {paymentState === 'redirecting'
                ? 'Abriendo Mercado Pago…'
                : `Pagar ${formatCurrency(precioFinal)}`}
            </button>
            <button
              className="btn btn--ghost btn--block"
              type="button"
              onClick={cancelar}
              disabled={paymentState !== 'idle' || cancelling}
            >
              {cancelling ? 'Cancelando…' : 'Cancelar y volver'}
            </button>
            {errorMsg && <p className="form__error">{errorMsg}</p>}
            {paymentState === 'redirecting' ? (
              <p className="form__hint">
                Se abrió una pestaña con Mercado Pago. Completa el pago ahí; esta página se actualiza sola
                cuando se confirme.
              </p>
            ) : (
              <p className="form__hint">
                Vas a pagar de forma segura con Mercado Pago. Tu turno queda reservado por 1 hora mientras
                completas el pago.
              </p>
            )}
          </form>
        </>
      ) : null}
    </AuthSplit>
  )
}