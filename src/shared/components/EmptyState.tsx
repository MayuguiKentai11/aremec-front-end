type Props = {
  message: string
}

export function EmptyState({ message }: Props) {
  return (
    <div className="empty">
      <div className="empty-text">{message}</div>
    </div>
  )
}

export default EmptyState
