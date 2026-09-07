import { useEffect, useRef, useState } from 'react'
import { useThemeColors, applyBrandColors } from '../../hooks/useThemeColors.js'
import { useSiteContent } from '../../context/siteContent.js'
import { saveContenido } from '../../lib/api.js'
import { TEMA_DEFAULT_COLORS } from '../../lib/contenidoDefaults.js'
import { toast } from '../../lib/toast.js'

const FIELDS = [
  { key: 'bg', label: 'Fondo', hint: 'Color base de la interfaz' },
  { key: 'bg-mist', label: 'Fondo secundario', hint: 'Superficies y secciones alternas' },
  { key: 'steel', label: 'Acero', hint: 'Color principal de acentos' },
  { key: 'mist', label: 'Neblina', hint: 'Bordes y texto suave' },
  { key: 'slate', label: 'Pizarra', hint: 'Texto principal' },
]

const MODES = [
  { key: 'light', label: 'Claro', icon: '◐' },
  { key: 'dark', label: 'Oscuro', icon: '◑' },
  { key: 'system', label: 'Sistema', icon: '◍' },
]

export default function AparienciaTab() {
  const { loading, contenido } = useSiteContent()
  if (loading) return <p className="muted">Cargando apariencia…</p>
  const palette = { ...TEMA_DEFAULT_COLORS, ...(contenido?.tema?.colors || {}) }
  return <PaletteEditor initialPalette={palette} />
}

function PaletteEditor({ initialPalette }) {
  const { prefs, setMode, setPrisma } = useThemeColors()
  const [draft, setDraft] = useState(initialPalette)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const lastSaved = useRef(initialPalette)

  // Al salir sin guardar, revierte la vista previa a la última paleta guardada.
  useEffect(
    () => () => {
      applyBrandColors(lastSaved.current)
    },
    [lastSaved],
  )

  const changeColor = (key, value) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      applyBrandColors(next)
      return next
    })
    setDirty(true)
  }

  const restoreDefaults = () => {
    const def = { ...TEMA_DEFAULT_COLORS }
    setDraft(def)
    applyBrandColors(def)
    setDirty(true)
  }

  const savePalette = async () => {
    setSaving(true)
    try {
      const colors = { ...draft }
      await saveContenido({ tema: { colors } })
      lastSaved.current = colors
      applyBrandColors(colors)
      setDirty(false)
      toast.success('Paleta guardada. Se aplica para todos los visitantes.')
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la paleta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Ajustes de apariencia</h1>
        <div className="dash__form-actions">
          <button className="btn btn--ghost btn--sm" type="button" onClick={restoreDefaults}>
            Restaurar valores por defecto
          </button>
          <button
            className="btn btn--primary btn--sm"
            type="button"
            onClick={savePalette}
            disabled={!dirty || saving}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
      <p className="muted">
        {dirty && <strong className="int-warn-inline">Hay cambios sin guardar. </strong>}
        El color se ve en vivo mientras lo cambias, pero solo queda guardado para todos los
        visitantes al pulsar “Guardar cambios”.
      </p>

      <h2 className="dash__subtitle">Modo de color</h2>
      <div className="seg-control" role="tablist" aria-label="Modo de color">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={prefs.mode === m.key}
            className={prefs.mode === m.key ? 'seg is-active' : 'seg'}
            onClick={() => setMode(m.key)}
          >
            <span aria-hidden="true">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      <h2 className="dash__subtitle">Efectos</h2>
      <div className="panel theme-item">
        <span className="switch">
          <input
            type="checkbox"
            checked={prefs.prisma !== false}
            onChange={(e) => setPrisma(e.target.checked)}
            aria-label="Prisma de luz"
          />
          <span className="switch__track" aria-hidden="true" />
        </span>
        <span className="theme-item__body">
          <strong>Prisma de luz</strong>
          <span className="theme-item__hint">
            Haz de luz sutil al navegar entre páginas y secciones
          </span>
        </span>
      </div>

      <h2 className="dash__subtitle">Paleta del sitio (global)</h2>
      <div className="theme-grid">
        {FIELDS.map((f) => (
          <label className="panel theme-item" key={f.key}>
            <span className="theme-item__swatch">
              <input
                className="theme-item__picker"
                type="color"
                value={draft[f.key] || TEMA_DEFAULT_COLORS[f.key]}
                onChange={(e) => changeColor(f.key, e.target.value)}
              />
            </span>
            <span className="theme-item__body">
              <strong>{f.label}</strong>
              <span className="theme-item__hint">{f.hint}</span>
              <code className="theme-item__code">{draft[f.key] || TEMA_DEFAULT_COLORS[f.key]}</code>
            </span>
          </label>
        ))}
      </div>
    </>
  )
}
