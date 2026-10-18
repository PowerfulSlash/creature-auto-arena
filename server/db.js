'use strict';
// Accounts, sessions and ratings, stored in a single SQLite file (Node's built-in node:sqlite).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const START_ELO = 1000;
let db;

function open(dir) {
  fs.mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(path.join(dir, 'arena.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      elo INTEGER NOT NULL DEFAULT ${START_ELO},
      games INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      top3 INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS users_elo ON users(elo DESC);
  `);
}

const NAME_RE = /^[A-Za-z0-9_-]{3,16}$/;
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');

function newSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)').run(token, userId, Date.now());
  return token;
}

function register(name, password) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) return { error: 'Name must be 3-16 letters, numbers, _ or -' };
  if (typeof password !== 'string' || password.length < 6 || password.length > 72) return { error: 'Password must be 6-72 characters' };
  if (db.prepare('SELECT 1 FROM users WHERE name = ?').get(name)) return { error: 'That name is taken' };
  const salt = crypto.randomBytes(16).toString('hex');
  const info = db.prepare('INSERT INTO users(name,salt,hash,created) VALUES(?,?,?,?)').run(name, salt, hashPw(password, salt), Date.now());
  const id = Number(info.lastInsertRowid);
  return { token: newSession(id), user: getUser(id) };
}

function login(name, password) {
  if (typeof name !== 'string' || typeof password !== 'string' || password.length > 72) return { error: 'Invalid login' };
  const row = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
  if (!row) return { error: 'Invalid name or password' };
  const a = Buffer.from(hashPw(password, row.salt), 'hex');
  const b = Buffer.from(row.hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { error: 'Invalid name or password' };
  return { token: newSession(row.id), user: getUser(row.id) };
}

function getUser(id) {
  const r = db.prepare('SELECT id,name,elo,games,wins,top3 FROM users WHERE id = ?').get(id);
  return r || null;
}

function userByToken(token) {
  if (typeof token !== 'string' || token.length !== 64) return null;
  const s = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  return s ? getUser(s.user_id) : null;
}

function logout(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function leaderboard(limit = 50) {
  return db.prepare('SELECT name,elo,games,wins,top3 FROM users WHERE games > 0 ORDER BY elo DESC, games DESC LIMIT ?').all(limit);
}

// results: [{userId, place (1 = best, among the humans), elo}] -> returns [{userId, old, new, delta}]
function applyElo(results, K = 32) {
  const n = results.length;
  const out = [];
  if (n < 2) return out;
  for (const a of results) {
    let sum = 0;
    for (const b of results) {
      if (a === b) continue;
      const expected = 1 / (1 + Math.pow(10, (b.elo - a.elo) / 400));
      const score = a.place < b.place ? 1 : a.place > b.place ? 0 : 0.5;
      sum += score - expected;
    }
    const delta = Math.round((K * sum) / (n - 1) * (n > 2 ? 1.5 : 1)); // bigger lobbies move ratings a bit more
    out.push({ userId: a.userId, old: a.elo, new: Math.max(0, a.elo + delta), delta, place: a.place });
  }
  const up = db.prepare('UPDATE users SET elo=?, games=games+1, wins=wins+?, top3=top3+? WHERE id=?');
  for (const r of out) up.run(r.new, r.place === 1 ? 1 : 0, r.place <= 3 ? 1 : 0, r.userId);
  return out;
}

module.exports = { open, register, login, getUser, userByToken, logout, leaderboard, applyElo, START_ELO };
