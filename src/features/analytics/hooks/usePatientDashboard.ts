import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../../../services/patients.service'

export function usePatientDashboard(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId, 'dashboard'],
    queryFn: () => getDashboard(patientId),
    enabled: !!patientId,
  })
}
