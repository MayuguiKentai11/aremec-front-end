import type { SessionRow } from './analytics.types'

export type PeriodFilter = 'all' | '30d' | '90d' | 'custom'
export type StatusFilter = 'all' | 'complete' | 'incomplete'

export type SessionFilters = {
  period: PeriodFilter
  status: StatusFilter
  from: string | null // YYYY-MM-DD
  to: string | null // YYYY-MM-DD
}

export const DEFAULT_FILTERS: SessionFilters = {
  period: 'all',
  status: 'all',
  from: null,
  to: null,
}

function periodCutoff(period: PeriodFilter): number | null {
  if (period === '30d') return Date.now() - 30 * 24 * 60 * 60 * 1000
  if (period === '90d') return Date.now() - 90 * 24 * 60 * 60 * 1000
  return null
}

/** Apply period / custom range / status filters to the unified session feed. */
export function applySessionFilters(
  rows: SessionRow[],
  filters: SessionFilters,
): SessionRow[] {
  const cutoff = periodCutoff(filters.period)
  const fromTs = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null
  const toTs = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null

  return rows.filter(row => {
    const ts = new Date(row.sessionDate).getTime()
    if (cutoff != null && ts < cutoff) return false
    if (fromTs != null && ts < fromTs) return false
    if (toTs != null && ts > toTs) return false
    if (filters.status !== 'all' && row.status !== filters.status) return false
    return true
  })
}
