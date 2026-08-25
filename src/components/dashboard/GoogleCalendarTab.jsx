import { useEffect, useState } from 'react'
import {
  getGoogleStatus,
  getGoogleAuthUrl,
  setGoogleAutoSync,
  syncGoogleNow,
  disconnectGoogle,
} from '../../lib/api.js'
import { toast } from '../../lib/toast.js'

export default function GoogleCalendarTab() {
  const [status, setStatus] = useState({ configured: false, connected: false, autoSync: false })
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    getGoogleStatus().then((s) => {
      setStatus(s)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [])

  const connect = async () => {
    const url = await getGoogleAuthUrl()
    if (!url) {
      toast.error('Google Calendar no está configurado en el servidor')
      return
    }
    window.open(url, '_blank')
  }

  const toggleAuto = async (checked) => {
    await setGoogleAutoSync(checked)
    load()
  }

  const sync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const r = await syncGoogleNow()
      setResult(r)
    } finally {
      setSyncing(false)
    }
  }

  const disconnect = async () => {
    await disconnectGoogle()
    setResult(null)
    load()
  }

  if (loading) return null

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Google Calendar</h1>
      </div>
      <p className="muted">
        Sincroniza las citas de bennu con tu calendario de Google. Los eventos se crean o
        actualizan automáticamente al agendar, y se eliminan al cancelar.
      </p>

      <div className="dash__card">
        <div className="dash__row">
          <span className="data-table__name">{status.connected ? 'Conectado' : 'No conectado'}</span>
          {status.connected && status.email && (
            <span className="data-table__meta">{status.email}</span>
          )}
        </div>

        {!status.connected && (
          <div className="panel">
            <p className="muted">
              Para conectar, necesitás crear un proyecto en Google Cloud Console, habilitar la
              API de Google Calendar y configurar las credenciales OAuth2 en el archivo{' '}
              <code>.env</code> del backend.
            </p>
            {status.configured ? (
              <button className="btn btn--primary" type="button" onClick={connect}>
                Conectar con Google
              </button>
            ) : (
              <p className="muted">
                Credenciales no configuradas: definí <code>GOOGLE_CLIENT_ID</code>,{' '}
                <code>GOOGLE_CLIENT_SECRET</code> y <code>GOOGLE_REDIRECT_URI</code> en el{' '}
                <code>.env</code>.
              </p>
            )}
          </div>
        )}

        {status.connected && (
          <div className="panel">
            <div className="dash__row">
              <span className="data-table__name">Sincronización automática</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={status.autoSync}
                  onChange={(e) => toggleAuto(e.target.checked)}
                />
                <span className="switch__track" aria-hidden="true" />
              </label>
            </div>
            <div className="dash__row">
              <span className="data-table__name">Última sincronización</span>
              <span className="data-table__meta">
                {status.lastSyncAt ? status.lastSyncAt.replace('T', ' ').slice(0, 16) : '—'}
              </span>
            </div>

            <div className="dash__row">
              <button className="btn btn--primary" type="button" onClick={sync} disabled={syncing}>
                {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              </button>
              <button className="btn btn--danger" type="button" onClick={disconnect}>
                Desconectar
              </button>
            </div>

            {result && (
              <div className="panel">
                <p className="muted">
                  Creadas: <strong>{result.created || 0}</strong> · Actualizadas:{' '}
                  <strong>{result.updated || 0}</strong> · Total: <strong>{result.total || 0}</strong>
                </p>
                {Array.isArray(result.errors) && result.errors.length > 0 && (
                  <ul className="muted">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        cita {e.id}: {e.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
