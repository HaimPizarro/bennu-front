import { useEffect, useState } from 'react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { listVisitantes, eliminarVisitante } from '../../lib/api.js'
import { toast } from '../../lib/toast.js'
import SearchInput from './SearchInput.jsx'

const safeList = (n) => (Array.isArray(n) ? n : []).filter(Boolean)

export default function VisitantesTab() {
  const [items, setItems] = useState(null)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => setItems(await listVisitantes())

  useEffect(() => {
    let alive = true
    listVisitantes().then((data) => {
      if (alive) setItems(data)
    })
    return () => {
      alive = false
    }
  }, [])

  const q = query.trim().toLowerCase()
  const rows = q
    ? safeList(items).filter(
        (v) =>
          String(v.nombre || '').toLowerCase().includes(q) ||
          String(v.alias || '').toLowerCase().includes(q),
      )
    : safeList(items)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await eliminarVisitante(deleteTarget.id)
      toast.success('Registro eliminado.')
      await load()
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el registro.')
    } finally {
      setDeleteTarget(null)
    }
  }

  if (items === null) return <p className="muted">Cargando visitantes…</p>

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Visitantes</h1>
      </div>
      <p className="muted">
        Perfiles de bienvenida que guardaron los usuarios logueados (nombre, alias y edad
        opcional). Solo los usuarios con cuenta pueden tener uno; se asocia a su cuenta.
      </p>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o alias" />
      {rows.length === 0 && (
        <p className="muted">{q ? `Sin resultados para "${query}".` : 'Aún no hay visitantes guardados.'}</p>
      )}

      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Alias</th>
                <th>Edad</th>
                <th>Actualizado</th>
                <th className="data-table__actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td data-label="Nombre">
                    <span className="data-table__name">{v.nombre}</span>
                  </td>
                  <td data-label="Alias">
                    <span className="data-table__meta">{v.alias}</span>
                  </td>
                  <td data-label="Edad">{v.edad != null ? v.edad : '—'}</td>
                  <td data-label="Actualizado">
                    <span className="data-table__meta">
                      {v.updated_at ? v.updated_at.slice(0, 16).replace('T', ' ') : '—'}
                    </span>
                  </td>
                  <td className="data-table__actions" data-label="">
                    <button
                      className="btn btn--danger btn--sm"
                      type="button"
                      onClick={() => setDeleteTarget(v)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar visitante"
          message={`¿Está seguro que desea eliminar el perfil de "${deleteTarget.alias}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
