import { useLocation } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/components/LogoutButton'

type PageTitle = { title: string; sub: string }

const PAGE_TITLES: Array<{ match: (p: string) => boolean } & PageTitle> = [
  { match: (p) => p === '/patients' || p === '/patients/',  title: 'Gestión de Pacientes',  sub: 'Registro, consulta y edición de pacientes' },
  { match: (p) => p === '/patients/new',                    title: 'Nuevo Paciente',        sub: 'Complete los datos clínicos iniciales' },
  { match: (p) => /^\/patients\/[^/]+\/session/.test(p),    title: 'Sesión en Vivo',        sub: 'Monitoreo en tiempo real' },
  { match: (p) => /^\/patients\/[^/]+$/.test(p),            title: 'Dashboard del Paciente', sub: 'Métricas, historial y análisis cognitivo' },
  { match: (p) => p.startsWith('/sessions/history'),        title: 'Historial de Sesiones', sub: 'Registro cronológico de sesiones inmersivas' },
  { match: (p) => /^\/sessions\/[^/]+$/.test(p),            title: 'Detalle de Sesión',     sub: '' },
]

const FALLBACK: PageTitle = { title: 'AREMEC', sub: '' }

export function Topbar() {
  const { pathname } = useLocation()
  const meta = PAGE_TITLES.find((entry) => entry.match(pathname)) ?? FALLBACK

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{meta.title}</div>
        {meta.sub && <div className="page-sub">{meta.sub}</div>}
      </div>
      <div className="topbar-actions">
        <LogoutButton />
      </div>
    </div>
  )
}

export default Topbar
