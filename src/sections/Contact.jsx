import { useState } from 'react'
import Reveal from '../components/Reveal.jsx'
import { useSiteContent } from '../context/siteContent.js'

const hrefFor = (item) => {
  const value = (item.valor || '').trim()
  if (item.tipo === 'email' && value.includes('@')) return `mailto:${value}`
  if (item.tipo === 'telefono') {
    const digits = value.replace(/[^\d+]/g, '')
    return digits ? `tel:${digits}` : null
  }
  if (item.tipo === 'redes') return /^https?:\/\//.test(value) ? value : null
  return null
}

export default function Contact() {
  const [sent, setSent] = useState(false)
  const { contenido } = useSiteContent()
  const contacto = contenido.contacto || {}

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contacto" className="section">
      <div className="container contact">
        <Reveal className="contact__info">
          <p className="eyebrow">{contacto.eyebrow}</p>
          <h2 className="section__title">{contacto.titulo}</h2>
          {contacto.lead && <p className="section__lead">{contacto.lead}</p>}
          {Array.isArray(contacto.items) && contacto.items.length > 0 && (
            <ul className="contact__list">
              {contacto.items.map((item, i) => {
                const href = hrefFor(item)
                const inner = (
                  <>
                    <span className="contact__label">{item.etiqueta}</span>
                    <span className="contact__value">{item.valor}</span>
                  </>
                )
                return (
                  <li className="contact__item" key={i}>
                    {href ? (
                      <a href={href} target={item.tipo === 'redes' ? '_blank' : undefined} rel="noreferrer">
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                )
              })}
            </ul>
          )}
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
                {contacto.boton_formulario || 'Enviar mensaje'}
              </button>
            </>
          )}
        </form>
        </Reveal>
      </div>
    </section>
  )
}
