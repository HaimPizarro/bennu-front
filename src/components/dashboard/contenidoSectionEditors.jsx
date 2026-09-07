import {
  Field,
  TextField,
  SegField,
  RepeatList,
  ImageField,
} from './contentParts.jsx'
import { CONTACTO_TIPOS, RESULTADOS_MODOS } from '../../lib/contenidoDefaults.js'

const emptyText = () => ''
const emptyImage = () => ({ path: '', url: '', alt: '' })

const setValue = (onChange, value, key) => (e) => onChange({ ...value, [key]: e.target.value })

// ---- Hero ----
export function HeroEditor({ value, onChange }) {
  const patchCta = (which) => (key) => (e) =>
    onChange({ ...value, [which]: { ...value[which], [key]: e.target.value } })
  const patchStat = (i) => (key) => (e) => {
    const stats = [...value.stats]
    stats[i] = { ...stats[i], [key]: e.target.value }
    onChange({ ...value, stats })
  }

  return (
    <>
      <p className="dash__subtitle">Título y descripción</p>
      <div className="cms-grid">
        <TextField label="Frase superior" value={value.eyebrow} onChange={setValue(onChange, value, 'eyebrow')} />
        <TextField label="Título principal" value={value.titulo} onChange={setValue(onChange, value, 'titulo')} />
      </div>
      <TextField
        as="textarea"
        rows={2}
        label="Subtítulo"
        value={value.lead}
        onChange={setValue(onChange, value, 'lead')}
      />

      <p className="dash__subtitle">Botones</p>
      <div className="cms-grid">
        <TextField label="Texto botón principal" value={value.cta_primario.texto} onChange={patchCta('cta_primario')('texto')} />
        <TextField label="Destino botón principal" hint="Ruta interna (/agenda) o ancla (#servicios)" value={value.cta_primario.destino} onChange={patchCta('cta_primario')('destino')} />
        <TextField label="Texto botón secundario" value={value.cta_secundario.texto} onChange={patchCta('cta_secundario')('texto')} />
        <TextField label="Destino botón secundario" value={value.cta_secundario.destino} onChange={patchCta('cta_secundario')('destino')} />
      </div>

      <p className="dash__subtitle">Imágenes (slider)</p>
      <p className="field__hint">Con 2 o más imágenes el hero muestra un slider automático; con 1 se ve fija.</p>
      <RepeatList
        items={value.imagenes}
        onChange={(imagenes) => onChange({ ...value, imagenes })}
        onAdd={emptyImage}
        addLabel="Agregar imagen"
        empty="Sin imágenes. Agrega una para mostrar fotos en el hero."
        renderItem={({ item, update }) => (
          <ImageField
            compact
            label="Imagen"
            value={item}
            onChange={(imagen) => update(imagen || emptyImage())}
          />
        )}
      />

      <p className="dash__subtitle">Estadísticas</p>
      <RepeatList
        items={value.stats}
        onChange={(stats) => onChange({ ...value, stats })}
        onAdd={() => ({ valor: '', etiqueta: '' })}
        addLabel="Agregar estadística"
        empty="Sin estadísticas."
        renderItem={({ item, index }) => (
          <div className="cms-grid">
            <TextField label="Valor" value={item.valor} onChange={patchStat(index)('valor')} />
            <TextField label="Etiqueta" value={item.etiqueta} onChange={patchStat(index)('etiqueta')} />
          </div>
        )}
      />
    </>
  )
}

// ---- Sobre mí ----
export function AboutEditor({ value, onChange }) {
  return (
    <>
      <div className="cms-grid">
        <TextField label="Frase superior" value={value.eyebrow} onChange={setValue(onChange, value, 'eyebrow')} />
        <TextField label="Título" value={value.titulo} onChange={setValue(onChange, value, 'titulo')} />
      </div>
      <p className="dash__subtitle">Párrafos</p>
      <RepeatList
        items={value.parrafos}
        onChange={(parrafos) => onChange({ ...value, parrafos })}
        onAdd={emptyText}
        addLabel="Agregar párrafo"
        empty="Sin párrafos. Agrega al menos uno."
        renderItem={({ item, update }) => (
          <TextField as="textarea" rows={4} value={item} onChange={(e) => update(e.target.value)} />
        )}
      />
      <p className="dash__subtitle">Credenciales</p>
      <RepeatList
        items={value.credenciales}
        onChange={(credenciales) => onChange({ ...value, credenciales })}
        onAdd={emptyText}
        addLabel="Agregar credencial"
        empty="Sin credenciales."
        renderItem={({ item, update }) => (
          <TextField value={item} onChange={(e) => update(e.target.value)} />
        )}
      />
      <p className="dash__subtitle">Foto (opcional)</p>
      <ImageField
        label="Foto de perfil"
        hint="Si la quitas se muestra el monograma actual."
        value={value.imagen}
        onChange={(imagen) => onChange({ ...value, imagen })}
      />
    </>
  )
}

// ---- Resultados ----
export function ResultsEditor({ value, onChange }) {
  const patchItem = (i) => (key) => (e) => {
    const items = [...value.items]
    items[i] = { ...items[i], [key]: e.target.value }
    onChange({ ...value, items })
  }
  const setItemImage = (i) => (imagen) => {
    const items = [...value.items]
    items[i] = { ...items[i], imagen }
    onChange({ ...value, items })
  }

  return (
    <>
      <div className="cms-grid">
        <TextField label="Frase superior" value={value.eyebrow} onChange={setValue(onChange, value, 'eyebrow')} />
        <TextField label="Título" value={value.titulo} onChange={setValue(onChange, value, 'titulo')} />
      </div>
      <TextField
        as="textarea"
        rows={2}
        label="Subtítulo"
        value={value.lead}
        onChange={setValue(onChange, value, 'lead')}
      />
      <p className="dash__subtitle">Cómo mostrar la sección</p>
      <SegField
        label="Formato"
        hint="Puedes elegir solo textos, solo imágenes o ambos juntos."
        options={RESULTADOS_MODOS}
        value={value.modo}
        onChange={(modo) => onChange({ ...value, modo })}
      />
      <p className="dash__subtitle">Resultados</p>
      <RepeatList
        items={value.items}
        onChange={(items) => onChange({ ...value, items })}
        onAdd={() => ({ cliente: '', tratamiento: '', metrica: '', detalle: '', imagen: null })}
        addLabel="Agregar resultado"
        empty="Sin resultados todavía."
        renderItem={({ item, index }) => (
          <>
            <div className="cms-grid">
              <TextField label="Cliente" value={item.cliente} onChange={patchItem(index)('cliente')} />
              <TextField label="Tratamiento" value={item.tratamiento} onChange={patchItem(index)('tratamiento')} />
            </div>
            <div className="cms-grid">
              <TextField label="Métrica" value={item.metrica} onChange={patchItem(index)('metrica')} />
            </div>
            <TextField
              as="textarea"
              rows={2}
              label="Detalle"
              value={item.detalle}
              onChange={patchItem(index)('detalle')}
            />
            <ImageField compact label="Imagen del antes/después" value={item.imagen} onChange={setItemImage(index)} />
          </>
        )}
      />
    </>
  )
}

// ---- Contacto ----
export function ContactEditor({ value, onChange }) {
  const patchItem = (i) => (patch) => {
    const items = [...value.items]
    items[i] = { ...items[i], ...patch }
    onChange({ ...value, items })
  }

  return (
    <>
      <div className="cms-grid">
        <TextField label="Frase superior" value={value.eyebrow} onChange={setValue(onChange, value, 'eyebrow')} />
        <TextField label="Título" value={value.titulo} onChange={setValue(onChange, value, 'titulo')} />
      </div>
      <TextField
        as="textarea"
        rows={2}
        label="Subtítulo"
        value={value.lead}
        onChange={setValue(onChange, value, 'lead')}
      />
      <TextField
        label="Texto del botón del formulario"
        value={value.boton_formulario}
        onChange={setValue(onChange, value, 'boton_formulario')}
      />
      <p className="dash__subtitle">Datos de contacto</p>
      <p className="field__hint">
        Agrega o elimina campos: dirección, teléfono, email, horario, redes sociales u otros.
      </p>
      <RepeatList
        items={value.items}
        onChange={(items) => onChange({ ...value, items })}
        onAdd={() => ({ etiqueta: '', valor: '', tipo: 'texto' })}
        addLabel="Agregar dato"
        empty="Sin datos de contacto."
        renderItem={({ item, index }) => (
          <>
            <div className="cms-grid">
              <TextField label="Etiqueta" value={item.etiqueta} onChange={(e) => patchItem(index)({ etiqueta: e.target.value })} />
              <Field label="Tipo">
                <select
                  className="field__input"
                  value={item.tipo}
                  onChange={(e) => patchItem(index)({ tipo: e.target.value })}
                >
                  {CONTACTO_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <TextField label="Valor" value={item.valor} onChange={(e) => patchItem(index)({ valor: e.target.value })} />
          </>
        )}
      />
    </>
  )
}

// ---- SEO + identidad de marca ----
export function SeoEditor({ seo, marca, onSeo, onMarca }) {
  const keywordsText = (seo.keywords || []).join(', ')
  const setKeywords = (e) =>
    onSeo({ ...seo, keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })

  return (
    <>
      <p className="dash__subtitle">Identidad</p>
      <div className="cms-grid">
        <TextField label="Nombre de la marca" value={marca.nombre} onChange={(e) => onMarca({ ...marca, nombre: e.target.value })} />
        <TextField label="Eslogan" value={marca.eslogan} onChange={(e) => onMarca({ ...marca, eslogan: e.target.value })} />
      </div>
      <TextField label="Descripción corta" value={marca.descripcion} onChange={(e) => onMarca({ ...marca, descripcion: e.target.value })} />

      <p className="dash__subtitle">SEO en Google</p>
      <p className="field__hint">
        Estos valores alimentan el título, la descripción, las palabras clave y los datos
        estructurados que Google lee al indexar la landing.
      </p>
      <TextField label="Título para buscadores" hint="Ideal entre 50 y 60 caracteres." value={seo.titulo} onChange={(e) => onSeo({ ...seo, titulo: e.target.value })} />
      <TextField
        as="textarea"
        rows={3}
        label="Meta descripción"
        hint="Resumen de 150 a 160 caracteres que se muestra en los resultados de búsqueda."
        value={seo.descripcion}
        onChange={(e) => onSeo({ ...seo, descripcion: e.target.value })}
      />
      <TextField
        label="Palabras clave"
        hint="Separadas por comas. Google ya no las usa para el ranking, pero orientan el contenido."
        value={keywordsText}
        onChange={setKeywords}
      />
      <ImageField
        label="Imagen para compartir (Open Graph)"
        hint="Se usa cuando comparten el sitio en WhatsApp, LinkedIn, etc."
        value={seo.og_imagen}
        onChange={(og_imagen) => onSeo({ ...seo, og_imagen })}
      />
    </>
  )
}
