import { useParams, useNavigate, useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { SessionDetailModal } from '../components/SessionDetailModal'
import type { SessionState } from '../../analytics/analytics.types'

type DetailState = {
  background?: Location
  patientId?: string
  sessionDate?: string
  status?: SessionState
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  if (!id) return <ErrorMessage error={new Error('Ruta inválida: falta el ID de sesión')} />

  const state = (location.state as DetailState | null) ?? {}

  const handleClose = () => {
    if (state.background) {
      navigate(-1)
    } else {
      navigate(state.patientId ? `/patients/${state.patientId}` : '/patients')
    }
  }

  return (
    <SessionDetailModal
      sessionId={id}
      patientId={state.patientId}
      sessionDate={state.sessionDate}
      status={state.status}
      onClose={handleClose}
    />
  )
}
