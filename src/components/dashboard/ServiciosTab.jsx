import { useEffect, useState } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { formatCurrency } from '../../lib/data.js'
import { listCategorias } from '../../lib/api.js'
import useSearch from '../../hooks/useSearch.js'
import SearchInput from './SearchInput.jsx'

const EMPTY_SERVICE = {
  id: '',
  name: '',
  description: '',
  price: '',
  precio_oferta: '',
  descuento_suscripcion: '',
  duration: '',
  capacidad: '1',
  buffer_previo: '',
  buffer_posterior: '',
  category: '',
  puntos_otorgados: '',
  active: true,
  esCombo: false,
  servicios_combo_ids: [],
  campos: [],
}

const CAMPOS_TIPOS = [
  { id: 'text', name: 'Texto' },
  { id: 'select', name: 'Selección única' },
  { id: 'multiselect', name: 'Selección múltiple' },
]

const EMPTY_CAMPO = { label: '', tipo: 'text', opciones: [], requerido: false }

// Blindaje: nunca deja que una fila null/undefined llegue al render.
const safeServices = (services) => (Array.isArray(services) ? services : []).filter(Boolean)

export default function ServiciosTab({ services, onSave, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(EMPTY_SERVICE)
  const [isNew, setIsNew] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [categories, setCategories] = useState([])
  const { query, setQuery, filtered, hasQuery } = useSearch(services, [
    'name',
    'description',
    'category',
  ])
  const rows = safeServices(filtered)

  useEffect(() => {
    listCategorias().then((cats) => setCategories(Array.isArray(cats) ? cats : []))
  }, [])

  const categoryOptions = (() => {
    const opts = categories.map((c) => c.nombre)
    if (editing.category && !opts.includes(editing.category)) opts.push(editing.category)
    return opts
  })()

  const selectable = safeServices(services).filter((s) => s.id !== editing.id)

  const startNew = () => {
    setEditing(EMPTY_SERVICE)
    setIsNew(true)
    setShowForm(true)
  }

  const startEdit = (s) => {
    setEditing({
      ...s,
      price: String(s.price),
      precio_oferta: s.precio_oferta ? String(s.precio_oferta) : '',
      descuento_suscripcion: String(s.descuento_suscripcion ?? ''),
      duration: String(s.duration),
      capacidad: s.capacidad != null ? String(s.capacidad) : '1',
      buffer_previo: s.buffer_previo != null ? String(s.buffer_previo) : '',
      buffer_posterior: s.buffer_posterior != null ? String(s.buffer_posterior) : '',
      puntos_otorgados: String(s.puntos_otorgados ?? ''),
      esCombo: (s.servicios_combo_ids || []).length > 0,
      servicios_combo_ids: s.servicios_combo_ids || [],
      campos: (s.campos || []).map((c) => ({ ...c })),
    })
    setIsNew(false)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(EMPTY_SERVICE)
    setIsNew(true)
  }

  const toggleComboChild = (id) => {
    const has = editing.servicios_combo_ids.includes(id)
    const ids = has
      ? editing.servicios_combo_ids.filter((s) => s !== id)
      : [...editing.servicios_combo_ids, id]
    const children = selectable.filter((s) => ids.includes(s.id))
    setEditing({
      ...editing,
      servicios_combo_ids: ids,
      price: children.length ? String(children.reduce((a, s) => a + Number(s.price || 0), 0)) : editing.price,
      duration: children.length
        ? String(children.reduce((a, s) => a + Number(s.duration || 0), 0))
        : editing.duration,
    })
  }

  const updateCampo = (index, patch) => {
    setEditing({
      ...editing,
      campos: editing.campos.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    })
  }

  const addCampo = () => {
    setEditing({ ...editing, campos: [...editing.campos, { ...EMPTY_CAMPO }] })
  }

  const removeCampo = (index) => {
    setEditing({ ...editing, campos: editing.campos.filter((_, i) => i !== index) })
  }

  const submitService = async (e) => {
    e.preventDefault()
    setSaving(true)
    const precioOferta = editing.precio_oferta ? Number(editing.precio_oferta) : null
    const toInt = (v) => (v !== '' && v != null ? Number(v) : null)
    await onSave({
      id: isNew ? `s-${Date.now()}` : editing.id,
      name: editing.name.trim(),
      description: editing.description.trim(),
      price: Number(editing.price),
      precio_oferta: precioOferta && precioOferta > 0 ? precioOferta : null,
      descuento_suscripcion: Number(editing.descuento_suscripcion) || 0,
      duration: Number(editing.duration),
      capacidad: Math.max(1, Number(editing.capacidad) || 1),
      buffer_previo: toInt(editing.buffer_previo),
      buffer_posterior: toInt(editing.buffer_posterior),
      category: editing.category,
      puntos_otorgados: Number(editing.puntos_otorgados) || 0,
      active: Boolean(editing.active),
      esCombo: editing.esCombo,
      servicios_combo_ids: editing.esCombo ? editing.servicios_combo_ids : [],
      campos: editing.campos
        .filter((c) => c.label.trim())
        .map((c) => ({
          label: c.label.trim(),
          tipo: c.tipo,
          opciones:
            c.tipo === 'select' || c.tipo === 'multiselect'
              ? c.opciones.map((o) => String(o).trim()).filter(Boolean)
              : undefined,
          requerido: Boolean(c.requerido),
        })),
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
        <h1 className="dash__title">Servicios</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={startNew}>
          Nuevo servicio
        </button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar servicio por nombre, categoría o descripción" />
      {hasQuery && rows.length === 0 && (
        <p className="muted">Sin resultados para “{query}”.</p>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Precio</th>
              <th>Susc.</th>
              <th>Duración</th>
              <th>Pts</th>
              <th>Cap.</th>
              <th>Estado</th>
              <th className="data-table__actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td data-label="Servicio">
                  <span className="data-table__name">
                    {s.name}{' '}
                    {s.servicios_combo_ids?.length > 0 && <span className="chip chip--steel">combo</span>}
                  </span>
                  <span className="data-table__meta">
                    {s.category || 'Sin categoría'} · {s.description}
                  </span>
                </td>
                <td data-label="Precio">
                  {s.precio_oferta ? (
                    <>
                      <s className="price--old">{formatCurrency(s.price)}</s>{' '}
                      <span className="price--offer">{formatCurrency(s.precio_oferta)}</span>
                    </>
                  ) : (
                    formatCurrency(s.price)
                  )}
                </td>
                <td data-label="Susc.">
                  {Number(s.descuento_suscripcion) > 0 ? (
                    <span className="chip chip--steel">-{s.descuento_suscripcion}%</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td data-label="Duración">{s.duration} min</td>
                <td data-label="Pts">{s.puntos_otorgados || 0}</td>
                <td data-label="Cap.">
                  <span className="chip chip--steel">{s.capacidad || 1}</span>
                </td>
                <td data-label="Estado">
                  <span className={`chip ${s.active ? 'chip--ok' : 'chip--off'}`}>
                    {s.active ? 'activo' : 'oculto'}
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
        <Modal title={isNew ? 'Nuevo servicio' : 'Editar servicio'} onClose={closeForm}>
          <form className="form" onSubmit={submitService}>
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
                <span className="field__label">Precio ($)</span>
                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="field__label">Precio oferta ($) — opcional</span>
              <input
                className="field__input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Dejar vacío si no hay oferta"
                value={editing.precio_oferta}
                onChange={(e) => setEditing({ ...editing, precio_oferta: e.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">Descuento para suscriptores (%) — opcional</span>
              <input
                className="field__input"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="0 = sin descuento para la membresía"
                value={editing.descuento_suscripcion}
                onChange={(e) => setEditing({ ...editing, descuento_suscripcion: e.target.value })}
              />
              <span className="field__hint">
                Aplica solo al pagar como cliente con membresía activa. Combos y canjes no se ven afectados.
              </span>
            </label>

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
                <span className="field__label">Duración (min)</span>
                <input
                  className="field__input"
                  type="number"
                  min="5"
                  step="5"
                  value={editing.duration}
                  onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Capacidad (personas)</span>
                <input
                  className="field__input"
                  type="number"
                  min="1"
                  step="1"
                  title="Cuántas personas pueden reservar el mismo horario (1 = exclusivo)"
                  value={editing.capacidad}
                  onChange={(e) => setEditing({ ...editing, capacidad: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Buffer previo (min)</span>
                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Usar global"
                  value={editing.buffer_previo}
                  onChange={(e) => setEditing({ ...editing, buffer_previo: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="field__label">Buffer posterior (min)</span>
                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Usar global"
                  value={editing.buffer_posterior}
                  onChange={(e) => setEditing({ ...editing, buffer_posterior: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="field__label">Categoría</span>
                <select
                  className="field__input"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  <option value="">Sin categoría</option>
                  {categoryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field__label">Puntos que otorga</span>
                <input
                  className="field__input"
                  type="number"
                  min="0"
                  value={editing.puntos_otorgados}
                  onChange={(e) => setEditing({ ...editing, puntos_otorgados: e.target.value })}
                  required
                />
              </label>
              <label className="field field--check">
                <input
                  type="checkbox"
                  checked={Boolean(editing.active)}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                <span className="field__label">Activo (visible en la página)</span>
              </label>
            </div>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={Boolean(editing.esCombo)}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    esCombo: e.target.checked,
                    servicios_combo_ids: e.target.checked ? editing.servicios_combo_ids : [],
                  })
                }
              />
              <span className="field__label">Es un servicio combinado (agrupa otros servicios)</span>
            </label>

            {editing.esCombo && (
              <fieldset className="field">
                <legend className="field__label">Servicios que incluye</legend>
                <p className="field__hint">El precio y la duración se suman automáticamente.</p>
                <div className="check-group">
                  {selectable.map((s) => (
                    <label key={s.id} className="check-group__item">
                      <input
                        type="checkbox"
                        checked={editing.servicios_combo_ids.includes(s.id)}
                        onChange={() => toggleComboChild(s.id)}
                      />
                      <span>
                        {s.name} · {formatCurrency(s.price)} · {s.duration} min
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="field">
              <legend className="field__label">
                Campos que se preguntan al reservar <span className="field__hint">— opcional</span>
              </legend>
              <p className="field__hint">
                Ej: tipo de piel, sensibilidad, zona. Se muestran en el paso de reserva y quedan
                guardados en la cita.
              </p>
              {editing.campos.length === 0 && <p className="field__hint">Sin campos definidos.</p>}
              {editing.campos.map((campo, i) => (
                <div className="campo-editor" key={i}>
                  <div className="campo-editor__row">
                    <label className="field">
                      <span className="field__label">Pregunta</span>
                      <input
                        className="field__input"
                        value={campo.label}
                        placeholder="Ej: ¿Tu piel es sensible?"
                        onChange={(e) => updateCampo(i, { label: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">Tipo</span>
                      <select
                        className="field__input"
                        value={campo.tipo}
                        onChange={(e) => updateCampo(i, { tipo: e.target.value })}
                      >
                        {CAMPOS_TIPOS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field campo-editor__check">
                      <input
                        type="checkbox"
                        checked={Boolean(campo.requerido)}
                        onChange={(e) => updateCampo(i, { requerido: e.target.checked })}
                      />
                      <span className="field__label">Obligatorio</span>
                    </label>
                    <button
                      className="btn btn--danger btn--sm"
                      type="button"
                      title="Quitar campo"
                      onClick={() => removeCampo(i)}
                    >
                      ✕
                    </button>
                  </div>
                  {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                    <label className="field">
                      <span className="field__label">Opciones (separadas por comas)</span>
                      <input
                        className="field__input"
                        value={(campo.opciones || []).join(', ')}
                        placeholder="Ej: Natural, Rizado, Voluminoso"
                        onChange={(e) =>
                          updateCampo(i, { opciones: e.target.value.split(',').map((o) => o.trim()) })
                        }
                      />
                    </label>
                  )}
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" type="button" onClick={addCampo}>
                + Agregar campo
              </button>
            </fieldset>

            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear servicio' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar servicio"
          message={`¿Está seguro que desea eliminar "${deleteTarget.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
