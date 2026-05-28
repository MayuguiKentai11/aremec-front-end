import { ApiError } from '../types/shared.types'

type Props = {
  error: unknown
}

function getMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

export function ErrorMessage({ error }: Props) {
  return (
    <div className="empty" role="alert">
      <div className="empty-text">{getMessage(error)}</div>
    </div>
  )
}

export default ErrorMessage
