# Creature Auto Arena

Online auto-battler: accounts, lobbies (2–8 players, bots fill empty seats), ranked Elo ladder.
Original creatures and procedurally generated pixel art. The combat/shop numbers follow the open-source
[Pokémon Auto Chess](https://github.com/keldaanCommunity/pokemonAutoChess) config (GPL-3.0), so this project is GPL-3.0 too.
No Pokémon assets are used.

## Run locally
    npm install
    npm start            # http://localhost:3000   (Node 22.13+)

Open it in two browser windows, register two accounts, make a lobby in one, join with the code in the other.
`/offline` is the single-player version (no server needed).

## Environment variables
| var | default | meaning |
|---|---|---|
| `PORT` | 3000 | HTTP/WebSocket port |
| `DATA_DIR` | `./data` | where `arena.db` (SQLite: accounts, ratings) lives. **Must be a persistent disk in production.** |
| `START_HP`, `FIGHT_PAD_MS` | 100, 3500 | test knobs only |

## How it works
- `shared/game.js` – game data + the deterministic, seeded battle simulation, used by the server (authoritative result)
  and by browsers (replay of the exact same fight).
- `server/game.js` – a match: shop, gold, XP, merging, pairing (PvE stages / human-vs-human / human-vs-bot), damage, eliminations, Elo.
- `server/index.js` – static files, `/api/register|login|leaderboard`, WebSocket lobbies and quick play.
- `server/db.js` – SQLite (node:sqlite) users, sessions, ratings. Passwords are scrypt-hashed.
- `public/index.html` – client (menu, lobby, game). `public/offline.html` – standalone single-player.

## Rating
Standard Elo (K=32, start 1000). Only ranked games with 2+ human players change ratings; each human is scored
against every other human by finishing order (bots don't count). Quitting mid-game counts as an elimination.

## Deploy
Needs a host that runs a long-lived Node process with WebSockets and a persistent disk (static hosts like GitHub Pages won't work).
- **Render**: push to GitHub, "New → Blueprint", pick the repo (uses `render.yaml`, Docker, 1 GB disk at `/data`).
- **Fly.io**: see the comments in `fly.toml`.
- **Any VPS**: `docker build -t arena . && docker run -d -p 80:3000 -v arena-data:/data arena`, put it behind HTTPS (Caddy/nginx/Cloudflare).
Serve over HTTPS so the client uses `wss://` automatically.

## Known limits
- One server process (state is in memory); a restart ends running matches (accounts/ratings are safe on disk).
- No email/password recovery. Basic per-IP rate limiting on login/register only.
- Sprites are generated in code; drop real art into the client's `sprite()` function when you have it.
