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
  G.equipBest(s);s.inv.slice().forEach(i=>G.dismantle(s,i.id));G.craftPity(s,rng);for(const sl of['weapon','armor']){let k=0;while(k++<3&&G.upgradeItem(s,sl,true,rng));}if(G.maybeMimic(s,rng)){G.knock(s,rng);G.knock(s,rng);G.resolveMimic(s,G.posterior(s.mimic.knocks)<0.4,rng);}
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
console.log('TESTS OK');
