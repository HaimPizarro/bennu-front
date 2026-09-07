import { useEffect, useState } from 'react'

const ASPECT_RATIO = {
  wide: '16 / 7',
  square: '1 / 1',
  portrait: '4 / 5',
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Slider de imágenes reutilizable (hero y galería de resultados). Con una sola
// imagen renderiza un frame estático sin controles. Caption opcional por slide.
export default function MediaSlider({
  slides = [],
  aspect = 'wide',
  autoplay = 6000,
  className = '',
  caption = false,
}) {
  const reduced = prefersReducedMotion()
  const n = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const active = n > 0 ? ((index % n) + n) % n : 0

  useEffect(() => {
    if (n <= 1 || reduced || paused) return undefined
    const timer = setInterval(() => setIndex((p) => (p + 1) % n), autoplay)
    return () => clearInterval(timer)
  }, [n, autoplay, reduced, paused])

  if (n === 0) return null
  const current = slides[active]

  const go = (dir) => {
    setIndex((p) => (p + dir + n) % n)
  }

  if (n === 1) {
    return (
      <div className={`media-slider ${className}`}>
        <img
          className="media-slider__frame media-slider__frame--single"
          style={{ aspectRatio: ASPECT_RATIO[aspect] }}
          src={current.url}
          alt={current.alt || ''}
          loading="lazy"
        />
        {caption && current.caption && <p className="media-slider__caption">{current.caption}</p>}
      </div>
    )
  }

  return (
    <div
      className={`media-slider ${className}`}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Imágenes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="media-slider__frame" style={{ aspectRatio: ASPECT_RATIO[aspect] }}>
        {slides.map((slide, i) => (
          <img
            key={slide.url}
            className={i === active ? 'media-slider__img is-active' : 'media-slider__img'}
            src={slide.url}
            alt={slide.alt || ''}
            loading="lazy"
            aria-hidden={i !== index}
          />
        ))}
        {caption && current.caption && (
          <p className="media-slider__caption">{current.caption}</p>
        )}
        <button
          type="button"
          className="media-slider__arrow media-slider__arrow--prev"
          aria-label="Imagen anterior"
          onClick={() => go(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="media-slider__arrow media-slider__arrow--next"
          aria-label="Imagen siguiente"
          onClick={() => go(1)}
        >
          ›
        </button>
      </div>
      <div className="media-slider__dots" role="tablist" aria-label="Elegir imagen">
        {slides.map((slide, i) => (
          <button
            key={slide.url}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Ir a la imagen ${i + 1}`}
            className={i === active ? 'media-slider__dot is-active' : 'media-slider__dot'}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  )
}
