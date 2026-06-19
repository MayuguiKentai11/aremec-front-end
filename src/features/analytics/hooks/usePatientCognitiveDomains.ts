import { useQuery } from '@tanstack/react-query'
import { getPatientCognitiveDomains } from '../../../services/metrics.service'
import { ApiError } from '../../../shared/types/shared.types'
import { useCognitiveDomains } from './useCognitiveDomains'
import type { CognitiveDomainAggregate } from '../analytics.types'

export type CognitiveDomainsView = {
  aggregates: CognitiveDomainAggregate[]
  sessionsAggregated: number
  isPending: boolean
  hasData: boolean
  source: 'endpoint' | 'fallback'
}

const EMPTY: CognitiveDomainAggregate[] = []

function hasAnyValue(aggs: CognitiveDomainAggregate[]): boolean {
  return aggs.some(a => a.latest != null || a.average != null)
}

/**
 * Cognitive-domain aggregates with graceful degradation:
 * - Primary: GET /patients/:id/cognitive-domains (one round-trip).
 * - Fallback: client-side fan-out over /sessions/:id/metrics, activated only
 *   when the endpoint isn't deployed yet (404). Other errors surface normally.
 *
 * The fallback queries stay disabled until needed, so we never double-fetch.
 */
export function usePatientCognitiveDomains(
  patientId: string,
  sessionIds: string[],
  selectedSessionId: string | null,
): CognitiveDomainsView {
  const primary = useQuery({
    queryKey: ['patient', patientId, 'cognitive-domains', selectedSessionId ?? 'latest'],
    queryFn: () => getPatientCognitiveDomains(patientId, selectedSessionId),
    enabled: !!patientId,
    retry: false,
  })

  const endpointMissing =
    primary.error instanceof ApiError && primary.error.status === 404

  const fallback = useCognitiveDomains(sessionIds, selectedSessionId, endpointMissing)

  if (endpointMissing) {
    return { ...fallback, source: 'fallback' }
  }

  return {
    aggregates: primary.data?.aggregates ?? EMPTY,
    sessionsAggregated: primary.data?.sessionsAggregated ?? 0,
    isPending: primary.isPending,
    hasData: !!primary.data && hasAnyValue(primary.data.aggregates),
    source: 'endpoint',
  }
}
