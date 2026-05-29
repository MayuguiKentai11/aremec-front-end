export type Session = {
  sessionId: string
  startedAt: Date
  patientId: string
  status: string
}

// Discriminated union for ML async fields (sps_class, recommendation).
// null from API → { status: 'pending' }; never render null directly.
export type MLField<T> =
  | { status: 'pending' }
  | { status: 'resolved'; value: T }
  | { status: 'error'; message: string }

// Per-level metrics from GET /sessions/:id/metrics
export type LevelMetrics = {
  level: number
  ors: number
  ers: number
  scs: number
  rta: number
  er: number
  sps: number
  spsClass: MLField<string>
  recommendation: MLField<
    'increase_difficulty' | 'maintain_difficulty' | 'decrease_difficulty'
  >
  cognitiveDomainTags: string[]
}

// Full metrics response shape
export type SessionMetrics = {
  sessionId: string
  levels: LevelMetrics[]
}
