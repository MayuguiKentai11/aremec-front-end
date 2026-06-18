import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePatientTrend } from '../hooks/usePatientTrend'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatNumber } from '../../../shared/utils/format'

type Props = { patientId: string }

const TREND_LABEL: Record<'rising' | 'stable' | 'falling', string> = {
  rising:  'Tendencia positiva',
  stable:  'Tendencia estable',
  falling: 'Tendencia negativa',
}

const TREND_ICON: Record<'rising' | 'stable' | 'falling', LucideIcon> = {
  rising:  TrendingUp,
  stable:  Minus,
  falling: TrendingDown,
}

const TREND_BADGE: Record<'rising' | 'stable' | 'falling', string> = {
  rising:  'badge-green',
  stable:  'badge-gray',
  falling: 'badge-warn',
}

export function TrendChart({ patientId }: Props) {
  const { data, isPending, error } = usePatientTrend(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.sessionsAnalyzed < 2) {
    return <EmptyState message="Se necesitan al menos 2 sesiones para mostrar la evolución" />
  }

  const TrendIcon = TREND_ICON[data.trend]

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="card-label">RESUMEN DE TENDENCIA</div>
        <span className={`badge ${TREND_BADGE[data.trend]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {TrendIcon && <TrendIcon size={14} />}
          {TREND_LABEL[data.trend] ?? 'Tendencia desconocida'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <div className="card-label">PENDIENTE</div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
            {formatNumber(data.slope, 3)}
          </div>
        </div>
        <div>
          <div className="card-label">SESIONES ANALIZADAS</div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 18, fontWeight: 700 }}>
            {data.sessionsAnalyzed}
          </div>
        </div>
      </div>
    </div>
  )
}
