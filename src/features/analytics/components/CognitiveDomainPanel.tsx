import { useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useCognitiveDomains } from '../hooks/useCognitiveDomains'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatDate, formatNumberMax } from '../../../shared/utils/format'
import { DOMAIN_META } from '../analytics.constants'
import type { SessionRow } from '../analytics.types'

type Props = { rows: SessionRow[] }

type RadarPoint = {
  domain: string
  latest: number // normalized 0..1 against per-axis max
  average: number
  latestRaw: number | null
  averageRaw: number | null
}

function DomainTooltip({ active, payload }: {
  active?: boolean
  payload?: { payload: RadarPoint }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{p.domain}</div>
      <div className="chart-tooltip-row">
        <span>Última</span><strong>{formatNumberMax(p.latestRaw, 3)}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Promedio</span><strong>{formatNumberMax(p.averageRaw, 3)}</strong>
      </div>
    </div>
  )
}

export function CognitiveDomainPanel({ rows }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const sessionIds = rows.map(r => r.sessionId)
  const { aggregates, sessionsAggregated, isPending, hasData } =
    useCognitiveDomains(sessionIds, selectedSessionId)

  if (rows.length === 0) {
    return <EmptyState message="Sin sesiones para analizar dominios" />
  }
  if (isPending) return <div className="card"><LoadingSpinner /></div>
  if (!hasData) {
    return <EmptyState message="Las sesiones no tienen métricas por nivel disponibles" />
  }

  const data: RadarPoint[] = aggregates.map(a => {
    const max = Math.max(a.latest ?? 0, a.average ?? 0) || 1
    return {
      domain: DOMAIN_META[a.metric].label,
      latest: (a.latest ?? 0) / max,
      average: (a.average ?? 0) / max,
      latestRaw: a.latest,
      averageRaw: a.average,
    }
  })

  // newest first for the selector
  const selectorRows = [...rows].reverse()

  return (
    <div className="card">
      <div className="card-head-row">
        <div className="card-label">DOMINIOS COGNITIVOS</div>
        <select
          className="filter-select"
          value={selectedSessionId ?? sessionIds[sessionIds.length - 1] ?? ''}
          onChange={e => setSelectedSessionId(e.target.value)}
          aria-label="Sesión para comparar"
        >
          {selectorRows.map((r, i) => (
            <option key={r.sessionId} value={r.sessionId}>
              {i === 0 ? 'Última · ' : ''}{formatDate(r.sessionDate, { dateStyle: 'medium' })}
            </option>
          ))}
        </select>
      </div>

      <p className="card-note">
        Episódico (ORS · ERS · SCS) y atención (RTA · ER). Radio relativo al máximo
        por dominio; promedio sobre {sessionsAggregated} sesiones.
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 12, fill: 'var(--text2)' }} />
          <Tooltip content={<DomainTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Radar
            name="Promedio histórico"
            dataKey="average"
            stroke="var(--text2)"
            fill="var(--text2)"
            fillOpacity={0.12}
          />
          <Radar
            name="Sesión seleccionada"
            dataKey="latest"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.28}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CognitiveDomainPanel
