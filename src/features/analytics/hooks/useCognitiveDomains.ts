import { useQueries } from '@tanstack/react-query'
import { getSessionMetrics } from '../../../services/metrics.service'
import type { SessionMetrics, LevelMetrics } from '../../sessions/session.types'
import type { CognitiveDomainAggregate, DomainMetricKey } from '../analytics.types'

const DOMAIN_KEYS: DomainMetricKey[] = ['ors', 'ers', 'scs', 'rta', 'er']

function mean(values: number[]): number | null {
  const finite = values.filter(v => Number.isFinite(v))
  if (finite.length === 0) return null
  return finite.reduce((a, b) => a + b, 0) / finite.length
}

/** Collapse a session's per-level metrics into one value per domain key. */
function sessionDomainValues(levels: LevelMetrics[]): Record<DomainMetricKey, number | null> {
  const out = {} as Record<DomainMetricKey, number | null>
  for (const key of DOMAIN_KEYS) {
    out[key] = mean(levels.map(l => l[key]))
  }
  return out
}

/**
 * Fetches metrics for every session in parallel and aggregates cognitive-domain
 * values. Returns one row per raw metric with the selected session's value
 * (`latest`) and the mean across all sessions (`average`).
 *
 * Domains data only exists per session (GET /sessions/:id/metrics), so the
 * historical average requires N parallel requests — there is no aggregate
 * backend endpoint.
 */
export function useCognitiveDomains(
  sessionIds: string[],
  selectedSessionId: string | null,
) {
  const results = useQueries({
    queries: sessionIds.map(id => ({
      queryKey: ['session', id, 'metrics'],
      queryFn: () => getSessionMetrics(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isPending = results.some(r => r.isPending)
  const metricsList = results
    .map(r => r.data)
    .filter((d): d is SessionMetrics => !!d && d.levels.length > 0)

  const perSession = metricsList.map(m => ({
    sessionId: m.sessionId,
    values: sessionDomainValues(m.levels),
  }))

  const targetId = selectedSessionId ?? sessionIds[sessionIds.length - 1] ?? null
  const latest = perSession.find(s => s.sessionId === targetId)
    ?? perSession[perSession.length - 1]

  const aggregates: CognitiveDomainAggregate[] = DOMAIN_KEYS.map(metric => ({
    metric,
    latest: latest?.values[metric] ?? null,
    average: mean(
      perSession
        .map(s => s.values[metric])
        .filter((v): v is number => v != null),
    ),
  }))

  return {
    aggregates,
    sessionsAggregated: perSession.length,
    isPending,
    hasData: perSession.length > 0,
  }
}
