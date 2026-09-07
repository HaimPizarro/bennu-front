import { useState } from 'react'

// Paleta por defecto (clara). La paleta de marca (global, para todos los
// visitantes) se guarda en la DB (contenido_sitio.tema.colors) y se aplica con
// applyBrandColors() una vez que el contenido llega. El modo claro/oscuro y el
// prisma siguen siendo preferencias personales por navegador (localStorage).

export const LIGHT_DEFAULT = {
  bg: '#feffff',
  'bg-mist': '#eff5f9',
  steel: '#5d7a8c',
  mist: '#9cafbe',
  slate: '#3e4349',
}

const VAR_OF = {
  bg: '--bg',
  'bg-mist': '--bg-mist',
  steel: '--steel',
  mist: '--mist',
  slate: '--slate',
}

const PREFS_KEY = 'bennu.prefs:v1'

const DEFAULT_PREFS = { mode: 'system', prisma: true }

let systemListenerActive = false
let systemListenerHandler = null
let brandColors = { ...LIGHT_DEFAULT }

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // private mode / quota: keep in-memory only
  }
}

const loadPrefs = () => ({ ...DEFAULT_PREFS, ...loadJSON(PREFS_KEY, {}) })

const applyPrisma = (enabled) => {
  document.body.classList.toggle('prisma-enabled', enabled)
}

// Aplica la paleta de marca (global) sobre las variables CSS: los valores que
// coinciden con el default claro se quitan para que funcionen las variables
// propias (incluido el modo oscuro); los personalizados se fijan inline.
export const applyBrandColors = (palette) => {
  const merged = { ...LIGHT_DEFAULT, ...(palette || {}) }
  brandColors = merged
  const root = document.documentElement
  Object.entries(VAR_OF).forEach(([key, cssVar]) => {
    const value = merged[key]
    if (!value || value.toLowerCase() === LIGHT_DEFAULT[key]) {
      root.style.removeProperty(cssVar)
    } else {
      root.style.setProperty(cssVar, value)
    }
  })
}

export const getBrandColors = () => ({ ...brandColors })

export const resolveTheme = (mode) => {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const onSystemChange = (mq) => {
  document.documentElement.dataset.theme = mq.matches ? 'dark' : 'light'
}

const syncSystemListener = (mode) => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (mode === 'system' && mq) {
    if (!systemListenerActive) {
      systemListenerHandler = () => onSystemChange(mq)
      mq.addEventListener?.('change', systemListenerHandler)
      systemListenerActive = true
    }
  } else if (systemListenerActive && mq) {
    mq.removeEventListener?.('change', systemListenerHandler)
    systemListenerActive = false
    systemListenerHandler = null
  }
}

// Aplicación al arranque (antes del fetch del contenido): modo, prisma y
// dataset de tema. La paleta de marca se aplica cuando llega el contenido.
export const applySavedTheme = () => {
  const prefs = loadPrefs()
  document.documentElement.dataset.theme = resolveTheme(prefs.mode)
  applyPrisma(prefs.prisma !== false)
  syncSystemListener(prefs.mode)
}

// Sigue los cambios de preferencia del sistema en modo 'system' sin re-aplicar todo.
export const watchSystemTheme = () => {
  syncSystemListener(loadPrefs().mode)
}

export const useThemeColors = () => {
  const [prefs, setPrefs] = useState(loadPrefs)

  const setMode = (mode) => {
    setPrefs((curr) => {
      const next = { ...curr, mode }
      document.documentElement.dataset.theme = resolveTheme(mode)
      syncSystemListener(mode)
      saveJSON(PREFS_KEY, next)
      return next
    })
  }

  const setPrisma = (enabled) => {
    setPrefs((curr) => {
      const next = { ...curr, prisma: enabled }
      applyPrisma(enabled)
      saveJSON(PREFS_KEY, next)
      return next
    })
  }

  return { prefs, setMode, setPrisma }
}
