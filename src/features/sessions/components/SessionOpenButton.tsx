import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { createSession } from '../../../services/sessions.service'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Props = {
  patientId: string
}

export function SessionOpenButton({ patientId }: Props) {
  const navigate = useNavigate()
  const setActiveSession = useAppStore((s) => s.setActiveSession)

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createSession(patientId),
    onSuccess: (session) => {
      setActiveSession({
        sessionId: session.sessionId,
        patientId: patientId,
        startedAt: session.startedAt,
        wsStatus: 'disconnected',
      })
      navigate(`/patients/${patientId}/session`)
    },
  })

  return (
    <>
      <button
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => mutate()}
      >
        {isPending ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
