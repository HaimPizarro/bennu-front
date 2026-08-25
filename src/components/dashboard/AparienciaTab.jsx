import { useThemeColors } from '../../hooks/useThemeColors.js'

export default function AparienciaTab() {
  const { colors, prefs, setColor, resetColors, setMode, setPrisma } = useThemeColors()
  const fields = [
    { key: 'bg', label: 'Fondo', hint: 'Color base de la interfaz' },
    { key: 'bg-mist', label: 'Fondo secundario', hint: 'Superficies y secciones alternas' },
    { key: 'steel', label: 'Acero', hint: 'Color principal de acentos' },
    { key: 'mist', label: 'Neblina', hint: 'Bordes y texto suave' },
    { key: 'slate', label: 'Pizarra', hint: 'Texto principal' },
  ]
  const modes = [
    { key: 'light', label: 'Claro', icon: '◐' },
    { key: 'dark', label: 'Oscuro', icon: '◑' },
    { key: 'system', label: 'Sistema', icon: '◍' },
  ]
  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Ajustes de apariencia</h1>
        <button className="btn btn--ghost btn--sm" type="button" onClick={resetColors}>
          Restaurar paleta
        </button>
      </div>
      <p className="muted">
        Los cambios se aplican al instante y se guardan en este navegador.
      </p>

      <h2 className="dash__subtitle">Modo de color</h2>
      <div className="seg-control" role="tablist" aria-label="Modo de color">
        {modes.map((m) => (
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

      <h2 className="dash__subtitle">Paleta</h2>
      <div className="theme-grid">
        {fields.map((f) => (
          <label className="panel theme-item" key={f.key}>
            <span className="theme-item__swatch">
              <input
                className="theme-item__picker"
                type="color"
                value={colors[f.key]}
                onChange={(e) => setColor(f.key, e.target.value)}
              />
            </span>
            <span className="theme-item__body">
              <strong>{f.label}</strong>
              <span className="theme-item__hint">{f.hint}</span>
              <code className="theme-item__code">{colors[f.key]}</code>
            </span>
          </label>
        ))}
      </div>
    </>
  )
}
