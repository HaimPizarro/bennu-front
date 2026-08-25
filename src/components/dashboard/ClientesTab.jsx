import { useState } from 'react'
import { planFromVisitas, getFicha } from '../../lib/api.js'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import FichaAdminModal from './FichaAdminModal.jsx'

export default function ClientesTab({ clients, currentUserId, onUpdate, onDelete }) {
  "use no memo"
  const [query, setQuery] = useState('')
  const [rolFilter, setRolFilter] = useState('todos')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [fichaUser, setFichaUser] = useState(null)
  const [fichaContent, setFichaContent] = useState(null)

  const q = query.trim().toLowerCase()
  const safeClients = clients || []
  const filtered = safeClients.filter((c) => {
    const matchesRol = rolFilter === 'todos' || Number(c.rol) === Number(rolFilter)
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    return matchesRol && matchesQuery
  }).filter(Boolean)

  const counts = {
    todos: safeClients.length,
    admin: safeClients.filter((c) => Number(c.rol) === 0).length,
    cliente: safeClients.filter((c) => Number(c.rol) === 1).length,
  }

  const openEdit = (c) => {
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '' })
    setEditing(c)
  }

  const save = async (userId) => {
    await onUpdate(userId, form)
    setEditing(null)
  }

  const openFicha = async (c) => {
    try {
      const ficha = await getFicha(c.id)
      setFichaContent(ficha?.content || null)
    } catch {
      setFichaContent(null)
    }
    setFichaUser(c)
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Usuarios</h1>
        <label className="dash__search-field">
          <span className="visually-hidden">Buscar usuarios</span>
          <input
            className="field__input"
            type="search"
            placeholder="Buscar por nombre, email o teléfono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="seg-control" role="tablist" aria-label="Filtrar por rol">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'cliente', label: 'Clientes' },
          { key: 'admin', label: 'Admins' },
        ].map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={rolFilter === opt.key}
            className={rolFilter === opt.key ? 'seg is-active' : 'seg'}
            onClick={() => setRolFilter(opt.key)}
          >
            {opt.label}
            <span className="seg__count">{counts[opt.key]}</span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Visitas</th>
              <th>Puntos</th>
              <th>Plan</th>
              <th>Rol</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const plan = planFromVisitas(c.visitas)
              const isMe = String(c?.id) === String(currentUserId)
              return (
                <tr key={c?.id}>
                  <td data-label="Cliente">
                    <strong>{c.name}</strong>
                    {isMe && <span className="chip chip--steel"> Tú</span>}
                  </td>
                  <td className="muted" data-label="Contacto">
                    {c.email}
                    {c.phone && <span className="table__sub">{c.phone}</span>}
                  </td>
                  <td data-label="Visitas">{c.visitas}</td>
                  <td data-label="Puntos">
                    <span className="chip">{c.puntos || 0} pts</span>
                  </td>
                  <td data-label="Plan">
                    <span className={plan === 'frecuente' ? 'chip chip--steel' : 'chip'}>{plan}</span>
                  </td>
                  <td data-label="Rol">
                    <span className="chip">{Number(c.rol) === 0 ? 'Admin' : 'Cliente'}</span>
                  </td>
                  <td className="table__actions" data-label="">
                    <button className="btn btn--ghost btn--sm" type="button" onClick={() => openFicha(c)}>
                      Ficha
                    </button>
                    <button className="btn btn--ghost btn--sm" type="button" onClick={() => openEdit(c)}>
                      Editar
                    </button>
                    <button
                      className="btn btn--danger btn--sm"
                      type="button"
                      disabled={isMe}
                      onClick={() => setDeleting(c)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="muted">Sin resultados para «{query}».</p>}

      {editing && (
        <Modal title="Editar usuario" onClose={() => setEditing(null)}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              save(editing.id)
            }}
          >
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="field__input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                className="field__input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Está seguro que desea eliminar a ${deleting.name}? Se quitará su cuenta y no podrá iniciar sesión.`}
          onConfirm={async () => {
            await onDelete(deleting.id)
            setDeleting(null)
          }}
          onCancel={() => setDeleting(null)}
        />
      )}

      {fichaUser && (
        <FichaAdminModal
          key={fichaUser.id}
          user={fichaUser}
          initialContent={fichaContent}
          onClose={() => setFichaUser(null)}
        />
      )}
    </>
  )
}