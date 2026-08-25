import { useEffect, useState } from 'react'
import { useSettings, DAYS } from '../../hooks/useSettings.js'
import {
  getEmpleadoHorarios,
  saveEmpleadoHorarios,
  listExcepciones,
  saveExcepcion,
  deleteExcepcion,
} from '../../lib/api.js'
import { toast } from '../../lib/toast.js'
import Modal from '../Modal.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'

const EMPTY_WEEKLY = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
const EMPTY_EXCEPTION = { id: '', fecha: '', empleado_id: '', cerrado: false, franjas: [], motivo: '' }

export default function HorariosTab({ empleados }) {
  const { loading, load, update } = useSettings()

  const [draft, setDraft] = useState(null)
  const [section, setSection] = useState('global')

  // Horario por empleado
  const [selectedEmpleado, setSelectedEmpleado] = useState('')
  const [empDraft, setEmpDraft] = useState(null)

  // Excepciones
  const [excepciones, setExcepciones] = useState([])
  const [exShowForm, setExShowForm] = useState(false)
  const [exDraft, setExDraft] = useState(EMPTY_EXCEPTION)
  const [exSaving, setExSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadExcepciones = async () => {
    const list = await listExcepciones()
    setExcepciones(list)
  }

  useEffect(() => {
    load().then((s) => {
      if (s) setDraft(s)
    })
    listExcepciones().then((list) => setExcepciones(list))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (section !== 'empleado') return
    if (selectedEmpleado && !empDraft) {
      getEmpleadoHorarios(selectedEmpleado).then((weekly) => setEmpDraft(weekly || EMPTY_WEEKLY))
    }
  }, [section, selectedEmpleado, empDraft])

  const pickEmpleado = (id) => {
    setSelectedEmpleado(id)
    setEmpDraft(id ? null : EMPTY_WEEKLY)
  }

  if (loading || !draft) {
    return (
      <>
        <h1 className="dash__title">Horarios</h1>
        <p className="muted">Cargando…</p>
      </>
    )
  }

  const saveGlobal = async () => {
    if (!draft) return
    const result = await update({
      slotInterval: Number(draft.slotInterval),
      bufferBefore: Number(draft.bufferBefore) || 0,
      bufferAfter: Number(draft.bufferAfter) || 0,
      workingHours: draft.workingHours,
    })
    if (result.ok) {
      toast.success('Horarios guardados')
    } else {
      toast.error(result.message || 'No se pudieron guardar los cambios')
    }
  }

  const saveEmp = async () => {
    if (!selectedEmpleado) return
    const result = await saveEmpleadoHorarios(selectedEmpleado, empDraft)
    if (result) {
      setEmpDraft(result)
      toast.success('Horario del empleado guardado')
    } else {
      toast.error('No se pudo guardar el horario del empleado')
    }
  }

  const addRange = (day) => {
    const ranges = [...(draft.workingHours[day] || [])]
    ranges.push({ start: '09:00', end: '13:00' })
    setDraft({ ...draft, workingHours: { ...draft.workingHours, [day]: ranges } })
  }

  const removeRange = (day, idx) => {
    const ranges = (draft.workingHours[day] || []).filter((_, i) => i !== idx)
    setDraft({ ...draft, workingHours: { ...draft.workingHours, [day]: ranges } })
  }

  const setRange = (day, idx, field, value) => {
    const ranges = (draft.workingHours[day] || []).map((r, i) =>
      i === idx ? { ...r, [field]: value } : r,
    )
    setDraft({ ...draft, workingHours: { ...draft.workingHours, [day]: ranges } })
  }

  const addEmpRange = (day) => {
    const ranges = [...(empDraft[day] || [])]
    ranges.push({ start: '09:00', end: '13:00' })
    setEmpDraft({ ...empDraft, [day]: ranges })
  }

  const removeEmpRange = (day, idx) => {
    const ranges = (empDraft[day] || []).filter((_, i) => i !== idx)
    setEmpDraft({ ...empDraft, [day]: ranges })
  }

  const setEmpRange = (day, idx, field, value) => {
    const ranges = (empDraft[day] || []).map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    setEmpDraft({ ...empDraft, [day]: ranges })
  }

  const startNewExcepcion = () => {
    setExDraft(EMPTY_EXCEPTION)
    setExShowForm(true)
  }

  const startEditExcepcion = (ex) => {
    setExDraft({
      ...ex,
      empleado_id: ex.empleado_id != null ? String(ex.empleado_id) : '',
      franjas: (ex.franjas || []).map((r) => ({ ...r })),
    })
    setExShowForm(true)
  }

  const submitExcepcion = async (e) => {
    e.preventDefault()
    if (!exDraft.fecha) {
      toast.error('Selecciona una fecha')
      return
    }
    setExSaving(true)
    const payload = {
      ...exDraft,
      empleado_id: exDraft.empleado_id ? Number(exDraft.empleado_id) : null,
      cerrado: Boolean(exDraft.cerrado),
    }
    try {
      await saveExcepcion(payload)
      toast.success('Excepción guardada')
      setExShowForm(false)
      await loadExcepciones()
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar la excepción')
    } finally {
      setExSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteExcepcion(deleteTarget.id)
      toast.success('Excepción eliminada')
      await loadExcepciones()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la excepción')
    }
    setDeleteTarget(null)
  }

  const segName = (id) => {
    const emp = (empleados || []).find((x) => x.id === id)
    return emp ? emp.name : 'Todos'
  }

  const renderWeeklyEditor = (week, onAdd, onRemove, onSet) =>
    DAYS.map((d) => {
      const ranges = week[d.key] || []
      return (
        <section className="panel settings-day" key={d.key}>
          <header className="settings-day__head">
            <strong>{d.label}</strong>
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => onAdd(d.key)}>
              + Agregar franja
            </button>
          </header>
          {ranges.length === 0 ? (
            <p className="muted">Cerrado</p>
          ) : (
            <div className="field-row settings-ranges">
              {ranges.map((r, idx) => (
                <div className="settings-range" key={`${d.key}-${idx}`}>
                  <label className="field">
                    <span className="field__label">Desde</span>
                    <input
                      className="field__input"
                      type="time"
                      value={r.start}
                      onChange={(e) => onSet(d.key, idx, 'start', e.target.value)}
                    />
                  </label>
                  <span className="settings-range__sep">a</span>
                  <label className="field">
                    <span className="field__label">Hasta</span>
                    <input
                      className="field__input"
                      type="time"
                      value={r.end}
                      onChange={(e) => onSet(d.key, idx, 'end', e.target.value)}
                    />
                  </label>
                  <button
                    className="btn btn--danger btn--sm settings-range__remove"
                    type="button"
                    onClick={() => onRemove(d.key, idx)}
                    title="Quitar franja"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="settings-day__hint">
            {ranges.length === 0
              ? 'Sin franjas, cerrado este día.'
              : `Dispone de slots de ${draft.slotInterval} min en esas franjas.`}
          </p>
        </section>
      )
    })

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Horarios de trabajo</h1>
        <button
          className="btn btn--primary btn--sm"
          type="button"
          onClick={section === 'global' ? saveGlobal : section === 'empleado' ? saveEmp : undefined}
          disabled={section === 'excepciones' || (section === 'empleado' && !selectedEmpleado)}
        >
          Guardar cambios
        </button>
      </div>

      <div className="seg-control">
        <button
          className={`seg ${section === 'global' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setSection('global')}
        >
          Estudio
        </button>
        <button
          className={`seg ${section === 'empleado' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setSection('empleado')}
        >
          Por empleado
        </button>
        <button
          className={`seg ${section === 'excepciones' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setSection('excepciones')}
        >
          Excepciones
        </button>
      </div>

      {section === 'global' && (
        <>
          <p className="muted">
            Configurá la agenda del estudio: intervalos de 5 en 5 minutos, márgenes entre citas y horarios
            por día. Los días sin franjas quedan cerrados y se reflejan automáticamente en el calendario
            público.
          </p>

          <div className="field-row settings-intro">
            <label className="field">
              <span className="field__label">Intervalo de turnos (min)</span>
              <select
                className="field__input"
                value={draft.slotInterval}
                onChange={(e) => setDraft({ ...draft, slotInterval: Number(e.target.value) })}
              >
                {[5, 10, 15, 20, 30, 60].map((v) => (
                  <option key={v} value={v}>
                    {v} min
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Margen antes (min)</span>
              <input
                className="field__input"
                type="number"
                min="0"
                step="5"
                value={draft.bufferBefore}
                onChange={(e) => setDraft({ ...draft, bufferBefore: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Margen después (min)</span>
              <input
                className="field__input"
                type="number"
                min="0"
                step="5"
                value={draft.bufferAfter}
                onChange={(e) => setDraft({ ...draft, bufferAfter: e.target.value })}
              />
            </label>
          </div>

          <div className="settings-days">{renderWeeklyEditor(draft.workingHours, addRange, removeRange, setRange)}</div>
        </>
      )}

      {section === 'empleado' && (
        <>
          <p className="muted">
            Horarios propios por empleado. Si un día queda sin franjas, el empleado hereda el horario del
            estudio para ese día.
          </p>
          <label className="field settings-intro">
            <span className="field__label">Empleado</span>
            <select
              className="field__input"
              value={selectedEmpleado}
              onChange={(e) => pickEmpleado(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {(empleados || []).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </label>

          {selectedEmpleado && (
            <div className="settings-days">
              {empDraft
                ? renderWeeklyEditor(empDraft, addEmpRange, removeEmpRange, setEmpRange)
                : <p className="muted">Cargando…</p>}
            </div>
          )}
        </>
      )}

      {section === 'excepciones' && (
        <>
          <div className="dash__head">
            <h1 className="dash__title">Excepciones puntuales</h1>
            <button className="btn btn--primary btn--sm" type="button" onClick={startNewExcepcion}>
              Nueva excepción
            </button>
          </div>
          <p className="muted">
            Fechas con horario distinto al habitual: feriados, vacaciones o ajustes de último momento.
          </p>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ámbito</th>
                  <th>Tipo</th>
                  <th>Horario</th>
                  <th>Motivo</th>
                  <th className="data-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {excepciones.map((ex) => (
                  <tr key={ex.id}>
                    <td className="data-table__name" data-label="Fecha">{ex.fecha}</td>
                    <td data-label="Ámbito">{segName(ex.empleado_id)}</td>
                    <td data-label="Tipo">
                      <span className={`chip ${ex.cerrado ? 'chip--off' : 'chip--ok'}`}>
                        {ex.cerrado ? 'cerrado' : 'horario especial'}
                      </span>
                    </td>
                    <td data-label="Horario">
                      {ex.cerrado
                        ? '—'
                        : (ex.franjas || []).map((r) => `${r.start}–${r.end}`).join(', ') || '—'}
                    </td>
                    <td data-label="Motivo"><span className="data-table__meta">{ex.motivo || '—'}</span></td>
                    <td className="data-table__actions" data-label="">
                      <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEditExcepcion(ex)}>
                        Editar
                      </button>
                      <button className="btn btn--danger btn--sm" type="button" onClick={() => setDeleteTarget(ex)}>
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

      {exShowForm && (
        <Modal title={exDraft.id ? 'Editar excepción' : 'Nueva excepción'} onClose={() => setExShowForm(false)}>
          <form className="form" onSubmit={submitExcepcion}>
            <div className="field-row">
              <label className="field">
                <span className="field__label">Fecha</span>
                <input
                  className="field__input"
                  type="date"
                  value={exDraft.fecha}
                  onChange={(e) => setExDraft({ ...exDraft, fecha: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Aplica a</span>
                <select
                  className="field__input"
                  value={exDraft.empleado_id}
                  onChange={(e) => setExDraft({ ...exDraft, empleado_id: e.target.value })}
                >
                  <option value="">Todos (estudio)</option>
                  {(empleados || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={Boolean(exDraft.cerrado)}
                onChange={(e) => setExDraft({ ...exDraft, cerrado: e.target.checked })}
              />
              <span className="field__label">Día cerrado (no se aceptan turnos)</span>
            </label>

            {!exDraft.cerrado && (
              <div className="settings-days">
                {exDraft.franjas.map((r, idx) => (
                  <div className="settings-range" key={`ex-${idx}`}>
                    <label className="field">
                      <span className="field__label">Desde</span>
                      <input
                        className="field__input"
                        type="time"
                        value={r.start}
                        onChange={(e) =>
                          setExDraft({
                            ...exDraft,
                            franjas: exDraft.franjas.map((rr, i) =>
                              i === idx ? { ...rr, start: e.target.value } : rr,
                            ),
                          })
                        }
                      />
                    </label>
                    <span className="settings-range__sep">a</span>
                    <label className="field">
                      <span className="field__label">Hasta</span>
                      <input
                        className="field__input"
                        type="time"
                        value={r.end}
                        onChange={(e) =>
                          setExDraft({
                            ...exDraft,
                            franjas: exDraft.franjas.map((rr, i) =>
                              i === idx ? { ...rr, end: e.target.value } : rr,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      className="btn btn--danger btn--sm settings-range__remove"
                      type="button"
                      onClick={() =>
                        setExDraft({ ...exDraft, franjas: exDraft.franjas.filter((_, i) => i !== idx) })
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={() => setExDraft({ ...exDraft, franjas: [...exDraft.franjas, { start: '09:00', end: '13:00' }] })}
                >
                  + Agregar franja
                </button>
              </div>
            )}

            <label className="field">
              <span className="field__label">Motivo (opcional)</span>
              <input
                className="field__input"
                value={exDraft.motivo}
                onChange={(e) => setExDraft({ ...exDraft, motivo: e.target.value })}
              />
            </label>

            <div className="modal__actions">
              <button className="btn btn--ghost" type="button" onClick={() => setExShowForm(false)}>
                Cancelar
              </button>
              <button className="btn btn--primary" type="submit" disabled={exSaving}>
                {exSaving ? 'Guardando…' : 'Guardar excepción'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar excepción"
          message={`¿Eliminar la excepción del ${deleteTarget.fecha}?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
