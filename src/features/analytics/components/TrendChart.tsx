import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { usePatientTrend } from '../hooks/usePatientTrend'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

type Props = { patientId: string }

const TREND_LABEL: Record<'rising' | 'stable' | 'falling', string> = {
  rising:  'Tendencia positiva ↑',
  stable:  'Tendencia estable →',
  falling: 'Tendencia negativa ↓',
}

export function TrendChart({ patientId }: Props) {
  const { data, isPending, error } = usePatientTrend(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.sessions.length < 2) {
    return <EmptyState message="Se necesitan al menos 2 sesiones para mostrar la evolución" />
  }

  const chartData = data.sessions.map(s => ({
    label: new Intl.DateTimeFormat('es-PE', { month: 'short', day: 'numeric' })
      .format(new Date(s.sessionDate)),
    sps: s.sps,
  }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="card-label">EVOLUCIÓN SPS</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 16 }}>
          <span>{TREND_LABEL[data.trend] ?? 'Tendencia desconocida'}</span>
          <span>Pendiente: {data.slope.toFixed(2)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
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
  )
}

export default TrendChart
