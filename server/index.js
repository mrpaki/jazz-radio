require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

require('./setup');

const { scanLibrary, getAllTracks, getTrackById } = require('./library');
const { startStreamer, getCurrentTrack, getHistory } = require('./streamer');
const { exportCsv } = require('./logger');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const PORT       = process.env.PORT || 3000;
const CLIENT_DIST = path.join(__dirname, '../client/dist');
const HAS_BUILD  = fs.existsSync(path.join(CLIENT_DIST, 'index.html'));
const ARTWORK_DIR = path.join(__dirname, '../data/artwork');

app.use(cors());
app.use(express.json());

if (HAS_BUILD) {
  app.use(express.static(CLIENT_DIST));
}

// ─── Audio stream with Range support ───────────────────────────────────────
app.get('/stream/:id', (req, res) => {
  const track = getTrackById(parseInt(req.params.id));
  if (!track || !fs.existsSync(track.filepath)) return res.status(404).send('Not found');

  const stat = fs.statSync(track.filepath);
  const ext  = path.extname(track.filepath).toLowerCase();
  const mime = {
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
    '.wav': 'audio/wav',  '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  }[ext] || 'audio/mpeg';

  const range = req.headers.range;
  if (range) {
    const [s, e]  = range.replace(/bytes=/, '').split('-');
    const start   = parseInt(s, 10);
    const end     = e ? parseInt(e, 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': end - start + 1,
      'Content-Type':   mime,
    });
    fs.createReadStream(track.filepath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type':   mime,
      'Accept-Ranges':  'bytes',
    });
    fs.createReadStream(track.filepath).pipe(res);
  }
});

// ─── Artwork ────────────────────────────────────────────────────────────────
app.get('/api/artwork/:id', (req, res) => {
  if (!fs.existsSync(ARTWORK_DIR)) return res.status(404).send('No artwork');
  const file = fs.readdirSync(ARTWORK_DIR).find(f => f.startsWith(`${req.params.id}.`));
  if (!file) return res.status(404).send('No artwork');
  res.sendFile(path.join(ARTWORK_DIR, file));
});

// ─── REST API ────────────────────────────────────────────────────────────────
app.get('/api/tracks',      (_, res) => res.json(getAllTracks()));
app.get('/api/now-playing', (_, res) => res.json(getCurrentTrack()));
app.get('/api/history',     (_, res) => res.json(getHistory()));
app.get('/api/export-log',  (_, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="jazz24-log.csv"');
  res.send(exportCsv());
});

// ─── WebSocket ───────────────────────────────────────────────────────────────
let listenerCount = 0;
io.on('connection', socket => {
  listenerCount++;
  io.emit('listener-count', listenerCount);

  const current = getCurrentTrack();
  if (current) socket.emit('now-playing', current);

  socket.on('disconnect', () => {
    listenerCount--;
    io.emit('listener-count', listenerCount);
  });
});

// ─── SPA fallback ────────────────────────────────────────────────────────────
if (HAS_BUILD) {
  app.get('*', (_, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

// ─── Start ────────────────────────────────────────────────────────────────────
(async () => {
  await scanLibrary();
  startStreamer(io);
  server.listen(PORT, () => console.log(`\n🎷 Jazz 24 Radio → http://localhost:${PORT}\n`));
})().catch(console.error);
