import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useSessionMetrics } from '../hooks/useSession'
import { usePatient } from '../../patients/hooks/usePatient'
import { RecommendationDisplay } from './RecommendationDisplay'
import { MLFieldDisplay } from './MLFieldDisplay'
import { MetricsOpinion } from './MetricsOpinion'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatNumber, formatNumberMax, formatDate } from '../../../shared/utils/format'
import type { LevelMetrics } from '../session.types'

type Props = {
  sessionId: string
  patientId?: string
  sessionDate?: string
  status?: 'complete' | 'incomplete'
  onClose: () => void
}

const EPISODIC = ['ors', 'ers', 'scs'] as const
const ATTENTION = ['rta', 'er'] as const

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 140
  const h = 36
  const pad = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1)
    const y = h - pad - ((v - min) / span) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} role="img" aria-label="Evolución del SPS por nivel">
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24, zIndex: 1000,
}
const DIALOG_STYLE: React.CSSProperties = {
  background: 'var(--bg, #fff)', borderRadius: 12, width: '100%', maxWidth: 920,
  maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  padding: 24,
}

export function SessionDetailModal({ sessionId, patientId, sessionDate, status, onClose }: Props) {
  const { data, isPending, error } = useSessionMetrics(sessionId)
  const { data: patient } = usePatient(patientId ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const levels: LevelMetrics[] = data?.levels ? [...data.levels].sort((a, b) => a.level - b.level) : []
  const last = levels[levels.length - 1]

  return (
    <div
      style={OVERLAY_STYLE}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={DIALOG_STYLE}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de sesión"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Detalle de sesión</h2>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              {patient?.name ?? '—'}
              {patient && <> · {patient.diagnosis} · {patient.age} años</>}
              {sessionDate && <> · {formatDate(sessionDate, { dateStyle: 'medium', timeStyle: 'short' })}</>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {status && (
              <span className={`badge ${status === 'complete' ? 'badge-green' : 'badge-warn'}`}>
                {status === 'complete' ? 'Completada' : 'Incompleta'}
              </span>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>

        {isPending && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}
        {!isPending && !error && levels.length === 0 && (
          <EmptyState message="Sin datos de métricas para esta sesión" />
        )}

        {levels.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary band */}
            <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
              <div>
                <div className="card-label">SPS FINAL</div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                  {formatNumberMax(last.sps, 3)}
                </div>
              </div>
              <div>
                <div className="card-label">CLASIFICACIÓN</div>
                <MLFieldDisplay field={last.spsClass} render={(v) => <span className="badge badge-blue">{v}</span>} />
              </div>
              <div>
                <div className="card-label">RECOMENDACIÓN</div>
                <RecommendationDisplay recommendation={last.recommendation} />
              </div>
              <div>
                <div className="card-label">NIVELES</div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 22, fontWeight: 700 }}>
                  {levels.length}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div className="card-label">EVOLUCIÓN SPS</div>
                <Sparkline values={levels.map(l => l.sps)} />
              </div>
            </div>

            {/* Generative reading of the session (final level) */}
            <MetricsOpinion level={last} />

            {/* Per-level progression table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th rowSpan={2}>NIVEL</th>
                      <th colSpan={3}>MEMORIA EPISÓDICA</th>
                      <th colSpan={2}>ATENCIÓN SOSTENIDA</th>
                      <th rowSpan={2}>SPS</th>
                      <th rowSpan={2}>CLASIF.</th>
                      <th rowSpan={2}>RECOMENDACIÓN</th>
                    </tr>
                    <tr>
                      <th>ORS</th><th>ERS</th><th>SCS</th>
                      <th>RTA</th><th>ER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map(level => (
                      <tr key={level.level}>
                        <td style={{ fontWeight: 700 }}>{level.level}</td>
                        {EPISODIC.map(k => (
                          <td key={k} style={{ fontFamily: 'var(--font-mono, monospace)' }}>{formatNumber(level[k], 2)}</td>
                        ))}
                        {ATTENTION.map(k => (
                          <td key={k} style={{ fontFamily: 'var(--font-mono, monospace)' }}>{formatNumber(level[k], 2)}</td>
                        ))}
                        <td style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--accent)' }}>
                          {formatNumberMax(level.sps, 3)}
                        </td>
                        <td>
                          <MLFieldDisplay field={level.spsClass} render={(v) => <span className="badge badge-blue">{v}</span>} />
                        </td>
                        <td><RecommendationDisplay recommendation={level.recommendation} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patient baseline reference */}
            {patient && (
              <div className="card">
                <div className="card-label" style={{ marginBottom: 10 }}>LÍNEA BASE DEL PACIENTE (REFERENCIA)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
                  <div>
                    <div className="card-label">RAVLT · Memoria episódica</div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 16, fontWeight: 700 }}>
                      {formatNumber(patient.baselineRavlt, 2)}
                    </div>
                  </div>
                  <div>
                    <div className="card-label">SART · Atención sostenida</div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 16, fontWeight: 700 }}>
                      {formatNumber(patient.baselineSart, 2)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3, var(--text2))', marginTop: 8 }}>
                  Las métricas episódicas (ORS/ERS/SCS) se asocian al RAVLT y las de atención (RTA/ER) al SART.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
