import type { MLField } from '../session.types'
import { DomainTag } from './DomainTag'
import { MLFieldDisplay } from './MLFieldDisplay'

type Props = {
  label: string
  value: number
  domain: string
  spsClass?: MLField<string>
}

export function LevelMetricCard({ label, value, domain, spsClass }: Props) {
  return (
    <div className="metric-item">
      <div className="metric-val">{value.toFixed(2)}</div>
      <div className="metric-abbr">{label}</div>
      <div className="metric-domain">
        <DomainTag domain={domain} />
      </div>
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
