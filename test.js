const G=require('./logic.js');const assert=(c,m)=>{if(!c)throw new Error(m);};
let sum=0;for(let k=0;k<=10;k++)sum+=G.pmf(10,k,0.3);assert(Math.abs(sum-1)<1e-9,'pmf');
assert(Math.abs(G.expPaid(10,0.3,1)-3)<1e-9,'exp');assert(Math.abs(G.pAtLeast(10,1,0.3)-G.pAtLeastOne(10,0.3))<1e-9,'pal');
assert(G.load('{"ver":1}')===null,'migrate');
// bot playthrough: measure expeditions to win
function bot(seed){let a=seed;const rng=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};let now=1;
 const s=G.newState();let actions=0;
 while(!s.won&&actions<5000){actions++;
  if(!s.unl.locs)s.loc=0;else for(let l=G.LOCS.length-1;l>=0;l--)if(G.unlocked(s,l)){s.loc=l;break;}
  const n=G.totalChips(s);const strat=G.strategies(n,G.maxTier(s));s.alloc=(strat[1]||strat[0]).a;
  now+=20000;G.tickEnergy(s,now);while(s.energy<G.foodCost(s.loc,s.alloc)){now+=G.regenSec(s)*1000;G.tickEnergy(s,now);}
  if(G.startRun(s)){s.alloc=s.alloc.map(v=>Math.floor(v/2));if(G.startRun(s))continue;}
  while(s.run){const r=G.rollStage(s,rng);if(!r||r.died||r.finished||!s.run)break;
   if(G.deathChance(s,s.run.loc,s.run.alloc,s.run.stage)>0.12){G.bank(s);break;}}
  if(process.env.TR)console.log(actions,s.loc,G.heroPower(s),s.gold,s.lvl,s.inv.length,s.energy);G.checkUnlocks(s);if(G.maybeMonty(s,rng)){G.montyPick(s,0,rng);const c=G.montyClosed(s.monty.pending);G.montyFinal(s,c.length?c[0]:0,rng);G.montyClear(s);}G.equipBest(s);s.inv.slice().forEach(i=>G.dismantle(s,i.id));G.craftPity(s,rng);
  for(const sl of['weapon','armor'])while(G.upgradeItem(s,sl));
  let b=true;while(b){b=false;const opts=(s.unl.shop?['dmg','hp','chips','maxE','regen','guide','lens','chest']:[]).sort((a,c)=>G.SHOP[a](s)-G.SHOP[c](s));
   if(opts.length&&s.gold>G.SHOP[opts[0]](s))b=G.buy(s,opts[0]);}}
 return{unl:Object.keys(s.unl).join(),min:Math.round(now/60000),actions,won:s.won,lvl:s.lvl,chips:s.chips,pow:G.heroPower(s),deaths:s.deaths,cleared:s.cleared.join('')};}
for(const sd of[1,2,3])console.log(JSON.stringify(bot(sd)));
const s=G.newState();const mc=G.monteCarlo(s,0,s.alloc,1,2000);assert(mc.mean>0&&mc.bins.length===12,'mc');console.log('MC',mc.mean.toFixed(1),mc.death);
// monty: honest guide, switch should win ~2/3
{const m=G.newState();m.unl.monty=1;let w=0;for(let i=0;i<3000;i++){m.monty.pending=null;m.monty.since=9;G.maybeMonty(m,Math.random,true);G.montyPick(m,0);G.montyFinal(m,G.montyClosed(m.monty.pending)[0]);}
 const st=m.monty.stats.switch;console.log('switch win',(st[0]/st[1]).toFixed(3));assert(Math.abs(st[0]/st[1]-2/3)<0.04,'monty');
 m.unl.variants=1;G.initGuides(m);const gi=m.monty.guides.findIndex(g=>g.type==='random');for(let i=0;i<3000;i++){m.monty.pending=null;m.monty.since=9;G.maybeMonty(m,Math.random,true);m.monty.pending.guide=gi;G.montyPick(m,0);const c=G.montyClosed(m.monty.pending);G.montyFinal(m,c[0]);}
 const rs=m.monty.guides[gi].stats.switch;console.log('random guide switch win',(rs[0]/rs[1]).toFixed(3));assert(Math.abs(rs[0]/rs[1]-0.5)<0.05,'random');
 const v2=G.load(JSON.stringify(Object.assign(G.newState(),{ver:2})));assert(v2&&v2.unl.alloc&&v2.ver===3,'mig2');}
console.log('TESTS OK');
