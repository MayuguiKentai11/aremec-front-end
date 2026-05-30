import { useSessionMetrics } from '../../sessions/hooks/useSession'
import { LevelMetricCard } from '../../sessions/components/LevelMetricCard'
import { RecommendationDisplay } from '../../sessions/components/RecommendationDisplay'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

const METRIC_DOMAINS: Record<string, string> = {
  ors: 'Memoria episódica',
  ers: 'Memoria episódica',
  scs: 'Memoria episódica',
  rta: 'Atención sostenida',
  er: 'Atención sostenida',
  sps: 'Composite',
}

const METRIC_LABELS: Record<string, string> = {
  ors: 'ORS',
  ers: 'ERS',
  scs: 'SCS',
  rta: 'RTA',
  er: 'ER',
  sps: 'SPS',
}

type Props = { sessionId: string }

export function MetricDetailTable({ sessionId }: Props) {
  const { data, isPending, error } = useSessionMetrics(sessionId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.levels.length === 0) {
    return <EmptyState message="Sin datos de métricas para esta sesión" />
  }

  // Sort ascending for detail view (chronological level progression)
  const levels = [...data.levels].sort((a, b) => a.level - b.level)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {levels.map(level => (
        <div key={level.level} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-label">NIVEL {level.level}</div>
            <div>
              <span className="card-label" style={{ display: 'block', marginBottom: 4 }}>Recomendación</span>
              <RecommendationDisplay recommendation={level.recommendation} />
            </div>
          </div>
          <div className="metrics-live">
            {(['ors', 'ers', 'scs', 'rta', 'er'] as const).map(key => (
              <LevelMetricCard
                key={key}
                label={METRIC_LABELS[key]}
                value={level[key]}
                domain={METRIC_DOMAINS[key]}
              />
            ))}
            <LevelMetricCard
              label={METRIC_LABELS.sps}
              value={level.sps}
              domain={METRIC_DOMAINS.sps}
              spsClass={level.spsClass}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
