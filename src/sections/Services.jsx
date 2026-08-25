import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listServices } from '../lib/api.js'
import { CATEGORIES, categoryName } from '../lib/data.js'
import ServicePrice from '../components/ServicePrice.jsx'
import Reveal from '../components/Reveal.jsx'

const TABS = [{ id: 'todos', name: 'Todos' }, ...CATEGORIES]
const SERVICES_PER_PAGE = 6

export default function Services() {
  const [services, setServices] = useState([])
  const [category, setCategory] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(SERVICES_PER_PAGE)

  useEffect(() => {
    let alive = true
    listServices().then((data) => {
      if (alive) {
        setServices(data)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const visible = services.filter(
    (s) => s.active && (category === 'todos' || s.category === category)
  )

  const displayed = visible.slice(0, visibleCount)
  const hasMore = visibleCount < visible.length

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)
    setVisibleCount(SERVICES_PER_PAGE)
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + SERVICES_PER_PAGE)
  }

  return (
    <section id="servicios" className="section section--alt">
      <div className="container">
        <Reveal>
          <p className="eyebrow">Servicios</p>
          <h2 className="section__title">Tratamientos con precisión</h2>
          <p className="section__lead">
            Tres líneas de cuidado para cada necesidad. Elige una categoría para filtrar.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="tabs" role="tablist" aria-label="Categorías de servicios">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              className={category === tab.id ? 'tabs__tab is-active' : 'tabs__tab'}
              onClick={() => handleCategoryChange(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
        </Reveal>

        <Reveal delay={200}>
        {loading ? (
          <p className="muted">Cargando servicios…</p>
        ) : (
          <>
            {visible.length === 0 ? (
              <p className="muted">No hay servicios en esta categoría por ahora.</p>
            ) : (
              <>
                <ul className="cards">
                  {displayed.map((service) => (
                    <li key={service.id} className="card">
                      <div className="card__top">
                        <span className="card__tag">{categoryName(service.category)}</span>
                        <span className="card__duration">{service.duration} min</span>
                      </div>
                      <h3 className="card__title">{service.name}</h3>
                      <p className="card__desc">{service.description}</p>
                      <div className="card__foot">
                        <span className="card__price">
                          <ServicePrice service={service} />
                        </span>
                        <Link className="btn btn--primary btn--sm" to={`/agenda?servicio=${service.id}`}>
                          Reservar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {hasMore && (
                  <div className="load-more">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={handleLoadMore}
                      aria-label="Cargar más servicios"
                    >
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        </Reveal>
      </div>
    </section>
  )
}