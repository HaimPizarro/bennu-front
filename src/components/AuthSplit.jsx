import DashboardVisual from './DashboardVisual.jsx'

export default function AuthSplit({ children }) {
  return (
    <div className="auth-split">
      <aside className="auth-split__visual">
        <DashboardVisual />
      </aside>
      <main className="auth-split__form">
        <div className="auth-split__inner">{children}</div>
      </main>
    </div>
  )
}