const METRIC = '64,920'

export default function DashboardVisual() {
  return (
    <div className="auth-visual">
      <span className="auth-visual__logo">bennu</span>

      <div className="auth-visual__scene">
        <div className="auth-browser">
          <div className="auth-browser__bar">
            <span className="auth-browser__dot auth-browser__dot--danger" />
            <span className="auth-browser__dot auth-browser__dot--warn" />
            <span className="auth-browser__dot auth-browser__dot--ok" />
            <span className="auth-browser__url">dashboard.bennu.io</span>
          </div>
          <div className="auth-browser__body">
            <p className="auth-browser__metric">{METRIC}</p>
            <svg
              className="auth-chart"
              viewBox="0 0 260 110"
              preserveAspectRatio="none"
              role="img"
              aria-label="Gráfico de líneas de métricas"
            >
              <g className="auth-chart__grid">
                <line x1="0" y1="20" x2="260" y2="20" />
                <line x1="0" y1="55" x2="260" y2="55" />
                <line x1="0" y1="90" x2="260" y2="90" />
              </g>
              <path
                className="auth-chart__area"
                d="M0,85 C30,70 45,40 70,50 C100,62 120,25 150,32 C185,40 205,15 235,12 L260,10 L260,110 L0,110 Z"
              />
              <path
                className="auth-chart__line"
                d="M0,85 C30,70 45,40 70,52 C100,58 120,25 150,32 C185,40 205,15 235,12 L260,10"
              />
            </svg>
            <div className="auth-browser__bars">
              <span style={{ height: '40%' }} />
              <span style={{ height: '62%' }} />
              <span style={{ height: '30%' }} />
              <span style={{ height: '78%' }} />
            </div>
          </div>
        </div>

        <div className="auth-stat auth-stat--1">
          <span className="auth-stat__icon auth-stat__icon--chart" aria-hidden="true" />
          <div className="auth-stat__text">
            <strong>20,345</strong>
            <span>Nuevas visitas</span>
          </div>
        </div>

        <div className="auth-stat auth-stat--2">
          <span className="auth-stat__icon auth-stat__icon--doc" aria-hidden="true" />
          <div className="auth-stat__text">
            <strong>9,122</strong>
            <span>Documentos</span>
          </div>
        </div>

        <div className="auth-stat auth-stat--3">
          <span className="auth-stat__icon auth-stat__icon--graph" aria-hidden="true" />
          <div className="auth-stat__text">
            <strong>4.8</strong>
            <span>Satisfacción</span>
          </div>
        </div>

        <div className="auth-avatars" aria-hidden="true">
          <span className="auth-avatar auth-avatar--1">JD</span>
          <span className="auth-avatar auth-avatar--2">MK</span>
          <span className="auth-avatar auth-avatar--3">SR</span>
        </div>
      </div>

      <p className="auth-visual__text">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
      </p>

      <div className="auth-carousel" aria-label="Navegación de carrusel">
        <button type="button" className="auth-carousel__arrow" aria-label="Anterior">
          ‹
        </button>
        <span className="auth-carousel__dot auth-carousel__dot--active" aria-hidden="true" />
        <span className="auth-carousel__dot" aria-hidden="true" />
        <span className="auth-carousel__dot" aria-hidden="true" />
        <button type="button" className="auth-carousel__arrow" aria-label="Siguiente">
          ›
        </button>
      </div>
    </div>
  )
}