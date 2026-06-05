require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH     = path.join(__dirname, '../data/radio.db');
const ARTWORK_DIR = path.join(__dirname, '../data/artwork');

let _db = null;
function db() {
  if (!_db) _db = new DatabaseSync(DB_PATH);
  return _db;
}

async function scanLibrary() {
  const musicDir = process.env.MUSIC_DIR
    ? path.resolve(process.env.MUSIC_DIR)
    : path.join(__dirname, '../music');

  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
    console.log(`Music dir created: ${musicDir}`);
    return [];
  }

  const files = fs.readdirSync(musicDir)
    .filter(f => /\.(mp3|ogg|flac|wav|m4a|aac)$/i.test(f))
    .map(f => path.join(musicDir, f));

  if (!files.length) {
    console.log('No audio files found. Add MP3s to /music.');
    return [];
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
        const id  = result.lastInsertRowid;
        fs.writeFileSync(path.join(ARTWORK_DIR, `${id}.${ext}`), pic.data);
      }
    } catch (err) {
      console.error(`Scan error [${path.basename(filepath)}]:`, err.message);
    }
  }

  const tracks = db().prepare('SELECT * FROM tracks ORDER BY artist, title').all();
  console.log(`Library: ${tracks.length} tracks indexed.`);
  return tracks;
}

function getAllTracks() {
  return db().prepare('SELECT * FROM tracks ORDER BY artist, title').all();
}

function getTrackById(id) {
  return db().prepare('SELECT * FROM tracks WHERE id = ?').get(id);
}

module.exports = { scanLibrary, getAllTracks, getTrackById };
