// Pure game logic v2 (browser + node). No DOM here.
(function(root){
const SAVE_VER=3;
const BASE_P=[0.55,0.38,0.25,0.16,0.10,0.065,0.04,0.022,0.011,0.004];
const VALUE=[2,4,7,12,20,34,58,100,180,600];
const THRESH=[1,1,1,1,1,2,2,2,2,1]; // tier pays only if successes >= threshold
const RAR=['common','common','common','uncommon','uncommon','rare','rare','epic','epic','legendary'];
const RAR_RU={common:'Обычный',uncommon:'Необычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};
const AFFIX_N={common:0,uncommon:1,rare:1,epic:2,legendary:3};
const LOCS=[
 {name:'Тихий лес',mult:1,lvl:1,threat:12,req:0,stages:3,food:0.5},
 {name:'Туманные пещеры',mult:1.5,lvl:2,threat:40,req:40,stages:3,food:0.6},
 {name:'Гиблые топи',mult:2,lvl:3.5,threat:85,req:80,stages:4,food:0.7},
 {name:'Пепельная крепость',mult:2.6,lvl:6,threat:170,req:150,stages:4,food:0.8},
 {name:'Хрустальный шпиль',mult:3.3,lvl:10,threat:260,req:250,stages:5,food:0.9},
 {name:'Бездна Удачи',mult:4.2,lvl:16,threat:400,req:400,stages:5,food:1},
];
const GEARL=[1,1.6,2.5,3.8,5.5,8];
const SHARDS_FOR_PITY=40, MAX_LVL=30, MAX_CHIPS=60;
const AFFIXES=[
 {k:'dmgPct',ru:'урон',min:4,max:12,unit:'%'},{k:'hpPct',ru:'здоровье',min:4,max:12,unit:'%'},
 {k:'goldPct',ru:'золото',min:3,max:10,unit:'%'},{k:'riskRed',ru:'снижение риска',min:2,max:7,unit:'%'},
 {k:'luck',ru:'удача высоких ярусов',min:2,max:8,unit:'%'},{k:'chips',ru:'фишки',min:1,max:2,unit:''}];
// --- math
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
function pmf(n,k,p){return binom(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);}
function pAtLeast(n,k,p){let s=0;for(let i=0;i<k;i++)s+=pmf(n,i,p);return Math.max(0,1-s);}
function pAtLeastOne(n,p){return 1-Math.pow(1-p,n);}
// expected paid successes with threshold: sum_{k>=th} k*pmf
function expPaid(n,p,th){if(th<=1)return n*p;let s=0;for(let k=th;k<=n;k++)s+=k*pmf(n,k,p);return s;}
// --- state
function newState(){return{ver:SAVE_VER,gold:30,mats:0,energy:50,energyT:0,maxEUp:0,regenUp:0,guideUp:0,lensUp:0,chestUp:0,shards:0,chips:12,hpUp:0,dmgUp:0,lvl:1,xp:0,loc:0,
 alloc:[5,4,3,0,0,0,0,0,0,0],inv:[],weapon:null,armor:null,charm:null,nextId:1,runs:0,deaths:0,best:0,cleared:[],won:false,run:null,unl:{},doorsUp:0,
 monty:{pending:null,since:0,plays:0,stats:{stay:[0,0],switch:[0,0]},guides:null,guess:{}}};}
function load(raw){try{const s=JSON.parse(raw);if(!s)return null;
 if(s.ver===SAVE_VER)return Object.assign(newState(),s);
 if(s.ver===2){const n=Object.assign(newState(),s,{ver:SAVE_VER});UNLOCKS.forEach(u=>{if(u.k!=='variants')n.unl[u.k]=1;});return n;}}catch(e){}return null;}
// progressive unlocks, in order
const UNLOCKS=[
 {k:'shop',need:s=>s.runs>=1},{k:'stages',need:s=>s.runs>=3},{k:'alloc',need:s=>s.runs>=6},{k:'thresh',need:s=>s.runs>=10},
 {k:'locs',need:s=>s.runs>=13&&s.cleared.includes(0)},{k:'eval',need:s=>s.runs>=17},{k:'pity',need:s=>s.runs>=20||s.shards>=10},
 {k:'monty',need:s=>s.runs>=24},{k:'variants',need:s=>s.monty.plays>=8}];
function checkUnlocks(s){const out=[];for(const u of UNLOCKS){if(s.unl[u.k])continue;if(!u.need(s))break;s.unl[u.k]=1;out.push(u.k);
 if(u.k==='variants')initGuides(s);}return out;}
function maxTier(s){return s.unl.thresh?10:5;}
function thr(s,t){return s.unl.thresh?THRESH[t]:1;}
function aff(s,k){let v=0;for(const sl of ['weapon','armor','charm']){const it=s[sl];if(it)for(const a of it.affixes)if(a.k===k)v+=a.v;}return v;}
function itemPower(it){return Math.round(it.power*Math.pow(1.12,it.lvl||0));}
function heroDmg(s){const w=s.weapon?itemPower(s.weapon):0;return Math.round((10+(s.lvl-1)*2+s.dmgUp*3+w)*(1+aff(s,'dmgPct')/100));}
function heroHp(s){const a=s.armor?itemPower(s.armor)*3:0;return Math.round((50+(s.lvl-1)*8+s.hpUp*12+a)*(1+aff(s,'hpPct')/100));}
function heroPower(s){return Math.round(heroDmg(s)+heroHp(s)/4);}
function totalChips(s){return Math.min(MAX_CHIPS+6,s.chips+aff(s,'chips'));}
function xpNeed(l){return Math.round(40*Math.pow(1.28,l-1));}
function unlocked(s,l){return l===0||s.cleared.includes(l-1)&&heroPower(s)>=LOCS[l].req;}
function luck(s){return 1+(aff(s,'luck')+s.lensUp*4)/100;}
function chance(s,loc,t,stage=0){let p=BASE_P[t]*Math.pow(LOCS[loc].mult,t/9)*(1+0.12*stage);if(t>=5)p*=luck(s);return Math.min(0.95,p);}
function value(s,loc,t,stage=0){return Math.round(VALUE[t]*LOCS[loc].lvl*(1+0.15*stage)*(1+aff(s,'goldPct')/100));}
function riskWeight(alloc){let w=0;alloc.forEach((n,t)=>w+=n*Math.pow((t+1)/10,2));return w/10;}
function deathChance(s,loc,alloc,stage){const L=LOCS[loc];const def=heroHp(s)+3*heroDmg(s);
 const d=0.22*L.threat*(1+0.2*stage)*(0.6+riskWeight(alloc))/def;return Math.max(0.005,Math.min(0.9,d*(1-Math.min(60,aff(s,'riskRed')+s.guideUp*3)/100)));}
function maxEnergy(s){return 50+s.maxEUp*10;}
function regenSec(s){return 10*Math.pow(0.9,s.regenUp);} // seconds per 1 energy
function tickEnergy(s,now=Date.now()){if(!s.energyT){s.energyT=now;return;}const per=regenSec(s)*1000;const n=Math.floor((now-s.energyT)/per);
 if(s.energy>=maxEnergy(s)){s.energyT=now;return;}if(n>0){s.energy=Math.min(maxEnergy(s),s.energy+n);s.energyT+=n*per;}}
function foodCost(loc,alloc){return Math.ceil(alloc.reduce((a,b)=>a+b,0)*LOCS[loc].food);}
// expected gold for one stage (exact binomial with thresholds)
function stageEV(s,loc,alloc,stage){let v=0;alloc.forEach((n,t)=>{if(n)v+=expPaid(n,chance(s,loc,t,stage),thr(s,t))*value(s,loc,t,stage);});return v;}
// --- items
function rint(rng,a,b){return a+Math.floor(rng()*(b-a+1));}
function makeItem(s,loc,t,rng){const r=rng();const slot=r<0.42?'weapon':r<0.84?'armor':'charm';
 const rar=RAR[t];const power=slot==='charm'?0:Math.max(1,Math.round((1+(t+1)*0.5)*GEARL[loc]*(0.8+rng()*0.4)));
 const names={weapon:['Кинжал','Меч','Топор','Копьё','Посох'],armor:['Куртка','Кольчуга','Панцирь','Мантия','Щит'],charm:['Амулет','Кольцо','Талисман','Брошь','Оберег']};
 let n=AFFIX_N[rar]+(slot==='charm'?1:0);const pool=AFFIXES.slice();const affixes=[];
 while(n-->0&&pool.length){const a=pool.splice(Math.floor(rng()*pool.length),1)[0];
  let v=rint(rng,a.min,a.max);if(a.k!=='chips')v=Math.round(v*(1+loc*0.25)*(rar==='legendary'?1.5:1));affixes.push({k:a.k,v});}
 return{id:s.nextId++,slot,tier:t+1,rarity:rar,loc,power,lvl:0,affixes,value:value(s,loc,t),name:names[slot][Math.floor(rng()*5)]};}
function score(it){return itemPower(it)+it.affixes.reduce((a,x)=>a+(x.k==='chips'?8:x.v*0.6),0)+(it.slot==='charm'?it.tier*2:0);}
function equip(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0)return;const it=s.inv.splice(i,1)[0];if(s[it.slot])s.inv.push(s[it.slot]);s[it.slot]=it;}
function equipBest(s){let ch=true;while(ch){ch=false;for(const it of s.inv.slice()){const c=s[it.slot];if(!c||score(it)>score(c)){equip(s,it.id);ch=true;}}}}
function dismantle(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0)return 0;const it=s.inv.splice(i,1)[0];s.gold+=it.value;s.mats+=it.tier*(1+it.loc);return it.value;}
function upgradeCost(it){return{gold:Math.round(it.value*0.6*Math.pow(1.5,it.lvl)),mats:Math.round(it.tier*(1+it.loc)*2*Math.pow(1.4,it.lvl))};}
function upgradeItem(s,slot){const it=s[slot];if(!it||it.slot==='charm'||it.lvl>=10)return false;const c=upgradeCost(it);
 if(s.gold<c.gold||s.mats<c.mats)return false;s.gold-=c.gold;s.mats-=c.mats;it.lvl++;return true;}
// --- expedition (multi-stage, banking)
function addXp(s,x){if(s.lvl>=MAX_LVL)return 0;s.xp+=x;let up=0;while(s.lvl<MAX_LVL&&s.xp>=xpNeed(s.lvl)){s.xp-=xpNeed(s.lvl);s.lvl++;up++;}return up;}
function startRun(s){if(s.run)return'run';const a=s.alloc;const used=a.reduce((x,y)=>x+y,0);if(!used)return'empty';
 if(used>totalChips(s))return'chips';const f=foodCost(s.loc,a);if(s.energy<f)return'energy';
 s.energy-=f;s.run={loc:s.loc,alloc:a.slice(),stage:0,loot:[],shards:0,log:[]};return null;}
function rollStage(s,rng=Math.random){const r=s.run;if(!r)return null;const L=LOCS[r.loc];
 const dc=deathChance(s,r.loc,r.alloc,r.stage);const res={stage:r.stage+1,drops:[],shards:0,died:false,dc,tiers:[]};
 r.alloc.forEach((n,t)=>{if(!n)return;const p=chance(s,r.loc,t,r.stage);let k=0;
  for(let i=0;i<n;i++){if(rng()<p)k++;else if(t===9)res.shards++;}
  const paid=k>=thr(s,t);res.tiers.push({t,k,n,paid});
  if(paid)for(let i=0;i<k;i++)res.drops.push(makeItem(s,r.loc,t,rng));});
 r.shards+=res.shards;s.shards+=res.shards; // shards are safe (knowledge)
 if(rng()<dc){res.died=true;res.lost=r.loot.length+res.drops.length;s.deaths++;s.runs++;s.run=null;return res;}
 r.loot.push(...res.drops);r.stage++;addXp(s,Math.round((5+res.drops.reduce((a,b)=>a+b.tier,0))*L.lvl));
 if(!s.unl.stages&&r.stage<L.stages){res.finished=false;res.autoBank=bank(s);return res;}
 if(r.stage>=L.stages){res.finished=true;if(!s.cleared.includes(r.loc))s.cleared.push(r.loc);if(r.loc===LOCS.length-1)s.won=true;
  for(let i=0;i<s.chestUp;i++){const t=Math.min(9,Math.floor(rng()*rng()*10));const it=makeItem(s,r.loc,t,rng);r.loot.push(it);res.drops.push(it);}
  res.bank=bank(s);}
 return res;}
function bank(s){const r=s.run;if(!r)return null;s.inv.push(...r.loot);const g=r.loot.reduce((a,b)=>a+b.value,0);s.best=Math.max(s.best,g);s.runs++;s.run=null;return{items:r.loot,gold:g};}
function craftPity(s,rng=Math.random){if(s.shards<SHARDS_FOR_PITY)return null;s.shards-=SHARDS_FOR_PITY;
 const loc=Math.max(...[0,...s.cleared]);const it=makeItem(s,loc,9,rng);s.inv.push(it);return it;}
// --- Monty Hall chests
const GUIDE_NAMES=['Аркадий','Борис','Вера'];
function initGuides(s){if(s.monty.guides)return;const t=['honest','unreliable','random'];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]];}
 s.monty.guides=t.map((type,i)=>({name:GUIDE_NAMES[i],type,stats:{stay:[0,0],switch:[0,0]}}));}
function doors(s){return 3+s.doorsUp;}
function maybeMonty(s,rng=Math.random,force=false){if(!s.unl.monty||s.monty.pending)return false;s.monty.since++;
 if(s.monty.since<2&&s.monty.plays>0)return false;if(!force&&rng()>0.5&&s.monty.plays>0)return false;s.monty.since=0;
 const n=doors(s);const g=s.monty.guides?Math.floor(rng()*3):-1;
 s.monty.pending={n,prize:Math.floor(rng()*n),pick:null,opened:[],guide:g,done:false,loc:Math.max(0,...s.cleared,0)};return true;}
function guideType(s,p){return p.guide<0?'honest':s.monty.guides[p.guide].type;}
function montyPick(s,i,rng=Math.random){const p=s.monty.pending;if(!p||p.pick!==null)return;p.pick=i;const n=p.n;
 const others=[...Array(n).keys()].filter(x=>x!==i);const type=guideType(s,p);const shuffle=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(rng()*(k+1));[a[k],a[j]]=[a[j],a[k]];}return a;};
 let open;
 if(type==='honest'||(type==='unreliable'&&rng()<0.6)){ // knows where prize is, avoids it
  const empt=shuffle(others.filter(x=>x!==p.prize));open=empt.slice(0,n-2);}
 else open=shuffle(others.slice()).slice(0,n-2); // random (may reveal the prize)
 p.opened=open;p.revealed=open.includes(p.prize);}
function montyClosed(p){return [...Array(p.n).keys()].filter(x=>x!==p.pick&&!p.opened.includes(x));}
function montyFinal(s,choice,rng=Math.random){const p=s.monty.pending;if(!p||p.pick===null||p.done)return null;
 const sw=choice!==p.pick;const win=choice===p.prize;p.done=true;p.final=choice;p.win=win;
 if(!p.revealed){const k=sw?'switch':'stay';s.monty.stats[k][1]++;if(win)s.monty.stats[k][0]++;
  if(p.guide>=0){const gs=s.monty.guides[p.guide].stats[k];gs[1]++;if(win)gs[0]++;}}
 s.monty.plays++;let reward;
 if(win){const t=Math.min(9,4+p.n-3+Math.floor(rng()*3));reward=makeItem(s,p.loc,t,rng);s.inv.push(reward);}
 else{reward=Math.round(15*LOCS[p.loc].lvl);s.gold+=reward;}
 p.reward=reward;return p;}
function montyClear(s){s.monty.pending=null;}
function guessGuide(s,gi,type){const g=s.monty.guides&&s.monty.guides[gi];if(!g||s.monty.guess[gi]==='ok')return null;
 const tot=g.stats.stay[1]+g.stats.switch[1];if(tot<5)return 'few';
 if(g.type===type){s.monty.guess[gi]='ok';s.shards+=15;return 'ok';}g.stats={stay:[0,0],switch:[0,0]};return 'no';}
// --- shop
const SHOP={chips:s=>s.chips>=MAX_CHIPS?Infinity:Math.round(40*Math.pow(1.22,s.chips-12)),
 hp:s=>Math.round(30*Math.pow(1.3,s.hpUp)),dmg:s=>Math.round(40*Math.pow(1.3,s.dmgUp)),
 maxE:s=>Math.round(60*Math.pow(1.6,s.maxEUp)),regen:s=>s.regenUp>=15?Infinity:Math.round(80*Math.pow(1.7,s.regenUp)),
 guide:s=>s.guideUp>=12?Infinity:Math.round(120*Math.pow(1.75,s.guideUp)),lens:s=>s.lensUp>=15?Infinity:Math.round(150*Math.pow(1.7,s.lensUp)),
 chest:s=>s.chestUp>=5?Infinity:Math.round(400*Math.pow(3,s.chestUp)),doors:s=>s.doorsUp>=4?Infinity:Math.round(300*Math.pow(3,s.doorsUp))};
const SHOP_FIELD={chips:'chips',hp:'hpUp',dmg:'dmgUp',maxE:'maxEUp',regen:'regenUp',guide:'guideUp',lens:'lensUp',chest:'chestUp',doors:'doorsUp'};
function buy(s,k){const c=SHOP[k](s);if(s.gold<c)return false;s.gold-=c;s[SHOP_FIELD[k]]++;return true;}
// --- Monte Carlo evaluator. policy: return when next-stage death chance > stopAt
function simRun(s,loc,alloc,stopAt,rng){let bankd=0,st=0;const L=LOCS[loc];
 for(st=0;st<L.stages;st++){const dc=deathChance(s,loc,alloc,st);if(st>0&&dc>stopAt)break;
  let g=0;alloc.forEach((n,t)=>{if(!n)return;const p=chance(s,loc,t,st);let k=0;for(let i=0;i<n;i++)if(rng()<p)k++;if(k>=thr(s,t))g+=k*value(s,loc,t,st);});
  if(rng()<dc)return{g:0,died:true};bankd+=g;}
 return{g:bankd,died:false};}
function monteCarlo(s,loc,alloc,stopAt=1,N=2000,rng=Math.random){const arr=new Float64Array(N);let d=0,sum=0;
 for(let i=0;i<N;i++){const r=simRun(s,loc,alloc,stopAt,rng);arr[i]=r.g;sum+=r.g;if(r.died)d++;}
 arr.sort();const q=x=>arr[Math.min(N-1,Math.floor(x*N))];
 const max=arr[N-1]||1,bins=new Array(12).fill(0);for(const v of arr)bins[Math.min(11,Math.floor(v/max*12))]++;
 return{mean:sum/N,p10:q(0.1),p50:q(0.5),p90:q(0.9),death:d/N,bins,max};}
function strategies(n,mt=10){const r=strategies0(n);if(mt>=10)return r;return[r[0],{name:'Ровная',a:(()=>{const a=new Array(10).fill(0);for(let i=0;i<n;i++)a[i%mt]++;return a;})()}];}
function strategies0(n){const mk=f=>{const a=new Array(10).fill(0);f(a);return a;};
 const spread=(a,ts)=>{for(let i=0;i<n;i++)a[ts[i%ts.length]]++;};
 return[{name:'Осторожная',a:mk(a=>spread(a,[0,1,2,3]))},{name:'Сбалансированная',a:mk(a=>spread(a,[0,1,2,3,4,5,5,6,6]))},
  {name:'Пары эпиков',a:mk(a=>{const h=Math.floor(n/2);spread(a,[1,2,3]);a.fill(0);for(let i=0;i<h;i++)a[i%2?7:6]++;for(let i=h;i<n;i++)a[i%3]++;})},
  {name:'Охота на легендарку',a:mk(a=>{for(let i=0;i<n;i++)a[i%2?9:0]++;})}];}
const api={SAVE_VER,BASE_P,VALUE,THRESH,RAR,RAR_RU,AFFIXES,LOCS,SHARDS_FOR_PITY,MAX_LVL,MAX_CHIPS,pmf,pAtLeast,pAtLeastOne,expPaid,
 newState,load,aff,itemPower,heroDmg,heroHp,heroPower,totalChips,xpNeed,unlocked,chance,value,riskWeight,deathChance,foodCost,stageEV,
 makeItem,score,equip,equipBest,dismantle,upgradeCost,upgradeItem,addXp,startRun,rollStage,bank,craftPity,SHOP,SHOP_FIELD,buy,maxEnergy,regenSec,tickEnergy,monteCarlo,strategies,UNLOCKS,checkUnlocks,maxTier,thr,doors,maybeMonty,montyPick,montyClosed,montyFinal,montyClear,guessGuide,guideType,initGuides};
if(typeof module!=='undefined')module.exports=api;else root.G=api;
})(this);
