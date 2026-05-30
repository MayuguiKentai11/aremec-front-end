const CF_STREAM_BASE = 'https://iframe.videodelivery.net'

type Props = {
  streamId: string
}

export function CloudflareStreamPlayer({ streamId }: Props) {
  if (!streamId.trim()) {
    return (
      <div className="live-wrapper">
        <div
          className="live-placeholder"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
        >
          Stream no configurado
        </div>
      </div>
    )
  }

  return (
    <div className="live-wrapper">
      <iframe
        className="live-background"
        src={`${CF_STREAM_BASE}/${encodeURIComponent(streamId)}/iframe?autoplay=true&muted=true`}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
        title="Stream VR en vivo"
      />
      <div className="live-badge">
        <div className="live-dot" />
        EN VIVO
      </div>
    </div>
  )
}
