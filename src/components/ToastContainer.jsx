import { useSyncExternalStore } from 'react'
import { toast } from '../lib/toast.js'

export default function ToastContainer() {
  const toasts = useSyncExternalStore(toast.subscribe, toast.getSnapshot)

  if (toasts.length === 0) return null

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon" aria-hidden="true">
            {t.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="toast__message">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
