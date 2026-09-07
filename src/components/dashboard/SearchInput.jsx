export default function SearchInput({ value, onChange, placeholder = 'Buscar…' }) {
  return (
    <div className="filter-bar">
      <span className="filter-bar__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        className="field__input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          className="filter-bar__clear"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange('')}
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
