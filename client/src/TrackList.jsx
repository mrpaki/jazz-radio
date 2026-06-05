export default function TrackList({ history }) {
  if (!history.length) return null

  const fmt = iso => {
    try {
      return new Date(iso).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="w-full max-w-sm mt-8">
      <h3 className="text-[11px] text-jazz-gold tracking-[0.25em] uppercase text-center mb-4">
        Nedavno emitovano
      </h3>

      <div className="space-y-1.5">
        {history.map((track, i) => (
          <div
            key={`${track.id}-${i}`}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors
              ${i === 0
                ? 'bg-jazz-card border-jazz-gold/30'
                : 'bg-jazz-card/40 border-jazz-border/50'
              }`}
          >
            <span className="text-jazz-muted text-xs w-4 text-right shrink-0">{i + 1}</span>

            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${i === 0 ? 'text-white' : 'text-jazz-cream/70'}`}>
                {track.title}
              </p>
              <p className="text-xs text-jazz-muted truncate">{track.artist}</p>
            </div>

            {i === 0 ? (
              <span className="text-[10px] text-jazz-gold border border-jazz-gold/50 px-2 py-0.5 rounded shrink-0">
                NOW
              </span>
            ) : (
              <span className="text-[10px] text-jazz-muted shrink-0">{fmt(track.playedAt)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
