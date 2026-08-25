import { useEffect, useState } from 'react'
import {
  getSession,
  logout,
  listServices,
  saveService,
  deleteService,
  listAppointments,
  saveAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  listRegistryClients,
  listCombos,
  saveCombo,
  deleteCombo,
  redeemCombo,
  listClients,
  redeemPoints,
  updateUser,
  deleteUser,
  listEmpleados,
  saveEmpleado,
  deleteEmpleado,
  createRecurringAppointment,
  cancelAppointmentSeries,
  deleteAppointmentSeries,
  listEventos,
  saveEvento,
  deleteEvento,
  listSucursales,
  saveSucursal,
  deleteSucursal,
  getMembresias,
  saveMembresia,
  deleteMembresia,
  listSuscripciones,
  activarMembresia,
  desactivarSuscripcion,
} from '../lib/api.js'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'

export default function useDashboardData() {
  const [session, setSession] = useState(undefined)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [tab, setTab] = useState('resumen')
  const [services, setServices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [registryClients, setRegistryClients] = useState([])
  const [combos, setCombos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [eventos, setEventos] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [sucursalId, setSucursalId] = useState(() => Number(localStorage.getItem('bennu:sucursal') || 1))
  const [membresias, setMembresias] = useState([])
  const [suscripciones, setSuscripciones] = useState([])

  const refresh = async (id = sucursalId) => {
    const sid = Number(id) || 1
    const [sv, ap, cl, rc, cb, em, ev] = await Promise.all([
      listServices(sid),
      listAppointments(sid),
      listClients(),
      listRegistryClients(),
      listCombos(true, sid),
      listEmpleados(sid),
      listEventos(sid),
    ])
    setServices(sv)
    setAppointments(ap)
    setClients(cl)
    setRegistryClients(rc)
    setCombos(cb)
    setEmpleados(em)
    setEventos(ev)
    setMembresias(await getMembresias(true))
    setSuscripciones(await listSuscripciones())
  }

  const loadSucursales = async () => {
    const list = await listSucursales()
    setSucursales(list)
    if (list.length > 0) {
      const current = Number(sucursalId)
      if (!list.some((s) => Number(s.id) === current)) {
        const first = Number(list[0].id)
        setSucursalId(first)
        localStorage.setItem('bennu:sucursal', String(first))
        refresh(first)
      }
    }
  }

  const changeSucursal = (id) => {
    setSucursalId(Number(id))
    localStorage.setItem('bennu:sucursal', String(id))
    refresh(Number(id))
  }

  useEffect(() => {
    listSucursales().then((list) => {
      setSucursales(list)
      if (list.length > 0) {
        const current = Number(sucursalId)
        if (!list.some((s) => Number(s.id) === current)) {
          const first = Number(list[0].id)
          setSucursalId(first)
          localStorage.setItem('bennu:sucursal', String(first))
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    supabase.auth.onAuthStateChange(() => {
      getSession().then((s) => {
        setSession(s)
        setSessionLoading(false)
        if (s) refresh()
      })
    })
    getSession().then((s) => {
      setSession(s)
      setSessionLoading(false)
      if (s) refresh()
    })
  }, [])

  const doLogout = async () => {
    await logout()
  }

  const handleSaveService = async (service) => {
    try {
      await saveService({ ...service, sucursal_id: sucursalId })
      refresh()
      toast.success('Servicio guardado')
    } catch (err) {
      toast.error(err.message || 'Error al guardar servicio')
    }
  }

  const handleDeleteService = async (id) => {
    try {
      await deleteService(id)
      refresh()
      toast.success('Servicio eliminado')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar servicio')
    }
  }

  const handleSaveAppointment = async (appointment) => {
    try {
      await saveAppointment({ ...appointment, sucursal_id: sucursalId })
      refresh()
      toast.success('Cita guardada')
    } catch (err) {
      toast.error(err.message || 'Error al guardar cita')
    }
  }

  const handleDeleteAppointment = async (id) => {
    try {
      await deleteAppointment(id)
      refresh()
      toast.success('Cita eliminada')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar cita')
    }
  }

  const handleAppointmentStatus = async (id, estado) => {
    try {
      const updated = await updateAppointmentStatus(id, estado)
      refresh()
      if (estado === 'Completada') {
        const puntos = updated?.__award?.puntos || 0
        toast.success(
          puntos > 0 ? `Cita completada · +${puntos} pts al cliente` : 'Cita completada',
        )
      } else {
        toast.success('Estado actualizado')
      }
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el estado')
    }
  }

  const handleSaveCombo = async (combo) => {
    try {
      await saveCombo({ ...combo, sucursal_id: sucursalId })
      refresh()
      toast.success('Servicio combinado guardado')
    } catch (err) {
      toast.error(err.message || 'Error al guardar servicio combinado')
    }
  }

  const handleDeleteCombo = async (id) => {
    try {
      await deleteCombo(id)
      refresh()
      toast.success('Servicio combinado eliminado')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar servicio combinado')
    }
  }

  const handleRedeemCombo = async (comboId, fechaHora) => {
    try {
      const data = await redeemCombo(comboId, fechaHora)
      refresh()
      toast.success(data?.message || 'Combo canjeado con éxito')
      return data
    } catch (err) {
      toast.error(err.message || 'Error al canjear el combo')
      throw err
    }
  }

  const handleRedeem = async (clientId, puntos) => {
    try {
      await redeemPoints(clientId, puntos)
      refresh()
      toast.success('Puntos canjeados')
    } catch (err) {
      toast.error(err.message || 'Error al canjear puntos')
    }
  }

  const handleUpdateUser = async (id, data) => {
    try {
      await updateUser(id, data)
      refresh()
      toast.success('Usuario actualizado')
    } catch (err) {
      toast.error(err.message || 'Error al actualizar usuario')
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id)
      refresh()
      toast.success('Usuario eliminado')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar usuario')
    }
  }

  const handleSaveEmpleado = async (empleado) => {
    try {
      await saveEmpleado({ ...empleado, sucursal_id: sucursalId })
      refresh()
      toast.success('Empleado guardado')
    } catch (err) {
      toast.error(err.message || 'Error al guardar empleado')
    }
  }

  const handleDeleteEmpleado = async (id) => {
    try {
      await deleteEmpleado(id)
      refresh()
      toast.success('Empleado eliminado')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar empleado')
    }
  }

  const handleSaveRecurring = async (appointment) => {
    try {
      const result = await createRecurringAppointment(appointment)
      refresh()
      toast.success(`Serie creada · ${result?.count || 1} citas`)
    } catch (err) {
      toast.error(err.message || 'Error al crear la serie')
    }
  }

  const handleCancelSeries = async (id) => {
    try {
      const result = await cancelAppointmentSeries(id)
      refresh()
      toast.success(`Serie cancelada · ${result?.cancelled || 0} citas`)
    } catch (err) {
      toast.error(err.message || 'Error al cancelar la serie')
    }
  }

  const handleDeleteSeries = async (id) => {
    try {
      const result = await deleteAppointmentSeries(id)
      refresh()
      toast.success(`Serie eliminada · ${result?.deleted || 0} citas`)
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la serie')
    }
  }

  const handleSaveEvento = async (evento) => {
    try {
      await saveEvento({ ...evento, sucursal_id: sucursalId })
      refresh()
      toast.success('Evento guardado')
    } catch (err) {
      toast.error(err.message || 'Error al guardar evento')
    }
  }

  const handleDeleteEvento = async (id) => {
    try {
      await deleteEvento(id)
      refresh()
      toast.success('Evento eliminado')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar evento')
    }
  }

  const handleSaveSucursal = async (sucursal) => {
    try {
      await saveSucursal({ ...sucursal })
      loadSucursales()
      toast.success('Sucursal guardada')
    } catch (err) {
      toast.error(err.message || 'Error al guardar sucursal')
    }
  }

  const handleDeleteSucursal = async (id) => {
    try {
      await deleteSucursal(id)
      if (Number(sucursalId) === Number(id)) {
        const rest = sucursales.filter((s) => Number(s.id) !== Number(id))
        if (rest.length > 0) changeSucursal(rest[0].id)
      }
      loadSucursales()
      toast.success('Sucursal eliminada')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar sucursal')
    }
  }

  const handleSaveMembresia = async (payload) => {
    try {
      await saveMembresia(payload)
      setMembresias(await getMembresias(true))
      toast.success('Membresía guardada')
    } catch (err) {
      toast.error(err.message || 'Error al guardar la membresía')
    }
  }

  const handleDeleteMembresia = async (id) => {
    try {
      await deleteMembresia(id)
      setMembresias(await getMembresias(true))
      toast.success('Membresía eliminada')
    } catch (err) {
      toast.error(err.message || 'Error al eliminar la membresía')
    }
  }

  const handleActivarMembresia = async (userId, planId) => {
    try {
      await activarMembresia(userId, planId)
      setSuscripciones(await listSuscripciones())
      toast.success('Membresía activada para el cliente')
    } catch (err) {
      toast.error(err.message || 'Error al activar la membresía')
      throw err
    }
  }

  const handleDesactivarSuscripcion = async (id) => {
    try {
      await desactivarSuscripcion(id)
      setSuscripciones(await listSuscripciones())
      toast.success('Suscripción desactivada')
    } catch (err) {
      toast.error(err.message || 'Error al desactivar la suscripción')
    }
  }

  const serviceById = new Map(services.filter(Boolean).map((s) => [s.id, s]))

  return {
    session,
    sessionLoading,
    tab,
    setTab,
    services,
    appointments,
    clients,
    registryClients,
    combos,
    empleados,
    eventos,
    serviceById,
    doLogout,
    handleSaveService,
    handleDeleteService,
    handleSaveAppointment,
    handleDeleteAppointment,
    handleAppointmentStatus,
    handleSaveCombo,
    handleDeleteCombo,
    handleRedeemCombo,
    handleRedeem,
    handleUpdateUser,
    handleDeleteUser,
    handleSaveEmpleado,
    handleDeleteEmpleado,
    handleSaveRecurring,
    handleCancelSeries,
    handleDeleteSeries,
    handleSaveEvento,
    handleDeleteEvento,
    sucursales,
    sucursalId,
    changeSucursal,
    handleSaveSucursal,
    handleDeleteSucursal,
    membresias,
    suscripciones,
    handleSaveMembresia,
    handleDeleteMembresia,
    handleActivarMembresia,
    handleDesactivarSuscripcion,
  }
}
