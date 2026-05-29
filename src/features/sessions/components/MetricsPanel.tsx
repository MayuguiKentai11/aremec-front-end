import { useSessionMetrics } from '../hooks/useSession'
import { LevelMetricCard } from './LevelMetricCard'
import { RecommendationDisplay } from './RecommendationDisplay'
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

type Props = {
  sessionId: string
}

export function MetricsPanel({ sessionId }: Props) {
  const { data, isPending, isError, error } = useSessionMetrics(sessionId)

  if (isPending) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />

  const levels = data?.levels ?? []

  if (levels.length === 0) {
    return (
      <div className="metrics-panel">
        <div className="section-header">
          <div className="section-title">Métricas en tiempo real</div>
        </div>
        <EmptyState message="Esperando primer nivel completado…" />
      </div>
    )
  }

  const level = [...levels].sort((a, b) => b.level - a.level)[0]

  return (
    <div className="metrics-panel">
      <div className="section-header">
        <div>
          <div className="section-title">Métricas en tiempo real</div>
          <div className="section-sub">Nivel completado: {level.level}</div>
        </div>
        <div className="metrics-recommendation">
          <span
            className="card-label"
            style={{ display: 'block', marginBottom: 4 }}
          >
            Recomendación
          </span>
          <RecommendationDisplay recommendation={level.recommendation} />
        </div>
      </div>

      <div className="metrics-live">
        {(['ors', 'ers', 'scs', 'rta', 'er'] as const).map((key) => (
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
  )
}
