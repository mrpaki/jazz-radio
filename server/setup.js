const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR    = path.join(__dirname, '../data');
const ARTWORK_DIR = path.join(DATA_DIR, 'artwork');
const DB_PATH     = path.join(DATA_DIR, 'radio.db');

if (!fs.existsSync(DATA_DIR))    fs.mkdirSync(DATA_DIR,    { recursive: true });
if (!fs.existsSync(ARTWORK_DIR)) fs.mkdirSync(ARTWORK_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filepath    TEXT UNIQUE NOT NULL,
    title       TEXT,
    artist      TEXT,
    album       TEXT,
    year        INTEGER,
    duration    REAL DEFAULT 180,
    has_artwork INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS play_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id   INTEGER,
    title      TEXT,
    artist     TEXT,
    album      TEXT,
    played_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.close();
