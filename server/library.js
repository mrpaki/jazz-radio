require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH       = path.join(__dirname, '../data/radio.db');
const ARTWORK_DIR   = path.join(__dirname, '../data/artwork');
const REMOTE_TRACKS = path.join(__dirname, '../remote-tracks.json');

let _db = null;
function db() {
  if (!_db) _db = new DatabaseSync(DB_PATH);
  return _db;
}

// Remote tracks are kept in memory — no DB needed
let remoteCache = [];

function loadRemoteTracks() {
  console.log('Loading remote tracks from:', REMOTE_TRACKS);
  try {
    const raw = JSON.parse(fs.readFileSync(REMOTE_TRACKS, 'utf8'));
    remoteCache = raw.map((t, i) => ({
      id:          10000 + i,
      filepath:    null,
      url:         t.url,
      title:       t.title,
      artist:      t.artist,
      album:       t.album  || 'Public Domain Jazz',
      year:        t.year   || null,
      duration:    t.duration || 180,
      has_artwork: 0,
    }));
    console.log(`Remote tracks: ${remoteCache.length} loaded.`);
  } catch (err) {
    console.error('Remote tracks error:', err.message);
  }
}

async function scanLibrary() {
  loadRemoteTracks();

  const musicDir = process.env.MUSIC_DIR
    ? path.resolve(process.env.MUSIC_DIR)
    : path.join(__dirname, '../music');

  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
    return getAllTracks();
  }

  const files = fs.readdirSync(musicDir)
    .filter(f => /\.(mp3|ogg|flac|wav|m4a|aac)$/i.test(f))
    .map(f => path.join(musicDir, f));

  if (!files.length) {
    console.log('No local files — using remote tracks only.');
    return getAllTracks();
  }

  const { parseFile } = await import('music-metadata');
  const insert = db().prepare(`
    INSERT OR REPLACE INTO tracks (filepath, title, artist, album, year, duration, has_artwork)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const filepath of files) {
    try {
      const meta = await parseFile(filepath, { duration: true });
      const { common, format } = meta;
      const has_artwork = common.picture?.length ? 1 : 0;
      const result = insert.run(
        filepath,
        common.title  || path.basename(filepath, path.extname(filepath)),
        common.artist || 'Unknown Artist',
        common.album  || 'Unknown Album',
        common.year   || null,
        format.duration || 180,
        has_artwork
      );
      if (has_artwork) {
        const pic = common.picture[0];
        const ext = (pic.format || 'image/jpeg').split('/').pop().replace('jpeg', 'jpg');
        fs.writeFileSync(path.join(ARTWORK_DIR, `${result.lastInsertRowid}.${ext}`), pic.data);
      }
    } catch (err) {
      console.error(`Scan [${path.basename(filepath)}]:`, err.message);
    }
  }

  return getAllTracks();
}

function getAllTracks() {
  let local = [];
  try {
    local = db().prepare('SELECT * FROM tracks ORDER BY artist, title').all();
  } catch (err) {
    console.error('getAllTracks DB error:', err.message);
  }
  return [...local, ...remoteCache];
}

function getTrackById(id) {
  if (id >= 10000) return remoteCache.find(t => t.id === id) || null;
  try {
    return db().prepare('SELECT * FROM tracks WHERE id = ?').get(id);
  } catch (err) {
    return null;
  }
}

module.exports = { scanLibrary, getAllTracks, getTrackById };
