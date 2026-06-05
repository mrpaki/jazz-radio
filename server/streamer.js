const { getAllTracks } = require('./library');
const { logTrack } = require('./logger');

let playlist    = [];
let currentIdx  = 0;
let currentTrack = null;
let startTime   = null;
let timer       = null;
let _io         = null;
const history   = [];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playNext() {
  if (currentIdx >= playlist.length) {
    const tracks = getAllTracks();
    if (!tracks.length) {
      console.log('No tracks. Retrying in 10s...');
      timer = setTimeout(playNext, 10_000);
      return;
    }
    playlist = shuffle(tracks);
    currentIdx = 0;
  }

  currentTrack = playlist[currentIdx++];
  startTime    = Date.now();

  history.unshift({ ...currentTrack, playedAt: new Date().toISOString() });
  if (history.length > 20) history.pop();

  logTrack(currentTrack);

  if (_io) _io.emit('now-playing', { track: currentTrack, startTime });

  console.log(`▶ ${currentTrack.artist} — ${currentTrack.title}`);

  // Crossfade: advance 2.5 s before track actually ends
  const durationMs = (currentTrack.duration || 180) * 1000;
  const delay = Math.max(durationMs - 2500, 5000);
  timer = setTimeout(playNext, delay);
}

function startStreamer(io) {
  _io = io;
  const tracks = getAllTracks();
  if (tracks.length) {
    playlist = shuffle(tracks);
    playNext();
  } else {
    console.log('Library empty — add MP3s to /music and restart.');
    timer = setTimeout(() => {
      const t = getAllTracks();
      if (t.length) { playlist = shuffle(t); playNext(); }
    }, 15_000);
  }
}

function getCurrentTrack() {
  if (!currentTrack) return null;
  return { track: currentTrack, startTime };
}

function getHistory() {
  return history.slice(0, 10);
}

module.exports = { startStreamer, getCurrentTrack, getHistory };
