const G=require('../shared/game.js');
const {TYPES,ROSTER,ITEMS,ABIL,HPM,ATM,ODDS,EXP,PVE_STAGES,STAGE_DUR}=G;
const tn=t=>TYPES[t].n;
const cap=s=>s[0].toUpperCase()+s.slice(1);
const R=['','Common','Uncommon','Rare','Epic','Ultra'];
const typeKeys=Object.keys(TYPES);
const unitsOf=t=>ROSTER.filter(u=>u.types.includes(t));
const abilityOf=u=>ABIL[u.ab];
const f=n=>Math.round(n);
// ---------- synergy text per tier (value lists in order of thresholds)
const tierVals=t=>{const T=TYPES[t];return T.th.map((n,i)=>({n,fx:T.fx(i+1)}))};
function tierLine(t,i){const x=tierVals(t)[i];return x.n+' units: '+TYPES[t].desc.split(/[:,]/)[0]}
// ---------- general rules
const rules=[
['Board & bench','Your level equals the number of units you may field (Level 2 = 2 units … Level 9 = 9). The bench holds 8 units. You can only place units on the bottom 3 rows of the board.'],
['Merging','Three copies of the same unit at the same star level merge into one unit of the next star (max 3 stars). Items on the merged copies are kept (up to 3 per unit; extras return to your item stash). 2-star units have 2x HP and 1.8x attack; 3-star units have 4x HP and 3.2x attack.'],
['Buying & selling','Rerolling the shop costs 1 gold. Buying XP costs 4 gold for 4 XP. Selling gives back the cost for a 1-star unit, (cost x 3 - 1) for a 2-star and (cost x 9 - 1) for a 3-star, and returns equipped items.'],
['Income each round','Base 4 gold (stages 1-3) or 5 gold (stage 4+), +1 for winning, +1 interest per 10 gold you hold (max +5), and a streak bonus for consecutive wins or losses: 2-3 streak +1, 4-5 streak +2, 6+ streak +3. You also gain 2 XP every round.'],
['Rounds','Stages 1, 2 and 3 are wild encounters (very weak). Stage 9, 14, 19, 24, 28, 32, 36 and 40 are boss fights. Every other stage is player-vs-player (or vs a bot team). Winning a wild round drops items (1 item, 2 on boss stages).'],
['Taking damage','Losing a PvP round costs you 2 + floor(stage x 0.6) + the number of surviving enemy units, in HP. Losing a wild round costs 1 + floor(stage / 2) + surviving enemies. You start with 100 HP; at 0 you are eliminated.'],
['Combat basics','Units move toward the nearest enemy and attack automatically. Base attack speed is 0.8 attacks per second. Each attack gives +10 mana (plus any bonuses) and being hit gives +4 mana; when mana is full the unit casts its ability instead of attacking. Melee units have 90 mana, ranged units 70. Damage = attack x 30 / (30 + target defense). Everyone has a 5% base crit chance (crits deal 1.5x damage). A fight lasts at most 45 seconds; if both sides survive, the side with more total remaining HP wins.'],
['Synergies','Count the number of DIFFERENT species you have on the board that share a type (two copies of the same unit count once). Reaching a threshold activates that tier of the bonus for every unit of that type on your team. Units have two types, so they count towards two synergies.'],
['Ranked (online)','Standard Elo, K=32, starting at 1000. Only ranked games with 2+ human players change ratings; each human is scored against every other human by finishing order. Quitting counts as an elimination.']
];
// ---------- markdown
let md=`# Creature Auto Arena - Wiki\n\n_Generated from the game's data. ${ROSTER.length} units, ${typeKeys.length} synergies, ${ITEMS.length} items._\n\n## Contents\n1. [Rules](#rules)\n2. [Shop odds & levels](#shop-odds--levels)\n3. [Synergies](#synergies)\n4. [Abilities](#abilities)\n5. [Items](#items)\n6. [Units](#units)\n\n## Rules\n`;
for(const [h,t] of rules)md+=`- **${h}.** ${t}\n`;
md+=`\n## Shop odds & levels\nChance for each shop slot to be a unit of that cost, by your level. XP needed to reach the next level in the last column.\n\n| Level | 1-cost | 2-cost | 3-cost | 4-cost | 5-cost | XP to next level |\n|---|---|---|---|---|---|---|\n`;
for(let l=1;l<=9;l++)md+=`| ${l} | ${ODDS[l].map(p=>p?Math.round(p*100)+'%':'-').join(' | ')} | ${l<9?(G.EXP[l+1]):'max'} |\n`;
md+=`\n## Synergies\n_Thresholds count different species of that type on your board. Values in each effect line are listed in threshold order._\n\n`;
md+=`| Synergy | Thresholds | Effect (per threshold) | Units |\n|---|---|---|---|\n`;
for(const t of typeKeys)md+=`| **${tn(t)}** | ${TYPES[t].th.join(' / ')} | ${TYPES[t].desc} | ${unitsOf(t).length} |\n`;
md+=`\n### Synergy details\n`;
for(const t of typeKeys){
  md+=`\n#### ${tn(t)}\n- **Thresholds:** ${TYPES[t].th.join(' / ')} different ${tn(t)} units\n- **Effect:** ${TYPES[t].desc}\n- **Ability style of ${tn(t)}-primary units:** ${ABIL[G.ROSTER.find(u=>u.types[0]===t)?.ab||'bolt'][0]}\n`;
  const us=unitsOf(t).sort((a,b)=>a.cost-b.cost||a.name.localeCompare(b.name));
  md+=`- **Units (${us.length}):** ${us.map(u=>`${u.name} (${u.cost})`).join(', ')}\n`;
}
md+=`\n## Abilities\nEvery unit's ability is set by its **first** type.\n\n| Ability | Effect | Used by first type |\n|---|---|---|\n`;
const abKinds=Object.keys(ABIL);
for(const k of abKinds)md+=`| **${ABIL[k][0]}** | ${ABIL[k][1]} Scales with ability power. | ${typeKeys.filter(t=>ROSTER.find(u=>u.types[0]===t&&u.ab===k)).map(tn).join(', ')} |\n`;
md+=`\n## Items\nEach unit can hold up to 3 items. Items drop from wild rounds and bosses; drag them onto a unit during the prep phase.\n\n| Item | Effect |\n|---|---|\n`;
for(const i of ITEMS)md+=`| **${i.n}** | ${i.d} |\n`;
md+=`\n## Units\nBase stats are for 1-star. 2-star = 2x HP, 1.8x attack. 3-star = 4x HP, 3.2x attack. Range 1 = melee. "Mana" is the amount needed to cast.\n`;
for(let c=1;c<=5;c++){
  md+=`\n### ${c}-cost (${R[c]})\n\n| Unit | Types | HP | Attack | Defense | Range | Mana | Ability |\n|---|---|---|---|---|---|---|---|\n`;
  for(const u of ROSTER.filter(u=>u.cost===c).sort((a,b)=>a.name.localeCompare(b.name)))
    md+=`| **${u.name}** | ${u.types.map(tn).join(' / ')} | ${u.hp} | ${u.atk} | ${u.def} | ${u.range} | ${u.maxMana} | ${abilityOf(u)[0]} |\n`;
}
const OUT=require('path').join(__dirname,'..');
require('fs').writeFileSync(require('path').join(__dirname,'..','Creature-Auto-Arena-Wiki.md'),md);

// ---------- html
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const badge=t=>`<span class="b" style="background:${TYPES[t].c}">${tn(t)}</span>`;
let h=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Creature Auto Arena Wiki</title><style>
:root{--bg:#141a2e;--p:#222a48;--p2:#2c3558;--tx:#eef1fb;--mu:#9aa5c9;--hi:#ffd84a;--ln:#0b0f1e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.5 "Trebuchet MS",Verdana,sans-serif}
header{position:sticky;top:0;z-index:5;background:#0f1424ee;backdrop-filter:blur(6px);border-bottom:3px solid var(--ln);padding:10px 16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
header h1{margin:0;font-size:20px}nav{display:flex;gap:10px;flex-wrap:wrap}nav a{color:#8ec5ff;text-decoration:none;font-size:14px}nav a:hover{text-decoration:underline}
#q{margin-left:auto;padding:7px 10px;border-radius:8px;border:2px solid var(--ln);background:var(--p);color:var(--tx);min-width:200px;font:inherit}
main{max-width:1100px;margin:0 auto;padding:16px}section{margin:0 0 34px}h2{border-bottom:3px solid var(--ln);padding-bottom:4px;color:var(--hi)}
.card{background:var(--p);border:3px solid var(--ln);border-radius:12px;padding:12px 14px;margin:10px 0}
table{width:100%;border-collapse:collapse;background:var(--p);border:3px solid var(--ln);border-radius:10px;overflow:hidden}
th,td{padding:6px 9px;text-align:left;border-bottom:1px solid var(--ln);vertical-align:top}th{background:var(--p2);font-size:13px;color:var(--mu)}
.b{display:inline-block;padding:1px 8px;border-radius:99px;color:#111;font-size:12px;border:2px solid #000;margin:1px 2px 1px 0}
.mu{color:var(--mu)}.hide{display:none!important}ul{margin:6px 0;padding-left:20px}.gold{color:var(--hi)}
.syn h3{margin:0 0 4px}.units a{color:#cfe3ff;text-decoration:none}.units span{display:inline-block;margin:2px 8px 2px 0}
.tbl{overflow-x:auto}
</style></head><body><header><h1>Creature Auto Arena Wiki</h1><nav><a href="/">← Back to game</a><a href="#rules">Rules</a><a href="#odds">Shop odds</a><a href="#synergies">Synergies</a><a href="#abilities">Abilities</a><a href="#items">Items</a><a href="#units">Units</a></nav><input id="q" placeholder="Search units, synergies, items…"></header><main>`;
h+=`<section id="rules"><h2>Rules</h2><div class="card"><ul>`+rules.map(([a,b])=>`<li><b>${esc(a)}.</b> ${esc(b)}</li>`).join('')+`</ul></div></section>`;
h+=`<section id="odds"><h2>Shop odds &amp; levels</h2><div class="tbl"><table><tr><th>Level</th><th>1-cost</th><th>2-cost</th><th>3-cost</th><th>4-cost</th><th>5-cost</th><th>XP to next</th></tr>`;
for(let l=1;l<=9;l++)h+=`<tr><td>${l}</td>${ODDS[l].map(p=>`<td>${p?Math.round(p*100)+'%':'–'}</td>`).join('')}<td>${l<9?EXP[l+1]:'max'}</td></tr>`;
h+=`</table></div></section><section id="synergies"><h2>Synergies</h2><p class="mu">Thresholds count <b>different species</b> of that type on your board. Effect values are listed in threshold order.</p>`;
for(const t of typeKeys){const us=unitsOf(t).sort((a,b)=>a.cost-b.cost||a.name.localeCompare(b.name));
  h+=`<div class="card syn s" data-k="${esc((tn(t)+' '+TYPES[t].desc+' '+us.map(u=>u.name).join(' ')).toLowerCase())}"><h3>${badge(t)} <span class="gold">${TYPES[t].th.join(' / ')}</span></h3><div>${esc(TYPES[t].desc)}</div><div class="units mu" style="margin-top:6px">${us.map(u=>`<span><a href="#u-${u.name}">${u.name}</a> <small>(${u.cost})</small></span>`).join('')}</div></div>`}
h+=`</section><section id="abilities"><h2>Abilities</h2><p class="mu">A unit's ability is determined by its first type.</p><div class="tbl"><table><tr><th>Ability</th><th>Effect</th><th>First types</th></tr>`;
for(const k of abKinds)h+=`<tr><td><b>${ABIL[k][0]}</b></td><td>${esc(ABIL[k][1])} Scales with ability power.</td><td>${typeKeys.filter(t=>ROSTER.find(u=>u.types[0]===t&&u.ab===k)).map(badge).join('')}</td></tr>`;
h+=`</table></div></section><section id="items"><h2>Items</h2><p class="mu">Up to 3 per unit. Dropped by wild rounds and bosses; equip during prep.</p><div class="tbl"><table><tr><th>Item</th><th>Effect</th></tr>`;
for(const i of ITEMS)h+=`<tr class="s" data-k="${esc((i.n+' '+i.d).toLowerCase())}"><td><b>${esc(i.n)}</b></td><td>${esc(i.d)}</td></tr>`;
h+=`</table></div></section><section id="units"><h2>Units</h2><p class="mu">1-star base stats. 2-star = 2x HP &amp; 1.8x attack; 3-star = 4x HP &amp; 3.2x attack. Range 1 = melee.</p>`;
for(let c=1;c<=5;c++){h+=`<h3>${c}-cost <span class="mu">(${R[c]})</span></h3><div class="tbl"><table><tr><th>Unit</th><th>Types</th><th>HP</th><th>Atk</th><th>Def</th><th>Range</th><th>Mana</th><th>Ability</th></tr>`;
  for(const u of ROSTER.filter(u=>u.cost===c).sort((a,b)=>a.name.localeCompare(b.name)))
    h+=`<tr class="s" id="u-${u.name}" data-k="${esc((u.name+' '+u.types.map(tn).join(' ')+' '+abilityOf(u)[0]).toLowerCase())}"><td><b>${u.name}</b></td><td>${u.types.map(badge).join('')}</td><td>${u.hp}</td><td>${u.atk}</td><td>${u.def}</td><td>${u.range}</td><td>${u.maxMana}</td><td title="${esc(abilityOf(u)[1])}">${abilityOf(u)[0]}</td></tr>`;
  h+=`</table></div>`}
h+=`</section></main><script>const q=document.getElementById('q');q.oninput=()=>{const v=q.value.trim().toLowerCase();document.querySelectorAll('.s').forEach(e=>e.classList.toggle('hide',!!v&&!e.dataset.k.includes(v)))}</script></body></html>`;
require('fs').writeFileSync(require('path').join(__dirname,'..','public','wiki.html'),h);
console.log('units',ROSTER.length,'syn',typeKeys.length,'md bytes',md.length,'html bytes',h.length);
