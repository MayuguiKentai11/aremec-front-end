import { useQuery } from '@tanstack/react-query'
import { getPatient } from '../../../services/patients.service'

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}
