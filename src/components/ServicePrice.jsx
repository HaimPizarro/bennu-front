import { formatCurrency } from '../lib/data.js'

// Precio de un servicio respetando la oferta (precio_oferta) y el descuento de
// membresía cuando el cliente está suscripto. El descuento de membresía solo
// aplica a servicios; combos y canjes quedan sin descuento.
// El distintivo de descuento solo aparece para suscriptores activos.
export default function ServicePrice({ service, suscriptor = false }) {
  const d = suscriptor ? Number(service?.descuento_suscripcion) || 0 : 0
  const descuentoServicio = Number(service?.descuento_suscripcion) || 0
  const base = Number(service?.precio_oferta ?? service?.price) || 0
  const fin = d > 0 ? Math.round(base * (1 - d / 100) * 100) / 100 : base

  if (descuentoServicio > 0) {
    if (suscriptor) {
      return (
        <>
          <s className="price--old">{formatCurrency(base)}</s>{' '}
          <span className="price--offer">{formatCurrency(fin)}</span>{' '}
          <span className="price-badge">{descuentoServicio}% Dsct.</span>
        </>
      )
    }
    if (service?.precio_oferta) {
      return (
        <>
          <s className="price--old">{formatCurrency(service.price)}</s>{' '}
          <span className="price--offer">{formatCurrency(service.precio_oferta)}</span>
        </>
      )
    }
    return formatCurrency(base)
  }
  if (service?.precio_oferta) {
    return (
      <>
        <s className="price--old">{formatCurrency(service.price)}</s>{' '}
        <span className="price--offer">{formatCurrency(service.precio_oferta)}</span>
      </>
    )
  }
  return formatCurrency(service?.price)
}