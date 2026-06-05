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

function loadRemoteTracks() {
  console.log('Remote tracks path:', REMOTE_TRACKS);
  if (!fs.existsSync(REMOTE_TRACKS)) {
    console.log('remote-tracks.json NOT FOUND');
    return;
  }
  try {
    const tracks = JSON.parse(fs.readFileSync(REMOTE_TRACKS, 'utf8'));
    const insert = db().prepare(`
      INSERT OR IGNORE INTO tracks (url, title, artist, album, year, duration, has_artwork)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    for (const t of tracks) {
      insert.run(t.url, t.title, t.artist, t.album || 'Public Domain Jazz', t.year || null, t.duration || 180);
    }
    console.log(`Remote tracks: ${tracks.length} loaded.`);
  } catch (err) {
    console.error('loadRemoteTracks error:', err.message);
  }
}

async function scanLibrary() {
  const musicDir = process.env.MUSIC_DIR
    ? path.resolve(process.env.MUSIC_DIR)
    : path.join(__dirname, '../music');

  // Load remote tracks first (fallback playlist)
  loadRemoteTracks();

  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
    return getAllTracks();
  }

  const files = fs.readdirSync(musicDir)
    .filter(f => /\.(mp3|ogg|flac|wav|m4a|aac)$/i.test(f))
    .map(f => path.join(musicDir, f));

  if (!files.length) {
    console.log('No local files. Using remote tracks.');
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
      console.error(`Scan error [${path.basename(filepath)}]:`, err.message);
    }
  }

  const tracks = getAllTracks();
  console.log(`Library: ${tracks.length} tracks total.`);
  return tracks;
}

function getAllTracks() {
  return db().prepare('SELECT * FROM tracks ORDER BY artist, title').all();
}

function getTrackById(id) {
  return db().prepare('SELECT * FROM tracks WHERE id = ?').get(id);
}

module.exports = { scanLibrary, getAllTracks, getTrackById };
