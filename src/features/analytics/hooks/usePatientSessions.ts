import { useQuery } from '@tanstack/react-query'
import { getDashboard, getSessionHistory } from '../../../services/patients.service'
import type { SessionRow } from '../analytics.types'
import type { Trend } from '../analytics.constants'

// Minimum |slope| (SPS per session) to call a trend rising/falling vs stable.
const TREND_EPSILON = 0.005

/**
 * Least-squares slope of SPS over session order (chronological). Returns null
 * when there aren't enough points. Computed client-side because the dashboard
 * endpoint's own trend/slope are unreliable.
 */
function computeTrend(rows: SessionRow[]): { slope: number | null; trend: Trend } {
  const ys = rows.map(r => r.sps).filter((v): v is number => v != null)
  if (ys.length < 2) return { slope: null, trend: 'stable' }

  const n = ys.length
  const xMean = (n - 1) / 2
  const yMean = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  ys.forEach((y, x) => {
    num += (x - xMean) * (y - yMean)
    den += (x - xMean) ** 2
  })
  const slope = den === 0 ? 0 : num / den
  const trend: Trend = slope > TREND_EPSILON ? 'rising' : slope < -TREND_EPSILON ? 'falling' : 'stable'
  return { slope, trend }
}

/**
 * Unified session feed for a patient: merges the dashboard summary
 * (sps / class / recommendation / trend) with the session history (status)
 * by sessionId. Returns rows sorted oldest → newest so charts read left to right.
 *
 * This is the single source of truth for the session table, the SPS trend chart
 * and the recommendation distribution.
 */
export function usePatientSessions(patientId: string) {
  const dashboard = useQuery({
    queryKey: ['patient', patientId, 'dashboard'],
    queryFn: () => getDashboard(patientId),
    enabled: !!patientId,
  })

  const history = useQuery({
    queryKey: ['patient', patientId, 'sessions'],
    queryFn: () => getSessionHistory(patientId),
    enabled: !!patientId,
  })

  const statusById = new Map(
    (history.data ?? []).map(h => [h.sessionId, h.status]),
  )

  const rows: SessionRow[] = (dashboard.data?.sessions ?? [])
    .map(s => ({
      sessionId: s.sessionId,
      sessionDate: s.sessionDate,
      sps: s.sps,
      spsClass: s.spsClass,
      recommendation: s.recommendation,
      status: statusById.get(s.sessionId) ?? null,
    }))
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))

  const { slope, trend } = computeTrend(rows)

  return {
    rows,
    globalTrend: rows.length >= 2 ? trend : null,
    trendSlope: slope,
    isPending: dashboard.isPending,
    error: dashboard.error,
  }
}
