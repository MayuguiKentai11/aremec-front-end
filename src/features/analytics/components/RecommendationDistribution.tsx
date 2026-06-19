import { RECOMMENDATION_LABEL } from '../analytics.constants'
import type { SessionRow } from '../analytics.types'

type Props = { rows: SessionRow[] }

const ORDER = ['increase_difficulty', 'maintain_difficulty', 'decrease_difficulty'] as const

const SEGMENT_COLOR: Record<string, string> = {
  increase_difficulty: 'var(--accent)',
  maintain_difficulty: 'var(--accent2)',
  decrease_difficulty: 'var(--warn)',
}

export function RecommendationDistribution({ rows }: Props) {
  const withRec = rows.filter(r => r.recommendation != null)
  if (withRec.length === 0) return null

  const counts = ORDER.map(key => ({
    key,
    label: RECOMMENDATION_LABEL[key],
    color: SEGMENT_COLOR[key],
    count: withRec.filter(r => r.recommendation === key).length,
  })).filter(c => c.count > 0)

  const total = withRec.length

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 12 }}>RECOMENDACIONES DE DIFICULTAD</div>

      <div className="dist-bar">
        {counts.map(c => (
          <div
            key={c.key}
            className="dist-segment"
            style={{ width: `${(c.count / total) * 100}%`, background: c.color }}
            title={`${c.label}: ${c.count}`}
          />
        ))}
      </div>

      <div className="dist-legend">
        {counts.map(c => (
          <div key={c.key} className="dist-legend-item">
            <span className="dist-dot" style={{ background: c.color }} />
            <span className="dist-legend-label">{c.label}</span>
            <span className="dist-legend-count">
              {c.count} · {Math.round((c.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecommendationDistribution
