import { api } from './api'
import type {
  LevelMetrics,
  SessionMetrics,
  MLField,
} from '../features/sessions/session.types'
import type { PatientTrendData } from '../features/analytics/analytics.types'

type LevelMetricsRaw = {
  level: number
  ors: number
  ers: number
  scs: number
  rta: number
  er: number
  sps: number
  sps_class: string | null
  recommendation: string | null
  cognitive_domain_tags: string[]
}

type SessionMetricsRaw = {
  session_id: string
  levels: LevelMetricsRaw[]
}

function toMLField<T>(value: T | null): MLField<T> {
  return value === null ? { status: 'pending' } : { status: 'resolved', value }
}

function toLevelMetrics(raw: LevelMetricsRaw): LevelMetrics {
  return {
    level: raw.level,
    ors: raw.ors,
    ers: raw.ers,
    scs: raw.scs,
    rta: raw.rta,
    er: raw.er,
    sps: raw.sps,
    spsClass: toMLField(raw.sps_class),
    recommendation: toMLField(
      raw.recommendation as
        | 'increase_difficulty'
        | 'maintain_difficulty'
        | 'decrease_difficulty'
        | null
    ),
    cognitiveDomainTags: raw.cognitive_domain_tags,
  }
}

export async function getSessionMetrics(
  sessionId: string
): Promise<SessionMetrics> {
  const raw = await api.get<SessionMetricsRaw>(
    `/sessions/${encodeURIComponent(sessionId)}/metrics`
  )
  return {
    sessionId: raw.session_id,
    levels: (raw.levels ?? []).map(toLevelMetrics),
  }
}

type PatientTrendRaw = {
  trend: 'rising' | 'stable' | 'falling'
  slope: number
  sessions: Array<{ session_date: string; sps: number }>
}

export async function getPatientTrend(
  patientId: string
): Promise<PatientTrendData> {
  const raw = await api.get<PatientTrendRaw>(
    `/patients/${encodeURIComponent(patientId)}/trend`
  )
  return {
    trend: raw.trend,
    slope: raw.slope,
    sessions: (raw.sessions ?? []).map(s => ({
      sessionDate: s.session_date,
      sps: s.sps,
    })),
  }
}
