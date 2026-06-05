# Jazz 24 🎷

24/7 online jazz radio station — Node.js + React + Socket.io.

## Pokretanje

### 1. Instalacija

```bash
cd jazz-radio
npm install
npm --prefix client install
```

### 2. Konfiguracija

```bash
cp .env.example .env
# Uredi PORT i MUSIC_DIR po potrebi
```

### 3. Dodavanje muzike

Kopiraj MP3/OGG fajlove u `/music` folder (ili folder naveden u `MUSIC_DIR`).

### 4. Pokretanje (development)

```bash
npm run dev
```

Otvori `http://localhost:5173`

### 5. Produkcija

```bash
npm run build
npm start
```

Otvori `http://localhost:3000`

---

## Struktura

```
jazz-radio/
├── server/
│   ├── index.js      — Express + Socket.io server
│   ├── streamer.js   — Playlist menadžer (shuffle, crossfade timer)
│   ├── library.js    — Skener muzičke biblioteke + SQLite
│   ├── logger.js     — Log emitovanih pjesama
│   └── setup.js      — Kreiranje SQLite šeme
├── client/src/
│   ├── App.jsx       — Root, Socket.io konekcija
│   ├── Player.jsx    — Vinyl player UI + audio logika
│   └── TrackList.jsx — Lista nedavno emitovanih
├── music/            — Dodaj MP3 fajlove ovdje
└── data/             — Auto-generisano: radio.db, artwork/
```

## API Endpoints

| Endpoint | Opis |
|---|---|
| `GET /api/now-playing` | Trenutna pjesma + startTime |
| `GET /api/history` | Zadnjih 10 emitovanih |
| `GET /api/tracks` | Cijela biblioteka |
| `GET /api/export-log` | CSV log (za SOKOJ/OFPS) |
| `GET /stream/:id` | Audio stream (Range podrška) |
| `GET /api/artwork/:id` | Album art |

## WebSocket Eventi (Socket.io)

- `now-playing` → `{ track, startTime }` — nova pjesma počela
- `listener-count` → `number` — broj slušalaca

---

## Autorska prava i licenciranje

**Za komercijalno emitovanje** operator mora pribaviti licence:

- **SOKOJ** (sokoj.rs) — za muziku zaštićenu autorskim pravima u Srbiji
- **OFPS** (ofps.rs) — za prava izvođača i producenata

### Besplatna muzika (Creative Commons / Public Domain)

Ako ne želiš koristiti zaštićenu muziku, koristiti isključivo:

- [Free Music Archive](https://freemusicarchive.org) — CC licencirani jazz
- [Jamendo](https://www.jamendo.com) — CC licencirana muzika
- [Internet Archive Audio](https://archive.org/details/audio) — Public domain jazz snimci
- [ccMixter](https://ccmixter.org) — Creative Commons

Eksportovani CSV log (`/api/export-log`) sadrži sve emitovane pjesme sa vremenskim oznakama — dostatan za izvještavanje SOKOJ/OFPS.
