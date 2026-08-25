import { useEffect, useRef, useState } from 'react'
import Modal from '../Modal.jsx'
import { toast } from '../../lib/toast.js'
import { saveFicha } from '../../lib/api.js'
import {
  FICHA_SECTIONS,
  FICHA_CONSENT_TEXT,
  FICHA_FOTOS_TEXT,
  emptyFicha,
  emptySesion,
} from '../../lib/ficha.js'

function FieldInput({ field, value, onChange }) {
  const shared = {
    id: field.key,
    className: 'field__input',
    value: value ?? '',
    onChange: (e) => onChange(field.key, e.target.value),
  }
  if (field.type === 'textarea') {
    return <textarea {...shared} rows={2} />
  }
  if (field.type === 'select') {
    return (
      <select {...shared}>
        <option value="">—</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }
  return <input {...shared} type={field.type === 'date' ? 'date' : 'text'} />
}

function FirmaCanvas({ firma, onFirmaChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const hasContentRef = useRef(false)

  // Al montar, si ya existe una firma guardada la dibuja en el canvas.
  useEffect(() => {
    if (!firma || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
      hasContentRef.current = true
    }
    img.src = firma
  }, [firma])

  const pointFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    }
  }

  const start = (e) => {
    drawingRef.current = true
    const ctx = canvasRef.current.getContext('2d')
    const p = pointFromEvent(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const slate = getComputedStyle(document.documentElement).getPropertyValue('--slate').trim()
    ctx.strokeStyle = slate || '#3E4349'
  }

  const move = (e) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const p = pointFromEvent(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    hasContentRef.current = true
  }

  const end = () => {
    drawingRef.current = false
    if (hasContentRef.current) onFirmaChange(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    hasContentRef.current = false
    onFirmaChange('')
  }

  return (
    <div className="ficha-firma">
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="ficha-firma__canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button className="btn btn--ghost btn--sm" type="button" onClick={clear}>
        Limpiar firma
      </button>
    </div>
  )
}

export default function FichaAdminModal({ user, initialContent, onClose }) {
  const [form, setForm] = useState(() => {
    const base = initialContent && typeof initialContent === 'object' ? initialContent : {}
    return {
      ...emptyFicha(),
      ...base,
      datos_personales: { ...(base.datos_personales || {}) },
      anamnesis: { ...(base.anamnesis || {}) },
      habitos: { ...(base.habitos || {}) },
      analisis_cutaneo: { ...(base.analisis_cutaneo || {}) },
      consentimiento: {
        aceptado: false,
        autoriza_fotos: false,
        firma: '',
        fecha: new Date().toISOString().slice(0, 10),
        observaciones: '',
        ...(base.consentimiento || {}),
      },
      sesiones: Array.isArray(base.sesiones) ? [...base.sesiones] : [],
    }
  })
  const [saving, setSaving] = useState(false)

  const setSectionValue = (section, key, value) => {
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }))
  }

  const setSesion = (index, key, value) => {
    setForm((f) => ({
      ...f,
      sesiones: f.sesiones.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    }))
  }

  const removeSesion = (index) => {
    setForm((f) => ({ ...f, sesiones: f.sesiones.filter((_, i) => i !== index) }))
  }

  const addSesion = () => {
    setForm((f) => ({ ...f, sesiones: [...f.sesiones, emptySesion()] }))
  }

  const onUploadMapa = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSectionValue('analisis_cutaneo', 'mapa_facial', reader.result)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    const contenido = {
      datos_personales: form.datos_personales,
      anamnesis: form.anamnesis,
      habitos: form.habitos,
      analisis_cutaneo: form.analisis_cutaneo,
      consentimiento: form.consentimiento,
      sesiones: form.sesiones,
    }
    setSaving(true)
    try {
      await saveFicha(user.id, contenido)
      toast.success('Ficha clínica guardada')
      onClose()
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la ficha')
      setSaving(false)
    }
  }

  return (
    <Modal title={`Ficha clínica — ${user.name || 'Cliente'}`} onClose={onClose} className="modal__card--wide">
      <div className="form">
        <div className="ficha-user">
          <strong>{user.name}</strong>
          <span className="muted">
            {[user.email, user.phone].filter(Boolean).join(' · ')}
          </span>
        </div>

        {FICHA_SECTIONS.map((section) => (
          <section key={section.key} className="ficha-section">
            <h3 className="ficha-section__title">{section.title}</h3>
            <div className="field-row">
              {section.fields.map((field) => (
                <label key={field.key} className="field">
                  <span className="field__label">{field.label}</span>
                  <FieldInput
                    field={field}
                    value={form[section.key][field.key]}
                    onChange={(k, v) => setSectionValue(section.key, k, v)}
                  />
                </label>
              ))}
            </div>
            {section.hasMapaFacial && (
              <div className="ficha-mapa">
                <span className="field__label">Mapa facial (lesiones, manchas)</span>
                {form.analisis_cutaneo.mapa_facial ? (
                  <figure className="ficha-img">
                    <img src={form.analisis_cutaneo.mapa_facial} alt="Mapa facial" />
                    <figcaption>
                      <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        onClick={() => setSectionValue('analisis_cutaneo', 'mapa_facial', '')}
                      >
                        Quitar imagen
                      </button>
                    </figcaption>
                  </figure>
                ) : (
                  <label className="field">
                    <span className="btn btn--ghost btn--sm">Subir imagen del mapa facial</span>
                    <input
                      className="visually-hidden"
                      type="file"
                      accept="image/*"
                      onChange={onUploadMapa}
                    />
                  </label>
                )}
              </div>
            )}
          </section>
        ))}

        <section className="ficha-section">
          <div className="ficha-section__head">
            <h3 className="ficha-section__title">Protocolo y evolución del tratamiento</h3>
            <button className="btn btn--ghost btn--sm" type="button" onClick={addSesion}>
              Agregar sesión
            </button>
          </div>
          {form.sesiones.length === 0 && <p className="muted">Sin sesiones registradas.</p>}
          {form.sesiones.map((sesion, i) => (
            <div key={i} className="ficha-sesion-edit">
              <div className="ficha-section__head">
                <h4 className="ficha-sesion-edit__title">Sesión {i + 1}</h4>
                <button
                  className="btn btn--danger btn--sm"
                  type="button"
                  onClick={() => removeSesion(i)}
                >
                  Quitar
                </button>
              </div>
              <div className="field-row">
                <label className="field">
                  <span className="field__label">Fecha</span>
                  <input
                    className="field__input"
                    type="date"
                    value={sesion.fecha || ''}
                    onChange={(e) => setSesion(i, 'fecha', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Tratamiento realizado</span>
                  <input
                    className="field__input"
                    value={sesion.tratamiento || ''}
                    onChange={(e) => setSesion(i, 'tratamiento', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Aparatología utilizada</span>
                  <input
                    className="field__input"
                    value={sesion.aparatologia || ''}
                    onChange={(e) => setSesion(i, 'aparatologia', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Principios activos</span>
                  <input
                    className="field__input"
                    value={sesion.principios_activos || ''}
                    onChange={(e) => setSesion(i, 'principios_activos', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Observaciones</span>
                  <textarea
                    className="field__input"
                    rows={2}
                    value={sesion.observaciones || ''}
                    onChange={(e) => setSesion(i, 'observaciones', e.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </section>

        <section className="ficha-section">
          <h3 className="ficha-section__title">Consentimiento informado</h3>
          <label className="field field--check">
            <input
              type="checkbox"
              checked={Boolean(form.consentimiento.aceptado)}
              onChange={(e) => setSectionValue('consentimiento', 'aceptado', e.target.checked)}
            />
            <span>{FICHA_CONSENT_TEXT}</span>
          </label>
          <label className="field field--check">
            <input
              type="checkbox"
              checked={Boolean(form.consentimiento.autoriza_fotos)}
              onChange={(e) => setSectionValue('consentimiento', 'autoriza_fotos', e.target.checked)}
            />
            <span>{FICHA_FOTOS_TEXT}</span>
          </label>
          <div className="field-row">
            <label className="field">
              <span className="field__label">Fecha</span>
              <input
                className="field__input"
                type="date"
                value={form.consentimiento.fecha || ''}
                onChange={(e) => setSectionValue('consentimiento', 'fecha', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Observaciones del consentimiento</span>
              <textarea
                className="field__input"
                rows={2}
                value={form.consentimiento.observaciones || ''}
                onChange={(e) => setSectionValue('consentimiento', 'observaciones', e.target.value)}
              />
            </label>
          </div>
          <div className="ficha-firma-wrap">
            <span className="field__label">Firma del cliente</span>
            <FirmaCanvas
              firma={form.consentimiento.firma}
              onFirmaChange={(v) => setSectionValue('consentimiento', 'firma', v)}
            />
          </div>
        </section>

        <div className="modal__actions">
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn--primary" type="button" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar ficha'}
          </button>
        </div>
      </div>
    </Modal>
  )
}