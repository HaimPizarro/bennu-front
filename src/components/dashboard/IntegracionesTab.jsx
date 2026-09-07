import { useEffect, useState } from 'react'
import {
  getIntegraciones,
  saveIntegraciones,
  testEmailIntegracion,
  testMpIntegracion,
} from '../../lib/api.js'
import { toast } from '../../lib/toast.js'

const GMAIL_STEPS = [
  'Abre tu cuenta de Google y entra a "Seguridad" (myaccount.google.com/security).',
  'Activa la "Verificación en dos pasos" si aún no la tienes: es requisito para poder crear contraseñas de aplicación.',
  'En Seguridad busca la opción "Contraseñas de aplicaciones".',
  'Crea una nueva con el nombre "bennu". Google te mostrará una contraseña de 16 letras: cópiala.',
  'Pega esa contraseña en el campo "Contraseña". En "Usuario" usa tu correo completo. Host: smtp.gmail.com · Puerto: 587.',
  'Pulsa "Guardar correo" y después "Enviar email de prueba". Debes recibir el correo en la bandeja del destinatario.',
]

const RESEND_STEPS = [
  'Crea una cuenta en resend.com y verifica un dominio propio (o usa su dominio compartido para probar).',
  'Ve a "API Keys", crea una llave nueva y cópiala.',
  'Pégala en el campo "API Key de Resend". En "Remitente" usa algo como hola@tudominio.com.',
  'Guarda la configuración y pulsa "Enviar email de prueba".',
]

const MP_STEPS = [
  'Inicia sesión en la cuenta de Mercado Pago que recibirá el dinero (la de la dueña).',
  'Entra a tu panel: Developers → Tus integraciones → Credenciales.',
  'Copia el "Access Token" de producción. Si estás probando, usa las credenciales de prueba (empiezan con TEST-).',
  'Pega el token en el campo y elige la moneda del país de la cuenta (por ejemplo CLP en Chile).',
  'Pulsa "Guardar Mercado Pago" y después "Probar conexión": debería mostrarte el nombre de la cuenta que cobra.',
]

function StepList({ steps }) {
  return (
    <ol className="int-steps">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  )
}

function Badge({ ok, children }) {
  return (
    <span className={ok ? 'chip chip--ok' : 'chip chip--warn'}>{children}</span>
  )
}

export default function IntegracionesTab() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [provider, setProvider] = useState('smtp')
  const [emailFields, setEmailFields] = useState({
    email_from_name: '',
    email_from: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    resend_api_key: '',
  })
  const [mpFields, setMpFields] = useState({ mp_access_token: '', mp_currency: '' })
  const [busy, setBusy] = useState('') // '' | 'email' | 'mp' | 'test-email' | 'test-mp'
  const [emailTest, setEmailTest] = useState('')
  const [mpTest, setMpTest] = useState('')

  useEffect(() => {
    let alive = true
    getIntegraciones()
      .then((data) => {
        if (!alive) return
        setStatus(data)
        const email = data?.email || {}
        const mp = data?.mp || {}
        setProvider(email.proveedor === 'resend' ? 'resend' : 'smtp')
        setEmailFields((prev) => ({
          ...prev,
          email_from_name: email.nombre || '',
          email_from: email.remitente || '',
          smtp_host: email.host || '',
          smtp_port: String(email.puerto || 587),
          smtp_user: email.usuario || '',
        }))
        setMpFields((prev) => ({ ...prev, mp_currency: mp.moneda || 'CLP' }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const setField = (key) => (e) =>
    setEmailFields((prev) => ({ ...prev, [key]: e.target.value }))

  const setMpField = (key) => (e) => setMpFields((prev) => ({ ...prev, [key]: e.target.value }))

  // Los secretos vacíos no se envían (conservan lo guardado). Los campos no
  // secretos vacíos se limpian para volver a la configuración del servidor.
  const emailPayload = () => {
    const f = emailFields
    const payload = { email_provider: provider }
    const setOrNull = (key, value) => {
      const t = String(value || '').trim()
      payload[key] = t ? t : null
    }
    setOrNull('email_from_name', f.email_from_name)
    setOrNull('email_from', f.email_from)
    setOrNull('smtp_host', f.smtp_host)
    setOrNull('smtp_user', f.smtp_user)
    const port = Number(f.smtp_port)
    payload.smtp_port = Number.isFinite(port) && port > 0 ? port : null
    if (String(f.smtp_pass || '').trim()) payload.smtp_pass = String(f.smtp_pass).trim()
    if (String(f.resend_api_key || '').trim()) payload.resend_api_key = String(f.resend_api_key).trim()
    return payload
  }

  const mpPayload = () => {
    const payload = {}
    if (String(mpFields.mp_access_token || '').trim()) {
      payload.mp_access_token = String(mpFields.mp_access_token).trim()
    }
    const moneda = String(mpFields.mp_currency || '').trim().toUpperCase()
    payload.mp_currency = moneda || null
    return payload
  }

  const saveEmail = async () => {
    setBusy('email')
    setEmailTest('')
    try {
      const next = await saveIntegraciones(emailPayload())
      setStatus(next)
      setEmailFields((prev) => ({ ...prev, smtp_pass: '', resend_api_key: '' }))
      toast.success('Configuración de correo guardada.')
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la configuración de correo.')
    } finally {
      setBusy('')
    }
  }

  const saveMp = async () => {
    setBusy('mp')
    setMpTest('')
    try {
      const next = await saveIntegraciones(mpPayload())
      setStatus(next)
      setMpFields((prev) => ({ ...prev, mp_access_token: '' }))
      toast.success('Configuración de Mercado Pago guardada.')
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar la configuración de Mercado Pago.')
    } finally {
      setBusy('')
    }
  }

  const clearEmailOverrides = async () => {
    try {
      await saveIntegraciones({
        email_provider: null,
        email_from_name: null,
        email_from: null,
        smtp_host: null,
        smtp_port: null,
        smtp_user: null,
        smtp_pass: null,
        resend_api_key: null,
      })
      const next = await getIntegraciones()
      setStatus(next)
      toast.success('Correo restablecido a la configuración del servidor (.env).')
    } catch (error) {
      toast.error(error.message || 'No se pudo restablecer.')
    }
  }

  const clearMpOverrides = async () => {
    try {
      await saveIntegraciones({ mp_access_token: null, mp_currency: null })
      const next = await getIntegraciones()
      setStatus(next)
      toast.success('Mercado Pago restablecido a la configuración del servidor (.env).')
    } catch (error) {
      toast.error(error.message || 'No se pudo restablecer.')
    }
  }

  const runEmailTest = async () => {
    setBusy('test-email')
    setEmailTest('')
    try {
      const data = await testEmailIntegracion()
      setEmailTest(`Email de prueba enviado a ${data.to}. Revisa tu bandeja de entrada.`)
    } catch (error) {
      toast.error(error.message || 'No se pudo enviar el email de prueba.')
    } finally {
      setBusy('')
    }
  }

  const runMpTest = async () => {
    setBusy('test-mp')
    setMpTest('')
    try {
      const data = await testMpIntegracion()
      setMpTest(`Conexión exitosa. Cuenta que recibirá el dinero: ${data.cuenta || '—'}`)
    } catch (error) {
      toast.error(error.message || 'No se pudo probar la conexión con Mercado Pago.')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <p className="muted">Cargando configuración…</p>

  const email = status?.email || {}
  const mp = status?.mp || {}
  const isResend = provider === 'resend'

  return (
    <>
      <div className="dash__head">
        <h1 className="dash__title">Pagos y correo</h1>
      </div>
      <p className="muted">
        Configura desde aquí el correo que envía las confirmaciones de citas y la cuenta de
        Mercado Pago que recibe el dinero. Sigue el paso a paso de cada tarjeta. Los cambios
        aplican al instante, sin reiniciar el servidor.
      </p>
      {status?.db_configurada === false && (
        <div className="int-warn">
          El servidor no tiene configurada la clave de seguridad (SUPABASE_SERVICE_ROLE_KEY).
          Por ahora los valores del archivo .env siguen activos; para guardar desde el panel,
          agrega esa clave al backend.
        </div>
      )}

      {/* ---------- Correo saliente ---------- */}
      <section className="int-card">
        <div className="int-card__head">
          <h2 className="dash__subtitle int-card__title">Correo saliente</h2>
          <Badge ok={email.configurado}>{email.configurado ? 'Configurado' : 'No configurado'}</Badge>
        </div>

        <p className="int-lead">
          El correo con el que Bennu envía las confirmaciones, recordatorios y avisos de las
          citas. Elige un proveedor y sigue los pasos.
        </p>

        <div className="seg-control">
          <button
            type="button"
            className={provider === 'smtp' ? 'seg is-active' : 'seg'}
            onClick={() => setProvider('smtp')}
          >
            Gmail / SMTP
          </button>
          <button
            type="button"
            className={provider === 'resend' ? 'seg is-active' : 'seg'}
            onClick={() => setProvider('resend')}
          >
            Resend
          </button>
        </div>

        <StepList steps={isResend ? RESEND_STEPS : GMAIL_STEPS} />

        <div className="int-fields">
          <div className="cms-grid">
            <label className="field">
              <span className="field__label">Nombre del remitente</span>
              <input
                className="field__input"
                type="text"
                placeholder={email.nombre || 'bennu'}
                value={emailFields.email_from_name}
                onChange={setField('email_from_name')}
              />
            </label>
            <label className="field">
              <span className="field__label">Remitente (email)</span>
              <input
                className="field__input"
                type="email"
                placeholder={email.remitente || 'hola@tudominio.com'}
                value={emailFields.email_from}
                onChange={setField('email_from')}
              />
            </label>
          </div>

          {isResend ? (
            <label className="field">
              <span className="field__label">API Key de Resend</span>
              <input
                className="field__input"
                type="password"
                placeholder={email.resend_activo ? 'Conservar la actual (••••)' : 're_...'}
                value={emailFields.resend_api_key}
                onChange={setField('resend_api_key')}
              />
              <span className="field__hint">Deja vacío para conservar la llave guardada.</span>
            </label>
          ) : (
            <>
              <div className="cms-grid">
                <label className="field">
                  <span className="field__label">Host SMTP</span>
                  <input
                    className="field__input"
                    type="text"
                    placeholder={email.host || 'smtp.gmail.com'}
                    value={emailFields.smtp_host}
                    onChange={setField('smtp_host')}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Puerto</span>
                  <input
                    className="field__input"
                    type="number"
                    placeholder="587"
                    value={emailFields.smtp_port}
                    onChange={setField('smtp_port')}
                  />
                </label>
              </div>
              <div className="cms-grid">
                <label className="field">
                  <span className="field__label">Usuario</span>
                  <input
                    className="field__input"
                    type="text"
                    placeholder={email.usuario || 'tucorreo@gmail.com'}
                    value={emailFields.smtp_user}
                    onChange={setField('smtp_user')}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Contraseña de aplicación</span>
                  <input
                    className="field__input"
                    type="password"
                    placeholder="Dejar vacío conserva la actual"
                    value={emailFields.smtp_pass}
                    onChange={setField('smtp_pass')}
                  />
                </label>
              </div>
            </>
          )}

          {emailTest && <p className="int-ok" role="status">{emailTest}</p>}

          <div className="int-actions">
            <button className="btn btn--primary btn--sm" type="button" disabled={busy === 'email'} onClick={saveEmail}>
              {busy === 'email' ? 'Guardando…' : 'Guardar correo'}
            </button>
            <button className="btn btn--ghost btn--sm" type="button" disabled={busy === 'test-email'} onClick={runEmailTest}>
              {busy === 'test-email' ? 'Enviando…' : 'Enviar email de prueba'}
            </button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={clearEmailOverrides}>
              Restablecer al .env
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Mercado Pago ---------- */}
      <section className="int-card">
        <div className="int-card__head">
          <h2 className="dash__subtitle int-card__title">Mercado Pago</h2>
          <Badge ok={mp.configurado}>{mp.configurado ? 'Configurado' : 'No configurado'}</Badge>
        </div>

        <p className="int-lead">
          La cuenta de Mercado Pago que recibe el dinero de los turnos. Usa el Access Token de
          esa cuenta: quien lo tenga configurado cobra el 100% de cada venta.
        </p>

        <StepList steps={MP_STEPS} />

        <div className="int-fields">
          {mp.configurado && (
            <p className="muted">
              Token activo: {mp.token_mascara}
            </p>
          )}
          <div className="cms-grid">
            <label className="field">
              <span className="field__label">Access Token</span>
              <input
                className="field__input"
                type="password"
                placeholder={mp.configurado ? `Conservar el actual (${mp.token_mascara})` : 'APP_USR-… o TEST-…'}
                value={mpFields.mp_access_token}
                onChange={setMpField('mp_access_token')}
              />
              <span className="field__hint">Deja vacío para conservar el token guardado.</span>
            </label>
            <label className="field">
              <span className="field__label">Moneda</span>
              <input
                className="field__input"
                type="text"
                maxLength={3}
                placeholder="CLP"
                value={mpFields.mp_currency}
                onChange={setMpField('mp_currency')}
              />
              <span className="field__hint">3 letras: CLP, ARS, USD, etc.</span>
            </label>
          </div>

          {mpTest && <p className="int-ok" role="status">{mpTest}</p>}

          <div className="int-actions">
            <button className="btn btn--primary btn--sm" type="button" disabled={busy === 'mp'} onClick={saveMp}>
              {busy === 'mp' ? 'Guardando…' : 'Guardar Mercado Pago'}
            </button>
            <button className="btn btn--ghost btn--sm" type="button" disabled={busy === 'test-mp'} onClick={runMpTest}>
              {busy === 'test-mp' ? 'Probando…' : 'Probar conexión'}
            </button>
            <button className="btn btn--ghost btn--sm" type="button" onClick={clearMpOverrides}>
              Restablecer al .env
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
