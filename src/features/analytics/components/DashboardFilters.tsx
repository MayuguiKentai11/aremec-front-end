import { Filter } from 'lucide-react'
import type { SessionFilters, PeriodFilter, StatusFilter } from '../analytics.filters'

type Props = {
  filters: SessionFilters
  onChange: (next: SessionFilters) => void
  resultCount: number
  totalCount: number
}

const PERIODS: { value: Exclude<PeriodFilter, 'custom'>; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
]

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'complete', label: 'Completas' },
  { value: 'incomplete', label: 'Incompletas' },
]

export function DashboardFilters({ filters, onChange, resultCount, totalCount }: Props) {
  const setPeriod = (period: Exclude<PeriodFilter, 'custom'>) =>
    onChange({ ...filters, period, from: null, to: null })

  const setDate = (key: 'from' | 'to', value: string) =>
    onChange({ ...filters, period: 'custom', [key]: value || null })

  return (
    <div className="filter-bar">
      <div className="filter-bar-head">
        <span className="filter-bar-title">
          <Filter size={14} /> FILTROS
        </span>
        <span className="filter-bar-count">
          {resultCount} de {totalCount} sesiones
        </span>
      </div>

      <div className="filter-bar-row">
        <div className="filter-group" role="group" aria-label="Período">
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`btn btn-sm ${filters.period === p.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <label className="filter-label">
            Desde
            <input
              type="date"
              className="filter-date"
              value={filters.from ?? ''}
              max={filters.to ?? undefined}
              onChange={e => setDate('from', e.target.value)}
            />
          </label>
          <label className="filter-label">
            Hasta
            <input
              type="date"
              className="filter-date"
              value={filters.to ?? ''}
              min={filters.from ?? undefined}
              onChange={e => setDate('to', e.target.value)}
            />
          </label>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            Estado
            <select
              className="filter-select"
              value={filters.status}
              onChange={e => onChange({ ...filters, status: e.target.value as StatusFilter })}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}

export default DashboardFilters
