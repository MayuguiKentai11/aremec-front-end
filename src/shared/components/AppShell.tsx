import { NavLink, Outlet } from 'react-router-dom'
import { Users, Radio } from 'lucide-react'
import { useAppStore } from '../../store/app.store'
import { ActiveSessionBanner } from '../../features/sessions/components/ActiveSessionBanner'
import { SessionCompletionToast } from '../../features/sessions/components/SessionCompletionToast'
import { Topbar } from './Topbar'

export default function AppShell() {
  const activePatientId = useAppStore((s) => s.activeSession.patientId)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/aremec_icon.png" alt="" className="sidebar-logo-mark" />
          <div>
            <div className="logo-title">
              <span className="wm-ink">ARE</span><span className="wm-gray">MEC</span>
            </div>
            <div className="logo-sub">Portal clínico</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-label">Principal</div>
          <NavLink
            to="/patients"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><Users size={18} /></span>
            Pacientes
          </NavLink>

          <div className="nav-label">Monitoreo</div>
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
        </nav>
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
