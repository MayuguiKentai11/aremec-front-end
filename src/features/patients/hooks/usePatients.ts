import { useQuery } from '@tanstack/react-query'
import { getPatients } from '../../../services/patients.service'
import type { PatientListParams } from '../../../services/patients.service'

export function usePatients(params?: PatientListParams) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => getPatients(params),
    staleTime: 30_000,
  })
}
