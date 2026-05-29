import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { completeSession } from '../../../services/sessions.service'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Props = {
  sessionId: string
  patientId: string
}

export function SessionCloseButton({ sessionId, patientId }: Props) {
  const navigate = useNavigate()
  const resetActiveSession = useAppStore((s) => s.resetActiveSession)

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => completeSession(sessionId),
    onSuccess: () => {
      resetActiveSession()
      navigate(`/patients/${patientId}`, { replace: true })
    },
  })

  return (
    <>
      <button
        className="btn btn-danger"
        disabled={isPending}
        onClick={() => mutate()}
      >
        {isPending ? 'Cerrando...' : 'Cerrar sesión'}
      </button>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
