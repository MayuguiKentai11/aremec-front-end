import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DomainMetricKey } from './analytics.types'

export type Trend = 'rising' | 'stable' | 'falling'

export const TREND_CONFIG: Record<
  Trend,
  { label: string; badgeClass: string; icon: LucideIcon }
> = {
  rising:  { label: 'Tendencia positiva', badgeClass: 'badge-green', icon: TrendingUp },
  stable:  { label: 'Tendencia estable',  badgeClass: 'badge-gray',  icon: Minus },
  falling: { label: 'Tendencia negativa', badgeClass: 'badge-warn',  icon: TrendingDown },
}

export const RECOMMENDATION_LABEL: Record<string, string> = {
  increase_difficulty: 'Aumentar dificultad',
  maintain_difficulty: 'Mantener dificultad',
  decrease_difficulty: 'Reducir dificultad',
}

export const RECOMMENDATION_BADGE: Record<string, string> = {
  increase_difficulty: 'badge-green',
  maintain_difficulty: 'badge-blue',
  decrease_difficulty: 'badge-warn',
}

export function formatRecommendation(value: string | null | undefined): string {
  if (!value) return '—'
  return RECOMMENDATION_LABEL[value] ?? value
}

// Raw cognitive-domain metric labels + which clinical domain they belong to.
export const DOMAIN_META: Record<
  DomainMetricKey,
  { label: string; domain: 'episodic' | 'attention' }
> = {
  ors: { label: 'ORS', domain: 'episodic' },
  ers: { label: 'ERS', domain: 'episodic' },
  scs: { label: 'SCS', domain: 'episodic' },
  rta: { label: 'RTA', domain: 'attention' },
  er:  { label: 'ER',  domain: 'attention' },
}
