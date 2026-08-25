import { useState } from 'react'
import Modal from '../../components/Modal.jsx'
import { formatCurrency } from '../../lib/data.js'
import { formatDate } from '../../lib/date.js'

const ESTADOS = {
  aprobada: { label: 'Activa', cls: 'chip--ok' },
  vencida: { label: 'Vencida', cls: 'chip--off' },
  pendiente: { label: 'Pendiente', cls: '' },
  cancelada: { label: 'Cancelada', cls: 'chip--off' },
}

// Una suscripción aprobada deja de estar vigente cuando pasa su valida_hasta.
const estadoEfectivo = (s) => {
  if (s.estado === 'aprobada') {
    const vence = s.valida_hasta ? new Date(String(s.valida_hasta).slice(0, 10) + 'T23:59:59') : null
    return vence && vence.getTime() < Date.now() ? 'vencida' : 'aprobada'
  }
  return s.estado
}

const fechaCorta = (iso) => (iso ? formatDate(String(iso).slice(0, 10)) : '—')

const emptyForm = { nombre: '', precio_mensual: '', puntos_mes: '', descripcion: '', activa: true }

export default function SuscripcionesTab({
  membresias,
  suscripciones,
  clients,
  onSaveMembresia,
  onDeleteMembresia,
  onActivar,
  onDesactivar,
}) {
  const planes = (Array.isArray(membresias) ? membresias : []).filter(Boolean)
  const rows = (Array.isArray(suscripciones) ? suscripciones : []).filter(Boolean)
  const clientes = (Array.isArray(clients) ? clients : []).filter((c) => Number(c.rol) === 1 && c.id)
  const planesActivos = planes.filter((p) => p.activa)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [planActivarId, setPlanActivarId] = useState('')
  const [activando, setActivando] = useState(false)

  const openNueva = () => {
    setForm(emptyForm)
    setModal('nuevo')
  }

  const openEditar = (plan) => {
    setForm({
      nombre: plan.nombre || '',
      precio_mensual: String(plan.precio_mensual ?? ''),
      puntos_mes: String(plan.puntos_mes ?? ''),
      descripcion: plan.descripcion || '',
      activa: plan.activa !== false,
    })
    setModal({ id: plan.id })
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSaveMembresia({
        ...(modal?.id != null ? { id: modal.id } : {}),
        nombre: form.nombre,
        precio_mensual: Number(form.precio_mensual) || 0,
        puntos_mes: Number(form.puntos_mes) || 0,
        descripcion: form.descripcion,
        activa: Boolean(form.activa),
      })
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const activar = async () => {
    if (!clienteId || !planActivarId) return
    setActivando(true)
    try {
      await onActivar(clienteId, Number(planActivarId))
      setClienteId('')
      setPlanActivarId('')
    } finally {
      setActivando(false)
    }
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Membresías</h1>
        <span className="chip chip--steel">{rows.length} suscripciones</span>
      </div>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h2 className="panel__title">Planes de membresía</h2>
            <p className="panel__hint">
              Los clientes eligen entre los planes activos (solo pueden tener una suscripción). El
              descuento por servicio se define en cada servicio (columna «Susc.»).
            </p>
          </div>
          <button className="btn btn--primary" type="button" onClick={openNueva}>
            + Nueva membresía
          </button>
        </div>

        {planes.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Precio</th>
                  <th>Puntos/mes</th>
                  <th>Estado</th>
                  <th className="data-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planes.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Plan">
                      <span className="data-table__name">{p.nombre || 'Sin nombre'}</span>
                      <span className="data-table__meta">{p.descripcion || ''}</span>
                    </td>
                    <td data-label="Precio">{formatCurrency(p.precio_mensual)}</td>
                    <td data-label="Puntos/mes">+{p.puntos_mes} pts</td>
                    <td data-label="Estado">
                      <span className={`chip ${p.activa ? 'chip--ok' : 'chip--off'}`}>
                        {p.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="data-table__actions" data-label="">
                      <button className="btn btn--ghost btn--sm" type="button" onClick={() => openEditar(p)}>
                        Editar
                      </button>
                      <button
                        className="btn btn--danger btn--sm"
                        type="button"
                        onClick={() => onDeleteMembresia(p.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Aún no hay planes. Crea el primero con «+ Nueva membresía».</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Activar membresía manualmente</h2>
        <p className="panel__hint">
          Para pagos por caja o transferencia: activa 30 días con el plan elegido y acredita los
          puntos del mes.
        </p>
        <div className="field-row">
          <label className="field">
            <span className="field__label">Cliente</span>
            <select className="field__input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email || 'sin email'}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Plan</span>
            <select
              className="field__input"
              value={planActivarId}
              onChange={(e) => setPlanActivarId(e.target.value)}
              disabled={planesActivos.length === 0}
            >
              <option value="">
                {planesActivos.length ? 'Seleccionar plan…' : 'No hay planes activos'}
              </option>
              {planesActivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre || `Plan ${p.id}`} — {formatCurrency(p.precio_mensual)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn--primary"
            type="button"
            disabled={!clienteId || !planActivarId || activando}
            onClick={activar}
          >
            {activando ? 'Activando…' : 'Activar membresía'}
          </button>
        </div>
      </section>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Vigencia</th>
              <th>Próximo</th>
              <th>Inicio</th>
              <th className="data-table__actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const eff = estadoEfectivo(s)
              const est = ESTADOS[eff] || { label: s.estado, cls: '' }
              return (
                <tr key={s.id}>
                  <td data-label="Cliente">
                    <span className="data-table__name">{s.usuario || '—'}</span>
                    <span className="data-table__meta">{s.email || ''}</span>
                  </td>
                  <td data-label="Plan">{s.plan_nombre || '—'}</td>
                  <td data-label="Estado">
                    <span className={`chip ${est.cls}`}>{est.label}</span>
                  </td>
                  <td data-label="Monto">{formatCurrency(s.monto)}</td>
                  <td data-label="Vigencia">{fechaCorta(s.valida_hasta)}</td>
                  <td data-label="Próximo">{fechaCorta(s.fecha_proxima)}</td>
                  <td data-label="Inicio">{fechaCorta(s.created_at)}</td>
                  <td className="data-table__actions" data-label="">
                    {eff === 'aprobada' ? (
                      <button
                        className="btn btn--danger btn--sm"
                        type="button"
                        onClick={() => onDesactivar(s.id)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">Aún no hay suscripciones registradas.</p>}
      </div>

      {modal && (
        <Modal
          title={modal.id != null ? 'Editar membresía' : 'Nueva membresía'}
          onClose={() => setModal(null)}
        >
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span className="field__label">Nombre del plan</span>
              <input
                className="field__input"
                type="text"
                placeholder="Ej.: Membresía esencial"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span className="field__label">Precio mensual ($)</span>
                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_mensual}
                  onChange={(e) => setForm({ ...form, precio_mensual: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Puntos por mes</span>
                <input
                  className="field__input"
                  type="number"
                  min="0"
                  step="1"
                  value={form.puntos_mes}
                  onChange={(e) => setForm({ ...form, puntos_mes: e.target.value })}
                  required
                />
              </label>
            </div>
            <label className="field">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__input"
                rows="2"
                placeholder="Beneficios de la membresía…"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </label>
            <label className="field field--check">
              <input
                type="checkbox"
                checked={Boolean(form.activa)}
                onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              />
              <span className="field__label">Membresía disponible para los clientes</span>
            </label>
            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar membresía'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}