import { useState } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { formatCurrency } from '../../lib/data.js'

const EMPTY_FORM = {
  name: '',
  description: '',
  costo: '',
  price: '',
  active: true,
}

const safeServices = (services) => (Array.isArray(services) ? services : []).filter(Boolean)

const comboServices = (c, serviceById) =>
  (c.servicios_ids || [])
    .map((id) => serviceById.get(id)?.name)
    .filter(Boolean)
    .join(' + ')

// Expande los servicios seleccionados: si uno es combo, usa sus servicios hijos.
const expandIds = (services, selectedIds) => {
  const out = []
  for (const s of services) {
    if (!selectedIds.includes(s.id)) continue
    const children = s.servicios_combo_ids?.length ? s.servicios_combo_ids : [s.id]
    for (const cid of children) {
      if (!out.includes(cid)) out.push(cid)
    }
  }
  return out
}

export default function FidelizacionTab({ combos, services, serviceById, onSaveCombo, onDeleteCombo }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const catalog = safeServices(services)

  const startNew = () => {
    setForm(EMPTY_FORM)
    setSelectedIds([])
    setEditingId(null)
    setShowForm(true)
  }

  const startEdit = (c) => {
    // Re-selecciona los servicios del catálogo que coinciden con los ids del canje.
    const ids = (c.servicios_ids || []).filter((id) => catalog.some((s) => s.id === id))
    setForm({
      name: c.name,
      description: c.description || '',
      costo: String(c.costo),
      active: c.active !== false,
    })
    setSelectedIds(ids)
    setEditingId(c.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setSelectedIds([])
    setEditingId(null)
  }

  const toggleService = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]
    setSelectedIds(next)
    autoFill(next)
  }

  // Si hay un solo servicio/combo seleccionado, auto-carga sus datos. Con varios
  // servicios individuales, deja el precio = suma y el nombre/descripción a mano.
  const autoFill = (next) => {
    if (next.length === 1) {
      const s = catalog.find((x) => x.id === next[0])
      if (s) {
        setForm((f) => ({
          ...f,
          name: s.name,
          description: s.description || '',
          price: String(s.price),
        }))
      }
    } else if (next.length > 1) {
      const sum = catalog
        .filter((s) => next.includes(s.id))
        .reduce((a, s) => a + Number(s.price || 0), 0)
      setForm((f) => ({ ...f, price: sum ? String(sum) : f.price }))
    } else {
      setForm((f) => ({ ...f, price: '' }))
    }
  }

  const submitCombo = async (e) => {
    e.preventDefault()
    setSaving(true)
    const expanded = expandIds(catalog, selectedIds)
    try {
      await onSaveCombo({
        id: editingId || '',
        name: form.name.trim(),
        description: form.description.trim(),
        costo: Number(form.costo),
        price: Number(form.price) || 0,
        servicios_ids: expanded,
        active: Boolean(form.active),
      })
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    onDeleteCombo(deleteTarget?.id)
    setDeleteTarget(null)
  }

  const total = catalog
    .filter((s) => selectedIds.includes(s.id))
    .reduce((a, s) => a + Number(s.price || 0), 0)

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Fidelización</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={startNew}>
          Nuevo canje
        </button>
      </div>

      <ul className="dash-list">
        {combos.map((c) => (
          <li key={c.id} className="dash-row">
            <div className="dash-row__main">
              <span className="dash-row__name">{c.name}</span>
              <span className="dash-row__meta">
                {comboServices(c, serviceById) || '—'} · {c.costo} pts · {c.active ? 'activo' : 'inactivo'}
              </span>
            </div>
            <div className="dash-row__actions">
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEdit(c)}>
                Editar
              </button>
              <button className="btn btn--danger btn--sm" type="button" onClick={() => setDeleteTarget(c)}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showForm && (
        <Modal title={editingId ? 'Editar canje' : 'Nuevo canje'} onClose={closeForm}>
          <form className="form" onSubmit={submitCombo}>
            <fieldset className="field">
              <legend className="field__label">Selecciona servicios o combos</legend>
              <div className="check-group">
                {catalog.map((s) => (
                  <label key={s.id} className="check-group__item">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    <span>
                      {s.name}
                      {s.servicios_combo_ids?.length > 0 && ' (combo)'} · {formatCurrency(s.price)} · {s.duration} min
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Nombre</span>
                <input
                  className="field__input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Costo en puntos</span>
                <input
                  className="field__input"
                  type="number"
                  min="1"
                  value={form.costo}
                  onChange={(e) => setForm({ ...form, costo: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="field__label">Precio en dinero</span>
              <input
                className="field__input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                placeholder={total ? `Suma automática: ${formatCurrency(total)}` : ''}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__input"
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={Boolean(form.active)}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              <span className="field__label">Activo</span>
            </label>

            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                type="submit"
                disabled={saving || selectedIds.length < 1}
              >
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear canje'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar canje"
          message={`¿Está seguro que desea eliminar "${deleteTarget.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
