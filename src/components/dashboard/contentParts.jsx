import { useRef, useState } from 'react'
import {
  uploadContenidoImage,
  deleteContenidoImage,
} from '../../lib/api.js'
import { toast } from '../../lib/toast.js'

const MAX_IMAGE_MB = 5

// Campo etiquetado reutilizable que usa las clases globales .field*.
export function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <span className="field__label">{label}</span>}
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function TextField({ label, hint, value = '', onChange, as = 'input', rows, placeholder }) {
  const Tag = as
  return (
    <Field label={label} hint={hint}>
      <Tag
        className="field__input"
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
      />
    </Field>
  )
}

// Selector segmentado (reutiliza .seg-control / .seg del dashboard).
export function SegField({ label, hint, options, value, onChange }) {
  return (
    <Field label={label} hint={hint}>
      <div className="seg-control">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={value === opt.value ? 'seg is-active' : 'seg'}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

// Lista repetible: acepta arrays de primitivos u objetos (via update()).
export function RepeatList({ items = [], onChange, onAdd, renderItem, empty, addLabel = 'Agregar' }) {
  const setItem = (i, value) => onChange(items.map((item, idx) => (idx === i ? value : item)))
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i))
  const move = (i, dir) => {
    const next = [...items]
    const j = i + dir
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="cms-list">
      {items.length === 0 && empty && <p className="muted">{empty}</p>}
      {items.map((item, i) => (
        <div className="cms-row" key={i}>
          <div className="cms-row__toolbar">
            <span className="cms-row__index">{String(i + 1).padStart(2, '0')}</span>
            <div className="dash-row__actions">
              <button
                type="button"
                className="dash__icon-btn"
                aria-label="Mover arriba"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="dash__icon-btn"
                aria-label="Mover abajo"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => removeItem(i)}
              >
                Eliminar
              </button>
            </div>
          </div>
          {renderItem({ item, update: (value) => setItem(i, value), index: i })}
        </div>
      ))}
      {items.length < 20 && (
        <button
          type="button"
          className="btn btn--ghost btn--sm cms-add"
          onClick={() => onChange([...(items || []), onAdd()])}
        >
          + {addLabel}
        </button>
      )}
    </div>
  )
}

// Sube/reemplaza/elimina una imagen en Supabase Storage y edita su texto alt.
export function ImageField({ label, hint, value, onChange, compact = false }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const has = Boolean(value?.url)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\//.test(file.type)) {
      toast.error('El archivo debe ser una imagen.')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`La imagen supera los ${MAX_IMAGE_MB} MB.`)
      return
    }
    setBusy(true)
    try {
      const uploaded = await uploadContenidoImage(file)
      const previous = value?.path
      onChange({ ...uploaded, alt: value?.alt || '' })
      if (previous) {
        deleteContenidoImage(previous).catch(() => {})
      }
      toast.success('Imagen subida.')
    } catch (err) {
      toast.error(err.message || 'No se pudo subir la imagen.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    const previous = value?.path
    onChange(null)
    if (previous) {
      deleteContenidoImage(previous).catch(() => {})
    }
  }

  return (
    <Field label={label} hint={hint}>
      {has ? (
        <div className="cms-image">
          <div className={`cms-image__thumb ${compact ? 'cms-image__thumb--wide' : ''}`}>
            <img src={value.url} alt={value.alt || ''} />
          </div>
          <div className="cms-image__controls">
            <label className="btn btn--ghost btn--sm">
              {busy ? 'Subiendo…' : 'Reemplazar'}
              <input
                ref={inputRef}
                className="visually-hidden"
                type="file"
                accept="image/*"
                onChange={handleFile}
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={handleRemove}
              disabled={busy}
            >
              Quitar
            </button>
            <label className="field cms-image__alt">
              <span className="field__label">Texto alternativo (accesibilidad)</span>
              <input
                className="field__input"
                type="text"
                value={value.alt || ''}
                placeholder="Describe la imagen"
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className={`cms-drop ${busy ? 'is-busy' : ''}`}>
          {busy ? 'Subiendo imagen…' : `Subir ${label || 'imagen'}`}
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy}
          />
        </label>
      )}
    </Field>
  )
}
