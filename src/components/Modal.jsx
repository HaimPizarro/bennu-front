import { useEffect, useRef } from 'react'

export default function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleOverlay = (e) => {
    if (e.target === ref.current) onClose()
  }

  return (
    <div className="modal" ref={ref} onClick={handleOverlay}>
      <div className={`modal__card ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}