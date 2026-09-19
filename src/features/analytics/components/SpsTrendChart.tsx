import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { EmptyState } from '../../../shared/components/EmptyState'
import { InfoTip } from '../../../shared/components/InfoTip'
import { GLOSSARY } from '../../../shared/constants/glossary'
import { formatDate, formatNumber, formatNumberMax } from '../../../shared/utils/format'
import { TREND_CONFIG, formatRecommendation, type Trend } from '../analytics.constants'
import type { SessionRow } from '../analytics.types'

type Props = { rows: SessionRow[]; globalTrend: Trend | null }

type Point = {
  label: string
  sps: number | null
  spsClass: string | null
  recommendation: string | null
}

function ChartTooltip({ active, payload }: {
  active?: boolean
  payload?: { payload: Point }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{p.label}</div>
      <div className="chart-tooltip-row">
        <span>SPS</span><strong>{formatNumberMax(p.sps, 3)}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Clase</span><strong>{p.spsClass ?? '—'}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Recomendación</span><strong>{formatRecommendation(p.recommendation)}</strong>
      </div>
    </div>
  )
}

export function SpsTrendChart({ rows, globalTrend }: Props) {
  const withSps = rows.filter(r => r.sps != null)
  if (withSps.length < 2) {
    return <EmptyState message="Se necesitan al menos 2 sesiones con SPS para mostrar la evolución" />
  }

  const data: Point[] = rows.map(r => ({
    label: formatDate(r.sessionDate, { month: 'short', day: 'numeric' }),
    sps: r.sps,
    spsClass: r.spsClass,
    recommendation: r.recommendation,
  }))

  const mean =
    withSps.reduce((acc, r) => acc + (r.sps as number), 0) / withSps.length

  const trend = globalTrend ? TREND_CONFIG[globalTrend] : null
  const TrendIcon = trend?.icon

  return (
    <div className="card">
      <div className="card-head-row">
        <div className="card-label">
          Evolución del SPS
          <InfoTip
            text={`${GLOSSARY.sps} ${GLOSSARY.mean} ${GLOSSARY.spsClass}`}
            label="evolución del SPS"
            align="left"
          />
        </div>
        {trend && (
          <span className={`badge ${trend.badgeClass} badge-inline`}>
            {TrendIcon && <TrendIcon size={13} />}
            {trend.label}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: 'var(--text2)' }} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine
            y={mean}
            stroke="var(--text2)"
            strokeDasharray="4 4"
            label={{
              value: `Promedio ${formatNumber(mean, 2)}`,
              position: 'insideTopRight',
              fontSize: 10,
              fill: 'var(--text2)',
            }}
          />
          <Area
            type="monotone"
            dataKey="sps"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#spsFill)"
            dot={{ r: 3, fill: 'var(--surface)', stroke: 'var(--accent)', strokeWidth: 1.5 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SpsTrendChart
