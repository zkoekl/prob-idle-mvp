// Pure game logic v4 (browser + node). No DOM here.
(function(root){
const SAVE_VER=4;
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
 {name:'Туманные пещеры',mult:1.4,lvl:1.8,threat:50,req:55,stages:3},
 {name:'Гиблые топи',mult:1.9,lvl:3,threat:110,req:110,stages:4},
 {name:'Пепельная крепость',mult:2.5,lvl:5,threat:210,req:190,stages:4},
 {name:'Хрустальный шпиль',mult:3.2,lvl:8,threat:340,req:300,stages:5},
 {name:'Бездна Удачи',mult:4,lvl:12,threat:520,req:450,stages:5},
];
const GEARL=[1,1.3,1.7,2.2,2.8,3.5];
const SHARDS_FOR_PITY=40, MAX_LVL=30;
const AFFIXES=[
 {k:'dmgPct',ru:'урон',min:4,max:12,unit:'%'},{k:'hpPct',ru:'здоровье',min:4,max:12,unit:'%'},
 {k:'goldPct',ru:'золото',min:3,max:10,unit:'%'},{k:'riskRed',ru:'снижение риска',min:2,max:7,unit:'%'},
 {k:'luck',ru:'удача',min:2,max:8,unit:'%'},{k:'speed',ru:'скорость похода',min:3,max:8,unit:'%'}];
// --- math
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
function pmf(n,k,p){return binom(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);}
function pAtLeast(n,k,p){let s=0;for(let i=0;i<k;i++)s+=pmf(n,i,p);return Math.max(0,1-s);}
function expPaid(n,p,th){if(th<=1)return n*p;let s=0;for(let k=th;k<=n;k++)s+=k*pmf(n,k,p);return s;}
// --- unlocks
const UNLOCKS=[
 {k:'shop',need:s=>s.runs>=7},{k:'chips',need:s=>s.runs>=11},{k:'stages',need:s=>s.runs>=15},
 {k:'locs',need:s=>s.runs>=19&&s.cleared.includes(0)},{k:'pity',need:s=>s.runs>=23},{k:'monty',need:s=>s.runs>=27},
 {k:'thresh',need:s=>s.runs>=33},{k:'eval',need:s=>s.runs>=37},{k:'variants',need:s=>s.monty.plays>=8}];
function checkUnlocks(s){const out=[];for(const u of UNLOCKS){if(s.unl[u.k])continue;if(!u.need(s))break;s.unl[u.k]=1;out.push(u.k);if(u.k==='variants')initGuides(s);}return out;}
function thr(s,t){return s.unl.thresh?CHIP_TH[t]:1;}
// --- state
function newState(){return{ver:SAVE_VER,gold:0,mats:0,energy:30,energyT:0,shards:0,lvl:1,xp:0,loc:0,
 chips:2,hpUp:0,dmgUp:0,maxEUp:0,regenUp:0,guideUp:0,lensUp:0,bagUp:0,bootsUp:0,doorsUp:0,
 alloc:[0,0,0],inv:[],weapon:null,armor:null,charm:null,nextId:1,runs:0,deaths:0,cleared:[],won:false,run:null,unl:{},
 monty:{pending:null,since:0,plays:0,stats:{stay:[0,0],switch:[0,0]},guides:null,guess:{}}};}
function load(raw){try{const s=JSON.parse(raw);if(s&&s.ver===SAVE_VER)return Object.assign(newState(),s);}catch(e){}return null;}
// --- hero
function aff(s,k){let v=0;for(const sl of['weapon','armor','charm']){const it=s[sl];if(it)for(const a of it.affixes)if(a.k===k)v+=a.v;}return v;}
function itemPower(it){return Math.round(it.power*Math.pow(1.12,it.lvl||0));}
function heroDmg(s){const w=s.weapon?itemPower(s.weapon):0;return Math.round((10+(s.lvl-1)*2+s.dmgUp*3+w)*(1+aff(s,'dmgPct')/100));}
function heroHp(s){const a=s.armor?itemPower(s.armor)*3:0;return Math.round((50+(s.lvl-1)*8+s.hpUp*12+a)*(1+aff(s,'hpPct')/100));}
function heroPower(s){return Math.round(heroDmg(s)+heroHp(s)/4);}
function xpNeed(l){return Math.round(40*Math.pow(1.3,l-1));}
function addXp(s,x){if(s.lvl>=MAX_LVL)return 0;s.xp+=x;let up=0;while(s.lvl<MAX_LVL&&s.xp>=xpNeed(s.lvl)){s.xp-=xpNeed(s.lvl);s.lvl++;up++;}return up;}
function unlocked(s,l){return l===0||(s.unl.locs&&s.cleared.includes(l-1)&&heroPower(s)>=LOCS[l].req);}
// --- energy & time
function maxEnergy(s){return 30+s.maxEUp*10;}
function regenSec(s){return 12*Math.pow(0.9,s.regenUp);}
function tickEnergy(s,now=Date.now()){if(!s.energyT){s.energyT=now;return;}const per=regenSec(s)*1000;
 if(s.energy>=maxEnergy(s)){s.energyT=now;return;}const n=Math.floor((now-s.energyT)/per);if(n>0){s.energy=Math.min(maxEnergy(s),s.energy+n);s.energyT+=n*per;}}
function runCost(s,loc){return 5+loc*2;}
function stageMs(s,loc){return Math.round((4000+loc*1500)*Math.pow(0.92,s.bootsUp)*(1-Math.min(40,aff(s,'speed'))/100));}
function rolls(s){return 2+s.bagUp;}
// --- drop chances
function luckMul(s){return 1+(aff(s,'luck')+s.lensUp*5)/100;}
function rarChances(s,loc,stage=0){const m=LOCS[loc].mult*(1+0.1*stage)*luckMul(s);const w=RAR_W.map((x,r)=>x*Math.pow(m,r*0.8));const t=w.reduce((a,b)=>a+b,0);return w.map(x=>x/t);}
function itemValue(s,loc,r,stage=0){return Math.round(RAR_VAL[r]*LOCS[loc].lvl*(1+0.15*stage)*(1+aff(s,'goldPct')/100));}
function chipChance(s,loc,t,stage=0){return Math.min(0.9,CHIP_T[t].p*Math.pow(LOCS[loc].mult,0.5+t*0.25)*(1+0.1*stage)*luckMul(s));}
function riskWeight(alloc){return alloc[0]*0.05+alloc[1]*0.15+alloc[2]*0.3;}
function deathChance(s,loc,alloc,stage){if(!s.unl.stages)return 0;const L=LOCS[loc];const def=heroHp(s)+3*heroDmg(s);
 const d=0.22*L.threat*(1+0.25*stage)*(0.6+riskWeight(alloc))/def*(stage===0?0.5:1);
 return Math.max(0.005,Math.min(0.9,d*(1-Math.min(60,aff(s,'riskRed')+s.guideUp*3)/100)));}
function stageEV(s,loc,alloc,stage){const c=rarChances(s,loc,stage);let v=rolls(s)*c.reduce((a,p,r)=>a+p*itemValue(s,loc,r,stage),0);
 alloc.forEach((n,t)=>{if(n)v+=expPaid(n,chipChance(s,loc,t,stage),thr(s,t))*itemValue(s,loc,CHIP_T[t].r,stage);});return v;}
// --- items
function rint(rng,a,b){return a+Math.floor(rng()*(b-a+1));}
function pickRar(c,rng){let x=rng();for(let r=0;r<5;r++){x-=c[r];if(x<0)return r;}return 4;}
function makeItem(s,loc,r,rng=Math.random,stage=0){const q=rng();const slot=q<0.42?'weapon':q<0.84?'armor':'charm';const rar=RARS[r];
 const power=slot==='charm'?0:Math.max(1,Math.round((1+(r*2+1)*0.4)*GEARL[loc]*(0.8+rng()*0.4)));
 const names={weapon:['Кинжал','Меч','Топор','Копьё','Посох'],armor:['Куртка','Кольчуга','Панцирь','Мантия','Щит'],charm:['Амулет','Кольцо','Талисман','Брошь','Оберег']};
 let n=AFFIX_N[r]+(slot==='charm'?1:0);const pool=AFFIXES.slice();const affixes=[];
 while(n-->0&&pool.length){const a=pool.splice(Math.floor(rng()*pool.length),1)[0];affixes.push({k:a.k,v:Math.round(rint(rng,a.min,a.max)*(1+loc*0.25)*(r===4?1.5:1))});}
 return{id:s.nextId++,slot,r,rarity:rar,loc,power,lvl:0,affixes,value:itemValue(s,loc,r,stage),name:names[slot][Math.floor(rng()*5)]};}
function score(it){return itemPower(it)+it.affixes.reduce((a,x)=>a+x.v*0.6,0)+(it.slot==='charm'?it.r*3:0);}
function equip(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0)return;const it=s.inv.splice(i,1)[0];if(s[it.slot])s.inv.push(s[it.slot]);s[it.slot]=it;}
function equipBest(s){let ch=true;while(ch){ch=false;for(const it of s.inv.slice()){const c=s[it.slot];if(!c||score(it)>score(c)){equip(s,it.id);ch=true;}}}}
function dismantle(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0)return 0;const it=s.inv.splice(i,1)[0];s.gold+=it.value;s.mats+=(it.r+1)*(1+it.loc);return it.value;}
function upgradeCost(it){return{gold:Math.round(it.value*0.6*Math.pow(1.5,it.lvl)+10),mats:Math.round((it.r+1)*(1+it.loc)*2*Math.pow(1.4,it.lvl))};}
function upgradeItem(s,slot){const it=s[slot];if(!it||it.slot==='charm'||it.lvl>=10)return false;const c=upgradeCost(it);
 if(s.gold<c.gold||s.mats<c.mats)return false;s.gold-=c.gold;s.mats-=c.mats;it.lvl++;return true;}
// --- expedition: timed stages
function startRun(s,now=Date.now()){if(s.run)return'run';const f=runCost(s,s.loc);if(s.energy<f)return'energy';
 const a=s.unl.chips?s.alloc.slice():[0,0,0];if(a.reduce((x,y)=>x+y,0)>s.chips)return'chips';
 s.energy-=f;s.run={loc:s.loc,alloc:a,stage:0,loot:[],endAt:now+stageMs(s,s.loc),waiting:false};return null;}
function continueRun(s,now=Date.now()){const r=s.run;if(!r||!r.waiting)return false;r.waiting=false;r.endAt=now+stageMs(s,r.loc);return true;}
function rollStage(s,rng=Math.random){const r=s.run;if(!r||r.waiting)return null;const L=LOCS[r.loc];
 const dc=deathChance(s,r.loc,r.alloc,r.stage);const res={stage:r.stage+1,drops:[],shards:0,died:false,dc,chips:[]};
 const c=rarChances(s,r.loc,r.stage);let gotLeg=false;
 for(let i=0;i<rolls(s);i++){const rr=pickRar(c,rng);res.drops.push(makeItem(s,r.loc,rr,rng,r.stage));if(rr===4)gotLeg=true;}
 r.alloc.forEach((n,t)=>{if(!n)return;const p=chipChance(s,r.loc,t,r.stage);let k=0;for(let i=0;i<n;i++){if(rng()<p)k++;else if(t===2)res.shards++;}
  const paid=k>=thr(s,t);res.chips.push({t,k,n,paid});if(paid)for(let i=0;i<k;i++){res.drops.push(makeItem(s,r.loc,CHIP_T[t].r,rng,r.stage));if(t===2)gotLeg=true;}});
 if(!gotLeg)res.shards++;
 if(s.unl.pity)s.shards+=res.shards;else res.shards=0;
 if(rng()<dc){res.died=true;res.lost=r.loot.length+res.drops.length;s.deaths++;s.runs++;s.run=null;return res;}
 r.loot.push(...res.drops);r.stage++;addXp(s,Math.round((4+res.drops.reduce((a,b)=>a+b.r*2,0))*L.lvl));
 if(!s.unl.stages||r.stage>=L.stages){if(r.stage>=L.stages){res.finished=true;if(!s.cleared.includes(r.loc))s.cleared.push(r.loc);if(r.loc===LOCS.length-1)s.won=true;}
  res.bank=bank(s);return res;}
 r.waiting=true;return res;}
function bank(s){const r=s.run;if(!r)return null;s.inv.push(...r.loot);const g=r.loot.reduce((a,b)=>a+b.value,0);s.runs++;s.run=null;return{items:r.loot,gold:g};}
function craftPity(s,rng=Math.random){if(s.shards<SHARDS_FOR_PITY)return null;s.shards-=SHARDS_FOR_PITY;const it=makeItem(s,Math.max(0,...s.cleared),4,rng);s.inv.push(it);return it;}
// --- Monty Hall chests
const GUIDE_NAMES=['Аркадий','Борис','Вера'];
function initGuides(s){if(s.monty.guides)return;const t=['honest','unreliable','random'];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]];}
 s.monty.guides=t.map((type,i)=>({name:GUIDE_NAMES[i],type,stats:{stay:[0,0],switch:[0,0]}}));}
function doors(s){return 3+s.doorsUp;}
function maybeMonty(s,rng=Math.random,force=false){if(!s.unl.monty||s.monty.pending)return false;s.monty.since++;
 if(!force){if(s.monty.since<2&&s.monty.plays>0)return false;if(rng()>0.5&&s.monty.plays>0)return false;}s.monty.since=0;
 const n=doors(s);const g=s.monty.guides?Math.floor(rng()*3):-1;
 s.monty.pending={n,prize:Math.floor(rng()*n),pick:null,opened:[],guide:g,done:false,loc:Math.max(0,...s.cleared)};return true;}
function guideType(s,p){return p.guide<0?'honest':s.monty.guides[p.guide].type;}
function montyPick(s,i,rng=Math.random){const p=s.monty.pending;if(!p||p.pick!==null)return;p.pick=i;const n=p.n;
 const others=[...Array(n).keys()].filter(x=>x!==i);const type=guideType(s,p);
 const shuffle=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(rng()*(k+1));[a[k],a[j]]=[a[j],a[k]];}return a;};
 let open;if(type==='honest'||(type==='unreliable'&&rng()<0.6))open=shuffle(others.filter(x=>x!==p.prize)).slice(0,n-2);
 else open=shuffle(others.slice()).slice(0,n-2);
 p.opened=open;p.revealed=open.includes(p.prize);}
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
 doors:s=>s.doorsUp>=4?Infinity:Math.round(300*Math.pow(3,s.doorsUp))};
const SHOP_FIELD={hp:'hpUp',dmg:'dmgUp',maxE:'maxEUp',regen:'regenUp',bag:'bagUp',boots:'bootsUp',chips:'chips',guide:'guideUp',lens:'lensUp',doors:'doorsUp'};
const SHOP_NEED={chips:'chips',guide:'stages',lens:'locs',doors:'variants'};
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
const api={SAVE_VER,RARS,RAR_RU,RAR_W,RAR_VAL,CHIP_T,CHIP_TH,AFFIXES,LOCS,SHARDS_FOR_PITY,MAX_LVL,pmf,pAtLeast,expPaid,UNLOCKS,checkUnlocks,thr,
 newState,load,aff,itemPower,heroDmg,heroHp,heroPower,xpNeed,addXp,unlocked,maxEnergy,regenSec,tickEnergy,runCost,stageMs,rolls,luckMul,rarChances,itemValue,
 chipChance,riskWeight,deathChance,stageEV,makeItem,score,equip,equipBest,dismantle,upgradeCost,upgradeItem,startRun,continueRun,rollStage,bank,craftPity,
 initGuides,doors,maybeMonty,guideType,montyPick,montyClosed,montyFinal,montyClear,guessGuide,SHOP,SHOP_FIELD,shopAvail,buy,monteCarlo,strategies};
if(typeof module!=='undefined')module.exports=api;else root.G=api;
})(this);
