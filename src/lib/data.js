export const CURRENCY = '$'

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
