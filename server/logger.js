const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/radio.db');

let _db = null;
function db() {
  if (!_db) _db = new DatabaseSync(DB_PATH);
  return _db;
}

function logTrack(track) {
  try {
    db().prepare(
      'INSERT INTO play_log (track_id, title, artist, album) VALUES (?, ?, ?, ?)'
    ).run(track.id, track.title, track.artist, track.album);
  } catch (err) {
    console.error('Logger error:', err.message);
  }
}

function exportCsv() {
  const rows = db().prepare(
    'SELECT played_at, title, artist, album FROM play_log ORDER BY played_at DESC'
  ).all();

  const esc  = s => `"${(s || '').replace(/"/g, '""')}"`;
  const lines = rows.map(r =>
    `${esc(r.played_at)},${esc(r.title)},${esc(r.artist)},${esc(r.album)}`
  );
  return 'played_at,title,artist,album\n' + lines.join('\n');
}

module.exports = { logTrack, exportCsv };
