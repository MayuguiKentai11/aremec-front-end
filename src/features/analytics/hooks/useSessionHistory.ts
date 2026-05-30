import { useQuery } from '@tanstack/react-query'
import { getSessionHistory } from '../../../services/patients.service'

export function useSessionHistory(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId, 'sessions'],
    queryFn: () => getSessionHistory(patientId),
    enabled: !!patientId,
  })
}
