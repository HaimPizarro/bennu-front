import { useState } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import useSearch from '../../hooks/useSearch.js'
import SearchInput from './SearchInput.jsx'

const EMPTY = { id: '', name: '', direccion: '', telefono: '', activa: true }

const safeList = (s) => (Array.isArray(s) ? s : []).filter(Boolean)

export default function SucursalesTab({ sucursales, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(EMPTY)
  const [isNew, setIsNew] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { query, setQuery, filtered, hasQuery } = useSearch(sucursales, ['name', 'direccion'])
  const rows = safeList(filtered)

  const startNew = () => {
    setEditing(EMPTY)
    setIsNew(true)
    setShowForm(true)
  }

  const startEdit = (s) => {
    setEditing({ ...s })
    setIsNew(false)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(EMPTY)
    setIsNew(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      id: isNew ? '' : editing.id,
      name: editing.name.trim(),
      direccion: editing.direccion.trim(),
      telefono: editing.telefono.trim(),
      activa: editing.activa,
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
        <h1 className="dash__title">Sucursales</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={startNew}>
          Nueva sucursal
        </button>
      </div>
      <p className="muted">
        Cada sucursal tiene su propio catálogo de servicios, empleados, horarios, citas y
        eventos. Cambia la sucursal activa desde el selector del sidebar.
      </p>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar sucursal por nombre o dirección" />

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th className="data-table__actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="5" className="data-table__empty" data-label="">
                  {hasQuery ? `Sin resultados para "${query}"` : 'Sin sucursales'}
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td data-label="Nombre">
                  <span className="data-table__name">{s.name}</span>
                  {Number(s.id) === 1 && <span className="data-table__meta">· Principal</span>}
                </td>
                <td data-label="Dirección"><span className="data-table__meta">{s.direccion || '—'}</span></td>
                <td data-label="Teléfono"><span className="data-table__meta">{s.telefono || '—'}</span></td>
                <td data-label="Estado">
                  <span className={`chip ${s.activa ? 'chip--ok' : 'chip--off'}`}>
                    {s.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="data-table__actions" data-label="">
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEdit(s)}>
                    Editar
                  </button>
                  <button className="btn btn--danger btn--sm" type="button" onClick={() => setDeleteTarget(s)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={isNew ? 'Nueva sucursal' : 'Editar sucursal'} onClose={closeForm}>
          <form className="form" onSubmit={submit}>
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
              <span className="field__label">Dirección</span>
              <input
                className="field__input"
                value={editing.direccion}
                onChange={(e) => setEditing({ ...editing, direccion: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                className="field__input"
                value={editing.telefono}
                onChange={(e) => setEditing({ ...editing, telefono: e.target.value })}
              />
            </label>
            <label className="field field--check">
              <input
                type="checkbox"
                checked={editing.activa}
                onChange={(e) => setEditing({ ...editing, activa: e.target.checked })}
              />
              <span>Sucursal activa</span>
            </label>
            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear sucursal' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar sucursal"
          message={`¿Eliminar "${deleteTarget.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
