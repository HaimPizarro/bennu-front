import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listNotificaciones,
  countNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../../lib/api.js'

const safeList = (n) => (Array.isArray(n) ? n : []).filter(Boolean)

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  const load = useCallback(() => {
    Promise.all([listNotificaciones(20), countNoLeidas()]).then(([list, count]) => {
      setItems(list)
      setUnread(count)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const toggle = () => {
    if (!open) load()
    setOpen((o) => !o)
  }

  const handleMarkOne = async (n) => {
    if (n.leida) return
    await marcarNotificacionLeida(n.id)
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
    setUnread((u) => Math.max(0, u - 1))
  }

  const handleMarkAll = async () => {
    await marcarTodasLeidas()
    setItems((prev) => prev.map((x) => ({ ...x, leida: true })))
    setUnread(0)
  }

  return (
    <div className="notif" ref={ref}>
      <button
        className="dash__icon-btn"
        type="button"
        aria-label="Notificaciones"
        onClick={toggle}
      >
        <svg className="notif__bell" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && <span className="notif__badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif__panel">
          <div className="notif__head">
            <span>Notificaciones</span>
            {unread > 0 && (
              <button className="notif__clear" type="button" onClick={handleMarkAll}>
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="notif__list">
            {safeList(items).length === 0 && <p className="notif__empty">Sin notificaciones</p>}
            {safeList(items).map((n) => (
              <a
                key={n.id}
                href={n.enlace || undefined}
                className={n.leida ? 'notif__item' : 'notif__item is-unread'}
                onClick={() => handleMarkOne(n)}
              >
                <span className="notif__tipo">{tipoLabel(n.tipo)}</span>
                <span className="notif__titulo">{n.titulo}</span>
                {n.mensaje && <span className="notif__msg">{n.mensaje}</span>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function tipoLabel(t) {
  const map = {
    cita: 'Cita',
    recordatorio: 'Recordatorio',
    promocion: 'Promoción',
    evento: 'Evento',
    sistema: 'Sistema',
  }
  return map[t] || 'Sistema'
}
