const G=require('./logic.js');const assert=(c,m)=>{if(!c)throw new Error(m);};
let sum=0;for(let k=0;k<=10;k++)sum+=G.pmf(10,k,0.3);assert(Math.abs(sum-1)<1e-9,'pmf');
assert(Math.abs(G.expPaid(10,0.3,1)-3)<1e-9,'exp');assert(G.load('{"ver":3}')===null,'old save reset');
{const c=G.rarChances(G.newState(),0);assert(Math.abs(c.reduce((a,b)=>a+b,0)-1)<1e-9,'chances');}
// bot: time-based playthrough. Human-ish: ~3s think per action on top of run timers/energy waits.
function bot(seed,pre){let a=seed;const rng=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 let now=1;const s=pre||G.newState();G.tickEnergy(s,now);let n=0,t5=null;
 const adv=ms=>{now+=ms;G.tickEnergy(s,now);};
 while(!s.won&&n<3000){n++;
  if(s.unl.locs)for(let l=G.LOCS.length-1;l>=0;l--)if(G.unlocked(s,l)){s.loc=l;break;}
  if(s.unl.chips)s.alloc=G.strategies(s.chips)[2].a;
  while(s.energy<G.runCost(s,s.loc))adv(G.regenSec(s)*1000);
  G.startRun(s,now);adv(3000);
  while(s.run){adv(G.stageMs(s,s.run.loc));const r=G.rollStage(s,rng);if(!s.run)break;
   if(G.deathChance(s,s.run.loc,s.run.alloc,s.run.stage)>0.12){G.bank(s);break;}adv(1000);G.continueRun(s,now);}
  const nu=G.checkUnlocks(s);if(process.env.TR&&nu.length)console.log('  unlock',nu.join(),'at',(now/60000).toFixed(1)+'m','run',s.runs);if(nu.length&&now>300000&&!t5)t5=s.runs;
  if(G.maybeMonty(s,rng)){G.montyPick(s,0,rng);const c=G.montyClosed(s.monty.pending);G.montyFinal(s,c.length?c[0]:0,rng);G.montyClear(s);adv(5000);}
  G.equipBest(s);s.inv.slice().forEach(i=>G.dismantle(s,i.id));G.craftPity(s,rng);for(const sl of['weapon','armor']){let k=0;while(k++<3&&G.upgradeItem(s,sl,true,rng));}G.drawCard(s,s.loc,rng);if(G.maybeSecretary(s,rng)){while(s.sec)G.secPass(s);}if(G.maybeMimic(s,rng)){G.knock(s,rng);G.knock(s,rng);G.resolveMimic(s,G.posterior(s.mimic.knocks)<0.4,rng);}
  let b=true;while(b){b=false;const o=Object.keys(G.SHOP).filter(k=>(k!=='scroll'||s.scrolls<2)&&G.shopAvail(s,k)&&G.SHOP[k](s)<Infinity).sort((x,y)=>G.SHOP[x](s)-G.SHOP[y](s));if(o.length&&s.gold>=G.SHOP[o[0]](s))b=G.buy(s,o[0]);}
  if(process.env.TR&&n%20==0)console.log(Math.round(now/60000)+'m',s.runs,s.loc,G.heroPower(s),s.lvl,Object.keys(s.unl).join());}
 return{s,min:Math.round(now/60000),runs:s.runs,won:s.won,lvl:s.lvl,pow:G.heroPower(s),deaths:s.deaths,unl:Object.keys(s.unl).length,cleared:s.cleared.join('')};}
for(const sd of[1,2,3]){const r=bot(sd);const {s,...o}=r;console.log(JSON.stringify(o));
 G.rebirth(s,'luck');s.energyT=0;const r2=bot(sd+10,s);const {s:s2,...o2}=r2;console.log('  after rebirth:',JSON.stringify(o2));}
{const s=G.newState();s.unl.stages=1;const mc=G.monteCarlo(s,0,[1,1,0],1,2000);assert(mc.mean>0&&mc.bins.length===12,'mc');}
{const m=G.newState();m.unl.monty=1;for(let i=0;i<3000;i++){m.monty.pending=null;G.maybeMonty(m,Math.random,true);G.montyPick(m,0);G.montyFinal(m,G.montyClosed(m.monty.pending)[0]);}
 const st=m.monty.stats.switch;console.log('honest switch win',(st[0]/st[1]).toFixed(3));assert(Math.abs(st[0]/st[1]-2/3)<0.04,'monty');
 G.initGuides(m);const gi=m.monty.guides.findIndex(g=>g.type==='random');for(let i=0;i<3000;i++){m.monty.pending=null;G.maybeMonty(m,Math.random,true);m.monty.pending.guide=gi;G.montyPick(m,0);G.montyFinal(m,G.montyClosed(m.monty.pending)[0]);}
 const rs=m.monty.guides[gi].stats.switch;console.log('random guide switch win',(rs[0]/rs[1]).toFixed(3));assert(Math.abs(rs[0]/rs[1]-0.5)<0.05,'random');}
assert(Math.abs(G.posterior([])-0.25)<1e-9&&Math.abs(G.posterior([true])-0.2/(0.2+0.225))<1e-9,'bayes');
assert(Math.abs(G.expRemaining(0)-11.4166667)<1e-6,'coupon');assert(G.expTries(3)===1&&G.expTries(6)>1/G.enhP(6),'markov');
{const v4=Object.assign(G.newState(),{ver:4,gold:77});delete v4.stats;const l=G.load(JSON.stringify(v4));assert(l&&l.gold===77&&l.stats.rolls.length===5,'mig4');}
{let sm=0;for(let k=0;k<30;k++)sm+=G.poissonP(k,2.5);assert(Math.abs(sm-1)<1e-9,'poisson');
 let m=0;for(let i=0;i<20000;i++)m+=G.poissonDraw(1.7,Math.random);assert(Math.abs(m/20000-1.7)<0.05,'pdraw');
 assert(G.kellyOpt(0.6)>0.199&&G.kellyGrowth(0.6,0.2)>G.kellyGrowth(0.6,0.5),'kelly');
 const o=G.newState();o.unl.offline=1;o.energy=30;o.lastSeen=1;const ev=G.offline(o,3*3600e3);assert(ev&&ev.runs>0&&ev.events.length===2,'offline');
 const w=G.newState();w.won=true;w.gold=999;w.unl.rebirth=1;assert(G.rebirth(w,'luck')&&w.gold===0&&w.rebirths===1&&w.perks.luck===1&&w.unl.rebirth,'rebirth');}
{const s=G.newState();s.unl.stats=1;const seen=new Set();for(let d=1;d<=60;d++)seen.add(G.daily(s,new Date(2026,9,d)).k);assert(seen.size>=5,'daily variety '+seen.size);
 assert(G.luckVerdict(30,20).v==='необычно везёт'&&G.luckVerdict(22,20).v==='в пределах случайности','ci');
 const a=G.newState();a.runs=1;assert(G.checkAch(a).length===1&&G.checkAch(a).length===0,'ach');
 const w=G.newState();w.won=true;w.rebirths=2;assert(G.perksAvail(w).length===8&&G.rebirth(w,'noThresh'),'t2');w.unl.thresh=1;assert(G.thr(w,1)===1,'nothresh');}
{const s=G.newState();s.unl.deck=1;const d=G.deckOf(s,0);assert(G.deckLeft(d)===G.DECK_N,'deck');
 assert(Math.abs(G.pWithin(d,'leg',1)-1/12)<1e-9&&Math.abs(G.pWithin(d,'leg',12)-1)<1e-9,'hyper');
 let legs=0;for(let i=0;i<12;i++){const c=G.drawCard(s,0);if(c.k==='leg')legs++;}assert(legs===1&&!s.decks[0],'deck cycle');
 // secretary: 1/e strategy should pick best ~37%+
 let best=0;for(let t=0;t<3000;t++){const q=G.newState();q.unl.secretary=1;G.maybeSecretary(q,Math.random,true);let r;
  while(q.sec){const cur=G.score(G.secCur(q));if(q.sec.i>=3&&cur>G.secSeenBest(q)){r=G.secTake(q);}else r=G.secPass(q);} if(r&&r.rank===1)best++;}
 console.log('secretary best rate',(best/3000).toFixed(3));assert(best/3000>0.3,'sec');}
{assert(Math.abs(G.ruinP(0.5,3,10)-0.7)<1e-9,'ruin fair');let ru=0;for(let i=0;i<20000;i++){let x=3;while(x>0&&x<10)x+=Math.random()<0.47?1:-1;if(x===0)ru++;}
 assert(Math.abs(ru/20000-G.ruinP(0.47,3,10))<0.015,'ruin mc');const d=G.newState();d.unl.dive=1;d.energy=20;assert(G.diveStart(d)&&d.energy===12,'dive');let r;while(d.dive)r=G.diveStep(d);assert(r.end,'dive end');}
{const s=G.newState();s.unl.synergy=1;const mk=(slot,tag,p)=>({id:s.nextId++,slot,r:2,rarity:'rare',loc:0,power:p,lvl:0,affixes:[],tag,value:1});
 s.inv.push(mk('weapon','fire',10),mk('armor','ice',10),mk('charm','luck',0),mk('weapon','fire',7),mk('armor','fire',6),mk('charm','fire',0));
 G.equipBest(s);assert(s.weapon.tag==='fire'&&s.armor.tag==='fire'&&s.charm.tag==='fire','synergy combo beats singles: '+[s.weapon.tag,s.armor.tag,s.charm.tag]);
 assert(G.pieceChance(s,0,'charm','fire',5)>0&&G.pieceChance(s,0,'charm','fire',5)<1,'piece');
 const it=s.inv[0];assert(G.toggleKeep(s,it.id)===true&&G.dismantle(s,it.id)===0,'stash');}
// anti-farm: each mini-game must not allow unbounded/exponential gold growth
{const base=()=>{const s=G.newState();G.UNLOCKS.forEach(u=>s.unl[u.k]=1);s.cleared=[0,1,2];s.gold=1e5;s.won=true;return s;};
 // Kelly: even with unlimited tokens and max fraction, growth per bet <= cap
 {const s=base();const cap=G.kellyCap(s);for(let i=0;i<2000;i++){s.kelly.tokens=1;G.kellyBet(s,0.9);}assert(s.gold<=1e5+2000*cap,'kelly bounded');
  const s2=base();for(let i=0;i<2000;i++){s2.kelly.tokens=1;G.kellyBet(s2,G.kellyOpt(s2.kelly.p));}assert(s2.gold<=1e5+2000*G.kellyCap(s2),'kelly opt bounded');console.log('kelly 2000 bets gain',Math.round(s2.gold-1e5),'cap/bet',G.kellyCap(s2));}
 // dive: exact optimal EV per energy (DP over cash-out) vs. normal runs' gold per energy
 {const s=base();const p=G.diveP(s),N=G.DIVE.N;let V=new Array(N+1).fill(0);for(let it=0;it<500;it++){const W=V.slice();for(let x=1;x<N;x++)W[x]=Math.max(x>G.DIVE.A?G.diveCash(s,x):0,p*(x+1===N?G.diveCash(s,N)+G.itemValue(s,2,4):V[x+1])+(1-p)*V[x-1]);V=W;}
  const dive=V[G.DIVE.A]/G.DIVE.cost;const run=G.stageEV(s,2,[0,0,0],0)*G.LOCS[2].stages/G.runCost(s,2);console.log('gold/energy dive',dive.toFixed(1),'runs',run.toFixed(1));assert(dive<run*2,'dive not a farm');}
 // event triggers (monty/mimic/merchant/deck) are tied to runs: rewards per run bounded
 {const s=base();let g0=s.gold,items=0;for(let i=0;i<500;i++){G.maybeMonty(s,Math.random,true);G.montyPick(s,0);G.montyFinal(s,G.montyClosed(s.monty.pending)[0]);G.montyClear(s);G.drawCard(s,2);}
  assert((s.gold-g0)/500<50*G.LOCS[2].lvl,'events bounded per run');}}
console.log('TESTS OK');
