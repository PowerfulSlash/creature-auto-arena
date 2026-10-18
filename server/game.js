'use strict';
// Server-authoritative match: shop, economy, pairing and fights for up to 8 players (humans + bots).
const G = require('../shared/game.js');
const db = require('./db');

const { BENCH, PLAYER_ROW, MAX_LEVEL, ODDS, EXP, STAGE_DUR, PVE_STAGES, ROSTER, BYNAME, ITEMS, BOTNAMES } = G;
const rnd = Math.random;
const pick = a => a[(rnd() * a.length) | 0];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const SEATS = 8;
const FIGHT_PAD_MS = +process.env.FIGHT_PAD_MS || 3500;
const START_HP = +process.env.START_HP || 100;

class Match {
  constructor(entrants, { ranked }, hooks) {
    this.hooks = hooks;            // { send(player,msg), onEnd(match) }
    this.players = [];
    this.stage = 1;
    this.phase = 'prep';
    this.endsAt = 0;
    this.pending = null;
    this.over = false;
    this.ratingsDone = false;
    this.lastHumanSeen = Date.now();

    for (const e of entrants) this.players.push(this.makePlayer({ userId: e.userId, name: e.name, elo: e.elo, isBot: false }));
    const names = shuffle([...BOTNAMES]);
    while (this.players.length < SEATS) {
      const i = this.players.length;
      this.players.push(this.makePlayer({ userId: null, name: names[i % names.length], isBot: true }));
    }
    const humans = this.players.filter(p => !p.isBot).length;
    this.ranked = !!ranked && humans >= 2;
    this.startPrep();
    this.timer = setInterval(() => this.tick(), 250);
  }

  makePlayer({ userId, name, elo, isBot }) {
    return {
      userId, name, elo: elo || 0, isBot, ws: null,
      hp: START_HP, alive: true, gold: 6, level: 2, xp: 0, shop: [], locked: false, pieces: [], items: [],
      streak: 0, wins: 0, ready: false, uid: 1, rollId: 0, place: null, forfeit: false, rating: null,
      pow: 0.85 + rnd() * 0.35, spr: pick(ROSTER).name, lastSeen: Date.now()
    };
  }
  humans() { return this.players.filter(p => !p.isBot); }
  alive() { return this.players.filter(p => p.alive); }
  find(userId) { return this.players.find(p => p.userId === userId); }

  /* ------------------------------------------------------------- messaging */
  publicPlayers() {
    return this.players.map(p => ({ name: p.name, hp: Math.max(0, Math.round(p.hp)), alive: p.alive, isBot: p.isBot, spr: p.spr, place: p.place, elo: p.isBot ? null : p.elo, online: p.isBot || !!p.ws }));
  }
  stateFor(p) {
    return {
      t: 'state',
      you: this.players.indexOf(p),
      stage: this.stage, phase: this.phase, endsAt: this.endsAt, now: Date.now(), pve: PVE_STAGES.includes(this.stage), ranked: this.ranked,
      gold: p.gold, hp: Math.max(0, Math.round(p.hp)), level: p.level, xp: p.xp, shop: p.shop, locked: p.locked, rollId: p.rollId,
      pieces: p.pieces, items: p.items, ready: p.ready, alive: p.alive, place: p.place,
      players: this.publicPlayers()
    };
  }
  push(p) { if (p.ws) this.hooks.send(p, this.stateFor(p)); }
  pushAll() { for (const p of this.humans()) this.push(p); }
  attach(p, ws) { p.ws = ws; p.lastSeen = Date.now(); this.push(p); if (this.fightMsgs && this.fightMsgs.get(p)) this.hooks.send(p, this.fightMsgs.get(p)); this.pushAll(); }
  detach(p) { p.ws = null; p.lastSeen = Date.now(); this.pushAll(); }

  /* ------------------------------------------------------------- shop actions */
  guard(p) { return this.phase === 'prep' && p.alive && !this.over; }
  boardPieces(p) { return p.pieces.filter(x => x.zone === 'board'); }
  benchFree(p) { for (let i = 0; i < BENCH; i++) if (!p.pieces.some(x => x.zone === 'bench' && x.x === i)) return i; return -1; }
  rollShop(p) {
    const odds = ODDS[p.level]; const out = [];
    for (let i = 0; i < 6; i++) {
      let r = rnd(), c = 1; for (let k = 0; k < 5; k++) { r -= odds[k]; if (r <= 0) { c = k + 1; break; } }
      out.push(pick(ROSTER.filter(d => d.cost === c)).name);
    }
    p.shop = out; p.rollId++;
  }
  act(p, m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'ready') { if (this.guard(p)) { p.ready = !!m.v; this.push(p); } return; }
    if (!this.guard(p)) return this.push(p);
    switch (m.t) {
      case 'buy': this.buy(p, m.i | 0); break;
      case 'sell': this.sell(p, m.uid | 0); break;
      case 'move': this.move(p, m.uid | 0, m.zone, m.x | 0, m.y | 0); break;
      case 'reroll': if (p.gold >= 1) { p.gold--; this.rollShop(p); } break;
      case 'buyxp': if (p.gold >= 4 && p.level < MAX_LEVEL) { p.gold -= 4; this.addXp(p, 4); } break;
      case 'lock': p.locked = !p.locked; break;
      case 'equip': this.equip(p, m.item | 0, m.uid | 0); break;
    }
    this.push(p);
  }
  buy(p, i) {
    const name = p.shop[i]; if (!name) return;
    const d = BYNAME[name]; if (p.gold < d.cost) return;
    const same = p.pieces.filter(x => x.name === name && x.star === 1).length;
    const slot = this.benchFree(p);
    if (slot < 0 && same < 2) return;
    p.gold -= d.cost; p.shop[i] = null;
    p.pieces.push({ uid: p.uid++, name, star: 1, zone: 'bench', x: slot, y: 0, items: [] });
    this.checkMerge(p);
  }
  checkMerge(p) {
    let again = true;
    while (again) {
      again = false;
      const groups = {};
      for (const x of p.pieces) if (x.star < 3) (groups[x.name + x.star] || (groups[x.name + x.star] = [])).push(x);
      for (const k in groups) {
        const g = groups[k]; if (g.length < 3) continue;
        g.sort((a, b) => (a.x < 0) - (b.x < 0) || (b.zone === 'board') - (a.zone === 'board'));
        const keep = g[0], rest = [g[1], g[2]];
        for (const o of rest) for (const it of o.items) if (keep.items.length < 3) keep.items.push(it); else p.items.push(it);
        p.pieces = p.pieces.filter(x => !rest.includes(x));
        keep.star++; keep.evo = true;
        if (keep.x < 0) { keep.zone = 'bench'; keep.x = this.benchFree(p); }
        again = true; break;
      }
    }
    for (const x of p.pieces) if (x.zone === 'bench' && x.x < 0) x.x = this.benchFree(p);
  }
  sell(p, uid) {
    const x = p.pieces.find(q => q.uid === uid); if (!x) return;
    const d = BYNAME[x.name];
    p.gold += x.star === 1 ? d.cost : x.star === 2 ? d.cost * 3 - 1 : d.cost * 9 - 1;
    p.pieces = p.pieces.filter(q => q !== x);
    for (const it of x.items) p.items.push(it);
  }
  move(p, uid, zone, x, y) {
    const pc = p.pieces.find(q => q.uid === uid); if (!pc) return;
    if (zone !== 'board' && zone !== 'bench') return;
    if (zone === 'board') { if (x < 0 || x >= G.BW || y < PLAYER_ROW || y >= G.BH) return; } else { x = Math.max(0, Math.min(BENCH - 1, x)); y = 0; if (x < 0 || x >= BENCH) return; }
    const other = p.pieces.find(q => q !== pc && q.zone === zone && q.x === x && (zone === 'bench' || q.y === y));
    if (zone === 'board' && pc.zone === 'bench' && !other && this.boardPieces(p).length >= p.level) return;
    if (other) { other.zone = pc.zone; other.x = pc.x; other.y = pc.y; }
    pc.zone = zone; pc.x = x; pc.y = y;
  }
  equip(p, idx, uid) {
    const pc = p.pieces.find(q => q.uid === uid); if (!pc || idx < 0 || idx >= p.items.length || pc.items.length >= 3) return;
    pc.items.push(p.items[idx]); p.items.splice(idx, 1);
  }
  addXp(p, n) {
    p.xp += n;
    while (p.level < MAX_LEVEL && p.xp >= EXP[p.level + 1]) { p.xp -= EXP[p.level + 1]; p.level++; }
    if (p.level >= MAX_LEVEL) p.xp = 0;
  }

  /* ------------------------------------------------------------- round flow */
  tick() {
    if (this.over) return;
    const now = Date.now();
    if (this.humans().some(p => p.ws)) this.lastHumanSeen = now;
    else if (now - this.lastHumanSeen > 90000) return this.abort();
    if (this.phase === 'prep') {
      const live = this.humans().filter(p => p.alive && p.ws);
      if (now >= this.endsAt || (live.length && live.every(p => p.ready))) this.startFight();
    } else if (this.phase === 'fight' && now >= this.endsAt) this.finishRound();
  }
  startPrep() {
    this.phase = 'prep';
    this.fightMsgs = null;
    this.endsAt = Date.now() + (STAGE_DUR[this.stage] || 30) * 1000;
    for (const p of this.players) {
      if (!p.alive || p.isBot) continue;
      if (!p.locked || !p.shop.length) this.rollShop(p);
      p.locked = false; p.ready = false;
    }
    this.pushAll();
  }
  boardSpecs(p, mirror) {
    return this.boardPieces(p).map(x => ({ name: x.name, star: x.star, items: x.items.slice(), x: mirror ? G.BW - 1 - x.x : x.x, y: mirror ? G.BH - 1 - x.y : x.y }));
  }
  botSpecs(stage) { return G.botTeam(Math.min(9, 2 + Math.floor(stage / 2.3)), stage, 1); }

  startFight() {
    if (this.phase !== 'prep') return;
    this.phase = 'fight';
    const stage = this.stage;
    const jobs = [];
    const alive = this.alive();
    if (PVE_STAGES.includes(stage)) {
      for (const p of alive) if (!p.isBot) jobs.push({ kind: 'pve', a: p, b: null, bSpecs: G.genEnemy(stage) });
    } else {
      const order = shuffle(alive.slice());
      for (let i = 0; i < order.length; i += 2) {
        const a = order[i], b = order[i + 1];
        if (!b) { if (!a.isBot) jobs.push({ kind: 'ghost', a, b: null, bSpecs: this.botSpecs(stage) }); else jobs.push({ kind: 'idle', a }); continue; }
        if (a.isBot && b.isBot) jobs.push({ kind: 'botbot', a, b });
        else if (a.isBot !== b.isBot) { const h = a.isBot ? b : a, bot = a.isBot ? a : b; jobs.push({ kind: 'bot', a: h, b: bot, bSpecs: G.botTeam(Math.min(9, 2 + Math.floor(stage / 2.3)), stage, bot.pow) }); }
        else jobs.push({ kind: 'pvp', a, b, bSpecs: this.boardSpecs(b, true) });
      }
    }
    let longest = 0;
    this.fightMsgs = new Map();
    for (const j of jobs) {
      if (j.kind === 'botbot') { j.res = null; continue; }
      if (j.kind === 'idle') continue;
      j.aSpecs = this.boardSpecs(j.a, false);
      j.seed = (rnd() * 4294967296) >>> 0;
      j.res = G.runBattle(j.aSpecs, j.bSpecs, j.seed);
      longest = Math.max(longest, j.res.time);
      const oppName = j.kind === 'pvp' ? j.b.name : j.kind === 'bot' ? j.b.name : j.kind === 'ghost' ? 'Ghost' : 'Wild creatures';
      const base = { t: 'fight', stage, seed: j.seed, a: j.aSpecs, b: j.bSpecs, pve: j.kind === 'pve', ms: Math.round(j.res.time * 1000) };
      this.fightMsgs.set(j.a, { ...base, you: 'a', opp: oppName });
      if (j.kind === 'pvp') this.fightMsgs.set(j.b, { ...base, you: 'b', opp: j.a.name });
    }
    const dur = Math.max(4000, Math.min(54000, longest * 1000 + FIGHT_PAD_MS));
    this.endsAt = Date.now() + dur;
    this.pending = jobs;
    for (const [p, msg] of this.fightMsgs) if (p.ws) this.hooks.send(p, msg);
    this.pushAll();
  }

  dmgTo(loser, winnerSurv) { return 2 + Math.floor(this.stage * 0.6) + winnerSurv; }
  hurt(p, dmg) { if (p.alive) p.hp -= dmg; }

  finishRound() {
    const stage = this.stage;
    const results = new Map(); // player -> true/false/null (win/loss/none)
    for (const j of this.pending || []) {
      if (j.kind === 'idle') continue;
      if (j.kind === 'botbot') {
        const pa = j.a.pow * (1 + stage * 0.02) + rnd() * 0.5, pb = j.b.pow * (1 + stage * 0.02) + rnd() * 0.5;
        this.hurt(pa > pb ? j.b : j.a, 2 + Math.floor(stage * 0.6) + ((rnd() * 3) | 0));
        continue;
      }
      const r = j.res;
      if (r.draw) { results.set(j.a, null); if (j.b && !j.b.isBot) results.set(j.b, null); continue; }
      if (j.kind === 'pve' || j.kind === 'ghost') {
        if (r.win) { results.set(j.a, true); if (j.kind === 'pve') for (let i = 0; i < (stage > 3 ? 2 : 1); i++) if (j.a.items.length < 10) j.a.items.push(pick(ITEMS).id); }
        else { results.set(j.a, false); this.hurt(j.a, 1 + Math.floor(stage / 2) + r.survB); }
      } else {
        if (r.win) { results.set(j.a, true); results.set(j.b, false); this.hurt(j.b, this.dmgTo(j.b, r.survA)); }
        else { results.set(j.a, false); results.set(j.b, true); this.hurt(j.a, this.dmgTo(j.a, r.survB)); }
      }
    }
    if (PVE_STAGES.includes(stage) && stage > 3) for (const p of this.alive()) if (p.isBot && rnd() < 0.15) this.hurt(p, 2);
    // income for humans
    for (const p of this.humans()) {
      if (!p.alive) continue;
      const w = results.get(p);
      if (w === true) { p.streak = p.streak > 0 ? p.streak + 1 : 1; p.wins++; } else if (w === false) p.streak = p.streak < 0 ? p.streak - 1 : -1;
      const interest = Math.min(5, Math.floor(p.gold / 10));
      const s = Math.abs(p.streak);
      const sb = s >= 6 ? 3 : s >= 4 ? 2 : s >= 2 ? 1 : 0;
      p.gold += (stage <= 3 ? 4 : 5) + (w === true ? 1 : 0) + interest + sb;
      this.addXp(p, 2);
    }
    // eliminations: worst hp gets worst place
    const dying = this.players.filter(p => p.alive && p.hp <= 0).sort((a, b) => a.hp - b.hp);
    let aliveCount = this.alive().length - dying.length;
    dying.forEach((p, i) => { p.alive = false; p.hp = 0; p.place = aliveCount + dying.length - i; });
    this.afterEliminations(dying);
  }

  afterEliminations(dying) {
    for (const p of dying) if (!p.isBot && p.ws) this.hooks.send(p, { t: 'eliminated', place: p.place, stage: this.stage });
    this.settleRatings();
    const alive = this.alive();
    const humansAlive = alive.filter(p => !p.isBot);
    if (alive.length <= 1 || humansAlive.length === 0) return this.finish();
    this.stage++;
    this.startPrep();
  }

  forfeit(p) {
    if (!p || !p.alive || this.over) return;
    p.alive = false; p.hp = 0; p.forfeit = true; p.ws = null;
    p.place = this.alive().length + 1;
    this.settleRatings();
    const alive = this.alive();
    if (alive.length <= 1 || alive.filter(x => !x.isBot).length === 0) return this.finish();
    this.pushAll();
  }

  // Rating is decided as soon as at most one human is still in the game (human order is then final).
  settleRatings() {
    if (this.ratingsDone || !this.ranked) return;
    const humans = this.humans();
    const aliveH = humans.filter(p => p.alive);
    if (aliveH.length > 1) return;
    this.ratingsDone = true;
    const order = [...aliveH, ...humans.filter(p => !p.alive).sort((a, b) => a.place - b.place)];
    const rows = order.map((p, i) => ({ userId: p.userId, elo: db.getUser(p.userId).elo, place: i + 1 }));
    const res = db.applyElo(rows);
    for (const r of res) {
      const p = this.find(r.userId); p.elo = r.new; p.rating = r;
      if (p.ws) this.hooks.send(p, { t: 'rating', ...r });
    }
  }

  finish() {
    if (this.over) return;
    this.over = true; clearInterval(this.timer);
    const alive = this.alive().sort((a, b) => b.hp - a.hp);
    alive.forEach((p, i) => { p.place = i + 1; });
    this.settleRatings();
    const standings = [...this.players].sort((a, b) => a.place - b.place).map(p => ({ name: p.name, place: p.place, isBot: p.isBot, elo: p.isBot ? null : p.elo }));
    for (const p of this.humans()) if (p.ws) this.hooks.send(p, { t: 'gameover', standings, place: p.place, rating: p.rating, ranked: this.ranked });
    this.hooks.onEnd(this);
  }
  abort() { if (this.over) return; this.over = true; clearInterval(this.timer); this.hooks.onEnd(this); }
}

module.exports = { Match, SEATS };
