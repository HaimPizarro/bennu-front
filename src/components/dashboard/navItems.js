export const ADMIN_NAV = [
  { id: 'resumen', label: 'Resumen', icon: '◈' },
  { id: 'agenda', label: 'Agenda', icon: '▦', group: 'operaciones' },
  { id: 'servicios', label: 'Servicios', icon: '✦', group: 'operaciones' },
  { id: 'empleados', label: 'Empleados', icon: '♟', group: 'operaciones' },
  { id: 'clientes', label: 'Clientes', icon: '◉', group: 'operaciones' },
  { id: 'fidelizacion', label: 'Fidelización', icon: '♥', group: 'operaciones' },
  { id: 'membresias', label: 'Membresías', icon: '✧', group: 'operaciones' },
  { id: 'horarios', label: 'Horarios', icon: '☰', group: 'gestion' },
  { id: 'sucursales', label: 'Sucursales', icon: '◫', group: 'gestion' },
  { id: 'eventos', label: 'Eventos', icon: '❉', group: 'gestion' },
  { id: 'notificaciones', label: 'Notificaciones', icon: '◌', group: 'sistema' },
  { id: 'google', label: 'Google Calendar', icon: '⟳', group: 'sistema' },
  { id: 'apariencia', label: 'Apariencia', icon: '❖', group: 'sistema' },
]

export const NAV_GROUPS = {
  operaciones: { label: 'Operaciones', icon: '▸' },
  gestion: { label: 'Gestión', icon: '▸' },
  sistema: { label: 'Sistema', icon: '▸' },
}

export const CLIENT_NAV = [
  { id: 'inicio', label: 'Inicio', icon: '◈' },
  { id: 'agenda', label: 'Agenda', icon: '▦' },
  { id: 'canje', label: 'Canje', icon: '♥' },
  { id: 'membresia', label: 'Membresía', icon: '✧' },
  { id: 'ficha', label: 'Ficha clínica', icon: '✎' },
]
