// Esquema compartido de la ficha clínica: define las secciones, etiquetas y
// opciones que usan tanto la vista de lectura (cliente) como el modal de
// edición (admin). El contenido real vive en `fichas_clinicas.contenido`
// (JSONB) con la misma estructura de claves.

export const BIOTIPO_OPTIONS = ['Normal', 'Seca', 'Grasa', 'Mixta']
export const FOTOTIPO_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI']

export const FICHA_SECTIONS = [
  {
    key: 'datos_personales',
    title: 'Datos personales',
    fields: [
      { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { key: 'contacto_emergencia', label: 'Contacto de emergencia', type: 'text' },
      { key: 'motivo_consulta', label: 'Motivo de la consulta', type: 'textarea' },
    ],
  },
  {
    key: 'anamnesis',
    title: 'Anamnesis (historial médico)',
    fields: [
      {
        key: 'alergias',
        label: 'Alergias (cosméticos, alimentos, metales, yodo, aspirina…)',
        type: 'textarea',
      },
      {
        key: 'enfermedades',
        label: 'Enfermedades preexistentes (diabetes, tiroides, herpes, presión…)',
        type: 'textarea',
      },
      { key: 'medicamentos', label: 'Medicamentos actuales (isotretinoína, etc.)', type: 'textarea' },
      {
        key: 'cirugias',
        label: 'Cirugías o intervenciones estéticas (bótox, ácido hialurónico, hilos, plásticas)',
        type: 'textarea',
      },
      {
        key: 'estado_fisiologico',
        label: 'Estado fisiológico (embarazo, lactancia, marcapasos, implantes metálicos)',
        type: 'textarea',
      },
    ],
  },
  {
    key: 'habitos',
    title: 'Hábitos de vida y rutina actual',
    fields: [
      { key: 'hidratacion', label: 'Consumo de agua diario', type: 'text' },
      { key: 'alimentacion', label: 'Alimentación', type: 'text' },
      { key: 'tabaco_alcohol', label: 'Tabaco y alcohol', type: 'text' },
      { key: 'exposicion_solar', label: 'Exposición al sol', type: 'text' },
      { key: 'protector_solar', label: 'Uso de protector solar', type: 'text' },
      { key: 'rutina_cosmetica', label: 'Rutina cosmética en casa', type: 'textarea' },
    ],
  },
  {
    key: 'analisis_cutaneo',
    title: 'Análisis cutáneo (diagnóstico)',
    fields: [
      { key: 'biotipo', label: 'Biotipo cutáneo', type: 'select', options: BIOTIPO_OPTIONS },
      {
        key: 'fototipo_fitzpatrick',
        label: 'Fototipo de piel (Fitzpatrick)',
        type: 'select',
        options: FOTOTIPO_OPTIONS,
      },
      { key: 'estado_piel', label: 'Estado de la piel', type: 'text' },
      {
        key: 'lesiones',
        label: 'Lesiones o alteraciones (acné, pústulas, comedones, manchas, rosácea, arrugas, flacidez)',
        type: 'textarea',
      },
    ],
    hasMapaFacial: true,
  },
]

export const FICHA_CONSENT_TEXT =
  'Acepto el procedimiento a realizar, sus posibles efectos secundarios y las indicaciones post-cuidado, y confirmo que la información del historial médico es veraz.'

export const FICHA_FOTOS_TEXT =
  'Autorizo la toma de fotografías de antes y después para registrar la evolución del tratamiento.'

export const emptyFicha = () => ({
  datos_personales: {},
  anamnesis: {},
  habitos: {},
  analisis_cutaneo: {},
  consentimiento: { aceptado: false, autoriza_fotos: false, firma: '', fecha: '', observaciones: '' },
  sesiones: [],
})

export const emptySesion = () => ({
  fecha: new Date().toISOString().slice(0, 10),
  tratamiento: '',
  aparatologia: '',
  principios_activos: '',
  observaciones: '',
})