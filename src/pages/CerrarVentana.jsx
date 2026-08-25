import { useEffect } from 'react'

// Página de retorno de Mercado Pago: cierra el popup en el que se abre.
// window.close() solo funciona en ventanas abiertas por script; si el navegador
// lo bloquea, queda un enlace de respaldo.
export default function CerrarVentana() {
  useEffect(() => {
    const t = setTimeout(() => window.close(), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="cerrar-wrap">
      <p className="cerrar-txt">Pago procesado. Puedes cerrar esta ventana.</p>
      <button className="btn btn--primary" onClick={() => window.close()}>
        Cerrar ventana
      </button>
    </div>
  )
}