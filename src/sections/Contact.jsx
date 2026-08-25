import { useState } from 'react'
import Reveal from '../components/Reveal.jsx'

export default function Contact() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contacto" className="section">
      <div className="container contact">
        <Reveal className="contact__info">
          <p className="eyebrow">Contacto</p>
          <h2 className="section__title">Contanos tu consulta</h2>
          <p className="section__lead">
            Respondemos a la brevedad. También puedes escribirnos directamente.
          </p>
          <ul className="contact__list">
            <li>Dirección: Av. siempre 1234, Ciudad</li>
            <li>Teléfono / WhatsApp: +54 11 5555 0202</li>
            <li>Email: hola@bennu.com</li>
            <li>Horario: Lun a Vie 9:00–18:00</li>
          </ul>
        </Reveal>

        <Reveal delay={150} className="contact__form">
          <form className="form" onSubmit={onSubmit}>
          {sent ? (
            <div className="form__success" role="status">
              <p className="form__success-title">Mensaje enviado</p>
              <p>Gracias por escribirnos. Te contactamos dentro de las próximas 24 horas.</p>
            </div>
          ) : (
            <>
              <label className="field">
                <span className="field__label">Nombre</span>
                <input className="field__input" name="name" required />
              </label>
              <label className="field">
                <span className="field__label">Email</span>
                <input className="field__input" name="email" type="email" required />
              </label>
              <label className="field">
                <span className="field__label">Mensaje</span>
                <textarea className="field__input" name="message" rows="4" required />
              </label>
              <button className="btn btn--primary" type="submit">
                Enviar mensaje
              </button>
            </>
          )}
        </form>
        </Reveal>
      </div>
    </section>
  )
}