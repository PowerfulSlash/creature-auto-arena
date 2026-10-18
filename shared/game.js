/* Shared game rules + deterministic battle simulation (runs on server AND in browsers). */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Game=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
const BW=8, BH=6, BENCH=8, PLAYER_ROW=3, MAX_LEVEL=9;
// numbers mirrored from the open-source Pokemon Auto Chess config
const ODDS={1:[1,0,0,0,0],2:[1,0,0,0,0],3:[.7,.3,0,0,0],4:[.5,.4,.1,0,0],5:[.36,.42,.2,.02,0],6:[.25,.4,.3,.05,0],7:[.15,.35,.35,.15,0],8:[.11,.27,.35,.22,.05],9:[.05,.2,.35,.3,.1]};
const EXP={2:2,3:6,4:10,5:22,6:34,7:52,8:72,9:72};      // xp needed to reach that level
const STAGE_DUR={1:20,2:20,3:20,5:40,8:40,9:40,10:50,11:40,15:40,19:40,20:50};
const PVE_STAGES=[1,2,3,6,10,15,20,25,30,35,40];
const TYPES={
 normal:{n:'Normal',c:'#c8c8c8',ab:'NO',th:[2,4,6,8],desc:'Max HP +10/20/35/60%',fx:t=>({hp:[.1,.2,.35,.6][t-1]})},
 sound:{n:'Sound',c:'#ec6fa8',ab:'SO',th:[2,4,6],desc:'+3/6/10 mana per attack',fx:t=>({mana:[3,6,10][t-1]})},
 flying:{n:'Flying',c:'#c9a6e8',ab:'FL',th:[2,4,6,8],desc:'Attack speed +20/35/55/80%',fx:t=>({aspd:[.2,.35,.55,.8][t-1]})},
 fighting:{n:'Fighting',c:'#d4483f',ab:'FG',th:[2,4,6,8],desc:'Attack +20/40/70/110%',fx:t=>({atk:[.2,.4,.7,1.1][t-1]})},
 poison:{n:'Poison',c:'#6dcb78',ab:'PO',th:[2,4,6],desc:'Hits poison 1/2/3% max HP per sec',fx:t=>({poison:[1,2,3][t-1]})},
 field:{n:'Field',c:'#e0963c',ab:'FI',th:[2,4,6],desc:'Max HP +15/35/60%',fx:t=>({hp:[.15,.35,.6][t-1]})},
 wild:{n:'Wild',c:'#b83a3a',ab:'WI',th:[2,4,6],desc:'Crit +15/30/50%, Atk +10/20/30%',fx:t=>({crit:[.15,.3,.5][t-1],atk:[.1,.2,.3][t-1]})},
 fire:{n:'Fire',c:'#f0702f',ab:'FR',th:[2,4,6,8],desc:'Hits deal bonus 20/40/70/110% Atk',fx:t=>({bonus:[.2,.4,.7,1.1][t-1]})},
 water:{n:'Water',c:'#4f9bec',ab:'WA',th:[2,4,6,8],desc:'Start with +20/35/50/70 mana',fx:t=>({mana0:[20,35,50,70][t-1]})},
 grass:{n:'Grass',c:'#5fbf4f',ab:'GR',th:[2,4,6],desc:'Regen 1/2/3.5% HP per sec',fx:t=>({regen:[.01,.02,.035][t-1]})},
 electric:{n:'Electric',c:'#f2d83a',ab:'EL',th:[2,4,6],desc:'Hits chain to 1/2/3 more enemies',fx:t=>({chain:t})},
 psychic:{n:'Psychic',c:'#e8609a',ab:'PS',th:[2,4,6],desc:'Ability power +25/50/90%',fx:t=>({ap:[.25,.5,.9][t-1]})},
 dark:{n:'Dark',c:'#6b5a7e',ab:'DK',th:[2,4,6],desc:'Crit +10%, crit damage +40/80/140%',fx:t=>({crit:.1,critdmg:[.4,.8,1.4][t-1]})},
 steel:{n:'Steel',c:'#9db4c4',ab:'ST',th:[2,4,6],desc:'Defense +5/10/18',fx:t=>({def:[5,10,18][t-1]})},
 ice:{n:'Ice',c:'#8fe3f2',ab:'IC',th:[2,4,6],desc:'Hits slow targets 40%, Def +2/4/8',fx:t=>({slow:1,def:[2,4,8][t-1]})},
 ghost:{n:'Ghost',c:'#7a5fb0',ab:'GH',th:[2,4,6],desc:'Dodge 10/20/35% of attacks',fx:t=>({dodge:[.1,.2,.35][t-1]})},
 bug:{n:'Bug',c:'#a8c33a',ab:'BG',th:[2,4,6],desc:'Attack +10/20/30%, speed +10/20/35%',fx:t=>({atk:[.1,.2,.3][t-1],aspd:[.1,.2,.35][t-1]})},
 rock:{n:'Rock',c:'#a39a7e',ab:'RK',th:[2,4,6],desc:'Reflect 10/20/35% melee dmg, Def +2/4/6',fx:t=>({reflect:[.1,.2,.35][t-1],def:[2,4,6][t-1]})},
 ground:{n:'Ground',c:'#c9a35a',ab:'GD',th:[2,4,6],desc:'Defense +3/6/10, HP +10/20/35%',fx:t=>({def:[3,6,10][t-1],hp:[.1,.2,.35][t-1]})}
};
const ABIL={bolt:['Power Shot','Deals 3x Atk to its target.'],nova:['Shockwave','Deals 2x Atk to all adjacent enemies.'],heal:['Mend','Heals the weakest ally.'],
  buff:['Rally','Allies within 2 tiles gain +20% Atk.'],stun:['Paralyze','Stuns the target for 1.5s and deals 1.5x Atk.'],drain:['Drain','Deals 2.2x Atk and heals half of it.']};
const ABMAP={normal:'bolt',sound:'buff',flying:'bolt',fighting:'nova',poison:'drain',field:'heal',wild:'bolt',fire:'nova',water:'heal',grass:'drain',electric:'stun',psychic:'stun',dark:'drain',steel:'nova',ground:'nova',ice:'stun',ghost:'drain',bug:'bolt',rock:'nova'};
const RANGED=['psychic','sound','electric','grass','poison'];
// [name, type1, type2, cost]  -- all original creatures
const ROSTER=[
 ['Pebblit','ground','normal',1],['Sprigle','grass','normal',1],['Embrit','fire','normal',1],['Dewpup','water','field',1],['Zaplet','electric','wild',1],
 ['Chirpy','flying','sound',1],['Mothlet','poison','flying',1],['Scrapper','fighting','normal',1],['Shadelet','dark','wild',1],
 ['Boulderoo','ground','fighting',2],['Leafawn','grass','field',2],['Cindrake','fire','wild',2],['Tidefin','water','flying',2],['Voltmouse','electric','field',2],
 ['Warblow','sound','flying',2],['Toxipod','poison','grass',2],['Ironpup','steel','normal',2],['Mindling','psychic','sound',2],['Gloomcat','dark','normal',2],
 ['Quakeback','ground','steel',3],['Thornlion','grass','wild',3],['Blazehorn','fire','fighting',3],['Aquadon','water','psychic',3],['Stormraptor','electric','flying',3],
 ['Echobat','sound','dark',3],['Venomaw','poison','dark',3],['Steelhound','steel','fire',3],['Brawlbear','fighting','wild',3],['Sagewing','psychic','flying',3],['Meadowdeer','field','grass',3],
 ['Terradrake','ground','flying',4],['Floraqueen','grass','psychic',4],['Magmawyrm','fire','ground',4],['Tsunamar','water','sound',4],['Thunderstag','electric','field',4],
 ['Nightstalker','dark','wild',4],['Titanfist','fighting','steel',4],['Mystifox','psychic','normal',4],['Wailspore','sound','poison',4],
 ['Solarion','fire','psychic',5],
 ['Tinkit','steel','normal',1],['Dreamling','psychic','normal',1],['Bolthide','steel','electric',2],['Hexcub','psychic','dark',2],['Pupling','normal','field',1],['Shellkin','water','rock',1],['Gritlet','rock','ground',1],['Fluffin','normal','sound',1],['Wispet','ghost','dark',1],
 ['Frostkit','ice','normal',1],['Beetlet','bug','normal',1],['Sparkbug','bug','electric',1],['Burrowl','ground','flying',1],['Cubby','wild','normal',1],
 ['Snowhare','ice','field',2],['Cragmite','rock','fighting',2],['Webspin','bug','poison',2],['Ghoulet','ghost','grass',2],['Hummer','sound','bug',2],
 ['Tuskboar','wild','ground',2],['Pyrofly','fire','bug',2],['Coralisk','water','rock',2],['Mothwing','bug','flying',2],['Glimmerfin','water','ice',2],
 ['Glacipede','ice','bug',3],['Boulderhorn','rock','wild',3],['Spectrix','ghost','psychic',3],['Hornetking','bug','fighting',3],['Cryobear','ice','fighting',3],
 ['Lanternwisp','ghost','fire',3],['Moltenback','rock','fire',3],['Stingtail','poison','bug',3],['Tempestcrow','flying','dark',3],['Gaiaphant','ground','field',3],
 ['Frostwyrm','ice','flying',4],['Obsidian','rock','dark',4],['Phantomare','ghost','wild',4],['Scarabeast','bug','steel',4],['Glaciarch','ice','water',4],
 ['Cragtitan','rock','steel',4],['Harmonix','sound','psychic',4],['Voltwolf','electric','wild',4],
 ['Eclipsar','ghost','dark',5],['Permafrost','ice','psychic',5],['Hivemind','bug','psychic',5],['Monolith','rock','psychic',5],['Wraithlord','ghost','steel',5],['Emberphoenix','fire','flying',5],['Abyssal','water','dark',5],['Skybreaker','flying','electric',5],['Colossus','steel','ground',5],['Noxqueen','poison','psychic',5]
].map(([name,t1,t2,cost])=>{
  const rg=RANGED.includes(t1);
  const hpb=[0,60,90,130,180,250][cost], atb=[0,7,10,14,19,26][cost], dfb=[0,3,5,8,11,15][cost];
  return {name,types:[t1,t2],cost,range:rg?3:1,hp:Math.round(hpb*(rg?.85:1.25)),atk:Math.round(atb*(rg?1.15:1)),def:dfb+(rg?0:2),ab:ABMAP[t1],maxMana:rg?70:90};
});
const BYNAME=Object.fromEntries(ROSTER.map(d=>[d.name,d]));
const HPM=[0,1,2,4], ATM=[0,1,1.8,3.2];
const ITEMS=[
 {id:'band',n:'Power Band',g:'A',c:'#e06a6a',d:'+8 Attack',fx:{atkAdd:8}},
 {id:'plate',n:'Iron Plate',g:'D',c:'#9db4c4',d:'+8 Defense',fx:{def:8}},
 {id:'charm',n:'Swift Charm',g:'S',c:'#f2d83a',d:'+25% attack speed',fx:{aspd:.25}},
 {id:'orb',n:'Mana Orb',g:'M',c:'#6aaee8',d:'+30 starting mana',fx:{mana0:30}},
 {id:'berry',n:'Hearty Berry',g:'H',c:'#7ccf7c',d:'+90 max HP',fx:{hpAdd:90}},
 {id:'lens',n:'Sharp Lens',g:'C',c:'#e8a23c',d:'+25% crit chance',fx:{crit:.25}},
 {id:'leaf',n:'Regrowth Leaf',g:'R',c:'#5fbf4f',d:'Regen 1.5% HP per sec',fx:{regen:.015}},
 {id:'wand',n:'Mind Wand',g:'P',c:'#e8609a',d:'+40% ability power',fx:{ap:.4}},
 {id:'scarf',n:'Speed Scarf',g:'W',c:'#4fd0c8',d:'+35% move speed',fx:{move:.35}},
 {id:'aegis',n:'Aegis Charm',g:'G',c:'#b8c8ff',d:'Starts with a shield (30% max HP)',fx:{shield:.3}},
 {id:'fang',n:'Vampire Fang',g:'V',c:'#a8324a',d:'Heal 25% of attack damage',fx:{steal:.25}},
 {id:'bomb',n:'Blast Core',g:'B',c:'#ff8a3c',d:'Attacks splash adjacent foes for 50%',fx:{splash:.5}},
 {id:'venom',n:'Venom Vial',g:'X',c:'#7bd45a',d:'Attacks poison for 2% HP/s',fx:{poison:2}},
 {id:'frost',n:'Frost Gem',g:'F',c:'#9fe3ff',d:'Attacks slow the target 40%',fx:{slow:1}},
 {id:'rage',n:'Rage Totem',g:'T',c:'#d4483f',d:'+30% Attack',fx:{atk:.3}},
 {id:'crown',n:"King's Crown",g:'K',c:'#ffd84a',d:'+12% to all stats',fx:{all:.12}},
 {id:'thorn',n:'Thorn Mail',g:'N',c:'#6b8f3a',d:'Reflect 20% of melee damage taken',fx:{reflect:.2}},
 {id:'gear',n:'Time Gear',g:'Z',c:'#c9a35a',d:'+8 mana per attack',fx:{mana:8}}
];
const BOTNAMES=['Ember','Nova','Quill','Bramble','Zephyr','Mosswood','Drift'];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cheb=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
let rnd=Math.random;
const pick=a=>a[(rnd()*a.length)|0];
const NOHOOK={fx(){},float(){},burst(){},shake(){}};
let H=NOHOOK,B=null;
function synergies(names){ // names: array of species names (distinct counted)
  const uniq=[...new Set(names)];const cnt={};
  for(const n of uniq)for(const t of new Set(BYNAME[n].types))cnt[t]=(cnt[t]||0)+1;
  const res={};
  for(const t in cnt){const th=TYPES[t].th;let tier=0;for(const v of th)if(cnt[t]>=v)tier++;res[t]={count:cnt[t],tier}}
  return res;
}
/* ------------------------------------------------------------------ combat */
function makeUnit(spec,side,syn,mult){
  const d=BYNAME[spec.name];const s=spec.star;
  const u={uid:0,side,def:d,name:d.name,star:s,x:spec.x,y:spec.y,px:spec.x,py:spec.y,alive:true,cd:rnd()*.4,mcd:0,stun:0,poison:0,poisonT:0,target:null,lunge:0,lx:0,ly:0,shield:0};
  let dodge=0;let mv=0,shieldP=0,steal=0,splash=0,slow=0,reflect=0,all=0;let hpP=0,atkP=0,aspd=0,def=d.def,crit=.05,critdmg=0,mana=0,mana0=0,regen=0,ap=0,chain=0,bonus=0,poison=0,hpAdd=0,atkAdd=0;
  const own=new Set(d.types);
  for(const t of own){const sy=syn[t];if(!sy||!sy.tier)continue;const f=TYPES[t].fx(sy.tier);
    slow=Math.max(slow,f.slow||0);reflect+=f.reflect||0;dodge+=f.dodge||0;hpP+=f.hp||0;atkP+=f.atk||0;aspd+=f.aspd||0;def+=f.def||0;crit+=f.crit||0;critdmg+=f.critdmg||0;mana+=f.mana||0;mana0+=f.mana0||0;regen+=f.regen||0;ap+=f.ap||0;chain=Math.max(chain,f.chain||0);bonus+=f.bonus||0;poison=Math.max(poison,f.poison||0)}
  for(const it of (spec.items||[])){const f=ITEMS.find(i=>i.id===it).fx;
    atkAdd+=f.atkAdd||0;def+=f.def||0;aspd+=f.aspd||0;mana0+=f.mana0||0;hpAdd+=f.hpAdd||0;crit+=f.crit||0;regen+=f.regen||0;ap+=f.ap||0;
    atkP+=f.atk||0;mv+=f.move||0;shieldP+=f.shield||0;steal+=f.steal||0;splash+=f.splash||0;poison=Math.max(poison,f.poison||0);slow+=f.slow||0;reflect+=f.reflect||0;all+=f.all||0;mana+=f.mana||0}
  u.maxhp=Math.round((d.hp*HPM[s]*(1+hpP)+hpAdd)*mult*(1+all));u.hp=u.maxhp;u.shield=Math.round(u.maxhp*shieldP);u.moveSpd=1+mv;u.steal=steal;u.splash=splash;u.slowHit=slow;u.reflect=reflect;u.dodge=Math.min(.6,dodge);
  u.atk=(d.atk*ATM[s]*(1+atkP)+atkAdd)*mult*(1+all);u.df=def;u.aspd=.8*(1+aspd);u.crit=Math.min(1,crit);u.critdmg=critdmg;
  u.manaBonus=mana;u.mana=Math.min(d.maxMana,mana0);u.regen=regen;u.ap=ap;u.chain=chain;u.bonus=bonus;u.poisonLv=poison;
  return u;
}
function genEnemy(stage){
  const out=[];
  if(PVE_STAGES.includes(stage)){
    const boss=stage>3;
    if(!boss){
      const n=Math.min(4,stage+1);
      for(let i=0;i<n;i++)out.push({name:pick(ROSTER.filter(d=>d.cost===1)).name,star:1,x:1+((i*2+1)%7),y:1+(i%2),items:[],m:.55+stage*.1});
    }else{
      const k=Math.floor(stage/5);
      out.push({name:pick(ROSTER.filter(d=>d.cost===5)).name,star:3,x:3,y:1,items:[],m:1+k*.35});
      for(let i=0;i<Math.min(5,1+k);i++)out.push({name:pick(ROSTER.filter(d=>d.cost===3)).name,star:2,x:[1,5,2,4,0][i],y:2,items:[],m:.8+k*.2});
    }
    return out;
  }
  const lvl=Math.min(9,2+Math.floor(stage/2.3));
  return botTeam(lvl,stage,1);
}
function botTeam(lvl,stage,pow){
  const out=[];const odds=ODDS[lvl];const used=new Set();
  for(let i=0;i<lvl;i++){
    let r=rnd(),c=1;for(let k=0;k<5;k++){r-=odds[k];if(r<=0){c=k+1;break}}
    let d,t=0;do{d=pick(ROSTER.filter(x=>x.cost===c))}while(used.has(d.name)&&t++<10);used.add(d.name);
    let star=1;
    const p2=Math.max(0,(stage-7)/22)*(c<=3?1:.35),p3=Math.max(0,(stage-18)/40)*(c<=2?1:.2);
    if(rnd()<p3)star=3;else if(rnd()<p2+.0)star=2;
    out.push({name:d.name,star,items:[],m:pow*(1+Math.max(0,stage-12)*.015)});
  }
  // place: melee front row (y=2), ranged back (y 0/1)
  const rows=[[],[],[]];
  out.sort((a,b)=>BYNAME[a.name].range-BYNAME[b.name].range);
  const used2=new Set();
  const free=(y,x)=>!used2.has(x+','+y);
  for(const u of out){
    const ranged=BYNAME[u.name].range>1;
    const ys=ranged?[0,1,2]:[2,1,0];let placed=false;
    for(const y of ys){const xs=[3,4,2,5,1,6,0,7];for(const x of xs)if(free(y,x)){u.x=x;u.y=y;used2.add(x+','+y);placed=true;break}if(placed)break}
  }
  // items for later stages
  const nIt=Math.floor(stage/6);
  for(let i=0;i<nIt;i++)pick(out).items.push(pick(ITEMS).id);
  return out;
}
function occ(){const g=[...Array(BH)].map(()=>Array(BW).fill(null));for(const u of B.units)if(u.alive)g[u.y][u.x]=u;return g}
function nearestEnemy(u,list){let best=null,bd=1e9;for(const e of list){if(!e.alive||e.side===u.side)continue;const d=cheb(u,e)*10+(Math.abs(u.x-e.x)+Math.abs(u.y-e.y));if(d<bd){bd=d;best=e}}return best}
function stepToward(u,t,g){
  // BFS to a cell within range of target
  const R=u.def.range;const q=[[u.x,u.y]];const prev={};prev[u.x+','+u.y]=null;let goal=null;
  while(q.length){
    const [cx,cy]=q.shift();
    if(Math.max(Math.abs(cx-t.x),Math.abs(cy-t.y))<=R){goal=[cx,cy];break}
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;
      if(nx<0||ny<0||nx>=BW||ny>=BH||g[ny][nx]||prev[nx+','+ny]!==undefined)continue;
      prev[nx+','+ny]=[cx,cy];q.push([nx,ny]);
    }
  }
  if(!goal||(goal[0]===u.x&&goal[1]===u.y))return false;
  let c=goal,p=prev[c[0]+','+c[1]];while(p&&!(p[0]===u.x&&p[1]===u.y)){c=p;p=prev[c[0]+','+c[1]]}
  g[u.y][u.x]=null;u.x=c[0];u.y=c[1];g[u.y][u.x]=u;return true;
}
function dealDamage(src,tgt,raw,ability){
  if(!tgt.alive)return;
  if(!ability&&tgt.dodge&&rnd()<tgt.dodge){H.float(tgt.x,tgt.y,'miss','#c9b8ff',11);return}
  let dmg=raw*30/(30+tgt.df),crit=false;
  if(!ability&&rnd()<src.crit){dmg*=1.5+src.critdmg;crit=true}
  dmg=Math.max(1,dmg);
  if(tgt.shield>0){const ab=Math.min(tgt.shield,dmg);tgt.shield-=ab;dmg-=ab;if(dmg<=0){H.float(tgt.x,tgt.y,'blocked','#b8c8ff',11);return}}
  tgt.hp-=dmg;tgt.mana=Math.min(tgt.def.maxMana,tgt.mana+4);tgt.hitT=.14;tgt.kx=Math.sign(tgt.x-src.x)*.18;tgt.ky=Math.sign(tgt.y-src.y)*.18;
  H.burst(tgt.x,tgt.y,crit?'#ffd84a':(src.side==='me'?'#ffffff':'#ff9f9f'),crit?9:4,crit?1.6:1);
  if(crit)H.shake(5);else if(ability)H.shake(2);
  if(tgt.reflect&&!ability&&cheb(src,tgt)<=1&&src.alive){src.hp-=dmg*tgt.reflect;if(src.hp<=0){src.alive=false;src.hp=0;H.fx({k:'puff',x:src.x,y:src.y,age:0,life:.5})}}
  H.float(tgt.x,tgt.y,Math.round(dmg),src.side==='me'?(crit?'#ffd84a':'#fff'):'#ff8f8f',crit?18:13);
  if(tgt.hp<=0){tgt.alive=false;tgt.hp=0;H.fx({k:'puff',x:tgt.x,y:tgt.y,age:0,life:.5});H.burst(tgt.x,tgt.y,TYPES[tgt.def.types[0]].c,14,1.8);H.shake(3)}
}
function attack(u,t){
  u.cd=1/u.aspd;u.lunge=.18;u.lx=Math.sign(t.x-u.x);u.ly=Math.sign(t.y-u.y);
  let raw=u.atk;
  if(u.def.range>1)H.fx({k:'proj',x1:u.x,y1:u.y,x2:t.x,y2:t.y,c:TYPES[u.def.types[0]].c,age:0,life:.2});
  const hp0=t.hp;dealDamage(u,t,raw,false);
  if(u.steal){const h=Math.max(0,hp0-t.hp)*u.steal;if(h>0){u.hp=Math.min(u.maxhp,u.hp+h);H.float(u.x,u.y,'+'+Math.round(h),'#7dff8a',11)}}
  if(u.splash)for(const e of B.units)if(e.alive&&e.side!==u.side&&e!==t&&cheb(e,t)<=1)dealDamage(u,e,raw*u.splash,true);
  if(u.slowHit&&t.alive)t.slowT=2.5;
  if(u.bonus&&t.alive===false||u.bonus)dealDamage(u,t,u.atk*u.bonus,true);
  if(u.poisonLv&&t.alive){t.poison=u.poisonLv;t.poisonT=4}
  if(u.chain){
    const near=B.units.filter(e=>e.alive&&e.side!==u.side&&e!==t&&cheb(e,t)<=2).slice(0,u.chain);
    for(const e of near){H.fx({k:'line',x1:t.x,y1:t.y,x2:e.x,y2:e.y,c:'#f2d83a',age:0,life:.2});dealDamage(u,e,u.atk*.4,true)}
  }
  u.mana=Math.min(u.def.maxMana,u.mana+10+u.manaBonus);
}
function cast(u){
  u.mana=0;const k=u.def.ab,ap=1+u.ap;const t=u.target;
  const foes=B.units.filter(e=>e.alive&&e.side!==u.side),frs=B.units.filter(e=>e.alive&&e.side===u.side);
  H.fx({k:'ring',x:u.x,y:u.y,c:TYPES[u.def.types[0]].c,age:0,life:.5});H.burst(u.x,u.y,TYPES[u.def.types[0]].c,16,1.4);u.castT=.35;H.shake(3);
  H.float(u.x,u.y-.6,ABIL[k][0],'#9fe3ff',12);
  switch(k){
    case 'bolt':if(t)dealDamage(u,t,u.atk*3*ap,true);break;
    case 'nova':{const c=u.def.range>1&&t?t:u;for(const e of foes)if(cheb(e,c)<=1)dealDamage(u,e,u.atk*2*ap,true);H.fx({k:'ring',x:c.x,y:c.y,c:'#fff',age:0,life:.4});H.fx({k:'ring',x:c.x,y:c.y,c:TYPES[u.def.types[0]].c,age:0,life:.65,big:1});H.shake(7);break}
    case 'heal':{let w=null;for(const a of frs)if(!w||a.hp/a.maxhp<w.hp/w.maxhp)w=a;if(w){const h=Math.round(w.maxhp*.25*ap+u.atk);w.hp=Math.min(w.maxhp,w.hp+h);H.float(w.x,w.y,'+'+h,'#7dff8a',13);H.burst(w.x,w.y,'#7dff8a',10,.8,true)}break}
    case 'buff':for(const a of frs)if(cheb(a,u)<=2){a.atk*=1+.2*ap}break;
    case 'stun':if(t){t.stun=1.5*ap;H.burst(t.x,t.y,'#ffe27a',10,1.2);dealDamage(u,t,u.atk*1.5*ap,true)}break;
    case 'drain':if(t){const d=u.atk*2.2*ap;dealDamage(u,t,d,true);const h=Math.round(d*.5);u.hp=Math.min(u.maxhp,u.hp+h);H.float(u.x,u.y,'+'+h,'#7dff8a',12)}break;
  }
}
function stepBattle(b,dt){
  B=b;if(!B)return;rnd=B.rnd;
  B.time+=dt;
  const g=occ();
  for(const u of B.units){
    // visual smoothing
    u.px+=(u.x-u.px)*Math.min(1,dt*10);u.py+=(u.y-u.py)*Math.min(1,dt*10);
    if(u.lunge>0)u.lunge-=dt;if(u.hitT>0)u.hitT-=dt;
  }
  if(!B.over){
    for(const u of B.units){
      if(!u.alive)continue;
      if(u.regen)u.hp=Math.min(u.maxhp,u.hp+u.maxhp*u.regen*dt);
      if(u.poisonT>0){u.poisonT-=dt;u.hp-=u.maxhp*.01*u.poison*dt;if(u.hp<=0){u.alive=false;u.hp=0;g[u.y][u.x]=null;H.fx({k:'puff',x:u.x,y:u.y,age:0,life:.5});continue}}
      if(u.stun>0){u.stun-=dt;continue}
      const sf=(u.slowT>0?.6:1);if(u.slowT>0)u.slowT-=dt;if(u.cd>0)u.cd-=dt*sf;if(u.mcd>0)u.mcd-=dt*sf*u.moveSpd;
      if(!u.target||!u.target.alive||u.retarget<=0)u.target=nearestEnemy(u,B.units),u.retarget=.5;u.retarget-=dt;
      const t=u.target;if(!t)continue;
      const d=cheb(u,t);
      if(d<=u.def.range){
        if(u.mana>=u.def.maxMana&&u.cd<=0.0001+0){cast(u);u.cd=.5}
        else if(u.cd<=0)attack(u,t);
      }else if(u.mcd<=0){if(stepToward(u,t,g))u.mcd=.38;else u.mcd=.2}
    }
    for(const u of B.units)if(!u.alive&&g[u.y][u.x]===u)g[u.y][u.x]=null;
    const me=B.units.filter(u=>u.alive&&u.side==='me').length,en=B.units.filter(u=>u.alive&&u.side==='en').length;
    if(!me||!en){B.over=true;B.win=me>0;B.endT=1.1}
    else if(B.time>45){B.over=true;const a=sum('me'),b=sum('en');B.win=a>b;B.endT=1.1}
  }else{
    B.endT-=dt;
  }
  rnd=Math.random;
}
function sum(side){return B.units.filter(u=>u.alive&&u.side===side).reduce((a,u)=>a+u.hp,0)}
function startBattle(a,b,seed,hooks){
  H=hooks||NOHOOK;
  const r=mulberry(seed>>>0);rnd=r;
  const synA=synergies(a.map(p=>p.name)),synB=synergies(b.map(p=>p.name));
  const units=[];
  a.forEach(p=>units.push(makeUnit(p,'me',synA,p.m||1)));
  b.forEach(p=>units.push(makeUnit(p,'en',synB,p.m||1)));
  units.forEach((u,i)=>u.uid=i+1);
  const bt={units,time:0,over:false,endT:0,win:false,draw:false,rnd:r,synA,synB};
  if(!a.length||!b.length){bt.over=true;bt.win=a.length>0;bt.draw=!a.length&&!b.length;bt.endT=.6}
  rnd=Math.random;
  return bt;
}
function runBattle(a,b,seed){
  const bt=startBattle(a,b,seed,NOHOOK);
  while(!bt.over&&bt.time<60)stepBattle(bt,0.05);
  const surv=s=>bt.units.filter(u=>u.alive&&u.side===s).length;
  return{win:bt.win,draw:bt.draw,time:bt.time,survA:surv('me'),survB:surv('en')};
}

const API={BW,BH,BENCH,PLAYER_ROW,MAX_LEVEL,ODDS,EXP,STAGE_DUR,PVE_STAGES,TYPES,ABIL,ROSTER,BYNAME,HPM,ATM,ITEMS,BOTNAMES,hash,mulberry,cheb,synergies,botTeam,genEnemy,startBattle,stepBattle,runBattle};
return API;
});
