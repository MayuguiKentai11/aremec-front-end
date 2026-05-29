import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { SessionCloseButton } from '../components/SessionCloseButton'
import { WsStatusIndicator } from '../components/WsStatusIndicator'
import { MetricsPanel } from '../components/MetricsPanel'
import { CloudflareStreamPlayer } from '../components/CloudflareStreamPlayer'
import { useSessionWebSocket } from '../hooks/useSessionWebSocket'

const CF_STREAM_ID = import.meta.env.VITE_CF_STREAM_ID as string | undefined

export default function SessionMonitorPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const sessionId = useAppStore((s) => s.activeSession.sessionId)

  // MUST be called before any conditional return (React hooks rules)
  useSessionWebSocket(sessionId ?? '')

  if (!sessionId) return <Navigate to={`/patients/${patientId ?? ''}`} replace />

  return (
    <div className="page">
      <WsStatusIndicator />
      <div className="section-header">
        <h1 className="page-title">Monitor de sesión</h1>
        <SessionCloseButton sessionId={sessionId} patientId={patientId ?? ''} />
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <MetricsPanel sessionId={sessionId} />
      </div>
      <div className="card">
        <CloudflareStreamPlayer streamId={CF_STREAM_ID ?? ''} />
      </div>
    </div>
  )
}
