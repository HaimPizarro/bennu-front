import { Link } from 'react-router-dom'

export default function TopBar({ right }) {
  return (
    <header className="topbar">
      <Link className="topbar__brand" to="/">
        bennu
      </Link>
      <div className="topbar__right">{right}</div>
    </header>
  )
}