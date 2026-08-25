import { useState } from 'react'

const LIGHT_DEFAULT = {
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

const THEME_KEY = 'bennu.theme:v1'
const PREFS_KEY = 'bennu.prefs:v1'

const DEFAULT_PREFS = { mode: 'system', prisma: true }

let systemListenerActive = false
let systemListenerHandler = null

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
const loadColors = () => {
  const saved = loadJSON(THEME_KEY, null)
  return { ...LIGHT_DEFAULT, ...saved }
}

// En modo oscuro se eliminan los valores inline que coinciden con el default
// claro (no personalizados), para que la paleta oscura se aplique limpia.
const applyColors = (colors, theme) => {
  const root = document.documentElement
  Object.entries(VAR_OF).forEach(([key, cssVar]) => {
    if (theme === 'dark' && colors[key] === LIGHT_DEFAULT[key]) {
      root.style.removeProperty(cssVar)
      return
    }
    root.style.setProperty(cssVar, colors[key])
  })
}

const applyPrisma = (enabled) => {
  document.body.classList.toggle('prisma-enabled', enabled)
}

export const resolveTheme = (mode) => {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const onSystemChange = (mq) => {
  const theme = mq.matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  applyColors(loadColors(), theme)
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

export const applySavedTheme = () => {
  const prefs = loadPrefs()
  const theme = resolveTheme(prefs.mode)
  document.documentElement.dataset.theme = theme
  applyColors(loadColors(), theme)
  applyPrisma(prefs.prisma !== false)
  syncSystemListener(prefs.mode)
}

// Sigue los cambios de preferencia del sistema en modo 'system' sin re-aplicar todo.
export const watchSystemTheme = () => {
  syncSystemListener(loadPrefs().mode)
}

export const useThemeColors = () => {
  const [colors, setColors] = useState(loadColors)
  const [prefs, setPrefs] = useState(loadPrefs)

  const currentTheme = () => document.documentElement.dataset.theme || resolveTheme(prefs.mode)

  const setColor = (key, value) => {
    setColors((curr) => {
      const next = { ...curr, [key]: value }
      applyColors(next, currentTheme())
      saveJSON(THEME_KEY, next)
      return next
    })
  }

  const resetColors = () => {
    const root = document.documentElement
    Object.values(VAR_OF).forEach((cssVar) => root.style.removeProperty(cssVar))
    setColors(LIGHT_DEFAULT)
    try {
      localStorage.removeItem(THEME_KEY)
    } catch {
      // noop
    }
  }

  const setMode = (mode) => {
    setPrefs((curr) => {
      const next = { ...curr, mode }
      const theme = resolveTheme(mode)
      document.documentElement.dataset.theme = theme
      applyColors(colors, theme)
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

  return { colors, prefs, setColor, resetColors, setMode, setPrisma }
}
