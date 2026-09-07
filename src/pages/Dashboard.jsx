import { useNavigate, Navigate } from 'react-router-dom'
import useDashboardData from '../hooks/useDashboardData.js'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { ADMIN_NAV } from '../components/dashboard/navItems.js'
import ResumenTab from '../components/dashboard/ResumenTab.jsx'
import AgendaTab from '../components/dashboard/AgendaTab.jsx'
import ServiciosTab from '../components/dashboard/ServiciosTab.jsx'
import CategoriasTab from '../components/dashboard/CategoriasTab.jsx'
import EmpleadosTab from '../components/dashboard/EmpleadosTab.jsx'
import ClientesTab from '../components/dashboard/ClientesTab.jsx'
import VisitantesTab from '../components/dashboard/VisitantesTab.jsx'
import FidelizacionTab from '../components/dashboard/FidelizacionTab.jsx'
import SuscripcionesTab from '../components/dashboard/SuscripcionesTab.jsx'
import HorariosTab from '../components/dashboard/HorariosTab.jsx'
import SucursalesTab from '../components/dashboard/SucursalesTab.jsx'
import EventosTab from '../components/dashboard/EventosTab.jsx'
import NotificacionesTab from '../components/dashboard/NotificacionesTab.jsx'
import GoogleCalendarTab from '../components/dashboard/GoogleCalendarTab.jsx'
import AparienciaTab from '../components/dashboard/AparienciaTab.jsx'
import ContenidoTab from '../components/dashboard/ContenidoTab.jsx'
import IntegracionesTab from '../components/dashboard/IntegracionesTab.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import '../styles/agenda.css'
import '../styles/dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const data = useDashboardData()

  if (data.sessionLoading) return null
  if (!data.session) return <Navigate to="/login" replace />

  const rol = Number(data.session?.perfil?.rol)
  if (rol !== 0) return <Navigate to="/mi-cuenta" replace />

  const handleLogout = async () => {
    await data.doLogout()
    navigate('/login')
  }

  return (
    <DashboardLayout
      nav={ADMIN_NAV}
      tab={data.tab}
      onTabChange={data.setTab}
      onLogout={handleLogout}
      sucursales={data.sucursales}
      sucursalId={data.sucursalId}
      onChangeSucursal={data.changeSucursal}
      points={data.session?.perfil?.puntos_acumulados}
      userName={data.session?.perfil?.nombre}
    >
      <ErrorBoundary>
      {data.tab === 'resumen' && (
        <ResumenTab
          appointments={data.appointments}
          services={data.services}
          serviceById={data.serviceById}
          clients={data.clients}
          suscripciones={data.suscripciones}
        />
      )}
      {data.tab === 'agenda' && (
        <AgendaTab
          appointments={data.appointments}
          services={data.services}
          serviceById={data.serviceById}
          registryClients={data.registryClients}
          onSaveAppointment={data.handleSaveAppointment}
          onDeleteAppointment={data.handleDeleteAppointment}
          onStatus={data.handleAppointmentStatus}
          onCreateRecurring={data.handleSaveRecurring}
          onCancelSeries={data.handleCancelSeries}
          onDeleteSeries={data.handleDeleteSeries}
        />
      )}
      {data.tab === 'servicios' && (
        <ServiciosTab
          services={data.services}
          onSave={data.handleSaveService}
          onDelete={data.handleDeleteService}
        />
      )}
      {data.tab === 'categorias' && <CategoriasTab />}
      {data.tab === 'empleados' && (
        <EmpleadosTab
          empleados={data.empleados}
          services={data.services}
          onSave={data.handleSaveEmpleado}
          onDelete={data.handleDeleteEmpleado}
        />
      )}
      {data.tab === 'clientes' && (
        <ClientesTab
          clients={data.clients}
          currentUserId={data.session?.perfil?.id}
          onUpdate={data.handleUpdateUser}
          onDelete={data.handleDeleteUser}
        />
      )}
      {data.tab === 'visitantes' && <VisitantesTab />}
      {data.tab === 'fidelizacion' && (
        <FidelizacionTab
          combos={data.combos}
          services={data.services}
          serviceById={data.serviceById}
          onSaveCombo={data.handleSaveCombo}
          onDeleteCombo={data.handleDeleteCombo}
        />
      )}
      {data.tab === 'membresias' && (
        <SuscripcionesTab
          membresias={data.membresias}
          suscripciones={data.suscripciones}
          clients={data.clients}
          onSaveMembresia={data.handleSaveMembresia}
          onDeleteMembresia={data.handleDeleteMembresia}
          onActivar={data.handleActivarMembresia}
          onDesactivar={data.handleDesactivarSuscripcion}
        />
      )}
      {data.tab === 'horarios' && <HorariosTab empleados={data.empleados} />}
      {data.tab === 'sucursales' && (
        <SucursalesTab
          sucursales={data.sucursales}
          onSave={data.handleSaveSucursal}
          onDelete={data.handleDeleteSucursal}
        />
      )}
      {data.tab === 'eventos' && (
        <EventosTab
          eventos={data.eventos}
          onSave={data.handleSaveEvento}
          onDelete={data.handleDeleteEvento}
        />
      )}
      {data.tab === 'notificaciones' && <NotificacionesTab />}
      {data.tab === 'google' && <GoogleCalendarTab />}
      {data.tab === 'apariencia' && <AparienciaTab />}
      {data.tab === 'contenido' && <ContenidoTab />}
      {data.tab === 'integraciones' && <IntegracionesTab />}
      </ErrorBoundary>
    </DashboardLayout>
  )
}
