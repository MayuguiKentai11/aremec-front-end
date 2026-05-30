import { useNavigate } from 'react-router-dom'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

type Props = { patientId: string }

const RECOMMENDATION_LABEL: Record<string, string> = {
  increase_difficulty: 'Aumentar dificultad',
  maintain_difficulty: 'Mantener dificultad',
  decrease_difficulty: 'Reducir dificultad',
}

export function SessionHistory({ patientId }: Props) {
  const navigate = useNavigate()
  const { data, isPending, error } = useSessionHistory(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.length === 0) {
    return <EmptyState message="Sin sesiones registradas" />
  }

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 12 }}>HISTORIAL DE SESIONES</div>
      {data.map(session => (
        <div
          key={session.sessionId}
          onClick={() => navigate(`/sessions/${session.sessionId}`)}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 2fr auto',
            gap: 12,
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 13 }}>
            {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' })
              .format(new Date(session.sessionDate))}
          </div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }}>
            SPS {session.sps.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {session.spsClass ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {session.recommendation
              ? (RECOMMENDATION_LABEL[session.recommendation] ?? session.recommendation)
              : '—'}
          </div>
          <span className={`badge ${session.status === 'complete' ? 'badge-green' : 'badge-warn'}`}>
            {session.status === 'complete' ? 'Completada' : 'Incompleta'}
          </span>
        </div>
      ))}
    </div>
  )
}
