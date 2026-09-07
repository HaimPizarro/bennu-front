import { useEffect, useState } from 'react'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { listCategorias, saveCategoria, deleteCategoria } from '../../lib/api.js'
import { toast } from '../../lib/toast.js'
import useSearch from '../../hooks/useSearch.js'
import SearchInput from './SearchInput.jsx'

export default function CategoriasTab() {
  const [categories, setCategories] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [form, setForm] = useState({ id: '', nombre: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { query, setQuery, filtered, hasQuery } = useSearch(categories, ['nombre'])
  const rows = filtered

  const refresh = async () => {
    const data = await listCategorias()
    setCategories(data)
  }

  useEffect(() => {
    let alive = true
    listCategorias().then((data) => {
      if (alive) setCategories(data)
    })
    return () => {
      alive = false
    }
  }, [])

  const openNew = () => {
    setError('')
    setForm({ id: '', nombre: '' })
    setIsNew(true)
    setShowForm(true)
  }

  const openEdit = (cat) => {
    setError('')
    setForm({ id: cat.id, nombre: cat.nombre })
    setIsNew(false)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setError('')
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveCategoria({ id: form.id || null, nombre: form.nombre })
      toast.success(isNew ? 'Categoría creada.' : 'Categoría actualizada.')
      await refresh()
      closeForm()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la categoría.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategoria(deleteTarget.id)
      toast.success(`Categoría "${deleteTarget.nombre}" eliminada.`)
      await refresh()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la categoría.')
    } finally {
      setDeleteTarget(null)
    }
  }

  if (categories === null) return <p className="muted">Cargando categorías…</p>

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Categorías de servicios</h1>
        <button className="btn btn--primary btn--sm" type="button" onClick={openNew}>
          Nueva categoría
        </button>
      </div>
      <p className="muted">
        Las categorías agrupan los servicios y aparecen como filtros en la página. Solo se
        pueden eliminar si no tienen servicios asignados.
      </p>

      {categories.length === 0 ? (
        <p className="muted">Aún no hay categorías. Crea la primera.</p>
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar categoría por nombre" />
          {hasQuery && rows.length === 0 && (
            <p className="muted">Sin resultados para “{query}”.</p>
          )}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Servicios</th>
                  <th className="data-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !hasQuery && (
                  <tr>
                    <td colSpan="3" className="data-table__empty" data-label="">
                      Sin categorías
                    </td>
                  </tr>
                )}
                {rows.map((cat) => (
                <tr key={cat.id}>
                  <td data-label="Categoría">
                    <span className="data-table__name">{cat.nombre}</span>
                  </td>
                  <td data-label="Servicios">
                    {Number(cat.servicios) || 0}
                  </td>
                  <td data-label="Acciones" className="data-table__actions">
                    <button
                      className="btn btn--ghost btn--sm"
                      type="button"
                      onClick={() => openEdit(cat)}
                    >
                      Renombrar
                    </button>
                    <button
                      className="btn btn--danger btn--sm"
                      type="button"
                      onClick={() => setDeleteTarget(cat)}
                      disabled={Number(cat.servicios) > 0}
                      title={
                        Number(cat.servicios) > 0
                          ? 'Reasigna sus servicios antes de eliminar'
                          : 'Eliminar categoría'
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <form className="form dash__form" onSubmit={save}>
            <h2 className="panel__title">{isNew ? 'Nueva categoría' : 'Renombrar categoría'}</h2>
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__input"
                type="text"
                value={form.nombre}
                placeholder="Ej: Masajes y cuerpo"
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                autoFocus
                required
              />
              <span className="field__hint">
                Se muestra en la página y en el formulario de servicios.
              </span>
            </label>
            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}
            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isNew ? 'Crear categoría' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Está seguro que desea eliminar "${deleteTarget.nombre}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
