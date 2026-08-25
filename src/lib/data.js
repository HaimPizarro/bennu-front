export const CURRENCY = '$'

export const CATEGORIES = [
  { id: 'limpiezas', name: 'Limpiezas faciales' },
  { id: 'tratamientos', name: 'Tratamientos' },
  { id: 'masajes', name: 'Masajes y cuerpo' },
]

export const categoryName = (id) =>
  (CATEGORIES.find((c) => c.id === id) || {}).name || id

export const formatCurrency = (value) => {
  if (value == null || Number.isNaN(value)) return `${CURRENCY}0`
  const num = Number(value)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace('ARS', CURRENCY)
    .trim()
}
