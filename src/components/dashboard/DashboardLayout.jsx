import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import NotificationBell from './NotificationBell.jsx'
import { NAV_GROUPS } from './navItems.js'

export default function DashboardLayout({
  nav,
  tab,
  onTabChange,
  onLogout,
  children,
  sideNote = 'Admin',
  sucursales,
  sucursalId,
  onChangeSucursal,
  points,
  userName,
}) {
  const showSucursalSelector = Array.isArray(sucursales) && sucursales.length > 1
  const initials =
    (userName || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'AC'

  const grouped = (Array.isArray(nav) ? nav : []).reduce(
    (acc, n) => {
      if (n.group) {
        acc.groups[n.group] = acc.groups[n.group] || []
        acc.groups[n.group].push(n)
      } else {
        acc.flat.push(n)
      }
      return acc
    },
    { flat: [], groups: {} },
  )

  const groupIds = Object.keys(grouped.groups)
  const [expanded, setExpanded] = useState(() => new Set(groupIds))
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleGroup = (gid) => {
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(gid)) {
        next.delete(gid)
      } else {
        next.add(gid)
      }
      return next
    })
  }

  // Cambia de tab expandiendo automáticamente su grupo (sin efecto).
  const changeTab = (id) => {
    const item = (Array.isArray(nav) ? nav : []).find((n) => n.id === id)
    if (item?.group) {
      setExpanded((s) => {
        if (s.has(item.group)) return s
        const next = new Set(s)
        next.add(item.group)
        return next
      })
    }
    setMobileOpen(false)
    onTabChange(id)
  }

  const activeGroup = groupIds.find((gid) => grouped.groups[gid].some((n) => n.id === tab))

  const contentRef = useRef(null)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.classList.remove('is-active')
    void el.offsetWidth
    el.classList.add('is-active')
    const t = setTimeout(() => el.classList.remove('is-active'), 400)
    return () => clearTimeout(t)
  }, [tab])

  return (
    <div className="dash">
      <aside className={mobileOpen ? 'dash__side is-open' : 'dash__side'}>
        <button
          className="dash__side-close"
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        >
          ✕
        </button>
        <Link className="topbar__brand dash__brand" to="/" onClick={() => setMobileOpen(false)}>
          bennu
        </Link>
        <span className="dash__side-note">{sideNote}</span>

        {showSucursalSelector && (
          <label className="dash__sucursal">
            <span className="dash__sucursal-label">Sucursal</span>
            <select
              className="field__input"
              value={String(sucursalId)}
              onChange={(e) => onChangeSucursal(e.target.value)}
            >
              {sucursales.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <nav className="dash__nav">
          {grouped.flat.map((n) => (
            <button
              key={n.id}
              type="button"
              className={tab === n.id ? 'dash__tab is-active' : 'dash__tab'}
              onClick={() => changeTab(n.id)}
            >
              <span className="dash__tab-icon" aria-hidden="true">
                {n.icon}
              </span>
              {n.label}
            </button>
          ))}

          {groupIds.map((gid) => {
            const isOpen = expanded.has(gid)
            const hasActive = activeGroup === gid
            return (
              <div className="dash__group" key={gid}>
                <button
                  type="button"
                  className={[
                    'dash__group-header',
                    isOpen ? 'is-open' : '',
                    hasActive ? 'is-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => toggleGroup(gid)}
                  aria-expanded={isOpen}
                >
                  <span className="dash__group-chevron" aria-hidden="true">
                    ▸
                  </span>
                  <span className="dash__group-label">{NAV_GROUPS[gid]?.label || gid}</span>
                </button>

                {isOpen && (
                  <div className="dash__group-body">
                    {grouped.groups[gid].map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={tab === n.id ? 'dash__tab dash__tab--child is-active' : 'dash__tab dash__tab--child'}
                        onClick={() => changeTab(n.id)}
                      >
                        <span className="dash__tab-icon" aria-hidden="true">
                          {n.icon}
                        </span>
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="dash__side-footer">
          <Link
            className="dash__side-user dash__side-user--btn"
            to="/perfil"
            title="Ver o editar mis datos"
          >
            <span className="dash__profile">{initials}</span>
            {points != null && <span className="pts-chip">✦ {points} pts</span>}
          </Link>
          <button className="btn btn--ghost btn--sm" type="button" onClick={onLogout}>
            Salir
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="dash__overlay" onClick={() => setMobileOpen(false)} />}

      <div className="dash__main">
        <header className="dash__bar">
          <button
            className="dash__menu-btn"
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <div className="dash__bar-title">
            {nav.find((n) => n.id === tab)?.label || 'Panel'}
          </div>
          <div className="dash__bar-actions">
            <NotificationBell />
          </div>
        </header>

        <div className="prisma-content" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  )
}
