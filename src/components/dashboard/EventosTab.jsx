import { useState } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { formatDate } from '../../lib/date.js'

const ESTADOS = ['Programado', 'En curso', 'Finalizado', 'Cancelado']
const TIPOS = ['evento', 'taller', 'clase', 'promocion', 'mantenimiento']

const EMPTY_EVENTO = {
  id: '',
  name: '',
  description: '',
  tipo: 'evento',
  start: '',
  end: '',
  capacidad: '',
  lugar: '',
  estado: 'Programado',
  color: '',
  recurrencia: 'none',
}

const safeEventos = (eventos) => (Array.isArray(eventos) ? eventos : []).filter(Boolean)

export default function EventosTab({ eventos, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(EMPTY_EVENTO)
  const [isNew, setIsNew] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const startNew = () => {
    setEditing(EMPTY_EVENTO)
    setIsNew(true)
    setShowForm(true)
  }

  const startEdit = (ev) => {
    setEditing({
      ...ev,
      name: ev.name || '',
      description: ev.description || '',
      start: ev.start || '',
      end: ev.end || '',
      capacidad: ev.capacidad != null ? String(ev.capacidad) : '',
      lugar: ev.lugar || '',
      color: ev.color || '',
    })
    setIsNew(false)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(EMPTY_EVENTO)
    setIsNew(true)
  }

  const submitEvento = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      id: isNew ? '' : editing.id,
      name: editing.name.trim(),
      description: editing.description.trim(),
      tipo: editing.tipo,
      start: editing.start,
      end: editing.end,
      capacidad: editing.capacidad,
      lugar: editing.lugar.trim(),
      estado: editing.estado,
      color: editing.color.trim(),
      recurrencia: editing.recurrencia,
    })
    setSaving(false)
    closeForm()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    onDelete(deleteTarget?.id)
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Eventos</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={startNew}>
          Nuevo evento
        </button>
      </div>
      <p className="muted">
        Talleres, clases y fechas especiales que bloquean la agenda o se promocionan al público.
      </p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Capacidad</th>
              <th>Lugar</th>
              <th>Estado</th>
              <th className="data-table__actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {safeEventos(eventos).map((ev) => (
              <tr key={ev.id}>
                <td data-label="Evento">
                  <span className="data-table__name">{ev.name}</span>
                  <span className="data-table__meta">
                    {ev.tipo}
                    {ev.recurrencia !== 'none' ? ` · ${ev.recurrencia}` : ''}
                  </span>
                </td>
                <td data-label="Fecha">
                  <span className="data-table__meta">{ev.start ? formatDate(ev.start.slice(0, 10)) : '—'}</span>
                </td>
                <td data-label="Capacidad">{ev.capacidad || '—'}</td>
                <td data-label="Lugar"><span className="data-table__meta">{ev.lugar || '—'}</span></td>
                <td data-label="Estado">
                  <span className={`chip ${estadoChipClass(ev.estado)}`}>{ev.estado}</span>
                </td>
                <td className="data-table__actions" data-label="">
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEdit(ev)}>
                    Editar
                  </button>
                  <button className="btn btn--danger btn--sm" type="button" onClick={() => setDeleteTarget(ev)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={isNew ? 'Nuevo evento' : 'Editar evento'} onClose={closeForm}>
          <form className="form" onSubmit={submitEvento}>
            <div className="field-row">
              <label className="field">
                <span className="field__label">Nombre</span>
                <input
                  className="field__input"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Tipo</span>
                <select
                  className="field__input"
                  value={editing.tipo}
                  onChange={(e) => setEditing({ ...editing, tipo: e.target.value })}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__input"
                rows="2"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Inicio</span>
                <input
                  className="field__input"
                  type="datetime-local"
                  value={editing.start}
                  onChange={(e) => setEditing({ ...editing, start: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Fin (opcional)</span>
                <input
                  className="field__input"
                  type="datetime-local"
                  value={editing.end}
                  onChange={(e) => setEditing({ ...editing, end: e.target.value })}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Capacidad (opcional)</span>
                <input
                  className="field__input"
                  type="number"
                  min="1"
                  value={editing.capacidad}
                  onChange={(e) => setEditing({ ...editing, capacidad: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="field__label">Lugar</span>
                <input
                  className="field__input"
                  value={editing.lugar}
                  onChange={(e) => setEditing({ ...editing, lugar: e.target.value })}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Estado</span>
                <select
                  className="field__input"
                  value={editing.estado}
                  onChange={(e) => setEditing({ ...editing, estado: e.target.value })}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Color</span>
                <input
                  className="field__input"
                  type="color"
                  value={editing.color || '#5D7A8C'}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                />
              </label>
            </div>

            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear evento' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar evento"
          message={`¿Eliminar "${deleteTarget.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

function estadoChipClass(s) {
  if (s === 'En curso') return 'chip--info'
  if (s === 'Finalizado') return 'chip--ok'
  if (s === 'Cancelado') return 'chip--off'
  return ''
}
