import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { SessionCloseButton } from '../components/SessionCloseButton'
import { WsStatusIndicator } from '../components/WsStatusIndicator'
import { SessionCompletionToast } from '../components/SessionCompletionToast'
import { useSessionWebSocket } from '../hooks/useSessionWebSocket'

export default function SessionMonitorPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const sessionId = useAppStore((s) => s.activeSession.sessionId)

  // MUST be called before any conditional return (React hooks rules)
  useSessionWebSocket(sessionId ?? '')

  if (!sessionId) return <Navigate to={`/patients/${patientId ?? ''}`} replace />

  return (
    <div className="page">
      <SessionCompletionToast />
      <WsStatusIndicator />
      <div className="section-header">
        <h1 className="page-title">Monitor de sesión</h1>
        <SessionCloseButton sessionId={sessionId} patientId={patientId!} />
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Panel de métricas en tiempo real — disponible en Story 3.3
        </p>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Stream VR en vivo — disponible en Story 3.4
        </p>
      </div>
    </div>
  )
}
