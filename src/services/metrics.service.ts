import { api } from './api'
import { asArray } from '../shared/utils/asArray'
import type {
  LevelMetrics,
  SessionMetrics,
  MLField,
} from '../features/sessions/session.types'
import type {
  PatientTrendData,
  CognitiveDomainAggregate,
  DomainMetricKey,
} from '../features/analytics/analytics.types'

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

const DOMAIN_ORDER: DomainMetricKey[] = ['ors', 'ers', 'scs', 'rta', 'er']

type CognitiveDomainsRaw = {
  patient_id: string
  selected_session_id: string | null
  sessions_aggregated: number
  domains: { metric: string; latest: number | null; average: number | null }[]
}

export type CognitiveDomainsResult = {
  selectedSessionId: string | null
  sessionsAggregated: number
  aggregates: CognitiveDomainAggregate[]
}

/**
 * Server-side aggregated cognitive domains (one round-trip). Replaces the
 * client-side N-call fan-out once the backend endpoint is deployed.
 * GET /patients/:id/cognitive-domains[?session_id=...]
 */
export async function getPatientCognitiveDomains(
  patientId: string,
  sessionId?: string | null,
): Promise<CognitiveDomainsResult> {
  const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
  const raw = await api.get<CognitiveDomainsRaw>(
    `/patients/${encodeURIComponent(patientId)}/cognitive-domains${qs}`
  )
  type DomainRaw = CognitiveDomainsRaw['domains'][number]
  const byMetric = new Map(
    asArray<DomainRaw>(raw?.domains).map(d => [d.metric, d] as const),
  )
  return {
    selectedSessionId: raw.selected_session_id ?? null,
    sessionsAggregated: raw.sessions_aggregated ?? 0,
    aggregates: DOMAIN_ORDER.map(metric => ({
      metric,
      latest: byMetric.get(metric)?.latest ?? null,
      average: byMetric.get(metric)?.average ?? null,
    })),
  }
}
