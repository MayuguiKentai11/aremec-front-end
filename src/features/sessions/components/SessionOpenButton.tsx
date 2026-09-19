import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { createSession } from '../../../services/sessions.service'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Props = {
  patientId: string
}

/** "Record/live" glyph: outer ring with a large filled centre dot. */
function LiveDotIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx={12} cy={12} r={10} fill="none" stroke="currentColor" strokeWidth={2} />
      <circle cx={12} cy={12} r={5.5} fill="currentColor" />
    </svg>
  )
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
        <LiveDotIcon />
        {active.sessionId ? 'Ver sesión activa' : isPending ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
