import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CircleDot } from 'lucide-react'
import { useAppStore } from '../../../store/app.store'
import { createSession } from '../../../services/sessions.service'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Props = {
  patientId: string
}

export function SessionOpenButton({ patientId }: Props) {
  const navigate = useNavigate()
  const setActiveSession = useAppStore((s) => s.setActiveSession)
  const active = useAppStore((s) => s.activeSession)

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
        onClick={() => {
          if (active.sessionId) {
            navigate(`/patients/${active.patientId ?? patientId}/session`)
            return
          }
          mutate()
        }}
      >
        <CircleDot size={16} />
        {active.sessionId ? 'Ver sesión activa' : isPending ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
