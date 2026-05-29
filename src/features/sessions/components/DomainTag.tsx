const DOMAIN_CLASS: Record<string, string> = {
  'Memoria episódica': 'badge-blue',
  'Atención sostenida': 'badge-green',
  Composite: 'badge-gray',
}

type Props = {
  domain: string
}

export function DomainTag({ domain }: Props) {
  return (
    <span className={`badge ${DOMAIN_CLASS[domain] ?? 'badge-gray'}`}>
      {domain}
    </span>
  )
}
