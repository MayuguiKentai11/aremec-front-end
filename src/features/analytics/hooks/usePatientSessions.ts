import { useQuery } from '@tanstack/react-query'
import { getDashboard, getSessionHistory } from '../../../services/patients.service'
import type { SessionRow } from '../analytics.types'

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

  return {
    rows,
    globalTrend: dashboard.data?.globalTrend ?? null,
    trendSlope: dashboard.data?.trendSlope ?? null,
    isPending: dashboard.isPending,
    error: dashboard.error,
  }
}
