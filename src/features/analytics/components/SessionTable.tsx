import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatDate, formatNumberMax } from '../../../shared/utils/format'
import { formatRecommendation, RECOMMENDATION_BADGE } from '../analytics.constants'
import type { SessionRow } from '../analytics.types'

type Props = { rows: SessionRow[]; patientId: string }

type SortKey = 'sessionDate' | 'sps' | 'status'
type SortDir = 'asc' | 'desc'

function compare(a: SessionRow, b: SessionRow, key: SortKey): number {
  if (key === 'sps') return (a.sps ?? -Infinity) - (b.sps ?? -Infinity)
  if (key === 'status') return (a.status ?? '').localeCompare(b.status ?? '')
  return a.sessionDate.localeCompare(b.sessionDate)
}

export function SessionTable({ rows, patientId }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sortKey, setSortKey] = useState<SortKey>('sessionDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const out = [...rows].sort((a, b) => compare(a, b, sortKey))
    return sortDir === 'asc' ? out : out.reverse()
  }, [rows, sortKey, sortDir])

  if (rows.length === 0) {
    return <EmptyState message="Ninguna sesión coincide con los filtros" />
  }

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return <ChevronsUpDown size={13} className="th-sort-icon" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="th-sort-icon th-sort-active" />
      : <ChevronDown size={13} className="th-sort-icon th-sort-active" />
  }

  const openDetail = (row: SessionRow) =>
    navigate(`/sessions/${row.sessionId}`, {
      state: {
        background: location,
        patientId,
        sessionDate: row.sessionDate,
        status: row.status ?? undefined,
      },
    })

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 12 }}>HISTORIAL DE SESIONES</div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button className="th-sort" onClick={() => toggleSort('sessionDate')}>
                  Fecha {sortIcon('sessionDate')}
                </button>
              </th>
              <th>
                <button className="th-sort" onClick={() => toggleSort('sps')}>
                  SPS {sortIcon('sps')}
                </button>
              </th>
              <th>Clase</th>
              <th>Recomendación</th>
              <th>
                <button className="th-sort" onClick={() => toggleSort('status')}>
                  Estado {sortIcon('status')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr
                key={row.sessionId}
                role="button"
                tabIndex={0}
                onClick={() => openDetail(row)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openDetail(row)
                  }
                }}
              >
                <td>{formatDate(row.sessionDate, { dateStyle: 'medium' })}</td>
                <td className="td-mono">{formatNumberMax(row.sps, 3)}</td>
                <td className="td-muted">{row.spsClass ?? '—'}</td>
                <td>
                  {row.recommendation
                    ? (
                      <span className={`badge ${RECOMMENDATION_BADGE[row.recommendation] ?? 'badge-gray'}`}>
                        {formatRecommendation(row.recommendation)}
                      </span>
                    )
                    : <span className="td-muted">—</span>}
                </td>
                <td>
                  {row.status
                    ? (
                      <span className={`badge ${row.status === 'complete' ? 'badge-green' : 'badge-warn'}`}>
                        {row.status === 'complete' ? 'Completada' : 'Incompleta'}
                      </span>
                    )
                    : <span className="td-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SessionTable
