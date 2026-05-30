import { useQuery } from '@tanstack/react-query'
import { getPatientTrend } from '../../../services/metrics.service'

export function usePatientTrend(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId, 'trend'],
    queryFn: () => getPatientTrend(patientId),
    enabled: !!patientId,
  })
}
