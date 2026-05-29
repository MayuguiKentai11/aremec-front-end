import { useQuery } from '@tanstack/react-query'
import { getSessionMetrics } from '../../../services/metrics.service'

export function useSessionMetrics(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId, 'metrics'],
    queryFn: () => getSessionMetrics(sessionId),
    enabled: !!sessionId,
  })
}
