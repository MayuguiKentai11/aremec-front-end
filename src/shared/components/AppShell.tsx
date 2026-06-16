import { NavLink, Outlet } from 'react-router-dom'
import { Users, Radio, History } from 'lucide-react'
import { useAppStore } from '../../store/app.store'
import { ActiveSessionBanner } from '../../features/sessions/components/ActiveSessionBanner'
import { SessionCompletionToast } from '../../features/sessions/components/SessionCompletionToast'
import { Topbar } from './Topbar'

export default function AppShell() {
  const neurologist = useAppStore((s) => s.auth.neurologist)
  const activePatientId = useAppStore((s) => s.activeSession.patientId)
  const initials = neurologist?.name?.trim()
    ? neurologist.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/aremec_logo.png" alt="" className="sidebar-logo-mark" />
          <div>
            <div className="logo-title">
              <span className="wm-ink">ARE</span><span className="wm-gray">MEC</span>
            </div>
            <div className="logo-sub">PORTAL CLÍNICO</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-label">PRINCIPAL</div>
          <NavLink
            to="/patients"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><Users size={18} /></span>
            Pacientes
          </NavLink>

          <div className="nav-label">MONITOREO</div>
          {activePatientId ? (
            <NavLink
              to={`/patients/${activePatientId}/session`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon"><Radio size={18} /></span>
              Sesión en Vivo
            </NavLink>
          ) : (
            <div className="nav-item nav-item-muted">
              <span className="nav-icon"><Radio size={18} /></span>
              Sesión en Vivo
            </div>
          )}

          <div className="nav-label">ANÁLISIS</div>
          <NavLink
            to="/sessions/history"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><History size={18} /></span>
            Historial de Sesiones
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{neurologist?.name ?? 'Neurólogo'}</div>
            <div className="user-role">Neurólogo</div>
          </div>
        </div>
      </aside>
      <div className="main">
        <Topbar />
        <ActiveSessionBanner />
        <SessionCompletionToast />
        <Outlet />
      </div>
    </div>
  )
}
