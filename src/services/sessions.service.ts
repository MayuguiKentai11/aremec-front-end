import { api } from './api'
import type { Session } from '../features/sessions/session.types'

type SessionRaw = {
  session_id: string
  started_at: string
  patient_id: string
  status: string
}

function toSession(raw: SessionRaw): Session {
  return {
    sessionId: raw.session_id,
    startedAt: new Date(raw.started_at),
    patientId: raw.patient_id,
    status: raw.status,
  }
}

export async function createSession(patientId: string): Promise<Session> {
  const raw = await api.post<SessionRaw>('/sessions', { patient_id: patientId })
  return toSession(raw)
}

export async function completeSession(sessionId: string): Promise<void> {
  await api.patch<void>(`/sessions/${encodeURIComponent(sessionId)}/complete`, {})
}
