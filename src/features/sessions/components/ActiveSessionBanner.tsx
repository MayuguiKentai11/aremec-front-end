import { useAppStore } from '../../../store/app.store'

export function ActiveSessionBanner() {
  const sessionId = useAppStore((s) => s.activeSession.sessionId)
  if (!sessionId) return null
  return <div className="active-session-banner">Sesión activa</div>
}
