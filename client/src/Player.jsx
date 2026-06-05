import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Vinyl SVG record ────────────────────────────────────────────────────────
function Vinyl({ spinning, artworkUrl }) {
  const grooves = [88, 78, 68, 58, 50, 43]
  return (
    <div className={`relative w-60 h-60 vinyl-shadow select-none ${spinning ? 'animate-spin-slow' : ''}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Disc */}
        <circle cx="100" cy="100" r="99" fill="#0d0d14" stroke="#2a2a3f" strokeWidth="1" />

        {/* Groove rings */}
        {grooves.map(r => (
          <circle key={r} cx="100" cy="100" r={r}
            fill="none" stroke="#1a1a28" strokeWidth="0.9" />
        ))}

        {/* Specular highlight */}
        <ellipse cx="72" cy="68" rx="14" ry="7"
          fill="white" fillOpacity="0.04"
          transform="rotate(-35 72 68)" />

        {/* Center label */}
        {!artworkUrl && (
          <>
            <circle cx="100" cy="100" r="34" fill="#c9a84c" />
            <text x="100" y="97" textAnchor="middle" fontFamily="Georgia, serif"
              fontWeight="700" fontSize="11" fill="#08080e">JAZZ</text>
            <text x="100" y="111" textAnchor="middle" fontFamily="Georgia, serif"
              fontWeight="400" fontSize="10" fill="#08080e">24</text>
          </>
        )}

        {/* Spindle hole */}
        <circle cx="100" cy="100" r="4" fill="#08080e" stroke="#333350" strokeWidth="0.5" />
      </svg>

      {/* Album artwork overlay */}
      {artworkUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[68px] h-[68px] rounded-full overflow-hidden">
            <img src={artworkUrl} alt="Album art" className="w-full h-full object-cover" />
          </div>
          {/* Re-draw spindle on top */}
          <div className="absolute w-3 h-3 rounded-full bg-jazz-dark border border-[#333350]" />
        </div>
      )}
    </div>
  )
}

// ─── Needle arm ──────────────────────────────────────────────────────────────
function Needle({ playing }) {
  return (
    <div
      className="absolute top-0 right-4 w-2 origin-top transition-transform duration-700"
      style={{
        height: '120px',
        transform: playing ? 'rotate(28deg)' : 'rotate(5deg)',
      }}
    >
      <div className="w-full h-full relative">
        {/* Arm pivot */}
        <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-jazz-gold/80 border-2 border-jazz-gold shadow-lg -translate-x-1.5" />
        {/* Arm */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[2px] h-[90px] bg-gradient-to-b from-jazz-gold/70 to-jazz-gold/30 rounded-full" />
        {/* Stylus */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-jazz-gold/50 rounded-b-full" />
      </div>
    </div>
  )
}

// ─── Main Player ──────────────────────────────────────────────────────────────
export default function Player({ nowPlaying, listeners }) {
  const audioRef  = useRef(null)
  const [tuned,   setTuned]    = useState(false)
  const [playing, setPlaying]  = useState(false)
  const [volume,  setVolume]   = useState(0.8)
  const [muted,   setMuted]    = useState(false)
  const [artwork, setArtwork]  = useState(null)
  const [loading, setLoading]  = useState(false)

  const loadAndPlay = useCallback((track, startTime) => {
    const audio = audioRef.current
    if (!audio) return

    setLoading(true)
    audio.src = `/stream/${track.id}`

    const onMeta = () => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 0.5 && elapsed < audio.duration - 1) {
        audio.currentTime = elapsed
      }
      audio.play()
        .then(() => { setPlaying(true); setLoading(false) })
        .catch(() => setLoading(false))
    }

    audio.addEventListener('loadedmetadata', onMeta, { once: true })
    audio.load()
  }, [])

  // When nowPlaying changes and user is tuned in → play
  useEffect(() => {
    if (!tuned || !nowPlaying?.track) return
    setArtwork(nowPlaying.track.has_artwork ? `/api/artwork/${nowPlaying.track.id}` : null)
    loadAndPlay(nowPlaying.track, nowPlaying.startTime)
  }, [nowPlaying, tuned, loadAndPlay])

  // Track ended → wait for next socket event
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleEnded = () => setPlaying(false)
    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [])

  // Volume / mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const tuneIn = () => {
    setTuned(true)
    if (nowPlaying?.track) {
      setArtwork(nowPlaying.track.has_artwork ? `/api/artwork/${nowPlaying.track.id}` : null)
      loadAndPlay(nowPlaying.track, nowPlaying.startTime)
    }
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!tuned) { tuneIn(); return }
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play().then(() => setPlaying(true)).catch(console.warn) }
  }

  const track = nowPlaying?.track

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-sm">
      {/* Vinyl + needle wrapper */}
      <div className="relative flex items-center justify-center w-72 h-72">
        <Vinyl spinning={playing} artworkUrl={artwork} />
        <Needle playing={playing} />
      </div>

      {/* Track info */}
      <div className="text-center px-4 w-full">
        <p className="text-[10px] text-jazz-gold tracking-[0.25em] uppercase mb-2">
          {loading ? 'Učitavanje...' : 'Now Playing'}
        </p>
        <h2 className="font-serif text-xl text-white font-bold truncate">
          {track?.title || (tuned ? '—' : 'Klikni za slušanje')}
        </h2>
        <p className="text-jazz-muted mt-1 text-sm truncate">{track?.artist || ''}</p>
        <p className="text-jazz-muted/60 text-xs mt-0.5 truncate">{track?.album || ''}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full max-w-[280px]">
        {/* Mute button */}
        <button
          onClick={() => setMuted(m => !m)}
          className="text-jazz-muted hover:text-jazz-gold transition-colors text-lg w-7 text-center"
          title={muted ? 'Uključi zvuk' : 'Isključi zvuk'}
        >
          {muted ? '🔇' : volume < 0.4 ? '🔉' : '🔊'}
        </button>

        {/* Volume slider */}
        <input
          type="range" min="0" max="1" step="0.02"
          value={muted ? 0 : volume}
          onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
          className="flex-1 cursor-pointer"
        />

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-jazz-dark
            font-bold text-lg shadow-lg transition-all active:scale-95
            ${playing
              ? 'bg-jazz-gold hover:bg-jazz-gold-light'
              : 'bg-jazz-gold hover:bg-jazz-gold-light ring-2 ring-jazz-gold/30 animate-pulse'
            }`}
          aria-label={playing ? 'Pauziraj' : 'Pusti'}
        >
          {playing ? '⏸' : '▶'}
        </button>
      </div>

      {/* Listeners */}
      <div className="flex items-center gap-2 text-jazz-muted text-sm">
        <span className="text-jazz-gold/80 text-base">👥</span>
        <span>
          {listeners} {listeners === 1 ? 'slušalac' : listeners < 5 ? 'slušaoca' : 'slušalaca'}
        </span>
      </div>

      <audio ref={audioRef} preload="metadata" />
    </div>
  )
}
