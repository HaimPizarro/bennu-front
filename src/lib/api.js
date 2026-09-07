import { supabase } from './supabaseClient.js'

const SESSION_KEY = 'bennu.session:v1'
const THEME_KEY = 'bennu.theme:v1'

// Base URL del backend (Vercel -> Render). En dev, si VITE_API_URL no está
// definida, se resuelve por el proxy de Vite hacia el backend local.
const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
const apiUrl = (path) => `${API_BASE}${path}`

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

// Map backend Spanish field names to frontend English names.
// Returns null for falsy rows so callers can filter corrupted data.
const mapService = (s) => {
  if (!s) return null
  return {
    id: s.id,
    name: s.nombre,
    description: s.descripcion,
    price: Number(s.precio),
    precio_oferta: s.precio_oferta ? Number(s.precio_oferta) : null,
    descuento_suscripcion: Number(s.descuento_suscripcion) || 0,
    category: s.categoria,
    categoria_id: s.categoria_id ?? null,
    duration: s.duracion_minutos,
    capacidad: s.capacidad ?? 1,
    buffer_previo: s.buffer_previo_minutos ?? null,
    buffer_posterior: s.buffer_posterior_minutos ?? null,
    puntos_otorgados: s.puntos_otorgados,
    active: s.active,
    servicios_combo_ids: s.servicios_combo_ids || [],
    campos: Array.isArray(s.campos) ? s.campos : [],
  }
}

// Normalize a row to frontend format. Backend rows come in Spanish (map them);
// localStorage already stores frontend format (keep as-is). Filters falsy rows.
const normalizeService = (s) => (s && s.nombre !== undefined ? mapService(s) : s)

// Map frontend English field names to backend Spanish names
const toBackendService = (s) => ({
  nombre: s.name,
  descripcion: s.description,
  precio: s.price,
  precio_oferta: s.precio_oferta || null,
  descuento_suscripcion: Number(s.descuento_suscripcion) || 0,
  categoria: s.category,
  categoria_id: s.categoria_id ?? null,
  duracion_minutos: s.duration,
  capacidad: s.capacidad || 1,
  buffer_previo_minutos: s.buffer_previo ?? null,
  buffer_posterior_minutos: s.buffer_posterior ?? null,
  puntos_otorgados: s.puntos_otorgados,
  active: s.active,
  servicios_combo_ids: s.servicios_combo_ids || [],
  campos: Array.isArray(s.campos) ? s.campos : [],
})

// Resolve the current access token for authenticated backend calls
const authToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

// Authenticated GET for protected endpoints (admin dashboard). Throws on
// failure: no mock fallback, so invented ids never reach the real DB.
const withSucursal = (url, sucursalId) =>
  sucursalId ? `${url}${url.includes('?') ? '&' : '?'}sucursal_id=${encodeURIComponent(sucursalId)}` : url

const fetchWithAuth = async (url) => {
  const token = await authToken()
  if (!token) throw new Error('Sin sesión')
  const res = await fetch(apiUrl(url), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Backend error')
  return json.data
}

// Mutate via backend API. Throws on failure: no mock fallback.
const mutateBackend = async (method, url, body) => {
  const token = await authToken()
  const res = await fetch(apiUrl(url), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Backend error')
  return json.data
}

// catalog
export const listServices = async (sucursalId) => {
  const res = await fetch(apiUrl(withSucursal('/api/services', sucursalId)))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Backend error')
  const data = json.data
  return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeService)
}

// Categorías de servicios (lectura pública; mutaciones solo admin).
export const listCategorias = async () => {
  try {
    const res = await fetch(apiUrl('/api/categorias'))
    if (!res.ok) return []
    const json = await res.json()
    return json.success ? json.data : []
  } catch {
    return []
  }
}

export const saveCategoria = async (categoria) => {
  const isNew = !categoria.id
  const saved = await mutateBackend(
    isNew ? 'POST' : 'PUT',
    isNew ? '/api/categorias' : `/api/categorias/${categoria.id}`,
    { nombre: categoria.nombre },
  )
  return saved
}

export const deleteCategoria = async (id) => {
  await mutateBackend('DELETE', `/api/categorias/${id}`, null)
}

export const saveService = async (service) => {
  const isNew = typeof service.id === 'string' && service.id.startsWith('s-')
  const url = isNew ? '/api/services' : `/api/services/${service.id}`
  const method = isNew ? 'POST' : 'PUT'

  const saved = await mutateBackend(method, url, toBackendService(service))
  return saved && saved.nombre !== undefined ? mapService(saved) : saved
}

export const deleteService = async (id) => {
  await mutateBackend('DELETE', `/api/services/${id}`, null)
}

// citas — dashboard (backend real)
const toBackendAppointment = (a) => ({
  service_id: a.serviceId,
  fecha_hora: a.date && a.time ? `${a.date}T${a.time}:00` : undefined,
  estado: a.status,
  user_id: a.userId || null,
  cliente_nombre: a.clientName || null,
  cliente_email: a.clientEmail || null,
  cliente_telefono: a.clientPhone || null,
  notas: a.notes || null,
  recurrencia: a.recurrencia || 'none',
  recurrencia_hasta: a.recurrencia_hasta || null,
})

const normalizeAppointment = (a) => {
  if (!a) return null
  const [date, time] = (a.fecha_hora || '').split('T')
  return {
    id: a.id,
    serviceId: a.service_id,
    userId: a.user_id || null,
    date,
    time: (time || '').slice(0, 5),
    status: a.estado,
    clientName: a.cliente_nombre || a.users?.nombre || '',
    clientEmail: a.cliente_email || a.users?.email || '',
    clientPhone: a.cliente_telefono || a.users?.telefono || '',
    notes: a.notas || '',
    puntos_abonados: Boolean(a.puntos_abonados),
    recurrencia: a.recurrencia || 'none',
    recurrencia_id: a.recurrencia_id || null,
    recurrencia_hasta: a.recurrencia_hasta || null,
    respuestas: a.respuestas && typeof a.respuestas === 'object' ? a.respuestas : {},
    service: a.services
      ? {
          name: a.services.nombre,
          price: Number(a.services.precio),
          precio_oferta: a.services.precio_oferta ? Number(a.services.precio_oferta) : null,
          duration: a.services.duracion_minutos,
          puntos_otorgados: a.services.puntos_otorgados,
        }
      : null,
  }
}

export const listAppointments = async (sucursalId) => {
  let data
  try {
    data = await fetchWithAuth(withSucursal('/api/appointments', sucursalId))
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAppointment)
}

// Citas del propio cliente autenticado. El backend extrae el ID del token JWT,
// nunca de un parámetro de URL, para impedir ver citas de otros usuarios.
export const listUserAppointments = async () => {
  let data
  try {
    data = await fetchWithAuth('/api/appointments/me')
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAppointment)
}

export const saveAppointment = async (appointment) => {
  const isNew = !appointment.id
  const url = isNew ? '/api/appointments' : `/api/appointments/${appointment.id}`
  const method = isNew ? 'POST' : 'PUT'
  const saved = await mutateBackend(method, url, toBackendAppointment(appointment))
  return saved && saved.fecha_hora ? normalizeAppointment(saved) : appointment
}

export const deleteAppointment = async (id) => {
  await mutateBackend('DELETE', `/api/appointments/${id}`, null)
}

export const updateAppointmentStatus = async (id, estado) => {
  const saved = await mutateBackend('PUT', `/api/appointments/${id}/status`, { estado })
  const normalized = normalizeAppointment(saved)
  if (normalized && saved?.__award) normalized.__award = saved.__award
  return normalized
}

export const createRecurringAppointment = async (appointment) => {
  const saved = await mutateBackend('POST', '/api/appointments/recurring', toBackendAppointment(appointment))
  return saved
}

export const cancelAppointmentSeries = async (id) => {
  const saved = await mutateBackend('PUT', `/api/appointments/${id}/series`, null)
  return saved
}

export const deleteAppointmentSeries = async (id) => {
  const saved = await mutateBackend('DELETE', `/api/appointments/${id}/series`, null)
  return saved
}

// Clientes registrados (rol 1) para el selector del popup de citas, reales desde
// el backend. Sin fallback al mock: un id inventado nunca se manda a la BD.
export const listRegistryClients = async () => {
  let data
  try {
    data = await fetchWithAuth('/api/users/clients')
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map((c) => ({
    id: c.id,
    name: c.nombre || c.name || '',
    email: c.email || '',
    phone: c.telefono || '',
  }))
}

// horarios / configuración
const mapSettings = (s) =>
  s
    ? {
        slotInterval: s.slot_interval_minutes,
        bufferBefore: s.buffer_before_minutes,
        bufferAfter: s.buffer_after_minutes,
        workingHours: s.working_hours,
      }
    : null

export const getSettings = async () => {
  try {
    const data = await fetchWithAuth('/api/settings')
    return mapSettings(data)
  } catch {
    return null
  }
}

// Lectura pública (sin token) para el calendario del cliente.
export const getPublicSettings = async () => {
  try {
    const res = await fetch(apiUrl('/api/settings'))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? mapSettings(json.data) : null
  } catch {
    return null
  }
}

export const saveSettings = async (settings) => {
  const saved = await mutateBackend(
    'PUT',
    '/api/settings',
    {
      slot_interval_minutes: settings.slotInterval,
      buffer_before_minutes: settings.bufferBefore,
      buffer_after_minutes: settings.bufferAfter,
      working_hours: settings.workingHours,
    },
  )
  return mapSettings(saved) || settings
}

// disponibilidad pública: slots de un día (5-min, con bloqueos y buffers).
// Si se pasa `serviceId`, el backend resuelve duración + buffers del servicio y
// solo devuelve los slots donde ese bloque entra sin solaparse ni exceder la jornada.
export const listAvailability = async (date, serviceId) => {
  try {
    const q = serviceId != null ? `?service_id=${encodeURIComponent(serviceId)}` : ''
    const res = await fetch(apiUrl(`/api/availability/${date}${q}`))
    if (!res.ok) return null
    const json = await res.json()
    if (!json.success) return null
    return json.data
  } catch {
    return null
  }
}

// Disponibilidad de un rango de fechas en una sola llamada (puntos del calendario).
export const listAvailabilityRange = async (from, to) => {
  try {
    const res = await fetch(apiUrl(`/api/availability/range?from=${from}&to=${to}`))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data?.days : null
  } catch {
    return null
  }
}

// reserva pública (walk-in o usuario logueado según token presente).
export const createPublicBooking = async ({ serviceId, fechaHora, name, email, phone, respuestas }) => {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const url = '/api/bookings'
  const res = await fetch(apiUrl(url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      service_id: serviceId,
      fecha_hora: fechaHora,
      cliente_nombre: name,
      cliente_email: email,
      cliente_telefono: phone,
      respuestas: respuestas || {},
    }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Error al reservar el turno')
  }
  return json.data
}

// Obtener una cita pública (confirmación/pago).
export const getPublicBooking = async (id) => {
  try {
    const res = await fetch(apiUrl(`/api/bookings/${id}`))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

// Cancela una reserva pública pendiente: libera el turno.
export const cancelPublicBooking = async (id) => {
  const res = await fetch(apiUrl(`/api/bookings/${id}`), { method: 'DELETE' })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) throw new Error(json?.message || 'No se pudo cancelar la reserva')
  return json.data
}

// Mercado Pago — genera la preferencia de Checkout Pro para pagar una reserva.
export const crearPagoReserva = async (appointmentId) => {
  const res = await fetch(apiUrl('/api/pagos/preference/reserva'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentId: Number(appointmentId) }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) throw new Error(json?.message || 'Error al generar el pago')
  return json.data
}

// Mercado Pago — preferencia para la diferencia de un canje (pago tipo 'combo').
export const crearPagoCanje = async (pagoId) => {
  const res = await fetch(apiUrl('/api/pagos/preference/canje'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pagoId: Number(pagoId) }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) throw new Error(json?.message || 'Error al generar el pago')
  return json.data
}

// Estado de un pago (polling tras el retorno de Mercado Pago). Si viene el
// payment_id de la URL de retorno, el backend reconcilia contra MP al momento.
export const getPagoEstado = async (pagoId, paymentId) => {
  try {
    const q = paymentId ? `?payment_id=${encodeURIComponent(paymentId)}` : ''
    const res = await fetch(apiUrl(`/api/pagos/${pagoId}${q}`))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

// Pago de una reserva por su id de cita (polling cuando no vino external_reference
// en la URL de retorno). El backend reconcilia contra MP si quedó pendiente.
export const getPagoPorReserva = async (appointmentId) => {
  try {
    const res = await fetch(apiUrl(`/api/pagos/por-reserva/${Number(appointmentId)}`))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

// ============================================================
// Membresía / suscripciones
// ============================================================

const mapMembresia = (m) =>
  m
    ? {
        id: m.id,
        nombre: m.nombre || '',
        precio_mensual: Number(m.precio_mensual) || 0,
        puntos_mes: Number(m.puntos_mes) || 0,
        descripcion: m.descripcion || '',
        activa: m.activa !== false,
        updated_at: m.updated_at || null,
      }
    : null

const mapSuscripcion = (s) =>
  s
    ? {
        id: s.id,
        user_id: s.user_id,
        usuario: s.users?.nombre || null,
        email: s.users?.email || null,
        telefono: s.users?.telefono || null,
        estado: s.estado,
        monto: Number(s.monto) || 0,
        valida_hasta: s.valida_hasta || null,
        fecha_proxima: s.fecha_proxima || null,
        mp_preapproval_id: s.mp_preapproval_id || null,
        plan_id: s.membresia?.id ?? s.membresia_id ?? null,
        plan_nombre: s.membresia?.nombre || null,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }
    : null

const getPublicJson = async (url) => {
  try {
    const res = await fetch(apiUrl(url))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

// Planes de membresía. Público: solo activos; admin: todos.
export const getMembresias = async (admin = false) => {
  try {
    const url = admin ? '/api/suscripciones/planes/admin' : '/api/suscripciones/planes'
    const data = admin ? await fetchWithAuth(url) : await getPublicJson(url)
    return (Array.isArray(data) ? data : []).filter(Boolean).map(mapMembresia)
  } catch {
    return []
  }
}

// Guarda un plan de membresía: sin id crea, con id actualiza (admin).
export const saveMembresia = async (payload) => {
  const isNew = payload.id == null
  const method = isNew ? 'POST' : 'PUT'
  const url = isNew ? '/api/suscripciones/planes' : `/api/suscripciones/planes/${Number(payload.id)}`
  return mutateBackend(method, url, payload).then(mapMembresia)
}

// Elimina un plan de membresía (admin).
export const deleteMembresia = async (id) =>
  mutateBackend('DELETE', `/api/suscripciones/planes/${Number(id)}`, null)

// Listado de suscripciones (admin).
export const listSuscripciones = async () => {
  try {
    const data = await fetchWithAuth('/api/suscripciones')
    return (Array.isArray(data) ? data : []).filter(Boolean).map(mapSuscripcion)
  } catch {
    return []
  }
}

// Última suscripción del cliente autenticado.
export const getMiSuscripcion = async () => {
  try {
    const data = await fetchWithAuth('/api/suscripciones/mia')
    return mapSuscripcion(data)
  } catch {
    return null
  }
}

// Crea el pago pendiente de la mensualidad de un plan (el cliente lo paga en MP).
export const crearPagoSuscripcion = async (planId) => {
  const token = await authToken()
  if (!token) throw new Error('Sin sesión')
  const res = await fetch(apiUrl('/api/suscripciones/pagar'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan_id: Number(planId) }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) throw new Error(json?.message || 'Error al iniciar el pago de la membresía')
  return json.data
}

// Mercado Pago — preferencia para pagar la membresía mensual.
export const crearPagoMembresia = async (pagoId) => {
  const res = await fetch(apiUrl('/api/pagos/preference/suscripcion'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pagoId: Number(pagoId) }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) throw new Error(json?.message || 'Error al generar el pago')
  return json.data
}

// Activación manual de la membresía de un cliente, con su plan (admin).
export const activarMembresia = async (userId, planId) =>
  mutateBackend('POST', '/api/suscripciones/activar', { user_id: userId, plan_id: Number(planId) })

// Desactiva una suscripción (admin).
export const desactivarSuscripcion = async (suscripcionId) =>
  mutateBackend('POST', `/api/suscripciones/${Number(suscripcionId)}/desactivar`, {})

// auth (Supabase Auth + profile from backend /api/auth/me)
// Fetch the current user's profile (with integer rol 0|1) from the backend.
export const fetchMe = async () => {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) return null
  const res = await fetch(apiUrl('/api/auth/me'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.message || 'No se pudo obtener el perfil')
  }
  const json = await res.json()
  return json.data
}

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Credenciales incorrectas')
  return data.user
}

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
  if (error) throw new Error(error.message || 'Error al iniciar sesión con Google')
}

// Mensajes de error de registro en español neutro. El proveedor ya exige
// confirmación de email: signUp suele devolver user sin session.
const signUpErrorMessage = (message = '') => {
  const msg = String(message).toLowerCase()
  if (msg.includes('already registered') || msg.includes('email_exists')) {
    return 'Ya existe una cuenta con este email. Intenta iniciar sesión.'
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (msg.includes('invalid email')) {
    return 'Ingresa un email válido.'
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
  }
  return 'No se pudo crear la cuenta. Revisa los datos e intenta nuevamente.'
}

export const signUp = async ({ name, email, password }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  })
  if (error) throw new Error(signUpErrorMessage(error.message))
  const user = data.user || null
  // Cuando el email ya está registrado, Supabase responde "éxito" pero sin
  // identidades (evita revelar la existencia). Esto permite detectarlo.
  const existing = Boolean(
    user && Array.isArray(user.identities) && user.identities.length === 0
  )
  return { user, session: data.session || null, existing }
}

// Consulta al backend si un email ya tiene cuenta y con qué proveedor fue
// creada (google vs email/contraseña). Requiere SUPABASE_SERVICE_ROLE_KEY en el
// backend; si no está configurada devuelve null y se usa el aviso genérico.
export const accountStatus = async (email) => {
  try {
    const res = await fetch(apiUrl('/api/auth/account-status'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

export const sendPasswordReset = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/recuperar`,
  })
  if (error) {
    if (String(error.message).toLowerCase().includes('rate limit')) {
      throw new Error('Demasiados intentos. Espera unos minutos y vuelve a intentarlo.')
    }
    throw new Error('No se pudo enviar el enlace de recuperación. Intenta nuevamente.')
  }
}

export const logout = async () => {
  await supabase.auth.signOut()
  write(SESSION_KEY, null)
}

// Returns the current session (auth + perfil), or null if not authenticated.
export const getSession = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data?.session) return null
  try {
    const perfil = await fetchMe()
    return { ...data.session, perfil }
  } catch {
    return data.session
  }
}

// servicios combinados (backend real)
const mapCombo = (c) =>
  c
    ? {
        id: c.id,
        name: c.nombre,
        description: c.descripcion,
        costo: c.costo_en_puntos,
        price: c.precio ?? 0,
        active: c.active,
        servicios_ids: c.servicios_ids || [],
        created_at: c.created_at,
      }
    : null

export const listCombos = async (includeInactive = false, sucursalId) => {
  let data
  try {
    const url = includeInactive ? '/api/combos/admin/all' : '/api/combos'
    data = await fetchWithAuth(withSucursal(url, sucursalId))
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapCombo)
}

// Combo individual (público, para la página de pago de un canje).
export const getCombo = async (id) => {
  try {
    const res = await fetch(apiUrl(`/api/combos/${Number(id)}`))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? mapCombo(json.data) : null
  } catch {
    return null
  }
}

export const saveCombo = async (combo) => {
  const isNew = !combo.id
  const body = {
    nombre: combo.name,
    descripcion: combo.description,
    costo_en_puntos: Number(combo.costo) || 0,
    precio: Number(combo.price) || 0,
    active: combo.active !== false,
    servicios_ids: combo.servicios_ids || [],
  }
  const saved = await mutateBackend(
    isNew ? 'POST' : 'PUT',
    isNew ? '/api/combos' : `/api/combos/${combo.id}`,
    body,
  )
  return mapCombo(saved) || combo
}

export const deleteCombo = async (id) => {
  await mutateBackend('DELETE', `/api/combos/${id}`, null)
}

// Disponibilidad de horarios para el calendario de canje de combos.
// Si se pasa `duration`, el backend solo devuelve los slots viables para un
// combo de esa duración + buffers.
export const listComboAvailability = async (date, duration, capacidad) => {
  try {
    const params = []
    if (duration != null) params.push(`duration=${encodeURIComponent(duration)}`)
    if (capacidad != null) params.push(`capacidad=${encodeURIComponent(capacidad)}`)
    const q = params.length ? `?${params.join('&')}` : ''
    const res = await fetch(apiUrl(`/api/combos/availability/${date}${q}`))
    if (!res.ok) return null
    const json = await res.json()
    if (!json.success) return null
    return json.data
  } catch {
    return null
  }
}

// Disponibilidad de un rango de fechas en UNA llamada (puntos del calendario de canje).
export const listComboAvailabilityRange = async (from, to) => {
  try {
    const res = await fetch(apiUrl(`/api/combos/availability/range?from=${from}&to=${to}`))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data?.days : null
  } catch {
    return null
  }
}

// Canje de un combo con puntos (requiere sesión). Si `pagarDiferencia` es true,
// permite canjear con puntos insuficientes abonando la diferencia en efectivo.
export const redeemCombo = async (comboId, fechaHora, pagarDiferencia = false) => {
  const data = await mutateBackend(
    'POST',
    '/api/combos/redeem',
    { combo_id: comboId, fecha_hora: fechaHora, pagar_diferencia: pagarDiferencia },
  )
  return data
}

// clientes / usuarios (backend real)
const mapUser = (c) =>
  c
    ? {
        id: c.id,
        name: c.nombre,
        email: c.email,
        phone: c.telefono,
        rol: c.rol,
        puntos: c.puntos_acumulados,
        visitas: c.visitas || 0,
        ultima_visita: c.ultima_visita || null,
        created_at: c.created_at,
      }
    : null

// Plan derivado según cantidad de visitas.
export const planFromVisitas = (visitas) => {
  if (visitas >= 5) return 'frecuente'
  if (visitas >= 2) return 'ocasional'
  return 'nuevo'
}

export const listClients = async () => {
  let data
  try {
    data = await fetchWithAuth('/api/users')
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapUser)
}

export const updateUser = async (id, data) => {
  const saved = await mutateBackend(
    'PUT',
    `/api/users/${id}`,
    { nombre: data.name, email: data.email, telefono: data.phone },
  )
  return mapUser(saved) || null
}

export const deleteUser = async (id) => {
  await mutateBackend('DELETE', `/api/users/${id}`, null)
}

// Ficha clínica (historial médico por usuario). Devuelve null si no existe.
const mapFicha = (f) =>
  f
    ? {
        content: f.contenido || {},
        createdAt: f.created_at || null,
        updatedAt: f.updated_at || null,
      }
    : null

export const getFicha = async (userId) => {
  const data = await fetchWithAuth(`/api/users/${userId}/ficha`)
  return mapFicha(data)
}

export const saveFicha = async (userId, contenido) => {
  const saved = await mutateBackend('PUT', `/api/users/${userId}/ficha`, { contenido })
  return mapFicha(saved)
}

// Redención de puntos (delta negativo hacia el backend real).
export const redeemPoints = async (clientId, puntos) => {
  const saved = await mutateBackend(
    'PUT',
    `/api/users/${clientId}/points`,
    { puntos: -puntos },
  )
  return mapUser(saved) || null
}

// empleados / staff (backend real)
const mapEmpleado = (e) =>
  e
    ? {
        id: e.id,
        name: e.nombre,
        email: e.email || '',
        phone: e.telefono || '',
        specialty: e.especialidad || '',
        notes: e.notas || '',
        active: Boolean(e.activo),
        servicios_ids: e.servicios_ids || [],
      }
    : null

export const listEmpleados = async (sucursalId) => {
  let data
  try {
    data = await fetchWithAuth(withSucursal('/api/empleados', sucursalId))
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapEmpleado)
}

export const saveEmpleado = async (empleado) => {
  const isNew = !empleado.id
  const body = {
    nombre: empleado.name,
    email: empleado.email || null,
    telefono: empleado.phone || null,
    especialidad: empleado.specialty || null,
    notas: empleado.notes || null,
    activo: empleado.active !== false,
    servicios_ids: empleado.servicios_ids || [],
  }
  const saved = await mutateBackend(
    isNew ? 'POST' : 'PUT',
    isNew ? '/api/empleados' : `/api/empleados/${empleado.id}`,
    body,
  )
  return mapEmpleado(saved) || empleado
}

export const deleteEmpleado = async (id) => {
  await mutateBackend('DELETE', `/api/empleados/${id}`, null)
}

// horarios flexibles + excepciones (backend real)
export const getEmpleadoHorarios = async (empleadoId) => {
  let data
  try {
    data = await fetchWithAuth(`/api/horarios/empleados/${empleadoId}`)
  } catch {
    data = null
  }
  return data
}

export const saveEmpleadoHorarios = async (empleadoId, weekly) => {
  const saved = await mutateBackend('PUT', `/api/horarios/empleados/${empleadoId}`, { weekly })
  return saved
}

const mapExcepcion = (e) =>
  e
    ? {
        id: e.id,
        fecha: e.fecha,
        empleado_id: e.empleado_id ?? null,
        cerrado: Boolean(e.cerrado),
        franjas: e.franjas || [],
        motivo: e.motivo || '',
      }
    : null

export const listExcepciones = async (empleadoId) => {
  let data
  try {
    const q = empleadoId != null ? `?empleado_id=${empleadoId}` : ''
    data = await fetchWithAuth(`/api/horarios/excepciones${q}`)
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapExcepcion)
}

export const saveExcepcion = async (excepcion) => {
  const body = {
    fecha: excepcion.fecha,
    empleado_id: excepcion.empleado_id != null ? excepcion.empleado_id : null,
    cerrado: Boolean(excepcion.cerrado),
    franjas: excepcion.franjas || [],
    motivo: excepcion.motivo || null,
  }
  const isNew = !excepcion.id
  const saved = await mutateBackend(
    isNew ? 'POST' : 'PUT',
    isNew ? '/api/horarios/excepciones' : `/api/horarios/excepciones/${excepcion.id}`,
    body,
  )
  return mapExcepcion(saved) || excepcion
}

export const deleteExcepcion = async (id) => {
  await mutateBackend('DELETE', `/api/horarios/excepciones/${id}`, null)
}

// eventos (backend real)
const mapEvento = (e) =>
  e
    ? {
        id: e.id,
        name: e.nombre,
        description: e.descripcion || '',
        tipo: e.tipo || 'evento',
        start: e.fecha_hora_inicio,
        end: e.fecha_hora_fin || '',
        capacidad: e.capacidad ?? '',
        lugar: e.lugar || '',
        estado: e.estado || 'Programado',
        color: e.color || '',
        recurrencia: e.recurrencia || 'none',
      }
    : null

export const listEventos = async (sucursalId) => {
  let data
  try {
    data = await fetchWithAuth(withSucursal('/api/eventos', sucursalId))
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapEvento)
}

export const saveEvento = async (evento) => {
  const body = {
    nombre: evento.name,
    descripcion: evento.description || null,
    tipo: evento.tipo || 'evento',
    fecha_hora_inicio: evento.start,
    fecha_hora_fin: evento.end || null,
    capacidad: evento.capacidad !== '' && evento.capacidad != null ? Number(evento.capacidad) : null,
    lugar: evento.lugar || null,
    estado: evento.estado || 'Programado',
    color: evento.color || null,
    recurrencia: evento.recurrencia || 'none',
  }
  const isNew = !evento.id
  const saved = await mutateBackend(
    isNew ? 'POST' : 'PUT',
    isNew ? '/api/eventos' : `/api/eventos/${evento.id}`,
    body,
  )
  return mapEvento(saved) || evento
}

export const deleteEvento = async (id) => {
  await mutateBackend('DELETE', `/api/eventos/${id}`, null)
}

// notificaciones
const mapNotificacion = (n) =>
  n
    ? {
        id: n.id,
        tipo: n.tipo || 'sistema',
        titulo: n.titulo || '',
        mensaje: n.mensaje || '',
        enlace: n.enlace || '',
        leida: Boolean(n.leida),
        created_at: n.created_at,
      }
    : null

export const listNotificaciones = async (limit = 50) => {
  let data
  try {
    data = await fetchWithAuth(`/api/notificaciones/mias?limit=${limit}`)
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapNotificacion)
}

export const countNoLeidas = async () => {
  try {
    const data = await fetchWithAuth('/api/notificaciones/no-leidas')
    return Number(data) || 0
  } catch {
    return 0
  }
}

export const marcarNotificacionLeida = async (id) => {
  await mutateBackend('PUT', `/api/notificaciones/${id}/leida`, null)
}

export const marcarTodasLeidas = async () => {
  await mutateBackend('PUT', '/api/notificaciones/leer-todas', null)
}

export const listTodasNotificaciones = async () => {
  let data
  try {
    data = await fetchWithAuth('/api/notificaciones?limit=200')
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapNotificacion)
}

export const enviarNotificacion = async ({ titulo, mensaje, tipo, userId }) => {
  return mutateBackend('POST', '/api/notificaciones', {
    titulo,
    mensaje,
    tipo: tipo || 'sistema',
    userId: userId || null,
  })
}

export const eliminarNotificacion = async (id) => {
  await mutateBackend('DELETE', `/api/notificaciones/${id}`, null)
}

// google calendar sync
export const getGoogleStatus = async () => {
  let data
  try {
    data = await fetchWithAuth('/api/google/status')
  } catch {
    data = { configured: false, connected: false }
  }
  return data || { configured: false, connected: false }
}

export const getGoogleAuthUrl = async () => {
  const data = await fetchWithAuth('/api/google/auth-url')
  return data?.url || ''
}

export const setGoogleAutoSync = async (autoSync) => {
  return mutateBackend('PUT', '/api/google/settings', { autoSync })
}

export const syncGoogleNow = async () => {
  return mutateBackend('POST', '/api/google/sync', null)
}

export const disconnectGoogle = async () => {
  await mutateBackend('POST', '/api/google/disconnect', null)
}

// sucursales (multi-sucursal)
const mapSucursal = (s) =>
  s
    ? {
        id: s.id,
        name: s.nombre || '',
        direccion: s.direccion || '',
        telefono: s.telefono || '',
        activa: s.activa !== false,
      }
    : null

export const listSucursales = async () => {
  let data
  try {
    data = await fetchWithAuth('/api/sucursales')
  } catch {
    data = []
  }
  return (Array.isArray(data) ? data : []).filter(Boolean).map(mapSucursal)
}

export const saveSucursal = async (sucursal) => {
  const isNew = !sucursal.id
  const body = {
    nombre: sucursal.name,
    direccion: sucursal.direccion || null,
    telefono: sucursal.telefono || null,
    activa: sucursal.activa !== false,
  }
  const saved = await mutateBackend(
    isNew ? 'POST' : 'PUT',
    isNew ? '/api/sucursales' : `/api/sucursales/${sucursal.id}`,
    body,
  )
  return mapSucursal(saved) || sucursal
}

export const deleteSucursal = async (id) => {
  await mutateBackend('DELETE', `/api/sucursales/${id}`, null)
}

// Contenido del sitio (landing: textos, imágenes y SEO). El backend fusiona el
// documento con sus defaults, así que GET siempre devuelve la forma completa.
const STORAGE_BASE = `${(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')}/storage/v1/object/public`
export const CONTENIDO_BUCKET = 'bennu-media'

export const contenidoImageUrl = (path) =>
  path ? `${STORAGE_BASE}/${CONTENIDO_BUCKET}/${String(path).replace(/^\/+/, '')}` : ''

const sanitizeName = (name) =>
  String(name || 'imagen')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase()
    .slice(0, 80)

// Sube una imagen al bucket público desde el navegador (requiere sesión admin).
export const uploadContenidoImage = async (file) => {
  const path = `landing/${Date.now()}-${sanitizeName(file?.name)}`
  const { data, error } = await supabase.storage
    .from(CONTENIDO_BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) throw new Error(error.message || 'No se pudo subir la imagen')
  return { path: data.path, url: contenidoImageUrl(data.path) }
}

export const deleteContenidoImage = async (path) => {
  if (!path) return
  const { error } = await supabase.storage.from(CONTENIDO_BUCKET).remove([path])
  if (error) throw new Error(error.message || 'No se pudo eliminar la imagen')
}

export const getContenido = async () => {
  try {
    const res = await fetch(apiUrl('/api/contenido'))
    if (!res.ok) return null
    const json = await res.json()
    return json.success ? json.data : null
  } catch {
    return null
  }
}

export const saveContenido = async (contenido) => {
  const saved = await mutateBackend('PUT', '/api/contenido', { contenido })
  return saved
}

// Integraciones (correo saliente + Mercado Pago). Solo admin.
export const getIntegraciones = async () => fetchWithAuth('/api/integraciones')

export const saveIntegraciones = async (payload) => {
  const saved = await mutateBackend('PUT', '/api/integraciones', payload)
  return saved
}

export const testEmailIntegracion = async () =>
  mutateBackend('POST', '/api/integraciones/test-email', {})

export const testMpIntegracion = async () =>
  mutateBackend('POST', '/api/integraciones/test-mp', {})

// Perfil de bienvenida por cuenta (solo usuarios logueados).
export const guardarVisitante = async (payload) =>
  mutateBackend('POST', '/api/visitantes', {
    nombre: payload.nombre,
    alias: payload.alias,
    edad: payload.edad ?? null,
  })

export const getMiVisitante = async () => fetchWithAuth('/api/visitantes/me')

export const quitarMiVisitante = async () =>
  mutateBackend('DELETE', '/api/visitantes/me', null)

export const listVisitantes = async () => fetchWithAuth('/api/visitantes')

export const eliminarVisitante = async (id) =>
  mutateBackend('DELETE', `/api/visitantes/${id}`, null)

// Perfil propio (página /perfil).
export const updateMiPerfil = async (payload) =>
  mutateBackend('PUT', '/api/users/me', {
    nombre: payload.nombre,
    telefono: payload.telefono ?? null,
  })

export const eliminarMiCuenta = async () =>
  mutateBackend('POST', '/api/auth/delete-account', {})

// theme (apariencia)
export const getTheme = () => read(THEME_KEY, null)

export const saveTheme = (theme) => write(THEME_KEY, theme)