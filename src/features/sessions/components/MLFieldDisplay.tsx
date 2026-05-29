import type { MLField } from '../session.types'

type Props<T> = {
  field: MLField<T>
  render: (value: T) => React.ReactNode
}

export function MLFieldDisplay<T>({ field, render }: Props<T>) {
  if (field.status === 'pending') {
    return (
      <span className="ml-field-pending" aria-label="Calculando resultado ML">
        Calculando…
      </span>
    )
  }
  if (field.status === 'error') {
    return <span className="ml-field-error">{field.message}</span>
  }
  return <>{render(field.value)}</>
}
