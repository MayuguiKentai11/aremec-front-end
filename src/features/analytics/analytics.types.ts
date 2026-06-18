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
