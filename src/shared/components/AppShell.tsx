import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/app.store'
import { ActiveSessionBanner } from '../../features/sessions/components/ActiveSessionBanner'
import { LogoutButton } from '../../features/auth/components/LogoutButton'

export default function AppShell() {
  const neurologist = useAppStore((s) => s.auth.neurologist)
  const initials = neurologist?.name
    ? neurologist.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-title">AREMEC</div>
          <div className="logo-sub">PORTAL CLÍNICO</div>
        </div>
        <nav className="nav">
          <div className="nav-label">PRINCIPAL</div>
          <NavLink
            to="/patients"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            Pacientes
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{neurologist?.name ?? 'Neurólogo'}</div>
            <div className="user-role">Neurólogo</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="main">
        <ActiveSessionBanner />
        <Outlet />
      </div>
    </div>
  )
}
