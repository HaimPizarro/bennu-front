import Reveal from '../components/Reveal.jsx'

export default function About() {
  return (
    <section id="sobre-mi" className="section">
      <div className="container about">
        <Reveal className="about__text">
          <p className="eyebrow">Sobre mí</p>
          <h2 className="section__title">La piel cuenta una historia</h2>
          <p className="about__p">
            Soy especialista en estética y cosmética con más de una década de
            práctica. Fundé Bennu como un espacio donde cada tratamiento se diseña
            a medida: analizo, escucho y protocolizo según tu tipo de piel, tu
            rutina y tus objetivos.
          </p>
          <p className="about__p">
            El nombre Bennu viene del ave del renacimiento: cada sesión es una
            oportunidad de renovar, iluminar y reconstruir. Nada de protocolos de
            manual — cada piel es un caso, y cada caso tiene su plan.
          </p>
          <ul className="about__creds">
            <li>Cosmetóloga y esteticista certificada</li>
            <li>Especialización en dermo-estética avanzada</li>
            <li>Formación continua en protocolos no invasivos</li>
          </ul>
        </Reveal>
        <Reveal delay={150} className="about__visual" aria-hidden="true">
          <span className="about__monogram">B</span>
          <span className="about__caption">bennu · estudio de cosmética</span>
        </Reveal>
      </div>
    </section>
  )
}