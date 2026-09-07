import { useEffect, useState } from 'react'
import Modal from '../Modal.jsx'
import { listTodasNotificaciones, enviarNotificacion, eliminarNotificacion } from '../../lib/api.js'
import useSearch from '../../hooks/useSearch.js'
import SearchInput from './SearchInput.jsx'

const safeList = (n) => (Array.isArray(n) ? n : []).filter(Boolean)

export default function NotificacionesTab() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', mensaje: '', tipo: 'sistema' })
  const [sending, setSending] = useState(false)
  const { query, setQuery, filtered, hasQuery } = useSearch(items, ['titulo', 'mensaje', 'tipo'])
  const rows = safeList(filtered)

  const load = async () => setItems(await listTodasNotificaciones())

  useEffect(() => {
    listTodasNotificaciones().then(setItems)
  }, [])

  const openNew = () => {
    setForm({ titulo: '', mensaje: '', tipo: 'sistema' })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    await enviarNotificacion({ ...form, userId: null })
    setSending(false)
    setShowForm(false)
    await load()
  }

  const remove = async (id) => {
    await eliminarNotificacion(id)
    await load()
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Notificaciones</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={openNew}>
          Nueva notificación
        </button>
      </div>
      <p className="muted">
        Las notificaciones con <code>user_id</code> vacío se envían a todos los usuarios
        (broadcast). Las de citas se generan automáticamente.
      </p>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar notificación por título o mensaje" />

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Título</th>
              <th>Destinatario</th>
              <th>Leída</th>
              <th>Fecha</th>
              <th className="data-table__actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" className="data-table__empty" data-label="">
                  {hasQuery ? `Sin resultados para "${query}"` : 'Sin notificaciones'}
                </td>
              </tr>
            )}
            {rows.map((n) => (
              <tr key={n.id}>
                <td data-label="Tipo">
                  <span className="chip">{n.tipo}</span>
                </td>
                <td data-label="Título">
                  <span className="data-table__name">{n.titulo}</span>
                  {n.mensaje && <span className="data-table__meta">{n.mensaje}</span>}
                </td>
                <td data-label="Destinatario">
                  <span className="data-table__meta">{n.user_id ? n.users?.nombre || n.user_id : 'Todos'}</span>
                </td>
                <td data-label="Leída">{n.leida ? 'Sí' : 'No'}</td>
                <td data-label="Fecha">
                  <span className="data-table__meta">{n.created_at ? n.created_at.slice(0, 16).replace('T', ' ') : '—'}</span>
                </td>
                <td className="data-table__actions" data-label="">
                  <button className="btn btn--danger btn--sm" type="button" onClick={() => remove(n.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nueva notificación (broadcast)" onClose={() => setShowForm(false)}>
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span className="field__label">Título</span>
              <input
                className="field__input"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Mensaje</span>
              <textarea
                className="field__input"
                rows="3"
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Tipo</span>
              <select
                className="field__input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="sistema">sistema</option>
                <option value="cita">cita</option>
                <option value="recordatorio">recordatorio</option>
                <option value="promocion">promocion</option>
                <option value="evento">evento</option>
              </select>
            </label>
            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
