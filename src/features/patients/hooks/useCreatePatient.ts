import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatient } from '../../../services/patients.service'

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
