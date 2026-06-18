import type { MLField } from '../session.types'
import { DomainTag } from './DomainTag'
import { MLFieldDisplay } from './MLFieldDisplay'
import { formatNumber } from '../../../shared/utils/format'

// Cognitive-domain tags hidden in the live transmission view.
const HIDDEN_DOMAINS = new Set(['Memoria episódica', 'Atención sostenida'])

type Props = {
  label: string
  value: number
  domain: string
  description?: string
  spsClass?: MLField<string>
}

export function LevelMetricCard({
  label,
  value,
  domain,
  description,
  spsClass,
}: Props) {
  return (
    <div className="metric-item" tabIndex={description ? 0 : undefined} aria-label={description}>
      {description && (
        <div className="metric-tooltip" role="tooltip">
          {description}
        </div>
      )}
      <div className="metric-val">{formatNumber(value, 2)}</div>
      <div className="metric-abbr">{label}</div>
      {!HIDDEN_DOMAINS.has(domain) && (
        <div className="metric-domain">
          <DomainTag domain={domain} />
        </div>
      )}
      {spsClass !== undefined && (
        <div className="metric-sps-class">
          <span className="card-label">Clasificación</span>
          <MLFieldDisplay
            field={spsClass}
            render={(v) => <span className="badge badge-blue">{v}</span>}
          />
        </div>
      )}
    </div>
  )
}
