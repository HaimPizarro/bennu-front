// Cache local del perfil de bienvenida (solo usuarios logueados, por cuenta).
// El flujo guarda primero en la DB (POST /api/visitantes) y después acá, para
// no consultar la base en cada carga de la landing.

const PROFILE_KEY = 'bennu.visitante:v1'

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // modo privado: solo en memoria
  }
}

export const loadProfile = () => read(PROFILE_KEY, null)

export const saveProfile = (profile) => write(PROFILE_KEY, profile)

export const clearProfile = () => {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch {
    // noop
  }
}

// Nombre corto para saludar: alias si existe, si no el primer nombre.
export const displayName = (profile) => {
  const alias = String(profile?.alias || '').trim()
  if (alias) return alias
  const nombre = String(profile?.nombre || '').trim()
  return nombre ? nombre.split(' ')[0] : ''
}
