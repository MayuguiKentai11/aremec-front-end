import { TrendingUp, TrendingDown, Minus, Activity, CalendarClock, ClipboardList } from 'lucide-react'
import { formatDate, formatNumber, formatNumberMax } from '../../../shared/utils/format'
import { TREND_CONFIG, formatRecommendation, type Trend } from '../analytics.constants'
import type { SessionRow } from '../analytics.types'
import { InfoTip } from '../../../shared/components/InfoTip'
import { GLOSSARY } from '../../../shared/constants/glossary'

type Props = {
  rows: SessionRow[]
  globalTrend: Trend | null
  trendSlope: number | null
}

function deltaClass(delta: number): string {
  if (delta > 0.001) return 'kpi-delta-up'
  if (delta < -0.001) return 'kpi-delta-down'
  return 'kpi-delta-flat'
}

export function KpiStrip({ rows, globalTrend, trendSlope }: Props) {
  if (rows.length === 0) return null

  const first = rows[0]
  const last = rows[rows.length - 1]
  const completed = rows.filter(r => r.status === 'complete').length
  const incomplete = rows.filter(r => r.status === 'incomplete').length

  const hasDelta = first.sps != null && last.sps != null && rows.length > 1
  const delta = hasDelta ? (last.sps as number) - (first.sps as number) : 0
  const DeltaIcon = delta > 0.001 ? TrendingUp : delta < -0.001 ? TrendingDown : Minus

  const trend = globalTrend ? TREND_CONFIG[globalTrend] : null
  const TrendIcon = trend?.icon ?? Minus

  return (
    <div className="kpi-strip">
      <div className="kpi accent-blue">
        <div className="kpi-head">
          <Activity size={15} /> Último SPS
          <InfoTip text={GLOSSARY.sps} label="SPS" align="left" />
        </div>
        <div className="kpi-value">{formatNumberMax(last.sps, 3)}</div>
        {hasDelta && (
          <div className={`kpi-delta ${deltaClass(delta)}`}>
            <DeltaIcon size={13} />
            {delta >= 0 ? '+' : ''}{formatNumber(delta, 3)} vs 1ª sesión
          </div>
        )}
      </div>

      <div className="kpi accent-cyan">
        <div className="kpi-head">
          <TrendIcon size={15} /> Tendencia
          <InfoTip text={`${GLOSSARY.trend} ${GLOSSARY.slope}`} label="Tendencia" align="left" />
        </div>
        <div className="kpi-value">{trend?.label ?? '—'}</div>
        <div className="kpi-sub">
          pendiente {trendSlope != null ? formatNumber(trendSlope, 3) : '—'}
        </div>
      </div>

      <div className="kpi accent-amber">
        <div className="kpi-head">
          <CalendarClock size={15} /> Sesiones
          <InfoTip text={GLOSSARY.sessionsCount} label="Sesiones" align="right" />
        </div>
        <div className="kpi-value">{rows.length}</div>
        <div className="kpi-sub">{completed} completas · {incomplete} incompletas</div>
      </div>

      <div className="kpi accent-rose">
        <div className="kpi-head">
          <ClipboardList size={15} /> Última sesión
          <InfoTip text={GLOSSARY.lastSession} label="Última sesión" align="right" />
        </div>
        <div className="kpi-value">
          {formatDate(last.sessionDate, { dateStyle: 'medium' })}
        </div>
        <div className="kpi-sub">{formatRecommendation(last.recommendation)}</div>
      </div>
    </div>
  )
}

export default KpiStrip
