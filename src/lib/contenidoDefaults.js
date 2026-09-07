// Contenido por defecto del sitio (landing). Espejo del DEFAULT del backend
// (services/contenido.service.js) para servir de respaldo offline y para que
// los formularios nunca muestren campos vacíos. Textos en español neutro.
const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

export const DEFAULT_CONTENIDO = {
  seo: {
    titulo: 'bennu — Estudio de cosmetología',
    descripcion:
      'Tratamientos faciales y corporales con protocolos precisos y productos premium. Reserva tu turno en bennu, estudio de cosmetología.',
    keywords: [
      'cosmetología',
      'limpieza facial',
      'tratamientos faciales',
      'tratamientos corporales',
      'micropunción',
      'piel',
      'estética',
      'bennu',
    ],
    og_imagen: null,
  },
  marca: {
    nombre: 'bennu',
    eslogan: 'Renace en tu piel',
    descripcion: 'Estudio de cosmetología',
  },
  hero: {
    eyebrow: 'Estudio de cosmética · Bennu',
    titulo: 'Renace en tu piel',
    lead: 'Tratamientos faciales y corporales con protocolos precisos y productos premium, pensados para que tu piel luzca su mejor versión.',
    cta_primario: { texto: 'Reservar turno', destino: '/agenda' },
    cta_secundario: { texto: 'Ver servicios', destino: '#servicios' },
    imagenes: [],
    stats: [
      { valor: '12+', etiqueta: 'años de experiencia' },
      { valor: '3000+', etiqueta: 'sesiones realizadas' },
      { valor: '98%', etiqueta: 'clientas que recomiendan' },
    ],
  },
  servicios: {
    eyebrow: 'Servicios',
    titulo: 'Tratamientos con precisión',
    lead: 'Tres líneas de cuidado para cada necesidad. Elige una categoría para filtrar.',
  },
  sobreMi: {
    eyebrow: 'Sobre mí',
    titulo: 'La piel cuenta una historia',
    parrafos: [
      'Soy especialista en estética y cosmética con más de una década de práctica. Fundé Bennu como un espacio donde cada tratamiento se diseña a medida: analizo, escucho y protocolizo según tu tipo de piel, tu rutina y tus objetivos.',
      'El nombre Bennu viene del ave del renacimiento: cada sesión es una oportunidad de renovar, iluminar y reconstruir. Nada de protocolos de manual: cada piel es un caso, y cada caso tiene su plan.',
    ],
    credenciales: [
      'Cosmetóloga y esteticista certificada',
      'Especialización en dermo-estética avanzada',
      'Formación continua en protocolos no invasivos',
    ],
    imagen: null,
  },
  resultados: {
    eyebrow: 'Resultados',
    titulo: 'Lo que cuentan nuestras clientas',
    lead: 'Resultados medibles, piel a piel. Esto es lo que eligen quienes ya pasaron por Bennu.',
    // 'texto' (tarjetas actuales) | 'imagenes' (galería) | 'ambos' (tarjetas + galería)
    modo: 'texto',
    items: [
      {
        cliente: 'Florencia D.',
        tratamiento: 'Limpieza facial profunda',
        metrica: 'Piel visiblemente más luminosa',
        detalle:
          'Eliminó impurezas acumuladas y recuperó el brillo natural en una sola sesión.',
        imagen: null,
      },
      {
        cliente: 'María S.',
        tratamiento: 'Micropunción facial',
        metrica: 'Firmeza y textura renovadas',
        detalle: 'Serie de tres sesiones para atenuar marcas y redefinir el óvalo facial.',
        imagen: null,
      },
      {
        cliente: 'Lucía P.',
        tratamiento: 'Tratamiento anti-acné',
        metrica: 'Control de brotes en 6 semanas',
        detalle: 'Protocolo mensual que redujo la inflamación y reguló el exceso de sebo.',
        imagen: null,
      },
      {
        cliente: 'Andrea V.',
        tratamiento: 'Hidratación hialurónica',
        metrica: 'Hidratación profunda sostenida',
        detalle: 'Recuperó elasticidad y suavidad tras una rutina muy deshidratante.',
        imagen: null,
      },
    ],
  },
  contacto: {
    eyebrow: 'Contacto',
    titulo: 'Cuéntanos tu consulta',
    lead: 'Respondemos a la brevedad. También puedes escribirnos directamente.',
    boton_formulario: 'Enviar mensaje',
    items: [
      { etiqueta: 'Dirección', valor: 'Av. siempre 1234, Ciudad', tipo: 'direccion' },
      { etiqueta: 'Teléfono / WhatsApp', valor: '+54 11 5555 0202', tipo: 'telefono' },
      { etiqueta: 'Email', valor: 'hola@bennu.com', tipo: 'email' },
      { etiqueta: 'Horario', valor: 'Lun a Vie 9:00–18:00', tipo: 'horario' },
    ],
  },
}

export const CONTACTO_TIPOS = [
  { value: 'direccion', label: 'Dirección' },
  { value: 'telefono', label: 'Teléfono / WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'horario', label: 'Horario' },
  { value: 'redes', label: 'Red social' },
  { value: 'texto', label: 'Otro' },
]

export const RESULTADOS_MODOS = [
  { value: 'texto', label: 'Solo textos' },
  { value: 'imagenes', label: 'Solo imágenes' },
  { value: 'ambos', label: 'Textos e imágenes juntas' },
]

export const CONTACTO_TIPO_LABEL = (tipo) => CONTACTO_TIPOS.find((t) => t.value === tipo)?.label || tipo

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// Mezcla recursiva con los defaults: arrays y null del payload reemplazan, los
// objetos se fusionan clave a clave, los primitivos se pisan si vienen definidos.
export function mergeContenido(base, extra) {
  if (!isPlainObject(extra)) return extra === undefined ? base : extra
  const out = isPlainObject(base) ? { ...base } : {}
  for (const key of Object.keys(extra)) {
    const value = extra[key]
    if (value === undefined) continue
    out[key] = mergeContenido(base?.[key], value)
  }
  return out
}

// Devuelve el documento completo garantizando la forma esperada.
export function normalizeContenido(contenido) {
  return mergeContenido(DEFAULT_CONTENIDO, contenido || {})
}

// Crea un ítem nuevo con id estable para listas editables.
export function makeId() {
  return newId()
}
