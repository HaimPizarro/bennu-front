import { useState } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'

const EMPTY_EMPLEADO = {
  id: '',
  name: '',
  email: '',
  phone: '',
  specialty: '',
  notes: '',
  active: true,
  servicios_ids: [],
}

const safeEmpleados = (empleados) => (Array.isArray(empleados) ? empleados : []).filter(Boolean)

export default function EmpleadosTab({ empleados, services, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(EMPTY_EMPLEADO)
  const [isNew, setIsNew] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const startNew = () => {
    setEditing(EMPTY_EMPLEADO)
    setIsNew(true)
    setShowForm(true)
  }

  const startEdit = (e) => {
    setEditing({
      ...e,
      name: e.name || '',
      email: e.email || '',
      phone: e.phone || '',
      specialty: e.specialty || '',
      notes: e.notes || '',
      active: Boolean(e.active),
      servicios_ids: e.servicios_ids || [],
    })
    setIsNew(false)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(EMPTY_EMPLEADO)
    setIsNew(true)
  }

  const submitEmpleado = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      id: isNew ? '' : editing.id,
      name: editing.name.trim(),
      email: editing.email.trim(),
      phone: editing.phone.trim(),
      specialty: editing.specialty.trim(),
      notes: editing.notes.trim(),
      active: Boolean(editing.active),
      servicios_ids: editing.servicios_ids,
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
        <h1 className="dash__title">Empleados</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={startNew}>
          Nuevo empleado
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Especialidad</th>
              <th>Servicios</th>
              <th>Estado</th>
              <th className="data-table__actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {safeEmpleados(empleados).map((e) => (
              <tr key={e.id}>
                <td data-label="Nombre">
                  <span className="data-table__name">{e.name}</span>
                </td>
                <td data-label="Contacto">
                  <span className="data-table__meta">
                    {e.email}
                    {e.phone ? ` · ${e.phone}` : ''}
                  </span>
                </td>
                <td data-label="Especialidad">
                  <span className="data-table__meta">{e.specialty || '—'}</span>
                </td>
                <td data-label="Servicios">
                  <span className="data-table__meta">
                    {e.servicios_ids?.length
                      ? (services || [])
                          .filter((s) => e.servicios_ids.includes(s.id))
                          .map((s) => s.name)
                          .join(', ')
                      : 'Todos'}
                  </span>
                </td>
                <td data-label="Estado">
                  <span className={`chip ${e.active ? 'chip--ok' : 'chip--off'}`}>
                    {e.active ? 'activo' : 'inactivo'}
                  </span>
                </td>
                <td className="data-table__actions" data-label="">
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEdit(e)}>
                    Editar
                  </button>
                  <button className="btn btn--danger btn--sm" type="button" onClick={() => setDeleteTarget(e)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={isNew ? 'Nuevo empleado' : 'Editar empleado'} onClose={closeForm}>
          <form className="form" onSubmit={submitEmpleado}>
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
                <span className="field__label">Email</span>
                <input
                  className="field__input"
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Teléfono</span>
                <input
                  className="field__input"
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="field__label">Especialidad</span>
                <input
                  className="field__input"
                  placeholder="Ej: masoterapia, limpieza facial…"
                  value={editing.specialty}
                  onChange={(e) => setEditing({ ...editing, specialty: e.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span className="field__label">Notas</span>
              <textarea
                className="field__input"
                rows="2"
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </label>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={Boolean(editing.active)}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              <span className="field__label">Activo</span>
            </label>

            <fieldset className="field">
              <legend className="field__label">Servicios que realiza</legend>
              <p className="field__hint">Solo estos servicios aparecerán disponibles cuando el cliente reserve con este empleado.</p>
              <div className="check-group">
                {(services || []).map((s) => (
                  <label key={s.id} className="check-group__item">
                    <input
                      type="checkbox"
                      checked={editing.servicios_ids.includes(s.id)}
                      onChange={() => {
                        const has = editing.servicios_ids.includes(s.id)
                        const ids = has
                          ? editing.servicios_ids.filter((x) => x !== s.id)
                          : [...editing.servicios_ids, s.id]
                        setEditing({ ...editing, servicios_ids: ids })
                      }}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear empleado' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar empleado"
          message={`¿Está seguro que desea eliminar a "${deleteTarget.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
