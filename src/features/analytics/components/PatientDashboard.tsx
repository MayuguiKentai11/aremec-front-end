import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { usePatientDashboard } from '../hooks/usePatientDashboard'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

type Props = { patientId: string; selectedSessionId?: string | null }

const TREND_CONFIG: Record<
  'rising' | 'stable' | 'falling',
  { label: string; className: string; badgeStyle?: { backgroundColor: string; color: string } }
> = {
  rising:  { label: 'Tendencia positiva ↑', className: 'badge-green' },
  stable:  { label: 'Tendencia estable →',  className: 'badge-gray' },
  falling: { label: 'Tendencia negativa ↓', className: 'badge-gray', badgeStyle: { backgroundColor: 'var(--red, #ef4444)', color: '#fff' } },
}

const FALLBACK_TREND = TREND_CONFIG['stable']

const RECOMMENDATION_LABEL: Record<string, string> = {
  increase_difficulty: 'Aumentar dificultad',
  maintain_difficulty: 'Mantener dificultad',
  decrease_difficulty: 'Reducir dificultad',
}

function formatRecommendation(value: string | null): string {
  if (!value) return '—'
  return RECOMMENDATION_LABEL[value] ?? value
}

export function PatientDashboard({ patientId, selectedSessionId }: Props) {
  const { data, isPending, error } = usePatientDashboard(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.sessions.length === 0) {
    return <EmptyState message="Sin sesiones registradas" />
  }

  const trend = TREND_CONFIG[data.globalTrend] ?? FALLBACK_TREND

  const filteredSessions = selectedSessionId
    ? data.sessions.filter(s => s.sessionId === selectedSessionId)
    : data.sessions
  // Fallback: if filter yields nothing (stale selectedSessionId), show all
  const displayedSessions = filteredSessions.length > 0 ? filteredSessions : data.sessions

  const chartData = displayedSessions.map(s => ({
    label: new Intl.DateTimeFormat('es-PE', { month: 'short', day: 'numeric' })
      .format(new Date(s.sessionDate)),
    sps: s.sps,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 12,
          }}
        >
          <div className="card-label">TENDENCIA SPS</div>
          <span className={`badge ${trend.className}`} style={trend.badgeStyle}>{trend.label}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text2)' }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="sps"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-label" style={{ marginBottom: 12 }}>SESIONES</div>
        {displayedSessions.map(session => (
          <div
            key={session.sessionId}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 2fr',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 13 }}>
              {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(session.sessionDate))}
            </div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }}>
              SPS {session.sps.toFixed(1)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {session.spsClass ?? '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {formatRecommendation(session.recommendation)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PatientDashboard
