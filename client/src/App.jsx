import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import Player from './Player'
import TrackList from './TrackList'

export default function App() {
  const [nowPlaying, setNowPlaying]   = useState(null)
  const [history, setHistory]         = useState([])
  const [listeners, setListeners]     = useState(0)
  const [connected, setConnected]     = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io({ path: '/socket.io' })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      fetch('/api/now-playing').then(r => r.json()).then(d => { if (d) setNowPlaying(d) })
      fetch('/api/history').then(r => r.json()).then(setHistory)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('now-playing', data => {
      setNowPlaying(data)
      setHistory(prev => {
        const entry = { ...data.track, playedAt: new Date().toISOString() }
        return [entry, ...prev.filter(t => t.id !== data.track.id)].slice(0, 10)
      })
    })

    socket.on('listener-count', setListeners)

    return () => socket.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-jazz-dark text-jazz-cream flex flex-col items-center py-10 px-4">
      {/* Header */}
      <header className="w-full max-w-sm text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-jazz-gold text-2xl">♪</span>
          <h1 className="font-serif text-4xl text-jazz-gold tracking-widest">JAZZ 24</h1>
          <span className="text-jazz-gold text-2xl">♪</span>
        </div>
        <p className="text-jazz-muted text-[11px] tracking-[0.35em] uppercase">The Sound of the Night</p>

        {/* Live indicator */}
        <div className={`mt-3 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
          connected
            ? 'border-emerald-800 text-emerald-400'
            : 'border-red-900 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          {connected ? 'LIVE' : 'Konekcija...'}
        </div>
      </header>

      <Player nowPlaying={nowPlaying} listeners={listeners} />

      <TrackList history={history} />

      {/* Footer */}
      <footer className="mt-12 text-jazz-muted text-[11px] text-center leading-relaxed max-w-xs">
        <a
          href="/api/export-log"
          className="text-jazz-gold/60 hover:text-jazz-gold transition-colors underline underline-offset-2"
        >
          Preuzmi log emitovanja (SOKOJ/OFPS)
        </a>
        <p className="mt-2 opacity-50">Jazz 24 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
