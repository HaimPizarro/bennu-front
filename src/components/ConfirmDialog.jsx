import Modal from './Modal.jsx'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  secondaryLabel,
  onConfirm,
  onSecondary,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="modal__text">{message}</p>
      <div className="modal__actions">
        <button className="btn btn--ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
        {secondaryLabel && (
          <button className="btn btn--ghost" type="button" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
        <button className="btn btn--danger" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}