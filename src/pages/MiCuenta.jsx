import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, logout } from '../lib/api.js'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { CLIENT_NAV } from '../components/dashboard/navItems.js'
import ClienteInicioTab from '../components/dashboard/ClienteInicioTab.jsx'
import ClienteAgendaTab from '../components/dashboard/ClienteAgendaTab.jsx'
import CanjeTab from '../components/dashboard/CanjeTab.jsx'
import MembresiaTab from '../components/dashboard/MembresiaTab.jsx'
import FichaTab from '../components/dashboard/FichaTab.jsx'
import '../styles/agenda.css'
import '../styles/dashboard.css'

// Rol 1 = cliente. Mini-dashboard con Inicio / Agenda / Canje.
export default function MiCuenta() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('inicio')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getSession().then((s) => {
      if (!s) {
        navigate('/login', { replace: true })
        return
      }
      setSession(s)
      setLoading(false)
    })
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) return null

  const perfil = session?.perfil || {}

  // Refetch de sesión (actualiza puntos) + remonta el tab activo.
  const refresh = async () => {
    const s = await getSession()
    if (s) setSession(s)
    setRefreshKey((k) => k + 1)
  }

  return (
    <DashboardLayout
      nav={CLIENT_NAV}
      tab={tab}
      onTabChange={setTab}
      onLogout={handleLogout}
      sideNote="Mi cuenta"
      points={perfil.puntos_acumulados}
      userName={perfil.nombre}
    >
      {tab === 'inicio' && <ClienteInicioTab key={refreshKey} perfil={perfil} onRefresh={refresh} />}
      {tab === 'agenda' && <ClienteAgendaTab key={refreshKey} perfil={perfil} onRefresh={refresh} />}
      {tab === 'canje' && <CanjeTab key={refreshKey} perfil={perfil} onRefresh={refresh} />}
      {tab === 'membresia' && <MembresiaTab key={refreshKey} perfil={perfil} onRefresh={refresh} />}
      {tab === 'ficha' && <FichaTab key={refreshKey} perfil={perfil} />}
    </DashboardLayout>
  )
}
