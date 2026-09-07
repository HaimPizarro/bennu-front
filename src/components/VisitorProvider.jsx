import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { VisitorContext } from '../context/visitanteContext.js'
import useSessionAuth from '../hooks/useSessionAuth.js'
import { loadProfile, saveProfile, clearProfile } from '../lib/visitante.js'
import { getMiVisitante } from '../lib/api.js'

// Experiencia de bienvenida SOLO para usuarios logueados, ligada a su cuenta.
// Visitantes sin sesión no ven splash ni saludo. Los datos se editan en la
// página /perfil; acá solo se hidrata la cache (local/DB) y se muestra el
// splash breve en la landing.
export default function VisitorProvider({ children }) {
  const { session, loading: sessionLoading } = useSessionAuth()
  const { pathname } = useLocation()
  const [profile, setProfileState] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  const authed = Boolean(session)
  const userId = session?.user?.id || null
  const ready = authed && !sessionLoading && hydrated
  const splashActive = authed && !sessionLoading && pathname === '/'

  const syncProfile = (p) => {
    if (p) {
      saveProfile(p)
      setProfileState(p)
    } else {
      clearProfile()
      setProfileState(null)
    }
  }

  // Sincroniza con la sesión: hidrata cache/DB del usuario; si no hay sesión,
  // limpia (no debe quedar saludo de un usuario anterior).
  useEffect(() => {
    if (sessionLoading) return undefined
    let alive = true

    if (!authed) {
      clearProfile()
      const timer = setTimeout(() => {
        if (alive) {
          setProfileState(null)
          setHydrated(false)
        }
      }, 0)
      return () => {
        alive = false
        clearTimeout(timer)
      }
    }

    const cached = loadProfile()
    if (cached && cached.user_id === userId) {
      const timer = setTimeout(() => {
        if (alive) {
          setProfileState(cached)
          setHydrated(true)
        }
      }, 0)
      return () => {
        alive = false
        clearTimeout(timer)
      }
    }

    clearProfile()
    getMiVisitante()
      .then((data) => {
        if (!alive) return
        if (data) {
          const p = {
            user_id: userId,
            nombre: data.nombre,
            alias: data.alias,
            edad: data.edad ?? null,
          }
          saveProfile(p)
          setProfileState(p)
        }
        setHydrated(true)
      })
      .catch(() => {
        if (alive) setHydrated(true)
      })
    return () => {
      alive = false
    }
  }, [authed, sessionLoading, userId])

  return (
    <VisitorContext.Provider value={{ profile, authed, ready, syncProfile }}>
      {children}

      <BriefSplash key={String(splashActive)} active={splashActive} />
    </VisitorContext.Provider>
  )
}

// Splash corto "Cargando experiencia de usuario…" solo para logueados en la
// landing. Se oculta solo.
function BriefSplash({ active }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) return undefined
    const timer = setTimeout(() => setDone(true), 900)
    return () => clearTimeout(timer)
  }, [active])

  if (!active || done) return null

  return (
    <div className="welcome-splash" role="status">
      <span className="welcome-splash__mark">B</span>
      <p className="welcome-splash__text">Cargando experiencia de usuario…</p>
    </div>
  )
}
