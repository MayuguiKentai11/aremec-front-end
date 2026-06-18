import { api } from './api'
import { asArray } from '../shared/utils/asArray'
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

const RECOMMENDATION_VALUES = [
  'increase_difficulty',
  'maintain_difficulty',
  'decrease_difficulty',
] as const
type RecommendationValue = (typeof RECOMMENDATION_VALUES)[number]

function toRecommendationField(
  raw: string | null,
): MLField<RecommendationValue> {
  return raw != null && (RECOMMENDATION_VALUES as readonly string[]).includes(raw)
    ? { status: 'resolved', value: raw as RecommendationValue }
    : { status: 'pending' }
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
    recommendation: toRecommendationField(raw.recommendation),
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
    levels: asArray<LevelMetricsRaw>(raw?.levels).map(toLevelMetrics),
  }
}

type PatientTrendRaw = {
  trend: 'rising' | 'stable' | 'falling'
  slope_sps: number
  sessions_analyzed: number
}

export async function getPatientTrend(
  patientId: string
): Promise<PatientTrendData> {
  const raw = await api.get<PatientTrendRaw>(
    `/patients/${encodeURIComponent(patientId)}/trend`
  )
  return {
    trend: raw.trend,
    slope: raw.slope_sps,
    sessionsAnalyzed: raw.sessions_analyzed ?? 0,
  }
}
