import { useEffect, useState } from 'react'
import { getContenido, saveContenido } from '../../lib/api.js'
import { normalizeContenido, DEFAULT_CONTENIDO } from '../../lib/contenidoDefaults.js'
import { toast } from '../../lib/toast.js'
import {
  HeroEditor,
  AboutEditor,
  ResultsEditor,
  ContactEditor,
  SeoEditor,
} from './contenidoSectionEditors.jsx'

const TABS = [
  { id: 'hero', label: 'Inicio', icon: '◈' },
  { id: 'sobre', label: 'Sobre mí', icon: '✦' },
  { id: 'resultados', label: 'Resultados', icon: '♥' },
  { id: 'contacto', label: 'Contacto', icon: '✉' },
  { id: 'seo', label: 'SEO', icon: '⌕' },
]

export default function ContenidoTab() {
  const [doc, setDoc] = useState(() => normalizeContenido(null))
  const [tab, setTab] = useState('hero')
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    getContenido().then((fetched) => {
      if (!alive) return
      setDoc(normalizeContenido(fetched))
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const setSection = (key) => (next) => {
    setDoc((prev) => ({ ...prev, [key]: next }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveContenido(doc)
      setDirty(false)
      toast.success('Contenido guardado y publicado.')
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el contenido.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = () => {
    if (!window.confirm('¿Restaurar todos los valores por defecto del sitio?')) return
    setDoc(normalizeContenido(DEFAULT_CONTENIDO))
    setDirty(true)
    toast.success('Valores por defecto cargados. Presiona Guardar para aplicarlos.')
  }

  if (loading) return <p className="muted">Cargando contenido…</p>

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Contenido del sitio</h1>
        <div className="dash__form-actions">
          <button className="btn btn--ghost btn--sm" type="button" onClick={handleRestore}>
            Restaurar valores por defecto
          </button>
          <button
            className="btn btn--primary btn--sm"
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Guardando…' : 'Guardar y publicar'}
          </button>
        </div>
      </div>
      <p className="muted">
        Textos, imágenes y SEO de la landing. Los cambios se publican en el sitio público al
        guardar y solo los administradores pueden acceder a esta configuración.
      </p>

      <div className="seg-control cms-tabs" role="tablist" aria-label="Secciones del sitio">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'seg is-active' : 'seg'}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="dash__form cms-form">
        {tab === 'hero' && <HeroEditor value={doc.hero} onChange={setSection('hero')} />}
        {tab === 'sobre' && <AboutEditor value={doc.sobreMi} onChange={setSection('sobreMi')} />}
        {tab === 'resultados' && <ResultsEditor value={doc.resultados} onChange={setSection('resultados')} />}
        {tab === 'contacto' && <ContactEditor value={doc.contacto} onChange={setSection('contacto')} />}
        {tab === 'seo' && (
          <SeoEditor
            seo={doc.seo}
            marca={doc.marca}
            onSeo={setSection('seo')}
            onMarca={setSection('marca')}
          />
        )}
      </div>
    </>
  )
}
