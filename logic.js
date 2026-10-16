// Pure game logic v4 (browser + node). No DOM here.
(function(root){
const SAVE_VER=11;
const RARS=['common','uncommon','rare','epic','legendary'];
const RAR_RU={common:'Обычный',uncommon:'Необычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};
const RAR_W=[600,260,100,32,8];        // base weights for a normal drop roll
const RAR_VAL=[3,8,22,70,300];         // gold value base
const AFFIX_N=[0,1,1,2,3];
// optional chip mechanic: 3 tiers, few chips
const CHIP_T=[{r:2,p:0.30,ru:'Редкий'},{r:3,p:0.09,ru:'Эпический'},{r:4,p:0.02,ru:'Легендарный'}];
const CHIP_TH=[1,2,1];                 // thresholds once 'thresh' unlocked (epic needs >=2 hits)
const LOCS=[
 {name:'Тихий лес',mult:1,lvl:1,threat:12,req:0,stages:3},
 {name:'Туманные пещеры',mult:1.4,lvl:1.8,threat:50,req:65,stages:3},
 {name:'Гиблые топи',mult:1.9,lvl:3,threat:110,req:125,stages:4},
 {name:'Пепельная крепость',mult:2.5,lvl:5,threat:210,req:250,stages:4},
 {name:'Хрустальный шпиль',mult:3.2,lvl:8,threat:340,req:420,stages:5},
 {name:'Бездна Удачи',mult:4,lvl:12,threat:520,req:660,stages:5},
];
const GEARL=[1,1.3,1.7,2.2,2.8,3.5];
const SHARDS_FOR_PITY=40, MAX_LVL=30;
const AFFIXES=[
 {k:'dmgPct',ru:'урон',min:4,max:12,unit:'%'},{k:'hpPct',ru:'здоровье',min:4,max:12,unit:'%'},
 {k:'goldPct',ru:'золото',min:3,max:10,unit:'%'},{k:'riskRed',ru:'снижение риска',min:2,max:7,unit:'%'},
 {k:'luck',ru:'удача',min:2,max:8,unit:'%'},{k:'speed',ru:'скорость похода',min:3,max:8,unit:'%'}];
// --- synergy tags: 2/3 equipped items with the same tag give strong bonuses
const TAGS={fire:{ru:'Огонь',ic:'🔥',b2:'урон ×1.15',b3:'урон ×1.4',kind:'сила'},ice:{ru:'Лёд',ic:'❄️',b2:'HP ×1.15',b3:'HP ×1.4',kind:'сила'},
 luck:{ru:'Удача',ic:'🍀',b2:'шанс редких +15%',b3:'шанс редких +40%',kind:'польза'},shadow:{ru:'Тень',ic:'🌑',b2:'риск −15%',b3:'риск −30%, при гибели 25% добычи спасается',kind:'польза'},
 crit:{ru:'Крит',ic:'🎯',b2:'+1 осколок за этап',b3:'шанс фишек +30%',kind:'польза'}};
const TAG_K=Object.keys(TAGS);
// --- gear slots (open gradually) and Diablo-style named sets
const SLOTS=['weapon','armor','charm','helm','gloves','boots'];const SLOT_W={weapon:42,armor:42,charm:16,helm:30,gloves:30,boots:30};
const SLOT_RU={weapon:'оружие',armor:'броня',charm:'амулет',helm:'шлем',gloves:'перчатки',boots:'сапоги'};
function slotsOpen(s){const o=['weapon','armor','charm'];const c=s.cleared||[];if(s.unl&&s.unl.locs)o.push('helm');if(c.includes(1))o.push('gloves');if(c.includes(2))o.push('boots');return o;}
function eqOf(s){return SLOTS.map(k=>s[k]||null);}
function slotP(s,sl){const o=slotsOpen(s);if(!o.includes(sl))return 0;return SLOT_W[sl]/o.reduce((a,k)=>a+SLOT_W[k],0);}
const GSETS=[
 {k:'forest',ru:'Наследие Лесника',loc:1,tag:'luck',col:'#3fbf5f',b2:{k:'goldPct',v:15},b4:{k:'luck',v:15},rule:'pity',ruleRu:'легендарка из осколков стоит 25, а не 40',
  names:['Лук Лесника','Плащ Лесника','Желудь-оберег','Капюшон Лесника','Рукавицы Лесника','Мокасины Лесника']},
 {k:'guard',ru:'Доспех Стража',loc:2,tag:'ice',col:'#3fbf5f',b2:{k:'hpPct',v:20},b4:{k:'riskRed',v:10},rule:'safe1',ruleRu:'на 1-м этапе гибель невозможна',
  names:['Секира Стража','Кираса Стража','Печать Стража','Шлем Стража','Латные перчатки Стража','Поножи Стража']},
 {k:'gambler',ru:'Регалии Игрока',loc:3,tag:'crit',col:'#3fbf5f',b2:{k:'dmgPct',v:15},b4:{k:'speed',v:15},rule:'chip',ruleRu:'+1 фишка в каждом походе',
  names:['Шпага Игрока','Камзол Игрока','Игральная кость','Треуголка Игрока','Перчатки шулера','Туфли Игрока']},
 {k:'monty',ru:'Око Монти',loc:4,tag:'shadow',col:'#3fbf5f',b2:{k:'luck',v:15},b4:{k:'riskRed',v:12},rule:'honest',ruleRu:'все проводники Монти честные',
  names:['Жезл ведущего','Фрак ведущего','Монокль ведущего','Цилиндр ведущего','Белые перчатки','Лакированные туфли']}];
const GS_CH=0.3; // chance that a rare+ drop becomes a set piece; half of set drops are 'smart' (a missing piece)
function setsAt(loc){return GSETS.filter(g=>loc>=g.loc);}
function setCount(s,eq){eq=eq||eqOf(s);const c={};for(const it of eq)if(it&&it.set)c[it.set]=(c[it.set]||0)+1;return c;}
function setAff(s,k,eq){const c=setCount(s,eq);let v=0;for(const g of GSETS){const n=c[g.k]||0;if(n>=2&&g.b2.k===k)v+=g.b2.v;if(n>=4&&g.b4.k===k)v+=g.b4.v;}return v;}
function rule(s,r){const g=GSETS.find(x=>x.rule===r);return(setCount(s)[g.k]||0)>=6;}
function chipTotal(s){return s.chips+(rule(s,'chip')?1:0);}
function pityCost(s){return rule(s,'pity')?25:SHARDS_FOR_PITY;}
function ownedPieces(s,k){const o=new Set();for(const it of [...eqOf(s),...s.inv])if(it&&it.set===k)o.add(it.slot);return o;}
// chance per run to get one specific set piece, and to finish the set within N runs (independent coupons)
function missOpen(s,g){const own=ownedPieces(s,g.k);return slotsOpen(s).filter(k=>!own.has(k));}
function setPieceRun(s,loc,g,sl){if(loc<g.loc||!slotsOpen(s).includes(sl))return 0;const c=rarChances(s,loc);const n=setsAt(loc).length;const m=missOpen(s,g).length||1;return 1-Math.pow(1-(c[2]+c[3]+c[4])*GS_CH/n*(0.5/m+0.5*slotP(s,sl)),rolls(s)*LOCS[loc].stages);}
function setComplete(s,loc,g,N){const own=ownedPieces(s,g.k);let p=1;for(const sl of slotsOpen(s))if(!own.has(sl))p*=1-Math.pow(1-setPieceRun(s,loc,g,sl),N);return p;}
function maybeSet(s,it,rng=Math.random){const gs=setsAt(it.loc);if(it.r<2||!gs.length||rng()>=GS_CH)return it;const g=gs[Math.floor(rng()*gs.length)];const mo=missOpen(s,g);
 if(mo.length&&rng()<0.5){const sl=mo[Math.floor(rng()*mo.length)];if(sl!==it.slot)return makeSetItem(s,it.loc,it.r,g,sl,rng);}it.set=g.k;it.tag=g.tag;it.name=g.names[SLOTS.indexOf(it.slot)];return it;}
function makeSetItem(s,loc,r,g,sl,rng=Math.random,stage=0){const it=makeItem(s,loc,r,rng,stage,sl);it.set=g.k;it.tag=g.tag;it.name=g.names[SLOTS.indexOf(sl)];return it;}
function tagCount(s,eq){eq=eq||eqOf(s);const c={};if(!s.unl||!s.unl.synergy)return c;for(const it of eq)if(it&&it.tag)c[it.tag]=(c[it.tag]||0)+1;return c;}
function syn(s,tag,eq){return tagCount(s,eq)[tag]||0;}
function retroTag(s){const all=[...eqOf(s),...(s.inv||[])].filter(Boolean);for(const it of all)if(it.tag===undefined)it.tag=it.r>=1?TAG_K[(it.id*2654435761>>>0)%TAG_K.length]:null;}
function stashCap(s){return 6+s.stashUp*3;}
function keptCount(s){return s.inv.filter(i=>i.kept).length;}
function pieceChance(s,loc,slot,tag,N){const c=rarChances(s,loc);const pSlot=slotP(s,slot);const p=pSlot*(1-c[0])/TAG_K.length;const k=rolls(s)*LOCS[loc].stages*N;return 1-Math.pow(1-p,k);}
// --- math
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
function pmf(n,k,p){return binom(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);}
function pAtLeast(n,k,p){let s=0;for(let i=0;i<k;i++)s+=pmf(n,i,p);return Math.max(0,1-s);}
function expPaid(n,p,th){if(th<=1)return n*p;let s=0;for(let k=th;k<=n;k++)s+=k*pmf(n,k,p);return s;}
// --- unlocks
const UNLOCKS=[
 {k:'shop',need:s=>s.runs>=3},{k:'chips',need:s=>s.runs>=5},{k:'stages',need:s=>s.runs>=20},{k:'stats',need:s=>s.runs>=22},
 {k:'locs',need:s=>s.runs>=24&&s.cleared.includes(0)},{k:'pity',need:s=>s.runs>=27},{k:'sets',need:s=>s.runs>=29},{k:'monty',need:s=>s.runs>=32},{k:'enhance',need:s=>eqOf(s).some(i=>i&&i.lvl>=4)},
 {k:'synergy',need:s=>s.runs>=30},{k:'thresh',need:s=>s.runs>=37},{k:'mimic',need:s=>s.runs>=41},{k:'deck',need:s=>s.runs>=44},{k:'offline',need:s=>s.runs>=46},{k:'eval',need:s=>s.runs>=48},{k:'variants',need:s=>s.monty.plays>=8},{k:'dive',need:s=>s.runs>=52},{k:'secretary',need:s=>s.runs>=55},{k:'kelly',need:s=>s.won||s.runs>=70},{k:'rebirth',need:s=>s.won}];
function checkUnlocks(s){const out=[];for(const u of UNLOCKS){if(s.unl[u.k])continue;if(!u.need(s)){if(u.k==='enhance'||u.k==='variants'||u.k==='kelly'||u.k==='secretary')continue;break;}s.unl[u.k]=1;out.push(u.k);if(u.k==='variants')initGuides(s);}return out;}
function thr(s,t){return s.unl.thresh&&!(s.perks&&s.perks.noThresh)?CHIP_TH[t]:1;}
// --- state
function newState(){return{ver:SAVE_VER,gold:0,mats:0,energy:15,energyT:0,shards:0,lvl:1,xp:0,loc:0,
 chips:2,hpUp:0,dmgUp:0,maxEUp:0,regenUp:0,guideUp:0,lensUp:0,bagUp:0,bootsUp:0,doorsUp:0,
 alloc:[0,0,0],inv:[],weapon:null,armor:null,charm:null,helm:null,gloves:null,boots:null,nextId:1,runs:0,deaths:0,cleared:[],won:false,run:null,unl:{},
 autoSell:0,scrolls:0,lastSeen:0,playMs:0,rebirths:0,perks:{},kelly:{tokens:0,p:0.6,bets:0,profit:0,best:0},tab:'run',sound:0,ach:{},decks:{},sec:null,dive:null,diveStats:{n:0,top:0,ruin:0},coll:{},stashUp:0,secStats:{n:0,best:0},sets:{},mimic:null,bayesUp:0,stats:{rolls:[0,0,0,0,0],exp:[0,0,0,0,0],chipHit:0,chipExp:0,deaths:0,deathExp:0,enhOk:0,enhTry:0,enhExp:0},
 monty:{pending:null,since:0,plays:0,stats:{stay:[0,0],switch:[0,0]},guides:null,guess:{}}};}
function load(raw){try{const s=JSON.parse(raw);if(s&&s.ver>=4&&s.ver<=SAVE_VER){const n=Object.assign(newState(),s,{ver:SAVE_VER});n.stats=Object.assign(newState().stats,s.stats||{});retroTag(n);return n;}}catch(e){}return null;}
// --- hero
function aff(s,k,eq){eq=eq||eqOf(s);let v=setBonus(s,k)+setAff(s,k,eq);for(const it of eq){if(it)for(const a of it.affixes)if(a.k===k)v+=a.v;}return v;}
function itemPower(it){return Math.round(it.power*Math.pow(1.12,it.lvl||0));}
function synMul(n,a,b){return n>=3?b:n>=2?a:1;}
function heroDmg(s,eq){eq=eq||eqOf(s);const P=i=>eq[i]?itemPower(eq[i]):0;const w=P(0)+P(4)*0.25+P(5)*0.1;return Math.round((10+(s.lvl-1)*2+s.dmgUp*3+w)*(1+aff(s,'dmgPct',eq)/100)*synMul(syn(s,'fire',eq),1.15,1.4));}
function heroHp(s,eq){eq=eq||eqOf(s);const P=i=>eq[i]?itemPower(eq[i]):0;const a=P(1)*3+P(3)*0.8+P(5)*0.4;return Math.round((50+(s.lvl-1)*8+s.hpUp*12+a)*(1+aff(s,'hpPct',eq)/100)*synMul(syn(s,'ice',eq),1.15,1.4));}
function heroPower(s,eq){return Math.round(heroDmg(s,eq)+heroHp(s,eq)/4);}
function xpNeed(l){return Math.round(40*Math.pow(1.3,l-1));}
function addXp(s,x){if(s.lvl>=MAX_LVL)return 0;s.xp+=x;let up=0;while(s.lvl<MAX_LVL&&s.xp>=xpNeed(s.lvl)){s.xp-=xpNeed(s.lvl);s.lvl++;up++;}return up;}
function rbMul(s){return 1+0.1*(s.rebirths||0);}
function locReq(s,l){return Math.round(LOCS[l].req*rbMul(s));}
function locThreat(s,l){return Math.round(LOCS[l].threat*rbMul(s));}
function unlocked(s,l){return l===0||(s.unl.locs&&s.cleared.includes(l-1)&&heroPower(s)>=locReq(s,l));}
// --- energy & time
function maxEnergy(s){return 30+s.maxEUp*10+(s.perks.energy||0)*20;}
function regenSec(s){return 10*Math.pow(0.9,s.regenUp)*(dmod(s,'energy')?0.8:1)*Math.pow(0.95,(s.perks&&s.perks.energy)||0);}
function tickEnergy(s,now=Date.now()){if(!s.energyT){s.energyT=now;return;}const per=regenSec(s)*1000;
 if(s.energy>=maxEnergy(s)){s.energyT=now;return;}const n=Math.floor((now-s.energyT)/per);if(n>0){s.energy=Math.min(maxEnergy(s),s.energy+n);s.energyT+=n*per;}}
function runCost(s,loc){return 3+loc*4;}
function stageMs(s,loc){return Math.round((4000+loc*1500)*Math.pow(0.92,s.bootsUp)*(1-Math.min(40,aff(s,'speed'))/100));}
const STANCE=[{ru:'Осторожно',ic:'🛡',dn:1,rm:0.35,dm:0.7},{ru:'Обычно',ic:'⚖️',dn:0,rm:1,dm:1},{ru:'Рискованно',ic:'🔥',dn:-1,rm:3.6,dm:1.3}];
function stance(s){return STANCE[s.stance===undefined?1:s.stance]||STANCE[1];}
function rolls(s){return Math.max(1,2+s.bagUp+stance(s).dn);}
function stanceInfo(s,loc,k){const o=s.stance;s.stance=k;const c=rarChances(s,loc),n=rolls(s);s.stance=o;const p=c[2]+c[3]+c[4];return{n,p,any:1-Math.pow(1-p,n),leg:1-Math.pow(1-c[4],n)};}
// --- drop chances
function luckMul(s){const n=syn(s,'luck');return 1+(aff(s,'luck')+s.lensUp*5+(s.perks.luck||0)*10+(n>=3?40:n>=2?15:0))/100;}
function rarChances(s,loc,stage=0){const m=LOCS[loc].mult*(1+0.1*stage)*luckMul(s);const w=RAR_W.map((x,r)=>x*Math.pow(m,r*0.6));if(dmod(s,'leg'))w[4]*=1.5;const sm=stance(s).rm;for(let r=2;r<5;r++)w[r]*=sm;const t=w.reduce((a,b)=>a+b,0);return w.map(x=>x/t);}
function itemValue(s,loc,r,stage=0){return Math.round(RAR_VAL[r]*LOCS[loc].lvl*(1+0.15*stage)*(1+aff(s,'goldPct')/100)*(1+0.25*s.rebirths)*(dmod(s,'gold')?1.25:1));}
function chipChance(s,loc,t,stage=0){return Math.min(0.9,(syn(s,'crit')>=3?1.3:1)*(dmod(s,'chips')?1.25:1)*CHIP_T[t].p*Math.pow(LOCS[loc].mult,0.5+t*0.25)*(1+0.1*stage)*luckMul(s));}
function riskWeight(alloc){return alloc[0]*0.05+alloc[1]*0.15+alloc[2]*0.3;}
function deathChance(s,loc,alloc,stage){if(!s.unl.stages)return 0;if(stage===0&&rule(s,'safe1'))return 0;const L=LOCS[loc];const def=heroHp(s)+3*heroDmg(s);
 const d=0.22*locThreat(s,loc)*(1+0.25*stage)*(0.6+riskWeight(alloc))/def*(stage===0?0.5:1);
 return Math.max(0.005,Math.min(0.9,stance(s).dm*d*(1-Math.min(60,aff(s,'riskRed')+s.guideUp*3)/100)*(dmod(s,'safe')?0.75:1)*(syn(s,'shadow')>=3?0.7:syn(s,'shadow')>=2?0.85:1)));}
function stageEV(s,loc,alloc,stage){const c=rarChances(s,loc,stage);let v=rolls(s)*c.reduce((a,p,r)=>a+p*itemValue(s,loc,r,stage),0);
 alloc.forEach((n,t)=>{if(n)v+=expPaid(n,chipChance(s,loc,t,stage),thr(s,t))*itemValue(s,loc,CHIP_T[t].r,stage);});return v;}
// --- items
function rint(rng,a,b){return a+Math.floor(rng()*(b-a+1));}
function pickRar(c,rng){let x=rng();for(let r=0;r<5;r++){x-=c[r];if(x<0)return r;}return 4;}
function makeItem(s,loc,r,rng=Math.random,stage=0,forceSlot){const q=rng();let slot=forceSlot;if(!slot){const o=slotsOpen(s);let x=q*o.reduce((a,k)=>a+SLOT_W[k],0);slot=o[o.length-1];for(const k of o){x-=SLOT_W[k];if(x<0){slot=k;break;}}}const rar=RARS[r];
 const power=slot==='charm'?0:Math.max(1,Math.round((1+(r*2+1)*0.4)*GEARL[loc]*(0.8+rng()*0.4)));
 const names={weapon:['Кинжал','Меч','Топор','Копьё','Посох'],armor:['Куртка','Кольчуга','Панцирь','Мантия','Щит'],charm:['Амулет','Кольцо','Талисман','Брошь','Оберег'],helm:['Шапка','Шлем','Капюшон','Венец','Маска'],gloves:['Перчатки','Наручи','Рукавицы','Краги','Митенки'],boots:['Сапоги','Ботинки','Поножи','Сандалии','Башмаки']};
 const minor=slot==='helm'||slot==='gloves'||slot==='boots';let n=Math.max(0,AFFIX_N[r]+(slot==='charm'?1:0)-(minor?1:0));const pool=AFFIXES.slice();const affixes=[];
 while(n-->0&&pool.length){const a=pool.splice(Math.floor(rng()*pool.length),1)[0];affixes.push({k:a.k,v:Math.round(rint(rng,a.min,a.max)*(1+loc*0.25)*(r===4?1.5:1)*(minor?0.5:1))});}
 return{id:s.nextId++,slot,r,rarity:rar,loc,power,lvl:0,affixes,tag:r>=1?TAG_K[Math.floor(rng()*TAG_K.length)]:null,value:itemValue(s,loc,r,stage),name:names[slot][Math.floor(rng()*5)]};}
function score(it){return itemPower(it)+it.affixes.reduce((a,x)=>a+x.v*0.6,0)+(it.slot==='charm'?it.r*3:0);}
function equip(s,id){const it0=s.inv.find(x=>x.id===id);if(it0&&!slotsOpen(s).includes(it0.slot))return;const i=s.inv.findIndex(x=>x.id===id);if(i<0)return;const it=s.inv.splice(i,1)[0];it.kept=false;if(s[it.slot])s.inv.push(s[it.slot]);s[it.slot]=it;}
function toggleKeep(s,id){const it=s.inv.find(x=>x.id===id);if(!it)return false;if(!it.kept&&keptCount(s)>=stashCap(s))return'full';it.kept=!it.kept;return true;}
function setVal(s,eq){const c=setCount(s,eq);let v=0;for(const g of GSETS){const n=c[g.k]||0;v+=(n>=2?8:0)+(n>=4?12:0)+(n>=6?30:0);}return v;}
function planBest(s,keepSets){const open=slotsOpen(s);const cur=eqOf(s);const lock=new Set();
 if(keepSets){const c=setCount(s);cur.forEach((it,i)=>{if(it&&it.set&&c[it.set]>=2)lock.add(i);});}
 const val=eq=>s.unl.synergy?heroPower(s,eq)+(keepSets?setVal(s,eq):0)+eq.reduce((a,it)=>a+(it?score(it)*0.01:0),0):eq.reduce((a,it)=>a+(it?score(it):0),0);
 const cand=SLOTS.map((sl,i)=>open.includes(sl)&&!lock.has(i)?[cur[i],...s.inv.filter(x=>x.slot===sl)]:[cur[i]]);
 let eq=cur.slice(),bv=val(eq);for(let pass=0;pass<4;pass++){let ch=false;for(let i=0;i<6;i++)for(const it of cand[i]){if(it===eq[i])continue;const t=eq.slice();t[i]=it;const v=val(t);if(v>bv+1e-9){bv=v;eq=t;ch=true;}}if(!ch)break;}
 return eq;}
function applyPlan(s,eq){SLOTS.forEach((sl,i)=>{const it=eq[i];if(it&&s[sl]!==it)equip(s,it.id);});}
// returns null when applied, or {best,keep} when the best set would break an active set bonus (UI asks)
function equipBest(s,mode){const best=planBest(s,false);if(mode==='best'){applyPlan(s,best);return null;}
 const keep=planBest(s,true);if(mode==='keep'){applyPlan(s,keep);return null;}
 const lost=GSETS.filter(g=>{const a=setCount(s)[g.k]||0,b=setCount(s,best)[g.k]||0;return [2,4,6].some(t=>a>=t&&b<t);});
 if(lost.length&&best.some((x,i)=>x!==keep[i])){return{best,keep,lost,pb:heroPower(s,best),pk:heroPower(s,keep)};}
 applyPlan(s,best);return null;}
function dismantle(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0||s.inv[i].kept)return 0;const it=s.inv.splice(i,1)[0];s.gold+=it.value;s.mats+=(it.r+1)*(1+it.loc);return it.value;}
function upgradeCost(it){return{gold:Math.round(it.value*0.6*Math.pow(1.5,it.lvl)+10),mats:Math.round((it.r+1)*(1+it.loc)*2*Math.pow(1.4,it.lvl))};}
function enhP(lvl){return lvl<4?1:Math.max(0.35,1-(lvl-3)*0.1);}
function enhDown(lvl){return lvl>=6;}
// expected attempts from lvl L to reach L+1 when failure drops one level (Markov chain); with protection no drop
function expTries(L,prot=false){const p=enhP(L);if(p>=1)return 1;if(prot||!enhDown(L))return 1/p;return(1+(1-p)*expTries(L-1,prot))/p;}
function upgradeItem(s,slot,useScroll=false,rng=Math.random){const it=s[slot];if(!it||it.slot==='charm'||it.lvl>=10)return false;const c=upgradeCost(it);
 if(s.gold<c.gold||s.mats<c.mats)return false;s.gold-=c.gold;s.mats-=c.mats;const p=enhP(it.lvl);
 if(p<1){s.stats.enhTry++;s.stats.enhExp+=p;}
 if(rng()<p){if(p<1)s.stats.enhOk++;it.lvl++;return'ok';}
 if(enhDown(it.lvl)){if(useScroll&&s.scrolls>0){s.scrolls--;return'saved';}it.lvl--;return'down';}return'fail';}
// --- expedition: timed stages
function startRun(s,now=Date.now()){if(s.run)return'run';const f=runCost(s,s.loc);if(s.energy<f)return'energy';
 const a=s.unl.chips?s.alloc.slice():[0,0,0];if(a.reduce((x,y)=>x+y,0)>chipTotal(s))return'chips';
 s.energy-=f;s.run={loc:s.loc,alloc:a,stage:0,loot:[],endAt:now+stageMs(s,s.loc),waiting:false};return null;}
function continueRun(s,now=Date.now()){const r=s.run;if(!r||!r.waiting)return false;r.waiting=false;r.endAt=now+stageMs(s,r.loc);return true;}
function rollStage(s,rng=Math.random){const r=s.run;if(!r||r.waiting)return null;const L=LOCS[r.loc];
 const dc=deathChance(s,r.loc,r.alloc,r.stage);const res={stage:r.stage+1,drops:[],shards:0,died:false,dc,chips:[]};
 const c=rarChances(s,r.loc,r.stage);let gotLeg=false;
 for(let r2=0;r2<5;r2++)s.stats.exp[r2]+=c[r2]*rolls(s);
 for(let i=0;i<rolls(s);i++){const rr=pickRar(c,rng);s.stats.rolls[rr]++;res.drops.push(maybeSet(s,makeItem(s,r.loc,rr,rng,r.stage),rng));if(rr===4)gotLeg=true;}
 r.alloc.forEach((n,t)=>{if(!n)return;const p=chipChance(s,r.loc,t,r.stage);let k=0;for(let i=0;i<n;i++){if(rng()<p)k++;else if(t===2)res.shards++;}s.stats.chipHit+=k;s.stats.chipExp+=n*p;
  const paid=k>=thr(s,t);res.chips.push({t,k,n,paid});if(paid)for(let i=0;i<k;i++){res.drops.push(makeItem(s,r.loc,CHIP_T[t].r,rng,r.stage));if(t===2)gotLeg=true;}});
 if(!gotLeg)res.shards++;
 if(syn(s,'crit')>=2)res.shards++;
 if(s.perks.shards2)res.shards*=2;
 if(s.unl.pity)s.shards+=res.shards;else res.shards=0;
 s.stats.deathExp+=dc;
 if(rng()<dc&&s.perks.revive&&rng()<0.3*s.perks.revive){res.revived=true;}
 else if(rng()<dc){res.died=true;s.stats.deaths++;res.lost=r.loot.length+res.drops.length;
  if(!s.perks.keepHalf&&syn(s,'shadow')>=3){const all=r.loot.concat(res.drops);const keep=all.filter((_,i)=>i%4===0);keep.forEach(i=>i.fresh=true);s.inv.push(...keep);res.kept=keep.length;res.lost-=keep.length;}
  if(s.perks.keepHalf){const all=r.loot.concat(res.drops);const keep=all.filter((_,i)=>i%2===0);keep.forEach(i=>i.fresh=true);s.inv.push(...keep);res.kept=keep.length;res.lost-=keep.length;}s.deaths++;s.runs++;s.run=null;return res;}
 r.loot.push(...res.drops);r.stage++;addXp(s,Math.round((4+res.drops.reduce((a,b)=>a+b.r*2,0))*L.lvl*(dmod(s,'xp')?1.5:1)));
 if(!s.unl.stages||r.stage>=L.stages){if(r.stage>=L.stages){res.finished=true;if(!s.cleared.includes(r.loc))s.cleared.push(r.loc);if(r.loc===LOCS.length-1)s.won=true;}
  if(s.unl.sets&&r.stage>=L.stages)res.trophy=rollTrophy(s,r.loc,rng);
  res.bank=bank(s);if(res.finished&&s.unl.kelly)s.kelly.tokens=Math.min(10,s.kelly.tokens+1);return res;}
 r.waiting=true;return res;}
function bank(s){const r=s.run;if(!r)return null;s.inv.forEach(i=>i.fresh=false);r.loot.forEach(i=>i.fresh=true);s.inv.push(...r.loot);const g=r.loot.reduce((a,b)=>a+b.value,0);s.runs++;s.run=null;const sold=autoSellItems(s,r.loot);return{items:r.loot,gold:g,sold};}
function craftPity(s,rng=Math.random){const pc=pityCost(s);if(s.shards<pc)return null;s.shards-=pc;s.pityUsed=(s.pityUsed||0)+1;const it=makeItem(s,Math.max(0,...s.cleared),4,rng);s.inv.push(it);return it;}
// --- coupon collector trophies: 5 per location, uniform; full set = permanent bonus
const SETS=[{ru:'Лесной гербарий',bonus:'goldPct',v:10},{ru:'Пещерные кристаллы',bonus:'hpPct',v:10},{ru:'Болотные тотемы',bonus:'riskRed',v:8},
 {ru:'Пепельные печати',bonus:'dmgPct',v:12},{ru:'Осколки шпиля',bonus:'luck',v:12},{ru:'Карты Бездны',bonus:'speed',v:15}];
const SET_N=5;
function rollTrophy(s,loc,rng=Math.random){const a=s.sets[loc]||(s.sets[loc]=[]);const k=Math.floor(rng()*SET_N);
 if(a.includes(k)){const g=Math.round(20*LOCS[loc].lvl);s.gold+=g;return{loc,k,dup:true,gold:g};}a.push(k);return{loc,k,dup:false,done:a.length===SET_N};}
function expRemaining(have,n=SET_N){let e=0;for(let m=1;m<=n-have;m++)e+=n/m;return e;}
function setBonus(s,k){let v=0;SETS.forEach((st,i)=>{if(st.bonus===k&&(s.sets[i]||[]).length===SET_N)v+=st.v;});return v;}
// --- suspicious chest (Bayes): prior mimic 25%; knock: P(rattle|mimic)=0.8, P(rattle|chest)=0.3
const MIMIC={prior:0.25,pm:0.8,pc:0.3};
function maybeMimic(s,rng=Math.random,force=false){if(!s.unl.mimic||s.mimic||(!force&&rng()>(dmod(s,'mimic')?0.6:0.3)))return false;s.mimic={isM:rng()<MIMIC.prior,knocks:[],loc:Math.max(0,...s.cleared)};return true;}
function posterior(knocks){let m=MIMIC.prior,c=1-MIMIC.prior;for(const r of knocks){m*=r?MIMIC.pm:1-MIMIC.pm;c*=r?MIMIC.pc:1-MIMIC.pc;}return m/(m+c);}
function knock(s,rng=Math.random){const m=s.mimic;if(!m||m.knocks.length>=3||s.energy<1)return null;s.energy--;const r=rng()<(m.isM?MIMIC.pm:MIMIC.pc);m.knocks.push(r);return r;}
function resolveMimic(s,open,rng=Math.random){const m=s.mimic;if(!m)return null;s.mimic=null;const post=posterior(m.knocks);
 if(!open)return{open,isM:m.isM,post};
 if(m.isM){const lost=Math.min(s.energy,10);s.energy-=lost;const g=Math.round(s.gold*0.1);s.gold-=g;return{open,isM:true,post,lost,g};}
 const it=makeItem(s,m.loc,Math.min(4,3+(rng()<0.25?1:0)),rng);s.inv.push(it);return{open,isM:false,post,item:it};}
function autoSellItems(s,items){if(!s.autoSell)return 0;let g=0;for(const it of items){if(it.r<s.autoSell&&!it.set&&!(s.unl.synergy&&it.tag&&it.r>=2)&&(!s[it.slot]||score(it)<=score(s[it.slot]))){g+=dismantle(s,it.id);}}return g;}
// --- daily luck modifier (same for everyone on a given local date)
const DAILY=[{k:'leg',ru:'День удачи: легендарки ×1.5'},{k:'energy',ru:'Бодрый день: энергия на 25% быстрее'},{k:'safe',ru:'Тихий день: риск гибели −25%'},
 {k:'gold',ru:'Ярмарка: золото +25%'},{k:'chips',ru:'Азартный день: шанс фишек +25%'},{k:'mimic',ru:'День мимиков: подозрительные сундуки чаще'},{k:'xp',ru:'День учёбы: опыт ×1.5'}];
function dayKey(d=new Date()){return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function daily(s,d){if(!s.unl.stats)return null;let h=dayKey(d);h=(h^61)^(h>>>16);h=h+(h<<3);h^=h>>>4;h=Math.imul(h,0x27d4eb2d);h^=h>>>15;return DAILY[Math.abs(h)%DAILY.length];}
function dmod(s,k){const d=daily(s);return!!d&&d.k===k;}
function luckVerdict(a,e){if(e<3)return{lo:0,hi:0,v:'мало данных'};const sd=Math.sqrt(e);const lo=Math.max(0,e-1.96*sd),hi=e+1.96*sd;
 return{lo,hi,v:a>hi?'необычно везёт':a<lo?'необычно не везёт':'в пределах случайности'};}
const ACH=[{k:'first',ru:'Первый поход',need:s=>s.runs>=1},{k:'leg1',ru:'Легенда! Первая легендарка',need:s=>s.stats.rolls[4]>=1},
 {k:'runs50',ru:'Бывалый: 50 походов',need:s=>s.runs>=50},{k:'loc3',ru:'Пепел и сталь: открыта крепость',need:s=>s.cleared.includes(2)},
 {k:'win',ru:'Покоритель Бездны',need:s=>s.won},{k:'rb1',ru:'Новая жизнь: перерождение',need:s=>s.rebirths>=1},{k:'rb3',ru:'Колесо судьбы: 3 перерождения',need:s=>s.rebirths>=3},
 {k:'switch10',ru:'Монти одобряет: 10 побед сменой',need:s=>s.monty.stats.switch[0]>=10},{k:'guides',ru:'Детектив: разгаданы все проводники',need:s=>Object.values(s.monty.guess).filter(x=>x==='ok').length>=3},
 {k:'set1',ru:'Коллекционер: собрана коллекция',need:s=>Object.values(s.sets).some(a=>a.length>=5)},{k:'plus8',ru:'Кузнец: снаряжение +8',need:s=>[s.weapon,s.armor].some(i=>i&&i.lvl>=8)},
 {k:'kelly',ru:'Инвестор: 10 ставок Келли в плюс',need:s=>s.kelly.bets>=10&&s.kelly.profit>0},{k:'lucky',ru:'Баловень судьбы: легендарок больше ожидаемого (≥5)',need:s=>s.stats.rolls[4]>=5&&s.stats.rolls[4]>s.stats.exp[4]},
 {k:'pity',ru:'Терпение: легендарка из осколков',need:s=>(s.pityUsed||0)>=1},{k:'sec',ru:'Принцесса выбрала: лучший из 8 у странника',need:s=>s.secStats.best>=1},{k:'dive',ru:'Дно достигнуто: глубокое погружение',need:s=>s.diveStats.top>=1},{k:'deck',ru:'Колода пуста: перетасовка',need:s=>(s.deckDone||0)>=1}];
function checkAch(s){const out=[];for(const a of ACH)if(!s.ach[a.k]&&a.need(s)){s.ach[a.k]=Date.now();out.push(a);}return out;}
// --- event deck (hypergeometric): 12 cards per location, drawn without replacement, one per banked run
const DECK=[{k:'leg',n:1,ru:'Сокровище (легендарка)'},{k:'epic',n:2,ru:'Эпический тайник'},{k:'gold',n:4,ru:'Кошель золота'},{k:'shard',n:2,ru:'Осколки ×5'},{k:'trap',n:3,ru:'Ловушка (−5⚡)'}];
const DECK_N=DECK.reduce((a,c)=>a+c.n,0);
function deckOf(s,loc){return s.decks[loc]||(s.decks[loc]=Object.fromEntries(DECK.map(c=>[c.k,c.n])));}
function deckLeft(d){return Object.values(d).reduce((a,b)=>a+b,0);}
function C(n,k){if(k<0||k>n)return 0;return binom(n,k);}
function pWithin(d,k,draws){const N=deckLeft(d),K=d[k];draws=Math.min(draws,N);return N?1-C(N-K,draws)/C(N,draws):0;}
function drawCard(s,loc,rng=Math.random){if(!s.unl.deck)return null;const d=deckOf(s,loc);let x=Math.floor(rng()*deckLeft(d));let k;
 for(const c of DECK){if(x<d[c.k]){k=c.k;break;}x-=d[c.k];}d[k]--;const out={k,ru:DECK.find(c=>c.k===k).ru};
 if(k==='leg'){out.item=makeItem(s,loc,4,rng);s.inv.push(out.item);}else if(k==='epic'){out.item=makeItem(s,loc,3,rng);s.inv.push(out.item);}
 else if(k==='gold'){out.gold=Math.round(30*LOCS[loc].lvl);s.gold+=out.gold;}else if(k==='shard'){s.shards+=5;}else{s.energy=Math.max(0,s.energy-5);}
 if(!deckLeft(d)){delete s.decks[loc];out.reshuffle=true;s.deckDone=(s.deckDone||0)+1;}if(out.item)out.item.fresh=true;return out;}
// --- secretary problem: wandering merchant shows 8 items one by one, pick one, no going back
const SEC_N=8;
function maybeSecretary(s,rng=Math.random,force=false){if(!s.unl.secretary||s.sec||(!force&&rng()>0.2))return false;const loc=Math.max(0,...s.cleared);
 const items=[];for(let i=0;i<SEC_N;i++){const r=Math.min(4,Math.floor(rng()*rng()*5.5));items.push(makeItem(s,loc,r,rng));}
 s.sec={items,i:0,best:Math.max(...items.map(score))};return true;}
function secCur(s){return s.sec&&s.sec.items[s.sec.i];}
function secSeenBest(s){const m=s.sec;return m.i?Math.max(...m.items.slice(0,m.i).map(score)):-1;}
function secTake(s){const m=s.sec;if(!m)return null;const it=m.items[m.i];s.inv.push(it);it.fresh=true;const rank=1+m.items.filter(x=>score(x)>score(it)).length;
 s.secStats.n++;if(rank===1)s.secStats.best++;s.sec=null;return{it,rank,all:m.items};}
function secPass(s){const m=s.sec;if(!m)return null;if(m.i>=SEC_N-1)return secTake(s);m.i++;return 'next';}
// --- deep dive: random walk, gambler's ruin. Start at A, step +1 w.p. p else -1; reach N = treasure, 0 = ruin; cash out anytime
const DIVE={A:3,N:10,cost:10,ITEMS:{5:1,7:2,10:3},ROPE:0.6,TORCH:0.25};
// step policies: success prob shift, depth gained on success, extra energy
const DSTEP={safe:{ru:'Осторожно',ic:'🟢',dp:0.1,m:1,e:1},norm:{ru:'Обычно',ic:'⬇️',dp:0,m:1,e:0},bold:{ru:'Смело',ic:'🔥',dp:-0.08,m:2,e:0}};
function diveP(s){return Math.min(0.6,0.47+s.lensUp*0.005+(s.perks.luck||0)*0.01+0.01*((syn(s,'shadow')||0)+(syn(s,'luck')||0)));}
function ruinP(p,a,N){if(a<=0)return 1;if(a>=N)return 0;const q=1-p;if(Math.abs(p-q)<1e-9)return 1-a/N;const r=q/p;return(Math.pow(r,a)-Math.pow(r,N))/(1-Math.pow(r,N));}
// exact chance to reach the bottom from x with a fixed policy (and optional rope = one setback ignored)
function divePolicyP(p,x,N,pol,rope){const P=Math.max(0.05,Math.min(0.95,p+DSTEP[pol].dp)),m=DSTEP[pol].m;let f=new Array(N+1).fill(0);f[N]=1;
 for(let it=0;it<3000;it++){const g=f.slice();for(let y=1;y<N;y++)g[y]=P*f[Math.min(N,y+m)]+(1-P)*f[y-1];f=g;}
 if(!rope)return f[Math.min(N,x)];let h=f.slice();for(let it=0;it<3000;it++){const g=h.slice();for(let y=1;y<N;y++)g[y]=P*h[Math.min(N,y+m)]+(1-P)*f[y];h=g;}return h[Math.min(N,x)];}
function diveMul(s){return LOCS[Math.max(0,...s.cleared)].lvl*(1+0.25*s.rebirths);}
function diveCash(s,x){const k=Math.max(0,x-DIVE.A);return Math.round(4*k*k*diveMul(s));}
function diveItemsVal(s,m){const loc=Math.max(0,...s.cleared);let v=0;for(const d in DIVE.ITEMS)if(m>=+d)v+=itemValue(s,loc,DIVE.ITEMS[d]);return v;}
function ropeCost(s){return Math.round(40*diveMul(s));}function torchCost(s){return Math.round(15*diveMul(s));}
function diveStart(s){if(!s.unl.dive||s.dive||s.energy<DIVE.cost)return false;s.energy-=DIVE.cost;s.dive={x:DIVE.A,max:DIVE.A,path:[DIVE.A],p:diveP(s),pot:{gold:0,items:[]},rope:false,torch:0,t:null,nextT:null};return true;}
function diveTerrain(rng){const r=rng();return r<1/3?-0.1:r<2/3?0:0.1;}
function diveBuy(s,what,rng=Math.random){const d=s.dive;if(!d)return false;if(what==='rope'){if(d.rope||s.gold<ropeCost(s))return false;s.gold-=ropeCost(s);d.rope=true;return true;}
 if(what==='torch'){if(d.nextT!==null||s.gold<torchCost(s))return false;s.gold-=torchCost(s);d.nextT=diveTerrain(rng);return true;}return false;}
function diveStepP(s,pol){const d=s.dive;return Math.max(0.05,Math.min(0.95,d.p+DSTEP[pol].dp+(d.nextT||0)));}
function diveStep(s,rng=Math.random,pol='norm'){const d=s.dive;if(!d)return null;const P=DSTEP[pol];if(P.e&&s.energy<P.e)return null;s.energy-=P.e;
 const t=d.nextT!==null?d.nextT:diveTerrain(rng);d.nextT=null;const ok=rng()<Math.max(0.05,Math.min(0.95,d.p+P.dp+t));const got=[];let saved=false;
 if(ok){d.x=Math.min(DIVE.N,d.x+P.m);}else if(d.rope){d.rope=false;saved=true;}else d.x--;d.path.push(d.x);
 if(d.x>d.max){const loc=Math.max(0,...s.cleared);d.pot.gold+=diveCash(s,d.x)-diveCash(s,d.max);for(let y=d.max+1;y<=d.x;y++)if(DIVE.ITEMS[y]!==undefined){const it=makeItem(s,loc,DIVE.ITEMS[y],rng);d.pot.items.push(it);got.push(it);}d.max=d.x;}
 if(d.x<=0){s.dive=null;s.diveStats.n++;s.diveStats.ruin++;return{end:'ruin',lost:d.pot};}
 if(d.x>=DIVE.N){s.diveStats.top++;const r=diveCashOut(s);r.end='top';return r;}
 return{end:null,ok,saved,got};}
function diveCashOut(s){const d=s.dive;if(!d)return null;s.gold+=d.pot.gold;d.pot.items.forEach(i=>i.fresh=true);s.inv.push(...d.pot.items);s.dive=null;s.diveStats.n++;return{end:'cash',gold:d.pot.gold,items:d.pot.items,x:d.x};}
// --- offline progress: safe 1-stage runs on best cleared location + Poisson events
const OFF_CAP=30, LAMBDA={merchant:0.8,boss:0.4}; // events per hour
function poissonP(k,l){let f=1;for(let i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f;}
function poissonDraw(l,rng){let k=0,p=Math.exp(-l),c=p,u=rng();while(u>c&&k<50){k++;p*=l/k;c+=p;}return k;}
function offline(s,now=Date.now(),rng=Math.random){const away=s.lastSeen?now-s.lastSeen:0;s.lastSeen=now;
 if(!s.unl.offline||away<60000||s.run)return null;const hours=Math.min(away,12*3600e3)/3600e3;
 const loc=Math.max(0,...s.cleared);const cost=runCost(s,loc);const k=Math.min(OFF_CAP,Math.floor(s.energy/cost),Math.floor(away/(stageMs(s,loc)+5000)));
 const items=[];s.energy-=k*cost;const c=rarChances(s,loc);
 for(let i=0;i<k;i++)for(let j=0;j<rolls(s);j++){const r=pickRar(c,rng);s.stats.rolls[r]++;items.push(makeItem(s,loc,r,rng));}
 for(let r=0;r<5;r++)s.stats.exp[r]+=c[r]*rolls(s)*k;
 items.forEach(i=>i.fresh=true);s.inv.push(...items);s.runs+=k;const sold=autoSellItems(s,items);
 const ev={hours,runs:k,items:items.filter(i=>s.inv.includes(i)),sold,events:[]};
 for(const [type,l] of Object.entries(LAMBDA)){const lt=l*hours;const n=poissonDraw(lt,rng);ev.events.push({type,lt,n,p:poissonP(n,lt)});
  for(let i=0;i<n;i++){if(type==='merchant'){const g=Math.round(40*LOCS[loc].lvl*(1+0.25*s.rebirths));s.gold+=g;ev.merchantGold=(ev.merchantGold||0)+g;}
   else{const pw=heroPower(s)/(locReq(s,loc)+40);const win=rng()<Math.min(0.9,pw*0.6);if(win){const it=makeItem(s,loc,3+(rng()<0.3?1:0),rng);s.inv.push(it);(ev.boss=ev.boss||[]).push(it);}else ev.bossLost=(ev.bossLost||0)+1;}}}
 return ev;}
// --- Kelly coin: known edge, bet fraction of gold; tokens earned per full run (max 10)
function kellyNew(s,rng=Math.random){s.kelly.p=Math.round((0.53+rng()*0.17)*100)/100;}
function kellyOpt(p){return Math.max(0,2*p-1);}
function kellyCap(s){return Math.round(150*LOCS[Math.max(0,...s.cleared)].lvl*(1+0.25*s.rebirths));}
function kellyBet(s,f,rng=Math.random){const K=s.kelly;if(K.tokens<1||f<=0||f>1)return null;K.tokens--;const stake=Math.min(kellyCap(s),Math.floor(s.gold*f));const win=rng()<K.p;
 s.gold+=win?stake:-stake;K.bets++;K.profit+=win?stake:-stake;const r={win,stake,p:K.p,f,opt:kellyOpt(K.p)};kellyNew(s,rng);return r;}
// expected log-growth per bet for fraction f
function kellyGrowth(p,f){return f>=1?-Infinity:p*Math.log(1+f)+(1-p)*Math.log(1-f);}
// --- rebirth (prestige)
const PERKS=[{k:'luck',ru:'Удачливый: +10% к шансам редких'},{k:'revive',ru:'Второй шанс: 30% выжить при гибели'},{k:'energy',ru:'Выносливый: +20 макс. энергии, энергия на 5% быстрее'},{k:'chips',ru:'Игрок: +1 фишка удачи на старте'},
 {k:'keepHalf',ru:'Страховка: при гибели сохраняется половина добычи',t2:1},{k:'noThresh',ru:'Без порогов: эпический ярус платит с 1 попадания',t2:1},
 {k:'shards2',ru:'Терпеливый: осколки ×2',t2:1},{k:'seer',ru:'Ясновидец: иногда видно один пустой сундук у нечестных проводников',t2:1}];
function perksAvail(s){return PERKS.filter(p=>!p.t2||s.rebirths>=2);}
function rebirth(s,perk){if(!s.won||!perksAvail(s).find(p=>p.k===perk))return false;const keep={unl:s.unl,stats:s.stats,sets:s.sets,monty:s.monty,perks:s.perks,rebirths:s.rebirths+1,
 kelly:s.kelly,playMs:s.playMs,ach:s.ach,secStats:s.secStats,diveStats:s.diveStats,coll:s.coll,deckDone:s.deckDone,pityUsed:s.pityUsed,autoSell:s.autoSell,sound:s.sound,tab:'run',bayesUp:s.bayesUp,nextId:s.nextId,deaths:s.deaths};
 keep.perks[perk]=(keep.perks[perk]||0)+1;const n=Object.assign(newState(),keep);n.runs=0;n.chips=2+(keep.perks.chips||0);n.lastSeen=Date.now();n.energyT=Date.now();
 n.monty.pending=null;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,n);return true;}
// --- Monty Hall chests
const GUIDE_NAMES=['Аркадий','Борис','Вера'];
function initGuides(s){if(s.monty.guides)return;const t=['honest','unreliable','random'];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]];}
 s.monty.guides=t.map((type,i)=>({name:GUIDE_NAMES[i],type,stats:{stay:[0,0],switch:[0,0]}}));}
function doors(s){return 3+s.doorsUp;}
function maybeMonty(s,rng=Math.random,force=false){if(!s.unl.monty||s.monty.pending)return false;s.monty.since++;
 if(!force){if(s.monty.since<2&&s.monty.plays>0)return false;if(rng()>0.5&&s.monty.plays>0)return false;}s.monty.since=0;
 const n=doors(s);const g=s.monty.guides?Math.floor(rng()*3):-1;
 s.monty.pending={n,prize:Math.floor(rng()*n),pick:null,opened:[],guide:g,done:false,loc:Math.max(0,...s.cleared)};return true;}
function guideType(s,p){return p.guide<0||rule(s,'honest')?'honest':s.monty.guides[p.guide].type;}
function montyPick(s,i,rng=Math.random){const p=s.monty.pending;if(!p||p.pick!==null)return;p.pick=i;const n=p.n;
 const others=[...Array(n).keys()].filter(x=>x!==i);const type=guideType(s,p);
 const shuffle=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(rng()*(k+1));[a[k],a[j]]=[a[j],a[k]];}return a;};
 let open;if(type==='honest'||(type==='unreliable'&&rng()<0.6))open=shuffle(others.filter(x=>x!==p.prize)).slice(0,n-2);
 else open=shuffle(others.slice()).slice(0,n-2);
 p.opened=open;p.revealed=open.includes(p.prize);
 if(s.perks.seer&&type!=='honest'&&!p.revealed&&rng()<0.5){const e=montyClosed(p).filter(x=>x!==p.prize);if(e.length)p.hint=e[0];}}
function montyClosed(p){return[...Array(p.n).keys()].filter(x=>x!==p.pick&&!p.opened.includes(x));}
function montyFinal(s,choice,rng=Math.random){const p=s.monty.pending;if(!p||p.pick===null||p.done)return null;
 const sw=choice!==p.pick;const win=choice===p.prize;p.done=true;p.final=choice;p.win=win;
 if(!p.revealed){const k=sw?'switch':'stay';s.monty.stats[k][1]++;if(win)s.monty.stats[k][0]++;
  if(p.guide>=0){const gs=s.monty.guides[p.guide].stats[k];gs[1]++;if(win)gs[0]++;}}
 s.monty.plays++;let reward;
 if(win){const r=Math.min(4,2+Math.floor(rng()*(p.n-1)));reward=makeItem(s,p.loc,r,rng);s.inv.push(reward);}
 else{reward=Math.round(15*LOCS[p.loc].lvl);s.gold+=reward;}
 p.reward=reward;return p;}
function montyClear(s){s.monty.pending=null;}
function guessGuide(s,gi,type){const g=s.monty.guides&&s.monty.guides[gi];if(!g||s.monty.guess[gi]==='ok')return null;
 if(g.stats.stay[1]+g.stats.switch[1]<5)return'few';
 if(g.type===type){s.monty.guess[gi]='ok';s.shards+=15;return'ok';}g.stats={stay:[0,0],switch:[0,0]};return'no';}
// --- shop
const SHOP={hp:s=>Math.round(25*Math.pow(1.38,s.hpUp)),dmg:s=>Math.round(30*Math.pow(1.38,s.dmgUp)),
 maxE:s=>Math.round(50*Math.pow(1.6,s.maxEUp)),regen:s=>s.regenUp>=15?Infinity:Math.round(70*Math.pow(1.7,s.regenUp)),
 bag:s=>s.bagUp>=4?Infinity:Math.round(150*Math.pow(3,s.bagUp)),boots:s=>s.bootsUp>=10?Infinity:Math.round(60*Math.pow(1.8,s.bootsUp)),
 chips:s=>s.chips>=6?Infinity:Math.round(120*Math.pow(2.6,s.chips-2)),
 guide:s=>s.guideUp>=12?Infinity:Math.round(120*Math.pow(1.75,s.guideUp)),lens:s=>s.lensUp>=12?Infinity:Math.round(150*Math.pow(1.75,s.lensUp)),
 stash:s=>s.stashUp>=8?Infinity:Math.round(200*Math.pow(1.8,s.stashUp)),doors:s=>s.doorsUp>=4?Infinity:Math.round(300*Math.pow(3,s.doorsUp)),scroll:s=>Math.round(150+60*s.cleared.length),bayes:s=>s.bayesUp?Infinity:400};
const SHOP_FIELD={hp:'hpUp',dmg:'dmgUp',maxE:'maxEUp',regen:'regenUp',bag:'bagUp',boots:'bootsUp',chips:'chips',guide:'guideUp',lens:'lensUp',doors:'doorsUp',stash:'stashUp',scroll:'scrolls',bayes:'bayesUp'};
const SHOP_NEED={stash:'synergy',chips:'chips',guide:'stages',lens:'locs',doors:'variants',scroll:'enhance',bayes:'mimic'};
function shopAvail(s,k){return!!s.unl.shop&&(!SHOP_NEED[k]||!!s.unl[SHOP_NEED[k]]);}
function buy(s,k){if(!shopAvail(s,k))return false;const c=SHOP[k](s);if(s.gold<c)return false;s.gold-=c;s[SHOP_FIELD[k]]++;return true;}
// --- Monte Carlo evaluator (policy: return when next stage death chance > stopAt)
function simRun(s,loc,alloc,stopAt,rng){let bankd=0;const L=LOCS[loc];const c=rarChances(s,loc,0);
 for(let st=0;st<L.stages;st++){const dc=deathChance(s,loc,alloc,st);if(st>0&&dc>stopAt)break;const cs=st?rarChances(s,loc,st):c;
  let g=0;for(let i=0;i<rolls(s);i++){const r=pickRar(cs,rng);g+=itemValue(s,loc,r,st);}
  alloc.forEach((n,t)=>{if(!n)return;const p=chipChance(s,loc,t,st);let k=0;for(let i=0;i<n;i++)if(rng()<p)k++;if(k>=thr(s,t))g+=k*itemValue(s,loc,CHIP_T[t].r,st);});
  if(rng()<dc)return{g:0,died:true};bankd+=g;}
 return{g:bankd,died:false};}
function monteCarlo(s,loc,alloc,stopAt=1,N=2000,rng=Math.random){const arr=new Float64Array(N);let d=0,sum=0;
 for(let i=0;i<N;i++){const r=simRun(s,loc,alloc,stopAt,rng);arr[i]=r.g;sum+=r.g;if(r.died)d++;}
 arr.sort();const q=x=>arr[Math.min(N-1,Math.floor(x*N))];const max=arr[N-1]||1,bins=new Array(12).fill(0);
 for(const v of arr)bins[Math.min(11,Math.floor(v/max*12))]++;return{mean:sum/N,p10:q(0.1),p50:q(0.5),p90:q(0.9),death:d/N,bins,max};}
function strategies(n){return[{name:'Без фишек',a:[0,0,0]},{name:'Все на редкий',a:[n,0,0]},{name:'Пара на эпик',a:[n-Math.min(n,2),Math.min(n,2),0]},{name:'Охота на легендарку',a:[0,0,n]}];}
const api={SAVE_VER,STANCE,stance,stanceInfo,SLOTS,SLOT_RU,slotsOpen,eqOf,slotP,GSETS,GS_CH,setsAt,setCount,setAff,rule,chipTotal,pityCost,ownedPieces,setPieceRun,setComplete,makeSetItem,maybeSet,planBest,applyPlan,RARS,RAR_RU,RAR_W,RAR_VAL,CHIP_T,CHIP_TH,AFFIXES,LOCS,SHARDS_FOR_PITY,MAX_LVL,pmf,pAtLeast,expPaid,UNLOCKS,checkUnlocks,thr,
 newState,load,aff,itemPower,heroDmg,heroHp,heroPower,xpNeed,addXp,unlocked,maxEnergy,regenSec,tickEnergy,runCost,stageMs,rolls,luckMul,rarChances,itemValue,
 chipChance,riskWeight,deathChance,stageEV,makeItem,score,equip,equipBest,dismantle,upgradeCost,upgradeItem,startRun,continueRun,rollStage,bank,craftPity,
 initGuides,doors,maybeMonty,guideType,montyPick,montyClosed,montyFinal,montyClear,guessGuide,SHOP,SHOP_FIELD,shopAvail,buy,monteCarlo,strategies,retroTag,kellyCap,TAGS,TAG_K,tagCount,syn,stashCap,keptCount,pieceChance,toggleKeep,DIVE,DSTEP,divePolicyP,diveItemsVal,ropeCost,torchCost,diveBuy,diveStepP,diveMul,diveP,ruinP,diveCash,diveStart,diveStep,diveCashOut,DECK,DECK_N,deckOf,deckLeft,pWithin,drawCard,SEC_N,maybeSecretary,secCur,secSeenBest,secTake,secPass,DAILY,dayKey,daily,dmod,luckVerdict,ACH,checkAch,perksAvail,locReq,locThreat,OFF_CAP,LAMBDA,poissonP,poissonDraw,offline,kellyNew,kellyOpt,kellyBet,kellyGrowth,PERKS,rebirth,SETS,SET_N,rollTrophy,expRemaining,setBonus,MIMIC,maybeMimic,posterior,knock,resolveMimic,autoSellItems,enhP,enhDown,expTries};
if(typeof module!=='undefined')module.exports=api;else root.G=api;
})(this);
