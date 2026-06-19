export type SessionSummary = {
  sessionId: string
  sessionDate: string // ISO 8601
  sps: number
  spsClass: string | null
  recommendation: string | null
}

export type PatientDashboardData = {
  globalTrend: 'rising' | 'stable' | 'falling'
  trendSlope: number
  sessions: SessionSummary[]
}

export type PatientTrendData = {
  trend: 'rising' | 'stable' | 'falling'
  slope: number
  sessionsAnalyzed: number
}

export type SessionHistoryItem = {
  sessionId: string
  sessionDate: string // ISO 8601
  status: 'complete' | 'incomplete'
}

// Unified per-session row: dashboard summary (sps/class/recommendation)
// merged with history (status) by sessionId. Single source of truth for the
// session table and the SPS/recommendation charts.
export type SessionRow = {
  sessionId: string
  sessionDate: string // ISO 8601
  sps: number | null
  spsClass: string | null
  recommendation: string | null
  status: 'complete' | 'incomplete' | null
}

// Aggregated cognitive-domain metrics for the radar panel. One value per raw
// metric. `latest` = selected session, `average` = mean across all sessions.
export type DomainMetricKey = 'ors' | 'ers' | 'scs' | 'rta' | 'er'

export type CognitiveDomainAggregate = {
  metric: DomainMetricKey
  latest: number | null
  average: number | null
}
