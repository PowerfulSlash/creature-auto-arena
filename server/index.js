'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const db = require('./db');
const { Match, SEATS } = require('./game');

const PORT = +process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const ROOT = path.join(__dirname, '..');
db.open(DATA_DIR);

/* ------------------------------------------------------------------ static + REST */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const STATIC = { '/': 'public/index.html', '/offline': 'public/offline.html', '/wiki': 'public/wiki.html', '/shared/game.js': 'shared/game.js' };
const hits = new Map();
function limited(ip, max = 12, windowMs = 60000) {
  const now = Date.now(); const h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { n: 1, reset: now + windowMs }); return false; }
  return ++h.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now > v.reset) hits.delete(k); }, 60000).unref();

function readJson(req, cb) {
  let body = ''; let dead = false;
  req.on('data', c => { body += c; if (body.length > 2000 && !dead) { dead = true; req.destroy(); } });
  req.on('end', () => { if (dead) return; try { cb(JSON.parse(body)); } catch { cb(null); } });
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

const server = http.createServer((req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const url = req.url.split('?')[0];
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (req.method === 'POST' && (url === '/api/register' || url === '/api/login')) {
    if (limited(ip)) return json(res, 429, { error: 'Too many attempts, wait a minute' });
    return readJson(req, b => {
      if (!b) return json(res, 400, { error: 'Bad request' });
      const r = url === '/api/register' ? db.register(b.name, b.password) : db.login(b.name, b.password);
      if (r.error) return json(res, 400, { error: r.error });
      json(res, 200, { token: r.token, name: r.user.name });
    });
  }
  if (req.method === 'GET' && url === '/api/assets') {
    const list = d => { try { return fs.readdirSync(path.join(ROOT, 'public', 'assets', d)).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)); } catch { return []; } };
    res.setHeader('Cache-Control', 'no-cache');
    return json(res, 200, { portraits: list('portraits'), items: list('items') });
  }
  if (req.method === 'GET' && url === '/api/leaderboard') return json(res, 200, db.leaderboard(50));
  if (url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (req.method === 'GET' && url === '/health') return json(res, 200, { ok: true });
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let file = STATIC[url];
  if (!file && url.startsWith('/assets/')) {
    const rel = path.normalize(url).replace(/^([/\\])+/, '');
    const full = path.join(ROOT, 'public', rel);
    if (full.startsWith(path.join(ROOT, 'public', 'assets'))) file = path.relative(ROOT, full);
  }
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(ROOT, file), (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

/* ------------------------------------------------------------------ lobbies */
const lobbies = new Map();          // code -> lobby
const clients = new Map();          // userId -> client {ws,user,lobby,match,player}
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { let c; do { c = Array.from({ length: 5 }, () => CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]).join(''); } while (lobbies.has(c)); return c; };
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

function lobbyInfo(l) {
  return { code: l.code, ranked: l.ranked, public: l.public, host: l.host, players: l.members.map(c => ({ name: c.user.name, elo: c.user.elo })), max: SEATS, startAt: l.startAt, quick: l.quick, started: !!l.match };
}
function pushLobby(l) { for (const c of l.members) send(c.ws, { t: 'lobby', lobby: lobbyInfo(l) }); }
function listLobbies() { return [...lobbies.values()].filter(l => l.public && !l.match).map(lobbyInfo); }

function leaveLobby(c) {
  const l = c.lobby; if (!l) return;
  c.lobby = null;
  l.members = l.members.filter(m => m !== c);
  if (l.match) { const p = c.player; if (p && l.match.players.includes(p)) l.match.forfeit(p); c.player = null; c.match = null; }
  if (!l.members.length) { lobbies.delete(l.code); return; }
  if (l.host === c.user.name) l.host = l.members[0].user.name;
  updateStartTimer(l);
  pushLobby(l);
}

function updateStartTimer(l) {
  if (l.match) return;
  if (!l.quick) { l.startAt = null; return; }
  const humans = l.members.length;
  if (humans >= SEATS) { l.startAt = Date.now() + 1500; return; }
  if (l.ranked) l.startAt = humans >= 2 ? (l.startAt || Date.now() + 15000) : null;
  else l.startAt = l.startAt || Date.now() + 8000;
}

function startMatch(l) {
  if (l.match || !l.members.length) return;
  const entrants = l.members.map(c => ({ userId: c.user.id, name: c.user.name, elo: db.getUser(c.user.id).elo }));
  const match = new Match(entrants, { ranked: l.ranked }, {
    send: (p, msg) => { const c = clients.get(p.userId); if (c && c.ws && c.player === p) send(c.ws, msg); },
    onEnd: m => setTimeout(() => endMatch(l, m), 500)
  });
  l.match = match; l.startAt = null;
  for (const c of l.members) {
    c.match = match; c.player = match.find(c.user.id);
    c.player.ws = c.ws;
    send(c.ws, { t: 'start', ranked: match.ranked });
    match.push(c.player);
  }
}

function endMatch(l, m) {
  if (l.match !== m) return;
  for (const c of l.members) { c.match = null; c.player = null; }
  lobbies.delete(l.code);
  for (const c of l.members) c.lobby = null;
}

setInterval(() => {
  const now = Date.now();
  for (const l of lobbies.values()) if (!l.match && l.startAt && now >= l.startAt) startMatch(l);
}, 500).unref();

function joinLobby(c, l) {
  if (c.lobby) leaveLobby(c);
  if (l.match) return send(c.ws, { t: 'error', msg: 'That game has already started' });
  if (l.members.length >= SEATS) return send(c.ws, { t: 'error', msg: 'Lobby is full' });
  l.members.push(c); c.lobby = l;
  updateStartTimer(l);
  pushLobby(l);
}

function createLobby(c, { ranked, isPublic, quick }) {
  if (c.lobby) leaveLobby(c);
  const l = { code: newCode(), host: c.user.name, ranked: !!ranked, public: !!isPublic, quick: !!quick, members: [], match: null, startAt: null };
  lobbies.set(l.code, l);
  joinLobby(c, l);
  return l;
}

/* ------------------------------------------------------------------ websocket */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8 * 1024 });

wss.on('connection', ws => {
  let c = null; let msgs = 0; let windowStart = Date.now(); ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  const authTimer = setTimeout(() => { if (!c) ws.close(); }, 10000);

  ws.on('message', raw => {
    const now = Date.now();
    if (now - windowStart > 1000) { windowStart = now; msgs = 0; }
    if (++msgs > 40) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;

    if (!c) {
      if (m.t !== 'auth') return;
      const user = db.userByToken(m.token);
      if (!user) { send(ws, { t: 'authfail' }); return; }
      clearTimeout(authTimer);
      const old = clients.get(user.id);
      if (old && old.ws !== ws) { c = old; try { old.ws.close(4001, 'Logged in elsewhere'); } catch {} c.ws = ws; c.user = user; }
      else c = { ws, user, lobby: null, match: null, player: null };
      clients.set(user.id, c);
      send(ws, { t: 'authed', user });
      if (c.match && c.player && !c.match.over) { c.player.ws = ws; send(ws, { t: 'start', ranked: c.match.ranked, resume: true }); c.match.attach(c.player, ws); }
      else if (c.lobby) send(ws, { t: 'lobby', lobby: lobbyInfo(c.lobby) });
      return;
    }
    c.user = db.getUser(c.user.id) || c.user;
    switch (m.t) {
      case 'me': send(ws, { t: 'authed', user: c.user }); break;
      case 'lobbies': send(ws, { t: 'lobbies', list: listLobbies() }); break;
      case 'create': createLobby(c, { ranked: !!m.ranked, isPublic: !!m.public, quick: false }); break;
      case 'join': { const l = lobbies.get(String(m.code || '').toUpperCase().trim()); if (!l) return send(ws, { t: 'error', msg: 'No lobby with that code' }); joinLobby(c, l); break; }
      case 'quick': {
        const ranked = !!m.ranked;
        const l = [...lobbies.values()].find(x => x.public && x.quick && !x.match && x.ranked === ranked && x.members.length < SEATS);
        if (l) joinLobby(c, l); else createLobby(c, { ranked, isPublic: true, quick: true });
        break;
      }
      case 'leave': leaveLobby(c); send(ws, { t: 'left' }); break;
      case 'start': { const l = c.lobby; if (l && !l.match && l.host === c.user.name) { if (l.ranked && l.members.length < 2) return send(ws, { t: 'error', msg: 'Ranked games need at least 2 players' }); startMatch(l); } break; }
      case 'setranked': { const l = c.lobby; if (l && !l.match && l.host === c.user.name) { l.ranked = !!m.v; pushLobby(l); } break; }
      default:
        if (c.match && c.player && !c.match.over) c.match.act(c.player, m);
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimer);
    if (!c || c.ws !== ws) return;
    if (c.match && c.player) c.match.detach(c.player);
    else if (c.lobby) leaveLobby(c);
  });
  ws.on('error', () => {});
});

setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch {} }
}, 30000).unref();

if (require.main === module) server.listen(PORT, () => console.log(`Auto Arena listening on :${PORT} (data: ${DATA_DIR})`));
module.exports = { server, lobbies };
