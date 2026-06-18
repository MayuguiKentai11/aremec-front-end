import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatDate } from '../../../shared/utils/format'

type Props = { patientId: string }

const SESSION_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
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
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/sessions/${session.sessionId}`, { state: { patientId } })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate(`/sessions/${session.sessionId}`, { state: { patientId } })
            }
          }}
          style={SESSION_ROW_STYLE}
        >
          <div style={{ fontSize: 13 }}>
            {formatDate(session.sessionDate, { dateStyle: 'medium' })}
          </div>
          <span className={`badge ${session.status === 'complete' ? 'badge-green' : 'badge-warn'}`}>
            {session.status === 'complete' ? 'Completada' : 'Incompleta'}
          </span>
        </div>
      ))}
    </div>
  )
}
